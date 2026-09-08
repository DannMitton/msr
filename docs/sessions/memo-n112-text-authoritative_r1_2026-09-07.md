# N.112: the text is authoritative

**Code, 2026-09-07.** Floor `a186f20`. Brief:
`docs/sessions/brief-n112-text-authoritative_r1_2026-09-07.md`, read in full.

**Both increments are built, gated, and walked, so this is ONE commit.**

```
N.112: the text is authoritative
```

---

## 1. What changed, with `path:line`

| file | what |
|---|---|
| `apps/web/src/lib/text-diff.ts` | **NEW.** The word diff and the two re-keyers. |
| `apps/web/src/lib/text-diff.test.ts` | **NEW.** 22 tests. |
| `apps/web/src/lib/shane/reseat.ts` | **NEW.** `reseatByDiff`, the seats. |
| `apps/web/src/lib/shane/reseat.test.ts` | **NEW.** 14 tests. |
| `apps/web/src/lib/pipeline.ts:190-263` | `splitIntoPreLines` lifted out of `processText` step 1; `wordGrid(text)` exported. |
| `apps/web/src/lib/shane/pairings.ts:316-390` | `reconcilePairings` reduced to `refreshPairings`; `PairingDrift`, `Reconciliation`, `auditPairings` deleted. |
| `apps/web/src/lib/shane/pairings.test.ts:1-95` | The reconcile block rewritten as a refresh block. |
| `apps/web/src/routes/+page.svelte:1917-2050` | `resetTranscriptionView` split out; `transcribeText` diffs, re-keys, transcribes, re-seats; `carryOverridesAcross`; `reseatAcross`. |
| `apps/web/src/routes/+page.svelte:360-375` | `shownPairings` reads `refreshPairings`; `driftCount` gone. |
| `apps/web/src/lib/shane/SyllableStation.svelte` | The drift line, its `drift` prop and `.station-drift` / `.station-count` deleted. |
| `apps/web/src/lib/i18n.ts:1086` | `station.textChanged` deleted. |

**Changed again by the walk defects of §9:** `reseat.ts` (the ownership test,
the verified `seatIndex`, the anchor), `reseat.test.ts` (+4),
`one-action.ts` (`rebuildSource`), `one-action.test.ts` (+4), and
`+page.svelte` (`poemQueue` named; `handleStartPlacementOver` flushes and reads
`rebuildSource`; `reseatAcross` takes the previous grid).

---

## 2. The diff's rules, in one paragraph

`wordGrid(text)` is `processText`'s own step 1, lifted rather than copied, so the
diff and the pipeline cannot disagree about what a word is: same punctuation
set, same hyphenated-particle split, same ё restoration, same N.12 pre-1918
modernisation. It reports `cleanWord` per line **before** step 1.5 applies the
ё toggles, because a ё toggle changes `cleanWord` and diffing the transcribed
lines would read the singer's own mark as a word they had replaced.
`diffWordGrid` flattens both grids to one word sequence (so a moved line break
is invisible to it, which is what covers a line split or join with one rule
rather than two), trims the common prefix and suffix, and runs a
longest-common-subsequence on what is left. A word is "the same" when its
cleaned form is equal, which is `SlotOrigin.word`'s own discriminator, ruled by
Dann 2026-08-13. The result is `moved` (old key to new key, including keys that
map to themselves), `removed`, `added`, and an `unchanged` flag that every
caller short-circuits on. `rekeyByWord` and `rekeyByWordChar` carry the
override maps across it; `reseatByDiff` carries the seats.

---

## 3. The five gates

Run for real on this machine, all five, before the work and again after it.

| gate | script literal at `~/Downloads/ilya-ship.sh` | this run |
|---|---|---|
| 1 phonology | `216 passed (216)` | `216 passed (216)` |
| 2 dictionary | `235 passed (235)` | `235 passed (235)` |
| 3 web-check | `found 0 errors and 7 warnings in 4 files` | same |
| 4 web-test | `995 passed (995)` | **`1030 passed (1030)`** |
| 5 score-parser | `534 passed \| 5 skipped (539)` | same |

