# N.113b: the walk findings

Revision 1, 2026-09-08. Claude Code on `~/Desktop/ilya-rewrite`, branch `Shane`,
floor `87afa4b`. Brief: `docs/sessions/brief-n113b-walk-findings_r1_2026-09-08.md`.

Every claim below carries a `path:line`, a run, or `NOT ESTABLISHED`. There is no
fourth form. **NOT ESTABLISHED beats a complete invented answer.**

---

## 0. The three items, in one line each

1. **The loupe's box goes lavender. DONE and walked.** The box is
   `rect[data-selection-ring]`, and its colour lives at
   `VoiceProfilePane.svelte:1313`, not at either line the brief named. Measured
   in the rendered DOM: `rgb(142, 126, 155)`.
2. **The locator gains a second line. DONE and walked**, in a compound metre and
   in a simple one, with the beat rule Dann ruled and eleven tests on it.
3. **A word-final sustain draws an extender. DONE and walked.** The cause is
   neither of the brief's two candidates as written, and it is bigger than the
   melisma: the renderer drew the **singer's words** and reasoned about the
   **publisher's word division**.

---

## 1. What changed, with `path:line`

### Item 1, the lavender box. One token

| file:line | what |
|---|---|
| `apps/web/src/lib/shane/VoiceProfilePane.svelte:1313` | `stroke: var(--sage, #8b9a7d)` becomes `stroke: var(--deeper-lavender, #8e7e9b)`, with the ruling and its date in the comment above it |

**The brief's two seams are both the wrong element, and this is the correction
rather than a complaint.** The brief named `Loupe.svelte:1006` and `:1015`. Both
line numbers below are the brief's own, read at the floor; this ship's own edits
to `Loupe.svelte` moved them to `:1039` and `:1048`, and neither rule changed.

- **`Loupe.svelte:1006` is a DEAD RULE.** It styles `[data-loupe-selected]`, and
  **nothing in the tree sets that attribute**: one hit for `loupe-selected`
  across `apps/web/src` and `packages/*/src`, and it is the stylesheet itself
  (`Loupe.svelte:1005`). The only other mention anywhere is a memo recording that
  the count of that attribute was **zero**
  (`docs/sessions/memo-mobile-slice2_r2_2026-08-26.md:145`). Changing it would
  have painted nothing. **Left exactly as it was**, and §7 says why it is worth
  a line in `ENVIRONMENT.md`.
- **`Loupe.svelte:1015` is the HELD-MEASURE BRACKET**, the sage rectangle the
  page draws around the measure the loupe holds. It is a different mark on a
  different thing and Dann ruled nothing about it. **Left alone**, which is also
  what the brief's own "nothing else on the page changed colour" requires.
  Measured after the change: still `rgb(139, 154, 125)`, `stroke-width 1.2px`.
- **The box Dann saw is the page's selection ring**, `rect[data-selection-ring]`,
  built by `VoiceProfilePane.svelte:488-495` from the notehead's measured ink and
  cloned into the loupe since N.113a, in the block `Loupe.svelte:668` opens with
  THE PAGE'S OWN MARK STAYS. Its geometry on
  the N.113a walk was recorded as `w 15 h 40.02 rx 6`, stroked `rgb(139, 154,
  125)` (`memo-n113a-walk_r1_2026-09-07.md` §7); `RING_MIN_W = 15` and
  `RING_RADIUS = 6` at `VoiceProfilePane.svelte:337` and `:340` are the same
  numbers. That is the element, and its stroke is the one line above.

**DESK DEFAULT, and Dann's to wave off in one word: the page's ring goes lavender
too.** One rule paints both surfaces, because the page's box on the taken note
and the loupe's box on the taken note are the same rectangle drawn twice. Giving
them two colours would say they were two things. Nothing else on either surface
changed colour; §3 has the measurement.

The token is `--deeper-lavender` (`app.css:134`), which is what
`CorrectionSurface.svelte:852` already uses on Dann's ruling of 2026-08-28. That
ruling overturned the same reasoning this one overturns, in his own words as the
file carries them at `CorrectionSurface.svelte:845-849`: *"It was sage, on the
reasoning that sage is Studio's accent for the score document; the ruling is that
lavender codes music and voice and this is a MUSIC station."*

