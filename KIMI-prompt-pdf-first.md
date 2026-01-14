# Design Consultation: PDF-First Interface Redesign

Hi KIMI! Following up on the clitic styling (great suggestions — we implemented #1 + #2). Now we're considering a more fundamental UX shift and would love your perspective.

## Current Architecture

MSR currently has two views:

1. **Workspace** — Grid of word cards showing Cyrillic + IPA. Users click syllables to assign stress. Always visible after transcription.

2. **Singer's View** — Clean, PDF-like interlinear layout (Cyrillic above, IPA below). This is what singers actually want to print/use.

Users toggle between them. The Workspace feels like an intermediate step before getting to the "real" output.

## Proposed Shift: PDF-First

**What if we eliminated the Workspace as a persistent view?**

New flow:
1. User inputs Russian text
2. Immediately see the Singer's View (live PDF-like output)
3. Click any word-IPA pair → Word card appears **on demand** for editing
4. Edits reflect instantly in the PDF view
5. Close the card, continue reading/printing

The word cards still exist — they're just invoked contextually rather than displayed en masse.

## Why This Might Be Better

- **Shows users what they came for** — The transcription, not a workbench
- **Familiar paradigm** — Singers use PDFs; this feels like an editable PDF
- **Less cognitive load** — One view to understand, not two modes
- **Mobile-friendly** — PDF flows naturally; card grid doesn't
- **Print-ready by default** — WYSIWYG

## Our Concerns

1. **Discovery** — How do users know words are clickable? We need affordance without clutter.

2. **Interaction pattern** — When clicked, should the word card appear as:
   - Modal (centered overlay)?
   - Popover (anchored to the word)?
   - Inline expansion (word grows into card in place)?
   - Sidebar panel?

3. **Batch editing** — Power users assigning stress to many words. Click-edit-close repeated 20 times is tedious. How do we support flow state?

4. **Visual continuity** — The word card has stress circles, syllable boundaries, Why panel. How does this coexist with the clean PDF aesthetic?

## Context

- Singers range from students to professionals, ages 20-75
- Primary use: preparing Russian art song repertoire
- Output often printed or used on iPad at piano
- Accessibility matters (WCAG 2.1)
- Current word cards have: clickable syllables, stress indicators (green/blue/grey circles), flip animation to "Why" panel

## Questions for You

1. What interaction pattern best balances discoverability with clean aesthetics?

2. How should the word card manifest when invoked? (modal/popover/inline/panel)

3. Any patterns from PDF editors, e-readers, or annotation tools we should study?

4. How do we support batch editing without reverting to the full Workspace?

5. Should there be a "power user" mode that shows all cards, or is that just the old Workspace by another name?

We're excited about this direction but want to avoid trading one set of UX problems for another. What do you think?

---

*Live site: https://dannmitton.github.io/msr/*
*GitHub: https://github.com/DannMitton/msr*
