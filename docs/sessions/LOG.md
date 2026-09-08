# LOG — the session history that used to live in STATE.md

**Split out of `docs/memory/STATE.md` on 2026-09-01.** Nothing here was
rewritten, reordered inside its own block, or summarized. Three blocks were
moved verbatim, and this file records where each came from.

**Nothing in the per-session read order opens this file.** `README.md` sends a
session to `CONTRACT.md`, `STATE.md`, `ENVIRONMENT.md`, and `PRODUCT.md`. This
is the archive behind `STATE.md`, and the code beats both.

---

## Block 1: the `## Log` table, and the three colophons that followed it

*Was `STATE.md` lines 3013 to 3089. The three italic colophons at the end are
all dated 2026-08-18 and were still in a file last written 2026-08-28. They are
kept here as record and are not current.*

## Log

| date | what changed |
|---|---|
| 2026-08-18 | **`cee4572`: N.67 STEP 6 SHIPPED, with its memo in the same commit.** The sweep: the eviction notice once per device, the corrupt-record salvage path, the storage copy finalized in both languages, and the N.27 recommendation recorded at the reporting seam and NOT built. Twenty files, 1,985 insertions, `notices.ts` new at 216 lines, gate 4 **628 to 671** with permission asked and granted first. **Three things the design assumed and the tree did not do:** nothing had ever read a record's `schema`, so a record from a newer Ilya was silently downgraded; a corrupt record was silently overwritten AND then validated clean, so the evidence died with the work; and one damaged record refused an entire binder on import, so the salvage export could be written and never read. **Code's own walk refuted its own build three times**, each repaired with a regression test, and every one had passed all five gates first. **W1 closed. NOT YET WALKED BY DANN ON A DEPLOY.** |
| 2026-08-18 | **`9892887`: N.67 STEP 5 SHIPPED. `db54cff`: its memo.** Export-all, multi-song import, and the collision rules. Ten files, 1,834 insertions, `exchange.ts` new at 313 lines under 34 tests, gate 4 590 to 628. **DONE the same evening: Dann walked it on `ilya-eaxv09qx3`, twelve steps, record `n67-5-dann-walk_r1_2026-08-18.md`.** |
| 2026-08-18 | **A DIALOG THAT WAITS FOR ITS `close` EVENT WAITS FOREVER, AND ALL FIVE GATES PASSED WITH THE HANG LIVE.** `close()` fires no `close` event in the browser pane Code drives, confirmed on a bare `<dialog>` with no framework near it. The collision dialog hung the whole import on the first colliding song. **Runes are inert under vitest, so the module was correct and the page was not, and only a browser could see it.** Resolve a dialog from the press, never from the event. |
| 2026-08-18 | **THE TREE MOVED UNDER THIS DESK TWICE IN ONE SESSION.** First a parallel GUI session added 2,955 bytes to `STATE.md` while a brief was being written against it. Then Code shipped step 5 while the close was being written, so a section that said "nothing built" was false within the hour and the memory edits were swept into Code's own commit. **Both were caught by comparing a kept copy, not by trusting a session-open `git status`.** |
| 2026-08-18 | **`924f687`: N.67 STEP 5's BRIEF WRITTEN AND COMMITTED. No code shipped from this desk, which does not build.** Dann ruled that **an import ADDS songs and never touches the song you are in**, which retires the open-song warning and leaves the id collision as the only prompt. Eight new strings approved by him as a whole table before any entered the tree. **Two findings that shrank the work: `readBinder` was already plural (`binder.ts:190-225`), so multi-song import is one line at `+page.svelte:1017`; and `library.load` cannot detect a collision, because an absent id yields an empty record on purpose (`library/index.ts:164-166`), so a check written on `load` would have overwritten every song in the binder silently.** |
| 2026-08-18 | **A CLEAN `git status` AT SESSION OPEN DOES NOT STAY TRUE.** This session opened on a clean tree at `ed8318e` and wrote a brief against `STATE.md`. Eleven hours later another session had added 2,955 bytes to that same file. **It was caught only because the session-open copy had been kept and the two were compared**, which is a file comparison and not a git operation. THE ONE THING was unchanged, so the brief held, but it need not have been. Recorded in `ENVIRONMENT.md`. |
| 2026-08-18 | **`cb7a15a`: N.67 STEP 4b SHIPPED AND WALKED BY DANN. SONGS ARE PLURAL.** `songs.ts` (227 lines, 35 tests), `SongList.svelte` (265), a `PluralStore` hung off `StorageDriver` as an optional property so the legacy driver can decline it, `name` made `$state` so a rename reaches the vault, and `backfillName` at boot because `SongRecord.name` had existed since step 0 with **nothing ever writing it**. Gate 4's baseline moved 555 to 590 with Dann's permission. Ten walk steps on the deploy, all matching a stated expectation or refuting one on the record. |
| 2026-08-18 | **THE SWITCH MECHANISM WAS SETTLED BY MEASUREMENT AND THE PREDICTION WAS WRONG.** Code expected `.musx` to be too slow to switch in place and to need `location.reload()`. Measured: **warm `.musx` switch 343 ms against a 448 ms reload**, `.musicxml` 49 ms against 97, vault read 0.2 ms. The reload is both slower and loses the tab, the drawer, the scroll position, and the dictionary. **`close()` then `open()`.** Design §9.3 is closed for Chromium and **still open for WebKit**. |
| 2026-08-18 | **THE VAULT HAD BEEN PLURAL SINCE STEP 1 AND NOBODY HAD LOOKED.** `by-updated` and `by-fingerprint` were defined at `driver.ts:290-301` and `driver.idb.test.ts:92-114` already proved two songs coexist and that a song is findable by fingerprint. **Every one-song assumption lived above the vault**, in `index.ts`, `document.svelte.ts`, and `+page.svelte`. An inventory read before the brief was written is what found it, and it made 4b smaller than its own description. |
| 2026-08-18 | **A MEMO'S SUBSTANCE CAN BE RIGHT WHILE ITS CITATIONS ARE WRONG.** The 4b memo correctly reported that the shipped dialog puts the safe answer last in the DOM, and cited `+page.svelte:1381-1384` and `:1347` for it. Those lines are the tab-change handler and a metadata function. **The real citations are `:1646-1649`, `:753-765`, and `:2172-2174`, found only by opening the file.** The same check found that `STATE.md` itself had carried the false version, and that a stale comment at `:1612-1613` still does. |
| 2026-08-18 | **`+page.svelte` 2,578 to 2,857 lines, 94,571 to 105,544 bytes.** Far past the brief's thirty-line allowance and past the design's own 74 KB warning. Recorded as a standing debt rather than argued away. |
| 2026-08-16 | **E.58: N.59 step 8 built, and the NaN that crashed Dann's own photograph guarded.** `pdfjs-dist` 6.2.108 ruled in by Dann, pinned exactly, lazy: **up-front JS for a singer who never drops a PDF is 30,546 bytes gzipped**, and pdf.js's 612 KB sits entirely in chunks that load on demand. A true vector PDF reads end to end at s = 29.0. `detect_staves` now raises its own `RuntimeError("no staff lines")` instead of leaking a NaN four frames into `beams.py`, and a Cardoso and Rebelo run-length fallback supplies a finite `s` on a rotated page. Gates 552 to 555. |
| 2026-08-16 | **A BUG IN MY OWN FIX THAT NO LOCAL RUN COULD SEE.** `np.bincount` on an int64 array works on 64-bit desktop numpy and **throws under Pyodide, because WASM is 32-bit and `np.intp` is int32**. Every Python proof passed; the browser found it on the very page the fallback exists to rescue. **The lesson is E.54's again: drive a real browser, the gates and the local runs structurally cannot reach this class.** |
| 2026-08-16 | **THE SAME MUSIC READS DIFFERENTLY AT DIFFERENT RESOLUTIONS, measured.** Musorgsky 01 page 1 gives 78 notes at s = 21 from a PNG and 79 notes with one pitch abstention at s = 29 from a PDF of the same engraving. E.43's 37-against-36 precedent, seen again from the other direction. A read is not reproducible across resolutions and must not be described as if it were. |
| 2026-08-16 | **The run-length estimator is sharp on a render and soft on a photograph, and the difference is the finding.** The fixture gives a single peak at 21 (6,895 against 2,090). Dann's photograph gives a smear across 17 to 22 with no dominant peak, mode 19, against a hand measurement of 17.0. Reported rather than reconciled. |
| 2026-08-16 | **E.58: `0573c10`. N.59 INCREMENT 1 SHIPPED AND WALKED BY DANN.** Steps 1 through 7. A photograph now becomes a score: Pyodide runs the eleven-module E.16 reader in a Worker, the brace rule replaces the struck gap heuristic, the recognized output becomes MusicXML and enters at the existing ingest seam, the singer answers clef and key in the drawer before the read, the read report counts every substitution without marking the page, and the greyscale ink persists so a reload restores without re-asking. **What Dann saw: thirteen syllables sitting on notes Ilya read off ink, `13 / 13`.** Gates 537 to 552. |
| 2026-08-16 | **A DEFECT OLDER THAN N.59, found by it: `validateRecord` never carried `source` through**, and had not since N.67 step 1. It returned `record.source === null` on every load. **Consequence nobody had noticed: step 4a's chimera warning cannot fire on the first upload after a reload**, because the stored fingerprint was always absent. It works within one session, which is exactly why Dann's own 4a walk passed. Fixed, four tests. **The lesson: a walk that never reloads cannot test anything that depends on what was stored.** |
| 2026-08-16 | **Three corrections to Fable's E.57 brief, all measured, none of them reopening a ruling.** (1) `measures_per_system` is `len(barlines)`, not `len(barlines) + 1`: the `+1` form is wrong on all six Musorgsky pieces by exactly the number of systems. (2) The spike's `loadPackage` list is `['numpy','opencv-python']` with no matplotlib, and it never writes the Leipzig caches, because it calls `read_page_pitch` rather than `envelope.run`; every matplotlib and leipzig string it contains is inside its embedded module blob. (3) `~/Downloads/ilya-test-page.png` is byte-identical to a repository fixture and is 8 staves at s = 21, not E.43's 12 at s = 17. |
| 2026-08-16 | **DANN'S BRACE RULE IS BUILT BUT ITS CENTRAL CASE IS UNPROVEN, and that is recorded rather than dressed up.** No fixture in this repository contains a brace at all: every Verovio render joins voice and piano with the system barline alone. The rule therefore falls back to staff 0 on every fixture system and COUNTS the fallback, which the read report declares out loud. On the Piano-first piece 06 that fallback picks the piano. **The old heuristic picked the piano too; the difference is that this one says so.** |
| 2026-08-16 | **E.57: `1e4081a`. No code shipped. N.59 briefed and nine environment traps recorded.** A Sonnet inventory read the eleven reader modules and found four things the E.43 summary did not carry: `select_vocal` is the ONLY staff-selection site (`reader.py:269-278`, one call site at `:400`); `timesig.py` carries a SECOND Node-and-Verovio shell-out; losing `rest_templates`' shell-out aborts the whole page rather than dropping rests; and **the reader detects neither clef nor key**, passing both through from a ground-truth file that does not exist in a browser. Fable then ruled all five open questions and wrote the build brief. |
| 2026-08-16 | **The scope enlargement reported at E.57's midpoint was WRONG, and the record keeps it.** "Two shell-outs, not one" was read as a doubling of the work. Fable opened both `load_font` functions and found the cache-hit early return, so the true cost is two committed JSON files and zero new WASM. **The lesson is tether 10: the inventory read the imports and not the function bodies, and a summary of a summary got one more layer wrong.** |
| 2026-08-16 | **Nine environment traps recorded that no gate could have found**, all learned across E.53 to E.56 and none previously written: `pnpm --filter` from `~` is destructive; the bundle-size instrument is noisy to 443 bytes; `autofocus` moves web-check to 8 warnings; `app.css:93` breaks native modals; service workers cannot be tested locally without patching the build; `cp -R` preserves mtimes so a local server lies about caching; the Vercel branch alias lags READY; there are two file inputs now; and Dann uses Chrome on his iPhone, not Safari. |
| 2026-08-16 | **E.56: `046beec` and `58f982c`. N.71 and N.70, both found by Dann walking and both closed by Dann walking.** The notehead swallowed its own click for three days behind a DONE mark; iOS silently refused every score format Ilya can read. **Neither was reachable by a gate, and both were found by a musician using the thing.** score-parser 442 to 444. |
| 2026-08-16 | **E.55: `6c0c719`, N.67 step 3 shipped and WALKED BY DANN. N.68 closed.** `mergeOnUpload` keeps the map by positional key, proposes only into an empty map, reports orphans, and never rebuilds; *Start placement over* is the singer's own and only destructive act. Seven new tests, gates 504 to 511. |
| 2026-08-16 | **The walk was built to be able to FAIL, and that is why it is worth anything.** Re-running the first pass over an unchanged transcription produces the same layout either way, so the walk needs one deliberate change in the middle. Positive control: the old code was temporarily restored and the identical walk snapped back to 5/5; the merge rule held at 4/5. |
| 2026-08-16 | **Three defects found by Dann walking, none by a gate.** The notehead swallows its own click, notes have no cursor affordance, and no iPhone can load a `.musicxml` at all. See the section above. **The instrument lesson: my Playwright harness had to DISPATCH the note click because a real click was intercepted, and I read that as a test artifact instead of as the bug it was.** |
| 2026-08-16 | **E.54: N.67 steps 1 and 2. The vault and the source.** `ilya-library` v1 with `songs` / `sources` / `meta`; the §3 migration, write-verify-then-remove; `persist()` and `estimate()` called for the first time in this project's life (Dann's Mac reports a **1.9 GB** quota against 3.4 KB used); `BroadcastChannel` for two tabs; the score kept byte for byte and re-ingested at boot. **34 new tests, gates 470 to 504.** |
| 2026-08-16 | **TWO BUGS THAT ALL FIVE GATES PASSED, both found only in a real browser.** (1) `$state` proxies cannot be structured-cloned, so **every IndexedDB write failed** until `$state.snapshot()` was applied; localStorage never showed it because `JSON.stringify` reads a proxy happily. (2) The effect's guards were in the wrong order, so **the singer's first edit was swallowed** as though it were the load echo. Both are in `ENVIRONMENT.md`. **The lesson is the instrument: drive Playwright yourself, it is installed and it takes thirty seconds.** |
| 2026-08-16 | **E.53: `4568e01`, N.67 step 0 shipped and observed.** The song document, the facade, the legacy driver, 32 new tests. `+page.svelte` 2,095 to 2,009 lines, its per-song localStorage sites to **zero**, 1,324 lines added under `lib/library/`. **Observed in a browser on Dann's Mac, not merely written:** a seeded pairing map survived an idle reload byte for byte, which is the race the deleted guard flag existed to prevent. **web-test baseline moved 438 to 470 with Dann's permission** (`ilya-ship.sh:79`). |
| 2026-08-16 | **The rename method worth reusing.** Delete the declarations FIRST, let `svelte-check` name every surviving reference, then insert at exactly the reported `line:col` after asserting the identifier is there. The compiler cannot report a comment, a string, or an import path, so nothing else can be hit, and 0 errors at the end is the proof. 44 of 44 applied, zero mismatches. |
| 2026-08-16 | **E.52 closed. No code shipped.** N.67 ruled first, displacing both blockers. Fable commissioned three times and returned the design, the socket, and the retention policy, all in `docs/sessions/`. The retention rule ratified. **The build moves to Claude Code in the desktop app's Code tab**, folder associated; see `ENVIRONMENT.md`. |
| 2026-08-16 | **Corrections to `claude/e45-n67-storage-architecture_2026-08-13.md`, measured:** Ilya already uses IndexedDB (`loader.ts:103-115`, `ilya-data` v1, store `cache`); `.musx` does not compress, so sources are 64 to 146 KB and stay there, not 15 to 25 KB. `navigator.storage.persist()` has never been called. |
| 2026-08-16 | **A process failure worth keeping.** Half an hour was spent measuring that no gate runs on the device VM. `ENVIRONMENT.md` already said so. Its read rule is "before you touch a tool, a path, or a gate," and it was not followed. |
| 2026-08-15 | **E.51 closed. N.69 and N.47 both CLOSED.** `STATE.md` rewritten, `ENVIRONMENT.md` gained the print, Vercel, container-renderer, and measurement sections. |
| 2026-08-15 | **`8af064e`: N.69 settled.** `HEADER_GAP = 16` on both pages; `HEADER_HEIGHTS_AT_LETTER` measured in headless Chromium. Verified in a container render before Dann printed it. Dann on paper: *"the spacing is correct."* |
| 2026-08-15 | **`bd811d3`: a wrong turn, recorded.** Generalised the broken mechanism instead of the working one. Also hid `vercel-live-feedback` at print, which survives. |
| 2026-08-15 | **`3187c40`: print stops re-typesetting the page.** |
| 2026-08-15 | **Vercel SSO turned OFF for project `ilya`.** Reversible in Settings, Deployment Protection. |
| 2026-08-15 | **Asked and answered from the code, no change made: is `с` in «если» regressively palatalized by `лʲ`?** No, by two independent mechanisms (`engine.ts:295`, `:898`, `:303`, `:998-999`). The code records that Grayson p. 209 and D&P pp. 76-87 disagree and that **Ilya follows D&P**. Changing it would reverse a ruling. |
| 2026-08-14 | **`aee9f4a`, `99ab8c5`, `55291e7`: N.69 passes one to three.** |
| 2026-08-14 | **N.47's gate RUN and it found N.69.** The tree wins. |
| 2026-08-14 | **N.59 explained in full. N.58's scoping brief written and delivered.** |
| 2026-08-14 | **`I.01` caught in `INBOX.md`.** |
| 2026-08-14 | **`b5e8777`: N.32 closed**, walked and observed. |
| 2026-08-13 | **STATE.md rewritten clean.** **A log that only appends drifts; rewrite this file at the close.** |
| 2026-08-13 | **RULED, Dann: the notes never move; the syllables slide along them.** In `PRODUCT.md`. |
| 2026-08-13 | **This folder created.** |

---
*Updated at the close of 2026-08-18, THIRD session, and CORRECTED the same
evening against `db54cff` after Code shipped step 5 mid-close. The desk ruled
the shape of step 5, approved its copy, and wrote its brief; Code built it. The
shipped account here is summarised from
`docs/sessions/n67-5-the-binder_r1_2026-08-18.md`, read in full. Previously,
and still true of the brief:*

*Updated at the close of 2026-08-18, THIRD session, against `924f687`. That
session ruled the shape of N.67 step 5, approved its copy, and wrote its brief.
It shipped no code, and it read the tree rather than trusting the summary of it.
Read in full: `README.md`, `CONTRACT.md`, this file, `binder.ts`,
`library/index.ts`, `songs.ts`, `types.ts`, and design §5 and §7. Read in part:
`+page.svelte`, `library.ts`, `zip-writer.ts`, and `i18n.ts`, all at the lines
cited. Previously, and still true:*

*Updated at the close of 2026-08-18, second session, against `cb7a15a`. Facts
added this session were read in the working tree, measured by Claude Code on
Dann's machine, or observed by Dann himself on the `ilya-hg5dr7kl3` deploy.
Read in full this session: `README.md`, `CONTRACT.md`, this file,
`e52-fable-save-design_r1_2026-08-16.md`, and
`n67-4b-library-door_r1_2026-08-18.md`. Read in part: `+page.svelte` and
`ilya-ship.sh`, both at the lines cited. The four N.67 documents are summarised
here; **read the design itself before building from this summary**, and read the
three corrections above with it.*

---

## Block 2: the history that had accumulated inside `## THE ONE THING`

*Was `STATE.md` lines 49 to 557, forward chronological, 2026-08-23 to
2026-08-27. The section was 535 lines and the current one thing was its last
entry, so every session read 500 lines of superseded state to reach it.*


