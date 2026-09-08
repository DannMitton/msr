/**
 * refreshPairings tests (N.55b, reduced by N.112).
 *
 * THE CONTRACT UNDER TEST is the distinction Dann drew on 2026-08-13: a
 * re-division and a re-transcription are not the same event, and this function
 * acts on only the first.
 *
 * A re-division moves consonants between slots of one word. Nuclei ARE the
 * syllables, so they never move, the slot count cannot change, and the
 * singer's pairing still refers to the same nucleus. Its text is stale, not
 * wrong, so it is refreshed.
 *
 * A re-transcription puts a different word at the same position. That is a
 * different decision, so R6 holds and this leaves it alone. **N.112 retired
 * the drift REPORT, not this rule.** A changed poem is now handled by
 * `reseat.ts` at transcribe time, so by the time this runs a seat pointing at
 * a different word is a seat nothing has re-keyed, and the safe answer is
 * still to print what the singer decided. The drift list, `PairingDrift`,
 * `Reconciliation` and `auditPairings` went with the "Text changed n" line.
 *
 * The fixtures are hand-built rather than driven through the engine: the
 * rule under test is the refresh, and routing it through processText
 * would test the syllabifier instead.
 */

import { describe, expect, it } from 'vitest';
import {
	refreshPairings,
	mergeOnUpload,
	firstPass,
	toggleMelisma,
	melismaIds,
	melismaRuns,
	vacatedTail,
} from './pairings';
import type { Pairing, PairingMap, Slot } from './pairings';

const slot = (cyrillic: string, ipa: string, vowel: string | undefined, slotIndex: number, word: string): Slot => ({
	cyrillic,
	ipa,
	vowel,
	origin: { lineIndex: 0, wordIndex: 0, slotIndex, word },
});

/** Moscow, as the engine divides it. */
const BEFORE: Slot[] = [slot('мос', 'mos', 'o', 0, 'москва'), slot('ква', 'kva', 'a', 1, 'москва')];

/** The same word after an Inspector drag moves the consonant rightward. */
const REDIVIDED: Slot[] = [slot('мо', 'mo', 'o', 0, 'москва'), slot('сква', 'skva', 'a', 1, 'москва')];

/** A different word at the same position, with the same vowel count. */
const RETRANSCRIBED: Slot[] = [slot('бо', 'bo', 'o', 0, 'болото'), slot('лото', 'loto', 'o', 1, 'болото')];

const paired = (): PairingMap => ({
	e1: { kind: 'syllable', cyrillic: 'мос', ipa: 'mos', vowel: 'o', origin: { lineIndex: 0, wordIndex: 0, slotIndex: 0, word: 'москва' } },
});

const cyrOf = (map: PairingMap, id: string): string | undefined => {
	const p = map[id];
	return p?.kind === 'syllable' ? p.cyrillic : undefined;
};

describe('refreshPairings', () => {
	it('refreshes a re-divided pairing', () => {
		const map = refreshPairings(paired(), REDIVIDED);
		expect(cyrOf(map, 'e1')).toBe('мо');
		const p = map.e1;
		expect(p.kind === 'syllable' && p.ipa).toBe('mo');
	});

	it('leaves a re-transcription exactly as the singer decided it', () => {
		expect(cyrOf(refreshPairings(paired(), RETRANSCRIBED), 'e1')).toBe('мос');
	});

	it('leaves an unchanged queue alone', () => {
		expect(refreshPairings(paired(), BEFORE)).toEqual(paired());
	});

	it('leaves a pairing standing when its origin no longer exists', () => {
		expect(cyrOf(refreshPairings(paired(), []), 'e1')).toBe('мос');
	});

	it('passes melisma and empty pairings through untouched', () => {
		const map: PairingMap = { e1: { kind: 'melisma' }, e2: { kind: 'empty' } };
		expect(refreshPairings(map, REDIVIDED)).toEqual(map);
	});

	it('leaves a pairing stored before origin.word existed exactly as stored', () => {
		const legacy = {
			e1: { kind: 'syllable', cyrillic: 'мос', ipa: 'mos', vowel: 'o', origin: { lineIndex: 0, wordIndex: 0, slotIndex: 0 } },
		} as unknown as PairingMap;
		expect(cyrOf(refreshPairings(legacy, REDIVIDED), 'e1')).toBe('мос');
	});

	it('does not mutate the map it was given', () => {
		const original = paired();
		refreshPairings(original, REDIVIDED);
		expect(cyrOf(original, 'e1')).toBe('мос');
	});
});

/* ── The merge rule, N.67 step 3, design §2.6 ────────────────────── */

