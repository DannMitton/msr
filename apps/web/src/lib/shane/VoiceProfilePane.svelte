<script lang="ts">
	/**
	 * The interim Voice Profile envelope pane (the Shane tab's main pane).
	 *
	 * Source of record: handover v30 §C.1 and §R (main-pane rulings,
	 * 2026-07-11), plus Dann's same-day ruling in review: the envelope
	 * carries the Paper system's page furniture for consistency — a fixed
	 * letter-size page, the TitleHeader exactly as the Ilya setup renders
	 * it (with a subtitle naming this a formant profile), and the full
	 * PageFooter. Dann and Kimi's division of labour stands: the drawer is
	 * the workshop (the wizard, the F1/F2 chart, the readings roster), the
	 * main pane is the gallery. This page is the gallery's envelope — one
	 * DRY container that today carries the interim message states and will
	 * later host the marked-up score states (§B build order: MnxScoreParser
	 * → overlay engine → Appendix B/C renderer), so the eventual score
	 * pages inherit this exact page geometry and furniture with no
	 * reframing.
	 *
	 * The two interim states (copy Dann's, 2026-07-12, superseding the
	 * 2026-07-11 trio and folding the Workshop cue and forward pointer
	 * into two body paragraphs):
	 * - Pre-calibration: the single line "Calibrate your voice to begin."
	 * - Post-calibration: (1) "Your repertoire-fit results will appear
	 *   here once you upload your score." — the upload clause names an
	 *   unwired action; Claude raised the never-advertise rule once, Dann
	 *   ruled it acceptable because ingestion is the next build (2026-07-12,
	 *   closed). (2) The profile line with the captured count and the
	 *   provisional vowels in the wizard's vowelTag convention, closing
	 *   with the drawer wayfinding. Counts, lists, and grammar degrade
	 *   mechanically (singular vowel, none captured, none provisional).
	 *   Still no score-input CONTROL is wired anywhere here.
	 *
	 * Header content: the title line carries the active voice's name (the
	 * page's subject, as the song title is the transcription page's), and
	 * the metadata line beneath carries the formant-profile subtitle, its
	 * wording drawn from the wizard's shipped Welcome copy ("a formant
	 * profile, which is a map of your voice's resonances"). The "Your
	 * voice" fallback title, shown only in the brief no-voice window before
	 * first-launch naming, is placeholder copy pending Dann's eye.
	 *
	 * Data flow: the wizard in the drawer owns the profile store and
	 * publishes the active voice's name and readings through the page shell
	 * (CalibrationWizard's onActiveProfileChange); this pane only reads.
	 * Stored readings are direct samples only (captured or provisional —
	 * estimated previews are display-only in the workshop and never
	 * persisted), so the trio's counts are counts of what was actually sung.
	 *
	 * Body copy now reads through the i18n dictionary (N.22 extraction), with
	 * French values placeholder (English verbatim) pending Dann's copy pass;
	 * the header and footer components were already bilingual through t().
	 */
	import { onMount, untrack } from 'svelte';
	import TitleHeader from '$lib/components/Paper/TitleHeader.svelte';
	import PageFooter from '$lib/components/Paper/PageFooter.svelte';
	import RunningHeader from '$lib/components/Paper/RunningHeader.svelte';
	import { PAGE_SIZES, MARGINS, FOOTER_MAX_HEIGHT, GAP, HEADER_HEIGHTS } from '$lib/page-config';
	import PageFit from '$lib/components/Paper/PageFit.svelte';
	import type { LineData, PageSize } from '$lib/types';
	import { t, type Language } from '$lib/i18n';
	import { spokenName } from '$lib/shane/pacifier/Pacifier.svelte';
	import type { Vowel, CalibratedFormant, VoiceCharacteristics } from '$lib/shane/engine/types';
	import { buildFitLegend } from '$lib/shane/fit-legend';
	import {
		paginateScore,
		analyzeScore,
		resolveVocalReadingOctave,
		shiftVocalOctave,
		scoreInPerformanceOrder
	} from '@ilya/score-parser';
	import type { IngestedScore } from '$lib/shane/ingestion/ingest';
	import { buildUnderlayResolvers } from '$lib/shane/vowel-resolver';
	import {
		withPairedVowel,
		pairedCyrillic,
		pairedSyllableType,
		applyBlank,
		melismaIds,
		type PairingMap,
	} from '$lib/shane/pairings';
	import type { NotationPreferences } from '@ilya/phonology';
	import { applyNotationPreferences } from '@ilya/phonology';
	import { resolveAdvice } from '$lib/shane/advice-resolver';
	import { buildVoiceProfileSnapshot, composeBroadNote, isBroadAnalysis } from '$lib/shane/analyze-score-adapter';
	import { loadNotationFont, type LoadedNotationFont } from '$lib/shane/engine/notation-fonts';
	import { ENGRAVING_DEFAULTS, type EngravingValues } from '$lib/shane/engraving';
	import { buildWatchList, watchEntryLine, WATCH_HEADER } from '$lib/shane/watchlist';
	import { scoreMetrics } from '$lib/shane/score-metrics';

	interface Props {
		/** The active voice's stored readings (direct samples only). */
		formants: Partial<Record<Vowel, CalibratedFormant>>;
		/**
		 * The active voice's typed range/tessitura/passaggio (E.5 slice 4).
		 * Undefined when the singer skipped the Voice characteristics phase;
		 * the adapter then fills each missing dimension with a permissive
		 * default and the broad-analysis note appears (§A.31).
		 */
		characteristics?: VoiceCharacteristics;
		/** The active voice's name; undefined before first-launch naming. */
		voiceName?: string;
		language: Language;
		/** Mirrors Paper.svelte's prop; the page shell passes letter today. */
		pageSize?: PageSize;
		/**
		 * The accepted upload from the Fit uploader (live wiring, v36 §E.7).
		 * When present, the envelope's content window carries the rendered
		 * score pages instead of the interim copy. Slice 1 (Dann's scope
		 * ruling, 2026-07-13) renders notation only: real systems and
		 * underlay through paginateScore, no acoustic marks (see
		 * notation-overlay.ts for why that is the engine's own semantics).
		 */
		ingested?: IngestedScore | null;
		/**
		 * The song title for the page-1 header (the title slot belongs to
		 * the SONG, per the header ruling). Sourced from the shared drawer
		 * metadata today; parser-extracted titles and the score-wins
		 * conflict rules are the deferred §A.6 behaviours.
		 */
		scoreTitle?: string;
		/**
		 * Engraving preferences from the drawer panel (Dann's ruling,
		 * 2026-07-13). Defaults to the Appendix-derived values so the
		 * pane renders correctly standalone.
		 */
		engraving?: EngravingValues;
		/**
		 * Q3 wizard-collapse trigger (Kimi's §A.28 ruling, 2026-07-13):
		 * fires once per ingested score when it has actually produced
		 * rendered pages — loaded, parsed, AND rendered, never on failure
		 * (failures stay in the uploader slot and this pane never sees
		 * them). Engraving re-paginations of the same score do not
		 * re-fire; a pane remount does, so the page shell dedupes by
		 * score identity across mounts.
		 */
		onrendered?: () => void;
		/**
		 * The page's SVG has just been rebuilt, and `{@html page}` has replaced
		 * it in the DOM.
		 *
		 * NOT `onrendered`, WHICH FIRES ONCE PER SCORE. This one fires on every
		 * new pagination, which is what anything reading the page's DOM has to
		 * know. The loupe is that reader: it clones the system it magnifies out
		 * of this pane's own SVG, so a clone taken before a rebuild is a picture
		 * of a page that is no longer on screen.
		 *
		 * WHY IT EXISTS AT ALL (the walk finding on `c574cf8`). The loupe was
		 * given `correctedScore` as its invalidation token, which changes when a
		 * NOTE correction lands and never when a pairing does, so seating a
		 * syllable from inside the loupe redrew the page behind it and left the
		 * loupe drawing the old cell. This pane's own selection mark had the
		 * right dependency all along, `void scorePages` above, and could have it
		 * because it lives in this file. The loupe does not, so the dependency
		 * comes to it as this callback rather than as a list of values someone
		 * has to remember to extend. THAT LIST IS HOW THE DEFECT HAPPENED.
		 */
		onpagesdrawn?: () => void;
		/**
		 * The singer's notation preferences (N.5, 2026-08-05). Ilya's output
		 * is ONE study document, and Transcribe already spells its IPA to
		 * these preferences (`Paper/WordStack.svelte`), so the score pages
		 * must use the same set or конь prints `ˈkonʲ` on one page and
		 * `ˈkoɲ` on the next. Required rather than defaulted: a silent
		 * default here is exactly the unlabelled preference set that
		 * `DIRECTIVE-all-ipa-through-ilya.md` forbids on a printed page.
		 */
		notationPrefs: NotationPreferences;
		/**
		 * The singer's open-syllable preference (N.8, 2026-08-06). Applies to
		 * the IPA line ONLY on this page: Dann's ruling is that the Cyrillic
		 * keeps the engraver's hyphenation, as printed in the score they
		 * perform from, so the two lines may legitimately differ here.
		 * Transcribe is unaffected and continues to divide both lines.
		 */
		openSyllabification?: boolean;
		/**
		 * N.92: the note the correction surface has selected, or null. DISPLAY
		 * ONLY. It marks one note and nothing else lands on the paper.
		 */
		selectedEventId?: string | null;
		/**
		 * The singer's own transcription (N.10, Dann's ruling of 7 August:
		 * "Fit consumes Transcription's output including the singer's stress
		 * overrides").
		 *
		 * Fit and Transcribe share the pipeline and share no state (E.31 §1.2),
		 * so before this prop existed a word the singer had corrected in
		 * Transcribe printed here with the engine's original stress, and the
		 * control that would fix it lived on a tab whose output never reached
		 * this one. Where a score word pairs with a transcribed word the
		 * singer's result is used; where it does not, Fit's own run stands for
		 * that word alone (Path C, E.31 §1.5).
		 *
		 * Undefined, or an empty array, means no donor pass runs and the page
		 * is exactly what it was before N.10.
		 */
		transcribedLines?: readonly LineData[];
		/**
		 * N.55b: the singer's pairing map, keyed by event id, owned by
		 * `+page.svelte` and stored at `ilya:pairings` (R5). Absent means no
		 * pairing exists and every derivation below takes its prior path.
		 */
		pairings?: PairingMap;
		/**
		 * N.111 increment 3: notes inside a seated clitic run that carry no
		 * pairing and must draw NOTHING.
		 *
		 * On a lyric-bearing score an event with no pairing is not blank: the
		 * renderer falls back to the file's own cell. Inside a run the seat has
		 * just moved that text onto an earlier note, so what is left there is
		 * stale rather than silent. RULED BY DANN 2026-09-04, on the `ка ка`
		 * close he walked on `7875892`.
		 *
		 * A SET RATHER THAN A PAIRING, because Ilya may claim neither an `empty`
		 * note nor a melisma (E.46). The note stays undecided; this says only
		 * that the file has nothing true to say about it.
		 */
		blankUnderlay?: ReadonlySet<string>;
		/** N.55b R4: a click resolving to a note, by event id. */
		onnotepick?: (eventId: string) => void;
		/**
		 * Portrait on a phone (N.73 C2). Mirrors Paper.svelte's prop of the
		 * same name and is a WIDTH test, which on a phone is also the
		 * portrait test. It does one thing here: it hands PageFit the word to
		 * scale this document's pages, so both Studio documents miniaturize
		 * through one implementation rather than through two.
		 */
		isMobile?: boolean;
	}

	let {
		formants,
		characteristics = undefined,
		voiceName = undefined,
		language,
		pageSize = 'letter',
		ingested = null,
		scoreTitle = undefined,
		engraving = ENGRAVING_DEFAULTS,
		onrendered = undefined,
		onpagesdrawn = undefined,
		notationPrefs,
		openSyllabification = false,
		transcribedLines = undefined,
		pairings = undefined,
		blankUnderlay = undefined,
		onnotepick = undefined,
		selectedEventId = null,
		isMobile = false,
	}: Props = $props();

	// N.55b R4. The score is injected as an SVG STRING, so there is no
	// element here to hang a Svelte handler on, and putting one on the
	// wrapper div would need a role and a tabindex it should not have. A
	// delegated listener costs no markup and no a11y exception. The
	// `data-hit` rectangles exist nowhere else in the app.
	$effect(() => {
		const pick = onnotepick;
		if (!pick) return;
		const handler = (e: MouseEvent) => {
			const el = (e.target as Element | null)?.closest?.('[data-hit]');
			const id = el?.getAttribute('data-hit');
			if (id) pick(id);
		};
		document.addEventListener('click', handler);
		return () => document.removeEventListener('click', handler);
	});

	// N.92, the selection state. Applied to the INJECTED SVG from here rather
	// than emitted by the renderer, for two reasons. The renderer is a package
	// with its own byte-stable fixture gate, and a selection is not a property
	// of the score: it is a property of what the singer is doing right now, and
	// it must never print. Marking it here keeps `staff-renderer.ts` untouched
	// and keeps the mark out of every exported artifact by construction.
	//
	// The mark rides the note's own group, found through the `data-hit`
	// rectangle the correction UI already has, so there is ONE way to name a
	// note on this page and no second id scheme.
	/* THE RING IS DRAWN, AND IT USED TO BE AN OUTLINE. Dann's walk on `95f37aa`
	   found it rendering as an open U, truncated across its top edge.

	   THE CAUSE, MEASURED: a CSS `outline` boxes an element's LAYOUT box, and
	   the layout box of an SVG `<text>` is the font's line box, not the glyph's
	   ink. A notehead measured 88 user units tall where its ink is about ten,
	   and the group's box was that text's box exactly — the tap rectangle,
	   which looks like the likelier culprit, contributed nothing. That box
	   began 27 units ABOVE the system's viewBox, which the renderer crops to
	   the ink (`staff-renderer.ts`, and §14 of the slice 4 memo), so the SVG
	   viewport clipped the top edge away and left three sides standing. It was
	   never a shape drawn open, nor a clip-path: it was a box measured wrong.
	   This is the fourth time `getBBox`-style layout boxes on `<text>` have
	   caught this project, after the glyph cells, the insertion bar and §14's
	   ink band.

	   SO IT IS A DRAWN `<rect>` rather than an outline, because no layout box
	   can express a glyph's ink.

	   AND ITS HEIGHT COMES FROM THE STAFF, NOT FROM THE NOTE. Dann's walk on
	   `44f2a1e`: the repair above closed the ring by SHRINKING it, and the
	   proportion he wanted was the tall one it had before — a squircle
	   elongated to span the stave. Only the clipping was ever the defect. So
	   the vertical extent is the staff's own geometry, recovered from the tap
	   rectangle the way `tapBand` recovers it (eleven spaces tall, the staff
	   its middle four), and the notehead's measured ink decides only where the
	   squircle sits across the page and how wide it is.

	   IT STAYS INSIDE THE VIEWBOX BY CONSTRUCTION now, which is the part worth
	   keeping. The renderer crops each system to its own ink less one space,
	   and the staff IS ink, so a box on the staff can never begin above that
	   crop — where the notehead's 88-unit font box always did.

	   ONE EXTENSION BEYOND THE WORDING, and the reason. The ruling says the
	   staff's geometry extended for the stem; taken literally, a notehead
	   sitting ABOVE the top line would fall outside its own marker, and this
	   document has such notes. The vertical extent is therefore the union of
	   the stave, the stem, and the notehead's ink — which is the stave in the
	   ordinary case and never less than it.

	   IT IS STILL DISPLAY ONLY. `pointer-events: none`, so it cannot take a
	   tap from the note beneath it; appended by this pane rather than emitted
	   by the renderer, so `staff-renderer.ts` stays untouched and the mark is
	   out of every exported artifact by construction; and it carries
	   `data-note-selected`, which is what the loupe already strips from its
	   clone, so the ring leaves the loupe with no change there at all. */
	/* ── THE SQUIRCLE'S PROPORTIONS ──────────────────────────────────────
	   Ruled by Dann 2026-08-28, from the walk on `776c267`, and chosen BY EYE
	   against full pages rather than by arithmetic: the mark must be subtle
	   and still catch the eye despite its muted sage. What each is, and what
	   was looked at to settle it, is in §24 of the slice 4 memo.

	   MEASURED FIRST, on this document at one unit to the pixel: a stave space
	   is 5.5, a bare note's ink is 7 wide by 22 tall, note-to-note ink gaps run
	   9.19 to 39.01 with a median of 20.99, and an accidental's ink is 3.63 to
	   5.24 wide. */
	const RING_PAD_X = 4;
	const RING_PAD_Y = 9;
	/** The narrowest the box may be, so a bare notehead is not shrink-wrapped. */
	const RING_MIN_W = 15;
	/** Height over width. It must never approach square. */
	const RING_ASPECT = 2.5;
	const RING_RADIUS = 6;
	/** Kept here as well as in the stylesheet: the clamp has to know it. */
	const RING_STROKE = 2;

	/** A glyph's INK, not its font box. The distinction is the whole bug. */
	function glyphInk(el: SVGTextElement): { top: number; bottom: number; left: number; right: number } | null {
		const ctx = (inkCanvas ??= document.createElement('canvas').getContext('2d'));
		if (!ctx) return null;
		const cs = getComputedStyle(el);
		ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
		const m = ctx.measureText(el.textContent ?? '');
		if (!(m.actualBoundingBoxAscent > 0 || m.actualBoundingBoxDescent > 0)) return null;
		const x = Number(el.getAttribute('x'));
		const y = Number(el.getAttribute('y'));
		if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
		const anchor = el.getAttribute('text-anchor');
		const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
		const left = anchor === 'middle' ? x - width / 2 : x - m.actualBoundingBoxLeft;
		return {
			top: y - m.actualBoundingBoxAscent,
			bottom: y + m.actualBoundingBoxDescent,
			left,
			right: left + width,
		};
	}
	let inkCanvas: CanvasRenderingContext2D | null = null;

	$effect(() => {
		const id = selectedEventId;
		// Re-read on every re-render too: `{@html page}` replaces the whole SVG,
		// which would otherwise silently drop the mark and leave the drawer
		// claiming a selection the paper does not show.
		void scorePages;
		const root = document;
		for (const el of root.querySelectorAll('[data-note-selected]')) {
			el.removeAttribute('data-note-selected');
		}
		for (const el of root.querySelectorAll('[data-selection-ring]')) el.remove();
		if (!id) return;
		const hit = root.querySelector(`[data-hit="${CSS.escape(id)}"]`);
		if (!hit) return;
		const group = hit.closest('[data-event-id]');
		if (!group) return;
		group.setAttribute('data-note-selected', '');

		/* THE STAVE, off the tap rectangle. The renderer builds each one from
		   `staffTop - 3.5 * lineGap` to `staffBottom + 3.5 * lineGap` around a
		   staff of four gaps, so the rectangle is eleven gaps tall and one gap
		   is an eleventh of it — the same recovery `loupe.ts` makes. */
		const hitY = Number(hit.getAttribute('y'));
		const hitH = Number(hit.getAttribute('height'));
		if (!(hitH > 0) || !Number.isFinite(hitY)) return;
		const gap = hitH / 11;
		const staffTop = hitY + 3.5 * gap;
		const staffBottom = staffTop + 4 * gap;

		/* The note itself: the notehead's ink sets the width, the stem only
		   ever reaches further up or down. Glyphs measured as glyphs and
		   geometry measured as geometry. */
		let top = staffTop;
		let bottom = staffBottom;
		let left = Infinity;
		let right = -Infinity;
		for (const child of group.children) {
			if (child.hasAttribute('data-hit')) continue;
			if (child.tagName === 'text') {
				const ink = glyphInk(child as SVGTextElement);
				if (!ink) continue;
				top = Math.min(top, ink.top);
				bottom = Math.max(bottom, ink.bottom);
				/* THE WIDTH IS THE NOTEHEAD'S ALONE, as ruled. */
				left = Math.min(left, ink.left);
				right = Math.max(right, ink.right);
			} else {
				let b: DOMRect;
				try {
					b = (child as SVGGraphicsElement).getBBox();
				} catch {
					continue;
				}
				if (!b || (!b.width && !b.height)) continue;
				top = Math.min(top, b.y);
				bottom = Math.max(bottom, b.y + b.height);
			}
		}
		/* THE REST OF THE EVENT, which is not in the group. An accidental is
		   emitted before the group opens, so it is bound back by handle
		   (`staff-renderer.ts`'s `partOfEvent`) rather than found by geometry.
		   The union is written to take anything so bound, so an augmentation
		   dot needs no work here when the renderer gains one — TODAY IT DRAWS
		   NONE, which §24 records. */
		for (const part of root.querySelectorAll(`[data-of-event="${CSS.escape(id)}"]`)) {
			let box: { top: number; bottom: number; left: number; right: number } | null = null;
			if (part.tagName === 'text') {
				box = glyphInk(part as SVGTextElement);
			} else {
				try {
					const b = (part as SVGGraphicsElement).getBBox();
					if (b && (b.width || b.height))
						box = { top: b.y, bottom: b.y + b.height, left: b.x, right: b.x + b.width };
				} catch {
					box = null;
				}
			}
			if (!box) continue;
			top = Math.min(top, box.top);
			bottom = Math.max(bottom, box.bottom);
			left = Math.min(left, box.left);
			right = Math.max(right, box.right);
		}
		if (!Number.isFinite(left) || !Number.isFinite(right)) return;

		/* WIDTH GROWS ONLY AS THE INK REQUIRES; the generosity goes into the
		   height. A minimum keeps a bare notehead from being shrink-wrapped. */
		const width = Math.max(RING_MIN_W, right - left + RING_PAD_X * 2);
		const centreX = (left + right) / 2;
		/* AND THE PORTRAIT PROPORTION IS A FLOOR, not an outcome. Where an
		   accidental widens the box, the HEIGHT grows to keep it — the box
		   never approaches square. */
		const height = Math.max(bottom - top + RING_PAD_Y * 2, width * RING_ASPECT);
		const centreY = (top + bottom) / 2;

		/* AND IT SLIDES RATHER THAN SHRINKS. A box 2.5 times as tall as it is
		   wide, centred on a note near the top of its system, reaches above the
		   viewBox — the renderer leaves only one space of headroom above the
		   system's highest ink, and this box wants several. MEASURED before the
		   clamp: 4.5 units outside on a note carrying an accidental.

		   Shrinking it there would break the proportion Dann ruled, and letting
		   it clip would bring back the open U. So the box keeps its size and
		   moves down into the viewBox, which it can always do while still
		   enclosing the ink, because the ink is inside the viewBox to begin
		   with. Only a box taller than the whole system could not, and that
		   case is reported rather than silently squashed. */
		let y = centreY - height / 2;
		const vb = (group.closest('[data-system]')?.getAttribute('viewBox') ?? '').split(/\s+/).map(Number);
		if (vb.length === 4 && Number.isFinite(vb[1]) && Number.isFinite(vb[3])) {
			/* The stroke straddles the path, so half of it lies outside the
			   rectangle's own edge and has to be kept inside the viewBox too. */
			const bleed = RING_STROKE / 2;
			const highest = vb[1] + bleed;
			const lowest = vb[1] + vb[3] - height - bleed;
			y = Math.min(Math.max(y, highest), Math.max(highest, lowest));
			/* Never at the cost of leaving the ink outside. */
			y = Math.min(y, top);
			y = Math.max(y, bottom - height);
		}

		const ring = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		ring.setAttribute('data-selection-ring', '');
		ring.setAttribute('data-note-selected', '');
		ring.setAttribute('x', String(centreX - width / 2));
		ring.setAttribute('y', String(y));
		ring.setAttribute('width', String(width));
		ring.setAttribute('height', String(height));
		ring.setAttribute('rx', String(RING_RADIUS));
		/* ── IT GOES UNDER THE MUSIC ─────────────────────────────────────
		   Ruled by Dann 2026-08-28, from the walk on `dae29f5`: the squircle
		   draws BENEATH the notation ink. Appended last to the note's group, it
		   painted over marks that come earlier in the system, and its edge read
		   as slicing a neighbouring note's accidental. That was z-order, not
		   geometry — SVG paints in document order and has no `z-index`.

		   SO IT MOVES OUT OF THE GROUP, to the front of the SYSTEM, where every
		   glyph and every drawn mark is painted after it and therefore over it.
		   Inside the group it could only ever be under that one note's own
		   parts, which is not what "beneath the music" means.

		   AFTER THE BACKDROP, THOUGH. The system opens with a full-width rect
		   that is the paper; first-child would put the ring behind the page
		   itself and draw nothing at all.

		   NOTHING ELSE MOVES WITH IT. The ring still carries
		   `data-note-selected`, so the loupe's clone still strips its stroke;
		   it is still skipped by the loupe's ink survey; it is still removed by
		   the same cleanup; its coordinates are the system's, and the group
		   carries no transform, so leaving the group changes no number. */
		const sysEl = group.closest('[data-system]');
		if (!sysEl) return;
		const sysWidth = Number(sysEl.getAttribute('width'));
		let under = sysEl.firstElementChild;
		while (
			under &&
			under.tagName === 'rect' &&
			Number(under.getAttribute('width')) >= sysWidth * 0.95
		) {
			under = under.nextElementSibling;
		}
		sysEl.insertBefore(ring, under);
	});

	// N.22: dictionary lookup, following ScoreUploader.svelte's convention.
	const T = (key: string) => t(key, language);

	const dims = $derived(PAGE_SIZES[pageSize]);

	// The header ruling (Dann, 2026-07-12): the title slot belongs to the
	// SONG, verbatim as on the Ilya page — the italic "Aria or song title"
	// placeholder until a real score arrives (which is exactly what this
	// envelope awaits). The voice's identity lives in the qualifier line
	// beneath (the composer/opus/poet slot on the Ilya page): "Formant
	// profile: a map of <voice>'s resonances", with the voice name
	// substituted, falling back to "your voice" in the brief window
	// before first-launch naming. TitleHeader renders the line in its
	// small-caps register.
	// N.22 (E.40): one key per shape, so each language owns its own word
	// order. The old form glued an English possessive onto the name and
	// rendered "de Voix 1's" in French. The guillemets in the French also
	// dodge elision: a bare "de {voice}" breaks on a vowel-initial name
	// ("d’Anne", not "de Anne"). Dann's ruling, 2026-08-11.
	const subtitle = $derived(
		voiceName
			? T('profile.subtitleNamed').replace('{voice}', voiceName)
			: T('profile.subtitleYours'),
	);

	// The roster's canonical display order (wizard spec v1 §2: the seven
	// defaults in the fixed counterclockwise order, then the three optional
	// vowels), so the trio lists provisional vowels in the same order the
	// singer sees them in the workshop roster.
	const ROSTER_ORDER: Vowel[] = ['i', 'e', 'ɛ', 'a', 'ɑ', 'o', 'u', 'ɨ', 'ɪ', 'ʌ'];

	// Counts are spelled out in the locked copy's register ("Seven vowels
	// are captured"), so the words live here; the roster caps at ten.
	// N.22 (E.40): `profile.count.0` is deleted. `countWord` has exactly one
	// caller (`statusLine`, below), and that caller sends a zero count to
	// `profile.statusSetPlain` instead, so index 0 could never render in
	// either language. The array now starts at one; `countWord` shifts.
	const COUNT_WORDS = $derived([
		T('profile.count.1'),
		T('profile.count.2'),
		T('profile.count.3'),
		T('profile.count.4'),
		T('profile.count.5'),
		T('profile.count.6'),
		T('profile.count.7'),
		T('profile.count.8'),
		T('profile.count.9'),
		T('profile.count.10')
	]);

	// The provisional roster still reads capture STATUS: it names which vowels
	// the singer may want to re-take. That is a different question from what
	// the forecast is built on; see `analysedVowels` below (§B.2).
	let provisionalVowels = $derived(
		ROSTER_ORDER.filter((g) => formants[g]?.reading === 'provisional')
	);
	let hasReadings = $derived(Object.keys(formants).length > 0);

	/**
	 * The provenance legend (item 1.6), built from this voice's own readings.
	 *
	 * It defines the vocabulary this page already uses in prose: the sentences
	 * above say "with seven vowels measured" and "are provisional", and until
	 * now nothing on the printed page said what those words mean. Empty for an
	 * uncalibrated profile, so the footer omits the row rather than printing a
	 * glossary for readings that do not exist (E.22 §4, "never guesses where
	 * calibration is absent").
	 *
	 * ONCE PER DOCUMENT, on the first page. A four-line glossary repeated on
	 * every sheet of a printed Fit result is noise, and the singer's page is
	 * where a glossary belongs. Deliberately NOT the same placement rule as
	 * `broadNote`, which repeats because it qualifies the analysis printed on
	 * each sheet; this qualifies the calibration behind all of them.
	 * DECLARED BELOW, beside `withheldIpa`, not here: N.10b gave this a
	 * dependency on the render, and `withheldIpa` cannot be computed until
	 * `readingScore` and the resolvers exist. A `$derived` reading a `const`
	 * declared later is a temporal dead zone, and `svelte-check` does not see
	 * one.
	 */


	// ── Page geometry, mirrored from TitlePage.svelte ────────────────────
	// The header is measured (its height varies with wrapping), the footer
	// window is fixed; the content layer lives between them. The 18px
	// header-to-content gap is TitlePage's TITLE_HEADER_GAP — one document,
	// one rhythm.
	const TITLE_HEADER_GAP = 18;
	let headerHeight = $state(0);
	const contentTop = $derived(MARGINS.vertical + headerHeight + TITLE_HEADER_GAP);

	/**
	 * N.83: the footer is MEASURED, the same way the header is.
	 *
	 * `FOOTER_MAX_HEIGHT` is a constant 80, and a Fit footer is not 80. It
	 * carries the provenance legend, which wraps with its entry count and its
	 * language, and the broad-analysis sentence, which no other document has.
	 * Reserving 80 for a footer that measured 140.6 is what let the legend and
	 * the last system's lyrics occupy the same y.
	 *
	 * FLOOR, NOT REPLACEMENT. The constant stays as the minimum, so a short
	 * footer reserves exactly what it reserved before and no existing document
	 * repaginates; only a footer taller than the constant moves the window.
	 *
	 * PAGE ONE REPORTS, and only page one: it is the tallest footer in the
	 * document (it alone carries the legend), and one window geometry serves
	 * every page here by the same rule the score pagination already follows.
	 */
	let footerHeight = $state(0);
	const contentBottom = $derived(
		MARGINS.vertical + Math.max(FOOTER_MAX_HEIGHT, footerHeight) + GAP
	);

	function handleHeaderHeight(height: number) {
		headerHeight = height;
	}

	function handleFooterHeight(height: number) {
		footerHeight = height;
	}

	// ── Score pages (live wiring slice 1: notation only) ─────────────────
	// The parsed score paginates into the page-1 content window's geometry
	// (the smaller window, since the measured TitleHeader outweighs the
	// running header), so every page's systems fit every page type; pages
	// after the first simply carry a little extra room at the bottom.
	const parsed = $derived(ingested?.result.score ?? null);
	const contentWidth = $derived(dims.width - 2 * MARGINS.horizontal);
	const subsequentTop = MARGINS.vertical + HEADER_HEIGHTS.subsequent + GAP;

	// paginateScore paints a white full-page backing rect (its pages are
	// standalone artifacts); here the Paper page provides the surface, so
	// the rect is stripped. Upstream option (background: null) noted for
	// the package.
	const stripBackingRect = (svg: string): string =>
		svg.replace(/<rect x="0" y="0" width="\d+" height="\d+" fill="#FFFFFF"\/>/, '');

	// SMuFL font wiring (Dann's ruling, 2026-07-13): Finale Maestro is the
	// default for ALL renderings. Loaded async through the shared loader;
	// until it arrives (or if it fails) the render falls back to the
	// package's primitive shapes, so a dropped score is never blocked on a
	// font fetch.
	let notationFont = $state<LoadedNotationFont | null>(null);
	onMount(() => {
		let alive = true;
		loadNotationFont()
			.then((f) => {
				if (alive) notationFont = f;
			})
			.catch(() => {
				/* primitive-mode fallback; the pane stays fully functional */
			});
		return () => {
			alive = false;
		};
	});

	// ── The acoustic overlay (E.5 slice 4) ───────────────────────────────
	// The adapter builds the overlay engine's snapshot from the active
	// voice's measured formants and typed characteristics, filling any
	// missing dimension with a permissive default (see analyze-score-adapter
	// for the sentinel proof). buildVowelResolver supplies Ilya's per-event
	// sung vowel; a non-Russian score resolves nothing and renders notation
	// only, correctly (§A.35). This replaces notationOnlyOverlay: with no
	// resolvable vowels or no fR1, analyzeScore omits every event, so the
	// same plain vocal line renders, no acoustic claim made.
	const adapted = $derived(buildVoiceProfileSnapshot(formants, characteristics, voiceName));

	/**
	 * The vowels the FORECAST reads, which is not the same as the vowels that
	 * were cleanly captured (Dann's §B.2 ruling, 2026-07-15: the pane's count
	 * reports what the analysis used; capture quality is the drawer's job,
	 * where Re-take lives).
	 *
	 * Derived from the snapshot itself rather than re-testing `reading`, so it
	 * can never drift from what `analyzeScore` is actually given. §A.48 admits
	 * provisional and unchecked readings into fR1 and excludes only those the
	 * plausibility guard judged implausible. Before that ruling a provisional
	 * reading was excluded, and the old capture-status count happened to match;
	 * it no longer does, which is why this exists.
	 */
	const analysedVowels = $derived(ROSTER_ORDER.filter((g) => adapted.snapshot.fR1[g] !== undefined));

	// ── Vocal reading octave (denigma treble-8vb repair) ─────────────────
	// A treble-notated lower-voice line arrives an octave too high (denigma
	// flattens the octave clef). Resolve the octave that fits the singer's own
	// declared range and read BOTH the analysis and the render there, so the
	// marks and the engraving stay coherent (a shifted-down line lands in bass
	// clef via the tessitura heuristic). Non-destructive; `parsed` is untouched.
	const octaveShift = $derived(parsed ? resolveVocalReadingOctave(parsed, adapted.snapshot.range) : 0);
	const readingScore = $derived(
		parsed && octaveShift !== 0 ? shiftVocalOctave(parsed, octaveShift) : parsed,
	);
	const showOctaveNotice = $derived(octaveShift !== 0);
	// Approved copy (Dann, 2026-07-18); shown only when the reading octave shifted.
	const OCTAVE_NOTICE = $derived(T('profile.octaveNotice'));

	// ── Performance order for the analysis path (M0 jump-family wiring) ───
	// analyzeScore and the watch list should see the score as it is actually
	// SUNG: repeats taken, the D.C./D.S. jump family followed, and material after
	// a Fine (or jumped over) absent, so a note earns an acoustic forecast only
	// where the singer reaches it. The RENDER keeps the notated `readingScore`
	// below (repeats and jumps drawn as written); this does not pre-empt the open
	// strophic-render ruling (D3). When a structure cannot be unfolded, the
	// projection falls back to as-written and carries the unfolder's own flags.
	const performanceOrder = $derived(readingScore ? scoreInPerformanceOrder(readingScore) : null);
	const analysisScore = $derived(performanceOrder ? performanceOrder.score : null);
	// Score-level notices for a later UI to read (§M0.3): the unfolder's flags for
	// a jump structure it could not follow. Not rendered here — no new UI, and the
	// flag copy is the unfolder's, awaiting Dann's sign-off before it is shown.
	const analysisNotices = $derived(performanceOrder ? performanceOrder.flags : []);

	// The resolver is keyed by event id and built from the NOTATED line, so it
	// resolves every sung occurrence (same ids) identically; feed analyzeScore the
	// performance-order view so the overlay reflects the sung sequence.
	// N.5: BOTH resolvers, from one reconstruction pass. `buildVowelResolver`
	// is a wrapper that returns only `.vowel` (`vowel-resolver.ts:384`), so
	// the display IPA was being computed and thrown away on every render.
	const underlayResolvers = $derived(
		readingScore
			? buildUnderlayResolvers(readingScore, 1, {
					openSyllabification,
					...(transcribedLines ? { transcribedLines } : {}),
				})
			: null,
	);
	// N.55b R7/R8: a hand pairing outranks the resolver, its whole-word
	// withhold included, and carries the vowel glyph the forecast needs.
	const vowelResolver = $derived(
		underlayResolvers ? withPairedVowel(underlayResolvers.vowel, pairings) : null,
	);

	// N.5: the printed IPA line. Every string is Ilya's own, read from the
	// engine's syllable transcription (`vowel-resolver.ts:265-266`), then
	// spelled to the singer's preferences so the score pages agree with the
	// transcription pages. Fit synthesizes nothing, per
	// `DIRECTIVE-all-ipa-through-ilya.md`; where the engine resolves no
	// syllable the event is simply absent and the renderer prints no IPA for
	// it, which is the correct abstention rather than a guess.
	const ipaPreview = $derived.by(() => {
		if (!readingScore || !underlayResolvers) return undefined;
		const out: Record<string, string> = {};
		for (const ev of readingScore.vocalLine) {
			// N.55b R7: the pairing's IPA outranks the resolver's, and outranks
			// its abstention too.
			const paired = pairings?.[ev.id];
			/* N.111: a blanked note draws nothing at all, so its IPA goes with its
			   Cyrillic. The resolver is not consulted for it; `applyBlank` below
			   then writes the empty string that makes the renderer draw nothing. */
			/* N.113: a MELISMA pairing blanks this line too. The guard used to
			   ask only whether the note was unpaired, so a marked note fell
			   through to the resolver and drew a vowel over a bare Cyrillic
			   cell, which is the same shape as the `c574cf8` finding this
			   channel exists to prevent. A sustained vowel is not
			   re-articulated, so there is no onset to transcribe. */
			if (paired?.kind !== 'syllable' && blankUnderlay?.has(ev.id)) continue;
			const ipa = paired?.kind === 'syllable' ? paired.ipa : underlayResolvers.ipa(ev);
			if (ipa) out[ev.id] = applyNotationPreferences(ipa, notationPrefs, true);
		}
		/* AN EXPLICIT EMPTY STRING, NOT AN OMISSION, and the walk finding on
		   `c574cf8` is why. Skipping the event above is not enough on its own:
		   `staff-renderer.ts:2463` reads
		   `options.ipaPreview?.[ev.id] ?? a?.vowel`, so an omitted id falls
		   through to the ANALYSIS's single sustained vowel and the note drew a
		   stray `ɑ` over a bare Cyrillic cell. `applyBlank` is the same call the
		   Cyrillic channel makes, so the two lines cannot drift apart. */
		applyBlank(out, blankUnderlay);
		return Object.keys(out).length > 0 ? out : undefined;
	});
	// N.10b: the onsets the resolver declined to transcribe (Dann's ruling of
	// 7 August, E.29 §5.1 ruled A). Undefined when the page carries none, so
	// the renderer and the legend both take their existing no-op path and an
	// unaffected score is byte-for-byte what it was.
	const withheldIpa = $derived.by(() => {
		if (!readingScore || !underlayResolvers) return undefined;
		const out = new Set<string>();
		for (const ev of readingScore.vocalLine) {
			// N.55b R7: a paired event is no longer withheld, or the page would
			// draw the withheld siglum and the paired syllable at the same time.
			if (pairings?.[ev.id]?.kind === 'syllable') continue;
			// N.111: nothing is withheld on a note that draws nothing. The siglum
			// says Ilya declined to transcribe a syllable that is there; on a
			// blanked note there is no syllable to decline.
			if (blankUnderlay?.has(ev.id)) continue;
			if (underlayResolvers.withheld(ev)) out.add(ev.id);
		}
		return out.size > 0 ? out : undefined;
	});

	// N.55b R6: the Cyrillic channel. A score that arrived with no lyric
	// underlay has no other source for the word under the note.
	const cyrPreview = $derived(pairedCyrillic(pairings, blankUnderlay));

	/* N.113b item 3: the word division of the words the page is drawing. It
	   travels with `cyrPreview` because it describes the same text: the
	   renderer takes the singer's Cyrillic over the file's, and until this
	   channel existed it took the FILE's word position under it, so a syllable
	   that ended a word could reach the hyphen loop wearing a `start`. Derived
	   here for `cyrPreview`'s own reason: this component holds `pairings`, and
	   a prop carrying a projection of that map could go stale against it. */
	const sylTypePreview = $derived(pairedSyllableType(pairings));

	/* N.113. THE SINGER'S MELISMA, as its own channel to the renderer.
	   Derived here rather than passed in, because this component already holds
	   `pairings` and a second prop carrying a projection of it could go stale
	   against the map it projects.

	   IT IS NOT THE SAME AS `blankUnderlay`, and that is the point. Both make a
	   note draw nothing; only this one makes the syllable before it reach
	   across. Read off an empty cell the two are identical, and a vacated note
	   would grow an extender it has no business having. */
	const melismaPreview = $derived.by(() => {
		const out = melismaIds(pairings ?? {});
		return out.size > 0 ? out : undefined;
	});

	// The Fit legend (item 1.6). Declared here rather than beside its doc
	// comment above, because N.10b's entry depends on `withheldIpa`.
	let fitLegend = $derived(
		buildFitLegend(formants, language, { withheldSyllables: !!withheldIpa })
	);
	// The advice resolver (§A.158 RULED A) is a PURE POST-PASS wrapped here, at the
	// analysed seam, so `analyzed` carries the resolved `vowelModification` BEFORE
	// `buildWatchList` reads it below. It leaves the pure engine content-free and
	// only adds the sourced advice (v1: the [i]→[ɪ] crossing, §A.161/§A.169).
	const analyzed = $derived(
		analysisScore && vowelResolver
			? resolveAdvice(analyzeScore(analysisScore, adapted.snapshot, vowelResolver))
			: null,
	);

	// ── The "Places to watch" list (design C) ────────────────────────────
	// Built purely from the marks the overlay already computed (watchlist.ts);
	// verse 1 today. Silent on zero challenge (§7.3). Rendered AFTER the score
	// (Dann's placement ruling, 2026-07-18) so a variable-length list never
	// displaces the score markup, which also frees the full page-1 height for
	// pagination.
	// The transposition inputs (Dann's ruling A, 2026-07-20): the watch list
	// computes the one song-level suggestion itself, run over the SAME
	// performance-order score the analysis used, so its forecast crossings match
	// the marks on the page.
	const watchList = $derived(
		readingScore && analyzed && analysisScore && vowelResolver
			? buildWatchList(readingScore, analyzed, 1, {
					analysisScore,
					profile: adapted.snapshot,
					resolver: vowelResolver
				})
			: null,
	);
	const showWatchBand = $derived(!!watchList && watchList.entries.length > 0);

	// ── The measurement layer (E.20 built, E.21 wired) ───────────────────
	// Phonation time per pitch and per vowel, Pacheco's tessitura, the tempo
	// seam, seconds, and the nominal fold-cycle count, from one call.
	//
	// Read from `analysisScore`, the PERFORMANCE-ORDER projection, for the same
	// reason `analyzed` is: the question Fit answers is what the singer actually
	// sings, repeats taken and jumps followed, not what the page shows.
	//
	// The resolver is passed only when there is one. Its absence makes the
	// per-vowel totals ABSENT rather than empty, which is the seam's own
	// discipline: no vowel was ever asked for, so no claim is made about any.
	// No tempo override is passed, because the singer has no way to set one yet
	// (A9 is unbuilt). The seam then abstains wherever the score states no
	// tempo, and never invents a bpm.
	//
	// NOT RENDERED HERE, and deliberately so. The same treatment as
	// `analysisNotices` above: the data path lands, the pixels wait on Dann's
	// copy and Kimi's component, because a figure about a singer's voice should
	// not reach them in wording nobody signed off. Two things must surface when
	// it is drawn (Fable A.2 and A.3, binding): `tessitura.basis`, and
	// `tessitura.marginal`, since a knife-edge band presented as robust is a
	// wrong answer wearing confidence.
	//
	// One caveat travels with `phonation.byVowel` until the diction-mark fold
	// lands: `#` still occupies a syllable slot, so the per-vowel split is
	// provisional. `byPitch`, `total`, `tessitura`, `seconds`, and `foldCycles`
	// never consult a syllable and are unaffected.
	const metrics = $derived(
		analysisScore
			? scoreMetrics(analysisScore, {
					...(vowelResolver ? { vowelForEvent: vowelResolver } : {})
				})
			: null,
	);

	// Page-1 score window: the measured header sets contentTop; the score fills
	// the window below it, undisplaced by the watch list.
	const page1WindowHeight = $derived(dims.height - contentTop - contentBottom);

	// The broad-analysis note fires only when the overlay actually carries
	// acoustic marks (at least one resolved event) AND a characteristics
	// dimension was left blank. A notation-only render (no marks) has nothing
	// to qualify, so the note stays silent there.
	const hasAcousticMarks = $derived(!!analyzed && Object.keys(analyzed.events).length > 0);
	const showBroadNote = $derived(hasAcousticMarks && isBroadAnalysis(adapted.completeness));

	// ── Item 1.8, the withheld statement (2026-08-05) ─────────────────────
	// The clause this serves: "read or print a complete Fit result that never
	// guesses where calibration is absent." The ENGINE already satisfies it, by
	// Dann's Option A ruling of 2026-07-15: with no fR1 it omits every event and
	// the render is notation-only (analyze-score-adapter.ts:60-64). What it does
	// not do is SAY so, and a silent page is indistinguishable from a page whose
	// analysis came back clean.
	//
	// THE CONDITION IS THE PROFILE, NOT THE EVENTS. `hasAcousticMarks` above is
	// also false for a fully measured singer whose score happens to contain no
	// crossings and no timbre turns, and telling that singer "nothing was
	// checked" would be a lie in the opposite direction. `completeness.formants`
	// (analyze-score-adapter.ts:76) is `Object.keys(fR1).length > 0`, so this
	// fires only when no measured resonance exists and nothing COULD be
	// forecast.
	//
	// VOCABULARY: Dann ruled 2026-08-05 that this app's verb is MEASURE, in both
	// languages. `étalonner` is the accurate metrological term but reverses the
	// relation, since Ilya is calibrated against the voice rather than the other
	// way round, and `mesuré` was already shipped at fit-legend.ts:76 and in
	// i18n's `fit.broad.body`. A vocabulary sweep of the older `calibrate`
	// strings is recorded as its own item.
	//
	// N.22: migrated into i18n.ts under profile.withheld.*, preserving the
	// French verbatim (it is Dann's, still flagged for his eye).
	const showWithheld = $derived(!adapted.completeness.formants);
	const withheld = $derived({
		heading: T('profile.withheld.heading'),
		lede: T('profile.withheld.lede'),
		items: [
			T('profile.withheld.item1'),
			T('profile.withheld.item2'),
			T('profile.withheld.item3')
		],
		close: T('profile.withheld.close')
	});

	// The broad-analysis legend text (§B.5): composed from localized parts by
	// the adapter (EN and FR), rendered print-native in the PageFooter legend
	// zone rather than as a banner above the score. Empty when nothing is broad.
	const broadNoteText = $derived(composeBroadNote(adapted.completeness, language));

	const scorePages = $derived(
		readingScore && analyzed
			? paginateScore(readingScore, analyzed, {
					pageWidth: contentWidth,
					pageHeight: page1WindowHeight,
					marginTop: 0,
					marginBottom: 0,
					marginLeft: 0,
					marginRight: 0,
					lineGap: engraving.lineGap,
					pxPerWhole: engraving.pxPerWhole,
					minGap: engraving.minGap,
					systemGap: engraving.systemGap,
					leftMargin: engraving.leftMargin,
					...(ipaPreview ? { ipaPreview } : {}),
					...(withheldIpa ? { withheldIpa } : {}),
					...(cyrPreview ? { cyrPreview } : {}),
					...(sylTypePreview ? { sylTypePreview } : {}),
					...(melismaPreview ? { melismaPreview } : {}),
					...(notationFont ? { font: notationFont.prepared, fontFamily: notationFont.family } : {}),
				}).pages.map(stripBackingRect)
			: null,
	);

	// The commentary (octave notice + watch list) prints on its own trailing
	// page sheet AFTER the score (Dann's placement ruling, 2026-07-18), so it
	// sits inside the page boundary like the score and expands freely there
	// without displacing the markup. Numbered as a continuation of the score.
	// Item 1.8: the withheld statement is a third reason for this sheet to
	// exist. Without it there is no trailing page at all in the uncalibrated
	// state, and the statement lands in exactly the position the watch list
	// would have occupied: the page that would have carried the conclusions
	// instead says why there are none.
	const hasCommentaryPage = $derived(showOctaveNotice || showWatchBand || showWithheld);
	const totalPages = $derived(
		scorePages ? scorePages.length + (hasCommentaryPage ? 1 : 0) : 0,
	);

	// The Q3 render report (see the onrendered prop doc): once per score
	// identity, only when pagination yielded at least one page. A plain
	// variable, not state — it is compared, never rendered.
	let reportedRenderFor: IngestedScore | null = null;
	$effect(() => {
		if (ingested && scorePages && scorePages.length > 0 && reportedRenderFor !== ingested) {
			reportedRenderFor = ingested;
			onrendered?.();
		}
	});

	/* THE PAGE-REBUILT REPORT, and it is a different report from the one above.
	   `scorePages` is a `$derived`, so this effect runs exactly when the
	   pagination changes identity and therefore exactly when `{@html page}`
	   replaces the SVG. Svelte runs an effect after the DOM update for that
	   render, so by the time this fires the new SVG is the one in the document
	   and a reader can measure it.

	   THE CALLBACK IS CALLED UNTRACKED, and that is not a precaution: without it
	   this effect loops until Svelte kills it with `effect_update_depth_exceeded`.
	   `onpagesdrawn` is a PROP, so reading it inside an effect makes its identity
	   a dependency; the page shell re-renders when the counter changes, and an
	   inline arrow would be a new function every time, so the effect would
	   re-run, bump again, and never settle. MEASURED, on the first build of this
	   fix: the loop fired the moment a transcription landed. The shell also
	   passes a stable function declaration rather than an arrow, so both ends
	   are closed; only `scorePages` may be a dependency here. */
	$effect(() => {
		void scorePages;
		untrack(() => onpagesdrawn?.());
	});

	// Interim running-header text for pages 2+: the song title when the
	// singer has one in the shared metadata, else the profile subtitle.
	// Interim copy, flagged for Dann's eye with the §A.6 behaviours.
	const runningHeader = $derived(scoreTitle?.trim() ? scoreTitle : subtitle);

	function countWord(n: number): string {
		return COUNT_WORDS[n - 1] ?? String(n);
	}

	// Built as an expression so the leading space survives Svelte's
	// block-boundary whitespace trimming (the "setwith" bug, caught by
	// Dann in live testing, 2026-07-12).
	// DRAFT copy, flagged for Dann (§B.2). "measured" replaces "successfully
	// captured": the count now spans every reading the forecast reads, which
	// includes provisional ones, and "successfully captured" would overclaim
	// their quality.
	let statusLine = $derived(
		analysedVowels.length === 0
			? T('profile.statusSetPlain')
			: (analysedVowels.length === 1
					? T('profile.statusSetMeasuredSingular')
					: T('profile.statusSetMeasuredPlural')
				).replace('{count}', countWord(analysedVowels.length).toLowerCase()),
	);

	// N.22: split around {vowels} so the glyph snippet renders in the gap. The
	// split point travels with the translation, which is the entire point: the
	// fragments this replaced could not be translated, because French needs a
	// noun English omits ("Votre voyelle [ɛ]") and the gender then
	// propagates through the participle.
	let provisionalParts = $derived(
		(provisionalVowels.length === 1
			? T('profile.provisional.sentenceSingular')
			: T('profile.provisional.sentencePlural')
		).split('{vowels}'),
	);

	/**
	 * The separator before item `idx` in a natural-language list. N.34: the
	 * joins are dictionary keys, because English takes the Oxford comma
	 * ("a, b, and c") and French does not ("a, b et c"), which collapses the
	 * French pair and final joins onto the same word.
	 */
	function listSep(idx: number, len: number): string {
		if (idx === 0) return '';
		if (len === 2) return T('profile.provisional.listSepPair');
		return idx === len - 1
			? T('profile.provisional.listSepFinal')
			: T('profile.provisional.listSepMedial');
	}