**GATE 4 MOVES 995 → 1030, and that move needs your permission.** The
arithmetic: **+22** `text-diff.test.ts`, **+14** `reseat.test.ts`, **−1** net in
`pairings.test.ts` (the `auditPairings` block and one drift test go, one
refresh test arrives). 995 + 22 + 14 − 1 = 1030.

**The `sed` drops the execute bit**, so its `chmod +x` is not optional
(`ENVIRONMENT.md`, measured 2026-08-18):

```bash
sed -i '' 's/995 passed (995)/1030 passed (1030)/' ~/Downloads/ilya-ship.sh
```

```bash
chmod +x ~/Downloads/ilya-ship.sh
```

No other line of the ship script changes.

---

## 4. Increment 1: the diff and the overrides

**What it ends.** N.108-5 named its own cost in the same breath it shipped it:
an implicit run dropped every override, because the keys are positional, and
between losing a mark and printing a wrong one it chose to lose the mark. Under
Dann's widening of 2026-09-07 that happened on every typing pause. The diff
gives the position a way to MOVE, so neither happens.

**Five maps, one rule.** `spotReconstitution`, `userStressOverrides`,
`syllableOverrides` and `doc.glossOverrides` / `doc.glossAnchors` take
`rekeyByWord`; `yoToggles` takes `rekeyByWordChar`, because it appends a
character ordinal and a matched word is the same letters in the same order.

**The order is the rule.** The diff runs BEFORE `runPipeline`, because
`runPipeline` passes `userStressOverrides` and `yoToggles` straight into
`processText`, so an override still holding its old key would be applied at the
wrong word on that very run.

**One pipeline run, not two.** The alternative was to transcribe with no
overrides, diff the result, re-key, and transcribe again. `wordGrid` is step 1
alone, so this asks what the words are without asking what they sound like.

**`resetSessionState` split.** `resetTranscriptionView` holds what is not keyed
to a word (the error, the selection, the focus memory) and is what a
transcription clears. `resetSessionState` keeps the four `new Map()` lines plus
`transcribedGrid = []` and now has two callers, Clear and the song switch, which
are the two moments where the poem those positions described stops existing.

**N.57's gloss anchor check stays**, as a second gate rather than the mechanism:
the diff has already moved every gloss whose word survived, and the anchor drops
any whose word no longer matches.

---

## 5. Increment 2: the seats, and drift retired

**Three rules, in the order they run.**

1. A matched word's seat is re-originated to its new `(line, word, slot)` and
   its text refreshed. It keeps its note.
2. A removed word's seats go, one hole per lost slot, and the tail closes up to
   the next undecided note.
3. A new word's slots take the notes after the word before them: an undecided
   note is filled, otherwise the run moves forward to open one.

**A REPLACEMENT IS 2 AND 3 AT THE SAME SPOT, and the net effect on every later
seat is nothing.** That is Finale's behaviour and it is what the brief's "every
seat after it unchanged" asks for. **This memo's author expected the wrong thing
here and the test run corrected it**: the first version of that test asserted the
following word sliding to the front. The wrong version is the intuitive one, so
the correct expectation is kept as a commented assertion rather than quietly
fixed.

**A BUG THE UNIT TESTS CAUGHT, recorded because the wrong version looks right.**
The holes must close **highest first**. Closing ascending is wrong for adjacent
holes: a close stops at the next undecided note, an adjacent hole IS that note,
and the lower close then moves nothing. Deleting two words side by side slid the
tail back one instead of two. Descending, each close runs into decided notes or
the end of the line, so every removal spends exactly one place.

**Drift retired.** `reconcilePairings` is reduced to `refreshPairings`, which
returns a map and no drift list. `PairingDrift`, `Reconciliation` and
`auditPairings` are deleted, `driftCount` is gone from `+page.svelte`, the
`drift` prop and the `.station-drift` line are gone from `SyllableStation`, and
`station.textChanged` is deleted from `i18n.ts`.

**`refreshPairings` is NOT deleted outright, and the reason is a live caller.**
`handleReset` (the per-word reset) drops one word's stress or ё marks and
re-runs `runPipeline` alone, never `transcribeText`, so no diff is computed and
no re-seat runs. The word's syllable division can move under that and its seats
have to read the new text.