> **N.80 IS DONE. Walked by Dann 2026-08-23 on `ilya-pmuwo7k1r`: [u] read
> `270 Hz 735 Hz Captured` on the roster, two of three takes captured
> through the best-window path, the third Provisional with its reason
> named.** N.78 and the colon audit closed earlier the same day. The
> blocking set is empty.
>
> **2026-08-23 NIGHT, LATER: N.81 DONE, N.79 RULED CLOSED, N.62 ENUMERATED.**
> N.81, the calibration takeover's rule goes lavender, shipped `2440bf5` and
> was walked by Dann on `ilya-2xbpbyyyv`: both rules read lavender. N.79 is
> ruled by Dann: **do nothing**; every transition stays as it is. N.62 is
> enumerated, nothing built:
> `docs/sessions/memo-n62-enumeration_r1_2026-08-23.md`. Five rows, two
> coined French words awaiting Dann's eye, and one finding bigger than N.62
> (the watch band's header prints English in French mode).
>
> **THE ONE THING: N.62, the accessibility sweep, at the step "Dann approves
> or strikes the French table in the memo."** Then one Code brief, one ship,
> one walk. Do not write the brief before he has seen the table.
>
> Usage when the session closed, 00:06 on 2026-08-23: all models 87%, Fable
> 77%, both resetting about 05:00. The enumeration was done on Fable because
> the shared pool was the scarcer one that night.
>
> **2026-08-24 SMALL HOURS: N.62 IS DONE.** Ratified, built by Code in one
> ship (`1f4e268`), and walked. Rows 1 to 4 read off the rendered DOM on
> `ilya-4f6fwt03u` in both languages by the desk driving Chrome; row 5's
> button needs a loaded song, so its evidence is the served bundle
> (`Modifier la glose` once, `le glose` zero, all 19 scripts), and **Dann
> accepted the walk on that**. Glance at the gloss button next time a song
> is open. Gate 4 is **725**; the ship script's line 79 already expects it.
>
> **2026-08-24, THE RELEASE SESSION: seven rulings, eight numbers, two Opus
> audits.** N.82 through N.89 numbered and ordered (section below). The two
> release re-audit memos are in `docs/sessions/`
> (`memo-release-audit-a_r1_2026-08-24.md` and `-b`). Footer C, the
> classification header, and the binder manifest fields are RATIFIED from
> rendered drawings (`footer-options_r1`, `header-proposal_r2`, both in
> `docs/sessions/`).
>
> ~~**THE ONE THING: N.83, walkthrough prep.** A colleague asked Dann for a
> walkthrough this week. First step: the IMSLP demonstration, one Russian
> piano-vocal PDF through the reader on a deploy, which doubles as the
> reader's first honest end-to-end accuracy datum. Accuracy judgement is
> Dann's eye against the paper, never a script's count.~~
>
> **2026-08-24 NIGHT: THE DEMONSTRATION RAN, AND THE DATUM IS IN DANN'S
> WORDS: "the notation rendered is totally incorrect but at least there is
> something output."** Mechanism end to end, accuracy no. Two ships
> (`fe74ece`, `7f6a283`, five gates at baseline each), Dann's walk on
> `ilya-9256h493b`: the Lamm scan of Without Sun song 1, as a 400 dpi PNG,
> reads in 6.1 s in the browser (3 systems, 9 staves, 57 notes, 50 duration
> abstentions, 0 rests) and renders. The whole account, five walls and
> their fixes, is `docs/sessions/memo-n83-scan-read_r2_2026-08-24.md`; the
> raw PDF stays unreadable (pdf.js cannot decode JBIG2, no newer pdf.js
> exists) and the walk-swallow defect in `beams.py` was ruled and repaired
> by the desk under Dann's "solve this tonight". N.90 and N.91 numbered.
>
> **THE ONE THING: N.83's remainder, the walkthrough itself.** The
> demonstration asset is the PNG on the deploy, shown honestly as
> mechanism-works-accuracy-poor, with a `.musx` score as the accurate
> contrast. Waiting on Dann: numbering for the JBIG2 ingest gap and for
> the accuracy decomposition (pitch against rhythm against count).
>
> **RULED THE SAME NIGHT, from the datum itself: N.92, notation editing
> tools, and N.93, easy text entry interfaces.** Dann: "tonight just
> proves the necessity of notation editing tools and easy text entry
> interfaces... There is no point in Score Markup without corresponding
> prescriptive vowel values to the correct pitches in the melody." Both
> in INBOX.md with N.90 (the photograph tier and its research map) and
> N.91 (the piano-doubling witness and the OpenScore Lieder benchmark),
> all four numbered 2026-08-24 and none yet placed in the release order.


> **2026-08-24 NIGHT, THE N.97 SESSION: N.97 DONE, N.97b SHIPPED, N.92
> SLICE 2 DESIGNED AND RULED, THREE NUMBERS INTO THE INBOX.**
>
> **N.97 is DONE**: shipped `22fee05`, five gates at baseline (gate 4 moved
> 754 -> 784), walked by Dann on `ilya-jtab8oe9a`, every step to spec: the
> prompt read "Two things Ilya read from the page" with Treble and 2 sharps
> pre-chosen on the Lamm scan, the read matched, a correction survived a
> reload, the French confirmed, and the walk ran the PDF route end to end,
> which also cleared the memo's PDF-route NOT ESTABLISHED (the 60 s hang was
> Code's pane). The read: 89 of 89 systems correct on clef and key, zero
> abstentions. Memo: `docs/sessions/memo-n97-clef-key_r1_2026-08-24.md`.
>
> **The ruled re-key did not reach the corrections, and Dann ruled the fix.**
> Code measured that correction ids are built by the PARSER
> (`musicxml-parser.ts:701`, `m{mi}-{num}-{den}` from a duration cursor); the
> reader's ids died at the MusicXML boundary. Dann ruled option 1: carry the
> reader's id through as the `<note>` id attribute, parser prefers it with a
> uniqueness-and-namespace guard. **N.97b shipped `8bc036a`** (gates moved:
> web-test 784 -> 790, score-parser 444 -> 451; `ilya-ship.sh:79-80` already
> expect both). Corrections on page reads are keyed to ink now. One-time
> costs, priced in the memo: pre-ship corrections and placements orphan once
> (counted, kept), page-read fingerprints change (one replace-or-attach
> question, answer attach). Memo:
> `docs/sessions/memo-n97b-id-carry_r1_2026-08-24.md`.
> **N.97b is WRITTEN, not DONE: its deploy walk is still owed** (Code walked
> it on localhost on Dann's real data). The Kabalevsky page that interrupted
> the walk fails for its own reasons (N.99), not N.97b's.
>
> **N.92 slice 2 is designed, ruled, and briefed, nothing built.** Rulings:
> the interface model is Finale's Simple Entry palette (amends ship 3's
> Speedy-only template); accidentals cumulative, two clicks reach doubles,
> natural resets, capped at doubles; one spelling policy function (Gould 66,
> key context, previous-note fallback); nudges spell through it; the reader
> spells its own output by key; NO respell verb. French approved: Bemol /
> Diese / Becarre (adopted), and the orphan string. Brief, committed in
> `22fee05`: `docs/sessions/brief-n92-slice2-accidentals_r1_2026-08-24.md`.
>
> **Numbered by Dann tonight, in INBOX.md, unplaced: N.98** (voice formant
> profile selector, a dropdown for multi-student studios), **N.99**
> (skew-tolerant staff detection; the Kabalevsky op. 52 no. 5 plate, full
> evidence in the inbox line), **N.100** (the PDF route must not trust the
> media box; 151 Mpx raster from a lying 96 ppi declaration).
>
> ~~**THE ONE THING: N.97b's deploy walk.**~~ (DONE 2026-08-25, block below.) On the branch alias
> `ilya-git-shane-dannmittons-projects.vercel.app` (stable origin, library
> persists across ships; see ENVIRONMENT), read the Lamm 400 dpi PNG, correct
> a note, reload, the correction lands. Then paste
> `brief-n92-slice2-accidentals_r1` into Code. The walkthrough waits on
> Thursday; the colleague still needs the deploy URL and the engraved file.

> **2026-08-25, THE DEPLOY-WALK SESSION: N.97b DONE, N.92 SLICE 2 DONE.**
>
> **N.97b is DONE.** Walked by Dann on the branch alias: a fresh read of
> `raster400-2.png` into a new song took a G4 -> G sharp 4 correction that
> survived a reload, with the courtesy natural firing on the later G; Blast,
> a pre-ship page-read song, showed the priced one-time orphaning at first
> load (13 placements, kept, counted), and a correction made after the ship
> survived an independent boot re-read of the ink with the orphan count
> holding at 13. A read left un-accepted in the uploader touches nothing and
> dies on reload (`ScoreUploader.svelte:45`, `+page.svelte:1267`, both read
> this session).
>
> **N.92 slice 2 is DONE**: shipped `2d54185`, five gates at baseline
> (gate 4 790 -> 800, gate 5 451 -> 461), walked by Dann on the alias
> against a hand-built E flat major fixture
> (`~/Downloads/eflat-walk-fixture.musicxml`, desk-built this session):
> D4 down a semitone spelled D flat, Flat reached D double flat, a third
> Flat changed nothing at the cap, Natural restored plain D4, the corrected
> spelling survived a reload, and the palette stands level with its
> neighbours in emulated landscape (932 x 430). Still owed, small: a
> real-phone glance at the palette next time Ilya is open on a phone. The
> correction station renders on uploaded scores, not only page reads,
> observed on the deploy. Memo:
> `docs/sessions/memo-n92-slice2_r1_2026-08-25.md`. **Awaiting Dann's eye
> in that memo: the measured 97.6% melodic-fallback line, a measurement,
> not a proposal, and nothing is built on it.** Two INBOX lines added this
> session: the restore pacifier, and the portrait hint placement.
>
> **THE ONE THING: N.83's remainder, the Thursday walkthrough.** Dann
> schedules the call; the colleague needs the deploy URL and the engraved
> file. Run sheet: `docs/sessions/runsheet-n83-walkthrough_r2_2026-08-24.md`.

>
> **2026-08-24 MORNING, WALKTHROUGH PREP: the run sheet is ready and the
> track order is ruled.** N.83's run sheet is
> `docs/sessions/runsheet-n83-walkthrough_r2_2026-08-24.md` (r1 superseded,
> beside it; both new to git). Ruled by Dann this session: the engraved
> anchor is Without Sun song 1; the call is Thursday, Dann's to schedule;
> part 1 runs in the colleague's own browser, because Zoom remote control
> moves their mouse and never carries their microphone; N.94 is numbered
> (transposition interface, Newzik model; the INBOX line cites the E.31
> rulings, 2026-08-07, amendments checked, none found); the track order
> after the walkthrough is OMR, then N.92, N.93, N.94. The desk's offer of
> a demo-minimum picker before Thursday was CUT by Dann as too much; beat 5
> uses the r2 fallback. Tree, read this session: no picker exists in
> `apps/web`; `transposeScore` is `transposition.ts:63`, the ranking `:214`,
> `INTERVAL_NAMES` `:136`, and `transposePitch` spells sharps only
> (`:41-56`).
>
> ~~**THE ONE THING: OMR refinement, in a new thread today.** N.90 and N.91,
> with the JBIG2 ingest gap and the accuracy decomposition still awaiting
> Dann's numbering. The walkthrough waits on Thursday with one open slot,
> the deploy URL, and the colleague needs that URL and the engraved file
> before the call.~~
>
> **2026-08-24 EVENING: THE OMR DAY IS CLOSED. Three ships, three walks,
> the morning goal met end to end.** Dann's goal, set at the open: a system
> that intakes a PDF, produces a monodic melody line, and can be altered
> inside Ilya where it diverges from its source. All three legs are DONE.
>
> ~~**THE ONE THING: N.97, clef and key reading, ask becomes confirm, in a
> fresh thread.**~~ Numbered by Dann this session. The reader learns clef and
> key glyphs by the same Leipzig template machinery as rests and time
> signatures; the payoff is measured (memo N.95: 11 of 13 false positives
> sit on clef and key ink), and the intake prompt becomes a confirmation of
> what was read. **Its brief must face correction-id stability**: hand
> corrections key to the reader's deterministic event ids (ship 3), and
> N.97 changes the event population, so old corrections can silently
> detach. The walkthrough waits on Thursday; its demonstration asset is now
> a live PDF read with correction, far past the r2 run sheet's fallback.
>
> The day, in order, every ship five gates at baseline, every DONE walked
> by Dann on a deploy:
> - **N.95 numbered and DONE** (decomposition): scan errors split by
>   channel against the engraved ground truth.
>   `docs/sessions/memo-n95-decomposition_r1_2026-08-24.md`. Pitch nearly
>   fine (36/41 exact after a corpus octave convention), barline detector
>   found 0 barlines (fixed-width fault), confident durations 0/28.
> - **N.96 numbered and DONE** (PDF ingest): pdf.js decodes JBIG2 only
>   when `wasmUrl` is set; Ilya never set it. Fixed, plus honest JBIG2
>   error (French ratified), per-page fault isolation (French ratified),
>   and the skew-split staff line merge (`LINE_MERGE = 1/3`, bound
>   anchored to line thickness over 2,245 corpus gaps; the defect side
>   rests on ONE measured instance, watch it).
>   `docs/sessions/memo-n96-pdf-ingest_r1_2026-08-24.md`.
> - **Ship 1 `b2a502c`**: wasmUrl door, scale-relative barlines with
>   Dann's span-and-overshoot rule, duration threshold re-derived
>   (0/28 wrong-confident became 20/27 exact, abstentions up on purpose),
>   `K_S` 0.2809 -> **0.2729** by the ratified derivation over a corpus
>   extended with the two pdf.js rasters (committed as corpus members).
> - **Ship 2 `bc2a026`**: per-page isolation and the line merge. Walked:
>   the Lamm PDF reads BOTH pages on `ilya-51w2ybdoo`, 6 systems, 97
>   notes.
> - **Ship 3 `f3b257b`, N.92 FIRST SLICE DONE**: Speedy Entry correction
>   in the drawer's NOTATION anchor. Corrections are a DIFF keyed by event
>   id, applied after every re-read, stored beside `pairings`, no new save
>   site. Finale digit mapping; 44 px floor, no exemption. Walked on
>   `ilya-nfnsfm5ht`: pitch changed, note deleted, three corrections
>   survived a reload. Gate 4 baseline is now **754** and
>   `ilya-ship.sh:79` already says so (desk edited it over the bridge,
>   before md5 cf342b88, after 8f64e050).
> - **RULED AT CLOSE, N.92's next slice: accidental control.** Dann: a
>   B natural cannot become B flat; down a semitone respells as A sharp.
>   The speller spells sharps only (`transposition.ts:41-56`). The slice
>   is direct accidental verbs (flat, natural, sharp) plus a real
>   enharmonic policy (Gould rule 66, spelling in harmonic context). A
>   design conversation first, not a patch.
> - **N.97 numbered** (above). **Adopt-versus-build retired with data**:
>   Audiveris measured arm's-length at 58/58 vocal notes and ~47%
>   Cyrillic syllables under `rus` OCR; AGPL keeps it unbundlable; its
>   lesson decomposes to Tesseract (Apache-2.0) plus our own knit. The
>   server-tier fork is recorded, unruled, costing nothing.
> - **Gould dimensional prior table extracted**: 98 rows in stave-spaces,
>   dimension-vs-meaning per the 2026-08-18 ruling.
>   `docs/sessions/memo-gould-dimensional-priors_r1_2026-08-24.md`. Gaps
>   that matter: notehead sizes (pp. 10-12) and rest geometry (pp. 34-38)
>   were never photographed; the reader found 0/10 rests and has no Gould
>   rest dimensions to lean on. A re-shoot closes every numeric flag.
> - **Metre ruled**: no third intake prompt; the metre READ joins the read
>   report as a display line (unbuilt, small); arithmetic audits at intake
>   and gets promoted to tie-breaker only after the duration channel is
>   proven, every promotion marked. Clef/key prompt dies into a confirm
>   when N.97 lands.
> - Open observations carried: `pdfjs400-2` reads 49 records vs page 1's
>   48, unscored; page 2 never scored against ground truth; the `g`
>   population has an unreproduced ratified count (reimplementation gets
>   784/18 vs recorded, monotonicity proved it inert at K_S); the 7
>   remaining wrong confident durations are uncharacterized; portrait
>   phone does not render the score document (pre-existing).
> - Usage at open: Fable 39%, all-models 23%, resets Sunday 05:00. Farm-out
>   quotes ran over three of three; the 1.5x correction is now in
>   `ENVIRONMENT.md`.


> **2026-08-25 NIGHT, THE MOBILE DESIGN SESSION: the legend collision fixed
> and walked, the portrait phantom fell, Design delivered, and the rulings
> landed.**
>
> **The legend collision is DONE**: shipped `a46a199`, five gates at
> baseline, walked by Dann on the alias. Cause: the legend was drawn out of
> flow (`PageFooter.svelte`) while the Fit page reserved a constant 80 for a
> footer that measures larger; the footer is measured now, floor kept. Cost,
> ruled do-nothing: the demo asset gains a page. Brief and memo in
> `docs/sessions/` (`brief-n83-legend-collision_r1`, `memo-...-r1`).
> The engraved song 1 file gained `<work-title>` and composer; the titled
> copy is `~/Downloads/Mussorgsky - Sunless 01 - Within Four Walls
> (engraved).musicxml`. **The colleague walkthrough is DEFERRED by Dann:
> "I will tell you when to plan the call." The send to the colleague waits
> with it.** N.84, the Guide redo, deferred by Dann's own reasoning: the
> Guide reflects the finished build.
>
> **Tether 19 ruled and transcribed** (CONTRACT §1.19): a ruling is
> deliberate, judged by context and effect, and every constraint carries its
> source on its face. Born from the portrait phantom: E.41's transcription
> arithmetic had crept onto the score and was cited as law for two weeks;
> the score was never ruled out of portrait, N.46 was open the whole time.
>
> **The portrait rulings, all Dann's, 2026-08-25:** the phone's paper is
> the whole true page, an oversized thumbnail at full engraving resolution,
> and the LOUPE supplies the readable zoom (amended in the Design session
> from "window at readable zoom"); systems are never re-broken; portrait
> and landscape are both interactive, both valid, neither a felt
> concession; the makeshift portrait concessions are to be fixed; the loupe
> (Finale Speedy's editing frame, magnified in place, the z-lift Dann's
> own) persists on desktop and in landscape; the loupe is the named,
> singular exception to "nothing floats over the paper."
>
> **Design was commissioned on Dann's plan and returned r2, ACCEPTED with
> rulings:** the quick tuplet counts strike accepted (one definition
> grammar, "N of [value] in the space of M of [value]", last definition as
> default); one accessible name, `Drawer` and « Tiroir », for both
> containers, "dock" internal shorthand only; the surface is one dock,
> four stations, DURATION leading because N.95 measured durations as the
> broken channel; stepper (coarse tap, fine step), named Undo pill (absent
> when it cannot act), three-gesture tap grammar. Handoff filed in
> `docs/sessions/`: `design-mobile-correction_r2_2026-08-25.html` (the
> deliverable), `note-desktop-adaptation_r2`, superseded r1 pair,
> `support.js`, and `design-handoff-README_2026-08-25.md`. The desk's own
> `brief-design-mobile-correction_r1`, `memo-research-mobile-notation_r1`
> (with the Finale addendum), three desk drawings, and the exported
> `fable-ruling-gui-principles-and-portrait-c_2026-08-18.md` sit beside
> them. The r2 schematic is published for phone viewing at
> `claude.ai/code/artifact/3e219d42-54ee-4e38-9782-1527c2584bcd`.
>
> **THE ONE THING: the legibility walk, then the Code brief, sliced.** The
> r2 bet is that a singer picks the right measure by eye on a whole-page
> thumbnail. Zero-build walk: the Lamm song 1 PDF is ON DANN'S IPHONE
> (AirDropped this session); open it in portrait at whole-page fit and try
> to land a finger on a chosen measure. Expectation: lands or misses by
> one, which the stepper absorbs. **Parked at Dann's stop, and it loses
> nothing by waiting.** Also owed before Code: the notation-face
> measurement (the page's glyph source and the surface's duration glyphs
> must be one source), and the dense-page case stays NOT ESTABLISHED. The
> alias refused to open in Safari on the phone (deploy verified serving
> from outside; suspect phone-side); untested in iPhone Chrome.
>
> Usage at 23:31: Fable 77%, resets Sunday 05:00. All-models not re-read
> since 42% at session start. Files new to git: everything named above in
> `docs/sessions/`, plus modified `docs/memory/CONTRACT.md`, `INBOX.md`
> (two lines: mobile editing, mobile navigation, both absorbed into this
> track), and this file. `docs/sessions/_to_delete/` holds two empty
> extraction folders for Dann to delete.

> **2026-08-26 AND INTO THE SMALL HOURS OF 08-27, THE BUILD DAYS: MOBILE
> SLICES 1, 2, AND 3 ARE ALL DONE, EVERY ONE WALKED BY DANN ON THE DEPLOY.**
>
> **The floor rises through seven ships**: `98bba71` (the design session's
> close) -> `bcab673` (slice 1) -> `e0405bd` (slice 2) -> `d9d1191` (slice
> 2's exits, exclusion, and the fixed loupe) -> `320bf3a` (slice 3) ->
> `90ab413` (the tag carries both clauses) -> `b68c24c` (the loupe gains
> its clef, the tag holds its unit). Gate 4 walked 800 -> 814 -> 822 ->
> 862 -> 871 -> 872, all by real tests, and `ilya-ship.sh:79` says 872,
> edited over the bridge by the desk before each ship.
>
> **The legibility walk PASSED** on Dann's iPhone: a real engraved page
> whole on glass at roughly 390 x 505 reads with "plenty of detail," his
> words, r2's bet held at the exact scale it named.
>
> **Slice 1, portrait truth** (`bcab673`): three deletions; the score
> document renders whole in portrait; the sideways hint is dead. The walk's
> detour taught what N.101 now records: row "(3)" is the Lamm PAGE READ
> (treble, 2 sharps), and the engraved upload had never persisted, because
> an un-accepted upload dies on reload. The engraved song now lives in the
> library under its from-score name, `Modest Mussorgsky (1839-1881), Wi...`.
> **N.101 numbered by Dann 2026-08-26**: make score intake legible;
> evidence in INBOX.
>
> **Slice 2, the loupe and the dock** (`e0405bd`, repaired `d9d1191`):
> Finale Maestro is the one notation face (`notation-fonts.ts`), the loupe
> is the page's own SVG cloned through a cropped viewBox. Dann's walk found
> dismissal dead and no exclusion; the causes were a click still bubbling
> to a live `elementFromPoint` after the dock died, and a finger swipe
> claimed as a scroll (`pointercancel`); fixed, with exclusion on
> `drawerCollapsed`. **Ruled by Dann on the walk: the loupe anchors FIXED,
> centred, never travels; the sage rectangle alone moves.** Also ruled: the
> Undo pill's empty row is reserved so the dock never changes geometry; and
> the desk's container-name recommendation collided with N.62's ratified
> `Controls` / « Commandes » (tether 17 against the desk, owned in-thread),
> resolved by Dann: ONE accessible name, `Controls` / « Commandes », on
> both containers. Strings ratified: « mes. », « Saisie », « Nolet »,
> « Liaison » coined and approved.
>
> **Slice 3, the entry grammar** (`320bf3a`, then `90ab413`, `b68c24c`):
> the corrections diff grew four optional fields, `entered`, `type`,
> `tied`, `tuplet`, id-anchored in a `hand:` namespace, no new save site.
> Speedy's grammar under touch: a duration in a gap enters a note at the
> previous entry's pitch; Rest enters or converts; Tie toggles; the Nolet
> row is the definition sentence alone, last definition standing as
> default. Rulings along the way: « intervalle » struck (the gap sentence
> carries itself); the overfull bar stays silent on the page while the
> measure tag carries the arithmetic, both clauses, unreduced, and the
> unit PINNED to the signature's own denominator (fractional counts
> allowed: `14.5 of 4`); the loupe carries a clef and key signature, a
> second crop of the same clone. **Dann walked the whole circuit on the
> Lamm read**: gap sentence, entry, rest, tie, a live triplet with bracket,
> named undo of each, and every hand entry surviving a reload's re-read.
> The tag's first act on a real document was to expose the read's fused
> measures (`29 of 8`), which is the audit doing its job.
>
> **In INBOX, unnumbered, from the walks**: the barline-correction verb (a
> singer can repair every note but cannot split a fused measure); where the
> Lamm read's N/8 metre came from (`timesig.py`, one measurement answers
> it); arrow-key hotkeys for the stepper (slice 4); a named Redo pill.
>
> **THE ONE THING: slice 4, the desktop slice.** The loupe arrives on
> desktop; the drawer's correction station re-cuts into the phone's four
> stations, durations leading; one accessible name everywhere; the
> arrow-key hotkeys; the lyric anchors unify. The brief follows the
> pattern of the other three. After it, the mobile track ruled on
> 2026-08-25 is built, and what waits beyond is Dann's to order: N.94, the
> release order at N.84, and the walkthrough call he will schedule when he
> chooses.
>
> Usage, last read Wednesday evening: Fable 82%, resets Sunday 05:00. Not
> re-read since; the build ran on Code and the walks on Dann's eye.

> **2026-08-27, THE DESKTOP DAY: SLICE 4 IS DONE AND THE MOBILE TRACK IS
> COMPLETE. Every look walked by Dann on the deploy.**
>
> **Floor rises `1069fe9` -> `9c49fb8` -> `fd8bc47` -> `00637e3` ->
> `9fabbf1` -> `1758d0c` -> `893ccb4`.** Gate 4 walked 872 -> 880 -> 887 ->
> 889 by real tests; gate 5 moved once, 461 -> 462, for the analysis-handle
> test. `ilya-ship.sh:79-80` say 889 and 462, edited over the bridge by the
> desk before each ship.
>
> **Slice 4 built the homecoming**: the drawer's correction station and the
> phone's dock became ONE component in two containers
> (`CorrectionSurface.svelte`; `CorrectionControls` and `ShiftLyricsControl`
> deleted), the loupe arrived on desktop at 2.18x derived from a readable
> 12 px stave, arrow keys drive the stepper, Escape dismisses, and the
> per-note Restore and N.65's placed-syllable counter were restored into the
> shared surface with a guard: Restore is offered only where the READ still
> carries the entry, so a word promising restoration can never delete.
>
> **Dann's rulings on the desktop walks, in order:** the desktop page click
> stops placing a syllable, so the modalities are identical; up and down
> arrows stay on the pitch verbs; the insertion bar is LAVENDER (voice) and
> the held-measure mark stays sage (text); a desk click outside the loupe
> dismisses it, an accepted disparity with the phone; the three station
> headers consolidate under ONE header, `Corrections` / « Corrections »,
> with LYRIC riding inside as a labelled row, on BOTH surfaces, and in the
> drawer Corrections moves below Source while Analysis moves up under
> Notation (text tools top, music tools bottom); the dot cell cycles dot,
> double dot, none, at true engraving proportion with no size exemption;
> the tie is a filled two-curve taper at **0.40**, chosen by DANN'S EYE from
> a rendered comparison, NOT Gould (rules 150-175 excluded, book off this
> machine, and Maestro carries no composable tie in all 2,728 glyphs);
> the loupe is an engraving-only control surface, so analysis overlays are
> filtered out of it, by a real `data-analysis` handle on every mark rather
> than by colour; the loupe never exceeds the page's width, centres
> horizontally on the page, is cut to the page's ink band (one constant
> height, verified across steps), sits inset a SIXTEENTH of the page's width
> on both sides, and is CENTRED VERTICALLY on the page; and it lifts with a
> three-layer shadow (contact, mid, ambient, opacity falling as blur rises).
>
> **Two desk faults owned in-thread:** the desk narrowed Dann's "centre it
> or place it in the bottom third" to "lower third" without asking, which
> cost a wrong placement and a wasted round; and the desk's one-name
> recommendation for the containers collided with N.62's ratified strings
> (tether 17), resolved by Dann as `Controls` / « Commandes » on both.
>
> **N.102 numbered by Dann 2026-08-27**: courtesy accidentals. They do NOT
> exist in Ilya today (`staff-renderer.ts:963` draws only REQUIRED
> accidentals), so the slice 2 walk's apparent courtesy was a mandatory
> cancellation. Own control, own French, own parenthesis-glyph question.
>
> **THE ONE THING: the measure tap band.** Dann's last finding: the page's
> tap band is unbounded vertically, so a click an inch below the staff still
> raises the loupe. Ruled: bound it in STAVE-SPACES, tight on a fine pointer
> (about two ledger lines), generous on a coarse one so a thumb can still
> pick a measure on the portrait thumbnail (principle 7). The brief exists
> in the 2026-08-27 thread; re-write it if it is not to hand. Nothing else
> is owed on the mobile track.
>
> **Waiting, all Dann's to order:** N.83's walkthrough call (deferred by
> him: "I will tell you when to plan the call"), N.84 the Guide redo (which
> he deferred so the Guide reflects the finished build), N.94, and the
> release order N.85 through N.88. INBOX carries: barline correction, the
> Lamm read's metre provenance, a Redo pill, the print button under the
> paper on a phone, and the floor-commit restore flakiness.

