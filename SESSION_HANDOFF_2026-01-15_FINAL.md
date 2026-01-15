# MSR Session Handoff — 2026-01-15

## IMMEDIATE CONTEXT FOR FUTURE CLAUDE

**Status: Card face update is COMPLETE and LIVE.**

The new card structure is deployed:
- IPA at top (discreet grey)
- Cyrillic in middle (large, bold)
- Divider line
- English translation at bottom (italic grey)

### What To Do First
1. Verify the live site works: https://dannmitton.github.io/msr/
2. Test with: `девушка любовь сердце красота ночь`
3. Check console shows: "Loaded 51643 words from openrussian dictionary"

### Next Priority: Typography Polish
Kimi provided a systematic spacing framework (see below). This is the next implementation task. Do NOT apply piecemeal; implement as a cohesive system.

---

## WHAT WAS COMPLETED THIS SESSION

1. **OpenRussian dictionary** — Replaced Vuizur (deleted repo, unclear license) with OpenRussian (CC-BY-SA-4.0, 51,643 words with stress + English glosses)

2. **New functions in index.html:**
   - `lookupGloss(word)` — Returns English translation or null
   - `lookupStress(word)` — Updated to handle new `{ stress, gloss }` format

3. **Card face restructure:**
   - HTML template changed (lines ~4070-4250 in index.html)
   - New CSS classes: `.ipa-top`, `.card-divider`, `.translation`
   - CSS added at end of `css/styles.css` (lines 2523+)

4. **GitHub commits this session:**
   - "Replace Vuizur with OpenRussian dictionary (CC-BY-SA-4.0)"
   - "Remove vuizur.json (replaced by openrussian-dict.json)"
   - "Fix dictionary path: openrussian.json → openrussian-dict.json"
   - "Add card face structure styles (IPA top, translation bottom)"
   - "Refine card face vertical spacing"
   - "Loosen card face spacing, add breathing room"

---

## PROJECT ARCHITECTURE

### Repository Structure
```
https://github.com/DannMitton/msr
├── css/
│   └── styles.css          # External stylesheet (tokenized CSS variables)
├── data/
│   ├── openrussian-dict.json   # NEW: 51K words with stress + gloss
│   ├── exception-words.js      # Grayson Appendix F (250 entries)
│   ├── stress-corrections.js   # Manual overrides
│   ├── yo-exceptions.js        # Ё handling
│   └── [DELETED: vuizur.json]  # Removed this session
├── src/
│   ├── core/
│   │   ├── dictionary.js   # Module version (not currently used by main app)
│   │   ├── engine.js
│   │   ├── phonology.js
│   │   ├── transcribe.js
│   │   └── transcript.js
│   ├── ui/
│   └── index.js
├── tests/
│   └── golden.js           # 296 tests passing
├── index.html              # Main app (monolithic, 7000+ lines)
├── build.mjs
└── package.json
```

### Key Insight: Monolithic vs Modular
The app currently runs from **index.html** (monolithic) which loads:
- External CSS from `css/styles.css`
- External data from `data/*.js` files
- External dictionary from `data/openrussian-dict.json` (fetched async)

The `src/` folder contains a **modular refactor in progress** but the live site uses index.html directly.

**CRITICAL:** When making changes, edit `index.html`, NOT the src/ modules (unless specifically working on the modular build).

---

## DICTIONARY SYSTEM

### Current Format (OpenRussian)
```javascript
{
  "слово": { "stress": 0, "gloss": "word" },
  "любовь": { "stress": 1, "gloss": "love" }
}
```

### Lookup Priority (highest to lowest)
1. `STRESS_CORRECTIONS` — Manual overrides
2. `EXCEPTION_WORDS` — Grayson Appendix F
3. `STRESS_DICTIONARY` — OpenRussian (51K words)
4. `wikiHarvest` — User-added words (localStorage)

### Key Functions in index.html
```javascript
lookupStress(word)  // Returns stress index or -1
lookupGloss(word)   // Returns English translation or null (NEW)
hasStressEntry(word) // Returns boolean
```

---

## CARD FACE STRUCTURE (IMPLEMENTED)

### Current Live Structure
```
┌─────────────────┐
│   /IPA/         │  (top, discreet grey, regular)
│   CYRILLIC      │  (middle, large, bold)
│   ─────────     │  (divider)
│   translation   │  (bottom, italic, same grey as IPA)
└─────────────────┘
```

