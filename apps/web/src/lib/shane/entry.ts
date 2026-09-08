/**
 * entry.ts — the entry grammar, as pure data.
 *
 * N.92 mobile slice 3. Slice 1 gave the diff ALTER and DELETE of what the
 * reader read; this adds the three things Speedy does that a diff of existing
 * notes cannot express: entering an entry where none was read, converting
 * between note and rest, and defining a tuplet over a run.
 *
 * WHY IT IS A SEPARATE FILE. `correction.ts` is the diff's own module and its
 * surface is shipped and walked. Everything here READS and WRITES that map
 * through its own exports, and the only thing this slice adds to `correction.ts`
 * itself is four optional fields and the branch in `applyCorrections` that
 * honours them. A grammar in its own file is one a later slice can read
 * without reading the storage rules first.
 *
 * PURE, and out of the component on purpose, the `note-picker.ts` discipline:
 * every rule below is testable under vitest's node environment with no DOM.
 *
 * `VocalLineEvent` IS NOT TOUCHED. Nothing here adds a field to it. Rests,
 * ties, and tuplets are all shapes it already carries, which is why the diff
 * can express them without the parser or the renderer learning anything new.
 */

import type { NoteBase, Pitch, TupletInfo, VocalLineEvent } from '@ilya/score-parser';
import type { CorrectionMap, NoteCorrection } from './correction';

/**
 * Where the insertion bar stands.
 *
 * ON an entry, or IN a gap between two of them. `after: null` is the gap
 * before the first entry, and the gap after the last entry is the one whose
 * `after` names it. Speedy's bar is always in one of these places, and the
 * schematic's §1 and §4 draw the two states.
 */
export type Cursor = { kind: 'entry'; id: string } | { kind: 'gap'; after: string | null };

/** Two cursors naming the same place. */
export function sameCursor(a: Cursor | null, b: Cursor | null): boolean {
	if (!a || !b) return a === b;
	if (a.kind !== b.kind) return false;
	return a.kind === 'entry' ? a.id === (b as typeof a).id : a.after === (b as { after: string | null }).after;
}

/**
 * Every place the bar can stand, in order: the head gap, then each entry with
 * the gap that follows it.
 *
 * RESTS ARE PLACES. Slice 2's `neighbourId` skipped them, because nothing
 * could be done to a rest; this slice converts one back to a note, so the bar
 * has to be able to stand on it.
 */
export function positions(line: readonly VocalLineEvent[]): Cursor[] {
	const out: Cursor[] = [{ kind: 'gap', after: null }];
	for (const ev of line) {
		out.push({ kind: 'entry', id: ev.id });
		out.push({ kind: 'gap', after: ev.id });
	}
	return out;
}

/**
 * The place `delta` along from this one, or null at either end.
 *
 * Stopping rather than wrapping, on `neighbourId`'s own precedent: a wrap
 * would carry the singer from the end of the piece back to its beginning,
 * which reads as the bar vanishing.
 */
export function stepCursor(
	line: readonly VocalLineEvent[],
	cursor: Cursor,
	delta: 1 | -1,
): Cursor | null {
	const all = positions(line);
	const i = all.findIndex((p) => sameCursor(p, cursor));
	if (i < 0) return null;
	const j = i + delta;
	return j >= 0 && j < all.length ? all[j] : null;
}

/** The entry the bar stands on or immediately after, or null at the head. */
export function previousEntry(
	line: readonly VocalLineEvent[],
	cursor: Cursor,
): VocalLineEvent | null {
	if (cursor.kind === 'gap') {
		if (cursor.after === null) return null;
		return line.find((e) => e.id === cursor.after) ?? null;
	}
	const i = line.findIndex((e) => e.id === cursor.id);
	return i > 0 ? line[i - 1] : null;
}