**The clitic seat re-runs after the pass** (N.111, ruled 2026-09-04), so a fold
the new text introduces is seated at once and one it removes was released with
its word.

**`pairingCursor` is clamped, not recomputed.** A shorter poem can leave it past
the end, which would arm nothing. Recomputing it from the placed count instead
would jump the singer's place across the poem on every keystroke pause.

---

## 6. The strings

| key | English | French | what |
|---|---|---|---|
| `station.textChanged` | `Text changed` | `Texte modifié` | **DELETED.** Ratified by Dann 2026-08-14, retired with drift. |

**No new string, English or French.** Nothing this item adds is visible as
words: the diff, the re-keying and the re-seat all change where things sit, not
what is written. The brief asked for no French and there is none to ask for.

---

## 7. The walk, on a local production build

`pnpm --filter @ilya/web build`, `vite preview` on 4173, restarted after
staging. The alias's real case: the Mussorgsky poem, eight lines, against
`sunless-01-engraved.musicxml` (96 notes, lyric-bearing). The dictionary needed
the walkclock harness from `ENVIRONMENT.md`, injected into the prerendered
`index.html`, confirmed live, and removed afterwards with both files re-grepped
clean.

**Baseline:** all 96 notes seated from the poem, `Ком нат ка тес на я ти ха я ми
ла я тень неп рог ляд на я …`.

| step | expected, stated before the measurement | observed |
|---|---|---|
| 1. `тихая` → `тихая,` and back | the cleaned word never changes, so the diff is `unchanged` and not one seat moves | identical at both readings, both directions |
| 2. edit a word in line 2 | only that word's slots change; line 4 and the whole tail unmoved | changed indices `[19, 20, 21]` only; line 4 identical; every index from 24 on identical; still 96 seated |
| 3. delete `много` from line 7 | the tail closes up by two, leaving 94 seats | **94 pairings**, the run realigns at exactly −2, the poem ends correctly on `я` |
| 4. reload | the map holds through storage | 94 pairings, same last six seats, poem restored as edited |
| 5. press Transcribe twice | the same text twice gives identical maps | the stored map is byte-identical after each press |

**TWO OF MY INSTRUMENTS LIED ON STEP 3, and both are worth writing down.** The
first count came from scraping Cyrillic `<text>` elements and read 95 where the
record holds 94, because **a fused clitic is ONE text element**: `"в бью"` is one
string on one note. The second attempt mapped notes to text by geometry and
matched one text element to two notes in the last measure. The reading that
settled it came from the app's own record, the `songs` store in the
`ilya-library` IndexedDB, which is what the app saved rather than what it drew.

---

## 8. A finding for you, and it is one line to rule

**A note the re-seat vacates draws the FILE's own word, not nothing.** After
step 3 the record held 94 seats correctly, and the page drew a stray `но` on
note 94, which is the engraved file's own underlay showing through.

This is **already recorded as N.111's finding** (`INBOX.md`, 2026-09-04: "after
the seat the last note of the piece is undecided and, on a lyric-bearing score,
undecided draws the file's stale text"). The desk default there was "an
undecided note **inside a seated run** draws nothing", and these notes are past
the end of the run, so the rule does not reach them.

**N.112 makes it common**, because every deletion now vacates notes at the tail.

**It is not built here, deliberately.** Extending "draws nothing" past the end of
the run would be Ilya overruling the file's witness in a second case, and your
ruling of 2026-09-04 is that the transcription overrules the file **only** on a
clitic fold. That makes this yours, not a desk default.

---

## 9. NOT ESTABLISHED

**NOT ESTABLISHED beats a complete invented answer.**

1. **The override carry is proved by test, not walked end to end.** 22 unit
   tests pin `rekeyByWord` and `rekeyByWordChar`, and the seats walked through
   three edits and a reload on the same `diff.moved` map. What was NOT done is
   setting a stress override in the Inspector and watching it survive an edit
   elsewhere: two attempts to open the word inspector from the transcription
   page did not reach a stress control, and the brief's walk list does not name
   it. The mechanism is shared with the seats, which is reasoning, not a
   measurement.