### Flip Side (unchanged)
```
┌─────────────────┐
│   Cyrillic      │  (top left, italic, discreet)
│                 │
│   /IPA/         │  (centred, aligned with face's Cyrillic)
└─────────────────┘
```

### Design Rationale
- IPA and translation are "bookends" framing the Cyrillic
- Font weight/size trumps vertical position — eye goes to bold Cyrillic first
- Italic distinguishes meaning (translation) from pronunciation (IPA)
- Mirrors the three-line structure of the planned PDF interface
- Face and flip Cyrillic/IPA are vertically aligned (handshake achieved)

### CSS Location
New styles are at the END of `css/styles.css`, starting around line 2523 with the comment:
```css
/* ============================================================================
   NEW WORD CARD FACE STRUCTURE (2026-01-15)
```

### Known Issue
Spacing feels slightly cramped. Kimi's typography framework (below) provides the systematic fix.

---

## GRAYSON RULES IMPLEMENTED

### Vowels
- Stressed о/ё → /o/ (NOT /ɔ/) — Grayson p. 86
- и never reduces → always /i/ — Grayson p. 96
- Akanye: unstressed о/а → /ɑ/ (pretonic) or /ʌ/ (remote)

### Consonants
- Soft н → /ɲ/ (palatal nasal, NOT /nʲ/)
- Hard л → /ɫ/, Soft л → /lʲ/
- г → /ɡ/ (IPA opentail, NOT Latin g)

### Forbidden IPA Glyphs
```javascript
{
  'g': 'ɡ',    // Latin → IPA opentail
  'ə': 'ʌ',    // Schwa → wedge
  'ɐ': 'ɑ',    // Near-open central → back open
  'nʲ': 'ɲ',   // n + palatalization → palatal nasal
  'ɔ': 'o'     // Open-mid → close-mid
}
```

---

## USER PREFERENCES (DANN)

### Communication Style
- Has AuDHD — prefers clear, sequential steps (one or two at a time)
- Direct, no fluff or padding
- Provide links proactively (GitHub repo, live site)
- Use Canadian spelling, Oxford comma, Chicago citations
- No em dashes — use commas, colons, or separate sentences

### Technical Preferences
- Works directly through GitHub web interface (no local repo)
- macOS user
- When guiding through GitHub: be explicit about clicks, buttons, exact text

### Project Standards
- Grayson's dissertation is the SOLE AUTHORITY for transcription rules
- All rules require page citations
- 296 tests must pass — never break the golden test suite

---

## KEY LINKS

- **GitHub Repo:** https://github.com/DannMitton/msr
- **Live Site:** https://dannmitton.github.io/msr/
- **Grayson Dissertation:** https://digital.lib.washington.edu/researchworks/items/2368f63f-f31c-416e-bab5-3dde43ccc980
- **OpenRussian Source:** https://github.com/Badestrand/russian-dictionary

---

## TEST COMMANDS

In browser console at live site:
```javascript
runGoldenTests()      // Should show 296/296 passing
MSR.harvest.stats()   // Show harvest statistics
MSR.harvest.data()    // Show harvested words
```

---

## FUTURE ROADMAP (from Kimi consultation)

### UI Improvements Planned
1. **Edit/Performance mode toggle** — Separate editing from clean output view
2. **PDF-first interface** — Three-line interlinear (Cyrillic / IPA / gloss)
3. **Word cards as pop-ups** — Click PDF line to see detailed card
4. **Debouncing** — Prevent UI thrash during rapid input
5. **Chunked rendering** — Progressive display for long texts

### FOR KIMI: Card Face Layout Consultation

**Current state:** New three-element card face implemented (IPA top / Cyrillic middle / translation bottom) but spacing feels cramped. Current CSS uses flex column with margins.

**The challenge:** How to let the cards breathe while presenting sparse information generously? The visual divider between Cyrillic and translation needs particular attention.

**Design intent:**
- IPA and translation are "bookends" framing the dominant Cyrillic
- IPA: regular weight, discreet grey
- Translation: italic, same discreet grey
- Cyrillic: large, bold, commands attention despite vertical position
- Divider separates phonetic (above) from semantic (below)

---

### KIMI'S TYPOGRAPHY & SPACING FRAMEWORK (2026-01-15)

*To be implemented systematically next session*

- **Vertical Rhythm Ratio**: `1.5:2:1.5:2:1`  
  (IPA→Divider→Cyrillic→Translation, where 1 = base line-height)

