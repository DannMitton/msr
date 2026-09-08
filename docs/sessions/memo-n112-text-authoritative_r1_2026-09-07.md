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
