/**
 * N.112 increment 2. THE SEATS FOLLOW THE DIFF.
 *
 * Finale's Lyrics window, which E.46 adopted as Ilya's model and which the desk
 * re-read in the current manual on 2026-09-04: *"Change a word in the Lyrics
 * window and it is also changed in the score; delete it, and all the syllables
 * in the score slide to the left to close up the gap."*
 *
 * WHAT THIS REPLACES. `reconcilePairings`' drift report. Before N.112 a changed
 * poem left every seat where it was and the drawer printed "Text changed 59",
 * because there was no way to tell a word that had MOVED from one that had been
 * REPLACED. `text-diff.ts` is that way, and once a seat can follow its word
 * there is nothing left for a drift count to describe.
 *
 * WHAT IT DOES NOT DO, and each of these is a ruled constraint rather than an
 * omission:
 *
 * - **It never writes `melisma` or `empty`** (E.46). An undecided note that
 *   this pass does not fill stays undecided, and a note it empties becomes
 *   undecided rather than decided-empty.
 * - **It moves seats among notes; it never decides what a note may hold.**
 *   Dann, 2026-09-04, on the Italian case: the composer's setting stays
 *   authoritative wherever the divergence is not a clitic fold.
 * - **It does not invent seats for a word that merely re-divided.** A word
 *   whose cleaned text is unchanged but whose syllable count grew is the case
 *   `SlotOrigin.word` was added to discriminate (Dann, 2026-08-13). Its extra
 *   slots are left for the singer's hand, exactly as before.
 * - **It does not touch `melisma` or `empty` pairings**, which are decisions
 *   about the music rather than about the text, and no text edit can speak to
 *   them.
 */
import {
	shiftToEndOfLyric,
	type PairingMap,
	type Slot,
	type SlotOrigin,
} from './pairings';
import { wordKey, type TextDiff } from '$lib/text-diff';

/** `"lineIndex-wordIndex-slotIndex"`, the queue's own identity for one slot. */
function slotKey(o: SlotOrigin): string {
	return `${o.lineIndex}-${o.wordIndex}-${o.slotIndex}`;
}

export interface ReseatResult {
	map: PairingMap;
	/** Seats whose word left the poem, so their note went back to undecided. */
	removed: number;
	/** Seats whose word survived and now carry the new transcription's text. */
	refreshed: number;
	/** Slots of a NEW word that this pass gave a note. */
	seated: number;
	/** Seats pushed off the end of the line by an insert, and so lost. */
	displaced: number;
}

/**
 * Where each slot of the queue currently sits, by event index.
 *
 * RECOMPUTED RATHER THAN MAINTAINED, and deliberately: every insert shifts a
 * run of seats by one, and a stale index here would seat the next added word
 * on top of a syllable instead of after it. `eventIds` is the notes of one
 * song, so this is cheap and the alternative is a bookkeeping bug waiting to
 * happen.
 */
function seatIndex(map: PairingMap, eventIds: readonly string[]): Map<string, number> {
	const at = new Map<string, number>();
	for (let i = 0; i < eventIds.length; i++) {
		const p = map[eventIds[i]];
		if (p?.kind === 'syllable') at.set(slotKey(p.origin), i);
	}
	return at;
}

/**
 * Close one hole by sliding the run above it down, stopping at the next
 * undecided note.
 *
 * THE SCOPE IS FINALE'S, not "everything to the end". A deliberate gap the
 * singer left further up is a decision, and a close-up that ran past it would
 * swallow it. `shiftToNextOpenNote`'s own scope is exactly this, and this uses
 * that function's machinery through the one call shape that produces it: the
 * range runs from the hole to the next undecided note ABOVE it, travelling
 * back.
 *
 * WHY NOT `shiftToNextOpenNote(map, ids, hole, 'back')` DIRECTLY. That call
 * searches DOWNWARD for the gap and slides the run into it from above, which
 * closes a hole that lies BELOW the anchor. Here the hole is the anchor, and
 * the run to move is the one above it, so the anchor this needs is the next
 * undecided note above the hole. Read once and measured against the function's
 * own doc comment rather than assumed from its name.
 */
function closeHole(
	map: PairingMap,
	eventIds: readonly string[],
	hole: number,
): PairingMap {
	let end = eventIds.length - 1;
	for (let i = hole + 1; i < eventIds.length; i++) {
		if (map[eventIds[i]] === undefined) {
			end = i;
			break;
		}
	}
	if (end <= hole) return { ...map };
	const next: PairingMap = { ...map };
	for (let i = hole; i < end; i++) {
		const v = next[eventIds[i + 1]];
		if (v === undefined) delete next[eventIds[i]];
		else next[eventIds[i]] = v;
	}
	delete next[eventIds[end]];
	return next;
}

