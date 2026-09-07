/**
 * N.111's proof, on the file that numbered the item.
 *
 * The fixture is Dann's own engraving of Musorgsky's *Without Sun* no. 1,
 * copied verbatim from `~/Downloads/Mussorgsky - Sunless 01 - Within Four Walls
 * (engraved).musicxml` into the app's existing fixture directory. It is not a
 * synthetic case: bar 8 seats «в» alone on the E quarter because Finale needs a
 * note per syllable, and every syllable after it is one note late.
 *
 * Every expectation here is read off the PRINTED score (photo,
 * `docs/sessions/n111-sunless-01-p63_2026-09-03.jpg`, and the brief's §2, which
 * quotes it), not off this mechanism's own output. That is the standing
 * condition on an acceptance test in this repository.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MusicXmlScoreParser, type ParsedScore } from '@ilya/score-parser';
import { parseXml } from './ingestion/mini-dom';
import {
	findCliticFolds,
	applyCliticSeat,
	isCliticSeated,
	seatCliticFolds,
	readScoreText,
} from './clitic-seat';
import { collectScoreWords } from './vowel-resolver';
import { pairedCyrillic, applyBlank } from './pairings';

const NBSP = '\u00A0';

const xml = readFileSync(
	fileURLToPath(new URL('./ingestion/fixtures/sunless-01-engraved.musicxml', import.meta.url)),
	'utf8',
);

async function parse(source: string): Promise<ParsedScore> {
	const res = await new MusicXmlScoreParser().parse({
		format: 'musicxml',
		data: parseXml(source) as unknown as Document,
		sourcePath: 'sunless-01-engraved.musicxml',
	});
	return res.score;
}

/** The verse-1 cells in vocal-line order: what the FILE prints under each note. */
function cellsOf(score: ParsedScore): Array<{ eventId: string; text: string }> {
	return collectScoreWords(score, 1).flatMap((w) => w.cells);
}

/** The text each note carries once `map` is laid over the file's own cells. */
function shown(score: ParsedScore, map: Record<string, { kind: string; cyrillic?: string }>) {
	return cellsOf(score).map((c) => {
		const p = map[c.eventId];
		return p && p.kind === 'syllable' ? (p.cyrillic ?? '') : c.text;
	});
}