### Item 2, the locator's second line

| file:line | what |
|---|---|
| `apps/web/src/lib/shane/entry.ts:444` | `BeatPosition`, a beat and an optional pulse |
| `apps/web/src/lib/shane/entry.ts:466` | `isCompound`, Dann's rule as a predicate |
| `apps/web/src/lib/shane/entry.ts:499` | `beatAt`, a whole-note offset to a beat, exactly |
| `apps/web/src/lib/shane/entry.ts:548` | `beatOfEntry`, one entry's beat in the corrected line |
| `apps/web/src/lib/i18n.ts:338-339` | `loupe.beat` and `loupe.beatPulse`, English in both slots |
| `apps/web/src/routes/+page.svelte:145` | `beatOfEntry` imported |
| `apps/web/src/routes/+page.svelte:1477` | `selectedSignature`, the taken note's OWN measure's |
| `apps/web/src/routes/+page.svelte:1484` | `selectedBeat` |
| `apps/web/src/routes/+page.svelte:1490` | `loupeNoteLine`, composed from `readoutLine`'s own parts |
| `apps/web/src/routes/+page.svelte:4646` | `noteLine={loupeNoteLine}` |
| `apps/web/src/lib/shane/Loupe.svelte:51`, `:91` | the `noteLine` prop |
| `apps/web/src/lib/shane/Loupe.svelte:861-864` | the second `<p>`, and the tag takes `.paired` |
| `apps/web/src/lib/shane/Loupe.svelte:996`, `:1005` | the two style rules |
| `apps/web/src/lib/shane/entry.test.ts:433`, `:514` | eleven tests |

**They live in `entry.ts` beside `measureFill`** because that is the file that
already judges a measure against its own signature, and two functions with two
ideas of what a beat is would be the defect this avoids.

### Item 3, the word division

| file:line | what |
|---|---|
| `packages/score-parser/src/staff-renderer.ts:275` | `sylTypePreview`, the new render option |
| `packages/score-parser/src/staff-renderer.ts:337` | it joins the `DEFAULTS` omit list, beside `cyrPreview` |
| `packages/score-parser/src/staff-renderer.ts:2565` | `sylType: options.sylTypePreview?.[ev.id] ?? syl?.type` |
| `apps/web/src/lib/shane/pairings.ts:737` | `pairedSyllableType`, the canonical statement of the rule |
| `apps/web/src/lib/shane/VoiceProfilePane.svelte:75`, `:830`, `:987` | derived beside `cyrPreview` and passed with it |
| `packages/score-parser/src/staff-renderer.test.ts:355` | six renderer tests, including one that reproduces the defect |
| `apps/web/src/lib/shane/pairings.test.ts:356` | five tests on the rule itself |

`page-layout.ts:170` spreads its options, so the channel threads through
`paginateScore` with no edit there.

**`VocalLineEvent` is untouched. `apps/web/src/lib/shane/reconciliation/` is
untouched.** No French was written: both new keys carry the English in the `fr`
slot, §6 lists them.

---

## 2. The five gates

Run one at a time, because `ilya-ship.sh` refuses while the brief itself is
untracked. §8 has the `git add`.

| gate | baseline | now | moved |
|---|---|---|---|
| 1 phonology | `216 passed (216)` | `216 passed (216)` | no |
| 2 dictionary | `235 passed (235)` | `235 passed (235)` | no |
| 3 web-check | `found 0 errors and 7 warnings in 4 files` | `found 0 errors and 7 warnings in 4 files` | no |
| 4 web-test | `1058 passed (1058)` | **`1074 passed (1074)`** | **+16** |
| 5 score-parser | `541 passed \| 5 skipped (546)` | **`547 passed \| 5 skipped (552)`** | **+6** |

**The cause of each move, and both are new tests only.**

- **Gate 4, +16.** Eleven in `entry.test.ts` on the beat rule
  (`entry.test.ts:433` and `:514`) and five in `pairings.test.ts` on
  `pairedSyllableType` (`pairings.test.ts:356`). `entry.test.ts` went 50 to 61
  on its own, measured separately.
