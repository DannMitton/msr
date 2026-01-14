# MSR Session Handoff

**Last Updated:** 2026-01-14
**Current Version:** 4.18 (in progress)

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

---

## CURRENT STATE

### Test Suite Status
- **Golden tests:** 40/55 passing (72.7%) as of last run
- **Test file:** `/msr/tests/golden.js`
- Run with: `runGoldenTests()` in browser console

### Bugs Identified (from test review session)

**Fixed:**
1. ✅ во, ко, со — clitic о → /ɑ/ (added isClitic passthrough)

**Still to fix:**
2. ⏳ мир — р palatalization needs following cluster, not just preceding front vowel (p. 209 fn. 277)
3. ⏳ няня — (a) first vowel interpalatal → /a/, (b) word-final posttonic я → /ɑ/
4. ⏳ день — interpalatal е → /e/, not /ɛ/ (p. 106)
5. ⏳ сердце, солнце — unstressed е after ц → /ɨ/, not /ɪ/ (p. 127)

### Test Expectations Corrected
These were wrong due to speech-based assumptions:
- мама, папа: posttonic а → /ɑ/ (not /ʌ/)
- ночь: ч → /tʃʲ/ (always palatalized)
- книга: posttonic а → /ɑ/, use /ɡ/ not /g/
- её: first е is interpalatal (j on both sides) → /i/
- сердце, солнце: unstressed е after ц → /ɨ/

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

---

## DESIGN DECISIONS & MSR EXTENSIONS

These fill gaps where Grayson doesn't specify:

1. **Word-final posttonic я** → /ɑ/ (parallels posttonic а pattern)
   - See: TODO-grayson-questions.md #1

2. **Standalone clitic о** → /ɑ/ (singable, functions as pretonic to host)
   - во, ко, со get full dark-a, not reduced wedge

3. **Notation preferences:**
   - Gemination: /ʃʲː/ preferred over /ʃʲʃʲ/ (visual economy)
   - Toggle available in UI

---

## FILES & STRUCTURE

```
/msr/
├── index.html          # Main app (6800+ lines)
├── css/styles.css      # Extracted styles
├── data/
│   ├── vuizur.json         # 47k word stress dictionary
│   ├── exception-words.js  # Pronunciation exceptions
│   ├── yo-exceptions.js    # е→ё corrections
│   └── stress-corrections.js
├── tests/
│   └── golden.js       # Golden-master test suite
├── TODO-grayson-questions.md  # Unresolved edge cases
├── SESSION_HANDOFF.md  # This file
└── LICENSE             # AGPL-3.0
```

---

## NEXT STEPS

1. Fix remaining 4 bugs (мир, няня, день, сердце/солнце)
2. Run tests, verify pass rate improves
3. UI polish: grey out clitic cards
4. Continue Grayson verification for remaining chapters

---

## LINKS

- **GitHub repo:** https://github.com/DannMitton/msr
- **Live site:** https://dannmitton.github.io/msr/
- **Grayson dissertation:** https://digital.lib.washington.edu/researchworks/items/2368f63f-f31c-416e-bab5-3dde43ccc980
