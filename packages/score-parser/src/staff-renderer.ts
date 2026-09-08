/**
 * Bespoke SVG staff renderer for the isolated vocal melody plus Shane's
 * Appendix B analytical markup. Chosen over driving an engraver (OSMD /
 * Verovio) by the renderer spike (2026-07-12): the turning-pitch
 * noteheads and red crossing boxes are not notation primitives, so any
 * engraver route needs a fragile coordinate-mapping overlay anyway; the
 * melody-only staff is bounded enough to render ourselves and own every
 * coordinate (and every `data-event-id` for the correction UI).
 *
 * This is the production layout engine (increment 4). It handles:
 *   - proportional rhythmic spacing (x by onset time, with a minimum gap);
 *   - multiple measures with barlines;
 *   - a clef (treble, treble-8vb, or bass; source clef when captured,
 *     else the tessitura heuristic — v37 §A.17) and the key signature
 *     at that clef's standard positions;
 *   - accidentals (sung line and turning layer) with per-measure carry and
 *     the measure-opening barline nudge (Kimi's collision rule);
 *   - ledger lines, for the sung head and for a turning head outside the
 *     stave alike (N.107, one shared `drawLedgerLines`); rests; flags for
 *     unbeamed short notes;
 *   - beaming, derived by beat (Dann's ruling, 2026-07-12): the data model
 *     carries no source beams, and the forced semantic stems would break an
 *     engraver's groups anyway, so groups are computed here — flagged notes
 *     joined within one measure, one beat (compound-metre aware), and one
 *     timbre, with multi-level beams and stubs for mixed values;
 *   - tuplet brackets and numerals in standard black (Dann's ruling,
 *     2026-07-12: the appendix sample's blue is engraving cosmetics);
 *   - the four analytical marks (forced semantic stems, lavender turning-pitch
 *     noteheads, red crossing squircles, dual Cyrillic/IPA underlay) and the
 *     `#` phonation break. The turning layer (Mitton 2020, App. B pref.
 *     p. 206) renders in Calm Authority's lavender (#8E7E9B, the
 *     `--deeper-lavender` app
 *     token; see the TURNING_COLOUR constant below), noteheads and
 *     accidentals in one colour, with
 *     its own per-measure accidental carry state independent of the sung
 *     line (Dann's rulings, 2026-07-12);
 *   - TWO RENDERING MODES: pass `options.font` (a `PreparedSmuflFont`) and
 *     `options.fontFamily` for production SMuFL glyph output (clef, heads,
 *     accidentals, rests, flags as font glyphs; stems from the font's
 *     anchors; thicknesses from its engraving defaults). Omit `font` for
 *     the primitive shapes, which stay byte-stable for sandbox tests.
 *
 * Deliberately deferred to later increments: multi-system pagination onto
 * the letter Paper page; wiring to live overlay data and the correction-UI
 * editable bindings.
 */

import type { Fraction, NoteBase, ParsedScore, Pitch, TimeSignature, VocalLineEvent } from './types';
import type { AnalyzedEvent, AnalyzedScore } from './analysis-types';
import { smuflFontSizePx, type PreparedSmuflFont, type RequiredGlyphName } from './smufl-metadata';
import { chooseClef, type RenderClef } from './clef-select';
import { estimateCyrillicWidthPx, estimateIpaWidthPx } from './underlay-widths';

/**
 * N.10b: the sigla for a syllable the resolver declined to transcribe.
 *
 * DANN'S RULING, 8 August 2026, and his reasoning is the point: "Human beings
 * will see a question mark sigla and know to seek out a legend. That's what is
 * important here, not the semantics of the sigla itself." A typeset `[?]` was
 * built first and he rejected it, correctly: set in a text face on the IPA
 * line it reads as content, and nothing about it says look this up. A drawn
 * mark in a colour the transcription never uses reads as apparatus.
 *
 * It is the same traced question mark `PageFooter.svelte` already draws for
 * Transcribe's `inferred`, deliberately reused rather than invented. That
 * carries a known ambiguity, put to Dann and accepted by him: on Transcribe
 * the glyph means "the engine had no entry and guessed", here it means
 * "nothing was printed at all". He ruled the recognisability worth more than
 * the distinction.
 *
 * The path lives HERE, in the module that draws it on the page, and
 * `PageFooter` imports it for the legend circle, so the mark and its legend
 * entry cannot drift into being two different glyphs.
 *
 * `--deeper-lavender`, `app.css:69`. Fit's own accent, and a colour the
 * underlay's ink and the acoustic marks both leave alone.
 */
export const WITHHELD_SIGLA = {
	/** The traced glyph's own coordinate box, from `PageFooter.svelte`. */
	x: 208,
	y: 315,
	w: 493,
	h: 751,
	path: 'M426.5 348.1c-53.8 4.4-96.8 20.7-133.1 50.3-29.3 23.9-51.8 62.6-59.9 103.1-2.1 10.7-4.5 30.4-4.5 37.7v2.8h125.9l.5-3.3c.3-1.7 1-6.6 1.6-10.7 2.7-18.4 10.2-33.1 23.5-46.6 16.8-16.8 34.3-24.3 61.2-26 38.3-2.5 72.4 14.5 86.7 43.1 5.9 11.7 7.1 17.9 7 35.5 0 16.9-1.7 25.8-6.8 37.4-7.6 17.3-25.5 34.2-57.4 54.6-41.3 26.4-54.8 36.7-66.3 50.6-25.5 30.8-32.8 56.2-31.3 108.6l.7 22.8h123.4l.6-18.8c.6-21.6 2.2-29.7 8.7-42.8 4.6-9.4 14.3-21.1 25.1-30.2 7.7-6.6 31.6-22.8 51-34.6 50.9-31.1 79.7-68 89.8-115.1 8.2-38 3.5-81.4-12.4-114-23.1-47.4-71.3-82.9-132.5-97.4-29.8-7.1-68.2-9.7-101.5-7m2 538c-18.7 1.7-38 12-50 26.7-11.4 13.7-15.9 26.8-15.9 45.7 0 8.3.6 14 1.8 18.5 6.2 22.6 23.2 41.1 45.5 49.4 9.8 3.6 15.9 4.6 29 4.6 13.8 0 24.8-2.6 36.2-8.6 38.6-20.3 51-69.7 26.3-105-11.7-16.7-32.4-29.1-51.4-30.9-3.6-.3-8.1-.7-10-.9s-7.1 0-11.5.5',
	colour: '#8E7E9B',

	// THE RING, and it is the sigla's graphic identity rather than decoration.
	// Dann, 8 August: "Our siglas are enclosed in a circle. This is a visual
	// identifier." Measured off the two places that already draw one, which
	// agree exactly: `WordStack.svelte:326-338`, the inline mark on Transcribe's
	// page, and `PageFooter.svelte`'s `.legend-circle`. Both are a 16px circle
	// with a 1px ring around a 9px glyph.
	//
	// SCALED TO 75 PERCENT HERE, ratio preserved, because 16px does not fit this
	// page: `cyrY = ipaY + 16`, so a full-size ring centred on the IPA line
	// would sit on the Cyrillic beneath it. 16:1:9 becomes 12:0.75:6.75.
	/** Outer diameter of the ring. 16 x 0.75. */
	diameterPx: 12,
	/** Ring thickness. 1 x 0.75. */
	ringPx: 0.75,
	/** Glyph height inside the ring. 9 x 0.75, holding the 9:16 proportion. */
	glyphPx: 6.75,
	/**
	 * How far the ring's centre sits above the IPA baseline, so the mark reads
	 * as occupying the same optical band as the transcription it stands in for
	 * rather than hanging below it. Leaves the ring's foot about 4.5px clear of
	 * the Cyrillic line's cap.
	 */
	baselineLiftPx: 3.5,
} as const;

/**
 * The ink width the spacing engine must reserve: the ring, not the glyph.
 *
 * 12px, which is within a whisker of the 12.72px the typeset `[?]` measured,
 * so the column spacing Dann walked on 8 August is unchanged by the switch to
 * a sigla. Still wider than a one-letter Cyrillic syllable (`я`, 7.31px),
 * which is why it is fed to `underlayHalfWidth` at all.
 */
export const WITHHELD_SIGLA_WIDTH_PX = WITHHELD_SIGLA.diameterPx;

/**
 * Underlay type sizes. Both are still absolute px that do NOT scale with
 * `lineGap`, which `claude/e18-thread-opener_v1_2026-07-29.md` §3.2 recorded
 * on 29 July as one of eight such sites; the correct value against Gould r12
 * (lyric x-height about one stave-space) has never been measured and is held
 * pending a render at three `lineGap` values. Named here so the drawing sites
 * and the width measurement cannot disagree, and so that when they are
 * finally scaled there is one place to change.
 */
const CYR_FONT_PX = 12.5;
const IPA_FONT_PX = 12;

/** Extra room at a barline, shared with `page-layout.ts`'s width estimate. */
export const BARLINE_ROOM = 14;

/**
 * The air between a courtesy accidental and each of its parentheses, in stave
 * spaces (N.102 increment 1a, Dann's ruling 2026-09-02).
 *
 * Increment 1 abutted the three glyphs at their bounding boxes, and abutted is
 * what Finale Maestro's own boxes make it: the parenthesis box ends where its
 * ink ends, so a sharp's outer stroke and a parenthesis's inner stroke meet
 * with nothing between them. This is the gap Dann ruled in.
 *
 * JUDGEMENT, and it carries no rule number. The Gould extraction is not on
 * this machine, so 0.2 is Dann's value and not a citation. It is exported so
 * the tests read the same number the renderer draws, rather than repeating a
 * literal that could drift from it.
 *
 * THE GAP IS THE FIRST THING TO GIVE. Where the measure-opening floor binds,
 * the gap closes by exactly as much as the floor asks, down to nothing, before
 * the cluster is allowed to move right off the accidental's own position.
 */
export const COURTESY_GAP_SP = 0.2;

/**
 * The air between the sung unit's right ink edge and the turning unit's left
 * ink edge, in stave spaces (N.106, Dann's ruling 2026-09-02).
 *
 * It is added to the 1.6 px the two-voice offset has always carried, so the
 * displacement is `1.6 + TURNING_CLEARANCE_SP x lineGap` and the two numbers
 * stay legible as what they are: the old offset, and the air Dann asked for
 * on top of it.
 *
 * JUDGEMENT, and it carries no rule number. Gould's own two-voice spacing is
 * a chord's, and N.106 is precisely the ruling that this layer is not a
 * chord. Exported so the tests read the same number the renderer draws.
 */
export const TURNING_CLEARANCE_SP = 0.25;

export interface StaffRenderOptions {
  staffMidY?: number;   // y of the middle staff line
  lineGap?: number;     // px between adjacent staff lines
  leftMargin?: number;  // x where the staff content begins (after clef/key)
  pxPerWhole?: number;  // horizontal px per whole-note of onset time
  minGap?: number;      // minimum px between successive events
  /**
   * Render clef. Omit to let the renderer assess the input and choose
   * (source clef when captured, else the tessitura heuristic; v37
   * §A.17). `paginateScore` resolves this ONCE per score so systems
   * never flip clef mid-piece.
   */
  clef?: RenderClef;
  /** SMuFL mode: prepared font metadata. Omit for primitive shapes. */
  font?: PreparedSmuflFont;
  /** CSS font-family for SMuFL glyph text (must match the loaded FontFace). */
  fontFamily?: string;
  /**
   * Per event id, the full syllable IPA for the underlay's NEAR line, the
   * one closest to the stave since the 2026-08-05 swap
   * (Dann, 2026-07-17: every lyric Fit underlays gets two lines, IPA then
   * Cyrillic; "one vowel per syllable per rhythmic value" is the rule,
   * consonants included, never just the acoustic vowel). Verbatim from
   * Ilya's GraysonEngine; the renderer never synthesizes IPA (Dann's
   * tethering requirement, 2026-07-12). In production this is built by
   * `buildUnderlayResolvers` (`apps/web/.../vowel-resolver.ts`) walking
   * every event through its `.ipa` resolver; the demo fixture supplies its
   * own placeholder strings for the font lab instead. Not to be confused
   * with `SyllableInfo.verses`, which carries real sung text for OTHER
   * verses (§A.86) and must never be read as an IPA source (the two were
   * conflated here until a 2026-07-17 fix). WIRED since N.5:
   * `VoiceProfilePane.svelte` passes it into `paginateScore`, and
   * `renderDemo` populates it too. This comment claimed the opposite until
   * N.10 corrected it on 8 August 2026.
   */
  ipaPreview?: Record<string, string>;
  /**
   * N.10b: the events whose syllable the resolver DECLINED to transcribe.
   *
   * Dann's ruling of 7 August, E.29 §5.1 ruled A: a withheld syllable
   * carries a mark at the syllable itself. `vowel-resolver.ts` abstains
   * where the score's per-note syllable count and the engine's per-word
   * count disagree, and that abstention is correct. What it was not, until
   * now, is visible: the syllable keeps its Cyrillic and simply has nothing
   * above it, which is why `RULE-the-page-walk.md` needed an item to catch
   * it and why Dann found it with a checklist rather than with his eye.
   *
   * The mark is drawn only where no IPA reached the column by any path, so
   * it can never displace a transcription, and it is fed into
   * `underlayHalfWidth` below, because ink the spacing engine cannot see is
   * ink that collides.
   */
  withheldIpa?: ReadonlySet<string>;
  /**
   * N.113. The notes the SINGER marked as a melisma continuation.
   *
   * WHY THE RENDERER NEEDS TELLING AT ALL. Its own melisma detection reads the
   * FILE: a note carrying `ev.syllable` followed by notes carrying none opens a
   * run. That is right for the engraving and blind to the singer, because on a
   * lyric-bearing score every note carries a syllable, so no run is ever found,
   * and on a score with no underlay none is. `{ kind: 'melisma' }` has existed
   * in the pairing map since N.55b and nothing has ever drawn it.
   *
   * IT IS NOT THE SAME AS A BLANK, and keeping the two apart is the whole
   * reason this is a set of its own rather than an inference from empty text.
   * A blanked note (N.111's seated run, and rider 0's vacated tail) draws
   * nothing and extends nothing: the singer removed the word. A marked note
   * draws nothing and DOES extend: the singer is sustaining the word. Read off
   * an empty cell the two are identical, and one of them would grow an extender
   * it has no business having.
   *
   * A marked note draws no Cyrillic, no IPA and no withheld siglum, and this
   * file enforces that itself rather than trusting the caller to have blanked
   * it, so the two facts cannot come apart.
   */
  melismaPreview?: ReadonlySet<string>;
  /**
   * N.55b, R6 (Dann, E.47). Per event id, the Cyrillic the SINGER paired
   * to this note, overriding `ev.syllable?.text`. A score that arrived
   * with no lyric underlay carries no Cyrillic at all by the data model
   * (`types.ts:470-479`), so without this channel a pairing can put IPA
   * under a note and never the word it transcribes. Fed into
   * `underlayHalfWidth` for the same reason `withheldIpa` is: ink the
   * spacing engine cannot see is ink that collides.
   */
  cyrPreview?: Record<string, string>;
  /**
   * True only for the system that ends the PIECE. Gould r96 gives the
   * beam-thick-plus-thin final barline to the end of a movement, and r224
   * restates it: only the bar that actually ends the piece takes it. Before
   * this option every system drew one, so every system announced the song was
   * over (Dann's ruling, 2026-08-06). `paginateScore` sets it on the last
   * slice; a standalone render leaves it false and gets an ordinary barline.
   */
  finalBarline?: boolean;
  /**
   * The width the system must fill (N.6b-2). Dann's ruling, 2026-08-06:
   * every system is the SAME width and touches both margins. The renderer
   * lays the columns out at their minimum widths first, then stretches the
   * whole span to land exactly here.
   *
   * Stretch only, never compress: the minimums come from `columnAdvance`,
   * which enforces Gould r235's half-stave-space floor, so squeezing below
   * them would put the collisions back. A system whose natural width already
   * exceeds the target is left alone and overflows, which is visible rather
   * than silent.
   *
   * Omit for a standalone render, which then sizes to its content.
   */
  targetWidth?: number;
  /**
   * The original measure index this slice starts at (N.104).
   *
   * `sliceScore` rebases a slice's measure indices to start at 0, so a
   * renderer that printed its own indices would print the slice's scale while
   * `data-system` prints the score's. Everything else on the page already
   * uses the score's scale: `data-system` carries `fromMeasure-toMeasure` in
   * original indices, and an event id carries the original measure index
   * because the parser mints it. `paginateScore` sets this to the slice's
   * `fromMeasure` so `data-tacet` joins them rather than opening a second
   * scale. A standalone render leaves it 0, which is the truth there.
   */
  measureOffset?: number;
  /**
   * The sung line's accidental state at the END of the measure before this
   * slice's first measure (N.102 increment 1b), keyed as `measureAcc` keys it.
   *
   * WHY A SLICE NEEDS TELLING. `paginateScore` renders every system through its
   * own call on a slice whose measure indices `sliceScore` has rebased to 0, so
   * the measure before a system break is drawn by a different call and its
   * closing state is not reachable from inside this one. Until this option, no
   * courtesy accidental was ever drawn on a measure that opens a system, and a
   * cancellation a singer needs was silently lost at every line break.
   *
   * `accidentalStateAtEndOf` computes it, and `paginateScore` passes it. A
   * standalone render omits it, which is the truth there: nothing precedes the
   * measures it holds.
   *
   * IT SEEDS THE FIRST MEASURE AND NOTHING ELSE. Every later measure in the
   * slice takes its carry from the measure this call itself just drew.
   */
  incomingAccidentals?: Record<string, number>;
}

// `finalBarline` joins font/clef/ipaPreview in the Omit: it is read straight
// off `options` rather than defaulted here, and leaving it out of the Omit
// makes `Required` demand a default that would be meaningless.
const DEFAULTS: Required<Omit<StaffRenderOptions, 'font' | 'clef' | 'ipaPreview' | 'withheldIpa' | 'cyrPreview' | 'melismaPreview' | 'finalBarline' | 'targetWidth' | 'incomingAccidentals'>> = {
  staffMidY: 96,
  lineGap: 12,
  leftMargin: 92,
  pxPerWhole: 240,
  minGap: 40,
  fontFamily: 'Bravura',
  measureOffset: 0,
};

