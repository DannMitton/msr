# Brief: N.112, the text is authoritative. For Code

Written 2026-09-07 by the desk. Numbered by Dann 2026-09-06, step 2 of the
text-to-score sequence (`STATE.md` §THE ONE THING). Floor: `a186f20`. Commit
message: `N.112: the text is authoritative`.

## 1. The rule, and where it comes from

Dann, 2026-09-07: *"whenever text is present, the transcription exists."*
Finale's Lyrics window, which E.46 adopted as Ilya's model and which the desk
re-read in the current manual on 2026-09-04: *"Change a word in the Lyrics
window and it is also changed in the score; delete it, and all the syllables
in the score slide to the left to close up the gap."*

So: the poem in the field is the source. Everything keyed to a word follows
the word when the text changes: the singer's stress overrides, ё toggles,
syllable divisions, glosses, and the seats on the score. Nothing is reported
as "drift," because nothing is allowed to go stale.

## 2. What exists, read this session

- `pairings.ts:70-`: `SlotOrigin` is `{lineIndex, wordIndex, slotIndex, word}`;
  `word` is the cleaned Cyrillic and was added as *"the discriminator
  between a re-division and a re-transcription (Dann, 2026-08-13)."*
- `pairings.ts:368-404`: `reconcilePairings` refreshes a pairing only when
  the SAME position holds the SAME word, and reports everything else as
  drift. That is what prints "Text changed 59" after a re-transcription
  (`memo-n111-clitic-seat_r1_2026-09-04.md` §9.2).
- `+page.svelte:1724-1737` and `types.ts:163`: the singer's overrides
  (stress, ё, syllable boundaries, gloss) are keyed `"lineIndex-wordIndex"`.
  `memo-n108-5-cleanup_r1_2026-09-07.md` records that an implicit run now
  resets them, because a stale key would print a wrong stress rather than
  none.
- `pairings.ts:608-`: `shiftToEndOfLyric`, `shiftToNextOpenNote`,
  `rotateSyllables`; `clitic-seat.ts`: `seatCliticFolds`, run at ingest.
- `one-action.ts` (N.108-5): `joinText`, the one place a transcription is
  triggered (boot, paste, typing pause, OCR, song switch, score arrival).

## 3. The design

**One word diff, used by everything.** When the text changes, compute a
word-level alignment between the previous word sequence and the new one,
per line first and across lines when a line was split or joined. Standard
longest-common-subsequence on cleaned Cyrillic; a word is "the same" when
its cleaned form is equal. The result is a map from old `(line, word)` to
new `(line, word)` for every matched word, plus the lists of removed and
added words. This is the only place the old and new texts are compared.

**Overrides follow the word.** Re-key every override through the map. An
override on a word that was removed is dropped. An override on a matched
word keeps its value at its new key, so a stress mark set in line 3 survives
an edit in line 1. This ends the reset that N.108-5 introduced.

**Seats follow the word.** A pairing whose `origin` matches a word in the
map is re-originated to the new `(line, word, slot)` and keeps its note. A
pairing whose word was removed is deleted and the seats after it, to the
next undecided note, slide back one note per removed slot
(`shiftToNextOpenNote(..., 'back')`, Finale's "close up the gap"). Added
words take the undecided notes that follow the previous matched word's last
seat; where there are none, the seats after them move forward
(`shiftToEndOfLyric(..., 'forward')`), which is Finale's insert. A word whose
syllable count changed on re-division (same cleaned text, different slots)
is the case `origin.word` already discriminates; keep that behaviour.

**Round-trip stability, pinned.** Transcribing the same text twice yields
the identical map and identical overrides. Editing a word and editing it back
yields the original map. Both are unit tests.

**Drift retires.** `reconcilePairings` and `auditPairings` are replaced by
the diff-driven pass, or reduced to it; the "Text changed n" line leaves the
Underlay station, and `PairingDrift` goes if nothing reads it. What remains
visible is the placed count.

**The clitic seat re-runs after the pass**, so a clitic fold the new text
introduces is seated at once (N.111's rule), and one the new text removes is
released with its word.

## 4. Increments

1. **The diff and the overrides.** `text-diff.ts` (name yours) with the
   alignment and the re-keying of the four override maps, wired into
   `joinText` so every implicit run carries the overrides across. Tests:
   edit one word, overrides elsewhere survive; delete a word, its override
   goes, the rest re-key; split a line, everything after re-keys; identical
   text is a no-op.
2. **The seats.** Pairings re-originate through the same map; removal slides
   back; insertion takes open notes or pushes forward; drift retires; the
   Underlay line goes. Tests on `sunless-01-engraved.musicxml` with its poem:
   change a word mid-poem, every seat after it unchanged and the changed
   word's seats refreshed; delete a word, the tail closes up; insert a word,
   the tail moves forward; the same text twice, identical maps.

## 5. Constraints

- Do not change `VocalLineEvent`; do not touch `shane/reconciliation/`; do
  not write to `ParsedScore`.
- Ilya never writes `empty` or `melisma` (E.46); an undecided note stays
  undecided.
- The composer's setting stays authoritative where the divergence is not a
  clitic fold (Dann, 2026-09-04): the diff moves seats among notes; it never
  decides what a note may hold.
- No French. Every retired or new English string listed with its key.
- Five gates; state the new gate 4 count for `ilya-ship.sh:79`.
- Walk on a local production build, on the alias's real case: the Mussorgsky
  poem and the engraved fixture; edit `тихая` to `тихая,` and back, edit a
  word in line 2 and see line 4's seats unmoved, delete a word and watch the
  tail close, reload and see it hold.

## 6. Return

`docs/sessions/memo-n112-text-authoritative_r1_<date>.md`: what changed with
`path:line`, the diff's rules in one paragraph, tests, gates, the walk, and a
NOT ESTABLISHED section. **"NOT ESTABLISHED beats a complete invented
answer."** Name every untracked file. Do not run git.