- **Gate 5, +6.** Six in `staff-renderer.test.ts:355` on the word division.

**The new literals for `ilya-ship.sh`, read out of the file at `:79` and `:80`
this session rather than transcribed from a memo:**

- `:79` reads `gate 4 web-test     "1058 passed (1058)"` and wants `1074 passed (1074)`.
- `:80` reads `gate 5 score-parser "541 passed | 5 skipped (546)"` and wants `547 passed | 5 skipped (552)`.

§8 has the two `sed` commands. **The baseline move is yours, not mine**
(`ENVIRONMENT.md` §"Moving a gate baseline needs Dann's permission").

---

## 3. Item 1's walk

**Local production build.** `pnpm --filter @ilya/web build`, then `vite preview`
started fresh through `preview_start` after the build, viewport sized to
1440 × 900 first. Loaded entry hash `app.Dn5YCihX.js`, read back off
`performance.getEntriesByType('resource')` and matched against
`ls apps/web/.svelte-kit/output/client/_app/immutable/entry/`. The engraved
Sunless fixture, 96 notes, 7 systems.

**Expectation, stated before the measurement:** clicking a notehead inserts one
`rect[data-selection-ring]` whose computed stroke is `rgb(142, 126, 155)`, which
is `#8E7E9B`, which is `--deeper-lavender`, and not `rgb(139, 154, 125)`, which
is `--sage`. **Named failure mode:** the token is undefined in that scope and the
identical hex fallback applies, so the reading cannot tell `var()` from fallback.
**Ruled out first:** both tokens resolve at the root and differ,
`--deeper-lavender` `#8E7E9B` against `--sage` `#8B9A7D`, so the reading does
separate lavender from sage even if it cannot separate token from fallback.

| what | observed |
|---|---|
| rings in the document | **3**: one on the page, two in the loupe, which clones the system into a head and a body |
| every ring's computed stroke | `rgb(142, 126, 155)` |
| held-measure bracket | `rgb(139, 154, 125)`, `stroke-width 1.2px`, **unchanged** |
| ring on the taken note | `x 184.91 w 27.53` against hit `m6-3-4` at `x 178.11`, the next hit at `x 229.16` |

**The other `--sage` uses, and what was done with each.** Three in the two files,
found by grep:

| `path:line` | what it paints | left alone because |
|---|---|---|
| `Loupe.svelte:1006` | `[data-loupe-selected]` | **nothing sets that attribute anywhere in the tree.** A dead rule |
| `Loupe.svelte:1015` | `[data-held-measure]` | the page's bracket around the held measure, a different mark, unruled, and measured unchanged above |
| `VoiceProfilePane.svelte:1313` | `rect[data-selection-ring]` | **this is the one that changed** |

---

## 4. Item 2's walk

### The rule, as ruled

Compound when the numerator is a multiple of three and the denominator is 8 or
16. The beat is then the dotted unit, three of the denominator's own units, and
the measure holds numerator ÷ 3 of them. Every other signature counts the
denominator's unit. **6/4 and 9/4 are NOT compound**, because the denominators
Dann named are 8 and 16, and a 6/4 meant as two dotted halves cannot be told from
one meant as six quarters without reading the beaming. Ilya does not guess it.
`entry.ts:466`, pinned at `entry.test.ts:447`.

The brief's five cases are the first test (`entry.test.ts:439`) and all five
pass: 4/4 at 1/4 is beat 2; 6/8 at 3/8 is beat 2; 6/8 at 1/8 is beat 1 pulse 2;
3/8 at 1/8 is beat 1 pulse 2; 12/8 at 9/8 is beat 4.

### On a compound metre, on the build

The fixture is 6/8 for one bar and 12/8 from bar 2 (read out of the file's own
`<time>` elements), so **Dann's own measure 7 is compound**. Every reading below
was computed by hand from the metre before the click and then observed.