> **2026-08-27 EVENING, THE POLISH RUN: nine more ships, all on Dann's eye.**
> Floor `6846d5f` -> `95f37aa` -> `44f2a1e` -> `776c267` -> `c9e2b0f`.
> Gates: 4 at 900, 5 at 470 | 5 skipped (475); `ilya-ship.sh:79-80` say so.
>
> **Ruled by Dann, all walked or measured:** the tap band is bounded in
> STAVE-SPACES (2.5 fine, 7 coarse; the portrait hit rectangle is only
> 28.3 px, under the 44 floor, so the coarse band must exceed what the
> renderer draws); Corrections and Lyric and their divider go LAVENDER,
> completing the drawer's gradient, sage text at the top, lavender music at
> the foot; the Score Markup's formant turning pitches go LAVENDER too
> (voice data, and it gained contrast: 3.15:1 nominal against sage's 2.52);
> the armed-duration marker and focus ring follow (the ring now clears 3:1
> where sage cleared neither); the page's selection mark is a SQUIRCLE, a
> tall rounded rectangle spanning the stave, closed at every height, sage
> for contrast, enclosing the WHOLE EVENT (accidental, notehead, stem,
> flag, dot) by a `data-of-event` handle, padded 4 across and 9 top and
> bottom with a 15 minimum and a 2.5:1 portrait floor, chosen by looking at
> full pages rather than by arithmetic; and the augmentation dot is DRAWN
> at last, Gould r111 p.54, one tap dot, two double, three none.
>
> **The dot's finding, the important one:** its correction, schema, and 1.5x
> arithmetic all existed and the renderer had never drawn it, so a dotted
> quarter counted and never showed. Page and arithmetic disagreed silently
> until Dann asked the question.
>
> **ENVIRONMENT gained a hard-won section: THE LAYOUT BOX IS NOT THE INK.**
> Four incidents in two days; `getBBox` on SVG text returns the font's line
> box, and a CSS outline boxes the same. Use canvas `measureText` for ink.
> Its corollary bit twice more: a probe on the wrong instrument returns a
> plausible number (a scripted `.focus()` never matches `:focus-visible`).
>
> **N.102 numbered**: courtesy accidentals, which do not exist today.
> **For PRODUCT.md, in INBOX**: Dann ruled the squircle a key germ of Ilya's
> visual vocabulary; transcribe it next session.
>
> ~~**THE ONE THING: Dann's walk of the polish run.**~~ **WALKED AND
> PASSED, all five items, 2026-08-27.** The mobile track is complete: four
> slices, every one walked by Dann on the deploy.
>
> **After the walk, three more ships and three numbers.** `dae29f5` ->
> `c9e2b0f` (the squircle encloses the whole event; the augmentation dot is
> drawn at last, Gould r111 p.54) -> `a900632` (the squircle draws BENEATH
> the music; z-order, not geometry). Gates hold at 900 and 470 | 5 skipped.
>

---

## Block 3: the dated session sections

*Was `STATE.md` lines 583 to 2545, reverse chronological, 2026-08-16 to
2026-08-24. Twenty-six sections.*

## 2026-08-24. THE RELEASE SESSION: SEVEN RULINGS, EIGHT NUMBERS, TWO AUDITS

**Dann opened the release question: what remains before a release, plus six
proposals of his own.** The desk ran the seven owed rulings one by one; all
seven are answered. Two Opus subagents re-audited the tree read-only
(ruled by Dann; the desk quoted ~150k worst case and the pair spent ~372k,
owned in-thread): `memo-release-audit-a_r1_2026-08-24.md` (behaviour clauses)
and `-b` (upload, residue, open source, provenance), both in `docs/sessions/`.

### The numbers, all ruled in by Dann 2026-08-24

| | item | state |
|---|---|---|
| **N.82** | the watch band's French | NUMBERED. Bigger than the enumeration knew: header, all eight `watchEntryLine` branches, `transpositionPhrase`, `joinIntervals`, and the advice sentences (`watchlist.ts:530-590`, `advice-resolver.ts:127`) print English in French mode on the Fit paper. Desk drafts the French table for Dann's eye before any brief |
| **N.83** | walkthrough prep | **THE ONE THING.** A colleague asked this week. Includes the IMSLP demonstration: one Russian piano-vocal PDF through the reader, the first honest end-to-end accuracy datum |
| **N.84** | the Guide redo | Three FALSE structural claims and the stale "Ilya does not save transcriptions" promise (privacy-adjacent, now false): memo A's twelve-claim table is the work list. Extract structure and prose worth keeping; images are stale |
| **N.85** | the open-source front door | README, CONTRIBUTING, code of conduct. Desk drafts; Dann sees every word. Must carry: free on purpose, well-built on purpose, made to help outside commercial concerns; Calm Authority with testable elements (whether the ratified slate is already testable is answered at drafting time). The `.env.example:1-4` stale instruction rides with this ship |
| **N.86** | dead-code and structure audit | One reading pass, two outputs: dead code to delete (first entries: `ACCEPTED_EXTENSIONS` at `format-detection.ts:54`, the `lib 2/` Finder artifact, and the `PUBLIC_INCLUDE_SHANE` wall, whose fate this audit rules) and structural intuitiveness for contributors |
| **N.87** | optimizations | Perceive, confer with Dann, then execute. Needs N.86's findings first |
| **N.88** | marketing materials | Last on purpose: describes the cleaned-up product |
| **N.89** | the document furniture | RATIFIED FROM DRAWINGS, NOT BUILT. Footer C (two-tier colophon, name in, "MIT licence" joins the secondary line, the real flag SVG unchanged); the classification header (page 1: today's title header plus a three-line right block, voice · printed date · document kind and language; pages 2+: running head plus one condensed line; sourced-or-silent, no voice profile means no voice line; lavender accent on the marked score); binder manifest gains `app`, `author`, `url`, `licence`, and `version.name: '2026a'` in `svelte.config.js` so the binder stops shipping a millisecond epoch. Drawings: `footer-options_r1_2026-08-24.html`, `header-proposal_r2_2026-08-24.html`. New French for Dann's eye is in the drawings' endnotes; « imprimé le » is the one coinage |

**The ratified order: N.83, N.84, N.85, N.86, N.87, N.88.** N.82 and N.89 are
ships that can ride between them.

### The other rulings, 2026-08-24

- **Learn and Guide print: REVERSED.** Dann: no native print for Learn or
  Guide "until a compelling reason emerges"; a singer prints Transcriptions
  and Score markups natively, and those bear the furniture. The tree already
  agrees (`+page.svelte:2396`, Studio-only Print). The 2026-08-20 "a printed
  Learn or Guide excerpt must identify its source" work is DEAD, not merely
  unnumbered.
- **Colour on paper: PARKED behind N.83.** No rule in the tree forces
  greyscale or preserves colour (memo A §4); the desk's predict-and-print
  table waits until walkthrough prep is done. Unexplained: turning noteheads
  are foreground SVG fill and should survive printing; Dann saw greyscale
  except the flag. A driver in greyscale mode would produce exactly that.
- **N.72 residue: CLOSED AS KNOWN, no build.** A singer on Chrome for iPhone
  uses Ilya fully in the browser; install exists only in Safari; no steering
  copy.
- **The `PUBLIC_INCLUDE_SHANE` wall: handed to N.86**, and the stale
  `.env.example` instruction is corrected with N.85.

### Audit findings not yet numbered, waiting on their tracks

Memo B carries the inventory: README omits half the product and names a
`test:e2e` that does not exist at root (N.85); CI's real gates (svelte-check
baseline 23, build) are unmentioned in CONTRIBUTING (N.85); no code of
conduct (N.85); the binder manifest carries no provenance (N.89); no
end-to-end reader accuracy rate exists anywhere, and the harness's 1.000
scorecard measures a stub, never to be quoted as the reader (N.83's
demonstration is the first datum); `updatedAt` written five times, rendered
nowhere (N.19, unchanged); `saveStore` still the last catch-and-drop (N.27,
unchanged); three `100vh` remain (N.17, unchanged).

**Inbox dispositions this session:** the six proposals became N.83 to N.88;
colour print parked; header/footer became N.89; the smartwatch formant
question remains in the inbox, unruled.

---

## 2026-08-24 SMALL HOURS. N.62 DONE: RATIFIED, ONE SHIP, WALKED

**The French, ratified by Dann 2026-08-23.** Row 2 changed under his eye: he
challenged « déplier », proposed « déployer » and « serrer », the desk gave
the platform pair, and he ruled **« Développer ou réduire »**, adopted. On
« serrer » the desk gave only the European sense (tighten) and Dann supplied
the Canadian one (stow); the word still lost, but the correction was his.
« glose » is feminine, so row 5 is « Modifier la glose ». Rows 1, 3, and 4
ratified as enumerated: « Commandes » coined, « Navigation » and
« Transcription » adopted.

**The ship, `1f4e268`, brief
`docs/sessions/brief-n62-five-strings_r1_2026-08-23.md`, memo
`memo-n62-five-strings_r1_2026-08-23.md`.** Four keys in `i18n.ts` (`a11y.*`),
four call sites moved to `t()`, one character at `InspectorPanel.svelte:1039`,
one new test file `i18n.test.ts`. Gate 4 **724 to 725**; the ship script's
line 79 moved before the ship. **Row 2 is twelve chevrons, not the memo's
thirteen**; the memo's own line list had twelve entries and Code confirmed no
thirteenth exists.

**The walk, desk-driven in Chrome on `ilya-4f6fwt03u` (`1f4e268`, READY,
sha checked via the Vercel connector).** Rows 1 to 4 read off the rendered
DOM in English, then in French after clicking « Français »: `Commandes`,
`Développer ou réduire` as the sole chevron label, `Navigation`,
`Transcription`. The twelve chevrons never render at once: Learn shows 7,
Guide shows 5. Row 5's button renders only with a placement selected in a
loaded song, predicted before the measurement; the served bundle carries
`Modifier la glose` once and `le glose` zero times across all 19 scripts.
**Dann accepted the walk on that evidence.** Residue: glance at the gloss
button next time a song is open.

**Code's own additions, from its memo:** `Drawer.svelte:324`'s comment
quoted the old markup and was updated so the done-when grep runs clean, and
this machine's `grep` is a `ugrep` shim that honours `.gitignore` and
silently skips `apps/web/build` (Code recorded it; see ENVIRONMENT).

---

## 2026-08-23 NIGHT, LATER. N.81 WALKED, N.79 RULED CLOSED, N.62 ENUMERATED

**N.81, numbered this session from `INBOX.md:29` on Dann's ruling.** The rule
under Back in the calibration takeover was `.takeover-head`'s
`border-bottom: 2px solid var(--sage)` (`Drawer.svelte:888`); the rule under
the voice selector is `.wizard-phase`'s `border-top: 2px solid
var(--deeper-lavender)` (`CalibrationWizard.svelte:1713`). One token changed,
one comment added. Code's assertion earned its keep: the sage declaration
occurs twice in the file (`:839` is `.drawer-anchor-top`, sage by ruling), so
the whole block was matched. Five gates at baseline, `848059e..2440bf5`,
memo `memo-n81-takeover-rule-lavender_r1_2026-08-23.md`. **Walked by Dann:
"both lines are lavender now."**

**N.79 transitions, RULED BY DANN: do nothing.** The memo's four paths were
put to him (leave, shorten 1,500 ms to 400 ms, move to `transform`, Svelte
`slide`), with the honest caveat that nobody has measured the 1,500 ms
drawer stuttering. He chose leave. Closed, nothing built.

**N.62, enumerated on Fable, nothing built.** The register's twenty-nine
strings were not reproduced in the tree; the Pacifier, NotePicker, and
wizard carry no English outside `t()`/`T()`, so N.35 and N.50's parts appear
done since. What remains: `Controls` on the drawer landmark, `Toggle` on
thirteen TOC chevrons, `Navigation` and `Transcription` on two landmarks, and
« Modifier le glose » at `InspectorPanel.svelte:1039`. Two coined French
words, « Commandes » and « Déplier ou replier », wait for Dann.

**Found, not numbered, Dann to rule:** `watchlist.ts:92` `WATCH_HEADER =
'Places to watch'` is visible and printed in English in French mode
(`VoiceProfilePane.svelte:791`), pinned by `watchlist.test.ts:262`. Whether
`watchEntryLine` prints English is NOT ESTABLISHED.

**Two visible-list items struck as already done:** the French colon spacing
(the colon audit, `9d314de`) and N.63's last residue, the interstitial's
gate, retired under N.73 portrait C ruling 4 (`+page.svelte:1865`).

**The desk's own fault this session:** it asked Dann for a deploy URL that
`ENVIRONMENT.md:1090` says the Vercel connector fetches. He had to say
"provide URL." Corrected in the same breath; the rule was already written.

---

## 2026-08-23 NIGHT. N.80 IS DONE IN TWO SHIPS, AND THE [u] QUESTION IS ANSWERED

**Numbered from the inbox on Dann's ruling, with N.79.** Dann's question:
is [u] failing on mic sensitivity, on a low cutoff, or on something else?

### Research, two subagents, both run from the desk on Dann's ruling

Opus read the whole capture chain and ran the tree's own `extract.ts`,
`guard.ts`, and `detector.ts` on synthetic fry:
`docs/sessions/memo-n80-u-capture-research_r1_2026-08-23.md`. Established:
the three browser flags are already off (`live.ts:339-341`, and Dann's
console confirmed `autoGainControl:false` and the other two); no highpass
anywhere; the F1 window `[150, 1200]` resolves a synthetic fR1 down to about
160 Hz, so **the cutoff is not the limit**; the fry detector cannot produce
a Provisional with numbers; plausibility passed 301 Hz. Its leading
diagnosis, level against the 12 dB SNR floor, **was refuted by Dann's
console the same hour**: every take sat 18 to 26 dB above the floor. The
control rule did its job.

### What the console said, and what each ship did

Dann's three takes on `9d314de`: two `reprompt c5_cv` (pulse regularity
over the whole 2.5 s buffer; the live gate only asked for one second), one
Provisional.

**Ship 1, `d491d22`: judge the fry on its best steady window.** `runCapture`
runs `guard()` first, slices to `segmentS`, and hands the slice to
`detect()` and `analyze()`; the confidence tier reads `fullWindow` from the
whole take so a slice never reaches `high`. `analyze.ts` only, thirteen
tests in the new `analyze.test.ts`, gate 4 705 to 718. Memo
`memo-n80-best-window_r1_2026-08-23.md`. **Code corrected the brief: the
buffer is 2.5 s, not 3.5; `live.ts:665` trims half a second from each
end.** Dann's three takes: all `segmentS: null`, so nothing to slice, and
the guard reports only pass or fail.

**Ship 2, `230cad3`: the guard reports its four measurements.**
`GuardResult.diag` carries `cv1`, `cv2`, `mincor`, `cvr`, `spanS`, and
`failed` for the full window and the best window; no threshold moved;
parity proven on 56 cases against the floor's `guard.ts`. Six tests, gate 4
718 to 724. Memo `memo-n80-guard-diag_r1_2026-08-23.md`.

### The answer, read off Dann's console on `230cad3`

Three takes, one name every time: **`fr1_cv`**, the steadiness of fR1
across the held fry, at 0.154, 0.095, and 0.080 against a ceiling of 0.08.
The other three tests were clear by a wide margin on every take. With ship
1 in place, takes 2 and 3 captured on sub-windows of 2.25 and 2.45 s;
take 1 had no passing window. **A [u] that failed and then succeeded in
one sitting without the singer changing anything is the N.49 document's
own test for a fix.** Six fR1 readings tonight: 290, 289, 301, 316, 306,
270. Scatter, not drift.

**Left alone, deliberately:** `T_FR1_CV = 0.08` (`guard.ts:4`). A move
needs the same `diag` numbers from the other vowels, and Dann has a
captured [u] without it. One take tonight read 764 / 2231, which is not a
[u]; why is NOT ESTABLISHED.

**Also verified tonight, on Dann's challenge:** the readiness step measures
a room SNR and a fry rate (`readiness.ts:312-335`), writes a provenance
record nothing reads back (`CalibrationWizard.svelte:665`), and feeds
nothing downstream. It cannot make a capture better or worse. Left as is.

### Inbox dispositions, ruled by Dann 2026-08-23

Struck as already done in the tree: NOTATION collapsed on arrival
(`+page.svelte:198-211`); metadata header retractable; the softened
borders (replaced by the text watermarks); the matching placeholders
(Dann's own screenshot). Parked: WCAG in marketing until an audit exists;
the hamburger menu. Numbered: **N.79 transitions** and **N.80 [u] capture**.
New in the inbox: the wizard's rule above the voice selector goes
lavender.

---

## 2026-08-23 LATE. THE COLON AUDIT AND THE SCORE MARKUP RENAME, `9d314de`, WALKED

**Ruled by Dann 2026-08-23:** the colon audit is the one thing, and the
English tab `Marked score` becomes `Score markup` while the French
`Partition annotée` stays. Both went to Code in one brief,
`docs/sessions/brief-colon-audit-and-score-markup_r1_2026-08-23.md`; memo
`memo-colon-audit-and-score-markup_r1_2026-08-23.md`.

**229 edits across `LearnContent.svelte`, `GuideContent.svelte`, and
`i18n.ts`, French only:** 121 colons gained or upgraded a hard space, 106
semicolons and 2 exclamation marks lost one. Code took a spelling census first
and found all five spellings, plus `&#8239;` before 29 semicolons, now gone.
English blocks byte-identical. Gate 4 stayed 705 after three expectations in
`analyze-score-adapter.test.ts` followed the string `fit.broad.body`. Bundle
up 108 bytes.

**Code's one judgement, ruled right by the desk:** the three bare colons left
in French prose are inside English book titles (`Russian Lyric Diction: A
Practical Guide` and two others). English titles keep English punctuation.

**Walked:** Dann on the desk, French Leçons on `ilya-lkhccn4lt`, no `:` or
`;` starting a line. **Not walked on a phone**; Code measured zero wraps at
360 px in the pane.

**The desk's survey in the brief was wrong where it said `GuideContent` had
no hard-space colons. It had 9.** The brief marked the survey rough and said
Code's census governs, which is the only reason it cost nothing.

---

## 2026-08-23. N.78 SHIPPED `9cc68e5` AND WALKED. TWO RESEARCH PASSES, ONE BUILD

**Floor raised to `9cc68e5`.** Five gates: 216, 235, 0 errors and 7 warnings
in 4 files, **705**, 444 passed and 5 skipped. Gate 4 moved 682 to 705 for
the 23 tests in the new `apps/web/src/lib/composers-poets.test.ts`, with
Dann's permission before the ship script ran. Bundle up 1,670 bytes.

### Ruled by Dann, 2026-08-23

- **The desk runs the research subagents itself**, rather than handing Dann a
  brief to paste. Two Sonnet subagents, one at a time, within the ceiling.
- **The French form is the French Wikipedia article title**, one source for
  all 62, converted to `Surname, Given` with the patronymic dropped. Ruled
  after pass 1 showed the BnF heading is ISO 9 transliteration for about a
  third of the list. Rachmaninov therefore reads `Sergueï`, the title, not
  the `Serge` of concert usage.
- **Display only stands**, per 2026-08-21. `SearchableSelect.svelte`'s
  `selectEntry` still writes the English form. Code verified storage
  byte-identical across both pill directions and a French reload.

### What shipped

`composers-poets.ts` carries an optional `french` field on 49 entries and a
language-aware display helper. `SearchableSelect.svelte` filters on the
French form too, so `Pouchkine` finds Pushkin in either language.
`TitlePage.svelte` passes the language. **`metadata-provenance.ts` stays
English by Code's own reading: its output reaches the persisted document
through `commitMetadataState` at `+page.svelte:1604`.** Memo:
`docs/sessions/memo-n78-build-french-display_r1_2026-08-23.md`. Brief:
`brief-n78-build-french-display_r1_2026-08-23.md`.

### Left as English in French, with the reason for each

No French article: Bulakhov, Titov, Golenishchev-Kutuzov (a red link on the
disambiguation page), Rathaus. Title is the bare surname: Goethe. Title is the
pen name doubled: Galina. Same in French: Cui, Rubinstein, Stravinsky,
Akhmatova, Heine, Pasternak, Shakespeare. **None of these was coined. The
do-nothing holds for all thirteen.**

### The desk's own faults this session

- The r2 brief told the agent the MediaWiki API works. It did not, in the
  agent's environment; direct page fetches did. Now in `ENVIRONMENT.md`.
- The build brief's done-when quoted the trigger's `Given Surname (dates)`
  format as though it were the row's. Rows draw `Surname, Given`. Code read
  the intent correctly and changed nothing; the loose wording was the desk's.
- The translator dropdown's list was `NOT ESTABLISHED` at the open. It draws
  on `POETS` (`MetadataFields.svelte:139`). Established by reading, not asked.

---

## 2026-08-21. N.77 IS DONE AND WALKED. SIX SHIPS, AND THE BLOCKING SET EMPTIED

**N.77, the Learn and Guide redesign, was numbered, designed, built, and closed
in one sitting.** Ruling 6 of 2026-08-18 had been ratified by Dann's eyes on
Fable's mockup and never built. Six ships, every one walked by Dann on a real
deploy, desk and phone.

| ship | commit | what |
|---|---|---|
| 1 | `2b85d13` | 24 chapter-opening bands, rose for Learn and cobalt for Guide |
| 2 | `e52b1c9` | every anchor clears the sticky chrome; a chapter lands on its band |
| 3 | `a1b5774` | the band's bleed tracks the sheet's padding; Repertoire moves up |
| 4 | `0fcaa6e` | one mark at every station boundary; Print takes the model's size |
| 5 | `9f11490` | no space before a question mark in French; the coda reads `Section 8` |
| 6 | `d079794` | nine decks in both languages; the band title scales with the sheet |

**Before it: `46ab5e2`, the `inferred` legend row dropped.**

### THE DESK'S OWN ERRORS, ALL FOUND BY CODE, ALL THE SAME FAULT

**Four of this desk's briefs carried a wrong count, and three share one cause:
THIS REPOSITORY WRITES A NON-BREAKING SPACE IN AT LEAST FIVE SPELLINGS.** The
desk counted two or three of them and reported the total as fact.

- Ship 5's brief said **24** question-mark sites. There were **47**, and 19 were
  `&#160;`, a spelling the desk never searched for. One more sat on its own
  source line, where HTML collapses the newline to a space; it matched no
  same-line search and Code found it only in the built bundle. **A fourth file,
  `Drawer.svelte`, was never in the brief at all.**
- The same brief said **15** guillemet pairs. There are **124**, in four
  spellings.
- The same brief asserted nothing precedes `!` or `;`. **3 exclamation marks and
  60 semicolons carry a space, all French.**
- Ship 6's brief said `&#160;:` appears **62** times. It appears **150**. The
  desk took Code's count of 62 `&#160;` GUILLEMETS from the ship 5 memo and
  reused it for COLONS without re-checking. **That is tether 3 exactly, and it
  is the second wrong count in one day.**
- Ship 4's brief claimed `New song` lacks the model's border. `.btn-ghost`
  supplies it; both buttons already measured 34.38 px and nothing needed doing.
- Ship 3's defect was the desk's too: the band's `-96px` bleed was passed along
  without ever asking what the sheet's padding is on a phone. It is `1rem`.

**The lesson, and it is now in `ENVIRONMENT.md`: before counting a typographic
character in this tree, enumerate its spellings first.**

### RULED BY DANN, 2026-08-21

**CANADIAN FRENCH TYPOGRAPHY, checked against both authorities before he
ruled.** No space before `?`, `!`, or `;`. **A hard space before `:`.** Canada
parts company with France here, and Ilya followed France. Sources: the
Government of Canada's `Clés de la rédaction`, and the OQLF's
`Vitrine linguistique`, which says *"pas d'espace ou une espace fine"* and
favours none. **47 sites repaired in ship 5. The 63 `!` and `;` sites are NOT
done and belong to the colon audit.**

**THE COLON AUDIT IS FLAGGED AND NOT RUN.** About 126 colon sites across the
French halves of `LearnContent.svelte`, `GuideContent.svelte`, and `i18n.ts`.
**Both Svelte files hold the English and the French in one file**, and English
takes no space before a colon, so roughly half must be left alone and telling
which is which means reading each one. Flagged as a Sonnet farm-out, 150k to
250k tokens worst case. **Dann never answered, because N.78 overtook it.**

**LEFT ALONE, DELIBERATELY, EACH WITH ITS MEASUREMENT.**

- **Learn's rose kicker is 3.54:1**, below the 4.5:1 floor for 10 px text.
  `--dusty-rose` `#A67B7B` against `#fdfbf6`. The 40 px title passes the 3:1
  large-text floor. Guide's cobalt is 4.61:1 and passes throughout. **A darker
  rose reaching 4.52:1 is `#996767`; `--lang-chip-learn` `#9A6A6A`, already in
  the palette, reaches only 4.37:1.** Dann: *"Leave it."* It joins the contrast
  items this file already records.
- **The sage rules print faint in greyscale.** `--sage` `#8B9A7D` is 2.99:1 on
  white and renders around grey level 146 of 255. **Closed on Dann's own
  evidence rather than on arithmetic:** he printed `В четырёх стенах` from
  `2b81f5a` on 2026-08-21 and said *"prints beautifully."*
- **N.63's honest residue: SAY NOTHING.** Asked in E.45, unanswered since, now
  answered. The keyboard clause was the only true one, and Dann's own E.41
  posture governs: the mobile paradigm serves the user rather than apologising
  to it. **The gate's deletion is still owed if it still ships**, and deleting
  it also removes desk-geometry scroll arithmetic running on a phone and a
  second redundant `loadDictionary()` call.
- **`Calibrate` does not match `Transcribe`'s width.** Built in ship 4 and
  reverted before it shipped. The grid truncated the voice status to
  `Voice: not …`, cut by 52.2 px in English and 57.9 px in French at 360 px.
  Dann: *"the colour contrast between it and the surrounding sage is
  sufficient."*
- **The band title's printed size.** `vw` resolves against the page box in
  paged media, so it is very likely under the ratified 40 px on paper. **Learn
  and Guide are offered no `Print` button at all**, by Dann's ruling of
  2026-08-20, so paper is not a supported route to these pages. Not worth the
  three lines.
- **`learn-unit-7`'s French deck runs three lines** where the rest run two,
  making that band 21.7 px taller. Bands are never seen beside each other.

### THE FINDING THAT IS NOT ABOUT THE BAND, AND IS NOT RULED

**Between 768 px and about 956 px with the drawer open, the drawer takes 520 px
and THE READING SHEET IS 192 px WIDE.** Measured by Code on `d079794`. The band
title paints 96.2 px off screen there, recovered from 125.8 px by ship 6's
clamp, and `vw` cannot clear it because the drawer owns 520 px of the window.

**The title is the symptom. A 192 px reading sheet is unusable whatever size the
title is.** Recorded as a question about the drawer at tablet widths, not about
the band. Code's remedy, unruled and untaken: `container-type: inline-size` on
`.chapter-band` and a `cqi` term instead of the `vw` term.

### EIGHTEEN DECK STRINGS, RATIFIED VERBATIM

Ship 1 gave decks to Learn's chapters 2, 3, and 4 by lifting a thesis sentence
already in the body. **Nine chapters had none.** Dann ruled *"Write the nine"*
and asked for drafts, **waiving the standing rule that the desk does not write
the French.**

**Eight of the nine English decks are Dann's own prose condensed, or Fable's
from mockup r2. One, `guide-contributors`, was coined by the desk.** Of the nine
French, four are effectively his own words and five carry a coined element, each
marked in the thread before he ratified. **All eighteen ratified without
edit.** They are in `LearnContent.svelte` and `GuideContent.svelte`; the brief
that carries the table is
`docs/sessions/brief-n77-ship6-decks-and-scaling_r1_2026-08-21.md`.

### N.72 IS CLOSED, AND HOW

**The last unwalked surface was Chrome on iPhone, on a stable URL.** Ship 4 was
made its own instrument: the rule between `REPERTOIRE` and `SOURCE` that ship 4
restored is visible, so no build marker was needed.

**Dann held the branch alias `ilya-git-shane-dannmittons-projects.vercel.app`
open on his phone, confirmed no rule between the two stations, ship 4 landed,
and ONE RELOAD delivered the new build.** The confound was named in advance and
did not fire: the alias had flipped, so the private-tab disambiguator was never
needed.

---

## 2026-08-21 LATE. THE NINE SHIPPED, AND THE BOUNDARY THAT WAS NOT ANALYSIS'S

**FLOOR RAISED TO `2b81f5a`.** Three ships after `afc45cb`, each pushed and each
walked by Dann on its own deploy: `7294b42` carried the nine items, `2b81f5a`
carried the boundary repair, and `502d571` carried the brief that produced them.

### What Dann walked, and in what order

**On the phone, `7294b42`:** the silhouette with no painted box and no visible
left edge; the desk strip showing above the handle and below it and nowhere
beside it; the sage tint in that strip; no white latch after a tap; and the
doubled handle. **Five items in one look.** Then, scrolled to the foot of the
sheet: *"Yes the print button appears just as you say. Perfect."*

**On the desk, `2b81f5a`:** every station shut, six headers on one rhythm.

### THE 40 px THAT WAS NEVER ANALYSIS'S, AND THE DESK PUT IT THERE

**The desk measured Dann's screenshot rule to rule and reported ANALYSIS as
68.8 px against siblings at 33.0.** Code measured the ANALYSIS station itself,
got the same height as REPERTOIRE from the same recipe, and correctly changed
nothing. **Both were right about their own object and the desk's object was the
wrong one.**

**Dann found it himself, in one sentence:** *"Maybe there's unexpected padding
above Shift Lyrics?"*

**It was `.root-panel { padding: 0 1rem 40px }`**, the bottom of the whole
Transcription panel, sitting between ANALYSIS and the Fit panel that opens with
SHIFT LYRICS. **Measured on `7294b42` at a 430 px viewport: NOTATION 58.0,
SOURCE 58.0, REPERTOIRE 58.0, ANALYSIS 98.0. The difference was 40.0 exactly.**

**THE CHECK THE BRIEF DEMANDED FOUND A LIVE CASE.** `INCLUDE_SHANE` gates the
whole body of the Fit panel, so a wall-closed build renders `.root-panel` with
nothing under it, and `.env.example` documents unset as the production build.
**Code built it genuinely closed rather than simulating it in the DOM**,
confirmed `.root-panel` becomes the last element child, restored `.env`, and
diffed it byte-identical. **The foot went to whichever panel ends the column:
`.shane-panel` keeps its 40 px wall-open, `.root-panel:last-child` carries it
wall-closed. Same value, no new one.**

**Verified on Dann's own walk screenshot, rule to rule at desk width: 27.2,
27.7, 27.2, 27.7.** Before the repair: 27.2, 33.0, 32.6, 68.8.

### The other correction the desk owed

**The brief said NOTATION sits in an anchor and is not a `.section`. It is.**
`MetadataFields.svelte`, `NotationFields.svelte`, and `RootPanel.svelte` each
declare their own scoped `.section`, because Svelte scopes CSS to the component
that authors the markup. **Three copies of one recipe, drifted. That is the same
defect `StationHeader` was built to end**, in a property `StationHeader` does not
own. Code's fix was 6 px rather than the desk's 0, and the desk's 0 would have
made the drawer irregular in the other direction.

### The « ou », and a ruling the desk overwrote

The desk told Dann the missing conjunction in the format line could stay
missing, taking the do-nothing. **`i18n.ts` records that he added that word by
hand on his walk of `39d60e0` on 2026-08-20.** A word he added is a ruling, and
nothing had reversed it. **The desk decided instead of searching. Tether 16.**
Restored in `7294b42`.

### Eleven stale anchors, and why briefs now carry names

Ship B moved `Drawer.svelte`, `RootPanel.svelte`, and `i18n.ts`. **Eleven line
numbers written into this file an hour before that ship were already wrong.**
Every anchor in `brief-to-code-handle-print-and-legend_r1_2026-08-21.md` was
re-read after `afc45cb` and **named as well as numbered, with the instruction to
trust the name.** Code hit two that were off by one, trusted the names, and the
build was unaffected.

---

## 2026-08-21. SHIP B SHIPPED AND WALKED. NINE RULINGS AND ONE NEW NUMBER

**FLOOR RAISED TO `afc45cb` AT THE CLOSE OF THIS SESSION.** Ship B is in
history: the push printed `2238e8b..afc45cb`, which is the check that caught
ship A's near miss the night before.

### What shipped, and what Dann walked

`afc45cb`, fourteen files, 1774 insertions. Five gates at baseline: 216, 235,
0 errors and 7 warnings in 4 files, 682, 444 passed and 5 skipped.

**WALKED AND ACCEPTED BY DANN on the `ilya-d0ygg24ga` deploy:** every header
retracts with a chevron; the SYLLABLES header is gone and the syllabified text
sits under SHIFT LYRICS; the counter reads `0 / 96` at the right of that header.

**SHIP A IS `DONE`, walked 2026-08-21.** No older-Finale disclosure anywhere in
the drawer, confirmed by Dann's own look, and the lavender rule above the voice
anchor confirmed from his screenshot with every other station rule still sage.

### Two things Code raised, and one of them was the desk's error

**THE BRIEF CONTRADICTED ITSELF AND THE DESK DID NOT NOTICE.** §B.6 told Code
to make the score box's gap to its action row equal the textarea's 6 px, and
§B.7 told it to put a line of type in the same space. **Code resolved it the
right way:** it built the sibling relationship, so every gap in SOURCE is
exactly 6.00 px, and it reported the visible 31.20 px rather than forcing a
number. The extra 25 px is the format line and its two 6 px gaps.

**THE DESK'S 270 px EXPECTATION WAS WRONG.** Shutting the metadata anchor
returns **227 px**, at all five phone sizes, and the middle still clears 365 px
everywhere. Code named the cause: the 44 px touch floor on Piece's and
NOTATION's new headers adds 27.20 px the anchor cannot hand back.

**CODE CAUGHT AN ERROR IN SHIP A's MEMO.** That gap was **26.00 px** on the
floor commit, not the 20.00 ship A reported. Ship A never named
`.output-section`'s own 6 px of top padding.

### THE COLOUR MISMATCH, AND HOW IT WAS FINALLY MEASURED

Dann: *"I insist that I am seeing two different colours."* **He was right, and
he had to insist.**

**MEASURED by sampling his own screenshots**, not by reading CSS: the drawer
surface is `#FAF8F5` at every sample and the tab interior is `#FFFFFF` at every
sample, in both the open and the closed state. Between them one hairline pixel
at `#F7F5F2` and the shadow at `#DDDCDA`.

**The cause:** `.drawer-lip:hover { background: #fff }` at `Drawer.svelte:1052`,
**with no `@media (hover: hover)` guard anywhere in that file**. A tap on iOS
latches `:hover`. The desktop cannot show it because
`.drawer-lip.silhouetted:hover` cancels it at `:1056-1058`, and `silhouetted` is
true only there.

**THE DESK'S FAULT, AND IT IS THE ONE WORTH KEEPING:** Dann had already sent the
screenshot. The desk asked him to go and run a test instead of measuring the
picture already in its hands. **See `ENVIRONMENT.md`.**

### Instrument faults Code recorded, both now in ENVIRONMENT

Reading a chevron's transform in the same call that clicks it returns the
pre-transition value; it reported all six inverted before a settled read showed
all six correct. And the Browser pane reports itself `hidden` even when fronted,
which clamps the dictionary loader's zero-delay yields to a second each.

---

## 2026-08-20 NIGHT. THE SURGERY, SHIP A, THE PILL, AND PRINT LEAVES THE DRAWER

**FLOOR RAISED TO `80c5e47` AT THE CLOSE OF THIS SESSION.** Everything in this
section is in history and the working tree is clean.

**THE CLOSE ALMOST LOST A BUILD, AND THE NEAR MISS IS WORTH MORE THAN THE
FLOOR.** The desk wrote this section claiming three builds had shipped. Two had.
**Ship A had not: its three files were still dirty**, its memo was untracked,
and its brief was untracked. The desk had recorded "shipped" from the existence
of a memo rather than from a commit. **A memo is written when the build ends,
not when it ships. Those are different events and only one of them is in git.**

Found by reading the push range on an unrelated memory commit: it ran
`1101d94..a2dc42d`, and `1101d94` is the floor at the top of the retraction
brief, written *before* ship A was built. **HEAD had not moved across the whole
build.** Ship A then shipped as `80c5e47`, five gates at baseline.

**THE RULE THIS EARNS:** never write `shipped` into `STATE.md` from a memo.
**Ask Dann for the one-line git status and read it.** Each item below is dated
by its memo, which carries `path:line` for everything it claims; the commits
are:

### What shipped after `b0a9860`, and NOT ONE OF IT IS WALKED

| what | memo | state |
|---|---|---|
| The language pill | `docs/sessions/language-toggle_r1_2026-08-20.md` | in history at or before `1101d94`. **`WRITTEN`, NOT WALKED** |
| The silhouette's lift, and the sage hover on the text intake | `docs/sessions/silhouette-lift-and-sage-hover_r1_2026-08-20.md` | in history at or before `1101d94`. Built from Dann's walk of `0e5ed6e`. **`WRITTEN`, NOT WALKED** |
| Ship A: the Finale disclosure deleted, six i18n keys gone, the bottom rule lavender | `docs/sessions/retraction-shipA_r1_2026-08-20.md` | **`80c5e47`**, shipped at the close of this session. **`WRITTEN`, NOT WALKED** |

**Five gates at baseline on every one of them.** 216, 235, 0 errors and 7
warnings in 4 files, 682, 444 passed and 5 skipped. Nothing moved.

### PRINT LEAVES THE DRAWER. RULED BY DANN 2026-08-20 NIGHT

His words, twice, and the second corrects a reading the desk had not made but
could have: *"Can we take Print out of the Drawer entirely and install a
consistent Print button on the right side of the Transcription / Score Markup
selector on the paper GUI side?"* Then: **"to be clear I dont want a control on
the paper. I want it to float next to the Transcribe / Score Markup selector."**

**`Print` goes to the DESK HEAD, beside the pair. Not on the sheet.**

**CONTRACT §6 LOOKS LIKE IT FORBIDS THIS AND DOES NOT.** "Do not put a control
on the paper" governs the sheet. `DeskHead.svelte:245-249` hides the desk head
under `@media print` with its own comment, *"The desk head is chrome. The page
prints; the desk does not."* The desk head already carries controls and always
has: the pair at `:43` and the Learn and Guide links at `:44`. **The full
reasoning and the test to apply next time are now in `ENVIRONMENT.md`.**

**WHERE IT SITS IS RULED, AND IT IS RULED FROM A DRAWING.** Dann drew it:
`docs/sessions/desk-head-print_r1_2026-08-20.html` is that drawing rendered.
**`Print` sits immediately to the RIGHT of the pair, separated by a gap, as its
own box in the pair's own idiom: same height, same hairline border, same
baseline.** It is not centred in the span between the pair and the links, and it
does not join the pair as a third segment. **The gap is what says it is a
different kind of thing.**

**IT IS ALWAYS LIVE. RULED BY DANN 2026-08-20 NIGHT.** His words: *"I think
folks can Print Learn and Guide if they want to? They'll have to specify the
page parameters in their print dialog box themselves."*

**So there is no disabled state, no greying, and no vanishing.** The desk had
put exactly that question to him, recommending grey-and-disabled on Learn and
Guide. **He answered it away instead: a singer may print any of the four
destinations, and the browser's own print dialog is where page parameters
belong.** The bar is therefore identical on all four destinations by
construction rather than by a condition, which is simpler than either path the
desk offered.

**THE CONSTRAINT THAT REMAINS.** The bar's ruled geometry puts the pair flush
with the sheet's left edge and Learn and Guide flush right. **`Print` takes the
space immediately right of the pair, which is empty, so it displaces nothing.**
Measure the desk head at 360 x 640 with `Print` added and report a collision
rather than shrinking anything.

### A PRINTED LEARN OR GUIDE EXCERPT MUST IDENTIFY ITS SOURCE. RULED 2026-08-20 NIGHT

Dann, the same minute: *"If folks Print Learn and Guide excerpts those excerpts
should bear header and footer information that identifies the source."*

**THIS NAMES WORK THAT DOES NOT EXIST. Measured tonight, not assumed.** Learn
and Guide render inside `ReadingPaper.svelte`, from `+page.svelte:2286-2300`.
**`ReadingPaper` has no header, no footer, and no page furniture of any kind.**
Its entire print block is `ReadingPaper.svelte:276-280`, which removes a box
shadow and nothing else. A Learn chapter printed today carries no title, no
attribution, no page number, and no wordmark.

**THE FURNITURE EXISTS, BUT IT IS THE OTHER PAPER'S.** `TitleHeader.svelte`,
`RunningHeader.svelte`, and `PageFooter.svelte` serve the transcription sheet
and the marked score. **`PageFooter` is not liftable as it stands:** its props
are `pageNumber`, `totalPages`, `legendItems`, `broadNote`, and a
`hairlineAccent`, and three of those are provenance concepts a Learn chapter
does not have. It does carry the one piece that transfers, `footer.attribution`.

**WHAT IS RULED:** a printed Learn or Guide excerpt identifies its source, in a
header and a footer.
**WHAT IS NOT RULED, AND THE DESK MUST NOT INVENT IT:** what those two lines
say, in English and in French. **Dann writes copy.** The desk's reading of
"identifies the source" is the chapter's own title, the Ilya wordmark, and the
build, but that is a reading rather than a ruling.

**NOT ESTABLISHED.** Whether a Learn chapter breaks legibly across pages at all.
Nothing in N.47 or N.69 was measured against `ReadingPaper`; both were done
against the transcription sheet and the marked score. **Settled by: one print of
a Learn chapter, on paper.**

**THIS IS ITS OWN PIECE OF WORK AND IT IS NOT SHIP B.** It arrived tonight
because Dann's `Print` ruling made Learn and Guide printable for the first time.
**Number it before building it.**

### RULED BY DANN, THIS SESSION, EVERYTHING ELSE

1. **The lip and the drawer are ONE SURFACE carrying the paper's own drop
   shadow.** Ratified from `docs/sessions/lip-handle-silhouette_r1_2026-08-20.html`,
   option C. Dann: "The look of C is exactly what I want."
2. **The layer order is Dann's own, given verbatim:** background deepest; drawer
   and paper GUI coexist at the next level; "whatever sorcery you need" highest.
   **He deferred the mechanism to the desk and ruled only the look.**
3. **Every header gets a retraction chevron.** "Every header begins a section
   that is retractable and expandable." Ship B.
4. **The bottom-most divider is lavender.** Done in ship A, `Drawer.svelte:844`,
   `--deeper-lavender` `#8E7E9B`, string-identical to the rule above SHIFT
   LYRICS. **No second lavender entered.**
5. **The older-Finale disclosure is deleted.** Done in ship A. Six i18n keys
   went with it, each checked for another consumer and each having exactly one.
   **`upload.err.mus` survives at `i18n.ts:377` and is now the only guidance a
   `.mus` user gets.**
6. **There is no Output station.** Dann dissolved the naming question rather
   than answering it: *"I do not think we need an Output section articulated."*
7. **The text intake gains a sage hover**, matching the score field's lavender
   one, **and it goes away once text is entered.** Dann's own correction.
8. **The two intakes' placeholders match.** The score drop zone's three stacked
   elements became one placeholder in the textarea's exact treatment. **He asked
   four times.** That failure is CONTRACT tether 18.

### THE SHADOW SEAM, AND WHY IT IS WORTH REMEMBERING

Code predicted an inward bloom before building it, and **the desk relayed the
prediction to Dann as a curiosity instead of solving it.** He got a build he had
not asked for: "Fucking awful Claude. This is not what you offered me."

**The fix was one move.** The `filter: drop-shadow()` sat on the silhouette
path, so the shadow fell inward across the drawer's own face. Moving the filter
to `.drawer`, which contains both the body and the handle SVG, means the opaque
body hides its own shadow and only the outside edge lifts. **One object, one
shadow, exactly as the paper does it.**

**The lesson is not about SVG.** A prediction handed over without a remedy is
not a warning, it is a pre-written excuse. **If the desk can see the defect
before the build, the brief solves it.**

---

## 2026-08-20 EVENING. THE DRAWER'S EDGE, THE CHEVRON, AND THE LANGUAGE TOGGLE

**Floor: `b0a9860`.** Five gates at baseline on both ships.

### THE SILHOUETTE, `1f201f2`, WALKED AND ACCEPTED

**The drawer's right edge and its handle are ONE path.** Dann's words on seeing
it: "it looks like exactly what i asked for. I am satisfied." The lip arrives
vertically, stops at the handle's top-left terminus, turns ninety degrees, runs
the handle's top, rounds only the RIGHT corners as a squircle, returns to the
bottom-left terminus, turns again, and continues down. **The handle has no left
wall.** Geometry ruled from a drawing:
`docs/sessions/lip-handle-silhouette_r1_2026-08-20.html`, and the drawing was
the specification Code built from.

**HOW THAT RULING WAS REACHED, and it is the method rather than the outcome
that matters.** Four rounds of prose had not settled it. One drawing of three
readings settled it in two exchanges. **CONTRACT tether 18's corollary: draw
it.**

**The whole silhouette is `#D2CFCC`**, measured off the handle's own painted
pixels rather than computed, because `.paper-handle` was deleted at N.73 S1 and
no memo, spec, or mockup records its hex. **The edge is now about half as
visible as the sage it replaced: 1.05:1 against the desk, where the sage was
2.02:1.** Built as ruled, and the number is recorded so Dann can rule again.
**The tab also gave up its fill, radius, and drop shadow on the desktop**,
because the desk's drawing showed an outline. That was the desk's specification,
not Code's choice.

### THE CHEVRON, `b0a9860`, WALKED AND ACCEPTED

Dann: "I love the colour of the chevron and it loks centreed thank you."

**`--ink-secondary` `#4a4540`**, down from `--ink-primary`, 8.94:1 on the
handle. **Chosen by family, not only by value:** this drawer spends the ink
scale on glyphs and the stone scale on borders, and a chevron is a glyph.
`--stone-700` measured almost identically and would have been the first stone
used as ink.

**The nudge needed the centroid Dann asked for and could not have been found any
other way.** The glyph's BOUNDING BOX is exactly centred, 1.75 to 12.25 in a
14-wide box. Rasterised at 40x and weighted by alpha, **the INK centroid sits at
6.666**, because the two round caps at the open end carry more ink than the
single round join at the apex. Two errors followed, and only one is constant:
the box centres in the button (centre 530) rather than the handle's interior
(centre 529), and the 0.334 px asymmetry REVERSES when the glyph flips. So each
state took its own value, **−0.67 px closed and −1.33 px open**. **Both fall
below the "pixel or four" Dann guessed and Code did not round them up to meet
his guess.**

### THE LANGUAGE TOGGLE. RULED 2026-08-20, BRIEF WRITTEN, **SINCE BUILT**

**Built the same night.** Memo:
`docs/sessions/language-toggle_r1_2026-08-20.md`. `WRITTEN`, not walked. What
follows is the ruling as it was made.

**Dann ruled the pair becomes ONE pill**, naming the language he is not in.
**Nothing in the project had ruled the two-button form; it was built, not
decided.**

**The pattern is Canada.ca's**, found by research at Dann's request: one control
labelled with the other official language, "Français" on an English page, top
right of the header, abbreviating to FR and EN below a breakpoint. Mandatory for
Government of Canada sites under the Policy on Official Languages. **Dann is not
bound by it and took it for convention and familiarity, not compliance.**
Sources: `design.canada.ca/common-design-patterns/language-toggle.html` and
`design-system.canada.ca/en/components/language-toggle/design`.

**THE SHAPE WAS ALREADY RULED and was not the desk's to invent.** Spec §3.2,
the three radii: "full-round only for toggle knobs and **the language pills**."
The control already draws `border-radius: 9999px`.

**THE MEASUREMENT THAT DECIDED THE TREATMENT.** The existing control fails 4.5
in BOTH states on ALL FOUR bands: active 2.47, 2.90, 3.58, 2.96; inactive 2.65,
3.21, 3.93, 3.50. **That is not something the toggle change introduces.** Dann
first ruled dark ink on legibility grounds, then said "I think the white is
beautiful but I do think it needs to be black." The desk offered a third path he
had not seen, because his reason was legibility rather than taste.

**RATIFIED: option D, "I love D. Ratified."** White text on a chip that is the
band's own hue one step down.

| destination | band | chip | white on it |
|---|---|---|---|
| Transcription | `#8B9A7D` | `#6C7A5F` | 4.58 |
| Learn | `#A67B7B` | `#9A6A6A` | 4.52 |
| Guide | `#5C739E` | the band itself | 4.77 |
| Marked score | `#8E7E9B` | `#806E8E` | 4.63 |

**Guide needs no darkening and takes a hairline instead.** He chose this over
one translucent declaration knowing it costs four values.

**Two things it clears on the way past.** Three hand-picked literals, `#8F6A6A`,
`#4D6387`, and `#74677F`, exist only to colour the option you are not on and get
deleted. And the `INBOX.md` item from the same day closes: "Français" sits
inside an English document at `HeaderBar.svelte:58` with no `lang`.

**NOT RULED, and the brief tells Code not to decide it silently:** whether the
pill abbreviates to FR and EN on small screens. Build the full word, measure at
360 x 640, report a collision rather than abbreviating.

**Brief:** `docs/sessions/brief-to-code-language-toggle_r1_2026-08-20.md`.
**The ratified drawing:** `docs/sessions/lang-toggle-options_r1_2026-08-20.html`.

---

## 2026-08-20 AFTERNOON. N.65 SHIP ONE, WALKED AND REPAIRED FOUR TIMES

**Floor: `39d60e0`.** Five gates at baseline on every ship: 216, 235, 0 errors
and 7 warnings in 4 files, 682, 444 passed and 5 skipped. Nothing moved all day.

**The four commits.** `96e3fff` ship one. `f59f7d2` the sage boundary and one
station recipe modelled on Analysis. `3c498aa` the second walk and the intake
watermarks. `39d60e0` the intake pair.

**RULED BY DANN TODAY.**

- **The scroll reads Source, Output, Songs, Analysis**, then Score work and
  notices, then the pinned Voice anchor. **This reverses the
  Analysis-above-Output order shipped in N.73 S3 ship two and walked.** His
  reason: the song comes in and goes out at the top, the performance sits
  together at the bottom, and Print stops being stranded across an empty
  Analysis from the fields it belongs with. The order it replaced came from a
  spec written before the anchors existed.
- **Every station matches Analysis** in spacing and dividing rule. One recipe:
  a 2 px sage line, 6 px, the label, its own 0.4 rem, the body, 12 px, the next
  station's line.
- **No `double` border survives anywhere in the drawer.** The 2 px double at
  the three anchor and takeover boundaries went sage on his ruling "I do not
  like the double line, replace it with a sage horizontal like the one above
  Analysis." **He gave up the frame-versus-station distinction knowingly.**
- **The intake watermarks.** `text` in `--light-sage` and `score` in
  `--light-lavender`, 40 px, weight 700, `-0.01em`, `--font-sans`, centred,
  visible only while the field is empty, `aria-hidden`. **The colour split is
  Dann correcting himself** after the desk raised that light sage in both would
  put a sage mark inside a lavender-bordered box against his own hue rule.
  **40 px and its three companions are adopted from
  `fable-gui-mockup_r2_2026-08-18.html:94`, `.room-band h2`, the only oversized
  sans this project has drawn.** `partition` measures 148.19 px in a 262.8 px
  box at 360 x 640, so the brief's binding constraint did not bind; the full
  table from 28 px to 60 px is in the memo if Dann wants a larger number.
  **This watermark now DEFINES the oversized-sans convention and the chapter
  bands must match it**, because the bands do not exist and the mockup that
  draws them says its typefaces are stand-ins.
- **The drop zone's three stacked lines became ONE placeholder** in the
  textarea placeholder's exact treatment. See the lesson below.
- **The drawer's edge and its handle become one silhouette in grey.** Geometry
  drawn at `docs/sessions/lip-handle-silhouette_r1_2026-08-20.html` and ruled
  by Dann from that drawing. In flight with Code.

**THE LESSON THAT COST HIM FOUR ASKS, now CONTRACT tether 18.** He asked four
times for the two intake fields' placeholder text to match. The desk searched
`::placeholder` rules every time; the score box's text was three ordinary
elements, so every search was incapable of returning it. **He said "make it
consistent with its twin" and the desk wrote back that it was reading the twin
as the metadata field "since the score box has body text rather than a
placeholder."** The answer was inside that sentence and a stylesheet
distinction was used to rule it out. **Name the thing by what he can see.**

**THREE CAUSES FOUND BY MEASURING RATHER THAN READING, all by Code.**
`app.css`'s N.23 focus-zoom rule names `input, select, textarea` and not
`button`, so `SearchableSelect`'s three triggers stayed 12.8 px on a phone
while the two inputs jumped to 16 px: that was Dann's "two sizes among five
fields." A `:global(.drawer-content textarea)` rule with `!important` outranked
`.text-input`'s own border. And the double line was `border-style: double`,
never a seam between two rules.

**ONE RULE INSET, and the cause was mechanical.** A border draws on the border
box, so the 1 rem padding on the three pinned blocks sat inside it and the rule
spanned the whole drawer. The same 1 rem is a margin now. All seven sage rules
start 16 px from the drawer's left edge.

---

## 2026-08-21 EARLY. N.65 SHIP ONE, `96e3fff`. SHIPPED, PART-WALKED

**Floor: `96e3fff`.** All five gates at baseline on the ship: 216, 235, 0 errors
and 7 warnings in 4 files, 682, 444 passed and 5 skipped. Nothing moved.

**What shipped.** One owner for the station label, `StationHeader.svelte`, and
four of the five declarations deleted. `SOURCE` is a labelled station in both
languages. `Clear` and `Transcribe` returned to Source's foot. `Print` joined
Export and Import. Both text intakes went from 3 px to 1 px, hues untouched.
The textarea's placeholder lost its italic. Memo:
`docs/sessions/drawer-stations-ship1_r1_2026-08-20.md`.

**TWO PLACES THE TREE BEAT THE BRIEF, both found by Code measuring the screen.**
The brief's §3.2 called the double line a seam between two rules;
`NotationFields` draws no border and never did. And §3.6 named `.text-input`'s
border in `RootPanel`, but a `:global(.drawer-content textarea)` rule in
`+page.svelte` carried `!important` and outranked it, so the first edit changed
the source and not the screen. **Both are the same fault by the coordinating
desk and `ENVIRONMENT.md` now names it: a `path:line` for a CSS declaration is
a claim about the SOURCE, never about the screen.**

**WALKED: one item of eight.** Dann looked under NOTATION and reported two
lines. That is the repair now sitting in THE ONE THING. **The other seven are
unwalked**, including the table of computed label values, `SOURCE` in place,
`Print` beside the binder, and both intakes at 1 px.

**THREE THINGS ON THAT WALK ARE UNRULED and are Dann's to settle by looking:**
both field perimeters at 1 px, which was the coordinating desk's proposal and
not his ruling; the Output row having no label, since his ruling 4 named Source
only; and `SOURCE` in French, which Code set to the identical string by identity
rather than coining, because `t()` prints `[MISSING: source.heading]` and an
empty slot was not available.

---

## 2026-08-20 LATE. N.73 S3 SHIP TWO IS DONE, `af995a9`, WALKED BY DANN

**Floor for this section: `af995a9`.** All five gates at baseline, before and
after: 216, 235, 0 errors and 7 warnings in 4 files, 682, 444 passed and 5
skipped.

**What shipped.** `TabId` split into `Destination` plus `StudioDocument`; the
`ilya:activeTab` migration with every stored value named and the wall-closed
case tested; NOTATION's accent unconditionally sage; Analysis moved above
Output; and the desk head at one position on all four destinations.

**WHAT DANN WALKED, four of four, on the deploy.** Analysis sits above Export,
Import, and Songs. Flipping the pair does not change NOTATION's colour. The
pair and the reading links hold one height across all four destinations. A
stored `shane` reloads to Studio showing the marked score.

**IT SHIPPED IN A COMMIT NAMED FOR THE MEMORY.** `git add -A` swept the build
into `af995a9`, whose message reads "STATE: desk-head height ruled...". The ship
script never ran, so its five gates never ran at ship time. **Nothing unsafe
went out**: Code had run the same five on the settled tree, twice, and reported
them at baseline. **Recorded because a later session reading that message would
look for ship two somewhere else.**

**The desk head's expectation held to the pixel, both directions.** Stated
before the measurement: desktop Learn and Guide move DOWN 16 px to meet Studio,
phone Studio moves DOWN 8 px to meet Learn and Guide. Measured: desktop 64 to
80, phone 56 to 64. All eight readings have `--desk-pad-top` equal to
`padding-top`.

**Two things came out bigger than the brief said, both measured by Code.**
`drawerWidth` was a live S2 invariant violation rather than a reliance: with a
word open, flipping to the marked score narrowed the drawer from 693 to 523 px
while the word stayed in the console. It holds at 720 now. And `aria-controls`
was broken on BOTH pair members, not just the inactive one, because since S2
neither has a panel of its own. Dangling references: 0.

**One free result.** Code closed ship one's open walk item 7 in its own harness:
the takeover survives a word click, 1002 px before and after, three regions
still stowed. No ship one code was touched.

**THE CORRIDOR WAS MEASURED AND NOT CUT.** See the corrected entry below. The
coordinating desk's named cause was false.

Memo: `docs/sessions/n73-s3-ship2_r1_2026-08-20.md`.

---

## 2026-08-20 NIGHT. N.73 S3 SHIP ONE, `f7975ca` AND `63c2bb4`, WALKED BY DANN

**Floor for this section: `63c2bb4`.** All five gates at baseline on every run,
five runs across the night: phonology 216, dictionary 235, web-check 0 errors
and 7 warnings in 4 files, web-test 682, score-parser 444 passed and 5 skipped.
Nothing moved, so no permission was needed.

**The drawer has two anchors.** Piece and NOTATION are pinned at the top, the
voice line is pinned at the foot, and Source, Songs, Analysis, and Shift Lyrics
scroll between them. NOTATION moved from the bottom, where E.29 put it, to the
top, where E.36 §1.4 ruled it and Dann ratified it on 2026-08-19.

**The voice line exists for the first time.** `VoiceAnchor.svelte` is new. It
reads `Voice: not yet calibrated` with a lavender `Calibrate`, drawn at
`docs/sessions/fable-gui-mockup_r1_2026-08-18.html:333-338` and styled at
`:108-109`. **The calibrated wording, `Voice: {name}` with `Re-calibrate`, is
the coordinating desk's inference and not a ruling.** So is the French
`Recalibrer`, which is COINED with no house precedent. Both are Dann's to
ratify or replace. `Voix : pas encore calibrée` and `Calibrer` are adopted from
`i18n.ts:531`.

**Calibration is a takeover, so S4 is absorbed into S3.** `Calibrate` gives the
ritual the whole drawer behind one back affordance, and backing out restores
the scroll position and the retract state. E.44 §PLAN S3 asked for a "voice
line pinned bottom" as though one existed; it never did, and the thing it named
is `CalibrationWizard.svelte`, 2,125 lines and five phases including the
Pacifier's quadrilateral. **Dann ruled on 2026-08-20 that the anchor gets built
and the ritual becomes the takeover, both in ship one.**

**NOTATION's collapsed default is built.** Ruled 2026-08-18
(`docs/sessions/fable-gui-session-record_2026-08-18.md:12-15`), never built
until tonight, and the coordinating desk's 300 px expectation for the phone
failed on the old default and holds on the ruled one. `.drawer-content`
`clientHeight`, arrival: 565 at 430x932, 477 at 390x844, 360 at 393x727, 300 at
375x667, 273 at 360x640. **It is short at 360x640 and exactly on the line at
375x667**, and no anchor was shrunk to make the number nicer.

### Three repairs, all from Dann's walk, all shipped in `63c2bb4`

- **NOTATION's chevron pointed the wrong way.** Its rule is that the chevron
  points the way the panel will grow, and its two rotations expressed that for
  a panel pinned at the foot. Moving the panel to the top inverted them. The
  rule was never wrong; its values became backwards.
- **The marked score's page did not centre.** See the corrected section below.
- **The ritual's Start button was sage.** Ruling 3 of
  `claude/fable-ruling-s0-slate-closed_2026-08-19.md` keeps lavender to the
  voice anchor and calibration surfaces. Ten buttons across three rules moved.
  **Four controls were left sage and named rather than guessed**: the roster's
  per-vowel Re-take, the hold banner's answers, the switcher's verb row, and
  the name field's focus ring. The Pacifier's functional tokens are untouched.
  Lavender has no darker partner, so hover borrowed the anchor's own
  `opacity: 0.85` rather than inventing a colour in a ruled palette.

### What Dann walked, and what he did not

**PASSED on `63c2bb4`:** both anchors hold under scroll on the desk AND on the
phone; NOTATION retracts and expands from its new position; the takeover fills
the drawer with one back affordance and no chevron enters it; backing out
restores; the French uncalibrated strings render; and all three repairs.

**NOT WALKED, and the reason ship one is `WRITTEN`:** brief items 6, 7, and 8.
They need a microphone and a real calibration. The French half of item 9 waits
on the same three.

### Owed, none blocking

- **The memo needs one amendment.** `docs/sessions/n73-s3-ship1_r1_2026-08-20.md`
  carries the walk items as NOT ESTABLISHED, because the list never reached
  Code before the ship. Amend it with the walk and the three microphone items
  in one pass, not two.
- **The plea copy survives the cure.** The takeover fixed F2's container, but
  "Please name your profile so we can map your voice..." still opens the
  ritual, and `fable-gui-audit-and-spec_r1_2026-08-18.md:44` says "Please"
  breaks the house style Dann ruled on 2026-08-18. **Dann writes copy.**
- **THE DRAWER'S STATIONS. RULED by Dann 2026-08-20 late, NOT STARTED, and it
  goes NEXT, ahead of the chapter bands.** Dann asked for "a cohesive,
  attractive, sensible organization for the Drawer" after finding uneven header
  padding and a double line under NOTATION.
  **NO COMMISSION YET.** The mechanism he ruled is described in
  `claude/fable-ruling-e27-four-tab-consolidation_2026-08-05.md`, read in full
  2026-08-20, and has been unbuilt for fifteen days. Same pattern as the voice
  line: the description was there and nobody looked.

  **BUT E.27 IS A SOURCE, NOT LAW, AND DANN RULED IT SO ON 2026-08-20:** "That
  ruling was three weeks ago and a lot has changed since then. Leave room to be
  malleable." **The coordinating desk quoted §3.3 as binding and was wrong to.**
  Three of its parts are already superseded:
  - **§3.2, the continuous three-sheet packet page**, overturned by Fable
    explicitly in E.44 §PERSPECTIVE.
  - **§3.3's inspector takeover**, overturned in the same document: the
    Inspector is resident in Analysis and calibration is the only takeover.
  - **§3.3's five scrolling stations**, superseded by E.36 §1.4 and ratified by
    Dann on 2026-08-19: Piece and NOTATION are pinned anchors, the voice is a
    pinned anchor, and only Source, Analysis, and Output scroll.

  **What survives of E.27 unamended, and it is only this:** "one mechanism for
  structure, one for asides" (§3.3), the closed-header status line (§3.6), and
  the per-device persistence of the open set (§3.4). **Build against those and
  treat the rest as history.**

  **Dann's four rulings, 2026-08-20:**
  1. **Every header retracts its section on click.** This is E.27 §3.3
     arriving: "The stations use the existing table-of-contents accordion
     mechanism, allow-list extended."
  2. **One consistent relationship between a header and its first section
     entry.** NOT in E.27. A spacing value, mechanical once chosen.
  3. **Horizontal dividers need a semantic function or they go.** E.27 §3.3
     specifies exactly two mechanisms, "one for structure, one for asides": the
     accordion, and the native disclosure element for micro-help. **A divider
     is neither, so by Dann's rule it goes.**
  4. **Source needs a label.** E.27 §3.3 station 2 already names it. Spec §3.3
     first bullet, "no orphan controls," is violated today by the textarea and
     the drop zone sitting bare.

  5. **THE ANCHORS RETRACT TOO, ruled 2026-08-20 late.** Every station with
     contents retracts: Piece, Notation, Source, Analysis, Output, Songs.
     **The voice anchor is NOT a station**: it is one line, a dot, a status,
     and a button, with no contents to retract, and collapsing it would hide
     `Calibrate`, the only entry to the ritual, for no height. **CONFIRMED by Dann in his own
     words, 2026-08-20: "I agree with you about the voice anchor, yes,
     Calibrate needs to be visible."**
  6. **THE OPEN SET PERSISTS PER DEVICE.** E.27 §3.4, one of the three parts
     nothing has amended. **Dann's workflow makes it a requirement, not a
     convenience:** his model is that a singer fills the metadata once, retracts
     it because it has done its job, and gives the space to the operands. If the
     drawer forgets, that one gesture becomes a chore every session.
     **EXCEPTION, taken as the do-nothing rather than put to Dann: NOTATION
     keeps its deliberate non-persistence.** `+page.svelte` states the reason in
     its own comment, "a remembered collapse hides the toggles from a singer
     who forgot they exist," and nothing ruled on 2026-08-20 touches it. One
     line to reverse if a session proves it wrong.
  7. **SOURCE'S ACTIONS COME WITH IT, and this replaces a separate repair.**
     Ship two moved Analysis above Output and left the
     `Clear / Print / Transcribe` grid where it was, so `Transcribe`, the
     app's primary action, now sits below a tall empty Analysis pane,
     separated from the textarea it acts on. The coordinating desk offered
     this as a ship two repair and Dann did not take it up. **It dissolves
     here instead:** once Source is a labelled station with its own contents,
     Clear and Transcribe sit at its foot by construction, and Print joins
     Export and Import in Output. The `1fr 1fr 2fr` grid does not need
     repairing because it stops existing. **This is why the brief's §3 item 5,
     "Print stays where it is," is now spent.**

  8. **NO AUTO-COLLAPSE ON POPULATE.** It is the obvious next thought and E.27
     §3.3 forbids it in advance: "Calm Authority means the drawer does not
     fidget. Nothing else ever moves without the user." The retraction is the
     singer's gesture. **Do not build a station that shuts itself.**

  **FROM THE INBOX, opened at Dann's request 2026-08-20. Five items, and this
  is where each landed.**
  - **I.01 is DONE by N.73 S3 ship one** and should leave the file: NOTATION is
    no longer bottom-anchored and no longer opens expanded.
  - **The retractable-headers line is RULED IN** and is ruling 1 above.
  - **The placeholder line is RULED IN, 2026-08-20.** One declaration causes
    it: `.text-input::placeholder` carries `font-style: italic` and
    `.meta-input::placeholder` does not. The italic goes, because a placeholder
    is instruction and belongs to the Instrument voice. **The textarea's serif
    BODY stays: its contents are a poem.** Dann: "just make it consistent with
    its twin." Brief §3.6.
  - **The border line is RULED IN PART.** Dann ruled the hues are correct and
    must not be neutralised: **sage names the text intake, lavender names the
    score intake, which is hue naming place.** The coordinating desk's
    counter-proposal to make both neutral was WRONG and Dann overruled it.
    **What is NOT ruled: how to make them subtler.** The desk proposes the
    dominance is weight rather than hue, 3 px against the metadata fields' 1 px,
    and put it in the brief as its own proposal for Dann to rule by looking on
    the walk. **Measured against the white field: `--sage` #8B9A7D is already at
    2.99 against WCAG's 3:1 for a control boundary, `--light-sage` 2.15,
    `--muted-lavender` 2.62, `--light-lavender` 1.86, `--deeper-lavender` 3.74.
    The white fill is barely above 1:1 on the drawer, so the border is the only
    thing identifying the field.** Every lighter tone makes an already-marginal
    number worse, and that bears on the WCAG line in the inbox.
  - **The WCAG marketing line is not a build item** and stays where it is.
  **Also found, not scoped:** `app.css:140` provides a global
  `outline: 2px solid var(--sage)` focus rule, so the drawer's inputs are not
  focus-less. That closes a question the desk had raised as NOT ESTABLISHED.

  **WHY THE ANCHORS RETRACTING MATTERS, measured.** The Inspector's placeholder
  reserves `min-height: 365px` (`RootPanel.svelte:628`, read in the tree
  2026-08-20). Against the drawer middles Code measured on `63c2bb4`, retraction
  of the scrolling stations alone cannot deliver a full Analysis pane on three
  of five phone sizes, because the middle is already shorter than the reserve:
  360, 300, and 273 px against 365. **Retracting the metadata anchor, 302.7 px,
  gives back roughly 270 and clears all five.** So Dann's ruling 5 is what
  closes the small-phone case, not ruling 1.
  **NOT ESTABLISHED: the POPULATED Inspector's height.** 365 is what the
  placeholder reserves. The figure it was chosen against sits in E.36 §2.2,
  which this desk has not opened.
  **A HOLE IN E.44 WORTH KNOWING BEFORE ANYONE REOPENS THIS.** E.44 overturned
  E.27's Inspector takeover on the grounds that the Analysis region "always has
  a truthful tenant, because its placeholder body carries the dictionary state
  and the empty-state copy." **That is an argument about the EMPTY state.**
  Nothing in it considered whether the populated state fits on a 375 px phone.
  By tether 17 that overturning is a source, not law.

  **NOT GRANTED, and the build must not assume it: phone exclusivity.** E.27
  §3.4 rules "Desktop: any number of stations open at once. Phone: exactly one
  open at a time." Opus flagged that on 2026-08-05 as a second override of
  Dann's standing "we leave this to the user," which Fable did not name as an
  override. **Dann has been asked and has not answered, twice. His standing
  rule governs: any number open, on both displays.** The override stays
  unbuilt and reversible.

  **The defects this closes, all measured 2026-08-20:**
  - **`.section-label` is declared five times**, in `RootPanel`,
    `MetadataFields`, `NotationFields`, `SongList`, and `Drawer`, because
    Svelte scopes styles per component. `SongList.svelte:177` admits it in its
    own comment. **That is the uneven padding, and it has no owner.**
  - **The double line under NOTATION is a seam**, not a decision: NOTATION is
    a pinned anchor whose wrapper draws a boundary AND a station that draws its
    own.
  - **Source is unlabelled.**

  **NOT BUILT AND STILL OWED, E.27 §3.6:** "Every closed station header carries
  a right-aligned quiet status that does the wayfinding: Notation 'defaults,'
  Voice 'no profile yet,' Output 'nothing to print yet.'" **Dann writes copy.**

  **THE COST WAS PRICED ON 2026-08-05 AND IT IS NOT SMALL.** Opus's correction
  §1 item 1: retiring the other collapse mechanisms "means reworking the
  profile switcher's mode enum, the wizard's hoisted collapse boolean, the
  uploader's local boolean, and the searchable select. **Four components, not
  a configuration change.**"

  **Sequenced ahead of the chapter bands by the coordinating desk**, because a
  singer touches the drawer every session and a chapter band is an arrival
  decoration. Dann may reverse it.

- **THE CHAPTER BANDS FOR LEARN AND GUIDE. RULED by Dann 2026-08-20,
  RESEQUENCED, not started.** Drawn in full at
  `docs/sessions/fable-gui-mockup_r2_2026-08-18.html`, Exhibit 2. One band
  grammar for both rooms: breadcrumb, oversized sans title, one-line lede, meta
  line, then the page drops into the serif reading measure untouched. Rose at
  full strength for Learn, cobalt for Guide, spent on arrival and nowhere else
  on the page.
  **RESEQUENCED: immediately after S3 ship two, NOT after S5 and S6.** The
  coordinating desk argued and Dann did not object: S5 is the wall re-plumb and
  S6 is consequences, and both are Studio's business, touching neither reading
  room. The bands need only ship two, because ship two moves `reading-mode`'s
  padding, which is where a band sits. Building them first would mean reworking
  them a day later.
  **DANN'S RULING ON THE META LINE, option B without citations.** Fable's own
  caveats say the mockup's meta figures are invented: "Chapter 3 of 8",
  "12 min", "3 sections", "7 min", and "Grayson §§4.1-4.9". Ilya holds none of
  it. **Ruled: compute what can be computed.** Chapter index and section count
  come from the heading structure the TOC already walks
  (`+page.svelte`'s reading-mode IntersectionObserver). Reading time is a word
  count over a stated rate, which is arithmetic rather than an invented number.
  **The Grayson citations are NOT built now.** They are scholarship, they come
  from Dann, and they are a later content pass. **Do not invent one.**
  **The brief is deliberately NOT written yet**, because it would be written
  against `reading-mode` and the desk head as they are about to change in ship
  two. Write it when ship two lands. **Also re-verify the mockup's rose and
  cobalt hexes against `app.css` before building: Fable read them by eye off a
  deploy and said so.**

- **THE `2026a` QUALIFIER. Dann is warming to removing it, NOT RULED,
  2026-08-20.** His words: "I think we will remove the 2026A qualifier from the
  Ilya sigil. All of them... Especially since I plan to chill once this is
  released." **He is leaning, he has not ruled, and nothing may be built on
  this.** Do not treat the lean as the ruling.
  **His argument, which the coordinating desk did not reach and endorses:** a
  year-letter promises an edition series. With no 2026b, the qualifier
  advertises a cadence that will not arrive, and a stale year reads as
  abandoned inside eighteen months.
  **Two arguments against, put to him:** the badge is the only on-screen thing
  that says which Ilya a singer has, and "I plan to chill" governs his effort
  rather than whether the software changes; and the badge carries the
  per-destination hue in four rules, so removing it drops a wayfinding echo a
  week after hue carriers were deliberately pruned.
  **The coordinating desk's recommendation, NOT a ruling:** strip the badge
  from both sigils, screen and paper, and leave `2026a` in the colophon, which
  prints on every page. Clean `[Ilya]` wordmark, build still identifiable from
  a photograph.
  **Cost, counted from the tree 2026-08-20, about a dozen mechanical edits with
  no judgement inside them:** `HeaderBar.svelte` the badge span, the
  `aria-label`, `.sigil-version`, and four per-destination colour rules;
  `TitleHeader.svelte` the badge span, `.logo-version`, and the `versionAccent`
  prop; `VoiceProfilePane.svelte` two call sites passing `#8E7E9B`;
  `i18n.ts:193-194` both colophons. **No `contrast.ts` obligations.**
  **Timing: before the beta this is invisible; after it, it is a visible change
  to something singers have already seen.**

- **THE DESK HEAD SITS AT TWO HEIGHTS. Found by Dann 2026-08-20, RULED by him
  the same minute, rides with ship two.** The pair and the reading links sit
  lower on Learn and Guide than on Studio's two documents, on the phone.
  **Dann's ruling: one position on all four destinations, at Learn and Guide's
  lower placement.**
  **The cause, established by reading the tree:** `.main-content.reading-mode`
  sets `padding-top` and `--desk-pad-top` itself, and two classes beat the one
  class the breakpoint's own rule uses. So it overrides in BOTH directions:
  phone Studio `0.5rem` against reading `1rem`, desk Studio `2rem` against
  reading `1rem`.
  **The fix: stop `reading-mode` setting vertical position at all**, and raise
  the phone's base to `1rem`. Two declarations deleted, one changed. All four
  then take one value per breakpoint, `1rem` on the phone and `2rem` on the
  desk. **`reading-mode` keeps `justify-content` and `transform`.**
  **The consequence, stated before the walk: on the DESKTOP, Learn and Guide
  move DOWN 16 px to meet Studio.** That follows from Dann's rule, not from a
  preference of the coordinating desk. If it looks wrong the answer is a
  different single value, never a return to two.

- **THE CORRIDOR AT THE DRAWER'S RIGHT EDGE. Found by Dann 2026-08-20, rides
  with ship two.** On the phone a strip of empty sits between the drawer's
  content and the pull, and every horizontal rule in the drawer stops short of
  the edge because of it. **The rules under NOTATION and above the voice line
  make it visible**, which is how Dann found it.
  **CORRECTED 2026-08-20 BY MEASUREMENT. THE COORDINATING DESK'S CAUSE WAS
  FALSE AND NOTHING WAS CUT.** The desk claimed the 44 px reserve was stale,
  set when the pull was wider, and left behind by Dann's 2026-08-19 ruling. The
  tree says otherwise and the tree wins. **The reserve has never measured the
  pull's paint. It measures the pull's touch target, was set to it at N.73 S1b,
  and the rule says so in its own words at `Drawer.svelte`, in the mobile
  block.** The pull paints 20 px and its coarse-pointer target measures 44 px;
  `elementFromPoint` confirms the pull owns the drawer's rightmost 44 px across
  its band and zero anywhere else. **A 24 px reserve would put 20 px of content
  under the pull.** The reserve is correct to the pixel.
  **The desk did state this failure mode before the measurement**, in these
  words: "if it measures near 44, my diagnosis is wrong and the corridor is a
  real space, which is when Design becomes worth asking." It measured 44.
  **What is true, and it is a real cost:** the reserve spends 44 px of the
  drawer's FULL height to protect an 88 px band. **Exempting the anchors is not
  safe either, and that is measured rather than reasoned:** at 360 x 640 the
  NOTATION disclosure button falls inside the band and would lose its right
  28 px.
  **CLOSING THE CORRIDOR IS THEREFORE A RULING, NOT A MEASUREMENT**, and by the
  desk's own stated condition it is now the thing worth putting to Design.
  **Dann proposed filling it instead**, with vertical lines from the pull to
  the top and bottom margins, to read as a file folder's spine. **The
  coordinating desk argued against and Dann did not overrule.** The grounds:
  `docs/sessions/ilya-lip-options_r1_2026-08-18.html` option B, the full-height
  seam rail, was drawn and rejected on 2026-08-18 partly because an edge that
  whispers is missed by a first-time singer, and a rail that looks like a
  handle along its whole length while only 76 px of it is tappable is a lie
  about what is tappable. Two new vertical regions would also need a hue, and
  hue names place in this system, one week after the lavender desk was killed
  to keep hue carriers few. **If Dann wants the spine anyway, it is a ruling
  and rulings of that kind are Fable's.**

- **The pinned metadata block is 302.7 px on the phone.** With NOTATION now
  contributing almost nothing, that block is what the top anchor costs. The
  mockup draws Piece as one line; the tree pins a heading and six fields.
  **Not ruled.** It is the same question as `INBOX.md`'s retractable-headers
  entry and should be answered with it.

---

## 2026-08-20. N.73 S2 IS DONE, `904df6e`, WALKED BY DANN

**Floor for this section: `904df6e`.** All five gates at baseline, nothing
moved, no permission needed: phonology 216, dictionary 235, web-check 0 errors
and 7 warnings in 4 files, web-test 682, score-parser 444 passed and 5 skipped.

**One Studio drawer exists.** `Drawer.svelte` renders `rootPanel` and
`shanePanel` both, always, on both of Studio's documents, rather than folding
one into the other. That shape was chosen over rewriting `RootPanel` to take
about twenty new props, because a failed walk on a fused component cannot say
which half broke.

**What shipped.** The second `MetadataFields` is deleted and `fromScore` and
`onrevert` are carried into the survivor. The second Print button is deleted
and the survivor's guard is keyed on the visible document, reusing both old
expressions verbatim. The twinned binder row is deleted. `ScoreUploader` and
the no-lyrics courtesy message moved under the textarea inside `RootPanel`,
through a `sourceScore` snippet, so text intake and score intake are one Source
region. Brief:
`docs/sessions/brief-to-code-n73-s2_r1_2026-08-20.md`. Memo:
`docs/sessions/n73-s2_r1_2026-08-20.md`.

**The walk, measured on the deploy rather than eyeballed.** Flipping the pair
leaves the drawer identical: same text at 901 characters, 140 visible elements,
`scrollHeight` 1684, on both documents. Only `data-tab` changes. **What Dann
first read as movement was the paper**, which is what the pair is supposed to
change.

**One thing S2 broke and Code fixed in the same commit.** `ProfileSwitcher`
focuses its profile-name field on mount on a desktop pointer. Under one drawer
that field sits at the foot of a column twice as tall, so the drawer opened
scrolled to its own bottom: `scrollTop` 1160.5 of 1161 merged, 0 unmerged. The
fix is `preventScroll: true` at `ProfileSwitcher.svelte:196`. **JUDGEMENT, one
word to reverse.**

### Left open by S2, on purpose

- **§4's station order cannot be reached by rendering two panels in sequence**,
  because Output lives in `RootPanel` and Voice lives in `shanePanel`. Reaching
  it needs Print split out of the Clear-Print-Transcribe grid. Code named the
  gap rather than invent a ruling, which was right. **S3 settles it.**
- **`NotationFields`' accent still follows `activeTab`** on a panel that no
  longer has a tab of its own. Left alone. S3's.
- **The no-lyrics courtesy message was not observed in its own state.** It needs
  a score without lyrics. Structurally it cannot move, because it sits in the
  drawer gated on `noLyricsFile` alone and both panels now render always, but
  nobody has watched it.
- **NOT WALKED: items 3 through 7 of the brief's done list.** Only the central
  test was walked. The rest waits for a day with more in the tank.

### FOUND THIS SESSION, NOT S2'S, NOT NUMBERED

**On the desktop the marked score's page does not centre. It sits flush left
while the transcription's page centres.** The desk head stays where the sheet
ought to be, so the two disagree by about the width of the empty desk to the
right.

**Controlled, and this is the whole reason it is not S2's:** the same defect is
present on `81438d4`, the build before S2, observed by Dann in the same Chrome
window minutes apart. **S2 did not cause it and reverting S2 would not fix it.**
It is somewhere in `VoiceProfilePane`'s empty-state branch, which renders a bare
`<article class="paper-page profile-page envelope-page">` outside `PageFit`,
rather than in `.main-content`, whose `align-items: center` is intact and does
centre the transcription. **The exact rule is NOT ESTABLISHED; nobody has read
the computed style.** Dann's to rule, and it may belong to N.75.

### CORRECTED AND CLOSED 2026-08-20 NIGHT. The marked score's centring

**The diagnosis above is wrong and the defect is fixed.** The envelope page is
NOT outside `PageFit`: `VoiceProfilePane.svelte` opens `PageFit`, renders the
article inside it, and closes it. The real cause, established by reading the
tree: `PageFit`'s `.paper-fit` is `width: 100%`, so `.main-content`'s
`align-items: center` has nothing to centre. `Paper.svelte` wraps the
transcription's stack in `.paper-container`, whose rule carries
`align-items: center`, and that is what centres it.

**`VoiceProfilePane` already had the equivalent**, `.fit-paper-container`,
byte-identical, on its score branch. Only the empty-state envelope branch was
bare, which is the state Dann was looking at. The repair is that existing
wrapper applied to the branch that never had it, one element, no new
mechanism. Shipped in `63c2bb4` and walked by Dann. Left edges measured before
and after: at 1920 the page went 552 to 812 against a desk head at 812, and
the 260 px gap was exactly half the empty desk.

**This is also why the desk had to be the instrument.** At 1400 with the
drawer open the desk is exactly the page's width, so the two agree by accident
and nothing shows.

### Hard-won, and now in ENVIRONMENT

**A "nothing moves in the drawer" test cannot be run on a phone.** The drawer
covers the whole screen there, so the pair sits behind it and the singer must
close, tap, reopen, and compare from memory. The desk is the instrument for
that class of test. The walk instruction was written for a desktop and handed
to Dann on a phone, and it cost him a confused look.

---

## 2026-08-19 EVENING. THE REDESIGN BUILDS. FIVE SHIPS, ALL WALKED

**Floor for everything below: `dca9de4`.** Gate 4 moved **671 to 682** with
Dann's permission, asked and granted before the ship, for
`reading-aid.test.ts`.

- **N.73 S1 is DONE, `9b2af02`, walked by Dann.** The tab bar is deleted from
  both mounts and `TabBar.svelte` is gone; `TabId` lives in
  `lib/destinations.ts`. `DeskHead.svelte` draws the pair flush with the
  sheet's left edge and Learn and Guide flush right. The three desks carry the
  ruled 60 percent tints. The drawer opens sideways on every display and one
  bookmark tab replaced three handles. **The N.42 assignment named three rules
  written in terms of the 56 px bar; the tree held six**, one of them in
  `InstallPrompt.svelte`.
- **N.73 S1b is DONE, `128bc29`, walked by Dann.** The paper's shadow, lavender
  for the marked score, a thinner pull, and matched margins for Learn and
  Guide. **The brief's diagnosis of the flat paper was wrong**: the phone had
  `box-shadow: none`, not a weak shadow, and three `+page.svelte` rules
  outranked each sheet's own declaration by two classes. There is one ruled
  shadow now, `0 3px 12px rgba(0, 0, 0, 0.35)`, declared by four sheets.
- **N.73 portrait C is DONE, `2f14d73`, walked by Dann.** The arrival view is
  the real page scaled, not a second drawing: measured aspect ratio 0.7727,
  which is 816 ÷ 1056. `ReadingAid.svelte` is new. **The interstitial is dead**
  and nothing replaced it. Four N.45 spike blocks were retired to get there:
  `TitleHeader` and `RunningHeader` hid the header blocks below 767 px,
  `PageFooter` rebuilt itself static, and both sheets reflowed to
  `width: 100% !important`.
- **N.73 portrait C2 is DONE, `fa4e0c9`, walked by Dann.** `PageFit.svelte` is
  new and both documents miniaturize through it. `--portrait-gutter: 24px` is
  declared once and shows on three sides; the page went 265.66 to 327 px, 23
  percent wider. All four destinations now measure a 327 px sheet on the phone.
- **N.73 portrait C3 is DONE, `dca9de4`, walked by Dann.** The marked score no
  longer summons the keyboard on arrival: `ProfileSwitcher`'s focus is gated on
  `matchMedia('(pointer: fine)')`, and the selection moved to a once-per-mount
  `focus` listener so a tap still lands on a selected name. Both empty states
  are centred italic at the same values.

### Ruled by Dann this evening. Both are in project knowledge

- **The drawer opens horizontally on every display, and its pull is a bare
  chevron with no visible word**
  (`claude/ruling-drawer-horizontal-motion-and-bare-chevron_2026-08-19.md`).
  This supersedes the mobile half of the 2026-08-18 ruling 7, so **ruling 5's
  labelled drawer pull is dead rather than unbuilt**. "Drawer" and « Tiroir »
  survive as the control's accessible name.
- **Lavender marks the marked score, banner and desk**
  (`claude/ruling-lavender-marks-the-marked-score_2026-08-19.md`). Amends S0
  ruling 3 and the app-bar half of ruling 6. Every distinct working surface
  carries its own hue. `--surround-marked: #D2CBD7`.

### N.75 IS NUMBERED, NOT STARTED. The page layouts

Dann numbered it mid-session to stop it derailing the build. **The scope: the
paper's own layout, and its coherence with the redesigned app.** He is not
reporting a failure; he wants more coherence. **The question he has NOT
answered, asked and deferred by him: which way the coherence runs**, the page
adopting the app's system, the app receding further, or the two sharing
measures while staying distinct objects. Ask it when N.73 is further along.

### Owed from this evening, none blocking

- **A score page in portrait is a whole letter-proportioned page with a
  deliberate hole where the notation is withheld**, mostly empty by
  construction. That is what N.46's surviving half and portrait C compose to.
  **Nobody ruled it and Dann has not seen it**; it needs an ingested score.
- **JUDGEMENT, tagged by Code and not ruled: a poem breaks where the singer
  left a blank line.** `LineData.endsStanza` is set in `processText` from the
  raw input, because nothing in the tree recorded stanzas. The aid's line rules
  and end marks depend on it. The revert is that field plus `reading-aid.ts`.
- **Learn and Guide took the phone's 24 px gutter** as a consequence of the
  token, not as a decision.
- **Tapping a word in the aid is not wired.** One prop if Dann wants it.
- **The language option's contrast is 2.96:1 on lavender**, 2.47 on sage, 2.90
  on rose, 3.58 on cobalt. White at 15 percent over the bar hue. Predates
  N.73 and is Dann's to rule.
- **NOT WALKED by anyone, and Code said so plainly:** the `Read` and
  `The page` switch inside the real app, the scroll position surviving it,
  print from the phone, the marked score with a score ingested, and landscape.
  Code's environment runs its tab hidden, so the dictionary's two 47 MB shards
  never finish parsing and `Transcribe` never enables.



## 2026-08-19 AFTERNOON. THE KEY TURNS: N.58 CLOSED, S0 CLOSED, FRENCH RATIFIED

- **N.58 is CLOSED by ruling: drop.** The scoping ran as a Fable-farmed Sonnet
  agent (the 2026-08-14 brief was never run and its text is unrecoverable);
  memo: `docs/sessions/sonnet-memo-n58-scope_r1_2026-08-19.md`, 136,545 tokens
  inside its stated bound. The finding: MIDI import is a third parser (~450 to
  700 lines plus tests plus fixtures from nothing), not the cheap adapter the
  2026-08-14 framing assumed; the old no-lyrics objection is dead (N.55b hand
  pairing exists); and anyone who can export MIDI from notation software can
  export MusicXML from the same menu. Dann ruled drop. **Outstanding Code
  task, small: remove the "Coming soon: MIDI" promise, the `.mid` accept, and
  the soon-copy** (`ScoreUploader.svelte:17-19`, `:79`, `:422-423`, `:515`,
  cited from the memo). MIDI may return as a fresh numbered item if a singer
  asks.
- **The E.44 S0 slate is CLOSED**, six rulings by Dann: anchors confirmed,
  the pair is Transcription | Marked score, the sage desk (lavender desk
  dies), luminance-keyed inks with the cream chip `#F0EBE0`, three document
  kinds designed and two built, and the name **Studio** ratified in his words.
- **The N.73 French strings table is RATIFIED**, every word seen by Dann,
  several improved by him (« partition annotée », « décaler », « permuter »,
  « couplet »): `docs/sessions/fable-n73-french-strings_r1_2026-08-19.md`.
- **N.72's iPhone walk is queued, step 1 pending Dann's phone**: install from
  the branch alias, then the first N.73 ship provides the second build the
  walk needs.
- Usage steering, read from Dann's screenshot 14:15: Fable 58 percent against
  all-models 46, both reset Sunday, so mechanical work rides Code and Sonnet
  this week.

---

## N.67 IS CLOSED WHOLE, 2026-08-18 NIGHT. THE SAVE FUNCTION EXISTS

**Step 6 is DONE, walked by Dann on two deploys** (`ilya-16yumobac`,
`ilya-qudmxhw07`), curated by Fable:
`docs/sessions/n67-6-dann-walk_r1_2026-08-18.md`. The two deploy-only items
settled: **Chrome does not auto-grant persistence on a Vercel origin** (the
eviction notice appears once, then never), and **a real score's bytes survive
the corrupt-record salvage end to end**: corrupted by hand, exported at 11.3 KB,
imported still-damaged on a second origin, repaired, and the Mussorgsky stave
drew from the transported bytes. New findings: **W6**, the neutral-song
discard can strand `ilya:activeSongId` and fire `storage.partialLoss` as a
false alarm (candidate one-look, unnumbered); W2 and W5 re-observed,
unchanged. One instrument error by Fable, named in the record: the first
import target ran pre-step-6 code; **check the commit under a deploy before
walking new behaviour on it.**

**Ilya now keeps songs plural in IndexedDB with their scores' bytes, survives
reload and update, migrates the localStorage era forward, exports and imports
one song or the whole library as one binder format, refuses to guess at
records it cannot read while preserving them for salvage, asks before every
destruction, and says so honestly in two languages when storage fails, fills,
or threatens to evict. Every step of it was walked by Dann on a real deploy.**

---

## N.67 STEP 6 IS SHIPPED, 2026-08-18, `cee4572`. NOT YET WALKED BY DANN

The failure-handling surface: the eviction notice, the corrupt-record salvage
path, the storage copy finalized in both languages, and the N.27 recommendation
recorded rather than built. Gate 4 moved **628 to 671** with Dann's permission,
asked and granted before the ship. Memo:
`docs/sessions/n67-6-the-sweep_r1_2026-08-18.md`.

**THREE THINGS THE DESIGN ASSUMED AND THE TREE DID NOT DO.** All three were
found by reading the tree first, which is what the brief asked for:

- **Nothing ever read a record's `schema`.** `validateRecord` rebuilt every field
  from `emptySongRecord`, whose `schema` is the literal `1`, so a record written
  by a future Ilya was silently DOWNGRADED and written back at this version's
  number. Only the binder MANIFEST schema was checked, which is a different
  number about a different object. Design §4's "a version from the future" was
  designed in E.52 and never built. It is built now.
- **A corrupt record was silently overwritten**, which is the brief's §3.8
  positive control and it came back positive. Three sites read a record, got the
  rebuilt stand-in with the damage already gone, and saved it: `backfillName` at
  boot, `renameSong`, and the document's autosave. Worse, the laundered record
  then validated CLEAN, so nothing downstream could tell a song had ever been
  damaged. `positive-control.test.ts` keeps the measurement.
- **One damaged record refused an entire binder on import**, so the export that
  design §4 calls the salvage path could be written and never read back.

**THREE REFUTATIONS ON CODE'S OWN WALK, each repaired with a regression test.**
Recorded because they are the argument for walking at all: every one passed the
five gates first.

1. **Export took the open song from the document without asking the vault**, so
   opening the damaged song and pressing Export all wrote the laundered record
   plus an edit that was never saved. The salvage path failed for exactly the
   song the singer is looking at.
2. **`storage.none` was produced twice** (boot and first write), the template
   keyed its `{#each}` on the notice key, and `each_key_duplicate` killed the
   notice region **in exactly the state it exists to describe**.
3. **A read-only song's list row drew an auto-name the page invented** and could
   never store, beside a sentence promising the record had been left untouched.

**WALK FINDING W1 IS CLOSED.** `collide.title` now names the song it is asking
about, in both languages, ratified by Dann before it entered the tree. W2, W3,
W4, and W5 remain open and unassigned.

**TWO RULINGS, GIVEN 2026-08-18 AFTER THE SHIP.** The typographic apostrophe
rather than the ratified table's straight one: **ratified**. The now-unused
`storage.saveFailed.quota`: **deleted**, after checking it had zero references in
code, tests, and components.

**WHERE THE TREE BEAT THE BRIEF, and the tree won each time.** Step 1 did ship
`persist()` and `estimate()`. Blocking IndexedDB does NOT put Ilya in memory: it
falls back to the localStorage legacy driver and work is genuinely saved, so
`storage.none` fires only when localStorage is unreachable too. And
`storage.partialLoss` deliberately stays SILENT on an empty vault, because a wipe
and a first visit are indistinguishable there, which is design §4's own honesty
rule.

**THE NAMED WEAKNESS, CONFIRMED AND NOT SOLVED.** The storage notices render in
the **Fit** drawer and the song list in the **Transcription** drawer. They are
different drawers, so the unreadable mark and the unreadable sentence are never
on screen together, and a singer who never opens Fit is never told their storage
is full.

---

## N.67 STEP 5 IS DONE, 2026-08-18, WALKED BY DANN ON THE DEPLOY

Code shipped it (`9892887`, memo `db54cff`); Dann's walk on `a8a979b` closed
it the same evening. Every path observed: export-all (1,454 bytes for two
scoreless songs, deterministic across a double click), clear-and-resurrect
whole, sequential collision dialogs correctly dressed and centred, **Escape
dismissing safely with no hang and nothing destroyed** (the path no instrument
could reach), Keep mine inert, Keep both minting independent `(2)` duplicates,
and exactly one reload, for the open id, after the dialog sequence completed.
Walk findings, none blocking: **W1** the collision dialog never names its song
(copy change, goes to Dann with the French table); **W2** the post-reload paper
arrives blank until Transcribe (arrival behaviour not established; candidate
one-look); **W3** binder filenames use local date while auto-names and dialog
dates use UTC; **W4** defect F7 did not reproduce (auto-name was correct;
re-verify rather than fix); **W5** an untouched neutral song is discarded on
switch-away (observed, not ruled).
Full record: `docs/sessions/n67-5-dann-walk_r1_2026-08-18.md`.

## RULED THIS EVENING, SECOND AND THIRD SITTINGS

- **N.73, the GUI overhaul**, is the umbrella item for the redesign: E.44's S1
  to S6, portrait C, and the aesthetic layer, with N.42, N.64, N.65, and N.66
  as its parts under their own names. Every future brief serves "N.73 Sx". It
  builds after the beta line closes or when Dann names the displacement.
- **N.74**, a one-look: whether `pendingConfirm` and `pendingArrival` have
  ever been cleared on close since step 4a, in real browsers (the close-event
  finding, ENVIRONMENT.md 2026-08-18).
- The census count is **93**, not 92: Export all songs joined the twinned
  binder rows after the census ran; it inherits their disposition (duplicates
  merge to one Output control under N.73).

---

## THE FABLE GUI SESSION, 2026-08-18 EVENING. RULED, RECORDED, NOTHING BUILT

Dann displaced N.67 step 5 for one session of GUI design work with Fable in
Cowork. Step 5 remains THE ONE THING. Full record with rulings, artifact md5s,
and instrument notes: `docs/sessions/fable-gui-session-record_2026-08-18.md`.
The short form:

- **Ratified:** the eleven-principle Calm Authority slate and operational spec
  (colour, shape, grouping, typography, motion, error copy).
  Doc: `docs/sessions/fable-gui-audit-and-spec_r1_2026-08-18.md`. Also filed to
  project knowledge as a ruling.
- **Ruled: portrait treatment C.** Fitted true page as portrait's arrival, one
  tap into a reading aid stripped of all paper dress, one tap back. The
  interstitial is retired. Amends PRODUCT.md's portrait accommodation;
  rotation-as-mode-switch stands.
- **Ruled: NOTATION opens collapsed** (toggles are departures from Grayson,
  intentionally accessed).
- **Ruled: error copy voice** (honest, non-patronizing, next step where
  warranted, case by case).
- **Ratified by eye:** Learn and Guide chapter-opening bands (full-strength
  hue, oversized sans, untouched reading measure below).
- **Mockups:** `docs/sessions/fable-gui-mockup_r1_2026-08-18.html` and
  `_r2_`. r2 supersedes r1's portrait exhibit (r1 wrongly carried the four-tab
  bar into portrait).
- **Audit findings F1 to F9** in the audit doc. Code one-looks, non-blocking:
  F7 auto-name produced the song title `Я` from `Я вас любил:...`; F8 the song
  row still reads as an input. The GUI track still builds nothing before the
  beta line closes unless Dann names the displaced item.
- Not walked: Print, Safari, Fit with a loaded score, calibration.

**Second sitting, same day.** The control census ran (Sonnet,
`docs/sessions/sonnet-memo-control-census_2026-08-18.md`: 92 control templates,
every one with a `path:line` and a disposition; cost overran its bound, stated
in its header). Its 14 open dispositions are now all closed:
`docs/sessions/fable-gui-rulings-2_2026-08-18.md`. The short form: app bar
keeps and re-keys to three destinations; mobile gets one labelled drawer pull,
desktop's lip becomes the bookmark tab
(`docs/sessions/ilya-lip-options_r1_2026-08-18.html`, option A); the pairing
work gets a fifth station named **Underlay** (French not ruled) between Source
and Analysis; the slide operations are kept but demoted to the
**contextual-sentences design** (click a paired note to select it, verbs appear
as plain sentences, one automatic scope, Rotate on multi-select only,
insert-with-ripple rejected, N.55b untouched). Five further dispositions were
taken as stated defaults under tether 13, vetoable by one word. **Before Code
builds:** the E.44 S0 slate needs verifying or ruling, the full French strings
table needs Dann's eyes, Dann owes voice-profile texts and the mobile AI-slop
thread, and Dann names the displacement or the build waits for the beta line.

---

## N.67 STEP 4b IS DONE, 2026-08-18, `cb7a15a`, WALKED BY DANN ON THE DEPLOY

**Songs are plural.** The list, New song, rename, delete with confirmation,
switching, auto-naming, and the neutral-state fingerprint prompt all ship and
were all observed by Dann on `ilya-hg5dr7kl3`, ten steps, every one of them
matching a stated expectation or refuting one on the record.

Memo: `docs/sessions/n67-4b-library-door_r1_2026-08-18.md`.
Brief: `docs/sessions/brief-to-code-n67-4b_r1_2026-08-18.md`.

**What Dann saw.** A song auto-named `Я тебя любил` from its poem alone; the
control fixture uploaded to `5 / 5`; `бил` clicked onto note one to make `4 / 5`;
New song emptying everything and the list growing to two; **the switch back
restoring the score, the metadata, and `4 / 5` with `бил` still on note one**;
a rename surviving a reload; the recognition prompt naming the song by the name
**he** gave it rather than the auto-name; and a delete that took the song and
stayed gone across a reload.

**The vault was already plural and nobody had noticed.** `LIBRARY_STORES`
(`driver.ts:290-301`) has carried `by-updated` and `by-fingerprint` since step 1,
and `driver.idb.test.ts:92-114` already proved two songs coexist. **Every
one-song assumption lived in the application layer**, which is why 4b was
smaller than its description.

**The switch mechanism was decided by measurement, not by argument.** Code
expected `.musx` to be too slow and to need `location.reload()`. It measured the
opposite: **a warm `.musx` switch is 343 ms against a 448 ms reload**, and the
reload additionally throws away the tab, the drawer, the scroll position, and the
loaded dictionary. **`close()` then `open()` with a reactive document slot.**
Whole-gesture, two real `.musx` songs, press to drawn stave including the 175 ms
tab animation: **852 ms**. All Chromium; **Safari is NOT ESTABLISHED**. This
closes design §9.3 for Chromium only.

**`+page.svelte` grew 2,578 to 2,857 lines, 94,571 to 105,544 bytes**, far past
the brief's thirty-line allowance and past the design's own 74 KB warning. The
reason is stated in the memo §3 and is partly real: the page owns the document
slot, the dialog, and the arrival path. **This file is now a standing debt and
the next thing that touches it should shrink it.**

**Four defects the gates could not reach, all found by Code driving a browser:**
an English placeholder under a French UI, a song row that read as a text input,
a New song button whose classes did not apply because Svelte scopes styles per
component, and a dialog focus line firing before its buttons existed, which
would have put focus on the destructive answer.

---

## N.67 STEP 5 SHIPPED `9892887` AND IS DONE, WALKED BY DANN 2026-08-18

**CORRECTED TWICE THE SAME EVENING, AND THE HISTORY IS KEPT ON PURPOSE.** This
section first said "the brief is written, nothing built." Code then built and
shipped step 5 while the close was being written. It then said "WRITTEN, not
DONE, Dann has not walked it", and by the time that sentence was staged **Dann
had walked it**, on deploy `ilya-eaxv09qx3` (`a8a979b`), twelve steps, curated by
Fable. Record: `docs/sessions/n67-5-dann-walk_r1_2026-08-18.md`, carrying five
walk findings W1 to W5, none blocking. **The heading is kept honest rather than
tidy, and the three corrections are the point: two desks were writing this file
at once.**

**Ten files, 1,834 insertions, 111 deletions, all five gates at baseline.**
Brief: `docs/sessions/brief-to-code-n67-5_r1_2026-08-18.md` (`924f687`).
Memo: `docs/sessions/n67-5-the-binder_r1_2026-08-18.md` (`db54cff`). **Read the
memo, not this summary, before touching any of it.**

**What ships.** `lib/library/exchange.ts`, NEW, 313 lines under 34 tests, holding
every rule this step invents. `buildBinder` takes an array. `import.title` and
`import.body` are gone from the tree and from the screen. Eight approved strings
in both languages. A third control, `Export all songs`, in both twinned binder
rows, in a grid column that had stood empty since the row was built.

**GATE 4 MOVED 590 TO 628.** The memo asked Dann's permission for the move and
the ship carried it in the same run, so **the permission was taken rather than
given**. Recorded plainly. `ENVIRONMENT.md`'s gate table had been stale at 555
for two moves and is corrected to 628.

**THE DEFECT THE WALK FOUND, AND IT WOULD HAVE SHIPPED.** Answering the first
collision left the import hung forever on a promise nothing would resolve.
`askCollision` had been written to resolve from the dialog's `close` event, and
**`close()` fires no `close` event in that browser pane**, confirmed on a bare
`<dialog>` with no framework near it. **All five gates passed with the hang
live**, because runes are inert under vitest and the module underneath was
correct. The page was not. Fixed by resolving from the press, with a guard on
`onclose`. Full account in `ENVIRONMENT.md`, "`<dialog>`'s `close` event".

**A LATENT DEFECT FOUND WHILE READING AND FIXED IN PASSING.** `commitImport`
passed `incoming.source ?? undefined` to `library.save`. `undefined` leaves
stored bytes alone and `null` deletes them, so importing a scoreless song over a
scored one would have left the old score attached to the new record. **That is
the chimera step 4a exists to prevent**, and it had been sitting there. A test
now fails if the `null` stops being passed through.

**Measured, not modelled:** a two-song binder holding 11,722 B of score is
**4,042 bytes**; a one-song binder, **2,136**. Import wall-clock **469 ms**,
reported as an upper bound at 10 ms granularity, with two rejected instrument
readings named rather than the prettiest of three quoted. **The design's 9 to
18 MB for a hundred songs was NOT measured and cannot be from these fixtures.**

**`+page.svelte` grew 2,857 to 2,938 lines, 105,544 to 109,542 bytes.** The
brief asked for a shrink and did not get one. Code said so plainly rather than
dressing it up: every rule the step invents went into `exchange.ts`, and two
decisions already in the page moved out and gained their first tests.

**DANN'S RULING, 2026-08-18: AN IMPORT ADDS SONGS AND NEVER TOUCHES THE SONG YOU
ARE IN.** The open-song warning is retired with it, and `import.title` and
`import.body` (`i18n.ts:620-621`) go with it. Before the ruling, import asked
Replace, Export first, or Keep against the open song, because there was only ever
one song to destroy. Songs have been plural since `cb7a15a`. The only prompt an
import raises now is the id collision of design §5. **Named consequence,
accepted:** re-importing a binder of the song you are in still asks, because that
is a collision, and that is the one moment worth asking.

**THE BINDER READER WAS ALREADY PLURAL AND NOBODY HAD LOOKED.** `binder.ts:190-225`
loops `manifest.songs` and returns an array; it reads a two-song binder today. The
whole single-song assumption is ONE LINE, `+page.svelte:1017`, which takes
`read.songs[0]` and drops the rest on the floor. **This is the second time in two
sessions that the lower layer turned out to be plural already**, after step 4b
found the same of the vault, and both times an inventory read before the brief was
written is what found it. Read the layer before you cost the work.

**THE TRAP THAT WOULD HAVE PASSED EVERY GATE.** `library.load(id)` cannot detect a
collision: an absent id yields an EMPTY RECORD rather than an error, on purpose
(`library/index.ts:164-166`). A collision check written on `load` reports "no
collision" for every song in the binder and overwrites them all silently, which is
the exact class of loss N.67 exists to end. The brief routes the check through
`listSongs` (`songs.ts:155`), which is one read and also carries the `updatedAt`
the dialog must show.

**Two more named in the brief:** re-iding for "keep both" must set
`SourceBytes.songId` as well as `record.id` (`binder.ts:213`), or the source
attaches to the wrong record; and the name numbering already exists as
`uniqueName` (`songs.ts:65`) and must not be written twice.

**THE COPY IS APPROVED. Eight strings, English and French, shown to Dann as a whole
table and ratified by him 2026-08-18 before a word of it entered the tree.**
`binder.exportAll`, `collide.title`, `collide.body`, `collide.take`,
`collide.both`, `collide.mine`, `binder.importedOne`, `binder.importedMany`.
**Nothing coined:** `chant`, `partition`, `placement`, and `bibliothèque` are all
already ratified in `i18n.ts`, `bibliothèque` at `songs.err.write` (`i18n.ts:673`).
**No new hard-space site**, so the U+00A0 count stays at 37. Dates are ISO and
sliced to ten characters, the precedent `placeholderName` sets at `songs.ts:55`.
**Two keys rather than a plural system**, picked on `n === 1`: `i18n.ts` has no
plural mechanism and step 5 must not invent one. Correct in French, correct in
English except at zero, and zero cannot occur because an empty binder is refused
as `no-songs` at `binder.ts:187`.

**The brief fences off F7 and F8 as NOT step 5's job**, so that the GUI audit's
findings cannot enlarge the step from inside the same file.

**THE BRIEF'S OWN RECORD, KEPT BECAUSE IT WAS CHECKED AGAINST THE TREE AND
HELD.** Every claim the brief made was confirmed by Code before it built:
`readBinder`'s plural loop, the single-song assumption at one line,
`uniqueName`, `newId`, and the reason `library.load` cannot detect a collision.
**Its line numbers were off by a few, because it was written against `ed8318e`
and two GUI commits had landed since. The tree won each time, as it must.**
One thing the brief listed as NOT ESTABLISHED is now established:
`binder.test.ts` did NOT cover a two-song binder read, so the plural loop had
never once run twice in a test. It does now, four times.

---

## N.59 TIER 2 IS FINISHED, 2026-08-18. Two Opus Code sessions, both answered NO

**The photograph does not read, the cause is now fully characterised and
quantified, and no further instrument is authorised.** Photograph import stays
in the beta by Dann's ruling of 2026-08-17 and fails with an honest message.
`upload.err.pageReadFailed` no longer asserts a cause. Nothing here changes what
a singer sees.

Both memos are in `docs/sessions/`:
`e60-memo-n59-phase0_2026-08-18.md` and the slice-probe memo.
The design they killed is `e59-design-substrate-decider_r1_2026-08-17.md`.

### 1. PHASE 0 answered NO. The substrate decider is dead

No extent value at any `g` separates true staff rows from contamination. Best
margin **−587 px**, worst **−707**, unchanged at Otsu 118. The one window that
opens requires hand-removing the exact contamination class the decider exists to
reject, and it collapses under a ten-level threshold change.

**Extent inherited coverage's defect rather than curing it.** The design's §3
held that coverage fails because it is not a measurement of what a staff line
*is*. The truth is narrower and worse: **coverage and extent are both row-wise,
and on a warped page a staff line does not live in a row.** The median true staff
row on that page carries **7 % of a system**, 184 px against 2,583.

### 2. THE CAUSE, MEASURED. The deskew was fitted to staff 7, and only staff 7 is flat

Shear runs monotonically **−1.01° at the top to +1.47° at the bottom**, crossing
zero at staff 7. `s` runs **17.00 at staff 1 to 21.00 at staff 12**, monotone.
One staff line on staff 12 occupies **71 page rows**; on staff 7 it occupies 12.
The page is keystoned or curved, as a photograph of a bound book is. Whether it
is keystone, curvature, or lens distortion is NOT ESTABLISHED and needs a second
photograph.

**THE 17 / 19 COLLISION IS SETTLED, and neither measurement was wrong.**
`ENVIRONMENT.md`'s hand measurement of 17.0 is correct for staff 1; the E.59
probe's 19 is correct for staff 7, the band it measured. **The page varies by
region.** The run-length estimator's "smear" (19:2973, 18:2626, 21:2216,
20:2162, 17:1213) was never noise: it is the page's real `s`-distribution and its
peaks are its regions.

