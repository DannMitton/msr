# MSR TODO List

**Created**: 2026-01-13
**Purpose**: Track bugs, improvements, and future work discovered during development

---

## 🔴 BUGS (Fix Before Release)

### BUG-001: ё-rule not triggering correctly
**Discovered**: 2026-01-13 (Golden Master testing)
**Severity**: High
**Description**: Words containing ⟨ё⟩ are not receiving stress on the ё syllable, resulting in incorrect reduction.

**Evidence from Golden Master**:
| Input | Output | Expected | Issue |
|-------|--------|----------|-------|
| ёлка | jɪɫkʌ | ˈjolkə | ё reduced to /ɪ/ instead of stressed /o/ |
| берёза | bʲirʲɪzʌ | bʲɪˈrʲozə | ё reduced to /ɪ/ instead of stressed /o/ |
| Фёдор | fʲɪdʌr | ˈfʲodər | ё reduced to /ɪ/ instead of stressed /o/ |
| чёрные | tʃʲɪrnɨjɪ | ˈtʃʲornɨjə | ё reduced to /ɪ/ instead of stressed /o/ |

**Grayson citation**: ⟨ё⟩ always bears stress; there are no exceptions.

**Fix approach**: 
1. Store canonical ⟨ё⟩ forms in dictionary (Vuizur likely already does)
2. Lookup function checks both ⟨е⟩ and ⟨ё⟩ variants
3. When ⟨е⟩ input matches ⟨ё⟩ dictionary entry, restore the dieresis
4. Once ⟨ё⟩ is present, stress is automatic (no further lookup needed)
5. Add "Why" explanation: "The dieresis is often omitted in print. MSR restores ⟨ё⟩ where applicable."

**Post-modularization**: This is a clean fix in `stress.js` — isolated, testable, quick.

---

### BUG-002: Stress click not working
**Discovered**: 2026-01-13
**Severity**: High
**Description**: Clicking syllables to reassign stress does not move the stress marker. `toggleStress()` exists and works when called from console, but click events aren't reaching it.

**Fix approach**: Debug `handleSyllableClick()` event propagation. May be related to lock button addition.

---

### BUG-003: Syllable lock buttons not rendering
**Discovered**: 2026-01-13
**Severity**: Medium
**Description**: The 🔒 icons for syllable locking are not visible in the UI, though the code exists.

**Fix approach**: Check if lock button HTML is being generated in `renderOutput()`.

---

## 🟡 IMPROVEMENTS (Post-Release)

### IMP-001: Footer arrow animation
**Description**: CSS animation for ▲/▼ toggle not working as expected.
**Priority**: Low (cosmetic)

### IMP-002: Onboarding modal
**Description**: First-launch name prompt implemented but not tested.
**Priority**: Medium

### IMP-003: Stress circle colour coding and provenance
**Description**: Implement green/yellow stress circles to indicate provenance.
- Green = verified (dictionary, Wiktionary, ё-rule)
- Yellow = user override or unverified assignment
- Remove icon clutter from workspace
- Move full provenance details to Why section per word card

**Behaviour:**
- Word loads with dictionary stress → Green
- User clicks different syllable → Yellow
- User clicks back to dictionary syllable → Green
- Unknown word, user assigns → Yellow
- Unknown word, Wiktionary confirms → Yellow → Green (+ harvest)

**Edge Cases (resolved with KIMI):**
1. Multiple toggles: Green = matches dictionary, Yellow = doesn't (history irrelevant)
2. Shared devices: Session-only persistence — each load starts fresh with dictionary stress
3. PDF export: Yellow exports as-is with footnote "*User-assigned stress (differs from dictionary)"

**Visual Design (REVISIT COLOUR):**
```css
/* Terracotta/warm amber - signals "different" not "wrong" */
/* TODO: Reconsider this colour. Dann wants something more welcoming/affirming,
   possibly a soft blue. Decide during cosmetic refresh with final palette. */
.user-stress {
  background: linear-gradient(135deg, #D4A574 0%, #C19660 100%);
  border: 2px solid #B88856;
}
```
- Hover hint on yellow: "Click dictionary stress to reset to standard Russian"
- Micro-animation yellow→green (100ms fade) for trust-building

