# Brief for Code: N.114, the syllable line under the poem. r1, 2026-09-09

Paste this whole file into a Claude Code session pointed at `~/Desktop/ilya-rewrite`,
branch `Shane`. Read `docs/memory/CONTRACT.md` §5 first. Do not run git.

## Goal

Move the syllable line (`SyllableStation.svelte`) out of the Score markup band
and put it under the poem field inside the Input band, live whenever a score is
present, collapsed by default, boxed in both states. Nothing about the gesture
changes: a click on a syllable moves the SABB (the cursor, `pairingCursor`), and
placement stays in the loupe (`+page.svelte:623-626`, `:579-600`). The Underlay
station leaves Score markup. Nothing else in Score markup moves.

## The drawing, ruled

`docs/sessions/drawing-n114-type-into-score_r2_2026-09-09.html`. Plates 1 and 2
are the spec. Plate 3 is STRUCK and must not be built. Every button wears the
pill ends of `IntakePanel.svelte:753-768`.

Dann's rulings, 2026-09-07 and 2026-09-09, in force:

1. No score: no line at all. The Input band is exactly as it ships today.
2. Score present, collapsed (default): one row under the score receipt, inside
   the same hairline box the open line wears (`SyllableStation.svelte:188-189`'s
   white ground and 1 px `#8E7E9B` rule, applied to the row), holding one clipped
   line of the syllabification (`white-space: nowrap; overflow: hidden;
   text-overflow: ellipsis`), the placed count at its right, and a chevron
   pointing down. A click anywhere on the row opens the line. The row has no
   label and no new string.
3. Score present, open: the boxed line as `SyllableStation` renders it today,
   full text, with the count and a chevron pointing up on the row above it, no
   label. The SABB keeps its 44 px floor (`SyllableStation.svelte:180-190`).
4. Colour INVERTED from today's: unplaced syllables in tertiary ink
   (`#6A655F`), placed syllables in primary ink (`#1a1612`). "Committed is
   black." The SABB cell is unchanged.
5. A click on a syllable moves the SABB and does NOT park the textarea's caret.
   The field writes, the line places. No text is edited from the line.
6. The Score markup band loses its Underlay station (`+page.svelte:4139-4152`
   and whatever `STATION_IDS.underlay` still reaches). Corrections and Voice
   stay. The placed count stays on the Lyric label inside Corrections where
   N.65 ship B put it.

DESK DEFAULTS, reversible, Dann can wave off: the line stays open for the
session once opened; while `input.transcribeLoading` is true the row is absent.

## Inputs and paths, read 2026-09-09

- `apps/web/src/lib/shane/SyllableStation.svelte`: the component to move. Its
  head comment says it is READ-ONLY and has no header; both stay true.
- `apps/web/src/routes/+page.svelte:4037-4051`: `IntakePanel`'s mount and props.
  `:4139-4152`: the Underlay station in Score markup, mounting
  `SyllableStation` with `slots={slotQueue} pairings={shownPairings}
  cursor={pairingCursor} oncursor={(i) => (pairingCursor = i)}`. `:334`:
  `pairingCursor`. `:363`: `slotQueue`.
- `apps/web/src/lib/components/Drawer/IntakePanel.svelte:355-372`: the poem
  and score receipts, where the new row goes. `:316`: the textarea.
- `apps/web/src/lib/i18n.ts:564-579`: the `intake.*` strings. No new string
  is expected. If one proves necessary, STOP and say so in the memo; do not
  coin French.

## The build, in order

1. Give `IntakePanel` the props the station needs (`slots`, `pairings`,
   `cursor`, `oncursor`, and the placed count the Lyric label already
   computes) and render the collapsed row and the open line under the score
   receipt, per rulings 1 to 5. Prefer passing `SyllableStation` through as a
   child or snippet over duplicating its markup.
2. Invert the colours in `SyllableStation.svelte` (ruling 4). One rule each.
3. Remove the Underlay station from Score markup (ruling 6) and every dead
   reference it leaves. `grep -rn "STATION_IDS.underlay\|station-underlay"`
   must return nothing when you are done.
4. Run the five gates. Report gate 4 and gate 5 numbers against
   `ilya-ship.sh:79-80` and update the script if they move.

## Definition of done

- Gates clean; `tsc` clean; no new i18n key.
- Walked by you on a local production build, each item with the expectation
  stated BEFORE the observation:
  1. Poem present, no score: the Input band is byte-identical in the DOM to
     today's (diff the rendered HTML of the band).
  2. Load a score: a boxed one-line row appears under the score receipt with
     the count and a down chevron; nothing appears anywhere else.
  3. Click the row: the full boxed line opens; the chevron points up.
  4. Click a syllable in the open line: the SABB moves to it; the textarea does
     not receive focus (`document.activeElement` is not the textarea).
  5. Place a syllable from the loupe: it turns black in the line, the count
     increments, the row's clipped preview shows the same colour.
  6. Score markup shows Corrections and Voice only.
- The walk fixture is `~/Downloads/Mussorgsky - Sunless 01 - Within Four Walls
  (engraved).musicxml` with the poem Dann uses for it, or the Pushkin control.

## Constraints

- THIS DESK DOES NOT BUILD; you do. Do not run git. No agent commits.
- Do not change `VocalLineEvent`; do not touch `apps/web/src/lib/shane/reconciliation/`.
- Do not put a control on the paper. Drawer manipulates, page displays.
- Do not add a second silent save site.
- Do not create a third touch-geometry exemption: the SABB alone carries 44 px.
- Do not write French. Do not coin a string.
- `WRITTEN` is not `DONE`: your local walk makes it WRITTEN; Dann's walk on
  the alias makes it DONE.

## What you could not establish

Your memo must carry a section with this heading listing everything you did not
read, run, or see. **NOT ESTABLISHED beats a complete invented answer.**

## Return memo

`docs/sessions/memo-n114-syllable-line_r1_<date>.md`, under 120 lines: what
moved (files and line ranges), the six walk items with expectation and
observation each, gate numbers before and after, what you could not establish,
and the byte count of anything that entered `static/`.
