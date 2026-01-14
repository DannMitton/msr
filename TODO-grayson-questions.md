# TODO: Unresolved Grayson Questions

**Purpose:** Track transcription edge cases where Grayson's dissertation does not provide explicit guidance. These require clarification before full release.

**Process:** 
1. Document the gap
2. Implement a principled default
3. Contact Grayson for clarification
4. Revise if needed

---

## 1. Word-final unstressed я (not in reflexive endings)

**Example:** няня (nanny)

**The gap:** Grayson specifies:
- p. 112: я → /ɪ/ when preceded by palatalized C and **followed by unpalatalized C**
- p. 109: я → /ʌ/ only in reflexive endings (-ться, -тся)

Word-final я has no following consonant, so neither rule applies.

**Our decision:** Default to /ɑ/ (full dark-a).

**Rationale:**
- Parallels immediate posttonic а (мама, папа → /ɑ/, Grayson p. 97)
- The я functions as palatalization indicator + underlying /ɑ/
- Palatalization is "spent" on the preceding consonant
- Full vowel maximizes singable quality where no reducing force is present
- Avoids "curious realizations" that might distract listeners

**Implementation:** няня → /ˈɲa ɲɑ/
- First syllable: stressed interpalatal → /a/ (Grayson p. 104)
- Second syllable: word-final posttonic я → /ɑ/ (MSR default)

**Question for Grayson:** What is the intended realization of word-final unstressed я outside of reflexive verb endings? Should it reduce to /ɪ/ (ikanye pattern), maintain as /ɑ/ (parallel to posttonic а), or follow another rule?

**Status:** Implemented as /ɑ/. Pending clarification.

---

## 2. Bare /l/ in loanwords (Appendix F)

**Example:** тремоло (tremolo)

**The gap:** Grayson p. 350 transcribes тремоло as /ˈtrɛ mo lo/ with bare /l/, not /ɫ/ or /lʲ/. This is the only instance we've found of unqualified /l/ in his transcriptions. Other loanwords on the same page use /lʲ/ (e.g., солитер → /sʌ lʲi ˈtɛr/).

**Possible interpretations:**
1. Typo/inconsistency
2. Intentional: Italian loanwords preserve Italian /l/ quality (neither Russian velarized nor palatalized)

**Our decision:** Treat as exception. Native Russian words always use /ɫ/ or /lʲ/. Loanwords may need case-by-case handling.

**Question for Grayson:** Is the bare /l/ in тремоло intentional to preserve Italian pronunciation, or is this an oversight?

**Status:** Noted. Native words use /ɫ/ or /lʲ/. Loanwords flagged for review.

---

## 3. UI: Visual indication for unstressed clitics

**Need:** Singers need to know that standalone clitics (во, ко, со, не, etc.) are inherently unstressed and prosodically subordinate to their following host word.

**Proposed solution:** Grey out or visually dim the word card for standalone clitics. This subtly communicates "this word has a definite vowel, but minimize its importance in favour of the stress that follows."

**Implementation ideas:**
- Reduce opacity on clitic word cards (e.g., opacity: 0.7)
- Use a muted background colour
- Add a subtle visual connector to the following word?

**Status:** Queued for UI polish phase.

---

## Template for Future Entries

### [Number]. [Brief description]

**Example:** [word]

**The gap:** [What Grayson does/doesn't say]

**Our decision:** [What we implemented]

**Rationale:** [Why]

**Implementation:** [IPA result]

**Question for Grayson:** [Specific question]

**Status:** [Implemented/Pending]