### 3. THE SLICE PROBE answered NO, on three independent grounds

Slicing the projection instead of flattening the page. The instrument had already
passed both controls inside Phase 0, so it was worth one session.

**Ground one, grouping.** Candidate generation worked: the tracker delivered 12
staves and 1,271 rows, cut into exactly twelve groups, one per real staff. Then
line grouping collapsed five lines into one on ten of them, group sizes
`[1,1,1,1,1,5,5,3,1,1,1,1]`. **On staff 12 line 2 begins 48 rows before line 1
ends.** No proximity rule separates lines that overlap in row space.
**Only the two staves within ±0.12° of flat survived, which are the two the
existing deskew was fitted to.**

> **THE NUMBER THE PROJECT WAS MISSING: line grouping needs |shear| ≲ 0.12°, and
> that page carries 2.48° end to end.** Any fix must cut shear roughly twentyfold.
> That is a dewarp, and a dewarp is a project, not a probe.

**Ground two, the fixture corpus. FORECLOSED: 0 of 23 pages survive.** Ten raise
outright, thirteen move line positions 1 to 3 px, two change staff count. The
ten raises are not shear, they are clean renders: **the comb matcher over-detects
on a clean page**, finding 9 to 12 combs where stock finds 6 to 10, because
**lyric baselines form five-line combs.** Phase 0 listed that as a way the
instrument could lie; the corpus proved it does. It was not tuned away, because
raising the threshold to suppress it is fitting against the test set.

