/* ═══════════════════════════════════════════════════════════
   ILYA — Internationalisation
   English / French bilingual translation system.
   Missing keys show [MISSING: key] to enforce 100% parity.
   ═══════════════════════════════════════════════════════════ */

export type Language = 'en' | 'fr';

const strings: Record<string, Record<Language, string>> = {

	// ── App header ───────────────────────────────────────────
	'app.subtitle':                { en: 'Russian Lyric Diction',        fr: 'Diction lyrique russe' },

	// ── Dictionary status ────────────────────────────────────
	'dict.loading':                { en: 'Loading dictionary\u2026',     fr: 'Chargement du dictionnaire\u2026' },
	'dict.words':                  { en: 'words',                        fr: 'mots' },
	'dict.inflections':            { en: 'inflections',                  fr: 'flexions' },

	// ── Drawer ───────────────────────────────────────────────
	'drawer.collapse':             { en: 'Collapse drawer',              fr: 'Réduire le tiroir' },
	'drawer.expand':               { en: 'Expand drawer',                fr: 'Ouvrir le tiroir' },
	// N.108 increment 1a. THE PHONE'S PULL CARRIES TWO WORDS, one per state,
	// and it says where the press GOES rather than what it does: PAPER with
	// the drawer up, DRAWER with the paper up. Drawn at
	// `docs/sessions/drawing-n108-pull_r2_2026-09-02.png`, ruled by Dann
	// 2026-09-02. `drawer.pull` above carries DRAWER and is ratified in both
	// languages; only the other half is new.
	//
	// FRENCH IS DEFERRED, as it is for the six N.108 strings below: the
	// English stands in both slots because `t()` prints `[MISSING: key]` for an
	// absent variant, which would put that literal on the pull. « Papier » is
	// the obvious word and it is DANN'S TO RULE, not this ship's to assume.
	'drawer.paper':                { en: 'Paper',                        fr: 'Paper' },

	// ── The three groups (N.108 increment 1) ─────────────────
	//    FRENCH IS DEFERRED BY DANN'S RULING OF 2026-09-02, and these six
	//    entries carry the ENGLISH IN BOTH SLOTS until he rules the strings
	//    table. That is not a translation and must not be read as one: `t()`
	//    prints `[MISSING: key]` for an absent language variant, so a truly
	//    absent French key would put that literal on the band of a French
	//    session's drawer. The tree's own precedent for recording a value that
	//    is the same in both languages is the `tab.*` block below, which says
	//    so in as many words; this block says instead that the French is OWED.
	//
	//    THE SIX ARE: the three group names, the binder station's name, the
	//    Underlay station's name, and the Voice station's name. Every one is
	//    listed in the increment 1 memo with its key.
	//
	//    `group.scoreMarkup` IS THE SAME ENGLISH AS `tab.markedScore`, which
	//    already carries ratified French (« Partition annotée », 2026-08-19).
	//    They are kept apart because one names a DOCUMENT in the desk head and
	//    one names a GROUP in the drawer, and folding two concepts onto one
	//    string is how a rename comes to move something nobody meant to move.
	//    Whether they should be one string is DANN'S TO RULE.
	'group.piece':                 { en: 'Piece',                        fr: 'Piece' },
	'group.text':                  { en: 'Text',                         fr: 'Text' },
	'group.scoreMarkup':           { en: 'Score markup',                 fr: 'Score markup' },
	//    `group.input` JOINS THEM, N.108-5, and it is a SEVENTH owed name.
	//    Dann named the band himself on 2026-09-07: the intake becomes its own
	//    group between Piece and Text, "named INPUT, painted sage like Text
	//    (hue names place: it is text)". Same slot treatment as the six above.
	'group.input':                 { en: 'Input',                        fr: 'Input' },
	//    The binder station. Its three buttons keep their own ratified
	//    `binder.*` strings; this names the station they sit in, which had no
	//    name because it was a bare row inside Source.
	'binder.heading':              { en: 'Export and import',            fr: 'Export and import' },
	//    UNDERLAY is the English name Dann ruled 2026-08-18. It ships today as
	//    `shiftLyrics.title` "Shift Lyrics", which keeps its ratified French
	//    and its own call sites; this is the station name, and the two are not
	//    folded together for the reason given above.
	'underlay.heading':            { en: 'Underlay',                     fr: 'Underlay' },
	//    VOICE, the station name from E.27 §3.3. The anchor line inside it
	//    keeps its ratified `calib.anchor.*` strings.
	'voice.heading':               { en: 'Voice',                        fr: 'Voice' },

	// ── Tab bar (N.36) ───────────────────────────────────────
	//    The labels lived in the component, so French lived in two
	//    places. Three of the four are invariant by ruling; they are
	//    keyed anyway, so the invariance is recorded here as identical
	//    en/fr values rather than as an absence from the dictionary.
	//    'Fit' is invariant by Dann's ruling of 13 July 2026; the
	//    internal tab id stays 'shane', the dictionary key does not.
	'tab.transcription':           { en: 'Transcription',                fr: 'Transcription' },
	'tab.learn':                   { en: 'Learn',                        fr: 'Leçons' },
	'tab.guide':                   { en: 'Guide',                        fr: 'Guide' },
	'tab.fit':                     { en: 'Fit',                          fr: 'Fit' },
	// N.73 S1. Studio's second document, named for the singer in the desk
	// head's pair. RATIFIED by Dann 2026-08-19 with the rest of the N.73
	// table: « Partition annotée » is the idiomatic francophone term for a
	// score carrying working markings, his own correction over « marquée ».
	// This does NOT replace 'tab.fit': Fit is the tool's name and is
	// invariant in French by his ruling of 2026-07-13. The document is not
	// called Fit.
	'tab.markedScore':             { en: 'Score markup',                 fr: 'Partition annotée' },
	// The drawer's pull carries no visible word (N.73 S1 §2.7, Dann's ruling
	// of 2026-08-19: fewer text elements onscreen). The ratified word is its
	// ACCESSIBLE name instead, with aria-expanded carrying the state, so the
	// name stays put while the drawer opens and closes.
	'drawer.pull':                 { en: 'Drawer',                       fr: 'Tiroir' },

	// ── Accessible names (N.62) ──────────────────────────────
	//    Four strings a sighted singer never sees and a screen reader always
	//    speaks. They sat as English literals in the markup, so a French
	//    session heard English at the drawer, the twelve table-of-contents
	//    chevrons, the tab list, and the paper. All four French values were
	//    ratified by Dann on 2026-08-23.
	//    'a11y.tocToggle' also corrects the English: `Toggle` named the
	//    control, not what it does, and the chevron's own state rides on
	//    aria-expanded.
	//    'a11y.tabs' and 'a11y.paper' are the same word in both languages.
	//    They are keyed anyway, the way 'tab.transcription' is, so parity
	//    stays total and no slot is left for `t()` to report as missing.
	//    These are spoken, never printed, so no guillemets.
	'a11y.drawer':                 { en: 'Controls',                     fr: 'Commandes' },
	'a11y.tocToggle':              { en: 'Expand or collapse',           fr: 'Développer ou réduire' },
	'a11y.tabs':                   { en: 'Navigation',                   fr: 'Navigation' },
	'a11y.paper':                  { en: 'Transcription',                fr: 'Transcription' },

	// ── Input area ───────────────────────────────────────────
	// UNUSED SINCE N.108 increment 2: the one intake's placeholder is
	// `intake.placeholder`. Kept because its French is ratified and the French
	// table is not ruled.
	'input.placeholder':           { en: 'Paste Russian text here\u2026',       fr: 'Collez le texte russe ici\u2026' },
	// THE INTAKE WATERMARK (N.65), Dann's ruling 2026-08-20. The large word
	// centred inside the field, in ADDITION to the placeholder above. Keyed by
	// SURFACE like everything else in this file, so the textarea's word sits
	// with `input.*` and the drop zone's with `upload.*`, rather than in a new
	// `watermark.*` namespace that would split one field's strings across two
	// places.
	// RULED BY DANN 2026-09-07, N.111-3b: the receipt tag reads POEM, not TEXT,
	// so the intake's receipt no longer shares a name with the drawer's TEXT
	// band. SCORE is untouched. The tag is the only reader of this key since
	// the watermark was retired 2026-09-03.
	// FRENCH OWED. « texte » was ratified for the old word and cannot stand for
	// the new one; « poème » is the likely answer and Dann has not ruled it, so
	// the `fr` slot carries the English until he does.
	'input.watermark':             { en: 'poem',                         fr: 'poem' },
	'input.warning':               { en: 'characters. Large texts may be slow to process.', fr: 'caractères. Les textes longs peuvent être lents à traiter.' },
	// RENAMED 2026-09-07 BY DANN, N.108-5: the button reads "Transcribe and
	// fit", because after this ship one press does both halves. It read
	// `Transcribe` / « Transcrire » and the French was ratified; **that French
	// is superseded, not lost**, and it is written here so a translator can see
	// what it was: « Transcrire ». FRENCH IS OWED, so this key carries the
	// ENGLISH IN BOTH SLOTS, the treatment the `group.*` block above gives its
	// six owed names and for the same reason: `t()` prints `[MISSING: key]` for
	// an absent variant, and a stale « Transcrire » would name half an action.
	'input.transcribe':            { en: 'Transcribe and fit',           fr: 'Transcribe and fit' },
	'input.transcribeLoading':     { en: 'Loading dictionary\u2026',     fr: 'Chargement du dictionnaire\u2026' },
	// UNUSED SINCE N.108 increment 2: both receipts say `intake.clear`. Kept
	// for the same reason `input.placeholder` above is.
	'input.clear':                 { en: 'Clear text',                   fr: 'Effacer le texte' },
	'input.print':                 { en: 'Print',                        fr: 'Imprimer' },

	// ── Result meta ──────────────────────────────────────────
	// UNUSED SINCE N.108 increment 2: the word count moved to the intake's
	// receipt line and says `intake.words` there, because a receipt is not the
	// instrument line and "words in" needs a timing after it. Kept: ratified
	// French, and the French table is not ruled.
	'result.words':                { en: 'words in',                     fr: 'mots en' },

	// ── Metadata fields ─────────────────────────────────────
	'meta.heading':                { en: 'Metadata',                     fr: 'Métadonnées' },
	'meta.title':                  { en: 'Aria or song title',            fr: 'Aria ou titre du chant' },
	'meta.composer':               { en: 'Composer',                     fr: 'Compositeur' },
	'meta.poet':                   { en: 'Poet or librettist',            fr: 'Poète ou librettiste' },
	'meta.opus':                   { en: 'Opera, song cycle, opus number', fr: 'Opéra, cycle de mélodies, numéro d\u2019opus' },
	'meta.transcriber':            { en: 'Transcriber name',             fr: 'Nom du transcripteur' },
	'meta.translator':             { en: 'Translator',                   fr: 'Traducteur' },
	'meta.transl':                 { en: 'TRANSL.',                      fr: 'TRAD.' },
	'meta.reset':                  { en: 'Reset',                        fr: 'Réinitialiser' },
	'meta.textBy':                 { en: 'Text by',                      fr: 'Texte de' },
	'meta.placeholderLine':        { en: 'Composer, opus, and poet information', fr: 'Informations sur le compositeur, l\u2019opus et le poète' },

	// ── Notation options (IPA display toggles) ──────────────
	'cosmetic.heading':            { en: 'Notation',                     fr: 'Notation' },
	'cosmetic.stressAcutes.left':  { en: 'No stress marks',             fr: 'Sans accents toniques' },
	'cosmetic.stressAcutes.right': { en: 'Apply stress acutes',         fr: 'Appliquer les accents toniques' },
	'cosmetic.reducedVowel.left':  { en: 'Default [ʌ]',                 fr: 'Par défaut [ʌ]' },
	'cosmetic.reducedVowel.right': { en: 'Display [ə] instead',         fr: 'Afficher [ə]' },
	'cosmetic.palatalNasal.left':  { en: 'Palatal nasal [ɲ]',           fr: 'Nasale palatale [ɲ]' },
	'cosmetic.palatalNasal.right': { en: 'Palatalized nasal [nʲ]',      fr: 'Nasale palatalisée [nʲ]' },
	'cosmetic.geminates.left':     { en: 'Separate geminates [tt]',     fr: 'Géminées séparées [tt]' },
	'cosmetic.geminates.right':    { en: 'Length markers [tː]',         fr: 'Marqueurs de durée [tː]' },
	'cosmetic.shcha.left':         { en: 'Shcha notation [ʃʲʃʲ]',      fr: 'Notation chtcha [ʃʲʃʲ]' },
	'cosmetic.shcha.right':        { en: 'Length marker [ʃʲː]',          fr: 'Marqueur de durée [ʃʲː]' },
	'cosmetic.reconstitution.left':  { en: 'Default reduction',            fr: 'Réduction par défaut' },
	'cosmetic.reconstitution.right': { en: 'Reconstitution',             fr: 'Reconstitution' },
	'cosmetic.openSyllabification.left':  { en: 'Default syllabification', fr: 'Syllabification par défaut' },
	'cosmetic.openSyllabification.right': { en: 'Open syllables',           fr: 'Syllabes ouvertes' },

	// ── Legacy display keys (backward compatibility) ─────────
	'display.heading':             { en: 'Display',                      fr: 'Affichage' },
	'display.stressDiacritics.left':  { en: 'No stress marks',          fr: 'Sans accents toniques' },
	'display.stressDiacritics.right': { en: 'Apply stress acutes',      fr: 'Appliquer les accents toniques' },

	// ── Legacy notation keys (kept for backward compatibility) ──
	'notation.heading':            { en: 'Notation',                     fr: 'Notation' },
	'notation.reducedVowel':       { en: 'Reduced vowel',               fr: 'Voyelle réduite' },
	'notation.reducedVowel.desc':  { en: 'ʌ → ə',                       fr: 'ʌ → ə' },
	'notation.palatalNasal':       { en: 'Palatal nasal',               fr: 'Nasale palatale' },
	'notation.palatalNasal.desc':  { en: 'ɲ → nʲ',                      fr: 'ɲ → nʲ' },
	'notation.geminates':          { en: 'Geminates',                   fr: 'Géminées' },
	'notation.geminates.desc':     { en: 'Show length markers',         fr: 'Afficher les marqueurs de durée' },
	'notation.shcha':              { en: 'Shcha notation',              fr: 'Notation chtcha' },
	'notation.shcha.desc':         { en: 'ʃʲʃʲ → ʃʲː',                 fr: 'ʃʲʃʲ → ʃʲː' },
	'notation.reconstitution':     { en: 'Reconstitution',              fr: 'Reconstitution' },
	// N.92 first slice, the correction minimum. Both sides are Dann's own,
	// adopted from the ship report's strings table on 2026-08-24, with
	// `correct.none` amended in the same ruling and transcribed verbatim.
	//
	// Vocabulary held to one term per concept, per the house rule: the thing a
	// singer selects is a NOTE, what they do to it is CORRECT, and the surface
	// is never called an editor, a tool, or a mode.
	'correct.heading':             { en: 'Correct the read',              fr: 'Corriger la lecture' },
	'correct.none':                { en: 'Choose a note to correct it.',  fr: 'Choisissez une note pour la corriger.' },
	'correct.selected':            { en: 'Selected: %s',                  fr: 'Sélectionnée\u00a0: %s' },
	'correct.stepUp':              { en: 'Up a step',                     fr: 'Un degré vers le haut' },
	'correct.stepDown':            { en: 'Down a step',                   fr: 'Un degré vers le bas' },
	'correct.octaveUp':            { en: 'Up an octave',                  fr: 'Une octave vers le haut' },
	'correct.octaveDown':          { en: 'Down an octave',                fr: 'Une octave vers le bas' },
	'correct.semitoneUp':          { en: 'Up a semitone',                 fr: 'Un demi-ton vers le haut' },
	'correct.semitoneDown':        { en: 'Down a semitone',               fr: 'Un demi-ton vers le bas' },
	'correct.prev':                { en: 'Previous note',                 fr: 'Note précédente' },
	'correct.next':                { en: 'Next note',                     fr: 'Note suivante' },
	'correct.delete':              { en: 'Remove this note',              fr: 'Supprimer cette note' },
	'correct.deselect':            { en: 'Done',                          fr: 'Terminé' },
	'correct.length':              { en: 'Length',                        fr: 'Durée' },
	'correct.dot':                 { en: 'Dot',                           fr: 'Point' },
	'correct.len16th':             { en: 'Sixteenth',                     fr: 'Double croche' },
	'correct.len8th':              { en: 'Eighth',                        fr: 'Croche' },
	'correct.lenQuarter':          { en: 'Quarter',                       fr: 'Noire' },
	'correct.lenHalf':             { en: 'Half',                          fr: 'Blanche' },
	'correct.lenWhole':            { en: 'Whole',                         fr: 'Ronde' },
	'correct.restore':             { en: 'Undo my corrections to this note', fr: 'Annuler mes corrections sur cette note' },
	'correct.count':               { en: 'You have corrected %s notes.',  fr: 'Vous avez corrigé %s notes.' },
	'correct.countOne':            { en: 'You have corrected one note.',  fr: 'Vous avez corrigé une note.' },
	// ── N.111, the clitic seat ───────────────────────────────
	//    A vowelless clitic the file seated alone on a sung pitch, and what
	//    Ilya did about it.
	//
	//    REWORDED 2026-09-04 ON DANN'S RULING, on his walk of `7875892`. The
	//    five keys these replace asked a question and named a button: `в sits
	//    alone on a note.` / `Seat it with бью?` / `%s notes move.` / `One note
	//    moves.` / `Seat`. Ilya seats automatically now, so there is nothing to
	//    ask and no button to press. His words: "I swear to you: no vowelless
	//    word in Russian can carry its own duration. You are complicating
	//    things for the user with a situation that is impossible in music
	//    notation." The station STATES what Ilya did, in one sentence, with
	//    Undo, and asks nothing.
	//
	//    ONE SENTENCE MEANS ONE KEY, so these two carry three placeholders and
	//    two respectively, filled left to right. That is a departure from the
	//    dictionary's one-`%s` habit and it is deliberate: a sentence split
	//    across three entries cannot be translated, because a translator cannot
	//    reorder its clauses. POSITIONAL `%s` CANNOT BE REORDERED EITHER, so
	//    the French may want this restructured; that is part of what is owed.
	//
	//    FRENCH IS OWED, and these three carry the ENGLISH IN BOTH SLOTS for the
	//    reason the N.108 block above gives: `t()` prints `[MISSING: key]` for
	//    an absent variant, which would put that literal in a French singer's
	//    drawer. That is not a translation. The words a French singer needs
	//    here are Dann's to rule.
	//
	//    UNUSED SINCE N.108-5, ALL THREE. RULED BY DANN 2026-09-04 on his walk
	//    of `c574cf8`: *"I'm not crazy about the idea of that courtesy warning
	//    we give about Ilya having concatenated a clitic... I think it's
	//    unnecessary."* The sentence and its Undo left Corrections and the
	//    loupe dock, and `CliticSeat.svelte` was deleted with them. Ilya still
	//    seats, at ingest, and says nothing. Kept in place and not deleted on
	//    his instruction, the same treatment N.108 increments 2 and 4 gave
	//    their retired strings above.
	'clitic.seated':               { en: '%s cannot take a note of its own, so Ilya seated it with %s and moved %s notes.', fr: '%s cannot take a note of its own, so Ilya seated it with %s and moved %s notes.' },
	'clitic.seatedOne':            { en: '%s cannot take a note of its own, so Ilya seated it with %s and moved one note.', fr: '%s cannot take a note of its own, so Ilya seated it with %s and moved one note.' },
	'clitic.undo':                 { en: 'Undo',                          fr: 'Undo' },
	// N.97. A correction whose event id no longer resolves after a re-read has
	// not landed, and it must not fail silently. The DRAWER carries the count;
	// nothing is marked on the paper. Dann's own wording, approved 2026-08-24
	// and transcribed verbatim.
	'notation.orphans':            { en: '%s corrections no longer find their note', fr: '%s corrections ne retrouvent plus leur note' },
	// N.92 second slice, the accidental palette. Approved by Dann 2026-08-24.
	// `bémol` and `dièse` are ADOPTED from the intake prompt's own French
	// (`upload.ask.keySharp` and `upload.ask.keyFlat` above); `bécarre` is
	// ADOPTED from standard musical usage and is new to the app. Nothing here
	// is coined.
	'notation.tool.flat':          { en: 'Flat',                        fr: 'Bémol' },
	'notation.tool.sharp':         { en: 'Sharp',                       fr: 'Dièse' },
	'notation.tool.natural':       { en: 'Natural',                     fr: 'Bécarre' },

	// ── N.92 mobile slice 2: the loupe and the dock ──────────
	// EVERY FRENCH WORD HERE AWAITS DANN'S EYE. The strings table in
	// `docs/sessions/memo-mobile-slice2_r1_2026-08-26.md` sets each one beside
	// its English and marks coined against adopted, which is the form his
	// ruling of 2026-08-26 asks for.
	//
	// ADOPTED, each from a string already shipped in this file: `tiroir`
	// (drawer.collapse), `mesures` (upload.report.events), `système`
	// (upload.report.systems), `sur` for "of" (footer.of), `Durée`
	// (correct.length), `Hauteur` (upload.report.pitchSubs), `Altération`
	// (notePicker.accidentalAria), `Silence` (upload.report.events), `Texte`
	// (station.textChanged), `degré` (correct.stepUp), `Supprimer`
	// (correct.delete), `Annuler` (correct.restore), `Point` (correct.dot),
	// and the two shift-scope clauses (shiftLyrics.*), reused verbatim.
	//
	// COINED, four: `mes.` as the abbreviation of `mesure`; `Nolet`; `Saisie`;
	// `Liaison`.
	//
	// THE DOCK HAS NO ACCESSIBLE NAME OF ITS OWN. Dann's ruling of 2026-08-26
	// settles the collision r1 of the memo raised: both containers take
	// `a11y.drawer`, which is `Controls` / `Commandes`, ratified 2026-08-23
	// under N.62 and asserted by `i18n.test.ts` against his own table. So the
	// key that briefly lived here, `loupe.dockAria` (`Drawer` / `Tiroir`), is
	// struck rather than kept beside it: one concept, one term, one key. No
	// desktop string moved, and `Tiroir` stays what `drawer.collapse` calls the
	// drawer in its own sentence.
	// The measure tag, inside the loupe's top left. `%m` is the measure's own
	// display number from the score, not its index, so a pickup measure prints
	// what the publisher printed.
	'loupe.measureTag':            { en: 'm.\u00a0%m \u00b7 system %s of %t', fr: 'mes.\u00a0%m \u00b7 système %s sur %t' },
	// The same tag where the page's systems cannot be read. NOT ESTABLISHED
	// beats an invented system number.
	'loupe.measureTagShort':       { en: 'm.\u00a0%m',                    fr: 'mes.\u00a0%m' },
	// The named Undo pill. It reads the change it will reverse, stated in the
	// direction the change happened. Absent when nothing can be undone.
	'loupe.undo':                  { en: 'Undo: %s',                     fr: 'Annuler\u00a0: %s' },
	'loupe.undo.deleted':          { en: 'note removed',                 fr: 'note supprimée' },
	'loupe.undo.dotOn':            { en: 'dot added',                    fr: 'point ajouté' },
	'loupe.undo.dotDouble':        { en: 'double dot added',             fr: 'double point ajouté' },
	'loupe.undo.dotOff':           { en: 'dot removed',                  fr: 'point retiré' },
	'loupe.undo.lyrics':           { en: 'syllables shifted',            fr: 'syllabes décalées' },
	'loupe.undo.restored':         { en: 'corrections cleared',          fr: 'corrections effacées' },
	// N.111-3b. The Redo pill's frame, and the one action name the two pills
	// share. FRENCH OWED for both: the `fr` slot carries the English so nothing
	// renders `[MISSING`, and Dann has not seen a translation for either.
	'loupe.redo':                  { en: 'Redo: %s',                     fr: 'Redo: %s' },
	'loupe.undo.placed':           { en: 'syllable placed',              fr: 'syllable placed' },
	// The four stations, in the ruled order. Durations lead.
	'loupe.station.duration':      { en: 'Duration',                     fr: 'Durée' },
	'loupe.station.pitch':         { en: 'Pitch',                        fr: 'Hauteur' },
	'loupe.station.accidental':    { en: 'Accidental \u00b7 Entry',       fr: 'Altération \u00b7 Saisie' },
	'loupe.station.lyric':         { en: 'Lyric',                        fr: 'Texte' },
	// Cells the singer can see and cannot use this slice. Slice 3 takes all
	// three, and none of them carries behaviour here.
	'loupe.tuplet':                { en: 'Tuplet',                       fr: 'Nolet' },
	'loupe.rest':                  { en: 'Rest',                         fr: 'Silence' },
	'loupe.tie':                   { en: 'Tie',                          fr: 'Liaison' },
	// The visible word on the delete cell. `correct.delete` stays its
	// accessible name, so a screen reader still hears which note goes.
	'loupe.delete':                { en: 'Delete',                       fr: 'Supprimer' },
	// The pitch cells' visible words, with the direction carried by a triangle
	// beside them. `correct.stepUp` and its three neighbours stay the
	// accessible names, so nothing a screen reader hears is abbreviated.
	'loupe.pitch.step':            { en: 'step',                         fr: 'degré' },
	'loupe.pitch.octave':          { en: 'octave',                       fr: 'octave' },
	// The lyric verbs, named for what they touch rather than for Finale's
	// scope. The clause after the comma is `shiftLyrics.toEndOfLyric` and
	// `shiftLyrics.toNextOpenNote` verbatim.
	'loupe.lyric.toEnd':           { en: 'Syllables, to the end of the lyric', fr: 'Les syllabes, jusqu\u2019à la fin du texte' },
	'loupe.lyric.toNextOpen':      { en: 'Syllables, to the next open note',   fr: 'Les syllabes, jusqu\u2019à la prochaine note libre' },


	// ── N.92 mobile slice 3: the entry grammar ───────────────
	// EVERY FRENCH WORD HERE AWAITS DANN'S EYE. The table in
	// `docs/sessions/memo-mobile-slice3_r1_2026-08-26.md` sets each one beside
	// its English and marks coined against adopted.
	//
	// ADOPTED, from strings already in this file: `mesure` and `entrée` follow
	// `mes.` and the entry station's « Saisie » from slice 2; `Silence`
	// (upload.report.events); `Liaison` and `Nolet` (both ratified by Dann
	// 2026-08-26 with the slice 2 table); `Annuler` (correct.restore);
	// `Hauteur` (upload.report.pitchSubs); `note` and `syllabe` throughout.
	//
	// COINED, two: « dans l'espace de » for the tuplet definition's ratio
	// clause, and « prend la hauteur de » for the arrival label.
	//
	// THE GAP SENTENCE DROPS ITS NOUN, ruled by Dann 2026-08-26, striking the
	// « intervalle » this file briefly carried. The sentence names no object
	// because it does not need one: it says where the bar is and what happens
	// next, and a word for the place between two entries was a term the singer
	// would have had to learn in order to read a sentence that already told
	// them everything. The English is reshaped to match, so the two languages
	// say the same thing in the same shape.
	'loupe.gap':                   { en: 'after %s \u00b7 the next duration enters here', fr: 'après %s \u00b7 la prochaine durée s\u2019inscrit ici' },
	// The head of the part has no entry to be after, so it says where rather
	// than after what. NOT the same sentence with an empty slot: a sentence with
	// a hole in it is worse than a shorter one that is true.
	'loupe.gapHead':               { en: 'before the first entry \u00b7 the next duration enters here', fr: 'avant la première entrée \u00b7 la prochaine durée s\u2019inscrit ici' },
	// The PITCH station's label in a gap, which turns the arrival rule into
	// recognition instead of recall by saying it before the note exists.
	'loupe.station.pitchTakes':    { en: 'Pitch \u00b7 takes the pitch of %s', fr: 'Hauteur \u00b7 prend la hauteur de %s' },
	'loupe.station.pitchMiddle':   { en: 'Pitch \u00b7 arrives on the middle line', fr: 'Hauteur \u00b7 arrive sur la ligne médiane' },
	// The LYRIC station's label in a gap. The schematic's ruling: the label
	// states the condition as an instruction and the greying agrees with the
	// words rather than carrying the meaning alone.
	'loupe.station.lyricTake':     { en: 'Lyric \u00b7 take a note to shift its syllable', fr: 'Texte \u00b7 prenez une note pour décaler sa syllabe' },
	// The Nolet definition row, read left to right as the sentence it is:
	// `3 of [value] in the space of 2 of [value]`.
	'loupe.nolet.of':              { en: 'of',                            fr: 'de' },
	'loupe.nolet.inSpaceOf':       { en: 'in the space of',               fr: 'dans l\u2019espace de' },
	'loupe.nolet.back':            { en: 'Back to durations',             fr: 'Retour aux durées' },
	'loupe.nolet.more':            { en: 'One more',                      fr: 'Un de plus' },
	'loupe.nolet.fewer':           { en: 'One fewer',                     fr: 'Un de moins' },
	'loupe.nolet.step':            { en: 'Next value',                    fr: 'Valeur suivante' },
	// The Undo sentences for the four operations this slice adds.
	'loupe.undo.entered':          { en: 'entry added',                   fr: 'entrée ajoutée' },
	'loupe.undo.rest':             { en: 'rest changed',                  fr: 'silence modifié' },
	'loupe.undo.tie':              { en: 'tie changed',                   fr: 'liaison modifiée' },
	'loupe.undo.tuplet':           { en: 'tuplet defined',                fr: 'nolet défini' },
	// The visible word on the restore cell. `correct.restore` stays its
	// accessible name, so a screen reader still hears the whole sentence,
	// "Undo my corrections to this note", which is too long for a 44 px cell.
	// « Rétablir » is ADOPTED from `meta.revertToScore`, which already says
	// « Rétablir l'en-tête de la partition ». Nothing is coined.
	// The readout's word for two dots. `double` is ADOPTED from
	// `correct.len16th`, which is « Double croche », and `point` from
	// `correct.dot`. Nothing is coined.
	'loupe.doubleDot':             { en: 'Double dot',                    fr: 'Double point' },
	'loupe.restore':               { en: 'Restore',                       fr: 'Rétablir' },
	// THE ONE HEADER, ruled by Dann 2026-08-27: DURATION, PITCH and
	// ACCIDENTAL · ENTRY consolidate under it and LYRIC rides inside as a
	// labelled row. Both words are adopted, and they are the same word: the app
	// already says `corrections` in `correct.count` and « corrections » in its
	// French, and `notation.orphans` says it in both too.
	'loupe.station.corrections':   { en: 'Corrections',                   fr: 'Corrections' },
	// THE MEASURE TAG'S ARITHMETIC, ruled by Dann 2026-08-26. An overfull or
	// short bar is not blocked and not re-timed, and the page stays silent; the
	// tag says what the measure holds against what its signature asks for, and
	// says it ONLY where the two disagree. `sur` is adopted from `footer.of`,
	// which is already how this app says "of" between two numbers in French.
	'loupe.measureTagFill':        { en: 'm.\u00a0%m \u00b7 %a of %e',    fr: 'mes.\u00a0%m \u00b7 %a sur %e' },
	// BOTH CLAUSES, ruled by Dann 2026-08-26 amending his own ruling of the
	// same day: where the arithmetic fires the tag says the system AND the
	// count, so the singer keeps their place on the page while being told the
	// bar disagrees with itself. `loupe.measureTagFill` above stays as the
	// short form for a page whose systems cannot be read, which is the same
	// relationship `loupe.measureTagShort` has to `loupe.measureTag`.
	'loupe.measureTagBoth':        { en: 'm.\u00a0%m \u00b7 system %s of %t \u00b7 %a of %e', fr: 'mes.\u00a0%m \u00b7 système %s sur %t \u00b7 %a sur %e' },

	'notation.reconstitution.desc': { en: 'Show reconstitution',        fr: 'Afficher la reconstitution' },
	'display.stressDiacritics':    { en: 'Stress diacritics',            fr: 'Diacritiques d\u2019accent' },
	'display.stressDiacritics.desc': { en: 'Show acute accent on Cyrillic', fr: 'Afficher l\u2019accent aigu sur le cyrillique' },

	// ── Inspector panel ──────────────────────────────────────
	'inspector.back':              { en: '\u2190 Back',                  fr: '\u2190 Retour' },
	'inspector.stress':            { en: 'Stress',                       fr: 'Accent tonique' },
	'inspector.syllable':          { en: 'Syllable',                     fr: 'Syllabe' },
	'inspector.clitic':            { en: 'Clitic (unstressed)',          fr: 'Clitique (atone)' },
	'inspector.cliticArrow.enclitic':       { en: 'Enclitic arrow',               fr: 'Flèche enclitique' },
	'inspector.cliticArrow.proclitic':      { en: 'Proclitic arrow',              fr: 'Flèche proclitique' },
	'inspector.cliticArrow.encliticLabel':  { en: 'Enclitic',                     fr: 'Enclitique' },
	'inspector.cliticArrow.procliticLabel': { en: 'Proclitic',                    fr: 'Proclitique' },
	'inspector.cliticArrow.encliticBlurb': { en: 'This word is an enclitic: it has no stress of its own and attaches phonologically to the preceding word. Its vowels reduce relative to the host word\u2019s stress position. On the page, an arrow (←) shows in place of IPA, and the clitic\u2019s phonetic material appears fused into the host word\u2019s IPA.', fr: 'Ce mot est un enclitique\u00a0: il n\u2019a pas d\u2019accent propre et s\u2019attache phonologiquement au mot précédent. Ses voyelles se réduisent en fonction de la position de l\u2019accent du mot hôte. Sur la page, une flèche (←) remplace l\u2019API, et le matériel phonétique du clitique apparaît fusionné dans l\u2019API du mot hôte.' },
	'inspector.cliticArrow.procliticBlurb': { en: 'This word is a proclitic: it has no stress of its own and attaches phonologically to the following word. Its vowels reduce relative to the host word\u2019s stress position. On the page, an arrow (→) shows in place of IPA, and the clitic\u2019s phonetic material appears fused into the host word\u2019s IPA.', fr: 'Ce mot est un proclitique\u00a0: il n\u2019a pas d\u2019accent propre et s\u2019attache phonologiquement au mot suivant. Ses voyelles se réduisent en fonction de la position de l\u2019accent du mot hôte. Sur la page, une flèche (→) remplace l\u2019API, et le matériel phonétique du clitique apparaît fusionné dans l\u2019API du mot hôte.' },
	'inspector.unknownStress':     { en: 'Unknown stress \u00b7 verify manually', fr: 'Accent inconnu \u00b7 vérifier manuellement' },
	'inspector.provenance':         { en: 'Provenance',                   fr: 'Provenance' },
	'inspector.ribbon':            { en: 'Character breakdown',          fr: 'Décomposition par caractère' },
	'inspector.blurbs':            { en: 'Phonological notes',           fr: 'Notes phonologiques' },
	'inspector.noBlurb':           { en: 'No phonological note for this character.', fr: 'Aucune note phonologique pour ce caractère.' },
	'inspector.notationDefault': { en: 'Notation: default (Grayson)', fr: 'Notation\u00a0: par défaut (Grayson)' },
	'inspector.glossMissing':      { en: 'No translation available for this form.',                              fr: 'Aucune traduction française disponible pour cette forme.' },

	// ── Dictionary panel (Inspector expansion) ───────────────
	'inspector.dictionary':         { en: 'Dictionary',                   fr: 'Dictionnaire' },
	'inspector.dictEntryMissing':   { en: 'Full entry unavailable',       fr: 'Entrée complète indisponible' },
	'inspector.glossFallbackEN':    { en: 'Gloss available in English only', fr: 'Glose disponible en anglais seulement' },
	'inspector.glossFallbackFR':    { en: 'Gloss available in French only',  fr: 'Glose disponible en français seulement' },
	'inspector.dictCapacity':       { en: 'Maximum 20 characters',         fr: 'Maximum de 20 caractères' },
	'inspector.dictChoose':        { en: 'Use this reading:',           fr: 'Utiliser cette lecture\u00a0:' },

	// ── Grayson positional labels (Ribbon syllable group headers) ──
	'ribbon.stressed':             { en: 'stressed',                     fr: 'tonique' },
	'ribbon.unstressed':           { en: 'unstressed',                   fr: 'atone' },
	'ribbon.immediatePre':         { en: 'immediate pre-stress',         fr: 'prétonique immédiate' },
	'ribbon.remotePre':            { en: 'remote pre-stress',            fr: 'prétonique éloignée' },
	'ribbon.immediatePost':        { en: 'immediate post-stress',        fr: 'posttonique immédiate' },
	'ribbon.remotePost':           { en: 'remote post-stress',           fr: 'posttonique éloignée' },

	// ── Spot reconstitution (per-word toggle in Inspector) ────
	'inspector.spotRecon.heading':   { en: 'Reconstitution',              fr: 'Reconstitution' },
	'inspector.spotRecon.left':      { en: 'Default reduction',           fr: 'Réduction par défaut' },
	'inspector.spotRecon.right':     { en: 'Spot reconstitution',         fr: 'Reconstitution ponctuelle' },
	'inspector.spotRecon.globalOn':  { en: 'Global reconstitution is active. Disable it in Cosmetic Options to use per-word reconstitution.', fr: 'La reconstitution globale est active. Désactivez-la dans les Options cosmétiques pour utiliser la reconstitution par mot.' },

	// ── Stress source labels ─────────────────────────────────
	'stress.dictionary':           { en: 'Verified from dictionary',     fr: 'Vérifié dans le dictionnaire' },
	'stress.supplement':           { en: 'Singer supplement',            fr: 'Supplément pour chanteurs' },
	'stress.yoRule':               { en: 'Derived from ё',              fr: 'Dérivé de ё' },
	'stress.yoRestored':           { en: 'ё restored from dictionary',  fr: 'ё restauré du dictionnaire' },
	'stress.inferred':             { en: 'Algorithmically inferred',    fr: 'Inféré algorithmiquement' },
	'stress.unknown':              { en: 'Unknown \u2014 verify manually', fr: 'Inconnu \u2014 vérifier manuellement' },
	'stress.userDictionary':       { en: 'User verified',               fr: 'Vérifié par l\u2019utilisateur' },
	'stress.userComposer':         { en: 'Composer setting',            fr: 'Choix du compositeur' },
	'stress.userOverride':         { en: 'User assignment',             fr: 'Choix de l\u2019utilisateur' },

	// ── Stress assignment (Inspector) ─────────────────────────
	'inspector.stressAssign.dictionary':    { en: 'Dictionary',          fr: 'Dictionnaire' },
	'inspector.stressAssign.composer':      { en: 'Composer',            fr: 'Compositeur' },
	'inspector.stressAssign.myAssignment':  { en: 'My assignment',       fr: 'Mon choix' },
	'inspector.stressAssign.default':       { en: 'Default',             fr: 'Par défaut' },
	'inspector.yoToggle':                   { en: 'ё \u2194 е',         fr: 'ё \u2194 е' },

	// ── Station labels (N.65, the drawer's stations) ─────────
	// SOURCE. Dann's ruling 4 of 2026-08-20: the textarea and the drop zone
	// sat bare, against the spec's own "no orphan controls."
	// THE FRENCH IS ADOPTED BY IDENTITY, NOT COINED. « Source » is the same
	// word and the same standard noun in French, so this ships no French
	// Dann has not seen. The precedent for recording an invariant as
	// identical en/fr values rather than as an absence is the tab bar's own
	// comment in this file, on 'tab.transcription' and 'tab.guide'.
	// `t()` returns `[MISSING: key]` for an empty slot, so an omitted French
	// value is not an option here; it would print that string in the drawer.
	'source.heading':              { en: 'Source',                       fr: 'Source' },

	// ── THE ONE INTAKE (N.108 increment 2) ───────────────────
	//    NINE NEW ENGLISH STRINGS, EVERY FRENCH SLOT CARRYING THE ENGLISH.
	//    French is deferred by Dann's ruling of 2026-09-02, and this block
	//    follows the `group.*` block above exactly: `t()` prints
	//    `[MISSING: key]` for an absent variant, which would put that literal
	//    inside a French session's intake, so the English stands in both slots
	//    and the French is OWED. That is not a translation and must not be read
	//    as one. Every key here is listed in the increment 2 memo.
	//
	//    WHAT THEY REPLACE, and none of the replaced strings is deleted: the
	//    French table is not ruled, and a ratified French string is not a
	//    build's to throw away. `input.placeholder`, `input.clear`,
	//    `upload.drop.title`, `upload.drop.browse`, `upload.drop.release`,
	//    `upload.drop.acceptedNow` and `upload.drop.placeholder` are UNUSED as
	//    of this ship and stay where they are, marked below.
	//
	//    `intake.placeholder` IS DESIGN'S OWN SENTENCE, from the r2 prototype
	//    at `:359`, where it is marked a placeholder string. It says the two
	//    things the one field has to say: what to put in it, and that a file
	//    dropped on it is read as whatever it is.
	'intake.placeholder': { en: 'Paste or type the poem here. A score or a photograph dropped here is read as what it is.', fr: 'Paste or type the poem here. A score or a photograph dropped here is read as what it is.' },
	// The receipt lines. %s is the count in each.
	'intake.lines':       { en: '%s lines',   fr: '%s lines' },
	'intake.words':       { en: '%s words',   fr: '%s words' },
	// One Clear for both receipts, because the tag beside it already says which
	// kind is being cleared. `input.clear` said "Clear text", which named the
	// kind a second time and could not name the score at all.
	'intake.clear':       { en: 'Clear',      fr: 'Clear' },
	'intake.replace':     { en: 'Replace',    fr: 'Replace' },
	'intake.choose':      { en: 'Choose a file', fr: 'Choose a file' },
	'intake.dropHint':    { en: 'Drop the other kind here, or a new file of the same kind to replace it.', fr: 'Drop the other kind here, or a new file of the same kind to replace it.' },
	// THE PDF QUESTION, build brief §3: "A PDF asks once, in place, which it
	// is. Do not guess." %s is the file's name, so a singer who dropped two
	// files in a row can see which one is being asked about.
	'intake.pdf.title':   { en: 'Is this PDF the poem, or the score?', fr: 'Is this PDF the poem, or the score?' },
	'intake.pdf.why':     { en: 'Ilya cannot tell from the file itself. %s', fr: 'Ilya cannot tell from the file itself. %s' },
	'intake.pdf.poem':    { en: 'The poem', fr: 'The poem' },
	'intake.pdf.score':   { en: 'The score', fr: 'The score' },
	'intake.pdf.reading': { en: 'Reading the words out of the PDF…', fr: 'Reading the words out of the PDF…' },
	// The honest answer where a PDF answered "the poem" holds no text at all,
	// which is what a scan is. It is a mis-answer and not a broken file, so it
	// says what happened and points at the other answer.
	'intake.pdf.noText':  { en: 'There are no words in this PDF to read. If it is a picture of a page, drop it again and choose The score.', fr: 'There are no words in this PDF to read. If it is a picture of a page, drop it again and choose The score.' },
	// THE PICTURE ASKS THE SAME QUESTION, N.108 increment 4, ruled by Dann
	// 2026-09-03: the camera icon, Choose a file, and Read a score from a
	// photograph "all serve the same function". One picker takes every kind,
	// and a picture is the second kind whose bytes cannot say which it is: it
	// is either Cyrillic text to read with OCR or a page of music to read with
	// the page reader, and only the singer knows. Two new English strings,
	// listed in `memo-n108-finishings_r1_2026-09-03.md` §5.
	//
	// `intake.pdf.why`, `intake.pdf.poem` and `intake.pdf.score` are REUSED
	// unchanged: neither names a format, so neither needed a twin.
	//
	// FRENCH IS OWED, as it is for every N.108 string: the English stands in
	// both slots because `t()` prints `[MISSING: key]` for an absent variant.
	'intake.picture.title':   { en: 'Is this picture the poem, or the score?', fr: 'Is this picture the poem, or the score?' },
	'intake.picture.reading': { en: 'Reading the words out of the picture…', fr: 'Reading the words out of the picture…' },


	// ── Word Console placeholder ─────────────────────────────
	'console.placeholder':         { en: 'Analysis',                     fr: 'Analyse' },

	// ── Paper empty state ────────────────────────────────────
	'paper.empty':                 { en: 'Enter your Cyrillic text in the drawer on the left.', fr: 'Saisissez votre texte cyrillique dans le tiroir à gauche.' },
	// N.73 portrait C. The pull moved to the side of the desk in S1 and this
	// line still sent the singer to the bottom of the screen. Both languages
	// RATIFIED by Dann 2026-08-19.
	//
	// N.108 increment 4. THE CHEVRON IS NOT ON THE LEFT AND HAS NOT BEEN SINCE
	// INCREMENT 1a. The pull is a horizontal bar on the BOTTOM edge carrying
	// the word DRAWER with the paper up (`drawer.pull`), ruled by Dann
	// 2026-09-02 and amending the 2026-08-19 line above in both parts. This
	// string named the old geometry on every phone-layout screen, which is
	// every viewport under 1400 px. Found on the increment 3 walk
	// (`memo-n108-takeover_r1_2026-09-03.md` §9).
	//
	// THE OLD ENGLISH: 'Tap the chevron on the left to open the drawer.'
	// THE OLD FRENCH:  'Appuyez sur le chevron à gauche pour ouvrir le tiroir.'
	// THE FRENCH IS OWED. The English stands in both slots, as the six N.108
	// strings above do, because `t()` prints `[MISSING: key]` for an absent
	// variant and that literal would land on the empty page.
	'paper.empty.mobile':          { en: 'Tap Drawer at the bottom of the screen to open the drawer.', fr: 'Tap Drawer at the bottom of the screen to open the drawer.' },

	// ── Provenance: VERIFY label ─────────────────────────────
	'verify.label':                { en: 'verify',                       fr: 'à vérifier' },

	// ── Per-page provenance legend ───────────────────────────
	'legend.user-dictionary':      { en: 'Verified in dictionary',       fr: 'Vérifié dans le dictionnaire' },
	'legend.user-composer':        { en: 'Composer setting',             fr: 'Réglage du compositeur' },
	'legend.user-override':        { en: 'User override',                fr: 'Correction manuelle' },
	'legend.yo':                   { en: 'ё stress',                     fr: 'Accent de ё' },
	'legend.inferred':             { en: 'Verify stress',                fr: 'Vérifier l\u2019accent' },
	'legend.spot-reconstitution':  { en: 'Spot reconstitution',          fr: 'Reconstitution ponctuelle' },

	// ── Paper footer ─────────────────────────────────────────
	// These strings contain <em> tags for italic rendering.
	// PageFooter.svelte uses {@html} to render them.
	'footer.attribution':          {
		en: 'Free and open source, <em>Ilya</em>\u00a02026a operationalizes Craig Grayson\u2019s <em>Russian Lyric Diction</em> (University of Washington, 2012). Stress data and translation glosses via <a href="https://kaikki.org" target="_blank" rel="noopener">kaikki.org</a> (<a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en" target="_blank" rel="noopener">CC\u00a0BY-SA\u00a04.0</a>), test text via <a href="https://www.lieder.net" target="_blank" rel="noopener">www.lieder.net</a>. Made with love in Canada\u00a0<svg viewBox="0 0 9600 4800" aria-label="Canada" role="img" style="display:inline-block;width:14px;height:7px;vertical-align:baseline;position:relative;top:0.5px"><path fill="#f00" d="m0 0h2400l99 99h4602l99-99h2400v4800h-2400l-99-99h-4602l-99 99H0z"/><path fill="#fff" d="m2400 0h4800v4800h-4800zm2490 4430-45-863a95 95 0 0 1 111-98l859 151-116-320a65 65 0 0 1 20-73l941-762-212-99a65 65 0 0 1-34-79l186-572-542 115a65 65 0 0 1-73-38l-105-247-423 454a65 65 0 0 1-111-57l204-1052-327 189a65 65 0 0 1-91-27l-332-652-332 652a65 65 0 0 1-91 27l-327-189 204 1052a65 65 0 0 1-111 57l-423-454-105 247a65 65 0 0 1-73 38l-542-115 186 572a65 65 0 0 1-34 79l-212 99 941 762a65 65 0 0 1 20 73l-116 320 859-151a95 95 0 0 1 111 98l-45 863z"/></svg>',
		fr: 'Gratuit et à code ouvert, <em>Ilya</em>\u00a02026a met en \u0153uvre <em>Russian Lyric Diction</em> de Craig Grayson (University of Washington, 2012). Données d\u2019accentuation et glossaires de traduction via <a href="https://kaikki.org" target="_blank" rel="noopener">kaikki.org</a> (<a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr" target="_blank" rel="noopener">CC\u00a0BY-SA\u00a04.0</a>), textes d\u2019essai via <a href="https://www.lieder.net" target="_blank" rel="noopener">www.lieder.net</a>. Fait avec amour au Canada\u00a0<svg viewBox="0 0 9600 4800" aria-label="Canada" role="img" style="display:inline-block;width:14px;height:7px;vertical-align:baseline;position:relative;top:0.5px"><path fill="#f00" d="m0 0h2400l99 99h4602l99-99h2400v4800h-2400l-99-99h-4602l-99 99H0z"/><path fill="#fff" d="m2400 0h4800v4800h-4800zm2490 4430-45-863a95 95 0 0 1 111-98l859 151-116-320a65 65 0 0 1 20-73l941-762-212-99a65 65 0 0 1-34-79l186-572-542 115a65 65 0 0 1-73-38l-105-247-423 454a65 65 0 0 1-111-57l204-1052-327 189a65 65 0 0 1-91-27l-332-652-332 652a65 65 0 0 1-91 27l-327-189 204 1052a65 65 0 0 1-111 57l-423-454-105 247a65 65 0 0 1-73 38l-542-115 186 572a65 65 0 0 1-34 79l-212 99 941 762a65 65 0 0 1 20 73l-116 320 859-151a95 95 0 0 1 111 98l-45 863z"/></svg>'
	},
	'footer.page':                 { en: 'Page',                         fr: 'Page' },

	// ── Update notice ─────────────────────────────────────────
	'update.notice':               { en: 'A new version of Ilya is ready.', fr: 'Une nouvelle version d\u2019Ilya est pr\u00eate.' },
	'update.action':               { en: 'Refresh',                      fr: 'Actualiser' },
	'update.dismiss':              { en: 'Dismiss',                      fr: 'Ignorer' },
	'footer.of':                   { en: 'of',                           fr: 'sur' },

	// ── Fit broad-analysis legend (§B.5) ─────────────────
	// Composed from parts so EN and FR share one structure; the two-item
	// join is language-specific (EN "a and b", FR "a ni b": "sans X ni Y").
	'fit.broad.body':              { en: 'Broad analysis: this score is shown without {items}, because the matching voice characteristics were left blank. The forecast still reflects your measured resonances.', fr: 'Analyse large\u00a0: cette partition est présentée sans {items}, car les caractéristiques vocales correspondantes ont été laissées vides. La prévision reflète tout de même vos résonances mesurées.' },
	'fit.broad.itemRange':         { en: 'range guidance',               fr: 'les repères d\u2019ambitus' },
	'fit.broad.itemPassaggio':     { en: 'positional passaggio flags',   fr: 'le signalement des notes de passaggio' },
	'fit.broad.join':              { en: 'and',                          fr: 'ni' },

	// ── Fit textual witnesses (reconciliation shell, piece 3; Kimi Q1/Q2;
	//    English ruled by Dann 2026-07-16; French pending Dann's validation) ──
	'fit.witness.heading':         { en: 'Textual witnesses',            fr: 'Témoins textuels' },
	'fit.witness.agree':           { en: 'Score and poem agree',         fr: 'La partition et le poème concordent' },
	'fit.witness.divergePrefix':   { en: 'Score and poem diverge in',    fr: 'La partition et le poème divergent à' },
	'fit.witness.placeOne':        { en: 'place',                        fr: 'endroit' },
	'fit.witness.placeMany':       { en: 'places',                       fr: 'endroits' },
	'fit.witness.scoreLabel':      { en: 'Score',                        fr: 'Partition' },
	'fit.witness.poemLabel':       { en: 'Poem',                         fr: 'Poème' },
	'fit.witness.measureAbbr':     { en: 'm.',                           fr: 'm.' },

	// ── Provenance labels (for Inspector inline display) ─────
	'provenance.dictionary':       { en: 'Stress verified from dictionary',      fr: 'Accent vérifié dans le dictionnaire' },
	'provenance.supplement':       { en: 'Stress from singer supplement',        fr: 'Accent du supplément pour chanteurs' },
	'provenance.yo':               { en: 'Stress derived from ё',               fr: 'Accent dérivé de ё' },
	'provenance.inferred':         { en: 'Stress algorithmically inferred',      fr: 'Accent inféré algorithmiquement' },
	'provenance.unknown':          { en: 'Unknown stress \u2014 verify manually', fr: 'Accent inconnu \u2014 vérifier manuellement' },

	// ── Searchable select ────────────────────────────────────
	'select.filter':               { en: 'Type to filter\u2026',         fr: 'Filtrer\u2026' },
	'select.notInList':            { en: 'Not in list (enter custom)',   fr: 'Absent de la liste (saisir manuellement)' },

	// ── Portrait C (N.73), ruled by Dann 2026-08-18 ──────────
	//    The three 'mobile.*' keys that stood here carried the interstitial
	//    ("Ilya is designed for desktop", "Continue anyway"). Ruling 4 retired
	//    the gate, so the words go with it. Every string below is RATIFIED
	//    whole by Dann 2026-08-19; the key names are Code's, the words are not.
	'portrait.read':               { en: 'Read',                         fr: 'Lire' },
	'portrait.thePage':            { en: 'The page',                     fr: 'La page' },
	'aid.label':                   { en: 'Reading aid, not the page',    fr: 'Aide à la lecture, non la page' },
	//    %s is the verse number. The ratified line reads "· end of verse 1 ·";
	//    only the numeral is substituted, and no other word moves.
	'aid.endOfVerse':              { en: '\u00b7 end of verse %s \u00b7', fr: '\u00b7 fin du couplet %s \u00b7' },

	// ── Fit metadata auto-populate (§A.6; Kimi's rulings, 2026-07-13;
	//    agentless; copy flagged for Dann's review) ──
	'meta.fromScore':              { en: 'from score',                   fr: 'de la partition' },
	'meta.revertToScore':          { en: 'Revert to score header',       fr: 'Rétablir l’en-tête de la partition' },
	// The Q4 provenance line composes as "Arr. {name} · {detectedFrom} {format}"
	// (Kimi's §A.28 example); the format label (MusicXML, MNX) is a proper
	// name, never translated.
	'meta.arrAbbr':                { en: 'Arr.',                         fr: 'Arr.' },
	'meta.detectedFrom':           { en: 'Detected from',                fr: 'Détecté dans le fichier' },

	// ── Fit engraving controls (drawer panel beside the drop surface;
	//    agentless; copy flagged for Dann's review with the §A.13 strings) ──
	'engraving.heading':           { en: 'Engraving',                    fr: 'Gravure' },
	'engraving.staveSize':         { en: 'Stave size',                   fr: 'Taille de la portée' },
	'engraving.noteSpacing':       { en: 'Note spacing',                 fr: 'Espacement des notes' },
	'engraving.systemSpacing':     { en: 'Between systems',              fr: 'Entre les systèmes' },
	'engraving.reset':             { en: 'Reset',                        fr: 'Réinitialiser' },

	// ── Score uploader (Fit ingest widget; Round 9 §2 Items 1, 2, 6; agentless) ──
	// THE DROP ZONE'S ONE PLACEHOLDER. RULED by Dann 2026-08-20 on his walk
	// of `3c498aa`: the drop zone showed three stacked lines in three
	// treatments while the textarea beside it showed one quiet line, and the
	// two are the pair that must match. The three strings below are what it
	// recombines, and they are KEPT rather than deleted: they are the
	// provenance of this one, and reversing the ruling is one edit if he
	// wants the three lines back.
	//
	// THE ENGLISH IS DANN'S, VERBATIM, including "or photograph". That used
	// to be a difference from 'upload.drop.acceptedNow', which said "a
	// photograph"; N.65 brought the conjunction back to that key on
	// 2026-08-21, so the two now agree and there is no difference to name.
	//
	// THE FRENCH IS RECOMBINED, NOT TRANSLATED. Every word comes from the two
	// French strings below, in their order, with three characters added and
	// nothing else: the space joining the two sentences and the two full
	// stops. Every format name stands exactly as it did, and the non-breaking
	// space before the colon is French typography the tree already had.
	// « ou » CONFIRMED BY DANN 2026-08-20, on his walk of `39d60e0`. The
	// English gained "or" before the last item and the French now mirrors
	// it. That is the one word in this string he added rather than the tree,
	// and it is the only word here that did not come from the three keys
	// below.
	'upload.drop.placeholder': { en: 'Drop a score here or click to browse. Accepted now: MNX, MusicXML, .mxl, Finale (.musx), MuseScore (.mscz), PDF, or photograph.', fr: 'Déposez une partition ici ou cliquez pour parcourir. Acceptés maintenant\u00a0: MNX, MusicXML, .mxl, Finale (.musx), MuseScore (.mscz), PDF, ou une photographie.' },

	// N.65 ship B. NO LONGER RENDERED, AND IT SWAPPED PLACES WITH THE THREE
	// KEYS BELOW. Dann ruled on 2026-08-21 that the score box says only the
	// first sentence and the format list moves outside it, so
	// `ScoreUploader` now assembles the placeholder from `.title` and
	// `.browse` and renders `.acceptedNow` as its own line. This string is
	// RETAINED rather than deleted, on the treatment those three already
	// carry: it is the provenance of the collapsed one-sentence version and
	// it holds the « ou » Dann confirmed by hand on 2026-08-20. Deleting the
	// one string he added a word to is not a thing this ship was asked to
	// do.
	// 'upload.drop.placeholder' is above; the three keys here are LIVE again.
	// UNUSED SINCE N.108 increment 2 (the drop zone is gone). Kept: ratified French.
	'upload.drop.title':           { en: 'Drop a score here',            fr: 'Déposez une partition ici' },
	// UNUSED SINCE N.108 increment 2 (the drop zone is gone). Kept: ratified French.
	'upload.drop.browse':          { en: 'or click to browse',           fr: 'ou cliquez pour parcourir' },
	// THE LEAD-IN IS GONE AND THE « ou » IS BACK, N.65, Dann's ruling of
	// 2026-08-21: "If we remove 'Acceptés maintenant :/ Accepted now:' we let
	// the remaining French shrink to a single line and it stops the downward
	// displacement of elements in French. I think it's understood that the
	// file names are the acceptable formats."
	//
	// NO NEW FRENCH IS WRITTEN. Every word here comes from
	// `upload.drop.placeholder` above, which Dann confirmed by hand on
	// 2026-08-20, and the tail is that string's own tail: `PDF, or
	// photograph` and `PDF, ou une photographie`.
	//
	// THE « ou » CORRECTS THE DESK, NOT DANN. Ship B wrote `PDF, a
	// photograph` and `PDF, une photographie` and the desk then told him the
	// missing conjunction could stay missing. The comment four lines above
	// `upload.drop.placeholder` says why that was wrong: the conjunction is
	// the one word in that string he added rather than the tree, and nothing
	// has reversed it. A word Dann added by hand is a ruling.
	//
	// NO TERMINAL FULL STOP. Without a lead-in the line is a bare list, not a
	// sentence. If Dann wants the stop back it is one character in each
	// language.
	// UNUSED SINCE N.108 increment 2 (the drop zone is gone). Kept: ratified French.
	'upload.drop.acceptedNow': { en: 'MNX, MusicXML, .mxl, Finale (.musx), MuseScore (.mscz), PDF, or photograph', fr: 'MNX, MusicXML, .mxl, Finale (.musx), MuseScore (.mscz), PDF, ou une photographie' },
	// UNUSED SINCE N.108 increment 2 (the drop zone is gone). Kept: ratified French.
	'upload.drop.release':         { en: 'Release to add your score',    fr: 'Relâchez pour ajouter votre partition' },
	// The score intake's watermark. « partition » is DANN'S OWN WORD, not a
	// translation this desk chose, and no other French ships for it.
	'upload.watermark':            { en: 'score',                        fr: 'partition' },
	// UNUSED SINCE N.108 increment 4 (the photograph button is gone; the one
	// picker takes a photograph like every other kind, and a picture asks in
	// place which it is). Kept: ratified French. RULED BY DANN 2026-09-03:
	// the strings are "marked unused in place, not deleted".
	'upload.scanTooltip':          { en: 'Read a score from a photograph', fr: 'Lire une partition à partir d’une photographie' },

	'upload.status.reading':       { en: 'Reading file…',           fr: 'Lecture du fichier…' },
	'upload.status.converting':    { en: 'Converting Finale file…',  fr: 'Conversion du fichier Finale…' },
	'upload.status.convertingMscz':{ en: 'Converting MuseScore file…', fr: 'Conversion du fichier MuseScore…' },

	'upload.format.mnxDirect': { en: 'Format: MNX (direct)', fr: 'Format\u00a0: MNX (direct)' },
	'upload.format.musicxmlDirect': { en: 'Format: MusicXML (direct)', fr: 'Format\u00a0: MusicXML (direct)' },
	'upload.format.mxl': { en: 'Format: MusicXML (.mxl)', fr: 'Format\u00a0: MusicXML (.mxl)' },
	'upload.format.musxDenigma': { en: 'Format: Finale .musx → MNX', fr: 'Format\u00a0: Finale .musx → MNX' },
	'upload.format.msczWebmscore': { en: 'Format: MuseScore → MusicXML', fr: 'Format\u00a0: MuseScore → MusicXML' },

	'upload.banner.denigma':       { en: 'Converted from Finale format by denigma. Lyric alignment and measure structure are preserved. Verify custom expressions or complex layouts if the score appears unusual.', fr: 'Converti depuis le format Finale par denigma. L’alignement des paroles et la structure des mesures sont préservés. Vérifiez les expressions personnalisées ou les mises en page complexes si la partition semble inhabituelle.' },
	'upload.banner.dismiss':       { en: 'Dismiss',                      fr: 'Ignorer' },

	'upload.continue':             { en: 'Continue to analysis',         fr: 'Continuer vers l’analyse' },
	'upload.tryAnother':           { en: 'Try another file',             fr: 'Essayer un autre fichier' },


	'upload.soon.mscz':            { en: 'MuseScore (.mscz) import is coming soon.', fr: 'L’import MuseScore (.mscz) arrive bientôt.' },
	// ── N.59: the page reader ────────────────────────────────────────
	// The two questions the reader cannot answer for itself (Ruling A), the
	// read report the drawer declares (Ruling D), and the reader's fidelity
	// tier. Every French term here is adopted, ordinary musical French:
	// clé, armure, dièse, bémol, portée, interligne, silence. Nothing coined.
	'upload.status.readingPage':   { en: 'Reading the page…', fr: 'Lecture de la page…' },
	'upload.status.preparingReader': { en: 'Preparing the page reader. This will only happen once.', fr: 'Préparation du lecteur de page. Cela n’arrivera qu’une fois.' },
	'upload.format.imageReader':   { en: 'Format: photograph → MusicXML', fr: 'Format\u00a0: photographie → MusicXML' },
	'upload.format.pdfReader':     { en: 'Format: PDF → MusicXML', fr: 'Format\u00a0: PDF → MusicXML' },
	'upload.banner.reader':        { en: 'Read from a picture. Ilya worked the notes out from the ink, so check them against your own paper before you trust them. The words are not in a picture; type them in Transcription.', fr: 'Lu à partir d’une image. Ilya a déduit les notes de l’encre, alors vérifiez-les sur votre propre partition avant de vous y fier. Les paroles ne sont pas dans une image; saisissez-les dans Transcription.' },

	'upload.ask.title':            { en: 'Two things Ilya cannot see', fr: 'Deux choses qu’Ilya ne peut pas voir' },
	'upload.ask.why':              { en: 'Ilya reads the notes off the picture, but not the clef or the key signature. Read those off your own paper.', fr: 'Ilya lit les notes sur l’image, mais ni la clé ni l’armure. Lisez-les sur votre propre partition.' },
	'upload.ask.clef':             { en: 'Clef', fr: 'Clé' },
	'upload.ask.clefTreble':       { en: 'Treble', fr: 'Clé de sol' },
	'upload.ask.clefTrebleOttava': { en: 'Treble, sounding an octave lower', fr: 'Clé de sol, à l’octave inférieure' },
	'upload.ask.clefBass':         { en: 'Bass', fr: 'Clé de fa' },
	'upload.ask.key':              { en: 'Key signature', fr: 'Armure' },
	'upload.ask.keyNone':          { en: 'No sharps or flats', fr: 'Aucune altération' },
	'upload.ask.keySharp':         { en: '1 sharp', fr: '1 dièse' },
	'upload.ask.keySharps':        { en: '%s sharps', fr: '%s dièses' },
	'upload.ask.keyFlat':          { en: '1 flat', fr: '1 bémol' },
	'upload.ask.keyFlats':         { en: '%s flats', fr: '%s bémols' },
	'upload.ask.read':             { en: 'Read this page', fr: 'Lire cette page' },
	'upload.ask.cancel':           { en: 'Cancel', fr: 'Annuler' },

	// N.97. The prompt CONFIRMS what the reader found instead of asking blind.
	// Only these two frame strings are new; the field labels, the option
	// labels, and both buttons are `upload.ask.*` above, unchanged, and the
	// abstention path shows `upload.ask.title` and `upload.ask.why` word for
	// word. Both rows are Dann's own wording, approved 2026-08-24 and
	// transcribed verbatim, straight apostrophes included.
	'upload.confirm.title':        { en: 'Two things Ilya read from the page', fr: "Deux choses qu'Ilya a lues sur la page" },
	'upload.confirm.why':          { en: 'Ilya read the clef and the key signature off the picture. Check them against your own paper, and change them if it read wrong.', fr: "Ilya a lu la clé et l'armure sur l'image. Vérifiez-les sur votre propre partition, et corrigez-les s'il a mal lu." },

	'upload.report.title':         { en: 'What Ilya read', fr: 'Ce qu’Ilya a lu' },
	'upload.report.systems':       { en: '%s systems, %s staves', fr: '%s systèmes, %s portées' },
	'upload.report.spacing':       { en: 'Staff spacing: %s px', fr: 'Interligne\u00a0: %s px' },
	'upload.report.events':        { en: '%s notes, %s rests, %s measures', fr: '%s notes, %s silences, %s mesures' },
	'upload.report.seconds':       { en: 'Read in %s s', fr: 'Lu en %s s' },
	'upload.report.pitchSubs':     { en: 'Pitch assumed on %s notes (measures %s).', fr: 'Hauteur supposée sur %s notes (mesures %s).' },
	'upload.report.durationSubs':  { en: 'Length assumed on %s notes (measures %s).', fr: 'Durée supposée sur %s notes (mesures %s).' },
	// N.96 ship 1b. One page raising no longer aborts the whole read, so the
	// read report names the pages that failed. Both strings are Dann's own
	// wording, ruled 2026-08-24 and transcribed verbatim with the page number
	// substituted; the French keeps its straight apostrophe. Rendered ONCE PER
	// FAILED PAGE rather than pluralized, so no second string is coined.
	'upload.report.pageFailed':    { en: 'Ilya could not read page %s.', fr: "Ilya n'a pas pu lire la page %s." },
	'upload.report.staffFallback': { en: 'Ilya could not tell which staff carries the voice in %s systems, and read the top one.', fr: 'Ilya n’a pas pu déterminer quelle portée porte la voix dans %s systèmes, et a lu celle du haut.' },

	'upload.err.readerLoadFailed': { en: 'The page reader could not be loaded. Check your connection and try again.', fr: 'Le lecteur de page n’a pas pu être chargé. Vérifiez votre connexion et réessayez.' },
	'upload.err.pageReadFailed':   { en: 'Ilya could not read this page. Reading photographs is new and does not yet work on every page. If you have the score as a MusicXML, MNX, or Finale file, Ilya reads those directly.', fr: 'Ilya n’a pas pu lire cette page. La lecture de photographies est nouvelle et ne fonctionne pas encore sur toutes les pages. Si vous avez la partition sous forme de fichier MusicXML, MNX ou Finale, Ilya lit ces formats directement.' },
	'upload.err.imageUndecodable': { en: 'This browser cannot open that picture. A JPEG or a PNG will work.', fr: 'Ce navigateur ne peut pas ouvrir cette image. Un JPEG ou un PNG fonctionnera.' },
	'upload.err.pdfUnreadable':    { en: 'Ilya could not open that PDF. If it is password protected, save an unlocked copy and try again.', fr: 'Ilya n’a pas pu ouvrir ce PDF. S’il est protégé par un mot de passe, enregistrez-en une copie déverrouillée et réessayez.' },
	// N.96. Both strings are Dann's own wording, the French ruled 2026-08-24
	// and transcribed verbatim, straight apostrophe included.
	'upload.err.pdfJbig2':         { en: 'This PDF stores its pages in JBIG2-compressed images, and they could not be decoded.', fr: "Ce PDF enregistre ses pages en images compressées JBIG2, qui n'ont pas pu être décodées." },

	'upload.err.mus':              { en: 'This is a pre-2014 Finale file (.mus). This closed format cannot be read directly. Resave it as .musx in Finale 2014 or later, or export it to MusicXML, then upload again.', fr: 'Ceci est un fichier Finale antérieur à 2014 (.mus). Ce format fermé ne peut pas être lu directement. Réenregistrez-le en .musx dans Finale 2014 ou ultérieur, ou exportez-le en MusicXML, puis téléversez-le à nouveau.' },
	'upload.err.midi':             { en: 'This is a MIDI file, which Ilya cannot read. If it came from notation software, export MusicXML from the same program, then upload that.', fr: 'Ceci est un fichier MIDI, qu’Ilya ne peut pas lire. S’il provient d’un logiciel de notation, exportez-le en MusicXML depuis le même logiciel, puis téléversez-le.' },
	'upload.err.invalidMnxJson':   { en: 'This .mnx file is not valid MNX JSON.', fr: 'Ce fichier .mnx n’est pas un MNX JSON valide.' },
	'upload.err.jsonNotMnx':       { en: 'This JSON file is not an MNX score.', fr: 'Ce fichier JSON n’est pas une partition MNX.' },
	'upload.err.xmlNotMusicxml':   { en: 'This XML file is not MusicXML.', fr: 'Ce fichier XML n’est pas du MusicXML.' },
	'upload.err.xmlRootIs':        { en: 'The root element is %s.',      fr: 'L’élément racine est %s.' },
	'upload.err.zipUnrecognised':  { en: 'This ZIP file is not a recognised score container.', fr: 'Ce fichier ZIP n’est pas un conteneur de partition reconnu.' },
	'upload.err.mxlUnreadable':    { en: 'This .mxl file could not be opened. It may be corrupt.', fr: 'Ce fichier .mxl n’a pas pu être ouvert. Il est peut-être corrompu.' },
	'upload.err.mxlNoRootfile':    { en: 'No score was found inside this .mxl archive.', fr: 'Aucune partition n’a été trouvée dans cette archive .mxl.' },
	'upload.err.msczUnreadable':   { en: 'This .mscz file could not be opened. It may be corrupt.', fr: 'Ce fichier .mscz n’a pas pu être ouvert. Il est peut-être corrompu.' },
	'upload.err.conversionFailed': { en: 'This Finale file could not be converted.', fr: 'Ce fichier Finale n’a pas pu être converti.' },
	'upload.err.wasmLoadFailed':   { en: 'The Finale converter could not load. Reload the page and try again.', fr: 'Le convertisseur Finale n’a pas pu se charger. Rechargez la page et réessayez.' },
	'upload.err.msczConversionFailed': { en: 'This MuseScore file could not be converted.', fr: 'Ce fichier MuseScore n’a pas pu être converti.' },
	'upload.err.msczWasmLoadFailed':   { en: 'The MuseScore converter could not load. Reload the page and try again.', fr: 'Le convertisseur MuseScore n’a pas pu se charger. Rechargez la page et réessayez.' },
	'upload.err.tooLarge':         { en: 'This score is too large to process on this device.', fr: 'Cette partition est trop volumineuse pour être traitée sur cet appareil.' },
	'upload.err.parseFailed':      { en: 'This score could not be read. It may be incomplete or use unsupported features.', fr: 'Cette partition n’a pas pu être lue. Elle est peut-être incomplète ou utilise des fonctions non prises en charge.' },
	'upload.err.unrecognised':     { en: 'This file was not recognised as a score.', fr: 'Ce fichier n’a pas été reconnu comme une partition.' },

	// ── The voice anchor (N.73 S3) ───────────────────────────
	//    The drawer's pinned bottom line: a lavender dot, the voice's
	//    state, and the one control that opens the calibration takeover.
	//    English is the mockup's own, verbatim
	//    (`fable-gui-mockup_r1_2026-08-18.html:333-338`). The calibrated
	//    line's wording is the coordinating desk's inference, NOT a ruling,
	//    and is Dann's to settle.
	//    French, drafted and shown to Dann 2026-08-20: « calibrée » and
	//    « Calibrer » are ADOPTED from `profile.emptyState` below; the
	//    guillemets are ADOPTED from `profile.subtitleNamed`; the no-break
	//    space before the colon follows `calib.section.ariaLabel`.
	//    « Recalibrer » is COINED. No house precedent.
	'calib.anchor.uncalibrated': { en: 'Voice: not yet calibrated', fr: 'Voix\u00a0: pas encore calibrée' },
	'calib.anchor.named': { en: 'Voice: {voice}', fr: 'Voix\u00a0: \u00ab\u00a0{voice}\u00a0\u00bb' },
	'calib.anchor.calibrate': { en: 'Calibrate', fr: 'Calibrer' },
	'calib.anchor.recalibrate': { en: 'Re-calibrate', fr: 'Recalibrer' },

	// ── Calibration wizard (N.22 extraction; French placeholder = English
	//    verbatim, pending Dann's copy pass) ────────────────────────────────
	'calib.defaultVoiceName': { en: 'Voice', fr: 'Voix' },
	'calib.section.ariaLabel': { en: 'Your Resonances: voice calibration', fr: 'Vos résonances\u00a0: calibration de la voix' },
	'calib.common.continue': { en: 'Continue', fr: 'Continuer' },
	'calib.common.retake': { en: 'Re-take', fr: 'Refaire' },
	'calib.common.of': { en: 'of', fr: 'sur' },
	'calib.common.vowels': { en: 'vowels', fr: 'voyelles' },
	'calib.common.vowelWord': { en: 'Vowel', fr: 'Voyelle' },
	'calib.common.hz': { en: 'Hz', fr: 'Hz' },
	'calib.compact.vowelsSampled': { en: 'vowels sampled', fr: 'voyelles échantillonnées' },
	'calib.log.addedPrefix': { en: 'Added to progress:', fr: 'Ajouté à la progression\u00a0:' },
	'calib.log.hertz': { en: 'hertz', fr: 'hertz' },

	// N.22 (E.40): the voice switcher's own strings. This component held
	// them as English literals and did not import the dictionary at all, so
	// a French singer read English in the drawer header. Dann's ruling,
	// 2026-08-11: N.22 absorbs them. The switcher's `{name}, options` aria-
	// label is deliberately NOT keyed: 'options' is already French, so the
	// literal is correct in both languages. Do not 'fix' it.
	'calib.switcher.firstLaunchLede': { en: 'Please name your profile so we can map your voice across the ten sung Russian vowels.', fr: 'Veuillez nommer votre profil afin que nous puissions cartographier votre voix sur l\u2019ensemble des dix voyelles chantées du russe.' },
	'calib.switcher.startButton': { en: 'Start', fr: 'Démarrer' },
	'calib.switcher.deleteConfirm': { en: 'This deletes {name} and its readings from this device. Delete?', fr: 'Ceci supprime {name} et ses lectures de cet appareil. Supprimer?' },
	'calib.switcher.deleteButton': { en: 'Delete', fr: 'Supprimer' },
	'calib.switcher.keepButton': { en: 'Keep it', fr: 'Conserver' },
	'calib.switcher.newButton': { en: 'New', fr: 'Créer' },
	'calib.switcher.duplicateButton': { en: 'Duplicate', fr: 'Dupliquer' },
	'calib.switcher.renameButton': { en: 'Rename', fr: 'Renommer' },
	'calib.switcher.renameLabel': { en: 'Rename this voice', fr: 'Renommer cette voix' },
	'calib.switcher.nameLabel': { en: 'What shall we call this voice?', fr: 'Comment appellerons-nous cette voix?' },
	'calib.switcher.saveButton': { en: 'Save', fr: 'Enregistrer' },
	'calib.switcher.cancelButton': { en: 'Cancel', fr: 'Annuler' },
	'calib.roster.reading.captured': { en: 'Captured', fr: 'Captée' },
	'calib.roster.reading.provisional': { en: 'Provisional', fr: 'Provisoire' },
	'calib.roster.reading.estimated': { en: 'Estimated', fr: 'Estimée' },
	'calib.roster.actionsHeader': { en: 'Actions', fr: 'Actions' },
	'calib.roster.oNoteAria': { en: 'About the sung [o] vowel (opens the Learn note)', fr: 'À propos de la voyelle [o] chantée (ouvre la note dans Leçons)' },
	'calib.roster.noiseFloorTitle': { en: 'The room\'s noise floor could not be measured for this sample.', fr: 'Le niveau de bruit de fond de la pièce n\u2019a pas pu être mesuré pour cet échantillon.' },
	'calib.roster.noiseFloorLabel': { en: 'Noise floor: Unmeasured', fr: 'Bruit de fond\u00a0: non mesuré' },
	'calib.roster.tryAgain': { en: 'Try again', fr: 'Réessayer' },
	'calib.challengingInvite.button': { en: 'Sing the three Ilya derived for you', fr: 'Chanter les trois qu\u2019Ilya a déduites pour vous' },
	'calib.challengingInvite.caption': { en: 'None of the ten vowels is optional. These three are the hardest to produce on demand, so Ilya derives them from your own anchors until you choose to sing them.', fr: 'Aucune des dix voyelles n\u2019est facultative. Ces trois-là sont les plus difficiles à produire sur demande, donc Ilya les déduit de vos propres points d\u2019ancrage jusqu\u2019à ce que vous choisissiez de les chanter.' },
	'calib.characteristics.editButton': { en: 'Edit voice characteristics', fr: 'Modifier les caractéristiques vocales' },
	'calib.characteristics.addButton': { en: 'Add voice characteristics', fr: 'Ajouter des caractéristiques vocales' },
	'calib.welcome.title': { en: 'Finding Your Resonances', fr: 'Trouver vos résonances' },
	'calib.welcome.lede': { en: 'Fit will measure your voice to build a formant profile, which is a map of your voice\'s resonances that will be applied to your repertoire to determine how well it suits your voice. Follow the prompts. This wizard assumes you read IPA. Your device needs a working mic and you should be in a quiet space for the best capture of your resonances.', fr: 'Fit mesurera votre voix afin de constituer un profil de formants, c\u2019est-à-dire une carte des résonances de votre voix, qui sera ensuite appliquée à votre répertoire pour en évaluer la correspondance. Suivez les indications. Cet assistant présume que vous lisez l\u2019API. Votre appareil doit disposer d\u2019un microphone fonctionnel, et vous devriez vous trouver dans un endroit calme pour bien capter vos résonances.' },
	'calib.welcome.fryQuestion': { en: 'What is vocal fry?', fr: 'Qu\u2019est-ce que la friture vocale (\u00ab\u00a0vocal fry\u00a0\u00bb)?' },
	'calib.welcome.fryAnswer': { en: 'A low, creaky voice register, easy to sustain and gentle on the voice. Fit reads its resonances rather than your sung pitch, so comfort matters more than pitch here.', fr: 'Un registre vocal grave et grésillant, facile à tenir et doux pour la voix. Fit en lit les résonances plutôt que la hauteur de votre chant, donc le confort importe ici davantage que la hauteur.' },
	'calib.welcome.beginButton': { en: 'Begin', fr: 'Commencer' },
	'calib.readiness.title': { en: 'Getting ready', fr: 'Préparation' },
	'calib.readiness.quiet': { en: 'Listening for quiet. Stay silent for a moment.', fr: 'À l\u2019écoute du silence. Restez silencieux un moment.' },
	'calib.readiness.prepareLede': { en: 'Now a throwaway fry, just to check the mic hears you.', fr: 'Maintenant une friture d\u2019essai, simplement pour vérifier que le micro vous entend.' },
	'calib.readiness.countThree': { en: 'Three.', fr: 'Trois.' },
	'calib.readiness.countTwo': { en: 'Two.', fr: 'Deux.' },
	'calib.readiness.countOne': { en: 'One.', fr: 'Un.' },
	'calib.readiness.captureLede': { en: 'Fry now, and keep going until the bar fills.', fr: 'Faites la friture maintenant, et continuez jusqu\u2019à ce que la barre soit pleine.' },
	'calib.readiness.captureAria': { en: 'Recording your throwaway fry', fr: 'Enregistrement de votre friture d\u2019essai' },
	'calib.readiness.noMic': { en: 'We could not reach your microphone, so nothing was measured.', fr: 'Nous n\u2019avons pas pu accéder à votre microphone, donc rien n\u2019a été mesuré.' },
	'calib.readiness.noFry': { en: 'We did not hear a fry, so nothing was measured.', fr: 'Nous n\u2019avons pas entendu de friture, donc rien n\u2019a été mesuré.' },
	'calib.readiness.guidance': { en: 'You can carry on; each vowel asks for the microphone again.', fr: 'Vous pouvez poursuivre\u00a0: chaque voyelle redemande le microphone.' },
	'calib.readiness.complete': { en: 'Readiness check complete.', fr: 'Vérification préalable terminée.' },
	'calib.readiness.marginal': { en: 'Your fry is reading near the edge of our range; a little lower or higher may read cleaner.', fr: 'Votre friture se lit près de la limite de notre plage. Un peu plus grave ou plus aigu se lirait plus nettement.' },
	'calib.capture.allSet': { en: 'All set.', fr: 'Tout est prêt.' },
	'calib.capture.cuePrefix': { en: 'Tap the', fr: 'Touchez la voyelle' },
	'calib.capture.cueSuffix': { en: 'vowel to arm it, tap again to begin.', fr: 'pour l\u2019activer, puis touchez-la de nouveau pour commencer.' },
	'calib.capture.paused': { en: 'Paused. Resume when you\'re ready.', fr: 'En pause. Reprenez quand vous serez prêt.' },
	'calib.capture.resumeButton': { en: 'Resume', fr: 'Reprendre' },
	'calib.capture.hold.captured': { en: ', captured.', fr: ', captée.' },
	'calib.capture.hold.rolledBack': { en: 'New sample was less certain, so the previous one was kept.', fr: 'Le nouvel échantillon était moins certain, donc le précédent a été conservé.' },
	'calib.capture.hold.implausiblePrefix': { en: 'That reading looks unlikely for', fr: 'Cette lecture semble peu probable pour' },
	'calib.capture.hold.tryAgain': { en: 'Try again?', fr: 'Réessayer?' },
	'calib.capture.hold.noted': { en: 'Noted, moving on. You can re-take it from the summary.', fr: 'C\u2019est noté, on poursuit. Vous pourrez la refaire depuis le sommaire.' },
	'calib.capture.pauseButton': { en: 'Pause', fr: 'Pause' },
	'calib.capture.returnToSummary': { en: 'Return to summary', fr: 'Retour au sommaire' },
	'calib.capture.toast': { en: 'The room sounds a little lively. Your sample is still good, but a quieter space would help.', fr: 'La pièce sonne un peu réverbérante. Votre échantillon reste bon, mais un endroit plus silencieux aiderait.' },
	'calib.capture.toastDismissAria': { en: 'Dismiss', fr: 'Fermer' },

	// ── Vowel names (N.35) ────────────────────────
	//    Mitton (2020) §4.6's speakable nicknames, moved out of
	//    Pacifier.svelte, where they were English-only. Keyed by IPA
	//    glyph, as the old SPOKEN_NAME Record<Vowel, string> was.
	//    [o] and [u] were bare letters until Dann named them on
	//    2026-08-12: Russian-o after Grayson (2012) Appendix K, 'The
	//    Story of /o/', already cited at LearnContent.svelte:2819;
	//    cardinal-u to parallel cardinal-i and stand off horseshoe-u.
	//    FIVE of the French forms are the tree's own, not coinages:
	//    i vélaire (LearnContent.svelte:787), e fermé (:807), e ouvert,
	//    a clair and a sombre (GuideContent.svelte:70). The other five
	//    are proposals Dann ratified on 2026-08-12.
	'vowel.name.i': { en: 'cardinal-i', fr: 'i cardinal' },
	'vowel.name.e': { en: 'close-e', fr: 'e fermé' },
	'vowel.name.ɪ': { en: 'smallcaps-i', fr: 'i petite capitale' },
	'vowel.name.ɨ': { en: 'velar-i', fr: 'i vélaire' },
	'vowel.name.ɛ': { en: 'open-e', fr: 'e ouvert' },
	'vowel.name.a': { en: 'bright-a', fr: 'a clair' },
	'vowel.name.ɑ': { en: 'dark-a', fr: 'a sombre' },
	'vowel.name.ʌ': { en: 'turned-v', fr: 'v culbuté' },
	'vowel.name.o': { en: 'Russian-o', fr: 'o russe' },
	'vowel.name.u': { en: 'cardinal-u', fr: 'u cardinal' },
	'vowel.spoken': { en: 'the {name} vowel', fr: 'la voyelle {name}' },

	// ── Pacifier captions (N.35) ──────────────────
	//    {v} is the whole phrase from 'vowel.spoken'. Dann ruled on
	//    2026-08-12 that {v} never opens a French sentence, so the
	//    French shapes differ from the English deliberately.
	'pacifier.tapToCapture': { en: 'Tap a vowel to capture it.', fr: 'Touchez une voyelle pour la capter.' },
	'pacifier.preparing': { en: 'Preparing {v}. Three.', fr: 'Préparation de {v}. Trois.' },
	'pacifier.beginPhonating': { en: 'Begin phonating now. {v} in vocal fry.', fr: 'Commencez la phonation maintenant\u00a0: {v} en friture vocale.' },
	'pacifier.nowSustain': { en: 'Now sustain. Sample recording.', fr: 'Soutenez maintenant. Échantillon en cours d\u2019enregistrement.' },
	'pacifier.captured': { en: '{v} captured.', fr: 'Capture de {v} effectuée.' },
	'pacifier.rolledBack': { en: '{v}: new sample was less certain, so the previous one was kept.', fr: 'Pour {v}, le nouvel échantillon était moins certain, donc le précédent a été conservé.' },
	'pacifier.sampleUncertain': { en: '{v} sample uncertain. Tap to retry.', fr: 'Échantillon incertain pour {v}. Touchez pour réessayer.' },
	'pacifier.cancelled': { en: 'Capture cancelled.', fr: 'Capture annulée.' },
	'pacifier.selected': { en: '{v} selected.', fr: 'Sélection de {v}.' },
	'pacifier.armed': { en: '{v} armed. Tap again to begin.', fr: 'Activation de {v}. Touchez de nouveau pour commencer.' },
	'pacifier.armedRetake': { en: '{v} armed for re-take. Tap again to begin.', fr: 'Activation de {v} pour une nouvelle capture. Touchez de nouveau pour commencer.' },
	'pacifier.skipped': { en: '{v} skipped.', fr: 'Capture ignorée pour {v}.' },
	'pacifier.error.micPermission': { en: 'Microphone access is needed to hear your fry. Can you allow it and try again?', fr: 'L\u2019accès au microphone est nécessaire pour entendre votre friture. Pouvez-vous l\u2019autoriser et réessayer?' },
	'pacifier.error.micNotFound': { en: 'No microphone was found. Can you connect one and try again?', fr: 'Aucun microphone n\u2019a été trouvé. Pouvez-vous en brancher un et réessayer?' },
	'pacifier.error.noAudio': { en: 'No sound came through. Can you check the microphone and try again?', fr: 'Aucun son n\u2019est parvenu. Pouvez-vous vérifier le microphone et réessayer?' },
	'pacifier.error.tooShort': { en: 'That sample was a little short. Can you sustain the fry a moment longer?', fr: 'Cet échantillon était un peu court. Pouvez-vous soutenir la friture un instant de plus?' },
	'pacifier.error.default': { en: 'That sample could not be read. Can you try that again?', fr: 'Cet échantillon n\u2019a pas pu être lu. Pouvez-vous réessayer?' },
	'pacifier.wheelAria': { en: 'Vowel calibration. Tap a vowel to select it, tap again to begin capture, long-press to skip.', fr: 'Calibration des voyelles. Touchez une voyelle pour la sélectionner, touchez-la de nouveau pour lancer la capture, appuyez longuement pour l\u2019ignorer.' },
	'calib.summary.title': { en: 'Profile summary', fr: 'Sommaire du profil' },
	'calib.summary.savedLede': { en: 'Your profile is saved on this device. You can keep refining any reading below.', fr: 'Votre profil est enregistré sur cet appareil. Vous pouvez continuer à affiner n\u2019importe quelle lecture ci-dessous.' },
	'calib.summary.progressLedeSuffix': { en: 'vowels sampled. Review each reading and re-take anything uncertain before you finish.', fr: 'voyelles échantillonnées. Passez en revue chaque lecture et refaites tout ce qui est incertain avant de terminer.' },
	'calib.summary.finishButton': { en: 'Finish', fr: 'Terminer' },
	'calib.summary.resetConfirm': { en: 'This clears every reading saved for this voice. Start fresh?', fr: 'Ceci efface toutes les lectures enregistrées pour cette voix. Recommencer?' },
	'calib.summary.startFreshButton': { en: 'Start fresh', fr: 'Recommencer' },
	'calib.summary.keepProfileButton': { en: 'Keep my profile', fr: 'Conserver mon profil' },
	'calib.summary.startOverButton': { en: 'Start over', fr: 'Tout recommencer' },
	'calib.characteristics.title': { en: 'Voice characteristics', fr: 'Caractéristiques vocales' },
	'calib.characteristics.lede': { en: 'These optional values sharpen the fit analysis. Any field can stay blank; where a value is missing, the analysis simply stays broad for that dimension.', fr: 'Ces valeurs facultatives précisent l\u2019analyse de correspondance. Tout champ peut rester vide. Là où une valeur manque, l\u2019analyse demeure simplement générale pour cette dimension.' },
	'calib.characteristics.rangeHeading': { en: 'Range', fr: 'Ambitus' },
	'calib.characteristics.rangeLowLabel': { en: 'Lowest comfortable note', fr: 'Note la plus grave confortable' },
	'calib.characteristics.rangeHighLabel': { en: 'Highest comfortable note', fr: 'Note la plus aiguë confortable' },
	'calib.characteristics.rangeInvertedNote': { en: 'The lowest note is set above the highest.', fr: 'La note la plus grave est placée au-dessus de la plus aiguë.' },
	'calib.characteristics.tessituraHeading': { en: 'Tessitura', fr: 'Tessiture' },
	'calib.characteristics.tessituraHint': { en: 'Where you live, not your edges.', fr: 'Dans votre zone de confort, et non aux extrémités de votre ambitus.' },
	'calib.characteristics.tessituraLowLabel': { en: 'Tessitura floor', fr: 'Plancher de la tessiture' },
	'calib.characteristics.tessituraHighLabel': { en: 'Tessitura ceiling', fr: 'Plafond de la tessiture' },
	'calib.characteristics.tessituraInvertedNote': { en: 'The tessitura floor is set above its ceiling.', fr: 'Le plancher de la tessiture est placé au-dessus de son plafond.' },
	'calib.characteristics.passaggioHeading': { en: 'Passaggio', fr: 'Passaggio' },
	'calib.characteristics.passaggioHint': { en: 'The zona lies between two turns, a lower and an upper. Enter both to flag it; with either blank it stays unmarked, which does not mean it is absent.', fr: 'La zona se situe entre deux événements vocaux acoustiques, l\u2019un inférieur et l\u2019autre supérieur. Saisissez les deux pour la signaler. Si l\u2019un des deux reste vide, elle demeure non marquée, ce qui ne veut pas dire qu\u2019elle est absente.' },
	'calib.characteristics.passaggioPrimaryLabel': { en: 'Primary passaggio', fr: 'Passaggio primaire' },
	'calib.characteristics.passaggioSecondaryLabel': { en: 'Secondary passaggio', fr: 'Passaggio secondaire' },
	'calib.characteristics.doneButton': { en: 'Done', fr: 'Terminé' },

	// ── Voice profile pane (N.22 extraction; French placeholder = English
	//    verbatim except profile.withheld.*, which carries Dann's own French,
	//    migrated verbatim from the old inline WITHHELD_COPY object) ──────
	'profile.subtitleNamed': { en: 'Formant profile: a map of {voice}\u2019s resonances', fr: 'Profil de formants\u00a0: une carte des résonances de la voix \u00ab\u00a0{voice}\u00a0\u00bb' },
	'profile.subtitleYours': { en: 'Formant profile: a map of your voice\u2019s resonances', fr: 'Profil de formants\u00a0: une carte des résonances de votre voix' },
	'profile.count.1': { en: 'One', fr: 'Une' },
	'profile.count.2': { en: 'Two', fr: 'Deux' },
	'profile.count.3': { en: 'Three', fr: 'Trois' },
	'profile.count.4': { en: 'Four', fr: 'Quatre' },
	'profile.count.5': { en: 'Five', fr: 'Cinq' },
	'profile.count.6': { en: 'Six', fr: 'Six' },
	'profile.count.7': { en: 'Seven', fr: 'Sept' },
	'profile.count.8': { en: 'Eight', fr: 'Huit' },
	'profile.count.9': { en: 'Nine', fr: 'Neuf' },
	'profile.count.10': { en: 'Ten', fr: 'Dix' },
	'profile.lede': { en: 'Your repertoire-fit results will appear here after Ilya processes the score you upload.', fr: 'Vos résultats de correspondance au répertoire apparaîtront ici une fois qu\u2019Ilya aura traité la partition que vous téléversez.' },
	'profile.provisional.noneMessage': { en: 'You can update these values anytime through the drawer on the left.', fr: 'Vous pouvez modifier ces valeurs à tout moment depuis le tiroir de gauche.' },
	'profile.statusSetPlain': { en: 'Your profile is now set.', fr: 'Votre profil est maintenant établi.' },
	'profile.statusSetMeasuredSingular': { en: 'Your profile is now set with {count} vowel measured.', fr: 'Votre profil est maintenant établi, avec {count} voyelle mesurée.' },
	'profile.statusSetMeasuredPlural': { en: 'Your profile is now set with {count} vowels measured.', fr: 'Votre profil est maintenant établi, avec {count} voyelles mesurées.' },
	'profile.provisional.sentenceSingular': { en: 'Your {vowels} is provisional, and you can update this value anytime through the drawer on the left.', fr: 'Votre voyelle {vowels} est provisoire, et vous pouvez modifier cette valeur à tout moment depuis le tiroir à gauche.' },
	'profile.provisional.sentencePlural': { en: 'Your {vowels} are provisional, and you can update these values anytime through the drawer on the left.', fr: 'Vos voyelles {vowels} sont provisoires, et vous pouvez modifier ces valeurs à tout moment depuis le tiroir à gauche.' },

	// ── List separators (N.34) ───────────────────
	//    listSep hardcoded English joins. French takes no serial comma,
	//    so its pair and final joins are the same word. The medial is
	//    keyed although it is invariant, on the tab bar's precedent above.
	'profile.provisional.listSepPair': { en: ' and ', fr: ' et ' },
	'profile.provisional.listSepFinal': { en: ', and ', fr: ' et ' },
	'profile.provisional.listSepMedial': { en: ', ', fr: ', ' },
	'profile.emptyState': { en: 'Calibrate your voice to begin.', fr: 'Calibrez votre voix pour commencer.' },
	'profile.octaveNotice': { en: 'This voice line is notated in treble clef but sits an octave above the range you gave, so it\'s being read an octave lower to match your voice, as lower voices often sing treble parts. Check the score\'s clef if that\'s not right.', fr: 'Cette ligne vocale est notée en clé de sol, mais se situe une octave au-dessus de l\u2019ambitus que vous avez indiqué. Elle est donc lue une octave plus bas pour correspondre à votre voix, comme les voix graves chantent souvent des parties en clé de sol. Vérifiez la clé de la partition si ce n\u2019est pas le cas.' },
	'profile.scoreRegionAria': { en: 'Repertoire fit score', fr: 'Partition annotée du répertoire' },
	'profile.scorePageAria': { en: 'Score page {n} of {total}', fr: 'Page {n} sur {total} de la partition' },
	'profile.notesPageAria': { en: 'Analysis notes', fr: 'Notes d\u2019analyse' },
	'profile.emptyStateAria': { en: 'Voice profile', fr: 'Profil vocal' },
	'profile.withheld.heading': { en: 'Nothing is claimed about your voice', fr: 'Rien n’est affirmé sur votre voix' },
	'profile.withheld.lede': { en: 'Ilya has read your score, but no voice has been measured, so there is nothing to compare this line against.', fr: 'Ilya a lu votre partition, mais aucune voix n’a été mesurée, donc il n’y a rien à quoi comparer cette ligne.' },
	'profile.withheld.item1': { en: 'Every acoustic mark: no crossings, no timbre turns.', fr: 'Toute marque acoustique\u00a0: aucun croisement, aucun changement de timbre.' },
	'profile.withheld.item2': { en: 'The watch list, entirely. An empty list is the truthful output here.', fr: 'La liste des points à surveiller, entièrement. Une liste vide est ici la réponse honnête.' },
	'profile.withheld.item3': { en: 'Any reading of your range, your tessitura, or your passaggio.', fr: 'Toute lecture de votre ambitus, de votre tessiture ou de votre passaggio.' },
	// ── NotePicker (N.50) ─────────────────
	//    Scope B, ruled by Dann E.43: the three aria-labels, Clear, the
	//    empty readout, and the five accidental options. The accidental
	//    OPTIONS carry no glyph: a native iOS picker wheel ignores CSS, so
	//    the glyph could be neither kerned nor set in the notation font,
	//    and a word reads better on a wheel than a mis-set symbol.
	//    French adopted from GuideContent.svelte:64, which names this exact
	//    control: "choisissez la lettre, l'altération et l'octave".
	//    dièse, bécarre and double dièse are COINED, E.43.
	'notePicker.letterAria':      { en: 'Note letter', fr: 'Lettre de la note' },
	'notePicker.accidentalAria':  { en: 'Accidental',  fr: 'Altération' },
	'notePicker.octaveAria':      { en: 'Octave',      fr: 'Octave' },
	'notePicker.clear':           { en: 'Clear',       fr: 'Effacer' },
	'notePicker.empty':           { en: 'No note set', fr: 'Aucune note définie' },
	'notePicker.acc.doubleFlat':  { en: 'double flat',  fr: 'double bémol' },
	'notePicker.acc.flat':        { en: 'flat',         fr: 'bémol' },
	'notePicker.acc.natural':     { en: 'natural',      fr: 'bécarre' },
	'notePicker.acc.sharp':       { en: 'sharp',        fr: 'dièse' },
	'notePicker.acc.doubleSharp': { en: 'double sharp', fr: 'double dièse' },
	// N.55a/N.55b (Dann's ruling, E.47; French ratified by Dann, E.47).
	// %s is the file name, substituted with .replace('%s', ...) at the
	// call site, the convention 'upload.err.xmlRootIs' already uses.
	'upload.banner.noLyrics': { en: 'This score has no words in it. Your text is under the notes, one syllable per note. Click a note to move a syllable.', fr: 'Cette partition ne porte aucune parole. Votre texte se trouve sous les notes, une syllabe par note. Cliquez sur une note pour déplacer une syllabe.' },
	// N.65 ship B. `station.syllables` IS DELETED. Dann ruled the SYLLABLES
	// header away on 2026-08-21 and its text became the first element under
	// SHIFT LYRICS. Checked before deleting, the way ship A checked its six:
	// `SyllableStation.svelte`'s `<h3>` was the only consumer in the tree,
	// and no test and no end-to-end spec named it.
	'station.textChanged': { en: 'Text changed', fr: 'Texte modifié' },
	// N.55b Shift Lyrics. English ADOPTED verbatim from Finale's own manual
	// (`e46-n55b-click-assignment-design_2026-08-13.md` §8; cross-verified,
	// `ILYA-REGISTER_2026-08-11.md`). French COINED and ratified by Dann,
	// 2026-08-14: Finale's French localization could not be confirmed (its
	// Lyrics-tool chapter at finalemusic.fr refuses WebFetch, robots.txt).
	// Reuses the register already ratified at 'station.textChanged' (texte).
	// Rotate syllables was ratified in the same pass but is PARKED, dropped
	// from N.55b's active scope (no selection UI exists to drive it), so it
	// has no key here; add one only if it is ever un-parked.
	'shiftLyrics.title': { en: 'Shift Lyrics', fr: 'Décaler les paroles' },
	'shiftLyrics.toEndOfLyric': { en: 'to the End of the Lyric', fr: 'jusqu’à la fin du texte' },
	'shiftLyrics.toNextOpenNote': { en: 'to the Next Open Note', fr: 'jusqu’à la prochaine note libre' },
	// Direction is icon-only in the UI (arrows), never visible text, per
	// Dann's ruling, 2026-08-14. These two strings exist ONLY as aria-label
	// text for screen readers; nothing renders them.
	'shiftLyrics.forwardAria': { en: 'Forward', fr: "Vers l'avant" },
	'shiftLyrics.backAria': { en: 'Back', fr: "Vers l'arrière" },
	// N.27 / N.55b storage (R5). COINED, ratified by Dann, 2026-08-14, one
	// correction along the way: "lorsque", not "si" — leaving the page WILL
	// lose the work, it is not conditional, and the English already said
	// "when". Reuses 'enregistré' (calib.summary.savedLede, :418) and
	// 'syllabe' (upload.banner.noLyrics, :511). THE SAVE DOES NOT SWALLOW ITS
	// EXCEPTION (pairings.ts:385-389): 'no-storage' and 'write-failed' share
	// storage.saveFailed.generic, Dann's own collapse. Quota HAD its own line
	// here, 'storage.saveFailed.quota'; N.67 step 6 replaced it at the render
	// site with 'storage.quotaFull', which says the same thing about the whole
	// song rather than about the pairing map alone and carries the figures, and
	// DANN RULED IT DELETED 2026-08-18. Load's reasons now split rather than
	// share: see 'song.unreadable' and 'song.newerIlya' below.
	'storage.saveFailed.generic': { en: 'Your syllable placements could not be saved on this device. They will be lost when you leave this page.', fr: 'Vos syllabes n’ont pas pu être enregistrées sur cet appareil. Elles seront perdues lorsque vous quittez cette page.' },
	'storage.loadFailed': { en: 'Your saved syllable placements could not be read back.', fr: 'Vos syllabes enregistrées n’ont pas pu être relues.' },
	// N.67 step 6, THE SWEEP. Design §4's failure handling, finalized in both
	// languages. **Ratified by Dann as a whole table, 2026-08-18, French seen
	// first, before a word of it entered the tree.** Singer-facing copy says
	// "your songs" and never "binder", which is a ratified DEVIATION from §4's
	// draft prose. Nothing is coined: 'chant' and 'bibliothèque' are already
	// ratified in this file, and every other word is ordinary.
	//
	// FOUR NEW HARD-SPACE SITES, all French colons: storage.quotaFull,
	// storage.quotaNumbers, storage.partialLoss, and collide.title's revision.
	// The English colons carry an ordinary space, which is this file's own
	// English practice ('inspector.notationDefault' sets it).
	//
	// TYPOGRAPHY: the ratified table was written with straight apostrophes and
	// this file has used the typographic ’ for every possessive and elision
	// since 'storage.saveFailed'. The character was matched to the tree rather
	// than to the table, which is a change of glyph and not of wording.
	// **RATIFIED BY DANN 2026-08-18**, after the fact and on the record.
	'storage.quotaFull': { en: 'Ilya could not save: this browser’s storage is full. Your work is still on screen. Export your songs now to keep them, or free space and try again.', fr: 'Ilya n’a pas pu enregistrer\u00a0: le stockage de ce navigateur est plein. Votre travail est toujours à l’écran. Exportez vos chants maintenant pour les conserver, ou libérez de l’espace et réessayez.' },
	// Appended to the line above, and ONLY where `navigator.storage.estimate()`
	// returned real figures. A notice that says "of undefined" is worse than a
	// notice that says nothing about size at all.
	'storage.quotaNumbers': { en: 'Storage: %s of %s used.', fr: 'Stockage\u00a0: %s utilisés sur %s.' },
	// Shown ONCE per device, when `navigator.storage.persisted()` reports false.
	// Design §4 is honest about what detection can do: a full eviction takes
	// localStorage, IndexedDB, and the Cache API together, so nothing survives
	// to detect it with. This is the warning BEFORE, not a report after.
	'storage.evictionRisk': { en: 'This browser may delete Ilya’s storage after a period of disuse. Export your songs to keep them safe.', fr: 'Ce navigateur peut supprimer le stockage d’Ilya après une période d’inactivité. Exportez vos chants pour les garder en sécurité.' },
	// The partial-loss oddity: the pointer in localStorage names a song the
	// vault does not hold, while the vault holds others. Design §4's "plain
	// notice naming what happened".
	'storage.partialLoss': { en: 'Ilya’s storage looks incomplete: the last open song is not in the library. If you have an exported file, import it to bring your songs back.', fr: 'Le stockage d’Ilya semble incomplet\u00a0: le dernier chant ouvert n’est pas dans la bibliothèque. Si vous avez un fichier exporté, importez-le pour retrouver vos chants.' },
	// A record that fails validation. NEVER OVERWRITTEN AND NEVER DELETED: the
	// third sentence is the salvage path, and it is the whole reason the other
	// two can be said honestly.
	'song.unreadable': { en: 'This song could not be read. It has been left untouched. You can still export it.', fr: 'Ce chant n’a pas pu être lu. Il a été laissé intact. Vous pouvez tout de même l’exporter.' },
	// A record whose `schema` exceeds what this code knows. Read-never, written
	// never. Unlike 'binder.err.newer', a reload CAN deliver a newer Ilya here,
	// because this is the app's own origin rather than a file from elsewhere.
	'song.newerIlya': { en: 'This song was saved by a newer Ilya. Reload the app to update, then try again.', fr: 'Ce chant a été enregistré par une version plus récente d’Ilya. Rechargez l’application pour la mettre à jour, puis réessayez.' },
	// No storage at all: neither IndexedDB nor localStorage would answer. Ilya
	// runs in memory and says so rather than pretending it saved.
	'storage.none': { en: 'Nothing can be saved in this browsing mode. Your work will not survive closing the page. You can still export your songs.', fr: 'Rien ne peut être enregistré dans ce mode de navigation. Votre travail ne survivra pas à la fermeture de la page. Vous pouvez tout de même exporter vos chants.' },
	// N.67 step 1, socket §4.1. Two tabs, one song: the tab that has unsaved
	// work KEEPS it and says this. The second sentence is the whole point of
	// the notice, because the failure it replaces was silence.
	// French written 2026-08-16 and shown to Dann before this shipped.
	// 'onglet' and 'chant' are both adopted, ordinary words; nothing is coined.
	'storage.otherTab': { en: 'This song was changed in another Ilya tab. Your work here has been kept.', fr: 'Ce chant a été modifié dans un autre onglet d’Ilya. Votre travail ici a été conservé.' },
	// N.67 step 3, design §2.6. The singer's own destructive act, and the only
	// one: an upload never rebuilds. 'Recommencer' and not 'Reprendre', which
	// also means to RESUME and would read as the opposite of what this does.
	// 'partition' is the register already ratified across upload.* and meta.*.
	// French written 2026-08-16 and shown to Dann before this shipped.
	// N.67 step 5, the binder. Dann's labels, 2026-08-16: the buttons say what
	// they do rather than carrying a metaphor. 'binder' stays the file
	// extension and the internal word; 'classeur' was rejected because it reads
	// as spreadsheet in French. §8's backup framing lives in the Guide instead,
	// in prose a singer can read, which is Dann's ruling and a DIVERGENCE from
	// §8's own line that "the UI copy says backup" (recorded in STATE.md).
	'binder.export': { en: 'Export this song', fr: 'Exporter ce chant' },
	'binder.import': { en: 'Import a song', fr: 'Importer un chant' },
	// The third choice, added once export existed: before it, the warning below
	// truthfully said Ilya could not keep the old song. It still cannot. The
	// singer now can.
	'binder.exportFirst': { en: 'Export this song first', fr: 'Exporter ce chant d’abord' },
	// Five conditions, three sentences: to a singer, "not an archive" and "an
	// archive that is not Ilya's" are one situation, and "no songs" and
	// "damaged" are another. All three end the same way, so that none of them
	// invites the reader to infer their file was harmed by the others.
	'binder.err.notIlya': { en: 'This file was not made by Ilya. Nothing has changed.', fr: 'Ce fichier n’a pas été créé par Ilya. Rien n’a été modifié.' },
	// NOT "reload to update": measured 2026-08-16 that a reload cannot deliver
	// a newer Ilya here. `sw.js` ships byte-identical every deploy so no new
	// worker is ever installed, it has no skipWaiting or clients.claim, its
	// catch-all serves stale, and every deployment is its own frozen origin.
	// That finding is N.72. An instruction that might not work must not ship.
	'binder.err.newer': { en: 'This file was made by a newer version of Ilya than this one, which cannot read it. Open it in the newest Ilya. Nothing has changed.', fr: 'Ce fichier a été créé par une version d’Ilya plus récente que celle-ci, qui ne peut pas le lire. Ouvrez-le dans la version la plus récente. Rien n’a été modifié.' },
	'binder.err.damaged': { en: 'This file is damaged and could not be read. Nothing has changed.', fr: 'Ce fichier est endommagé et n’a pas pu être lu. Rien n’a été modifié.' },
	// N.67 step 5, the remainder. Dann's ruling 2026-08-18: AN IMPORT ADDS SONGS
	// AND NEVER TOUCHES THE SONG YOU ARE IN, so `import.title` and `import.body`
	// are RETIRED. They warned that importing would destroy the open song, which
	// was true when there was only ever one song to destroy; songs have been
	// plural since cb7a15a and the warning became a lie about what the button
	// does. The only question an import now raises is the id collision below.
	//
	// Design §5, the three answers. Shown to Dann and APPROVED 2026-08-18 before
	// a line of it was written into the tree. Nothing is coined: 'chant' is
	// ratified across binder.*, replace.*, and songs.*, and every other word is
	// ordinary French. No colon, question mark, or exclamation, so this adds no
	// hard-space site. THE DATES ARE ISO, YYYY-MM-DD, which is the precedent
	// `placeholderName` already sets: it reads the same in both languages and
	// cannot be misread as a different day. First %s is the singer's own copy,
	// second is the file's.
	'binder.exportAll': { en: 'Export all songs', fr: 'Exporter tous les chants' },
	// REVISED for N.67 step 6, walk finding W1, approved by Dann 2026-08-18. The
	// dialog never named the song it was asking about, so two collisions in a
	// row read as one stubborn dialog and, with equal dates, the singer could
	// not tell which song each answer touched. %s is the colliding song's own
	// name, or the placeholder the list draws for it when it has none.
	'collide.title': { en: 'You already have this song: %s.', fr: 'Vous avez déjà ce chant\u00a0: %s.' },
	'collide.body': { en: 'The song in this file has the same identity as one you already have. Yours was last changed %s. The one in this file was last changed %s. Ilya cannot undo taking the one in this file.', fr: 'Le chant de ce fichier a la même identité qu’un chant que vous avez déjà. Le vôtre a été modifié pour la dernière fois le %s. Celui de ce fichier a été modifié pour la dernière fois le %s. Ilya ne peut pas annuler le remplacement.' },
	'collide.take': { en: 'Take the one in this file', fr: 'Prendre celui de ce fichier' },
	'collide.both': { en: 'Keep both', fr: 'Conserver les deux' },
	'collide.mine': { en: 'Keep mine', fr: 'Conserver le mien' },
	// TWO KEYS RATHER THAN A PLURAL SYSTEM. `i18n.ts` has no plural mechanism
	// and this step does not invent one. Picked on `n === 1`, which is correct
	// in French and correct in English except at zero, and zero cannot occur:
	// a binder with no songs is refused as `no-songs` before it gets here.
	'binder.importedOne': { en: 'One song was added.', fr: 'Un chant a été ajouté.' },
	'binder.importedMany': { en: '%s songs were added.', fr: '%s chants ont été ajoutés.' },
	'station.startOver': { en: 'Start placement over', fr: 'Recommencer le placement' },
	// The count of placements whose note the new score does not contain. They
	// are KEPT; this only says how many no longer have a note to sit on. %s is
	// the number. Twins 'station.textChanged' in restraint: a count, not alarm.
	// N.67 step 4a (Dann's ruling, 2026-08-16). THE CHIMERA WARNING. Before
	// this, a second score overwrote the song's title and file in place while
	// its placements survived onto music they were never made for. Shown only
	// when the fingerprint differs AND at least one placement would be orphaned:
	// a corrected note keeps every position, so it never asks, which is what
	// design §2.4 promised. French shown to Dann and approved 2026-08-16; no
	// colon, question mark, or exclamation, so it adds no ninth hard-space site.
	// Nothing coined: 'chant', 'partition', and 'placement' are all already
	// ratified elsewhere in this file.
	'replace.title': { en: 'This is not the same music.', fr: 'Ce n’est pas la même musique.' },
	'replace.body': { en: 'This score is not the one this song was built on. %s of your %s syllable placements have no note in it. Continuing replaces the whole song, its title, its score file, and every placement. Ilya cannot undo that. Export this song first if you want to keep it.', fr: 'Cette partition n’est pas celle sur laquelle ce chant a été construit. %s de vos %s placements de syllabes n’y ont aucune note. Continuer remplace le chant entier, son titre, son fichier de partition et tous ses placements. Ilya ne peut pas annuler cette action. Exportez ce chant d’abord si vous voulez le conserver.' },
	'replace.keep': { en: 'Keep this song', fr: 'Conserver ce chant' },
	'replace.replace': { en: 'Replace this song', fr: 'Remplacer ce chant' },
	'station.orphaned': { en: '%s placements have no note in this score. They have been kept.', fr: '%s placements n’ont plus de note dans cette partition. Ils ont été conservés.' },
	// N.67 step 4b, THE LIBRARY DOOR. The surface that makes songs plural.
	// Every French word below is ADOPTED, not coined: 'chant', 'partition', and
	// 'placement' are ratified across upload.*, binder.*, and replace.*, and
	// 'Renommer', 'Supprimer', 'Enregistrer', 'Annuler' and the
	// "Comment appellerons-nous" pattern are lifted verbatim from
	// calib.switcher.*, which shipped for voice profiles. A rename and delete
	// pattern that a singer has already met should not be re-worded here.
	/* REPERTOIRE, not Songs. Both words are Dann's, ruled 2026-08-20 on his
	   walk of the silhouette ship. Neither is coined: `Repertoire` and
	   « répertoire » are already house vocabulary at `profile.scoreRegionAria`
	   ('Repertoire fit score'), `profile.lede`, and `calib.welcome.lede`.

	   THE KEY IS UNCHANGED and it is not a lie: it addresses the songs
	   feature, whose other twenty strings still speak of one song at a time
	   ('New song', 'Delete this song'), which stays correct English because a
	   repertoire is made of songs. Only the STATION's name changed, which is
	   only what Dann ruled. */
	'songs.heading': { en: 'Repertoire', fr: 'Répertoire' },
	'songs.new': { en: 'New song', fr: 'Nouveau chant' },
	// The word a song is drawn under before it has anything to be named after.
	// A KEY AND NOT A LITERAL: it was English in the French drawer for exactly as
	// long as it took to look, because the placeholder is built in plain
	// TypeScript where the dictionary is not in hand. The module takes the word
	// as an argument instead, so it stays free of the table and still says it in
	// the singer's language.
	'songs.untitled': { en: 'Untitled', fr: 'Sans titre' },
	'songs.rename': { en: 'Rename', fr: 'Renommer' },
	'songs.delete': { en: 'Delete', fr: 'Supprimer' },
	'songs.nameLabel': { en: 'What shall we call this song?', fr: 'Comment appellerons-nous ce chant?' },
	'songs.save': { en: 'Save', fr: 'Enregistrer' },
	'songs.cancel': { en: 'Cancel', fr: 'Annuler' },
	// %s is the song's name. The row is a button, and its own text is the name,
	// so the label says what pressing it does.
	'songs.openAria': { en: 'Open %s', fr: 'Ouvrir %s' },
	// Delete wears the same shape as every other irreversible act in Ilya: name
	// what is lost, say there is no undo, and offer the export that makes the
	// loss avoidable. %s is the song's name.
	'songs.deleteTitle': { en: 'Delete this song?', fr: 'Supprimer ce chant?' },
	'songs.deleteBody': { en: 'This deletes %s from this device, with its score file and every placement it holds. Ilya cannot undo that.', fr: 'Ceci supprime %s de cet appareil, avec son fichier de partition et tous les placements qu\u2019il contient. Ilya ne peut pas annuler cette action.' },
	'songs.deleteConfirm': { en: 'Delete this song', fr: 'Supprimer ce chant' },
	// One notice for create, rename, and delete. All three end the same way for
	// the reason binder.err.* does: the singer must not infer damage from a
	// refusal. N.27: no save site is silent.
	'songs.err.write': { en: 'Ilya could not change your library. Nothing has changed.', fr: 'Ilya n\u2019a pas pu modifier votre biblioth\u00e8que. Rien n\u2019a \u00e9t\u00e9 modifi\u00e9.' },
	// Design \u00a72.3 layer 2, RECOGNITION. A hash may guide; only the singer
	// decides, so this is always a prompt and never an action. Raised only from a
	// neutral state, so nothing is at risk either way and neither answer is the
	// dangerous one. Staying put is the default, because it keeps the singer
	// where they chose to be. %s is the matched song's name.
	'recognize.title': { en: 'Ilya has met this music before.', fr: 'Ilya a d\u00e9j\u00e0 rencontr\u00e9 cette musique.' },
	'recognize.body': { en: 'This score is the one %s was built on. You can open that song and keep the work already in it, or put this file in the song you are in.', fr: 'Cette partition est celle sur laquelle %s a \u00e9t\u00e9 construit. Vous pouvez ouvrir ce chant et conserver le travail qu\u2019il contient d\u00e9j\u00e0, ou placer ce fichier dans le chant o\u00f9 vous \u00eates.' },
	'recognize.open': { en: 'Open that song', fr: 'Ouvrir ce chant' },
	'recognize.here': { en: 'Put it in this song', fr: 'Le placer dans ce chant' },
	'profile.withheld.close': { en: 'The stave carries no marks because none can be earned.', fr: 'La portée ne porte aucune marque, car aucune ne peut être fondée.' },
};

/**
 * Look up a translated string by key and language.
 * Returns [MISSING: key] if the key or language variant is absent,
 * enforcing 100% French parity.
 */
export function t(key: string, lang: Language): string {
	const entry = strings[key];
	if (!entry || !entry[lang]) return `[MISSING: ${key}]`;
	return entry[lang];
}

/**
 * Map a stressSource value to its translated label.
 */
export function stressSourceLabel(source: string, lang: Language): string {
	switch (source) {
		case 'dictionary':       return t('stress.dictionary', lang);
		case 'supplement':       return t('stress.supplement', lang);
		case 'yo-rule':          return t('stress.yoRule', lang);
		case 'yo-restored':      return t('stress.yoRestored', lang);
		case 'inferred':         return t('stress.inferred', lang);
		case 'unknown':          return t('stress.unknown', lang);
		case 'user-dictionary':  return t('stress.userDictionary', lang);
		case 'user-composer':    return t('stress.userComposer', lang);
		case 'user-override':    return t('stress.userOverride', lang);
		default:                 return source;
	}
}