- **Card Height**: Content-driven with `max-height: ~180px` cap. Use CSS `grid-auto-rows: minmax(120px, auto)` for grid harmony.

- **Long Translations**: Progressive disclosure  
  - 0–60 chars: Full display  
  - 60–120 chars: 2 lines + fade-out overlay  
  - 120+ chars: "More…" link with smooth expand

- **Optical Centering**: Apply `transform: translateY(-3%)` to Cyrillic row for visual balance (compensates for less aggressive descenders).

- **Implementation Note**: These are interconnected—apply as a system, not piecemeal.

---

### Dictionary Enhancements
- ✅ Gloss display on cards (COMPLETED this session)
- Multi-schema support (Belov, Walters/Sheil)
- Toggleable reconstitution for performance contexts

---

## SESSION LOG

### 2026-01-15 (This Session)
1. ✅ Extracted OpenRussian dictionary (51,643 words) via browser console
2. ✅ Replaced Vuizur with OpenRussian in GitHub
3. ✅ Fixed dictionary path (openrussian.json → openrussian-dict.json)
4. ✅ Verified live site loads new dictionary
5. ✅ Added `lookupGloss()` function to index.html
6. ✅ Implemented card face restructure (IPA top / Cyrillic / divider / translation)
7. ✅ Added CSS for new card structure
8. ✅ Refined spacing (multiple iterations)
9. ✅ Consulted Kimi on typography framework
10. ✅ Saved Kimi's recommendations for next session
11. ⏳ NEXT: Implement Kimi's spacing framework systematically

### Previous Sessions
- v4.4: 296 tests passing, Ch6 "Why" screen integrated
- v4.2: 250 exception entries, ⟨р⟩ gating rule implemented
- Modular refactor: Extracted CSS, dictionaries to separate files

---

## RECOVERY CHECKLIST

If starting fresh, Future Claude should:

1. [ ] Read this document completely
2. [ ] Verify live site: https://dannmitton.github.io/msr/
3. [ ] Test with: `девушка любовь сердце красота ночь`
4. [ ] Check cards show IPA/Cyrillic/translation structure
5. [ ] Check console for "Loaded 51643 words from openrussian dictionary"
6. [ ] Run `runGoldenTests()` in console — should be 296/296

If something is broken, check recent commits at:
https://github.com/DannMitton/msr/commits/main

---

## QUICK REFERENCE: GITHUB EDITING

Dann works through GitHub web interface. When guiding:

1. **Navigate:** Provide full URL (e.g., https://github.com/DannMitton/msr/edit/main/index.html)
2. **Search:** Cmd+F in edit mode, type search term, press Return
3. **Replace:** Use the Replace field below search, click "Replace All"
4. **Commit:** Green "Commit changes" button → add message → confirm
5. **Deploy wait:** GitHub Pages takes 1-2 minutes; hard refresh with Cmd+Shift+R

---

## CODE LOCATIONS (index.html line numbers approximate)

These will drift as code changes, but useful starting points:

| What | Search for | ~Line |
|------|-----------|-------|
| Dictionary loading | `openrussian-dict.json` | 6990 |
| `lookupStress()` | `function lookupStress` | 779 |
| `lookupGloss()` | `function lookupGloss` | 800 |
| Card face template | `word-card-front word-card` | 4087 |
| IPA top element | `ipa-top` | 4091 |
| Translation element | `class="translation"` | 4252 |
| Card flip template | `word-card-back` | 4257 |
| Golden tests | `runGoldenTests` | varies |

For CSS (`css/styles.css`):

| What | Search for | ~Line |
|------|-----------|-------|
| Card face styles | `NEW WORD CARD FACE STRUCTURE` | 2523 |
| `.ipa-top` | `.word-card-front .ipa-top` | 2529 |
| `.translation` | `.word-card-front .translation` | 2549 |
| `.card-divider` | `.word-card-front .card-divider` | 2541 |

---

## TRANSCRIPT LOCATION

Full conversation transcript saved at:
`/mnt/transcripts/2026-01-15-21-12-04-openrussian-dictionary-integration-ui-design.txt`

Use `view` tool to read if you need details from earlier in the conversation.

---

*Document created: 2026-01-15*
*Last updated: 2026-01-15 21:10 UTC*

**Next session priority:** Implement Kimi's typography framework (vertical rhythm, optical centering, progressive disclosure for long translations). Apply as a system, not piecemeal.