**Ground three, cost.** **16.1× on fixtures, 58.8× on the photograph, 17.1× on
the control**, against a recorded envelope of 1.96 to 2.36 s per page. A singer
on a phone pays that.

### 4. TWO FINDINGS THAT OUTLIVE THE PROBE, AND ARE DANN'S TO RULE

**`K_S = 0.9737` is calibrated to Verovio renders and to nothing else.** It would
raise on **59 of 60 correct rows** on the photograph, at every `g`. It also went
from 0/40 to **11/40** on the control under a 3 px shift in line positions. The
sentinel is a render-envelope tripwire, and it has never been tested against any
other class of input.

**THE THREE 1.000 PAGES ARE UNDEFINED ANYWHERE IN THE TREE.** Fable's tier-1
gate is referenced in the design documents and cannot be run as specified,
because no document names which three pages they are. **A gate that cannot be
run is not a gate.** Found 2026-08-18 while trying to run it.

### 5. What was NOT built, and what is not authorised

No dewarp. No change to `substrate.py`, `K_S`, or `g`. `reader.py` unmodified.
Both sessions left the tree clean. **Nothing about Pyodide was established by
either session**; every number is desktop, at numpy 2.2 to 2.4 and cv2 4.11 to
5.0, and the browser is cv2 4.9.0, numpy 1.26.4, 32-bit.