| entry | onset past the barline | expected | observed |
|---|---|---|---|
| `m6-0-1` | 0 | beat 1 | `G3 · beat 1 · Quarter` |
| `m6-1-4` | 1/4 | beat 1, pulse 3 | `G3 · beat 1, pulse 3 · Quarter` |
| `m6-1-2` | 1/2 | beat 2, pulse 2 | `G3 · beat 2, pulse 2 · Quarter` |
| **`m6-3-4`** | **3/4** | **beat 3** | **`B♭3 · beat 3 · Quarter · Dot`** |
| `m6-9-8` | 9/8 | beat 4 | `D3 · beat 4 · Eighth` |
| `m6-5-4` | 5/4 | beat 4, pulse 2 | `D3 · beat 4, pulse 2 · Eighth` |

The tag above them read `m. 7 · system 3 of 7` throughout. `m6-3-4` is the B♭3
dotted quarter Dann marked, confirmed by pitch and duration against the file.
**Counting the denominator would have made it beat 7. It reads beat 3.**

### On a simple metre, on the build

The Sunless fixture has no simple metre, so a two-bar 4/4 fixture was written for
this and served from `.svelte-kit/output/client/`, which is gitignored. It is
deleted; §5 has the cleanup.

| entry | onset | expected | observed |
|---|---|---|---|
| `m0-0-1` | 0 | beat 1 | `C4 · beat 1 · Quarter` |
| `m0-1-4` | 1/4 | beat 2 | `D4 · beat 2 · Quarter` |
| `m0-1-2` | 1/2 | beat 3 | `E4 · beat 3 · Eighth` |
| `m0-5-8` | 5/8 | beat 3, pulse 2 | `F4 · beat 3, pulse 2 · Eighth` |
| `m0-3-4` | 3/4 | beat 4 | `G4 · beat 4 · Quarter` |
| `m1-0-1` | 0 | beat 1 | `A4 · beat 1 · Half` |
| `m1-1-2` | 1/2 | beat 3 | `B4 · beat 3 · Quarter` |
| `m1-3-4` | 3/4 | beat 4 | `C5 · beat 4 · Quarter` |

Eight of eight.

### On a phone

Read on a 390 × 844 viewport during item 3's walk and again at the end:
`F4 · beat 4, pulse 2 · Eighth` under `m. 1 · system 1 of 1 · 5 of 4`. Two lines,
no wrap, the window below unmoved. Screenshot in the conversation.

### Two departures from the brief, both named

**4.1 The onset is SUMMED from the corrected line, not read off
`rhythmicPosition`.** The brief says to convert the parser's own fraction.
`applyCorrections` carries `rhythmicPosition` through untouched
(`correction.ts:371`, the `...ev` spread), so lengthening the first note of a bar
leaves every later note in that bar claiming the beat it stood on before. **The
loupe is the surface the singer makes that correction ON**, so it is the last
place that may print a stale beat. `beatOfEntry` (`entry.ts:548`) sums
`duration.fraction` across the measure, which is the arithmetic `measureFill`
already runs three lines up, and which tracks corrections, entered notes and
deletions. The two agree on an uncorrected score: the parser's cursor also resets
to zero at every barline, including a pickup's (`musicxml-parser.ts:418`).

**Walked, with the control stated first.** Expectation: with the first note of
the 4/4 bar lengthened from a quarter to a half, the second note reads **beat 3**
where it read **beat 2**, while its stored `rhythmicPosition` is still 1/4.
Observed, in order: `D4 · beat 2 · Quarter`; then the Half cell pressed; then
`C4 · beat 1 · Half` and the tag gained `· 5 of 4`; then the second note read
`D4 · beat 3 · Quarter`. `rhythmicPosition` route would have said beat 2. Pinned
at `entry.test.ts:530`.

**4.2 The duration reads `Quarter · Dot`, not `dotted quarter`.** The brief's
copy is `B♭3 · beat 2 · dotted quarter` and its instruction is *"reuse its parts
rather than a second formatter."* Those two conflict: the dock four millimetres
below the loupe prints `B♭3 · Quarter · Dot` for the same note in the same frame,
because `durationWord` returns `correct.lenQuarter` and the dot is its own key
(`+page.svelte:1448-1453`). Writing `dotted quarter` would put two spellings of
one duration on one screen. **The parts win.** `DESK DEFAULT`, and yours to wave
off in a word: the exact string is `B♭3 · beat 3 · Quarter · Dot`, and the
screenshot shows it above the dock saying `F4 · Eighth`.

