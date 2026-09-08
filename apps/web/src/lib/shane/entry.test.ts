/**
 * entry.test.ts — the entry grammar, N.92 mobile slice 3.
 *
 * The cases are the brief's own: the bar stands in a gap, a duration entered
 * there arrives at the previous entry's pitch, a rest converts and converts
 * back, a tie is refused where it would be a lie, and a definition applies to
 * a run whole. The storage cases matter as much as the musical ones, because
 * the ship's constraint is that an entered note survives a re-read and a
 * reload exactly as a pitch correction does.
 *
 * No expectation here takes its value from the mechanism under test.
 */

import { describe, it, expect } from 'vitest';
import type { NoteBase, Pitch, VocalLineEvent } from '@ilya/score-parser';
import { applyCorrections, durationFraction, orphanIds, withCorrection, type CorrectionMap } from './correction';
import {
	applyTuplet,
	arrivalPitch,
	canTie,
	currentTie,
	currentType,
	enterEntry,
	ENTERED_PREFIX,
	beatAt,
	beatOfEntry,
	isCompound,
	isEnteredId,
	measureFill,
	middleLine,
	nextEnteredId,
	positions,
	previousEntry,
	sameCursor,
	stepCount,
	stepCursor,
	stepValue,
	toggleRest,
	toggleTie,
	tupletRun,
	type Cursor,
} from './entry';

const P = (step: Pitch['step'], octave: number, alter = 0): Pitch => ({ step, octave, alter });

function ev(id: string, pitch: Pitch | undefined, base: NoteBase = 'quarter'): VocalLineEvent {
	const e: VocalLineEvent = {
		id,
		type: pitch ? 'note' : 'rest',
		measureIndex: 0,
		rhythmicPosition: { fraction: { numerator: 0, denominator: 1 } },
		duration: { base, dots: 0, fraction: durationFraction(base, 0) },
	};
	if (pitch) e.pitch = pitch;
	return e;
}

const LINE = [ev('a', P('F', 3)), ev('b', P('G', 3)), ev('c', P('A', 3))];

describe('where the bar can stand', () => {
	it('offers the head gap, then each entry with the gap after it', () => {
		expect(positions(LINE)).toEqual([
			{ kind: 'gap', after: null },
			{ kind: 'entry', id: 'a' },
			{ kind: 'gap', after: 'a' },
			{ kind: 'entry', id: 'b' },
			{ kind: 'gap', after: 'b' },
			{ kind: 'entry', id: 'c' },
			{ kind: 'gap', after: 'c' },
		]);
	});

	it('stands on a rest, because this slice converts one back', () => {
		const withRest = [ev('a', P('F', 3)), ev('r', undefined)];
		expect(positions(withRest)).toContainEqual({ kind: 'entry', id: 'r' });
	});

	it('steps entry to gap to entry, and stops at both ends', () => {
		const head: Cursor = { kind: 'gap', after: null };
		expect(stepCursor(LINE, head, -1)).toBeNull();
		expect(stepCursor(LINE, head, 1)).toEqual({ kind: 'entry', id: 'a' });
		expect(stepCursor(LINE, { kind: 'entry', id: 'a' }, 1)).toEqual({ kind: 'gap', after: 'a' });
		expect(stepCursor(LINE, { kind: 'gap', after: 'a' }, 1)).toEqual({ kind: 'entry', id: 'b' });
		expect(stepCursor(LINE, { kind: 'gap', after: 'c' }, 1)).toBeNull();
	});

	it('compares two cursors by what they name, not by identity', () => {
		expect(sameCursor({ kind: 'gap', after: 'a' }, { kind: 'gap', after: 'a' })).toBe(true);
		expect(sameCursor({ kind: 'gap', after: null }, { kind: 'entry', id: 'a' })).toBe(false);
		expect(sameCursor(null, null)).toBe(true);
	});

	it('names the entry the bar follows', () => {
		expect(previousEntry(LINE, { kind: 'gap', after: 'b' })?.id).toBe('b');
		expect(previousEntry(LINE, { kind: 'entry', id: 'b' })?.id).toBe('a');
		expect(previousEntry(LINE, { kind: 'gap', after: null })).toBeNull();
		expect(previousEntry(LINE, { kind: 'entry', id: 'a' })).toBeNull();
	});
});