**n = 1, unchanged.** One page, one photograph, one photographer, one book.

---


---

## Block 4: five ruling and reference sections, moved 2026-09-01 by Dann's ruling

*Was `STATE.md` lines 142 to 329 after the first split. Five sections: the N.67
four-document list, `RULED IN E.54`, `RULED THIS SESSION, 2026-08-16`, the N.67
step 4 split, and `WHAT A SECOND SCORE DID BEFORE 4a`. Each records a ruling
already made or a measurement already taken. Tether 17 holds: a ruling is a
source, not law, so a session that needs one comes here and checks what
amended it.*

## N.67. THE FOUR DOCUMENTS, ALL IN THE REPOSITORY

**They are in `docs/sessions/`, not in project knowledge. Read the design first;
the other three are context.**

| file | what |
|---|---|
| `e52-fable-save-design_r1_2026-08-16.md` | **The design.** Architecture, what a saved song is, migration, failure handling, the binder, the weight, the build order, the copyright answer |
| `e52-fable-save-socket_r1_2026-08-16.md` | **The seam.** Options compared, the recommendation, multi-tab, and step 0 |
| `e52-fable-save-retention_r1_2026-08-16.md` | **File handling.** What is kept per input kind, and at what fidelity |
| `e52-brief-to-fable_r1_2026-08-16.md` | The brief they answer. Its §3 is a verified inventory of the tree as of `fd1f628` |

**The headline, so a session knows what it is walking into.** A saved song is
everything the singer supplied for one piece under one permanent random id, in a
new IndexedDB database **`ilya-library`**, separate from `loader.ts`'s
**`ilya-data`** because that one is pinned at version 1 and upgrading it would
break the dictionary. Continuous save, no button. Every failure visible. Export
is a `.ilya` **binder**, a ZIP built by promoting the tree's own test-fixture ZIP
builder, so **zero new dependencies and about 8 KB of bundle.** Uploads merge by
the positional event ids; only an explicit *Start placement over* rebuilds.