### What the beat line does NOT say, stated rather than hidden

**A pulse ordinal means nothing without the division it counts against**, so the
pulse is the beat's own division and nothing finer: three in a compound metre,
two in a simple one. Halving it to fit would print `pulse 2` for the and of
beat 1 and `pulse 2` for the e of beat 1, on the same page, with nothing on the
line to tell them apart.

**The cost: a sixteenth-note onset in a simple metre, and any tuplet onset in any
metre, draws no beat clause at all.** The line then says the pitch and the
duration and stays silent about the beat, which is honest. Pinned at
`entry.test.ts:490` and `:499`. **If you want those named, that is a ruling and
it needs wording you have not seen.**

---

## 5. Item 3's walk, and the cause

### The cause, which is neither candidate as the brief wrote it

**`staff-renderer.ts` drew the singer's words and reasoned about the publisher's
word division.** `cyrPreview` overrides the TEXT under a note
(`staff-renderer.ts:2546`) and **nothing overrode its WORD POSITION**: the
underlay entry took `sylType: syl?.type`, which is `ev.syllable.type`, the file's
own `<syllabic>`. The hyphen loop (`:2760`) and the extender loop
(`:2776`) both read that field.

The two agree only while every seat sits where the publisher's underlay put it.
**A melisma mark shifts every seat after it by one**, which is exactly what
`memo-n113-melisma_r1_2026-09-07.md` §8 step 1 records: marking note 3 moved
`тес` onto note 4 and the tail with it. From that moment the file says `start`
under a syllable that ends a word.

**Why the harness walk saw it work on «ка».** «ка» sits BEFORE the shift point,
so its own `<syllabic>end</syllabic>` was still describing the syllable drawn on
it. Every case after a shift is the broken one.

**The brief's candidate 1 is refuted.** The underlay entry does not carry a
literal dash: `cyr` is `options.cyrPreview?.[ev.id] ?? syl?.text ?? ''` and a
marked note gets `''` (`staff-renderer.ts:2546`). What Dann saw is a `<line>`
element, `data-hyphen`, measured at `y=147` `stroke-width="1"` in §5.3 below.

**The brief's candidate 2 is right in substance and its second half is wrong.**
`sylType` was indeed other than `end`. `melismaEndX` was not at fault: the marked
run opens on the note that DRAWS a syllable, read through `cyrPreview`
(`staff-renderer.ts:1892`), so it already had the right `evId`.

### The fix

`pairedSyllableType` (`pairings.ts:737`) reads each seat's `SlotOrigin` and says
where inside its word the syllable stands. **The word is three fields, not two:**
`lineIndex` and `wordIndex` alone are not a word, because score-origin seats
carry `lineIndex 0` with their own running `wordIndex`
(`memo-n113a-walk_r1_2026-09-07.md` §9.2, 59 of 96 seats on the walk fixture) and
share a coordinate space with the poem's line 0. `origin.word` carries the word's
cleaned Cyrillic verbatim and separates them. `slotIndex` is the ordinal within
the word, so the first slot opens it, the largest closes it, and one slot alone
is `whole`.

### 5.1 The defect reproduced in the tree, and the fix beside it

`staff-renderer.test.ts:355`. The fixture's own division is the control: `n2`
«по» is `start` and `n3` «гру» is `middle`. These cases seat a word-FINAL
syllable on `n2`, which is what a shift produces, and change nothing about the
file.

| test | result |
|---|---|
| the seat WITHOUT the new channel | **no `data-extender="n2"`, and `data-hyphen="n2"` draws.** This is Dann's dash |
| the same seat WITH it | `data-extender="n2"` draws and `data-hyphen="n2"` does not |
| the extender's y against the hyphens' | extender's `y1` **greater** than the hyphen's, read as an inequality because the baseline moves with the music |
| a mid-word seat | no extender, hyphen present |
| a note the singer has not seated | keeps the file's own division |
| the channel absent | **byte-identical** output |

### 5.2 On the build, before any melisma

