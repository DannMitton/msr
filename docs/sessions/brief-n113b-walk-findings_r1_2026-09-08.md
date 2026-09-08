# Brief: N.113b, three findings from Dann's walk of N.113a

Revision 1, 2026-09-08. For a Claude Code session pointed at `~/Desktop/ilya-rewrite`, branch `Shane`, floor `87afa4b`.

Read `docs/memory/README.md` first and follow its read order. Then `docs/sessions/memo-n113a-walk_r1_2026-09-07.md` §7 and §9, and `docs/sessions/memo-n113-melisma_r1_2026-09-07.md` §7.1.

## What this serves

The schema's own rule: the walk's findings before the next build. Dann walked N.113a on the alias on 2026-09-08 at 00:05 and saw all five items. Three things came out of it, all his, all recorded in `docs/memory/STATE.md` §THE ONE THING under "N.113a WALKED BY DANN". N.114 waits behind this.

## The three items

### 1. The loupe's box on the taken note goes lavender

Ruled by Dann on the walk. The box drew sage. Lavender is the marked score's colour (`claude/ruling-lavender-marks-the-marked-score_2026-08-19.md`, in project knowledge; the token in `app.css` is what the Score markup band and the drawer's station rules already use).

Seam: `apps/web/src/lib/shane/Loupe.svelte:1006` (`outline: 2px solid var(--sage, #8b9a7d)`) and `:1015` (`stroke: var(--sage, #8b9a7d)`). Read the comment at `:225` and `:553` before touching them, because N.113a is what stopped stripping the ring.

Done when: the box on the taken notehead is the lavender token in the rendered DOM, and nothing else on the page changed colour. Grep for other `--sage` uses in the loupe and say which you left alone and why.

### 2. The locator gains a second line

Ruled by Dann on the walk. Today the loupe's head reads `m. 7 · system 3 of 8` (`loupe.measureTag`, `apps/web/src/lib/i18n.ts:318`, with the `Short`, `Fill`, and `Both` variants at `:321`, `:442`, `:449`). It gains a second line naming the taken note, its beat within the measure, and its duration. The shape Dann liked, from the N.114 drawing, is `note 5, F♯4, quarter`; the readout the dock already prints (`readoutLine`, `+page.svelte:1427`, e.g. `B♭3 · Quarter · Dot`) is the same information in a different order, so reuse its parts rather than a second formatter.

The beat is already in the tree: `RhythmicPosition` (`packages/score-parser/src/types.ts:510-518`) holds each note's position from the barline as a whole-note fraction. The second line converts that fraction to a beat against the measure's time signature.

**Compound metre, ruled by Dann on the walk, and it is not optional:** 6/8 is two beats of a dotted quarter, not six. When the numerator is a multiple of 3 and the denominator is 8 or 16 (6/8, 9/8, 12/8, 6/16), the beat unit is the dotted denominator unit and the count of beats is numerator ÷ 3. Otherwise the beat unit is the denominator's unit. 3/8 is one beat. A position that is not on a beat reads as the beat plus its pulse within it. Pin this with tests: 4/4 at 1/4 in is beat 2; 6/8 at 3/8 in is beat 2; 6/8 at 1/8 in is beat 1 pulse 2; 3/8 at 1/8 in is beat 1 pulse 2; 12/8 at 9/8 in is beat 4.

English copy for the line, Dann's to wave off on the walk: `B♭3 · beat 2 · dotted quarter`, and for a mid-beat position `B♭3 · beat 2, pulse 2 · eighth`. Reuse `durationWord` for the duration. **Do not write French.** Add the English key with `fr` set to the English, as `i18n.ts` does for every owed string, and list the key in your memo under French owed.

Done when: the second line renders under the measure tag on a local production build for a taken note in a simple metre and in a compound one, with the beat tests above green.

### 3. A word-final sustain draws a hyphen where an extender belongs

A defect, Dann's eye on the page. On Without Sun no. 1, m. 7, he pressed Melisma on the B♭3 dotted quarter that follows «ня» (the word-final syllable of «песня»). Under the sustained note the page drew a dash level with the hyphens, not the baseline extender. Gould's rule, which the file already carries at `packages/score-parser/src/staff-renderer.ts:2714-2760`: a hyphen is raised and means the word continues; an extender sits on the baseline at stave-line thickness, from the syllable's right edge to the last notehead it covers, and means the word has ended while its sound continues (memo-gould-dimensional-priors r26, r31, r34, r35, r38, r39, pp. 447 to 448).

The harness walk saw the extender draw correctly on «ка» (memo-n113 §8 step 1), so this is a case the harness did not reach. Two candidates, and you find which:

- The sustained note's underlay entry carries a literal dash as its `cyr` text, so what Dann saw is a text glyph and not a hyphen line at all. Check what `underlay` holds for a singer-marked melisma continuation, and what the loupe's clone shows.
- `«ня»` reaches the renderer with a `sylType` other than `end`, or `melismaEndX` lacks its `evId` for singer-marked melismas, so the extender loop at `:2751-2759` skips it and the hyphen loop at `:2733-2748` runs instead.

Done when: after Melisma on a word-final syllable, the DOM carries a `data-extender` line at `cyrY` and no `data-hyphen` between that syllable and the next word; after Melisma on a mid-word syllable, hyphens draw and no extender does; both pinned by tests in `packages/score-parser`.

## The gates

`sh ~/Downloads/ilya-ship.sh` runs them. Baseline: `216 passed (216)`, `235 passed (235)`, `found 0 errors and 7 warnings in 4 files`, `1058 passed (1058)`, `541 passed | 5 skipped (546)`. Report every move with its cause. If gate 4 or 5 moves, say the new literal so the desk can move `ilya-ship.sh:79-80`.

## Constraints

- You do not run git. No commit, no push. Dann ships.
- Do not change `VocalLineEvent`. Do not touch `apps/web/src/lib/shane/reconciliation/`.
- Do not write French Dann has not seen.
- Edit by anchor. Every anchor asserted before the write.
- Walk on a local production build, expectation stated before each measurement, and refute your own build before you report it.

## The memo you return

`docs/sessions/memo-n113b-walk-findings_r1_<date>.md`. Sections: what changed with `path:line`; the five gates; each item with its walk; what you could not establish. Every claim carries a `path:line`, a run, or "not established". No fourth form. **NOT ESTABLISHED beats a complete invented answer.** End with the exact commands Dann pastes: `git add` for any new file, then the ship line `sh ~/Downloads/ilya-ship.sh "N.113b: the walk findings"`.