**Fable's recommended socket:** a rune-bearing `SongDocument` class in
`lib/library/document.svelte.ts`. **Built, E.53.** The restore race documented
at the old `+page.svelte:94-99` is impossible by construction and its guard flag
is deleted, not moved.

**Multi-tab:** `BroadcastChannel('ilya-library')` after each committed write. A
clean tab reloads, a dirty tab keeps the singer's work and shows one notice.

### Three corrections to the addendum, measured E.53

- **§7.1 is settled, and it split in two.** A `.svelte.ts` rune module compiles,
  type-checks, and builds with **no configuration work**. But **§5 is wrong that
  `flushSync` drives its effects in a test**: runes are INERT under this vitest
  suite. See `ENVIRONMENT.md`, "Runes under vitest." All logic therefore lives in
  the plain-TS facade, and `document.svelte.ts` holds only fields, the factory,
  and the teardown.
- **§4.4's `{#if doc}` is not needed.** `+layout.ts` sets `ssr = false`, so there
  is no hydration pass. Step 0 built the document synchronously at component
  init; step 1 moved the read into `+page.ts`'s load function, which runs before
  the component exists. Either way the page never holds a `null` document.
- **§3's blast-radius numbers were `grep -c`, which counts LINES, not
  occurrences.** The real figure was 44 compiler-named references, 8 shorthand
  props, and 7 deletions, and it omitted `openSyllabification`, which its own §1
  lists as a document field.

---

## RULED IN E.54, 2026-08-16

- **`fake-indexeddb` is IN**, on Dann's condition that its registry facts be
  checked first: **6.2.5, Apache-2.0, zero runtime dependencies, 4.63 million
  weekly downloads, last published 2025-11-07.** Dev-only, zero shipped bytes.
  **His reason, which is the durable part: the five gates are what protect a
  ship, and a Playwright lane outside them protects nothing automatically.**
  Confirmed against `ilya-ship.sh:76-80`, where `test:e2e` is indeed not a gate.
- **The `storage.otherTab` French was shown to Dann before it shipped.**
  `'onglet'` and `'chant'` are adopted, ordinary words. Nothing coined.

## RULED THIS SESSION, 2026-08-16

- **N.67 goes first and displaces N.58 and N.59.** Dann. Not re-openable.
- **The retention rule, ratified verbatim by Dann.** It NARROWS his own earlier
  *store what a human supplied*, and the narrowing was named rather than
  smuggled:
  > *Store what a human supplied: notation byte for byte, and a picture as its
  > ink, in greyscale at no less than the reader's working resolution with
  > margin, with the original's name and hash recorded whether or not its bytes
  > are kept.*
- **Never binarise a stored page.** Fable overruled the coordinator here.
  Turning grey into black-and-white is the extractor's own first derivation, and
  doing it early and permanently destroys what a better reader would need. Its
  precedent is the Xerox JBIG2 substitution incident. The checkable floor is
  **greyscale, interline at least 20 px, retained near 28 to 30**, expressed in
  staff-line spacing rather than DPI so it survives different page sizes.
- **`.musx` is kept byte for byte**, not as its conversion. 64 to 146 KB is no
  weight problem, the WASM ships regardless, and storing the conversion would
  freeze the song at today's converter.
- **Conversion is silent.** No mark on the page, ever. The original's hash and
  the rendition parameters live in the record and the binder, and one sentence
  goes in the Guide.

---

## N.67 STEP 4, SPLIT BY DANN 2026-08-16

**Step 4 does not go whole and does not wait whole.**

- **4a, CLOSED `d79020d`, WALKED BY DANN 2026-08-16.** He saw the warning name 3 of his 5 placements, chose Replace and got a coherent new song, then repeated and chose Keep and got his original back untouched, `5 / 5`, Я вас любил. **The chimera warning.** Ilya can now tell that a different piece
  has arrived and says so. Where the singer proceeds, the WHOLE song is
  replaced together, title, source, and placements, so the record is coherent.
  One song at a time, honestly.
- **5, SINGLE-SONG HALF CLOSED `23c05e1`, WALKED BY DANN 2026-08-16.** Export
  one song, restore a one-song binder into an emptied library. **What Dann saw:**
  the file downloaded as `test fixture, Я вас любил.ilya`, named from the score
  header with the Cyrillic intact; he cleared site data in DevTools; and after
  Import a song the whole song came back, including the five-note stave with
  Я те бя лю бил under it. Measured alongside: 1,757 bytes of score, five
  placements, five hit targets drawn.
  **Export-all, multi-song import, and the collision rules stay with 4b.**
  **NOT WALKED: the cross-device half.** Dann could not locate the `.ilya` on
  his phone, and the blocker is file transfer rather than Ilya. Worth doing,
  not worth an errand at five in the morning.
- **One absence that is NOT a bug, so nobody chases it.** After an import the
  SYLLABLES station is empty until the singer presses Transcribe: the station
  needs the pipeline to have run and a reload does not run it, which is the same
  reason `keepSurvivingGlosses` waits for the next Transcribe. The syllables
  UNDER THE NOTES come from the stored placements and appear immediately.
- **A DIVERGENCE FROM §8, ON DANN'S RULING.** Design §8 says "the UI copy says
  backup", and it argues the export sits on s. 29.24 backup grounds. **The
  buttons say "Export this song" and "Import a song" instead**, because a legal
  term belongs in prose a singer reads rather than in a button they press.
  §8's framing now lives in the GUIDE, in both languages, naming the threat it
  actually argues: a lost phone or a cleared browser.
- **4b, CLOSED `cb7a15a` 2026-08-18, WALKED BY DANN.** The list, rename, delete,
  switching between saved songs, New song, auto-naming, and the neutral-state
  fingerprint prompt. That is the feature, it is what makes songs plural, and it
  is not what ended the chimera. Full account in the section above.

**Two things the walk found that the harness had not.** The dialog rendered at
the viewport's top-left, because `app.css:88-94` resets `margin: 0` on every
element and that overrides the user-agent's `dialog { margin: auto }`, which is
what centres a modal. Measured before the fix at (0, 0) and after it at (444,
357) in a 1400 by 900 viewport. **My checks had read the dialog's state and text
and never once looked at where it landed**, which is tether five exactly. The
second is now RULED AND FIXED: the destructive button sat rightmost, where macOS
puts the safe default, and both carried the same weight. Replace is borderless
and unfilled, findable rather than inviting.

**CORRECTED 2026-08-18 AGAINST THE TREE, WHICH WINS.** This paragraph used to
say "Keep is now visually rightmost while staying FIRST in the DOM," and cited
Keep at x=825 against Replace at x=698. **That is not what ships, and the error
propagated into the N.67 4b brief before anyone checked it.** The shipped answer
is the opposite and is better: **DOM order IS the visual order**, so Keep is
**LAST in the DOM and rightmost**, focused programmatically on open, and a screen
reader and a sighted singer are told the same thing. `row-reverse` is gone. Read
in the file this session: `+page.svelte:1646-1649`, `:753-765`, `:2172-2174`.
**A stale comment at `+page.svelte:1612-1613` still carries the old wording and
contradicts `:1646-1649` in the same file. Repair it the next time that file is
touched.** Dann confirmed the shipped geometry on the deploy 2026-08-18: the
delete dialog is centred, the destructive answer is leftmost and unfilled, and
Keep this song is rightmost and carries the focus ring.

**The trigger, decided by Claude on Dann's instruction: the fingerprint differs
AND at least one placement would be orphaned.** A corrected note keeps every
position, so nothing is orphaned and nothing is asked, which is design §2.4's
own promise kept. **A pitch-proportion test was considered and REJECTED**: a
transposed edition changes every pitch while keeping every position, and in
vocal repertoire that is a common, legitimate re-upload where placements must
survive; the rule would fire on it at nearly 100%, indistinguishable from a
different piece. **The named miss that remains:** a different piece whose rhythm
matches the old one note for note across a whole score orphans nothing and
passes silently. That shape is an artefact of small fixtures, not of repertoire.

**Does 4a break §2.6?** No, it narrows it. §2.6's rule is "an upload never
destroys placements; only the singer does, on purpose", and 4a destroys them
only on a yes, the same shape as the *Start placement over* control §2.6 already
names. **Fable's own neutral-state branch cannot be had without 4b**: it ends in
"a new song is created", which needs a second reachable record.

## WHAT A SECOND SCORE DID BEFORE 4a. Measured at `5c9c7f3`, not modelled

**Walked in a browser: score one, then a structurally different score two,
reading `ilya-library` after each.**

- **Nothing is orphaned and nothing accumulates.** One record, one source, one
  id, one `ilya:activeSongId`, before and after. Storage is clean.
- **But song one is OVERWRITTEN IN PLACE.** Its title and its stored score file
  become score two's. Its placements survive onto music they were never made
  for, and **two of five silently landed on notes of the new piece**, because
  event ids are positional. The drawer reported *"3 placements have no note in
  this score. They have been kept."* and the counter still read `5 / 5`.
- **Why: §2.6 has TWO upload branches and only one is reachable.** "Upload into
  the open song" is built (step 3). "Upload from a neutral state (no open song,
  or the singer pressed New song)" cannot occur, because there is always an open
  song and there is no New song control. **A singer has no way to say "this is a
  different piece."**
- **The design's rule holds literally**: an upload never destroys placements.
  Nothing in it protects the SONG.

**Does step 5 depend on step 4?** Partly, and the split is sharp. **Works
single-song:** export one song, and restore a one-song binder into an emptied
library, which is the eviction fire escape §8 justifies. **Needs step 4:**
"unknown song id, imported whole" while keeping the current one; "keep both",
which re-ids the incoming copy and is plural by definition; and any multi-song
binder. The binder is not blocked by step 4, but everything that makes it a
LIBRARY backup rather than a SONG backup is.


---

## Block 5: closed head material moved out of STATE.md, 2026-09-01

*The first run of the close rule Dann ratified 2026-09-01: `STATE.md` holds only
what is open. Two closed things are moved here verbatim. The floor chain was
superseded by `e347311`; N.67 closed whole on 2026-08-18.*

### The ten superseded floors

What it names instead is a **FLOOR**: everything described below was true at or
before **`2d54185`**, raised from `8bc036a` at the close of the 2026-08-25 session when N.92 slice 2 shipped with five gates at baseline and the push printed `6aebbe4..2d54185`; gate 4's baseline moved 790 -> 800 and gate 5's 451 -> 461, and `ilya-ship.sh:79-80` were updated by Code before the run (md5 a78888ac -> 38335c06). Before that `8bc036a`, raised from `f3b257b` at the close of the 2026-08-24 night
session when N.97 and N.97b shipped with five gates at baseline and the pushes
printed `d9fe8a9..22fee05..8bc036a`; gate 4's baseline moved 754 -> 784 -> 790
and gate 5's 444 -> 451 across the two ships, and `ilya-ship.sh:79-80` was
updated over the bridge before each run. Before that `f3b257b`, raised from `7f6a283` on the evening of 2026-08-24 when
the OMR day's three ships landed with five gates at baseline on each and the
pushes printed `b08bd86..b2a502c..bc2a026..f3b257b`; gate 4's baseline moved
725 -> 754 with the third ship and `ilya-ship.sh:79` was updated before it
ran. Before that `7f6a283`, raised from `1f4e268` late on 2026-08-24 when N.83's two reader ships landed with five gates at baseline and the pushes printed `1c97f6b..fe74ece..7f6a283`. Before that `1f4e268`, raised from `2440bf5` in the small hours of 2026-08-24 when N.62 shipped with five gates at baseline and the push printed `b54be1a..1f4e268`. Before that `2440bf5`, raised from `230cad3` at the close of 2026-08-23 night after N.81 shipped with five gates at baseline and the push printed `848059e..2440bf5`. Before that `230cad3`, raised from `9d314de` at the close of 2026-08-23 after two N.80 ships, pushes `d0a1895..d491d22..230cad3`, five gates at baseline on each. Before that `9d314de`, raised from `9cc68e5` late on 2026-08-23 when the colon audit shipped with five gates at baseline and the push printed `cc3b912..9d314de`. Before that, `9cc68e5`, because N.78 shipped with five gates at baseline and the push printed `0f034ab..9cc68e5`. Before that it was raised from `2b81f5a` at the close of 2026-08-21,
because N.77's six ships all landed with five gates at baseline and the pushes
printed `46ab5e2..0fcaa6e..9f11490..d079794`, so every build this file describes
is now in history. 

### N.67's closing narrative, which had stayed in the file head since 2026-08-16

**The night of 2026-08-16 built the save function.** N.67 steps 0, 1, 2, 3, 4a,
and step 5's single-song half; N.68, N.70, N.71 closed; N.55b repaired; N.72's
minimum shipped and walked; `bits-ui` removed; the Guide's false claim
corrected. Ilya keeps songs and score files in
IndexedDB, brings the score back on reload, cannot destroy a placement made by
hand, and now says so before a different piece replaces a song. **Every one of
those closures was walked by Dann on a real deploy**, which is the only reason
any of them count.


### THE ONE THING as it read before 2026-09-01, superseded by N.104's reopening

> **THE ONE THING: N.104.** Dann's words: "We absolutely must represent
> measures without voice content with a single rest and a number overtop of
> it saying how many measures are tacet for voice." Brief written and
> filed: `docs/sessions/brief-n104-tacet-measures_r1_2026-08-27.md`. Paste
> it to Code in a fresh thread.
>
> **It resolves a real fault rather than a cosmetic one, and the
> measurement is already done** (memo-mobile-slice4 §26, and the INBOX
> line): the engraved song's vocal measure 1 is empty while the piano's
> carries five notes, the page omits that bar entirely, and the loupe's tag
> copies the source's own number. So the TAG IS FAITHFUL and the PAGE IS
> SHORT ONE BAR, which is why Dann's visibly second bar read m. 3. Do not
> renumber the tag; complete the page. Gould holds NOTHING on rest
> geometry (priors memo line 220), so the dimensions come from convention,
> recorded as convention.
>

## Block 6: N.104 history moved out of STATE.md at its close, 2026-09-02

Verbatim, in order, as it stood in `STATE.md` §THE ONE THING from 2026-08-29 to
2026-09-02. Closed by `ea300ef`, walked by Dann on the branch alias.

> **N.102** courtesy accidentals. **N.103** measures do not re-space when
> ink is added, so a dot crowds the next note's accidental; real engraving
> work, to be designed. **N.104** the page must show every bar the singer
> counts.
>
> **N.104 IS REOPENED, ruled by Dann 2026-08-29.** It stays open until the
> loupe is right and he has walked it.
> `docs/sessions/brief-n104-loupe-head_r1_2026-08-29.md` carries the ruling in
> those words. **What shipped is not in doubt: the paper is correct and nothing
> shipped draws a wrong bar.**
>
> **What shipped.** `e19c1b9` (the brief and handover), then `e347311`, "N.104:
> the page shows every bar the singer counts". `TACET_REST.measureSp` is **8**,
> **Dann's eye, 2026-08-29**, chosen from section A of
> `docs/sessions/drawing-n104-tacet-weights_r1_2026-08-27.html`, replacing the
> 12 the desk chose at the browser on 2026-08-27. Five gates at baseline. Memo:
> `docs/sessions/memo-n104-ship_r1_2026-08-29.md`. **Why he chose 8 is not
> recorded, by him or by the desk. The choice is recorded; the reason is not.**
>
> **What his walk of `e347311` found.** On the engraved Without Sun song 1,
> system 1, the loupe raised on the second and third drawn bars showed a clef, a
> key signature, **and a whole rest that is in neither measure**. His second
> observation named the mechanism: later systems do not carry it. Cause, from
> `Loupe.svelte:528`: the head was bounded on the smallest `[data-hit]` x, and a
> tacet mark carries no hit rectangle at all.
>
> **THE ONE THING: Dann's walk of the loupe fix. It is WRITTEN, not DONE.**
> Built 2026-08-29 against the brief and its §8 amendment, which he ruled after
> a first pass fixed the rest and left the key signature cut on six of the seven
> systems. Three files under `apps/web/src/lib/shane/`; the renderer is
> untouched. The rule is one exported constant, `MUSIC_MARK` at
> `loupe.ts:283-324`, gating on the renderer's paint order rather than on a list
> of handles, because the underlay carries no handle and reaches left of the
> first note on six of seven systems. Measured after: all seven heads paint the
> clef and **both** sharps and nothing else, narrowest clearance 2.28 units.
> Memo: `docs/sessions/memo-n104-loupe-head_r1_2026-08-29.md`.
>
> **NOTHING IS COMMITTED AND NOTHING IS SHIPPED.** Before the ship, these need
> `git add`: `docs/sessions/drawing-bar-numbers_r1_2026-08-29.html`,
> `docs/sessions/brief-n104-loupe-head_r1_2026-08-29.md`, and
> `docs/sessions/memo-n104-loupe-head_r1_2026-08-29.md`.
> `docs/sessions/memo-n104-ship_r1_2026-08-29.md` is modified and rides along.
>
> **GATE 4 IS 908, AND THE SHIP SCRIPT ALREADY CARRIES IT.** Eight tests the
> loupe build added in `loupe.test.ts` under `describe('the head’s bound')` take
> web-test from 900 to 908. No existing test changed or was deleted.
> **VERIFIED 2026-09-01 by reading the line**: `~/Downloads/ilya-ship.sh:79`
> reads `gate 4 web-test "908 passed (908)"` and `:80` reads
> `gate 5 score-parser "481 passed | 5 skipped (486)"`. Both are correct for the
> tree as it stands. **Nothing is owed here.**
>
> *This block previously said the line still read 900 and needed changing by
> hand. That was transcribed from the loupe memo's §7 rather than read off the
> script, which the desk had no access to. Corrected 2026-09-01.*
>
>
> **THE ONE THING: N.104's LOUPE FIX SHIPPED A REGRESSION. Found by Dann on his
> own walk of `510a280`, 2026-09-01.** The loupe draws the key signature's
> second sharp TWICE on any measure that opens a system: F sharp, C sharp,
> C sharp. **He saw it; no gate did, and the desk had already written the item
> DONE off three screenshots before he spoke. The close was retracted.**
>
> **The mechanism, established from the code and from the memo's own numbers.**
> The window's left edge is the leftmost HIT RECTANGLE of the held measure
> (`loupe.ts:79`). Tonight's change moved the head onto the leftmost MUSIC INK
> (`loupe.ts:338`, `Loupe.svelte:563-580`). **Those were the same quantity
> before and are not the same quantity now.** Hit rectangles tile from the
> midpoint before each note, so a measure that opens a system has its window
> left at **56**, while the head now runs to 63.53 or beyond. The overlap is
> 7.53 units on system 2, and the second sharp's ink is 56.01 to 61.25, which
> sits entirely inside it. The head draws it, then the window draws it again.
> The first sharp ends at 55.02, below 56, so it appears once.
>
> **Scope: the first measure of systems 2 through 7**, that is source measures
> 4, 7, 10, 13, 16, and 18. Head bounds 63.53, 64.98, 66.38, 69.33, 70.77,
> 69.14, all above 56, all overlapping the second sharp whole. System 1's
> opening measure is the tacet bar, which carries no hit rectangle, so
> `measureWindow` returns null and no loupe rises there. **WALKED AND CONFIRMED:
> m. 4 (system 2) and m. 7 (system 3). The other four are predicted from the
> same arithmetic and NOT walked.**
>
> **How it got past the memo.** `memo-n104-loupe-head_r1_2026-08-29.md` §3.1
> records the head at 63.53 and §3.3 records m. 18's window left at 56. **Both
> numbers are in the same memo, in two different tables, and nobody subtracted
> one from the other.** Every measure §3.3 tested was the second or third of its
> system except m. 18, whose window it measured without ever comparing it to the
> head.
>
> **The brief is written**:
> `docs/sessions/brief-n104-head-window-overlap_r1_2026-09-01.md`. Paste it to
> Code in a fresh thread. Nothing is owed from Dann before that.
>

## Block 7: the 2026-09-02 closes, moved out of STATE.md at the close of that session

Verbatim, in order. Nine items closed and shipped in one session, every one walked by Dann or proved in a browser: N.104, N.105, N.102 (three increments), N.106, N.103, N.107, N.109.

> **N.104 CLOSED 2026-09-02, WALKED BY DANN on the branch alias.** Ship
> `ea300ef`, "N.104: the loupe's window opens where its head stops", five gates
> at baseline, gate 4 now **914**. He raised the loupe on m. 4, system 2 of 7,
> and saw clef, F sharp, C sharp, once each; his words: "There!" Memo:
> `docs/sessions/memo-n104-head-window-overlap_r1_2026-09-01.md`, whose §8
> lists six moved anchors, applied in this file below. The N.104 history that
> stood here is in `../sessions/LOG.md`, block 6. **N.102 and N.103 stay open
> and unplaced.**
>
> **N.105 CLOSED 2026-09-02, WALKED BY DANN on the branch alias.** Ship
> `21e9ce2`, 'N.105: "Not now" lasts thirty days', five gates at baseline,
> gate 4 now **920** and `ilya-ship.sh:79` already carries it. One key,
> `ilya:installDeclinedAt`; thirty days is a DESK DEFAULT he has not waved
> off; a dismissed native prompt counts as a decline. Memo:
> `docs/sessions/memo-n105-install-decline_r1_2026-09-02.md`. Its NOT
> ESTABLISHED: the iOS path was never entered. His words: "The banner is
> successfully dismissed."
>
> **N.102 INCREMENT 1 DONE 2026-09-02, WALKED BY DANN on the alias.** Ship
> `0ed0fd8`, "N.102: the courtesy accidental across a barline". Gate 5 now
> **493 | 5 skipped (498)** and `ilya-ship.sh:80` carries it. Two courtesies
> drawn on Without Sun song 1 (bar 3 natural, bar 6 sharp); he saw the bar 3
> natural: "Yes! Success!" Memo:
> `docs/sessions/memo-n102-courtesy-accidentals_r1_2026-09-02.md`. Its three
> flags, all desk calls: a courtesy is never drawn on a system-opening
> measure (increment 1b, below); primitive mode collides at a measure opening
> (fallback only, left); Gould 121's words matched the brief's paraphrase.
>
> **RULED BY DANN 2026-09-02, HIS EYE: the parenthesis gap is 0.2 stave-spaces
> each side**, chosen from a four-column drawing of Maestro's outlines. His
> caveat, his words: "I'm concerned about this being a hard rule. In scores
> where very short rhythms bear courtesy accidentals we can be more fluid."
> DESK DEFAULT built from that: 0.2 sp preferred, the gap closes toward 0
> before the cluster moves when the measure-opening floor binds. The general
> tight-rhythm case is N.103's.
>
> **N.102 INCREMENT 1a DONE 2026-09-02, WALKED BY DANN on the alias.** Ship
> `3dd37e4`, "N.102: the courtesy's parentheses breathe". `COURTESY_GAP_SP =
> 0.2` exported at `staff-renderer.ts:153`; the gap is the first thing to
> give at the measure-opening floor. Gate 5 now **496 | 5 skipped (501)**,
> `ilya-ship.sh:80` carries it. His words: "yes to my eye that reads
> better." Memo: `docs/sessions/memo-n102-gap_r1_2026-09-02.md`.
>
> **N.102 INCREMENT 1b DONE 2026-09-02.** Ship `e7c2e43`, "N.102: the
> courtesy survives the system break". The accidental rule lives once, in
> `advanceAccidentalState` (`staff-renderer.ts:348`), shared by the draw loop
> and `accidentalStateAtEndOf`; `incomingAccidentals` on `StaffRenderOptions`
> seeds each slice. Gate 5 now **504 | 5 skipped (509)**, `ilya-ship.sh:80`
> carries it. Without Sun song 1 has no case, so nothing changed on the
> page; Code proved it on a two-system probe in the browser. Memo:
> `docs/sessions/memo-n102-system-opening_r1_2026-09-02.md`.
>
> **N.102 INCREMENT 1 IS WHOLE.** Four ships tonight: `0ed0fd8`, `3dd37e4`,
> `e7c2e43`, and N.105's `21e9ce2` before them. **Increment 2**, the singer's
> own control with its French, waits on Dann.
>
> **OWED, from the 1b memo: eight `path:line` citations in the loupe's source
> were stale before any N.102 work.** Code listed them and left them rather
> than guess. Repair by naming the thing, not by writing a new number.
>
> **N.106 DONE 2026-09-02, WALKED BY DANN on the alias.** Ship `bb73488`,
> "N.106: the turning unit keeps to the right of the sung unit". Rule at
> `staff-renderer.ts:1796-1871`, `TURNING_CLEARANCE_SP = 0.25` exported.
> 22 of 95 turning heads on Without Sun song 1 displaced right, 2.97 units
> of clearance, nine of them seconds below that used to go left. He saw the
> dotted case on system 2: flat, head, dot, then the lavender natural and
> head clear to the right. His words: "Yes! :)" Gate 5 now **511 | 5 skipped
> (516)**, `ilya-ship.sh:80` carries it. Memo:
> `docs/sessions/memo-n106-turning-right_r1_2026-09-02.md`. The rulings
> behind it (semantic units, biglyph and triglyph, always right, the
> departure from Gould 103) are in `PRODUCT.md` §The turning layer.
>
> **N.103 DONE 2026-09-02, WALKED BY DANN on the alias.** Ship `62967a7`,
> "N.103: the spacer sees ink". `columnAdvance` has a fourth term, ink, from
> one shared `columnInk`; `INK_CLEAR_SP = 0.5` and `TURNING_TRAIL_SP = 1.0`
> exported, the second carrying his ruling verbatim. «лё ко» went from
> -4.38 to 18.92 units; the page's narrowest ink clearance from -4.38 to
> 4.05; systems 7 to 8, pages held at 2. Packing now takes the resolved
> clef, a latent bug Code found. Gate 5 now **528 | 5 skipped (533)**,
> `ilya-ship.sh:80` carries it. **His words: "Claude I find it absolutely
> gorgeous."** `TURNING_TRAIL_SP` stays at 1.0 on that; the cost is a bar
> per system from bar 7 on, accepted. Memo:
> `docs/sessions/memo-n103-ink-spacing_r1_2026-09-02.md`. The rulings
> behind it are in `PRODUCT.md` §The turning layer.
>
> **N.107 DONE 2026-09-02, WALKED BY DANN on the alias.** Ship `d22084c`,
> "N.107: the turning head counts its ledger lines". One shared
> `drawLedgerLines` (`staff-renderer.ts:1996`) serves the sung line and the
> turning block; the sung line's markup proven byte-identical over 9,408
> rendered scores. 37 of 95 turning heads on Without Sun song 1 sit outside
> the stave, all 37 with their lines; the below-stave case proved on a
> deliberately lowered profile, 1 to 5 lines. His words: "Yes, I see exactly
> that!" Gate 5 now **534 | 5 skipped (539)**, `ilya-ship.sh:80` carries it.
> Memo: `docs/sessions/memo-n107-turning-ledgers_r1_2026-09-02.md`.
>

## Block 8: the 2026-09-02 to 2026-09-07 records, moved out of STATE.md at the close of the 2026-09-07 session

Verbatim and in order: N.108 (five increments), N.111 (three increments plus 3a and 3b), N.112 (two commits), N.113 as it stood when the record moved, and the notes that rode with them. Nothing rewritten.