describe('mergeOnUpload', () => {
	// N.68 in one line: an upload never destroys placements; only the singer
	// does, on purpose. Every test below is a way of saying that.

	it('proposes a first pass into an EMPTY map when the score has no lyrics', () => {
		// N.55a's fresh path, preserved exactly: Ilya proposes where the score
		// is silent.
		const result = mergeOnUpload({}, ['e1', 'e2'], BEFORE, true);

		expect(result.proposed).toBe(true);
		expect(Object.keys(result.map)).toEqual(['e1', 'e2']);
		expect(result.map.e1).toEqual(firstPass(['e1', 'e2'], BEFORE).e1);
	});

	it('proposes NOTHING when the score carries its own underlay', () => {
		// Where the score speaks, Ilya reads it rather than talking over it.
		const result = mergeOnUpload({}, ['e1', 'e2'], BEFORE, false);

		expect(result.proposed).toBe(false);
		expect(result.map).toEqual({});
	});

	it('KEEPS an existing map rather than rebuilding it. This is N.68', () => {
		// The old code ran the first pass again here, silently replacing the
		// singer's own decisions with the default layout.
		const mine = paired();

		const result = mergeOnUpload(mine, ['e1', 'e2'], BEFORE, true);

		expect(result.map).toBe(mine);
		expect(result.proposed).toBe(false);
	});

	it('keeps an existing map even when the score carries lyrics', () => {
		// The other half of N.68, and the louder one: this branch used to set
		// the map to {} outright, erasing every placement on any lyric-bearing
		// upload.
		const mine = paired();

		expect(mergeOnUpload(mine, ['e1', 'e2'], BEFORE, false).map).toBe(mine);
	});

	it('carries a placement across by its positional key', () => {
		// The keys are the parsers' own positional event ids, so a note that
		// stayed where it was keeps its pairing with no matching by text.
		const mine = paired();

		const result = mergeOnUpload(mine, ['e1', 'e2', 'e3'], BEFORE, true);

		expect(result.map.e1.kind).toBe('syllable');
		expect(result.orphaned).toEqual([]);
	});

	it('reports a placement whose note the new score does not contain, and KEEPS it', () => {
		const mine = paired();

		const result = mergeOnUpload(mine, ['e2', 'e3'], BEFORE, true);

		expect(result.orphaned).toEqual(['e1']);
		// Reported, not dropped. A singer who re-exported a shortened score has
		// not asked Ilya to throw their work away.
		expect(result.map.e1).toBeDefined();
	});

	it('reports nothing on a fresh proposal', () => {
		expect(mergeOnUpload({}, ['e1'], BEFORE, true).orphaned).toEqual([]);
	});
});

/* ── N.113, the melisma ─────────────────────────────────────────────
   Numbered by Dann 2026-09-06, step 3 of the text-to-score sequence. The
   `melisma` kind has existed since N.55b and nothing wrote it until now.
   Ilya still never creates one (E.46); only the singer's press does. */

const IDS = ['n0', 'n1', 'n2', 'n3', 'n4', 'n5'];

const syl = (c: string, wi: number): Pairing => ({
	kind: 'syllable',
	cyrillic: c,
	ipa: c,
	vowel: undefined,
	origin: { lineIndex: 0, wordIndex: wi, slotIndex: 0, word: c },
});

const shown = (m: PairingMap): string =>
	IDS.map((id) => {
		const p = m[id];
		return p === undefined ? '_' : p.kind === 'melisma' ? '~' : p.kind === 'empty' ? 'e' : p.cyrillic;
	}).join(' ');

describe('toggleMelisma', () => {
	it('marks an undecided note and moves nothing', () => {
		const map: PairingMap = { n0: syl('ой', 0) };
		const r = toggleMelisma(map, IDS, 'n1');
		expect(r.set).toBe(true);
		expect(shown(r.map)).toBe('ой ~ _ _ _ _');
		expect(r.displaced).toEqual([]);
	});

	it('shifts a seated note forward, then marks it', () => {
		const map: PairingMap = { n0: syl('ой', 0), n1: syl('да', 1), n2: syl('нет', 2) };
		const r = toggleMelisma(map, IDS, 'n1');
		expect(r.set).toBe(true);
		// `да` and `нет` each move one note forward and n1 takes the mark.
		expect(shown(r.map)).toBe('ой ~ да нет _ _');
		expect(r.displaced).toEqual([]);
	});

	it('reports a seat the shift pushed off the end rather than losing it', () => {
		const short = ['n0', 'n1'];
		const map: PairingMap = { n0: syl('ой', 0), n1: syl('да', 1) };
		const r = toggleMelisma(map, short, 'n1');
		expect(r.displaced).toEqual([syl('да', 1)]);
	});

	it('clears a marked note back to UNDECIDED, never to empty', () => {
		const map: PairingMap = { n0: syl('ой', 0), n1: { kind: 'melisma' } };
		const r = toggleMelisma(map, IDS, 'n1');
		expect(r.set).toBe(false);
		expect(Object.hasOwn(r.map, 'n1')).toBe(false);
		expect(shown(r.map)).toBe('ой _ _ _ _ _');
	});

	it('round-trips: mark an undecided note and clear it, and the map returns', () => {
		const map: PairingMap = { n0: syl('ой', 0), n2: syl('да', 1) };
		const there = toggleMelisma(map, IDS, 'n1');
		const back = toggleMelisma(there.map, IDS, 'n1');
		expect(back.map).toEqual(map);
	});

	it('does not round-trip a SEATED note, and that is the shift being honest', () => {
		// Marking a seated note moves its syllable forward; clearing the mark
		// does not move it back, because a clear is not an undo. The Undo pill
		// is what restores the whole map (N.111-3b's snapshot stack).
		const map: PairingMap = { n0: syl('ой', 0), n1: syl('да', 1) };
		const back = toggleMelisma(toggleMelisma(map, IDS, 'n1').map, IDS, 'n1');
		expect(shown(back.map)).toBe('ой _ да _ _ _');
	});

	it('does not mutate the map it was given', () => {
		const map: PairingMap = { n0: syl('ой', 0), n1: syl('да', 1) };
		toggleMelisma(map, IDS, 'n1');
		expect(shown(map)).toBe('ой да _ _ _ _');
	});
});

