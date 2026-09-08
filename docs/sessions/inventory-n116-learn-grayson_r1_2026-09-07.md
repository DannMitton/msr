# Inventory: Learn (English) and Grayson's Dissertation

Sources examined:

1. `/mnt/user-data/uploads/ilya-rewrite/apps/web/src/lib/components/Reading/LearnContent.svelte` (4099 lines). English Learn content runs from line 2077 (`<h2 id="learn-about">`) to line 4067 (the closing attribution paragraph), before the `{/if}` at line 4069 and the `<style>` block. Line numbers below are from this file as delivered in this container.
2. `/mnt/user-data/uploads/Downloads/Grayson - 2012 - Russian Lyric Diction.pdf`, extracted with `pdftotext -layout`. Page numbers below are the PDF's own physical page count as `pdftotext` reports it (its form-feed count, page 1 being the copyright page), not the printed page numbers in the dissertation's own pagination (front matter uses roman numerals; the body restarts at "1"). Where useful I give both, as "physical N (printed M)". The printed-to-physical offset is a constant +16 for the entire body and appendices (printed page 1 = physical page 17), confirmed at multiple points below.

## 1. Learn as it stands

All headings in the English half, in document order. "Approx." in the line column means the tag was located by search and the line number is exact for the tag itself; none of these are estimates, so no rows are marked approximate.

