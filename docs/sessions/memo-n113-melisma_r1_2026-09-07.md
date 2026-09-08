# N.113: the melisma

**Code, 2026-09-07.** Floor `1b3054a`. Brief:
`docs/sessions/brief-n113-melisma_r1_2026-09-07.md`, read in full.

Built, gated, and walked, including rider 0. One commit.

```
N.113: the melisma
```

---

## 1. What changed, with `path:line`

| file | what |
|---|---|
| `apps/web/src/lib/shane/pairings.ts:~700` | `melismaIds`, `toggleMelisma`, `melismaRuns`, `vacatedTail`. |
| `apps/web/src/lib/shane/pairings.test.ts` | +18 tests for those four. |
| `packages/score-parser/src/staff-renderer.ts:224` | `melismaPreview?: ReadonlySet<string>` on `StaffRenderOptions`. |
| `packages/score-parser/src/staff-renderer.ts:319` | `melismaPreview` exempted from `DEFAULTS`. |
| `packages/score-parser/src/staff-renderer.ts:~1826` | The singer's runs, found beside the file's own. |
| `packages/score-parser/src/staff-renderer.ts:~2490` | A marked note draws nothing on either line. |
| `packages/score-parser/src/staff-renderer.test.ts:277` | +7 tests, in their own describe. |
| `apps/web/src/lib/shane/VoiceProfilePane.svelte` | `melismaPreview` derived and passed; the `ipaPreview` guard now reads the pairing's kind. |
| `apps/web/src/routes/+page.svelte` | `melismaMarks`, `queueExhausted`, `blankUnderlay` extended, `handleMelisma`, `selectedMelisma`, `melismaDisabled`; `placedSlotCount` moved above `blankUnderlay`. |
| `apps/web/src/lib/shane/CorrectionSurface.svelte` | The Melisma toggle in the LYRIC station, with its three props. |
| `apps/web/src/lib/i18n.ts` | Four new keys. |

---

## 2. The five gates

Run for real, all five, before the work and again after it.

| gate | script literal at `~/Downloads/ilya-ship.sh` | this run |
|---|---|---|
| 1 phonology | `216 passed (216)` | same |
| 2 dictionary | `235 passed (235)` | same |
| 3 web-check | `found 0 errors and 7 warnings in 4 files` | same |
| 4 web-test | `1038 passed (1038)` | **`1056 passed (1056)`** |
| 5 score-parser | `534 passed \| 5 skipped (539)` | **`541 passed \| 5 skipped (546)`** |

**BOTH MOVE, AND BOTH NEED YOUR PERMISSION.** Gate 4 is +18
(`pairings.test.ts`), gate 5 is +7 (`staff-renderer.test.ts`). The `sed` drops
the execute bit, so its `chmod +x` is not optional (`ENVIRONMENT.md`, measured
2026-08-18).

```bash
sed -i '' 's/1038 passed (1038)/1056 passed (1056)/;s/534 passed | 5 skipped (539)/541 passed | 5 skipped (546)/' ~/Downloads/ilya-ship.sh
```

```bash
chmod +x ~/Downloads/ilya-ship.sh
```

---

## 3. What was already built, and what was not

