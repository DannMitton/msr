<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { updated } from '$app/state';
	import { transcribeWord } from '@ilya/phonology';
	import type { NotationPreferences } from '@ilya/phonology';
	import { loadDictionary, type LoaderState } from '$lib/loader';
	import { processText, wordGrid } from '$lib/pipeline';
	import { applyOpenSyllabificationToLines } from '$lib/syllable-utils';
	import type { LineData, WordStackData, SongMetadata, UserStressOverride, YoToggle, SyllableOverride } from '$lib/types';
	import { t, type Language } from '$lib/i18n';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import Drawer from '$lib/components/Drawer/Drawer.svelte';
	import {
		buildSlotQueue,
		firstPass,
		refreshPairings,
		melismaIds,
		toggleMelisma,
		vacatedNotes,
		shiftToEndOfLyric,
		shiftToNextOpenNote,
		mergeOnUpload,
		type PairingMap,
		type ShiftDirection,
	} from '$lib/shane/pairings';
	// N.67 step 0: the song document owns the per-song state and is the only
	// thing that talks to storage. `savePairings` / `loadPairings` are no
	// longer called from here; the legacy driver writes the same key.
	import { isDeskLayout } from '$lib/components/Drawer/layout';
	import { SongDocument, LEGACY_SONG_ID } from '$lib/library/document.svelte';
	import { Library } from '$lib/library/library';
	import { createMemoryDriver, globalStore } from '$lib/library/driver';
	import { emptySongRecord } from '$lib/library/types';
	import { readStorageEstimate, type StorageReading } from '$lib/library/quota';
	// N.67 step 6, the sweep. WHICH SENTENCE, AND WHETHER, is decided in plain
	// TypeScript where a gate can reach it. What is left in this file is looking
	// the key up and drawing the paragraph.
	import { bootNotices, drawerNotices, fillNotice, type NoticeLine } from '$lib/library/notices';
	import { hashBytes, fingerprintVocalLine } from '$lib/library/fingerprint';
	import { arrivalDecision } from '$lib/library/library';
	import { readBinder } from '$lib/library/binder';
	// N.67 step 5, the remainder. Which songs go into a binder, and what happens
	// to each song that comes out of one, are decisions in plain TypeScript for
	// the same reason the door's are: runes are inert under vitest, so a rule
	// written in this file is a rule no gate can reach.
	import {
		binderFailureKey,
		collisionName,
		exportBinder,
		importBinder,
		importNoticeKey,
		type Collision,
		type CollisionAnswer,
	} from '$lib/library/exchange';
	import { newId, writeActiveSongId } from '$lib/library';
	// N.67 step 4b, the library door. Every decision it makes is in this plain
	// TypeScript module, where vitest can reach it; what is left below is wiring.
	import {
		createSong,
		deleteSong,
		libraryRows,
		listSongs,
		nameFor,
		recognize,
		renameSong,
		toRows,
	} from '$lib/library/songs';
	import type { SongSummary } from '$lib/library/driver';
	import type { SongRecord } from '$lib/library/types';
	import type { SourceBytes } from '$lib/library/driver';
	import { version } from '$app/environment';
	import type { OpenedLibrary } from '$lib/library';
	import SyllableStation from '$lib/shane/SyllableStation.svelte';
	import RootPanel from '$lib/components/Drawer/RootPanel.svelte';
	import IntakePanel from '$lib/components/Drawer/IntakePanel.svelte';
	import InspectorPanel from '$lib/components/Drawer/InspectorPanel.svelte';
	import Paper from '$lib/components/Paper/Paper.svelte';
	import ReadingAid from '$lib/components/ReadingAid.svelte';
