/**
 * N.112 increment 2. The seats follow the diff.
 *
 * THE SHAPE OF THESE TESTS. A poem's words, a queue built from them by hand,
 * and a line of note ids. The queue is hand-built for the same reason
 * `pairings.test.ts` hand-builds its own: the rule under test is the re-seat,
 * and routing it through `processText` would test the syllabifier instead.
 *
 * The words are the alias's own, `Ком-нат-ка тес-на-я ти-ха-я ми-ла-я`, so a
 * failure reads against the file Dann walks.
 */
import { describe, expect, it } from 'vitest';
import { reseatByDiff } from './reseat';
import { diffWordGrid, emptyDiff } from '$lib/text-diff';
import type { PairingMap, Slot } from './pairings';

/** One slot, with the origin `buildSlotQueue` would have given it. */
const slot = (
	cyrillic: string,
	lineIndex: number,
	wordIndex: number,
	slotIndex: number,
	word: string,
): Slot => ({
	cyrillic,
	ipa: cyrillic,
	vowel: undefined,
	origin: { lineIndex, wordIndex, slotIndex, word },
});

/** `комнатка тесная` on one line: three slots then three. */
const WORDS = [['комнатка', 'тесная']];
const QUEUE: Slot[] = [
	slot('ком', 0, 0, 0, 'комнатка'),
	slot('нат', 0, 0, 1, 'комнатка'),
	slot('ка', 0, 0, 2, 'комнатка'),
	slot('тес', 0, 1, 0, 'тесная'),
	slot('на', 0, 1, 1, 'тесная'),
	slot('я', 0, 1, 2, 'тесная'),
];

const IDS = ['n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7'];

/** Seat the first `n` slots of a queue on the first `n` notes, in order. */
function seatAll(queue: readonly Slot[], ids: readonly string[]): PairingMap {
	const map: PairingMap = {};
	for (let i = 0; i < queue.length && i < ids.length; i++) {
		map[ids[i]] = {
			kind: 'syllable',
			cyrillic: queue[i].cyrillic,
			ipa: queue[i].ipa,
			vowel: queue[i].vowel,
			origin: queue[i].origin,
		};
	}
	return map;
}

/** The Cyrillic under each note, `null` where the note is undecided. */
function line(map: PairingMap, ids: readonly string[]): (string | null)[] {
	return ids.map((id) => {
		const p = map[id];
		return p?.kind === 'syllable' ? p.cyrillic : null;
	});
}