describe('the pitch a fresh note arrives at', () => {
	it('takes the previous entry’s pitch', () => {
		expect(arrivalPitch(LINE, { kind: 'gap', after: 'b' })).toEqual(P('G', 3));
		expect(arrivalPitch(LINE, { kind: 'entry', id: 'c' })).toEqual(P('G', 3));
	});

	it('walks back past a rest to the last real note', () => {
		const line = [ev('a', P('F', 3)), ev('r', undefined), ev('r2', undefined)];
		expect(arrivalPitch(line, { kind: 'gap', after: 'r2' })).toEqual(P('F', 3));
	});

	it('falls to the staff’s middle line where the part has no previous entry', () => {
		expect(arrivalPitch([], { kind: 'gap', after: null })).toEqual(P('B', 4));
		expect(arrivalPitch(LINE, { kind: 'gap', after: null })).toEqual(P('B', 4));
	});

	it('reads the middle line off the clef', () => {
		expect(middleLine({ sign: 'G' })).toEqual(P('B', 4));
		expect(middleLine({ sign: 'F' })).toEqual(P('D', 3));
		expect(middleLine({ sign: 'G', octaveChange: -1 })).toEqual(P('B', 3));
		expect(middleLine(undefined)).toEqual(P('B', 4));
	});
});

describe('entering an entry', () => {
	it('names it in the hand namespace, with no dashes', () => {
		const { id } = enterEntry({}, { kind: 'gap', after: 'a' }, { base: 'eighth', dots: 0, pitch: P('G', 3) });
		expect(id).toBe(`${ENTERED_PREFIX}1`);
		expect(isEnteredId(id)).toBe(true);
		// `migrateCorrectionIds` decides an id is the old reader form by counting
		// dash-separated segments, so a hand id must never carry four of them.
		expect(id.split('-')).toHaveLength(1);
	});

	it('never reuses a number, so an undone entry does not hand on its name', () => {
		const map: CorrectionMap = { [`${ENTERED_PREFIX}4`]: { entered: { after: null } } };
		expect(nextEnteredId(map)).toBe(`${ENTERED_PREFIX}5`);
	});

	it('anchors to the entry the bar follows', () => {
		const { map, id } = enterEntry({}, { kind: 'gap', after: 'b' }, { base: 'quarter', dots: 0, pitch: P('G', 3) });
		expect(map[id].entered).toEqual({ after: 'b' });
	});

	it('puts an entry made ON a note after that note, which is Speedy', () => {
		const { map, id } = enterEntry({}, { kind: 'entry', id: 'b' }, { base: 'quarter', dots: 0, pitch: P('G', 3) });
		expect(map[id].entered).toEqual({ after: 'b' });
	});

	it('enters a rest when no pitch is given', () => {
		const { map, id } = enterEntry({}, { kind: 'gap', after: 'a' }, { base: 'half', dots: 0 });
		expect(map[id].type).toBe('rest');
		expect(map[id].pitch).toBeUndefined();
	});
});