Same production build, viewport 390 × 844 so the dock's **Melisma** exists
(`+page.svelte:4659`, the dock is `{#if isPhone}`). The Sunless fixture, on the
system carrying measure indices 6 and 7.

**The seats on that system are displaced from the file, which is §7.1's finding
and not mine.** Drawn: «я»(`m6-0-1`) «ла»(`m6-1-4`) «я»(`m6-1-2`), three bare
notes, then «в бью»(`m7-0-1`) «щем»(`m7-1-4`) «ся»(`m7-1-2`) «серд»(`m7-3-4`)
«це»(`m7-1-1`) «на»(`m7-11-8`).

**That displacement is what makes this system the right instrument**, because the
file's division and the page's words disagree on every note of it.

| hyphens the FILE's division would give | hyphens the PAGE's words give | observed |
|---|---|---|
| `m6-0-1`, `m7-1-4`, `m7-1-2`, `m7-1-1` | `m6-1-4`, `m7-0-1`, `m7-1-4`, `m7-3-4` | **`m6-1-4`, `m7-0-1`, `m7-1-4`, `m7-3-4`** |

Both columns were computed by hand before the reading, the first from the file's
`<syllabic>` values and the second from the drawn words. **The observation matches
the second exactly.** Two hyphens the old build drew between separate words,
after «ся» and after «це», are gone.

### 5.3 The melisma, word-final

**Expectation, stated before the measurement:** taking `m7-3-4` («серд»), whose
predecessor `m7-1-2` draws the word-final «ся» of «вбьющемся», and pressing
Melisma draws `data-extender="m7-1-2"` at `cyrY`, at stave-line thickness, with
no `data-hyphen="m7-1-2"`. **Named failure mode:** the shift changes what
`m7-1-2` draws, so the run opens elsewhere.

| what | observed |
|---|---|
| loupe before the press | `m. 8 · system 3 of 7`, `F♯3 · beat 3 · Quarter` |
| after the press | `aria-pressed="true"`, `↰ Undo: melisma set`, «серд» blanked and the tail shifted one on |
| the extender | `data-extender="m7-1-2"`, `y1=151 y2=151`, `stroke-width="0.5"`, `x1=469.03 x2=502.09` |
| copies | **3**: one on the page, two in the loupe's clones |
| the hyphens | `y1=147`, `stroke-width="1"` |
| `data-hyphen="m7-1-2"` | **absent** |

**The extender sits four units below the hyphens at stave-line thickness.** That
is the file's own convention as `memo-n113-melisma_r1_2026-09-07.md` §7.1
recorded it, and it is Gould's distinction on the page: a hyphen is raised and
means the word continues; an extender sits on the baseline and means the word has
ended while its sound continues.

### 5.4 The melisma, mid-word. The negative control

**Expectation:** taking `m7-1-4` («щем»), whose predecessor `m7-0-1` draws
«в бью», which OPENS «вбьющемся», and pressing Melisma draws no extender at all,
and the hyphen from `m7-0-1` spans the marked note.

| what | observed |
|---|---|
| loupe | `m. 8 · system 3 of 7`, `C♯3 · beat 1, pulse 3 · Quarter` |
| extenders in the whole document | **0** |
| hyphens on that system | `m6-1-4`, `m7-0-1`, `m7-1-2`, `m7-1-1` |

`m7-0-1`'s hyphen reaches across the marked note to the next drawn syllable,
which is Gould's rule for a mid-word sustain and is what N.113's own walk
recorded at step 4.

### 5.5 One instrument fault, mine, and the finding inside it

The first note taken for this was `m7-11-8`, whose predecessor `m7-1-1` draws the
word-final «це». Pressing Melisma marked it, blanked its cell, and drew **no
extender**. That reading is correct and my choice of note was wrong: **two eighth
rests stand between `m7-1-1` and `m7-11-8`** in the file, and the run loop stops
at the first entry that is not a note (`staff-renderer.ts:1896`), so no run opens
across them. A rest ends a sustain, so the renderer is right.

**It is still worth a number.** The dock offered **Melisma** on that note and did
not refuse it, so the hand can produce a mark that draws nothing and says nothing
about why. `pairings.ts`'s `melismaRuns` is the canonical rule and I have not
read whether it agrees with the renderer here. **NOT ESTABLISHED**, and named in
§7.2.

