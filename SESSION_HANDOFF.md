# MSR Session Handoff

**Last Updated:** 2026-01-14
**Current Version:** 4.25 (audit script added)
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
- **Golden tests:** 55/55 passing (100%) ✓
- **Test file:** `/msr/tests/golden.js`
- Run with: `runGoldenTests()` in browser console

### Exception Audit Ready
- **Audit script:** `/msr/tests/audit-exceptions.js`
- Run with: `auditExceptions()` in browser console
- Will identify redundant vs valid exceptions
- **Action:** Run audit, remove redundant entries, keep true exceptions

### Clitic Styling Complete
- Optical-grey tint on standalone clitics (во, ко, со, не, ни)
- Reduced shadow
- No size reduction (rejected — caused "broken picket fence" visual)

---

## PDF-FIRST UI ROADMAP (from KIMI)

Phased implementation plan ready. Each phase is standalone and shippable:

| Phase | Size | What |
|-------|------|------|
| 0 | S | Stub inlineCard.js container |
| 1 | S | CSS underline affordance |
| 2 | M | Wire underline → Inline-Card |
| 3 | S | Settings toggle + analytics beacon |
| 4 | M | Quick-mark lasso mode |
| 5 | S | Keyboard shortcuts |
| 6 | M | Undo ring-buffer |
| 7 | S | Print-lock |
| 8 | L | Measure & decide on workspace |

**Next steps:** 
1. Run exception audit
2. Clean up redundant exceptions
3. Begin Phase 0

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

## SESSION 2026-01-14 ACCOMPLISHMENTS

1. **Tests:** 40/55 → 55/55 (100%)
2. **Bugs fixed:**
   - Clitic о → /ɑ/ (not /ʌ/)
   - р palatalization requires following cluster
   - день exception had wrong IPA (was /ɛ/, fixed to /e/)
   - няня added as exception
   - Test expectations corrected for interpalatal, posttonic vowels
3. **UI:** Clitic optical-grey styling
4. **Planning:** Full PDF-first roadmap from KIMI
5. **Infrastructure:** Audit script for exception dictionary

---

## LINKS

- **GitHub repo:** https://github.com/DannMitton/msr
- **Live site:** https://dannmitton.github.io/msr/
- **Grayson dissertation:** https://digital.lib.washington.edu/researchworks/items/2368f63f-f31c-416e-bab5-3dde43ccc980