describe('reseatByDiff', () => {
	it('does nothing at all when the text did not change', () => {
		const map = seatAll(QUEUE, IDS);
		const r = reseatByDiff(map, IDS, QUEUE, emptyDiff(), WORDS);
		expect(r.map).toEqual(map);
		expect(r.removed).toBe(0);
		expect(r.seated).toBe(0);
	});

	it('leaves every later seat on its own note when a word is edited', () => {
		// `комнатка` becomes `горница`: one word replaced, the second untouched.
		const after = [['горница', 'тесная']];
		const nextQueue: Slot[] = [
			slot('гор', 0, 0, 0, 'горница'),
			slot('ни', 0, 0, 1, 'горница'),
			slot('ца', 0, 0, 2, 'горница'),
			slot('тес', 0, 1, 0, 'тесная'),
			slot('на', 0, 1, 1, 'тесная'),
			slot('я', 0, 1, 2, 'тесная'),
		];
		const r = reseatByDiff(seatAll(QUEUE, IDS), IDS, nextQueue, diffWordGrid(WORDS, after), WORDS);
		/* THE REPLACED WORD LANDS IN THE PLACE THE OLD ONE HELD, and `тесная`
		   does not move at all. A replacement is a removal and an insert at the
		   same spot: the removal opens three notes, the insert takes them, and
		   the net effect on every later seat is nothing. That is what Finale
		   does and it is what the brief asks for in one sentence, "every seat
		   after it unchanged and the changed word's seats refreshed".

		   THIS EXPECTATION WAS WRITTEN WRONG FIRST, as `тесная` sliding to the
		   front, and the run corrected it. Kept as the assertion rather than
		   quietly fixed, because the wrong version is the intuitive one. */
		expect(line(r.map, IDS)).toEqual(['гор', 'ни', 'ца', 'тес', 'на', 'я', null, null]);
		expect(r.removed).toBe(3);
		expect(r.refreshed).toBe(3);
		expect(r.seated).toBe(3);
		expect(r.displaced).toBe(0);
		// `тесная`'s first seat is the pairing that was already on n3.
		const kept = r.map.n3;
		expect(kept.kind === 'syllable' && kept.origin.word).toBe('тесная');
	});

	it('refreshes a matched word onto the same note when only its neighbour moved', () => {
		// A word is deleted from the front. `тесная` keeps its three notes'
		// worth of syllables but they slide back by three.
		const after = [['тесная']];
		const nextQueue: Slot[] = [
			slot('тес', 0, 0, 0, 'тесная'),
			slot('на', 0, 0, 1, 'тесная'),
			slot('я', 0, 0, 2, 'тесная'),
		];
		const r = reseatByDiff(seatAll(QUEUE, IDS), IDS, nextQueue, diffWordGrid(WORDS, after), WORDS);
		expect(line(r.map, IDS)).toEqual(['тес', 'на', 'я', null, null, null, null, null]);
		const p = r.map.n0;
		// Re-originated, so the seat now points at the word's NEW coordinate.
		expect(p.kind === 'syllable' && p.origin.wordIndex).toBe(0);
		expect(p.kind === 'syllable' && p.origin.word).toBe('тесная');
	});

	it('closes the tail up when a word is deleted from the middle', () => {
		const before = [['раз', 'два', 'три']];
		const after = [['раз', 'три']];
		const q1 = [slot('раз', 0, 0, 0, 'раз'), slot('два', 0, 1, 0, 'два'), slot('три', 0, 2, 0, 'три')];
		const q2 = [slot('раз', 0, 0, 0, 'раз'), slot('три', 0, 1, 0, 'три')];
		const r = reseatByDiff(seatAll(q1, IDS), IDS, q2, diffWordGrid(before, after), before);
		expect(line(r.map, IDS).slice(0, 3)).toEqual(['раз', 'три', null]);
		expect(r.removed).toBe(1);
	});

	it('slides the tail back one note per removed slot when two words go', () => {
		const before = [['раз', 'два', 'три', 'сто']];
		const after = [['раз', 'сто']];
		const q1 = [
			slot('раз', 0, 0, 0, 'раз'),
			slot('два', 0, 1, 0, 'два'),
			slot('три', 0, 2, 0, 'три'),
			slot('сто', 0, 3, 0, 'сто'),
		];
		const q2 = [slot('раз', 0, 0, 0, 'раз'), slot('сто', 0, 1, 0, 'сто')];
		const r = reseatByDiff(seatAll(q1, IDS), IDS, q2, diffWordGrid(before, after), before);
		expect(line(r.map, IDS).slice(0, 4)).toEqual(['раз', 'сто', null, null]);
		expect(r.removed).toBe(2);
	});

	it('gives an inserted word the undecided note that follows the word before it', () => {
		const before = [['раз', 'три']];
		const after = [['раз', 'два', 'три']];
		const q1 = [slot('раз', 0, 0, 0, 'раз'), slot('три', 0, 1, 0, 'три')];
		const q2 = [
			slot('раз', 0, 0, 0, 'раз'),
			slot('два', 0, 1, 0, 'два'),
			slot('три', 0, 2, 0, 'три'),
		];
		// `раз` on n0, `три` on n2, so n1 is undecided and waiting.
		const map: PairingMap = {
			n0: { kind: 'syllable', cyrillic: 'раз', ipa: 'раз', vowel: undefined, origin: q1[0].origin },
			n2: { kind: 'syllable', cyrillic: 'три', ipa: 'три', vowel: undefined, origin: q1[1].origin },
		};
		const r = reseatByDiff(map, IDS, q2, diffWordGrid(before, after), before);
		expect(line(r.map, IDS).slice(0, 3)).toEqual(['раз', 'два', 'три']);
		expect(r.seated).toBe(1);
		expect(r.displaced).toBe(0);
	});

	it('pushes the tail forward when an inserted word finds no open note', () => {
		const before = [['раз', 'три']];
		const after = [['раз', 'два', 'три']];
		const q1 = [slot('раз', 0, 0, 0, 'раз'), slot('три', 0, 1, 0, 'три')];
		const q2 = [
			slot('раз', 0, 0, 0, 'раз'),
			slot('два', 0, 1, 0, 'два'),
			slot('три', 0, 2, 0, 'три'),
		];
		const r = reseatByDiff(seatAll(q1, IDS), IDS, q2, diffWordGrid(before, after), before);
		expect(line(r.map, IDS).slice(0, 3)).toEqual(['раз', 'два', 'три']);
		expect(r.seated).toBe(1);
		// The line is eight notes long and only three are used, so nothing fell
		// off the end.
		expect(r.displaced).toBe(0);
	});

	it('reports a seat pushed off the end rather than losing it in silence', () => {
		const before = [['раз', 'три']];
		const after = [['раз', 'два', 'три']];
		const short = ['n0', 'n1'];
		const q1 = [slot('раз', 0, 0, 0, 'раз'), slot('три', 0, 1, 0, 'три')];
		const q2 = [
			slot('раз', 0, 0, 0, 'раз'),
			slot('два', 0, 1, 0, 'два'),
			slot('три', 0, 2, 0, 'три'),
		];
		const r = reseatByDiff(seatAll(q1, short), short, q2, diffWordGrid(before, after), before);
		expect(r.displaced).toBe(1);
		expect(line(r.map, short)).toEqual(['раз', 'два']);
	});

	it('never invents a seat for a word that merely re-divided into more slots', () => {
		// Same cleaned word, one more slot. `origin.word` is unchanged, so this
		// is a re-division and the new slot is the singer's hand to place.
		const q1 = [slot('мос', 0, 0, 0, 'москва'), slot('ква', 0, 0, 1, 'москва')];
		const q2 = [
			slot('мо', 0, 0, 0, 'москва'),
			slot('ск', 0, 0, 1, 'москва'),
			slot('ва', 0, 0, 2, 'москва'),
		];
		// The grids are equal, so the diff is unchanged and this is a no-op:
		// the refresh in `pairings.ts` is what carries a re-division.
		const diff = diffWordGrid([['москва']], [['москва']]);
		const r = reseatByDiff(seatAll(q1, IDS), IDS, q2, diff, [['москва']]);
		expect(r.seated).toBe(0);
		expect(line(r.map, IDS).slice(0, 3)).toEqual(['мос', 'ква', null]);
	});

	it('drops the seat of a slot a matched word no longer has', () => {
		// `тесная` survives the edit but is re-divided into two slots, so the
		// third seat has nothing to point at.
		const before = [['тесная']];
		const after = [['тесная', 'и']];
		const q1 = [
			slot('тес', 0, 0, 0, 'тесная'),
			slot('на', 0, 0, 1, 'тесная'),
			slot('я', 0, 0, 2, 'тесная'),
		];
		const q2 = [
			slot('тес', 0, 0, 0, 'тесная'),
			slot('ная', 0, 0, 1, 'тесная'),
			slot('и', 0, 1, 0, 'и'),
		];
		const r = reseatByDiff(seatAll(q1, IDS), IDS, q2, diffWordGrid(before, after), before);
		expect(r.removed).toBe(1);
		expect(line(r.map, IDS).slice(0, 3)).toEqual(['тес', 'ная', 'и']);
	});

	it('leaves melisma and empty decisions alone, and writes neither', () => {
		const before = [['раз', 'два']];
		const after = [['раз']];
		const q1 = [slot('раз', 0, 0, 0, 'раз'), slot('два', 0, 1, 0, 'два')];
		const q2 = [slot('раз', 0, 0, 0, 'раз')];
		const map: PairingMap = {
			...seatAll(q1, IDS),
			n4: { kind: 'melisma' },
			n5: { kind: 'empty' },
		};
		const r = reseatByDiff(map, IDS, q2, diffWordGrid(before, after), before);
		expect(r.map.n4).toEqual({ kind: 'melisma' });
		expect(r.map.n5).toEqual({ kind: 'empty' });
		// The vacated note is UNDECIDED, absent from the map, not `empty`.
		expect(Object.hasOwn(r.map, 'n1')).toBe(false);
	});

	it('carries a pairing whose note is not on the line, so a Restore finds it', () => {
		const before = [['раз']];
		const after = [['раз', 'два']];
		const q1 = [slot('раз', 0, 0, 0, 'раз')];
		const q2 = [slot('раз', 0, 0, 0, 'раз'), slot('два', 0, 1, 0, 'два')];
		const map: PairingMap = {
			...seatAll(q1, IDS),
			deleted: { kind: 'syllable', cyrillic: 'ой', ipa: 'ой', vowel: undefined, origin: q1[0].origin },
		};
		const r = reseatByDiff(map, IDS, q2, diffWordGrid(before, after), before);
		expect(r.map.deleted).toEqual(map.deleted);
	});

	it('does not mutate the map it was given', () => {
		const before = [['раз', 'два']];
		const after = [['раз']];
		const q1 = [slot('раз', 0, 0, 0, 'раз'), slot('два', 0, 1, 0, 'два')];
		const original = seatAll(q1, IDS);
		reseatByDiff(original, IDS, [slot('раз', 0, 0, 0, 'раз')], diffWordGrid(before, after), before);
		expect(line(original, IDS).slice(0, 2)).toEqual(['раз', 'два']);
	});

	/* ── The walk defect on `b191867`, Dann 2026-09-07 (memo §9) ──────
	   On the alias's real state, replacing a word in line 2 seated the new word
	   on system 1's notes 1 to 5 and left the word it replaced standing. The
	   anchor for the insert had resolved near the head of the piece.

	   THE CAUSE. `readScoreText` joins a score's whole underlay into ONE line
	   (`clitic-seat.ts:449`), so a seat made from the score's own words carries
	   `lineIndex 0` with a running `wordIndex`. Those coordinates collide with
	   the poem's first line, and the re-seat consulted the diff BY POSITION
	   alone, so a score coordinate was read as a poem coordinate: it anchored
	   the insert, and it was itself rewritten with the poem's word.

	   `origin.word` is the discriminator Dann ruled on 2026-08-13 and it was
	   never consulted. These four pin that it is now. */
	const SCORE_ORIGIN = (i: number) => ({ lineIndex: 0, wordIndex: i, slotIndex: 0, word: `w${i}` });

	it('leaves a seat made from the score\'s own words exactly where it stands', () => {
		const before = [['раз', 'два']];
		const after = [['раз', 'три']];
		const q1 = [slot('раз', 0, 0, 0, 'раз'), slot('два', 0, 1, 0, 'два')];
		const q2 = [slot('раз', 0, 0, 0, 'раз'), slot('три', 0, 1, 0, 'три')];
		// Both seats carry the SCORE's coordinates, which collide with the
		// poem's line 0 by position and disagree by word.
		const map: PairingMap = {
			n0: { kind: 'syllable', cyrillic: 'Ком', ipa: 'x', vowel: undefined, origin: SCORE_ORIGIN(0) },
			n1: { kind: 'syllable', cyrillic: 'нат', ipa: 'x', vowel: undefined, origin: SCORE_ORIGIN(1) },
		};
		const r = reseatByDiff(map, IDS, q2, diffWordGrid(before, after), before);
		expect(r.kept).toBe(2);
		expect(r.removed).toBe(0);
		expect(r.refreshed).toBe(0);
		expect(line(r.map, IDS).slice(0, 3)).toEqual(['Ком', 'нат', null]);
	});

	it('never anchors an insert on a seat that matches only by position', () => {
		// The head of the line carries score-coordinate seats; the poem's own
		// seats follow. The inserted word must land after the poem's last
		// matched word, not after the score-coordinate seats.
		const before = [['раз', 'два'], ['три']];
		const after = [['раз', 'два'], ['три', 'сто']];
		const q2 = [
			slot('раз', 0, 0, 0, 'раз'),
			slot('два', 0, 1, 0, 'два'),
			slot('три', 1, 0, 0, 'три'),
			slot('сто', 1, 1, 0, 'сто'),
		];
		const map: PairingMap = {
			n0: { kind: 'syllable', cyrillic: 'Ком', ipa: 'x', vowel: undefined, origin: SCORE_ORIGIN(0) },
			n1: { kind: 'syllable', cyrillic: 'нат', ipa: 'x', vowel: undefined, origin: SCORE_ORIGIN(1) },
			n2: { kind: 'syllable', cyrillic: 'раз', ipa: 'раз', vowel: undefined, origin: { lineIndex: 0, wordIndex: 0, slotIndex: 0, word: 'раз' } },
			n3: { kind: 'syllable', cyrillic: 'два', ipa: 'два', vowel: undefined, origin: { lineIndex: 0, wordIndex: 1, slotIndex: 0, word: 'два' } },
			n4: { kind: 'syllable', cyrillic: 'три', ipa: 'три', vowel: undefined, origin: { lineIndex: 1, wordIndex: 0, slotIndex: 0, word: 'три' } },
		};
		const r = reseatByDiff(map, IDS, q2, diffWordGrid(before, after), before);
		// `сто` follows `три` on n4, so it takes n5. Before the fix it took n2,
		// because the score-coordinate seat on n1 answered the lookup first.
		expect(line(r.map, IDS).slice(0, 6)).toEqual(['Ком', 'нат', 'раз', 'два', 'три', 'сто']);
		expect(r.kept).toBe(2);
		expect(r.seated).toBe(1);
	});

	it('treats a pairing on an event id this score does not have as absent for anchoring', () => {
		const before = [['раз']];
		const after = [['раз', 'два']];
		const q2 = [slot('раз', 0, 0, 0, 'раз'), slot('два', 0, 1, 0, 'два')];
		const map: PairingMap = {
			n3: { kind: 'syllable', cyrillic: 'раз', ipa: 'раз', vowel: undefined, origin: { lineIndex: 0, wordIndex: 0, slotIndex: 0, word: 'раз' } },
			// Four placements kept from another score, at ids this line has not
			// got. One of them names the poem's own first word.
			ghost0: { kind: 'syllable', cyrillic: 'x', ipa: 'x', vowel: undefined, origin: { lineIndex: 0, wordIndex: 0, slotIndex: 0, word: 'раз' } },
			ghost1: { kind: 'syllable', cyrillic: 'x', ipa: 'x', vowel: undefined, origin: SCORE_ORIGIN(1) },
			ghost2: { kind: 'syllable', cyrillic: 'x', ipa: 'x', vowel: undefined, origin: SCORE_ORIGIN(2) },
			ghost3: { kind: 'syllable', cyrillic: 'x', ipa: 'x', vowel: undefined, origin: SCORE_ORIGIN(3) },
		};
		const r = reseatByDiff(map, IDS, q2, diffWordGrid(before, after), before);
		// The only seat on this line is `раз` at n3, so `два` takes n4.
		expect(line(r.map, IDS).slice(0, 6)).toEqual([null, null, null, 'раз', 'два', null]);
		// The four keep their ids and their content, untouched.
		expect(r.map.ghost0).toEqual(map.ghost0);
		expect(r.map.ghost3).toEqual(map.ghost3);
	});

	it('seats nothing when no previous matched word has a seat', () => {
		// The added word is ahead of every seat in the piece, so there is no
		// previous matched word to follow. DESK DEFAULT: leave it to the hand
		// rather than guess note 0 and push the line forward.
		const before = [['два']];
		const after = [['раз', 'два']];
		const q2 = [slot('раз', 0, 0, 0, 'раз'), slot('два', 0, 1, 0, 'два')];
		const map: PairingMap = {
			n5: { kind: 'syllable', cyrillic: 'Ком', ipa: 'x', vowel: undefined, origin: SCORE_ORIGIN(0) },
		};
		const r = reseatByDiff(map, IDS, q2, diffWordGrid(before, after), before);
		expect(r.seated).toBe(0);
		expect(line(r.map, IDS)).toEqual(IDS.map((_, i) => (i === 5 ? 'Ком' : null)));
	});

	it('is stable on a round trip: delete a word, put it back, and the line returns', () => {
		const full = [['раз', 'два', 'три']];
		const cut = [['раз', 'три']];
		const qFull = [
			slot('раз', 0, 0, 0, 'раз'),
			slot('два', 0, 1, 0, 'два'),
			slot('три', 0, 2, 0, 'три'),
		];
		const qCut = [slot('раз', 0, 0, 0, 'раз'), slot('три', 0, 1, 0, 'три')];
		const gone = reseatByDiff(seatAll(qFull, IDS), IDS, qCut, diffWordGrid(full, cut), full);
		expect(line(gone.map, IDS).slice(0, 3)).toEqual(['раз', 'три', null]);
		const back = reseatByDiff(gone.map, IDS, qFull, diffWordGrid(cut, full), cut);
		expect(line(back.map, IDS).slice(0, 3)).toEqual(['раз', 'два', 'три']);
	});
});