describe('the entered entry reaches the line', () => {
	it('is drawn in its place, with its own duration and pitch', () => {
		const { map } = enterEntry({}, { kind: 'gap', after: 'a' }, { base: 'eighth', dots: 0, pitch: P('E', 4) });
		const out = applyCorrections(LINE, map);
		expect(out.map((e) => e.id)).toEqual(['a', `${ENTERED_PREFIX}1`, 'b', 'c']);
		const made = out[1];
		expect(made.type).toBe('note');
		expect(made.pitch).toEqual(P('E', 4));
		expect(made.duration.base).toBe('eighth');
		expect(made.duration.fraction).toEqual({ numerator: 1, denominator: 8 });
	});

	it('sits at the head when it is anchored there', () => {
		const { map } = enterEntry({}, { kind: 'gap', after: null }, { base: 'quarter', dots: 0, pitch: P('C', 4) });
		expect(applyCorrections(LINE, map).map((e) => e.id)).toEqual([`${ENTERED_PREFIX}1`, 'a', 'b', 'c']);
	});

	it('keeps the order of two entries made into one gap', () => {
		const first = enterEntry({}, { kind: 'gap', after: 'a' }, { base: 'quarter', dots: 0, pitch: P('C', 4) });
		const second = enterEntry(first.map, { kind: 'entry', id: first.id }, { base: 'quarter', dots: 0, pitch: P('D', 4) });
		expect(applyCorrections(LINE, second.map).map((e) => e.id)).toEqual([
			'a', first.id, second.id, 'b', 'c',
		]);
	});

	it('takes its measure from its anchor, and its onset from the anchor’s end', () => {
		const line = [{ ...ev('a', P('F', 3)), measureIndex: 4 }];
		const { map } = enterEntry({}, { kind: 'gap', after: 'a' }, { base: 'quarter', dots: 0, pitch: P('G', 3) });
		const made = applyCorrections(line, map)[1];
		expect(made.measureIndex).toBe(4);
		expect(made.rhythmicPosition.fraction).toEqual({ numerator: 1, denominator: 4 });
	});

	it('survives the deletion of the note it was anchored to', () => {
		const entered = enterEntry({}, { kind: 'gap', after: 'b' }, { base: 'quarter', dots: 0, pitch: P('G', 3) });
		const map = withCorrection(entered.map, 'b', { deleted: true });
		expect(applyCorrections(LINE, map).map((e) => e.id)).toEqual(['a', entered.id, 'c']);
	});

	it('is not counted as an orphan merely for being absent from the read', () => {
		const { map } = enterEntry({}, { kind: 'gap', after: 'a' }, { base: 'quarter', dots: 0, pitch: P('G', 3) });
		expect(orphanIds(LINE, map)).toEqual([]);
	});

	it('IS counted as an orphan when the entry it follows is gone from the read', () => {
		const { map, id } = enterEntry({}, { kind: 'gap', after: 'gone' }, { base: 'quarter', dots: 0, pitch: P('G', 3) });
		expect(orphanIds(LINE, map)).toEqual([id]);
	});

	it('orphans a whole chain when its first anchor is gone', () => {
		const first = enterEntry({}, { kind: 'gap', after: 'gone' }, { base: 'quarter', dots: 0, pitch: P('G', 3) });
		const second = enterEntry(first.map, { kind: 'entry', id: first.id }, { base: 'quarter', dots: 0, pitch: P('A', 3) });
		expect(orphanIds(LINE, second.map).sort()).toEqual([first.id, second.id].sort());
	});

	it('is never pruned for saying nothing, because the record IS the entry', () => {
		const { map, id } = enterEntry({}, { kind: 'gap', after: 'a' }, { base: 'quarter', dots: 0, pitch: P('G', 3) });
		const after = withCorrection(map, id, {});
		expect(after[id]).toBeDefined();
		expect(after[id].entered).toEqual({ after: 'a' });
	});
});

describe('note and rest, one verb both ways', () => {
	it('converts a note to a rest and drops its pitch from the drawing', () => {
		const map = toggleRest({}, LINE, 'b', P('B', 4));
		expect(currentType(LINE[1], map)).toBe('rest');
		const out = applyCorrections(LINE, map);
		expect(out[1].type).toBe('rest');
		expect(out[1].pitch).toBeUndefined();
	});

	it('converts back to the note that was there, not to the arrival guess', () => {
		const toRest = toggleRest({}, LINE, 'b', P('B', 4));
		const back = toggleRest(toRest, LINE, 'b', P('B', 4));
		expect(applyCorrections(LINE, back)[1].pitch).toEqual(P('G', 3));
	});

	it('remembers the pitch even when the round trip goes through the drawn line', () => {
		// The walk's own case: the second conversion reads the CORRECTED line,
		// where the converted rest no longer carries a pitch, so the record has
		// to be the thing that remembers.
		const toRest = toggleRest({}, LINE, 'b', P('B', 4));
		const drawn = applyCorrections(LINE, toRest);
		expect(drawn[1].pitch).toBeUndefined();
		const back = toggleRest(toRest, drawn, 'b', P('D', 4));
		expect(applyCorrections(LINE, back)[1].pitch).toEqual(P('G', 3));
	});

	it('leaves a pitch correction on a rest the READER read alone', () => {
		// N.97b's acceptance test pins this on a real captured page: the id
		// resolves, the correction lands, and the pitch is inert because the
		// renderer draws the rest and never reaches it. Only the singer's own
		// conversion to a rest drops a pitch.
		const line = [ev('r', undefined)];
		const map = withCorrection({}, 'r', { pitch: P('G', 4, 1) });
		expect(applyCorrections(line, map)[0].pitch).toEqual(P('G', 4, 1));
		expect(applyCorrections(line, map)[0].type).toBe('rest');
	});

	it('gives a rest the read carried the arrival pitch when it becomes a note', () => {
		const line = [ev('a', P('F', 3)), ev('r', undefined)];
		const map = toggleRest({}, line, 'r', P('B', 4));
		expect(applyCorrections(line, map)[1].pitch).toEqual(P('B', 4));
	});
});