2. **The insert path is not walked.** Steps 2 and 3 exercise a replacement and a
   deletion. Adding a word mid-poem is covered by four unit tests
   (`reseat.test.ts`), including the displacement case, but no browser
   observation exists for it.
3. **`ALIGN_CAP` is never reached in any measurement.** It is a DESK DEFAULT of
   600 words per side after prefix and suffix trimming, chosen so a
   longest-common-subsequence cannot stall the 600 ms typing pause. Above it the
   middle is reported as wholly removed and wholly added, which is exactly what
   shipped before N.112, so the degraded case is never worse. No poem in this
   walk came near it.
4. **The cost of the diff on a long poem is not measured.** The 37-word poem
   showed no perceptible delay, and no timing was taken. `ENVIRONMENT.md`'s own
   rule applies: a timing that has not been controlled for is not reported, and
   the walkclock harness burns a core, so it is the wrong instrument for one.
5. **What happens when a re-seat and an Undo meet is not established.** N.111-3b
   added `redoStack` and `undoStack` snapshots of `doc.pairings`. A re-seat
   writes `doc.pairings` without pushing onto either stack, so an Undo taken
   after a text edit restores the pre-edit pairings against the post-edit poem.
   Not walked, not tested, and not in this brief's scope.
6. **Whether the flat diff is right for a poem with repeated lines.** A refrain
   gives the alignment several equally-long candidates and the
   longest-common-subsequence picks one by its own tie-breaking. One unit test
   pins repeated WORDS behaving per occurrence. Repeated LINES are untested.

---

## 10. What you do

**ONE UNTRACKED FILE THAT MUST BE ADDED, plus the four new source files, and the
ship script refuses on untracked files.** Named in full:

- `docs/sessions/brief-n112-text-authoritative_r1_2026-09-07.md` (the brief; it
  was written into the tree by the desk and is untracked)
- `docs/sessions/memo-n112-text-authoritative_r1_2026-09-07.md` (this memo)
- `apps/web/src/lib/text-diff.ts`
- `apps/web/src/lib/text-diff.test.ts`
- `apps/web/src/lib/shane/reseat.ts`
- `apps/web/src/lib/shane/reseat.test.ts`

Nothing else was created in the tracked tree. Everything the walk staged lived
under `apps/web/.svelte-kit/`, which is gitignored, and **has been removed**; the
gates were re-run after the removal and are as reported.

Add them:

```bash
cd ~/Desktop/ilya-rewrite && git add docs/sessions/brief-n112-text-authoritative_r1_2026-09-07.md docs/sessions/memo-n112-text-authoritative_r1_2026-09-07.md apps/web/src/lib/text-diff.ts apps/web/src/lib/text-diff.test.ts apps/web/src/lib/shane/reseat.ts apps/web/src/lib/shane/reseat.test.ts
```

Move the gate 4 baseline:

```bash
sed -i '' 's/995 passed (995)/1030 passed (1030)/' ~/Downloads/ilya-ship.sh
```

```bash
chmod +x ~/Downloads/ilya-ship.sh
```

Ship:

```bash
sh ~/Downloads/ilya-ship.sh "N.112: the text is authoritative"
```

Then walk it: with the poem and a score in, edit a word mid-poem and check the
seats after it have not moved, delete a word and check the tail closes up, and
reload.

**Owed after the walk:** your ruling on §8, what a vacated note draws.

---

## 9. Two walk defects on `b191867`, found by Dann 2026-09-07

Both are fixed, gated and walked. **Gate 4 moves 1030 → 1038** (see §9.5).

### 9.1 The insert anchored on a seat that matched only by position

**What Dann walked.** On the alias's real state (the Mussorgsky poem, the
engraved fixture, a hand-placed `Ком` at note 0 from N.111-3b's walk, and "4
placements have no note in this score, kept"), replacing `безответная` with
`бесконечная` in line 2 seated the new word on **system 1's notes 1 to 5**,
giving `Ком – бес – ко – неч – на – я`, while system 2 kept `без – от – вет –
на – я`. Changing it back seated `безответная` on the same wrong notes.