| Heading text | id | Line | What it teaches |
|---|---|---|---|
| About This Module | learn-about | 2077 | Frames Learn as a pedagogical resequencing of Grayson's 2012 dissertation for singers, situates Grayson among earlier Russian diction resources (Challis, Piatak and Avrashov, Richter, Belov, Olin, McMaster, Thomas), and states three boundaries: not a Russian course, not a substitute for Grayson, not a guide to using Ilya. |
| The Learning Arc | learn-arc | 2085 | States the module's seven-unit structure and its single governing principle, quoted below. |
| The Letters (Section 1) | learn-unit-1 | 2092 | Introduces all 33 modern Cyrillic letters plus 4 obsolete pre-1918 letters, their names, categories, and default IPA anchors. |
| The Russian Alphabet Song | learn-u1-song | 2100 | Presents a mnemonic song (arr. Dann Mitton 2017, after Ken Griffiths) that sets all 33 letters in dictionary order to a folk melody. |
| The Alphabet | learn-u1-alphabet | 2109 | Gives the full letter-by-letter table (name, category, IPA anchor, notes) referenced above. |
| What You Already Know | learn-u1-familiar | 2160 | Sorts the alphabet by visual familiarity to Latin-script readers into "Familiar Shapes," "False Friends," and "New Shapes," each with its own table. |
| The Two Signs | learn-u1-signs | 2230 | Explains that ⟨ь⟩ (soft sign) palatalises the preceding consonant and ⟨ъ⟩ (hard sign) blocks that palatalisation, with neither carrying a sound of its own. |
| A Note on ⟨Ё⟩ | learn-u1-yo | 2240 | Warns that Russian print often omits the diaeresis on ⟨ё⟩, printing it as ⟨е⟩, changing both stress and vowel quality, and describes how Ilya restores it. |
| The Glyph Table | learn-u1-glyphs | 2244 | Presents a scrollable table of letterforms across serif, serif italic, and sans typefaces, flagging shapes that depart radically from Latin forms. |
| Try This | learn-u1-try | 2719 | Directs the reader to paste Russian text into Ilya's Transcription tab and notice how letters transform under stress and palatalisation, previewing Sections 2 to 7. |
| Stress (Section 2) | learn-unit-2 | 2731 | Establishes that Russian stress is lexical (word-by-word, not rule-governed) and classifies vowels into three stress-behaviour categories that govern Sections 3 and 4. |
| Stress changes meaning. | learn-u2-meaning | 2750 | Gives homograph pairs (мука/мука, стоит/стоит, уже/уже) where stress position alone changes meaning. |
| Stress moves. | learn-u2-moves | 2768 | Shows that stress shifts across grammatical forms of the same word, using вода's declension as the example. |
| Stress is a dictionary problem. | learn-u2-dictionary | 2783 | Argues that stress exceptions are too numerous for rules, so Ilya resolves stress via a dictionary of 943,096 entries rather than derivation, and describes how Ilya flags unresolved or ambiguous cases. |
| How stress sounds. | learn-u2-sounds | 2789 | Explains that sung Russian communicates stress through intensity and articulatory commitment rather than duration, since the composer fixes rhythm. |
| Try this in Ilya. | learn-u2-try | 2793 | Exercise: transcribe стоит under each stress placement and observe the vowel changes. |
| Spotting the missing ⟨ё⟩. | learn-u2-yo | 2797 | Lists suffix patterns (-ёнок, -ёр, -ённ-) where a missing diaeresis commonly hides ⟨ё⟩, and flags все/всё as the highest-frequency homograph pair in art song. |
| Stressed Vowels (Section 3) | learn-unit-3 | 2817 | Introduces the six stable, stressed cardinal vowel sounds of sung Russian as the targets that all later transformations depart from. |
| A note on /o/ | learn-u3-note-o | 2851 | Extended discussion of Russian /o/ as a fusion vowel (closed lips over an open tongue position), the disagreement among sources on /o/ versus /ɔ/, and why Grayson transcribes it simply as /o/. |
| Two vowels change colour near soft consonants. | learn-u3-interpalatal | 2858 | Details the "three roads to [e]" (interpalatal, always-hard-preceding, word-initial ⟨э⟩) and the "one road to [a]" (truly interpalatal ⟨а⟩/⟨я⟩), each with counter-examples. |
| Four vowel letters carry a hidden consonant. | learn-u3-iotated | 2906 | Explains iotated vowels (⟨я⟩, ⟨е⟩, ⟨ё⟩, ⟨ю⟩): a j-glide in certain positions, or a palatalisation signal with no glide after a consonant. |
| ⟨ё⟩ is always stressed. | learn-u3-yo | 2932 | States that ⟨ё⟩'s stress is the one fully predictable stress in Russian, and that Ilya restores the letter from its dictionary when print omits the diaeresis. |
| Try this in Ilya. | learn-u3-try | 2938 | Exercise: transcribe шесть versus шест to hear the always-hard road to [e] triggered by cluster softness. |
| Vowel Reduction (Section 4) | learn-unit-4 | 2944 | Introduces vowel reduction as the loss of vowel distinctiveness under lack of stress, distinguishes the three unaffected vowels from the three that transform, and catalogues five unstressed vowel sounds. |
| ⟨о⟩ and ⟨а⟩ follow different paths when unstressed. | learn-u4-akanye | 2967 | Describes akanye: a full position-by-position table showing where ⟨о⟩ and ⟨а⟩ converge and where (immediately post-stress) they diverge, with хорошо as the worked example. |
| ⟨е⟩ and ⟨я⟩ reduce toward [ɪ]. | learn-u4-ikanye | 2989 | Describes ikanye and its two refinements: reduction to [ɨ] after always-hard consonants, and fronting to /i/ in interpalatal position. |
| Reconstitution is an informed choice, not an obligation. | learn-u4-reconstitution | 3005 | Explains reconstitution (partially undoing reduction on sustained notes), the "one-way door" from [ʌ] back to /ɑ/ but never to /o/, and includes a signed editorial note from Dann Mitton disputing one of Grayson's reconstitution claims (citing Dr. Alexei Kochetov) and describing where Ilya departs from Grayson's rule. |
| Try this in Ilya. | learn-u4-try | 3036 | Exercise: transcribe хорошо and жена with reconstitution toggled on and off. |
| The Consonants (Section 5) | learn-unit-5 | 3046 | Introduces the 21 consonant letters, notes that Russian consonants are dental rather than alveolar, and previews the five that need focused attention. |
| How familiar is the Russian consonant system? | learn-u5-familiar | 3054 | Full consonant-by-consonant table giving IPA, closest equivalent in another lyric diction language, and articulatory notes. |
| Which consonants form voiced-voiceless pairs? | learn-u5-pairs | 3085 | Tables the six voiced-voiceless obstruent pairs, names the four sonorants and the glide /j/ as exempt from voicing assimilation, and flags ⟨ц⟩ and ⟨ч⟩ as having no dedicated voiced counterpart letter. |
| Which sounds require the singer's focused attention? | learn-u5-attention | 3107 | Umbrella heading (h4) over five h5 subsections on ⟨л⟩, ⟨х⟩, ⟨р⟩, the hushers, and the affricates. |
| The two sounds of Russian ⟨л⟩ | learn-u5-l | 3109 | Distinguishes velarised hard-l [ɫ] from palatalised soft-l [lʲ], gives the conditioning environments for each, and quotes Grayson (p. 184) on how Russian /lʲ/ differs from Italian [ʎ]. |
| ⟨х⟩: the velar fricative | learn-u5-x | 3126 | Distinguishes Russian /x/, articulated at the front of the velum, from the German uvular achlaut. |
| ⟨р⟩: the trill | learn-u5-r | 3130 | States that sung Russian /r/ is always lightly trilled, with length varying by position, and warns against an Italian-caricature trill. |
| The hushers: ⟨ж⟩, ⟨ш⟩, and ⟨щ⟩ | learn-u5-hushers | 3134 | Describes the ladle-shaped tongue posture for ⟨ж⟩/⟨ш⟩ and distinguishes single-length ⟨ш⟩ from double-length palatalised ⟨щ⟩, noting the Moscow versus older St. Petersburg pronunciation of ⟨щ⟩. |
| The affricates: ⟨ц⟩ and ⟨ч⟩ | learn-u5-affricates | 3140 | Explains ⟨ц⟩ /ts/ and ⟨ч⟩ /tʃʲ/ as single phonemes despite multi-symbol IPA spelling. |
| Which consonants never change hardness or softness? | learn-u5-fixed | 3146 | Names the three always-hard (⟨ж⟩, ⟨ш⟩, ⟨ц⟩) and two always-soft (⟨ч⟩, ⟨щ⟩) consonants, notes that a following soft sign is ignored after the always-hard three, and states their role as palatalisation boundaries. |
| What do the two signs do? | learn-u5-signs | 3177 | Umbrella heading over two h5 subsections detailing the functional roles of ⟨ь⟩ and ⟨ъ⟩, each with minimal-pair tables. |
| ⟨ь⟩ (мягкий знак): the soft sign | learn-u5-soft | 3181 | Describes the soft sign's primary palatalising function and its secondary function of inserting a /j/ glide before a following iotated vowel. |
| ⟨ъ⟩ (твёрдый знак): the hard sign | learn-u5-hard | 3198 | Describes the hard sign's post-1918 role between a prefix and an iotated-vowel root, blocking palatalisation and forcing a glide. |
| What happens to voiced consonants at the end of a word? | learn-u5-devoicing | 3212 | States the final-devoicing rule (voiced obstruents devoice word-finally, as in German), gives worked examples, and notes the sonorants' exemption. |
| Try this in Ilya | learn-u5-try | 3235 | Exercise: transcribe мал versus мальчик to hear velarised versus palatalised ⟨л⟩, and друг to hear final devoicing. |
| Palatalization (Section 6) | learn-unit-6 | 3245 | Section banner; the section is organised as one umbrella h4 with the mechanism, followed by six further h4 subsections (6.2 through 6.7 in the prose's own numbering, referenced in-text as 6.1 to 6.7). |
| What Palatalization Is | learn-u6-what | 3249 | Defines palatalization as a simultaneous secondary articulation (tongue toward the hard palate) rather than a sequential consonant+glide, cites Grayson's "arch, pronounce, peel" model (Grayson 2012, 205) and his use of [ɲ] over [nʲ], and gives everyday English analogues ("key" vs "car"). |
| What Signals Palatalization on the Page? What Do I Look for? | learn-u6-signals | 3389 | Lists the "palatalizing agents" (soft sign, soft-series vowels, ⟨ч⟩/⟨щ⟩, another palatalized consonant), introduces regressive assimilation of palatalization, covers the 1989 Kiel Convention's modern IPA superscript notation versus deprecated palatal-hook symbols, and notes Cheri Montgomery's workbook as the only other print resource using the modern notation consistently. |
| What Stops the Spread? | learn-u6-stops | 3486 | Tables six boundaries that halt regressive palatalization: always-hard consonants, a vowel, the hard sign (with a ⟨в⟩/⟨с⟩/⟨з⟩ exception), a new palatalizing agent, the word boundary, and punctuation (citing Grayson 2012, 206 and 208). |
| Paired versus Unpaired | learn-u6-paired | 3581 | Tables the fifteen paired (hard/soft) consonants against the five unpaired (three always-hard, two always-soft). |
| Regressive Palatalization in Clusters | learn-u6-clusters | 3634 | Gives five rules (from Derwing and Priestly 1980) governing which consonants palatalize regressively within a cluster by place of articulation, plus a described "progressive exception" for /r/ after a stressed front vowel (citing Grayson 2012, 209). |
| Putting It Together | learn-u6-practice | 3712 | Seven worked examples of increasing complexity (стол through симметрический), adapted from Grayson (2012, 210 to 211), applying the rules from the preceding subsections. |
| Velar-i [ɨ] | learn-u6-velari | 3748 | Explains [ɨ] as the vowel Russian produces where palatalization cannot reach, gives its articulatory description, worked examples (жить, цирк), and extends the principle across word boundaries (к Игорю). |
| Assimilation and Boundaries (Section 7) | learn-unit-7 | 3799 | Section banner distinguishing palatalization (a tongue-arch question) from voicing assimilation (a larynx-vibration question), both regressive. |
| Two Kinds of Regressive Assimilation | learn-u7-two | 3803 | Direct comparison table of voicing assimilation versus palatalization (physical locus, binary, direction, trigger), establishing that a single consonant can undergo both independently. |
| What Happens When Voiced Meets Voiceless? | learn-u7-voiced | 3829 | States the core rule (the rightmost obstruent in a cluster sets the voicing of the whole cluster), gives worked multi-consonant examples, tables the six paired plus three allophonic-only voiced/voiceless pairs, and introduces the ⟨в⟩ exception (it undergoes but does not trigger assimilation) and the мягко/легче exception routing ⟨г⟩ through /x/. |
| What Stops the Spread of Voicing? | learn-u7-stops | 3874 | Names four constraints: only obstruents trigger it, sonorants block transmission, the ⟨в⟩ exception, and punctuation as an absolute boundary. |
| Do the Same Voicing Rules Apply between Words? | learn-u7-boundary | 3898 | States that voicing assimilation crosses the word boundary under the same rules, citing Grayson's four cross-boundary rules (pp. 250 to 251), introduces proclitics and enclitics, and covers the three allophones ([dz], [dʒʲ], [ɣ]) that arise only through cross-boundary assimilation. |
| Where Did the L Go? Consonant Deletion | learn-u7-deletion | 3932 | Tables ten consonant clusters where a letter is silently deleted (стн, здн, стл, etc.), with сердце, поздно, солнце, and здравствуйте as worked examples. |
| Mergers and Acquisitions | learn-u7-mergers | 3957 | Tables consonant-cluster mergers into a single lengthened sound (сж → /ʒː/, сч → /ʃʲʃʲ/, etc.), and separately treats the context-dependent -тс-/-дс-/-тьс- clusters and the цвет exception. |
| Two Rules-of-One: скучно and что | learn-u7-unusual | 3981 | Names the "скучно rule" and "что rule," where ⟨ч⟩ loses its stop component and reduces to /ʃ/ in specific words but not their near-relatives (конечный, нечто). |
| Twice the Fun: Geminates | learn-u7-geminates | 3997 | Explains that Russian geminates are understated (quoting Grayson p. 226), tables which doubled-letter clusters double in pronunciation and which do not, and describes Ilya's geminate notation toggles. |
| Try This in Ilya | learn-u7-tryit | 4017 | Consolidated exercise set covering voicing assimilation, cross-boundary assimilation, deletion, merger, rules-of-one, and geminates, closing the "Teaching Layer" of Learn. |
| What These Rules Do Not Teach (Section 8) | learn-coda | 4039 | Argues that some correct pronunciations (смерть's palatalized /sʲ/, скучно's elision, сейчас's full lyric form) are lexically or traditionally governed rather than rule-derivable, and states that Ilya handles these through cited, non-generalising word-specific annotations rather than rules. |
| Try This | learn-try | 4057 | Closing summary of the "paste into Transcription tab" pedagogical device used throughout the module. |
| A Note on Notation | learn-notation | 4061 | States that IPA notation choices are paradigmatic rather than absolute, that ten print resources show ten different approaches, and that Ilya's notation toggles make these choices visible and reversible. |

Note on ids: `learn-coda`, `learn-try`, and `learn-notation` are each used twice in this file, once in the French half (lines 2034, 2052, 2056) and again in the English half (lines 4039, 4057, 4061). This is a duplicate-id situation across the two language halves of the same document; see Section 4.

The module's own stated structure, from "The Learning Arc" (line 2085 to 2087):

> "The module is organised into seven units that follow a single governing principle: meet the sounds first, then learn what happens to them."

The seven units are then presented as a `chapter-band` banner immediately before each h3: The Letters, Stress, Stressed Vowels, Vowel Reduction, The Consonants, Palatalization, and Assimilation and Boundaries. An eighth section, "What These Rules Do Not Teach," follows as a coda outside the seven-unit arc, explicitly marking material that resists the rule-based system taught in Sections 1 to 7.

## 2. Grayson's dissertation

Page numbers are given as "physical N (printed M)" where physical N is the pdftotext page count from the start of the PDF file and printed M is the dissertation's own printed page number at that location (front matter uses roman numerals i to x; I give the arabic equivalent as "printed 1" is the first page of the Introduction). The offset between physical and printed page in the body and appendices is a constant +16, confirmed by cross-checking a dozen headings against the running page-number line pdftotext extracts.

| Chapter / section | Physical (printed) page | Description |
|---|---|---|
| Abstract | 3 to 4 | Summarises the dissertation's two purposes: a survey of four existing Russian lyric diction guides plus three dissertations, and Grayson's own annotated guide; states that the guide "advances in difficulty" as it proceeds (quoted below). |
| Introduction (unnumbered, before Chapter 1) | 17 (1) | Grayson's personal account of the gap he perceived: competent singers mispronouncing Russian even after consulting Piatak and Avrashov, motivating the guide. |
| Chapter 1 — Survey of Relevant Texts involving Russian Lyric Diction | 19 (3) | Chapter title and opening "Overview" subsection on the same page, framing the survey of four anthology/manual guides and three dissertations. |
| Overview | 19 (3) | States that very few texts aid English speakers in pronouncing sung Russian, and names the four commonly available guides. |
| The Survey | 22 (6) | Header introducing the survey's structure (the TOC lists this as a separate line from Overview, on printed page 6). |
| — Anton Belov, Libretti of Russian Operas, Vol. 1 | 22 (6) | Reviews Belov's vowel-sound chart and transcription approach. |
| — Richard F. Sheil, A Singer's Manual of Foreign Language Dictions | 32 (16) | Reviews Sheil's manual, including its Russian chapter contributed by McMaster. |
| — Laurence R. Richter, Tchaikovsky's Complete Song Texts | 48 (32) | Reviews Richter's word-by-word transcription series. |
| — Jean Piatak and Regina Avrashov, Russian Songs and Arias | 55 (39) | Reviews the most widely used anthology of prepared Russian texts. |
| — Emilio Pons, "The Singer's Russian: a guide..." | 68 (52) | Reviews Pons's dissertation guide. |
| — Sherri Moore Weiler, "Solving Counterproductive Tensions..." | 71 (55) | Reviews Weiler's dissertation. |
| — Rose Michelle Mills-Bello, "Russian Songs and Arias..." | 72 (56) | Reviews Mills-Bello's dissertation. |
| Chapter 2 — A Practical Guide to Russian Lyric Diction with Annotations | 73 (57) | Chapter title page opening the guide proper. |
| Preface | 74 (58) | States the guide's purpose and audience, and gives Grayson's own account of the guide's progression: the vowel and consonant chapters lead "from the most familiar phonemes... to the most difficult and unusual," and "as the next chapters advance in number, so do their topics advance in complexity," moving from palatalization through assimilation to stress, reduction, unusual forms, and finally history and politics (quoted below). |
| Preliminaries | 76 (60) | Section banner over six subsections on approach, IPA conventions, transcription philosophy, stress, phonemic theory, and sources. |
| — Approach and Layout of the Guide | 76 (60) | Explains how the guide is organised and how to read its tables and transcriptions. |
| — On the International Phonetic Alphabet of 1993 (Revised 1996 and 1999) | 77 (61) | Describes the IPA conventions adopted, including the 1989 Kiel Convention's superscript palatalization marker. |
| — Russian Lyric Diction versus Speech Pronunciation, and IPA Transcription | 78 (62) | Distinguishes the conventions of sung diction from conversational speech pronunciation. |
| — A Note about Syllabic Stress | 81 (65) | Preliminary orientation to stress as a governing feature, expanded fully in Chapter 7. |
| — Phonemes, Allophones, Features and Assimilation: Definitions and Importance | 83 (67) | Defines the core linguistic vocabulary used throughout the guide. |
| — On Transcription: Virgules and Brackets and Unorthodox IPA Usage | 89 (73) | Explains Grayson's convention for phonemic slashes versus phonetic brackets and departures from strict IPA usage. |
| — Acknowledgement of Major Sources | 94 (78) | Credits the phonological and lexicographic sources underlying the guide. |
| Chapter 3 — The Vowels (Sounds and Printed Letters) | 96 (80) | Chapter title, opening with an overview of the five vowel phonemes, the semi-vowel, and the sounds' Cyrillic letters. |
| Section 1 — The Cardinal Vowels and Allophone [0] in the Stressed Position | 97 (81) | Presents the stressed cardinal vowel inventory (transcribed in the PDF's Cyrillic-substitution font as "[0]," almost certainly representing IPA [ɔ] or a related symbol; see Section 4). |
| Section 2 — The Semi-vowel /i/ (body heading: "The /i/-glide") | 112 (96) | Covers the /j/ semi-vowel/glide; note the section is titled differently in the TOC ("The Semi-vowel /i/") versus the body running head ("The /i/-glide"). |
| Section 3 — The Cardinal Vowels and Allophone [0] in Unstressed Positions | 113 (97) | Extends the stressed-vowel inventory to unstressed contexts. |
| Section 4 — Intermediate Allophones Only in Stressed Position | 120 (104) | Covers allophones intermediate between cardinal values, found only under stress. |
| Section 5 — Reduced or Centralized Allophones | 124 (108) | Covers the reduced/centralised vowel allophones (the akanye/ikanye outputs). |
| Section 6 — The /i/+Vowel Clusters | 130 (114) | Covers iotated-vowel clusters (⟨я⟩, ⟨е⟩, ⟨ё⟩, ⟨ю⟩) including their stress and assimilation behaviour and the palatalization-indicator letters. |
| Section 7 — Vowel Assimilation and Reduction: the Phonology | 141 (125) | Gives the phonological account of vowel fronting (assimilation) and reduction as processes. |
| Section 8 — Vowel Reconstitution | 144 (128) | Covers the practice of restoring reduced vowels partway toward their cardinal values for singing, including the reconstitution chart cited by Learn. |
| Review of Vowel Sounds and Coinciding Printed Letters | 146 (130) | Summary review table of the chapter. |
| Cyrillic Letter to Phoneme Vowel Index | 151 (135) | Quick-reference index (body heading order differs slightly from the TOC's "Cyrillic Letter to Vowel Phoneme Index"). |
| A Note on Diphthongs and Triphthongs | 152 (136) | Clarifies that Russian /i/+vowel clusters are not true diphthongs or triphthongs. |
| Chapter 4 — The Consonants | 153 (137) | Chapter title, opening with an overview of the 35 consonant phonemes. |
| Introduction | 154 (138) | Brief chapter introduction preceding Section 1. |
| Section 1 — The Unpalatalized Consonant Phonemes (Alphabet Spelling) | 155 (139) | Covers the hard consonant series, organised (per TOC) into subsections on cognates, "the Greeks," "false friends," and the hushers plus /v/. |
| — The Cognates | 156 (140) | (TOC only; not independently confirmed in the extracted body text — see Section 4.) |
| — The Greeks | 161 (145) | (TOC only.) |
| — The False Friends | 168 (152) | (TOC only.) |
| — The Hushers plus W | 177 (161) | (TOC only.) |
| Section 2 — The Palatalized Consonant Phonemes (Alphabet Spelling) | 185 (169) | Covers the soft consonant series: hushers, dentals, labials, lateral and nasals, velars, and the difficult phoneme /rʲ/. |
| — The Palato-laminal Fricatives or Hushers | 187 (171) | (TOC only.) |
| — — A Special Case of Palatalization | 190 (174) | (TOC only.) |
| — The Dentals | 193 (177) | (TOC only.) |
| — The Labials | 197 (181) | (TOC only.) |
| — Lateral -L- and the Nasals | 199 (183) | (TOC only.) |
| — The Velars | 203 (187) | (TOC only.) |
| — A Difficult Palatalized Phoneme (/rʲ/) | 206 (190) | (TOC only.) |
| Section 3 — The Signs: Tvyordyĭ Znak and Myagkiĭ Znak | 208 (192) | Covers the hard and soft signs as orthographic markers. |
| — Tvyordyĭ Znak (Hard Sign) | 209 (193) | (TOC only.) |
| — Myagkiĭ Znak (Soft Sign) | 211 (195) | (TOC only.) |
| Section 4 — Final Consonants | 215 (199) | Covers final-position consonant behaviour, including final devoicing. |
| Chapter 5 — The Palatalization Process | 219 (203) | Chapter title, opening with the claim that palatalization, though integral to the affected phoneme, propagates to surrounding phonemes. |
| Section 1 — Palatalization: Overview | 220 (204) | Distinguishes the phonetic/phonological account of palatalization from the orthographic (spelling) account, and introduces regressive assimilation of palatalization. |
| Section 2 — The Palatalization Process | 221 (205) | Gives the mechanical three-step process ("prepare the tongue," "execute the consonant," "peel") that Learn paraphrases as "arch, pronounce, peel." |
| Chapter 6 — Applied Assimilation in Russian | 228 (212) | Chapter title, framing assimilation's greatest effect as being on consonants in clusters and at the final/word-boundary position. |
| Section 1 — Consonant Clusters | 229 (213) | Covers consonant-cluster assimilation generally. |
| — Regressive Assimilation of Voicing | 231 (215) | (TOC only.) |
| Section 2 — Special Cases of Assimilation (body heading: "Special Cases of Consonant Assimilation in Clusters") | 241 (225) | Covers double consonants/geminates and special letter-cluster readings (deletion, merger, and the rules-of-one). |
| — Double Consonants and Reading Doubled Letters | 241 (225) | (TOC only; same page as the Section 2 heading.) |
| — Special Readings for Certain Letter Clusters | 251 (235) | (TOC only.) |
| Section 3 — Assimilation across Word Boundaries (body heading: "Assimilation Across Word Boundaries") | 264 (248) | Covers cross-boundary voicing assimilation, clitics, and the implied phrase. |
| — Defining the Word Boundary | 264 (248) | (TOC only.) |
| — Types of Assimilation | 265 (249) | (TOC only.) |
| — Regressive Assimilation of Voicing | 266 (250) | (TOC only; this is the passage Learn cites as "pp. 250 to 251" for the four cross-boundary rules.) |
| — Determining the Implied Phrase | 269 (253) | (TOC only.) |
| — Regressive Assimilation of Voicing across the Word Boundary | 271 (255) | (TOC only.) |
| Review of the Consonant Sounds and Coinciding Printed Letters | 274 (258) | Summary review table of the chapter. |
| Cyrillic to Phoneme Index of All Letters in Alphabetical Order | 276 (260) | Full-alphabet quick-reference index. |
| Chapter 7 — Syllabic Stress and Vowels: Spelling and Reading Rules; Shifting Stress | 278 (262) | Chapter title. |
| Introduction — Syllabic Stress in Russian | 279 (263) | States that syllable position relative to stress, not spelling, is the actual guide to Russian pronunciation, referring back to points made "in the introduction to this guide." |
| Section 1 — When Syllabic Stress Matters (body heading adds: "Vowel Spelling and Reading Rules") | 280 (264) | Explains where stress affects vowel reduction. |
| Section 2 — Patterns of Shifting Stress | 284 (268) | Covers shifting stress across grammatical forms. |
| — In the Declension of Nouns, Adjectives and Pronouns | 284 (268) | (TOC only.) |
| — In Verb Conjugation | 285 (269) | (TOC only.) |
| — In Deverbal Formations (Verbal Adjectives and Verbal Adverbs) | 288 (272) | (TOC only.) |
| Chapter 8 — Unusual Spelling and Grammatical Forms, Common but Confusing Forms, and Some Common Pronunciation Exceptions | 290 (274) | Chapter title, framing the chapter around opera and art song's frequent draws from poetry with archaic or unusual forms. |
| Section 1 — Looking up ⟨ё⟩ or not (TOC's OCR-garbled rendering: "-/- or not") | 291 (275) | Covers when to consult a dictionary for suspected hidden ⟨ё⟩ and related pronoun and declension forms. |
| — Common Pronouns (and Declined Forms) with Only a ⟨ё⟩ Form | 291 (275) | (TOC only.) |
| — Pronoun Problems | 292 (276) | (TOC only; TOC text itself is OCR-garbled at this row.) |
| — In Declension Endings, Prefixes and Suffixes for Nouns and Adjectives | 293 (277) | (TOC only.) |
| — In Verb Conjugations | 294 (278) | (TOC only.) |
| — The Deverbal Endings | 296 (280) | (TOC only.) |
| Section 2 — The Deverbal Ending Forms: Verbal Adjectives and Adverbs | 296 (280) | Covers verbal-adjective and verbal-adverb endings and their pronunciation. |
| Section 3 — The Suffixes -ция and -ционный with Palatalized -ц- | 299 (283) | Covers this specific suffix family's palatalization behaviour. |
| Section 4 — Non-Reflexive -ся and -сья | 300 (284) | Covers pronunciation of these reflexive-looking but non-reflexive endings. |
| Section 5 — A Few Common Pronunciation Exceptions | 303 (287) | Covers miscellaneous lexical pronunciation exceptions. |
| Chapter 9 — History, Politics and the Russian Language: Changes in Letters and Pronunciation | 305 (289) | Chapter title, framing Russian social and political history as intertwined with the language's development. |
| Section 1 — Orthography | 306 (290) | Covers the 1918 spelling reform, obsolete letters, and outmoded spellings. |
| — Spelling Reforms and Obsolete Letters | 306 (290) | (TOC only.) |
| — Outmoded Spellings | 307 (291) | (TOC only.) |
| — Contractions of Certain Words | 308 (292) | (TOC only.) |
| Section 2 — Issues of Pronunciation Style | 310 (294) | Covers Old Muscovite pronunciation, its political and regional associations, and Russian stage diction. |
| — What is Old Muscovite? | 310 (294) | (TOC only.) |
| — Moscow Politically Speaking | 312 (296) | (TOC only.) |
| — Old Muscovite as Regional Accent: Akanye, and Ikanye versus Ekanye | 313 (297) | (TOC only.) |
| — One Way to Determine Historical Pronunciation | 314 (298) | (TOC only.) |
| — Other Traditions of Old Muscovite affecting Russian Lyric Diction | 315 (299) | (TOC only.) |
| — The Adjective Ending -ий | 317 (301) | (TOC only.) |
| A Note on Style, Vocal Technique, and Russian Lyric Diction | 320 (304) | Standalone essay on stylistic variation in Russian lyric diction. |
| A Note for the Chorus Master: On the Choral Singing of Modern Russian | 322 (306) | Standalone essay on choral applications. |
| Appendix A: Review Chart of the International Phonetic Alphabet | 328 (312) | Comparative IPA chart across English, Italian, French, German, and Russian. |
| Appendix B: Russian Cyrillic Alphabet with Obsolete Letters | 329 (313) | Full alphabet chart including the four pre-1918 obsolete letters. |
| Appendix C: Phonetic Transcription Style Conversion | 330 (314) | Chart converting between different phonetic transcription styles/authors. |
| Appendix D: Phoneme (in IPA) to Cyrillic Letter Index | 333 (317) | Reverse-direction index from IPA phoneme to Cyrillic letter. |
| Appendix E: Common Russian Grammatical Forms with Pronunciations | 337 (321) | Extensive tables of Russian grammatical paradigms (noun declension, adjective forms, pronouns, verb conjugation) with pronunciations. |
| Appendix F: Lexicon of Selected Pronunciation Exceptions to Orthography | 360 (344) | Word list of loanwords and other items whose pronunciation departs from standard orthographic rules, organised by exception type. |
| Appendix G: Russian Composer Names: Cyrillic, IPA, and Transliterations | (354, physical page not established) | Composer-name pronunciation guide; see Section 4 — the extraction of this page returned essentially no text. |
| Appendix H: Suggested References for Russian Transcription and Pronunciation | 371 (355) | Annotated bibliography of dictionaries and reference works. |
| Appendix I: Roman Letter Transliteration for Cyrillic Letter Conversion Chart | 373 (357) | Chart of Roman-letter transliteration systems with style variations. |
| Appendix J: Suggestion for a Phonetic Transcription Shorthand | 374 (358) | Grayson's proposed shorthand for hand-transcribing Russian phonetically. |
| Appendix K: Essays on Interesting Topics of Russian Diction | 375 (359) | Umbrella heading over four extended essays. |
| — The Story of /o/: Is Russian /o/ open or closed? | 375 (359) | The spectral-analysis essay on Russian /o/ that Learn's "A note on /o/" section draws on and cites by name. |
| — Shcha-Cha-Cha! The History of the Shifting Pronunciation of ⟨щ⟩ | 414 (398) | Historical essay on the changing pronunciation of ⟨щ⟩ (TOC's "O" here is again an OCR artifact for Cyrillic ⟨щ⟩). |
| — The Problem of Schwa | 423 (407) | Essay on schwa in Russian phonology and its relevance to lyric diction. |
| — Russian Cyrillic: Cyril and Methodius and the Origins of a Slavic Alphabet | 428 (412) | Historical essay on the origins of the Cyrillic alphabet. |
| Appendix L: Russian Texts to Translations by Craig Grayson | 431 (415) | Grayson's own translations of Russian texts. |
| Appendix M: Russian Singers Suggested for Listening | 433 (417) | Recommended listening list of native Russian singers, referenced in Learn's "About This Module" framing. |
| Bibliography with Annotations of Selected Works | 435 (419) | Annotated bibliography closing the dissertation. |

Grayson's own words on the guide's order of difficulty. The clearest statement is in the Abstract (physical page 4):

> "The annotated guide introduces the sung sounds of Russian and the corresponding Cyrillic letters, advancing in difficulty and covering elements of articulation, phonological rules, and Cyrillic orthography. As the chapters advance, the most important elements of Russian phonological theory are explored in greater depth."

A second, more specific statement of the same claim appears in the Preface (physical page 75, printed page 59), describing the guide's chapter-by-chapter progression:

> "This text gradually introduces the sounds of Russian and the Cyrillic alphabet. The Russian speech sounds are organized into two chapters, the Vowels and the Consonants. Each chapter leads from the most familiar phonemes and intuitive Cyrillic letters to the most difficult and unusual... As the next chapters advance in number, so do their topics advance in complexity. The topics trend from palatalization to assimilation as applied to final consonants, consonant clusters, and vowels to syllabic stress, patterns of shifting stress, vowel reduction and reconstitution to unusual grammatical forms and common pronunciation exceptions. The concluding chapter covers historical, political and social issues that have affected Russian spelling and pronunciation, and what those sounds and/or spellings are today."

Note that the task brief describes this passage as appearing "in the introduction"; in the PDF as extracted, the "advances in difficulty" wording is in the Abstract (physical page 4) and the fuller "advance in complexity" restatement is in the Preface to Chapter 2 (physical page 75), not in the unnumbered "Introduction" section (physical pages 17 to 18), which I read in full and which does not contain this claim in these words.

## 3. Side by side

Judgments here are limited to matching subject matter; no claim is made about which treatment is better.

| Learn section | Corresponding Grayson section(s) | In both / Grayson only / Learn only | Learn's citation of Grayson |
|---|---|---|---|
| The Letters (Section 1) | Ch. 2 (guide layout), Appendices B and D | In both | Cited explicitly: "Ch. 2, Appendices B and D" (line 2727). |
| Stress (Section 2) | Ch. 7 (Syllabic Stress, pp. 263 to 273), Ch. 2 (pp. 65 to 66), Ch. 8 §1 (pp. 274 to 278) | In both | Cited explicitly, with page ranges (line 2812). Also cites Baytukalov "cited in Grayson p. 273," a source reached through Grayson rather than Grayson's own words. |
| Stressed Vowels (Section 3), incl. the /o/ note | Ch. 3 §1, §3 (cardinal and unstressed vowels), Appendix K "The Story of /o/" (pp. 359 to 397) | In both | Cited by name for the /o/ material: "Grounded in Grayson (2012), Appendix K, 'The Story of /o/', pp. 359 to 397" (svelte comment, line 2849 to 2850, not visible to the reader but present in source). The rendered prose also names "Grayson's spectral analysis (Appendix K...)" directly (line 2854). |
| Vowel Reduction (Section 4), incl. reconstitution | Ch. 3 §§3, 5, 7 to 8 (pp. 97 to 129), Ch. 7 §1 (pp. 263 to 267); reconstitution chart p. 128, note p. 129; fn. 306 on p. 266 | In both, with one explicit, signed departure | Cited explicitly with page numbers (line 3042). The reconstitution callout (lines 3025 to 3032) quotes Grayson directly ("remain sung as [ɨ]," p. 129) and then argues against part of his rule, making this the one place Learn is knowingly Learn-only in its conclusion while remaining Grayson-sourced in its premises. |
| The Consonants (Section 5) | Ch. 4 (all sections), Ch. 5 §1 | In both | Cited explicitly: "Ch. 4 (all sections), Ch. 5 §1" (line 3241). Also quotes Grayson directly on Russian /lʲ/ versus Italian [ʎ] (p. 184, line 3124) and on Russian /x/ ("articulated on the front of the velum," line 3128, page not given in that sentence). |
| Palatalization (Section 6) | Ch. 4 §2 (p. 169 quoted), Ch. 5 §§1 to 2 (pp. 204 to 211), Ch. 6 §1 (Old Muscovite clusters, p. 209) | In both | Cited with in-line page numbers throughout the section (2012, 169; 205; 206; 208; 209; 210 to 211) rather than in a single trailing source line, unlike other sections. This is the most densely page-cited section of Learn. |
| Assimilation and Boundaries (Section 7) | Ch. 5 §§2 to 5 (pp. 150 to 262), Ch. 7 §2 (pp. 247 to 258), Appendix F (pp. 312 to 313) | In both | Cited explicitly with page ranges (line 4035). Note this citation's chapter numbering for "voicing across word boundaries" material (attributed here to "Ch. 7 §2") differs from the earlier, in-line citation two paragraphs above it in the same section, which places the "four rules for assimilation of voicing across word boundaries" at "pp. 250 to 251" (line 3902), a page range that falls within Chapter 6 §3 in Grayson's own table of contents, not Chapter 7. This is flagged, not resolved, in Section 4 below. |
| What These Rules Do Not Teach (Section 8) | Not tied to a specific Grayson chapter; references Stage pronunciation scholarship "attested by Avanesov, Derwing and Priestly, and Grayson" | Learn only (as a section) | No page-numbered Grayson citation; this section is explicitly framed as being about the limits of any rule-based system, including Grayson's. |
| A Note on Notation | References the 1989 Kiel Convention (covered inside Grayson's Preliminaries, physical page 77/printed 61) and surveys "ten Russian lyric diction print resources" | Learn only, drawing on background covered in Grayson's Preliminaries | No direct Grayson citation in this closing section. |
| Grayson Ch. 1 (Survey of Relevant Texts) | — | Grayson only | Not mirrored in Learn as a section, though Learn's opening "About This Module" (Section 1 above) references several of the same authors (Challis, Piatak and Avrashov, Richter, Belov, Pons, Weiler, Mills-Bello under a different spelling "Mills-Bell") that Grayson surveys in Chapter 1, without citing Chapter 1 by name or page. |
| Grayson Ch. 8 (Unusual Spelling and Grammatical Forms) | — | Grayson only | Not mirrored by any Learn section; Learn's Section 2 on stress cites only Ch. 8 §1 narrowly (the missing-ё material), not the chapter's other four sections on suffixes, reflexive endings, and pronunciation exceptions. |
| Grayson Ch. 9 (History, Politics and the Russian Language) | — | Grayson only | Not mirrored by any Learn section or citation found. |
| Grayson's "A Note on Style, Vocal Technique" and "A Note for the Chorus Master" essays | — | Grayson only | Not mirrored or cited in Learn. |
| Grayson Appendices A, C, E, G, H, I, J, L, M | — | Grayson only | Not cited by Learn, except that Appendix M (suggested listening) is referenced in spirit, uncited, when Learn's "About This Module" discusses listening to native singers; and Appendix B and D are cited (see Section 1 row above). |
| Grayson Appendix K essays other than "The Story of /o/" (Shcha-Cha-Cha, The Problem of Schwa, Cyril and Methodius) | — | Grayson only | Not cited in Learn; only "The Story of /o/" is drawn on. |

## 4. NOT ESTABLISHED

- Appendix G ("Russian Composer Names: Cyrillic, IPA, and Transliterations," TOC page printed 354): `pdftotext -layout` returned no page-number line, no heading, and no text for the physical page where this appendix should fall (physical page 370, between Appendix F's closing content on physical 369 and Appendix H's "APPENDIX H" heading on physical 371). The physical page contains only the printed page-footer number "354." NOT ESTABLISHED: the physical page number of Appendix G's heading, and the content of the appendix itself. This is most likely explained by the appendix being a table (composer names, IPA, and transliterations) rendered as an image or in a way `pdftotext` could not extract, but I did not open the PDF visually to confirm this, per the constraint to use pdftotext only.

- Several TOC-listed subsection headings in Chapters 4, 6, 8, and 9 (marked "(TOC only)" in the Section 2 table above) were not independently located and read in the extracted body text; I confirmed the parent Section heading's physical page in the body but relied on the TOC's stated page number, adjusted by the confirmed +16 offset, for the subsection row itself. These are: the four Chapter 4 §1 subsections (Cognates, Greeks, False Friends, Hushers plus W); most Chapter 4 §2 subsections (Hushers, Special Case, Dentals, Labials, Lateral/Nasals, Velars, /rʲ/); the Chapter 4 §3 subsections (Hard Sign, Soft Sign); the Chapter 6 §1 and §3 sub-items; the Chapter 7 §2 sub-items; most of Chapter 8 §1's sub-items; and most of Chapter 9's sub-items. I did not treat any of these page numbers as guesses: they come from the TOC's own printed statement plus a confirmed constant offset, but I flag them as not independently confirmed against body text, per the task's instruction to distinguish confirmed headings from TOC-derived ones.

- Grayson's TOC contains visible OCR/font-substitution garbling in several rows where the source PDF's dissertation-specific Cyrillic and IPA font did not map to standard Unicode in `pdftotext`'s extraction. Examples: "Pronoun Problems: x/v, xtv, dc/, dct, dc/v, and dctv" (TOC line, physical page 10/line 312), "The Suffixes -wbz and -wbjyysq" (physical page 10 to 11), and "O : /R&R&/ versus /R&sR&/" (physical page 11, almost certainly representing the Cyrillic letter щ and an IPA contrast, matched to the confirmed Appendix K essay title "Shcha-Cha-Cha! The History of the Shifting Pronunciation of О" at physical page 12/line 375, itself also likely a garbled щ). I have rendered these as best-guess modern equivalents in the Section 2 table where the referent was unambiguous (e.g., "Looking up ⟨ё⟩ or not" for the garbled "Looking up -/- or not"), and flagged the garbling in the table's own text where I made that substitution. Where I was not confident of the referent, I left the TOC's literal (garbled) text with a note. This whole class of heading should be treated as NOT ESTABLISHED in exact original wording, only in approximate meaning.

- Similarly, Learn's own IPA table for stressed vowels (Section 1 of this inventory) transcribes some Cyrillic and IPA symbols cleanly (it is a modern web document, not an OCR extraction), so no equivalent garbling applies to the Learn side. No Learn heading's line number is approximate; all were located by exact string search against the file as delivered.

- The apparent citation discrepancy noted in Section 3 (Learn's Section 7 closing source line attributing cross-boundary voicing rules to "Ch. 7 §2," while an in-line citation two paragraphs earlier in the same section places the same rules at "pp. 250 to 251," which falls inside Grayson's own Chapter 6 §3 by the confirmed TOC and body page numbers) is reported as a factual observation about the two citations as written. I did not attempt to determine which citation Learn's author intended as authoritative, or whether this is a typo; that would require asking the author. NOT ESTABLISHED: whether this is an error in Learn or reflects some Grayson cross-reference I have not located.

- I did not verify the accuracy of any phonetic or phonological claim in either source against outside linguistic authority. This inventory is a structural and descriptive mapping only, per the task's instruction not to evaluate quality.

- I did not open the PDF in a PDF viewer or use OCR; all Grayson content in this document comes from `pdftotext -layout` output. Where a table's internal cell alignment may have shifted during extraction (this is common with `pdftotext -layout` on multi-column tables), I have not attempted to reconstruct exact column contents beyond what was needed to confirm a heading's existence and general subject, and no such table content is quoted verbatim in this inventory except where marked as a direct quotation matched against the surrounding prose (not a table cell).

- Learn's French half (lines 1 to approximately 2076, and the shared closing material) was read only enough to locate the boundary with the English half and to identify the duplicate-id issue noted in Section 1; per the task's scope, it was not inventoried.