**The extender already existed** (`staff-renderer.ts`, "Hyphens and extenders
(melisma build 2)"), and so did melisma detection, left-alignment of the opening
syllable (Gould r5), and the slur. **All of it reads the FILE**: a note carrying
`ev.syllable` followed by notes carrying none opens a run.

That is why nothing has ever drawn for the singer. On a lyric-bearing score
every note carries a syllable, so no run is ever found; on a score with no
underlay none is. `{ kind: 'melisma' }` has sat in the pairing map since N.55b
with nothing writing it and nothing reading it.

**So N.113 is one channel and one control, not a drawing job.**
`melismaPreview` carries the singer's marks to the renderer, which finds their
runs by the same rule over the same geometry, four lines beside the file's own.

---

## 4. The rules, and where each lives

**`pairings.ts` holds them where a test can reach them.**

- **`toggleMelisma`.** Undecided: mark it, nothing moves. Holding a syllable:
  the syllable and everything after it move one note forward
  (`shiftToEndOfLyric(..., 'forward')`, Finale's insert), then mark. Already
  marked: clear back to **undecided**, never to `empty`, which is a claim Ilya
  may not make (E.46) and the singer has not made.
- **`melismaRuns`.** A run is one or more CONSECUTIVE marked notes following a
  note that holds a syllable. Consecutive is measured in `eventIds`, which
  already excludes rests, and a melisma cannot cross a rest.
- **`vacatedTail`.** Rider 0's set.

**The renderer implements `melismaRuns`' rule over its own geometry**, because
it needs notehead x positions the map has no way to know. `pairings.ts`'s is the
canonical statement and the one under test; both say so in their comments.

**A marked note draws nothing on either line, and the renderer enforces that
itself** rather than trusting the caller to have blanked it, so the two facts
cannot come apart.

---

## 5. Rider 0, and its one desk default

**Ruled by Dann 2026-09-07:** *"it draws nothing, because the singer removed the
word."*

`vacatedTail` blanks the bare notes after the last seated note, through the same
`applyBlank` channel N.111-3a built, so the Cyrillic and IPA lines cannot drift
apart.

**THE GATE IS `queueExhausted`, and it is a DESK DEFAULT, 2026-09-07, yours to
wave off.** The honest question is "did the singer empty this note", and no
derived value can see an act. What it can see is whether anything is left to put
there: with every slot of the poem placed, a bare note past the last seat has
nothing coming to it. With slots still unplaced, the same note is one the hand
has not reached, and blanking it would take away the file's words while the
singer is still working from them, which is the affordance N.111's hand relies
on.

**The alternative, considered and not taken:** blank every bare note after the
last seat unconditionally. It fixes the same walk and breaks the hand.

**It is the tail only**, which is a consequence rather than a narrowing: a
deletion closes its holes up (`reseat.ts`), so a note the singer's edit empties
is always at the end of the run.

---

## 6. The strings

Four new English keys. **FRENCH OWED ON ALL FOUR**, with the English in the `fr`
slot so nothing renders `[MISSING`, exactly as `loupe.redo` has done since
N.111-3b.

| key | English | what |
|---|---|---|
| `loupe.melisma` | `Melisma` | The toggle. **ADOPTED**, not coined: Finale's manual and Gould both use it, and the tree has since N.55b (`pairings.ts:126`). |
| `loupe.lyric.melisma` | `This note sustains the syllable` | The row label, in the shape its two neighbours take. **COINED.** |
| `loupe.undo.melisma` | `melisma set` | **COINED.** |
| `loupe.undo.melismaOff` | `melisma cleared` | **COINED.** |

Nothing is retired.

---

## 7. Two departures from the brief, both named

**7.1 The extender keeps its own weight and offset, and does NOT match the
hyphen's.** The brief asks for both in one sentence and they conflict with each
other: §3 says "a rule on the lyric baseline" and then "stroke weight and
vertical offset: match the hyphen's".

Measured on the walk: the extender is `stroke-width="0.5"` at `y=151`; the
hyphen is `stroke-width="1"` at `y=147`. That is the convention the file already
carried, with its own reason written down beside it: *"a hyphen is RAISED and
means the word continues; an extender sits ON THE BASELINE at staff-line
thickness and means the word has ended while its final sound continues."* The
two marks are deliberately NOT one system; the difference is the semantics.

Matching them would also have changed how the file's own melismas draw, which
is outside this item. **Left as it was. Yours to overrule.**

**7.2 No slur.** Gould r5 slurs a melisma and `melismaSpans` already draws one
for the file's. The singer's marks are deliberately not added to it: a slur is
engraving Ilya would be adding to the score on the singer's behalf, and the
brief asks for the extender alone. **DESK DEFAULT.**

---

## 8. The walk, on a local production build

`pnpm --filter @ilya/web build`, `vite preview` on 4173, **restarted** after
staging (it was reused once and had to be stopped and started again, because it
snapshots its file table at boot). The engraved Sunless fixture, 96 notes, with
the Mussorgsky poem, all 96 seated. The dictionary needed the walkclock harness
from `ENVIRONMENT.md`, confirmed live and removed afterwards with both files
re-grepped clean.

| step | expected, stated before the measurement | observed |
|---|---|---|
| 1. Take note 3 (`тес`), press Melisma | it is marked, `тес` and the tail shift one forward, an extender draws on note 2 (`ка`, word-final), the note goes bare | `Ком нат ка ~ тес на я`; `data-extender="m1-1-2"`; `aria-pressed="true"`; `↰ Undo: melisma set` |
| 2. Undo | `тес` back on note 3, no extender | `Ком нат ка тес на я ти`, no extender, `↱ Redo: melisma set`, **and the seat the shift had pushed off the end came back** |
| 3. Redo | the mark and the extender return | both returned |
| 4. Take note 1 (`нат`), press Melisma | no extender, because `Ком` is word-initial; the hyphen spans instead | no extender; the hyphen after `Ком` re-centred from x 172.5 to x 202.4 across the wider gap, **one hyphen, centred** |
| 5. Rider 0: delete `много` from line 7 | 94 seats on 96 notes; the two vacated notes bare on both lines | 94 seats; Cyrillic drawn 96 → **94**; the tail ends `ночь о ди но ка я` with **no stray**, where memo §8 of N.112 recorded a stray `но` |
| 6. Mark a note, reload | the mark, its extender and the blank tail all hold | all three held |
| 7. Take the last note (undecided), press Melisma | marked, bare, and no extender because `ка` before it is mid-word | marked; its column **empty on both lines**; no new extender |

**The loupe carries the extender too**, so the change shows on both surfaces in
the same frame (N.111-3a's `pageRevision`).

**The extender's measured geometry**, step 1: `x1="238.84" y1="151"
x2="267.25" y2="151" stroke="#1a1612" stroke-width="0.5"`, a span of 28.41 px
from just after `ка`'s right edge to just past the marked notehead.

**One instrument fault, mine.** A crude "IPA text" count (font-size not 12.5,
plus a character class) read 93 before a reload and 94 after, which looked like
a defect. Reading the two columns directly settled it: the marked note's column
and the vacated note's column are **empty on both lines**, and their neighbours
draw normally. The ±1 was the detector.

**The pane's own browser profile was changed by this walk**, deliberately: the
poem's line 7 is edited and two notes carry melisma marks. Nothing on your
machine was touched.

---

## 9. NOT ESTABLISHED

**NOT ESTABLISHED beats a complete invented answer.**

1. **The French for all four strings.** The `fr` slots carry English. Nothing is
   guessed.
2. **A run split by a system break was not walked and is NOT specially handled.**
   The brief allows drawing the first system's part only and saying so. What the
   code does is neither: `melismaEndX` is built per system from `placed`, so a
   run whose marks fall on the next system opens no run on the first, and the
   extender does not draw at all rather than drawing a first part. **Untested
   and unwalked.** No fixture in reach puts a marked note across a break.
3. **A mid-word melisma at the END of a piece draws neither mark**, observed at
   step 7. The hyphen needs a following syllable to reach and there is none, and
   the extender needs a word-final opener. It is a state the hand can produce
   and nothing is drawn for it. Reported, not fixed: what should be drawn there
   is a Gould question (rules 26 to 40, which `staff-renderer.ts` records as
   unread) and a taste question, so it is yours.
4. **A mark with no seated note before it opens no run**, which is the state the
   brief asked to be reported. Pinned by test at the map level
   (`melismaRuns`) and at the renderer level (marking n1, the first note of the
   demo fixture). Not walked in the app, because the fixture's first note is
   always seated.
5. **Whether a wide melisma gap should carry more than one hyphen is not
   settled.** The existing placement loop fills a gap at roughly 60 px intervals
   and I did not change it; at step 4 the gap took **one** hyphen, centred,
   which is what the brief says to do and report. Gould rules 26 to 40 remain
   unread.
6. **The extender's word-final test still reads the FILE's `sylType`.** On a
   score with no underlay of its own there is no syllable type, so no extender
   draws for the singer's mark even after a word-final syllable. That is the
   same gap the hyphen already has in the same place, and it is pre-existing;
   widening it needs the singer's own syllable types carried to the renderer,
   which is a second channel and not in this brief.
7. **No timing was taken.** The walkclock harness burns a core, so it is the
   wrong instrument for one.

---

## 10. What you do

**TWO UNTRACKED FILES, and the ship script refuses on untracked files.** Named
in full:

- `docs/sessions/brief-n113-melisma_r1_2026-09-07.md` (the brief; the desk wrote
  it into the tree and it is untracked)
- `docs/sessions/memo-n113-melisma_r1_2026-09-07.md` (this memo)

No new source file: everything landed in files that are already tracked.
Everything the walk staged lived under `apps/web/.svelte-kit/`, which is
gitignored, and **has been removed**; the gates were re-run after the removal
and are as reported.

Add them:

```bash
cd ~/Desktop/ilya-rewrite && git add docs/sessions/brief-n113-melisma_r1_2026-09-07.md docs/sessions/memo-n113-melisma_r1_2026-09-07.md
```

Move both baselines:

```bash
sed -i '' 's/1038 passed (1038)/1056 passed (1056)/;s/534 passed | 5 skipped (539)/541 passed | 5 skipped (546)/' ~/Downloads/ilya-ship.sh
```

```bash
chmod +x ~/Downloads/ilya-ship.sh
```

Ship:

```bash
sh ~/Downloads/ilya-ship.sh "N.113: the melisma"
```

Then walk it: take a note holding the last syllable of a word, press Melisma on
the next note, and look for the line under the word; press it on a mid-word
note and look for the hyphen instead; Undo and Redo each; then delete a word
from the poem and check the notes at the end draw nothing.

**Owed after the walk:** the French for the four strings, which joins the one
N.108 / N.111 / N.112-to-114 table; and your call on §7.1, whether the extender
should take the hyphen's weight and offset.