**The cause, established by reproduction.** `readScoreText` joins a score's
whole underlay into **one line** (`clitic-seat.ts:449`), so a seat made from the
score's own words carries `lineIndex 0` with a running `wordIndex`. Those
coordinates collide head-on with the poem's first line. `reseatByDiff` consulted
`diff.moved` **by position alone** and never read `origin.word`, which is the
discriminator Dann ruled on 2026-08-13 and which `SlotOrigin`'s own doc comment
exists to carry. So a score coordinate was silently reinterpreted as a poem
coordinate: it answered the anchor lookup, and it was itself rewritten with the
poem's word.

**How N.111-3b's walk put such a seat there.** That walk placed by hand while the
dictionary was stalled, so `lines` was empty, `slotQueue` fell back to
`scoreTextQueue`, and the placed pairing took a **score** origin. One seat with
a score origin at the head of the piece is enough.

**The positive control**, run with the word check disabled and again with it on:

| state | word check off | word check on |
|---|---|---|
| every seat a score coordinate | `Ком тес ти ми бес ко неч на я _ _ …` | untouched, nothing seated |
| score coordinates at the head, poem seats after | `Ком тес ти ми на я …` (four seats silently rewritten) | `Ком нат ка тес на я … тень бес ко неч на я` |

**The fix**, `reseat.ts`:

- **A seat this diff cannot speak for is left exactly as it is.** `reseatByDiff`
  takes the poem the seats were made against (`before`, the previous word grid)
  and re-keys only a seat whose `origin.word` is what stood at its coordinate in
  that poem. Three real seats fail that test and all three are now kept
  untouched: one made from the score's own words, one carried in from another
  score by `mergeOnUpload`, and one stored before `origin.word` existed. They are
  counted in a new `kept`.
- **`seatIndex` verifies the word, not only the position**, so a kept seat can
  never anchor an insert.
- **The anchor is the last seat of the previous matched word**, tracked with an
  explicit `anchorFound` rather than `anchor === -1`, because -1 had to mean two
  different things.
- **Ahead of every seat, the anchor is the first poem seat**, so replacing the
  poem's first word still lands the new word in its place. Without this the head
  case left the head bare and slid the poem forward by a word, which the run
  caught.
- **A slot this pass just seated is an anchor like any other.** Without that, a
  multi-syllable head insert re-derived the same target each time and pushed its
  predecessor along: `гор ни ца` came out `ца ни гор`. Also caught by the run.
- **With no poem seat at all, nothing is seated.** DESK DEFAULT: every seat
  belongs to the score's own words or to another song, so there is no run to
  insert into and any target is a guess. The queue and the hand are undisturbed.

**Pinned by four tests** in `reseat.test.ts`: a score-coordinate seat is left
standing; an insert never anchors on a seat that matches only by position; a
pairing on an event id this score has not got is absent for anchoring; nothing
is seated when no previous matched word has a seat.

### 9.2 The walk of 9.1, on a production build

The state was reconstructed on the pane's own profile: the original poem, the
engraved fixture, a hand-placed seat at note 0 carrying a **score** origin, and
four placements on ids this score has not got. The prior profile state was
recorded before anything was changed.

| reading | before the edit | after the edit |
|---|---|---|
| system 1 | `Ком нат ка тес на я ти ха я ми ла я` | **unchanged** |
| system 2 | `тень неп рог ляд на я тень бе зот вет на я ду ма глу бо ка я` | `тень неп рог ляд на я тень **бес ко неч на я** ду ма глу бо ка я` |
| seats | 100 | 100 |

Changing it back restored system 2 to `бе зот вет на я` with system 1 again
unchanged. The four placements on unknown ids came through byte-identical, and
the hand-placed score-origin seat at note 0 kept its content and its origin.

### 9.3 Start placement over rebuilt from the score's words

**What Dann walked.** After Start placement over the last note of the piece was
bare and `одинокая` ended on `ка`.

**Which queue it used, measured.** The drawer's Lyric header prints
`placed / queue length`, and it is the honest instrument here. With the poem in
the field it reads **`96 / 96`**. With the poem cleared, so that `slotQueue`
falls back, it reads **`12 / 95`** against the same 96 notes. So:

- the poem's queue is **96 slots** and ends on `я`;
- the score's own queue is **95 slots** and ends on `ка`, because this
  engraving lost its final `я` off the end (N.111, 2026-09-04).