/**
 * The pitch a freshly entered note arrives at.
 *
 * Dann's ruling of 2026-08-25, adopted from the desk: the note arrives at the
 * previous entry's pitch and the pitch verbs finish it, which turns the rule
 * into recognition instead of recall because the PITCH label says so before
 * the note exists. Where the part has no previous entry the note arrives on
 * the staff's MIDDLE LINE, which is geometry rather than a musical guess.
 *
 * The middle line is the clef's, not a constant: B4 on a treble staff, D3 on a
 * bass staff, B3 where the treble carries an octave-down 8. A part with no
 * previous pitch and no clef takes the treble reading, which is what
 * `chooseClef` defaults to.
 *
 * A REST IS NOT A PITCH. Walking back past rests to the last real note is the
 * behaviour that matches the label: the label names an entry the singer can
 * see, and a rest has nothing to show them.
 */
export function arrivalPitch(
	line: readonly VocalLineEvent[],
	cursor: Cursor,
	clef?: { sign: 'G' | 'F' | 'C'; octaveChange?: number },
): Pitch {
	const stop =
		cursor.kind === 'gap'
			? cursor.after === null
				? -1
				: line.findIndex((e) => e.id === cursor.after)
			: line.findIndex((e) => e.id === cursor.id) - 1;
	for (let i = stop; i >= 0; i--) {
		const p = line[i]?.pitch;
		if (p) return { ...p };
	}
	return middleLine(clef);
}

/** The pitch on the middle line of the staff this clef draws. */
export function middleLine(clef?: { sign: 'G' | 'F' | 'C'; octaveChange?: number }): Pitch {
	if (clef?.sign === 'F') return { step: 'D', alter: 0, octave: 3 };
	const drop = clef?.octaveChange === -1 ? 1 : 0;
	return { step: 'B', alter: 0, octave: 4 - drop };
}

/**
 * The namespace hand-entered ids live in.
 *
 * A COLON, and that is load-bearing rather than decorative.
 * `migrateCorrectionIds` decides an id is the old four-segment reader form by
 * counting DASH-separated segments (`correction.ts:354`), so a synthetic id
 * carrying dashes could be re-keyed into nonsense at load. A colon carries no
 * meaning to that rule, so `hand:7` passes through it untouched and stays
 * itself across every reload.
 */
export const ENTERED_PREFIX = 'hand:';

export function isEnteredId(id: string): boolean {
	return id.startsWith(ENTERED_PREFIX);
}

/**
 * The next free hand id.
 *
 * Counted off the map rather than off a clock, so the same sequence of
 * corrections always produces the same ids and a stored document is
 * reproducible. Ids are never reused: the highest ever issued sets the floor,
 * so an undone entry does not hand its name to the next one and leave a stale
 * reference pointing at a different note.
 */
export function nextEnteredId(map: CorrectionMap): string {
	let top = 0;
	for (const id of Object.keys(map)) {
		if (!isEnteredId(id)) continue;
		const n = Number(id.slice(ENTERED_PREFIX.length));
		if (Number.isFinite(n) && n > top) top = n;
	}
	return `${ENTERED_PREFIX}${top + 1}`;
}

/**
 * Enter an entry at the bar, and report the id to take afterwards.
 *
 * THE ANCHOR IS AN ID, NOT AN INDEX, for the same reason the whole diff is
 * keyed by id: an index into the read moves when the reader's next pass finds
 * one more or one fewer event, and the entry would land somewhere else. The
 * anchor may name a reader event OR another hand-entered one, so a run of
 * entries in one gap is a chain and its order cannot be ambiguous.
 *
 * ENTERING ON AN ENTRY PUTS THE NEW ONE AFTER IT, which is Speedy: the bar
 * bisects a notehead and a duration typed there follows it.
 */
export function enterEntry(
	map: CorrectionMap,
	cursor: Cursor,
	spec: { base: NoteBase; dots: number; pitch?: Pitch },
): { map: CorrectionMap; id: string } {
	const id = nextEnteredId(map);
	const after = cursor.kind === 'gap' ? cursor.after : cursor.id;
	const entry: NoteCorrection = {
		entered: { after },
		base: spec.base,
		dots: spec.dots,
		type: spec.pitch ? 'note' : 'rest',
		...(spec.pitch ? { pitch: spec.pitch } : {}),
	};
	return { map: { ...map, [id]: entry }, id };
}