import InstallPrompt from '$lib/components/InstallPrompt.svelte';
	import ReadingPaper from '$lib/components/Paper/ReadingPaper.svelte';
	import DeskHead from '$lib/components/DeskHead.svelte';
	import {
		tabIdFor,
		surfaceFor,
		restoreSurface,
		type Destination,
		type StudioDocument,
		type TabId,
	} from '$lib/destinations';
	import { INCLUDE_SHANE } from '$lib/wall';
	import CalibrationWizard from '$lib/shane/CalibrationWizard.svelte';
	import VoiceAnchor from '$lib/components/Drawer/VoiceAnchor.svelte';
	import MetadataFields from '$lib/components/Drawer/MetadataFields.svelte';
	import {
		SectionSet,
		FIRST_RUN_STATIONS,
		OPEN_STATIONS_KEY,
		STATION_IDS,
		UNPERSISTED_STATIONS,
	} from '$lib/components/Drawer/sections.svelte';
	// N.73 S3: the one predicate for "is this voice calibrated", lifted out of
	// the wizard so the voice anchor reads the same answer the wizard does.
	import { hasAnyReadings } from '$lib/shane/profileStore';
	import VoiceProfilePane from '$lib/shane/VoiceProfilePane.svelte';
	import ScoreUploader from '$lib/shane/ScoreUploader.svelte';
	import { ENGRAVING_DEFAULTS, type EngravingValues } from '$lib/shane/engraving';
	import {
		clearScoreFilled,
		dropTagsForEdits,
		onScoreIngested,
		revertToScoreHeader,
		type MetadataField,
		type MetadataState,
	} from '$lib/metadata-provenance';
	import NotationFields from '$lib/components/Drawer/NotationFields.svelte';
	import AnalysisStation from '$lib/components/Drawer/AnalysisStation.svelte';
	import StationHeader from '$lib/components/Drawer/StationHeader.svelte';
	import Loupe from '$lib/shane/Loupe.svelte';
	import CorrectionSurface from '$lib/shane/CorrectionSurface.svelte';
	import { QUIET_MS, rebuildSource, transcribeVerdict, type TextArrival } from '$lib/one-action';
	import {
		diffWordGrid,
		emptyDiff,
		rekeyByWord,
		rekeyByWordChar,
		type TextDiff,
	} from '$lib/text-diff';
	import { reseatByDiff } from '$lib/shane/reseat';
	import {
		findCliticFolds,
		isCliticSeated,
		readScoreText,
		seatCliticFolds,
	} from '$lib/shane/clitic-seat';
	import {
		COARSE_TAP_SPACES,
		FINE_TAP_SPACES,
		isDismissSwipe,
		nearestTarget,
		tapBand,
	} from '$lib/shane/loupe';
	import {
		applyTuplet,
		arrivalPitch,
		beatOfEntry,
		canTie,
		currentTie,
		currentType,
		DEFAULT_TUPLET,
		enterEntry,
		isEnteredId,
		measureFill,
		middleLine,
		previousEntry,
		stepCursor,
		toggleRest,
		toggleTie,
		tupletRun,
		type Cursor,
		type TupletDefinition,
	} from '$lib/shane/entry';
	import type { NoteBase, SpellingContext, VocalLineEvent } from '@ilya/score-parser';
	import {
		applyCorrections,
		clearCorrection,
		currentDuration,
		currentPitch,
		DIGIT_BASE,
		flatPitch,
		naturalPitch,
		neighbourId,
		octavePitch,
		orphanIds,
		semitonePitch,
		sharpPitch,
		stepPitch,
		withCorrection,
		type CorrectionMap
	} from '$lib/shane/correction';
	import { pitchLabel } from '$lib/shane/note-picker';
	import type { IngestedScore } from '$lib/shane/ingestion/ingest';
	import type { PageProvenance } from '$lib/library/types';
	import type { Vowel, CalibratedFormant, VoiceCharacteristics } from '$lib/shane/engine/types';
	// Engine connectivity check
	const engineReady = typeof transcribeWord === 'function';
	// Dictionary loading state
	let loaderState = $state<LoaderState>({
		isLoading: true,
		error: null,
		entryCount: 0,
		durationMs: 0,
		progress: 0
	});
	// Language
	let language = $state<Language>('en');
	let { data }: { data: { opened: OpenedLibrary | null } } = $props();

	// N.67 steps 0 and 1, the socket and the vault. The per-song state, all
	// seven pieces of it, lives on this object and no longer on this component:
	// the poem, the metadata and its provenance tags, the glosses and their
	// anchors, the open-syllabification choice, and the pairing map. The page
	// reads and writes `doc.<field>` and never touches storage again.
	//
	// LOADED BEFORE IT EXISTS, WHICH IS THE WHOLE POINT. `+page.ts`'s load
	// function opened the vault, ran the migration, and read the record before
	// this component existed, and the document is constructed FROM that result.
	// There is no interval in which an unrestored default could be saved over
	// real work, which is why `pairingsRestored` and its apology are gone
	// rather than moved.
	//
	// The `?? ` fallback covers the prerender pass only, where there is no
	// browser to read: it produces an empty in-memory song that is replaced the
	// moment a real load lands.
	// Read ONCE, on purpose, and said so with `untrack`: the document owns the
	// song for the life of this component, and rebuilding it when `data`
	// changed identity would throw away the singer's unsaved edits. Song
	// switching is `close()` then `open()`, at step 4, not a prop change.
	const opened = untrack(() => data.opened);
	const library = opened?.library ?? new Library(createMemoryDriver());
	// N.67 step 4b. A SLOT, no longer a constant. The comment above still holds
	// for `data`, which is read once: rebuilding the document because a PROP
	// changed identity would throw away unsaved edits. What changes here is that
	// the page may now put a DIFFERENT document in the slot on purpose, which is
	// `switchSong` below, and which is close() then open() exactly as step 0
	// promised. Measured 2026-08-18 before choosing: opening a song costs about
	// 49 ms for a .musicxml and about 343 ms for a real 143 KB .musx, so the
	// reload branch buys nothing and costs the drawer's whole state.
	let doc = $state(
		SongDocument.fromLoaded(
			library,
			opened?.loaded ?? { record: emptySongRecord(LEGACY_SONG_ID, new Date().toISOString()) },
		),
	);
	// Pipeline state
	let lines = $state<LineData[]>([]);
	let transcribeError = $state('');
	let transcribeMs = $state(0);
	let selectedWord = $state<WordStackData | null>(null);
	let lastFocusedWord = $state<{ line: number; word: number } | null>(null);
	// Drawer state
	/**
	 * PHONE ONLY: whether the drawer is up. N.108 increment 1a.
	 *
	 * It was `drawerCollapsed`, it was persisted under `ilya:drawerCollapsed`,
	 * and both are retired by Dann's ruling of 2026-09-02: the desk has no
	 * collapsed state, because at every width where the drawer and a whole
	 * sheet both fit "the drawer is always present". Below that width the
	 * layout is the phone's, where the drawer rises from the bottom, so the
	 * state worth naming is `raised`.
	 *
	 * IT IS NOT PERSISTED, and that is the ruling read literally: the key is
	 * retired, not renamed. THE ARRIVAL IS THE PAPER, which is both what the
	 * phone did before (it defaulted to collapsed) and what N.73 portrait C
	 * ruled on 2026-08-18, "the arrival view is the page". A singer who wants
	 * the drawer is one press or one swipe from it.
	 */
	let drawerRaised = $state(false);
	/**
	 * N.73 S3 ship one. Whether the calibration takeover has the drawer. E.27:
	 * a takeover "replaces the entire drawer, shows a single back affordance at
	 * the top, restores the station accordion in its prior state on exit, and
	 * is never entered by a chevron"
	 * (`fable-ruling-e27-four-tab-consolidation_2026-08-05.md`). Deliberately
	 * NOT persisted, on the same reasoning NOTATION's exemption from the open
	 * set below carries: a remembered takeover would open a singer into a
	 * ritual they did not ask for on this visit.
	 */
	let calibrating = $state(false);
	// N.43: Notation collapse. Deliberately NOT persisted: a remembered
	// collapse hides the toggles from a singer who forgot they exist.
	//
	// N.73 S3 ship one, on Dann's instruction of 2026-08-20 to build a ruling
	// that was already made and never built. THE DEFAULT IS COLLAPSED, ruled
	// 2026-08-18 (`fable-gui-session-record_2026-08-18.md:12-15`, ruling 2, and
	// `fable-gui-audit-and-spec_r1_2026-08-18.md:124`). Dann's rationale, kept
	// in his words: Ilya is already set to Grayson's defaults; the toggles are
	// departures from Grayson's schema, permissible at the user's discretion,
	// so they are something the user intentionally accesses, not screen real
	// estate spent by default.
	//
	// The line above stands and is unchanged. What it guarantees has narrowed
	// rather than reversed: non-persistence used to mean the toggles are
	// visible on every arrival, and now it means the RULED default is what
	// every arrival gets. Nothing else about the retract mechanism moved.
	/* N.65 ship B. THE DRAWER'S OPEN SET, and `notationExpanded` is inside
	   it rather than beside it. Every header in the drawer retracts now, so
	   one state holds all six, and NOTATION is the one that does not reach
	   storage. The reason above is unchanged and it is why: a remembered
	   collapse hides the toggles from a singer who forgot they exist. The
	   filter lives in `sections.svelte.ts` beside the key it writes.

	   FIRST RUN IS PIECE AND SOURCE OPEN (§B.5). NOTATION's ruled
	   collapsed-on-arrival default is that same list not naming it, so the
	   two rulings agree without a second mechanism. */
	const sections = new SectionSet({
		open: FIRST_RUN_STATIONS,
		storageKey: OPEN_STATIONS_KEY,
		unpersisted: UNPERSISTED_STATIONS,
	});
	/* N.73 S3 ship two. THE SPLIT. One `$state<TabId>` carried two questions
	   at once: where the singer is, and which paper Studio has on the desk.
	   S2 merged the two Studio drawers, which made the second question a
	   property of the first rather than a peer of it, and `destinations.ts`
	   has asked for this since S1. They are two values now.

	   `activeTab` survives as a DERIVED wire id, not as state. It is what
	   `ilya:activeTab` stores, what `HeaderBar` keys its four hues from
	   (Dann's ruling of 2026-08-19: four working surfaces, four hues), and
	   what `DeskHead` names. Nothing writes it; writing `destination` or
	   `studioDocument` is what moves it. */
	let destination = $state<Destination>('studio');
	let studioDocument = $state<StudioDocument>('transcription');
	const activeTab = $derived(tabIdFor({ destination, studioDocument }));
	// Shane: the active voice's stored readings and name, published by the
	// wizard in the drawer (the workshop) so the main pane (the gallery,
	// the Voice Profile envelope) mirrors the voice the drawer is working
	// on. The wizard owns the profile store; this is a read-only reflection.
	let shaneFormants = $state<Partial<Record<Vowel, CalibratedFormant>>>({});
	let shaneVoiceName = $state<string | undefined>(undefined);
	let shaneCharacteristics = $state<VoiceCharacteristics | undefined>(undefined);
	// The most recently ingested score from the Fit uploader. Live wiring
	// (handover v35 §E.7) connects this into the renderer and analysis path.
	let ingestedScore = $state<IngestedScore | null>(null);
	// N.67 step 3: placements whose note the newly uploaded score does not
	// contain. Kept, reported, never dropped. Cleared by the next upload.
	let orphanedCount = $state(0);
	// N.55b: the N.55a courtesy notice's file name. The pairing map itself is
	// `doc.pairings` now, and the save still does not swallow its exception:
	// `doc.saveFailure` and `doc.loadFailure` carry the reason the whole song
	// save or load reported, and the drawer shows it exactly as before.
	// French ratified by Dann, 2026-08-14.
	let noLyricsFile = $state<string | null>(null);
	// The syllable the NEXT note click will place. Finale's insertion point.
	let pairingCursor = $state(0);
	/* THE QUEUE, AND WHERE IT COMES FROM WHEN THE SINGER HAS TYPED NOTHING.

	   N.111 increment 3, ruled by Dann 2026-09-04: on a lyric-bearing score the
	   singer gets "the same click surface the no-lyrics path already has ...
	   N.55b's surface reaching the other path; do not build a second one."

	   NOTHING IN THAT SURFACE WAS EVER GATED ON `noLyrics`. `handleLoupePick`
	   places, `SyllableStation` draws the queue and the cursor, the two shifts
	   move a run, and none of them asks whether the file carried words. THE
	   QUEUE WAS THE WHOLE GAP: it is built from the singer's own transcription,
	   and on a score that arrives with words there usually is none, so
	   `slotQueue` was empty, `SyllableStation`'s own `slots.length > 0` guard
	   drew nothing, and `placeArmedSyllable` returned at its first line.

	   So the fallback is the score's own words, read through the same pipeline
	   (`readScoreText`, `clitic-seat.ts`). THE SINGER'S TEXT STILL WINS
	   wherever they have typed any: that is N.10 and E.31 Path C, and this only
	   fills a queue that would otherwise be empty.

	   IT IS THE SAME QUEUE THE SEAT'S ORIGINS POINT INTO, which is not a
	   coincidence and is worth keeping: `reconcilePairings` compares a stored
	   pairing's origin against this queue, so the automatic seat reads as
	   placed rather than as drift. */
	const scoreTextQueue = $derived(
		ingestedScore ? (readScoreText(ingestedScore.result.score, 1)?.queue ?? []) : [],
	);
	/** The singer's OWN queue, from their transcription. Empty until it runs. */
	const poemQueue = $derived(buildSlotQueue(lines));
	const slotQueue = $derived(poemQueue.length > 0 ? poemQueue : scoreTextQueue);
	/* N.55b: the pairing layer, wired. `refreshPairings` brings a re-divided
	   word's TEXT forward: the nucleus the singer paired is still the same
	   nucleus, so its text is stale rather than wrong.

	   N.112 TOOK THE DRIFT COUNT OUT OF THIS LINE. `reconcilePairings` returned
	   a `drift` list beside the map and `driftCount` fed the Underlay station's
	   "Text changed n". A seat can follow its word now (`reseat.ts`, run from
	   `transcribeText`), so there is no population left for that count to
	   describe.

	   PROJECTED, NOT WRITTEN BACK. The refreshed map is derived from the live
	   queue on every render, so nothing derived is stored (CONTRACT s6) and
	   `pairings` stays the singer's own record. The re-seat is the opposite and
	   deliberately so: it is a decision about the singer's score and is written
	   into `doc.pairings` once, at the moment the text changes. */
	const shownPairings = $derived(refreshPairings(doc.pairings, slotQueue));

	/* MOVED ABOVE `blankUnderlay` BY N.113, and nothing else changed. Rider 0's
	   gate asks whether the queue is exhausted, `blankUnderlay` asks rider 0,
	   and a `$derived` declared below its reader is a TDZ error even where the
	   closure would only run later. It reads `shownPairings` and `slotQueue`,
	   both of which stand above this line. */
	const placedSlotCount = $derived.by(() => {
		const placed = new Set<string>();
		for (const p of Object.values(shownPairings)) {
			if (p.kind === 'syllable') {
				placed.add(`${p.origin.lineIndex}-${p.origin.wordIndex}-${p.origin.slotIndex}`);
			}
		}
		return slotQueue.filter(
			(s) => placed.has(`${s.origin.lineIndex}-${s.origin.wordIndex}-${s.origin.slotIndex}`),
		).length;
	});

	/* ── N.111, THE CLITIC SEAT ──────────────────────────────────────────
	   A vowelless clitic the FILE seated alone on a sung pitch. Read off the
	   score's own underlay, not off the singer's transcription, because this
	   is the path a score that arrives WITH words takes and there may be no
	   transcription at all.

	   ILYA SEATS IT AUTOMATICALLY, AT INGEST. RULED BY DANN 2026-09-04 on his
	   walk of `7875892`, amending the increment 2 build, which proposed the
	   seat and waited for a press: "I swear to you: no vowelless word in
	   Russian can carry its own duration. You are complicating things for the
	   user with a situation that is impossible in music notation." A lone
	   vowelless clitic cannot exist on the page, so nothing asks whether it may
	   be repaired. The seat itself runs in `applyArrival`; this is what the
	   Corrections station reports afterwards.

	   IT OVERRIDES ONE INFERENCE, AND ONLY ONE. `applyArrival` runs the first
	   pass only where the file carried no lyrics, on the reasoning that
	   proposing over a score that already speaks would be Ilya claiming; that
	   comment names itself an INFERENCE rather than a ruling. Dann's ruling of
	   2026-09-03 overrides it for exactly this case, and his ruling of
	   2026-09-04 keeps the limit around it: where the file and the
	   transcription diverge for ANY other reason, Ilya withholds as today and
	   seats nothing.

	   DERIVED FROM THE INGESTED SCORE, so it costs one pipeline run per score
	   rather than one per render. `buildUnderlayResolvers` already makes the
	   same call on the same reconstruction. */
	const cliticFolds = $derived(
		ingestedScore ? findCliticFolds(ingestedScore.result.score, 1) : [],
	);
	/* WHICH FOLDS ARE ACTUALLY ON THE PAGE. It reported a sentence until
	   N.108-5 removed the sentence; what still reads it is `blankUnderlay`
	   below, which must blank a run only where the seat really landed. A fold
	   the singer has since undone by hand is not in this set, and its notes
	   go back to drawing the file's own cells. */
	const seatedCliticFolds = $derived(
		cliticFolds.filter((fold) => isCliticSeated(doc.pairings, fold)),
	);
	/* THE NOTES A SEATED RUN LEFT WITH NOTHING TO SAY. Ruled by Dann 2026-09-04
	   on the `ка ka` close he walked: inside a seated run an undecided note
	   draws nothing, and must not draw the file's stale cell. A note the singer
	   has since decided for themselves is not in this set, which is what makes
	   the hand able to seat the fixture's lost final я onto exactly this note. */
	const blankUnderlay = $derived.by(() => {
		const out = new Set<string>();
		for (const fold of seatedCliticFolds) {
			for (const id of fold.blanked) if (!doc.pairings[id]) out.add(id);
		}
		/* N.113. A NOTE THE SINGER MARKED AS A MELISMA DRAWS NOTHING, on both
		   lines, through this one channel rather than through a second rule in
		   the renderer. The sound is sustained, not re-articulated.

		   IT IS STILL A DECISION, not a blank: `melismaPreview` carries that
		   half to the renderer, which is what makes the syllable before it
		   reach across while a vacated note does not. */
		for (const id of melismaMarks) out.add(id);
		/* RIDER 0, RULED BY DANN 2026-09-07: a note the singer's own edit
		   vacates draws nothing. N.113a widened it from the tail to the whole
		   run, because his deletion ruling leaves the hole where the word was.
		   The rule and its DESK DEFAULT gate are `vacatedNotes`', where a test
		   can reach them. */
		for (const id of vacatedNotes(doc.pairings, eventIds, queueExhausted)) out.add(id);
		return out.size > 0 ? out : undefined;
	});

	/** The notes the singer marked as a melisma continuation. N.113. */
	const melismaMarks = $derived(melismaIds(doc.pairings));

	/** True when every slot of the poem is placed, so nothing is waiting. */
	const queueExhausted = $derived(
		slotQueue.length > 0 && placedSlotCount === slotQueue.length,
	);

	/* THE INGEST SEAT PUSHES NO UNDO ENTRY, and after N.108-5 it offers no
	   Undo of its own either. RULED BY DANN 2026-09-04 on his walk of
	   `c574cf8`: the sentence and its Undo leave Corrections and the loupe
	   dock, and Ilya seats and says nothing. `handleCliticUndo` and
	   `revertCliticSeat` went with them, because a seat no surface reports is
	   a seat no surface can take back, and nothing else called either one.
	   What a singer can still do is what N.111 increment 3 gave them: take any
	   note with the hand and seat their own text on it. */

	/* N.65 ship B's PLACED-SYLLABLE COUNT, back by Dann's ruling of 2026-08-27
	   and re-homed onto the LYRIC station's own label, where both containers
	   show it.

	   THE RULE IS THAT COMPONENT'S OWN, unchanged and moved twice now: a slot
	   counts as placed when SOME note carries a pairing that came from it,
	   keyed by ORIGIN rather than by text, so two identical syllables in one
	   line are still two slots. `shownPairings` rather than `doc.pairings`,
	   because the counter and the grey on a placed syllable have to agree and
	   they only agree if they read the same map. */

	// N.55b Shift Lyrics (§8). Notes, in document order, one slot per note
	// until one side runs out — the SAME order `firstPass` consumes them in,
	// below. `shiftToEndOfLyric` / `shiftToNextOpenNote` (pairings.ts:558,
	// :592) index into this, not into `slotQueue`: they operate on notes
	// already carrying a decision, not on the syllable queue.

	/* THE LYRIC VERBS ANCHOR ON THE TAKEN ENTRY, on both modalities, and the
	   station-cursor anchor that stood here is gone with slice 4.

	   IT WAS RIGHT WHEN IT WAS WRITTEN. Confirmed with Dann 2026-08-14, the two
	   scopes anchored on the note holding the syllable under the DRAWER's
	   station cursor, because the drawer was the only surface and the cursor sat
	   beside the verbs. Slice 3 moved the verbs onto a dock that carries no
	   cursor control and measured what that cost: the cells read disabled in the
	   ordinary flow. Dann ruled the taken entry for the phone and this slice
	   ends the disagreement, so `dockShiftAnchor` is now the only anchor and
	   both containers read it. The schematic said so in its own §4 all along:
	   `LYRIC · TAKE A NOTE TO SHIFT ITS SYLLABLE`. */

	/**
	 * N.67 step 3, design §2.6. THE ONLY DESTRUCTIVE REBUILD, and it is the
	 * singer's own act, never a side effect of an upload.
	 *
	 * It runs the first pass again from scratch, exactly as an upload into an
	 * empty map does, so "start over" means the same thing here as it meant the
	 * first time. Disabled when there is nothing to start over from.
	 *
	 * IT READS `slotQueue`, NOT `buildSlotQueue(lines)`, and N.111 increment 3
	 * is why that distinction now matters. The button's own guard is
	 * `slotQueue.length > 0`, so the queue fallback makes it appear on a
	 * lyric-bearing score where it did not before, and the transcription it
	 * used to rebuild from is empty there: pressing it would have emptied the
	 * map and put nothing back.
	 *
	 * THE CLITIC SEAT IS RE-APPLIED AFTER IT, because starting placement over
	 * is the singer resetting their own work, not a licence for a lone
	 * vowelless clitic to reappear on the page. Where the first pass already
	 * produced the seated arrangement this is a no-op.
	 */
	function handleStartPlacementOver(): void {
		if (!ingestedScore) return;
		/* N.112 walk finding 2, Dann 2026-09-07: after this button the last note
		   of the piece was bare, because the rebuild had run from the SCORE's
		   own words rather than from the poem.

		   THE CAUSE. `slotQueue` falls back to `scoreTextQueue` when
		   `buildSlotQueue(lines)` is empty, and `lines` is empty whenever the
		   transcription has not run over the current text: at boot before the
		   dictionary lands, and after any path that cleared it. The engraving
		   this alias uses lost its final `я` off the end (N.111, 2026-09-04),
		   so the score's queue is one slot shorter than the poem's and the last
		   note came back bare.

		   THE FIX IS DANN'S OWN RULING OF 2026-09-07 applied here: *"whenever
		   text is present, the transcription exists."* `flushText` is N.108-5's
		   join and it runs the pipeline in this same tick when the text has not
		   been read yet, so `poemQueue` below is the singer's own whenever it
		   can be.

		   IF THE POEM STILL HAS NO QUEUE, THIS DOES NOTHING. DESK DEFAULT: text
		   is present but the dictionary has not landed, and rebuilding from the
		   score's words would be the defect this fixes. Doing nothing leaves
		   every placement standing, which is the reversible answer; the singer
		   presses again once the drawer stops saying it is loading. */
		flushText();
		const source = rebuildSource(doc.inputText, poemQueue.length);
		if (source === 'none') return;
		const rebuildQueue = source === 'poem' ? poemQueue : scoreTextQueue;
		const parsed = ingestedScore.result.score;
		doc.pairings = seatCliticFolds(
			parsed,
			firstPass(
				parsed.vocalLine.filter((ev) => ev.type !== 'rest').map((ev) => ev.id),
				rebuildQueue,
			),
		);
		orphanedCount = 0;
		pairingCursor = Math.min(Object.keys(doc.pairings).length, Math.max(0, rebuildQueue.length - 1));
	}

	/**
	 * N.55b's placement: the armed syllable lands on one note.
	 *
	 * Lifted out of `handleNotePick` by Dann's ruling of 2026-08-26 so that two
	 * callers can share it without either one owning it. The rule itself is
	 * unchanged, including the advance that stops at the end rather than
	 * wrapping, because a wrap would silently start overwriting from the top.
	 */
	function placeArmedSyllable(eventId: string): void {
		const slot = slotQueue[pairingCursor];
		if (!slot) return;
		/* N.111-3b. A PLACEMENT IS A CORRECTION VERB LIKE THE OTHERS and pushes
		   like the others. RULED BY DANN 2026-09-07 on his walk of `d5a49ff`,
		   which found a second click on the same note seating the cursor's next
		   syllable over the first with no way back.

		   IT PUSHES AFTER THE EARLY RETURN, so a click with an empty queue
		   leaves an Undo pill that would undo nothing. */
		pushUndo({ kind: 'text', key: 'loupe.undo.placed' });
		doc.pairings = {
			...doc.pairings,
			[eventId]: {
				kind: 'syllable',
				cyrillic: slot.cyrillic,
				ipa: slot.ipa,
				vowel: slot.vowel,
				origin: slot.origin,
			},
		};
		pairingCursor = Math.min(pairingCursor + 1, slotQueue.length - 1);
	}

	/**
	 * A tap on the PAGE, through VoiceProfilePane's delegated listener.
	 *
	 * N.92. A click SELECTS, always. Selection is display, so setting it here
	 * disturbs nothing.
	 *
	 * IT NAVIGATES AND NOTHING MORE, on both modalities. Ruled for the phone by
	 * Dann 2026-08-26 and for the desk by his ruling of 2026-08-27, which ends
	 * the last difference between the two: the tap grammar gives a page click
	 * one meaning, which is choose the measure. Slice 2 measured what a second
	 * meaning cost: a tap meant to pick a measure silently spent a syllable and
	 * moved the anchor off the note the lyric verbs act from.
	 *
	 * PLACEMENT LIVES INSIDE THE LOUPE, where the entry under the pointer is
	 * legible at 2.18 times on a desk and 2.4 on a phone.
	 *
	 * REVERSIBLE IF REAL USE OBJECTS, recorded as such by the same ruling: the
	 * line that went is `if (isPhone) return`, and putting it back restores the
	 * desk's old behaviour exactly.
	 */
	function handleNotePick(eventId: string): void {
		setCursor({ kind: 'entry', id: eventId });
	}

	/** A tap on an entry INSIDE the loupe: it takes the entry and places. */
	function handleLoupePick(eventId: string): void {
		setCursor({ kind: 'entry', id: eventId });
		placeArmedSyllable(eventId);
	}

	/* ── N.92, the correction minimum ────────────────────────────────────
	   ALTER and DELETE of the read's existing notes. Insertion is N.92 proper.

	   THE CORRECTIONS ARE A DIFF, not an edited score, and `correction.ts`
	   carries the reasoning: a page read is re-ingested from its stored BYTES
	   on reload, so an in-place edit would be destroyed by the re-read. Keyed
	   by event id, exactly as `doc.pairings` already is, and applied after the
	   read on the way to the renderer. */
	let selectedEventId = $state<string | null>(null);

	/** The line as the reader read it, before any hand correction. */
	const readLine = $derived(ingestedScore?.result.score.vocalLine ?? []);

	/* THE LINE AS THE PAGE DRAWS IT, hand corrections applied and hand-entered
	   entries in their places. N.92 slice 3 moved every selection and every
	   walk onto this rather than onto `readLine`, and it had to: an entry the
	   singer entered exists nowhere in the read, so a selection resolved
	   against the read would find nothing the moment they made one. Applying a
	   correction to an already-corrected event is idempotent, so `currentPitch`
	   and `currentDuration` read the same answer off either line. */
	const correctedLine = $derived(applyCorrections(readLine, doc.corrections));

	const correctedCount = $derived(Object.keys(doc.corrections).length);

	/* N.97. Corrections whose event id the current read no longer carries.
	   DERIVED, never stored: whether a correction lands is a fact about this
	   read, not about the correction, and storing it would freeze an answer the
	   next re-read may change. Counted against the line as the READER produced
	   it, so a note the singer deleted by hand is not counted as lost. */
	const orphanCount = $derived(orphanIds(readLine, doc.corrections).length);

	const selectedEvent = $derived(
		selectedEventId ? correctedLine.find((ev) => ev.id === selectedEventId) : undefined,
	);

	/* ── THE INSERTION BAR'S PLACE (N.92 slice 3) ────────────────────────
	   Speedy's bar stands ON an entry or IN a gap between two of them, and
	   before this slice only the first of those existed. `selectedEventId` is
	   still the entry selection, because the drawer, the page's own mark, and
	   the keyboard all read it and none of them knows about gaps;
	   `gapAfter` is the second state and the two are mutually exclusive.

	   `undefined` MEANS NOT IN A GAP, and `null` means the gap before the
	   first entry. Three states need three values, and collapsing the head gap
	   into "no gap" would make the one place a part can be extended from
	   unreachable. */
	let gapAfter = $state<string | null | undefined>(undefined);

	const cursor = $derived<Cursor | null>(
		gapAfter !== undefined
			? { kind: 'gap', after: gapAfter }
			: selectedEventId
				? { kind: 'entry', id: selectedEventId }
				: null,
	);

	const inGap = $derived(gapAfter !== undefined);

	function setCursor(next: Cursor | null): void {
		if (!next) {
			selectedEventId = null;
			gapAfter = undefined;
			return;
		}
		if (next.kind === 'entry') {
			selectedEventId = next.id;
			gapAfter = undefined;
		} else {
			selectedEventId = null;
			gapAfter = next.after;
		}
	}

	/* THE ARMED DURATION, which is what a gap has instead of a selection.
	   Speedy arms a value and types it; the brief asks for a rest "of the lit
	   duration", so something has to be lit when no entry is taken. Tapping a
	   value both arms it and enters it, so the armed value is always the last
	   one the singer used and the row is never lit at nothing. */
	let armedBase = $state<NoteBase>('quarter');
	let armedDots = $state(0);

	/** The clef in force, for the middle-line arrival where a part is empty. */
	const scoreClef = $derived(
		ingestedScore?.result.score.clefs?.[0]?.clef ??
			ingestedScore?.result.score.measures[0]?.clef,
	);

	/** The pitch a note entered at the bar would arrive at. */
	const arrival = $derived(
		cursor ? arrivalPitch(correctedLine, cursor, scoreClef) : middleLine(scoreClef),
	);

	/** The entry the bar follows, which the gap sentence and PITCH label name. */
	const gapAnchor = $derived(cursor ? previousEntry(correctedLine, cursor) : null);

	/* WHAT THE HELD MEASURE HOLDS against what its signature asks for, or null
	   where they agree. Ruled by Dann 2026-08-26: entering into a full bar is
	   not blocked and not re-timed, and the page stays silent about it; the
	   measure tag carries the arithmetic instead, and only where there is a
	   disagreement to carry.

	   THE SIGNATURE IS THE MEASURE'S OWN, snapshotted per measure by the
	   parsers (`types.ts:228`), so a mid-score change of metre is answered
	   correctly rather than measured against the opening bar. */
	const heldFill = $derived.by(() => {
		if (heldMeasureIndex === null) return null;
		const m = ingestedScore?.result.score.measures.find((x) => x.index === heldMeasureIndex);
		return measureFill(correctedLine, heldMeasureIndex, m?.timeSignature);
	});

	const selectedLabel = $derived.by(() => {
		const ev = selectedEvent;
		if (!ev) return null;
		const p = currentPitch(ev, doc.corrections);
		return p ? pitchLabel(p) : null;
	});

	const selectedBase = $derived(
		selectedEvent ? currentDuration(selectedEvent, doc.corrections).base : null,
	);
	const selectedDots = $derived(
		selectedEvent ? currentDuration(selectedEvent, doc.corrections).dots : 0,
	);
	const selectedDotted = $derived(selectedDots > 0);

	/* ── THE NAMED UNDO (N.92 mobile slice 2) ────────────────────────────
	   IN MEMORY ONLY, AND THAT IS THE RULE RATHER THAN AN OMISSION. N.27
	   stands: corrections stay the one stored diff, and this ship adds NO SAVE
	   SITE. A reload therefore arrives with the corrections and with an empty
	   stack, which is the honest state: the singer's corrections survived and
	   the session's history did not.

	   A SNAPSHOT, NOT AN INVERSE. `withCorrection`, `clearCorrection`, and the
	   two shift functions all return NEW maps, so holding the previous
	   reference is a complete, cheap record of the state before the verb, and
	   there is no per-verb inverse to get wrong.

	   THE PILL'S SENTENCE IS COMPOSED AT RENDER, not at push, so a singer who
	   changes language mid-session reads the pill in the language they are
	   now in.

	   EVERY CORRECTION VERB PUSHES, wherever it was pressed. The dock and the
	   desktop drawer call the same handlers, so one stack cannot disagree with
	   another. Nothing renders the pill outside the dock, so the desk is
	   unchanged. */
	type UndoNote = { kind: 'text'; key: string } | { kind: 'change'; from: string; to: string };
	interface UndoEntry {
		note: UndoNote;
		corrections: CorrectionMap;
		pairings: PairingMap;
		/* THE WHOLE CURSOR, not half of it. N.92 slice 3 gave the bar a second
		   place to stand, and an undo that restored only `selected` set it to
		   null while leaving `gapAfter` alone, which is no cursor at all: the
		   effect that keeps the loupe standing then took it down. MEASURED on
		   the walk: undoing an entry made in a gap dismissed the loupe, because
		   every entry is pushed from a gap and every gap pushes a null
		   selection. */
		selected: string | null;
		/* THE QUEUE'S PLACE, N.111-3b. A placement is undoable now, and a
		   placement advances `pairingCursor`; without this the pairing would
		   come back and the queue would stay one syllable ahead, so the next
		   click would place the wrong word. Every other verb leaves the cursor
		   alone, so carrying it costs those entries nothing. */
		pairingCursor: number;
		gapAfter: string | null | undefined;
	}
	let undoStack = $state<UndoEntry[]>([]);
	/* THE OTHER HALF, N.111-3b. RULED BY DANN 2026-09-07: "we do not include an
	   Undo/Redo button on the Loupe. We need one."

	   ONE STACK EXTENDED, NOT A SECOND ONE ADDED. Redo is the same snapshot in
	   the other direction: undo restores the entry's state and hands the state
	   it replaced to this stack, redo does the mirror. Nothing here knows what
	   a verb DOES, which is the property that let one stack cover nine verbs
	   and now covers placement too.

	   A NEW ACTION DROPS THE FUTURE. `pushUndo` clears this, so the redo pill
	   can never offer to restore a state that branched away. */
	let redoStack = $state<UndoEntry[]>([]);

	/** The state as it stands right now, which is what both directions save. */
	function snapshot(note: UndoNote): UndoEntry {
		return {
			note,
			corrections: doc.corrections,
			pairings: doc.pairings,
			selected: selectedEventId,
			pairingCursor,
			gapAfter,
		};
	}

	function restore(entry: UndoEntry): void {
		doc.corrections = entry.corrections;
		doc.pairings = entry.pairings;
		selectedEventId = entry.selected;
		pairingCursor = entry.pairingCursor;
		gapAfter = entry.gapAfter;
	}

	function pushUndo(note: UndoNote): void {
		undoStack = [...undoStack, snapshot(note)];
		redoStack = [];
	}

	function handleUndo(): void {
		const top = undoStack[undoStack.length - 1];
		if (!top) return;
		redoStack = [...redoStack, snapshot(top.note)];
		restore(top);
		undoStack = undoStack.slice(0, -1);
	}

	function handleRedo(): void {
		const top = redoStack[redoStack.length - 1];
		if (!top) return;
		undoStack = [...undoStack, snapshot(top.note)];
		restore(top);
		redoStack = redoStack.slice(0, -1);
	}

	/** The five duration words the surface already ships, by base. */
	const DURATION_KEY: Partial<Record<NoteBase, string>> = {
		'16th': 'correct.len16th',
		eighth: 'correct.len8th',
		quarter: 'correct.lenQuarter',
		half: 'correct.lenHalf',
		whole: 'correct.lenWhole',
	};

	function durationWord(base: NoteBase): string {
		const key = DURATION_KEY[base];
		return key ? t(key, language) : base;
	}

	function correct(change: Parameters<typeof withCorrection>[2]): void {
		const id = selectedEventId;
		if (!id) return;
		doc.corrections = withCorrection(doc.corrections, id, change);
	}

	function handleStep(direction: 1 | -1): void {
		const ev = selectedEvent;
		const p = ev && currentPitch(ev, doc.corrections);
		if (!p) return;
		const next = stepPitch(p, direction);
		pushUndo({ kind: 'change', from: pitchLabel(p), to: pitchLabel(next) });
		correct({ pitch: next });
	}

	function handleOctave(direction: 1 | -1): void {
		const ev = selectedEvent;
		const p = ev && currentPitch(ev, doc.corrections);
		if (!p) return;
		const next = octavePitch(p, direction);
		pushUndo({ kind: 'change', from: pitchLabel(p), to: pitchLabel(next) });
		correct({ pitch: next });
	}

	/* N.92 slice 2. The context the spelling policy reads: the key in force in
	   this note's own measure, and the note before it in the line.

	   THE KEY COMES FROM THE MEASURE, not from the score's first key
	   signature, so a mid-score change of key spells the notes after it
	   correctly. `Measure.keySignature` is snapshotted per measure by the
	   parsers, which is what makes that a lookup rather than a scan.

	   The previous note is read by the policy ONLY where a score carries no key
	   at all. It is passed anyway, because working it out here costs one
	   lookup and leaves the policy with everything its own fallback needs. */
	function spellingContextFor(ev: VocalLineEvent): SpellingContext {
		const key = ingestedScore?.result.score.measures.find(
			(m) => m.index === ev.measureIndex,
		)?.keySignature;
		const previousId = neighbourId(readLine, doc.corrections, ev.id, -1);
		const previousEvent = previousId ? readLine.find((e) => e.id === previousId) : undefined;
		const previous = previousEvent ? currentPitch(previousEvent, doc.corrections) : undefined;
		return { ...(key ? { key } : {}), ...(previous ? { previous } : {}) };
	}

	function handleSemitone(direction: 1 | -1): void {
		const ev = selectedEvent;
		const p = ev && currentPitch(ev, doc.corrections);
		if (!p || !ev) return;
		const next = semitonePitch(p, direction, spellingContextFor(ev));
		pushUndo({ kind: 'change', from: pitchLabel(p), to: pitchLabel(next) });
		correct({ pitch: next });
	}

	/* The accidental verbs. Cumulative, capped at doubles, and the policy is
	   NOT consulted: a spelling the singer chose by hand is the answer, and
	   nothing re-spells it afterwards. */
	function handleAccidental(kind: 'flat' | 'natural' | 'sharp'): void {
		const ev = selectedEvent;
		const p = ev && currentPitch(ev, doc.corrections);
		if (!p) return;
		const next =
			kind === 'flat' ? flatPitch(p) : kind === 'sharp' ? sharpPitch(p) : naturalPitch(p);
		// A capped click returns the same pitch, so the map is left alone and no
		// correction is recorded for a decision that changed nothing. The stack
		// stays out of it for the same reason: a pill offering to reverse a
		// change that never happened would be a lie.
		if (next === p) return;
		pushUndo({ kind: 'change', from: pitchLabel(p), to: pitchLabel(next) });
		correct({ pitch: next });
	}

	function handleBase(base: (typeof DIGIT_BASE)[string]): void {
		const ev = selectedEvent;
		const from = ev ? currentDuration(ev, doc.corrections).base : null;
		if (from && from !== base) {
			pushUndo({ kind: 'change', from: durationWord(from), to: durationWord(base) });
		}
		correct({ base });
	}

	function handleDot(): void {
		const ev = selectedEvent;
		if (!ev) return;
		const on = currentDuration(ev, doc.corrections).dots > 0;
		pushUndo({ kind: 'text', key: on ? 'loupe.undo.dotOff' : 'loupe.undo.dotOn' });
		correct({ dots: on ? 0 : 1 });
	}

	/**
	 * The stepper, and the DRAWER's Previous and Next note.
	 *
	 * N.92 slice 3 moved it from `neighbourId` onto `stepCursor`, so it walks
	 * entry, gap, entry rather than note to note. Two things changed with it:
	 * a rest is now a place the bar can stand, because this slice converts one
	 * back to a note, and the gaps between entries are places, because this
	 * slice enters entries into them.
	 */
	function handleMove(direction: 1 | -1): void {
		const c = cursor;
		if (!c) return;
		const next = stepCursor(correctedLine, c, direction);
		if (next) setCursor(next);
	}

	function handleDeleteNote(): void {
		const id = selectedEventId;
		if (!id) return;
		// Move the selection off the note before removing it, so the singer is
		// left somewhere rather than nowhere. Forward first, then back, because
		// a run of false positives is usually deleted left to right.
		const next =
			neighbourId(readLine, doc.corrections, id, 1) ??
			neighbourId(readLine, doc.corrections, id, -1);
		pushUndo({ kind: 'text', key: 'loupe.undo.deleted' });
		doc.corrections = withCorrection(doc.corrections, id, { deleted: true });
		selectedEventId = next;
	}

	/* THE PER-NOTE RESTORE, back by Dann's ruling of 2026-08-27 and re-homed
	   into the shared surface, so both containers carry it. It clears every
	   correction on ONE note at once, which the named Undo pill cannot do: the
	   pill reverses the LAST verb, and this reverses all of them on one entry.

	   IT IS OFFERED ONLY WHERE THERE IS SOMETHING TO RESTORE TO. A hand-entered
	   entry's record IS the entry, so clearing it would delete the note rather
	   than restore it, and Delete is the verb for that and says so. The test is
	   therefore a correction on an entry the READ still carries. */
	const restoreAvailable = $derived(
		!inGap &&
			!!selectedEventId &&
			selectedEventId in doc.corrections &&
			!isEnteredId(selectedEventId),
	);

	function handleRestoreNote(): void {
		if (!selectedEventId || !restoreAvailable) return;
		pushUndo({ kind: 'text', key: 'loupe.undo.restored' });
		doc.corrections = clearCorrection(doc.corrections, selectedEventId);
	}

	/* ── THE ENTRY GRAMMAR (N.92 slice 3) ────────────────────────────────
	   Speedy under touch. Every one of these acts through `entry.ts`, which is
	   pure and tested, so what this file holds is the wiring and the undo
	   sentence and nothing else. */

	/**
	 * A duration cell. In a gap it ENTERS an entry; on one it re-times it.
	 *
	 * THE ARRIVAL PITCH IS THE RULING, Dann 2026-08-25: a fresh note takes the
	 * previous entry's pitch and the pitch verbs finish it, and where the part
	 * has no previous entry it arrives on the staff's middle line.
	 *
	 * THIS DEPARTS FROM THE SCHEMATIC'S §4 ON PURPOSE. That section reads
	 * Speedy strictly, where a duration typed in a gap with no pitch enters a
	 * REST. The brief of 2026-08-26 rules the other way for this surface: a
	 * duration enters a NOTE at the arrival pitch, and Rest is the cell that
	 * enters a rest. The brief is the later instruction and it is the one
	 * built; the divergence is named in the memo rather than buried.
	 */
	function handleDurationCell(base: NoteBase): void {
		armedBase = base;
		const c = cursor;
		if (!c || !inGap) {
			handleBase(base);
			return;
		}
		const { map, id } = enterEntry(doc.corrections, c, {
			base,
			dots: armedDots,
			pitch: arrival,
		});
		pushUndo({ kind: 'text', key: 'loupe.undo.entered' });
		doc.corrections = map;
		setCursor({ kind: 'entry', id });
	}

	/** The dot. On an entry it toggles one; in a gap it arms one. */
	/**
	 * The dot, CUMULATIVE, ruled by Dann 2026-08-27: dot, double dot, none, the
	 * accidental verbs' own grammar. It is an action rather than a state, which
	 * is why it carries no `aria-pressed` reading of "on"; what the entry shows
	 * is on the readout, spelled out.
	 *
	 * IN A GAP IT ARMS the same three states, so the value a fresh entry takes
	 * is the value the row is lit at.
	 */
	function handleDotCell(): void {
		if (inGap) {
			armedDots = (armedDots + 1) % 3;
			return;
		}
		const ev = selectedEvent;
		if (!ev) return;
		const now = currentDuration(ev, doc.corrections).dots;
		const next = (now + 1) % 3;
		pushUndo({
			kind: 'text',
			key: next === 1 ? 'loupe.undo.dotOn' : next === 2 ? 'loupe.undo.dotDouble' : 'loupe.undo.dotOff',
		});
		correct({ dots: next });
	}

	/**
	 * Rest. In a gap it enters one; on an entry it converts, both ways.
	 *
	 * ONE VERB, BOTH DIRECTIONS, because the singer's question is the same in
	 * both: is there a sound here. A rest converted back returns the note that
	 * was there rather than the arrival guess, which `entry.ts` remembers.
	 */
	function handleRest(): void {
		const c = cursor;
		if (!c) return;
		if (c.kind === 'gap') {
			const { map, id } = enterEntry(doc.corrections, c, { base: armedBase, dots: armedDots });
			pushUndo({ kind: 'text', key: 'loupe.undo.rest' });
			doc.corrections = map;
			setCursor({ kind: 'entry', id });
			return;
		}
		pushUndo({ kind: 'text', key: 'loupe.undo.rest' });
		doc.corrections = toggleRest(doc.corrections, correctedLine, c.id, arrival);
	}

	/** Tie, on a note whose neighbour can legally take one. */
	function handleTie(): void {
		const ev = selectedEvent;
		if (!ev || !tieAvailable) return;
		pushUndo({ kind: 'text', key: 'loupe.undo.tie' });
		doc.corrections = toggleTie(doc.corrections, ev);
	}

	/** Whether the taken entry may start a tie: Gould's conditions, in code. */
	const tieAvailable = $derived(
		!inGap && !!selectedEventId && canTie(correctedLine, doc.corrections, selectedEventId),
	);

	const selectedIsRest = $derived(
		selectedEvent ? currentType(selectedEvent, doc.corrections) === 'rest' : false,
	);
	const selectedTied = $derived(
		selectedEvent ? currentTie(selectedEvent, doc.corrections) : false,
	);

	/* ── PRESS AND HOLD REPEATS (N.92 slice 3) ───────────────────────────
	   From the ruled gesture table: holding a stepper arrow or a pitch verb
	   repeats it while held, and NOTHING ELSE takes a hold. The table reserves
	   press-and-hold on the page and on the loupe deliberately, because the
	   platform trains it for text selection and for context menus.

	   THE FIRST FIRE IS THE CLICK'S, not the hold's. The hold starts repeating
	   only after 400 ms, so an ordinary tap is a tap and never a tap plus a
	   repeat. 110 ms between repeats is about nine a second, which walks a
	   line at reading speed without outrunning the eye.

	   IT ENDS ON ANYTHING. `pointerup`, `pointercancel`, and `pointerleave`
	   all stop it, because a repeat that outlives the finger is the worst
	   failure this can have: it would run to the end of the part. */
	const HOLD_DELAY = 400;
	const HOLD_EVERY = 110;
	let holdTimer: ReturnType<typeof setTimeout> | null = null;
	let holdBeat: ReturnType<typeof setInterval> | null = null;

	function stopHold(): void {
		if (holdTimer !== null) clearTimeout(holdTimer);
		if (holdBeat !== null) clearInterval(holdBeat);
		holdTimer = null;
		holdBeat = null;
	}

	function onhold(fire: () => void) {
		return (e: PointerEvent) => {
			stopHold();
			const target = e.currentTarget as HTMLElement | null;
			if (!target || (target as HTMLButtonElement).disabled) return;
			const end = () => {
				stopHold();
				target.removeEventListener('pointerup', end);
				target.removeEventListener('pointercancel', end);
				target.removeEventListener('pointerleave', end);
			};
			target.addEventListener('pointerup', end);
			target.addEventListener('pointercancel', end);
			target.addEventListener('pointerleave', end);
			holdTimer = setTimeout(() => {
				holdBeat = setInterval(fire, HOLD_EVERY);
			}, HOLD_DELAY);
		};
	}

	/* ── THE NOLET ROW ───────────────────────────────────────────────────
	   The DURATION station swapped in place for one definition row, and the
	   definition applies LIVE with no confirm, which is ruling 5 holding here
	   as it does on every other verb.

	   ONE UNDO REVERSES THE WHOLE OPERATION, and that is what `tupletBase`
	   exists for. Every nudge of a triangle re-applies the definition from the
	   map as it stood BEFORE the row was first applied, so ten nudges leave one
	   change on the stack rather than ten, and the pill reverses the tuplet
	   rather than the last nudge of it. */
	let tupletOpen = $state(false);
	/** The last definition, kept as the session default (Finale's own rule). */
	let tupletDef = $state<TupletDefinition>({ ...DEFAULT_TUPLET });
	let tupletBase: CorrectionMap | null = null;

	const tupletFits = $derived(
		!inGap && !!selectedEventId && tupletRun(correctedLine, selectedEventId, tupletDef.actualNotes).length > 0,
	);

	function openTuplet(): void {
		tupletOpen = true;
		tupletBase = null;
	}

	function closeTuplet(): void {
		tupletOpen = false;
		tupletBase = null;
	}

	function applyTupletDefinition(next: TupletDefinition): void {
		tupletDef = next;
		const id = selectedEventId;
		if (!id) return;
		if (tupletRun(correctedLine, id, next.actualNotes).length === 0) return;
		if (tupletBase === null) {
			tupletBase = doc.corrections;
			pushUndo({ kind: 'text', key: 'loupe.undo.tuplet' });
		}
		doc.corrections = applyTuplet(tupletBase, correctedLine, id, next);
	}

	/* THE KEYBOARD, active wherever the insertion bar stands. Finale's own digit
	   mapping, kept because Dann knows it in his fingers.

	   IT WAS GATED ON A SELECTED NOTE and is gated on a CURSOR now, which is
	   slice 4 finishing what slice 3 started: the bar can stand in a gap, and a
	   keyboard that went dead there would be a second grammar to learn.

	   EVERY KEY GOES THROUGH THE SURFACE'S OWN HANDLER, not past it. The digits
	   call `handleDurationCell` and the dot calls `handleDotCell`, which is
	   what the DURATION cells call, so a digit in a gap enters an entry exactly
	   as a tap on the cell does and a digit on a note re-times it. One grammar,
	   two ways in.

	   THE VERBS THAT NEED A NOTE STAND DOWN IN A GAP, the same ones the surface
	   greys: pitch, and delete.

	   ESCAPE DISMISSES THE LOUPE, ruled by Dann 2026-08-27, rather than merely
	   dropping the selection: on a fine pointer it is the chevron's twin, and
	   the surfaces leave together as they do by every other route.

	   It stands down inside a text field. A singer typing a title or a poem
	   must not have `5` swallowed by the score, and `closest` covers the
	   contenteditable case as well as inputs. */
	function handleCorrectionKey(e: KeyboardEvent): void {
		/* THE FIELD GUARD COMES FIRST, ahead of every branch below it. It used
		   to sit under the cursor test, which was harmless while the only keys
		   this function claimed were bare ones. N.113a's Undo and Redo run with
		   no cursor, so the guard has to be the first thing that happens. */
		const el = e.target as HTMLElement | null;
		if (el?.closest('input, textarea, select, [contenteditable="true"]')) return;

		/* ── N.113a. UNDO AND REDO AS HOTKEYS ─────────────────────────────
		   RULED BY DANN 2026-09-07: *"on the desk, Cmd-Z (macOS) / Ctrl-Z
		   executes Undo as a hotkey."* Shift-Cmd-Z and Ctrl-Y for Redo are the
		   DESK DEFAULT that came with it, and so is the field rule: neither
		   fires while a text field has focus, so the poem keeps the browser's
		   own undo and a singer typing into the intake is never surprised.

		   THE SAME STACK THE PILLS USE. `handleUndo` and `handleRedo` are the
		   functions the loupe dock and the Corrections station already call,
		   so a hotkey and a press cannot diverge (N.111-3b: one stack extended,
		   never a second one added).

		   IT RUNS WITH NO LOUPE OPEN, which is why it sits above the `cursor`
		   test rather than inside the switch. The Undo pill in the drawer has
		   never needed a taken note and neither does this.

		   AN EMPTY STACK IS NOT CLAIMED. With nothing to undo the event is left
		   alone rather than swallowed, so anything else on the page that wants
		   Cmd-Z still gets it. */
		if ((e.metaKey || e.ctrlKey) && !e.altKey) {
			const k = e.key.toLowerCase();
			const redo = (k === 'z' && e.shiftKey) || (k === 'y' && !e.shiftKey);
			const undo = k === 'z' && !e.shiftKey;
			if (redo && redoStack.length > 0) {
				handleRedo();
				e.preventDefault();
				return;
			}
			if (undo && undoStack.length > 0) {
				handleUndo();
				e.preventDefault();
				return;
			}
		}

		if (!cursor) return;
		if (e.metaKey || e.ctrlKey || e.altKey) return;

		switch (e.key) {
			case 'ArrowUp':
				if (inGap) return;
				e.shiftKey ? handleOctave(1) : handleStep(1);
				break;
			case 'ArrowDown':
				if (inGap) return;
				e.shiftKey ? handleOctave(-1) : handleStep(-1);
				break;
			case '+':
			case '=':
				if (inGap) return;
				handleSemitone(1);
				break;
			case '-':
			case '_':
				if (inGap) return;
				handleSemitone(-1);
				break;
			case 'ArrowLeft':
				handleMove(-1);
				break;
			case 'ArrowRight':
				handleMove(1);
				break;
			case '.':
				handleDotCell();
				break;
			case 'Delete':
			case 'Backspace':
				if (inGap) return;
				handleDeleteNote();
				break;
			case 'Escape':
				dismissLoupe();
				break;
			default:
				if (DIGIT_BASE[e.key]) handleDurationCell(DIGIT_BASE[e.key]);
				else return;
		}
		// Reached only where a branch above acted, so a key this surface does
		// not claim still reaches the rest of the app.
		e.preventDefault();
	}

	/** The score the renderer sees: the read, with the hand corrections applied. */
	const correctedScore = $derived.by(() => {
		const ing = ingestedScore;
		if (!ing) return null;
		if (correctedCount === 0) return ing;
		return {
			...ing,
			result: {
				...ing.result,
				score: {
					...ing.result.score,
					// `correctedLine` above, not a second application: two calls could
					// disagree only by drifting, and one line is what the loupe, the
					// dock, and the page all have to be looking at.
					vocalLine: correctedLine,
				},
			},
		};
	});
	/* N.92 mobile slice 2. A PHONE IS A SMALLEST-SIDE TEST, not a width test,
	   and the two answer different questions. `isMobile` asks whether THIS
	   frame is narrower than the page, which is what decides the fit and which
	   rotation therefore flips. The loupe and the dock are ruled for a phone
	   in BOTH orientations, and 932 by 430 is over the width breakpoint while
	   still being the same hand holding the same glass. The smallest side is
	   under 768 in both, and on a desk it is not. */
	let isPhone = $state(false);
	/** Portrait docks at the bottom edge, landscape at the left. */
	let phonePortrait = $state(true);

	/* ── THE LOUPE AND THE DOCK (N.92 mobile slice 2) ────────────────────
	   Ruled by Dann 2026-08-25 and 2026-08-26. The page is the product and the
	   loupe is surgery on one of its components: a coarse tap on the page
	   chooses the measure, the loupe raises on it at 2.4 times, and the dock
	   carries the four stations. The page then drops one step of ink and stops
	   taking gestures until the loupe leaves.

	   THE STATE LIVES HERE, with the verbs. `Loupe.svelte` reads the rendered
	   page's own geometry and draws; `CorrectionDock.svelte` presents; neither
	   owns a correction. That is the split `SyllableStation` and
	   `ShiftLyricsControl` already keep. */
	let loupeOpen = $state(false);
	let dockHeight = $state(0);

	/** The score document on a phone, in either orientation, with a read to correct. */
	/* THE LOUPE IS ON BOTH MODALITIES NOW, slice 4. `isPhone` is gone from this
	   test, and that one deletion is the whole of item 1's availability: the
	   loupe was never a phone object, it was Finale Speedy's editing frame,
	   and Dann's ruling of 2026-08-25 said it persists on desktop. What stays
	   phone-only is the DOCK, which is the shell the surface sits in below
	   768 px; the desktop's surface is the drawer's own tenant. */
	const loupeAvailable = $derived(
		INCLUDE_SHANE &&
			destination === 'studio' &&
			studioDocument !== 'transcription' &&
			!!ingestedScore,
	);



	/* THE HELD MEASURE, and in a gap it is the anchor's. A gap is a place
	   between two entries, so it has no measure of its own; the measure the
	   loupe holds is the one the bar stands in, which is the measure of the
	   entry it follows, and the head gap belongs to the first measure. */
	const heldMeasureIndex = $derived(
		selectedEvent
			? selectedEvent.measureIndex
			: inGap
				? (gapAnchor?.measureIndex ?? correctedLine[0]?.measureIndex ?? null)
				: null,
	);

	/* The measure's own display number, which is what the tag prints. A pickup
	   measure is `'0'` or `''` by publisher convention (`types.ts:225`), so the
	   index is the fallback and never the first answer. */
	const heldMeasureLabel = $derived.by(() => {
		const i = heldMeasureIndex;
		if (i === null) return null;
		const m = ingestedScore?.result.score.measures.find((x) => x.index === i);
		return m && m.number.trim() ? m.number : String(i + 1);
	});

	const heldMeasureIds = $derived(
		heldMeasureIndex === null
			? []
			: correctedLine
					.filter((ev) => ev.type !== 'rest' && ev.measureIndex === heldMeasureIndex)
					.map((ev) => ev.id),
	);

	/** The next measure that carries an entry, which bounds the loupe's window. */
	const nextMeasureIds = $derived.by(() => {
		if (heldMeasureIndex === null) return [];
		const later = correctedLine.filter(
			(ev) => ev.type !== 'rest' && ev.measureIndex > heldMeasureIndex,
		);
		const first = later[0];
		if (!first) return [];
		return later.filter((ev) => ev.measureIndex === first.measureIndex).map((ev) => ev.id);
	});

	/* THE READOUT, `F3 · quarter · на`. Every part of it is a string the app
	   already ships, and a part that has no value is absent rather than
	   printed empty: an unpaired note simply has no syllable segment. */
	/** What the gap sentence calls the entry the bar follows: its syllable if
	    it carries one, else its pitch, which is what the singer can see. */
	const gapAnchorName = $derived.by(() => {
		const ev = gapAnchor;
		if (!ev) return null;
		const p = shownPairings[ev.id];
		if (p && p.kind === 'syllable') return p.cyrillic;
		const pitch = currentPitch(ev, doc.corrections);
		return pitch ? pitchLabel(pitch) : null;
	});

	const readoutLine = $derived.by(() => {
		/* IN A GAP THE READOUT NAMES THE PLACE, not a note: the schematic's own
		   sentence, because a bar standing between two entries has nothing to
		   name and the singer still has to know where the next duration lands. */
		if (inGap) {
			const name = gapAnchorName;
			return name === null
				? t('loupe.gapHead', language)
				: t('loupe.gap', language).replace('%s', name);
		}
		const parts: string[] = [];
		/* A REST LEADS WITH THE WORD AND SHOWS NO PITCH. The record still
		   remembers one, which is what lets a conversion back return the note
		   that was there, so the readout would otherwise print a pitch for a
		   thing that makes no sound. MEASURED on the walk: a rest read
		   `Eighth` alone, and a rest converted back and forth read `F4 · Eighth`
		   both ways round, so the one sentence that says what the entry IS said
		   nothing about the only change the singer had made. */
		if (selectedIsRest) parts.push(t('loupe.rest', language));
		else if (selectedLabel) parts.push(selectedLabel);
		if (selectedBase) parts.push(durationWord(selectedBase));
		/* The readout names the dot STATE, which is what makes the cumulative
		   cell honest: two dots and one dot are different durations and the
		   sentence has to be able to say which. */
		if (selectedDots === 1) parts.push(t('correct.dot', language));
		else if (selectedDots >= 2) parts.push(t('loupe.doubleDot', language));
		const p = selectedEventId ? shownPairings[selectedEventId] : undefined;
		if (p && p.kind === 'syllable') parts.push(p.cyrillic);
		return parts.join(' \u00b7 ');
	});

	/* ── THE LOUPE'S SECOND LINE (N.113b item 2) ─────────────────────────
	   RULED BY DANN 2026-09-08 on his walk of `00149c3`: the locator, which
	   reads `m. 7 · system 3 of 8`, gains a line naming the taken note, its
	   beat within the measure, and its duration. The shape is plate 4's
	   `note 5, F♯4, quarter` from the N.114 drawing, which he liked.

	   IT REUSES THE DOCK'S OWN PARTS rather than formatting a second time, and
	   that is the brief's instruction and the one-term rule together: the dock
	   under the loupe prints `B♭3 · Quarter · Dot` for the same note in the
	   same frame, and two spellings of one duration on one screen is the defect
	   this avoids. The beat clause between them is the only new copy.

	   DESK DEFAULT, and Dann's to wave off in a word: the brief's copy wrote
	   the duration as `dotted quarter`, which would be a second name for what
	   `readoutLine` calls `Quarter · Dot` four millimetres away.

	   THE SIGNATURE IS THE SELECTED NOTE'S OWN MEASURE'S, not the held one's,
	   so a metre change between them cannot be counted in the wrong beat. */
	const selectedSignature = $derived.by(() => {
		const ev = selectedEvent;
		if (!ev) return undefined;
		return ingestedScore?.result.score.measures.find((m) => m.index === ev.measureIndex)
			?.timeSignature;
	});

	const selectedBeat = $derived.by(() => {
		const ev = selectedEvent;
		if (!ev) return null;
		return beatOfEntry(correctedLine, ev.measureIndex, ev.id, selectedSignature);
	});

	const loupeNoteLine = $derived.by(() => {
		/* IN A GAP THE LINE SAYS NOTHING. `readoutLine` already names the place
		   in the dock's own sentence, and a bar standing between two entries has
		   no note to name, no beat of its own, and no duration. */
		if (inGap || !selectedEvent) return '';
		const parts: string[] = [];
		if (selectedIsRest) parts.push(t('loupe.rest', language));
		else if (selectedLabel) parts.push(selectedLabel);
		const b = selectedBeat;
		if (b) {
			parts.push(
				b.pulse === undefined
					? t('loupe.beat', language).replace('%b', String(b.beat))
					: t('loupe.beatPulse', language)
							.replace('%b', String(b.beat))
							.replace('%p', String(b.pulse)),
			);
		}
		if (selectedBase) parts.push(durationWord(selectedBase));
		if (selectedDots === 1) parts.push(t('correct.dot', language));
		else if (selectedDots >= 2) parts.push(t('loupe.doubleDot', language));
		return parts.join(' \u00b7 ');
	});

	/* THE DOCK'S LYRIC VERBS ANCHOR ON THE TAKEN ENTRY, ruled by Dann
	   2026-08-26. The schematic said so in its own §4, labelling the station
	   `LYRIC · TAKE A NOTE TO SHIFT ITS SYLLABLE`, and slice 2 measured what
	   the shipped anchor cost on a phone: the two scopes anchored on whichever
	   note held the syllable under the DRAWER's station cursor, and the dock
	   carries no cursor control, so the cells read disabled in the ordinary
	   flow.

	   THE DRAWER'S OWN VERBS ARE UNTOUCHED. `shiftAnchorEventId` and
	   `shiftDisabled` still drive `ShiftLyricsControl` from the station cursor,
	   because desktop is not in this slice and that anchor is the one Dann
	   confirmed on 2026-08-14. Two surfaces, two anchors, and each one says on
	   its face which note it acts from: the drawer through the station cursor
	   it sits beside, the dock through the entry in the loupe above it.

	   `eventIds` EXCLUDES RESTS, and so does every hit rectangle on the page,
	   so a taken entry always has an index here. */
	/* THE LINE THE SHIFT VERBS WALK, and slice 4 moved it onto the CORRECTED
	   line. It used to be the read's own, which was right while the only notes
	   were the reader's; slice 3 let the singer enter notes, and an entered
	   note is in no read. MEASURED on the desktop walk: with an entered entry
	   taken, all four lyric cells read disabled, because the anchor test asked
	   the read whether it had heard of a note the singer had just made.

	   A syllable can sit on an entered note like any other, so the sequence the
	   shift walks has to be the sequence the page draws. */
	const eventIds = $derived(correctedLine.filter((ev) => ev.type !== 'rest').map((ev) => ev.id));

	const dockShiftAnchor = $derived(
		selectedEventId && eventIds.includes(selectedEventId) ? selectedEventId : null,
	);
	const dockShiftDisabled = $derived(dockShiftAnchor === null);

	/**
	 * Press Melisma on the taken note. N.113.
	 *
	 * THE RULE IS `toggleMelisma`'s, in `pairings.ts` where a test can reach
	 * it: mark an undecided note, shift-then-mark a seated one, clear a marked
	 * one back to undecided. What is here is the press.
	 *
	 * ONE UNDO ENTRY PER PRESS, on the existing stack, with Redo as N.111-3b
	 * built it. No second stack: the stack is a SNAPSHOT stack, so a verb it
	 * has never heard of costs it nothing, which is the property that let one
	 * stack cover nine verbs and now covers eleven.
	 *
	 * THE ENTRY IS PUSHED BEFORE THE WRITE, so the snapshot is the state the
	 * press replaces, and it names the direction the press went rather than
	 * the control, because the pill reads what it will take back.
	 */
	function handleMelisma(): void {
		const id = selectedEventId;
		if (!id) return;
		const result = toggleMelisma(doc.pairings, eventIds, id);
		pushUndo({
			kind: 'text',
			key: result.set ? 'loupe.undo.melisma' : 'loupe.undo.melismaOff',
		});
		doc.pairings = result.map;
	}

	/** Whether the taken note already carries the mark, for the toggle's state. */
	const selectedMelisma = $derived(
		selectedEventId ? doc.pairings[selectedEventId]?.kind === 'melisma' : false,
	);

	/**
	 * Whether Melisma can act at all.
	 *
	 * IT NEEDS A TAKEN NOTE and nothing else. In a gap the bar stands between
	 * two entries and there is no note to sustain, which is the same test every
	 * other note verb on this surface makes.
	 */
	const melismaDisabled = $derived(selectedEventId === null || inGap);

	function handleDockShift(scope: 'end' | 'nextOpen', direction: ShiftDirection): void {
		const anchor = dockShiftAnchor;
		if (anchor === null) return;
		const fromIndex = eventIds.indexOf(anchor);
		if (fromIndex === -1) return;
		const result =
			scope === 'end'
				? shiftToEndOfLyric(doc.pairings, eventIds, fromIndex, direction)
				: shiftToNextOpenNote(doc.pairings, eventIds, fromIndex, direction);
		pushUndo({ kind: 'text', key: 'loupe.undo.lyrics' });
		doc.pairings = result.map;
	}

	/* THE PILL'S SENTENCE IS COMPOSED AT RENDER, and both pills name the SAME
	   action: the thing undo would take back, and the thing redo would put
	   back. One reader, two stacks. */
	function stackLabel(stack: UndoEntry[]): string | null {
		const top = stack[stack.length - 1];
		if (!top) return null;
		return top.note.kind === 'text'
			? t(top.note.key, language)
			: `${top.note.from} \u2192 ${top.note.to}`;
	}

	const undoLabel = $derived(stackLabel(undoStack));
	const redoLabel = $derived(stackLabel(redoStack));

	/* THE PAGE'S FIRST STATE: every measure takes a tap, and a tap resolves to
	   the nearest entry rather than needing to land on a 7 px notehead. That
	   is what makes item 9's exemption for the page's own glyphs safe: coarse
	   tap picks the measure, and fine work happens inside the loupe.

	   IT DOES NOT DISTURB PLACEMENT. `handleNotePick`, VoiceProfilePane's own
	   delegated listener, still runs on a tap that lands on a hit rectangle
	   and still places the pending syllable. This adds the loupe and the
	   nearest-entry fallback, and takes nothing away. */
	function handlePageTap(e: MouseEvent): void {
		if (!loupeAvailable) return;
		/* A CLICK OUTSIDE THE LOUPE RETIRES IT, on a fine pointer only. Ruled by
		   Dann 2026-08-27 and ruled at the same time as an ACCEPTED DISPARITY
		   with the phone, where a stray tap stays dead.

		   THE DISPARITY IS THE POINT, not an oversight in it. The ruled tap
		   grammar says a tap outside the loupe deliberately does nothing,
		   because on glass a stray tap is the easiest gesture to make by
		   accident and no Undo restores a lost place. A mouse does not stray:
		   a click is aimed, it costs a deliberate movement, and on a desk the
		   page is large enough that clicking it is the natural way to say "not
		   that measure, this one". */
		if (loupeOpen) {
			if (isPhone) return;
			if ((e.target as Element | null)?.closest?.('.loupe, .surface')) return;
			/* THE PLACING CLICK'S OWN TARGET IS GONE BY THE TIME IT GETS HERE,
			   and that is why the loupe closed on every placement Dann walked on
			   `d5a49ff`. RULED BY DANN 2026-09-07: "I expected to see the change
			   reflected in the Loupe first." The loupe stays.

			   THE CAUSE, and it is N.111-3a's redraw fix casting a shadow. A
			   click inside the loupe places the syllable, `doc.pairings` changes,
			   the pane redraws, `pageRevision` bumps, and the loupe rebuilds its
			   own `{@html frame.inner}`. The clicked element is detached from
			   the loupe in that flush, and a detached subtree keeps only the
			   ancestors it was removed WITH: the `{@html}` content's chain now
			   stops short of `.loupe`, so the target test above answers null.
			   The geometry test then finds a sheet under the pointer, because on
			   a desk the loupe stands over the page, and dismisses. A click that
			   places nothing (no armed syllable) mutates nothing, rebuilds
			   nothing, and never closed, which is why this reads as a rule about
			   placement rather than about clicks.

			   THE FLAG IS READ AT `pointerdown`, when the DOM is still whole, and
			   it is the same flag the branch below already trusts for the same
			   reason. It is cleared on the frame AFTER `pointerup`, so it is
			   still standing when the click arrives. */
			if (gestureBeganOnSurface) return;
			/* A POINT-IN-BOX TEST, and `elementFromPoint` cannot serve here for a
			   reason that is the ruling working: while the loupe is up the page
			   is DEAF, `pointer-events: none`, so the topmost element at a page
			   coordinate is never a sheet. Measured: the outside click did
			   nothing at all until this became a geometry question instead of a
			   hit-testing one. The target test above has already excluded the
			   loupe and the surface, so a point inside a sheet's box is a click
			   on the page and nothing else. */
			const onSheet = [...document.querySelectorAll('.score-page')].some((el) => {
				const r = el.getBoundingClientRect();
				return (
					e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
				);
			});
			if (onSheet) dismissLoupe();
			return;
		}
		/* A TAP THAT BEGAN ON THE LOUPE OR THE DOCK IS NEVER A TAP ON THE PAGE,
		   and this is the fix for the dead dismissal Dann walked on the deploy.

		   THE CAUSE, exactly. The chevron's own `onclick` runs first, at the
		   target, and sets `loupeOpen` false. Svelte flushes and takes the dock
		   out of the DOM. The SAME click event then finishes bubbling to the
		   window and reaches this handler, where `loupeOpen` is now false so the
		   guard above lets it through, and `elementFromPoint` is a LIVE query:
		   the dock that stood at those coordinates is gone, so it answers with
		   the page underneath and the loupe rises again on whatever measure sits
		   there. Reproduced: a chevron press at 396, 538 in portrait re-tagged
		   the loupe from `m. 9 · system 3 of 6` to `m. 16 · system 5 of 6`,
		   which is Dann's own reading of it. In landscape the same press
		   dismissed correctly, because no sheet sits under the chevron there,
		   and that is why the first walk missed it.

		   TWO TESTS, BECAUSE THERE ARE TWO CASES. The click's own target still
		   answers `closest` after Svelte removes it, because a detached subtree
		   keeps its own ancestors, and that covers the chevron. A click
		   synthesized at the end of a swipe can carry a target that is already
		   the page, so the gesture that produced it is remembered on
		   `pointerdown` and consulted here. */
		if ((e.target as Element | null)?.closest?.('.loupe, .dock, .surface')) return;
		if (gestureBeganOnSurface) return;
		/* THE SHEET IS FOUND AT THE POINT, NOT FROM `e.target`, and both halves
		   of that are measured requirements rather than preferences.

		   NOT `e.target`, because a tap that lands on a hit rectangle reaches
		   VoiceProfilePane's delegated listener first, and on a desk that
		   listener places the pending syllable and re-renders the page through
		   `{@html}`. By the time the event reaches the window, the rectangle it
		   started on has been replaced and `closest` finds nothing, so the
		   loupe never rose on a score that had lyrics waiting.

		   `elementFromPoint` RATHER THAN A POINT-IN-BOX TEST over the sheets,
		   which is what this was first. A box test asks only whether the sheet
		   is under the finger and never whether anything is on top of it, and
		   the drawer on a phone covers the whole screen while the sheet keeps
		   its box behind it. Measured: every tap on an open drawer raised the
		   loupe. This asks the document what is actually topmost, and it
		   re-queries live, so it cannot be detached out from under itself
		   either. */
		const sheet = document.elementFromPoint(e.clientX, e.clientY)?.closest('.score-page');
		if (!sheet) return;
		/* THE BAND IS THE POINTER'S, and it is read once per tap rather than
		   stored, so a trackpad plugged into a tablet is answered as it is
		   used rather than as the page was first opened. */
		const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
		const spaces = coarse ? COARSE_TAP_SPACES : FINE_TAP_SPACES;
		const targets = [...sheet.querySelectorAll('[data-hit]')].map((el) => {
			const r = el.getBoundingClientRect();
			return {
				id: el.getAttribute('data-hit') ?? '',
				cx: r.left + r.width / 2,
				cy: r.top + r.height / 2,
				...tapBand(r.top, r.height, spaces),
			};
		});
		/* A TAP OUTSIDE EVERY BAND DOES NOTHING AT ALL: no loupe, no cursor
		   moved, no dismissal of what is already up. It is the same silence a
		   stray tap beside the loupe already keeps, and for the same reason —
		   no Undo restores a lost place. */
		const id = nearestTarget(targets, e.clientX, e.clientY);
		if (!id) return;
		setCursor({ kind: 'entry', id });
		loupeOpen = true;
	}

	function dismissLoupe(): void {
		loupeOpen = false;
		setCursor(null);
		closeTuplet();
		stopHold();
	}

	/* SWIPE DOWN, from anywhere on either, sends both away together. Bound at
	   the window and filtered by where the gesture STARTED, so one
	   implementation serves the loupe and the dock and the two cannot drift.
	   A stray tap outside the loupe deliberately does nothing: it is the
	   easiest gesture to make by accident, and no Undo restores a lost place. */
	let swipeFrom: { x: number; y: number } | null = null;
	/** Whether the gesture now in flight started on the loupe or the dock. */
	let gestureBeganOnSurface = $state(false);

	function handleSurfacePointerDown(e: PointerEvent): void {
		const el = (e.target as Element | null)?.closest?.('.loupe, .dock');
		gestureBeganOnSurface = !!el;
		swipeFrom = el ? { x: e.clientX, y: e.clientY } : null;
	}

	function handleSurfacePointerUp(e: PointerEvent): void {
		const from = swipeFrom;
		swipeFrom = null;
		/* THE SWIPE IS THE PHONE'S GESTURE AND STAYS THERE. Dann's brief for
		   slice 4: no swipe exists on desktop, do not invent one. Without this
		   gate a mouse dragged down the loupe would dismiss it, which is a
		   gesture nobody on a desk would try on purpose and everybody would
		   trigger by accident while selecting. The chevron and Escape are the
		   desk's two ways out. */
		if (isPhone && from && loupeOpen && isDismissSwipe(e.clientX - from.x, e.clientY - from.y)) {
			dismissLoupe();
		}
		/* Cleared on the NEXT frame, not here. The click that a tap synthesizes
		   arrives after `pointerup`, and the flag has to still be standing when
		   it does. */
		requestAnimationFrame(() => (gestureBeganOnSurface = false));
	}

	/* A gesture the browser takes away from us, most often to scroll something.
	   It ends the swipe without a `pointerup`, so without this the flag would
	   stand until the next gesture and swallow one page tap. */
	function handleSurfacePointerCancel(): void {
		swipeFrom = null;
		gestureBeganOnSurface = false;
	}

	/* The loupe cannot stand without something to hold. Leaving the phone, the
	   score document, or the selection closes it, so it never survives into a
	   state where it would be drawing a measure nobody is working on. */
	$effect(() => {
		if (!loupeAvailable || !cursor) loupeOpen = false;
	});

	/* ONE SURFACE AT A TIME. Ruled by Dann 2026-08-26 on the deploy walk:
	   opening the drawer sends the loupe and the dock away, in the same one
	   motion they leave by any other route.

	   THE DRAWER AND THE DOCK ARE SIBLINGS, and the schematic's own answer to
	   where the surface lives says only one of the two is open at a time. On a
	   phone the drawer covers the whole screen, so without this the singer met
	   three surfaces stacked on one another with the page under all of them.

	   IT COSTS THE SELECTION, and that is the ruling rather than an oversight:
	   this is the same leave the chevron performs, so the drawer's own
	   correction station arrives idle.

	   IT IS A PHONE RULE, and slice 4 says so out loud. On a phone the drawer
	   covers the whole screen and three surfaces would stack; on a desk it is a
	   side panel the loupe stands clear of by geometry, and both are meant to
	   be up at once. MEASURED: without this gate the desktop loupe was
	   dismissed the instant it rose, because a desk arrives with its drawer
	   open. */
	$effect(() => {
		if (isPhone && drawerRaised && loupeOpen) dismissLoupe();
	});

	// Fit engraving geometry: the fixed stave target (Kimi Q2, 2026-07-15).
	// No user control; the Appendix-derived defaults are the product, and the
	// renderer reads them as a constant. Kept as state for VoiceProfilePane.
	let engraving = $state<EngravingValues>({ ...ENGRAVING_DEFAULTS });
	// Q3 wizard collapse (Kimi §A.28): successful-render counter and the
	// wizard's collapse state, both held here so they survive the shane
	// panel's unmount on tab switches. The pane reports a render once per
	// mount; renderCountedFor dedupes by score identity across remounts,
	// so returning to the Fit tab never re-collapses an expanded wizard.
	let scoreRenders = $state(0);
	let wizardCollapsed = $state(false);
	let renderCountedFor: IngestedScore | null = null;
	function handleScoreRendered() {
		if (!ingestedScore || renderCountedFor === ingestedScore) return;
		renderCountedFor = ingestedScore;
		scoreRenders += 1;
	}

	/* THE LOUPE'S INVALIDATION TOKEN, and the walk finding on `c574cf8` is what
	   it is for.

	   THE LOUPE CLONES THE PAGE'S OWN SVG (`Loupe.svelte`'s own doc: "a view
	   transform, not a second renderer"), and re-clones when this changes. It
	   used to be handed `correctedScore`, which is derived from the ingested
	   score and the note corrections and NEVER READS `doc.pairings`. So seating
	   a syllable from inside the loupe rebuilt the page behind it and left the
	   loupe drawing the cell that had just moved, until it was dismissed and
	   raised again. RULED BY DANN 2026-09-04: a change made from the dock must
	   be reflected in the loupe at once.

	   THE FIX IS AT THE SEAM, not a forced reopen: the pane reports every
	   rebuild of its own SVG through `onpagesdrawn`, and this counts them. A
	   token that says "the page was redrawn" cannot go stale for a fourth
	   reason, which a list of the values that redraw it can and did. */
	let pageRevision = $state(0);
	/* A FUNCTION DECLARATION, NOT AN INLINE ARROW. An arrow here is a new
	   identity on every render of this file, and the pane reads this prop inside
	   the effect that reports the rebuild, so a fresh identity would re-run that
	   effect, bump this counter, and re-render: an unbounded loop, which is what
	   `effect_update_depth_exceeded` was on the first build of this fix. The
	   pane also calls it untracked; both ends are closed on purpose. */
	function handlePagesDrawn(): void {
		pageRevision += 1;
	}
	let updateDismissed = $state(false);
	// Active heading for TOC sync
	let activeHeadingId = $state<string | null>(null);
	// Tab transition animation
	// Fit (engine codename 'shane') sits adjacent to Transcription; the
	// slide-direction order matches the visible tab order (Dann, 2026-07-12).
	const TAB_ORDER: TabId[] = ['transcription', 'shane', 'learn', 'guide'];
	let tabTransitionClass = $state('');
	// Mobile awareness. A WIDTH test, which on a phone is also the portrait
	// test: 390 by 844 is under the breakpoint and 844 by 390 is over it, so
	// rotation switches the mode exactly as Dann's rotation ruling says.
	let isMobile = $state(false);
	let mainContentEl: HTMLElement | undefined = $state(undefined);

	/* ── Portrait C: the page and the aid (ruled by Dann 2026-08-18) ──
	   The arrival view is the page. `Read` swaps in the aid, `The page`
	   swaps it back. Both stay mounted: the page has to survive the swap or
	   printing from the aid would emit nothing, and remounting it would
	   re-measure the title header from zero and re-paginate the document
	   under the singer. */
	let portraitView = $state<'page' | 'aid'>('page');
	/* One scroll position each, so neither view loses the singer's place. */
	let pageScrollTop = 0;
	let aidScrollTop = 0;

	async function showPortraitView(next: 'page' | 'aid') {
		if (next === portraitView) return;
		if (mainContentEl) {
			if (portraitView === 'page') pageScrollTop = mainContentEl.scrollTop;
			else aidScrollTop = mainContentEl.scrollTop;
		}
		portraitView = next;
		await tick();
		if (mainContentEl) {
			mainContentEl.scrollTop = next === 'page' ? pageScrollTop : aidScrollTop;
		}
	}

	/* Leaving portrait, or leaving Transcription, returns to the page. The aid
	   is a portrait reading of the transcription and has no meaning anywhere
	   else, and a singer who rotates back should meet the artefact. */
	$effect(() => {
		if (!isMobile || destination !== 'studio' || studioDocument !== 'transcription')
			portraitView = 'page';
	});
	// Song metadata: `doc.metadata`, N.67 step 0.
	// Notation preferences -- persisted to localStorage
	let notationPrefs = $state<NotationPreferences>({
		reducedVowel: false,
		shcha: false,
		palatalNasal: false,
		geminate: false,
		reconstitution: false,
	});
	// Display preferences
	let showStressDiacritics = $state(false);
	// The open-syllabification choice is `doc.openSyllabification`, N.67 step
	// 0. Its localStorage key is unchanged, and stays the default for new
	// songs when step 4 makes songs plural (design §2.2).
	// Spot reconstitution: ephemeral per-word overrides, keyed by "lineIndex-wordIndex"
	// Cleared on every transcribe or clear action
	let spotReconstitution = $state<Map<string, boolean>>(new Map());
	// User stress overrides: keyed by "lineIndex-wordIndex"
	// Cleared on every fresh transcription
	let userStressOverrides = $state<Map<string, UserStressOverride>>(new Map());
	// Character-level ё toggles: keyed by "lineIndex-wordIndex-charIndex"
	// Cleared on every fresh transcription
	let yoToggles = $state<Map<string, YoToggle>>(new Map());
	// Per-word syllable boundary overrides: keyed by "lineIndex-wordIndex"
	// Cleared when the global open syllabification toggle changes in either direction,
	// and on every fresh transcription or clear action.
	let syllableOverrides = $state<Map<string, SyllableOverride>>(new Map());
	// Per-word gloss overrides are `doc.glossOverrides`, keyed by
	// "lineIndex-wordIndex", cleared on every fresh transcription or clear
	// action, and by per-word reset.
	//
	// N.57: `doc.glossAnchors` holds the Cyrillic word each gloss was written
	// for, same keys. A gloss survives a re-transcription only where that word
	// is still at that position; otherwise it falls away rather than
	// re-attaching to whatever moved into the slot.
	// Breath animation state
	// paperBreathClass: animates Paper content only (transcription trigger)
	// viewBreathClass: animates entire app content (language toggle)
	let paperBreathClass = $state('');
	let viewBreathClass = $state('');
	function triggerPaperBreathIn() {
		paperBreathClass = 'breath-in';
		setTimeout(() => { paperBreathClass = ''; }, 300);
	}
	function triggerViewBreathCycle(callback: () => void) {
		viewBreathClass = 'breath-out';
		setTimeout(() => {
			callback();
			viewBreathClass = 'breath-in';
			setTimeout(() => { viewBreathClass = ''; }, 300);
		}, 150);
	}
	// ── Dynamic drawer width: pure calculation from ribbon content ──
	// Atoms are fixed 32px. Gaps, borders, and padding are constants.
	// Width is computed before render (no DOM measurement, no flicker).
	function calculateDrawerWidth(word: WordStackData): number {
		const ATOM_W = 32;
		const ATOM_GAP = 2;
		const MOL_PAD_BORDER = 9; // 3px padding × 2 + 1.5px border × 2
		const SYLLABLE_GAP = 12;
		const CLITIC_COL_W = ATOM_W + MOL_PAD_BORDER; // 41px
		const OVERHEAD = 70; // 32px panel padding + 24px lip + borders/scrollbar
		// Count atoms per syllable from displayLog
		const syllableAtomCounts = new Map<number, number>();
		for (const entry of word.displayLog) {
			const si = entry.syllableIndex ?? 0;
			syllableAtomCounts.set(si, (syllableAtomCounts.get(si) ?? 0) + 1);
		}
		let ribbonWidth = 0;
		const syllableCount = syllableAtomCounts.size;
		// Sum molecule widths
		for (const [, atomCount] of syllableAtomCounts) {
			ribbonWidth += atomCount * ATOM_W + (atomCount - 1) * ATOM_GAP + MOL_PAD_BORDER;
		}
		// Gaps between syllable columns
		if (syllableCount > 1) {
			ribbonWidth += (syllableCount - 1) * SYLLABLE_GAP;
		}
		// Clitic arrow columns (standalone, outside molecules)
		if (word.isProclitic) ribbonWidth += CLITIC_COL_W + SYLLABLE_GAP;
		if (word.isEnclitic) ribbonWidth += CLITIC_COL_W + SYLLABLE_GAP;
		return Math.max(520, Math.min(720, ribbonWidth + OVERHEAD));
	}
	// Derived
	const showInspector = $derived(selectedWord !== null);
	// Reading mode means the long-form reading tabs. Shane is a
	// paper-on-desk gallery like Transcription (Dann's consistency ruling,
	// 2026-07-12): its page sits exactly where the transcription page
	// sits, sharing the full 2rem desk padding rather than reading mode's
	// trimmed 1rem.
	const isReadingMode = $derived(destination !== 'studio');
	/* N.73 S3 ship two. THE WIDTH FOLLOWS THE CONSOLE, AND THE CONSOLE IS
	   STUDIO'S, NOT THE TRANSCRIPTION'S. This read `activeTab === 'transcription'`,
	   which was true while the two Studio documents had two drawers. S2 gave
	   them one: `RootPanel` and its Word Console render on BOTH documents, so a
	   word selected on the transcription is still shown on the marked score,
	   and the old expression narrowed the drawer back to 520 with the widened
	   word still in it. That contradicted S2's own invariant, "nothing in the
	   drawer appears, disappears, or moves when the singer flips the pair."
	   The guard on `destination` is still needed: Learn and Guide draw no
	   console, and a word selected before the singer left Studio must not
	   widen a reading drawer. MEASURED both ways; the numbers are in the
	   ship-two memo. */
	const drawerWidth = $derived(
		destination === 'studio' && selectedWord ? calculateDrawerWidth(selectedWord) : 520
	);
	/* WHAT THE LOUPE MUST STAND CLEAR OF, on each modality.

	   On a phone, the dock: the bottom edge in portrait, the left edge in
	   landscape. On a desk, the OPEN DRAWER, which the brief names: the loupe
	   never overlaps it. A collapsed drawer takes nothing and the loupe has the
	   whole desk. Declared here rather than beside the loupe's other state
	   because `drawerWidth` is, and a derivation cannot read a const above it. */
	/* N.108 increment 1a. `drawerCollapsed ? 0 : drawerWidth` became
	   `isMobile ? 0 : drawerWidth`, and the change is the ruling: the desk's
	   drawer is always present, so there is no collapsed case left to give the
	   loupe the whole desk. In the PHONE'S LAYOUT the drawer is an overlay
	   that covers everything, so the loupe stands clear of nothing; the
	   `isPhone` branch above it is untouched and still carries the dock's
	   ruled 380 in landscape. */
	const loupeInset = $derived(
		isPhone ? (phonePortrait ? 0 : 380) : isMobile ? 0 : drawerWidth,
	);
	const loupeFoot = $derived(isPhone && phonePortrait ? dockHeight : 0);

	const canTranscribe = $derived(
		doc.inputText.trim().length > 0 && !loaderState.isLoading && loaderState.entryCount > 0
	);
	const hasResults = $derived(lines.length > 0);
	/**
	 * N.73 S2. ONE Print button, in the Transcription drawer's button row,
	 * guarded by whichever document is on the desk. Both expressions are the
	 * ones the two buttons carried before the drawers merged, verbatim:
	 * the transcription is printable once it has been transcribed, and the
	 * marked score once a score is ingested or a formant exists. Nothing new
	 * is invented, and neither behaviour is lost.
	 */
	/**
	 * N.73 S3 ship one. Whether the active voice holds any reading at all.
	 * ONE predicate, `hasAnyReadings` in `profileStore.ts`, lifted out of
	 * `CalibrationWizard` so the wizard's opening phase, the voice anchor's
	 * sentence, and this Print guard cannot give three answers. The guard's
	 * expression is unchanged in meaning: it read
	 * `Object.keys(shaneFormants).length === 0` inline, which is the same test
	 * written a second time.
	 */
	/* `printDisabled` IS GONE, N.65, Dann's ruling of 2026-08-21. It read
	   `studioDocument === 'shane' ? !ingestedScore && !voiceCalibrated
	   : !hasResults`, and it guarded a Print button inside the drawer. Print
	   sits under the sheet now and IT IS ALWAYS LIVE ON TRANSCRIPTION AND
	   MARKED SCORE: no disabled state, no greying. `voiceCalibrated` stays,
	   because the voice anchor reads it. */
	const voiceCalibrated = $derived(hasAnyReadings(shaneFormants));
	/**
	 * Entering the takeover expands the wizard first. The Q3 collapse (Kimi
	 * §A.28) exists so a rendered score can take the drawer back from a wizard
	 * that was SHARING it; a wizard that has the whole drawer is not sharing
	 * anything, and a takeover that opened onto a one-line compact header would
	 * be a ritual with its own ritual hidden. This is a decision about the
	 * MOUNT POINT, not about the wizard, which is untouched.
	 */
	function enterCalibration() {
		wizardCollapsed = false;
		calibrating = true;
	}
	function exitCalibration() {
		calibrating = false;
	}
	const wordCount = $derived(
		lines.reduce((sum, l) => sum + l.words.length, 0)
	);
	// Apply open syllabification as a display-time transform (no pipeline re-run).
	// Per-word syllable overrides take precedence when present.
	const effectiveLines = $derived.by(() => {
		if (doc.openSyllabification || syllableOverrides.size > 0) {
			return applyOpenSyllabificationToLines(lines, syllableOverrides, doc.openSyllabification);
		}
		return lines;
	});
	function runPipeline() {
		transcribeError = '';
		try {
			const start = performance.now();
			const result = processText(doc.inputText, {
				language,
				userStressOverrides: userStressOverrides.size > 0 ? userStressOverrides : undefined,
				yoToggles: yoToggles.size > 0 ? yoToggles : undefined,
			});
			transcribeMs = Math.round(performance.now() - start);
			lines = result;
			// Update selected word to reflect new pipeline results
			if (selectedWord) {
				const newWord = result[selectedWord.lineIndex]?.words?.[selectedWord.wordIndex];
				if (newWord) selectedWord = newWord;
			}
		} catch (e: unknown) {
			transcribeError = e instanceof Error ? e.message : String(e);
			console.error('[Ilya] Transcription error:', e);
		}
	}
	/**
	 * What a fresh transcription clears, which is nothing keyed to a word.
	 *
	 * N.112 SPLIT THIS OUT OF `resetSessionState`. Before it, a transcription
	 * and a Clear dropped the same list, because a transcription could not
	 * carry a word-keyed mark across an edit and a Clear does not want to. Now
	 * they differ: the marks FOLLOW the word (`carryOverridesAcross`), and only
	 * these three go, because none of them names a word. The error belongs to
	 * the run that is starting, and the selection and the focus memory point at
	 * a `WordStackData` that `runPipeline` is about to replace.
	 */
	function resetTranscriptionView() {
		transcribeError = '';
		selectedWord = null;
		lastFocusedWord = null;
	}
	/**
	 * The per-SESSION state, which is not the song and is never stored.
	 *
	 * Every one of these keys on word positions in the poem that is about to be
	 * replaced. TWO CALLERS SINCE N.112, not three: Clear and N.67 step 4b's
	 * song switch, which are the two moments where the poem those positions
	 * described stops existing. Transcribe left this list when the diff gave it
	 * a way to move a mark instead of dropping it.
	 *
	 * `transcribedGrid` GOES WITH THEM, and it must: an empty grid is how
	 * `transcribeText` says "there is no previous text", and a grid left
	 * standing across a song switch would diff the incoming poem against the
	 * outgoing one and carry the wrong song's marks into it.
	 */
	function resetSessionState() {
		resetTranscriptionView();
		spotReconstitution = new Map();
		userStressOverrides = new Map();
		yoToggles = new Map();
		syllableOverrides = new Map();
		transcribedGrid = [];
	}
	/**
	 * The poem in the field, transcribed, and nothing else.
	 *
	 * N.108-5 LIFTED THIS OUT OF `handleTranscribe`, because after Dann's
	 * ruling of 2026-09-04 three callers run it and only one of them is a
	 * button press: the button, an arriving score, and the dictionary
	 * finishing its load after a boot that found a poem and a score together.
	 * What stayed behind in `handleTranscribe` is everything the singer's own
	 * press is entitled to do and an implicit run is not, which is the breath,
	 * the console record, and the focus move onto the first word.
	 *
	 * N.57: glosses are deliberately NOT wiped here. `runPipeline()` rebuilds
	 * `lines`, then `keepSurvivingGlosses()` drops only the ones whose word
	 * moved. The Guide has promised this since before it was true.
	 */
	function transcribeText(): void {
		/* THE TEXT IS RECORDED FIRST, so a `runPipeline` that throws still
		   counts as having read this text and the join does not sit in a loop
		   re-running a poem the pipeline cannot take. `transcribeError` is
		   what a singer sees in that case, and it already is. */
		transcribedText = doc.inputText;
		cancelQuietTimer();
		/* N.112. THE OVERRIDES FOLLOW THE WORD, and this REPLACES N.108-5's
		   reset, which that memo named as a cost in the same breath it shipped
		   it: the keys are positional, so an edit that adds or removes a word
		   slid every later position, a kept override landed on a word the
		   singer never marked, and between losing a mark and printing a wrong
		   one N.108-5 chose to lose the mark. The diff gives the position a way
		   to MOVE, so neither happens.

		   THE DIFF IS COMPUTED BEFORE `runPipeline`, not after, and the order
		   is the rule rather than a preference. `runPipeline` passes
		   `userStressOverrides` and `yoToggles` straight into `processText`, so
		   an override still holding its old key would be applied at the wrong
		   word on this very run. Re-key first, then transcribe once.

		   ONE GRID DIFFED, ONE PIPELINE RUN. The alternative was to transcribe
		   with no overrides, diff the result, re-key, and transcribe again,
		   which is two engine passes on every typing pause. `wordGrid` is the
		   pipeline's step 1 alone, lifted so this can ask what the words are
		   without asking what they sound like. */
		resetTranscriptionView();
		const prevGrid = transcribedGrid;
		const nextGrid = wordGrid(doc.inputText);
		const diff = prevGrid.length === 0 ? emptyDiff() : diffWordGrid(prevGrid, nextGrid);
		transcribedGrid = nextGrid;
		carryOverridesAcross(diff);
		runPipeline();
		/* THE RE-SEAT IS HANDED THE PREVIOUS GRID, NOT THE NEW ONE, and it is a
		   parameter rather than a read of `transcribedGrid` because that has
		   already been advanced by the line above. It needs the poem the seats
		   were made against, so it can tell a seat that describes THIS poem
		   from one made from the score's own words or carried in from another
		   song. Walk defect on `b191867`, memo §9. */
		reseatAcross(diff, prevGrid);
		/* N.57's anchor check STAYS, and it is now a second gate rather than
		   the mechanism. The diff has already moved every gloss whose word
		   survived; this drops any whose anchor no longer matches the word now
		   standing at its key, which is the case a diff cannot see because it
		   compares the poem to the poem and the anchor records what the gloss
		   was WRITTEN for. Belt and brace, and the brace is cheap. */
		keepSurvivingGlosses();
	}

	/**
	 * Carry every word-keyed override across a text edit. N.112, increment 1.
	 *
	 * FIVE MAPS, ONE RULE, and the rule lives in `text-diff.ts` where a test
	 * can reach it. Four are session state and the fifth pair is the song's
	 * own glosses; all of them key on `"lineIndex-wordIndex"` except the ё
	 * toggles, which append the character ordinal and take the other helper.
	 *
	 * WHAT STILL RESETS is what is not keyed on a word at all: the error, the
	 * selection, and the focus memory, which are `resetTranscriptionView`'s.
	 * `resetSessionState` keeps the four `new Map()` lines for the two
	 * Clear-shaped callers that genuinely want everything gone.
	 */
	function carryOverridesAcross(diff: TextDiff): void {
		if (diff.unchanged) return;
		spotReconstitution = rekeyByWord(spotReconstitution, diff);
		userStressOverrides = rekeyByWord(userStressOverrides, diff);
		syllableOverrides = rekeyByWord(syllableOverrides, diff);
		yoToggles = rekeyByWordChar(yoToggles, diff);
		doc.glossOverrides = rekeyByWord(doc.glossOverrides, diff);
		doc.glossAnchors = rekeyByWord(doc.glossAnchors, diff);
	}

	/**
	 * Carry the SCORE's seats across a text edit. N.112, increment 2.
	 *
	 * IT RUNS AFTER `runPipeline`, and it must: `slotQueue` reads `lines`, so
	 * the seats have to be re-originated against the queue the new text
	 * produces rather than the one it replaced.
	 *
	 * IT IS WRITTEN INTO `doc.pairings`, which is the one place in this file
	 * that writes the singer's own record from a derived value, and it is the
	 * exception CONTRACT §6 leaves room for rather than a breach of it: a seat
	 * is a DECISION about the score, the singer's edit has moved the word that
	 * decision was about, and the moved seat is the decision restated, not a
	 * cached derivation. `shownPairings` remains projected and unstored.
	 *
	 * NOTHING RUNS WITHOUT A SCORE. With no `ingestedScore` there are no notes
	 * to seat onto, `eventIds` is empty, and the pass would be a no-op that
	 * still wrote the map.
	 *
	 * THE CLITIC SEAT RE-RUNS AFTER IT (N.111, ruled by Dann 2026-09-04: a
	 * vowelless clitic is seated with its host automatically, "no vowelless
	 * word in Russian can carry its own duration"). A fold the new text
	 * introduces is seated at once, and one it removes was released with its
	 * word by the pass above. Where the arrangement is unchanged this is a
	 * no-op, which is the property `handleStartPlacementOver` already relies
	 * on.
	 */
	function reseatAcross(diff: TextDiff, before: readonly (readonly string[])[]): void {
		if (diff.unchanged || !ingestedScore) return;
		const result = reseatByDiff(doc.pairings, eventIds, slotQueue, diff, before);
		doc.pairings = seatCliticFolds(ingestedScore.result.score, result.map);
		/* THE QUEUE'S CURSOR IS CLAMPED, not recomputed. A shorter poem can
		   leave it past the end, which would arm nothing and make the next
		   click on the loupe do nothing at all. Recomputing it from the placed
		   count instead would jump the cursor across the poem on every
		   keystroke pause, which is the singer's place to stand. */
		pairingCursor = Math.min(pairingCursor, Math.max(0, slotQueue.length - 1));
	}

	/**
	 * N.108-5. TRANSCRIBE ALSO RUNS THE ANALYSIS.
	 *
	 * RULED BY DANN 2026-09-04: *"I'm also rethinking the idea of independent
	 * Transcribe and Continue to score markup actions. I think one should
	 * invoke the other."* A score standing at Continue is accepted by this
	 * press, on the uploader's own `accept()` and no second copy of it.
	 *
	 * THE ORDER IS THE POINT. `transcribeText()` runs FIRST, so that by the
	 * time `applyArrival` reaches `buildSlotQueue(lines)` the queue is this
	 * poem's rather than empty, and the first pass proposes onto the notes.
	 * Reversed, the accept would merge against nothing and the singer would
	 * read `0 / 5`.
	 *
	 * IT DOES NOT RE-SEAT A SCORE THAT IS ALREADY ATTACHED. Re-running the
	 * pairing pass when the poem changes under a score is **N.112**, the next
	 * item in the text-to-score sequence Dann ruled on 2026-09-06, and doing
	 * it here would be building N.112 early under another name.
	 */
	function handleTranscribe() {
		if (!canTranscribe) return;
		/* THE BUTTON ALWAYS RUNS THE PIPELINE, even where the join has already
		   transcribed this exact text. RULED BY DANN 2026-09-07: the button
		   "keeps its explicit act". A press that measured the text and decided
		   to do nothing would be a dead control, and the singer pressed it. */
		transcribeText();
		uploaderEl?.acceptWaiting();
		if (lines.length > 0) {
			// Breath animation: content appears with breath-in
			triggerPaperBreathIn();
			// Console output for verification
			console.group('[Ilya] Transcription result');
			lines.forEach((line, li) => {
				console.group(`Line ${li}`);
				line.words.forEach((w) => {
					console.log(
						`${w.cleanWord} → ${w.ipaDisplay}`,
						{
							stress: w.stressIndex,
							source: w.stressSource,
							boundary: w.rightBoundary,
							proclitic: w.isProclitic,
							enclitic: w.isEnclitic,
							gloss: w.gloss,
						}
					);
				});
				console.groupEnd();
			});
			console.groupEnd();
			// Focus first WordStack after render
			requestAnimationFrame(() => {
				const first = document.querySelector<HTMLElement>('[data-word-index="0-0"]');
				first?.focus();
			});
		}
	}
	function handleClear() {
		doc.inputText = '';
		lines = [];
		transcribeMs = 0;
		/* N.108-5. THE JOIN IS TOLD, or a cleared field would still be
		   remembered as transcribed and a pending pause would fire over a poem
		   that is gone. */
		transcribedText = null;
		cancelQuietTimer();
		transcribeWhenDictionaryReady = false;
		resetSessionState();
		doc.glossOverrides = new Map();
		doc.glossAnchors = new Map();
		// The document writes the cleared poem and the cleared glosses itself.
		// Clearing used to REMOVE the gloss key and write an empty poem; it now
		// writes an empty list and an empty poem, which restores identically.
	}
	/**
	 * CLEAR ON THE SCORE'S RECEIPT (N.108 increment 2).
	 *
	 * The poem's Clear and this one cannot reach each other's material, which
	 * is the ruling the build brief states as a gate: "Clear on one kind leaves
	 * the other." `handleClear` above touches `doc.inputText`, the lines and
	 * the glosses; this touches the score and the two things that only exist
	 * because of one.
	 *
	 * THE PLACEMENTS SURVIVE, and `SongDocument.detachSource` carries the
	 * reasoning: N.68 keys them positionally and only the singer destroys them,
	 * on purpose. Putting the same score back brings them with it.
	 *
	 * `restoreSource` IS CLEARED TOO, because it is what the uploader re-ingests
	 * on a remount. Left standing, a song switch away and back would bring the
	 * cleared score home again.
	 */
	function handleClearScore(): void {
		ingestedScore = null;
		noLyricsFile = null;
		orphanedCount = 0;
		arrivalPage = null;
		restoreSource = null;
		doc.detachSource();
		/* THE HEADER FIELDS GO WITH THE SCORE. RULED BY DANN 2026-09-03 on his
		   walk of increment 2: Clear on the score empties every Metadata field
		   still tagged "from score" and leaves the singer's own alone.

		   `clearScoreFilled` IS THE RULE ALREADY WRITTEN, not a second copy of
		   it. It is what an arriving score calls through `onScoreIngested` to
		   drop the last score's identity, its transitions are covered by
		   `metadata-provenance.test.ts`, and the Q1 refinement (Kimi,
		   2026-07-13) is what makes it safe here: a tag fades on the field's
		   first hand edit, so a field the singer has touched is not tagged and
		   is not reached. A field they filled from blank was never tagged
		   either.

		   IT ANSWERS THE SAME FAULT E.23 FOUND, from the other end. A score
		   that arrives clears what the last one filled, so a printed page
		   cannot name the wrong work; until now a score that LEFT cleared
		   nothing, so the drawer and the page header kept the departed score's
		   title and composer, still wearing a badge naming a file that is no
		   longer here. */
		commitMetadataState(
			clearScoreFilled({ metadata: doc.metadata, fromScore: doc.fromScoreFields }),
		);
	}

	function handlePrint() {
		window.print();
	}
	function handleWordClick(word: WordStackData) {
		selectedWord = word;
		lastFocusedWord = { line: word.lineIndex, word: word.wordIndex };
		/* Raise the drawer when a word is clicked, so the Analysis station has
		   somewhere to appear. PHONE ONLY: on the desk it is already up, and
		   `drawerRaised` is not read there. This is the same behaviour the
		   collapsed drawer had, under the state that replaced it. */
		if (isMobile) drawerRaised = true;
		// Switch to Transcription if clicking a word from another surface
		if (destination !== 'studio' || studioDocument !== 'transcription') {
			destination = 'studio';
			studioDocument = 'transcription';
			try {
				localStorage.setItem('ilya:activeTab', 'transcription');
			} catch {
				// localStorage unavailable
			}
		}
		console.log('[Ilya] Selected:', word.cleanWord, word.ipaDisplay, {
			stress: word.stressIndex,
			source: word.stressSource,
			gloss: word.gloss,
			displayLog: word.displayLog,
		});
	}
	function handleNotationChange(prefs: NotationPreferences) {
		notationPrefs = prefs;
		try {
			localStorage.setItem('ilya:notationPrefs', JSON.stringify(prefs));
		} catch {
			// localStorage unavailable (private browsing)
		}
	}
	function handleStressDiacriticsChange(value: boolean) {
		showStressDiacritics = value;
		try {
			localStorage.setItem('ilya:showStressDiacritics', JSON.stringify(value));
		} catch {
			// localStorage unavailable
		}
	}
	function handleOpenSyllabificationChange(value: boolean) {
		doc.openSyllabification = value;
		// Spec requirement: toggling global in either direction clears all per-word overrides
		syllableOverrides = new Map();
	}
	// Toggle spot reconstitution for the currently selected word
	function handleSpotReconToggle() {
		if (!selectedWord) return;
		const key = `${selectedWord.lineIndex}-${selectedWord.wordIndex}`;
		const newMap = new Map(spotReconstitution);
		if (newMap.has(key)) {
			newMap.delete(key);
		} else {
			newMap.set(key, true);
		}
		spotReconstitution = newMap;
	}
	// ── Stress assignment handler ────────────────────────────────
	function handleStressAssign(syllableIndex: number, source: string) {
		if (!selectedWord) return;
		const key = `${selectedWord.lineIndex}-${selectedWord.wordIndex}`;
		const existingOverride = userStressOverrides.get(key);
		const isClitic = selectedWord.isProclitic || selectedWord.isEnclitic || existingOverride?.promotedFromClitic;
		const newMap = new Map(userStressOverrides);
		newMap.set(key, {
			stressIndex: syllableIndex,
			stressSource: source as UserStressOverride['stressSource'],
			...(isClitic ? { promotedFromClitic: true } : {}),
		});
		userStressOverrides = newMap;
		runPipeline();
	}
	// ── Stress revert handler ────────────────────────────────────
	function handleStressRevert() {
		if (!selectedWord) return;
		const key = `${selectedWord.lineIndex}-${selectedWord.wordIndex}`;
		const newMap = new Map(userStressOverrides);
		newMap.delete(key);
		userStressOverrides = newMap;
		runPipeline();
	}
	// ── Character-level ё toggle handler ─────────────────────────
	function handleYoCharToggle(charIndex: number, source: string | null) {
		if (!selectedWord) return;
		const key = `${selectedWord.lineIndex}-${selectedWord.wordIndex}-${charIndex}`;
		const newMap = new Map(yoToggles);
		if (source === null) {
			// Revert: remove the toggle
			newMap.delete(key);
		} else {
			newMap.set(key, { source: source as YoToggle['source'] });
		}
		yoToggles = newMap;
		runPipeline();
	}
	// ── Per-word syllable override handler ────────────────────────
	function handleSyllableOverride(lineIndex: number, wordIndex: number, override: SyllableOverride) {
		const key = `${lineIndex}-${wordIndex}`;
		const newMap = new Map(syllableOverrides);
		newMap.set(key, override);
		syllableOverrides = newMap;
	}
	// ── Per-word syllable override removal ────────────────────────
	function handleSyllableOverrideClear(lineIndex: number, wordIndex: number) {
		const key = `${lineIndex}-${wordIndex}`;
		const newMap = new Map(syllableOverrides);
		newMap.delete(key);
		syllableOverrides = newMap;
	}
	// ── Per-word gloss override handler ───────────────────────────
	function handleGlossOverride(gloss: string | null) {
		if (!selectedWord) return;
		const key = `${selectedWord.lineIndex}-${selectedWord.wordIndex}`;
		const newMap = new Map(doc.glossOverrides);
		const newAnchors = new Map(doc.glossAnchors);
		if (gloss === null) {
			newMap.delete(key);
			newAnchors.delete(key);
		} else {
			newMap.set(key, gloss);
			newAnchors.set(key, selectedWord.cleanWord);
		}
		doc.glossOverrides = newMap;
		doc.glossAnchors = newAnchors;
	}
	// ---- N.57: gloss persistence and the survival guard -------------
	//
	// The comparison is lowercased and yo-folded, because the dictionary is
	// keyed by lowercase word form (curated-glosses.ts) and a yo toggle
	// re-spells a word without making it a different word.
	function glossAnchorForm(word: string): string {
		return word.toLowerCase().replace(/\u0451/g, '\u0435');
	}
	// The gloss rows are assembled and written by the library now
	// (`library.ts`, `recordFromFields`), in the same shape and under the same
	// key. `persistGlosses()` is gone: assigning the maps is the save.
	function keepSurvivingGlosses() {
		const nextGloss = new Map<string, string>();
		const nextAnchor = new Map<string, string>();
		for (const [key, gloss] of doc.glossOverrides) {
			const anchor = doc.glossAnchors.get(key);
			if (!anchor) continue;
			const [lineIdx, wordIdx] = key.split('-').map(Number);
			const word = lines[lineIdx]?.words?.[wordIdx];
			if (word && glossAnchorForm(word.cleanWord) === glossAnchorForm(anchor)) {
				nextGloss.set(key, gloss);
				nextAnchor.set(key, anchor);
			}
		}
		doc.glossOverrides = nextGloss;
		doc.glossAnchors = nextAnchor;
	}
	// ── Per-word reset: clear all overrides for the selected word ──
	function handleReset() {
		if (!selectedWord) return;
		const wordKey = `${selectedWord.lineIndex}-${selectedWord.wordIndex}`;
		let needsPipeline = false;
		// Clear stress override
		if (userStressOverrides.has(wordKey)) {
			const newStress = new Map(userStressOverrides);
			newStress.delete(wordKey);
			userStressOverrides = newStress;
			needsPipeline = true;
		}
		// Clear ё toggles for this word (keys are "lineIndex-wordIndex-charIndex")
		const yoPrefix = `${wordKey}-`;
		const hasYoToggles = [...yoToggles.keys()].some(k => k.startsWith(yoPrefix));
		if (hasYoToggles) {
			const newYo = new Map(yoToggles);
			for (const k of [...newYo.keys()]) {
				if (k.startsWith(yoPrefix)) newYo.delete(k);
			}
			yoToggles = newYo;
			needsPipeline = true;
		}
		// Clear syllable override
		if (syllableOverrides.has(wordKey)) {
			const newSyll = new Map(syllableOverrides);
			newSyll.delete(wordKey);
			syllableOverrides = newSyll;
		}
		// Clear spot reconstitution
		if (spotReconstitution.has(wordKey)) {
			const newSpot = new Map(spotReconstitution);
			newSpot.delete(wordKey);
			spotReconstitution = newSpot;
		}
		// Clear gloss override
		if (doc.glossOverrides.has(wordKey)) {
			const newGloss = new Map(doc.glossOverrides);
			newGloss.delete(wordKey);
			doc.glossOverrides = newGloss;
			const newAnchors = new Map(doc.glossAnchors);
			newAnchors.delete(wordKey);
			doc.glossAnchors = newAnchors;
		}
		if (needsPipeline) runPipeline();
	}
	/**
	 * The one field changed.
	 *
	 * N.108-5, RULED BY DANN 2026-09-07. `how` is the field's own reading of
	 * the `InputEvent`: a paste transcribes at once, a keystroke after the
	 * quiet pause. It defaults to `paste` because the other callers are a
	 * poem read out of a PDF or a photograph, which arrive whole, the way a
	 * paste does.
	 */
	function handleInput(text: string, how: TextArrival = 'paste') {
		doc.inputText = text;
		nameIfUnnamed();
		joinText(how);
	}

	/* ── N.67 step 4a: a different piece has arrived ───────────────── */

	// The upload waiting on the singer's answer. NOTHING is mutated while this
	// is set: not the score, not the metadata, not the placements, not the
	// stored source. So "Keep this song" has nothing to undo.
	let pendingArrival = $state<{
		ingested: IngestedScore;
		file: File;
		orphaned: number;
		total: number;
	} | null>(null);
	let replaceDialogEl = $state<HTMLDialogElement | undefined>(undefined);
	let keepButtonEl = $state<HTMLButtonElement | undefined>(undefined);

	/**
	 * N.67 step 5. ONE dialog serves both warnings, because they are the same
	 * act: something is about to replace this song and cannot be undone.
	 *
	 * `title` and `body` are already-resolved strings, so the template holds no
	 * copy decisions, and `replace` is what the destructive button does.
	 */
	/**
	 * One button on the confirmation dialog. THE LAST ANSWER IS THE SAFE ONE.
	 *
	 * `keepOpen` is for the escape hatch: exporting first is not an answer, it is
	 * something you do before answering, so it must not close the dialog.
	 */
	type Answer = { label: string; run?: () => void; destructive?: boolean; keepOpen?: boolean };
	let pendingConfirm = $state<{ title: string; body: string; answers: Answer[] } | null>(null);
	const safeAnswer = $derived(pendingConfirm?.answers.at(-1) ?? null);

	async function askToReplace(title: string, body: string, answers: Answer[]): Promise<void> {
		pendingConfirm = { title, body, answers };
		// RENDERED BEFORE THE DIALOG OPENS. Without this tick the buttons do not
		// exist yet, so `showModal()`'s own focus algorithm settles on the dialog
		// and the explicit focus below reaches nothing. The safe answer is last
		// in the DOM, which is `keepButtonEl`.
		await tick();
		replaceDialogEl?.showModal();
		// Focus the SAFE answer. Done here rather than with `autofocus`, which
		// raises `a11y_autofocus` and would move the web-check gate; and the DOM
		// order is the visual order, so nothing a singer sees disagrees with
		// what a screen reader is told (Dann, 2026-08-16).
		keepButtonEl?.focus();
	}

	/**
	 * Every accepted score comes through here first.
	 *
	 * Before this existed, a second score overwrote the song's title and file in
	 * place while the first song's placements survived onto music they were
	 * never made for (measured at `5c9c7f3`). Now Ilya can tell that a different
	 * piece has arrived, and says so before anything is lost.
	 */
	/** N.59 step 7: the page provenance of the arrival currently being applied. */
	let arrivalPage: PageProvenance | null = null;

	/**
	 * N.108-5, WIDENED BY DANN 2026-09-07: whenever text is present, the
	 * transcription exists.
	 *
	 * `transcribedText` IS THE TEXT THE CURRENT `lines` WERE BUILT FROM, and
	 * `null` when there are none. It replaced a boolean when the join widened
	 * from "a score arrived" to "the field changed": a singer types, so the
	 * question is not whether the pipeline has run but whether it has run over
	 * THIS text. It is session state and is never stored, exactly like `lines`,
	 * whose freshness it describes.
	 */
	let transcribedText = $state<string | null>(null);

	/**
	 * The word grid the current `lines` were built from. N.112.
	 *
	 * HELD RATHER THAN RE-DERIVED, and the reason is cost rather than
	 * cleanliness: `wordGrid` runs the pipeline's own tokenizer, which
	 * modernises pre-1918 spellings against the dictionary, and this path runs
	 * on every 600 ms typing pause. Deriving the old side from
	 * `transcribedText` would tokenize the whole poem twice per keystroke
	 * burst instead of once.
	 *
	 * IT IS NOT `lines`, AND CANNOT BE. `lines` is the grid AFTER
	 * `processText`'s step 1.5 has applied the ё toggles, and a ё toggle
	 * changes `cleanWord`. Diffing that would read the singer's own mark as a
	 * word they had replaced. See `wordGrid`'s comment.
	 *
	 * EMPTY MEANS "NO PREVIOUS TEXT", which is a boot, a Clear, or a song
	 * switch. There is nothing to carry across in any of those, and the
	 * override maps are empty in all three.
	 */
	let transcribedGrid: string[][] = [];

	/**
	 * The text waiting on a dictionary that has not loaded yet.
	 *
	 * A "NOT YET" IS NOT A "NO". At boot the poem is restored before
	 * `loadDictionary` finishes, and a singer can type into the field while it
	 * is still loading. Both land here and are spent by the effect below.
	 */
	let transcribeWhenDictionaryReady = $state(false);

	/** The quiet timer for typing. Never more than one. */
	let quietTimer: ReturnType<typeof setTimeout> | null = null;

	function cancelQuietTimer(): void {
		if (quietTimer === null) return;
		clearTimeout(quietTimer);
		quietTimer = null;
	}

	/**
	 * THE ONE JOIN. Every path that can change the text or need it transcribed
	 * calls this and nothing else decides.
	 *
	 * RULED BY DANN 2026-09-07: "at boot, if the field holds text, transcribe
	 * once the dictionary is ready, score or no score. On paste, transcribe at
	 * once. While typing, transcribe after a short pause, never per keystroke."
	 * The verdict itself is `transcribeVerdict` in `one-action.ts`, out there
	 * in a `.ts` file on purpose, because a rule written inside a `.svelte`
	 * file is a rule no vitest in this repository can pin.
	 *
	 * `nothing` CANCELS A PENDING TIMER, which is not tidying: a singer who
	 * types three letters and then clears the field would otherwise have the
	 * pipeline run 600 ms later over the poem they had just deleted.
	 */
	function joinText(how: TextArrival): void {
		const verdict = transcribeVerdict(
			{
				poem: doc.inputText,
				transcribedText,
				dictionaryReady: !loaderState.isLoading && loaderState.entryCount > 0,
			},
			how,
		);
		if (verdict === 'now') {
			transcribeText();
		} else if (verdict === 'soon') {
			cancelQuietTimer();
			quietTimer = setTimeout(() => {
				quietTimer = null;
				/* ASKED AGAIN ON THE WAY OUT, as `paste`, because 600 ms is long
				   enough for the field to have been cleared or for the button to
				   have been pressed since. The verdict is the one authority and
				   this is one more reading of it, not a second opinion. */
				joinText('paste');
			}, QUIET_MS);
		} else if (verdict === 'wait') {
			cancelQuietTimer();
			transcribeWhenDictionaryReady = true;
		} else {
			cancelQuietTimer();
		}
	}

	/**
	 * Transcribe NOW if the text is not already transcribed, cancelling any
	 * pending pause.
	 *
	 * TWO CALLERS, AND BOTH ARE MOMENTS THAT CANNOT WAIT 600 ms: the singer
	 * pressing the button, and a score arriving, which reads
	 * `buildSlotQueue(lines)` in the same tick.
	 */
	function flushText(): void {
		cancelQuietTimer();
		joinText('paste');
	}

	/* N.108-5. THE WAIT, SPENT. The flag is read inside `untrack` and the
	   effect depends on the LOADER ALONE, so writing the flag here cannot
	   re-trigger the effect that wrote it; nothing about the poem or the
	   pairings is a dependency, and a singer typing does not reach this. */
	$effect(() => {
		const ready = !loaderState.isLoading && loaderState.entryCount > 0;
		if (!ready) return;
		untrack(() => {
			if (!transcribeWhenDictionaryReady) return;
			transcribeWhenDictionaryReady = false;
			joinText('paste');
		});
	});

	async function handleArrival(
		ingested: IngestedScore,
		file: File,
		origin: 'upload' | 'restore',
		page?: PageProvenance,
	): Promise<void> {
		arrivalPage = page ?? null;
		/* N.108-5. CONTINUE TO ANALYSIS ALSO TRANSCRIBES, and this is the one
		   site that does it, so an upload, a drop that reaches accept and a
		   boot restore cannot end up with three answers.

		   BEFORE ANYTHING ELSE IN THIS FUNCTION, because `applyArrival` reads
		   `buildSlotQueue(lines)` for the merge: a poem transcribed after that
		   line has no way to reach the notes, and the singer would read
		   `0 / 5` with their poem sitting in the field.

		   IT FLUSHES RATHER THAN SCHEDULING. A pending quiet pause is 600 ms
		   away and this tick needs the queue, so `flushText` cancels it and
		   runs. Where the text is already transcribed, which after Dann's
		   widening of 2026-09-07 is the usual case, this costs nothing. */
		flushText();
		// A restore is the song's own score coming back from the vault. It is
		// never a new arrival and must never be questioned.
		if (origin === 'restore') {
			applyArrival(ingested, file, origin, false);
			return;
		}
		const eventIds = ingested.result.score.vocalLine.filter((ev) => ev.type !== 'rest').map((ev) => ev.id);
		const present = new Set(eventIds);
		const stored = Object.keys(doc.pairings);
		const orphaned = stored.filter((id) => !present.has(id)).length;

		let incoming = '';
		try {
			incoming = await fingerprintVocalLine(ingested.result.score.vocalLine);
		} catch {
			// No fingerprint means no evidence, and an unprovable suspicion must
			// not stand between a singer and their score.
		}
		const decision = incoming
			? arrivalDecision({
					storedFingerprint: doc.source?.fingerprint,
					incomingFingerprint: incoming,
					orphanCount: orphaned,
				})
			: 'attach';

		// DESIGN §2.6, SECOND BRANCH. From a NEUTRAL state, which is what New
		// song creates, an arriving score is checked against the library before
		// it is attached to anything. A hash may GUIDE; only the singer decides,
		// so the answer is a prompt and never an action, and nothing at all is
		// mutated until they give one. A song that already has a score is not
		// neutral, and that path is `arrivalDecision`'s, untouched.
		if (doc.source === null) {
			const matches = await recognize(library.plural, incoming, doc.id);
			const match = matches[0];
			if (match) {
				void askToReplace(
					t('recognize.title', language),
					t('recognize.body', language).replace(
						'%s',
						toRows([match], t('songs.untitled', language))[0].label,
					),
					[
						{ label: t('recognize.open', language), run: () => void switchSong(match.id) },
						{ label: t('recognize.here', language), run: () => applyArrival(ingested, file, origin, false) },
					],
				);
				return;
			}
		}

		if (decision === 'ask') {
			pendingArrival = { ingested, file, orphaned, total: stored.length };
			void askToReplace(
				t('replace.title', language),
				t('replace.body', language).replace('%s', String(orphaned)).replace('%s', String(stored.length)),
				[
					{
						label: t('replace.replace', language),
						destructive: true,
						run: () => {
							const pending = pendingArrival;
							if (pending) applyArrival(pending.ingested, pending.file, 'upload', true);
						},
					},
					{ label: t('binder.exportFirst', language), run: () => void handleExport(), keepOpen: true },
					{ label: t('replace.keep', language) },
				],
			);
			return;
		}
		applyArrival(ingested, file, origin, false);
	}

	/**
	 * Answer the dialog. Closed FIRST, then acted on, so an act that opens
	 * another dialog is never fighting this one for the modal.
	 */
	function answerWith(answer: Answer): void {
		if (answer.keepOpen) {
			answer.run?.();
			return;
		}
		replaceDialogEl?.close();
		answer.run?.();
	}

	/**
	 * Attach a score to the open song.
	 *
	 * `replaceWholeSong` empties the placements FIRST, so the merge rule below
	 * sees a fresh map and proposes into it: title, score file, and placements
	 * all become the new piece's together, which is the whole point. Without it
	 * this is step 3's behaviour exactly, unchanged.
	 */
	function applyArrival(
		ingested: IngestedScore,
		file: File,
		origin: 'upload' | 'restore',
		replaceWholeSong: boolean,
	): void {
		if (replaceWholeSong) doc.pairings = {};
		// N.67 step 2. The singer's own bytes go down with the song, in one
		// transaction, so a reload brings the score back. Only a real upload
		// writes: a restore's bytes came from the vault.
		if (origin === 'upload') void attachUploadedSource(ingested, file, arrivalPage ?? undefined);
		// Live-wired (§E.7 slice 1): VoiceProfilePane renders this as paginated
		// notation in the Fit main pane.
		ingestedScore = ingested;
		// N.55b R3: the first pass runs on accept, and the N.55a courtesy message
		// arrives in the same moment or it has no moment at all. It runs ONLY
		// where the file carried no lyrics. Where the score has an underlay, Ilya
		// READS it (`vowel-resolver.ts`), and proposing over it would be Ilya
		// claiming where the score already speaks. That is an INFERENCE from R3
		// and N.55a together, not a ruling of Dann's.
		const noLyrics = ingested.result.warnings.some((w) => w.code === 'no-lyrics-found');
		noLyricsFile = noLyrics ? ingested.fileName : null;
		// N.67 step 3, design §2.6. THE MERGE RULE, and where N.68 closed: an
		// upload never destroys placements; only the singer does, on purpose,
		// with Start placement over or with the replace dialog above.
		const merged = mergeOnUpload(
			doc.pairings,
			ingested.result.score.vocalLine.filter((ev) => ev.type !== 'rest').map((ev) => ev.id),
			buildSlotQueue(lines),
			noLyrics,
		);
		doc.pairings = merged.map;
		/* N.111 increment 3, RULED BY DANN 2026-09-04: Ilya seats a vowelless
		   clitic with its host HERE, at ingest, with no proposal and no button.
		   A lone vowelless clitic cannot exist on the page.

		   AFTER THE MERGE, so it can never overwrite a placement the singer
		   already made: `mergeOnUpload` returns the existing map untouched on a
		   re-upload, and `isCliticSeated` then finds each fold already seated
		   and does nothing. On a fresh map it seats.

		   IT RUNS ON A RESTORE TOO. The restored map already carries the seat,
		   so this is a no-op there; it is not gated on `origin` because a song
		   saved before this shipped has a map that does not carry it. */
		doc.pairings = seatCliticFolds(ingested.result.score, doc.pairings);
		// Kept, never dropped, and reported as a count.
		orphanedCount = merged.orphaned.length;
		// The cursor lands on the first syllable the pass did not reach. Only
		// moved where the pass actually ran: a re-upload must not walk the
		// singer's insertion point back.
		if (merged.proposed) {
			pairingCursor = Math.min(Object.keys(doc.pairings).length, Math.max(0, slotQueue.length - 1));
		}
		// A new score arrives: clear whatever the previous score filled, then
		// fill the blanks from this score's header if it carries one. A score
		// with no header still clears, and that case is the whole point: at E.23,
		// Musorgsky's Sunless 1 rendered under the Schubert's title, composer,
		// and poet, because a header-less score reached no code that touched
		// metadata at all.
		commitMetadataState(
			onScoreIngested(
				{ metadata: doc.metadata, fromScore: doc.fromScoreFields },
				ingested.result.score.workMetadata,
			),
		);
	}

	/* ── N.67 step 5: the binder ────────────────────────────────────── */

	let importInputEl = $state<HTMLInputElement | undefined>(undefined);
	let binderError = $state<string | null>(null);
	/** What an import added. Cleared by the next export or import, never stale. */
	let binderNotice = $state<string | null>(null);

	/* ── N.67 step 6, the sweep: what storage tells the singer ───────── */

	// The last reading of `navigator.storage.estimate()`. Taken at boot and read
	// again the moment a write refuses for quota, because the boot figure is the
	// one thing a full origin is guaranteed to have moved past.
	let storageReading = $state<StorageReading>(opened?.storage ?? { persisted: null });
	// Decided ONCE, at mount, because deciding it again would show the
	// once-per-device eviction notice a second time: `bootNotices` writes the
	// flag as it decides, which is what makes "once" survive a reload.
	let bootLines = $state<NoticeLine[]>([]);
	const storageLines = $derived(
		drawerNotices({
			boot: bootLines,
			saveFailure: doc.saveFailure,
			loadFailure: doc.loadFailure,
			reading: storageReading,
		}),
	);
	$effect(() => {
		// A REAL FIGURE OR NONE. The notice appends "Storage: x of y used" only
		// where the browser answered with numbers, and the numbers worth showing
		// are the ones from the moment the write refused.
		if (doc.saveFailure !== 'quota-exceeded') return;
		void readStorageEstimate().then((reading) => {
			storageReading = reading;
		});
	});

	/** A date a singer would write, in their own language. */
	function todayInWords(): string {
		return new Date().toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});
	}

	/**
	 * Write the binder to the singer's own device.
	 *
	 * A Blob and an anchor, which lands in Downloads or the Files app. **NOT
	 * `navigator.share`**, which would be the sharing affordance design §8
	 * rules out: the binder is addressed to nobody, and the moment it is handed
	 * to another person that act is the person's, not the tool's.
	 *
	 * WHICH SONGS is the only difference between the two export controls, which
	 * is design §5's "a binder of one song and a binder of the whole library are
	 * the same object at different sizes". Everything else, the gathering, the
	 * naming, and the open song coming from the document rather than the vault,
	 * is `exchange.ts`, where a gate can reach it.
	 */
	async function writeBinder(ids: string[]): Promise<void> {
		binderError = null;
		binderNotice = null;
		const result = await exportBinder({
			ids,
			openId: doc.id,
			// Taken live: the document holds edits the vault has not seen, and a
			// rename debounces like everything else.
			openRecord: { ...doc.toRecord(), name: doc.name },
			// THE WHOLE LOAD RESULT. A record that failed validation comes back with
			// its raw stored value beside it, and that is what the binder carries:
			// design §4's salvage path, which is the only way anything ever comes
			// back out of a record Ilya has promised never to write to again.
			load: (id) => library.load(id),
			loadSource: (id) => library.loadSource(id),
			appVersion: version,
			exportedAt: new Date().toISOString(),
			today: todayInWords(),
			untitled: t('songs.untitled', language),
		});
		if (!result.ok) {
			binderError = t('binder.err.damaged', language);
			return;
		}
		const url = URL.createObjectURL(new Blob([result.bytes as BlobPart], { type: 'application/zip' }));
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = result.fileName;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	const handleExport = (songId: string = doc.id): Promise<void> => writeBinder([songId]);
	/** Every song the list holds, in the order it draws them. */
	const handleExportAll = (): Promise<void> => writeBinder(songRows.map((row) => row.id));

	/**
	 * Raise design §5's three answers for one colliding song, and wait.
	 *
	 * PROMISE-SHAPED RATHER THAN CALLBACK-SHAPED, because the songs in a binder
	 * are asked about one at a time and each answer must land before the next is
	 * asked.
	 *
	 * **THE PRESS SETTLES IT, NOT THE CLOSE EVENT.** Measured 2026-08-18: in the
	 * browser this walk ran in, `close()` fires NO `close` event at all, on a
	 * bare `<dialog>` with no framework anywhere near it. An answer that waited
	 * for that event waited forever and the import hung on the first collision.
	 * `answerWith` closes before it runs, so the dialog is already shut when
	 * this resolves and the next `showModal()` is safe.
	 *
	 * Escape settles to Keep mine, because closing without answering changes
	 * nothing: nothing is mutated before the answer. Both `cancel` and `close`
	 * are listened for, and whichever arrives first wins; the rest are no-ops,
	 * because a question can only be answered once.
	 */
	let collisionResolve: ((answer: CollisionAnswer) => void) | null = null;

	function settleCollision(answer: CollisionAnswer): void {
		const resolve = collisionResolve;
		collisionResolve = null;
		resolve?.(answer);
	}

	function askCollision(collision: Collision): Promise<CollisionAnswer> {
		// ISO, YYYY-MM-DD: it reads the same in both languages and cannot be
		// misread as a different day (`placeholderName` sets the precedent).
		const mine = collision.mine.updatedAt.slice(0, 10);
		const theirs = collision.incoming.record.updatedAt.slice(0, 10);
		return new Promise((resolve) => {
			collisionResolve = resolve;
			void askToReplace(
				// N.67 step 6, walk finding W1. The title names the song being asked
				// about, so two collisions in a row are two questions rather than one
				// stubborn dialog. The name comes from `exchange.ts`, which knows the
				// placeholder rule for a song that was never named.
				t('collide.title', language).replace('%s', collisionName(collision, t('songs.untitled', language))),
				t('collide.body', language).replace('%s', mine).replace('%s', theirs),
				[
					{ label: t('collide.take', language), destructive: true, run: () => settleCollision('take') },
					{ label: t('collide.both', language), run: () => settleCollision('both') },
					{ label: t('collide.mine', language), run: () => settleCollision('mine') },
				],
			).then(() => {
				// A dialog that never opened must not hang the import forever.
				// Nothing was asked, so nothing is taken.
				if (!replaceDialogEl?.open) settleCollision('mine');
			});
		});
	}

	/**
	 * Read a binder in.
	 *
	 * **AN IMPORT ADDS SONGS TO THE LIBRARY. IT NEVER TOUCHES THE SONG YOU ARE
	 * IN** (Dann's ruling, 2026-08-18). The open-song warning that used to stand
	 * here is RETIRED: it existed because there was only ever one song to
	 * destroy, and songs have been plural since `cb7a15a`. The one question left
	 * is the id collision, and a singer who re-imports a binder of the song they
	 * are working in still meets it, because that is an id collision and that is
	 * the one moment the question is worth asking.
	 */
	async function handleImportFile(file: File): Promise<void> {
		binderError = null;
		binderNotice = null;
		const bytes = new Uint8Array(await file.arrayBuffer());
		const read = await readBinder(bytes, new Date().toISOString());
		if (!read.ok) {
			binderError = t(binderFailureKey(read.reason), language);
			return;
		}
		const outcome = await importBinder({
			songs: read.songs,
			// The ids the vault ACTUALLY holds. `library.load` cannot answer this:
			// an absent id yields an empty record rather than an error, so a check
			// written on it would report "no collision" for every song in the file.
			existing: await listSongs(library.plural),
			save: (record, source) => library.save(record, source),
			// N.67 step 6. A song that could not be read in the origin it left is
			// written back EXACTLY AS THE FILE CARRIES IT, with no stamp and no
			// rebuild, or the round trip would repair what design §4 promised to
			// leave untouched.
			salvage: (raw, id, source) => library.salvage(raw, id, source),
			ask: askCollision,
			newId,
			openId: doc.id,
		});
		if (outcome.failed) binderError = t('songs.err.write', language);
		const notice = importNoticeKey(outcome);
		if (notice) binderNotice = t(notice.key, language).replace('%s', String(notice.count));
		// THE ONLY CASE THAT RELOADS. The live document was replaced underneath,
		// and the document's own guarantee is that it is constructed FROM a
		// record already read, so a reload is the honest way to get that for a
		// record which has just arrived.
		if (outcome.replacedOpen) {
			location.reload();
			return;
		}
		// Every other answer leaves the singer exactly where they were, because
		// an import ADDS. The list is refreshed and the pointer does not move.
		await refreshSongs();
	}

	/* ── N.67 step 4b: the library door ─────────────────────────────── */

	// The library, as the drawer draws it. Read from the vault, refreshed after
	// every act that changes what is in it. The OPEN song's live name is laid
	// over its row below, because a rename debounces like every other write and
	// the singer must see it land immediately.
	let songs = $state<SongSummary[]>([]);
	let libraryError = $state<string | null>(null);
	let switching = false;

	async function refreshSongs(): Promise<void> {
		songs = await listSongs(library.plural);
	}

	const songRows = $derived(
		libraryRows(
			songs,
			{
				id: doc.id,
				name: doc.name,
				createdAt: doc.createdAt,
				updatedAt: doc.createdAt,
				fingerprint: doc.source?.fingerprint ?? null,
			},
			t('songs.untitled', language),
			// N.67 step 6: a song that cannot be written to keeps its STORED name
			// in the list, never the live one, which for a damaged record is a name
			// the page invented and can never save.
			doc.readOnly,
		),
	);

	/**
	 * Open another song. CLOSE() THEN OPEN(), never a prop change and never a
	 * reload.
	 *
	 * Measured 2026-08-18 on this Mac in Chromium, before the branch was chosen,
	 * from the score's bytes reaching the ingest path to a stave in the DOM:
	 * about 49 ms for a .musicxml and about 343 ms for a real 143 KB .musx, plus
	 * a vault read under a millisecond. A `location.reload()` measured 97 ms and
	 * 448 ms for the same two files and additionally throws away the tab, the
	 * drawer, the scroll position, and the loaded dictionary. So the reload
	 * branch costs more and buys nothing.
	 *
	 * `close()` flushes the outgoing song's debounce tail and tears its autosave
	 * down BEFORE the next document exists, so two documents never share an
	 * effect and a switch cannot cross-write one song's work into another's.
	 */
	async function switchSong(id: string): Promise<void> {
		if (id === doc.id || switching) return;
		switching = true;
		try {
			await doc.close();
			writeActiveSongId(localStorage, id);
			const next = await SongDocument.open(library, id);
			const bytes = await library.loadSource(id);
			// Everything belonging to the OUTGOING song, dropped before the new
			// document lands, so nothing of one song is ever drawn against the
			// other's music.
			resetSessionState();
			ingestedScore = null;
			lines = [];
			transcribeMs = 0;
			/* N.108-5. The outgoing song's transcription is forgotten with its
			   lines, or the incoming song's identical first line would read as
			   already transcribed. A pending pause goes too: it belongs to a
			   field the singer has left. */
			transcribedText = null;
			cancelQuietTimer();
			orphanedCount = 0;
			pairingCursor = 0;
			noLyricsFile = null;
			restoreSource = restoreFrom(bytes, next.source?.page);
			doc = next;
			await refreshSongs();
			/* A SWITCH IS NOT A BOOT. The singer just chose this song, so Ilya
			   shows it to them rather than making them press Transcribe to see
			   what they left. It also has to run: `slotQueue` comes from
			   `lines`, so without it the placements would come back looking
			   like drift.

			   N.108-5 ROUTES IT THROUGH THE ONE JOIN. This block used to call
			   `runPipeline` and `keepSurvivingGlosses` itself behind its own
			   copy of the "is the dictionary ready" test, which was a second
			   opinion about the same rule and which did nothing at all where
			   the dictionary was still loading. `joinText` answers `wait`
			   there, and the loader effect spends it. */
			joinText('boot');
		} finally {
			switching = false;
		}
	}

	async function handleNewSong(): Promise<void> {
		// WRITTEN BEFORE IT IS OPENED, so a reload between the two finds a song
		// that is really there.
		const created = await createSong({ library, newId, now: () => new Date().toISOString() });
		if (!created.ok) {
			libraryError = t('songs.err.write', language);
			return;
		}
		libraryError = null;
		await refreshSongs();
		await switchSong(created.record.id);
	}

	function handleRenameSong(id: string, name: string): void {
		libraryError = null;
		// THE OPEN SONG IS RENAMED THROUGH ITS DOCUMENT. The document holds the
		// live record and would write its own name back over a rename that went
		// round it, so the rename would appear to work and then undo itself.
		if (id === doc.id) {
			// N.67 step 6: except when this song refuses to be written to at all.
			// Reported rather than swallowed, which is N.27's rule, and the sentence
			// already exists.
			if (doc.readOnly) {
				libraryError = t('songs.err.write', language);
				return;
			}
			doc.name = name;
			return;
		}
		void renameSong(library, id, name).then(async (outcome) => {
			if (!outcome.ok) libraryError = t('songs.err.write', language);
			await refreshSongs();
		});
	}

	function handleDeleteSong(id: string): void {
		const row = songRows.find((candidate) => candidate.id === id);
		if (!row) return;
		void askToReplace(
			t('songs.deleteTitle', language),
			t('songs.deleteBody', language).replace('%s', row.label),
			[
				{ label: t('songs.deleteConfirm', language), destructive: true, run: () => void commitDelete(id) },
				{ label: t('binder.exportFirst', language), run: () => void handleExport(id), keepOpen: true },
				{ label: t('replace.keep', language) },
			],
		);
	}

	/**
	 * Remove a song and its bytes together, or neither (design §2.1).
	 *
	 * SWITCH FIRST when the target is the song you are in. Its document is still
	 * autosaving, and a delete underneath a live document would be undone by that
	 * document's next write. `switchSong` closes it and flushes its tail, so what
	 * is deleted is a settled record and the survivor is already open.
	 */
	async function commitDelete(id: string): Promise<void> {
		if (id === doc.id) {
			const survivor = songRows.find((row) => row.id !== id);
			if (!survivor) {
				libraryError = t('songs.err.write', language);
				return;
			}
			await switchSong(survivor.id);
		}
		const outcome = await deleteSong(library.plural, id);
		libraryError = outcome.ok ? null : t('songs.err.write', language);
		await refreshSongs();
	}

	const songLibrary = $derived({
		songs: songRows,
		activeId: doc.id,
		// Six localStorage keys have no room for a second song and are not being
		// given one, so on the legacy driver New song and Delete do not render.
		plural: library.plural !== undefined,
		error: libraryError,
		// N.67 step 6. The two sentences a row may have to say about itself,
		// looked up here because the list holds no dictionary: `SongList.svelte`
		// draws, and every string it draws is handed to it.
		unreadable: t('song.unreadable', language),
		newerIlya: t('song.newerIlya', language),
		onopen: (id: string) => void switchSong(id),
		onnew: () => void handleNewSong(),
		onrename: handleRenameSong,
		ondelete: handleDeleteSong,
	});

	/* ── N.67 step 2: the source survives ──────────────────────────── */

	// The stored score, handed to the uploader so it can re-ingest it once at
	// boot. Read from the load result, not from the document: the document
	// carries the score's provenance, never its bytes.
	/**
	 * What the uploader needs to bring a stored score back.
	 *
	 * N.59 step 7: a page read off a picture comes back with the clef and key it
	 * was read with, so the restore never asks again.
	 */
	function restoreFrom(source: SourceBytes | null, page: PageProvenance | null | undefined) {
		if (!source) return null;
		return {
			fileName: source.fileName,
			bytes: source.bytes,
			answers: page ? { clef: page.clef, octaveChange: page.octaveChange, fifths: page.fifths } : null,
		};
	}

	// N.67 step 4b: STATE, because a switch hands the uploader a different
	// song's bytes. The uploader is keyed on `doc.id`, so it remounts and its
	// own restore runs, which is the same path a reload takes and no other.
	let restoreSource = $state(restoreFrom(opened?.source ?? null, opened?.loaded?.record?.source?.page));

	/**
	 * N.108 increment 2. THE UPLOADER INSTANCE, so the one intake can hand it a
	 * file. It is null with the shane wall up, and the call site chains on that.
	 *
	 * `$state`, AND THE COMPILER ASKS FOR IT. `svelte-check` raises
	 * `non_reactive_update` on a plain `let` that a `bind:this` writes, and it
	 * is describing a real consequence rather than a style: the uploader is
	 * inside `{#key doc.id}`, so a song switch unmounts and remounts it and this
	 * binding has to be able to say so. `RootPanel`'s own file input carries the
	 * same note for the same reason.
	 */
	let uploaderEl = $state<ScoreUploader | null>(null);

	/**
	 * Keep the singer's own file, byte for byte.
	 *
	 * Two hashes, doing two different jobs (design §2.3, §2.4): `contentHash`
	 * names these exact bytes and can never go stale, and `fingerprint` answers
	 * "have I met this music before" for the recognition prompt step 4 builds.
	 * Neither is identity; the song id is.
	 */
	async function attachUploadedSource(
		ingested: IngestedScore,
		file: File,
		page?: PageProvenance,
	): Promise<void> {
		// N.59 step 7: on the reader route `file` is already the GREYSCALE INK,
		// so these bytes are the ones the retention ruling keeps and the ones a
		// re-read reproduces exactly. The picture the singer supplied is recorded
		// by name and hash inside `page` rather than kept twice.
		const bytes = await file.arrayBuffer();
		// THE HASHES ARE BEST EFFORT; THE BYTES ARE NOT. `crypto.subtle` is
		// absent outside a secure context, and losing it must cost recognition
		// (a step 4 convenience) and never the singer's file. An empty hash is
		// honestly empty and recomputable at any time from the stored bytes.
		let contentHash = '';
		let fingerprint = '';
		try {
			[contentHash, fingerprint] = await Promise.all([
				hashBytes(bytes),
				fingerprintVocalLine(ingested.result.score.vocalLine),
			]);
		} catch (err) {
			console.error('[Ilya] score kept, but it could not be hashed:', err);
		}
		const importedAt = new Date().toISOString();
		doc.attachSource(
			{ songId: doc.id, fileName: file.name, bytes, byteLength: bytes.byteLength, contentHash, importedAt },
			{
				fileName: file.name,
				byteLength: bytes.byteLength,
				importedAt,
				contentHash,
				fingerprint,
				page: page ?? null,
			},
		);
	}
	function handleLanguageChange(lang: Language) {
		const doSwap = () => {
			language = lang;
			try {
				localStorage.setItem('ilya:language', lang);
			} catch {
				// localStorage unavailable
			}
			// Re-run pipeline to update glosses in the new language
			if (hasResults && doc.inputText.trim().length > 0) {
				runPipeline();
			}
		};
		// If there's content visible, use breath cycle; otherwise swap immediately
		if (hasResults) {
			triggerViewBreathCycle(doSwap);
		} else {
			doSwap();
		}
	}
	function handleMetadataChange(meta: SongMetadata) {
		// A "from score" tag fades on the field's first edit (Kimi's Q1
		// refinement, 2026-07-13). The callers below set the tags AFTER
		// calling this, so their own writes do not clear them.
		const kept = dropTagsForEdits(doc.metadata, meta, doc.fromScoreFields);
		if (kept !== doc.fromScoreFields) setFromScoreFields(kept);
		doc.metadata = meta;
		nameIfUnnamed();
	}

	/**
	 * Design §2.3 layer 3, called where the singer's material arrives: the
	 * metadata, whether typed or filled from a score header, and the poem.
	 *
	 * Not at creation, because a song made a moment ago has nothing to be named
	 * after, and not on every change, because a name the singer has accepted is
	 * theirs and Ilya does not argue with it. `nameFor` holds the rule.
	 */
	function nameIfUnnamed(): void {
		// N.67 step 6. Naming is a WRITE, and a record that could not be read is
		// never written to. Without this the page invents a name for a damaged
		// song on the singer's first keystroke and nothing can ever store it.
		if (doc.readOnly) return;
		if (doc.name !== '') return;
		const named = nameFor(doc.toRecord(), songs);
		if (named !== '') doc.name = named;
	}

	// ── §A.6 metadata provenance ──
	// The transitions live in $lib/metadata-provenance, where vitest can
	// reach them; the document holds the state and the library persists it.
	// Kimi's rulings, 2026-07-13, on filling blanks and fading a tag on a
	// hand edit; Dann's ruling, 2026-08-04, on what a second score does to
	// the first score's identity.
	//
	// The tags are persisted beside the values, in the same record now, so
	// the provenance can no longer come back without its values or the values
	// without their provenance.
	function setFromScoreFields(next: ReadonlySet<MetadataField>) {
		doc.fromScoreFields = next;
	}

	function commitMetadataState(next: MetadataState) {
		handleMetadataChange(next.metadata);
		setFromScoreFields(next.fromScore);
	}

	// Kimi's Q2 safety net: restore the header's fields verbatim (fields
	// the header does not carry are left untouched).
	function handleRevertToScoreHeader() {
		const wm = ingestedScore?.result.score.workMetadata;
		if (!wm) return;
		commitMetadataState(revertToScoreHeader({ metadata: doc.metadata, fromScore: doc.fromScoreFields }, wm));
	}

	// Q4 provenance line (Kimi's §A.28 ruling, 2026-07-13): an arranger
	// detected in the score header surfaces as a small line beneath the
	// Metadata block — never a drawer field — and is omitted entirely when
	// absent. The format label names where it was detected; in practice
	// only MusicXML-parsed scores can carry one (MNX defines no work
	// metadata anywhere, v38 §A.27).
	const PROVENANCE_FORMAT_LABELS: Record<IngestedScore['provenance']['format'], string> = {
		musicxml: 'MusicXML',
		mnx: 'MNX'
	};
	let arrangerProvenance = $derived.by(() => {
		const s = ingestedScore;
		const name = s?.result.score.workMetadata?.arranger;
		if (!s || !name) return null;
		return `${t('meta.arrAbbr', language)} ${name} · ${t('meta.detectedFrom', language)} ${PROVENANCE_FORMAT_LABELS[s.provenance.format]}`;
	});
	/* THE PULL'S PRESS, AND THE SWIPE'S. N.108 increment 1a: it writes nothing.
	   `ilya:drawerCollapsed` is retired with the collapsed state it stored, so
	   this is the one place in the app that had a save site and lost it. */
	function handlePullToggle() {
		drawerRaised = !drawerRaised;
	}
	function handleTabChange(tab: TabId) {
		const oldIndex = TAB_ORDER.indexOf(activeTab);
		const newIndex = TAB_ORDER.indexOf(tab);
		// Compute direction: moving right in tab order → content enters from right
		const direction = newIndex > oldIndex ? 'tab-enter-from-right' : 'tab-enter-from-left';
		/* The desk head hands back a wire id, because it draws four names.
		   `surfaceFor` is what turns it into the two values, and it is the
		   same function the stored-tab migration uses, so an id chosen by
		   hand and an id read out of localStorage cannot disagree. */
		({ destination, studioDocument } = surfaceFor(tab));
		tabTransitionClass = direction;
		try {
			localStorage.setItem('ilya:activeTab', tab);
		} catch {
			// localStorage unavailable
		}
		// Clear animation class after it completes (175ms + buffer)
		setTimeout(() => {
			tabTransitionClass = '';
		}, 200);
	}

	/* ── Heading navigation from Drawer TOC ────────────────── */

	/**
	 * Scroll a lazily-rendered anchor to the top of the reading pane,
	 * robust against post-scroll reflow. LearnContent/GuideContent fire
	 * their ready signal in onMount, before the web fonts swap in and the
	 * large glyph table settles, so a one-shot scrollIntoView undershoots:
	 * the target moves down after the scroll has already landed. This
	 * retries until the element exists, scrolls once, then re-snaps to the
	 * target after the fonts are ready and across a short settle window,
	 * correcting for that late reflow. Caught by Dann's sung-[o] deep link
	 * landing at the Section 3 head instead of the note (2026-07-12).
	 */
	function scrollToAnchor(id: string, smoothFirst = true) {
		let attempts = 0;
		const snap = (behavior: ScrollBehavior) =>
			document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
		const find = () => {
			if (!document.getElementById(id)) {
				if (attempts++ < 90) requestAnimationFrame(find);
				return;
			}
			snap(smoothFirst ? 'smooth' : 'auto');
			// Corrective re-snaps: font swap and late layout shift the
			// target after the first scroll. Instant, so they only close
			// the residual gap rather than re-animating.
			[120, 300, 600].forEach((ms) => setTimeout(() => snap('auto'), ms));
			if (typeof document !== 'undefined' && 'fonts' in document) {
				document.fonts.ready.then(() => snap('auto')).catch(() => {});
			}
		};
		find();
	}

	function handleHeadingNavigate(id: string) {
		activeHeadingId = id;
		history.pushState(null, '', `#${id}`);
		scrollToAnchor(id);
	}

	/* ── Lazy reading content: readiness signal ──────────── */

	let readingContentEpoch = $state(0);

	function handleReadingContentReady() {
		readingContentEpoch++;
		handleHashNavigation();
	}

	/* ── N.40: mirror the language state onto <html lang> ────
	   app.html:2 hardcodes lang="en" and nothing ever wrote the
	   attribute afterwards, so a screen reader announced every French
	   string with English pronunciation rules. It also governs
	   hyphenation and quote rendering.

	   This tracks `language` itself rather than its three writers (the
	   initialiser, handleLanguageChange, and the onMount restore), so
	   no path can miss it.

	   RESIDUAL, stated rather than hidden: the served document is
	   lang="en" until hydration, because the language is restored from
	   localStorage on the client and the server cannot know it. */
	$effect(() => {
		document.documentElement.lang = language;
	});

	/* ── IntersectionObserver for scroll-based active heading ─ */

	$effect(() => {
		void readingContentEpoch; // re-run when lazy reading content mounts
		if (destination === 'studio') return;
		if (!mainContentEl) return;

		// Collect all heading elements with ids inside main-content
		const headings = mainContentEl.querySelectorAll('[id^="learn-"], [id^="guide-"]');
		if (headings.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				// Find the topmost intersecting heading
				const visible = entries
					.filter(e => e.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible.length > 0) {
					activeHeadingId = visible[0].target.id;
				}
			},
			{
				root: mainContentEl,
				rootMargin: '-25% 0px -60% 0px',
				threshold: 0,
			}
		);

		headings.forEach(h => observer.observe(h));
		return () => observer.disconnect();
	});

	/* ── Handle URL hash on page load ──────────────────────── */

	function handleHashNavigation() {
		const hash = window.location.hash.slice(1);
		if (hash) {
			activeHeadingId = hash;
			scrollToAnchor(hash);
		}
	}
	onMount(() => {
		// N.67 step 6. Step 1's storage console line is GONE, not moved: it said
		// it was there because "the storage COPY is step 6's work", and this is
		// step 6. What it logged is now drawn, in both languages.
		bootLines = bootNotices(
			{
				loadFailure: doc.loadFailure,
				persisted: opened?.storage.persisted ?? null,
				// A prerender pass has no vault and nothing to have lost.
				pointer: opened?.pointer ?? { stored: false, found: true, songCount: 0 },
			},
			globalStore(),
		);
		// N.67 step 4b. The library, read once at boot and refreshed after every
		// act that changes it. Not awaited into the boot path: a slow list must
		// not hold up the song the singer is already looking at.
		void refreshSongs();
		// Restore persisted state.
		//
		// N.67 step 0: the six per-song keys are NOT read here any more. The
		// document read them before this component rendered, which is why the
		// pairings guard flag could be deleted rather than moved. What is left
		// in this block is the device preferences, which are not a song and do
		// not move (design §2.2).
		/* MOBILE DETECTION, AND IT RUNS FIRST NOW. N.108 increment 1 moved it
		   above the restores from below the dictionary load, because the open
		   set's migration keeps one station on a phone and has to be told
		   which display it is on. Nothing about the three measures changed;
		   only when they are first taken.

		   `sections.exclusive` IS SET ON THE SAME LINE AS `isMobile` AND IN
		   THE SAME PLACE, which is the point: the drawer's one-station-at-a-
		   time rule and the layout rule are the same rule, and this function is
		   its one owner. Ruled 2026-09-02.

		   N.108 INCREMENT 1a MOVED THE THRESHOLD AND NOT THE MEANING. It was
		   `window.innerWidth < 768`, a round number with no relation to
		   anything this app draws. It is `isDeskLayout` now (`layout.ts`),
		   which is the arithmetic Dann's ruling states: the width at which the
		   520 px drawer and a whole 816 px sheet stop both fitting. That is
		   1400, and below it "the layout is the phone's", which is why this
		   one assignment moves the drawer, the sheet's fit, the desk's padding
		   and the one-station rule together. */
		function checkMobile() {
			isMobile = !isDeskLayout(window.innerWidth);
			sections.exclusive = isMobile;
			isPhone = Math.min(window.innerWidth, window.innerHeight) < 768;
			phonePortrait = window.innerHeight >= window.innerWidth;
		}
		checkMobile();
		try {
			const savedLang = localStorage.getItem('ilya:language');
			if (savedLang === 'en' || savedLang === 'fr') {
				language = savedLang;
			}
			const savedPrefs = localStorage.getItem('ilya:notationPrefs');
			if (savedPrefs) {
				const parsed = JSON.parse(savedPrefs);
				notationPrefs = { ...notationPrefs, ...parsed };
			}
			const savedDiacritics = localStorage.getItem('ilya:showStressDiacritics');
			if (savedDiacritics) {
				showStressDiacritics = JSON.parse(savedDiacritics);
			}
			/* `ilya:drawerCollapsed` IS NOT READ ANY MORE, N.108 increment 1a,
			   and it is not cleared either. Dann retired the collapsed state,
			   so the key has nothing left to say; deleting a singer's stored
			   value would be a write on their device to remove a preference
			   they can no longer express, which is worth less than the byte it
			   frees. It is left where it is, unread. */
			/* N.73 S3 ship two, THE STORED-TAB MIGRATION. Every stored value is
			   named in `restoreSurface`, including the two that mean Studio and
			   the ones that mean nothing, so a value this build does not know
			   lands somewhere on purpose rather than by falling through a
			   four-way string comparison. E.27 §3.4. */
			({ destination, studioDocument } = restoreSurface(localStorage.getItem('ilya:activeTab')));
			/* N.65 ship B, §B.4. THE OPEN SET PERSISTS PER DEVICE, under
			   `ilya:openStations`. An unrecognised or corrupt stored value
			   falls back to the first-run default and does not throw, which
			   is the pattern `restoreSurface` above established for
			   `ilya:activeTab`. NOTATION is never in the stored array, so a
			   reload always returns it to its ruled collapsed default.

			   N.108 INCREMENT 1: THIS CALL IS ALSO THE MIGRATION, and it is
			   the only site that writes `ilya:openStations` at boot. It maps
			   ship B's five ids onto the three-group drawer, drops what has no
			   successor, keeps one station on a phone, and writes back only
			   when something changed. `sections.svelte.ts` holds the whole of
			   that decision; nothing about it is here, because a decision in a
			   `.svelte` file is a decision no vitest in this repository can
			   reach.

			   `isMobile` IS ALREADY SET, which is why `checkMobile` moved
			   above this block. The phone keeps one open station, so the
			   migration has to know which display it landed on, and reading
			   the width a second time here would put a second opinion about
			   the layout rule in the tree. */
			sections.restore(localStorage.getItem(OPEN_STATIONS_KEY), isMobile);
		} catch {
			// localStorage unavailable
		}
		/* N.57's note, SUPERSEDED BY N.108-5. It said `keepSurvivingGlosses()`
		   is never called at boot, because the pipeline has not run, `lines` is
		   empty, and the guard would drop every gloss. IT IS CALLED AT BOOT NOW,
		   and the reason the guard is safe is the order: `transcribeText()`
		   runs `runPipeline()` FIRST, so the guard sees the same words that
		   made the glosses rather than an empty list. */
		/* N.108-5, RULED BY DANN 2026-09-07: "at boot, if the field holds text,
		   transcribe once the dictionary is ready, score or no score."

		   THE DICTIONARY IS NOT LOADED ON THIS LINE, and it is not awaited
		   either: `loadDictionary` below is asynchronous and a boot that waited
		   on it would hold the whole mount. So this almost always returns
		   `wait`, and the effect on `loaderState` spends it a second or two
		   later. Calling it here rather than only in the effect is deliberate:
		   a browser that has the dictionary in IndexedDB can be ready inside
		   this tick, and the boot should not then wait for a state change that
		   has already happened. */
		joinText('boot');
		loadDictionary({
			onStateChange(state) {
				loaderState = state;
			}
		});
		window.addEventListener('resize', checkMobile);
		/* THE PHONE'S DEFAULT IS DECLARED, NOT RESTORED. `drawerRaised` is
		   `false` where it is declared, which is the paper, and there is no
		   stored preference to consult. N.108 increment 1a. */
		handleHashNavigation();
		return () => {
			window.removeEventListener('resize', checkMobile);
			/* N.108-5. A pending quiet pause does not outlive the page. */
			cancelQuietTimer();
		};
	});
