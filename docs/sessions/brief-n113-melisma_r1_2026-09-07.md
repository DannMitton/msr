# Brief: N.113, the melisma. For Code

Written 2026-09-07 by the desk. Numbered by Dann 2026-09-06, step 3 of the
text-to-score sequence (`STATE.md` §THE ONE THING). Floor: `1b3054a`. Commit
message: `N.113: the melisma`.

## 1. What it is, and where it comes from

Finale's Edit Word Extensions (the current manual, read 2026-09-04): "the
underline following a syllable sustained beyond the note." E.46 surveyed
Finale's lyric tool and adopted Click Assignment and Shift Lyrics; the
extension was left. Dann's Finale review of 2026-09-04 put it back on the
list, and N.113 is its number.

The `melisma` kind already exists in the pairing map (`pairings.ts:121`,
`{ kind: 'melisma' }`) and is the "third state" N.55b's design needed
(`claude/e46-n55b-click-assignment-design_2026-08-13.md`, quoted in
`pairings.ts:1-30`). No control writes it today, and the page draws nothing
for it. E.46 also ruled that Ilya never creates one: *"No melisma is ever
created"* by the first pass. That stands. N.113 is the singer's hand.

Two rulings that bound it: Ilya never writes `empty` or `melisma` (E.46);
and, ruled 2026-09-07, a note the singer's own edit vacates draws nothing.

## 2. Rider 0, ruled 2026-09-07

**A note the singer's edit vacates draws nothing.** Today, past the end of a
seated run, a vacated note draws the engraved file's old word
(`memo-n112-text-authoritative_r1_2026-09-07.md` §8). Blank it on both
lines, Cyrillic and IPA, through the same `applyBlank` channel N.111-3a
built (`pairings.ts:557`), so the two lines cannot drift apart. Dann's words:
"it draws nothing, because the singer removed the word." The file's witness
is not overruled here; the singer's act is what emptied the note.

## 3. Build

**The control.** In the loupe's dock, on the taken note, one button:
**Melisma**, a toggle. On a note that is undecided, it writes
`{ kind: 'melisma' }`. On a note that holds a syllable, it first moves that
syllable and everything after it one note forward
(`shiftToEndOfLyric(..., 'forward')`, Finale's insert), then marks the note.
On a note already marked, it clears the mark to undecided. Every press is
one undo entry on the existing stack (`loupe.undo.*`), with Redo as N.111-3b
built it. No second stack. DESK DEFAULT, Dann's to wave off: the shift on a
seated note rather than a refusal.

**The page.** A melisma run is one or more consecutive `melisma` notes after
a note that holds a syllable. Draw:

- if the syllable is the last of its word, an **extender**: a rule on the
  lyric baseline from just after the syllable's right edge to the right edge
  of the last notehead in the run;
- if the syllable is not the last of its word, no extender; the hyphen to the
  next syllable spans the run as the hyphen placement already spans a gap
  (`staff-renderer.ts:744-763`, the N.11 hyphen rule). If the gap is wide
  enough for more than one hyphen, that is a Gould question (rules 26 to 40,
  which `staff-renderer.ts:763` records as unread); draw one hyphen centred,
  and say so in the memo.

Stroke weight and vertical offset: match the hyphen's, so the two marks read
as one system. Say what values you used with `path:line`; no hex or metric
invented without being named.

A run that a system break splits: the extender continues on the next system
from the system's left margin to the run's last notehead. If that is
expensive, draw the first system's part only, and say so.

**The IPA line** over a melisma note draws nothing (the vowel is sustained,
not re-articulated); the sustained vowel's forecast on the turning layer, if
any, is out of scope and stays as it is.

**Undo across the two surfaces**: the loupe redraws in the same frame, as
N.111-3a made it (`pageRevision`).

## 4. Tests and gates

Unit tests on the map: toggle on undecided, toggle on seated (shift then
mark), toggle off, undo and redo round trips, and the run detection
(consecutive melisma notes after a seated one; a melisma with no seated
note before it draws nothing and is reported in the memo as a state the
hand can produce). Renderer tests where the existing hyphen tests live, for
the extender's presence and extent. Five gates; state the new gate 4 and 5
counts for `ilya-ship.sh:79-80`.

## 5. Constraints

- Do not change `VocalLineEvent`; do not touch `shane/reconciliation/`; do
  not write to `ParsedScore`.
- Ilya never creates a melisma; only the singer's press does.
- One new English string per new thing, listed with keys; no French. Expect:
  the dock button `Melisma`, `loupe.undo.melisma` (`melisma set`), and
  `loupe.undo.melismaOff` (`melisma cleared`), or better names you list.
- Pill ends on the button (ruled 2026-09-03).
- Walk on a local production build on the engraved Sunless fixture with the
  poem: take the last note, press Melisma (undecided case) and see it stay
  bare with no extender because no syllable precedes it in the run; take a
  note holding a word-final syllable, press Melisma on the next note and
  see the extender; press it on a mid-word note and see the hyphen span;
  undo and redo each; reload and it holds. Then rider 0: delete a word in
  the field and see the vacated tail notes bare on both lines.

## 6. Return

`docs/sessions/memo-n113-melisma_r1_<date>.md`: what changed with
`path:line`, strings, tests, gates, the walk with the extender's measured
geometry, and a NOT ESTABLISHED section. **"NOT ESTABLISHED beats a complete
invented answer."** Name every untracked file, this brief included. Do not
run git.