/** What an entry currently is, correction included. */
export function currentType(ev: VocalLineEvent, map: CorrectionMap): 'note' | 'rest' {
	return map[ev.id]?.type ?? ev.type;
}

/**
 * Convert a note to a rest, or a rest back to a note at the ruled arrival
 * pitch. One verb, both directions, because the singer's question is the same
 * question in both: is there a sound here.
 *
 * A CONVERTED NOTE KEEPS ITS PITCH in the record. The rest draws no pitch, but
 * converting back should return the note that was there rather than the note
 * the arrival rule would guess, and the record is where that memory lives.
 */
export function toggleRest(
	map: CorrectionMap,
	line: readonly VocalLineEvent[],
	id: string,
	fallback: Pitch,
): CorrectionMap {
	const ev = line.find((e) => e.id === id);
	if (!ev) return map;
	const now = currentType(ev, map);
	if (now === 'note') {
		/* THE PITCH IS WRITTEN DOWN ON THE WAY OUT, not left to be found on the
		   way back. `applyCorrections` drops the pitch from a converted rest, so
		   the drawn event no longer carries one, and a record that had never
		   held a pitch of its own would have nothing to return to: MEASURED on
		   the walk, a read G4 converted to a rest and back came back as D4,
		   which was the arrival guess and not the note that was there. */
		return { ...map, [id]: { ...map[id], type: 'rest', pitch: map[id]?.pitch ?? ev.pitch } };
	}
	const remembered = map[id]?.pitch ?? ev.pitch ?? fallback;
	return { ...map, [id]: { ...map[id], type: 'note', pitch: remembered } };
}

/** Whether an entry currently carries a tie to the one after it. */
export function currentTie(ev: VocalLineEvent, map: CorrectionMap): boolean {
	const c = map[ev.id]?.tied;
	if (c) return c === 'start';
	return ev.tied?.type === 'start' || ev.tied?.type === 'continue';
}

/**
 * Whether a tie may start here.
 *
 * Gould's own conditions, and the brief's: a tie joins two soundings of ONE
 * pitch, so the entry after this one has to exist, has to be a note, and has
 * to be the same pitch. Anything else is a slur, which is a different mark
 * with a different meaning, and drawing one under the name of the other would
 * be an engraving error the singer would have to un-learn.
 */
export function canTie(line: readonly VocalLineEvent[], map: CorrectionMap, id: string): boolean {
	const i = line.findIndex((e) => e.id === id);
	if (i < 0 || i + 1 >= line.length) return false;
	const here = line[i];
	const next = line[i + 1];
	if (currentType(here, map) !== 'note' || currentType(next, map) !== 'note') return false;
	const a = map[here.id]?.pitch ?? here.pitch;
	const b = map[next.id]?.pitch ?? next.pitch;
	if (!a || !b) return false;
	return a.step === b.step && a.alter === b.alter && a.octave === b.octave;
}

/** Toggle the tie that starts at this entry. */
export function toggleTie(map: CorrectionMap, ev: VocalLineEvent): CorrectionMap {
	const on = currentTie(ev, map);
	return { ...map, [ev.id]: { ...map[ev.id], tied: on ? 'none' : 'start' } };
}

/** The rhythmic sentence the definition row states. */
export interface TupletDefinition {
	actualNotes: number;
	actualType: NoteBase;
	normalNotes: number;
	normalType: NoteBase;
}

/** Counts run 2 through 9, per the schematic. */
export const TUPLET_COUNTS = [2, 3, 4, 5, 6, 7, 8, 9] as const;

/** The five values, in the fixed order the DURATION station already uses. */
export const TUPLET_VALUES: NoteBase[] = ['16th', 'eighth', 'quarter', 'half', 'whole'];

/** Finale's own default, and the session default until one is defined. */
export const DEFAULT_TUPLET: TupletDefinition = {
	actualNotes: 3,
	actualType: 'eighth',
	normalNotes: 2,
	normalType: 'eighth',
};