describe('ties', () => {
	const same = [ev('a', P('G', 3)), ev('b', P('G', 3)), ev('c', P('A', 3))];

	it('is offered between two soundings of one pitch', () => {
		expect(canTie(same, {}, 'a')).toBe(true);
	});

	it('is refused across a different pitch, a rest, and the end of the part', () => {
		expect(canTie(same, {}, 'b')).toBe(false);
		expect(canTie(same, {}, 'c')).toBe(false);
		const withRest = [ev('a', P('G', 3)), ev('r', undefined)];
		expect(canTie(withRest, {}, 'a')).toBe(false);
	});

	it('judges the pitch AFTER corrections, not as read', () => {
		const corrected = withCorrection({}, 'c', { pitch: P('G', 3) });
		expect(canTie(same, corrected, 'b')).toBe(true);
	});

	it('toggles on and off, and reaches the drawn event', () => {
		const on = toggleTie({}, same[0]);
		expect(currentTie(same[0], on)).toBe(true);
		expect(applyCorrections(same, on)[0].tied).toEqual({ type: 'start' });
		const off = toggleTie(on, same[0]);
		expect(currentTie(same[0], off)).toBe(false);
		expect(applyCorrections(same, off)[0].tied).toBeUndefined();
	});

	it('removes a tie the reader found', () => {
		const read = [{ ...ev('a', P('G', 3)), tied: { type: 'start' as const } }, ev('b', P('G', 3))];
		expect(currentTie(read[0], {})).toBe(true);
		const off = toggleTie({}, read[0]);
		expect(applyCorrections(read, off)[0].tied).toBeUndefined();
	});
});

describe('the tuplet definition', () => {
	const three = [ev('a', P('G', 3)), ev('b', P('A', 3)), ev('c', P('B', 3)), ev('d', P('C', 4))];

	it('steps counts within 2 to 9 and stops at each end', () => {
		expect(stepCount(3, 1)).toBe(4);
		expect(stepCount(9, 1)).toBe(9);
		expect(stepCount(2, -1)).toBe(2);
	});

	it('cycles the five values, because a wrong tap costs one more tap', () => {
		expect(stepValue('quarter', 1)).toBe('half');
		expect(stepValue('whole', 1)).toBe('16th');
		expect(stepValue('16th', -1)).toBe('whole');
	});

	it('takes the run the count names, and nothing when it does not fit', () => {
		expect(tupletRun(three, 'a', 3).map((e) => e.id)).toEqual(['a', 'b', 'c']);
		expect(tupletRun(three, 'c', 3)).toEqual([]);
	});

	it('applies the sentence whole: the value and the ratio, to every entry', () => {
		const def = { actualNotes: 3, actualType: 'eighth' as NoteBase, normalNotes: 2, normalType: 'eighth' as NoteBase };
		const map = applyTuplet({}, three, 'a', def);
		const out = applyCorrections(three, map);
		for (const id of ['a', 'b', 'c']) {
			const e = out.find((x) => x.id === id)!;
			expect(e.duration.base, id).toBe('eighth');
			expect(e.duration.tuplet, id).toEqual({ actualNotes: 3, normalNotes: 2, normalType: 'eighth' });
			// Three eighths in the space of two: each sounds two thirds of an eighth.
			expect(e.duration.fraction, id).toEqual({ numerator: 1, denominator: 12 });
		}
		expect(out.find((x) => x.id === 'd')!.duration.tuplet).toBeUndefined();
	});

	it('carries a ratio that is not three in the space of two', () => {
		const def = { actualNotes: 5, actualType: 'quarter' as NoteBase, normalNotes: 4, normalType: 'quarter' as NoteBase };
		const five = [...three, ev('e', P('D', 4))];
		const map = applyTuplet({}, five, 'a', def);
		const e = applyCorrections(five, map)[0];
		// Five quarters in the space of four: each sounds a fifth of a whole.
		expect(e.duration.fraction).toEqual({ numerator: 1, denominator: 5 });
	});

	it('refuses a run that would cross a barline, because the bracket would split', () => {
		const across = [
			{ ...ev('a', P('G', 3)), measureIndex: 0 },
			{ ...ev('b', P('A', 3)), measureIndex: 0 },
			{ ...ev('c', P('B', 3)), measureIndex: 1 },
		];
		expect(tupletRun(across, 'a', 3)).toEqual([]);
		expect(tupletRun(across, 'a', 2).map((e) => e.id)).toEqual(['a', 'b']);
	});

	it('leaves the map alone where the run does not fit', () => {
		const def = { actualNotes: 9, actualType: 'eighth' as NoteBase, normalNotes: 8, normalType: 'eighth' as NoteBase };
		expect(applyTuplet({}, three, 'a', def)).toEqual({});
	});
});