/**
 * Re-seat a score's pairings against a poem that has changed.
 *
 * THE THREE RULES, in the order they run, because the order is the behaviour:
 *
 * 1. **A matched word keeps its notes.** Its seat is re-originated to the
 *    word's new `(line, word)` and its text refreshed from the new queue. This
 *    is what makes an edit in line 1 leave line 4 alone: line 4's words all
 *    matched, so every one of their seats is rewritten to the same note it was
 *    already on.
 * 2. **A removed word's seats go, and the tail closes up.** One hole per lost
 *    slot. Closing a hole stops at the next undecided
 *    note, so the holes are closed HIGHEST FIRST and every removal spends
 *    exactly one place. Two removals slide the tail back two.
 * 3. **A new word's slots take the notes after the word before them.** An
 *    undecided note there is filled; otherwise the run from that note to the
 *    end moves forward to open one, which is Finale's insert and can push the
 *    last seat off the end. That loss is reported in `displaced` rather than
 *    hidden, because it is a decision of the singer's that this pass spent.
 *
 * NOTHING IS MUTATED. A new map is returned, matching `reconcilePairings`'
 * habit and `clitic-seat.ts`'s.
 */
export function reseatByDiff(
	map: PairingMap,
	eventIds: readonly string[],
	queue: readonly Slot[],
	diff: TextDiff,
): ReseatResult {
	if (diff.unchanged) {
		return { map: { ...map }, removed: 0, refreshed: 0, seated: 0, displaced: 0 };
	}

	const bySlot = new Map<string, Slot>();
	for (const s of queue) bySlot.set(slotKey(s.origin), s);

	/* ── 1 and 2: every existing seat is kept-and-refreshed, or lost. ── */
	let next: PairingMap = {};
	const holes: number[] = [];
	let removed = 0;
	let refreshed = 0;
	for (let i = 0; i < eventIds.length; i++) {
		const id = eventIds[i];
		const p = map[id];
		if (p === undefined) continue;
		if (p.kind !== 'syllable') {
			next[id] = p;
			continue;
		}
		const from = wordKey(p.origin.lineIndex, p.origin.wordIndex);
		const to = diff.moved.get(from);
		const slot = to === undefined ? undefined : bySlot.get(`${to}-${p.origin.slotIndex}`);
		if (slot === undefined) {
			/* The word left the poem, or it survived with fewer slots than this
			   seat's ordinal. Either way the thing this note was carrying no
			   longer exists, and the note goes back to UNDECIDED rather than to
			   `empty`, which would be a decision nobody made. */
			holes.push(i);
			removed++;
			continue;
		}
		next[id] = {
			kind: 'syllable',
			cyrillic: slot.cyrillic,
			ipa: slot.ipa,
			vowel: slot.vowel,
			origin: slot.origin,
		};
		refreshed++;
	}

	/* Every event id the map held that is NOT on this line is carried across
	   untouched. A correction can delete a note, and a pairing keyed to it
	   outlives the line without being visible on it; dropping it here would
	   destroy a seat that a Restore is about to bring back. */
	for (const [id, p] of Object.entries(map)) {
		if (next[id] === undefined && !eventIds.includes(id)) next[id] = p;
	}

	/* HIGHEST HOLE FIRST, and this is a measured correction rather than a
	   preference. Closing ascending looks right and is wrong for ADJACENT
	   holes: the close stops at the next undecided note, an adjacent hole IS
	   that note, and the lower close then moves nothing at all. Deleting two
	   words side by side slid the tail back one instead of two, and three slid
	   it back one. Measured on `reseat.test.ts`'s two-word case, which failed
	   as `раз · _ · сто` where Finale gives `раз · сто · _`.

	   Descending, each close runs into decided notes or the end of the line,
	   never into another hole, so every removal spends exactly one place. */
	for (let i = holes.length - 1; i >= 0; i--) next = closeHole(next, eventIds, holes[i]);

	/* ── 3: the new words take their places. ────────────────────────── */
	let seated = 0;
	let displaced = 0;
	let at = seatIndex(next, eventIds);
	let anchor = -1;
	for (const slot of queue) {
		const here = at.get(slotKey(slot.origin));
		if (here !== undefined) {
			anchor = here;
			continue;
		}
		if (!diff.added.has(wordKey(slot.origin.lineIndex, slot.origin.wordIndex))) {
			/* An unseated slot of a word that was already in the poem. It was
			   never placed, or it is the second syllable of a word that
			   re-divided into more of them. Neither is this pass's business:
			   the queue and the hand are how a slot finds a note. */
			continue;
		}
		const target = anchor + 1;
		if (target >= eventIds.length) break;
		if (next[eventIds[target]] !== undefined) {
			const pushed = shiftToEndOfLyric(next, eventIds, target, 'forward');
			next = pushed.map;
			displaced += pushed.displaced.length;
		}
		next[eventIds[target]] = {
			kind: 'syllable',
			cyrillic: slot.cyrillic,
			ipa: slot.ipa,
			vowel: slot.vowel,
			origin: slot.origin,
		};
		seated++;
		anchor = target;
		at = seatIndex(next, eventIds);
	}

	return { map: next, removed, refreshed, seated, displaced };
}