</script>

<!-- N.92. The correction keys, bound at the window because the score is
     injected SVG with nothing to hang a handler on, the same reason
     VoiceProfilePane delegates its click. The handler stands down entirely
     unless a note is selected, and inside any text field, so nothing else in
     the app loses a key it already had. -->
<!-- N.92 mobile slice 2. THREE LIVE GESTURES AND NO COLLISION, per the ruled
     tap grammar: a tap chooses, the browser's own pinch reads, and a swipe
     down dismisses. Double tap and drag are unassigned, and press-and-hold
     stays reserved, because the platform trains it for text selection and for
     context menus and neither belongs here.

     Bound at the window for the reason the correction keys already are: the
     score is injected SVG with nothing to hang a handler on. Each of the three
     stands down entirely off a phone. -->
<svelte:window
	on:keydown={handleCorrectionKey}
	on:click={handlePageTap}
	on:pointerdown={handleSurfacePointerDown}
	on:pointerup={handleSurfacePointerUp}
	on:pointercancel={handleSurfacePointerCancel}
/>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;1,400&family=Noto+Serif:ital,wght@0,400;1,400&display=swap" rel="stylesheet" />
</svelte:head>
<!-- N.73 portrait C, ruling 4: THE INTERSTITIAL IS RETIRED. The gate that
     stood here ("Ilya is designed for desktop / Continue anyway") met every
     phone visit and is Fable's audit finding F5. A portrait visit now arrives
     at the fitted page. Nothing replaced it: no residue, no toast, no
     one-time note, because Dann has never ruled where a residue goes. -->
