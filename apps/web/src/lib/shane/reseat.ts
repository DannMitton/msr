/**
 * N.112 increment 2, AMENDED BY N.113a. THE SEATS FOLLOW THE DIFF.
 *
 * **RULED BY DANN 2026-09-07, on his walk of `e1bcb67`, and it REVERSES the
 * desk default this file shipped with:** *"I expected the mnogo to disappear
 * without affecting the other text underlays."*
 *
 * - **Deleting a word vacates its notes and moves NOTHING else.**
 * - **An inserted word takes OPEN notes only, and never pushes the tail.**
 * - **A replaced word takes the notes the old one vacated**, which is the two
 *   rules above meeting at one spot rather than a third rule.
 *
 * WHAT THAT REPLACES, and why the first answer was wrong. The build read
 * Finale's Lyrics window as authority for a slide: *"delete it, and all the
 * syllables in the score slide to the left to close up the gap."* That is
 * Finale's behaviour and it was never put to Dann, so it was a DESK DEFAULT
 * wearing a citation (CONTRACT tether 19). Ilya's singer is editing a poem
 * against an engraved line they have already placed; a deletion that slides
 * ninety seats is a deletion that undoes an afternoon's work. The note the
 * word left is the only note that changes.
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
 * - **It displaces nothing.** Since N.113a there is no shift in this file at
 *   all, so no seat can be pushed off the end of the line by a text edit. The
 *   `displaced` count `ReseatResult` used to carry is gone rather than left
 *   reading zero for ever.
 */
import { type PairingMap, type Slot, type SlotOrigin } from './pairings';
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
	/**
	 * Slots of a NEW word that found no open note, and so were left to the
	 * hand. N.113a: the alternative is pushing the tail forward, which Dann
	 * ruled out on 2026-09-07.
	 */
	unseated: number;
	/**
	 * Seats this diff could not speak for, left exactly as they stood: made
	 * from the score's own words, carried in from another score, or stored
	 * before `origin.word` existed.
	 */
	kept: number;
}

/**
 * Where each slot of the CURRENT queue sits, by event index.
 *
 * **IT VERIFIES THE WORD, NOT ONLY THE POSITION, and that is the fix for the
 * defect Dann walked on `b191867`.** A seat is entered here only when the slot
 * its origin names still exists in the queue AND records the same word. A
 * position alone is not an identity: `readScoreText` joins a score's whole
 * underlay into ONE line (`clitic-seat.ts:449`), so a seat made from the
 * score's own words carries `lineIndex 0` and a running `wordIndex`, and those
 * coordinates collide head-on with the poem's first line.
 *
 * WHAT THE COLLISION COST. On the alias's real state the anchor for an inserted
 * word resolved to a note near the head of the piece, because a handful of
 * score-coordinate seats answered the lookup by position while every real poem
 * seat did not. `бесконечная` was seated on system 1's notes 1 to 5 over
 * `нат ка тес на я`, and system 2 kept the word it replaced.
 *
 * `origin.word` IS THE DISCRIMINATOR, ruled by Dann 2026-08-13 and carried in
 * `SlotOrigin`'s own doc comment for exactly this purpose. This is its second
 * reader.
 *
 * PAIRINGS ON EVENT IDS THIS SCORE DOES NOT HAVE ARE ABSENT HERE by
 * construction, because this walks `eventIds` rather than the map. A placement
 * kept from another score ("4 placements have no note in this score, kept")
 * can never anchor an insert.
 *
 * RECOMPUTED RATHER THAN MAINTAINED, and deliberately: `eventIds` is the notes
 * of one song, so this is cheap and the alternative is a bookkeeping bug
 * waiting to happen.
 */
function seatIndex(
	map: PairingMap,
	eventIds: readonly string[],
	bySlot: ReadonlyMap<string, Slot>,
): Map<string, number> {
	const at = new Map<string, number>();
	for (let i = 0; i < eventIds.length; i++) {
		const p = map[eventIds[i]];
		if (p?.kind !== 'syllable') continue;
		const key = slotKey(p.origin);
		const slot = bySlot.get(key);
		if (slot === undefined || slot.origin.word !== p.origin.word) continue;
		at.set(key, i);
	}
	return at;
}

