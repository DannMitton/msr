/**
 * Staff-renderer tests (production layout). The shared four-measure demo
 * fixture (see `demo-fixture.ts`) exercises rhythmic spacing, barlines,
 * accidentals (sung and turning layers, with the measure-opening nudge),
 * rests, flags, derived-by-beat beaming (primary, secondary, and the
 * timbre-change break), a bracketed triplet, and all four analytical marks
 * plus the `#` phonation break. String assertions over the pure SVG
 * output — no browser needed.
 *
 * Two modes are covered: the primitive shapes (byte-stable, the sandbox
 * default) and SMuFL glyph mode against a synthetic font.
 */

import { describe, expect, it } from 'vitest';
import {
  demoProfile,
  demoResolver,
  demoScore,
  renderDemo,
  renderDemoDotted,
  renderDemoUnmeasured,
  syntheticSmuflFont,
} from './demo-fixture';
import type { AnalyzedEvent, VoiceProfileSnapshot } from './analysis-types';
import { analyzeScore, pitchToHz } from './overlay-engine';
import type { ParsedScore, Pitch, VocalLineEvent } from './types';
import { prepareSmuflFont, REQUIRED_GLYPHS } from './smufl-metadata';
import { paginateScore } from './page-layout';
import {
  accidentalStateAtEndOf,
  BARLINE_ROOM,
  columnAdvance,
  clampHyphenX,
  COURTESY_GAP_SP,
  HYPHEN_HALF,
  layoutColumns,
  renderAnalyzedStaff,
  tacetRuns,
  TURNING_CLEARANCE_SP,
  columnInk,
  inkMetrics,
  newAccidentalCarry,
  INK_CLEAR_SP,
  TURNING_TRAIL_SP,
  type StaffRenderOptions,
} from './staff-renderer';

// ── N.11: a hyphen's ink stays inside the gap ────────────────────────
//
// Found by Dann at the browser, 2026-08-06: hyphens struck through the
// following letter, in «та-я», in «е-го», and twice on Kabalevsky page 2.
// The cause was the note-column nudge at the placement loop, which moves a
// hyphen 8 px right and never rechecks that it still fits.
//
// This covers the arithmetic. It does not prove the renderer calls it on
// every path; that is Dann's eye, and it is recorded as such.
describe('clampHyphenX', () => {
  it('leaves a hyphen that already fits exactly where it is', () => {
    expect(clampHyphenX(50, 40, 60)).toBe(50);
  });

  it('pulls back a hyphen the note-column nudge pushed past the right edge', () => {
    // The gap is 40 to 52 and the nudge lands the centre at 56, so the ink
    // would run from 53.5 to 58.5, entirely inside the following glyph.
    const hx = clampHyphenX(56, 40, 52);
    expect(hx + HYPHEN_HALF).toBeLessThanOrEqual(52);
    expect(hx - HYPHEN_HALF).toBeGreaterThanOrEqual(40);
  });

  it('never lets the ink cross either edge, wherever the nudge lands it', () => {
    const from = 100;
    const to = 130;
    for (let hx = 80; hx <= 150; hx += 0.5) {
      const c = clampHyphenX(hx, from, to);
      expect(c - HYPHEN_HALF, `centre ${hx}`).toBeGreaterThanOrEqual(from);
      expect(c + HYPHEN_HALF, `centre ${hx}`).toBeLessThanOrEqual(to);
    }
  });

  it('centres in a gap too narrow to hold the hyphen, rather than favouring one side', () => {
    // No legal centre exists here. Overhang both neighbours equally: half of
    // one of them is worse than a sliver of each.
    const from = 100;
    const to = 103;
    const c = clampHyphenX(120, from, to);
    expect(c).toBe(101.5);
    expect(c - from).toBe(to - c);
  });
});

/** The rendered contents of one note's `<g data-event-id>` wrapper. */
function eventGroup(svg: string, id: string): string {
  // The group carries attributes beyond its id since N.71, so this must not
  // demand a '>' straight after the quote.
  return svg.match(new RegExp(`<g data-event-id="${id}"[^>]*>([\\s\\S]*?)</g>`))?.[1] ?? '';
}

/**
 * A note's stem, as [contactY, tipY], from the single `<line>` inside its
 * event group (ledger lines and accidentals are emitted before the wrapper
 * opens). tipY > contactY is a down-stem.
 */