`firstPass` over 96 notes and 95 slots seats 95 and leaves the last note bare,
with `одинокая` reading `о ди но ка`. **The rebuild used the score's own words.**

**The cause.** `slotQueue` falls back to `scoreTextQueue` when
`buildSlotQueue(lines)` is empty, and `lines` is empty whenever the
transcription has not run over the current text, which at boot is the window
before the dictionary lands. The test was "has the poem been TRANSCRIBED", where
Dann's ruling of 2026-09-07 asks "is text PRESENT".

**The fix.** `rebuildSource(poem, poemSlots)` in `one-action.ts`, lifted out of
the component so a test can reach it, exactly as N.108-5 lifted
`transcribeVerdict`:

- text present and the queue built → `poem`;
- no text at all → `score`, which is N.111's fallback and stays;
- text present and no queue yet → `none`, and the button does nothing.

`handleStartPlacementOver` calls `flushText()` first, so under Dann's own ruling
the transcription exists by the time the queue is read. `none` is a DESK
DEFAULT: rebuilding from the score's words there is the defect, and rebuilding
from an empty queue would erase every placement, so leaving them standing is the
reversible answer.

**Walked, on a production build.** Warm, with the poem transcribed: Start
placement over gives `96 / 96` and the tail `мо я ночь о ди но ка я`, so the
last note carries `я`. Cold, with the dictionary still loading: the press leaves
all 96 seats standing and the tail unchanged, where the old path would have
rebuilt.

**Pinned by four tests** in `one-action.test.ts`, including that the score is
never read while text is present, at any queue length.

### 9.4 Three instrument faults, all mine, all recorded

1. **Counting Cyrillic `<text>` elements counts NOTES, not syllables.** A fused
   clitic is one element: `"в бью"` is one string on one note.
2. **Reading the Underlay station's chips is not reading the queue.** The
   station is absent from the DOM in states where the queue is full, so "0
   chips" read as "empty queue" twice. The `n / m` on the Lyric header is the
   honest instrument, and it is what settled §9.3.
3. **Setting the textarea to `''` does not clear the transcription.**
   `transcribeVerdict` answers `nothing` for an empty field, so `lines` keeps the
   previous poem and the queue never changes. The receipt's own Clear is the
   only path that empties `lines`.

### 9.5 Gates

All five run for real, before and after.

| gate | script literal | this run |
|---|---|---|
| 1 phonology | `216 passed (216)` | same |
| 2 dictionary | `235 passed (235)` | same |
| 3 web-check | `found 0 errors and 7 warnings in 4 files` | same |
| 4 web-test | `1030 passed (1030)` | **`1038 passed (1038)`** |
| 5 score-parser | `534 passed \| 5 skipped (539)` | same |

**+4** in `reseat.test.ts`, **+4** in `one-action.test.ts`. 1030 + 8 = 1038.

```bash
sed -i '' 's/1030 passed (1030)/1038 passed (1038)/' ~/Downloads/ilya-ship.sh
```

```bash
chmod +x ~/Downloads/ilya-ship.sh
```

### 9.6 NOT ESTABLISHED

**NOT ESTABLISHED beats a complete invented answer.**

1. **Dann's own map was never read.** The state for §9.2 was RECONSTRUCTED from
   his description, not exported from his session. The reconstruction reproduces
   the mechanism and the control proves the fix, but whether his hand-placed seat
   carried a score origin is inference from N.111-3b's walk conditions, not a
   measurement of his file.
2. **Why his insert anchored at note 0 rather than at the last score-coordinate
   seat is not established.** The reproduction anchors at the last such seat.
   Reaching note 0 exactly needs only one of them to be the sole positional
   match, which his map may well have had, but that is reasoning.
3. **No new string, English or French**, and none retired, so nothing is owed.
4. **The pane's own browser profile was changed by this walk**, deliberately and
   after recording what was there: the poem, 94 seats and the song name. Nothing
   on Dann's machine was touched.
5. **§9.3's cold case was walked with the dictionary stalled in a hidden pane**,
   which is the pane's own condition rather than a singer's. The warm case is the
   one a singer meets, and it was walked too.