/**
 * Re-seat a score's pairings against a poem that has changed.
 *
 * THE THREE RULES, in the order they run, because the order is the behaviour.
 * All three are Dann's, ruled 2026-09-07.
 *
 * 1. **A matched word keeps its notes.** Its seat is re-originated to the
 *    word's new `(line, word)` and its text refreshed from the new queue. This
 *    is what makes an edit in line 1 leave line 4 alone: line 4's words all
 *    matched, so every one of their seats is rewritten to the same note it was
 *    already on.
 * 2. **A removed word's seats go, and NOTHING ELSE MOVES.** The notes it held
 *    go back to undecided where they stand, and every other seat in the piece
 *    is untouched. What those bare notes then DRAW is `vacatedNotes`' rule in
 *    `pairings.ts`, not this pass's: nothing, on both lines.
 * 3. **A new word's slots take the OPEN notes after the word before them.**
 *    An undecided note there is filled; an occupied one is left alone and the
 *    slot goes to the hand, counted in `unseated`. Nothing is ever pushed.
 *
 * A REPLACEMENT NEEDS NO RULE OF ITS OWN. It is rule 2 then rule 3 at the same
 * spot: the removal vacates the old word's notes, and the new word's slots find
 * exactly those notes open and take them, in order, however many or few of them
 * there are.
 *
 * NOTHING IS MUTATED. A new map is returned, matching `reconcilePairings`'
 * habit and `clitic-seat.ts`'s.
 */