### 5.6 Refuting my own build

- **The entry hash was read back from the page** and matched the build's own
  directory, both walks, before any reading was believed. `vite preview` was
  started fresh after each build, because it snapshots its file table at boot.
- **The page proves the new code is running**, not a cached one: `.loupe-note`
  did not exist before this ship, and the hyphen set matches the pairing's word
  division rather than the file's.
- **The two builds are separated by one option.** `staff-renderer.test.ts:355`
  renders the same fixture, the same seat and the same mark twice, with and
  without `sylTypePreview`, and gets Dann's dash in one and the extender in the
  other. That is the positive control the DOM alone cannot give.
- **The walkclock harness makes the instrument lie about ordering between a 0 ms
  timeout and anything else**, and nothing here depends on that. **No timing was
  taken:** the harness burns a core.

### 5.7 What the walk changed, and what it did not

Nothing on your machine was touched. The pane's own browser profile in this
session's preview holds a replaced song and one duration correction, because
loading the 4/4 fixture over the Sunless one raised the chimera warning
correctly, and it was answered **Replace this song**. That is local browser state
in a preview that has been stopped.

**Both staged files are gone and both were re-grepped.** The walkclock harness in
`apps/web/.svelte-kit/output/prerendered/pages/index.html` and the two fixtures
in `apps/web/.svelte-kit/output/client/`. The served document is back to its
original 2,893 bytes, confirmed by a clean rebuild afterwards. `build/` and
`.svelte-kit/` are both gitignored (`.gitignore:6-7`), so nothing staged could
reach the ship script.

---

## 6. French owed

Two keys, both carrying the **English in the `fr` slot**, the treatment
`input.transcribe` and the `group.*` block already get, because `t()` prints
`[MISSING: key]` for an absent variant.

| key | en | fr today |
|---|---|---|
| `loupe.beat` | `beat %b` | `beat %b` |
| `loupe.beatPulse` | `beat %b, pulse %p` | `beat %b, pulse %p` |

These join the table owed after N.114, beside `group.input`, `input.transcribe`,
`input.watermark`, `intake.*`, `loupe.redo`, `loupe.undo.placed`,
`loupe.undo.melisma*` and `loupe.melisma`.

**No French was written.** The pitch and the duration in the second line are
existing keys with ratified French (`correct.lenQuarter` is « Noire »), so only
the beat clause is owed.

---

## 7. What I could not establish

**NOT ESTABLISHED beats a complete invented answer.**

**7.1 THE SEATS ON MEASURE INDEX 6 ARE DISPLACED FROM THE FILE, AND IT IS NOT
MINE.** On the Sunless fixture with no poem typed and no melisma marked, the
system carrying measure indices 6 and 7 draws **nine** underlay cells where the
file has twelve, and they are the wrong words: `m6-0-1` draws «я» where the file
engraves «пес», and the system borrows «на» from measure index 8. Every other
system on the page is exactly right. Counted: 12, 18, **9**, 18, 18, 12, 5.

The page is drawing `cyrPreview`, not the file, which the fold «в бью» proves:
the file carries «в» and «бью» on two notes as two lyric elements and the page
draws them as one cell. So this is the **pairing layer's** seats, made from the
score's own text by `seatCliticFolds`, and it is the same machinery as
`memo-n113a-walk_r1_2026-09-07.md` §9.1 and §9.2. **Whether it is the same defect
is NOT ESTABLISHED.** I did not chase it: it is outside the three items, and it
is unaffected by anything in this ship, because `sylTypePreview` is a strict
no-op when absent and gate 5 pins that byte-for-byte.

**It is worth a number**, and it is the second walk in a row to find it.

**7.2 Whether the dock should offer Melisma on a note a rest separates from its
syllable.** §5.5. The mark is accepted, draws nothing, and says nothing about why.
Whether `melismaRuns` (`pairings.ts`) and the renderer's run loop
(`staff-renderer.ts:1896`) agree on rests is **not read**. A ruling, not a
default.