describe('N.111 the clitic seat, on the engraved Sunless no. 1', () => {
	it('finds exactly one fold, and it is «в» before «бью» in bar 8', async () => {
		const score = await parse(xml);
		const folds = findCliticFolds(score);
		expect(folds).toHaveLength(1);
		const fold = folds[0];
		expect(fold.cliticText).toBe('в');
		expect(fold.hostText).toBe('бью');
		expect(fold.fusedText).toBe('в' + NBSP + 'бью');
		// The E quarter after the rest in bar 8. Read off the file: the event id
		// is the parser's own positional key, so naming it pins the note rather
		// than the ordinal.
		expect(fold.cliticEventId).toBe('m7-0-1');
	});

	it('leaves the fourteen cells before it alone, and the notes it moves are the tail', async () => {
		const score = await parse(xml);
		const cells = cellsOf(score);
		const fold = findCliticFolds(score)[0];
		const at = cells.findIndex((c) => c.eventId === fold.cliticEventId);
		// Everything up to the clitic already agrees with the queue, so nothing
		// before it is in the run.
		expect(at).toBe(36);
		expect(fold.seat[0].eventId).toBe(fold.cliticEventId);
		// 96 cells, 95 slots: the run covers the clitic and every note after it
		// except the last, which the queue cannot reach.
		expect(cells).toHaveLength(96);
		expect(fold.seat).toHaveLength(59);
		expect(fold.seat.at(-1)!.eventId).toBe(cells[94].eventId);
	});

	it('seats «в бью» on the E and closes the tail up, exactly as the print does', async () => {
		const score = await parse(xml);
		const fold = findCliticFolds(score)[0];
		const before = shown(score, {});
		// The file as it stands: «в» alone, and every syllable one note late.
		expect(before.slice(36, 43)).toEqual(['в', 'бью', 'щем', 'ся', 'серд', 'це', 'на']);

		const after = shown(score, applyCliticSeat({}, fold));
		// The printed score, bar 8: «в бью» on the first quarter, then щем · ся ·
		// серд on the other three, це on the D eighth, на of надежда on the C
		// eighth.
		expect(after.slice(36, 43)).toEqual([
			'в' + NBSP + 'бью',
			'щем',
			'ся',
			'серд',
			'це',
			'на',
			'деж',
		]);
	});

	it('touches nothing before the fold', async () => {
		const score = await parse(xml);
		const fold = findCliticFolds(score)[0];
		const map = applyCliticSeat({}, fold);
		for (const cell of cellsOf(score).slice(0, 36)) {
			expect(map[cell.eventId]).toBeUndefined();
		}
	});

	it('leaves the last note UNDECIDED rather than empty', async () => {
		const score = await parse(xml);
		const cells = cellsOf(score);
		const fold = findCliticFolds(score)[0];
		const map = applyCliticSeat({}, fold);
		expect(map[cells[95].eventId]).toBeUndefined();
		expect(Object.values(map).some((p) => p.kind === 'empty')).toBe(false);
		expect(Object.values(map).some((p) => p.kind === 'melisma')).toBe(false);
	});

	it('carries the fused IPA and the host vowel onto the clitic’s note', async () => {
		const score = await parse(xml);
		const fold = findCliticFolds(score)[0];
		const seated = applyCliticSeat({}, fold)[fold.cliticEventId];
		expect(seated.kind).toBe('syllable');
		if (seated.kind !== 'syllable') return;
		// The clitic's own consonant leads the host's syllable, with no space:
		// the IPA line fuses where the Cyrillic line keeps a hard space.
		expect(seated.ipa.startsWith('v')).toBe(true);
		expect(seated.ipa).not.toContain(NBSP);
		expect(seated.vowel).toBe('u');
	});

	it('mutates nothing', async () => {
		const score = await parse(xml);
		const fold = findCliticFolds(score)[0];
		const start = {};
		const next = applyCliticSeat(start, fold);
		expect(start).toEqual({});
		expect(next).not.toBe(start);
	});

	// ── The negative controls ────────────────────────────────────────
	//
	// A vowel-bearing proclitic on its own note is NOT a fold. The same file
	// carries three of them, за, на and без, each on a note of its own, and each
	// one must come through this untouched.

	it('does not touch a vowel-bearing proclitic on its own note', async () => {
		const score = await parse(xml);
		const fold = findCliticFolds(score)[0];
		const cells = cellsOf(score);
		const map = applyCliticSeat({}, fold);
		for (const bare of ['за', 'на', 'без']) {
			const cell = cells.find((c) => c.text === bare);
			expect(cell, bare).toBeDefined();
		}
		// None of them is proposed as a fold: there is exactly one fold and it is
		// «в». The seat still rewrites the notes after it, which is the point, so
		// the control is on the PROPOSAL, not on the map.
		expect(findCliticFolds(score).map((f) => f.cliticText)).toEqual(['в']);
		expect(map[cells[36].eventId]).toBeDefined();
	});

	it('proposes nothing on a score with no lyrics', async () => {
		const stripped = xml.replace(/<lyric[\s\S]*?<\/lyric>/g, '');
		const score = await parse(stripped);
		expect(collectScoreWords(score, 1)).toHaveLength(0);
		expect(findCliticFolds(score)).toEqual([]);
	});

	it('proposes nothing where the engraver already folded the clitic in', async () => {
		// A CORRECT engraving of the same bar: «в бью» in ONE cell, which is what
		// the print does. The clitic's own note is gone from the underlay, so 95
		// cells face 95 slots and nothing is left to seat. This is the control
		// that matters, because it is the file Ilya should leave alone.
		const repaired = xml
			// The `в` note gives up its verse-1 cell entirely.
			.replace(
				'<lyric name="verse" number="1">\n          <syllabic>single</syllabic>\n          <text>в</text>\n        </lyric>\n        ',
				'',
			)
			// and its text joins the host's.
			.replace(
				'<syllabic>begin</syllabic>\n          <text>бью</text>',
				'<syllabic>begin</syllabic>\n          <text>в' + NBSP + 'бью</text>',
			);
		// THE POSITIVE CONTROL ON THE CONTROL. Both substitutions must bite, or a
		// clean result would only prove the fixture was not edited.
		expect(repaired).not.toBe(xml);
		expect(repaired).toContain('<text>в' + NBSP + 'бью</text>');
		expect(repaired).not.toContain('<text>в</text>');
		const score = await parse(repaired);
		// The reconstruction now reads 38 words where the pipeline still reads 39,
		// because «в бьющемся» came out of one cell run. The join rule is what
		// keeps the walk in sync across that, and without it this file would be
		// refused outright rather than passed clean.
		expect(collectScoreWords(score, 1)).toHaveLength(38);
		expect(findCliticFolds(score)).toEqual([]);
	});
});