describe('what a measure holds against its signature', () => {
	const FOUR_FOUR = { beats: 4, beatType: 4 };
	const bar = (n: number, base: NoteBase) =>
		Array.from({ length: n }, (_, i) => ev(`m${i}`, P('G', 3), base));

	it('says nothing when the measure agrees with its signature', () => {
		expect(measureFill(bar(4, 'quarter'), 0, FOUR_FOUR)).toBeNull();
	});

	it('counts an overfull bar in the signature’s own beat', () => {
		expect(measureFill(bar(5, 'quarter'), 0, FOUR_FOUR)).toEqual({ actual: 5, expected: 4 });
	});

	it('counts against the signature’s own beat, and does not reduce', () => {
		expect(measureFill(bar(10, 'eighth'), 0, FOUR_FOUR)).toEqual({ actual: 5, expected: 4 });
		// Six whole notes is twenty-four quarters. Reduced it would read `6 of
		// 1`, which is true and names no number the page shows.
		expect(measureFill(bar(6, 'whole'), 0, FOUR_FOUR)).toEqual({ actual: 24, expected: 4 });
	});

	it('HOLDS THE UNIT STILL as the measure changes under it', () => {
		// Dann's own three readings of one bar, from the deploy walk: the unit
		// used to be derived from what the measure held, so it halved when an
		// eighth arrived. The second number is the signature's now, and it does
		// not move between one interaction and the next.
		const quarters = bar(15, 'quarter');
		const plusEighth = [...quarters, ev('x', P('G', 3), 'eighth')];
		const plusTwo = [...plusEighth, ev('y', P('G', 3), 'eighth')];
		expect(measureFill(quarters, 0, FOUR_FOUR)).toEqual({ actual: 15, expected: 4 });
		expect(measureFill(plusEighth, 0, FOUR_FOUR)).toEqual({ actual: 15.5, expected: 4 });
		expect(measureFill(plusTwo, 0, FOUR_FOUR)).toEqual({ actual: 16, expected: 4 });
		for (const line of [quarters, plusEighth, plusTwo]) {
			expect(measureFill(line, 0, FOUR_FOUR)!.expected).toBe(4);
		}
	});

	it('reports a half where the bar is not a whole number of beats', () => {
		const line = [...bar(4, 'quarter'), ev('x', P('G', 3), 'eighth')];
		expect(measureFill(line, 0, FOUR_FOUR)).toEqual({ actual: 4.5, expected: 4 });
	});

	it('reads Dann’s own example back', () => {
		expect(measureFill(bar(7, 'eighth'), 0, { beats: 6, beatType: 8 })).toEqual({
			actual: 7,
			expected: 6,
		});
	});

	it('says so when a measure is SHORT, not only when it is overfull', () => {
		expect(measureFill(bar(3, 'quarter'), 0, FOUR_FOUR)).toEqual({ actual: 3, expected: 4 });
	});

	it('answers the measure’s OWN signature, so a metre change is judged right', () => {
		expect(measureFill(bar(6, 'eighth'), 0, { beats: 6, beatType: 8 })).toBeNull();
		expect(measureFill(bar(7, 'eighth'), 0, { beats: 6, beatType: 8 })).toEqual({ actual: 7, expected: 6 });
	});

	it('counts only the entries of the measure it was asked about', () => {
		const line = [
			...bar(4, 'quarter').map((e) => ({ ...e, measureIndex: 0 })),
			...bar(5, 'quarter').map((e) => ({ ...e, id: e.id + 'b', measureIndex: 1 })),
		];
		expect(measureFill(line, 0, FOUR_FOUR)).toBeNull();
		expect(measureFill(line, 1, FOUR_FOUR)).toEqual({ actual: 5, expected: 4 });
	});

	it('says nothing where there is no signature or no measure', () => {
		expect(measureFill(bar(5, 'quarter'), 0, undefined)).toBeNull();
		expect(measureFill(bar(5, 'quarter'), 9, FOUR_FOUR)).toBeNull();
	});
});

