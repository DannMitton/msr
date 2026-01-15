# MSR Session Handoff

**Last Updated:** 2026-01-15 (Phase-2 modules uploaded)**Current Version:** 4.34 (cross-boundary voicing + proclitic fixes)
**Stable Baseline:** v4.24-STABLE-BASELINE.zip (rollback point)

---

## PROCEDURAL REMINDERS FOR CLAUDE

**Read this section first. These are working patterns Dann expects.**

1. **When asking Dann to test a build, ALWAYS include both links:**
   - GitHub repo: https://github.com/DannMitton/msr
   - Live site: https://dannmitton.github.io/msr/

2. **Do not rely on general Russian phonetics knowledge.** Grayson's singer-based schema is the authority. When uncertain, check:
   - Code comments (which cite Grayson page numbers)
   - Ask Dann for a screenshot
   - Never assume based on speech-based Russian phonetics

3. **One thing at a time.** Dann has AuDHD. Sequential steps, not nested complexity.

4. **When writing test expectations,** verify against Grayson before committing. Don't write tests based on phonetics intuition.

5. **Be generous to Future Claude.** Document decisions, edge cases, and procedural commitments in this file.

6. **When debugging transcription issues,** first check if the word is in the exception dictionary — it may be bypassing normal logic entirely.

---

## CURRENT STATE

### Test Suite Status
- **Golden tests:** 66/66 passing (100%) ✓
- **Test file:** `/msr/tests/golden.js`
- Run with: `runGoldenTests()` in browser console
- Includes cross-boundary voicing tests (11 phrase tests)

### Cross-Boundary Voicing Assimilation (NEW in v4.34)
- **Location:** `applyCrossBoundaryVoicing()` in index.html (~line 2807)
- **Grayson reference:** Chapter 6.3, pp. 250-257
- **Rules implemented:**
  - Voicing: к→ɡ, с→з, т→д, ф→в, п→б before voiced obstruents
  - Devoicing: г→к, з→с, д→т, в→ф, б→п before voiceless obstruents
  - Special allophones: ч→dʒʲ, ц→dz, х→ɣ (p.256-257)
  - Punctuation blocks assimilation (p.250, Rule #1)
  - Sonorants and vowels don't trigger voicing changes

### Proclitic Handling (FIXED in v4.34)
- Vowelless proclitics (к, в, с, б) now display with visual spacing
- Proclitics preserved when user reassigns stress
- Key fix: `combinedWord` property stores merged form for reprocessing

---

## PDF-FIRST UI ROADMAP (from KIMI)

Phased implementation plan ready. Each phase is standalone and shippable:

| Phase | Size | What | Status |
|-------|------|------|--------|
| 0 | S | Stub inlineCard.js container | **NEXT** |
| 1 | S | CSS underline affordance | |
| 2 | M | Wire underline → Inline-Card | |
| 3 | S | Settings toggle + analytics beacon | |
| 4 | M | Quick-mark lasso mode | |
| 5 | S | Keyboard shortcuts | |
| 6 | M | Undo ring-buffer | |
| 7 | S | Print-lock | |
| 8 | L | Measure & decide on workspace | |

---

## KEY GRAYSON REFERENCES

| Topic | Page | Rule |
|-------|------|------|
| Immediate posttonic а | p. 97 | → /ɑ/ (not reduced) |
| Immediate posttonic о | p. 97 | → /ʌ/ |
| Word-initial о | p. 97 | → /ɑ/ |
| Interpalatal а | p. 104 | → /a/ (fronted) |
| Interpalatal е | p. 106 | → /e/ (close-mid) |
| и never reduces | p. 96 | Always /i/ |
| ч always palatalized | p. 176 | → /tʃʲ/ |
| р palatalization | p. 209 fn. 277 | Only after stressed и/е/э AND before cluster |
| Unstressed е after ж/ш/ц | p. 127 | → /ɨ/ |
| сч cluster | p. 236, 287 | → /ʃʲʃʲ/ or /ʃʲː/ |
| Cross-boundary voicing | p. 250-257 | Regressive across word boundaries |
| Punctuation blocks assimilation | p. 250 | Rule #1 |
| Special voiced allophones | p. 256-257 | ч→dʒʲ, ц→dz, х→ɣ |

---

## SESSION 2026-01-15 ACCOMPLISHMENTS

1. **Cross-boundary voicing assimilation** — full implementation
   - Test harness: `testPhrase()` function in golden.js
   - Main app: `applyCrossBoundaryVoicing()` in index.html
   - 11 new phrase tests added, all passing

2. **Proclitic visual spacing** — vowelless proclitics show space
   - CSS: `.proclitic-spacer` class
   - Logic: Detects absorbed proclitics in first syllable

3. **Proclitic preservation bug fixed**
   - Root cause: `correctedWord` used `mainWord` instead of `combinedWord`
   - Fix: Added `combinedWord` property, updated `applyStressChange()`

4. **Tests:** 56/56 → 66/66 (added cross-boundary tests)

5. 6. **Phase-2 JS Modularization complete** — uploaded to GitHub
   7.    - `src/core/`: transcribe.js, engine.js, phonology.js, dictionary.js, styles.js
         -    - `src/ui/`: render.js
              -    - `src/tests/`: ch6.js
                   -    - `src/index.js`: Main entry point with module exports
                        -    - Live site verified working after upload

6. **Branding discussion:** KLUCH (КЛЮЧ) name proposed by KIMI
   - Means "key" in Russian
   - Tagline: "The key to sung Russian phonetics — offline, print-ready, authoritative"
   - Logo concepts explored (K + keyhole + ʲ) — not finalized

---

## KNOWN ISSUES / PARKING LOT

1. **из Петербурга** — syllabification issue (test commented out)
   - Output: `/is pʲi tʲɪ rbu rɡɑ/`
   - Expected: `/is pʲi tʲɪr bur ɡɑ/`
   - Not a voicing issue — syllabification algorithm edge case

2. **Branding** — KLUCH name under consideration, logo not finalized

---

## LINKS

- **GitHub repo:** https://github.com/DannMitton/msr
- **Live site:** https://dannmitton.github.io/msr/
- **Grayson dissertation:** https://digital.lib.washington.edu/researchworks/items/2368f63f-f31c-416e-bab5-3dde43ccc980
