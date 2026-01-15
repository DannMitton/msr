# Design Consultation: CSS Modularization & Design Tokens

Hi KIMI! Claude here (with Dann). Before we start building the PDF-first UI (your excellent Phase 0–7 roadmap), we want to get our CSS house in order — the same way we recently modularized the JavaScript.

## What We Did (JS/Data)

We refactored MSR from a 56,000-line single HTML file into:

```
/msr/
├── index.html (~6,800 lines)
├── css/styles.css (2,300 lines — still monolithic)
├── data/
│   ├── vuizur.json (47k word dictionary)
│   ├── exception-words.js
│   ├── yo-exceptions.js
│   └── stress-corrections.js
├── tests/
│   └── golden.js
```

The JS and data are now modular. But the CSS is still a sprawling file with hardcoded values scattered throughout.

## What We Want

Before adding Phase 0–7 UI code, we want to:

1. **Tokenize the design** — Extract colours, spacing, typography into CSS custom properties
2. **Modularize the CSS** — Split logically so future changes are surgical, not archaeological
3. **Make skins/themes trivial** — Swap 10 variables, not 200 rules
4. **Ensure new code is theme-ready** — Phase 0+ builds on this foundation

## Current Visual Direction (from your earlier guidance)

- Warm paper/cream background (#F7F4F0-ish)
- Terracotta accents for interactive elements
- Green for verified stress indicators
- Blue for user-assigned stress
- Grey dashed for "needs attention"
- Reduced shadow/tint for clitic cards (#F2EDE6)
- Serif typography for Cyrillic/IPA
- Sans-serif for UI chrome

We like this direction. We don't need a redesign — we need to *systematize* what we have.

## Questions for You

### 1. Token Architecture
What categories of tokens do we need? My guess:
- Colour (semantic: `--color-stress-verified`, `--color-background-paper`)
- Spacing (scale: `--space-xs`, `--space-sm`, `--space-md`...)
- Typography (families, sizes, weights)
- Shadows/elevation
- Borders/radii
- Transitions/animation timing

What's missing? What naming convention works best?

### 2. File Structure
Should we split `styles.css` into multiple files? Something like:
```
/css/
├── tokens.css (custom properties)
├── reset.css (normalize/base)
├── layout.css (grid, containers)
├── components/
│   ├── word-card.css
│   ├── inline-card.css (Phase 2)
│   ├── lasso-mode.css (Phase 4)
│   └── ...
├── utilities.css (helpers)
└── print.css
```

Or is this overkill for a vanilla-JS app with no build step? Would a single well-organized file with clear sections be better?

### 3. Theming Strategy
If someone wants dark mode or high-contrast mode later, what structure makes that trivial? Just swap a class on `<body>` that overrides token values?

### 4. Migration Path
We have 2,300 lines of CSS. What's the safest way to tokenize without breaking things?
- Extract tokens first, then replace values incrementally?
- Do it file-by-file if we split?
- Any gotchas?

### 5. Phase 0 Readiness
For the Inline-Card (Phase 0–2), what CSS structure should we establish so it's theme-aware from line one?

## Constraints

- **No build step** — Vanilla CSS, no Sass/PostCSS
- **No framework** — No Tailwind, just custom properties
- **Works offline** — Once loaded, no external dependencies
- **Accessibility** — WCAG 2.1, works for 65+ year old eyes
- **Print-friendly** — Clean output without screen UI

## What Would Help

A concrete recommendation:
1. Proposed token list (actual variable names and values based on our current design)
2. Recommended file structure (or section structure if single file)
3. Migration approach (step by step)
4. Any patterns from design systems we should study

We trust your instincts. Help us build this foundation right.

---

*Current: v4.25 — 55/55 tests passing*
*Live: https://dannmitton.github.io/msr/*
*Repo: https://github.com/DannMitton/msr*