/* ── The beat, N.113b item 2 ──────────────────────────────────────── */

describe('the beat a position falls on', () => {
	const F = (numerator: number, denominator: number) => ({ numerator, denominator });

	/* The five cases the brief names, and they are Dann's ruling of 2026-09-08
	   restated as arithmetic. Every expectation here is read off the metre, not
	   off the function. */
	it('counts the brief’s five cases', () => {
		expect(beatAt(F(1, 4), { beats: 4, beatType: 4 })).toEqual({ beat: 2 });
		expect(beatAt(F(3, 8), { beats: 6, beatType: 8 })).toEqual({ beat: 2 });
		expect(beatAt(F(1, 8), { beats: 6, beatType: 8 })).toEqual({ beat: 1, pulse: 2 });
		expect(beatAt(F(1, 8), { beats: 3, beatType: 8 })).toEqual({ beat: 1, pulse: 2 });
		expect(beatAt(F(9, 8), { beats: 12, beatType: 8 })).toEqual({ beat: 4 });
	});

	it('calls a signature compound only where Dann’s rule does', () => {
		expect(isCompound({ beats: 6, beatType: 8 })).toBe(true);
		expect(isCompound({ beats: 9, beatType: 8 })).toBe(true);
		expect(isCompound({ beats: 12, beatType: 8 })).toBe(true);
		expect(isCompound({ beats: 6, beatType: 16 })).toBe(true);
		expect(isCompound({ beats: 3, beatType: 8 })).toBe(true);
		// Not compound: the numerator is not a multiple of three.
		expect(isCompound({ beats: 4, beatType: 8 })).toBe(false);
		expect(isCompound({ beats: 7, beatType: 8 })).toBe(false);
		// Not compound: the denominator is neither 8 nor 16, so 6/4 is six
		// quarters and Ilya does not read the beaming to guess otherwise.
		expect(isCompound({ beats: 6, beatType: 4 })).toBe(false);
		expect(isCompound({ beats: 3, beatType: 4 })).toBe(false);
	});

	it('holds 3/8 to ONE beat, so its every position is inside beat 1', () => {
		expect(beatAt(F(0, 1), { beats: 3, beatType: 8 })).toEqual({ beat: 1 });
		expect(beatAt(F(1, 8), { beats: 3, beatType: 8 })).toEqual({ beat: 1, pulse: 2 });
		expect(beatAt(F(2, 8), { beats: 3, beatType: 8 })).toEqual({ beat: 1, pulse: 3 });
	});

	it('counts a compound bar’s beats in dotted units, never in its denominator’s', () => {
		const SIX_EIGHT = { beats: 6, beatType: 8 };
		// Six eighths, one at a time: two beats, three pulses each.
		expect(beatAt(F(0, 8), SIX_EIGHT)).toEqual({ beat: 1 });
		expect(beatAt(F(1, 8), SIX_EIGHT)).toEqual({ beat: 1, pulse: 2 });
		expect(beatAt(F(2, 8), SIX_EIGHT)).toEqual({ beat: 1, pulse: 3 });
		expect(beatAt(F(3, 8), SIX_EIGHT)).toEqual({ beat: 2 });
		expect(beatAt(F(4, 8), SIX_EIGHT)).toEqual({ beat: 2, pulse: 2 });
		expect(beatAt(F(5, 8), SIX_EIGHT)).toEqual({ beat: 2, pulse: 3 });
		// And 12/8 is four of them, which is the case that separates this rule
		// from counting the denominator: twelve eighths is NOT twelve beats.
		expect(beatAt(F(11, 8), { beats: 12, beatType: 8 })).toEqual({ beat: 4, pulse: 3 });
	});

	it('divides a simple beat in two and nothing finer', () => {
		expect(beatAt(F(1, 8), { beats: 4, beatType: 4 })).toEqual({ beat: 1, pulse: 2 });
		expect(beatAt(F(3, 8), { beats: 4, beatType: 4 })).toEqual({ beat: 2, pulse: 2 });
		expect(beatAt(F(1, 4), { beats: 3, beatType: 4 })).toEqual({ beat: 2 });
		expect(beatAt(F(1, 2), { beats: 2, beatType: 2 })).toEqual({ beat: 2 });
		expect(beatAt(F(1, 4), { beats: 2, beatType: 2 })).toEqual({ beat: 1, pulse: 2 });
	});

	it('says nothing rather than a pulse ordinal that would collide', () => {
		// The e and the a of beat 1 in 4/4. Naming either of them `pulse 2` or
		// `pulse 4` would put two different offsets under one ordinal, so the
		// beat clause drops and the line says the pitch and the duration.
		expect(beatAt(F(1, 16), { beats: 4, beatType: 4 })).toBeNull();
		expect(beatAt(F(3, 16), { beats: 4, beatType: 4 })).toBeNull();
		expect(beatAt(F(1, 16), { beats: 6, beatType: 8 })).toBeNull();
	});

	it('says nothing rather than a beat the note is not on', () => {
		// A triplet eighth into 4/4 lands on no pulse of the beat.
		expect(beatAt(F(1, 12), { beats: 4, beatType: 4 })).toBeNull();
		expect(beatAt(F(0, 1), undefined)).toBeNull();
		expect(beatAt(F(0, 1), { beats: 0, beatType: 4 })).toBeNull();
		expect(beatAt(F(1, 0), { beats: 4, beatType: 4 })).toBeNull();
	});

	it('carries past the bar rather than wrapping, so an overfull bar reads on', () => {
		// Five quarters into 4/4 is beat 6. The tag already says the bar is
		// overfull; the beat does not lie about where the entry stands.
		expect(beatAt(F(5, 4), { beats: 4, beatType: 4 })).toEqual({ beat: 6 });
	});
});