describe('melismaIds', () => {
	it('names the marked notes and nothing else', () => {
		const map: PairingMap = { n0: syl('ой', 0), n1: { kind: 'melisma' }, n2: { kind: 'empty' } };
		expect([...melismaIds(map)]).toEqual(['n1']);
	});
});

describe('melismaRuns', () => {
	it('finds one run of consecutive marks after a seated note', () => {
		const map: PairingMap = { n0: syl('ой', 0), n1: { kind: 'melisma' }, n2: { kind: 'melisma' } };
		expect(melismaRuns(map, IDS)).toEqual([{ startId: 'n0', continuationIds: ['n1', 'n2'] }]);
	});

	it('finds two runs when a seated note separates them', () => {
		const map: PairingMap = {
			n0: syl('ой', 0),
			n1: { kind: 'melisma' },
			n2: syl('да', 1),
			n3: { kind: 'melisma' },
		};
		expect(melismaRuns(map, IDS)).toEqual([
			{ startId: 'n0', continuationIds: ['n1'] },
			{ startId: 'n2', continuationIds: ['n3'] },
		]);
	});

	it('opens NO run for a mark with no seated note before it', () => {
		// A state the hand can produce: press Melisma on the first note, or on
		// one whose predecessor is undecided. It draws nothing and the mark
		// stays in the map.
		expect(melismaRuns({ n0: { kind: 'melisma' } }, IDS)).toEqual([]);
		expect(melismaRuns({ n2: { kind: 'melisma' } }, IDS)).toEqual([]);
	});

	it('breaks a run at an undecided note, so the mark after it opens nothing', () => {
		const map: PairingMap = {
			n0: syl('ой', 0),
			n1: { kind: 'melisma' },
			// n2 undecided
			n3: { kind: 'melisma' },
		};
		expect(melismaRuns(map, IDS)).toEqual([{ startId: 'n0', continuationIds: ['n1'] }]);
	});

	it('is empty when nothing is marked', () => {
		expect(melismaRuns({ n0: syl('ой', 0) }, IDS)).toEqual([]);
	});
});

describe('vacatedTail', () => {
	it('names the bare notes after the last seat once the queue is exhausted', () => {
		const map: PairingMap = { n0: syl('ой', 0), n1: syl('да', 1) };
		expect([...vacatedTail(map, IDS, true)]).toEqual(['n2', 'n3', 'n4', 'n5']);
	});

	it('names nothing while the queue still has slots to place', () => {
		const map: PairingMap = { n0: syl('ой', 0), n1: syl('да', 1) };
		expect(vacatedTail(map, IDS, false).size).toBe(0);
	});

	it('names nothing when no note is seated at all', () => {
		expect(vacatedTail({}, IDS, true).size).toBe(0);
	});

	it('leaves a marked note alone, because a melisma is a decision', () => {
		const map: PairingMap = { n0: syl('ой', 0), n1: { kind: 'melisma' } };
		// n1 is decided, so it is not vacated; n2 onward are.
		expect([...vacatedTail(map, IDS, true)]).toEqual(['n2', 'n3', 'n4', 'n5']);
	});

	it('measures the tail from the last SEATED note, not the last entry', () => {
		const map: PairingMap = { n0: syl('ой', 0), n4: { kind: 'melisma' } };
		expect([...vacatedTail(map, IDS, true)]).toEqual(['n1', 'n2', 'n3', 'n5']);
	});
});