function stemEnds(svg: string, id: string): [number, number] | null {
  const m = eventGroup(svg, id).match(/<line [^>]*y1="([\d.]+)"[^>]*y2="([\d.]+)"/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

describe('staff renderer: layout', () => {
  const svg = renderDemo();

  it('is a well-formed standalone SVG', () => {
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
  });

  it('renders the key signature (one flat) at the bass-clef B2 position', () => {
    // B2 sits on the second staff line from the bottom: y 108, text baseline 112.
    // x is now DERIVED, not the old hardcoded 62: the key signature ends two
    // and a half stave-spaces before the first note (Gould r240), so at the
    // default stave it ends at leftMargin 92 − 30 = 62 and its single flat,
    // 9 px wide in primitive mode, starts at 53.
    expect(svg.includes('x="53" y="112"')).toBe(true);
  });

  it('renders a natural accidental where the note contradicts the key (B natural)', () => {
    expect(svg.includes('♮')).toBe(true);
  });

  it('draws a barline between the two measures and a final barline', () => {
    const barlines = svg.match(/y1="72"[^>]*y2="120"/g) ?? [];
    expect(barlines.length).toBeGreaterThan(1); // internal + final
  });

  it('draws a rest', () => {
    expect(svg.includes('width="10" height="6"')).toBe(true);
  });

  it('flags exactly the one unbeamed eighth note (n11, isolated by the timbre break)', () => {
    expect((svg.match(/q8 3 7 12/g) ?? []).length).toBe(1);
  });

  it('sets IPA upright in Lato IPA, preserving the bright-a/dark-a contrast', () => {
    // Both allophones present: dark [ɑ] (тьма) and interpalatal bright [a]
    // (пять, §4.6.6). The IPA line must never be italic: italics flatten
    // double-storey [a] and merge the two.
    expect(svg.includes('>tʲmɑ<')).toBe(true);
    expect(svg.includes('>pʲatʲ<')).toBe(true);
    expect(svg.includes(`fill="#6a655f" font-family="'Lato IPA', sans-serif"`)).toBe(true);
    expect(svg.includes('font-style="italic" fill="#6a655f"')).toBe(false);
  });

  it('places the NEAR underlay baseline clear of the lowest notation (collision fix)', () => {
    // Since the 2026-08-05 swap the IPA is the near line, so it is the one
    // that has to clear the ink. Asserting the Cyrillic here would pass
    // trivially, being the further of the two.
    const ipaY = Number(svg.match(/y="([\d.]+)" text-anchor="middle" font-size="12" fill="#6a655f"/)![1]);
    const inkBottoms = [...svg.matchAll(/y2="([\d.]+)" stroke="#1a1612" stroke-width="1\.5"/g)].map((m) => Number(m[1]));
    expect(inkBottoms.length).toBeGreaterThan(0);
    expect(ipaY > Math.max(...inkBottoms)).toBe(true);
  });

  it('puts the IPA nearest the stave with the Cyrillic beneath it, matching Transcribe', () => {
    const ipaY = Number(svg.match(/y="([\d.]+)" text-anchor="middle" font-size="12" fill="#6a655f"/)![1]);
    const cyrY = Number(svg.match(/y="([\d.]+)" text-anchor="middle" font-size="12\.5"/)![1]);
    expect(ipaY).toBeLessThan(cyrY);
  });
});

describe('staff renderer: beaming (derived by beat)', () => {
  const svg = renderDemo();

  it('draws five primary beams (n2+n3, n7+n8, n9+n10, the triplet, and the melisma pair)', () => {
    expect((svg.match(/data-beam-level="1"/g) ?? []).length).toBe(5);
  });

  it('double-beams the 16th pair (one secondary segment, no stubs needed)', () => {
    expect((svg.match(/data-beam-level="2"/g) ?? []).length).toBe(1);
  });

  it('never lets a beam override the semantic direction (open n9 down, close n11 up)', () => {
    // Where a turning pitch shares the stave the melody's stem must state
    // its timbre, so a beam can never dictate direction: n9 and n10 are
    // open and beam together with stems down; n11 is close, stems up, and
    // is therefore flagged rather than beamed with them. Mutation control
    // for the precedence order in the stem block.
    const [c9, t9] = stemEnds(svg, 'n9')!;
    expect(t9).toBeGreaterThan(c9);
    const [c11, t11] = stemEnds(svg, 'n11')!;
    expect(t11).toBeLessThan(c11);
  });

  it('breaks the beam where the timbre changes (n11 beams with nothing)', () => {
    // n11 shares measure and beat with n9/n10 but is close-timbre where
    // they are open; it must fall back to a flag (asserted above) and the
    // level-1 beam count must not gain a group for it.
    expect((svg.match(/data-beam-level="1"/g) ?? []).length).toBe(5);
    expect(svg.includes('data-event-id="n11"')).toBe(true);
  });
});

describe('staff renderer: melisma (build 1: detection and alignment)', () => {
  const svg = renderDemo();

  it('left-aligns the melisma syllable at its first notehead (Gould r5)', () => {
    // n18 opens a three-note melisma: both text lines anchor "start";
    // every single-note syllable stays centred.
    expect((svg.match(/text-anchor="start"/g) ?? []).length).toBe(2);
  });

  it('draws raised hyphens between syllables of one word, including across the rest', () => {
    // по-гру (one gap), гру-зи (across rest n4, wide gap), зи-сь: at
    // least three hyphens, all raised above the Cyrillic baseline.
    const hyphens = (svg.match(/data-hyphen="/g) ?? []).length;
    expect(hyphens > 2).toBe(true);
    expect(svg.includes('data-hyphen="n2"')).toBe(true); // по → гру
    expect(svg.includes('data-hyphen="n3"')).toBe(true); // гру → зи (rest between)
    expect(svg.includes('data-hyphen="n5"')).toBe(true); // зи → сь
  });

  it('never hyphenates after a whole-word syllable', () => {
    expect(svg.includes('data-hyphen="n1"')).toBe(false); // Ты is a whole word
  });

  it('draws a baseline extender for the word-final melisma, to the last notehead', () => {
    expect((svg.match(/data-extender="/g) ?? []).length).toBe(1);
    expect(svg.includes('data-extender="n18"')).toBe(true);
  });

  it('draws no extender on long single notes (n6, half note, no melisma)', () => {
    expect(svg.includes('data-extender="n6"')).toBe(false);
  });

  it('draws a flat, head-anchored tie between the tied melisma notes (n19→n20)', () => {
    expect((svg.match(/data-tie="/g) ?? []).length).toBe(1);
    expect(svg.includes('data-tie="n19"')).toBe(true);
  });

  it('curves the tie OPPOSITE the syllabic slur above it (downward, r174)', () => {
    // The RULE under test is unchanged: the tie bows away from the slur. What
    // changed on 2026-08-27 is the tie's SHAPE, from a stroked path of one
    // width to a filled two-curve outline, so the pattern follows the markup
    // and the assertion follows the rule.
    const m = svg.match(
      /M-?[\d.]+ (-?[\d.]+) Q -?[\d.]+ (-?[\d.]+) -?[\d.]+ -?[\d.]+ Q -?[\d.]+ (-?[\d.]+) -?[\d.]+ -?[\d.]+ Z" fill="#1a1612" data-tie="n19"/,
    );
    expect(m !== null).toBe(true);
    expect(Number(m![2]) > Number(m![1])).toBe(true); // outer control below endpoints
    // AND IT TAPERS: the inner control sits between the terminals and the outer
    // one, which is what gives the shape its centre thickness and its points.
    expect(Number(m![3]) > Number(m![1])).toBe(true);
    expect(Number(m![3]) < Number(m![2])).toBe(true);
  });

  it('draws one syllabic slur over the melisma, arching above the staff', () => {
    expect((svg.match(/data-slur="/g) ?? []).length).toBe(1);
    const m = svg.match(/M[\d.]+ ([\d.]+) Q [\d.]+ ([\d.]+) [\d.]+ [\d.]+" fill="none" stroke="#1a1612" stroke-width="1.3" data-slur="n18"/);
    expect(m !== null).toBe(true);
    expect(Number(m![1]) < 72).toBe(true); // endpoints above the top staff line
    expect(Number(m![2]) < Number(m![1])).toBe(true); // slur bows upward: opposite the tie
  });

  it('draws no underlay under melisma continuation notes', () => {
    // n19 and n20 carry no syllable; their columns must be empty of text.
    expect(svg.includes('data-event-id="n19"')).toBe(true);
    expect(svg.includes('data-event-id="n20"')).toBe(true);
    const cyrTexts = (svg.match(/font-size="12\.5"/g) ?? []).length;
    expect(cyrTexts).toBe(15); // 15 syllabled notes, unchanged by the melisma
  });
});

/* ── N.113: the melisma the SINGER marks ────────────────────────────
   The renderer's own detection reads the FILE (a note carrying a syllable
   followed by notes carrying none). That is blind to the singer, because on
   a lyric-bearing score every note carries a syllable. `melismaPreview` is
   the singer's channel; `pairings.ts`'s `melismaRuns` is the canonical
   statement of the rule these draw. */
describe('staff renderer: melisma (N.113, the singer\'s mark)', () => {
  it('draws an extender from a word-final syllable to the last marked note', () => {
    // n6 is `сь`, syllable type `end`, and carries no extender in the
    // fixture (asserted above). Marking n7 makes it open a run.
    const svg = renderDemo({ melismaPreview: new Set(['n7']) });
    expect(svg.includes('data-extender="n6"')).toBe(true);
    expect((svg.match(/data-extender="/g) ?? []).length).toBe(2); // n18's, and n6's
  });

  it('reaches the LAST marked note of the run, not the first', () => {
    const one = renderDemo({ melismaPreview: new Set(['n7']) });
    const two = renderDemo({ melismaPreview: new Set(['n7', 'n8']) });
    const endOf = (svg: string): number => {
      const m = svg.match(/<line x1="([\d.]+)" y1="[\d.]+" x2="([\d.]+)"[^>]*data-extender="n6"/);
      if (!m) throw new Error('no extender for n6');
      return Number(m[2]);
    };
    expect(endOf(two) > endOf(one)).toBe(true);
  });

  it('draws NOTHING on a marked note, on either line', () => {
    const bare = renderDemo();
    const marked = renderDemo({ melismaPreview: new Set(['n7']) });
    expect(bare.includes('>но<')).toBe(true);
    expect(marked.includes('>но<')).toBe(false);
    expect(bare.includes('>no<')).toBe(true);
    expect(marked.includes('>no<')).toBe(false);
  });

  it('draws no extender after a MID-WORD syllable, and the hyphen spans the run', () => {
    // n2 `по` is `start`, n3 `гру` is `middle`. Marking n3 opens a run at n2,
    // which is not word-final, so no extender: the hyphen carries the word
    // across instead, exactly as it already spans the rest at n4.
    const svg = renderDemo({ melismaPreview: new Set(['n3']) });
    expect(svg.includes('data-extender="n2"')).toBe(false);
    expect(svg.includes('data-hyphen="n2"')).toBe(true);
  });

  it('widens the spanning hyphen gap rather than leaving a hole', () => {
    // With n3 blanked the hyphen after n2 reaches the next drawn syllable,
    // so its gap is wider and the placement loop fills it with at least as
    // many hyphens as before.
    const bare = (renderDemo().match(/data-hyphen="n2"/g) ?? []).length;
    const spanned = (renderDemo({ melismaPreview: new Set(['n3']) }).match(/data-hyphen="n2"/g) ?? []).length;
    expect(spanned >= bare).toBe(true);
    expect(spanned > 0).toBe(true);
  });

  it('opens no run for a mark with no drawn syllable before it', () => {
    // n1 is the first note of the piece. A state the hand can produce.
    const svg = renderDemo({ melismaPreview: new Set(['n1']) });
    expect(svg.includes('data-extender="n1"')).toBe(false);
  });

  it('leaves the file\'s own melisma exactly as it was when nothing is marked', () => {
    expect(renderDemo({ melismaPreview: new Set() })).toBe(renderDemo());
  });


});

describe('staff renderer: turning-layer accidentals and tuplets (increment 3)', () => {
  const svg = renderDemo();

  it('renders the turning layer in the appendix sage, not the old grey', () => {
    expect(svg.includes('fill="#8E7E9B"')).toBe(true);
    expect(svg.includes('#9a968f')).toBe(false);
  });

  it('shows the turning D# sharp once, then carries it through the measure', () => {
    expect((svg.match(/fill="#8E7E9B">♯</g) ?? []).length).toBe(1);
  });

  it('draws no turning accidental for natural turning pitches', () => {
    expect((svg.match(/fill="#8E7E9B">♮/g) ?? []).length).toBe(0);
  });

  it('offsets a colliding turning notehead beside the sung note (two-voice rule)', () => {
    // n5: sung D3 on [i], turning pitch also D3 (unison). The sage notehead
    // shifts right of the sung one. N.106 restates the arithmetic: D3 takes a
    // down-stem, so the sung unit's right ink edge is its notehead's, at
    // 306 + 6.2, and the turning head's centre is 1.6 + 0.25x12 + 6.2 beyond
    // it: cx = 323.
    expect(svg.includes('cx="323"')).toBe(true);
  });

  it('sends a LOWER turning note right as well, the retired diagonal (N.106)', () => {
    // n11: sung E3 (y 90), turning D3 (y 96), a second with the turning note
    // BELOW. Until N.106 the pair kept Gould r103's rising diagonal and this
    // note displaced LEFT, to cx 646, through the sung note's own accidental
    // space. E3 takes an up-stem, so the sung unit's right edge is the stem's
    // at 660 + 5.5 + 0.75, and the turning head lands at 677.05.
    expect(svg.includes('cx="677.05"')).toBe(true);
    expect(svg.includes('cx="646"')).toBe(false);
  });

  it('brackets the triplet in black with its numeral', () => {
    expect((svg.match(/data-tuplet="3"/g) ?? []).length).toBe(1);
    expect(svg.includes('font-style="italic" fill="#1a1612">3<')).toBe(true);
  });

  it('nudges a measure-opening turning accidental clear of the barline', () => {
    // n13 opens measure 4: its sage sharp sits at nx - 13, right of the barline
    // at nx - 18, instead of the mid-measure nx - 19.
    //
    // x 761.25 since N.103, not 761: n11 carries a displaced turning unit, so
    // the advance to the rest that follows it now answers to `TURNING_TRAIL_SP`
    // and grew by a quarter of a pixel, which every column after it inherits.
    // That single column is the ONLY place the ink term binds on this fixture.
    expect(svg.includes('x="761.25" y="58"')).toBe(true);
  });
});

// ── N.106: the turning unit keeps to the right of the sung unit ──────
//
// Dann's ruling at the page, 2026-09-02, and his principle: a sung note's
// accidental, notehead, and augmentation dots are ONE SEMANTIC UNIT (his
// term, a "triglyph"), the turning note's accidental and head are another (a
// "biglyph"), and no mark from one unit may sit inside the other. At a third
// or more the turning head aligns with the sung head as it always has; at a
// unison or a second the WHOLE turning unit is displaced RIGHT, never left,
// and Gould r103's rising diagonal is retired for this layer.
//
// The cases are the ones the ruling names. Primitive mode throughout, the
// byte-stable sandbox default, so every number below is arithmetic a reader
// can check rather than a font's report.
// The one-note scene and its readers are shared by the N.106 and N.107
// blocks, which ask the same question of the same picture: where a turning
// unit's ink lands relative to the sung note's. They were hoisted out of the
// N.106 describe at N.107 rather than copied, for the reason the renderer
// itself gives for sharing `drawLedgerLines`: two fixtures that drift are
// worse than none.
const P = (step: Pitch['step'], octave: number, alter = 0): Pitch => ({ step, octave, alter });

/**
 * One bar, one sung note, and a turning pitch chosen BY CONSTRUCTION: the
 * engine takes the turning pitch as `hzToPitch(fR1 / 2)`, so naming the
 * pitch we want and doubling its frequency lands it exactly there, at
 * whatever interval from the sung note the case calls for. `fifths` is 0,
 * so a sharp turning pitch is one the turning layer must state.
 */
const scene = (sung: Pitch, turning: Pitch, dots = 0): string => {
  const parsed: ParsedScore = {
    source: { format: 'mnx', fidelity: 'native', origin: 'mnx-direct', sourceWarnings: [] },
    vocalPart: { partId: 'P1', partName: 'Voice' },
    measures: [{
      index: 0, number: '1',
      timeSignature: { beats: 4, beatType: 4 },
      keySignature: { fifths: 0 },
      expectedDuration: { numerator: 1, denominator: 1 },
    }],
    keySignatures: [{ measureIndex: 0, signature: { fifths: 0 } }],
    timeSignatures: [{ measureIndex: 0, signature: { beats: 4, beatType: 4 } }],
    tempoMarkings: [],
    vocalLine: [{
      id: 't1',
      type: 'note',
      measureIndex: 0,
      rhythmicPosition: { fraction: { numerator: 0, denominator: 4 } },
      duration: {
        base: 'quarter',
        dots,
        fraction: dots > 0 ? { numerator: 3, denominator: 8 } : { numerator: 1, denominator: 4 },
      },
      pitch: sung,
    } satisfies VocalLineEvent],
  };
  const profile: VoiceProfileSnapshot = {
    fR1: { v: 2 * pitchToHz(turning) },
    range: { lowest: P('C', 3), highest: P('C', 6) },
    tessitura: { low: P('E', 4), high: P('A', 4) },
    passaggio: { primo: P('E', 4), secondo: P('A', 4) },
    label: 'test',
  };
  const analyzed = analyzeScore(parsed, profile, () => 'v', { generatedAt: '2026-09-02T00:00:00.000Z' });
  return renderAnalyzedStaff(parsed, analyzed, { clef: 'treble' });
};

/** The sung notehead's centre: the only bare `<ellipse cx=` on the page. */
const sungCx = (svg: string): number => Number(svg.match(/<ellipse cx="([-\d.]+)"[^>]*fill="#1a1612"/)![1]);
const turningCx = (svg: string): number =>
  Number(svg.match(/data-analysis="turning-notehead"[^>]*cx="([-\d.]+)"/)![1]);

describe('the turning unit keeps to the right of the sung unit (N.106)', () => {
  const turningAccX = (svg: string): number =>
    Number(svg.match(/data-analysis="turning-accidental"[^>]*x="([-\d.]+)"/)![1]);
  /**
   * The augmentation dot's centre. Primitive mode draws it as a `<circle>`,
   * and so does the treble clef's own ring, so this reads the one in the
   * note's ink colour.
   */
  const dotCx = (svg: string): number =>
    Number(svg.match(/<circle [^>]*cx="([-\d.]+)"[^>]*fill="#1a1612"/)![1]);

  const LINE_GAP = 12;      // the default stave
  const HEAD_HALF = 6.2;    // primitive notehead half-width, sung and turning alike
  const STEM_RIGHT = 6.25;  // STEM_HALF 5.5 + half the 1.5 px stem
  const OFFSET = 1.6 + TURNING_CLEARANCE_SP * LINE_GAP; // the air between the two units
  const ACC_W = 11.3;       // the primitive turning accidental's width
  const ACC_GAP = 1.5;      // head-to-accidental clearance, the sung line's own

  it('displaces the turning unit right at a UNISON', () => {
    // G4 sits below the middle line and takes an up-stem, so the sung unit's
    // right ink edge is the stem's, not the notehead's.
    const svg = scene(P('G', 4), P('G', 4));
    const nx = sungCx(svg);
    expect(turningCx(svg)).toBeCloseTo(nx + STEM_RIGHT + OFFSET + HEAD_HALF, 5);
    expect(turningCx(svg)).toBeGreaterThan(nx);
  });

  it('displaces the turning unit right at a SECOND ABOVE', () => {
    // A turning pitch ABOVE the sung note makes the timbre open, which forces
    // the sung stem DOWN (analysis-types.ts:130), and a down-stem is on the
    // left of the head. So the sung unit's right ink edge here is the
    // notehead's, and the turning unit is 0.05 px nearer than in the two
    // cases above. The rule is one rule; the sung unit's edge is what moved.
    const svg = scene(P('G', 4), P('A', 4));
    const nx = sungCx(svg);
    expect(turningCx(svg)).toBeCloseTo(nx + HEAD_HALF + OFFSET + HEAD_HALF, 5);
    expect(turningCx(svg)).toBeGreaterThan(nx);
  });

  it('displaces the turning unit right at a SECOND BELOW, which is the case that changed', () => {
    // Gould r103's diagonal sent this one LEFT, through the sung note's own
    // accidental space. It goes right now, and to the same place a second
    // above goes: the side is no longer a function of the interval's sign.
    const svg = scene(P('G', 4), P('F', 4));
    const nx = sungCx(svg);
    expect(turningCx(svg)).toBeCloseTo(nx + STEM_RIGHT + OFFSET + HEAD_HALF, 5);
    expect(turningCx(svg)).toBeGreaterThan(nx); // NOT left, and this is the assertion
    // And within a rounding hair of where a second ABOVE lands: the side no
    // longer depends on the interval's sign, only the sung stem does.
    expect(turningCx(svg) - turningCx(scene(P('G', 4), P('A', 4)))).toBeCloseTo(0.05, 5);
  });

  it('aligns the turning head with the sung head at a THIRD', () => {
    // The boundary the ruling's own pixel predicate would have missed: a
    // stave step is HALF a space, so a third measures exactly one `lineGap`
    // and `gap <= lineGap` swept it in with the seconds.
    const svg = scene(P('G', 4), P('B', 4));
    expect(turningCx(svg)).toBe(sungCx(svg));
  });

  it('clears a DOTTED sung note past its dot, and leaves the dot where it was', () => {
    const second = scene(P('G', 4), P('A', 4), 1);
    const third = scene(P('G', 4), P('B', 4), 1);
    // G4 is on a line, so the dot takes the space above; its ink runs to the
    // circle's centre plus its 2.4 px radius, and that is the sung unit's
    // right edge, further right than either the notehead or the stem.
    const dotRight = dotCx(second) + 2.4;
    expect(dotRight).toBeGreaterThan(sungCx(second) + STEM_RIGHT);
    expect(dotRight).toBeGreaterThan(sungCx(second) + HEAD_HALF);
    expect(turningCx(second) - HEAD_HALF).toBeCloseTo(dotRight + OFFSET, 5);
    // And nothing in the sung unit moved: the dot sits where it sits when the
    // turning pitch is a third away and nothing is displaced at all.
    expect(dotCx(second)).toBe(dotCx(third));
  });

  it('draws a displaced turning accidental RIGHT of the sung unit, never left of the sung head', () => {
    // A second below, with a sharp on the turning pitch. The accidental is
    // the unit's left ink edge, so IT lands at the clearance and the head
    // follows it; before N.106 this mark was drawn at nx - 19, inside the
    // sung triglyph.
    const svg = scene(P('G', 4), P('F', 4, 1));
    const nx = sungCx(svg);
    expect(turningAccX(svg)).toBeCloseTo(nx + STEM_RIGHT + OFFSET, 5);
    expect(turningAccX(svg)).toBeGreaterThan(nx);
    expect(turningCx(svg)).toBeCloseTo(turningAccX(svg) + ACC_W + ACC_GAP + HEAD_HALF, 5);
  });

  it('still draws a turning THIRD’s accidental left of the aligned head, as today', () => {
    // Sung A4, turning C#5: two stave steps, so the head aligns and the sharp
    // hangs to its left at the unchanged nx - 19.
    const svg = scene(P('A', 4), P('C', 5, 1));
    const nx = sungCx(svg);
    expect(turningCx(svg)).toBe(nx);
    expect(turningAccX(svg)).toBeCloseTo(nx - HEAD_HALF - ACC_GAP - ACC_W, 5);
    expect(turningAccX(svg)).toBeLessThan(nx);
  });
});

// ── N.107: the turning head counts its ledger lines ──────────────────
//
// Ruled by Dann 2026-09-02, in his words: "Without ledger lines, the
// noteheads are meaningless." A turning head above or below the stave was
// drawn in blank air, and a reader counts lines to know what a floating head
// says. The sung line has drawn its own since the first build; the turning
// layer never drew any.
//
// Primitive mode throughout, the byte-stable sandbox default. The stave is
// the renderer's own: `staffMidY` 96, `lineGap` 12, so the stave lines are
// 72, 84, 96, 108 and 120, the first ledger position above is 60 and the
// first below is 132. The primitive ledger is 11 px each side of the head
// and 1 px thick.
describe('the turning head counts its ledger lines (N.107)', () => {
  const MID = 96;
  const GAP = 12;
  const HALF = 11;  // the primitive ledger's half-width, `inkMetrics.ledgerHalf`

  /**
   * The ledger lines on the page, by ink.
   *
   * The stave lines are drawn in the SAME colour and the same 1 px, so
   * colour alone cannot tell a ledger from a stave line. Width can: a ledger
   * is 22 px and a stave line runs the system. That is what this filters on,
   * and it is why the assertions below can count.
   */
  const ledgers = (svg: string, colour: string): string[] =>
    (svg.match(/<line [^>]*\/>/g) ?? []).filter((l) => {
      const m = l.match(/x1="([-\d.]+)"[^>]*x2="([-\d.]+)"/);
      return !!m && l.includes(`stroke="${colour}"`) && Number(m[2]) - Number(m[1]) === 2 * HALF;
    });
  const ys = (lines: string[]): number[] => lines.map((l) => Number(l.match(/y1="([-\d.]+)"/)![1]));
  const centre = (line: string): number => {
    const m = line.match(/x1="([-\d.]+)"[^>]*x2="([-\d.]+)"/)!;
    return (Number(m[1]) + Number(m[2])) / 2;
  };
  const round2 = (v: number): number => Math.round(v * 100) / 100;

  it('draws ONE lavender ledger line, at tx, for a turning head one line above', () => {
    // Sung B4 on the middle line, turning A5 sitting on the first ledger
    // above. Six stave steps apart, so the unit is aligned and tx is nx.
    const svg = scene(P('B', 4), P('A', 5));
    const lav = ledgers(svg, '#8E7E9B');
    expect(ys(lav)).toEqual([MID - 3 * GAP]);
    expect(centre(lav[0])).toBe(round2(turningCx(svg)));
    expect(lav[0]).toContain('data-analysis="turning-ledger"');
    expect(lav[0]).toContain('opacity="0.85"'); // the head's own opacity
  });

  it('draws THREE for a turning head three lines above', () => {
    // Turning E6, the third ledger above. Every position between the stave
    // and the head is drawn, top-down, as the sung line has always done.
    const svg = scene(P('B', 4), P('E', 6));
    expect(ys(ledgers(svg, '#8E7E9B'))).toEqual([MID - 3 * GAP, MID - 4 * GAP, MID - 5 * GAP]);
  });

  it('draws them BELOW the stave the same way', () => {
    // Turning C4, one ledger below. The ruling is symmetric and so is the
    // arithmetic; this holds the second loop to it.
    const svg = scene(P('B', 4), P('C', 4));
    expect(ys(ledgers(svg, '#8E7E9B'))).toEqual([MID + 3 * GAP]);
  });

  it('draws NONE for a turning head inside the stave', () => {
    // Sung B4, turning D5, both on the stave. Nothing is drawn, which is the
    // case the old code got right by drawing nothing at all.
    const svg = scene(P('B', 4), P('D', 5));
    expect(ledgers(svg, '#8E7E9B')).toEqual([]);
  });

  it('centres a DISPLACED unit’s ledgers on tx, not on nx', () => {
    // Sung A5, turning B5: a second, so N.106 displaces the whole turning
    // unit right, and the two heads share the first ledger position above.
    // The sung note's own ledger stays under nx and the turning note's goes
    // with the head that needs it. This is the case a ledger drawn at nx
    // would silently pass and a reader would silently misread.
    const svg = scene(P('A', 5), P('B', 5));
    const lav = ledgers(svg, '#8E7E9B');
    const black = ledgers(svg, '#3a352f');
    const nx = sungCx(svg);
    expect(ys(lav)).toEqual([MID - 3 * GAP]);
    expect(ys(black)).toEqual([MID - 3 * GAP]);
    expect(centre(black[0])).toBe(round2(nx));
    expect(centre(lav[0])).toBe(round2(turningCx(svg)));
    expect(centre(lav[0])).toBeGreaterThan(centre(black[0]));
  });

  it('leaves the sung line’s own ledger markup byte-identical', () => {
    // The refactor put both callers behind one `drawLedgerLines`, so the
    // sung line's output is now generated by new code. This pins it to the
    // exact string the old loop wrote: the attribute order, the ink, the
    // 1 px, the 11 px half-width, and NO `opacity`, which the helper emits
    // only when it is not 1. Sung C4 below the stave, turning D5 inside it,
    // so the only ledger on the page is the sung one.
    const svg = scene(P('C', 4), P('D', 5));
    const nx = sungCx(svg);
    const expected =
      `<line x1="${round2(nx - HALF)}" y1="${MID + 3 * GAP}" x2="${round2(nx + HALF)}" y2="${MID + 3 * GAP}" stroke="#3a352f" stroke-width="1"/>`;
    expect(ledgers(svg, '#3a352f')).toEqual([expected]);
    expect(svg).toContain(expected);
  });
});

describe('staff renderer: the four analytical criteria', () => {
  const svg = renderDemo();

  it('1. forced stems in both directions (open down, close up)', () => {
    expect((svg.match(/stroke-width="1\.5"/g) ?? []).length).toBeGreaterThan(1);
  });
  it('2. sage stemless turning-pitch noteheads', () => {
    expect(svg.includes('fill="#8E7E9B"')).toBe(true);
  });
  it('3. red squircle at the fR1/fo crossing (n6)', () => {
    expect(svg.includes('stroke="#b23b3b"')).toBe(true);
  });
  it('4. dual Cyrillic / IPA underlay', () => {
    expect(svg.includes('>Ты<')).toBe(true);
    expect(svg.includes('>tɨ<')).toBe(true);
  });
  it('renders the phonation break as [#] on the IPA line, not above the staff', () => {
    expect(svg.includes('>[#]<')).toBe(true);
    expect(svg.includes('fill="#4a4540"')).toBe(false); // the old above-staff mark
  });
  it('gives every analysis overlay its own handle, the phonation break included', () => {
    // Ruled by Dann 2026-08-27. The loupe shows engraving concerns only and is
    // a crop of this SVG, so it filters on this attribute. Two of these marks
    // could be found by their ink and the phonation break could not, which is
    // why the handle exists: a filter that caught three of four would suppress
    // half a layer. Asserted here so a later edit cannot drop one silently.
    for (const kind of ['turning-notehead', 'turning-accidental', 'crossing', 'phonation-break']) {
      expect(svg.includes(`data-analysis="${kind}"`), kind).toBe(true);
    }
    // And nothing the ENGRAVING draws carries it: the count is the count of
    // marks, not of noteheads.
    //
    // `turning-ledger` joined the census at N.107. The ledger lines under a
    // turning head outside the stave are the one piece of ordinary engraving
    // ink in this file that belongs to the analysis layer, because they say
    // nothing about the sung note and must leave when the layer does.
    expect((svg.match(/data-analysis="/g) ?? []).length).toBe(
      (svg.match(/data-analysis="turning-notehead"/g) ?? []).length +
        (svg.match(/data-analysis="turning-accidental"/g) ?? []).length +
        (svg.match(/data-analysis="turning-ledger"/g) ?? []).length +
        (svg.match(/data-analysis="crossing"/g) ?? []).length +
        (svg.match(/data-analysis="phonation-break"/g) ?? []).length,
    );
  });

  it('draws the turning layer in LAVENDER, because it is voice data', () => {
    // Ruled by Dann 2026-08-27, correcting 2026-07-12's sage. Lavender is the
    // project's shorthand for music and voice — the voice anchor, the loupe's
    // insertion bar and the drawer's correction stations all carry this token
    // — and a formant-derived turning pitch is voice data. Sage codes the
    // score document and its text, and was miscoding these.
    expect(svg.includes('fill="#8E7E9B"')).toBe(true);
    expect(svg.includes('#8B9A7D')).toBe(false);
  });

  it('keeps the handle on the turning marks whatever their ink', () => {
    // THIS IS THE POINT OF THE HANDLE. The colour moved from sage to lavender
    // and the loupe's filter needed no edit, because it stopped depending on
    // ink that a ruling might change. Asserted so the two cannot come apart:
    // every turning mark carries both its handle and the current colour.
    const turning = svg.match(/<[^>]*data-analysis="turning-[^"]*"[^>]*>/g) ?? [];
    expect(turning.length).toBeGreaterThan(0);
    for (const mark of turning) expect(mark).toContain('#8E7E9B');
  });

  it('binds a note’s accidental back to it with data-of-event', () => {
    // Dann's walk on `776c267`: the selection squircle sliced through the
    // accidental of the note it was meant to enclose, because an accidental is
    // emitted BEFORE the note's group opens and so has never been its child.
    // A handle, not geometry — "same y, a little to the left" works until the
    // first chord.
    const bound = svg.match(/data-of-event="([^"]+)"/g) ?? [];
    expect(bound.length).toBeGreaterThan(0);
    // Every id it names is a real event on the page.
    for (const m of bound) {
      const id = m.slice('data-of-event="'.length, -1);
      expect(svg.includes(`data-event-id="${id}"`), id).toBe(true);
    }
  });

  it('binds every note by data-event-id', () => {
    for (const id of ['n1', 'n2', 'n3', 'n5', 'n6']) {
      expect(svg.includes(`data-event-id="${id}"`)).toBe(true);
    }
  });

  // N.55b, path A. The hit target exists, it is transparent, and the targets
  // TILE without overlapping. An overlap would resolve a click to the wrong
  // note, which is a worse failure than the 7 px of ink it replaces.
  it('gives every bound note a transparent, non-overlapping hit target', () => {
    const rects = [
      ...svg.matchAll(
        /<rect data-hit="([^"]+)" x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="transparent" pointer-events="all" cursor="pointer"\/>/g,
      ),
    ].map((m) => ({ id: m[1], x: +m[2], w: +m[4] }));
    for (const id of ['n1', 'n2', 'n3', 'n5', 'n6']) {
      expect(rects.some((r) => r.id === id), id).toBe(true);
    }
    for (const r of rects) expect(r.w, r.id).toBeGreaterThan(0);
    const spans = rects.map((r) => [r.x, r.x + r.w]).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < spans.length; i++) {
      expect(spans[i][0] + 0.02, `span ${i}`).toBeGreaterThanOrEqual(spans[i - 1][1]);
    }
  });

  // N.71 (Dann, 2026-08-16). The rectangle existing is not enough: from
  // 2026-08-13 the notehead was painted over it and still interactive, so a
  // click on the note itself hit the glyph and died. Every event group is now
  // pointer-events="none" and only the rectangle takes them back.
  it('lets nothing painted in an event group intercept the hit target', () => {
    const groups = [...svg.matchAll(/<g data-event-id="([^"]+)"([^>]*)>/g)];
    expect(groups.length).toBeGreaterThan(0);
    for (const [, id, attrs] of groups) {
      expect(attrs, `group ${id}`).toContain('pointer-events="none"');
    }
  });

  // The other half of N.71: a target that gives no sign it is a target is one
  // a singer never presses. Dann found it by noticing the pointer never changed.
  it('shows a pointer cursor over a note', () => {
    for (const m of svg.matchAll(/<rect data-hit="([^"]+)"([^>]*)\/>/g)) {
      expect(m[2], `rect ${m[1]}`).toContain('cursor="pointer"');
    }
  });
});

describe('staff renderer: SMuFL glyph mode (increment 4)', () => {
  const font = syntheticSmuflFont();
  const svg = renderDemo({ font, fontFamily: 'TestFont' });

  it('replaces every shape primitive with glyphs (no ellipses, no flag paths)', () => {
    expect(svg.includes('<ellipse')).toBe(false);
    expect(svg.includes('q8 3 7 12')).toBe(false);
    expect(svg.includes('width="10" height="6"')).toBe(false); // primitive rest
  });

  it('renders the bass clef, noteheads, and rests as SMuFL codepoints', () => {
    expect(svg.includes(String.fromCodePoint(0xe062))).toBe(true); // fClef
    expect(svg.includes(String.fromCodePoint(0xe0a4))).toBe(true); // noteheadBlack
    expect(svg.includes(String.fromCodePoint(0xe0a3))).toBe(true); // noteheadHalf (n6)
    expect(svg.includes(String.fromCodePoint(0xe4e5))).toBe(true); // restQuarter
  });

  it('renders key-signature and layer accidentals as glyphs (flat, natural, sage sharp)', () => {
    expect(svg.includes(String.fromCodePoint(0xe260))).toBe(true); // accidentalFlat (key)
    expect(svg.includes(String.fromCodePoint(0xe261))).toBe(true); // accidentalNatural (n3)
    const lavenderSharp = new RegExp(`fill="#8E7E9B">${String.fromCodePoint(0xe262)}<`, 'g');
    expect((svg.match(lavenderSharp) ?? []).length).toBe(1); // turning D#, carried
  });

  it('renders the lone flag as a glyph (up-stem eighth n11)', () => {
    expect(svg.includes(String.fromCodePoint(0xe240))).toBe(true); // flag8thUp
  });

  it('derives stem thickness and beam thickness from engraving defaults', () => {
    expect(svg.includes('stroke-width="1.44"')).toBe(true); // 0.12 sp × 12
    expect((svg.match(/stroke-width="6" data-beam-level/g) ?? []).length).toBe(6); // 0.5 sp × 12; 5 primary + 1 secondary
  });

  it('tags glyph text with the requested font family', () => {
    expect(svg.includes('font-family="TestFont"')).toBe(true);
  });

  it('keeps the analytical marks and event bindings intact in glyph mode', () => {
    expect(svg.includes('stroke="#b23b3b"')).toBe(true);
    expect(svg.includes('>[#]<')).toBe(true);
    expect(svg.includes('data-event-id="n13"')).toBe(true);
    expect(svg.includes('>Ты<')).toBe(true);
  });
});

describe('staff renderer: the unmeasured page (N.4)', () => {
  // Before this fix the stem was gated on the acoustic event, so a page
  // rendered without a measured voice carried NO stems at all — and a
  // stemless notehead is this app's mark for a turning pitch, so every
  // printed melody note asserted something untrue. Nothing in the suite
  // covered this path: every note in the demo fixture is analysed.
  const svg = renderDemoUnmeasured();
  const measured = renderDemo();
  const stems = (s: string): number => (s.match(/stroke="#1a1612" stroke-width="1\.5"/g) ?? []).length;

  it('draws no acoustic marks at all: no turning layer, no crossing', () => {
    expect(svg.includes('#8E7E9B')).toBe(false);
    expect(svg.includes('stroke="#b23b3b"')).toBe(false);
  });

  it('stems every melody note, as many as the measured page does', () => {
    expect(stems(svg)).toBeGreaterThan(0);
    expect(stems(svg)).toBe(stems(measured));
  });

  it('takes Gould r84 below the middle line: F2 stems up', () => {
    const [contact, tip] = stemEnds(svg, 'n1')!;
    expect(tip).toBeLessThan(contact);
  });

  it('takes Gould r84 above the middle line: D4 stems down, where measured it stems up', () => {
    const [contact, tip] = stemEnds(svg, 'n6')!;
    expect(tip).toBeGreaterThan(contact);
    // The same note measured is close timbre, so semantics reverse it.
    const [mContact, mTip] = stemEnds(measured, 'n6')!;
    expect(mTip).toBeLessThan(mContact);
  });

  it('takes r85 on the middle line: D3 has no clear case, so it stems down', () => {
    const [contact, tip] = stemEnds(svg, 'n16')!;
    expect(tip).toBeGreaterThan(contact);
  });

  it('gives a beat-group one direction from its furthest note, not per note (r92)', () => {
    // n9 (A2), n10 (Bb2), and n11 (E3) share measure 2, beat 1. A2 is
    // furthest from the middle line and lies below it, so the whole group
    // takes up-stems — including n11, which alone would stem down. The
    // group is never split for position; only timbre splits a group.
    const [contact, tip] = stemEnds(svg, 'n11')!;
    expect(tip).toBeLessThan(contact);
  });

  it('measures the stem in stave-spaces, not pixels (Gould r86: 3.5)', () => {
    // The mutation control for the defect Dann found on the printed page:
    // a hardcoded 30 px stem is 2.5 stave-spaces at the test stave size and
    // 5.45 at the production stave size of 5.5, longer than the staff is
    // tall. Stem length must hold at 3.5 stave-spaces at ANY size, so this
    // asserts it at two, and fails for any hardcoded pixel value.
    for (const lineGap of [12, 6]) {
      const s = renderDemoUnmeasured({ lineGap });
      const g = eventGroup(s, 'n6'); // unbeamed half note, no turning head
      const headY = Number(g.match(/<ellipse cx="[\d.]+" cy="([\d.-]+)"[^>]*fill="none"/)![1]);
      const tipY = Number(g.match(/<line [^>]*y2="([\d.-]+)"/)![1]);
      expect(Math.abs(tipY - headY)).toBeCloseTo(3.5 * lineGap, 5);
    }
  });

  it('beams by beat with no flags left over, where the measured page flags n11', () => {
    expect((svg.match(/q8 3 7 12/g) ?? []).length).toBe(0);
    expect((measured.match(/q8 3 7 12/g) ?? []).length).toBe(1);
    expect((svg.match(/data-beam-level="1"/g) ?? []).length).toBe(5);
  });
});

describe('staff renderer: how a system ends (N.6b-1)', () => {
  // Gould r96 and r224: the beam-thick-plus-thin pair belongs to the bar that
  // ends the PIECE. Every system used to draw one, so every system announced
  // the song was over, and the stave then ran on past it into empty space.
  const plain = renderDemo();
  const final = renderDemo({ finalBarline: true });
  // The first `<line>` in the document is the top staff line. Its x1 is no
  // longer 0: the stave's left edge is derived, one stave-space before the
  // clef (Gould r81), so the pattern must not assume a fixed origin.
  const staffLine = (s: string): { x1: number; x2: number } => {
    const m = s.match(/<line x1="([\d.]+)" y1="[\d.]+" x2="([\d.]+)"/)!;
    return { x1: Number(m[1]), x2: Number(m[2]) };
  };
  const staffRight = (s: string): number => staffLine(s).x2;
  const barXs = (s: string): number[] =>
    [...s.matchAll(/<line x1="([\d.]+)" y1="72" x2="[\d.]+" y2="120"/g)].map((m) => Number(m[1]));

  it('stops the stave at its closing barline, with no empty continuation', () => {
    // The barline's CENTRE sits half its stroke inside the stave end so the
    // stroke's outer edge lands exactly there. The property under test is
    // that no stave runs on past it, not that the two numbers are equal: the
    // old design continued 18 px beyond, which this catches and half a pixel
    // of stroke geometry does not.
    const overhang = staffRight(plain) - Math.max(...barXs(plain));
    expect(overhang).toBeGreaterThanOrEqual(0);
    expect(overhang).toBeLessThanOrEqual(1);
  });

  it('closes an ordinary system with an ordinary barline, not the thick one', () => {
    // Primitive mode: thin barlines are 1, the r96 thick line is 1.6.
    expect(plain.includes('y1="72" x2')).toBe(true);
    expect(plain.includes('y2="120" stroke="#3a352f" stroke-width="1.6"')).toBe(false);
  });

  it('draws the r96 pair only when the piece ends there', () => {
    expect(final.includes('y2="120" stroke="#3a352f" stroke-width="1.6"')).toBe(true);
    // The thin partner sits half a stave-space before the thick line.
    const xs = barXs(final).sort((a, b) => a - b);
    const gap = xs[xs.length - 1] - xs[xs.length - 2];
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(12); // one lineGap at the default stave
  });

  it('indents the clef one stave-space into the stave (Gould r81)', () => {
    // SMuFL mode, because there the clef is a single glyph whose x can be read;
    // the primitive clef is a translated group of hand-drawn shapes.
    const s = renderDemo({ font: syntheticSmuflFont(), fontFamily: 'TestFont' });
    const clefX = Number(
      s.match(new RegExp(`<text x="([\\d.]+)"[^>]*>${String.fromCodePoint(0xe062)}<`))![1],
    );
    // One stave-space at the default lineGap of 12. Before this the clef sat at
    // a fixed x of 34 while the stave began at 24: a ten-pixel gap that read as
    // an inset rather than an indent, and 6.2 stave-spaces at the print stave.
    expect(clefX - staffLine(s).x1).toBeCloseTo(12, 1);
  });

  it('gives the last syllable a full stave-space before the barline', () => {
    // A half stave-space put [nuf] hard against it. Same width either way,
    // because the r96 pair is drawn inside the committed width.
    expect(staffRight(plain)).toBeCloseTo(staffRight(final), 0);
  });
});

describe('column advance: text-aware spacing (N.6b-1)', () => {
  // Real fixture events, read rather than reconstructed. n1 carries "Ты",
  // n13 carries "тьма", so their underlays differ in width.
  const byId = new Map(demoScore().vocalLine.map((e) => [e.id, e]));
  const n1 = byId.get('n1')!;
  const n13 = byId.get('n13')!;
  // Starve the duration and floor terms so the text term is what is under
  // test; all three compete for the maximum.
  const opts = { lineGap: 5.5, minGap: 1, pxPerWhole: 1 };

  it('lets the text term govern once duration and floor are small', () => {
    expect(columnAdvance(n1, n13, 0, opts)).toBeGreaterThan(opts.minGap);
  });

  it('grows with a wider syllable', () => {
    expect(columnAdvance(n13, n13, 0, opts)).toBeGreaterThan(columnAdvance(n1, n1, 0, opts));
  });

  it('discounts modifier letters rather than counting code points', () => {
    // Five code points each, but two of the second string's are modifier
    // letters that carry almost no advance. A character count would call
    // these equal; the measured table must not.
    const plain = columnAdvance(n1, n1, 0, { ...opts, ipaPreview: { n1: 'nitui' } });
    const modified = columnAdvance(n1, n1, 0, { ...opts, ipaPreview: { n1: 'nʲitʲ' } });
    expect(modified).toBeLessThan(plain);
  });

  it('never returns less than the floor', () => {
    expect(columnAdvance(n1, n13, 0, { ...opts, minGap: 500 })).toBe(500);
  });
});

// ── N.103: the spacer sees ink ───────────────────────────────────────
//
// `columnAdvance` knew `minGap`, the duration, and the underlay, and nothing
// about the accidentals, dots, courtesy clusters, and turning units the draw
// loop adds after the columns are placed. `columnInk` is that measurement, and
// the ink term is the fourth term it feeds.
//
// The clearance after a DISPLACED turning unit is `TURNING_TRAIL_SP`, not
// `INK_CLEAR_SP`, on Dann's ruling of 2026-09-02: the biglyph relates to the
// note before it, and a page that seats it 0.25 spaces from its parent and 0.5
// from the next note states the opposite of the meaning.
describe('columnInk (N.103)', () => {
  const P = (step: Pitch['step'], octave: number, alter = 0): Pitch => ({ step, octave, alter });
  const OPTS: StaffRenderOptions = { clef: 'treble' };
  const M = inkMetrics(OPTS);

  /** One note, in the bar and at the duration the case needs. */
  const note = (
    pitch: Pitch,
    over: Partial<{ id: string; measureIndex: number; base: 'quarter' | 'eighth'; dots: number }> = {},
  ): VocalLineEvent => ({
    id: over.id ?? 'c1',
    type: 'note',
    measureIndex: over.measureIndex ?? 0,
    rhythmicPosition: { fraction: { numerator: 0, denominator: 4 } },
    duration: {
      base: over.base ?? 'quarter',
      dots: over.dots ?? 0,
      fraction: { numerator: 1, denominator: 4 },
    },
    pitch,
  });

  /** A turning pitch, as the renderer's analysis layer supplies one. */
  const turning = (tp: Pitch, timbre: 'open' | 'close' = 'close'): AnalyzedEvent =>
    ({ turningPitch: tp, timbre }) as AnalyzedEvent;

  const inkOf = (
    ev: VocalLineEvent,
    a?: AnalyzedEvent,
    carry = newAccidentalCarry(0),
    turningState: Record<string, number> = {},
  ) => columnInk(ev, a, carry, turningState, OPTS);

  const HEAD_HALF = M.headHalfW('quarter');
  const ACC_GAP = 1.5;

  // G4 sits below the middle line, so Gould's positional default gives it an
  // up-stem and a `close` timbre gives it the same one. The two agree, which is
  // what keeps a bare note and an analysed note comparable below.
  const SUNG = P('G', 4);
  const SUNG_RIGHT = Math.max(HEAD_HALF, M.stemHalfUp + M.stemT / 2);

  it('measures a bare quarter as its notehead, both sides', () => {
    const ink = inkOf(note(SUNG));
    expect(ink.left).toBeCloseTo(HEAD_HALF, 6);
    // An up-stem is on the right of the head and stands a hair past its ink.
    expect(ink.right).toBeCloseTo(SUNG_RIGHT, 6);
    expect(ink.turningDisplaced).toBe(false);
  });

  it('adds a required flat, plus its clearance, on the left', () => {
    const ink = inkOf(note(P('B', 4, -1)));  // any pitch: the stem is on the other side
    expect(ink.left).toBeCloseTo(HEAD_HALF + ACC_GAP + M.accidentalW(-1), 6);
    expect(M.accidentalW(-1)).toBeGreaterThan(0);
  });

  it('adds the whole courtesy cluster on the left, parentheses and gaps included', () => {
    // B flat in bar 1, B natural in bar 2: r121's plain cancellation, and the
    // cluster is wider than the bare natural the required branch would draw.
    const carry = newAccidentalCarry(0);
    const turningState: Record<string, number> = {};
    inkOf(note(P('B', 4, -1), { id: 'c1', measureIndex: 0 }), undefined, carry, turningState);
    const ink = inkOf(note(P('B', 4, 0), { id: 'c2', measureIndex: 1 }), undefined, carry, turningState);
    expect(ink.left).toBeCloseTo(HEAD_HALF + ACC_GAP + M.courtesyClusterW(0), 6);
    expect(M.courtesyClusterW(0)).toBeGreaterThan(M.accidentalW(0));
  });

  it('adds the augmentation dot on the right', () => {
    const bare = inkOf(note(P('B', 4)));
    const dotted = inkOf(note(P('B', 4), { dots: 1 }));
    expect(dotted.right).toBeGreaterThan(bare.right);
    expect(dotted.right).toBeCloseTo(HEAD_HALF + M.dotClear + M.dotW, 6);
    expect(dotted.left).toBeCloseTo(bare.left, 6);
  });

  it('adds a DISPLACED turning unit on the right, and says so', () => {
    // A second above: N.106 displaces it, so the whole biglyph is ink to the
    // right of everything the sung note owns.
    const bare = inkOf(note(SUNG));
    const ink = inkOf(note(SUNG), turning(P('A', 4)));
    expect(ink.turningDisplaced).toBe(true);
    expect(ink.right).toBeCloseTo(
      SUNG_RIGHT + 1.6 + TURNING_CLEARANCE_SP * M.lineGap + M.turningHeadW,
      6,
    );
    expect(ink.left).toBeCloseTo(bare.left, 6);
  });

  it('adds an ALIGNED turning unit’s accidental on the left, and nothing on the right', () => {
    // Sung A4, turning C sharp 5: two stave steps, so the head aligns with the
    // sung head, the accidental is the column's leftmost ink, and the right is
    // untouched.
    const bare = inkOf(note(P('A', 4)));
    const ink = inkOf(note(P('A', 4)), turning(P('C', 5, 1)));
    expect(ink.turningDisplaced).toBe(false);
    expect(ink.right).toBeCloseTo(bare.right, 6);
    expect(ink.left).toBeCloseTo(M.turningHeadW / 2 + ACC_GAP + M.turningAccW(1), 6);
    expect(ink.left).toBeGreaterThan(bare.left);
  });

  it('measures a rest as its own glyph, never as nothing', () => {
    const rest: VocalLineEvent = {
      id: 'r1', type: 'rest', measureIndex: 0,
      rhythmicPosition: { fraction: { numerator: 0, denominator: 4 } },
      duration: { base: 'quarter', dots: 0, fraction: { numerator: 1, denominator: 4 } },
    };
    const ink = inkOf(rest);
    expect(ink.left).toBeCloseTo(M.restHalfW('quarter'), 6);
    expect(ink.right).toBeCloseTo(M.restHalfW('quarter'), 6);
    expect(ink.left).toBeGreaterThan(0);
  });

  it('gives primitive mode real widths, never a zero ink term', () => {
    const prim = inkMetrics({});
    const carry = newAccidentalCarry(0);
    const ink = columnInk(note(P('B', 4, -1)), undefined, carry, {}, { clef: 'treble' });
    expect(ink.left).toBeCloseTo(prim.headHalfW('quarter') + ACC_GAP + prim.accidentalW(-1), 6);
    expect(prim.accidentalW(-1)).toBeGreaterThan(0);
    expect(prim.courtesyClusterW(0)).toBeGreaterThan(0);
    expect(prim.turningHeadW).toBeGreaterThan(0);
  });
});

describe('the ink term in columnAdvance (N.103)', () => {
  const P = (step: Pitch['step'], octave: number, alter = 0): Pitch => ({ step, octave, alter });
  /** Starve the floor and the duration so the ink term is what is under test. */
  const OPTS: StaffRenderOptions = { clef: 'treble', minGap: 1, pxPerWhole: 1 };
  const M = inkMetrics(OPTS);

  const eighth = (id: string, pitch: Pitch): VocalLineEvent => ({
    id, type: 'note', measureIndex: 0,
    rhythmicPosition: { fraction: { numerator: 0, denominator: 8 } },
    duration: { base: 'eighth', dots: 0, fraction: { numerator: 1, denominator: 8 } },
    pitch,
  });
  const turning = (tp: Pitch): AnalyzedEvent => ({ turningPitch: tp, timbre: 'close' }) as AnalyzedEvent;
  const inkOf = (ev: VocalLineEvent, a?: AnalyzedEvent) =>
    columnInk(ev, a, newAccidentalCarry(0), {}, OPTS);

  it('clears a displaced turning unit by TURNING_TRAIL_SP, not by INK_CLEAR_SP', () => {
    // «лё ко»: two eighths a head apart, the first carrying a turning unit N.106
    // put to its right. This is the pair Dann read as cramped.
    const a = eighth('e1', P('B', 4));
    const b = eighth('e2', P('B', 4));
    const inkA = inkOf(a, turning(P('A', 4)));
    const inkB = inkOf(b);
    expect(inkA.turningDisplaced).toBe(true);
    const advance = columnAdvance(a, b, 1 / 8, OPTS, inkA, inkB);
    expect(advance).toBeGreaterThanOrEqual(inkA.right + inkB.left + TURNING_TRAIL_SP * M.lineGap);
    expect(advance).toBeCloseTo(inkA.right + inkB.left + TURNING_TRAIL_SP * M.lineGap, 6);
  });

  it('clears sung ink alone by INK_CLEAR_SP', () => {
    const a = eighth('e1', P('B', 4, -1));
    const b = eighth('e2', P('E', 4, 1));
    const inkA = inkOf(a);
    const inkB = inkOf(b);
    expect(inkA.turningDisplaced).toBe(false);
    const advance = columnAdvance(a, b, 1 / 8, OPTS, inkA, inkB);
    expect(advance).toBeGreaterThanOrEqual(inkA.right + inkB.left + INK_CLEAR_SP * M.lineGap);
    expect(advance).toBeCloseTo(inkA.right + inkB.left + INK_CLEAR_SP * M.lineGap, 6);
  });

  it('insists on more room after lavender than after the same note without it', () => {
    // The ruling in one comparison: the same two notes, the same rhythm, and
    // the only difference is that the first one carries a turning unit.
    const a = eighth('e1', P('B', 4));
    const b = eighth('e2', P('B', 4));
    const plain = columnAdvance(a, b, 1 / 8, OPTS, inkOf(a), inkOf(b));
    const lavender = columnAdvance(a, b, 1 / 8, OPTS, inkOf(a, turning(P('A', 4))), inkOf(b));
    expect(lavender).toBeGreaterThan(plain);
  });

  it('returns exactly the rhythm term when the ink term is smaller', () => {
    const a = eighth('e1', P('B', 4));
    const b = eighth('e2', P('B', 4));
    const wide = { ...OPTS, pxPerWhole: 4000 }; // an eighth is 500 px
    expect(columnAdvance(a, b, 1 / 8, wide, inkOf(a), inkOf(b))).toBe(500);
  });

  it('leaves a caller that measures no ink exactly where it was before N.103', () => {
    const a = eighth('e1', P('B', 4));
    const b = eighth('e2', P('B', 4));
    expect(columnAdvance(a, b, 1 / 8, OPTS)).toBeLessThan(
      columnAdvance(a, b, 1 / 8, OPTS, inkOf(a), inkOf(b)),
    );
  });
});

describe('staff renderer: system headroom (N.6a)', () => {
  // `staffMidY` is a fixed 96 px that no caller scales with `lineGap`, so at
  // the PRINT stave of 5.5 every system reserved roughly 85 px above a 22 px
  // staff and a page fitted four systems where six belong. At the default
  // stave of 12 the same 96 px is genuinely occupied (a D4 up-stem reaches
  // y 12), which is why the waste was invisible in this suite for months.
  const vbOf = (s: string) => {
    const m = s.match(/viewBox="0 ([\d.]+) ([\d.]+) ([\d.]+)"/)!;
    return { minY: Number(m[1]), width: Number(m[2]), height: Number(m[3]) };
  };
  /** Every y-bearing attribute of DRAWN content: lines 0 and 1 are the svg
   *  tag and the background rect, and the rect sits at min-y by definition,
   *  so including it would make the clipping assertion unfailable. Path data
   *  (slurs, ties) carries no y attribute and is not covered here; those are
   *  bounded in `highestInk` by their control point, which over-reserves. */
  const drawnYs = (s: string): number[] =>
    [...s.split('\n').slice(2).join('\n').matchAll(/\s(?:y|y1|y2|cy)="(-?[\d.]+)"/g)].map((m) => Number(m[1]));

  it('crops the unoccupied headroom at the print stave', () => {
    expect(vbOf(renderDemo({ lineGap: 5.5 })).minY).toBeGreaterThan(0);
  });

  it('clips nothing at either stave size', () => {
    for (const lineGap of [12, 5.5]) {
      const s = renderDemo({ lineGap });
      const ys = drawnYs(s);
      expect(ys.length).toBeGreaterThan(20);
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(vbOf(s).minY);
    }
  });

  it('shortens the system by exactly what it cropped', () => {
    const s = renderDemo({ lineGap: 5.5 });
    const { minY, height } = vbOf(s);
    const cyrY = Number(s.match(/y="([\d.]+)" text-anchor="middle" font-size="12\.5"/)![1]);
    expect(height).toBe(cyrY + 20 - minY);
  });
});

describe('staff renderer: clef passes (v37 §A.17)', () => {
  it('assesses the input when no clef option is given: the low demo takes bass', () => {
    expect(renderDemo().includes('data-clef="bass"')).toBe(true);
  });

  it('renders the treble pass on request: G-line circle, no bass dots', () => {
    const svg = renderDemo({ clef: 'treble' });
    expect(svg.includes('data-clef="treble"')).toBe(true);
    // Primitive treble marker circles the G4 line (staffMidY 96 + lineGap 12).
    expect(svg.includes('<circle cx="46" cy="108" r="4"')).toBe(true);
    // The bass primitive's paired dots must be gone.
    expect(svg.includes('cx="54"')).toBe(false);
  });

  it('places the treble key signature at the treble position (one flat on B4)', () => {
    const svg = renderDemo({ clef: 'treble' });
    // B4 = middle staff line y 96; primitive text baseline y + 4. Same derived
    // x as the bass pass: the header geometry does not depend on the clef's
    // pitch mapping, only on the clef's width.
    expect(svg.includes('x="53" y="100"')).toBe(true);
  });

  it('moves the notes with the clef: the same pitch sits lower on a treble staff', () => {
    const bass = renderDemo();
    const treble = renderDemo({ clef: 'treble' });
    const firstHeadY = (svg: string): number => Number(svg.match(/<ellipse cx="92" cy="([\d.-]+)"/)?.[1]);
    // Treble middle line is B4, twelve diatonic steps above bass's D3, so
    // the same written pitch drops by 12 half-gap steps (6 × lineGap = 72).
    expect(firstHeadY(treble) - firstHeadY(bass)).toBe(72);
  });

  it('renders treble-8vb with the primitive 8 below the clef', () => {
    const svg = renderDemo({ clef: 'treble-8vb' });
    expect(svg.includes('data-clef="treble-8vb"')).toBe(true);
    expect(svg.includes('>8<')).toBe(true);
  });

  it('renders the SMuFL gClef and gClef8vb codepoints in glyph mode', () => {
    const font = syntheticSmuflFont();
    const treble = renderDemo({ clef: 'treble', font, fontFamily: 'TestFont' });
    expect(treble.includes(String.fromCodePoint(0xe050))).toBe(true); // gClef
    expect(treble.includes(String.fromCodePoint(0xe062))).toBe(false); // no fClef
    const tenor = renderDemo({ clef: 'treble-8vb', font, fontFamily: 'TestFont' });
    expect(tenor.includes(String.fromCodePoint(0xe052))).toBe(true); // gClef8vb
  });
});

describe('augmentation dots', () => {
  // Added 2026-08-28 on Dann's question: a dotted quarter could be assigned
  // and counted, and nothing drew it. Placement is Gould r111, p.54, which the
  // priors memo already holds: half a stave-space clear of the notehead,
  // centred IN a stave-space, so a line note takes the space above.
  const svg = renderDemoDotted({ font: syntheticSmuflFont(), fontFamily: 'TestFont' });
  const DOT = String.fromCodePoint(0xe1e7);
  const dots = [...svg.matchAll(new RegExp(`<text[^>]*>${DOT}</text>`, 'g'))].map((m) => m[0]);

  it('draws a dot for a dotted note, and two for a double dot', () => {
    // n1 single, n3 double.
    expect(dots.length).toBe(3);
  });

  it('binds every dot to its own note, so the squircle can enclose it', () => {
    for (const d of dots) expect(d).toMatch(/data-of-event="/);
    expect(dots.filter((d) => d.includes('data-of-event="n1"')).length).toBe(1);
    expect(dots.filter((d) => d.includes('data-of-event="n3"')).length).toBe(2);
  });

  it('puts a LINE note’s dot in the space above, and a space note’s in its own', () => {
    const yOf = (mark: string): number => Number(/ y="(-?[\d.]+)"/.exec(mark)![1]);
    /* The SUNG notehead, found by its glyph and NOT by its place in the group.
       Two traps live here: the group opens with a hit rectangle, so "the first
       y" is not a notehead's; and the analysis layer draws a turning-pitch
       notehead in the same group, with the same glyph, earlier — taking that
       one reads the formant's pitch instead of the singer's. */
    const headY = (id: string): number => {
      const g = new RegExp(`<g data-event-id="${id}"[^]*?</g>`).exec(svg)![0];
      const heads = [...g.matchAll(/<text[^>]*>[\uE0A2-\uE0A4]<\/text>/g)]
        .map((m) => m[0])
        .filter((m) => !m.includes('data-analysis'));
      return yOf(heads[0]);
    };
    // n1 is F2, a space in bass clef: its dot shares the notehead's own y.
    const n1 = dots.find((d) => d.includes('"n1"'))!;
    expect(yOf(n1)).toBeCloseTo(headY('n1'), 5);
    // n3 is B2, a LINE: its dot rises into the gap above, by half a space.
    const n3 = dots.filter((d) => d.includes('"n3"'));
    expect(headY('n3') - yOf(n3[0])).toBeGreaterThan(0);
  });

  it('sets both of a double dot at the same height, and the second to the right', () => {
    const n3 = dots.filter((d) => d.includes('"n3"'));
    const xy = (m: string) => ({ x: Number(/ x="(-?[\d.]+)"/.exec(m)![1]), y: Number(/ y="(-?[\d.]+)"/.exec(m)![1]) });
    expect(xy(n3[1]).y).toBeCloseTo(xy(n3[0]).y, 5);
    expect(xy(n3[1]).x).toBeGreaterThan(xy(n3[0]).x);
  });

  it('draws no dot on an undotted note, which is every other event', () => {
    expect(dots.filter((d) => d.includes('"n2"')).length).toBe(0);
  });
});

// ── N.104: the measures the singer counts and does not sing in ───────
//
// Dann's ruling, 2026-08-27: "We absolutely must represent measures without
// voice content with a single rest and a number overtop of it saying how many
// measures are tacet for voice." The case that prompted it is the engraved
// Without Sun song 1, whose vocal part's measure 1 carries 0 notes, 0 rests
// and 0 lyrics while the piano's carries 5; the page omitted it, so the eye
// counted one bar fewer than the measure tag did.
//
// The geometry these assert is CONVENTION, recorded as such at `TACET_REST`.
// What they assert is the arithmetic rather than the taste: that the mark is
// centred in its measure, that the count is the run's length, and that the
// packer reserves the room the renderer spends.
describe('tacet measures', () => {
  // Written as codepoints rather than as literal characters: these live in
  // the Private Use Area, where an editor shows a box and a careless paste
  // silently changes one.
  const G = {
    restWhole: String.fromCodePoint(0xe4e3),
    hBarLeft: String.fromCodePoint(0xe4ef),
    hBarMiddle: String.fromCodePoint(0xe4f0),
    hBarRight: String.fromCodePoint(0xe4f1),
    digit: (d: number) => String.fromCodePoint(0xe080 + d),
  };
  const DIGIT_RANGE = /<text x="([-\d.]+)"[^>]*>([\u{E080}-\u{E089}])<\/text>/gu;

  /** The demo with `silent` emptied of vocal events, its measures intact. */
  const scoreSilentIn = (silent: number[]): ParsedScore => {
    const parsed = demoScore();
    return { ...parsed, vocalLine: parsed.vocalLine.filter((e) => !silent.includes(e.measureIndex)) };
  };
  const analyzedOf = (parsed: ParsedScore) =>
    analyzeScore(parsed, demoProfile, demoResolver, { generatedAt: '2026-07-12T00:00:00.000Z' });
  const render = (silent: number[], options: StaffRenderOptions = {}) => {
    const parsed = scoreSilentIn(silent);
    return renderAnalyzedStaff(parsed, analyzedOf(parsed), options);
  };
  const smufl = (): StaffRenderOptions => ({ font: syntheticSmuflFont(), fontFamily: 'TestFont' });

  /** The tacet group, found by counting tags: it nests a group of its own. */
  const tacetBlock = (svg: string): string => {
    const start = svg.indexOf('<g data-tacet');
    if (start < 0) return '';
    let depth = 0;
    for (const m of svg.slice(start).matchAll(/<g\b|<\/g>/g)) {
      depth += m[0] === '</g>' ? -1 : 1;
      if (depth === 0) return svg.slice(start, start + (m.index as number) + m[0].length);
    }
    return '';
  };

  it('finds a silent measure, and groups consecutive ones into one run', () => {
    expect(tacetRuns(scoreSilentIn([2]))).toEqual([{ fromMeasure: 2, toMeasure: 2, count: 1 }]);
    expect(tacetRuns(scoreSilentIn([1, 2, 3]))).toEqual([{ fromMeasure: 1, toMeasure: 3, count: 3 }]);
  });

  it('keeps two runs apart when a sung measure stands between them', () => {
    expect(tacetRuns(scoreSilentIn([0, 3, 4]))).toEqual([
      { fromMeasure: 0, toMeasure: 0, count: 1 },
      { fromMeasure: 3, toMeasure: 4, count: 2 },
    ]);
  });

  it('finds nothing where the singer sings in every measure', () => {
    expect(tacetRuns(demoScore())).toEqual([]);
  });

  it('finds nothing where the score declares no measures at all', () => {
    // A caller rendering a bare vocal line gets the pre-N.104 layout exactly.
    expect(tacetRuns({ ...demoScore(), measures: [] })).toEqual([]);
  });

  it('leaves the columns untouched where no measure is tacet', () => {
    // The guarantee the whole change rests on: with no run, `layoutColumns`
    // reproduces the arithmetic the renderer used before N.104, column for
    // column, so every score without a silent measure draws as it always did.
    const parsed = demoScore();
    const { columns, trailing } = layoutColumns(parsed);
    expect(columns.every((c) => c.ev && !c.tacet)).toBe(true);
    let prevMeasure = -1;
    let prevDurWhole = 0;
    let prevEv: (typeof parsed.vocalLine)[number] | undefined;
    parsed.vocalLine.forEach((ev, i) => {
      const newMeasure = ev.measureIndex !== prevMeasure;
      const advance = prevEv
        ? columnAdvance(prevEv, ev, prevDurWhole, {}) + (newMeasure ? BARLINE_ROOM : 0)
        : 0;
      expect(columns[i].advance, `column ${i}`).toBe(advance);
      expect(columns[i].newMeasure, `column ${i}`).toBe(newMeasure && i > 0);
      prevMeasure = ev.measureIndex;
      prevDurWhole = ev.duration.fraction.numerator / ev.duration.fraction.denominator;
      prevEv = ev;
    });
    expect(trailing).toBe(columnAdvance(prevEv as VocalLineEvent, undefined, prevDurWhole, {}));
  });

  it('draws one silent measure as a whole-measure rest, with no numeral', () => {
    // Consolidation starts at two: a single bar of silence is a whole rest by
    // convention, and a numeral over it would be counting to one.
    const block = tacetBlock(render([2], smufl()));
    expect(block).toContain('data-tacet="2-2"');
    expect(block).toContain('data-tacet-count="1"');
    expect(block).toContain(G.restWhole);
    expect(block).not.toContain(G.hBarLeft);
    expect(block).not.toContain(G.digit(1));
  });

  it('draws a run of several as one H-bar carrying the count', () => {
    const block = tacetBlock(render([1, 2, 3], smufl()));
    expect(block).toContain('data-tacet="1-3"');
    expect(block).toContain('data-tacet-count="3"');
    expect(block).toContain(G.hBarLeft);
    expect(block).toContain(G.hBarMiddle);
    expect(block).toContain(G.hBarRight);
    expect(block).toContain(G.digit(3));
    expect(block).not.toContain(G.restWhole);
  });

  it('sets a two-digit count as two digits, left to right', () => {
    const parsed = demoScore();
    const measures = Array.from({ length: 14 }, (_, index) => ({
      ...parsed.measures[0],
      index,
      number: String(index + 1),
    }));
    const wide: ParsedScore = {
      ...parsed,
      measures,
      vocalLine: parsed.vocalLine.filter((e) => e.measureIndex === 0),
    };
    const block = tacetBlock(renderAnalyzedStaff(wide, analyzedOf(parsed), smufl()));
    expect(block).toContain('data-tacet-count="13"');
    const digits = [...block.matchAll(DIGIT_RANGE)];
    expect(digits.map((d) => d[2])).toEqual([G.digit(1), G.digit(3)]);
    expect(Number(digits[1][1])).toBeGreaterThan(Number(digits[0][1]));
  });

  it('centres the mark in its measure rather than on its column', () => {
    const svg = render([2], smufl());
    const rest = /<g data-tacet[^>]*>\s*<text x="([-\d.]+)"/.exec(svg) as RegExpExecArray;
    const restX = Number(rest[1]);
    // Both barlines: the run's own, and the one opening the measure after it.
    // Each is drawn 18 px before the column it opens.
    const bars = [...svg.matchAll(/<line x1="([\d.]+)" y1="[\d.]+" x2="\1"/g)].map((m) => Number(m[1]));
    const before = Math.max(...bars.filter((x) => x < restX));
    const after = Math.min(...bars.filter((x) => x > restX));
    // `glyphAt` centres by the glyph's width, which the synthetic font sets to
    // 1.18 spaces for everything; the default lineGap is 12.
    expect(restX + (1.18 / 2) * 12).toBeCloseTo((before + after) / 2, 5);
  });

  it("prints the score's own measure scale, not the slice's", () => {
    // `data-system` and every event id carry the score's indices, so
    // `data-tacet` has to as well or the page opens a second scale.
    expect(tacetBlock(render([2], { ...smufl(), measureOffset: 40 }))).toContain('data-tacet="42-42"');
  });

  it('reserves the room in the packing estimate that the renderer spends', () => {
    // `sliceWidth` and the renderer both walk `layoutColumns`, so a run costs
    // the packer exactly what it costs the page. Without that a system would
    // be packed on the sung measures alone and then drawn wider than the line.
    const silent = scoreSilentIn([2]);
    const withRun = layoutColumns(silent);
    const withoutRun = layoutColumns({ ...silent, measures: [] });
    const span = (r: ReturnType<typeof layoutColumns>) =>
      r.columns.reduce((total, c) => total + c.advance, 0) + r.trailing;
    expect(span(withRun)).toBeGreaterThan(span(withoutRun));
    expect(withRun.columns.filter((c) => c.tacet).length).toBe(1);
  });
});

// ── N.102: the courtesy accidental across a barline ──────────────────
//
// Gould p.81, extraction v7 rule 121, as distilled by the desk in
// `brief-n102-courtesy-accidentals_r1_2026-09-02.md` §2: a pitch altered in one
// bar and repeated in the next carries either a restated accidental or an
// explicit cancellation, even though the barline has reset it, and even where
// the key signature already restores the pitch. The extraction is not on this
// machine, so that wording is the brief's paraphrase, not a quotation.
// Before this the renderer had no
// courtesy accidental of any kind; what a walk once read as one was a
// mandatory cancellation (`memo-mobile-slice4_r1_2026-08-27.md` §1).
//
// The fixture is its own score rather than the demo's, because the demo is in
// one flat and every existing assertion about its bytes has to keep holding.
// C major, treble, one voice, a quarter note per slot, so the only thing an
// assertion can be reading is the rule.
/* The N.102 fixture, shared by both of this rule's describes since increment
   1a needed a second one. Lifted to module scope unchanged; the twelve tests
   of increment 1 read exactly what they read before. */
const PARENS_LEFT = String.fromCodePoint(0xe26a);
const PARENS_RIGHT = String.fromCodePoint(0xe26b);
const NATURAL = String.fromCodePoint(0xe261);
const FLAT = String.fromCodePoint(0xe260);
const SHARP = String.fromCodePoint(0xe262);

/** One quarter note, spelled [measure, step, octave, alter]. */
type Slot = [number, Pitch['step'], number, number];

/**
 * A C-major score built from slots, one quarter note per beat, with as many
 * measures declared as the slots reach. `fifths` is 0 throughout, so a
 * natural is exactly what the key signature already gives and the required
 * accidental rule at `staff-renderer.ts:355` draws nothing for it.
 */
const scoreOf = (slots: Slot[], measureCount = Math.max(...slots.map((s) => s[0])) + 1): ParsedScore => {
  const perMeasure = new Map<number, number>();
  const vocalLine: VocalLineEvent[] = slots.map(([measureIndex, step, octave, alter], i) => {
    const beat = perMeasure.get(measureIndex) ?? 0;
    perMeasure.set(measureIndex, beat + 1);
    return {
      id: `c${i + 1}`,
      type: 'note',
      measureIndex,
      rhythmicPosition: { fraction: { numerator: beat, denominator: 4 } },
      duration: { base: 'quarter', dots: 0, fraction: { numerator: 1, denominator: 4 } },
      pitch: { step, octave, alter },
    };
  });
  return {
    source: { format: 'mnx', fidelity: 'native', origin: 'mnx-direct', sourceWarnings: [] },
    vocalPart: { partId: 'P1', partName: 'Voice' },
    measures: Array.from({ length: measureCount }, (_, index) => ({
      index,
      number: String(index + 1),
      timeSignature: { beats: 4, beatType: 4 },
      keySignature: { fifths: 0 },
      expectedDuration: { numerator: 1, denominator: 1 },
    })),
    keySignatures: [{ measureIndex: 0, signature: { fifths: 0 } }],
    timeSignatures: [{ measureIndex: 0, signature: { beats: 4, beatType: 4 } }],
    tempoMarkings: [],
    vocalLine,
  };
};

const bareProfile: VoiceProfileSnapshot = {
  fR1: {},
  range: { lowest: { step: 'C', octave: 3, alter: 0 }, highest: { step: 'C', octave: 6, alter: 0 } },
  tessitura: { low: { step: 'E', octave: 4, alter: 0 }, high: { step: 'A', octave: 4, alter: 0 } },
  passaggio: { primo: { step: 'E', octave: 4, alter: 0 }, secondo: { step: 'A', octave: 4, alter: 0 } },
  label: 'test',
};

/**
 * Render slots with an EMPTY analysis layer, the notation-only path a singer
 * sees before measuring: the resolver names no vowel, so `analyzed.events`
 * comes back empty, nothing lavender reaches the page, and every glyph an
 * assertion reads belongs to the sung line.
 */
const render = (slots: Slot[], options: StaffRenderOptions = {}): string => {
  const parsed = scoreOf(slots);
  const analyzed = analyzeScore(parsed, bareProfile, () => undefined, {
    generatedAt: '2026-09-02T00:00:00.000Z',
  });
  return renderAnalyzedStaff(parsed, analyzed, { clef: 'treble', ...options });
};

describe('courtesy accidentals across a barline (N.102 increment 1)', () => {
  const glyphs = (slots: Slot[]): string =>
    render(slots, { font: syntheticSmuflFont(), fontFamily: 'TestFont' });

  /** Every accidental-family glyph the SMuFL render drew, in document order. */
  const accidentalRun = (svg: string): string =>
    [...svg.matchAll(/>([\u{E260}-\u{E26B}])<\/text>/gu)].map((m) => m[1]).join('');

  it('cancels in bar 2 a flat stated in bar 1, in parentheses, though C major already gives the natural', () => {
    // The whole rule in one case: B flat, barline, B natural. The barline has
    // reset the flat and the key signature agrees with the natural, so nothing
    // was drawn here before N.102.
    expect(accidentalRun(glyphs([[0, 'B', 4, -1], [1, 'B', 4, 0]]))).toBe(
      FLAT + PARENS_LEFT + NATURAL + PARENS_RIGHT,
    );
  });

  it('draws the same case in primitive mode, where there is no font to measure', () => {
    const svg = render([[0, 'B', 4, -1], [1, 'B', 4, 0]]);
    expect((svg.match(/>\(♮\)</g) ?? []).length).toBe(1);
    expect((svg.match(/>♭</g) ?? []).length).toBe(1);
  });

  it('says nothing a bar later, when nothing was altered in between', () => {
    // Bar 3's B natural follows a bar 2 that stated nothing about B, so r121
    // has no altered pitch to restate and the page stays quiet.
    const svg = glyphs([[0, 'B', 4, -1], [1, 'B', 4, 0], [2, 'B', 4, 0]]);
    expect(accidentalRun(svg)).toBe(FLAT + PARENS_LEFT + NATURAL + PARENS_RIGHT);
    expect((svg.match(new RegExp(PARENS_LEFT, 'gu')) ?? []).length).toBe(1);
  });

  it('draws a required accidental bare, and never parenthesizes one', () => {
    // A restated flat in bar 2 is mandatory, not a courtesy: the barline reset
    // it and the note contradicts the key signature, so `:1376` draws it and
    // the courtesy branch is never reached.
    expect(accidentalRun(glyphs([[0, 'B', 4, -1], [1, 'B', 4, -1]]))).toBe(FLAT + FLAT);
    // And a bar-2 sharp against a bar-1 flat is required for the same reason.
    expect(accidentalRun(glyphs([[0, 'B', 4, -1], [1, 'B', 4, 1]]))).toBe(FLAT + SHARP);
  });

  it('draws the courtesy once when the pitch recurs twice in the same bar', () => {
    // The first B in bar 2 takes the cancellation; the second is governed by
    // it and takes nothing, exactly as a stated accidental governs the rest of
    // its bar.
    expect(accidentalRun(glyphs([[0, 'B', 4, -1], [1, 'B', 4, 0], [1, 'B', 4, 0]]))).toBe(
      FLAT + PARENS_LEFT + NATURAL + PARENS_RIGHT,
    );
  });

  it('keys on step AND octave, so another octave says nothing (r116 per the brief)', () => {
    // B flat 4 in bar 1 makes no claim about B5, so B natural 5 in bar 2 is an
    // ordinary key-signature pitch and draws nothing.
    expect(accidentalRun(glyphs([[0, 'B', 4, -1], [1, 'B', 5, 0]]))).toBe(FLAT);
  });

  it('carries only from the directly preceding bar, so a silent bar between clears it', () => {
    // JUDGEMENT, and it is this desk's reading of r121's "in the next bar": a
    // bar with no sung note is not the next bar, so bar 3 gets nothing. The
    // narrower reading, chosen because increment 1 builds r121 and not r122.
    expect(accidentalRun(glyphs([[0, 'B', 4, -1], [2, 'B', 4, 0]]))).toBe(FLAT);
  });

  it('draws the cluster in ink, never in the lavender of the analysis layer', () => {
    // A courtesy accidental is an engraving convention, not a confidence mark.
    const svg = glyphs([[0, 'B', 4, -1], [1, 'B', 4, 0]]);
    const cluster = [...svg.matchAll(/<text [^>]*fill="([^"]+)"[^>]*>[\u{E26A}\u{E26B}]<\/text>/gu)];
    expect(cluster.length).toBe(2);
    expect(cluster.every((m) => m[1] === '#1a1612')).toBe(true);
  });

  it('binds all three glyphs to the note, so the selection squircle encloses them', () => {
    // The accidental has carried `data-of-event` since the squircle was found
    // slicing through one; a bracketed accidental is three marks with the same
    // need.
    const svg = glyphs([[0, 'B', 4, -1], [1, 'B', 4, 0]]);
    const bound = [...svg.matchAll(/<text data-of-event="c2"[^>]*>([\u{E260}-\u{E26B}])<\/text>/gu)];
    expect(bound.map((m) => m[1]).join('')).toBe(PARENS_LEFT + NATURAL + PARENS_RIGHT);
  });

  it('abuts the three glyphs and lands the cluster where the bare accidental would end', () => {
    // Parens left, accidental, parens right, at their bounding boxes with no
    // gap, and the cluster's RIGHT edge where a bare accidental's right edge
    // would sit. The synthetic font gives every glyph a width of 1.18 spaces
    // and the default lineGap is 12, so each step is 14.16 px.
    const svg = glyphs([[0, 'B', 4, -1], [1, 'B', 4, 0]]);
    const xs = [...svg.matchAll(/<text [^>]*x="([-\d.]+)"[^>]*>([\u{E26A}\u{E261}\u{E26B}])<\/text>/gu)]
      .map((m) => Number(m[1]));
    expect(xs.length).toBe(3);
    expect(xs[1] - xs[0]).toBeCloseTo(14.16, 5);
    expect(xs[2] - xs[1]).toBeCloseTo(14.16, 5);
  });

  it('keeps a measure-opening cluster clear of the barline it follows', () => {
    // The bar-2 note IS the measure opening here, so the floor at `nx - 16`
    // is the branch under test: the cluster is nudged right rather than
    // allowed to reach back across the barline at `nx - 18`.
    const svg = glyphs([[0, 'B', 4, -1], [1, 'B', 4, 0]]);
    const left = Number(svg.match(new RegExp(`<text [^>]*x="([-\\d.]+)"[^>]*>${PARENS_LEFT}</text>`, 'u'))![1]);
    const bars = [...svg.matchAll(/<line x1="([\d.]+)" y1="72" x2="\1"/g)].map((m) => Number(m[1]));
    const opening = Math.max(...bars.filter((x) => x < left + 1));
    expect(left).toBeGreaterThan(opening);
    expect(left).toBeCloseTo(opening + 2, 5); // the nx-16 floor against the nx-18 barline
  });

  it('draws no courtesy on the turning layer', () => {
    // The turning line keeps its own per-measure carry and gets no courtesy:
    // sung line only, this desk's default. The profile is built so the turning
    // pitch is D#4 in bar 1 (fR1 622 Hz, an octave below is 311 Hz) and D
    // natural 4 in bar 2 (fR1 587 Hz → 293.5 Hz), which is precisely the shape
    // that earns a courtesy on the sung line.
    const parsed = scoreOf([[0, 'G', 4, 0], [1, 'G', 4, 0]]);
    const profile: VoiceProfileSnapshot = {
      fR1: { sharp: 622, nat: 587 },
      range: { lowest: { step: 'C', octave: 3, alter: 0 }, highest: { step: 'C', octave: 6, alter: 0 } },
      tessitura: { low: { step: 'E', octave: 4, alter: 0 }, high: { step: 'A', octave: 4, alter: 0 } },
      passaggio: { primo: { step: 'E', octave: 4, alter: 0 }, secondo: { step: 'A', octave: 4, alter: 0 } },
      label: 'test',
    };
    const analyzed = analyzeScore(parsed, profile, (e) => (e.measureIndex === 0 ? 'sharp' : 'nat'), {
      generatedAt: '2026-09-02T00:00:00.000Z',
    });
    const svg = renderAnalyzedStaff(parsed, analyzed, {
      clef: 'treble',
      font: syntheticSmuflFont(),
      fontFamily: 'TestFont',
    });
    // The bar-1 turning sharp is drawn, which proves the fixture reaches the
    // turning-accidental path at all.
    expect(svg).toContain(`fill="#8E7E9B">${SHARP}</text>`);
    // And no parenthesis of any colour reaches the page.
    expect(svg.includes(PARENS_LEFT)).toBe(false);
    expect(svg.includes(PARENS_RIGHT)).toBe(false);
  });
});

// ── N.102 increment 1a: the courtesy's parentheses breathe ───────────
//
// Dann's ruling, 2026-09-02. Increment 1 abutted the three glyphs at their
// bounding boxes, so a sharp's outer stroke and a parenthesis's inner stroke
// met with nothing between them. `COURTESY_GAP_SP` puts 0.2 stave-spaces on
// each side of the accidental, and the gap is the FIRST thing to give: where
// the measure-opening floor binds, the gap closes before the cluster is
// allowed to move right off the accidental's own position.
//
// The three cases are the three the ruling names, and each is reached by
// changing only the glyph widths the font reports, never the rule.
describe('the courtesy cluster breathes (N.102 increment 1a)', () => {
  /**
   * A synthetic font whose every glyph is `widthSp` wide, so the case a test
   * lands in is set by one number. `syntheticSmuflFont` fixes 1.18 spaces,
   * which at the default 12 px lineGap overruns the measure-opening floor by
   * far more than the gap can buy back; the narrower font below overruns it by
   * less, which is the only way to reach the middle case.
   */
  const fontOfWidth = (widthSp: number) => {
    const glyphBBoxes: Record<string, { bBoxNE: [number, number]; bBoxSW: [number, number] }> = {};
    const glyphsWithAnchors: Record<string, Record<string, [number, number]>> = {};
    for (const name of REQUIRED_GLYPHS) {
      glyphBBoxes[name] = { bBoxNE: [widthSp, 0.5], bBoxSW: [0, -0.5] };
      glyphsWithAnchors[name] = { stemUpSE: [widthSp, 0.168], stemDownNW: [0, -0.168] };
    }
    return prepareSmuflFont({
      fontName: 'GapFont',
      fontVersion: '1.0',
      engravingDefaults: {
        staffLineThickness: 0.13, stemThickness: 0.12, beamThickness: 0.5, beamSpacing: 0.25,
        thinBarlineThickness: 0.16, thickBarlineThickness: 0.5,
        legerLineThickness: 0.16, legerLineExtension: 0.4, tupletBracketThickness: 0.16,
      },
      glyphBBoxes,
      glyphsWithAnchors,
    });
  };

  const LINE_GAP = 12; // the renderer's default, restated so the arithmetic below is readable

  /** The x of each glyph in the courtesy cluster, left to right. */
  const clusterXs = (svg: string): number[] => {
    const all = [...svg.matchAll(/<text [^>]*x="([-\d.]+)"[^>]*>([\u{E260}-\u{E26B}])<\/text>/gu)]
      .map((m) => ({ x: Number(m[1]), cp: m[2].codePointAt(0)! }));
    const i = all.findIndex((m) => m.cp === 0xe26a);
    expect(i, 'no courtesy cluster was drawn').toBeGreaterThanOrEqual(0);
    return all.slice(i, i + 3).map((m) => m.x);
  };

  /** The notehead's centre, which is what every accidental offset is measured from. */
  const noteheadCentre = (svg: string, id: string, widthSp: number): number =>
    Number(eventGroup(svg, id).match(/<text [^>]*x="([-\d.]+)"[^>]*>\u{E0A4}<\/text>/u)![1]) +
    (widthSp / 2) * LINE_GAP;

  /** The x a bare accidental's RIGHT edge would take: what the cluster hangs from. */
  const bareRightEdge = (nx: number, widthSp: number): number => nx - (widthSp / 2) * LINE_GAP - 1.5;

  it('takes the full gap on both sides where the floor does not bind', () => {
    // The courtesy is on the THIRD note: G4 opens bar 2 and draws nothing, so
    // the B4 that takes the cancellation is mid-measure and `newMeasure` is
    // false. With no floor the cluster hangs entirely from the right edge.
    const w = 1.18;
    const svg = render([[0, 'B', 4, -1], [1, 'G', 4, 0], [1, 'B', 4, 0]], {
      font: syntheticSmuflFont(), fontFamily: 'TestFont',
    });
    const [xL, xA, xR] = clusterXs(svg);
    const glyphW = w * LINE_GAP;
    const gap = COURTESY_GAP_SP * LINE_GAP;
    expect(xA - xL).toBeCloseTo(glyphW + gap, 5);
    expect(xR - xA).toBeCloseTo(glyphW + gap, 5);
    // And the accidental still ends where a bare one would: the brackets grew
    // leftward, they did not push the accidental off its place.
    expect(xR + glyphW).toBeCloseTo(bareRightEdge(noteheadCentre(svg, 'c3', w), w), 5);
  });

  it('closes the gap part way, and no further, where the floor binds by less than two gaps', () => {
    // GapFont at 0.3 spaces: the full-gap cluster reaches 18.9 px left of the
    // notehead centre and the floor sits at 16, so it overruns by 2.9 px. That
    // is inside the 4.8 px the two gaps can buy back, so each gap gives 1.45 px
    // and the cluster's right edge does not move at all.
    const w = 0.3;
    const svg = render([[0, 'B', 4, -1], [1, 'B', 4, 0]], {
      font: fontOfWidth(w), fontFamily: 'GapFont',
    });
    const [xL, xA, xR] = clusterXs(svg);
    const glyphW = w * LINE_GAP;
    const nx = noteheadCentre(svg, 'c2', w);
    const gap = xA - xL - glyphW;

    expect(gap).toBeCloseTo(0.95, 5);                         // 2.4 wanted, 1.45 given back
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(COURTESY_GAP_SP * LINE_GAP);
    expect(xR - xA).toBeCloseTo(glyphW + gap, 5);             // still symmetrical
    expect(xL).toBeCloseTo(nx - 16, 5);                       // the floor holds it
    expect(xR + glyphW).toBeCloseTo(bareRightEdge(nx, w), 5); // and the accidental keeps its place
  });

  it('spends the gap entirely and then moves the cluster, where the floor binds by more', () => {
    // The 1.18-space font at a measure opening overruns the floor by 39.86 px,
    // which two gaps of 2.4 cannot buy back. The gap goes to nothing and the
    // cluster sits on the floor: increment 1's geometry exactly, which is what
    // Dann walked, so a cluster too wide for its bar loses nothing it had.
    const w = 1.18;
    const svg = render([[0, 'B', 4, -1], [1, 'B', 4, 0]], {
      font: syntheticSmuflFont(), fontFamily: 'TestFont',
    });
    const [xL, xA, xR] = clusterXs(svg);
    const glyphW = w * LINE_GAP;
    const nx = noteheadCentre(svg, 'c2', w);

    expect(xA - xL).toBeCloseTo(glyphW, 5); // abutted: no gap left to give
    expect(xR - xA).toBeCloseTo(glyphW, 5);
    expect(xL).toBeCloseTo(nx - 16, 5);
    // The right edge is now PAST where a bare accidental would end, which is
    // the collision the floor accepts rather than crossing the barline.
    expect(xR + glyphW).toBeGreaterThan(bareRightEdge(nx, w));
  });
});

// ── N.102 increment 1b: the courtesy survives the system break ───────
//
// Every system is rendered from its own slice, and `sliceScore` rebases the
// slice's measure indices to 0, so the measure before a system break is drawn
// by a different call. A courtesy accidental was therefore never drawn on a
// measure that opened a system, and a cancellation a singer needs was lost at
// every line break.
//
// `accidentalStateAtEndOf` is the walk that answers what a slice inherits, and
// `advanceAccidentalState` is the one decision both it and the draw loop make,
// so the two cannot drift.
describe('the courtesy survives the system break (N.102 increment 1b)', () => {
  const PL = String.fromCodePoint(0xe26a);
  const PR = String.fromCodePoint(0xe26b);
  const NAT = String.fromCodePoint(0xe261);

  describe('accidentalStateAtEndOf', () => {
    it('carries the flat a bar stated, keyed on step and octave', () => {
      // B flat in bar 1, B natural in bar 2. At the end of bar 1 the flat is
      // what stands, and that is the whole reason bar 2 draws a cancellation.
      const score = scoreOf([[0, 'B', 4, -1], [1, 'B', 4, 0]]);
      expect(accidentalStateAtEndOf(score, 0, 0)).toEqual({ B4: -1 });
    });

    it('carries the natural where a bar restated one over its own flat', () => {
      // Both notes are in bar 1: the flat is required against C major, and the
      // natural is required against the flat. The bar therefore ends on 0, not
      // on -1, and a B natural in bar 2 must draw nothing.
      const score = scoreOf([[0, 'B', 4, -1], [0, 'B', 4, 0]]);
      expect(accidentalStateAtEndOf(score, 0, 0)).toEqual({ B4: 0 });
    });

    it('carries nothing out of a bar that altered nothing', () => {
      // An empty state is a real answer, not a failure to compute one.
      const score = scoreOf([[0, 'B', 4, 0], [1, 'B', 4, 0]]);
      expect(accidentalStateAtEndOf(score, 0, 0)).toEqual({});
    });

    it('carries the courtesy the bar itself drew, and nothing before the first bar', () => {
      // Bar 2's cancellation writes to bar 2's own state, so the walk has to
      // run the courtesy rule and not only the required one. And a measure
      // index below zero is the first system's case: nothing precedes it.
      const score = scoreOf([[0, 'B', 4, -1], [1, 'B', 4, 0]]);
      expect(accidentalStateAtEndOf(score, 1, 0)).toEqual({ B4: 0 });
      expect(accidentalStateAtEndOf(score, -1, 0)).toEqual({});
    });

    it('carries nothing out of a bar the singer does not sing', () => {
      // Bar 2 holds no sung event at all, so it states nothing, and the walk
      // says so rather than handing back bar 1's state by accident.
      const score = scoreOf([[0, 'B', 4, -1], [2, 'B', 4, 0]], 3);
      expect(accidentalStateAtEndOf(score, 1, 0)).toEqual({});
    });
  });

  describe('through paginateScore', () => {
    /**
     * A page too narrow to hold two measures, so every measure gets a system of
     * its own and the boundary under test is where the test puts it, not where
     * the packing arithmetic happens to land.
     */
    const paginate = (slots: Parameters<typeof scoreOf>[0]) => {
      const parsed = scoreOf(slots);
      const analyzed = analyzeScore(parsed, bareProfile, () => undefined, {
        generatedAt: '2026-09-02T00:00:00.000Z',
      });
      return paginateScore(parsed, analyzed, {
        clef: 'treble',
        font: syntheticSmuflFont(),
        fontFamily: 'TestFont',
        pageWidth: 300,
        marginLeft: 72,
        marginRight: 72,
      });
    };
    const count = (s: string, ch: string) => (s.match(new RegExp(ch, 'gu')) ?? []).length;

    it('cancels across a system break, on the first note of the second system', () => {
      const out = paginate([[0, 'B', 4, -1], [1, 'B', 4, 0]]);
      expect(out.systems.map((s) => [s.fromMeasure, s.toMeasure])).toEqual([[0, 0], [1, 1]]);

      // System 1 states the flat and brackets nothing.
      expect(count(out.systems[0].svg, PL)).toBe(0);
      // System 2 opens with the cancellation, and draws it exactly once.
      expect(count(out.systems[1].svg, PL)).toBe(1);
      expect(count(out.systems[1].svg, PR)).toBe(1);
      // On the first note of that system, and bracketing a natural.
      const trio = out.systems[1].svg.match(
        new RegExp(`<text data-of-event="c2"[^>]*>([\\u{E260}-\\u{E26B}])</text>`, 'gu'),
      );
      expect(trio).toHaveLength(3);
      expect(out.systems[1].svg).toContain(`<text data-of-event="c2"`);
      expect(count(out.systems[1].svg, NAT)).toBe(1);
    });

    it('says nothing across a system break where nothing was altered', () => {
      // The control. Same two systems, same pitch either side of the break, and
      // no alteration anywhere: the page stays quiet.
      const out = paginate([[0, 'B', 4, 0], [1, 'B', 4, 0]]);
      expect(out.systems.map((s) => [s.fromMeasure, s.toMeasure])).toEqual([[0, 0], [1, 1]]);
      for (const s of out.systems) {
        expect(count(s.svg, PL)).toBe(0);
        expect(count(s.svg, PR)).toBe(0);
      }
    });

    it('leaves the first system alone, which has no bar before it to inherit from', () => {
      // The seed is empty for system 1 by construction. This pins that the
      // option cannot make the piece open on a courtesy.
      const out = paginate([[0, 'B', 4, -1], [1, 'B', 4, 0]]);
      expect(count(out.systems[0].svg, PL)).toBe(0);
    });
  });
});