/** Step a count within 2..9, stopping at each end rather than wrapping. */
export function stepCount(n: number, delta: 1 | -1): number {
	return Math.min(9, Math.max(2, n + delta));
}

/** Step a duration along the five-value ladder, cycling. */
export function stepValue(base: NoteBase, delta: 1 | -1): NoteBase {
	const i = TUPLET_VALUES.indexOf(base);
	if (i < 0) return TUPLET_VALUES[0];
	const n = TUPLET_VALUES.length;
	return TUPLET_VALUES[(i + delta + n) % n];
}

/**
 * The entries a definition would take: this one and the ones after it, as many
 * as the count names.
 *
 * Returns an empty array where the run does not fit, which is what disables
 * the row rather than silently defining a short group.
 */
export function tupletRun(
	line: readonly VocalLineEvent[],
	id: string,
	count: number,
): VocalLineEvent[] {
	const i = line.findIndex((e) => e.id === id);
	if (i < 0 || i + count > line.length) return [];
	const run = line.slice(i, i + count);
	/* IT DOES NOT CROSS A BARLINE, and that is engraving rather than caution. A
	   tuplet is a division of a beat inside one measure, and the renderer keys
	   its own grouping on the measure (`staff-renderer.ts:841`), so a run that
	   crossed one would be drawn as TWO brackets under one definition.
	   MEASURED on the walk: a five-count run across a barline drew two. */
	const measure = run[0].measureIndex;
	return run.every((e) => e.measureIndex === measure) ? run : [];
}

/**
 * Define a tuplet over the run starting at this entry.
 *
 * THE SENTENCE IS APPLIED WHOLE, which is what makes the row a definition
 * rather than a label. `3 of eighth in the space of 2 of eighth` says the
 * group holds three eighths, so each entry in the run takes that value and
 * that tuplet, and the page re-engraves. Setting the ratio and leaving the
 * values alone would let the drawn bracket disagree with the notes under it.
 *
 * ONE UNDO REVERSES THE WHOLE OPERATION, because the caller snapshots the map
 * and this returns a new one: there is no per-entry step to unwind.
 */
export function applyTuplet(
	map: CorrectionMap,
	line: readonly VocalLineEvent[],
	id: string,
	def: TupletDefinition,
): CorrectionMap {
	const run = tupletRun(line, id, def.actualNotes);
	if (run.length === 0) return map;
	const tuplet: TupletInfo = {
		actualNotes: def.actualNotes,
		normalNotes: def.normalNotes,
		normalType: def.normalType,
	};
	const next = { ...map };
	for (const ev of run) {
		next[ev.id] = { ...next[ev.id], base: def.actualType, dots: 0, tuplet };
	}
	return next;
}

/**
 * What a measure holds against what its time signature asks for, or null when
 * the two agree.
 *
 * Dann's ruling of 2026-08-26: an overfull bar is not blocked, is not re-timed,
 * and the page stays silent about it. The measure tag carries the arithmetic
 * instead, and ONLY when there is a disagreement to carry. A well-timed measure
 * says nothing, so the tag does not become a running commentary on arithmetic
 * that is fine.
 *
 * BOTH NUMBERS ARE IN ONE UNIT, and the unit is whatever makes them both whole.
 * Four quarters and an eighth in 4/4 is nine eighths where eight belong, so it
 * reads `9 of 8` rather than `4.5 of 4`: the ratio is the same fact and only
 * one of the two ways of saying it can be read at a glance. Reduced afterwards,
 * so five quarters in 4/4 reads `5 of 4` rather than `10 of 8`.
 *
 * A SHORT MEASURE COUNTS TOO. The rule is disagreement, not overfullness: a
 * pickup or a measure a deletion left short is as much worth saying, and the
 * arithmetic says which way it went without needing a second sentence.
 */