describe('the beat one entry of a measure stands on', () => {
	const FOUR_FOUR = { beats: 4, beatType: 4 };
	const line = [
		ev('a', P('G', 3)),
		ev('b', P('A', 3)),
		{ ...ev('c', P('B', 3), 'eighth'), measureIndex: 1 },
		{ ...ev('d', P('C', 4), 'eighth'), measureIndex: 1 },
	];

	it('counts from the barline of the entry’s own measure', () => {
		expect(beatOfEntry(line, 0, 'a', FOUR_FOUR)).toEqual({ beat: 1 });
		expect(beatOfEntry(line, 0, 'b', FOUR_FOUR)).toEqual({ beat: 2 });
		expect(beatOfEntry(line, 1, 'c', FOUR_FOUR)).toEqual({ beat: 1 });
		expect(beatOfEntry(line, 1, 'd', FOUR_FOUR)).toEqual({ beat: 1, pulse: 2 });
	});

	it('follows a corrected duration, which `rhythmicPosition` does not', () => {
		// Every event above carries `rhythmicPosition` 0, and the second note
		// still reads beat 2 off the sum. Lengthen the first note to a half and
		// the second moves to beat 3, which is what the singer sees.
		const corrected = [{ ...line[0], duration: { base: 'half' as const, dots: 0, fraction: durationFraction('half', 0) } }, line[1]];
		expect(beatOfEntry(corrected, 0, 'b', FOUR_FOUR)).toEqual({ beat: 3 });
		expect(line[1].rhythmicPosition.fraction).toEqual({ numerator: 0, denominator: 1 });
	});

	it('says nothing where the entry, the measure or the signature is missing', () => {
		expect(beatOfEntry(line, 0, 'zz', FOUR_FOUR)).toBeNull();
		expect(beatOfEntry(line, 9, 'a', FOUR_FOUR)).toBeNull();
		expect(beatOfEntry(line, 0, 'a', undefined)).toBeNull();
	});
});