**Why section text examples:**
- Green: "Stress on syllable 3 (ко) per Vuizur dictionary."
- Yellow override: "You have placed stress on syllable 1 (мо), overriding the dictionary default (syllable 3)."
- Yellow unknown: "Stress on syllable 2 (user-assigned). MSR has no dictionary entry for this word."

**Priority**: Medium (cosmetic refresh)
**Status**: Design approved, ready to implement

### IMP-006: Stress reassignment modal redesign
**Description**: The "Who assigned this stress?" modal is visually rough — needs KIMI polish.
**Current state**: Basic modal with two blue buttons (My choice / Composer's score) and Cancel.
**Issues**: 
- Heavy, interrupting UX
- Button styling feels dated
- May not need to be a modal at all (could be inline or contextual)

**Priority**: Medium (UX polish)
**Status**: Awaiting KIMI consultation

### IMP-005: Why panel pop/transition design
**Description**: Ask KIMI about modern popup/transition patterns for the "Why" explanation panel.
**Current state**: Panel anchors to parent card edge, basic fade animation.
**Question for KIMI**: What are current best practices for contextual popups? Options might include:
- Popovers with arrow/tail pointing to source
- Slide-out drawers
- Modal overlays with backdrop blur
- Micro-animations (spring physics, scale-in from source)
- Mobile-friendly sheet patterns

**Priority**: Low (polish)
**Status**: Awaiting KIMI consultation

### IMP-004: UI/UX cosmetic refresh
**Description**: Comprehensive design overhaul to reduce clutter and improve intuitiveness.
- Audit every UI element for necessity
- Establish clear interaction hierarchy
- Simplify default view
- Test with fresh users

**Design reference**: `/design/kimi-style-guide-v2.html` (KIMI's accessible card lab)
- Warm paper tint (#fdfcfa), serif typography (Georgia)
- Green (#3a5a40) = verified, Terracotta (#c9703f) = user override
- Progressive disclosure via card click/tap
- Accessibility: keyboard nav, aria-labels, reduced-motion support

**Priority**: Medium
**Status**: Design kit saved, awaiting behaviour fixes before integration

---

## 🟢 FUTURE FEATURES (Roadmap)

See `MSR_ROADMAP.md` for full feature roadmap.

---

## ✅ COMPLETED

- [x] Wiktionary harvest system (v4.15)
- [x] Developer mode triple-click (v4.15)
- [x] Syllable lock engine code (v4.16) — removed, blocking clicks
- [x] GitHub Pages deployment
- [x] Golden master test suite (50 tests passing)
- [x] Pre-refactor backup
- [x] Phase 1: Extract CSS to external file
- [x] Phase 2: Extract Vuizur dictionary to JSON
- [x] Phase 3: Extract exception dictionaries to JS files
- [x] BUG-002 FIXED: Stress click now works (removed lock buttons, fixed exception override)

---

## 🔶 SESSION STOPPING POINT

**Date**: 2026-01-13
**Version**: v4.18 (deployed to GitHub Pages, but with issues)
**Where we stopped**: Debugging why IPA doesn't recalculate when user reassigns stress. Console debug logging added but not appearing in browser. Yellow/green circle colour coding CSS added but not triggering.

**Unresolved this session**:
1. Yellow circles not showing for user-override stress (CSS exists, class not being applied)
2. IPA not recalculating when stress moves (exception words use hardcoded IPA)
3. Debug console.log statements not appearing (unclear why)

**Next steps**:
1. Hard refresh / cache clear and retest
2. Verify debug version actually deployed to GitHub
3. Trace why `stressSource === 'user'` isn't being set correctly
4. Once working: IPA recalculation, yellow circles, card width sizing

---

**Last Updated**: 2026-01-13