export function measureFill(
	line: readonly VocalLineEvent[],
	measureIndex: number,
	signature: { beats: number; beatType: number } | undefined,
): { actual: number; expected: number } | null {
	if (!signature || !(signature.beats > 0) || !(signature.beatType > 0)) return null;
	const here = line.filter((e) => e.measureIndex === measureIndex);
	if (here.length === 0) return null;

	let num = 0;
	let den = 1;
	for (const e of here) {
		const f = e.duration.fraction;
		if (!f || !(f.denominator > 0)) return null;
		num = num * f.denominator + f.numerator * den;
		den = den * f.denominator;
		const g = gcd(Math.abs(num), den);
		num /= g;
		den /= g;
	}

	/* THE UNIT IS THE SIGNATURE'S OWN DENOMINATOR, ALWAYS, and it does not move.
	   Dann's ruling of 2026-08-27, from the deploy walk: he watched one measure
	   read `29 of 8`, then `15 of 4` after a note entry, then `31 of 8` after a
	   rest. All three were arithmetically true and the unit had wandered
	   between them, which makes three readings of one bar that cannot be
	   compared with each other.

	   THE CAUSE was here: the unit used to be `lcm(den, beatType)`, where `den`
	   is the denominator of what the measure HOLDS. So the unit was derived
	   from the content and re-derived on every change to it, and adding one
	   eighth to a bar of quarters silently halved the beat the tag counted in.

	   Pinned to `beatType`, the second number is always the signature's own
	   numerator, so a bar in 4 by 4 reads `N of 4` from the first correction to
	   the last and two readings can be held against each other.

	   THE COST, and it is the right one to pay: `actual` may now be fractional,
	   because a bar of eighths in 4 by 4 is not a whole number of quarters.
	   Four quarters and an eighth reads `4.5 of 4` where it used to read
	   `9 of 8`. The old form had two integers and a moving unit; this one has a
	   fixed unit and sometimes a half. A singer can compare the second. */
	const expected = signature.beats;
	const scaled = (num * signature.beatType) / den;
	// Small integers throughout, so this is exact; the rounding is against
	// float residue rather than against a real fraction.
	const actual = Math.round(scaled * 1000) / 1000;
	if (!Number.isFinite(actual)) return null;
	if (actual === expected) return null;
	return { actual, expected };
}

function gcd(a: number, b: number): number {
	return b === 0 ? a || 1 : gcd(b, a % b);
}

/* ── The beat, N.113b item 2 ────────────────────────────────────────
   The loupe's second line names the taken note's beat within its measure, and
   this is the arithmetic behind it. It lives beside `measureFill` because that
   is the other function that judges a measure against its own signature, and
   the two must not drift apart on what a beat is. */

/** Where a position inside a measure falls, counted in the metre's own beats. */
export interface BeatPosition {
	/** The beat, counted from 1. */
	beat: number;
	/** The pulse inside that beat, counted from 1. Absent on the beat itself. */
	pulse?: number;
}

/**
 * COMPOUND METRE, RULED BY DANN 2026-09-08 on his walk of `00149c3`, and it is
 * not optional: **6/8 is two beats of a dotted quarter, not six.**
 *
 * When the numerator is a multiple of 3 and the denominator is 8 or 16, the
 * beat is the dotted unit, which lasts THREE of the denominator's own units,
 * and the measure holds numerator ÷ 3 of them. So 6/8 and 9/8 and 12/8 and
 * 6/16 are compound, and 3/8 is compound too and holds exactly one beat.
 * Every other signature counts the denominator's unit as the beat.
 *
 * 6/4 and 9/4 are NOT compound here. The denominators the rule names are 8 and
 * 16, which is Dann's ruling as he made it, and a 6/4 that a composer means as
 * two dotted halves cannot be told from one meant as six quarters without
 * reading the beaming. Ilya does not guess it.
 */
export function isCompound(signature: { beats: number; beatType: number }): boolean {
	return (
		signature.beats % 3 === 0 &&
		signature.beats > 0 &&
		(signature.beatType === 8 || signature.beatType === 16)
	);
}