/**
 * N.111 increment 3, ruled by Dann 2026-09-04 on his walk of `7875892`.
 *
 * (1) Ilya seats automatically at ingest, with no proposal and no button.
 * (2) Inside a seated run an undecided note draws NOTHING, never the file's
 *     stale cell.
 * (4) The file's punctuation travels with the word it belongs to.
 */
describe('N.111 increment 3, the automatic seat', () => {
	it('seats every fold from an empty map, with nothing pressed', async () => {
		const score = await parse(xml);
		const seated = seatCliticFolds(score, {});
		const fold = findCliticFolds(score)[0];
		expect(isCliticSeated(seated, fold)).toBe(true);
		expect(seated[fold.cliticEventId]).toEqual(
			expect.objectContaining({ kind: 'syllable', cyrillic: 'в' + NBSP + 'бью' }),
		);
		// The whole run, and nothing before it.
		expect(Object.keys(seated)).toHaveLength(59);
	});

	it('is idempotent, so a re-upload cannot seat twice', async () => {
		const score = await parse(xml);
		const once = seatCliticFolds(score, {});
		const twice = seatCliticFolds(score, once);
		expect(twice).toEqual(once);
	});

	it('never overwrites a placement the singer already made', async () => {
		const score = await parse(xml);
		const fold = findCliticFolds(score)[0];
		// The singer has decided the clitic's own note for themselves. The fold
		// reads as seated only on its own text, so this one is not seated; what
		// matters is that seating does not silently replace their decision on a
		// note further down the run.
		const mine = seatCliticFolds(score, {});
		const own = fold.seat[5].eventId;
		const edited = { ...mine, [own]: { kind: 'melisma' as const } };
		const again = seatCliticFolds(score, edited);
		expect(again[own]).toEqual({ kind: 'melisma' });
	});

	it('leaves the note the queue cannot reach UNDECIDED, and names it blank', async () => {
		const score = await parse(xml);
		const cells = cellsOf(score);
		const fold = findCliticFolds(score)[0];
		// 96 cells against 95 slots: exactly one note is left over, and it is the
		// last of the piece.
		expect(fold.blanked).toEqual([cells[95].eventId]);
		const seated = seatCliticFolds(score, {});
		expect(seated[cells[95].eventId]).toBeUndefined();
		expect(Object.values(seated).some((p) => p.kind === 'empty')).toBe(false);
		expect(Object.values(seated).some((p) => p.kind === 'melisma')).toBe(false);
	});

	it('draws NOTHING on a blanked note, not the file’s stale cell', async () => {
		const score = await parse(xml);
		const cells = cellsOf(score);
		const fold = findCliticFolds(score)[0];
		const seated = seatCliticFolds(score, {});
		const last = cells[95].eventId;

		// THE POSITIVE CONTROL FIRST, and it is the defect Dann walked. With no
		// blank set the renderer's own fallback stands, so the file's `ка` shows
		// on the note the seat has just moved `ка` off: the `ка ка` close.
		const stale = pairedCyrillic(seated);
		expect(stale?.[last]).toBeUndefined();
		expect(shown(score, seated).slice(91)).toEqual(['о', 'ди', 'но', 'ка', 'ка']);

		// With the blank set the note is mapped to the EMPTY STRING, which the
		// renderer keeps (`??` does not fall through an empty string) and then
		// draws nothing for (`if (cyr || ipa)`).
		const blanked = pairedCyrillic(seated, new Set(fold.blanked));
		expect(blanked?.[last]).toBe('');
	});

	it('blanks the IPA line by the SAME rule as the Cyrillic line', async () => {
		// The walk finding on `c574cf8`. The Cyrillic channel blanked and the IPA
		// channel merely omitted the event, which is not the same thing:
		// `staff-renderer.ts:2463` reads `ipaPreview?.[id] ?? a?.vowel`, so an
		// omission falls through to the analysis's sustained vowel and the note
		// drew a stray `ɑ` over a bare cell. Both channels call `applyBlank` now.
		const score = await parse(xml);
		const cells = cellsOf(score);
		const fold = findCliticFolds(score)[0];
		const blank = new Set(fold.blanked);
		const last = cells[95].eventId;

		// The IPA channel, as the pane builds it: whatever resolved, then the
		// blank pass. The blanked note comes out as the empty string, not absent.
		const ipa: Record<string, string> = { [cells[94].eventId]: 'kɑ' };
		applyBlank(ipa, blank);
		expect(ipa[last]).toBe('');
		expect(Object.prototype.hasOwnProperty.call(ipa, last)).toBe(true);

		// Both channels agree on which ids are blank, by construction.
		const cyr = pairedCyrillic(seatCliticFolds(score, {}), blank);
		expect(cyr?.[last]).toBe('');

		// AND IT NEVER OVERWRITES SOMETHING THAT HAS SOMETHING TO SAY, which is
		// the positive control: a note the singer has decided keeps its text.
		const kept: Record<string, string> = { [last]: 'jɑ' };
		applyBlank(kept, blank);
		expect(kept[last]).toBe('jɑ');
	});

	it('a note the singer seats by hand is no longer blank', async () => {
		const score = await parse(xml);
		const cells = cellsOf(score);
		const fold = findCliticFolds(score)[0];
		const last = cells[95].eventId;
		// The hand puts a syllable on it. `+page.svelte` builds the blank set out
		// of the folds MINUS whatever the map now decides, so this note leaves it.
		const seated = {
			...seatCliticFolds(score, {}),
			[last]: {
				kind: 'syllable' as const,
				cyrillic: 'я',
				ipa: 'jɑ',
				vowel: 'ɑ',
				origin: { lineIndex: 0, wordIndex: 38, slotIndex: 4, word: 'одинокая' },
			},
		};
		const blank = new Set(fold.blanked.filter((id) => !seated[id]));
		expect(blank.size).toBe(0);
		expect(pairedCyrillic(seated, blank)?.[last]).toBe('я');
	});

	it('carries the file’s punctuation onto the re-seated cell', async () => {
		const score = await parse(xml);
		const cells = cellsOf(score);
		const seated = seatCliticFolds(score, {});
		const after = shown(score, seated);

		// `я,` of заветная. The file prints it on cell 48 and the seat moves the
		// word back one note, onto cell 47; the comma travels with it. Before
		// this it read a bare `я` there.
		const before = cells.map((c) => c.text);
		expect(before.slice(45, 49)).toEqual(['за', 'вет', 'на', 'я,']);
		expect(after.slice(45, 49)).toEqual(['вет', 'на', 'я,', 'быст']);

		// EVERY mark the file printed survives the move, and no mark is invented:
		// the two lists are equal, in order.
		const marks = (list: readonly string[]) => list.filter((c) => /[^\p{L}\p{M}]$/u.test(c));
		expect(marks(after)).toEqual(marks(before));
	});

	it('carries nothing where the engraver’s division is not Ilya’s word', async () => {
		// `carryPunctuation` refuses unless the two texts are the same word once
		// punctuation is off both. The negative control is the file's own
		// `про`/`гляд` against Ilya's `прог`/`ляд`, which sits BEFORE the fold and
		// is therefore untouched: the seat rewrites nothing there at all.
		const score = await parse(xml);
		const seated = seatCliticFolds(score, {});
		const cells = cellsOf(score);
		for (const cell of cells.slice(0, 36)) expect(seated[cell.eventId]).toBeUndefined();
		expect(shown(score, seated).slice(13, 17)).toEqual(['не', 'про', 'гляд', 'на']);
		// INSIDE the run the queue's division stands instead, which is the same
		// rule seen from the other side: the seat rewrites the text there, so it
		// is Ilya's `счас`/`тье` rather than the engraver's `сча`/`стье`.
		const pairAt = (list: readonly string[], head: string) => {
			const i = list.indexOf(head);
			return i < 0 ? [] : list.slice(i, i + 2);
		};
		expect(pairAt(cells.map((c) => c.text), 'сча')).toEqual(['сча', 'стье']);
		expect(pairAt(shown(score, seated), 'счас')).toEqual(['счас', 'тье']);
	});

	/* THE REVERT TEST WENT WITH `revertCliticSeat`, N.108-5. It proved that
	   taking the seat back off left a note the singer had decided for
	   themselves alone and put the file's own cells back everywhere the seat
	   had written. The function was removed on Dann's ruling of 2026-09-04,
	   which took the seat's sentence and its Undo out of Corrections and the
	   loupe dock; nothing calls it and nothing can. */

	it('mutates nothing on the way in', async () => {
		const score = await parse(xml);
		const start = {};
		const seated = seatCliticFolds(score, start);
		expect(start).toEqual({});
		expect(Object.keys(seated)).toHaveLength(59);
		expect(seated).not.toBe(start);
	});
});