export function reseatByDiff(
	map: PairingMap,
	eventIds: readonly string[],
	queue: readonly Slot[],
	diff: TextDiff,
	before: readonly (readonly string[])[],
): ReseatResult {
	if (diff.unchanged) {
		return { map: { ...map }, removed: 0, refreshed: 0, seated: 0, unseated: 0, kept: 0 };
	}

	const bySlot = new Map<string, Slot>();
	for (const s of queue) bySlot.set(slotKey(s.origin), s);

	/** Whether this seat really describes the poem that is being replaced. */
	const ownedByPoem = (o: SlotOrigin): boolean =>
		o.word !== undefined && before[o.lineIndex]?.[o.wordIndex] === o.word;

	/* ── 1 and 2: every existing seat is kept-and-refreshed, or lost. ── */
	const next: PairingMap = {};
	let removed = 0;
	let refreshed = 0;
	let kept = 0;
	for (let i = 0; i < eventIds.length; i++) {
		const id = eventIds[i];
		const p = map[id];
		if (p === undefined) continue;
		if (p.kind !== 'syllable') {
			next[id] = p;
			continue;
		}
		/* A SEAT THIS DIFF CANNOT SPEAK FOR IS LEFT EXACTLY AS IT IS. The diff
		   describes one poem turning into another, and it can only be applied to
		   a seat that describes the FIRST of those. Three seats fail that test
		   and all three are real:

		   - one made from the score's OWN words, whose coordinates are
		     `readScoreText`'s single joined line rather than the poem's;
		   - one carried in from another score by `mergeOnUpload`;
		   - one stored before `origin.word` existed, which cannot be verified at
		     all.

		   Before this test they were re-keyed by POSITION, which silently
		   reinterpreted a score coordinate as a poem coordinate. That is the
		   defect Dann walked on `b191867`. Leaving them alone is R6: the page
		   prints what the singer decided, and no text edit can speak to a seat
		   the text never made. */
		if (!ownedByPoem(p.origin)) {
			next[id] = p;
			kept++;
			continue;
		}
		const from = wordKey(p.origin.lineIndex, p.origin.wordIndex);
		const to = diff.moved.get(from);
		const slot = to === undefined ? undefined : bySlot.get(`${to}-${p.origin.slotIndex}`);
		if (slot === undefined) {
			/* The word left the poem, or it survived with fewer slots than this
			   seat's ordinal. Either way the thing this note was carrying no
			   longer exists, and the note goes back to UNDECIDED rather than to
			   `empty`, which would be a decision nobody made.

			   THE HOLE STAYS WHERE IT IS. Until N.113a this pushed the index
			   onto a `holes` list and a `closeHole` pass slid the tail down into
			   it, highest first. Dann ruled that out on 2026-09-07: the deletion
			   vacates its own notes and moves nothing else, so there is nothing
			   left to close and nothing left to order. */
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

	/* ── 3: the new words take the open places. ─────────────────────── */
	/* THE ANCHOR IS THE LAST SEAT OF THE PREVIOUS MATCHED WORD, found by that
	   word's RE-KEYED origin and verified by its recorded word. It is never
	   "the first pairing that happens to match by position", which is what it
	   was on `b191867` and what put an inserted word at the head of the piece.

	   `anchorFound` IS SEPARATE FROM `anchor`, because -1 has to mean two
	   different things and cannot. Before any seat has been seen there is no
	   anchor at all; the note before the first note is a different fact.

	   AHEAD OF EVERY SEAT, THE TARGET IS THE FIRST OPEN NOTE BELOW THE FIRST
	   POEM SEAT. That is the head-of-poem case, and replacing the poem's first
	   word is the common way to meet it: the removal vacates the head of the
	   run and the new word takes those notes back, in order, without the rest
	   of the poem moving. Where the head is fully occupied there is no open
	   note to take and the slot goes to the hand.

	   WITH NO POEM SEAT AT ALL, NOTHING IS SEATED. DESK DEFAULT, 2026-09-07.
	   Every seat on the line belongs to the score's own words or to another
	   song, so there is no run to insert into and no place this pass can point
	   at that is not a guess. The queue and the hand are how an unseated slot
	   finds a note, and they are undisturbed. */
	let seated = 0;
	let unseated = 0;
	let at = seatIndex(next, eventIds, bySlot);
	let anchor = -1;
	let anchorFound = false;
	for (const slot of queue) {
		const here = at.get(slotKey(slot.origin));
		if (here !== undefined) {
			anchor = here;
			anchorFound = true;
			continue;
		}
		if (!diff.added.has(wordKey(slot.origin.lineIndex, slot.origin.wordIndex))) {
			/* An unseated slot of a word that was already in the poem. It was
			   never placed, or it is the second syllable of a word that
			   re-divided into more of them. Neither is this pass's business:
			   the queue and the hand are how a slot finds a note. */
			continue;
		}
		let target: number;
		if (anchorFound) {
			target = anchor + 1;
		} else {
			/* The first POEM seat, never the first pairing: a kept seat is not
			   in `at` and so cannot be the head of the run. */
			let first = -1;
			for (const i of at.values()) if (first === -1 || i < first) first = i;
			if (first === -1) {
				unseated++;
				continue;
			}
			let open = -1;
			for (let i = 0; i < first; i++) {
				if (next[eventIds[i]] === undefined) {
					open = i;
					break;
				}
			}
			if (open === -1) {
				unseated++;
				continue;
			}
			target = open;
		}
		if (target >= eventIds.length) {
			unseated++;
			continue;
		}
		/* AN OCCUPIED NOTE IS LEFT ALONE. Ruled by Dann 2026-09-07: an inserted
		   word takes open notes only and never pushes the tail. Until N.113a
		   this called `shiftToEndOfLyric(..., 'forward')` here, which moved
		   every seat from this note to the end of the line and could push the
		   last one off it. The slot goes to the hand instead, which is where an
		   unplaced slot has always gone. */
		if (next[eventIds[target]] !== undefined) {
			unseated++;
			continue;
		}
		next[eventIds[target]] = {
			kind: 'syllable',
			cyrillic: slot.cyrillic,
			ipa: slot.ipa,
			vowel: slot.vowel,
			origin: slot.origin,
		};
		seated++;
		/* A SLOT THIS PASS JUST SEATED IS AN ANCHOR LIKE ANY OTHER, and saying
		   so is what keeps a multi-syllable insert in order. Without it every
		   slot of a head insert re-derived the same head target, so `гор ни ца`
		   came out with its syllables in the wrong places. */
		anchor = target;
		anchorFound = true;
		at = seatIndex(next, eventIds, bySlot);
	}

	return { map: next, removed, refreshed, seated, unseated, kept };
}