/**
 * The beat a position falls on, from its distance past the barline in whole
 * notes.
 *
 * Exact throughout: every value here is a ratio of small integers and nothing
 * is compared as a float, so a dotted quarter in 6/8 lands on beat 2 rather
 * than on 1.9999999999999998.
 *
 * A POSITION THAT IS NOT ON A BEAT reads as the beat plus its pulse within it.
 * The pulse is the beat's own division and nothing finer: THREE in a compound
 * metre, which is Dann's 6/8 case, and TWO in a simple one. Where no whole
 * pulse names the offset, this returns `null` rather than a beat the note is
 * not on, and the second line then says the pitch and the duration and stays
 * silent about the beat.
 *
 * THE DIVISION DOES NOT HALVE ITSELF TO FIT, and refusing to is the point. A
 * pulse ordinal means nothing without the division it counts against, so a rule
 * that divided by two for an eighth and by four for a sixteenth would print
 * `pulse 2` for the and of beat 1 and `pulse 2` for the e of beat 1, on the
 * same page, with nothing on the line to tell them apart. Silence on the beat
 * clause is honest and a colliding ordinal is not.
 *
 * WHAT IT COSTS, stated rather than hidden: a sixteenth-note onset in a simple
 * metre, and any tuplet onset in any metre, draws no beat clause at all.
 */
export function beatAt(
	onset: { numerator: number; denominator: number },
	signature: { beats: number; beatType: number } | undefined,
): BeatPosition | null {
	if (!signature || !(signature.beats > 0) || !(signature.beatType > 0)) return null;
	if (!(onset.denominator > 0) || onset.numerator < 0) return null;

	/* The beat's length in whole notes, as a fraction: three of the signature's
	   own units in a compound metre, one in a simple one. */
	const beatNum = isCompound(signature) ? 3 : 1;
	const beatDen = signature.beatType;

	/* `onset / beatLength`, kept as a ratio of integers. */
	const num = onset.numerator * beatDen;
	const den = onset.denominator * beatNum;
	if (!Number.isSafeInteger(num) || !Number.isSafeInteger(den) || den === 0) return null;

	const beatIndex = Math.floor(num / den);
	const remNum = num - beatIndex * den; // the offset into the beat, as remNum/den
	if (remNum === 0) return { beat: beatIndex + 1 };

	/* The offset, named in pulses of the beat's own division. One pulse is
	   `1 / division` of a beat, so the offset in pulses is
	   `remNum * division / den`, and a fraction there is a position no pulse
	   names. */
	const division = isCompound(signature) ? 3 : 2;
	const p = (remNum * division) / den;
	if (!Number.isInteger(p)) return null;
	return { beat: beatIndex + 1, pulse: p + 1 };
}

/**
 * The beat one entry of a measure stands on, in the line as the singer has
 * corrected it.
 *
 * THE ONSET IS SUMMED HERE RATHER THAN READ OFF THE EVENT, and that is a
 * departure from what `VocalLineEvent.rhythmicPosition` offers. The parser sets
 * that field from its own cursor and `applyCorrections` carries it through
 * unchanged (`correction.ts:371`, the `...ev` spread), so lengthening the first
 * note of a bar leaves every later note in the bar claiming the beat it stood
 * on before the correction. The loupe is the surface the singer makes that
 * correction ON, so it is the last place that may print a stale beat. Summing
 * `duration.fraction` across the measure is the same arithmetic `measureFill`
 * runs three lines up, and it tracks corrections, entered notes and deletions
 * because it reads the corrected line.
 *
 * The two agree on an uncorrected score: the parser's cursor also starts at
 * zero at every barline (`musicxml-parser.ts:418`), including a pickup's.
 */
export function beatOfEntry(
	line: readonly VocalLineEvent[],
	measureIndex: number,
	eventId: string,
	signature: { beats: number; beatType: number } | undefined,
): BeatPosition | null {
	if (!signature) return null;
	let num = 0;
	let den = 1;
	for (const e of line) {
		if (e.measureIndex !== measureIndex) continue;
		if (e.id === eventId) return beatAt({ numerator: num, denominator: den }, signature);
		const f = e.duration.fraction;
		if (!f || !(f.denominator > 0)) return null;
		num = num * f.denominator + f.numerator * den;
		den = den * f.denominator;
		const g = gcd(Math.abs(num), den);
		num /= g;
		den /= g;
	}
	return null;
}