const DIATONIC: Record<Pitch['step'], number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

/** Diatonic number of the middle staff line, per clef (bass D3, treble B4). */
const MIDDLE_LINE: Record<RenderClef, number> = {
  bass: 3 * 7 + DIATONIC.D,
  treble: 4 * 7 + DIATONIC.B,
  'treble-8vb': 4 * 7 + DIATONIC.B, // written pitches; the 8 is sounding-only
};

function diatonicNumber(p: Pitch): number {
  return p.octave * 7 + DIATONIC[p.step];
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Two decimals, the file's rounding for every coordinate it prints. */
function round2px(v: number): number {
  return Math.round(v * 100) / 100;
}

/** The notehead glyph a duration takes: open for half and longer, filled otherwise. */
function headNameOf(base: NoteBase): RequiredGlyphName {
  return base === 'whole' || base === 'breve'
    ? 'noteheadWhole'
    : base === 'half'
      ? 'noteheadHalf'
      : 'noteheadBlack';
}

// Order in which sharps / flats are added by the key signature.
const SHARP_ORDER: Pitch['step'][] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER: Pitch['step'][] = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

/**
 * The key an accidental is carried under: step AND octave, so a B flat in one
 * octave says nothing about a B in another (r116, per
 * `brief-n102-courtesy-accidentals_r1_2026-09-02.md` §4).
 */
export function accidentalKey(p: Pitch): string {
  return `${p.step}${p.octave}`;
}

/** The alteration a key signature imposes on a given diatonic step. */
function keySignatureAlter(step: Pitch['step'], fifths: number): number {
  if (fifths > 0 && SHARP_ORDER.slice(0, fifths).includes(step)) return 1;
  if (fifths < 0 && FLAT_ORDER.slice(0, -fifths).includes(step)) return -1;
  return 0;
}

/** What a note's accidental draws, once the two carry maps have had their say. */
export type AccidentalMark = 'none' | 'required' | 'courtesy';

/**
 * Decide what one note's accidental draws, and ADVANCE the two carry maps.
 *
 * N.102 increment 1b. This is the whole accidental rule, in one place, and it
 * exists so that the draw loop and `accidentalStateAtEndOf` cannot drift.
 * Before this the rule lived only inside the draw loop, so the paginator had no
 * way to ask what state a slice inherits without restating the rule and
 * inviting the two copies to disagree.
 *
 * IT MUTATES BOTH MAPS, exactly as the draw loop did when it owned the rule:
 * a drawn accidental of either kind puts the note's alter into `measureAcc`, so
 * the rest of the bar is governed by it, and a drawn courtesy also drops its key
 * from `prevMeasureAcc`, so a second recurrence in this bar draws nothing.
 *
 * @param pitch           the sung note's pitch
 * @param fifths          the key signature in force
 * @param measureAcc      what has been stated so far in THIS bar (mutated)
 * @param prevMeasureAcc  what stood at the end of the bar before (mutated)
 */
export function advanceAccidentalState(
  pitch: Pitch,
  fifths: number,
  measureAcc: Record<string, number>,
  prevMeasureAcc: Record<string, number>,
): AccidentalMark {
  const key = accidentalKey(pitch);
  const inEffect = key in measureAcc ? measureAcc[key] : keySignatureAlter(pitch.step, fifths);
  if (pitch.alter !== inEffect) {
    measureAcc[key] = pitch.alter;
    return 'required';
  }
  if (prevMeasureAcc[key] !== undefined && prevMeasureAcc[key] !== pitch.alter && !(key in measureAcc)) {
    measureAcc[key] = pitch.alter;
    delete prevMeasureAcc[key];
    return 'courtesy';
  }
  return 'none';
}

/**
 * The sung line's accidental state as it stands at the END of `measureIndex`,
 * keyed the way `measureAcc` keys it.
 *
 * N.102 increment 1b, and the reason it exists: `paginateScore` renders every
 * system through its own `renderAnalyzedStaff` call on a rebased slice, so a
 * slice's first measure had no idea what the measure before it stated and no
 * courtesy was ever drawn on a measure that opens a system. The paginator now
 * computes this and hands it in as `incomingAccidentals`.
 *
 * IT WALKS FROM MEASURE 0, and it has to: a courtesy drawn in one bar writes to
 * that bar's `measureAcc`, so the state at the end of any bar depends on the
 * whole chain before it. It walks through `advanceAccidentalState`, the same
 * call the draw loop makes, so the two cannot answer differently.
 *
 * AN EMPTY RESULT IS A REAL ANSWER, not a failure. A bar in which the singer
 * altered nothing ends with nothing carried, and so does a bar the singer does
 * not sing at all. `measureIndex` below zero means there is no bar before the
 * slice, which is the first system's case.
 *
 * ONE KEY SIGNATURE governs the whole walk, which is what the renderer itself
 * assumes: it reads `keySignatures[0]` and renders every measure under it. A
 * score that changes key mid-piece is NOT handled here, and is not handled by
 * the renderer either.
 */
export function accidentalStateAtEndOf(
  parsed: ParsedScore,
  measureIndex: number,
  fifths: number,
): Record<string, number> {
  if (measureIndex < 0) return {};
  // N.103: the barline step is `carryIntoMeasure`, the same call the draw loop
  // and `layoutColumns` make. This function held the third copy of it.
  const carry = newAccidentalCarry(fifths);
  const turningAcc: Record<string, number> = {};
  for (const ev of parsed.vocalLine) {
    if (ev.measureIndex > measureIndex) break; // the vocal line is in measure order
    carryIntoMeasure(carry, turningAcc, ev.measureIndex);
    if (ev.type !== 'note' || !ev.pitch) continue;
    advanceAccidentalState(ev.pitch, fifths, carry.measureAcc, carry.prevMeasureAcc);
  }
  // The bar asked about carried no sung event at all, so it states nothing.
  return carry.curMeasure === measureIndex ? carry.measureAcc : {};
}

const ACCIDENTAL_GLYPH: Record<number, string> = { 1: '♯', [-1]: '♭', 0: '♮', 2: '𝄪', [-2]: '𝄫' };

/** SMuFL glyph names by alteration. */
const ACCIDENTAL_SMUFL: Record<number, RequiredGlyphName> = {
  1: 'accidentalSharp',
  [-1]: 'accidentalFlat',
  0: 'accidentalNatural',
  2: 'accidentalDoubleSharp',
  [-2]: 'accidentalDoubleFlat',
};

/** SMuFL rest glyphs by note base (64th/128th clamp to 32nd for v1). */
const REST_SMUFL: Record<NoteBase, RequiredGlyphName> = {
  breve: 'restWhole', whole: 'restWhole', half: 'restHalf', quarter: 'restQuarter',
  eighth: 'rest8th', '16th': 'rest16th', '32nd': 'rest32nd', '64th': 'rest32nd', '128th': 'rest32nd',
};

/**
 * THE TACET MEASURE'S GEOMETRY, AND IT IS CONVENTION RATHER THAN GOULD.
 *
 * N.104. Dann's ruling, 2026-08-27: "We absolutely must represent measures
 * without voice content with a single rest and a number overtop of it saying
 * how many measures are tacet for voice."
 *
 * GOULD HOLDS NOTHING HERE, and the project says so about itself. The priors
 * memo, at its own line 220: "Rest geometry entirely: pp.34 to 38 are
 * unphotographed, so no dimensional priors exist for rests at all." There is
 * no Gould dimension in this project for a rest of any kind, so there is none
 * for a multibar rest's length, its numeral's size, or that numeral's
 * clearance. Every number in this block is CONVENTION, recorded as convention
 * the way the tie's 0.40 is recorded as Dann's eye. If pp. 34 to 38 are ever
 * photographed, these are the four numbers to check.
 *
 * WHAT IS NOT CONVENTION, and deliberately: the bar's own thickness and the
 * proportion of its terminal serifs. Those come from the font. Finale Maestro
 * carries `restHBarLeft`, `restHBarMiddle` and `restHBarRight`, SMuFL's
 * composable H-bar, so the mark's weight is the face's own and this desk
 * invents no part of it. `smufl-metadata.ts` names the four codepoints.
 */
export const TACET_REST = {
  /**
   * The width one consolidated tacet measure occupies, barline to barline, in
   * stave-spaces. Fixed, not graduated by the count: a run of 2 and a run of
   * 30 take the same room and differ only in the numeral, which is standard
   * practice.
   *
   * PROVENANCE: DANN'S EYE, 2026-08-29, choosing 8 from the three weights in
   * section A of `docs/sessions/drawing-n104-tacet-weights_r1_2026-08-27.html`,
   * where every plate is the real renderer's real output on the engraved
   * Without Sun song 1 and a sung 12/8 bar of that song runs about 20
   * stave-spaces. It replaces the 12 the desk chose at the browser on
   * 2026-08-27. What he saw in the plates is not recorded here; the choice is.
   *
   * **This is convention rather than Gould**, like every number in this block,
   * and it is recorded here the way the tie's 0.40 is recorded as his eye.
   */
  measureSp: 8,
  /**
   * How far the H-bar stops short of the barline at each end, in
   * stave-spaces. The bar is a mark inside a measure, not a rule joining two
   * barlines, so it needs air at both ends or it reads as a tie between them.
   */
  barInsetSp: 1.25,
  /**
   * Clearance from the top staff line to the bottom of the numeral, in
   * stave-spaces.
   */
  numeralClearanceSp: 0.9,
  /**
   * Numeral size, as a multiple of the notation glyph size. The digits are the
   * time-signature digits (`timeSig0` to `timeSig9`), which is what SMuFL
   * supplies for this and what every engraver sets the count in; 1 is
   * therefore "the size of a time signature".
   */
  numeralScale: 1,
} as const;

/** The time-signature digit glyphs, which also set the tacet count. */
const DIGIT_SMUFL: readonly RequiredGlyphName[] = [
  'timeSig0', 'timeSig1', 'timeSig2', 'timeSig3', 'timeSig4',
  'timeSig5', 'timeSig6', 'timeSig7', 'timeSig8', 'timeSig9',
];

/** A run of consecutive measures the vocal part is silent in. */
export interface TacetRun {
  /** First and last measure index of the run, inclusive. */
  fromMeasure: number;
  toMeasure: number;
  /** How many measures are tacet, which is what the numeral prints. */
  count: number;
}

/**
 * The measures the singer counts and does not sing in, grouped into runs.
 *
 * A measure is tacet when the score declares it and the vocal line puts no
 * event in it. That is the whole test, and it is why the piano-only opening
 * bar of Without Sun song 1 counts: `<measure number="1">` of the Bass part
 * carries 0 notes, 0 rests and 0 lyrics while the piano's carries 5.
 *
 * A score whose `measures` array is empty yields no runs, so a caller that
 * renders a bare vocal line gets exactly the layout it got before N.104.
 */
export function tacetRuns(parsed: ParsedScore): TacetRun[] {
  if (parsed.measures.length === 0) return [];
  const sung = new Set<number>();
  for (const ev of parsed.vocalLine) sung.add(ev.measureIndex);
  const runs: TacetRun[] = [];
  for (const m of parsed.measures) {
    if (sung.has(m.index)) continue;
    const open = runs[runs.length - 1];
    if (open && open.toMeasure === m.index - 1) {
      open.toMeasure = m.index;
      open.count += 1;
    } else {
      runs.push({ fromMeasure: m.index, toMeasure: m.index, count: 1 });
    }
  }
  return runs;
}

/** SMuFL flag glyphs [up, down] by flag count (clamped at 3 for v1). */
const FLAG_SMUFL: Record<number, [RequiredGlyphName, RequiredGlyphName]> = {
  1: ['flag8thUp', 'flag8thDown'],
  2: ['flag16thUp', 'flag16thDown'],
  3: ['flag32ndUp', 'flag32ndDown'],
};

/**
 * Turning-pitch layer colour: Calm Authority's deeper lavender,
 * `--deeper-lavender` in app.css. Baked as hex because this module is pure and
 * DOM-free; keep in sync with the app token.
 *
 * IT WAS SAGE UNTIL 2026-08-27. Dann's original ruling (2026-07-12) was to use
 * the existing colour story rather than invent an estimate, and sage was the
 * accent to hand. His correction is that the colour story had since become
 * specific: LAVENDER CODES MUSIC AND VOICE — the voice anchor, the loupe's
 * insertion bar, and the drawer's correction stations all carry this token —
 * and the turning pitches are formant-derived VOICE DATA. Sage, which codes
 * the score document and its text, was miscoding them.
 */
const TURNING_COLOUR = '#8E7E9B';

/**
 * The width a primitive-mode turning accidental is treated as having, in px.
 * There is no font to measure, so this is the width the mode's own hard-coded
 * `nx - 19` implied before N.106: the 12.4 px turning head's half-width, then
 * the sung line's 1.5 px of head-to-accidental clearance. Stating it as a
 * width is what lets primitive mode run the same rule SMuFL mode runs, and
 * keeps an ALIGNED primitive turning accidental on the pixel it always had.
 */
const PRIMITIVE_TURNING_ACC_W = 11.3;

/**
 * A tie's thickness at its centre, in stave spaces, tapering to points at both
 * terminals.
 *
 * PROVENANCE: DANN'S EYE, 2026-08-27, choosing 0.40 from a rendered comparison
 * of 0.29, 0.40 and 0.51 against the tie as it was drawn before. **This is NOT
 * Gould.** Her tie and slur rules are 150 to 175 of
 * `gould-vocal-engraving-rules_v7_2026-08-05.md`, and they were deliberately
 * excluded from the extracted priors memo, which says so at its own lines 3 and
 * 229; the book is not on the build machine. So no number here is derived from
 * her and none should be cited as hers.
 *
 * CHECK THIS AGAINST HER IF THAT SOURCE IS EVER PHOTOGRAPHED. A measured
 * proportion should replace a judged one, and the judgement is recorded here
 * precisely so the replacement is a one-line change with a known predecessor.
 */
const TIE_CENTRE_SP = 0.4;

/**
 * Stamp an analysis mark with its own handle.
 *
 * EVERY OVERLAY THE ANALYSIS PUTS ON THE STAVE CARRIES `data-analysis`, ruled
 * by Dann 2026-08-27: the turning-pitch noteheads and their accidentals, the
 * red crossing squircle, and the phonation break. Downstream can then ask for
 * the analysis layer by name.
 *
 * WHY A HANDLE AND NOT A COLOUR. The loupe is a crop of this SVG and must show
 * engraving concerns only, so it has to exclude these. Two of the four could be
 * found by their ink, the turning colour and `#b23b3b`, and this file's own
 * tests
 * already do exactly that; the phonation break could not, because it is drawn
 * in full notation ink on purpose. A filter that caught three of four would
 * have suppressed half a layer and left the singer wondering which marks meant
 * something. An attribute catches all four and says what it is.
 *
 * AND THE HANDLE IS WHY THE COLOUR COULD LATER MOVE. When the turning layer
 * went from sage to lavender on 2026-08-27, the loupe's filter needed no edit
 * at all, because it had stopped depending on the ink a year of rulings might
 * change. That is the argument for the attribute, made in retrospect.
 */
function analysisMark(markup: string, kind: string): string {
  return markup.replace(/^<(\w+) /, `<$1 data-analysis="${kind}" `);
}

/**
 * Bind a mark drawn OUTSIDE a note's group back to that note.
 *
 * WHY ANY OF THIS IS OUTSIDE THE GROUP. The group carries
 * `pointer-events="none"` for N.71's reason, and the accidental is emitted
 * before it opens, so an accidental has never been a child of the note it
 * belongs to. Nothing needed the association until Dann's walk on `776c267`
 * found the selection squircle slicing through the accidental of the note it
 * was meant to enclose.
 *
 * A HANDLE RATHER THAN GEOMETRY, the lesson this file already learned twice:
 * the analysis layer is filtered by `data-analysis` and not by its ink, and
 * when that ink later changed from sage to lavender nothing downstream broke.
 * An accidental could be matched to its note by "same y, a little to the
 * left", and that would work until the first chord.
 */
function partOfEvent(markup: string, id: string): string {
  return markup.replace(/^<(\w+) /, `<$1 data-of-event="${esc(id)}" `);
}

/**
 * Standard per-clef octave placement for key-signature accidentals.
 * treble-8vb shares the treble tables: it is treble geometry with a
 * sounding-octave marker, not a different staff mapping.
 */
const KS_OCTAVES: Record<'bass' | 'treble', { sharps: Record<Pitch['step'], number>; flats: Record<Pitch['step'], number> }> = {
  bass: {
    sharps: { F: 3, C: 3, G: 3, D: 3, A: 2, E: 3, B: 2 },
    flats: { B: 2, E: 3, A: 2, D: 3, G: 2, C: 3, F: 2 },
  },
  treble: {
    sharps: { F: 5, C: 5, G: 5, D: 5, A: 4, E: 5, B: 4 },
    flats: { B: 4, E: 5, A: 4, D: 5, G: 4, C: 5, F: 4 },
  },
};

function flagCount(base: NoteBase): number {
  switch (base) {
    case 'eighth': return 1;
    case '16th': return 2;
    case '32nd': return 3;
    case '64th': return 4;
    case '128th': return 5;
    default: return 0;
  }
}

interface Placed {
  ev: VocalLineEvent;
  x: number;
  newMeasure: boolean;
}

/**
 * Half the rendered width of an event's underlay: the wider of its Cyrillic
 * syllable and its IPA, both measured from real glyph advances rather than a
 * character count (`underlay-widths.ts`).
 *
 * Halved because both lines are centre-anchored on the notehead. The one
 * exception is a melisma-opening syllable, which is left-anchored (Gould r5)
 * and therefore extends its FULL width rightward: that is safe to ignore
 * here, because the columns following a melisma opening carry no syllable at
 * all by the data model, so there is nothing for it to collide with.
 */
function underlayHalfWidth(ev: VocalLineEvent, options: StaffRenderOptions): number {
  // N.55b R6: a pairing's Cyrillic outranks the score's, because a score
  // with no underlay has none and the singer's decision is the only text
  // there is.
  const cyr = options.cyrPreview?.[ev.id] ?? ev.syllable?.text ?? '';
  // N.10b: the withheld sigla occupies the IPA line's slot, so it is ink this
  // function must measure exactly as it measures a transcription. Ink the
  // spacing engine cannot see is ink that collides.
  const ipa = options.ipaPreview?.[ev.id] ?? '';
  const sigla = !ipa && options.withheldIpa?.has(ev.id) === true;
  if (!cyr && !ipa && !sigla) return 0;
  const inked = Math.max(
    cyr ? estimateCyrillicWidthPx(cyr, CYR_FONT_PX) : 0,
    ipa ? estimateIpaWidthPx(ipa, IPA_FONT_PX) : 0,
    sigla ? WITHHELD_SIGLA_WIDTH_PX : 0,
  );
  return inked / 2;
}

/**
 * The minimum x-advance from one event's column to the next, and the SINGLE
 * definition of it: `page-layout.ts` calls this rather than mirroring the
 * arithmetic, because that file's own comment warned that a renderer spacing
 * change would otherwise drift silently away from the pagination estimate.
 *
 * Three terms compete and the widest wins:
 *   1. `minGap`, the floor;
 *   2. the duration term, `pxPerWhole` per whole note (still strictly
 *      proportional, which Gould p. 40 prints as the version NOT to use;
 *      contradiction 38, not addressed here);
 *   3. the TEXT term, new in N.6b-1: half the previous column's underlay plus
 *      half this one's, plus half a stave-space of clearance. Gould r8 makes
 *      vocal spacing answer to syllable width as well as rhythm, and r235
 *      sets that half-stave-space as the hard floor with nothing colliding.
 *
 * Before this existed the IPA line held one character, so text width never
 * governed. N.5 gave it full syllable transcriptions and the columns began to
 * collide on the printed page.
 */
/** Half the drawn width of a hyphen: its ink spans `hx ± HYPHEN_HALF`. */
export const HYPHEN_HALF = 2.5;

/**
 * Keep a hyphen's INK inside the gap between two syllables (N.11).
 *
 * The placement loop nudges a hyphen 8 px right when it would sit under a
 * note column. That nudge is unconditional, rightward only, and unbounded,
 * so in a tight pair it pushed the ink inside the following glyph: Dann at
 * the browser, 2026-08-06, found it through «я» in «та-я», through «го» in
 * «е-го», and twice more on Kabalevsky page 2.
 *
 * The gap `[from, to]` is measured from real ink edges by the caller. The
 * hyphen is centred on `hx` and draws `HYPHEN_HALF` either side, so the legal
 * window for the CENTRE is `[from + half, to - half]`.
 *
 * When the gap is narrower than the hyphen itself that window is empty and
 * there is no correct answer; the centre of the gap is the least-bad one,
 * overhanging both neighbours slightly rather than one of them entirely.
 * Omitting the hyphen instead is a Gould question (rules 26 to 40, unread),
 * so it is not taken here.
 */
export function clampHyphenX(hx: number, from: number, to: number, half = HYPHEN_HALF): number {
  if (to - from < half * 2) return (from + to) / 2;
  return Math.min(Math.max(hx, from + half), to - half);
}

// ── N.103: the spacer sees ink ──────────────────────────────────────

/**
 * The clearance between one column's rightmost ink and the next column's
 * leftmost ink, in stave spaces. N.103, desk default, Dann's to wave off.
 *
 * Half a stave space, which is the floor Gould r235 already gives the
 * underlay text, on the reasoning that ink is ink: if two syllables may not
 * come closer than this, neither may an augmentation dot and the accidental
 * that follows it.
 *
 * THE BRIEF NAMES IT `INK_CLEAR`. The `_SP` suffix is this file's convention
 * for a stave-space quantity (`COURTESY_GAP_SP`, `TURNING_CLEARANCE_SP`,
 * `STEM_LENGTH_SP`) and is added so the unit is legible where it is spent.
 * Nothing else about it changed.
 */
export const INK_CLEAR_SP = 0.5;

/**
 * The clearance AFTER a displaced turning unit, in stave spaces. N.103, ruled
 * by Dann 2026-09-02, desk default 1.0, and the point of the item.
 *
 * His words: "Lavender pitches relate to the black ink that precedes them.
 * When lavender is too close to a following adjacent black ink note, it blurs
 * this clarity. I'm looking for a way to insist on space after the lavender to
 * preserve its impression as a unit relating to the preceding note."
 *
 * A turning pitch is a property of the vowel that corresponds to the note it
 * follows (his words). The biglyph belongs to its parent SEMANTICALLY, and
 * proximity is how the page SHOWS that, not why it is so. N.106 seats the unit
 * `TURNING_CLEARANCE_SP` from the sung unit, which is 0.25, so the gap after
 * it has to be visibly larger or the page states the opposite of the meaning.
 * Four times the leading gap is the desk default. The number is Dann's to set
 * by eye once he has seen it.
 *
 * It replaces `INK_CLEAR_SP` only where the previous column's rightmost ink IS
 * a displaced turning unit. An ALIGNED turning unit, a third or more, draws
 * nothing right of the sung head and does not trigger it.
 */
export const TURNING_TRAIL_SP = 1.0;

/** The px between a notehead and its own accidental, sung line and turning alike. */
const ACC_GAP_PX = 1.5;

/** The px the two-voice offset has carried since 2026-07-12, kept by N.106. */
const TURNING_OFFSET_PX = 1.6;

/**
 * Stave steps between two pitches: 0 a unison, 1 a second, 2 a third.
 *
 * Clef-independent, because a step is a step on any stave. N.106 measured this
 * in pixels and had to divide by the half-space to get back to it; this states
 * it directly, so the draw loop and `columnInk` cannot disagree about whether a
 * turning unit is displaced.
 */
function staveSteps(a: Pitch, b: Pitch): number {
  return Math.abs(diatonicNumber(a) - diatonicNumber(b));
}

/**
 * Every glyph width the ink rule needs, from the font in SMuFL mode and from
 * primitive mode's fixed numbers otherwise. All in px at this stave size.
 *
 * ONE definition, for the reason `advanceAccidentalState` is one definition:
 * `columnInk` measures a column and the draw loop draws it, and two copies of
 * "how wide is a flat" are two answers waiting to disagree. The draw loop reads
 * these same numbers.
 *
 * PRIMITIVE MODE HAS NO FONT, so its numbers are reconstructions of what the
 * mode's own hard-coded offsets already implied. They are marked where they are
 * defined and they are exact for the placements that already existed.
 */
export interface InkMetrics {
  lineGap: number;
  sp(v: number): number;
  headHalfW(base: NoteBase): number;
  ledgerHalf(base: NoteBase): number;
  restHalfW(base: NoteBase): number;
  /** 0 where the alteration has no glyph at all. */
  accidentalW(alter: number): number;
  /** Parens, gaps, and accidental at the FULL `COURTESY_GAP_SP`; 0 where none draws. */
  courtesyClusterW(alter: number): number;
  courtesyParts(alter: number): { wL: number; wA: number; wR: number; gap: number } | undefined;
  dotW: number;
  dotClear: number;
  turningHeadW: number;
  turningAccW(alter: number): number;
  stemHalfUp: number;
  stemHalfDown: number;
  stemT: number;
}

export function inkMetrics(options: StaffRenderOptions = {}): InkMetrics {
  const lineGap = options.lineGap ?? DEFAULTS.lineGap;
  const smufl = options.font;
  const sp = (v: number): number => v * lineGap;
  const ed = smufl?.engravingDefaults;
  const stemT = smufl ? sp(ed!.stemThickness) : 1.5;
  let stemHalfUp = STEM_HALF;
  let stemHalfDown = -STEM_HALF;
  if (smufl) {
    const nh = smufl.glyph('noteheadBlack');
    const w = nh.widthSp;
    stemHalfUp = sp((nh.anchors.stemUpSE?.[0] ?? w) - w / 2) - stemT / 2;
    stemHalfDown = sp((nh.anchors.stemDownNW?.[0] ?? 0) - w / 2) + stemT / 2;
  }
  const headHalfW = (base: NoteBase): number =>
    smufl ? sp(smufl.glyph(headNameOf(base)).widthSp / 2) : 6.2;
  const accidentalW = (alter: number): number => {
    if (smufl) {
      const name = ACCIDENTAL_SMUFL[alter];
      return name ? sp(smufl.glyph(name).widthSp) : 0;
    }
    /* The width the mode's own `nx - 20` implied: head half 6.2, then
       `ACC_GAP_PX`, at font-size 15. */
    return ACCIDENTAL_GLYPH[alter] ? 12.3 : 0;
  };
  const courtesyParts = (alter: number) => {
    if (!smufl) return undefined;
    const name = ACCIDENTAL_SMUFL[alter];
    if (!name) return undefined;
    return {
      wL: sp(smufl.glyph('accidentalParensLeft').widthSp),
      wA: sp(smufl.glyph(name).widthSp),
      wR: sp(smufl.glyph('accidentalParensRight').widthSp),
      gap: sp(COURTESY_GAP_SP),
    };
  };
  return {
    lineGap,
    sp,
    headHalfW,
    ledgerHalf: (base) => (smufl ? round2px(headHalfW(base) + sp(ed!.legerLineExtension)) : 11),
    restHalfW: (base) => (smufl ? sp(smufl.glyph(REST_SMUFL[base]).widthSp / 2) : 5),
    accidentalW,
    courtesyParts,
    courtesyClusterW: (alter) => {
      const c = courtesyParts(alter);
      if (c) return c.wL + c.wA + c.wR + 2 * c.gap;
      /* Primitive mode draws `(♮)` as one text run at `nx - 25`, which implies
         this width against the same head half and `ACC_GAP_PX`. */
      return ACCIDENTAL_GLYPH[alter] ? 17.3 : 0;
    },
    dotW: smufl ? sp(smufl.glyph('augmentationDot').widthSp) : sp(0.4),
    dotClear: sp(0.5),
    turningHeadW: smufl ? sp(smufl.glyph('noteheadBlack').widthSp) : 12.4,
    turningAccW: (alter) => {
      if (smufl) {
        const name = ACCIDENTAL_SMUFL[alter];
        return name ? sp(smufl.glyph(name).widthSp) : 0;
      }
      return ACCIDENTAL_GLYPH[alter] ? PRIMITIVE_TURNING_ACC_W : 0;
    },
    stemHalfUp,
    stemHalfDown,
    stemT,
  };
}

/**
 * The x of each augmentation dot and the right ink edge of the last one, as
 * offsets from the notehead centre. Gould r111: half a stave space clear of the
 * head, and clear of the ledger lines where the note sits outside the stave.
 */
function dotGeometry(
  M: InkMetrics,
  base: NoteBase,
  dotCount: number,
  outsideStave: boolean,
): { first: number; right: number } {
  let first = M.headHalfW(base) + M.dotClear;
  if (outsideStave) first = Math.max(first, M.ledgerHalf(base) + M.dotClear);
  return { first, right: first + (dotCount - 1) * (M.dotW + M.dotClear) + M.dotW };
}

/**
 * The sung unit's right ink edge, as an offset from the notehead centre: the
 * notehead, its dots where it has any, and an UP-stem, which stands on the
 * right of the head. A down-stem is on the left and a whole note has none.
 * N.106's triglyph, measured.
 */
function sungRightEdge(
  M: InkMetrics,
  base: NoteBase,
  stemUp: boolean,
  dotsRight: number,
): number {
  const stemmed = base !== 'whole' && base !== 'breve';
  let right = M.headHalfW(base);
  if (stemmed && stemUp) right = Math.max(right, M.stemHalfUp + M.stemT / 2);
  return Math.max(right, dotsRight);
}

/**
 * Where a DISPLACED turning unit sits, as offsets from the notehead centre.
 * N.106's rule, in one place so the draw loop and `columnInk` cannot restate
 * it: the unit's left ink edge sits at the sung unit's right ink edge plus
 * `TURNING_OFFSET_PX` plus `TURNING_CLEARANCE_SP`, and the accidental leads it
 * when there is one.
 */
function turningUnitAt(
  M: InkMetrics,
  sungRight: number,
  accW: number,
): { left: number; tx: number; right: number } {
  const left = sungRight + TURNING_OFFSET_PX + M.sp(TURNING_CLEARANCE_SP);
  const tx = left + accW + (accW > 0 ? ACC_GAP_PX : 0) + M.turningHeadW / 2;
  return { left, tx, right: tx + M.turningHeadW / 2 };
}

/** The sung line's accidental state, plus the key signature that governs it. */
export interface AccidentalCarry {
  fifths: number;
  /** What has been stated so far in THIS bar. Mutated by the walk. */
  measureAcc: Record<string, number>;
  /** What stood at the end of the bar before. Mutated by the walk. */
  prevMeasureAcc: Record<string, number>;
  /** The bar the carry currently stands in; -1 before the first. */
  curMeasure: number;
}

/**
 * A fresh carry, seeded the way the draw loop seeds itself.
 *
 * `incoming` is NOT the first measure's own state: it is the closing state of
 * the measure before, standing in for a bar this walk never sees (N.102
 * increment 1b). The first `carryIntoMeasure` moves it into `prevMeasureAcc`
 * under the same guard every later measure gets.
 */
export function newAccidentalCarry(fifths: number, incoming?: Record<string, number>): AccidentalCarry {
  return { fifths, measureAcc: { ...(incoming ?? {}) }, prevMeasureAcc: {}, curMeasure: -1 };
}

/**
 * Step the carry to `measureIndex`, if it is not already there.
 *
 * The outgoing measure's state becomes the courtesy source, but only for the
 * measure that DIRECTLY follows it: a skipped index is a tacet run, and nothing
 * carries across one. The turning layer keeps its own per-measure state and
 * resets with no carry at all.
 *
 * ONE definition, called by the draw loop and by `layoutColumns`, so the
 * spacer's idea of what draws and the page's idea cannot diverge at a barline.
 */
export function carryIntoMeasure(
  carry: AccidentalCarry,
  turningAcc: Record<string, number>,
  measureIndex: number,
): void {
  if (measureIndex === carry.curMeasure) return;
  carry.prevMeasureAcc = measureIndex === carry.curMeasure + 1 ? carry.measureAcc : {};
  carry.curMeasure = measureIndex;
  carry.measureAcc = {};
  for (const k of Object.keys(turningAcc)) delete turningAcc[k];
}

/** One column's ink, as offsets from the notehead centre. */
export interface ColumnInk {
  /** Leftmost ink, positive, measured leftward from `nx`. */
  left: number;
  /** Rightmost ink, positive, measured rightward from `nx`. */
  right: number;
  /** True where `right` is a turning unit N.106 displaced. */
  turningDisplaced: boolean;
}

/**
 * What one column actually draws, measured from the notehead's centre.
 *
 * N.103. `columnAdvance` knew `minGap`, the duration, and the underlay, and
 * nothing about accidentals, dots, courtesy clusters, or the turning layer, all
 * of which the draw loop adds after the columns are placed. This is the
 * measurement the spacer was missing.
 *
 * IT ADVANCES THE TWO CARRIES, exactly as the draw loop does, because whether a
 * flat draws at all depends on every note before it in the bar. It calls
 * `advanceAccidentalState` and `carryIntoMeasure` rather than restating either,
 * so a walk through `columnInk` and a walk through the draw loop see the same
 * marks on the same notes. That is the whole reason the state is a parameter and
 * not a local.
 *
 * THE MEASURE-OPENING NUDGE IS NOT APPLIED. The draw loop holds a measure-opening
 * accidental off the barline at `nx - 16`, which makes its ink NARROWER on the
 * left than this reports. Reporting the un-nudged width is the conservative
 * answer for a minimum, and a measure opening gets `BARLINE_ROOM` on top of the
 * advance regardless.
 *
 * THE STEM SIDE IS THE ANALYSIS'S, then Gould's positional default. The beam
 * pass has not run at layout time and cannot, so a beamed note with no analysis
 * takes the positional answer here and the beam's answer on the page. It costs
 * at most `stemHalfUp + stemT / 2 - headHalfW` on the right, which is 0.05 px at
 * the production stave, and both call sites make the same call, so pagination
 * and rendering still agree with each other.
 */
export function columnInk(
  ev: VocalLineEvent,
  a: AnalyzedEvent | undefined,
  accState: AccidentalCarry,
  turningState: Record<string, number>,
  options: StaffRenderOptions = {},
): ColumnInk {
  const M = inkMetrics(options);
  carryIntoMeasure(accState, turningState, ev.measureIndex);

  if (ev.type === 'rest' || !ev.pitch) {
    const half = M.restHalfW(ev.duration.base);
    return { left: half, right: half, turningDisplaced: false };
  }

  const pitch = ev.pitch;
  const base = ev.duration.base;
  const staffMidY = options.staffMidY ?? DEFAULTS.staffMidY;
  const clef: RenderClef = options.clef ?? 'treble';
  const y = staffMidY - (diatonicNumber(pitch) - MIDDLE_LINE[clef]) * (M.lineGap / 2);

  // ── Left: the head, then whatever accidental the rule says draws ──
  let left = M.headHalfW(base);
  const mark = advanceAccidentalState(pitch, accState.fifths, accState.measureAcc, accState.prevMeasureAcc);
  if (mark === 'required') {
    const w = M.accidentalW(pitch.alter);
    if (w > 0) left = Math.max(left, M.headHalfW(base) + ACC_GAP_PX + w);
  } else if (mark === 'courtesy') {
    const w = M.courtesyClusterW(pitch.alter);
    if (w > 0) left = Math.max(left, M.headHalfW(base) + ACC_GAP_PX + w);
  }

  // ── Right: the head, an up-stem, the dots ──
  const dotCount = ev.duration.dots ?? 0;
  let dotsRight = -Infinity;
  if (dotCount > 0) {
    const steps = (y - staffMidY) / (M.lineGap / 2);
    const onLine = Math.abs(steps - Math.round(steps)) < 0.01 && Math.round(steps) % 2 === 0;
    const dotY = onLine ? y - M.lineGap / 2 : y;
    dotsRight = dotGeometry(M, base, dotCount, Math.abs(dotY - staffMidY) > 2 * M.lineGap).right;
  }
  const stemUp = a ? a.timbre === 'close' : y > staffMidY;
  let right = sungRightEdge(M, base, stemUp, dotsRight);

  // ── The turning unit ──
  let turningDisplaced = false;
  if (a) {
    const tp = a.turningPitch;
    const tKey = `${tp.step}${tp.octave}`;
    const tInEffect = tKey in turningState ? turningState[tKey] : keySignatureAlter(tp.step, accState.fifths);
    const accW = tp.alter !== tInEffect ? M.turningAccW(tp.alter) : 0;
    if (accW > 0) turningState[tKey] = tp.alter;
    if (staveSteps(tp, pitch) > 1) {
      // Aligned: the accidental hangs left of the sung head's own position.
      if (accW > 0) left = Math.max(left, M.turningHeadW / 2 + ACC_GAP_PX + accW);
    } else {
      turningDisplaced = true;
      right = turningUnitAt(M, right, accW).right;
    }
  }

  return { left, right, turningDisplaced };
}

export function columnAdvance(
  prevEv: VocalLineEvent,
  ev: VocalLineEvent | undefined,
  prevDurWhole: number,
  options: StaffRenderOptions = {},
  prevInk?: ColumnInk,
  nextInk?: ColumnInk,
): number {
  const lineGap = options.lineGap ?? DEFAULTS.lineGap;
  const minGap = options.minGap ?? DEFAULTS.minGap;
  const pxPerWhole = options.pxPerWhole ?? DEFAULTS.pxPerWhole;
  // `ev` is undefined for the trailing advance past the final column, where
  // there is no following text to clear, only the last syllable's own half.
  // That case gets a FULL stave-space rather than a half: the barline lands
  // there, and half a stave-space put the last syllable hard against it
  // (Dann at the browser, 2026-08-06, on [nuf]).
  const textNeed =
    underlayHalfWidth(prevEv, options) +
    (ev
      ? underlayHalfWidth(ev, options) + lineGap * 0.5
      : lineGap);
  /* THE INK TERM (N.103). The previous column's rightmost ink, this column's
     leftmost ink, and a clearance between them. `TURNING_TRAIL_SP` replaces
     `INK_CLEAR_SP` where the previous column's rightmost ink is a turning unit
     N.106 displaced, on Dann's ruling of 2026-09-02: the biglyph relates to the
     note BEFORE it, and a page that seats it 0.25 spaces from its parent and
     0.5 from the next note says the opposite.

     ABSENT INK MEANS NO TERM, not a zero-width column. A caller that does not
     measure ink gets exactly the three terms it got before N.103, which is what
     keeps every existing caller and test honest.

     The trailing advance past the last column has no `nextInk`, so its ink term
     is the previous column's own ink plus the clearance. That keeps a displaced
     turning unit off the barline it runs into. */
  const inkNeed = prevInk
    ? prevInk.right +
      (nextInk ? nextInk.left : 0) +
      lineGap * (prevInk.turningDisplaced ? TURNING_TRAIL_SP : INK_CLEAR_SP)
    : 0;
  return Math.max(minGap, prevDurWhole * pxPerWhole, textNeed, inkNeed);
}

/**
 * One column of the system: an event, or a run of tacet measures.
 *
 * `advance` is the px from the previous column to this one at the minimum
 * width, before any justification stretch, and it already includes
 * `BARLINE_ROOM` where the column opens a measure.
 */
export interface LayoutColumn {
  ev?: VocalLineEvent;
  tacet?: TacetRun;
  advance: number;
  newMeasure: boolean;
}

/**
 * The system's columns and the trailing advance past the last one.
 *
 * ONE function, called by `renderAnalyzedStaff` and by `page-layout.ts`'s
 * `sliceWidth`, so the packing estimate and the rendering cannot drift apart.
 * N.6b-1 made `columnAdvance` and `BARLINE_ROOM` shared for that reason;
 * N.104 adds a second kind of column, and sharing the whole walk rather than
 * two more constants is what keeps that guarantee.
 *
 * A tacet run breaks the ink-to-ink chain: the column after it is spaced by
 * the run's own width rather than by `columnAdvance`, because there is no
 * previous syllable whose underlay has to clear the next one.
 *
 * `fromMeasure` and `toMeasure` bound the walk for `sliceWidth`, which asks
 * about a range of an unsliced score. Omit them to walk the whole score.
 */
export function layoutColumns(
  parsed: ParsedScore,
  options: StaffRenderOptions = {},
  fromMeasure = -Infinity,
  toMeasure = Infinity,
  analyzed?: AnalyzedScore,
): { columns: LayoutColumn[]; trailing: number } {
  const lineGap = options.lineGap ?? DEFAULTS.lineGap;
  const runWidth = TACET_REST.measureSp * lineGap;
  const runs = tacetRuns(parsed).filter(
    (r) => r.fromMeasure >= fromMeasure && r.toMeasure <= toMeasure,
  );
  const events = parsed.vocalLine.filter(
    (e) => e.measureIndex >= fromMeasure && e.measureIndex <= toMeasure,
  );

  /* N.103's threading, and it is the whole of it: the walk that already knows
     the column order carries the accidental state forward and measures each
     column's ink as it passes, so `columnAdvance` receives the two ink
     measurements it needs and neither call site has to assemble them.

     THE SEED. `incomingAccidentals` is what `paginateScore` hands the renderer
     for a rebased slice. `sliceWidth` asks about a measure range of an unsliced
     score instead, so there is no such option and the state entering
     `fromMeasure` is computed here from `accidentalStateAtEndOf`, which is the
     same call `paginateScore` makes for the renderer. The two call sites
     therefore start from the same state by two routes that cannot disagree,
     because the route is one function.

     NO ANALYSIS MEANS NO TURNING INK, which is correct rather than degraded: a
     score with no measured voice draws no turning layer at all. */
  const fifths = parsed.keySignatures[0]?.signature.fifths ?? 0;
  const inkOptions: StaffRenderOptions = { ...options, clef: options.clef ?? chooseClef(parsed) };
  const carry = newAccidentalCarry(
    fifths,
    options.incomingAccidentals ??
      (Number.isFinite(fromMeasure) ? accidentalStateAtEndOf(parsed, fromMeasure - 1, fifths) : undefined),
  );
  const turningAcc: Record<string, number> = {};
  const inkOf = (ev: VocalLineEvent): ColumnInk =>
    columnInk(ev, analyzed?.events[ev.id], carry, turningAcc, inkOptions);

  const columns: LayoutColumn[] = [];
  let prevMeasure = -1;
  let prevDurWhole = 0;
  let prevEv: VocalLineEvent | undefined;
  let prevInk: ColumnInk | undefined;
  // Set by a tacet column, spent by the column after it.
  let owedByTacet = 0;
  let runCursor = 0;

  const openRun = (run: TacetRun): void => {
    columns.push({
      tacet: run,
      advance:
        columns.length === 0
          ? 0
          : (prevEv ? columnAdvance(prevEv, undefined, prevDurWhole, options, prevInk) : 0) + BARLINE_ROOM,
      newMeasure: columns.length > 0,
    });
    prevMeasure = run.toMeasure;
    prevEv = undefined;
    prevInk = undefined;
    owedByTacet = runWidth;
  };

  for (const ev of events) {
    while (runCursor < runs.length && runs[runCursor].fromMeasure < ev.measureIndex) {
      openRun(runs[runCursor]);
      runCursor += 1;
    }
    const newMeasure = ev.measureIndex !== prevMeasure;
    /* MEASURED BEFORE THE ADVANCE IS SPENT, and every column is measured even
       where its advance is not: the carry has to see every note in order or the
       next bar's courtesy is wrong. */
    const ink = inkOf(ev);
    let advance: number;
    if (owedByTacet > 0) {
      advance = owedByTacet + BARLINE_ROOM;
      owedByTacet = 0;
    } else if (prevEv) {
      advance =
        columnAdvance(prevEv, ev, prevDurWhole, options, prevInk, ink) + (newMeasure ? BARLINE_ROOM : 0);
    } else {
      advance = 0;
    }
    columns.push({ ev, advance, newMeasure: newMeasure && columns.length > 0 });
    prevMeasure = ev.measureIndex;
    prevDurWhole = ev.duration.fraction.numerator / ev.duration.fraction.denominator;
    prevEv = ev;
    prevInk = ink;
  }
  // A run that ends the system has no following event to open it.
  while (runCursor < runs.length) {
    openRun(runs[runCursor]);
    runCursor += 1;
  }

  const trailing =
    owedByTacet > 0
      ? owedByTacet
      : prevEv
        ? columnAdvance(prevEv, undefined, prevDurWhole, options, prevInk)
        : 0;
  return { columns, trailing };
}

// ── Beaming ────────────────────────────────────────────────────────
// Groups are derived by beat, not read from the source (Dann's ruling,
// 2026-07-12): `ParsedScore` carries no beam data, and the semantic stems
// (open = down, close = up) would force breaks in an engraver's groups
// wherever the timbre changes, so source beams could not be honoured
// verbatim regardless.

const STEM_HALF = 5.5;   // primitive-mode stem x-offset from the notehead centre
/**
 * Standard stem length, in STAVE-SPACES: an octave, 3.5 stave-spaces from
 * the notehead centre (Gould r86). Expressed in stave-spaces because the
 * stave-space is notation's base unit (r79), and because the production
 * stave is less than half the size of the test and font-lab default: the
 * hardcoded 26 and 30 px this replaces measured 4.7 and 5.45 stave-spaces
 * on the printed page, a stem longer than the staff is tall (Dann at the
 * browser, 2026-08-05).
 *
 * NOT implemented from r86, recorded for N.6: ledger-line notes' stems
 * reach the middle staff line; stems shorten progressively outside the
 * staff to a floor of 2.5 stave-spaces; and r87 lengthens the stem for
 * each beam past the second.
 */
const STEM_LENGTH_SP = 3.5;
const BEAM_STROKE = 4;   // primitive-mode beam thickness
const BEAM_GAP = 7;      // primitive-mode spacing between beam levels
const BEAM_STUB = 9;     // length of a partial (stub) beam
const MAX_BEAM_SLOPE = 0.18; // px of rise per px of run, clamped

/**
 * Beat length in whole-note units, for beam grouping. Compound metres
 * (6/8, 9/8, 12/8) group by the dotted beat; simple metres by denominator.
 */
function beatFraction(ts: TimeSignature): Fraction {
  const compound = ts.beatType >= 8 && ts.beats % 3 === 0 && ts.beats > 3;
  return { numerator: compound ? 3 : 1, denominator: ts.beatType };
}

/** 0-based index of the beat containing a rhythmic position. */
function beatIndexOf(pos: Fraction, ts: TimeSignature): number {
  const b = beatFraction(ts);
  return Math.floor((pos.numerator * b.denominator) / (pos.denominator * b.numerator));
}

/** Render the analysed vocal line to a standalone SVG string. */
export function renderAnalyzedStaff(
  parsed: ParsedScore,
  analyzed: AnalyzedScore,
  options: StaffRenderOptions = {},
): string {
  const o = { ...DEFAULTS, ...options };
  const smufl = options.font;
  const clef: RenderClef = options.clef ?? chooseClef(parsed);
  const half = o.lineGap / 2;
  const staffTop = o.staffMidY - 2 * o.lineGap;
  const staffBottom = o.staffMidY + 2 * o.lineGap;
  // The mirror of `lowestInk`, which the underlay has always used. The top of
  // the system never had one, so nothing knew how much space above the staff
  // was actually occupied and `staffMidY`'s fixed 96 px was reserved
  // regardless (N.6a).
  //
  // DECLARED HERE, not beside `lowestInk`, and the reason is a bug this
  // already caused: the tuplet and beam passes run BEFORE that point and both
  // write to it, so a `let` down there is read inside a closure during its own
  // temporal dead zone and every render throws. `tsc` cannot see it, because
  // it cannot prove when a nested arrow runs; only the suite caught it.
  let highestInk = staffTop;
  const yFor = (p: Pitch): number => o.staffMidY - (diatonicNumber(p) - MIDDLE_LINE[clef]) * half;

  const fifths = parsed.keySignatures[0]?.signature.fifths ?? 0;

  // ── SMuFL metrics (undefined in primitive mode) ──
  const glyphSize = smuflFontSizePx(o.lineGap);
  const sp = (v: number): number => v * o.lineGap;
  const round2 = (v: number): number => Math.round(v * 100) / 100;
  /** Glyph text at a horizontal CENTRE (or left origin when anchorLeft). */
  const glyphAt = (name: RequiredGlyphName, x: number, y: number, fill: string, anchorLeft = false): string => {
    const g = smufl!.glyph(name);
    const gx = anchorLeft ? x : x - sp(g.widthSp / 2);
    return `<text x="${round2(gx)}" y="${round2(y)}" font-size="${glyphSize}px" font-family="${esc(o.fontFamily)}" fill="${fill}">${g.char}</text>`;
  };
  const headNameFor = headNameOf;

  const ed = smufl?.engravingDefaults;
  /* N.103: every width this loop draws from comes from `inkMetrics`, which is
     the same object `columnInk` measures with. Two copies of "how wide is a
     flat" are two answers waiting to disagree, and the spacer's whole job is to
     be right about what this loop is about to draw. */
  const M = inkMetrics(options);
  const stemT = M.stemT;
  const beamT = smufl ? sp(ed!.beamThickness) : BEAM_STROKE;
  const beamLevelGap = smufl ? sp(ed!.beamThickness + ed!.beamSpacing) : BEAM_GAP;
  // Stem x-offsets from the notehead centre, from the black notehead's
  // anchors (half noteheads differ by a hair; v1 accepts the approximation
  // so the beam pass and the stem pass agree).
  const stemHalfUp = M.stemHalfUp;
  const stemHalfDown = M.stemHalfDown;
  /** Standard stem length in px at this stave size (Gould r86). */
  const stemLen = sp(STEM_LENGTH_SP);

  // ── Layout: assign x by onset, insert barlines at measure changes ──
  // Pass one: every column's MINIMUM advance, from `layoutColumns`, which
  // `sliceWidth` also calls so the packing estimate and the rendering agree.
  /* N.103: the layout walk is given the ANALYSIS and the resolved clef, which
     is what lets it see the turning layer and the sung note's stave position.
     `sliceWidth` passes the same two, so the packing estimate and this render
     measure the same ink. Passing `clef` matters on its own: this call used to
     take raw `options`, so a score whose clef the renderer resolved by
     heuristic was packed under whatever `chooseClef` made of the unsliced
     score, and until N.103 nothing in the advance depended on the clef. */
  const { columns: steps, trailing } = layoutColumns(
    parsed,
    { ...options, clef },
    undefined,
    undefined,
    analyzed,
  );
  const naturalSpan = steps.reduce((total, s) => total + s.advance, 0) + trailing;

  // Pass two: justify. The whole span scales by one factor, so the duration
  // proportions the advances encode survive the stretch (Gould r97 spaces by
  // a compressed duration curve; stretching uniformly preserves whatever
  // curve is in force). Stretch only: `columnAdvance` already returned the
  // minimum each column needs, and compressing would undo r235's floor.
  const targetSpan = (options.targetWidth ?? 0) - o.leftMargin;
  const stretch = naturalSpan > 0 && targetSpan > naturalSpan ? targetSpan / naturalSpan : 1;

  const placed: Placed[] = [];
  /**
   * The tacet columns, kept apart from `placed` on purpose: every pass after
   * this one (beams, tuplets, the underlay, the hit targets, the analysis
   * layer) walks `placed` and asks each member for a pitch, a syllable or a
   * duration. A run of silent measures has none of those, so it is drawn by
   * its own pass and is invisible to all of them.
   *
   * `nextX` is the x of the column that follows, which is what bounds the
   * run's measure on the right; it is undefined for a run that ends the
   * system, where the closing barline bounds it instead.
   */
  const tacetPlaced: Array<{ run: TacetRun; x: number; nextX?: number; newMeasure: boolean }> = [];
  {
    let x = o.leftMargin;
    const xs: number[] = [];
    for (const s of steps) {
      x += s.advance * stretch;
      xs.push(round2(x));
    }
    steps.forEach((s, i) => {
      if (s.ev) placed.push({ ev: s.ev, x: xs[i], newMeasure: s.newMeasure });
      else if (s.tacet) tacetPlaced.push({ run: s.tacet, x: xs[i], nextX: xs[i + 1], newMeasure: s.newMeasure });
    });
  }
  const contentRight = round2(o.leftMargin + naturalSpan * stretch);
  // The system ends AT its barline. No empty stave past it: Gould's r242
  // end-of-stave allowance is for a barline falling before the stave's end,
  // and where the barline is the end there is nothing to allow for (Dann's
  // ruling, 2026-08-06, against his own Appendix C engraving). The 2 px is
  // stroke room so the barline is not clipped by the viewBox.
  //
  // Kept identical for a final system: the r96 thin-plus-thick pair is drawn
  // INSIDE this width rather than added to it, so `sliceWidth`'s packing
  // estimate cannot diverge from the rendering by knowing which slice is last.
  const width = contentRight;

  // ── Beam pass: group flagged notes by measure, beat, and timbre ──
  // A group needs at least two consecutive members; it breaks at rests,
  // barlines, beat boundaries, unanalysed notes, and timbre changes
  // (semantic stems make mixed-timbre beams impossible).
  const beamStemById = new Map<string, { sx: number; tipY: number; up: boolean }>();
  const beamParts: string[] = [];
  {
    interface BeamNote { id: string; x: number; noteY: number; flags: number }
    let group: BeamNote[] = [];
    // `undefined` means "no acoustic data, settle the direction positionally
    // at flush"; a boolean is a semantic direction already known per note.
    let groupUp: boolean | undefined = false;
    let groupKey = '';

    const emit = (notes: BeamNote[], stemUp: boolean): void => {
      const dir = stemUp ? -1 : 1;
      const sxOf = (n: BeamNote): number => n.x + (stemUp ? stemHalfUp : stemHalfDown);
      const first = notes[0];
      const last = notes[notes.length - 1];
      const x0 = sxOf(first);
      const rawSlope = (last.noteY - first.noteY) / (sxOf(last) - x0);
      const slope = Math.max(-MAX_BEAM_SLOPE, Math.min(MAX_BEAM_SLOPE, rawSlope));
      // Anchor the beam so every stem in the group reaches the standard
      // length (r86); the slope then lengthens the rest.
      let anchor = stemUp ? Infinity : -Infinity;
      for (const n of notes) {
        const cand = n.noteY + dir * stemLen - slope * (sxOf(n) - x0);
        anchor = stemUp ? Math.min(anchor, cand) : Math.max(anchor, cand);
      }
      const beamY = (x: number): number => anchor + slope * (x - x0);
      for (const n of notes) {
        beamStemById.set(n.id, { sx: sxOf(n), tipY: beamY(sxOf(n)), up: stemUp });
      }
      // Level 1 is the primary beam; higher levels draw as runs of two or
      // more, or as stubs on singletons (a stub points at its left
      // neighbour when it has one, otherwise right).
      const maxFlags = Math.max(...notes.map((n) => n.flags));
      for (let level = 1; level <= maxFlags; level++) {
        const yOff = (level - 1) * beamLevelGap * -dir; // step toward the noteheads
        let i = 0;
        while (i < notes.length) {
          if (notes[i].flags < level) { i++; continue; }
          let j = i;
          while (j + 1 < notes.length && notes[j + 1].flags >= level) j++;
          let xa: number;
          let xb: number;
          if (j > i) {
            xa = sxOf(notes[i]);
            xb = sxOf(notes[j]);
          } else if (level > 1) {
            const sx = sxOf(notes[i]);
            xa = i > 0 ? sx - BEAM_STUB : sx;
            xb = i > 0 ? sx : sx + BEAM_STUB;
          } else {
            i = j + 1;
            continue;
          }
          beamParts.push(`<line x1="${xa}" y1="${round2(beamY(xa) + yOff)}" x2="${xb}" y2="${round2(beamY(xb) + yOff)}" stroke="#1a1612" stroke-width="${beamT}" data-beam-level="${level}"/>`);
          i = j + 1;
        }
      }
    };

    /**
     * Gould's positional direction for a group with no acoustic data: the
     * note furthest from the middle line decides, and an equidistant group
     * takes down-stems (r84; r85's no-clear-case convention; r91). One
     * direction serves the whole group, so a beat-group never splits for
     * position alone (r92). Semantic direction is the only thing that can
     * disagree within a beat, and that case still breaks the group above.
     *
     * INFERENCE, gap named: Gould's own beamed-group stem page (p. 24) is
     * missing from our extraction, and r102's furthest-from-the-middle-line
     * rule is stated for chords.
     */
    const positionalUp = (notes: BeamNote[]): boolean => {
      let furthest = notes[0];
      for (const n of notes) {
        if (Math.abs(n.noteY - o.staffMidY) > Math.abs(furthest.noteY - o.staffMidY)) furthest = n;
      }
      return furthest.noteY > o.staffMidY; // below the middle line → up-stem
    };

    const flush = (): void => {
      if (group.length >= 2) emit(group, groupUp ?? positionalUp(group));
      group = [];
      groupKey = '';
    };

    for (const { ev, x: nx } of placed) {
      const a = ev.type === 'note' && ev.pitch ? analyzed.events[ev.id] : undefined;
      const flags = ev.type === 'note' ? flagCount(ev.duration.base) : 0;
      if (!ev.pitch || flags < 1) { flush(); continue; }
      const ts = parsed.measures[ev.measureIndex]?.timeSignature ?? { beats: 4, beatType: 4 };
      // Timbre stays in the key, so adjacent notes that disagree still break
      // the group and fall back to flags (Dann's ruling, 2026-07-12). An
      // unanalysed note has no timbre to disagree about, so it groups by
      // beat alone and the group's direction is settled at flush.
      const key = `${ev.measureIndex}|${beatIndexOf(ev.rhythmicPosition.fraction, ts)}|${a ? a.timbre : 'positional'}`;
      if (key !== groupKey) flush();
      groupKey = key;
      groupUp = a ? a.timbre === 'close' : undefined;
      group.push({ id: ev.id, x: nx, noteY: yFor(ev.pitch), flags });
    }
    flush();
  }

  /**
   * Stem direction for one note, and the SINGLE source of truth for it:
   * semantics first, then a beamed note's group direction, then Gould's
   * positional default. Every consumer must call this rather than restate
   * the precedence, or the two copies drift and a stem silently stops
   * meaning what the legend says it means.
   */
  const stemUpFor = (ev: VocalLineEvent, noteY: number): boolean => {
    const a = ev.pitch ? analyzed.events[ev.id] : undefined;
    const beamed = beamStemById.get(ev.id);
    return a ? a.timbre === 'close' : beamed ? beamed.up : noteY > o.staffMidY;
  };

  const parts: string[] = [];
  // The svg tag and background are patched at the end, once the true
  // height (underlay placed clear of the lowest ink) is known.
  parts.push('');
  parts.push('');

  // ── Header geometry, derived instead of hardcoded ──
  // The clef sat at a fixed x of 34 and the key signature at 62, which at the
  // print stave put the clef 6.2 stave-spaces into the stave: a gap, not an
  // indent (Dann at the browser, 2026-08-06).
  //
  // Laid out BACKWARDS from `leftMargin`, where the first note sits, so the
  // caller still owns the content start and `sliceWidth` needs no knowledge of
  // the font to agree with this. Gould, in reverse order of application:
  //   r240, p. 42: two and a half stave-spaces from the last header symbol to
  //                a first note carrying no accidental;
  //   r236, p. 41: clef and key signature separated by one to one and a half;
  //   r81,  p. 6:  the clef is indented into the stave by one stave-space or
  //                slightly less, which is what fixes the stave's left edge.
  //
  // NOT implemented from r240, recorded: the run-in shortens to 1½ or 1
  // stave-spaces when the first note carries one or more accidentals.
  const clefGlyphName: RequiredGlyphName =
    clef === 'bass' ? 'fClef' : clef === 'treble-8vb' ? 'gClef8vb' : 'gClef';
  const ksGlyphName: RequiredGlyphName = fifths >= 0 ? 'accidentalSharp' : 'accidentalFlat';
  const clefW = smufl ? sp(smufl.glyph(clefGlyphName).widthSp) : 24;
  const ksCount = Math.abs(fifths);
  const ksStep = smufl ? sp(smufl.glyph(ksGlyphName).widthSp) + 1 : 9;
  const ksEnd = o.leftMargin - sp(2.5);
  const ksStart = ksEnd - ksCount * ksStep;
  const clefX = Math.max(0, (ksCount > 0 ? ksStart - sp(1) : ksEnd) - clefW);
  const staveLeft = round2(Math.max(0, clefX - sp(1)));

  // Staff lines.
  const staffLineT = smufl ? round2(sp(ed!.staffLineThickness)) : 1;
  for (let i = -2; i <= 2; i++) {
    const y = o.staffMidY + i * o.lineGap;
    parts.push(`<line x1="${staveLeft}" y1="${y}" x2="${round2(contentRight)}" y2="${y}" stroke="#3a352f" stroke-width="${staffLineT}"/>`);
  }

  // Clef at the head: SMuFL glyph on its reference line (treble winds
  // around the G line, bass around the F line with its dots either side;
  // Gould extraction v5, rule 80), or the primitive placeholder.
  parts.push(`<g data-clef="${clef}">`);
  // Primitive mode's clef shapes carry absolute coordinates drawn around the
  // old fixed x of 34, so they are translated as a group rather than rewritten;
  // primitive mode is the sandbox and font-lab path, not production.
  const primitiveShift = round2(clefX - 34);
  if (clef === 'bass') {
    const fLineY = o.staffMidY - o.lineGap;
    if (smufl) {
      parts.push(glyphAt('fClef', round2(clefX), fLineY, '#3a352f', true));
    } else {
      parts.push(`<g transform="translate(${primitiveShift},0)">`);
      parts.push(`<path d="M40 ${fLineY - 5} q10 -2 10 8 q0 12 -14 16" fill="none" stroke="#3a352f" stroke-width="2.2"/>`);
      parts.push(`<circle cx="54" cy="${fLineY - 3}" r="1.7" fill="#3a352f"/><circle cx="54" cy="${fLineY + 3}" r="1.7" fill="#3a352f"/>`);
      parts.push('</g>');
    }
  } else {
    const gLineY = o.staffMidY + o.lineGap;
    if (smufl) {
      parts.push(glyphAt(clef === 'treble-8vb' ? 'gClef8vb' : 'gClef', round2(clefX), gLineY, '#3a352f', true));
    } else {
      parts.push(`<g transform="translate(${primitiveShift},0)">`);
      parts.push(`<line x1="46" y1="${staffTop - 8}" x2="46" y2="${gLineY + 10}" stroke="#3a352f" stroke-width="2.2"/>`);
      parts.push(`<circle cx="46" cy="${gLineY}" r="4" fill="none" stroke="#3a352f" stroke-width="1.6"/>`);
      if (clef === 'treble-8vb') {
        parts.push(`<text x="46" y="${gLineY + 22}" text-anchor="middle" font-size="9" fill="#3a352f">8</text>`);
      }
      parts.push('</g>');
    }
  }
  parts.push('</g>');

  // Key signature at the head, at the selected clef's standard positions.
  const order = fifths >= 0 ? SHARP_ORDER : FLAT_ORDER;
  const glyph = fifths >= 0 ? ACCIDENTAL_GLYPH[1] : ACCIDENTAL_GLYPH[-1];
  const ksClef = clef === 'bass' ? KS_OCTAVES.bass : KS_OCTAVES.treble;
  const ksTable = fifths >= 0 ? ksClef.sharps : ksClef.flats;
  let ksX = ksStart;
  for (let i = 0; i < ksCount; i++) {
    const step = order[i];
    const ky = yFor({ step, octave: ksTable[step], alter: 0 });
    if (smufl) {
      parts.push(glyphAt(ksGlyphName, round2(ksX), ky, '#3a352f', true));
    } else {
      parts.push(`<text x="${round2(ksX)}" y="${ky + 4}" font-size="15" fill="#3a352f">${glyph}</text>`);
    }
    ksX += ksStep;
  }

  // ── Tuplet pass: bracket runs of identical tuplet info ──
  // Chunked by `actualNotes` (adjacent same-ratio groups split correctly);
  // rests inside a tuplet belong to its bracket. Standard black ink: the
  // appendix sample's blue is engraving cosmetics (Dann, 2026-07-12).
  const tupletParts: string[] = [];
  {
    let run: Placed[] = [];
    let runKey = '';
    const tupletT = smufl ? round2(sp(ed!.tupletBracketThickness)) : 1;
    const emit = (): void => {
      if (run.length >= 2) {
        const t = run[0].ev.duration.tuplet!;
        // The bracket clears ALL ink above the run (Dann's collision fix,
        // 2026-07-12): noteheads, the turning layer AND its accidentals,
        // and up-stem tips (beamed or flagged), not noteheads alone.
        const accClear = smufl ? Math.max(6, sp(smufl.glyph('accidentalSharp').bBoxNE[1])) : 12;
        let minY = staffTop;
        for (const p of run) {
          const ev = p.ev;
          if (!ev.pitch) continue;
          const y = yFor(ev.pitch);
          minY = Math.min(minY, y - 6);
          const a = analyzed.events[ev.id];
          if (a) minY = Math.min(minY, yFor(a.turningPitch) - accClear);
          // Any up-stem rises above the notehead and the bracket must clear
          // it, measured or not. Before N.4 only a close-timbre note could
          // stem up, so this was gated on `a`; unmeasured pages now stem up
          // positionally too and the old gate would let a bracket collide.
          if (ev.duration.base !== 'whole' && ev.duration.base !== 'breve' && stemUpFor(ev, y)) {
            const beamed = beamStemById.get(ev.id);
            minY = Math.min(minY, beamed ? beamed.tipY : y - stemLen);
          }
        }
        const yBr = minY - 8;
        highestInk = Math.min(highestInk, yBr);
        const xa = run[0].x - 8;
        const xb = run[run.length - 1].x + 8;
        const midX = (xa + xb) / 2;
        tupletParts.push(
          `<g data-tuplet="${t.actualNotes}">` +
          `<line x1="${xa}" y1="${yBr + 5}" x2="${xa}" y2="${yBr}" stroke="#1a1612" stroke-width="${tupletT}"/>` +
          `<line x1="${xa}" y1="${yBr}" x2="${midX - 7}" y2="${yBr}" stroke="#1a1612" stroke-width="${tupletT}"/>` +
          `<line x1="${midX + 7}" y1="${yBr}" x2="${xb}" y2="${yBr}" stroke="#1a1612" stroke-width="${tupletT}"/>` +
          `<line x1="${xb}" y1="${yBr}" x2="${xb}" y2="${yBr + 5}" stroke="#1a1612" stroke-width="${tupletT}"/>` +
          `<text x="${midX}" y="${yBr + 3.5}" text-anchor="middle" font-size="11" font-style="italic" fill="#1a1612">${t.actualNotes}</text>` +
          `</g>`,
        );
      }
      run = [];
      runKey = '';
    };
    for (const p of placed) {
      const t = p.ev.duration.tuplet;
      if (!t) { emit(); continue; }
      const key = `${p.ev.measureIndex}|${t.actualNotes}:${t.normalNotes}:${t.normalType}`;
      if (key !== runKey) emit();
      runKey = key;
      run.push(p);
      if (run.length === t.actualNotes) emit();
    }
    emit();
  }

  // ── Draw ──
  /**
   * Seeded with `incomingAccidentals` (N.102 increment 1b), which is NOT this
   * slice's first measure's own state: it is the closing state of the measure
   * before the slice, standing in for a bar this call never draws.
   *
   * Seeding it here rather than `prevMeasureAcc` is what makes the handoff
   * correct without a special case. The first pass through the measure-change
   * block below moves this into `prevMeasureAcc` and resets `measureAcc`, and
   * it does so under the SAME `curMeasure + 1` guard every later measure gets.
   * So a slice that opens on a tacet measure, whose first sung event lands in
   * rebased measure 1, drops the seed exactly as it should: the bar directly
   * before that event is the slice's own silent first bar, not the previous
   * system's last.
   */
  const carry = newAccidentalCarry(fifths, options.incomingAccidentals);
  const turningAcc: Record<string, number> = {};
  /**
   * N.102. The sung line's accidental state as it stood at the END of the
   * measure immediately before this one, which is what the courtesy
   * accidental across a barline is computed from.
   *
   * It holds only the (step, octave) keys that carried a STATED accidental in
   * that measure, because that is all `measureAcc` ever holds. A pitch the key
   * signature governed and nothing altered is absent, and absent is the right
   * answer: r121 is about a pitch that was altered, not about every pitch.
   *
   * It is carried only from the DIRECTLY preceding measure. A measure of rests
   * between two soundings clears it, because r121's "repeated in the next bar"
   * is not satisfied two bars later, and a tacet run clears it for the same
   * reason.
   */
  /* N.103 moved the two maps, the bar counter, and the barline step into
     `AccidentalCarry` and `carryIntoMeasure`, so `layoutColumns` walks the
     state exactly as this loop walks it and the spacer cannot disagree with the
     page about whether a courtesy draws. They are read off `carry` rather than
     destructured, because the barline step REPLACES `measureAcc` and a local
     binding would go stale at the first bar change. */

  // Collision-aware underlay (Dann's ruling, 2026-07-12): the text lines
  // are collected during the draw and placed below the lowest ink of the
  // system, never at a fixed offset that a down-stem beam can crash into.
  const underlay: Array<{ x: number; cyr: string; ipa: string; withheld: boolean; align: 'middle' | 'start'; sylType?: 'whole' | 'start' | 'middle' | 'end'; evId: string }> = [];
  // Melisma detection: the data model encodes a melisma by ABSENCE of
  // syllable on continuation notes, so a syllabled note followed by an
  // unsyllabled note starts one. Its syllable left-aligns at the first
  // notehead (the reading eye moves rightward); single-note syllables
  // stay centred. (Gould extraction rules 4 to 6.)
  const melismaStart = new Set<string>();
  const melismaEndX = new Map<string, number>(); // start id → last continuation notehead x
  interface MelismaSpan { startIdx: number; endIdx: number; id: string; slur: boolean }
  const melismaSpans: MelismaSpan[] = [];
  const slurredIdx = new Set<number>(); // placed indices under a syllabic slur
  {
    for (let i = 0; i < placed.length; i++) {
      const e = placed[i].ev;
      if (e.type !== 'note' || !e.syllable) continue;
      let j = i + 1;
      let lastX: number | null = null;
      while (j < placed.length && placed[j].ev.type === 'note' && !placed[j].ev.syllable) {
        lastX = placed[j].x;
        j++;
      }
      if (lastX !== null) {
        melismaStart.add(e.id);
        melismaEndX.set(e.id, lastX);
        // A melisma that is nothing but tied unisons takes no slur: the
        // tie already joins the syllable (extraction r5, r69, r150).
        let needsSlur = false;
        for (let k = i; k < j - 1; k++) {
          const a1 = placed[k].ev;
          const b1 = placed[k + 1].ev;
          const tiedUnison = !!a1.tied && (a1.tied.type === 'start' || a1.tied.type === 'continue')
            && !!a1.pitch && !!b1.pitch
            && a1.pitch.step === b1.pitch.step && a1.pitch.octave === b1.pitch.octave && a1.pitch.alter === b1.pitch.alter;
          if (!tiedUnison) { needsSlur = true; break; }
        }
        melismaSpans.push({ startIdx: i, endIdx: j - 1, id: e.id, slur: needsSlur });
        if (needsSlur) for (let k = i; k <= j - 1; k++) slurredIdx.add(k);
      }
    }
    // N.113: the runs the SINGER marked, found by the same rule over the same
    // geometry. A run is one or more CONSECUTIVE marked notes following a note
    // that DRAWS a syllable; `pairings.ts`'s `melismaRuns` is the canonical
    // statement of that rule and the one under test on the map.
    //
    // IT RUNS SECOND AND OVERWRITES, on purpose: where a file melisma and a
    // singer's mark describe the same opening note, the singer's is the later
    // decision and the longer reach.
    //
    // A MARKED NOTE CANNOT OPEN A RUN, so pressing Melisma on the first note of
    // a piece draws nothing. That is a state the hand can produce and it is
    // reported rather than prevented: refusing the press needs a rule nobody
    // has ruled, and seating a syllable to anchor it would be Ilya creating a
    // melisma, which E.46 forbids.
    //
    // NO SLUR. `melismaSpans` is deliberately not extended: Gould r5 slurs a
    // melisma, but a slur is engraving Ilya would be adding to the singer's
    // score on their behalf, and the brief asks for the extender alone. DESK
    // DEFAULT, 2026-09-07.
    const marks = options.melismaPreview;
    if (marks && marks.size > 0) {
      for (let i = 0; i < placed.length; i++) {
        const e = placed[i].ev;
        if (e.type !== 'note' || marks.has(e.id)) continue;
        const drawn = options.cyrPreview?.[e.id] ?? e.syllable?.text ?? '';
        if (!drawn) continue;
        let j = i + 1;
        let lastX: number | null = null;
        while (j < placed.length && placed[j].ev.type === 'note' && marks.has(placed[j].ev.id)) {
          lastX = placed[j].x;
          j++;
        }
        if (lastX !== null) {
          melismaStart.add(e.id);
          melismaEndX.set(e.id, lastX);
        }
      }
    }
  }
  // Phonation breaks render as [#] ON THE IPA LINE (Dann's ruling,
  // 2026-07-12): the break is a diction event, so it lives with the
  // diction, at the junction between the pair of notes it clips; above
  // the staff it reads as a stray sharp. Square brackets command
  // attention wherever one occurs.
  const breaks: number[] = [];
  const nextXById = new Map<string, number>();
  for (let i = 0; i < placed.length; i++) {
    nextXById.set(placed[i].ev.id, placed[i + 1]?.x ?? placed[i].x + 40);
  }

  // N.55b, path A (Dann's ruling, 2026-08-13). The PREVIOUS column's x,
  // mirroring `nextXById`. The two together bound each event's hit target at
  // the midpoints to its neighbours, so the targets tile the system without
  // overlapping and a click can never resolve to the wrong note.
  const prevXById = new Map<string, number>();
  for (let i = 0; i < placed.length; i++) {
    prevXById.set(placed[i].ev.id, placed[i - 1]?.x ?? placed[i].x - 40);
  }
  let lowestInk = staffBottom;

  /* ── THE TACET MEASURES ──────────────────────────────────────────────
     N.104. Every measure the singer counts appears on the page, whether or
     not the singer sings in it. A run of consecutive silent measures draws as
     ONE consolidated H-bar rest carrying the count above it; a single silent
     measure draws as a whole-measure rest with no numeral, by convention.

     The measure's extent is recovered from its BARLINES rather than from the
     column's own advance, so the rest stays centred in its bar after the
     system justifies. The left bound is the run's opening barline, or the end
     of the key signature where the run opens the system and there is no
     barline to open it. The right bound is the next column's barline, or the
     system's closing barline where the run ends the system.

     `TACET_REST` holds the four numbers and says which of them are convention
     and which come from the face. */
  for (const { run, x: tx, nextX, newMeasure } of tacetPlaced) {
    const left = newMeasure ? tx - 18 : ksEnd;
    const right = nextX === undefined ? contentRight : nextX - 18;
    const centre = (left + right) / 2;
    if (newMeasure) {
      const barT = smufl ? round2(sp(ed!.thinBarlineThickness)) : 1;
      parts.push(`<line x1="${round2(left)}" y1="${staffTop}" x2="${round2(left)}" y2="${staffBottom}" stroke="#3a352f" stroke-width="${barT}"/>`);
    }
    const runFrom = run.fromMeasure + o.measureOffset;
    parts.push(`<g data-tacet="${runFrom}-${runFrom + run.count - 1}" data-tacet-count="${run.count}">`);

    if (run.count === 1) {
      // One bar of silence is a whole-measure rest, hanging under the second
      // line from the top, exactly as `REST_SMUFL` already draws a whole rest.
      if (smufl) {
        parts.push(glyphAt('restWhole', centre, o.staffMidY - o.lineGap, '#3a352f'));
      } else {
        parts.push(`<rect x="${round2(centre - sp(0.64))}" y="${round2(o.staffMidY - o.lineGap - sp(0.29))}" width="${round2(sp(1.28))}" height="${round2(sp(0.29))}" fill="#3a352f"/>`);
      }
    } else {
      const inset = sp(TACET_REST.barInsetSp);
      const barLeft = left + inset;
      const barRight = right - inset;
      if (smufl) {
        const L = smufl.glyph('restHBarLeft');
        const R = smufl.glyph('restHBarRight');
        const M = smufl.glyph('restHBarMiddle');
        const wL = sp(L.bBoxNE[0] - L.bBoxSW[0]);
        const wR = sp(R.bBoxNE[0] - R.bBoxSW[0]);
        if (barRight - barLeft >= wL + wR) {
          // The composable H-bar. The two terminals are the face's own
          // glyphs; the body between them is the face's own `restHBarMiddle`
          // STRETCHED horizontally to the span, which is the one construction
          // whose thickness cannot disagree with the terminals it meets. The
          // middle glyph is a plain rectangle in both faces the project ships
          // (looked at in Finale Maestro at forty pixels to the stave-space),
          // so a horizontal scale distorts nothing.
          //
          // The alternative, tiling the middle glyph at its own advance,
          // opens a hairline seam wherever the advance rounds; a rect of this
          // desk's own thickness disagrees with the terminals by whatever the
          // face's stub is not.
          const lap = sp(0.2); // overlap into each terminal, so no seam opens
          const bodyLeft = barLeft + sp(L.bBoxNE[0]) - lap;
          const bodyRight = barRight - wR + lap;
          parts.push(glyphAt('restHBarLeft', barLeft - sp(L.bBoxSW[0]), o.staffMidY, '#3a352f', true));
          if (bodyRight > bodyLeft) {
            const mInk = sp(M.bBoxNE[0] - M.bBoxSW[0]);
            const scaleX = (bodyRight - bodyLeft) / mInk;
            parts.push(
              `<g transform="translate(${round2(bodyLeft)} 0) scale(${round2(scaleX)} 1)">` +
              `<text x="${round2(-sp(M.bBoxSW[0]))}" y="${round2(o.staffMidY)}" font-size="${glyphSize}px" font-family="${esc(o.fontFamily)}" fill="#3a352f">${M.char}</text>` +
              `</g>`,
            );
          }
          parts.push(glyphAt('restHBarRight', barRight - sp(R.bBoxNE[0]), o.staffMidY, '#3a352f', true));
        } else {
          // Too narrow to compose. The complete fixed-width H-bar, centred,
          // which overhangs rather than distorting the face's proportion.
          parts.push(glyphAt('restHBar', centre, o.staffMidY, '#3a352f'));
        }
      } else {
        const half = round2(sp(0.36));
        const capHalf = round2(sp(1.028));
        const capT = round2(sp(0.25));
        parts.push(`<rect x="${round2(barLeft)}" y="${round2(o.staffMidY - half)}" width="${round2(barRight - barLeft)}" height="${round2(half * 2)}" fill="#3a352f"/>`);
        for (const cx of [barLeft, barRight - capT]) {
          parts.push(`<rect x="${round2(cx)}" y="${round2(o.staffMidY - capHalf)}" width="${capT}" height="${round2(capHalf * 2)}" fill="#3a352f"/>`);
        }
      }

      // The count, above the staff and centred on the rest. The digits are
      // the time-signature digits, which is what SMuFL supplies for a
      // multibar rest's number.
      const digits = String(run.count);
      if (smufl) {
        const scale = TACET_REST.numeralScale;
        const metrics = [...digits].map((d) => smufl.glyph(DIGIT_SMUFL[Number(d)]));
        const widths = metrics.map((g) => sp(g.bBoxNE[0] - g.bBoxSW[0]) * scale);
        const total = widths.reduce((a, b) => a + b, 0);
        // The digits share one baseline, so the clearance is set by the
        // deepest of them and the crop by the tallest.
        const drop = Math.max(...metrics.map((g) => sp(-g.bBoxSW[1]) * scale));
        const rise = Math.max(...metrics.map((g) => sp(g.bBoxNE[1]) * scale));
        const baseline = staffTop - sp(TACET_REST.numeralClearanceSp) - drop;
        let dx = centre - total / 2;
        for (let i = 0; i < digits.length; i++) {
          const g = metrics[i];
          parts.push(
            `<text x="${round2(dx - sp(g.bBoxSW[0]) * scale)}" y="${round2(baseline)}" font-size="${round2(glyphSize * scale)}px" font-family="${esc(o.fontFamily)}" fill="#3a352f">${g.char}</text>`,
          );
          dx += widths[i];
        }
        highestInk = Math.min(highestInk, baseline - rise);
      } else {
        const baseline = staffTop - sp(TACET_REST.numeralClearanceSp);
        parts.push(`<text x="${round2(centre)}" y="${round2(baseline)}" text-anchor="middle" font-size="${round2(sp(2))}" fill="#3a352f">${digits}</text>`);
        highestInk = Math.min(highestInk, baseline - sp(2));
      }
    }
    parts.push('</g>');
  }

  for (const { ev, x: nx, newMeasure } of placed) {
    // N.102: the outgoing measure's state becomes the courtesy source, but only
    // for the measure that DIRECTLY follows it. A skipped index is a tacet run,
    // and nothing carries across one. The turning layer resets outright.
    carryIntoMeasure(carry, turningAcc, ev.measureIndex);
    if (newMeasure) {
      const barT = smufl ? round2(sp(ed!.thinBarlineThickness)) : 1;
      parts.push(`<line x1="${nx - 18}" y1="${staffTop}" x2="${nx - 18}" y2="${staffBottom}" stroke="#3a352f" stroke-width="${barT}"/>`);
    }

    if (ev.type === 'rest') {
      if (smufl) {
        const rest = REST_SMUFL[ev.duration.base];
        const ry = rest === 'restWhole' ? o.staffMidY - o.lineGap : o.staffMidY;
        parts.push(glyphAt(rest, nx, ry, '#3a352f'));
      } else {
        parts.push(`<rect x="${nx - 5}" y="${o.staffMidY - 3}" width="10" height="6" rx="1.5" fill="#3a352f"/>`);
      }
      continue;
    }
    const pitch = ev.pitch;
    if (!pitch) continue;
    const y = yFor(pitch);
    const a: AnalyzedEvent | undefined = analyzed.events[ev.id];
    const headName = headNameFor(ev.duration.base);
    const headHalfW = M.headHalfW(ev.duration.base);
    lowestInk = Math.max(lowestInk, y + 6);
    highestInk = Math.min(highestInk, y - 6);

    // Ledger lines.
    const ledgerHalf = M.ledgerHalf(ev.duration.base);
    const ledgerT = smufl ? round2(sp(ed!.legerLineThickness)) : 1;
    /**
     * The ledger lines a head at `y` needs, centred on `x`.
     *
     * ONE HELPER, TWO CALLERS, and that is the whole point. N.107, ruled by
     * Dann 2026-09-02: a turning head outside the stave had no ledger lines
     * at all, and in his words, "Without ledger lines, the noteheads are
     * meaningless." A head floating in blank air above the stave states no
     * pitch; the reader counts lines, and there was nothing to count. The fix
     * is not a second copy of this arithmetic in the turning block. Two copies
     * of "which stave positions does a head at `y` cross" are two answers
     * waiting to disagree the first time anything here is touched, so the sung
     * line and the turning layer call the same function or neither does.
     *
     * SPANNING THE SAME `ledgerHalf` AS THE SUNG HEAD, which the ruling names
     * and this signature enforces by taking no notehead base. In primitive
     * mode that is 11 px whatever the note; in SMuFL mode the turning head is
     * always `noteheadBlack`, so it differs from the sung head's extension
     * only under a half, whole or breve, where the turning ledger is a hair
     * wider than the head it carries. See the memo's NOT ESTABLISHED section.
     *
     * The lines are returned rather than pushed: the turning caller has to
     * stamp each one with `data-analysis` before it goes on the page, and a
     * helper that wrote straight to `parts` could not be filtered.
     */
    const drawLedgerLines = (x: number, ly0: number, colour: string, opacity: number): string[] => {
      const out: string[] = [];
      const op = opacity === 1 ? '' : ` opacity="${opacity}"`;
      const line = (ly: number): string =>
        `<line x1="${round2(x - ledgerHalf)}" y1="${ly}" x2="${round2(x + ledgerHalf)}" y2="${ly}" stroke="${colour}" stroke-width="${ledgerT}"${op}/>`;
      for (let ly = o.staffMidY - 3 * o.lineGap; ly >= ly0 - 1; ly -= o.lineGap) out.push(line(ly));
      for (let ly = o.staffMidY + 3 * o.lineGap; ly <= ly0 + 1; ly += o.lineGap) out.push(line(ly));
      return out;
    };
    parts.push(...drawLedgerLines(nx, y, '#3a352f', 1));

    // Accidental, if the note's alter differs from what's in effect.
    // Measure-opening notes nudge the accidental right so it clears the
    // barline at nx - 18 (Kimi's collision rule, 2026-07-12).
    //
    // THE RULE ITSELF LIVES IN `advanceAccidentalState` since N.102 increment
    // 1b, so `accidentalStateAtEndOf` can answer what a slice inherits by
    // making the same call this loop makes. Everything below decides only what
    // the mark LOOKS like; what it is was decided there.
    const mark = advanceAccidentalState(pitch, fifths, carry.measureAcc, carry.prevMeasureAcc);
    if (mark === 'required') {
      /* The width is `inkMetrics`'s in both modes since N.103, so the spacer's
         left extent and this placement are the same number. Primitive mode's
         `nx - 20` is now that arithmetic rather than a literal, and lands on
         the same pixel it always did. */
      const accW = M.accidentalW(pitch.alter);
      const gx = Math.max(nx - headHalfW - ACC_GAP_PX - accW, newMeasure ? (smufl ? nx - 16 : nx - 13) : -Infinity);
      if (smufl) {
        const name = ACCIDENTAL_SMUFL[pitch.alter];
        if (name) parts.push(partOfEvent(glyphAt(name, gx, y, '#1a1612', true), ev.id));
      } else {
        const g = ACCIDENTAL_GLYPH[pitch.alter] ?? '';
        if (g)
          parts.push(
            partOfEvent(
              `<text x="${round2(gx)}" y="${y + 4}" font-size="15" fill="#1a1612">${g}</text>`,
              ev.id,
            ),
          );
      }
    } else if (mark === 'courtesy') {
      /* ── THE COURTESY ACCIDENTAL ACROSS A BARLINE (N.102, increment 1) ──
         Gould p.81, extraction v7 rule 121, as distilled by the desk in
         `brief-n102-courtesy-accidentals_r1_2026-09-02.md` §2: a pitch altered
         in one bar and repeated in the next carries either a restated
         accidental or an explicit cancellation, EVEN THOUGH the barline has
         reset it, and even when the key signature already restores the pitch.
         The extraction itself is not on this machine, so the rule's own words
         are the brief's paraphrase and not a quotation. Until now this file
         had no courtesy accidental of any kind, and what a walk once read as
         one was a mandatory cancellation
         (`memo-mobile-slice4_r1_2026-08-27.md` §1).

         THE BRANCH IS AN `else`, so it can only fire where the required
         accidental did not. The three conditions on it are r121's own: the
         pitch was altered in the directly preceding bar (`prevMeasureAcc` has
         the key), it now sounds at a different alter, and no accidental has
         been stated for it yet in THIS bar. A required accidental is never
         parenthesized, and nothing here changes one.

         IT IS DRAWN ONCE. Writing `measureAcc` makes the bar behave as though
         the accidental had been stated, and clearing the key from
         `prevMeasureAcc` makes a second recurrence in this same bar draw
         nothing. Either alone would do it; both are written because the
         invariant is worth stating twice rather than inferring.

         KEYED ON STEP AND OCTAVE (r116), so B flat in bar 1 says nothing at
         all about a B in another octave in bar 2.

         AND IT IS INK, NOT A CONFIDENCE MARK. `#1a1612`, the same colour as
         every required accidental, never the analysis layer's lavender. A
         courtesy accidental is an engraving convention. It does not say Ilya
         is unsure; it says the singer is not misreading.

         SCOPE. Sung line only, this desk's default. The turning layer keeps
         its own per-measure state and draws no courtesy at all. Rule 122, the
         generous cautionaries of chromatic music, is NOT built here. */
      if (smufl) {
        const name = ACCIDENTAL_SMUFL[pitch.alter];
        if (name) {
          /* Parens left, accidental, parens right, with `COURTESY_GAP_SP` of
             air on each side of the accidental (increment 1a), and the whole
             cluster hung from the RIGHT: its right edge lands exactly where a
             bare accidental's right edge would, so the accidental keeps the
             position the required one would have taken and the brackets grow
             leftward from it.

             THE GAP GIVES BEFORE THE CLUSTER MOVES. A measure-opening cluster
             may reach back past the `nx - 16` floor that keeps it off the
             barline at `nx - 18`. When it does, `overrun` is how far, and the
             gap closes by half of it on each side, which buys back exactly
             that much and holds the right edge where it was. Only when the
             whole gap is spent does the cluster move right, and at that point
             `gap` is 0 and the arithmetic is increment 1's exactly, so the
             behaviour Dann walked on 2026-09-02 is what a cluster too wide for
             its bar still gets.

             HALF ON EACH SIDE rather than closing one gap first: the brackets
             stay symmetrical about the accidental at every width, and an
             asymmetric pair reads as a mistake rather than as tight spacing. */
          const { wL, wA, wR, gap: gapWanted } = M.courtesyParts(pitch.alter)!;
          const rightEdge = nx - headHalfW - ACC_GAP_PX;
          const floor = newMeasure ? nx - 16 : -Infinity;
          const overrun = Math.max(0, floor - (rightEdge - (wL + wA + wR + 2 * gapWanted)));
          const gap = Math.max(0, gapWanted - overrun / 2);
          const clusterW = wL + wA + wR + 2 * gap;
          const gx = Math.max(rightEdge - clusterW, floor);
          parts.push(partOfEvent(glyphAt('accidentalParensLeft', gx, y, '#1a1612', true), ev.id));
          parts.push(partOfEvent(glyphAt(name, gx + wL + gap, y, '#1a1612', true), ev.id));
          parts.push(partOfEvent(glyphAt('accidentalParensRight', gx + wL + gap + wA + gap, y, '#1a1612', true), ev.id));
        }
      } else {
        // Primitive mode has no font to measure, so it brackets with the
        // ordinary parentheses it already draws text with. The rule is the
        // renderer's, not the font's, and a mode that drew the required
        // accidental but not the courtesy would be wrong in the mode the
        // sandbox tests by default.
        const g = ACCIDENTAL_GLYPH[pitch.alter] ?? '';
        if (g)
          parts.push(
            partOfEvent(
              `<text x="${newMeasure ? nx - 16 : nx - 25}" y="${y + 4}" font-size="15" fill="#1a1612">(${g})</text>`,
              ev.id,
            ),
          );
      }
    }

    /* ── AUGMENTATION DOTS ───────────────────────────────────────────────
       Added 2026-08-28 on Dann's question: he could assign a dotted quarter
       and the arithmetic counted it, but nothing drew it. The correction half
       was complete — the dot cell reaches the stored diff, `durationFraction`
       gives a dot its 1.5x, and the measure tag counts it — and this file drew
       no dot at all.

       PLACEMENT IS GOULD'S, and the project already holds it: **r111, p.54**
       (`memo-gould-dimensional-priors_r1_2026-08-24.md`) — a duration dot sits
       about half a stave-space clear of the notehead, CENTRED IN A
       STAVE-SPACE, so a note sitting on a line takes the space ABOVE. That
       memo also flags r111's own hazard (its §4): half a space is inside the
       fill-in danger band, where a dot risks fusing into the notehead's ink at
       small sizes. The clearance is kept as Gould gives it and the caution is
       recorded here rather than silently widened.

       SIZE IS THE FONT'S, not a number of ours: the `augmentationDot` glyph
       was already in the registry (`smufl-metadata.ts:88`), so it is drawn and
       measured like every other glyph on the stave.

       THE SECOND DOT'S SPACING IS **NOT ESTABLISHED**. The priors memo covers
       one dot and says nothing about the gap between two, and the source is
       off this machine. Engraving convention is that a double dot repeats the
       same clearance, and that is what this does — marked so it can be checked
       if the book is ever photographed.

       AND IT CLEARS THE LEDGER LINES. A dot centred in a space can never land
       ON a ledger line, but outside the stave it would sit between two of
       them, so it is pushed past their extent rather than nested inside.

       `data-of-event` FOR THE SAME REASON THE ACCIDENTAL CARRIES IT: this is
       drawn outside the note's group, and the selection squircle unions by
       that handle. */
    const dotCount = ev.type === 'note' ? (ev.duration.dots ?? 0) : 0;
    /* The last dot's right ink edge, or `-Infinity` where there is no dot.
       READ BY THE TURNING UNIT BELOW (N.106): a dotted sung note's dots are
       part of the sung unit, so the turning unit clears them rather than the
       notehead. That is the whole reason this block stands where it does,
       ahead of the turning layer; it already did, so N.106 reordered
       nothing. */
    let dotsRight = -Infinity; // an OFFSET from `nx`, as `sungRightEdge` reads it
    if (dotCount > 0) {
      const steps = (y - o.staffMidY) / half;
      /* An even number of half-spaces from the middle line is a LINE. */
      const onLine = Math.abs(steps - Math.round(steps)) < 0.01 && Math.round(steps) % 2 === 0;
      const dotY = onLine ? y - o.lineGap / 2 : y;
      /* Placement and extent from one function since N.103, so the dot the
         spacer allows for is the dot this loop draws. */
      const geo = dotGeometry(M, ev.duration.base, dotCount, Math.abs(dotY - o.staffMidY) > 2 * o.lineGap);
      const clear = M.dotClear;
      const dotX = nx + geo.first;
      const dotW = M.dotW;
      dotsRight = geo.right;
      for (let d = 0; d < dotCount; d++) {
        const dx = dotX + d * (dotW + clear);
        parts.push(
          partOfEvent(
            smufl
              ? glyphAt('augmentationDot', dx, dotY, '#1a1612', true)
              : `<circle cx="${round2(dx + dotW / 2)}" cy="${round2(dotY)}" r="${round2(dotW / 2)}" fill="#1a1612"/>`,
            ev.id,
          ),
        );
      }
    }

    // N.71 (Dann, 2026-08-16): the group is `pointer-events="none"` so that
    // NOTHING painted in it can intercept a click, and the hit rectangle below
    // takes them all back with its own explicit `all`. Presentation attributes
    // inherit, and a child's own value wins, so this is the whole fix.
    //
    // WHY IT WAS NEEDED. Path A gave the note a big transparent rectangle
    // because the inked notehead is about 7 px across. But the notehead is
    // still painted ON TOP of that rectangle and was still interactive, so a
    // click on the notehead hit the glyph, `closest('[data-hit]')` found
    // nothing, and the click died. Measured on the deploy: a hit map of one
    // rectangle showed a dead vertical stripe straight down the middle. The one
    // place a musician aims was the one place that did nothing, and it stood
    // that way from 2026-08-13 until Dann walked it.
    parts.push(`<g data-event-id="${esc(ev.id)}" pointer-events="none">`);

    // N.55b, path A (Dann's ruling, 2026-08-13). A transparent hit target,
    // because the inked notehead measures about 7 px across and SVG hit-tests
    // painted geometry only: measured in Chrome on the deployed build, a click
    // 8 px off the glyph resolved to nothing at all. The rectangle carries no
    // paint, so it prints nothing, and it is emitted FIRST so every mark in
    // this group still draws over it. `highestInk` is deliberately untouched,
    // so the viewBox crop at the foot of this function is unaffected and the
    // rectangle is simply clipped to the page like any other element.
    //
    // `cursor: pointer` because a target that gives no sign it is a target is
    // one a singer never presses: N.71's second half, and the reason its first
    // half read as a broken app rather than as bad aim.
    {
      const hitL = ((prevXById.get(ev.id) ?? nx - 40) + nx) / 2;
      const hitR = (nx + (nextXById.get(ev.id) ?? nx + 40)) / 2;
      const hitTop = staffTop - 3.5 * o.lineGap;
      const hitBottom = staffBottom + 3.5 * o.lineGap;
      parts.push(`<rect data-hit="${esc(ev.id)}" x="${round2(hitL)}" y="${round2(hitTop)}" width="${round2(hitR - hitL)}" height="${round2(hitBottom - hitTop)}" fill="transparent" pointer-events="all" cursor="pointer"/>`);
    }

    // Lavender stemless turning-pitch notehead, with its own accidental state
    // (standard per-measure carry, independent of the sung line). It draws NO
    // courtesy accidental across a barline: N.102 is the sung line only, this
    // desk's default and Dann's to wave off.
    if (a) {
      const tp = a.turningPitch;
      const ty = yFor(tp);
      const tKey = `${tp.step}${tp.octave}`;
      const tInEffect = tKey in turningAcc ? turningAcc[tKey] : keySignatureAlter(tp.step, fifths);

      /* ── THE TURNING UNIT KEEPS TO THE RIGHT OF THE SUNG UNIT ────────────
         N.106, ruled by Dann at the page on 2026-09-02, and the principle is
         his, in his words: a sung note's accidental, notehead, and
         augmentation dots are ONE SEMANTIC UNIT (his term, a "TRIGLYPH"),
         the turning note's accidental and head are another (a "BIGLYPH"),
         and NO MARK FROM ONE UNIT MAY SIT INSIDE THE OTHER.

         GOULD 103'S RISING DIAGONAL IS RETIRED FOR THIS LAYER, on Dann's
         ruling of 2026-09-02. r103 spaces the two notes of a second inside
         ONE voice's chord, where the pair is read as a single shape; here
         the two marks belong to different voices and different alphabets,
         and the diagonal sent a lower turning note LEFT, through the sung
         note's own accidental and across the place a singer reads the sung
         pitch from. That was the rule this file carried from 2026-07-12
         until today. Nothing below chooses a side any more.

         THE RULE. At a third or more the turning head aligns with the sung
         head (`tx = nx`) and its accidental sits to its left, as today. At a
         unison or a second the WHOLE turning unit is displaced RIGHT, never
         left: the unit's left ink edge, which is its accidental's left edge
         when it has one and its head's left edge otherwise, sits at the
         sung unit's right ink edge + 1.6 + `TURNING_CLEARANCE_SP` x lineGap.
         The turning
         accidental is then drawn immediately left of the turning head INSIDE
         the unit, at the same head-to-accidental clearance the sung line
         uses. Nothing in the sung unit moves: system alignment was never the
         melody's to give up, and an offset is a collision device, never a
         timing statement.

         THE INTERVAL IS COUNTED IN STAVE STEPS, not in pixels, and that is a
         correction. Dann's ruling names `gap > o.lineGap` for "a third or
         more", which is the predicate this file already carried. But a
         stave STEP is half a stave space, so a third measures exactly one
         `lineGap` and `gap <= o.lineGap` swept thirds in with the seconds.
         The old rule therefore displaced a third too, and no fixture ever
         held one to catch it. `steps` states the interval the ruling names,
         and the boundary Dann called for, a third aligns, is a test.

         THE SUNG UNIT'S RIGHT EDGE is the rightmost ink the triglyph owns:
         the notehead, the augmentation dots where there are any (computed
         above, ahead of this block, for exactly this reason), and an UP-stem,
         which stands on the right of the head. A down-stem is on the left and
         a whole note has none. A FLAG IS NOT COUNTED: it flies from the stem
         tip, a stave and more from the turning unit's own height, so it can
         never be ink the biglyph sits inside. */
      const tHeadW = M.turningHeadW;
      const accName = smufl ? ACCIDENTAL_SMUFL[tp.alter] : undefined;
      const accChar = smufl ? '' : ACCIDENTAL_GLYPH[tp.alter] ?? '';
      const drawsAcc = tp.alter !== tInEffect && (smufl ? !!accName : !!accChar);
      const tAccW = drawsAcc ? M.turningAccW(tp.alter) : 0;
      const tAccGap = tAccW > 0 ? ACC_GAP_PX : 0; // the sung line's head-to-accidental clearance

      /* THE INTERVAL AND THE PLACEMENT ARE BOTH SHARED SINCE N.103. `staveSteps`
         counts the interval directly instead of dividing pixels by the
         half-space, and `turningUnitAt` seats the displaced unit. `columnInk`
         calls the same two, so the spacer cannot think a unit is aligned that
         this loop displaces. */
      let tx: number;
      if (staveSteps(tp, pitch) > 1) {
        tx = nx; // a third or more: aligned, and the accidental hangs to its left
      } else {
        const sungRight = sungRightEdge(M, ev.duration.base, stemUpFor(ev, y), dotsRight);
        tx = nx + turningUnitAt(M, sungRight, tAccW).tx;
      }

      /* THE TURNING HEAD COUNTS ITS OWN LEDGER LINES, N.107, and they are
         centred on `tx`, not on `nx`. That distinction is the whole reason
         this call sits AFTER the placement above rather than beside the sung
         line's: a displaced unit's head is a unit's width right of the sung
         head, and ledgers drawn under `nx` would sit under the sung note and
         say the wrong pitch about the turning one.

         THEY ARE ANALYSIS MARKS. A ledger line is engraving ink everywhere
         else in this file, but these belong to the lavender layer and vanish
         with it, so they carry `data-analysis` like the head they serve and
         the loupe's filter drops them with the rest (N.71's argument for the
         handle, made again). */
      for (const l of drawLedgerLines(tx, ty, TURNING_COLOUR, 0.85)) {
        parts.push(analysisMark(l, 'turning-ledger'));
      }

      if (drawsAcc) {
        // The measure-opening floor still holds the mark off the barline at
        // `nx - 18`. It can only bind in the ALIGNED case; a displaced unit is
        // far right of it, so the `Math.max` is a no-op there.
        const gx = Math.max(tx - tHeadW / 2 - tAccGap - tAccW, newMeasure ? (smufl ? nx - 16 : nx - 13) : -Infinity);
        if (smufl) {
          parts.push(analysisMark(glyphAt(accName!, gx, ty, TURNING_COLOUR, true), 'turning-accidental'));
        } else {
          parts.push(`<text data-analysis="turning-accidental" x="${round2(gx)}" y="${ty + 4}" font-size="14" fill="${TURNING_COLOUR}">${accChar}</text>`);
        }
        turningAcc[tKey] = tp.alter;
      }
      if (smufl) {
        parts.push(
          analysisMark(
            glyphAt('noteheadBlack', tx, ty, TURNING_COLOUR).replace('<text ', '<text opacity="0.85" '),
            'turning-notehead',
          ),
        );
      } else {
        parts.push(`<ellipse data-analysis="turning-notehead" cx="${round2(tx)}" cy="${ty}" rx="6" ry="4.4" fill="${TURNING_COLOUR}" opacity="0.85" transform="rotate(-18 ${round2(tx)} ${ty})"/>`);
      }
      lowestInk = Math.max(lowestInk, ty + 6);
      highestInk = Math.min(highestInk, ty - 6);
    }

    // Sung notehead: open for half and longer, filled otherwise.
    const openHead = ev.duration.base === 'half' || ev.duration.base === 'whole' || ev.duration.base === 'breve';
    if (smufl) {
      parts.push(glyphAt(headName, nx, y, '#1a1612'));
    } else {
      parts.push(openHead
        ? `<ellipse cx="${nx}" cy="${y}" rx="6.2" ry="4.6" fill="none" stroke="#1a1612" stroke-width="1.6" transform="rotate(-18 ${nx} ${y})"/>`
        : `<ellipse cx="${nx}" cy="${y}" rx="6.2" ry="4.6" fill="#1a1612" transform="rotate(-18 ${nx} ${y})"/>`);
    }

    // Stem direction, in precedence order. SEMANTICS FIRST, and the order
    // is the rule, not a convenience (Dann's ruling, 2026-08-05):
    //   1. where a turning pitch shares the stave, the melody's stem MUST
    //      state its timbre — open = down, close = up (analysis-types.ts:130).
    //      A beam may never override it. Adjacent notes of opposing timbre
    //      therefore cannot share a beam, which is why the beam pass keys
    //      its groups on timbre and the odd note out takes a flag.
    //   2. no acoustic data, but beamed: the group's direction, settled
    //      positionally at flush. Without it the stem would attach to the
    //      wrong side of the notehead.
    //   3. no acoustic data, unbeamed: Gould's positional default (r84).
    //      Above the middle line takes a down-stem, below takes an up-stem,
    //      on the line takes a down-stem by r85's no-clear-case convention.
    // 1 and 3 never both apply: `a` exists only where a profile does, so
    // Gould's positional rule is active only when no voice data constrains
    // the melody. The stem itself is no longer gated on `a`: an unmeasured
    // page still gets stems, and a stemless notehead stays reserved for a
    // turning pitch. Whole notes and breves excepted.
    const beamed = beamStemById.get(ev.id);
    const stemUp = stemUpFor(ev, y);
    if (ev.duration.base !== 'whole' && ev.duration.base !== 'breve') {
      // Stem contact y: from the notehead's anchor in SMuFL mode.
      const anchors = smufl ? smufl.glyph(headName).anchors : undefined;
      const contactY = smufl
        ? y - sp((stemUp ? anchors?.stemUpSE?.[1] : anchors?.stemDownNW?.[1]) ?? 0)
        : stemUp ? y - 1 : y + 1;
      if (beamed) {
        // The stem meets the beam; the beam replaces flags.
        parts.push(`<line x1="${round2(beamed.sx)}" y1="${round2(contactY)}" x2="${round2(beamed.sx)}" y2="${round2(beamed.tipY)}" stroke="#1a1612" stroke-width="${stemT}"/>`);
        lowestInk = Math.max(lowestInk, beamed.tipY + beamT / 2);
        highestInk = Math.min(highestInk, beamed.tipY - beamT / 2);
      } else {
        const sx = nx + (stemUp ? stemHalfUp : stemHalfDown);
        const sy2 = stemUp ? y - stemLen : y + stemLen;
        lowestInk = Math.max(lowestInk, sy2);
        highestInk = Math.min(highestInk, sy2);
        parts.push(`<line x1="${round2(sx)}" y1="${round2(contactY)}" x2="${round2(sx)}" y2="${sy2}" stroke="#1a1612" stroke-width="${stemT}"/>`);
        // Flags for unbeamed short notes.
        const flags = flagCount(ev.duration.base);
        if (flags > 0) {
          if (smufl) {
            const fg = FLAG_SMUFL[Math.min(flags, 3)];
            parts.push(glyphAt(stemUp ? fg[0] : fg[1], sx - stemT / 2, sy2, '#1a1612', true));
          } else {
            for (let f = 0; f < flags; f++) {
              const fy = sy2 + f * 6 * (stemUp ? 1 : -1);
              parts.push(`<path d="M${sx} ${fy} q8 3 7 12" fill="none" stroke="#1a1612" stroke-width="1.4"/>`);
            }
          }
        }
      }
    }

    // Red squircle around an fR1/fo crossing.
    if (a?.crossing) {
      parts.push(`<rect data-analysis="crossing" x="${nx - 11}" y="${y - 11}" width="22" height="22" rx="7" fill="none" stroke="#b23b3b" stroke-width="1.8"/>`);
      lowestInk = Math.max(lowestInk, y + 11);
      highestInk = Math.min(highestInk, y - 11);
    }

    // Phonation break: collected for the IPA line, drawn after the loop.
    if (a?.phonationBreak) {
      breaks.push((nx + (nextXById.get(ev.id) ?? nx + 40)) / 2);
    }

    parts.push(`</g>`);

    // Dual underlay, collected now and placed after the loop, once the
    // lowest ink is known (baseline repositioning, Dann's fix).
    const syl = ev.syllable;
    // `syl.text` is the primary (verse-1 lens) syllable text (§A.35); never
    // read `syl.verses` here, that array is real sung text for OTHER verses
    // (§A.86), not a display convenience, and must not be shown as if it
    // were this note's IPA. `options.ipaPreview` carries the full syllable
    // IPA. IT IS WIRED: `VoiceProfilePane.svelte:506` passes it into
    // `paginateScore` from `buildUnderlayResolvers(...).ipa` (N.5, 5 August).
    // This comment claimed otherwise until N.10 corrected it on 8 August;
    // demo and test callers still pass the fixture's placeholder strings.
    // The `a?.vowel` fallback is a degrade path only, for when no full-IPA
    // resolver ran at all; it is a single acoustic vowel, not the real
    // syllable transcription, so it reads as sparser wherever it is taken.
    // N.55b R6: the pairing's Cyrillic outranks the score's. See
    // `cyrPreview` above for why a paired score may have no other source.
    // N.113: a note the singer marked as a melisma continuation draws
    // NOTHING on either line, and this file says so itself rather than
    // trusting the caller to have blanked it. The sound is sustained, not
    // re-articulated, so there is no syllable and no onset to transcribe.
    const marked = options.melismaPreview?.has(ev.id) === true;
    const cyr = marked ? '' : (options.cyrPreview?.[ev.id] ?? syl?.text ?? '');
    const ipa = marked ? '' : (options.ipaPreview?.[ev.id] ?? a?.vowel ?? '');
    // N.10b. Withheld ONLY where nothing supplied ink, so the mark can never
    // displace a transcription, not even the degraded single-vowel one. A
    // melisma continuation carries no Cyrillic and is not withheld: it is
    // correctly silent, which is the distinction the mark exists to draw.
    const withheld = !ipa && !!cyr && options.withheldIpa?.has(ev.id) === true;
    if (cyr || ipa) {
      const isMelisma = melismaStart.has(ev.id);
      underlay.push({
        x: isMelisma ? round2(nx - headHalfW) : nx,
        cyr,
        ipa,
        withheld,
        align: isMelisma ? 'start' : 'middle',
        sylType: syl?.type,
        evId: ev.id,
      });
    }
  }

  // ── Ties (melisma build 3; Dann's Gould extraction, Section R). A tie
  // is FLAT and HEAD-ANCHORED — those two properties are its identity
  // against the slur. It curves away from the stems when the pair shares
  // a direction, away from the middle staff line when directions mix,
  // and its apex is nudged off staff lines. Drawn here, before the
  // underlay baselines are computed, because a downward tie is ink the
  // text must clear.
  for (let i = 0; i < placed.length; i++) {
    const e = placed[i].ev;
    if (e.type !== 'note' || !e.pitch || !e.tied) continue;
    if (e.tied.type !== 'start' && e.tied.type !== 'continue') continue;
    const nxt = placed[i + 1];
    if (!nxt || nxt.ev.type !== 'note' || !nxt.ev.pitch) continue;
    const y1 = yFor(e.pitch);
    const a1 = analyzed.events[e.id];
    const a2 = analyzed.events[nxt.ev.id];
    // Direction: OPPOSITE the syllabic slur when one arches above the
    // span (extraction r174); otherwise away from shared stems (open =
    // stems down → tie up); mixed or unanalysed: away from the middle
    // staff line.
    const up = slurredIdx.has(i)
      ? false
      : a1 && a2 && a1.timbre === a2.timbre
        ? a1.timbre === 'open'
        : y1 < o.staffMidY;
    const half1 = smufl ? sp(smufl.glyph(headNameFor(e.duration.base)).widthSp / 2) : 6.2;
    const half2 = smufl ? sp(smufl.glyph(headNameFor(nxt.ev.duration.base)).widthSp / 2) : 6.2;
    const x1 = placed[i].x + half1 + 1;
    const x2 = nxt.x - half2 - 1;
    if (x2 <= x1) continue;
    const ey = y1 + (up ? -4 : 4);
    let depth = (up ? -1 : 1) * o.lineGap * 0.9; // shallow: flatness is identity
    // Quadratic apex sits at ey + depth/2; keep it off staff lines.
    const apex = ey + depth / 2;
    if (apex >= staffTop && apex <= staffBottom && Math.abs((apex - staffTop) % o.lineGap) < 1.5) {
      depth += up ? -3 : 3;
    }
    /* A FILLED TWO-CURVE OUTLINE, not a stroked path. Dann's ruling of
       2026-08-27, from his walk: an engraved tie is a filled shape, thickest at
       its centre and tapering to fine points at both terminals, and a stroked
       path cannot taper at all. What stood here was one quadratic at a constant
       1.1 px, which drew a ribbon of one width end to end.

       OUT ALONG THE OUTER EDGE AND BACK ALONG THE INNER. The two curves share
       both terminals, so the shape meets at points there and swells to
       `TIE_CENTRE_SP` at the middle; the inner control is pulled toward the
       chord, which is what makes the swell. Everything that decided WHERE the
       tie goes is untouched: the terminals are still the two noteheads' own
       edges (`half1`, `half2` above), the height is still `lineGap * 0.9` with
       the staff-line nudge, and the direction is still chosen by the syllabic
       slur, then timbre, then staff position.

       MAESTRO CARRIES NO COMPOSABLE TIE. Searching all 2,728 glyph names in
       `FinaleMaestro.json` for `tie` or `slur` returns only articulations and
       `textTie`, which is the lyric elision character. SMuFL has none either,
       so ties stay drawn geometry and there was never a second option. */
    const tieInner = depth - Math.sign(depth) * sp(TIE_CENTRE_SP);
    const tieMid = round2((x1 + x2) / 2);
    parts.push(
      `<path d="M${round2(x1)} ${round2(ey)} Q ${tieMid} ${round2(ey + depth)} ${round2(x2)} ${round2(ey)} Q ${tieMid} ${round2(ey + tieInner)} ${round2(x1)} ${round2(ey)} Z" fill="#1a1612" data-tie="${esc(e.id)}"/>`,
    );
    lowestInk = Math.max(lowestInk, ey + Math.max(0, depth));
    highestInk = Math.min(highestInk, ey + Math.min(0, depth));
  }

  // ── Syllabic slurs (melisma build 4; extraction r69, r71, r174).
  // One arc joins the notes of a syllable, above the staff for a bass
  // melody so the text corridor below stays untouched, cleared above the
  // turning layer, its accidentals, and any up-stem or beam tips. Rests
  // never sit inside a span (detection breaks at rests), so the r70
  // suppression case cannot arise. Deeper than ties by design.
  {
    const accClearSlur = smufl ? Math.max(6, sp(smufl.glyph('accidentalSharp').bBoxNE[1])) : 12;
    for (const s of melismaSpans) {
      if (!s.slur) continue;
      const first = placed[s.startIdx];
      const last = placed[s.endIdx];
      let top = staffTop;
      for (let k = s.startIdx; k <= s.endIdx; k++) {
        const ev2 = placed[k].ev;
        if (!ev2.pitch) continue;
        const y2 = yFor(ev2.pitch);
        top = Math.min(top, y2 - 6);
        const a2 = analyzed.events[ev2.id];
        if (a2) top = Math.min(top, yFor(a2.turningPitch) - accClearSlur);
        // The same two N.4 faults the tuplet bracket had: this was gated on
        // close timbre, so an unmeasured page's positional up-stems never
        // pushed the slur clear, and the fallback was a hardcoded 30 px that
        // ignored the stave size.
        if (ev2.duration.base !== 'whole' && ev2.duration.base !== 'breve' && stemUpFor(ev2, y2)) {
          top = Math.min(top, beamStemById.get(ev2.id)?.tipY ?? y2 - stemLen);
        }
      }
      const sy = top - 6;
      const lift = Math.min(24, 10 + (last.x - first.x) / 20);
      // The control point, not the apex: the quadratic peaks at half the lift,
      // so this over-reserves rather than clipping.
      highestInk = Math.min(highestInk, sy - lift);
      parts.push(`<path d="M${round2(first.x)} ${round2(sy)} Q ${round2((first.x + last.x) / 2)} ${round2(sy - lift)} ${round2(last.x)} ${round2(sy)}" fill="none" stroke="#1a1612" stroke-width="1.3" data-slur="${esc(s.id)}"/>`);
    }
  }

  // Beams contribute ink below the staff on down-stem groups.
  for (const s of beamStemById.values()) {
    lowestInk = Math.max(lowestInk, s.tipY + beamT / 2);
    highestInk = Math.min(highestInk, s.tipY - beamT / 2);
  }

  // Underlay baselines: clear of the lowest ink, never above the classic
  // fixed offsets (compact systems keep their compact look).
  //
  // IPA IS THE NEAR LINE, Cyrillic beneath it (Dann's ruling, 2026-08-05).
  // Two reasons, and neither is cosmetic. Transcribe's word stack is already
  // IPA over Cyrillic (`Paper/WordStack.svelte:172, :181`), and Ilya's output
  // is ONE study document, so a singer learns the reading order once and
  // never relearns it when the score pages begin. And the IPA is the line
  // acted on at the moment of phonation, so it belongs nearest the notes:
  // Gould r13 asks the text to sit as close to the stave as it can and does
  // not say which line, so this serves her rationale rather than departing
  // from it (INFERENCE, r13 states no order for a pronunciation line; r45's
  // original-language-nearest rule governs two LANGUAGES, and IPA is not a
  // second language but a pronunciation guide, which she treats separately
  // at r49 and r50 without ordering it).
  const ipaY = Math.max(staffBottom + 28, Math.ceil(lowestInk) + 14);
  const cyrY = ipaY + 16;
  for (const u of underlay) {
    if (u.cyr) parts.push(`<text x="${u.x}" y="${cyrY}" text-anchor="${u.align}" font-size="12.5" fill="#1a1612">${esc(u.cyr)}</text>`);
    // IPA is ALWAYS upright, in the app's 'Lato IPA' subset (Mitton 2020
    // §§4.6.6–4.6.7 via Grayson): italics flatten double-storey [a] toward
    // single-storey, destroying the bright-a / dark-a contrast that sung
    // Russian depends on (dark [ɑ] default, bright [a] interpalatal only).
    if (u.ipa) parts.push(`<text x="${u.x}" y="${ipaY}" text-anchor="${u.align}" font-size="12" fill="#6a655f" font-family="'Lato IPA', sans-serif">${esc(u.ipa)}</text>`);
    // N.10b: the withheld sigla, standing in the IPA line's slot, sitting on
    // the same baseline as the transcription it replaces. Tagged
    // `data-withheld` with the event id, matching `data-hyphen` and
    // `data-extender`, so the mark is addressable in the DOM.
    else if (u.withheld) {
      const g = WITHHELD_SIGLA;
      const r = g.diameterPx / 2;
      // Melisma openings are left-anchored (Gould r5) and everything else is
      // centred, so the sigla follows whichever anchor its column uses.
      const cx = round2(u.align === 'start' ? u.x + r : u.x);
      const cy = round2(ipaY - g.baselineLiftPx);
      // The glyph is centred in the ring, not baselined, because the ring is
      // now what sits on the line.
      const sc = g.glyphPx / g.h;
      const tx = round2(cx - sc * (g.x + g.w / 2));
      const ty = round2(cy - sc * (g.y + g.h / 2));
      // The stroke straddles the path, so the drawn radius is pulled in by
      // half the ring to keep the OUTER diameter at `diameterPx`, which is
      // what `WITHHELD_SIGLA_WIDTH_PX` promised the spacing engine.
      const ringR = round2(r - g.ringPx / 2);
      parts.push(
        `<g data-withheld="${esc(u.evId)}">` +
          `<circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="${g.colour}" stroke-width="${g.ringPx}"/>` +
          `<g transform="translate(${tx} ${ty}) scale(${sc.toFixed(5)})" fill="${g.colour}"><path d="${g.path}"/></g>` +
        `</g>`,
      );
    }
  }
  // Phonation breaks: [#] on the IPA line, in full ink for attention.
  for (const bx of breaks) {
    parts.push(`<text data-analysis="phonation-break" x="${bx}" y="${ipaY}" text-anchor="middle" font-size="12" fill="#1a1612" font-family="'Lato IPA', sans-serif">[#]</text>`);
  }

  // ── Hyphens and extenders (melisma build 2; Dann's Gould extraction,
  // rules 26–40). The distinction is semantic: a hyphen is RAISED and
  // means the word continues; an extender sits ON THE BASELINE at
  // staff-line thickness and means the word has ended while its final
  // sound continues, running to the last notehead and no further.
  {
    // Measured advances, not a character count. The old `s.length * 7.5`
    // overstated any string with modifier letters by more than twice, so
    // hyphen and extender ends were computed from a width the glyphs never
    // occupied (`underlay-widths.ts`).
    const estW = (s: string): number => estimateCyrillicWidthPx(s, CYR_FONT_PX);
    const rightEdgeOf = (u: (typeof underlay)[number]): number =>
      u.align === 'start' ? u.x + estW(u.cyr) : u.x + estW(u.cyr) / 2;
    const leftEdgeOf = (u: (typeof underlay)[number]): number =>
      u.align === 'start' ? u.x : u.x - estW(u.cyr) / 2;
    const noteXs = placed.filter((p) => p.ev.type === 'note').map((p) => p.x);
    const hyphenY = cyrY - 4; // raised to roughly x-height midpoint

    // Hyphens: between consecutive syllables of one word (start|middle
    // followed by middle|end). One per gap; wide gaps fill at intervals;
    // a hyphen never sits directly under a note column (nudged clear).
    for (let i = 0; i < underlay.length - 1; i++) {
      const a = underlay[i];
      const b = underlay[i + 1];
      const joins = (a.sylType === 'start' || a.sylType === 'middle') && (b.sylType === 'middle' || b.sylType === 'end');
      if (!joins || !a.cyr || !b.cyr) continue;
      const from = rightEdgeOf(a) + 2;
      const to = leftEdgeOf(b) - 2;
      if (to <= from) continue;
      const count = Math.max(1, Math.floor((to - from) / 60));
      for (let k = 1; k <= count; k++) {
        let hx = from + ((to - from) * k) / (count + 1);
        if (noteXs.some((x2) => Math.abs(x2 - hx) < 7)) hx += 8; // clear of note columns
        hx = clampHyphenX(hx, from, to); // N.11: the nudge above is unbounded
        parts.push(`<line x1="${round2(hx - HYPHEN_HALF)}" y1="${hyphenY}" x2="${round2(hx + HYPHEN_HALF)}" y2="${hyphenY}" stroke="#1a1612" stroke-width="1" data-hyphen="${esc(a.evId)}"/>`);
      }
    }

    // Extenders: word-final syllable (whole|end) opening a melisma.
    for (const u of underlay) {
      if ((u.sylType === 'whole' || u.sylType === 'end') && melismaEndX.has(u.evId)) {
        const x1 = rightEdgeOf(u) + 3;
        const x2 = melismaEndX.get(u.evId)! + 6;
        if (x2 > x1) {
          parts.push(`<line x1="${round2(x1)}" y1="${cyrY}" x2="${round2(x2)}" y2="${cyrY}" stroke="#1a1612" stroke-width="${staffLineT}" data-extender="${esc(u.evId)}"/>`);
        }
      }
    }
  }

  // Beams and tuplet brackets (drawn once, after the notes they govern).
  parts.push(...beamParts);
  parts.push(...tupletParts);

  // Final barline.
  // The right-hand barline, at the stave's end. Ordinary weight on every
  // system; the thin-plus-thick pair of Gould r96 only where the piece ends,
  // with the thin line half a stave-space before the thick one, both inside
  // the width already committed to above.
  const endBarT = smufl ? round2(sp(ed!.thinBarlineThickness)) : 1;
  const endBarX = round2(contentRight - endBarT / 2);
  if (options.finalBarline) {
    const thickT = smufl ? round2(sp(ed!.thickBarlineThickness)) : 1.6;
    const thickX = round2(contentRight - thickT / 2);
    const thinX = round2(thickX - sp(0.5) - thickT / 2);
    parts.push(`<line x1="${thinX}" y1="${staffTop}" x2="${thinX}" y2="${staffBottom}" stroke="#3a352f" stroke-width="${endBarT}"/>`);
    parts.push(`<line x1="${thickX}" y1="${staffTop}" x2="${thickX}" y2="${staffBottom}" stroke="#3a352f" stroke-width="${thickT}"/>`);
  } else {
    parts.push(`<line x1="${endBarX}" y1="${staffTop}" x2="${endBarX}" y2="${staffBottom}" stroke="#3a352f" stroke-width="${endBarT}"/>`);
  }
  parts.push('</svg>');

  // Patch the svg tag and background with the true extent. The LOWER of the
  // two underlay baselines governs the bottom, which is the Cyrillic since
  // the swap; `highestInk` governs the top (N.6a).
  //
  // WHY THE TOP IS CROPPED RATHER THAN `staffMidY` REDUCED. `staffMidY`
  // defaults to a fixed 96 px and no caller scales it with `lineGap`, so on
  // the print sheet's 5.5 px stave every system reserved about 85 px above a
  // 22 px staff and a page fitted four systems where six belong (Dann at the
  // browser, 2026-08-06). Shrinking `staffMidY` would move every coordinate
  // in the system and could clip a high tessitura; cropping the viewBox
  // leaves every element's own y untouched, so the `data-event-id`
  // hit-testing math is unaffected, and the headroom is sized by what
  // actually occupies it (Gould r184: a gap is sized by what must live
  // inside it), never by a constant.
  //
  // `paginateScore` MUST read this viewBox's min-y. `viewBoxOf` was written
  // when the origin was always 0.
  const top = Math.max(0, Math.floor(Math.min(highestInk, staffTop) - sp(1)));
  const height = cyrY + 20 - top;
  parts[0] = `<svg viewBox="0 ${top} ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="'Source Serif 4', Georgia, serif">`;
  parts[1] = `<rect x="0" y="${top}" width="${width}" height="${height}" fill="#F0EBE0"/>`;
  return parts.join('\n');
}