> **Closed 2026-09-02, moved to `../sessions/LOG.md` block 7 at the close:**
> N.104 (`ea300ef`), N.105 (`21e9ce2`), N.102 increments 1, 1a, 1b
> (`0ed0fd8`, `3dd37e4`, `e7c2e43`), N.106 (`bb73488`), N.103 (`62967a7`),
> N.107 (`d22084c`), N.109 (rode in `2c1cecf`). All walked or proved.
>
> **N.108 increment 1, the frames (record of its placing).** RULED BY DANN 2026-09-02:
> "N.108 comes before the release and the release waits for it." That is the
> named displacement CONTRACT §6 requires; the release order N.85 to N.88
> waits behind N.108. Design's revision 3 returned as a working prototype
> (`docs/sessions/n108-drawer-prototype_r2_2026-09-02.html`, memo
> `n108-design-return_r3_2026-09-02.md`), both written by Design straight
> into the tree. Two desk overrides of it, recorded in the build brief: one
> map at every size (Metadata on the Piece band everywhere), and Back on the
> left of the takeover band. Build brief, three increments each ending in a
> ship and a walk: `docs/sessions/brief-n108-build_r1_2026-09-02.md`.
> Status: increments 1 and 1a SHIPPED and walked; 2 is next. Usage read 2026-09-02 evening:
> Fable 29%, shared pool 21%, both reset Sunday; nothing scarce.
>
> **INCREMENT 1 SHIPPED `2c1cecf` 2026-09-02 and WALKED BY DANN on the
> alias.** The frames stand. His walk found, and he ruled, all 2026-09-02
> late evening, from drawings `drawing-n108-pull_r1/r2/r3`:
> - **The slab is gone.** No fill behind the groups; they float on the desk
>   of the document showing. His words: "allowing the Drawer to fully become
>   a floating control set." (Code had given the slab one fixed tone, which
>   showed as a wrong-coloured corner under the Score markup desk.)
> - **Desk: no pull, no chevron, no collapse.** The drawer is always
>   present. `ilya:drawerCollapsed` retires. Below the width where drawer
>   and paper both fit (about 1340 px, Code to measure), the layout is the
>   phone's.
> - **Phone: the VERTICAL model returns**, drawer rising from the bottom, one
>   horizontal labelled pull on the bottom edge reading PAPER with the
>   drawer up and DRAWER with the paper up; a swipe in the motion's
>   direction is a second way in. **This AMENDS the 2026-08-19 ruling
>   (`claude/ruling-drawer-horizontal-motion-and-bare-chevron_2026-08-19.md`)
>   in both parts, motion and label**, on his word tonight: "The vertical
>   model for mobile that you offered is fine. Let's go with that." The desk
>   found this only after quoting the 08-18 pull without the 08-19 amendment
>   (tether 17, broken and caught by Dann).
> - **The migration lands every returning singer on the opening state once**
>   (old open set dropped), desk ruling; his old Repertoire and Analysis had
>   come across open and pushed Score markup off the bottom.
> - "You have corrected 2 notes." moves inside Corrections.
> - The intake stays two fields until increment 2, as briefed.
> **INCREMENT 1a SHIPPED `60e6615` 2026-09-02 and WALKED BY DANN, desk and
> phone.** His words: "Yes! It works just as you say :)" Desk breakpoint
> measured at exactly 1400 px (520 + 816 + 2 × 32); a 1366 laptop takes the
> phone's layout, accepted. Migration key is now `{"v":2,"open":[]}`.
> Groups take a 16 px side inset. NOT walked: the loupe covering the pull on
> the phone (nothing unreachable; dismiss the loupe first). Memo:
> `docs/sessions/memo-n108-frames-1a_r1_2026-09-02.md`.
> **INCREMENT 2 SHIPPED `cedf246` and `2fe7ebd` 2026-09-03 and WALKED BY
> DANN on the alias, seven steps.** Memo
> `docs/sessions/memo-n108-intake_r1_2026-09-03.md` (§7 is the watermark).
> Walked: paste gives `TEXT · 8 lines`; Transcribe adds `38 words`; the
> control dropped on the poem gives the confirm panel, then `5 / 5` on Score
> markup with the poem intact; Clear on the score removes the SCORE line,
> Underlay, and Corrections and leaves the poem; Replace on the poem selects
> it; the clear survives a reload. **RULED BY DANN 2026-09-03 on the walk:
> the intake watermarks are retired** (amends N.65, 2026-08-20); the
> oversized-sans convention the deleted component carried (700, -0.01em,
> line-height 1.04, 40 px, from the r2 mockup) now lives only in memo §7.
> Findings, both for the increment 3 paste: (1) the drawer takes the 175 ms
> tab slide and Dann ruled it still (`Drawer.svelte:1148-1162`); (2) Metadata
> fields tagged *from score* survive Clear on the score
> (`handleClearScore`, `+page.svelte:1779`). Also seen, not acted on: the
> SCORE receipt shows the file name before Continue to analysis, where memo
> §6.7 says after; the "not the same music" dialog does not fire when no
> placements exist. Numbered on the walk: **N.111**, the clitic seat, below.
> Inbox, on his word: "one piece at a time".
> **INCREMENT 3 BUILT AND WALKED BY CODE 2026-09-03, AWAITING DANN'S SHIP AND
> HIS WALK.** Memo `docs/sessions/memo-n108-takeover_r1_2026-09-03.md`. Commit
> message `N.108-3: the takeover in the new dress`. Floor `2fe7ebd`. Five gates
> at baseline before and after; no line of `~/Downloads/ilya-ship.sh` changes.
> The takeover wears the Score markup band with Back on its left, the 20 px
> frame, and the station label recipe; the ONE self-scroll is written on EXIT,
> not entry, because `display: none` keeps a scroll offset and Chrome restores
> it after `requestAnimationFrame` (measured). No new string, English or French:
> the band reuses `group.scoreMarkup`, Back reuses `inspector.back`, the title
> reuses `voice.heading`. The prototype's Back chevron was drawn and removed,
> because `inspector.back` is already `← Back`. Both riders ride: the tab slide
> is gone from `.drawer-content` and stays on `.main-content`, and Clear on the
> score now calls `clearScoreFilled`, so the fields that score filled empty and
> the singer's own survive, walked and proved through a reload.
>
> **HIS TO RULE, THE ONE OPEN THING (memo §2): the ritual's phases do not fit
> their box.** At 1366 x 768 the box is 672 px; summary is 1042, capture 1295,
> characteristics 1485. The dress is not the cause: at 1400 x 900 the wizard's
> own column is 995 px inside an 852 px drawer, so no chrome height absorbs it.
> Design measured a placeholder. Nothing is broken; the ritual has scrolled
> inside itself since N.73 S3. Three ways out are listed in the memo and none is
> chosen, because it is taste.
>
> **Spent by this increment:** the increment 2 finding "the drawer takes the
> 175 ms tab slide (`Drawer.svelte:1148-1162`)". Those rules are deleted.
>
> **INCREMENT 3 SHIPPED `42f6871` 2026-09-03 and WALKED BY DANN, desk and
> phone, four steps.** His words: "It looks ravishing" and "it looks great
> on mobile." Both riders walked. DESK DEFAULT on the fit, not waved off: the
> ritual keeps its inner scroll (memo §2). **N.108 IS CLOSED.** Move its whole
> record to LOG.md at the close of this session.
> Ruled on the walk, riding with the next Code paste: a top inset on the
> drawer so Piece clears the banner (INBOX, 2026-09-03). Also owed from memo
> §9: the empty-paper hint still says "chevron on the left".
> **INCREMENT 4 SHIPPED `8fbc8d7` 2026-09-03 and WALKED BY DANN on the alias:
> the top inset, the pill ends on 54 buttons (audit in memo §5.2), one Choose
> a file that asks poem-or-score on a picture, and the bottom-pull hint. His
> words: "they all look as they should." Both desk defaults stood: the
> correction grid as pills, the TRANSCRIPTION / SCORE MARKUP pair square. Memo
> `docs/sessions/memo-n108-finishings_r1_2026-09-03.md`. **N.108 is finished,
> four increments.** French owed for every N.108 string, shown as a table
> first when it comes.
> **N.111 SHIPPED in four commits 2026-09-04 (`7875892`, `c574cf8`,
> `d5a49ff` and the increment 2 seat) and WALKED BY DANN through increment 3.**
> Ilya seats a vowelless clitic with its host automatically at ingest of a
> lyric-bearing score (ruled 2026-09-04: "no vowelless word in Russian can
> carry its own duration"); the transcription overrules the file ONLY on a
> clitic fold, anything else withholds (ruled, the Italian case); the vacated
> note draws nothing; the hand (N.55b's click surface) works on scores with
> words. Memos: `memo-n111-clitic-seat_r1_2026-09-04.md`,
> `memo-n111-hand_r1_2026-09-04.md` (§13 the loupe fix). NOT WALKED: `d5a49ff`,
> the loupe redrawing in the same frame and the bare IPA line.
>
> **THE TEXT-TO-SCORE SEQUENCE, RULED BY DANN 2026-09-06** ("be an excellent
> Project Manager"), one path through the pairing layer, in this order:
> 1. **N.108-5, cleanup**: the seat sentence and its Undo leave Corrections
>    (ruled 2026-09-04); Transcribe and Continue to analysis become one
>    action, either invoking the other (ruled 2026-09-04).
> 2. **N.112, the text is authoritative** (numbered 2026-09-06): one
>    text-to-seats function, stable on a round trip; unchanged words keep
>    their notes, a removed syllable slides the rest left, an added one takes
>    the next open note; drift retires. Finale's Lyrics window model.
> 3. **N.113, the melisma** (numbered 2026-09-06): a dock control writing the
>    `melisma` kind (`pairings.ts:121`, never written by a singer today) and
>    an extender line on the page. Finale's Edit Word Extensions.
> 4. **N.114, Type Into Score**: a text field in the loupe's dock for the
>    taken note; what is typed rewrites that word in the poem, the field marks
>    the changed word, N.112 re-seats. Two-way; the loupe is the surface
>    (E.27 binding, N.92). Last because it depends on 2 and 3.
> **N.115, the singer moves a measure between systems** (numbered
> 2026-09-06, UNPLACED): Finale's arrow-up on a selected measure pulls it into
> the previous system and the others respace. Research Finale first (his ask),
> then find the tree's existing orphaned-measure rule before scoping.
> Then N.110, the release order N.85 to N.88, N.84, N.83. French for every
> N.108, N.111, and N.112 to N.114 string comes as one table after 4.
> Not adopted from Finale, ruled 2026-09-06: Adjust Baselines and the other
> engraving controls (Ilya does them), Type Into Score on the paper, verses
> (D3's), Clone.
> **N.108-5 SHIPPED `5f6a2f3` 2026-09-07 and WALKED BY DANN 2026-09-07,
> three steps:** four bands (Piece, INPUT in sage, Text, Score markup), the
> button "Transcribe and fit", the seat sentence gone, and the transcription
> that is always there (boot, paste, 600 ms typing pause; walked: the page
> drew at boot with no press, and a typed letter appeared after the pause as
> a VERIFY stack). Memo `memo-n108-5-cleanup_r1_2026-09-07.md`. Open from it:
> implicit runs reset stress overrides (N.112's), and the "Text changed 59"
> drift line (N.112 retires it).
> **N.111-3b BUILT AND WALKED BY CODE 2026-09-07, AWAITING DANN'S SHIP AND HIS
> WALK.** Memo `docs/sessions/memo-n111-3b-loupe_r1_2026-09-07.md`. Commit
> message `N.111-3b: the loupe stays open, and the hand can go back`. Floor
> `5f6a2f3` plus the uncommitted `*/` in `IntakePanel.svelte`, which rides with
> it. Five gates at baseline before and after; **gate 4 stays 995 and no line of
> `~/Downloads/ilya-ship.sh` changes.** All four rulings of 2026-09-07 land: the
> loupe stays open after a placing click (the cause was N.111-3a's own redraw
> detaching the click target, so `closest('.loupe')` answered null and the
> geometry test dismissed; the guard is `gestureBeganOnSurface`, read at
> `pointerdown`); Undo and Redo on the dock, ONE stack extended, not a second
> added, with `pairingCursor` in the snapshot and placement pushing
> `loupe.undo.placed`; the receipt tag reads POEM; the CSS comment verified on a
> production build with a positive control. **Two new English strings, French
> owed on both** (`loupe.redo` = `Redo: %s`, `loupe.undo.placed` = `syllable
> placed`), plus the POEM tag, whose `« texte »` is retired. **ONE UNTRACKED
> FILE: the memo. `git add` it before the ship.** Open from it: an undo across a
> re-ingest could restore old pairings, which is the shipped behaviour of Undo
> and not new; and the dock readout omits the syllable at the first raise.
> **SHIPPED `a186f20` 2026-09-07 and WALKED BY DANN, two steps:** the loupe
> stayed open on the placing click, Undo took it back, Redo put it back, POEM
> on the receipt. **N.111 IS CLOSED.** Move its record to LOG.md at the close
> of this session.
> **N.112 BUILT AND WALKED BY CODE 2026-09-07, AWAITING DANN'S SHIP AND HIS
> WALK.** Brief `docs/sessions/brief-n112-text-authoritative_r1_2026-09-07.md`,
> memo `docs/sessions/memo-n112-text-authoritative_r1_2026-09-07.md`. Commit
> message `N.112: the text is authoritative`. Floor `a186f20`. **BOTH
> increments in ONE commit.** `text-diff.ts` is the one place the old and new
> texts are compared: `wordGrid` is `processText`'s step 1 lifted (not copied)
> so the diff and the pipeline cannot disagree about a word, then a flat
> longest-common-subsequence over the word sequence, which makes a line split
> or join invisible. Overrides re-key through it, so N.108-5's reset is over.
> `reseat.ts` carries the seats: a matched word keeps its notes, a removed
> word's seats go and the tail closes up, a new word takes the notes after the
> word before it. Drift retires: `reconcilePairings` is reduced to
> `refreshPairings` (kept for `handleReset`, which re-runs the pipeline without
> a diff), and `PairingDrift`, `Reconciliation`, `auditPairings`, `driftCount`,
> the Underlay drift line and `station.textChanged` are all deleted. **NO NEW
> STRING, so no French is owed.** **GATE 4 MOVES 995 → 1030 AND NEEDS DANN'S
> PERMISSION; the `sed` needs its `chmod +x`.** **SIX FILES TO `git add`,
> including the brief.** Walked on a production build against
> `sunless-01-engraved.musicxml` and the Mussorgsky poem: the punctuation round
> trip is a no-op, an edit in line 2 leaves line 4 and the whole tail unmoved,
> deleting a word closes the tail up by two to 94 seats, a reload holds, and
> two presses of Transcribe give a byte-identical map.
>
> **HIS TO RULE, ONE LINE (memo §8): what a note the re-seat VACATES draws.**
> Today it draws the engraved file's own word. N.111's desk default of
> 2026-09-04 says an undecided note *inside a seated run* draws nothing, and a
> vacated tail note is past the end of the run, so the rule does not reach it.
> N.112 makes it common. Not built, because extending it would be Ilya
> overruling the file's witness in a second case and his ruling of 2026-09-04
> allows that only on a clitic fold.
>
> **N.112 SHIPPED `b191867` 2026-09-07 AND WALKED BY DANN, who found TWO
> defects; both are FIXED, GATED AND WALKED BY CODE 2026-09-07 and await his
> ship and his walk.** Memo §9.
> 1. **The insert anchored on a seat that matched only by position.** Replacing
>    a word in line 2 seated the new word on system 1's notes 1 to 5. CAUSE,
>    reproduced: `readScoreText` joins a score's underlay into ONE line
>    (`clitic-seat.ts:449`), so a seat made from the score's own words carries
>    `lineIndex 0` with a running `wordIndex` and collides with the poem's first
>    line; `reseatByDiff` read `diff.moved` by POSITION and never consulted
>    `origin.word`, the discriminator Dann ruled 2026-08-13. FIX: a seat the diff
>    cannot speak for is left exactly as it stands and can never anchor
>    (`reseat.ts` takes the previous word grid); the anchor is the previous
>    matched word's seat, with `anchorFound` separate from `anchor`. Walked:
>    system 1 unchanged, system 2 corrected in place, both directions.
> 2. **Start placement over rebuilt from the score's own words.** MEASURED off
>    the Lyric header: the poem's queue is **96** slots and ends on `я`, the
>    score's own is **95** and ends on `ка` (this engraving lost its final `я`,
>    N.111), so `firstPass` left the last note bare. FIX: `rebuildSource` in
>    `one-action.ts`, his ruling of 2026-09-07 applied here, plus a `flushText`
>    first. Walked warm (`96 / 96`, last note `я`) and cold (nothing rebuilt,
>    seats stand).
>
> **GATE 4 MOVES 1030 → 1038 AND NEEDS HIS PERMISSION; the `sed` needs its
> `chmod +x`.** No new file, so nothing new to `git add`. No new string.
>
> **STILL HIS TO RULE, unchanged: what a note the re-seat VACATES draws**
> (memo §8).
>
> **SHIPPED `1b3054a` 2026-09-07 and WALKED BY DANN:** Start placement over
> gave the last note its `я`; the line-2 replacement seated on system 2 with
> system 1 untouched; the cursor on the poem's final `я`. **N.112 IS CLOSED.**
> Move its record to LOG.md at the close of this session.
> **N.113 BUILT AND WALKED BY CODE 2026-09-07, AWAITING DANN'S SHIP AND HIS
> WALK.** Brief `docs/sessions/brief-n113-melisma_r1_2026-09-07.md`, memo
> `docs/sessions/memo-n113-melisma_r1_2026-09-07.md`. Commit message
> `N.113: the melisma`. Floor `1b3054a`. **Rider 0 rides with it.**
>
> **WHAT WAS ALREADY THERE, found before building (tether 16):** the extender,
> melisma detection, Gould r5 left-alignment and the slur all exist in
> `staff-renderer.ts` and all read the FILE, so nothing has ever drawn for the
> singer. N.113 is one channel (`melismaPreview`) and one control, not a
> drawing job. `toggleMelisma`, `melismaRuns` and `vacatedTail` live in
> `pairings.ts` where tests reach them; the renderer implements `melismaRuns`'
> rule over its own geometry.
>
> The control is ONE toggle in the dock's LYRIC station, which is where the
> N.92 schematic drew it and whose comment said "it was never ruled" until now.
> Undecided: mark. Seated: shift forward, then mark (DESK DEFAULT, his to wave
> off). Marked: clear to undecided, never to `empty` (E.46). One undo entry per
> press on the existing snapshot stack, Redo as N.111-3b built it.
>
> **RIDER 0 gates on `queueExhausted`, a DESK DEFAULT:** with every slot placed,
> a bare note past the last seat is vacated and blanks on both lines; with slots
> still unplaced it keeps the file's words, because that is the affordance the
> hand works from.
>
> **BOTH GATES MOVE AND BOTH NEED HIS PERMISSION: gate 4 1038 → 1056, gate 5
> 534/539 → 541/546.** One `sed` does both; the `chmod +x` is not optional.
> **FOUR NEW ENGLISH STRINGS, FRENCH OWED ON ALL FOUR** (`loupe.melisma`
> = `Melisma`, ADOPTED from Finale and Gould; `loupe.lyric.melisma`,
> `loupe.undo.melisma`, `loupe.undo.melismaOff`, coined). **TWO UNTRACKED
> FILES: the brief and the memo.**
>
> Walked on a production build on the engraved Sunless fixture, seven steps:
> the extender after a word-final syllable, the spanning hyphen mid-word (one,
> centred), Undo and Redo of each, the reload, the undecided last note, and
> rider 0's deletion taking the drawn Cyrillic from 96 to 94 with no stray.
>
> **HIS TO RULE, memo §7.1: whether the extender should take the hyphen's
> stroke weight and vertical offset.** The brief asked for both "a rule on the
> lyric baseline" and "match the hyphen's", which conflict. The file's own
> convention was kept (baseline, 0.5 px, against the hyphen's raised 1 px) with
> its documented semantic reason. Changing it would also change how the file's
> own melismas draw.
>
> **THE ONE THING after the ship: N.114, Type Into Score**, which is last in
> the sequence because it depends on N.112 and N.113.
> *(Earlier line, kept:)* Next step was the desk's: read
> `claude/e24-the-unused-boolean_2026-08-04.md` in full and write the brief.
> After N.111: N.110 (set aside, briefed), the release order N.85 to N.88,
> N.84, N.83.

> Nine ships this session before N.108, all walked or proved: N.104, N.105,
> N.102 (three), N.106, N.103, N.107.
>
> **N.108. RULED BY DANN 2026-09-02, from the three-choice drawing
> (`docs/sessions/drawing-n108-three-choices_r1_2026-09-02.png`): CHOICE 2,
> "frames, no fold".** Three frames as Design drew them; an open station
> grows inside its group; the other groups stay where they are; the drawer
> scrolls once something is open. Design's fold (open one station, fold the
> other two groups) is REJECTED: the drawer must not rearrange under the
> singer's hand. Design's return filed: `docs/sessions/n108-design-return_r1_2026-09-02.md`,
> `n108-design-mockups_r1_2026-09-02.html`, `n108-design-sources_r1_2026-09-02.md`
> (all untracked until added). **Still his to rule: the fourth radius** (the
> ruled three cannot draw a divot; Design's candidate is 20 px). Not built;
> the GUI track still waits on the beta line or a named displacement.
>
> **RULED BY DANN 2026-09-02, later the same day, on drawings:**
> - **The fourth radius is 20 px**, a surface radius, from
>   `docs/sessions/drawing-n108-radius_r1_2026-09-02.png` (16, 20, 24). His
>   words: "20 looks terrific." Amends "three radii, no fourth" (2026-08-18).
> - **Group headers are option A of
>   `docs/sessions/drawing-n108-group-headers_r1_2026-09-02.png`:** a band of
>   full-strength colour with reverse text in a light neutral; File borrows
>   Guide's cobalt `--quiet-cobalt`, Text sage, Score markup lavender. His
>   words: "I honestly prefer mine." Two facts ride with it, for Design to
>   solve inside A: cream on the ruled sage measures 2.7:1 and on lavender
>   3.3:1 at label size, under WCAG's 4.5:1; and cobalt on File overrides
>   "hue names place" for Guide, on purpose.
> - **The first group is named PIECE**, not File. His words: "not every
>   *piece* will be a song: some will be arias." Working names now: Piece,
>   Text, Score markup. French deferred by his ruling; when it comes, the
>   "song" strings ("New song", "songs", the binder copy, N.67's ruled French)
>   move to "piece" wording, shown as a table first.
> - **Design's second brief is written and packed:**
>   `docs/sessions/n108-design-pack/` holds the r2 brief (a working HTML
>   prototype is the deliverable), its README, and copies of E.27, E.44, the
>   2026-08-18 dispositions ruling, and N.70, the four things Design could
>   not read the first time. All untracked until Dann adds them. Design reads
>   the connected repository, so Dann pushes before pasting.

> **DESIGN'S REVISION 2 RETURNED AND RULED ON, 2026-09-02 evening.** A
> working prototype: `docs/sessions/n108-drawer-prototype_r1_2026-09-02.html`,
> memo `n108-design-return_r2_2026-09-02.md`. Ruled by Dann on the desk's
> critique:
> - **Bands take the language-chip tokens with white text** (Design's fix
>   inside A; the ruled hues fail contrast with cream, cobalt included at
>   4.23:1): Piece `#5C739E` 4.77:1, Text `#6C7A5F` 4.58:1, Score markup
>   `#806E8E` 4.63:1.
> - **The slab takes the desk's surround and the groups carry the drawer
>   paper**, as built; the bookmark tab belongs to the slab.
> - **The Transcribe station in Text is dissolved**: the Transcribe action
>   stays under the intake in Piece; the word count and Clear move onto the
>   receipt line. Text holds Notation and Analysis only.
> - **Calibration stays a takeover**, entered from Calibrate in the Voice
>   station, restore-on-exit as today; Design restyles it in the new dress
>   (Score markup band, 20 px surface). In-place ritual is NOT built; it may
>   return as its own item.
> - Owed to Design in revision 3: no self-scroll on opening a station (only
>   on ritual entry); the opening state measured at 1366 × 768 with Metadata
>   giving first; the labelled mobile pull (2026-08-18); the contrast readouts
>   out of the bands; the takeover restyled.

> *(Earlier record, kept:)* Numbered by Dann 2026-09-02, briefed to Design. File (open at open state,
> holding Repertoire, Metadata, one unified intake, import and export), Text
> (Transcribe, Notation, Analysis), Score markup (Underlay, Corrections,
> Voice). Principle ruled by him: "the opening state is the map of
> everything, and it fits without scrolling." Departs on purpose from E.27
> §3.3/§3.6 and from the 2026-08-18 "one takeover" and "one accent per
> surface"; the brief names each. Group names and all French are his and
> owed. Brief:
> `docs/sessions/brief-to-design-n108-drawer-three-groups_r1_2026-09-02.md`,
> untracked until he adds it. **GUI track: builds only after the beta line
> closes or he names what it displaces (CONTRACT §6).**
>
> **N.110, the [i] extractor. Numbered by Dann 2026-09-02, SET ASIDE by him
> ("set it aside for now"), BRIEFED, not built.** His roster reads [i] fR1 =
> 1063 Hz, captured in fry as the ritual asks; [i]'s fR1 is the lowest of
> the ten. Established by the desk: `extract.ts:47-58` finds no peak near
> 300 Hz that clears 3 dB and takes 1063 as nearest to the prior; [u] at
> 274 came through the same code. Desk hypothesis, unproven: pre-emphasis
> flattens a lone low peak. Increment 1 is N.49's instrumentation, a
> dev-only WAV capture, an offline harness that imports `extract.ts` and
> plots the envelope and peaks, and the attempt series; **no fix**. Brief:
> `docs/sessions/brief-n110-i-extractor-harness_r1_2026-09-02.md`,
> untracked. The stored 1063 is a pre-E.26 record with its verdict erased;
> the guard-at-snapshot fix is an inbox candidate. No default value: sourced
> or silent.
>
> **N.111, the clitic seat. Numbered by Dann 2026-09-03, on the N.108-2 walk
> of Without Sun no. 1.** The score seats the vowelless proclitic в alone under
> a sung pitch before бьющемся; Ilya draws it as its own syllable with no
> vowel, and a singer has no way to fix it. His words: "The clitic should
> concatenate with the parent word that follows; we have discussed that
> vowelless words cannot be applied alone to sung pitches," and "We need
> controls to account for this if it happens in the real world. At the moment
> there is no way for a user to resolve this." Already framed in
> `claude/e24-the-unused-boolean_2026-08-04.md` §6 (snippet only, read it in
> full before briefing): a vowelless clitic never holds a note-assignment of
> its own; it is seated with its host in the direction `CliticEntry.type`
> gives; the page shows the re-seating rather than doing it silently. Still
> his to rule from that document: what the page shows when text is re-seated.
> New in N.111: a control for the singer to re-seat by hand where Ilya cannot.
> Placement: DESK DEFAULT, after N.108 increment 3 and before N.110; not
> placed against the release order, which is his.
>
> **Open and unplaced:** N.111 the clitic seat, N.102 increment 1c (turning-layer courtesies), N.94, N.84 the Guide redo, N.83's call, and
> the release order N.85 through N.88.
>
> **Also this session, ruled: CONTRACT.md tether 20**, put yourself in his
> position first. Transcribed with his ratified words, `CONTRACT.md` §1.20.
> Project knowledge:
> `claude/ruling-tether-20-put-yourself-in-his-position_2026-09-02.md`.
>
> **Waiting, all Dann's to order:** N.83's walkthrough call (his to
> schedule), N.84 the Guide redo (deferred so it reflects the finished
> build), N.94, N.102, N.103, and the release order N.85 through N.88.