<div class="screen-only">
	<HeaderBar {language} {activeTab} onlanguagechange={handleLanguageChange} />
<!-- N.67 step 4a. A NATIVE <dialog>, Dann's ruling 2026-08-16: bits-ui's
     AlertDialog measured +18.7 KB gzipped for this one thing, against about
     8 KB budgeted for the whole of N.67, and showModal() gives the modality,
     the focus trap, Escape, and the backdrop for nothing.

     THE SAFE ANSWER IS LAST IN THE DOM, which is both where Tab reaches it
     last and where it is drawn rightmost, which is where macOS puts the default
     and where a tired hand goes (Dann's ruling 2026-08-16, after he met this
     dialog at half past four in the morning). It is focused programmatically on
     open, so keyboard and mouse both land on it. This comment said `row-reverse`
     until N.67 step 5: the CSS reversal was removed when DOM order was made the
     visual order, and the actions row below has said so since. Escape resolves
     to the safe answer, because closing without answering changes nothing:
     nothing is mutated before the answer. -->
<!-- N.67 step 5. ONE hidden input serves both tabs' Import controls.
     `accept` is dropped on mobile for N.70's reason exactly: iOS matches by
     registered type and knows nothing of `.ilya`, so it would grey out every
     binder a singer owns, which would make the AirDrop half of the walk
     impossible.

     N.108 INCREMENT 1a: THE TEST IS `isPhone`, NOT `isMobile`, AND THE
     BEHAVIOUR IS UNCHANGED BY THE SWAP. `isMobile` used to mean "narrower than
     768" and now means "the layout is the phone's", which is true on a 1366
     laptop; leaving this on it would have dropped the filter on a desktop file
     picker, which is the opposite of what N.70 ruled ("filtered list on
     desktop, no accept at all on mobile", walked by Dann on his own iPhone).
     `isPhone` is the smallest-side test and it is true on exactly the devices
     N.70 was walked on. Increment 2 replaces it with a coarse-pointer test,
     which the build brief already names. -->
<input
	type="file"
	accept={isPhone ? undefined : '.ilya'}
	bind:this={importInputEl}
	class="binder-input"
	onchange={(e) => {
		const input = e.currentTarget;
		const file = input.files?.[0];
		input.value = '';
		if (file) void handleImportFile(file);
	}}
/>

<dialog
	class="replace-dialog"
	bind:this={replaceDialogEl}
	oncancel={() => settleCollision('mine')}
	onclose={() => {
		// GUARDED ON THE DIALOG BEING SHUT. One collision's close event can arrive
		// after the next collision's dialog has already opened, and unguarded it
		// would blank the question now on screen and answer it for the singer.
		if (replaceDialogEl?.open) return;
		pendingArrival = null;
		pendingConfirm = null;
		settleCollision('mine');
	}}
	aria-labelledby="replace-title"
>
	{#if pendingConfirm}
		<h2 id="replace-title">{pendingConfirm.title}</h2>
		<p>{pendingConfirm.body}</p>
		<!-- DOM ORDER IS THE VISUAL ORDER. It used to be reversed in CSS, which
		     told a screen reader one order and showed a sighted singer another.
		     Keep is last, so it is rightmost where a tired hand goes, and it is
		     focused programmatically on open. -->
		<div class="replace-actions">
			{#each pendingConfirm.answers.slice(0, -1) as answer (answer.label)}
				<button
					type="button"
					class:replace-destructive={answer.destructive}
					onclick={() => answerWith(answer)}
				>
					{answer.label}
				</button>
			{/each}
			{#if safeAnswer}
				<button type="button" bind:this={keepButtonEl} onclick={() => answerWith(safeAnswer)}>
					{safeAnswer.label}
				</button>
			{/if}
		</div>
	{/if}
</dialog>

<InstallPrompt {language} />
</div>
<!-- ONE PAINTED DESK, UNDER THE DRAWER AND THE PAPER BOTH (N.108 increment
     1a). It carries the tab class now, which `.main-content` below used to
     carry alone, and the four per-destination surrounds moved up here with it.

     WHY IT MOVED. Dann ruled the slab away on 2026-09-02 so the three groups
     float on the desk; that only works if the desk runs under them. Increment
     1 had the drawer paint its own copy of the surround, and the copy showed
     the wrong desk under the Score markup document, which is what he saw. Two
     boxes agreeing by hand is the defect; one box cannot disagree with itself. -->
<div class="app-content tab-{activeTab} {viewBreathClass}">
	<Drawer
		width={drawerWidth}
		raised={drawerRaised}
		{isMobile}
		{language}
		{destination}
		{activeTab}
		{activeHeadingId}
		takeoverActive={calibrating}
		onexittakeover={exitCalibration}
		metadataOpen={sections.has(STATION_IDS.metadata)}
		onmetadatatoggle={() => sections.toggle(STATION_IDS.metadata)}
		ontogglepull={handlePullToggle}
		gesturesBlocked={loupeOpen}
		ontabchange={handleTabChange}
		onheadingnavigate={handleHeadingNavigate}
	>
			<!-- METADATA'S BODY (N.108 increment 1). It was `pieceAnchor`, the
			     drawer's pinned top region; there is no pinned region now and
			     no station row either. The Piece band carries the affordance,
			     `Drawer.svelte` draws it, and this is what it opens. The props
			     are unchanged except the two the header owned. -->
			{#snippet metadataBody()}
				<MetadataFields
					metadata={doc.metadata}
					{language}
					onchange={handleMetadataChange}
					fromScore={doc.fromScoreFields}
					onrevert={ingestedScore?.result.score.workMetadata ? handleRevertToScoreHeader : undefined}
				/>
				{#if arrangerProvenance}
					<!-- Q4 provenance line (Kimi §A.28): beneath the Metadata block,
					     never a drawer field, omitted when absent. Clamped to one
					     line (Dann's ruling, 2026-07-13, on the Gretchen IMSLP-blob
					     evidence): verbatim, never parsed, but the drawer stays
					     quiet; title carries the full string on hover. Its rule
					     travels with it, N.73 S3, for the same reason it travelled
					     into RootPanel at N.73 S2: Svelte scopes a rule to the
					     component that authors the markup. -->
					<p class="shane-provenance" title={arrangerProvenance}>{arrangerProvenance}</p>
				{/if}
			{/snippet}
			<!-- THE CALIBRATION TAKEOVER (N.73 S3 ship one). The wizard MOVED
			     here from the shane panel; not one line of it is rewritten. Its
			     props are the ones it already had, in the order it already had
			     them. -->
			{#snippet voiceTakeover()}
				{#if INCLUDE_SHANE}
					<div class="takeover-panel">
					<CalibrationWizard
						{language}
						{scoreRenders}
						bind:collapsed={wizardCollapsed}
						onActiveProfileChange={(f, name, characteristics) => {
							shaneFormants = f;
							shaneVoiceName = name;
							shaneCharacteristics = characteristics;
						}}
						onOpenLearnNote={() => {
							// The sung-[o] glyph's deep link: Learn tab, then the
							// note's anchor. handleHeadingNavigate already retries
							// while the lazy Learn content mounts. The takeover is
							// left first, because Learn is a different destination
							// and a takeover held open behind it would be waiting
							// on a drawer the singer is no longer in.
							exitCalibration();
							handleTabChange('learn');
							handleHeadingNavigate('learn-u3-note-o');
						}}
					/>
					</div>
				{/if}
			{/snippet}
			<!-- ═══ THE PIECE GROUP (N.108 increment 1, NARROWED BY N.108-5).
			     Repertoire, Export and import, and the name and Metadata that
			     the band itself carries. THE INTAKE LEFT for a band of its
			     own, ruled by Dann 2026-09-07; `RootPanel` is still this
			     group's contents and nothing else. -->
			{#snippet pieceGroup()}
				<RootPanel
					{language}
					onexport={() => void handleExport()}
					onimport={() => importInputEl?.click()}
					onexportall={() => void handleExportAll()}
					{songLibrary}
					{sections}
				/>
			{/snippet}
			<!-- ═══ THE INPUT GROUP (N.108-5). RULED BY DANN 2026-09-07: the
			     intake becomes its own group band between Piece and Text,
			     named INPUT, painted sage like Text, and it "holds the whole
			     intake frame (field, receipts, Choose a file, the drop hint,
			     the button) and nothing else."

			     THE WIRING IS THE SAME WIRING. Every prop below was on
			     `RootPanel` an hour ago and is passed here unchanged, and the
			     `sourceScore` snippet came across verbatim with its comments.
			     Nothing about what the intake does changed; only which band it
			     stands under. -->
			{#snippet inputGroup()}
				<IntakePanel
					inputText={doc.inputText}
					{loaderState}
					{canTranscribe}
					{transcribeError}
					{language}
					oninput={handleInput}
					ontranscribe={handleTranscribe}
					onclear={handleClear}
					{wordCount}
					{hasResults}
					isMobile={isPhone}
					score={ingestedScore ? { fileName: ingestedScore.fileName } : null}
					onfile={(file) => void uploaderEl?.take(file)}
					onclearscore={handleClearScore}
					syllablesPlaced={placedSlotCount}
					syllablesTotal={slotQueue.length}
				>
					{#snippet sourceScore()}
						{#if INCLUDE_SHANE}
							<!-- The drop surface sits directly beneath the textarea it
							     twins: N.73 S2 made text intake and score intake one
							     Source region. The EngravingControls panel is removed
							     and the stave target is fixed (Dann's ruling,
							     2026-07-15; Kimi Q1 and Q2). -->
							<!-- N.67 step 4b. KEYED ON THE OPEN SONG. A switch replaces
							     the document, and this makes the uploader replace itself
							     with it, so the new song's stored score comes back
							     through the uploader's OWN restore: the same path a
							     reload takes, and no second one. -->
							<!-- N.108 increment 1a. `isMobile={isPhone}`, and the prop
							     name is the uploader's, not this file's. It feeds
							     `acceptList`, which is N.70's ruling and not a layout
							     question; see the binder input above for the whole
							     reason. -->
							<!-- N.108 increment 2. `bind:this`, because the one intake
							     hands files IN: `RootPanel`'s field takes the drop and
							     the pick and calls `take()` on this instance, which
							     sniffs and routes. `isMobile` left, because the picker
							     N.70 governs left with it.

							     THE BINDING IS OPTIONAL-CHAINED AT ITS ONE CALL SITE,
							     which is not defensive tidying: this component is
							     behind `INCLUDE_SHANE`, so with the wall up there is
							     no instance to call and the field's file handlers do
							     nothing, which is what a walled-off score path should
							     do. -->
							{#key doc.id}
								<ScoreUploader
									bind:this={uploaderEl}
									{language}
									restore={restoreSource}
									oningested={(ingested, file, origin, page) =>
										void handleArrival(ingested, file, origin, page)}
									onpoem={(text) => handleInput(text)}
								/>
							{/key}
							{#if noLyricsFile}
								<!-- N.55a's courtesy message (Dann, E.47). It lives in the
								     DRAWER and not on the page because it names the FILE, and
								     a file name dates a printed study sheet to an export
								     rather than to a song. Unstyled on purpose for the first
								     walk. -->
								<p class="shane-no-lyrics">{t('upload.banner.noLyrics', language).replace('%s', noLyricsFile)}</p>
							{/if}
						{/if}
					{/snippet}
					<!-- N.114. THE SYLLABLE LINE, RULED BY DANN 2026-09-07 and
					     2026-09-09 out of Score markup and under the poem
					     field. A snippet for the same reason `sourceScore` is
					     one: the four inputs are all here, beside
					     `placeArmedSyllable`, which is the other half of the
					     same gesture, and `IntakePanel` owns none of them.

					     `clipped` IS THE PANEL'S TO SAY. It owns the
					     disclosure, so it asks for the collapsed size or the
					     open one and the station draws it; the queue, the
					     pairings and the cursor are the same in both.

					     NOTHING ABOUT THE GESTURE CHANGED. `oncursor` is the
					     assignment it always was, placement is still
					     `handleLoupePick`'s, and this component still never
					     edits a syllable. -->
					{#snippet syllableLine(clipped: boolean)}
						<SyllableStation
							slots={slotQueue}
							pairings={shownPairings}
							cursor={pairingCursor}
							{language}
							oncursor={(i) => (pairingCursor = i)}
							{clipped}
						/>
					{/snippet}
				</IntakePanel>
			{/snippet}
			<!-- ═══ THE SCORE MARKUP GROUP (N.108 increment 1). Corrections and
			     Voice, in that order. It was `shanePanel`, a column of score
			     work with the voice pinned below it in its own anchor.

			     UNDERLAY IS GONE FROM THIS GROUP, N.114, RULED BY DANN
			     2026-09-07: the queue and the SABB live under the poem field,
			     inside the Input band, where the text they belong to is. The
			     station is deleted rather than emptied, and `underlay` is out
			     of `STATION_IDS` with it, so nothing here can be stored open.
			     `IntakePanel`'s `syllableLine` snippet, above, is where the
			     same component renders now.

			     The lyric VERBS never moved: they are in Corrections with the
			     note they act on, because they render only when a paired note
			     is selected, and their label and their placed-syllable counter
			     stay with them. That is where N.65 ship B put the count and
			     N.114 leaves it there.

			     THE NOTICES SIT WHERE THEY SAT, between Corrections and the
			     voice, in the order they had. Where a notice belongs in a
			     three-group map is not ruled, and this ship does not decide it.

			     CORRECTIONS KEEPS TODAY'S GATE: it is drawn only when a score
			     has been read, which is what the score capability's own wall
			     already did. -->
			{#snippet scoreGroup()}
				{#if INCLUDE_SHANE}
					<!-- N.92 CORRECTIONS. It rides inside the score capability's
					     own wall and shows nothing at all until there is a read
					     to correct, so a wall-closed build and a text-only
					     session are both untouched.

					     SLICE 4 RE-CUT IT INTO THE PHONE'S FOUR STATIONS.
					     `CorrectionControls` is deleted: it carried the same
					     verbs in a different order under different labels, and
					     two surfaces that mean the same thing are two things to
					     learn. This is the SAME COMPONENT the dock renders, in
					     its panel variant, so the desktop and the phone cannot
					     drift.

					     THE SEMITONE VERBS DIED HERE. They were retired for the
					     phone by Dann's ruling of 2026-08-24 and the drawer went
					     on showing them; the re-cut is where that ended. The
					     spelling policy is what answers a semitone now: down a
					     semitone from B natural respells as A sharp, and the
					     three accidental verbs reach every spelling.

					     N.108 gives it a station header and a chevron, which it
					     did not have, because every station in a frame retracts.
					     The surface's own CORRECTIONS heading is gated to the
					     dock in the same ship, so the name is drawn once. -->
					{#if ingestedScore}
						<div class="station">
						<StationHeader
							label={t('loupe.station.corrections', language)}
							expanded={sections.has(STATION_IDS.corrections)}
							ontoggle={() => sections.toggle(STATION_IDS.corrections)}
							controls="station-corrections"
						/>
						{#if sections.has(STATION_IDS.corrections)}
						<div class="station-body" id="station-corrections">
						<CorrectionSurface
							variant="panel"
							open={loupeOpen}
							{language}
							readout={readoutLine}
							{undoLabel}
							{redoLabel}
							{selectedBase}
							{selectedDotted}
							shiftDisabled={dockShiftDisabled}
							onundo={handleUndo}
							onredo={handleRedo}
							ondismiss={dismissLoupe}
							onwalk={handleMove}
							onbase={handleDurationCell}
							ondot={handleDotCell}
							onstep={handleStep}
							onoctave={handleOctave}
							onaccidental={handleAccidental}
							ondelete={handleDeleteNote}
							onshift={handleDockShift}
							onmelisma={handleMelisma}
							{selectedMelisma}
							{melismaDisabled}
							{inGap}
							{armedBase}
							armedDots={armedDots > 0}
							arrivalName={gapAnchorName}
							{selectedIsRest}
							{selectedTied}
							{tieAvailable}
							onrest={handleRest}
							ontie={handleTie}
							onrestore={handleRestoreNote}
							{restoreAvailable}
							placed={placedSlotCount}
							total={slotQueue.length}
							{tupletOpen}
							{tupletDef}
							{tupletFits}
							onopentuplet={openTuplet}
							onclosetuplet={closeTuplet}
							ontupletdef={applyTupletDefinition}
							{onhold}
						/>
						<!-- N.108 increment 1a, ruled by Dann 2026-09-02: "You have
						     corrected 2 notes." renders inside the Corrections
						     station body, not under Voice. It was in the notices
						     block at the foot of the group, which put a sentence
						     about corrections three stations away from the surface
						     that made them. Nothing about the sentence changed. -->
						{#if correctedCount > 0}
							<p class="shane-storage-notice">
								{correctedCount === 1
									? t('correct.countOne', language)
									: t('correct.count', language).replace('%s', String(correctedCount))}
							</p>
						{/if}
						</div>
						{/if}
						</div>
					{/if}
					<!-- ── VOICE. N.108: the anchor line is inside a station now,
					     and the station is the last one in Score markup. It was
					     the drawer's pinned BOTTOM region, one line with its own
					     lavender rule; the group's band carries that hue one step
					     down, so the rule of 2026-08-19 survives in the band and
					     no lavender is lost.

					     THE STATION RETRACTS, WHICH THE ANCHOR DID NOT. Ship B
					     gave the voice a header and no chevron on Dann's explicit
					     ruling: "it has a header and no contents, and collapsing
					     it would hide Calibrate, the only entry to the ritual, for
					     no height." The three-frame map answers that ruling rather
					     than overriding it: Calibrate is the station's CONTENTS
					     now, not its header, and every station in a frame
					     retracts. Shut, the row costs one line and says the voice
					     is there; open, Calibrate is one press away. That is a
					     change to a ratified affordance and it is reported.

					     THE CALIBRATION WIZARD IS NOT HERE. It is the drawer's one
					     takeover, entered from Calibrate inside this station, and
					     rendered from the `voiceTakeover` snippet above. The GUI
					     spec's defect F2 was that its `welcome` plea sat inside
					     this scroll, reading voice at a singer who had asked for an
					     Instrument panel
					     (`fable-gui-audit-and-spec_r1_2026-08-18.md:41-44`).

					     `voiceCalibrated` is the wizard's own predicate, read from
					     `profileStore.ts`, so this line and the wizard cannot
					     disagree. -->
					<div class="station">
						<StationHeader
							label={t('voice.heading', language)}
							expanded={sections.has(STATION_IDS.voice)}
							ontoggle={() => sections.toggle(STATION_IDS.voice)}
							controls="station-voice"
						/>
						{#if sections.has(STATION_IDS.voice)}
							<div class="station-body" id="station-voice">
								<VoiceAnchor
									voiceName={shaneVoiceName}
									calibrated={voiceCalibrated}
									{language}
									oncalibrate={enterCalibration}
								/>
							</div>
						{/if}
					</div>
					<!-- ── THE NOTICES. Unstyled on purpose, as they have always
					     been, and in the order they had among themselves.

					     THEY ARE LAST IN THE GROUP, which is where they were:
					     they sat at the foot of `.shane-panel`, and the voice
					     that followed them was a PINNED anchor outside that
					     panel, so "after the panel" and "last in the scroll" were
					     the same place. The voice is a station in this group now,
					     so keeping them physically before it would move them up.
					     They keep the position they had.

					     THE ALTERNATIVE WAS MEASURED AND REJECTED: before Voice,
					     a first-run storage notice with no score read lands
					     directly under the SCORE MARKUP band, where a station
					     name belongs, and reads as the group's first entry. Seen
					     at 430 x 932 on the built site.

					     They are not stations, so they carry the group's inset
					     themselves rather than borrowing the station box's;
					     `.group-notices` is that inset and the 6px column
					     `.shane-panel` used to give them, and nothing else.

					     WHERE A NOTICE BELONGS IN A THREE-GROUP MAP IS NOT RULED,
					     and two of these are not the Score markup group's at all:
					     `binderError` and `binderNotice` report on Export and
					     import, which is in Piece. This ship keeps them together
					     where they were rather than splitting them across two
					     groups on its own authority. -->
					<div class="group-notices">
					{#if ingestedScore}
						<!-- N.97. A correction whose event id no longer resolves after a
						     re-read did not land, and a correction that fails to land must
						     never fail silently. The DRAWER says so and the paper carries no
						     mark, which is E.47's strike applied here. Kept verbatim from the
						     palette this re-cut replaces. -->
						{#if orphanCount > 0}
							<p class="shane-storage-notice">
								{t('notation.orphans', language).replace('%s', String(orphanCount))}
							</p>
						{/if}
					{/if}
					{#if binderError}
						<!-- N.67 step 5. The file is untouched in every failure, which is
						     why all three sentences end the same way. -->
						<p class="shane-storage-notice">{binderError}</p>
					{/if}
					{#if binderNotice}
						<!-- N.67 step 5, the remainder. What an import ADDED. A "take the
						     one in this file" adds nothing, so it says nothing: the song it
						     overwrote moves to the top of the list, which is the change
						     the singer can see. -->
						<p class="shane-storage-notice">{binderNotice}</p>
					{/if}
					{#if orphanedCount > 0}
						<!-- N.67 step 3. Reported, not acted on: the placements are
						     KEPT and this only says how many have no note to sit on in
						     the score just uploaded. Twins the drift surface in
						     restraint, and unstyled on purpose like its neighbours. -->
						<p class="shane-storage-notice">
							{t('station.orphaned', language).replace('%s', String(orphanedCount))}
						</p>
					{/if}
					{#if slotQueue.length > 0 && ingestedScore}
						<!-- N.67 step 3, design §2.6. The ONLY thing that may destroy a
						     placement, and it is the singer pressing it. An upload never
						     rebuilds. Placed after Shift Lyrics because it undoes what
						     Shift Lyrics does, and it is the last resort of the two. -->
						<button type="button" class="start-over" onclick={handleStartPlacementOver}>
							{t('station.startOver', language)}
						</button>
					{/if}
					<!-- R5, N.27: no save site is silent. N.67 step 0 made this the
					     WHOLE song's report rather than the pairing map's alone, and
					     N.67 step 6 finalized what it says: quota with its figures,
					     eviction, no storage at all, the partial-loss oddity, an
					     unreadable record, and a record from a newer Ilya. WHICH
					     sentences and in WHAT ORDER is `notices.ts`, where a gate can
					     reach it. Unstyled on purpose, matching its neighbours. -->
					{#each storageLines as line}
						<p class="shane-storage-notice">{fillNotice(t(line.key, language), line.args)}</p>
					{/each}
					{#if doc.remoteChange}
						<!-- N.67 step 1, socket §4.1. Last-write-wins WITH the notice.
						     A clean tab reloads silently and never reaches here; this
						     is only the tab that had unsaved work, and its work is
						     kept. Placed beside the storage notice because that is
						     where storage speaks today. -->
						<p class="shane-storage-notice">{t('storage.otherTab', language)}</p>
					{/if}
					</div>
				{/if}
			{/snippet}
			<!-- ═══ THE TEXT GROUP (N.108 increment 1). Notation and Analysis,
			     and only those two: the map Dann ruled 2026-09-02 gives Text
			     exactly them. Both were somewhere else in the N.73 S3 column,
			     Notation pinned above the scroll and Analysis first inside it,
			     and neither moved because of anything wrong with where it was.
			     They are together because they are both text work. -->
			{#snippet textGroup()}
				<!-- NOTATION (item N.7). ONE instance, on both of Studio's
				     documents, and it is the first station in the TEXT group.
				     It was pinned BELOW the scroll until N.73 S3 and pinned
				     ABOVE it after (the E.29 shape E.36 §1.4 replaced, ratified
				     by Dann 2026-08-19). N.108 unpins it: nothing in the drawer
				     is pinned, and Notation sits with Analysis because both are
				     text work.

				     THE 2026-08-06 RULING IS UNTOUCHED BY THE MOVE: it is
				     predictable and within a thumb's reach, and being the first
				     station of the second group is both.
				     The state was always document-level and persisted (the notationPrefs and
				     openSyllabification declarations and their writers) and Fit obeyed it:
				     both reach VoiceProfilePane through its own props of
				     those names. Only the CONTROL was tab-scoped, which made its
				     placement lie about its scope.

				     Rendering it once rather than once per panel is Dann's
				     improvement on my first pass: two instances sharing state
				     can drift, and one cannot.

				     THE ACCENT IS SAGE, UNCONDITIONALLY. N.73 S3 ship two settled
				     it, and the reasoning is in NotationFields' own `accent`
				     prop comment rather than repeated here. Dann's ruling of
				     2026-08-06, that the colour follows the tab, is superseded
				     by two later ones: S2's invariant that nothing in the drawer
				     changes when the singer flips the pair, and the S0 slate's
				     ruling 3 of 2026-08-19, which keeps lavender in Studio to
				     the voice anchor and the calibration surfaces.

				     KNOWN GAP, accepted and unnumbered: the stress-acutes toggle
				     will appear on Fit and change nothing there, because
				     showStressDiacritics never reaches VoiceProfilePane
				     (it is never given that prop). Fit's IPA stress mark is a separate and
				     unconditional thing (pipeline.ts:711). -->
				<NotationFields
					{notationPrefs}
					{showStressDiacritics}
					openSyllabification={doc.openSyllabification}
					{language}
					accent="var(--sage)"
					onnotationchange={handleNotationChange}
					onstressdiacriticschange={handleStressDiacriticsChange}
					onopensyllabificationchange={handleOpenSyllabificationChange}
					expanded={sections.has(STATION_IDS.notation)}
					onexpandedchange={() => sections.toggle(STATION_IDS.notation)}
				/>
				<AnalysisStation
					{loaderState}
					{hasResults}
					{transcribeMs}
					{language}
					{showInspector}
					expanded={sections.has(STATION_IDS.analysis)}
					ontoggle={() => sections.toggle(STATION_IDS.analysis)}
				>
				{#snippet consoleContent()}
					{#if selectedWord}
						{@const wordKey = `${selectedWord.lineIndex}-${selectedWord.wordIndex}`}
						{@const wordYoToggles = (() => {
							const prefix = `${wordKey}-`;
							const m = new Map<number, import('$lib/types').YoToggle>();
							for (const [k, v] of yoToggles) {
								if (k.startsWith(prefix)) {
									const ci = parseInt(k.substring(prefix.length), 10);
									if (!isNaN(ci)) m.set(ci, v);
								}
							}
							return m;
						})()}
						<InspectorPanel
							word={selectedWord}
							{language}
							{notationPrefs}
							openSyllabification={doc.openSyllabification}
							{showStressDiacritics}
							syllableOverride={syllableOverrides.get(wordKey) ?? null}
							spotReconstituted={spotReconstitution.has(wordKey)}
							promotedFromClitic={userStressOverrides.get(wordKey)?.promotedFromClitic ?? false}
							yoCharToggles={wordYoToggles}
							onspotrecontoggle={handleSpotReconToggle}
							onstressassign={handleStressAssign}
							onstressrevert={handleStressRevert}
							onyochartoggle={handleYoCharToggle}
							onsyllableoverride={(override) => handleSyllableOverride(selectedWord!.lineIndex, selectedWord!.wordIndex, override)}
							onsyllableoverrideclear={() => handleSyllableOverrideClear(selectedWord!.lineIndex, selectedWord!.wordIndex)}
							onreset={handleReset}
							glossOverride={doc.glossOverrides.get(wordKey)}
							onglossoverride={handleGlossOverride}
						/>
					{/if}
				{/snippet}
				</AnalysisStation>
			{/snippet}
	</Drawer>
	<main
		class="main-content tab-{activeTab} {paperBreathClass} {tabTransitionClass}"
		class:reading-mode={isReadingMode}
		class:loupe-up={loupeOpen}
		bind:this={mainContentEl}
		tabindex="0"
	>
		<!-- THE DESK HEAD (N.73 S1 §2.2). One line across the top of the desk,
		     above the sheet, on every display. It is the cure for audit finding
		     F4: with the tab bar living inside the drawer, closing the drawer
		     took every destination with it. -->
		<DeskHead {activeTab} {language} ontabchange={handleTabChange} />
		{#if destination === 'studio' && studioDocument === 'transcription'}
			<!-- ONE Paper, rendered from one snippet in both branches. Two call
			     sites for the same component drift, and a drifted prop list here
			     would mean the phone and the desk stopped showing the same
			     document. -->
			{#snippet transcriptionPaper()}
				<Paper lines={effectiveLines} {notationPrefs} {language} metadata={doc.metadata} pageSize="letter" {isMobile} {showStressDiacritics} {spotReconstitution} glossOverrides={doc.glossOverrides} onwordclick={handleWordClick} />
			{/snippet}
			{#if isMobile}
				<!-- N.73 portrait C. The stage holds both views. The one that is
				     not showing goes off-stage rather than to display:none,
				     because TitleHeader measures itself with bind:offsetHeight
				     and a display:none element measures 0, which would
				     re-paginate the document on every tap. -->
				<div class="portrait-stage">
					<div class="stage-page" class:offstage={portraitView === 'aid'}>
						{@render transcriptionPaper()}
						{#if effectiveLines.length > 0}
							<!-- ONE labelled action, UNDER the page and never on it.
							     It sits in the flow rather than fixed to the bottom
							     of the screen: N.73 S1 deleted the last fixed bottom
							     furniture and gave the phone back its 92px, and this
							     is not the place to put furniture back. -->
							<button
								class="portrait-action"
								type="button"
								onclick={() => void showPortraitView('aid')}
							>
								{t('portrait.read', language)}
								<span class="portrait-action-chevron" aria-hidden="true">&rsaquo;</span>
							</button>
						{/if}
					</div>
					{#if effectiveLines.length > 0}
						<div class="stage-aid" class:offstage={portraitView === 'page'}>
							<ReadingAid
								lines={effectiveLines}
								{notationPrefs}
								{language}
								{showStressDiacritics}
								{spotReconstitution}
								glossOverrides={doc.glossOverrides}
								onreturn={() => void showPortraitView('page')}
							/>
						</div>
					{/if}
				</div>
			{:else}
				{@render transcriptionPaper()}
			{/if}
		{:else if destination === 'studio'}
			<!-- The Voice Profile envelope (handover v30 §C.1, page furniture
			     per Dann's review ruling): the interim main pane, a fixed
			     letter page with the Paper system's header and footer. The
			     wizard in the drawer publishes the active voice's readings
			     and name into the state above. -->
			<!-- N.10 (Dann, 7 August): Fit consumes Transcription's output.
			     `lines` is passed RAW, not `effectiveLines` — the Fit resolver
			     applies its own open syllabification, so the display view would
			     be sliced twice. -->
			<VoiceProfilePane
				{isMobile}
				transcribedLines={lines}
				pairings={shownPairings}
				{blankUnderlay}
				onnotepick={handleNotePick}
				{selectedEventId}
				formants={shaneFormants}
				voiceName={shaneVoiceName}
				characteristics={shaneCharacteristics}
				{language}
				ingested={correctedScore}
				scoreTitle={doc.metadata.title}
				{engraving}
				{notationPrefs}
				openSyllabification={doc.openSyllabification}
				onrendered={handleScoreRendered}
				onpagesdrawn={handlePagesDrawn}
			/>
		{:else}
			<ReadingPaper {language}>
				{#snippet content()}
					{#if destination === 'learn'}
						{#await import('$lib/components/Reading/LearnContent.svelte') then mod}
							{@const LearnContent = mod.default}
							<LearnContent {language} onready={handleReadingContentReady} />
						{/await}
					{:else}
						{#await import('$lib/components/Reading/GuideContent.svelte') then mod}
							{@const GuideContent = mod.default}
							<GuideContent {language} onready={handleReadingContentReady} />
						{/await}
					{/if}
				{/snippet}
			</ReadingPaper>
		{/if}
		<!-- PRINT, UNDER THE SHEET AND FLUSH WITH ITS LEFT EDGE. N.65, and it
		     is Dann's amended ruling of 2026-08-21 rather than his first one.
		     He first asked for it beside the pair: "I want it to float next to
		     the Transcribe / Score Markup selector." Then he walked the desk
		     head on a phone and found no room: "On mobile it looks like there
		     is not enough room to insert a print button where i suggested.
		     what if we add it under the WYSIWYG flush left? Visually it can
		     parallel the Transcription button above the WYSIWYG." He was given
		     four placements with a critique of each and chose this one KNOWING
		     IT LOSES THE DESK HEAD'S STICKINESS.

		     STUDIO ONLY, RULED BY DANN THE SAME DAY, reversing his own "always
		     live on all four" of the night before: "we will simply not offer a
		     Print button for the Learn or Guide sections." A singer can still
		     print those pages from the browser's own menu; Ilya does not
		     invite it. `destination === 'studio'` is the whole test, so it
		     covers the transcription and the marked score and nothing else.

		     ALWAYS LIVE WHERE IT APPEARS. No disabled state and no greying,
		     which is why `printDisabled` left with it.

		     CONTRACT §6's "do not put a control on the paper" GOVERNS THE
		     SHEET. Below the sheet is the desk, which is where the desk head
		     already stands. -->
		{#if destination === 'studio'}
			<div class="sheet-print">
				<button class="sheet-print-btn" type="button" onclick={handlePrint}>
					{t('input.print', language)}
				</button>
			</div>
		{/if}
	</main>
</div>
<!-- N.92 mobile slice 2. THE LOUPE AND THE DOCK, siblings of the drawer and
     of the desk, outside `.app-content` because they answer to the viewport
     rather than to the desk's flow. The drawer's E.36 §1.4 anchors are
     untouched: this is a second surface, not the drawer re-anchored.

     THEY ARRIVE AS ONE MOTION AND LEAVE AS ONE, a single 180 ms fade on both,
     which is what teaches the singer they are one object on the first raise
     rather than on the first dismissal. -->
{#if loupeAvailable && loupeOpen && cursor}
	<Loupe
		open={loupeOpen}
		measureLabel={heldMeasureLabel}
		noteLine={loupeNoteLine}
		measureIndex={heldMeasureIndex}
		ownIds={heldMeasureIds}
		nextIds={nextMeasureIds}
		{selectedEventId}
		revision={pageRevision}
		{language}
		fill={heldFill}
		onpick={handleLoupePick}
		dockInset={loupeInset}
		dockHeight={loupeFoot}
		{isPhone}
	/>
	{#if isPhone}
	<CorrectionSurface
		{language}
		portrait={phonePortrait}
		readout={readoutLine}
		{undoLabel}
		{redoLabel}
		{selectedBase}
		{selectedDotted}
		shiftDisabled={dockShiftDisabled}
		onundo={handleUndo}
		onredo={handleRedo}
		ondismiss={dismissLoupe}
		onwalk={handleMove}
		onbase={handleDurationCell}
		ondot={handleDotCell}
		onstep={handleStep}
		onoctave={handleOctave}
		onaccidental={handleAccidental}
		ondelete={handleDeleteNote}
		onshift={handleDockShift}
		onmelisma={handleMelisma}
		{selectedMelisma}
		{melismaDisabled}
		onheight={(h) => (dockHeight = h)}
		{inGap}
		{armedBase}
		armedDots={armedDots > 0}
		arrivalName={gapAnchorName}
		{selectedIsRest}
		{selectedTied}
		{tieAvailable}
		onrest={handleRest}
		ontie={handleTie}
		onrestore={handleRestoreNote}
		{restoreAvailable}
		placed={placedSlotCount}
		total={slotQueue.length}
		{tupletOpen}
		{tupletDef}
		{tupletFits}
		onopentuplet={openTuplet}
		onclosetuplet={closeTuplet}
		ontupletdef={applyTupletDefinition}
		{onhold}
	/>
	{/if}
{/if}
{#if updated.current && !updateDismissed}
	<div class="update-toast screen-only" role="status">
		<span class="update-toast-text">{t('update.notice', language)}</span>
		<!-- N.54: location.reload() alone lands the singer back on the OLD build.
		     static/sw.js serves the app shell stale-while-revalidate, so a plain
		     reload returns the cached document and only then fetches the new one.
		     Dropping the caches that worker owns (same 'ilya-' prefix it filters
		     on in its own activate handler) sends the reload to the network. -->
		<button
			class="update-toast-action"
			onclick={async () => {
				try {
					const keys = await caches.keys();
					await Promise.all(
						keys.filter((k) => k.startsWith('ilya-')).map((k) => caches.delete(k))
					);
				} catch {
					// No CacheStorage, or it refused. Reload anyway: no worse than before.
				}
				location.reload();
			}}>{t('update.action', language)}</button
		>
		<button class="update-toast-dismiss" aria-label={t('update.dismiss', language)} onclick={() => (updateDismissed = true)}>×</button>
	</div>
{/if}

<style>
	/* ── `.shane-panel` IS GONE (N.108 increment 1) ──────────
	   It was the Fit drawer's column, then the score work's column inside the
	   one Studio drawer: 1rem sides, a 6px gap, and a 40px foot. All three are
	   the Score markup GROUP's now, and the group is `Drawer.svelte`'s. The
	   wrapper had to go rather than be restyled, because a box between the
	   group and its stations puts the band's adjacency rule out of reach and
	   the stations would lose their boundaries.

	   ITS LAVENDER FOCUS RING SURVIVED THE MOVE. That rule was Dann's
	   2026-07-13 arrangement, so a Fit field's focus ring mirrors the sage one
	   in purple; it is declared on `.group-score` in `Drawer.svelte` now,
	   which is the same set of surfaces under a name that describes them.

	   `.group-notices` below is what is left of the column: the inset and the
	   6px, for the notices, which are not stations and have no station box. */
	/* NO PADDING, AND `:empty` CANNOT BE USED TO GIVE IT ANY. Svelte renders
	   each `{#if}` as a comment node, so this box is never `:empty` even when
	   it draws nothing, and a `:not(:empty)` rule spent 12px on every drawer
	   that has no notices. MEASURED at 1366 x 768 before it was removed.
	   Nothing needs the padding: the gap between the last notice and the
	   station below it is that station's own header padding, above its
	   hairline. */
	.group-notices {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 0 18px;
	}


	/* N.73 S3 ship one. The takeover's own column, so the ritual keeps the
	   drawer's left edge. The wizard drops its own outer padding in favour of
	   this.

	   THE PADDING MOVED OUT AT N.108 INCREMENT 3, and this is the second half
	   of one change rather than a loss. `.takeover-body` in `Drawer.svelte`
	   now spends the prototype's `4px 18px 16px`, which is the 18 px inset
	   every station in the new dress takes; the `12px 1rem 40px` here was the
	   old takeover's own copy of the same idea, and two boxes both padding
	   would have set the ritual in from the frame twice. The column stays,
	   because the 6 px gap between the wizard's parts is its own. */
	.takeover-panel {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.takeover-panel :global(:focus-visible) {
		outline-color: var(--deeper-lavender);
	}

	/* The Q4 provenance line: tertiary, one quiet line beneath the Metadata
	   block, sharing the drawer's content edges. Clamped to a single line with
	   an ellipsis (Dann's ruling, 2026-07-13): real headers carry IMSLP credit
	   blobs and URLs; the text stays verbatim (no parsing of publisher habits)
	   but never wraps. It came back here at N.73 S3 with the metadata block,
	   for the reason it left at S2: Svelte scopes a rule to the component that
	   authors the markup, so the rule travels or the line loses its style
	   silently. */
	.shane-provenance {
		margin: 0;
		font-family: var(--font-ui, var(--font-sans));
		font-size: 0.75rem;
		color: var(--ink-tertiary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* N.67 step 5. The import input is never seen: both Import controls click
	   it. Not `display: none`, which some browsers refuse to activate. */
	.binder-input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}
	/* N.67 step 4a. The replace dialog. Unstyled beyond what modality needs,
	   matching the drawer's register rather than inventing a look. The
	   ::backdrop is the browser's own, dimmed a little. */
	.replace-dialog {
		/* `app.css:88-94` resets margin to 0 on every element, which overrides
		   the user-agent's `dialog { margin: auto }` and drops a modal at the
		   viewport's top-left corner. Measured on the deploy: (0, 0), 512 wide,
		   `:modal` true. Restoring the centring the browser already intended. */
		margin: auto;
		max-width: 32rem;
		padding: 1.25rem 1.5rem;
		border: 1px solid var(--stone-600, #57534e);
		border-radius: 6px;
		background: var(--paper-cream, #f5f0e6);
		color: var(--ink-primary, #1a1612);
		font-family: var(--font-sans);
	}
	.replace-dialog::backdrop {
		background: rgb(0 0 0 / 0.45);
	}
	.replace-dialog h2 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
		font-weight: 600;
	}
	.replace-dialog p {
		margin: 0 0 1rem;
		font-size: 0.85rem;
		line-height: 1.5;
	}
	.replace-actions {
		display: flex;
		/* No `row-reverse` any more: the DOM order IS this order, so nothing a
		   singer sees disagrees with what a screen reader is told. */
		justify-content: flex-end;
		gap: 0.5rem;
	}
	/* PILL ENDS, N.108 increment 4. Ruled by Dann 2026-09-03 from the
	   calibration ritual's own two buttons (`CalibrationWizard.svelte`'s
	   `.wizard-primary` and `.wizard-secondary`, `border-radius: 999px`):
	   "The buttons shown here can form the template. Can we make other
	   buttons share its rounded ends?" Only the corners move; the fill, the
	   border, the type and the padding are untouched.

	   The confirm panel's answers. `.replace-destructive` sets colour only and
	   inherits the ends. */
	.replace-actions button {
		padding: 0.45rem 0.75rem;
		font-family: var(--font-sans);
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--ink-secondary);
		background: white;
		border: 1px solid var(--stone-600, #57534e);
		border-radius: 999px;
		cursor: pointer;
	}
	/* The destructive one is not the pretty one, and it is not the loud one
	   either: no border, no fill, just the word in the colour of the warning.
	   It has to be findable, not inviting. */
	.replace-actions .replace-destructive {
		color: #7f1d1d;
		background: transparent;
		border-color: transparent;
		font-weight: 500;
	}
	/* N.67 step 3. Sits inline rather than full width: it is the destructive
	   control on this panel and should not be the loudest thing on it. It was
	   twinned on .shane-print-btn, which N.73 S2 deleted; the values are the
	   same ones RootPanel's .action-btn carries. */
	/* PILL ENDS, N.108 increment 4. Ruled by Dann 2026-09-03 from the
	   calibration ritual's own two buttons (`CalibrationWizard.svelte`'s
	   `.wizard-primary` and `.wizard-secondary`, `border-radius: 999px`):
	   "The buttons shown here can form the template. Can we make other
	   buttons share its rounded ends?" Only the corners move; the fill, the
	   border, the type and the padding are untouched. */
	.start-over {
		align-self: start;
		padding: 0.45rem 0.5rem;
		font-family: var(--font-sans);
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--ink-secondary);
		background: white;
		border: 1px solid var(--stone-600, #57534e);
		border-radius: 999px;
		cursor: pointer;
		transition: opacity 0.12s;
	}

	/* ── Glyph Table (LEARN Section 1) ─────────────────── */

	:global(.gt-table) {
		border-collapse: collapse;
		width: max-content;
		table-layout: fixed;
	}

	:global(.gt-table thead) {
		position: sticky;
		top: 0;
		z-index: 10;
	}

	:global(.gt-table thead th) {
		background: #f5f7f3;
		border-bottom: 2px solid #3c3a36;
		border-right: 1px solid #c8c8c3;
		padding: 6px 2px;
		font-family: var(--font-sans, 'Source Sans 3', sans-serif);
		font-size: 0.5rem;
		font-weight: 600;
		text-align: center;
		vertical-align: bottom;
		line-height: 1.3;
		color: #3c3a36;
		min-width: 48px;
		max-width: 48px;
		width: 48px;
		white-space: normal;
		word-wrap: break-word;
		overflow-wrap: break-word;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	:global(.gt-table thead th:last-child) { border-right: none; }

	:global(.gt-num-h) { min-width: 30px !important; width: 30px !important; }
	:global(.gt-label-h) { min-width: 56px !important; width: 56px !important; }

	:global(.gt-col-sub) {
		font-weight: 400;
		font-size: 0.45rem;
		color: #8a8780;
		white-space: normal;
		text-transform: uppercase;
	}

	:global(.gt-cursive-h) {
		border-bottom-color: #8ba48b !important;
		border-bottom-width: 3px !important;
	}

	:global(.gt-table tbody tr) { border-bottom: 1px solid #c8c8c3; }
	:global(.gt-table tbody tr:nth-child(even) td) { background: #fcfdfc; }
	:global(.gt-table tbody tr:last-child) { border-bottom: none; }

	:global(.gt-table td) {
		border-right: 1px solid #c8c8c3;
		text-align: center;
		vertical-align: middle;
		height: 48px;
		min-width: 48px;
		max-width: 48px;
		width: 48px;
		aspect-ratio: 1;
		padding: 0;
	}

	:global(.gt-table td:last-child) { border-right: none; }

	:global(.gt-num) {
		min-width: 30px !important;
		width: 30px !important;
		font-family: var(--font-sans, 'Source Sans 3', sans-serif);
		font-size: 0.6rem;
		color: #aaa8a0;
	}

	:global(.gt-label) {
		min-width: 56px !important;
		width: 56px !important;
		font-family: var(--font-sans, 'Source Sans 3', sans-serif);
		font-size: 0.75rem;
		text-align: right !important;
		padding-right: 8px !important;
		white-space: nowrap;
		overflow: hidden;
	}

	:global(.gt-cell) {
		font-size: 1.5rem;
		line-height: 1;
	}

	:global(.gt-serif) { font-family: 'Noto Serif', 'DejaVu Serif', serif; font-style: normal; }
	:global(.gt-sans) { font-family: 'Noto Sans', 'DejaVu Sans', sans-serif; font-style: normal; }
	:global(.gt-serif-it) { font-family: 'Noto Serif', 'DejaVu Serif', serif; font-style: italic; }
	:global(.gt-sans-obl) { font-family: 'Noto Sans', 'DejaVu Sans', sans-serif; font-style: italic; }

	:global(.gt-cursive) {
		background: #ebeee8 !important;
		color: #8ba48b;
		font-family: var(--font-sans, 'Source Sans 3', sans-serif);
		font-style: normal;
		font-size: 0.6rem !important;
		letter-spacing: 0.03em;
	}

	:global(.gt-null) {
		font-size: 1.15rem !important;
		font-weight: 700;
		letter-spacing: 0.12em;
		line-height: 48px;
		color: var(--dusty-rose, #A67B7B);
	}

	:global(.gt-hi) {
		background: #F0D8D8 !important;
		box-shadow: inset 0 0 0 1.5px #C28888;
	}

	:global(.gt-obsolete td) { background: #f8f6f0 !important; }
	:global(.gt-obsolete .gt-label),
	:global(.gt-obsolete .gt-num) { color: #96918a !important; }

	:global(.gt-divider td) {
		background: #fff !important;
		border-bottom: 2px solid #a0a09b !important;
		padding: 6px 8px !important;
		font-family: var(--font-sans, 'Source Sans 3', sans-serif);
		font-size: 0.7rem !important;
		color: #a0a09b;
		letter-spacing: 0.04em;
		height: auto !important;
		text-align: left !important;
	}
	/* THE DESK IS PAINTED HERE (N.108 increment 1a). It was
	   `var(--drawer-bg)`, a fill nobody saw, because `.main-content` painted
	   the desk over all of it and the drawer painted itself over the rest.
	   Now the drawer paints nothing, so this is the desk, and the four
	   per-destination rules below are its. */
	.app-content {
		display: flex;
		flex: 1;
		overflow: hidden;
		/* ONE NAME FOR THE DESK, DECLARED ONCE. The four rules below set
		   `--desk-fill` and nothing else; this is the only place the value is
		   spent as a colour, and the phone's drawer INHERITS the property
		   rather than being given a second copy of the token. That is what
		   makes "no corner can mismatch the desk" true by construction rather
		   than by two boxes agreeing: there is one value, and everything that
		   paints the desk reads it from here. */
		--desk-fill: var(--desk-surface, #D8D4C8);
		background-color: var(--desk-fill);
	}
	.main-content {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		/* TRANSPARENT. The desk is `.app-content`'s, one box, so this one adds
		   nothing and cannot disagree with it. */
		background-color: transparent;
		transform: none;
		/* The desk head is flush with the SHEET's left edge, not the desk's
		   (placement B, ruled by Dann, N.42 §1.3). The two sheets are not the
		   same width, so the desk publishes the width of whichever one it is
		   holding and DeskHead takes its max-width from it. 816px is
		   PAGE_SIZES.letter.width in `$lib/page-config.ts`, which TitlePage
		   and SubsequentPage set on `.paper-page`. Below the mobile
		   breakpoint both sheets go full width and so does the head, so the
		   edges still agree. */
		--sheet-width: 816px;
		/* The desk head sticks to the top of this scroll region, and the
		   region's own top padding would otherwise leave a strip above the
		   head where the sheet slides past in the open. The head pulls itself
		   up by this much and pads itself back down by the same, so it covers
		   the strip and nothing below it moves. Every rule that changes the
		   desk's top padding sets this with it. */
		--desk-pad-top: 2rem;
	}

	/* ── Print, under the sheet ──────────────────────────── */

	/* FLUSH WITH THE SHEET'S LEFT EDGE, BY THE DESK HEAD'S OWN MECHANISM.
	   `--sheet-width` is set per destination just above and `DeskHead` takes
	   its `max-width` from it; this row takes the same one, so Print lands in
	   the same column as the `TRANSCRIPTION` half of the pair above the sheet,
	   which is what Dann asked for. `align-self` overrides `.main-content`'s
	   `align-items`, which is `center` on the desk and `flex-start` on the
	   phone.

	   NOT STICKY, and Dann was told. The desk head is; this is not, because it
	   sits below a sheet that can be several pages long. He chose this
	   placement knowing that. */
	.sheet-print {
		align-self: center;
		box-sizing: border-box;
		width: 100%;
		max-width: var(--sheet-width, 816px);
		display: flex;
		justify-content: flex-start;
		/* The desk head's own gap to the sheet, spent on the other side of it.
		   `.desk-head` is `padding: 0.35rem 0 0.6rem`, so 0.6rem is the ruled
		   distance between the pair and the paper. */
		padding-top: 0.6rem;
	}

	/* THE PAIR'S IDIOM, NOT THE ACTION BUTTONS'. The brief left this open and
	   Dann's own words settle it: "Visually it can parallel the Transcription
	   button above the WYSIWYG." Every value here is `.pair` and `.pair-member`
	   from `DeskHead.svelte`, so the two read as one vocabulary and no new one
	   enters. It is NOT drawn as a card, because the cream fill is how the pair
	   says which document you are looking at, and Print is an act rather than a
	   place.

	   IT TAKES THE PAIR'S BOX ON A COARSE POINTER TOO, which is under the 44px
	   floor, exactly as its twin `TRANSCRIPTION` is. Giving Print a floor its
	   twin does not have would make it stop paralleling the twin, which is the
	   thing Dann ruled. */
	/* N.77 ship 4 part B. THE SIZE IS THE DRAWER'S QUIET-BUTTON MODEL,
	   `.action-btn.btn-ghost` in `RootPanel.svelte:694` and `:705`: its
	   `padding: 0.45rem 0.5rem` and its `font-size: 0.8rem`. Print measured
	   26.59px tall against the model's 34.38px before this.

	   ITS LOOK IS UNTOUCHED, AND THAT IS DANN'S RULING OF 2026-08-21 READ
	   AS WRITTEN: the ruling governs Print's position and its idiom, not its
	   size. So the uppercase, the 0.1em tracking, the 600 weight, the ink
	   border, and the transparent fill all stay exactly as they were, and
	   `.sheet-print`'s own layout rules were not opened. Only the two
	   declarations that set the box changed. */
	/* PILL ENDS, N.108 increment 4. Ruled by Dann 2026-09-03 from the
	   calibration ritual's own two buttons (`CalibrationWizard.svelte`'s
	   `.wizard-primary` and `.wizard-secondary`, `border-radius: 999px`):
	   "The buttons shown here can form the template. Can we make other
	   buttons share its rounded ends?" Only the corners move; the fill, the
	   border, the type and the padding are untouched.

	   Its look was ruled untouched on 2026-08-21 as to POSITION and IDIOM; the
	   corners are neither, and Dann's 2026-09-03 ruling reaches every button. */
	.sheet-print-btn {
		border: 1px solid var(--ink-primary, #1a1612);
		border-radius: 999px;
		background: transparent;
		color: var(--ink-primary, #1a1612);
		font-family: var(--font-sans, 'Source Sans 3', sans-serif);
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 0.45rem 0.5rem;
		cursor: pointer;
	}

	/* GUARDED AT BIRTH. `.pair-member`'s own hover is not, and N.65 item 5
	   leaves the unguarded ones alone this ship; this rule is new, so it is
	   written with the guard rather than added to the list. A tap on iOS
	   latches `:hover` until the next touch elsewhere, which would leave this
	   button tinted after a singer printed. */
	@media (hover: hover) {
		.sheet-print-btn:hover {
			background: rgba(26, 22, 18, 0.06);
		}
	}

	.sheet-print-btn:focus-visible {
		outline: 2px solid var(--ink-primary, #1a1612);
		outline-offset: 2px;
	}

	/* IT IS CHROME, SO IT HIDES AT PRINT. `DeskHead.svelte` carries the same
	   rule and the reasoning is its own: the page prints; the desk does not. */
	@media print {
		.sheet-print {
			display: none;
		}
	}

	/* On the phone the gutter is the ruled distance, the same one `.desk-head`
	   spends above the sheet. N.108 increment 1a moved the query with the
	   layout it belongs to: this row sits under the sheet, and the sheet is
	   full width wherever the layout is the phone's. */
	@media (max-width: 1399px) {
		.sheet-print {
			padding-top: var(--portrait-gutter, 24px);
		}
	}

	/* N.73 S1b §4 deleted the override that stood here. It set --sheet-width
	   to 720px for Learn and Guide because ReadingPaper's max-width was 720px;
	   that max-width is now 816px, the same letter sheet the transcription
	   draws, so all four destinations take the 816px above and the desk head
	   lands on the sheet's left edge on every one of them. */

	/* ── Floating Paper: tab-specific surrounds (Approach A) ── */
	/* N.108 increment 1a: ON `.app-content`, NOT `.main-content`. The selector
	   moved up one box so the desk runs under the drawer as well as under the
	   paper; nothing else about these four rules changed, and the tokens are
	   the same four. See the element's own comment. */

	.app-content.tab-transcription {
		--desk-fill: var(--surround-transcription, #D1D7CB);
	}

	.app-content.tab-learn {
		--desk-fill: var(--surround-learn, #DBCACA);
	}

	.app-content.tab-guide {
		--desk-fill: var(--surround-guide, #BEC7D8);
	}

	.app-content.tab-shane {
		/* One hue per working surface. Ruled by Dann 2026-08-19 during the
		   walk, superseding "one desk, many papers" (2026-07-12) and the S1
		   sage desk that carried it: the Marked score is a distinct working
		   surface, so it takes its own desk. --surround-marked is
		   --deeper-lavender tinted 60 percent toward white, parallel to the
		   other three. It is not --surround-shane, which is the calibration
		   pacifier band on white and stays where it is. The bar moves with
		   the desk (HeaderBar.svelte, .header-bar.tab-shane). */
		--desk-fill: var(--surround-marked, #D2CBD7);
	}

	/* ── Floating Paper: the shadow ────────────────────────── */

	/* N.73 S1b §1 deleted three rules that stood here, one per destination,
	   each with its own shadow. They were `.main-content.tab-X :global(.Y)`,
	   which outweighs the sheets' own `.paper-page` and `.reading-paper` by
	   two class selectors, so a sheet's declared shadow never reached the
	   screen and changing it there would have done nothing. There is one
	   ruled shadow now, 0 3px 12px rgba(0, 0, 0, 0.35), and each sheet
	   component declares it. No per-destination differences: the sheet is
	   the same sheet on every desk, and only the desk under it changes. */

	/* ── Transcription mode: Paper centres naturally within flex ── */

	/*
	 * Reading mode: no translateX offset. The Reading Paper fills available
	 * width naturally via flex. When the Drawer collapses, the flex container
	 * grows and ReadingPaper's max-width centres it. Smooth width transition
	 * handled by the Drawer's own 1000ms cubic-bezier.
	 */
	/* N.73 S3 ship two. READING MODE NO LONGER SETS VERTICAL POSITION.
	   Ruled by Dann on the 63c2bb4 walk: the desk head takes ONE position on
	   all four destinations, at Learn and Guide's lower placement.

	   This rule carried `padding-top: 1rem` and `--desk-pad-top: 1rem`, and
	   two classes outweigh the one class every other rule for this element
	   uses, so it won in BOTH directions rather than one: on the desktop it
	   pulled Learn and Guide 1rem ABOVE Studio's 2rem, and on the phone it
	   pushed them 0.5rem BELOW Studio's 0.5rem. Deleting both declarations
	   leaves one value per breakpoint, set in one place, and the phone
	   breakpoint's base rises to 1rem to keep Learn and Guide where they
	   already were. The transform and the justification stay: they are what
	   this rule is actually for. */
	.main-content.reading-mode {
		transform: none;
		justify-content: flex-start;
	}

	/* ── Tab transition animations ──────────────────────── */

	@keyframes tabSlideFromRight {
		from {
			opacity: 0;
			transform: translateX(12px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes tabSlideFromLeft {
		from {
			opacity: 0;
			transform: translateX(-12px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.main-content.tab-enter-from-right {
		animation: tabSlideFromRight 175ms cubic-bezier(0.25, 0, 0.15, 1) both;
	}

	.main-content.tab-enter-from-left {
		animation: tabSlideFromLeft 175ms cubic-bezier(0.25, 0, 0.15, 1) both;
	}

	/* ── THE PAGE'S TWO STATES (N.92 mobile slice 2) ─────────────────────
	   Before the loupe, the page is the navigation interface: full ink, and
	   every measure takes a tap. While the loupe is up, the page stops taking
	   gestures and becomes texture. It is still the object being worked on and
	   it is no longer a control.

	   ONLY THE INK CHANGES. No layout moves, nothing reflows, no measure
	   changes place, so the geometry is identical pixel for pixel and the
	   transition is a fade rather than a move. That is the motion rule
	   satisfied exactly: opacity, and the paper never animates.

	   THE STEP IS SMALL ON PURPOSE. Enough to say the page is not taking taps
	   right now, and not enough to suggest it has been dismissed or disabled.
	   The right amount is NOT ESTABLISHED: the schematic draws roughly one
	   value of contrast and settles no number, so 0.78 is a first reading for
	   Dann's eye and not a derivation.

	   `.paper-fit` IS PageFit'S OWN ROOT, which both Studio documents share.
	   Only the score document ever raises a loupe, so the transcription is
	   reached by this rule and never matched by it. */
	.main-content :global(.paper-fit) {
		transition: opacity 180ms ease-out;
	}

	.main-content.loupe-up :global(.paper-fit) {
		opacity: 0.78;
		pointer-events: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.main-content :global(.paper-fit) {
			transition: none;
		}
	}

	/* THE PAGE PRINTS AT FULL INK, whatever is on screen. Print carries none of
	   this slice's furniture. */
	@media print {
		.main-content :global(.paper-fit),
		.main-content.loupe-up :global(.paper-fit) {
			opacity: 1 !important;
			/* The transition has to go with the opacity. Without this the print
			   layout catches the fade mid-flight and the sheet prints at
			   whatever value the animation had reached. Measured: 0.813. */
			transition: none !important;
		}
	}

	/* screen-only wrappers: visible on screen, hidden in print */
	.screen-only {
		display: contents;
	}
	@media print {
		.screen-only {
			display: none !important;
		}
		.app-content {
			display: block;
			overflow: visible;
		}
		.main-content {
			display: block;
			flex: none;
			padding: 0;
			overflow: visible;
			transform: none;
		}
	}
	/* Breath animation: two-phase CSS transitions for moments of meaning */
	@keyframes breathOut {
		from { opacity: 1; transform: translateY(0); }
		to   { opacity: 0; transform: translateY(-2px); }
	}
	@keyframes breathIn {
		from { opacity: 0; transform: translateY(-2px); }
		to   { opacity: 1; transform: translateY(0); }
	}
	:global(.breath-out) {
		animation: breathOut 150ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}
	:global(.breath-in) {
		animation: breathIn 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}
	/* Respect reduced motion preferences */
	@media (prefers-reduced-motion: reduce) {
		:global(.breath-out),
		:global(.breath-in) {
			animation: none !important;
		}
		.main-content {
			transition: none !important;
		}
		.main-content.tab-enter-from-right,
		.main-content.tab-enter-from-left {
			animation: none !important;
		}
	}
	/* ── Editorial mark callout (scholarly departure/note) ──── */
	:global(.learn-callout) {
		border-left: 4px solid var(--dusty-rose, #A67B7B);
		border-top: none;
		border-right: none;
		border-bottom: none;
		background: none;
		padding: 0 0 0 1rem;
		margin: 2rem 0;
		border-radius: 0;
		font-size: 0.92em;
		position: relative;
	}
	:global(.learn-callout)::before {
		content: "NOTE";
		display: block;
		font-variant: small-caps;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: var(--dusty-rose, #A67B7B);
		margin-bottom: 0.5rem;
		margin-left: -4px;
		font-family: var(--font-sans, 'Source Sans 3', sans-serif);
		font-size: 0.85rem;
	}
	:global(.learn-callout p:last-child) {
		margin-bottom: 0;
	}
	/* Variant labels via data attribute */
	:global(.learn-callout[data-label="departure"])::before {
		content: "DEPARTURE";
	}
	:global(.learn-callout[data-label="method"])::before {
		content: "METHOD";
	}
	:global(.learn-callout[data-label="context"])::before {
		content: "CONTEXT";
	}
	/* ── Placeholder content within ReadingPaper ──────────── */
	.placeholder-content {
		text-align: center;
		padding: 4rem 0;
	}

	/* ── Guide question headers: welcoming landmarks ───────── */
	.main-content.tab-guide :global(.reading-inner h4) {
		font-family: var(--font-serif, 'Source Serif 4', serif);
		font-size: 1.35rem;
		font-weight: 500;
		color: var(--ink-primary, #1a1612);
		margin-top: 3rem;
		margin-bottom: 0.75rem;
		line-height: 1.35;
	}

	/* Tab-scoped heading colours */

	.main-content.tab-learn :global(.reading-inner h1),
	.main-content.tab-learn :global(.reading-inner h2),
	.main-content.tab-learn :global(.reading-inner h3),
	.main-content.tab-learn :global(.reading-inner h4) {
		color: var(--dusty-rose, #A67B7B);
	}

	.main-content.tab-guide :global(.reading-inner h1),
	.main-content.tab-guide :global(.reading-inner h2),
	.main-content.tab-guide :global(.reading-inner h3),
	.main-content.tab-guide :global(.reading-inner h4) {
		color: var(--quiet-cobalt, #5C739E);
	}

	.main-content.tab-guide :global(.reading-inner h3) {
		border-top-color: var(--quiet-cobalt, #5C739E);
	}

	/* ── Text input field: the sage border (item 6) ────────
	   N.65 ship one. THESE TWO RULES ARE GONE, AND FINDING THEM IS THE
	   REASON THE BORDER CHANGE LANDED AT ALL. They set the border on
	   `.drawer-content textarea` with `!important`, so `RootPanel`'s own
	   `.text-input` rule declared a border it did not paint, and brief
	   §3.6's "`.text-input` is `3px solid var(--sage)`" was true of the
	   source and false of the screen. Editing `.text-input` alone changed
	   nothing.

	   There is exactly ONE textarea in the app, `RootPanel`'s, so a global
	   reaching into the drawer to style it bought nothing and cost a lie.
	   Both rules, the resting border and the focus colour, are on
	   `.text-input` in `RootPanel.svelte` now, where the rest of that
	   field's design already lived. Same defect as the station label
	   declared five times: one thing, more than one owner. */
	/* ── Portrait C: the stage (N.73, ruled by Dann 2026-08-18) ──

	   The eleven rules that stood here dressed the interstitial. Ruling 4
	   retired it, so they are gone with it.

	   The stage exists on the phone and on the Transcription destination
	   only: the desktop renders Paper as a direct child of .main-content, as
	   it always has, and this wrapper is never in its DOM. */
	.portrait-stage {
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stage-page,
	.stage-aid {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* NOT display:none. TitleHeader measures its own height with
	   bind:offsetHeight and a display:none element measures 0, so hiding the
	   page that way would collapse the row budget to its 9-row fallback,
	   re-slice the document, and re-slice it again on the way back. Off-stage
	   keeps the layout alive at a coordinate no scroll can reach: a left-to-
	   right document does not scroll into negative space. */
	.offstage {
		position: absolute;
		top: 0;
		left: -100000px;
		width: 100%;
	}

	/* ── The one labelled action ───────────────────────────── */

	/* PILL ENDS, N.108 increment 4. Ruled by Dann 2026-09-03 from the
	   calibration ritual's own two buttons (`CalibrationWizard.svelte`'s
	   `.wizard-primary` and `.wizard-secondary`, `border-radius: 999px`):
	   "The buttons shown here can form the template. Can we make other
	   buttons share its rounded ends?" Only the corners move; the fill, the
	   border, the type and the padding are untouched. */
	.portrait-action {
		flex: 0 0 auto;
		margin: 1.25rem 0 0;
		border: 1px solid var(--ink-primary, #1a1612);
		border-radius: 999px;
		background: var(--ink-primary, #1a1612);
		color: var(--paper-cream, #F0EBE0);
		font-family: var(--font-sans, 'Source Sans 3', sans-serif);
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		/* 0.9rem either side of a 0.85rem line clears the 44px floor. */
		padding: 0.9rem 2.25rem;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}

	.portrait-action-chevron {
		margin-left: 0.4em;
	}

	.portrait-action:focus-visible {
		outline: 2px solid var(--ink-primary, #1a1612);
		outline-offset: 3px;
	}

	/* PRINT EMITS THE PAGE. Whichever view the singer is looking at, the
	   action and the aid leave the sheet, and the page comes back on stage. */
	@media print {
		.portrait-action {
			display: none !important;
		}

		.stage-aid {
			display: none !important;
		}

		.stage-page.offstage {
			position: static !important;
			left: auto !important;
		}
	}
	/* ── THE PHONE'S LAYOUT (N.108 increment 1a) ─────────────
	   THE BREAKPOINT IS 1400, NOT 768. `layout.ts` owns the arithmetic and
	   the test beside it pins the sum; the literal is repeated here because
	   there is no custom-media syntax. Dann's ruling of 2026-09-02: below the
	   width where the 520 px drawer and a whole sheet both fit, "the layout is
	   the phone's."

	   THE WHOLE BLOCK IS UNCHANGED except the query and the bottom padding.
	   Every value in it was ruled for a narrow screen and every one of them is
	   still right at 1366, where the sheet is now the only thing on the desk. */
	@media (max-width: 1399px) {
		.app-content {
			position: relative;
			height: 100vh;
			overflow: hidden;
		}

		.main-content {
			height: 100vh;
			overflow: auto;
			/* N.73 C2: the horizontal padding IS the gutter, so the page below
			   fills what is left and lands on the viewport width less twice
			   this number. --desk-pad-top must match the top padding, and
			   does. The clause that used to follow, "the vertical stays where
			   portrait C left it", is struck: it stopped being true when this
			   ruling raised the top. The BOTTOM is still portrait C's. */
			/* N.73 S3 ship two raised the vertical from 0.5rem to 1rem, on
			   Dann's ruling of the 63c2bb4 walk: Learn and Guide already sat
			   at 1rem here, through a two-class override that has now been
			   deleted, and this is the value that keeps them there and brings
			   Studio's two documents down to meet them. The BOTTOM is
			   unchanged: `padding-bottom` below re-sets it to 0.5rem. */
			padding: 1rem var(--portrait-gutter, 24px);
			width: 100%;
			align-items: flex-start;
			-webkit-overflow-scrolling: touch;
			transform: none;
			--desk-pad-top: 1rem;

			/* THE PULL IS FIXED FURNITURE AGAIN, N.108 increment 1a, and this
			   is what reserves room for it. The paragraph that stood here
			   recorded the opposite and it is kept because the history is the
			   argument: 92px was reserved for a tab bar and a paper handle,
			   N.73 S1 deleted both and gave the phone its 92px back, and the
			   note ended "nothing is fixed to the bottom of the desk any more;
			   the drawer's pull is on the side."

			   THE PULL IS BACK ON THE BOTTOM, ruled by Dann 2026-09-02, and it
			   is 44px rather than 92. `0.5rem` is portrait C's own bottom
			   padding and it is kept, spent above the bar rather than at the
			   viewport's edge, so the last line of a sheet still clears the
			   pull by the ruled distance. */
			padding-bottom: calc(44px + 0.5rem);
		}
	}

	/* ── Update notice toast ─────────────────────────── */

	/* N.53. The shape did not hold: a shrink-wrapped flex row with no width
	   let the French string wrap to five lines, and border-radius 999px on a
	   tall box is a squircle rather than a pill. Width is now determinate
	   (left/right + margin auto + max-width) instead of shrink-to-fit, so the
	   radius always resolves against a known height. Dann, E.43: keep the
	   pill, bind it in a thicker lavender border. */
	.update-toast {
		position: fixed;
		bottom: 1.25rem;
		left: 1rem;
		right: 1rem;
		margin: 0 auto;
		max-width: 30rem;
		z-index: 200;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.9rem 0.6rem 1.1rem;
		background: var(--paper, #faf7f2);
		border: 2px solid var(--muted-lavender, #A89BB5);
		border-radius: 999px;
		box-shadow: 0 4px 16px rgba(40, 38, 35, 0.18);
		font-family: var(--font-sans, 'Source Sans 3', sans-serif);
		font-size: 0.88rem;
		color: var(--ink-secondary, #4a4540);
	}
	/* The sentence takes the slack; the two controls never shrink. */
	.update-toast-text {
		flex: 1 1 auto;
		min-width: 0;
	}

	.update-toast-action {
		flex: 0 0 auto;
		border: none;
		border-radius: 999px;
		padding: 0.35rem 0.9rem;
		background: var(--sage, #8a9b7e);
		color: #fff;
		font-family: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.update-toast-action:hover {
		filter: brightness(0.95);
	}

	.update-toast-dismiss {
		border: none;
		background: none;
		color: var(--ink-secondary, #4a4540);
		font-size: 1.1rem;
		line-height: 1;
		cursor: pointer;
		padding: 0.2rem;
	}

	/* N.53 raised the toast to clear the fixed tab bar it was sitting on:
	   the bar was bottom 0, height 56px, z-index 50, and the toast at bottom
	   1.25rem covered its upper 36px. N.73 S1 deleted the bar, so the
	   clearance has nothing left to clear and the toast sits where the phone
	   has room for it. */
	@media (max-width: 767px) {
		.update-toast {
			bottom: 0.75rem;
		}
	}

	@media print {
		.update-toast {
			display: none;
		}
	}
</style>