**7.3 Whether Dann's own press was on the note I think.** He described *"the
taken B♭3 (m. 7, «песня», word-final «ня»)"*. Measure 7's B♭3 dotted quarter is
its fourth note and the file engraves «ны» on it, with «у» between it and «ня».
Given §7.1's displacement, the seats he was looking at were almost certainly not
the file's, and the words under those notes were not the words the file put
there. **What he saw is reproduced and fixed either way**, in §5.1 and §5.3. Which
exact note carried which exact syllable on his screen is **NOT ESTABLISHED** and
would need his own state to establish.

**7.4 A word only partly placed.** `pairedSyllableType` calls the largest
`slotIndex` present the word's last. A word whose syllables run past the last
note would then have its last placed syllable called `end` wrongly. I argue in
the source that it cannot bite, because a word runs out of slots only when the
notes run out, and a melisma run needs a marked note after the syllable that
opens it. **That is reasoning, not a measurement.** No test drives a queue longer
than the notes into this function.

**7.5 The second line in French.** Not rendered in French mode. The two new keys
carry English in both slots by design, so French mode prints English there, which
is what the owed-string treatment does everywhere else.

**7.6 Whether the page's ring going lavender is what Dann wants.** §1 argues one
mark should not have two colours. He ruled on the loupe's box. **DESK DEFAULT.**

**7.7 Four `path:line` citations in source comments were ALREADY stale before
this ship, and this ship shifted them further.** `staff-renderer.ts:709` and
`:2462` / `:2463`, cited from `pairings.ts:681`, `pairings.ts:768`,
`clitic-seat.ts:101` and `VoiceProfilePane.svelte:791`, all name the underlay's
`cyr` and `ipa` assignment, which is at `staff-renderer.ts:2546-2547` today and
was at `:2527-2528` before this ship. `staff-renderer.ts:2532` cites
`VoiceProfilePane.svelte:506` for where `ipaPreview` is passed, which is the
options block at `:987`. **I did not repair them.** They were wrong before I
touched the files, so nothing here turned a correct citation into a wrong one,
and repairing them means editing four more files for no observable effect. The
one citation this ship DID write into a moving target,
`VoiceProfilePane.svelte:1301`, names its block by its own opening words instead
of by a number, per `CONTRACT.md` §5. **This is a hygiene pass someone should
take, and it is not this ship.**

**FOR `ENVIRONMENT.md`, two rows the next session should not have to rediscover:**

> **`Loupe.svelte:1005`'s `[data-loupe-selected]` RULE IS DEAD.** Nothing in
> `apps/web/src` or `packages/*/src` sets that attribute; the only other mention
> anywhere is a memo recording its count as zero. The loupe's box on the taken
> note is `rect[data-selection-ring]`, styled at
> `VoiceProfilePane.svelte:1313` and built at `:485-495`. A brief named the dead
> rule as the seam on 2026-09-08 and it cost this session a search.

> **A MELISMA RUN DOES NOT REACH ACROSS A REST.** `staff-renderer.ts:1896` stops
> at the first placed entry that is not a note, so pressing Melisma on a note that
> rests separate from its syllable draws nothing at all, silently. Choose a
> contiguous pair when walking an extender.

---

## 8. What you paste

The brief is untracked, so the ship script refuses before running anything. Add
it first.

```bash
git -C ~/Desktop/ilya-rewrite add docs/sessions/brief-n113b-walk-findings_r1_2026-09-08.md docs/sessions/memo-n113b-walk-findings_r1_2026-09-08.md
```

Gates 4 and 5 moved, both on new tests only. The two literals, read out of
`~/Downloads/ilya-ship.sh` at `:79` and `:80` this session:

```bash
sed -i '' 's/"1058 passed (1058)"/"1074 passed (1074)"/' ~/Downloads/ilya-ship.sh
```

```bash
sed -i '' 's/"541 passed | 5 skipped (546)"/"547 passed | 5 skipped (552)"/' ~/Downloads/ilya-ship.sh
```

```bash
grep -n "gate 4\|gate 5" ~/Downloads/ilya-ship.sh
```

Then ship.

```bash
sh ~/Downloads/ilya-ship.sh "N.113b: the walk findings"
```