describe('N.111 increment 3, the hand', () => {
	it('gives the click surface a queue on a lyric-bearing score', async () => {
		// The gap the hand had to close: `buildSlotQueue(lines)` over the SINGER'S
		// transcription is empty on a score that arrives with words, so
		// `SyllableStation` drew nothing and `placeArmedSyllable` returned at its
		// first line. This is the queue `+page.svelte` falls back to.
		const score = await parse(xml);
		const read = readScoreText(score, 1);
		expect(read).not.toBeNull();
		expect(read!.queue).toHaveLength(95);
		expect(read!.queue[0].cyrillic).toBe('Ком');
		expect(read!.queue.at(-1)!.cyrillic).toBe('ка');
	});

	it('is the SAME queue the seat’s origins point into, so a seat is not drift', async () => {
		const score = await parse(xml);
		const queue = readScoreText(score, 1)!.queue;
		const seated = seatCliticFolds(score, {});
		const key = (o: { lineIndex: number; wordIndex: number; slotIndex: number }) =>
			`${o.lineIndex}-${o.wordIndex}-${o.slotIndex}`;
		const inQueue = new Set(queue.map((s) => key(s.origin)));
		for (const p of Object.values(seated)) {
			if (p.kind === 'syllable') expect(inQueue.has(key(p.origin))).toBe(true);
		}
	});

	it('returns nothing to fall back to on a score with no lyrics', async () => {
		const stripped = xml.replace(/<lyric[\s\S]*?<\/lyric>/g, '');
		const score = await parse(stripped);
		expect(readScoreText(score, 1)).toBeNull();
	});

	it('has no я to offer, because the engraving never wrote one', async () => {
		// The fixture's own words end «ночь одинока»: the final `я` of одинокая is
		// missing from the file, so it is missing from the queue too. Ilya cannot
		// know it, which is exactly why the hand exists. The singer supplies it by
		// transcribing the poem, and the queue then comes from their text.
		const score = await parse(xml);
		const queue = readScoreText(score, 1)!.queue;
		expect(queue.at(-1)!.origin.word).toBe('одинока');
		expect(queue.map((s) => s.cyrillic).slice(-4)).toEqual(['о', 'ди', 'но', 'ка']);
	});
});