</script>

<!--
	Vowel tag in the wizard's convention (Dann's copy, 2026-07-12): the
	bracketed glyph followed by its visible informal name ("[i] cardinal-i").
	The §4.6 speakable-name discipline holds — the glyph is aria-hidden, so
	screen readers announce only the informal name and [ɪ]/[ɨ] never
	collapse onto "ee".
-->
{#snippet vowelGlyph(g: Vowel)}<span class="profile-ipa" aria-hidden="true">[{g}]</span
	>{spokenName(g, language)}{/snippet}

<PageFit fit={isMobile} pageWidth={dims.width}>
	{#snippet content()}
{#if scorePages && scorePages.length > 0}
	<!-- Score state (live wiring slice 1): the uploaded score's systems,
	     paginated into the envelope's exact page geometry and furniture,
	     mirroring Paper.svelte's TitlePage/SubsequentPage pattern. The
	     SVG pages come from paginateScore, notation only for now (no
	     acoustic marks; see notation-overlay.ts). -->
	<!-- data-analysis-notices carries the unfolder's flag codes (machine tags,
	     not user copy) for a later notice UI to read; absent when the sung order
	     was computed cleanly. No visible surface is built here (§M0.3). -->
	<div
		class="fit-paper-container"
		role="region"
		aria-label={T('profile.scoreRegionAria')}
		data-analysis-notices={analysisNotices.length
			? analysisNotices.map((f) => f.code).join(' ')
			: undefined}
	>

		{#each scorePages as page, i (i)}
			<article
				class="paper-page profile-page score-page"
				style="width: {dims.width}px; height: {dims.height}px;"
				aria-label={T('profile.scorePageAria').replace('{n}', String(i + 1)).replace('{total}', String(scorePages.length))}
			>
				{#if i === 0}
					<TitleHeader
						title={scoreTitle ?? ''}
						composer={subtitle}
						poet=""
						translator=""
						opus=""
						{language}
						onheightchange={handleHeaderHeight}
						versionAccent="#8E7E9B"
						markAccent="#8E7E9B"
						ruleAccent="#8E7E9B"
					/>
					<div class="score-window" style="top: {contentTop}px; bottom: {contentBottom}px;">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own renderer's SVG -->
						{@html page}
					</div>
				{:else}
					<RunningHeader headerText={runningHeader} />
					<div class="score-window" style="top: {subsequentTop}px; bottom: {contentBottom}px;">
						{@html page}
					</div>
				{/if}
				<PageFooter pageNumber={i + 1} totalPages={totalPages} {language} legendItems={i === 0 ? fitLegend : []} broadNote={showBroadNote ? broadNoteText : undefined} hairlineAccent="#8E7E9B" onheightchange={i === 0 ? handleFooterHeight : undefined} />
			</article>
		{/each}
		{#if hasCommentaryPage}
			<!-- A trailing "notes" page: the octave notice and the "Places to
			     watch" list on their own sheet AFTER the score (Dann's placement
			     ruling, 2026-07-18) so they sit within the page boundary and
			     expand freely without displacing the markup. -->
			<article
				class="paper-page profile-page commentary-page"
				style="width: {dims.width}px; height: {dims.height}px;"
				aria-label={T('profile.notesPageAria')}
			>
				<RunningHeader headerText={runningHeader} />
				<div class="commentary-window" style="top: {subsequentTop}px; bottom: {contentBottom}px;">
					{#if showWithheld}
						<!-- Item 1.8: absence as a positive object on the page, not a
						     gap. Placed FIRST, above the octave notice, because it
						     governs everything else on the sheet: if no voice has been
						     measured, nothing below it could have been forecast. -->
						<aside class="withheld" aria-label={withheld.heading}>
							<p class="withheld-heading">{withheld.heading}</p>
							<p class="withheld-lede">{withheld.lede}</p>
							<ul class="withheld-list">
								{#each withheld.items as item (item)}
									<li class="withheld-line">{item}</li>
								{/each}
							</ul>
							<p class="withheld-close">{withheld.close}</p>
						</aside>
					{/if}
					{#if showOctaveNotice}
						<aside class="octave-notice">{OCTAVE_NOTICE}</aside>
					{/if}
					{#if showWatchBand && watchList}
						<aside class="watch-band" aria-label={WATCH_HEADER}>
							<p class="watch-band-header">{WATCH_HEADER}</p>
							<ul class="watch-band-list">
								{#each watchList.entries as entry (entry.eventId)}
									<li class="watch-band-line">{watchEntryLine(entry)}</li>
								{/each}
							</ul>
						</aside>
					{/if}
				</div>
				<PageFooter pageNumber={totalPages} totalPages={totalPages} {language} legendItems={[]} hairlineAccent="#8E7E9B" />
			</article>
		{/if}
	</div>
{:else}
<!-- THE CENTRING WRAPPER (N.73 S3, second repair from Dann's walk of ship
     one). `.main-content`'s `align-items: center` has nothing to centre,
     because `PageFit`'s `.paper-fit` is `width: 100%` and fills the desk. What
     centres a sheet is the page stack's own container, and the rule that does
     it is `align-items: center` on a flex column. The score branch above
     already carries it, as `.fit-paper-container`; this branch never did, so
     the envelope sat at the flex start while the desk head stayed centred.

     THE SAME RULE, NOT A SECOND MECHANISM: this is `.fit-paper-container`
     itself, unchanged, the one the score branch uses, whose declarations are
     byte-identical to `Paper.svelte`'s `.paper-container`. No `role="region"`
     and no `aria-label` here: the article below already carries its own label,
     and an unlabelled region is not exposed as a landmark, so adding one would
     be noise rather than structure. -->
<div class="fit-paper-container">
<article
	class="paper-page profile-page envelope-page"
	style="width: {dims.width}px; height: {dims.height}px;"
	aria-label={T('profile.emptyStateAria')}
>
	<!-- Header layer: the same TitleHeader the transcription page renders,
	     pinned to the top margin. Title = the song's (placeholder until a
	     score arrives, verbatim as on the Ilya page); the composer slot
	     carries the voice-qualified formant-profile line (Dann's header
	     ruling, 2026-07-12).

	     Item 1.8, 2026-08-05: this passed `title=""` and had done since the
	     envelope was written, so the comment above described an intent the
	     code never carried out. A singer with «Gretchen am Spinnrade» in the
	     drawer printed a Fit sheet that could not name its own subject.
	     OBSERVED by Dann in a browser print preview on dc7cf09. The score
	     branch at :503 was already passing `scoreTitle`; this is the envelope
	     catching up to it, not a new decision. An empty title still falls
	     through to TitleHeader's own placeholder, so the no-metadata state is
	     unchanged. -->
	<TitleHeader
		title={scoreTitle ?? ''}
		composer={subtitle}
		poet=""
		translator=""
		opus=""
		{language}
		onheightchange={handleHeaderHeight}
		versionAccent="#8E7E9B"
		markAccent="#8E7E9B"
		ruleAccent="#8E7E9B"
	/>

	<!-- Content layer: the envelope's interim states, centred in the
	     window between header and footer. The eventual score state mounts
	     in this same window (§B build order). -->
	<div class="profile-content" style="top: {contentTop}px; bottom: {contentBottom}px;">
		{#if hasReadings}
			<div class="profile-copy">
				<p class="profile-line profile-lede">
					{T('profile.lede')}
				</p>
				<p class="profile-line profile-status">
					{statusLine}
				</p>
				<p class="profile-line profile-status">
					{#if provisionalVowels.length > 0}{provisionalParts[0]}{#each provisionalVowels as g, i (g)}{listSep(
								i,
								provisionalVowels.length
							)}{@render vowelGlyph(g)}{/each}{provisionalParts[1] ?? ''}{:else}{T(
							'profile.provisional.noneMessage'
						)}{/if}
				</p>
			</div>
		{:else}
			<!-- Pre-calibration empty state: a single line by ruling. -->
			<p class="profile-empty">{T('profile.emptyState')}</p>
		{/if}
	</div>

	<!-- Footer layer: the full PageFooter, pinned to the bottom margin.
	     No provenance legend items yet; the legend row simply stays empty
	     until the score pane brings provenance to this surface. -->
	<PageFooter pageNumber={1} totalPages={1} {language} legendItems={fitLegend} hairlineAccent="#8E7E9B" onheightchange={handleFooterHeight} />
</article>
</div>
{/if}
	{/snippet}
</PageFit>

<style>
	/* N.92, the selection state. Display only, and it appears ONLY on the
	   selected note, per the ship's own constraint against marks that appear on
	   everything.

	   LAVENDER, ruled by Dann 2026-09-08 on his walk of `00149c3`. It was sage,
	   on the reasoning that sage is Studio's accent for the score document, and
	   this is the same ruling he made against the same reasoning at
	   `CorrectionSurface.svelte:845` on 2026-08-28: lavender codes music and
	   voice, and a box on a notehead is a mark on the music. `--deeper-lavender`
	   is the token the voice anchor, the Corrections station and the drawer's
	   music stations already carry.

	   ONE RULE PAINTS BOTH SURFACES, and that is why the loupe needs no edit.
	   Since N.113a the loupe clones this rectangle rather than stripping it, in
	   the block `Loupe.svelte` opens with THE PAGE'S OWN MARK STAYS, so the
	   page's box on the taken note and the loupe's box on the taken note are the
	   same mark drawn twice. Giving them two colours would say they were two
	   things.

	   `outline` rather than a painted shape: it adds no geometry to the SVG, so
	   it cannot collide with a notehead, a stem, or the underlay, and it cannot
	   shift a single coordinate the renderer computed.

	   PRINT DROPS IT. A selection is what the singer is doing now, not part of
	   the score, and the drawer manipulates while the page displays and prints. */
	:global(rect[data-selection-ring]) {
		fill: none;
		stroke: var(--deeper-lavender, #8e7e9b);
		stroke-width: 2;
		pointer-events: none;
	}
	/* The loupe strips `data-note-selected` from its clone, so keying the
	   stroke on it is what keeps the ring off that surface with no edit
	   there. A ring that lost its attribute draws nothing. */
	:global(rect[data-selection-ring]:not([data-note-selected])) {
		display: none;
	}
	@media print {
		:global(rect[data-selection-ring]) {
			display: none;
		}
	}

	/* The envelope page: TitlePage's .paper-page geometry, twinned so the
	   eventual score pages replace the content window with no reframing. */
	.paper-page {
		position: relative;
		box-sizing: border-box;
		background: var(--paper-cream);
		box-shadow: 0 3px 12px rgba(0, 0, 0, 0.35);
		flex-shrink: 0;
	}

	/* ── Content window ────────────────────────────────────── */

	/* The typography ruling (Dann, 2026-07-12): one reading size,
	   left-justified, a document rather than an eye chart. The body sets
	   in the Transcription empty-state's measure (serif italic, 1rem),
	   aligned to the page's text column; the quiet furniture below keeps
	   its own smaller sans register but shares the left edge. Vertical
	   centring within the content window stays. */
	.profile-content {
		position: absolute;
		left: 96px;
		right: 96px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		text-align: left;
	}

	.profile-copy {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
		max-width: 34rem;
	}

	.profile-line {
		margin: 0;
		/* Match the Transcription empty-state ("Enter your Cyrillic text…"):
		   serif italic, 1rem, 1.6 leading. Left-justified via .profile-content,
		   and each sentence sits on its own line (Dann, 2026-07-13). */
		font-family: var(--font-serif, 'Source Serif 4', serif);
		font-style: italic;
		font-size: 1rem;
		line-height: 1.6;
	}

	.profile-lede {
		color: var(--ink-primary, #1a1612);
	}

	.profile-status {
		color: var(--ink-secondary, #4a4540);
	}

	/* The IPA glyphs keep the calibration surfaces' IPA face, with the
	   wizard's 0.3em breath between glyph and informal name. */
	.profile-ipa {
		font-family: 'Lato IPA', sans-serif;
		margin-right: 0.3em;
	}

	/* Both documents' empty states are centred and italic. Ruled by Dann
	   2026-08-19 on the walk.

	   Every type value below is copied from the transcription's
	   `.empty-directive` (`Paper/TitlePage.svelte`), which is the declaration
	   this is matching: serif, italic, 1rem, 1.6 leading, --ink-tertiary,
	   centred, capped at 480px and centred by auto margins. No third set of
	   values was invented.

	   What is NOT copied is that rule's `display: flex` with `flex: 1`, which
	   is how the transcription centres its line vertically inside
	   `.page-content`. This parent, `.profile-content`, already carries
	   `justify-content: center`, so the vertical centring is done; `align-self`
	   overrides the parent's `align-items: flex-start` for this one element,
	   because that parent's left justification is the calibration plea's and
	   Dann's ruling of 2026-07-13 keeps it. Nothing here reaches
	   `.profile-line`. */
	.profile-empty {
		align-self: center;
		margin: 0 auto;
		max-width: 480px;
		text-align: center;
		font-family: var(--font-serif, 'Source Serif 4', serif);
		font-style: italic;
		font-size: 1rem;
		line-height: 1.6;
		color: var(--ink-tertiary, #6A655F);
	}

	/* ── Score state (live wiring slice 1) ─────────────────── */

	/* Mirrors Paper.svelte's .paper-container so a multi-page score
	   stacks with the same rhythm as the transcription document. */
	.fit-paper-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		padding-bottom: 2rem;
	}


	/* The content window a score page renders into: the same left/right
	   text column as .profile-content, top set inline per page type. The
	   SVG keeps its 1:1 scale (viewBox width equals the window width) and
	   anchors to the top of the window. */
	.score-window {
		position: absolute;
		left: 96px;
		right: 96px;
		overflow: hidden;
	}

	.score-window :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}

	/* ── The trailing notes page (design C, §7.1) ──────────── */

	/* The notes page's content window: the same text column as the score, a
	   column of the octave notice then the "Places to watch" band. The octave
	   notice and band render AFTER the score on their own sheet (Dann's
	   placement ruling, 2026-07-18). First-pass treatment; design is Dann's. */
	.commentary-window {
		position: absolute;
		left: 96px;
		right: 96px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow: hidden;
	}

	.octave-notice {
		box-sizing: border-box;
		font-family: var(--font-serif, 'Source Serif 4', serif);
		font-style: italic;
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--ink-secondary, #4a4540);
	}

	/* Item 1.8, the withheld statement. Twinned on .watch-band deliberately:
	   it stands in the place the watch list would have stood, so it should
	   carry the same weight rather than read as a warning. Same squircle, same
	   lavender, same small-caps header. The only departure is the closing line,
	   which is italic serif to match .octave-notice, because it is a remark
	   about the page rather than an item in a list. */
	.withheld {
		box-sizing: border-box;
		border: 1px solid #8e7e9b;
		border-radius: 12px;
		padding: 0.7rem 1.1rem 0.8rem;
		background: var(--paper-cream);
	}

	.withheld-heading {
		margin: 0 0 0.35rem;
		font-family: var(--font-sans, 'Source Sans 3', sans-serif);
		font-variant: small-caps;
		letter-spacing: 0.06em;
		font-size: 0.8rem;
		color: #8e7e9b;
	}

	.withheld-lede {
		margin: 0 0 0.5rem;
		font-family: var(--font-serif, 'Source Serif 4', serif);
		font-size: 0.9rem;
		line-height: 1.45;
		color: var(--ink-secondary, #4a4540);
	}

	.withheld-list {
		margin: 0 0 0.5rem;
		padding-left: 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.withheld-line {
		font-family: var(--font-serif, 'Source Serif 4', serif);
		font-size: 0.9rem;
		line-height: 1.45;
		color: var(--ink-secondary, #4a4540);
	}

	.withheld-close {
		margin: 0;
		font-family: var(--font-serif, 'Source Serif 4', serif);
		font-style: italic;
		font-size: 0.9rem;
		line-height: 1.45;
		color: var(--ink-secondary, #4a4540);
	}

	/* Outline-only lavender squircle; an in-flow block below the score. */
	.watch-band {
		box-sizing: border-box;
		border: 1px solid #8e7e9b;
		border-radius: 12px;
		padding: 0.7rem 1.1rem 0.8rem;
		background: var(--paper-cream);
	}

	.watch-band-header {
		margin: 0 0 0.35rem;
		font-family: var(--font-sans, 'Source Sans 3', sans-serif);
		font-variant: small-caps;
		letter-spacing: 0.06em;
		font-size: 0.8rem;
		color: #8e7e9b;
	}

	.watch-band-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.watch-band-line {
		font-family: var(--font-serif, 'Source Serif 4', serif);
		font-size: 0.9rem;
		line-height: 1.45;
		color: var(--ink-secondary, #4a4540);
	}

	/* N.73 C2 retires the N.44 reflow that stood here.

	   N.44 existed for one measured reason, recorded in its own comment: the
	   phone's PageFooter went `position: static` under this breakpoint while
	   this page kept its 816 by 1056 and its absolutely positioned content,
	   so the footer was the only child left in the flow and rendered at the
	   TOP of the sheet. N.73 portrait C deleted that footer rule, so the
	   cause is gone, and the reflow it justified is now the thing making this
	   page overflow on a phone: the title ran off the sheet and the empty
	   state sat over it, which is what Dann walked on 2026-08-19.

	   This page keeps 816 by 1056 on every display and PageFit scales it, so
	   both Studio documents miniaturize identically. */

	/* N.46 / E.44's portrait withholding IS DELETED HERE (mobile slice 1,
	   Dann's ruling of 2026-08-25, walked on his own iPhone 2026-08-26).

	   WHAT STOOD HERE. Under this breakpoint the block hid `.score-window` on
	   every score page and hid every score page after the first, and it showed
	   a `.rotate-notice` line in their place. Its premise was that the stave
	   may not be scaled down, so portrait had to defer the notation to
	   landscape. N.73 C2 had already retired the other half of the shape,
	   leaving a page that was, in its own comment's words, mostly empty by
	   construction.

	   WHY IT GOES. Dann ruled the phone's paper to be the whole true page, an
	   oversized thumbnail at full engraving resolution, and walked the
	   legibility bet on a real engraved page at roughly 390 by 505 CSS points.
	   The premise that the stave may not be scaled down is superseded for this
	   view: PageFit scales the PAGE, uniformly, and re-breaks nothing, so no
	   system is broken to the viewport and no second renderer exists. The
	   page's own geometry is untouched, which is why nothing above this rule
	   had to change to let the notation through.

	   NOTHING REPLACES IT. There is no portrait-only declaration on this
	   document any more: what a phone draws is what the desk draws, scaled.
	   The rotate notice and its two dictionary keys are gone with it, because
	   a page that renders needs no apology. */

	/* ── Print rules (parity with TitlePage) ───────────────── */

	@media print {
		.paper-page {
			box-shadow: none;
			background: white;
		}
	}
</style>
