<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t, type Language } from '$lib/i18n';
	import { SectionSet } from './sections.svelte';
	import { readSwipe } from './gesture';
	import type { Destination, TabId } from '$lib/destinations';

	interface Props {
		width: number;
		/**
		 * PHONE ONLY: whether the drawer is up. N.108 increment 1a.
		 *
		 * It was `collapsed`, and it was the desk's question. Dann ruled on
		 * 2026-09-02 that the desk has no collapsed state at all: at every
		 * width where the drawer and a whole sheet both fit, "the drawer is
		 * always present", so `ilya:drawerCollapsed` and the bookmark tab that
		 * drove it are both retired. What is left is the PHONE's question,
		 * and it is asked the other way up: the drawer rises from the bottom,
		 * so the state worth naming is `raised` rather than `collapsed`.
		 *
		 * Ignored above the breakpoint (`layout.ts`), where nothing reads it.
		 */
		raised: boolean;
		/**
		 * Whether the layout is the phone's. THE NAME IS OLDER THAN ITS
		 * MEANING: `+page.svelte` computes it from `isDeskLayout` now, not
		 * from 768 px, so it is true on a 1366 laptop. See `layout.ts`.
		 */
		isMobile: boolean;
		language: Language;
		/** Where the singer is. Every branch in this file asks this. */
		destination: Destination;
		/**
		 * The four-way surface id, and the ONLY thing it is used for here is
		 * `data-tab`. N.73 S3 ship two kept that attribute when NO selector and
		 * no script read it, because it is the one mark on the drawer that
		 * tells Studio's two documents apart, which is exactly what a harness
		 * needs to prove S2's invariant that flipping the pair changes nothing
		 * in the drawer. Ship one's walk used it for that.
		 *
		 * N.108 GAVE IT A SECOND JOB AND THE FIRST ONE SURVIVES. Two rules in
		 * this file's stylesheet now key the SLAB's fill off it, one per
		 * Studio document, because the desk under the drawer is that
		 * document's desk (four desks, ruled 2026-08-19). S2's invariant is
		 * narrowed rather than broken: flipping the pair changes the fill
		 * behind the three groups and moves nothing in them.
		 */
		activeTab: TabId;
		activeHeadingId: string | null;
		/* `tabTransitionClass` IS GONE (N.108 increment 3). It was the tab
		   slide's only carrier into this component, and Dann ruled the slide
		   off the drawer on 2026-09-03; the stylesheet below records what
		   went and what stayed. `+page.svelte` keeps the state, because
		   `.main-content` still reads it. */
		/**
		 * ── THE THREE GROUPS (N.108 increment 1) ──────────────────────────
		 *
		 * `rootPanel`, `shanePanel`, `notationPanel`, `pieceAnchor` and
		 * `voiceAnchor` ARE GONE, and what replaced them is not a rename. The
		 * five named REGIONS of the N.73 S3 column: a pinned top holding Piece
		 * and Notation, a scroll holding two panels, and a pinned bottom
		 * holding the voice. Dann ruled the column into three FRAMES on
		 * 2026-09-02, choice 2 of `drawing-n108-three-choices_r1_2026-09-02.png`,
		 * "frames, no fold", and the frames cut across every one of those
		 * regions: Notation left the pinned top for Text, Analysis left
		 * `rootPanel` for Text, the voice left the pinned bottom for Score
		 * markup, and the score work left `shanePanel` for the same group.
		 *
		 * NOTHING IS PINNED ANY MORE. All three groups scroll together, which
		 * is what makes "the opening state is the map of everything, and it
		 * fits without scrolling" a claim about ONE box rather than three. The
		 * two anchors' sage and lavender rules go with them; the band above
		 * each group is the boundary now.
		 *
		 * Snippets, as the five were, so the state stays in `+page.svelte` and
		 * nothing is drilled through here.
		 */
		pieceGroup?: Snippet;
		/**
		 * N.108-5, RULED BY DANN 2026-09-07. The intake's own group, between
		 * Piece and Text. It holds the whole intake frame and nothing else.
		 */
		inputGroup?: Snippet;
		textGroup?: Snippet;
		scoreGroup?: Snippet;
		/**
		 * METADATA'S BODY, opened from the affordance on the Piece band.
		 *
		 * Metadata is the one station with no row on the map. Design's
		 * prototype took it off the map at 1366 x 768 only, where the opening
		 * state would not otherwise fit; THE BUILD BRIEF OVERRIDES THAT and
		 * takes it off at every size, phone included, on the desk's ruling
		 * that two desktops must not show two maps. So the affordance is
		 * unconditional and the station row does not exist.
		 *
		 * The band is drawer chrome, so this file draws the affordance; the
		 * body is `MetadataFields`, unchanged, rendered under the band.
		 */
		metadataBody?: Snippet;
		/** Whether Metadata's body is showing. Read by the band affordance. */
		metadataOpen?: boolean;
		/** The singer's press on the band affordance. */
		onmetadatatoggle?: () => void;
		/**
		 * THE CALIBRATION TAKEOVER (N.73 S3 ship one). E.27's takeover:
		 * "replaces the entire drawer, shows a single back affordance at the
		 * top, restores the station accordion in its prior state on exit, and
		 * is never entered by a chevron"
		 * (`fable-ruling-e27-four-tab-consolidation_2026-08-05.md`).
		 *
		 * RENDERED ALWAYS AND HIDDEN, not conditionally mounted, and the
		 * reason is measured rather than aesthetic: the page's mirror of the
		 * voice (`shaneFormants`, `shaneVoiceName`) is published by an
		 * `$effect` inside the wizard, so a wizard that is not mounted leaves
		 * the marked score's page with no voice and its Print button disabled
		 * until the singer opens the takeover once. Hiding keeps every one of
		 * today's behaviours and costs one CSS rule.
		 */
		voiceTakeover?: Snippet;
		/** Whether the takeover has the drawer. */
		takeoverActive?: boolean;
		/** The back affordance's press. */
		onexittakeover?: () => void;
		/**
		 * The pull's press, and the swipe's. Phone only. It was
		 * `ontogglecollapse` and it drove a bookmark tab on the drawer's right
		 * edge; there is no tab and no desk state to toggle now.
		 */
		ontogglepull: () => void;
		/**
		 * The loupe has the screen, so the swipe must not fire. Dann's ruling
		 * names it. The press still works: the pull is a control and the dock
		 * covers it rather than disabling it.
		 */
		gesturesBlocked?: boolean;
		ontabchange: (tab: TabId) => void;
		onheadingnavigate: (id: string) => void;
	}

	let { width, raised, isMobile, language, destination, activeTab, activeHeadingId = null, pieceGroup, inputGroup, textGroup, scoreGroup, metadataBody, metadataOpen = false, onmetadatatoggle, voiceTakeover, takeoverActive = false, onexittakeover, ontogglepull, gesturesBlocked = false, ontabchange, onheadingnavigate }: Props = $props();

	/* ── THE SILHOUETTE AND THE BOOKMARK TAB ARE GONE (N.108 increment 1a) ──
	   Ruled by Dann 2026-09-02 on his walk of `2c1cecf`: the desk has no pull,
	   no chevron and no collapsed state, and the phone's pull is a horizontal
	   bar on the bottom edge instead of a tab on the right.

	   WHAT LEFT WITH THEM, and every one of these was ruled once: `LIP_W` 20
	   and `LIP_H` 152 (2026-08-19, 2026-08-21), the one-outline silhouette
	   drawn at `docs/sessions/lip-handle-silhouette_r1_2026-08-20.html` with
	   its mitred junctions and its squircle cubic (2026-08-20), the drawer's
	   `bind:clientHeight`, which existed only so that path could have user
	   units, the drop-shadow lift the outline needed, the `--lip-grey`, the
	   coarse-pointer touch extension, the two measured optical nudges of the
	   chevron, and the vertical DRAWER label increment 1 built on the tab four
	   hours ago.

	   NONE OF IT IS A DEFECT BEING FIXED. It was right for a drawer that slid
	   in from the left and had to show a handle when it was gone. The desk's
	   drawer never goes now, so it needs no handle; the phone's comes from the
	   bottom, so its handle is a bar across the bottom. The reasoning is kept
	   here rather than in the file's history because the shape may come back
	   if the motion ever does.

	   `docs/sessions/drawing-n108-pull_r2_2026-09-02.png` is the drawing this
	   replaces it with, and `_r3` is the alternative Dann rejected. */

	/* ── THE SWIPE (N.108 increment 1a) ──────────────────────────────────
	   "A vertical swipe in the motion's direction is a second way, and it must
	   not fire while the loupe is up or a station body is scrolling."

	   THE DECISION IS NOT HERE. `gesture.ts` holds it, in plain TypeScript, so
	   a gate can reach it; this measures the touch and reads the DOM, which is
	   the only part a browser is needed for. Same split as `sections.svelte.ts`
	   and for the same stated reason.

	   WHERE IT LISTENS, AND THIS IS A SCOPING DECISION THE RULING DID NOT MAKE.
	   The DOWN swipe listens on the drawer, because that is the surface the
	   ruling's two exclusions are about. The UP swipe listens on the PULL BAR
	   ONLY, because the paper scrolls under a thumb all day and an up-swipe
	   anywhere on it would be a gesture stolen from the document. The bar is
	   44 px of full-width target and it is the only thing showing at the
	   bottom when the paper is up. Recorded in the memo as mine. */
	let touchStart: { x: number; y: number; at: number; el: EventTarget | null } | null = null;

	/* Whether the box the touch began in can still travel in the thumb's own
	   direction. Walks from the touched element up to the drawer, because a
	   station body is a scroller inside a scroller and either may be mid-way.
	   `>= 1` rather than `> 0`: a fractional device pixel at the end of a
	   scroll is not room to move. */
	function scrollableUnder(el: EventTarget | null, downward: boolean): boolean {
		let node = el instanceof Element ? el : null;
		while (node) {
			const style = getComputedStyle(node);
			const scrolls = /(auto|scroll|overlay)/.test(style.overflowY);
			if (scrolls && node.scrollHeight > node.clientHeight) {
				const room = downward
					? node.scrollTop
					: node.scrollHeight - node.clientHeight - node.scrollTop;
				if (room >= 1) return true;
			}
			if (node.classList.contains('drawer')) return false;
			node = node.parentElement;
		}
		return false;
	}

	function onTouchStart(e: TouchEvent) {
		const t = e.changedTouches[0];
		touchStart = t ? { x: t.clientX, y: t.clientY, at: Date.now(), el: e.target } : null;
	}

	/* `wantDown` says which way this listener is willing to read. The drawer
	   sends itself away and the bar brings it back; neither answers a swipe
	   that would do what has already been done. */
	function onTouchEnd(e: TouchEvent, wantDown: boolean) {
		const start = touchStart;
		touchStart = null;
		if (!start || !isMobile) return;
		const t = e.changedTouches[0];
		if (!t) return;
		const dy = t.clientY - start.y;
		const verdict = readSwipe(
			{ dx: t.clientX - start.x, dy, ms: Date.now() - start.at },
			{ blocked: gesturesBlocked, canScrollFurther: scrollableUnder(start.el, dy > 0) }
		);
		if (verdict === null) return;
		if (verdict === 'down' && wantDown && raised) ontogglepull();
		if (verdict === 'up' && !wantDown && !raised) ontogglepull();
	}

	/* Studio's two documents. The reading destinations, Learn and Guide, have
	   no piece, no notation and no voice, so none of the three anchors is
	   theirs. One name for one expression, which was previously written out
	   twice in this file. */
	const isStudio = $derived(destination === 'studio');

	/* N.65 ship B. THE OPEN SET AND ITS TOGGLE LEFT THIS FILE. They were
	   declared inline here and drove Learn and Guide's table of contents;
	   §B.2's instruction was to extract them so the drawer has ONE
	   retraction mechanism and no second one is written for the stations.
	   `sections.svelte.ts` is that code, moved, and this is one instance of
	   it. THIS ONE PERSISTS NOTHING: a remembered table of contents is not
	   what §B.4 asks to remember, and the stations' instance, which does
	   persist, lives in `+page.svelte`. */
	const toc = new SectionSet();
	let drawerContentEl: HTMLElement | undefined = $state();

	/* ── Parent chain lookup for auto-expand ───────────────── */

	const learnUnitChildren: Record<string, string> = {
		'learn-u1-song': 'learn-unit-1', 'learn-u1-alphabet': 'learn-unit-1',
		'learn-u1-familiar': 'learn-unit-1', 'learn-u1-signs': 'learn-unit-1', 'learn-u1-yo': 'learn-unit-1',
		'learn-u1-glyphs': 'learn-unit-1', 'learn-u1-try': 'learn-unit-1',
		'learn-u2-meaning': 'learn-unit-2', 'learn-u2-moves': 'learn-unit-2', 'learn-u2-dictionary': 'learn-unit-2',
		'learn-u2-sounds': 'learn-unit-2', 'learn-u2-try': 'learn-unit-2',
		'learn-u3-inventory': 'learn-unit-3', 'learn-u3-note-o': 'learn-unit-3', 'learn-u3-interpalatal': 'learn-unit-3', 'learn-u3-iotated': 'learn-unit-3',
		'learn-u3-yo': 'learn-unit-3', 'learn-u3-try': 'learn-unit-3',
		'learn-u4-akanye': 'learn-unit-4', 'learn-u4-ikanye': 'learn-unit-4', 'learn-u4-reconstitution': 'learn-unit-4',
		'learn-u4-try': 'learn-unit-4',
		'learn-u5-familiar': 'learn-unit-5', 'learn-u5-pairs': 'learn-unit-5', 'learn-u5-attention': 'learn-unit-5',
		'learn-u5-fixed': 'learn-unit-5', 'learn-u5-signs': 'learn-unit-5', 'learn-u5-devoicing': 'learn-unit-5',
		'learn-u5-try': 'learn-unit-5',
		'learn-u6-what': 'learn-unit-6', 'learn-u6-signals': 'learn-unit-6', 'learn-u6-stops': 'learn-unit-6',
		'learn-u6-paired': 'learn-unit-6', 'learn-u6-clusters': 'learn-unit-6', 'learn-u6-practice': 'learn-unit-6',
		'learn-u6-velari': 'learn-unit-6',
		'learn-u7-two': 'learn-unit-7', 'learn-u7-voiced': 'learn-unit-7', 'learn-u7-stops': 'learn-unit-7',
		'learn-u7-boundary': 'learn-unit-7', 'learn-u7-deletion': 'learn-unit-7', 'learn-u7-mergers': 'learn-unit-7',
		'learn-u7-unusual': 'learn-unit-7', 'learn-u7-geminates': 'learn-unit-7', 'learn-u7-tryit': 'learn-unit-7',
	};

	function getParentIds(id: string | null): string[] {
		if (!id) return [];
		if (learnUnitChildren[id]) return [learnUnitChildren[id]];
		if (['guide-what','guide-paste','guide-source','guide-ai','guide-role','guide-limits','guide-future','guide-fit-forecast','guide-fit-characteristics','guide-fit-notation'].includes(id)) return ['guide-how'];
		if (['guide-walk-interface','guide-walk-tabs','guide-walk-metadata','guide-walk-transcribe','guide-walk-analysis','guide-walk-notation','guide-walk-print'].includes(id)) return ['guide-walkthrough'];
		if (['guide-grayson','guide-mitton','guide-claude','guide-kimi'].includes(id)) return ['guide-contributors'];
		if (id === 'guide-grayson-intro') return ['guide-contributors', 'guide-grayson'];
		if (id === 'guide-mitton-note') return ['guide-contributors', 'guide-mitton'];
		return [];
	}

	const collapsibleIds = new Set([
		'learn-unit-1','learn-unit-2','learn-unit-3','learn-unit-4','learn-unit-5','learn-unit-6','learn-unit-7',
		'guide-how','guide-walkthrough','guide-contributors','guide-grayson','guide-mitton'
	]);

	/* ── Interactions ──────────────────────────────────────── */

	function handleTocClick(id: string) {
		toc.open([...getParentIds(id), ...(collapsibleIds.has(id) ? [id] : [])]);
		onheadingnavigate(id);
	}

	/* ── Auto-expand parents when active heading changes ──── */

	let autoExpandTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (!activeHeadingId) return;
		if (autoExpandTimer) clearTimeout(autoExpandTimer);
		autoExpandTimer = setTimeout(() => {
			const parents = getParentIds(activeHeadingId);
			if (parents.length === 0) return;
			/* `open` returns early when nothing changes, which this effect
			   depends on: reassigning an equal set would make it re-run. */
			toc.open(parents);
		}, 150);
	});

	/* ── Auto-scroll Drawer to keep active item visible ───── */

	$effect(() => {
		if (!activeHeadingId || !drawerContentEl) return;
		requestAnimationFrame(() => {
			if (!drawerContentEl) return;
			const btn = drawerContentEl.querySelector(`[data-heading-id="${activeHeadingId}"]`) as HTMLElement | null;
			if (!btn) return;
			const cRect = drawerContentEl.getBoundingClientRect();
			const bRect = btn.getBoundingClientRect();
			if (bRect.top < cRect.top + 20 || bRect.bottom > cRect.bottom - 60) {
				btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		});
	});

	/* The takeover's scroll, E.27: exit "restores the station accordion in its
	   prior state." The RETRACT states survive on their own, because nothing
	   here unmounts. The scroll does not: `display: none` drops the box, and a
	   box with no layout has no scrollTop to keep.

	   `$effect.pre`, NOT `$effect`, and this was MEASURED rather than reasoned.
	   A plain `$effect` runs AFTER the DOM update, so by the time it read
	   `scrollTop` the element was already stowed and it read 0; backing out of
	   a drawer scrolled to 300 landed at 0, which is the thing this code
	   exists to prevent. A pre-effect runs before the update, while the
	   element still has its layout. The RESTORE is the mirror case and has to
	   wait for the layout to come back, so it is deferred one frame.

	   THE ONE SELF-SCROLL IN THE WHOLE DRAWER, N.108 increment 3, and it
	   rides in the same effect. N.108 §2: "the drawer never scrolls itself,
	   except once, on entry to the calibration takeover." The singer must
	   land on the ritual and not part-way down it, and the drawer's own
	   scroll is held and given back on exit so they land where they were.

	   IT IS WRITTEN ON THE WAY OUT, NOT ON THE WAY IN, AND THAT WAS MEASURED
	   RATHER THAN CHOSEN. The prototype sets `takeoverBody.scrollTop = 0` on
	   entry (`:602`), where the element is already showing. Here the element
	   is `display: none` until the update lands, so the write has to be
	   deferred, and a deferred write LOSES: `display: none` does not discard
	   this box's scroll offset, Chrome restores it when the box gets its
	   layout back, and that restoration happens after `requestAnimationFrame`
	   runs. Observed on the production build, 2026-09-03: scroll the ritual
	   to 200, back out, re-enter, and the ritual comes back at 200 with the
	   rAF write already spent.

	   ON THE WAY OUT the box still has its layout, so `scrollTop = 0` is one
	   synchronous write with nothing to race, and the next entry is at the
	   top by construction. It is the same argument the stow above makes for
	   reading `scrollTop` in a pre-effect, used in the other direction.
	   NOTHING IS PAINTED SCROLLED: this runs before the DOM update that
	   stows the box, so the reset and the hide land in one frame. */
	let stowedScrollTop = 0;
	let takeoverWas = false;
	let takeoverBodyEl: HTMLElement | undefined = $state();
	$effect.pre(() => {
		const active = takeoverActive;
		if (active === takeoverWas) return;
		takeoverWas = active;
		const el = drawerContentEl;
		if (!el) return;
		if (active) {
			stowedScrollTop = el.scrollTop;
		} else {
			if (takeoverBodyEl) takeoverBodyEl.scrollTop = 0;
			requestAnimationFrame(() => {
				el.scrollTop = stowedScrollTop;
			});
		}
	});

	function isActive(id: string): boolean {
		return activeHeadingId === id;
	}

	function sectionContainsActive(id: string): boolean {
		if (!activeHeadingId) return false;
		return getParentIds(activeHeadingId).includes(id);
	}
</script>

<aside
	class="drawer"
	class:lowered={isMobile && !raised}
	data-tab={activeTab}
	style={isMobile ? '' : `width: ${width}px`}
	aria-label={t('a11y.drawer', language)}
	inert={isMobile && !raised}
	ontouchstart={onTouchStart}
	ontouchend={(e) => onTouchEnd(e, true)}
>
	<div class="drawer-clip">
	<div class="drawer-body" id="drawer-body" style="{isMobile ? '' : `width: ${width}px`}">
		<!-- THE TWO PINNED ANCHORS ARE GONE, N.108 increment 1. A pinned top
		     carrying Piece and Notation and a pinned bottom carrying the voice
		     were the N.73 S3 column, ratified 2026-08-19. The three frames
		     replace them: Notation is in Text, the voice is in Score markup,
		     and everything in the drawer scrolls in one box, which is what
		     lets the opening state be measured as one height. Their two rules,
		     the sage down-facing one and the lavender up-facing one, go with
		     them; the group bands are the boundaries now. -->
		<!-- N.73 S3 ship two. THE DRAWER IS NOT A TABPANEL, and it stopped
		     being one at S2. This box carried `role="tabpanel"`,
		     `id="tabpanel-{activeTab}"` and `aria-labelledby="tab-{activeTab}"`
		     from the four-tab shape, where each destination had its own drawer.
		     S2 merged Studio's two, so the pair's two members now share this
		     box byte for byte, and a panel that does not change when the tab
		     changes is not that tab's panel. Only one id was ever in the DOM,
		     so the inactive pair member's `aria-controls` pointed at nothing.
		     The drawer is what its own outer element already says it is: an
		     `<aside>` named `a11y.drawer`, a complementary landmark that
		     stands beside the desk on every destination. `aria-controls` is
		     optional on a `tab` in ARIA 1.2, and an absent reference beats a
		     broken one. `DeskHead` drops its half in the same ship. -->
		<div
			class="drawer-content"
			class:stowed={takeoverActive}
			bind:this={drawerContentEl}
		>
				<!-- N.73 S2. ONE Studio drawer. Both panels render, always, in this
				     order, on both of Studio's documents, so nothing in the drawer
				     appears, disappears, or moves when the singer flips the pair.
				     Their own {#if} guards still suppress score-only content, and
				     shanePanel carries its own INCLUDE_SHANE gate. Learn and Guide
				     are untouched. -->
				{#if isStudio}
					<!-- ═══ PIECE. N.108, Dann's ruling of 2026-09-02: the first
					     group is named Piece, "not every piece will be a song:
					     some will be arias." It borrows Guide's cobalt on
					     purpose, which overrides "hue names place" for Guide,
					     also on purpose and also his ruling. -->
					<section class="group group-piece">
						<h2 class="group-band">
							<span class="band-name">{t('group.piece', language)}</span>
							<!-- METADATA'S AFFORDANCE, at every size. See the
							     `metadataBody` prop for why it is unconditional
							     and what it overrides. It costs no height,
							     because the band is already there. -->
							{#if metadataBody}
								<button
									type="button"
									class="band-link"
									aria-expanded={metadataOpen}
									aria-controls={metadataOpen ? 'station-metadata' : undefined}
									onclick={() => onmetadatatoggle?.()}
								>{t('meta.heading', language)}</button>
							{/if}
						</h2>
						{#if metadataOpen && metadataBody}
							<div class="band-body" id="station-metadata">{@render metadataBody()}</div>
						{/if}
						{@render pieceGroup?.()}
					</section>
					<!-- ═══ INPUT. N.108-5, ruled by Dann 2026-09-07: the intake
					     leaves Piece and takes a band of its own between Piece
					     and Text, "named INPUT, painted sage like Text (hue names
					     place: it is text)". Same recipe as its three
					     neighbours; the only thing that distinguishes it is
					     which token paints the band.

					     IT HAS NO STATION ROW INSIDE IT, which is the
					     2026-09-02 ruling untouched: the intake is never closed
					     and has no id in the open set. So this band is the
					     region's name and the frame under it is the region,
					     with nothing between them to open or shut. -->
					<section class="group group-input">
						<h2 class="group-band"><span class="band-name">{t('group.input', language)}</span></h2>
						{@render inputGroup?.()}
					</section>
					<!-- ═══ TEXT. Sage, one step down. Notation and Analysis. -->
					<section class="group group-text">
						<h2 class="group-band"><span class="band-name">{t('group.text', language)}</span></h2>
						{@render textGroup?.()}
					</section>
					<!-- ═══ SCORE MARKUP. Lavender, one step down. Underlay,
					     Corrections, Voice. -->
					<section class="group group-score">
						<h2 class="group-band"><span class="band-name">{t('group.scoreMarkup', language)}</span></h2>
						{@render scoreGroup?.()}
					</section>
				{:else if destination === 'learn'}
					<nav class="learn-toc" aria-label={language === 'fr' ? 'Table des matières' : 'Table of contents'}>
						<h2 class="toc-heading toc-heading-learn">{language === 'fr' ? 'LEÇONS' : 'LEARN'}</h2>
						<ul class="toc-list">
							<li>
								<button class="toc-link toc-title" class:active={isActive('learn-title')} data-heading-id="learn-title" onclick={() => handleTocClick('learn-title')}>
									{language === 'fr' ? 'La diction lyrique russe pour chanteurs' : 'Russian Lyric Diction for Singers'}
								</button>
							</li>
							<li>
								<button class="toc-link" class:active={isActive('learn-about')} data-heading-id="learn-about" onclick={() => handleTocClick('learn-about')}>
									{language === 'fr' ? 'À propos de ce module' : 'About This Module'}
								</button>
							</li>
							<li>
								<button class="toc-link" class:active={isActive('learn-arc')} data-heading-id="learn-arc" onclick={() => handleTocClick('learn-arc')}>
									{language === 'fr' ? 'L\u2019arc d\u2019apprentissage' : 'The Learning Arc'}
								</button>
							</li>

							<!-- ── Unit 1 ── -->
							<li>
								<div class="toc-parent">
									<button class="toc-chevron" class:expanded={toc.has('learn-unit-1')} class:contains-active={sectionContainsActive('learn-unit-1')} onclick={() => toc.toggle('learn-unit-1')} aria-label={t('a11y.tocToggle', language)}><svg class="chevron-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,1.5 7,5 3,8.5" /></svg></button>
									<button class="toc-link" class:active={isActive('learn-unit-1')} data-heading-id="learn-unit-1" onclick={() => handleTocClick('learn-unit-1')}>
										{language === 'fr' ? '1 \u00b7 Les lettres' : '1 \u00b7 The Letters'}
									</button>
								</div>
								<div class="toc-children" class:expanded={toc.has('learn-unit-1')}><div class="toc-children-inner"><ul class="toc-subsections">
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u1-song')} data-heading-id="learn-u1-song" onclick={() => handleTocClick('learn-u1-song')}>{language === 'fr' ? 'La chanson de l\u2019alphabet' : 'The Alphabet Song'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u1-alphabet')} data-heading-id="learn-u1-alphabet" onclick={() => handleTocClick('learn-u1-alphabet')}>{language === 'fr' ? 'L\u2019alphabet' : 'The Alphabet'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u1-familiar')} data-heading-id="learn-u1-familiar" onclick={() => handleTocClick('learn-u1-familiar')}>{language === 'fr' ? 'Ce que vous connaissez d\u00e9j\u00e0' : 'What You Already Know'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u1-signs')} data-heading-id="learn-u1-signs" onclick={() => handleTocClick('learn-u1-signs')}>{language === 'fr' ? 'Les deux signes' : 'The Two Signs'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u1-yo')} data-heading-id="learn-u1-yo" onclick={() => handleTocClick('learn-u1-yo')}>{language === 'fr' ? 'Note sur \u27E8\u0401\u27E9' : 'A Note on \u27E8\u0401\u27E9'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u1-glyphs')} data-heading-id="learn-u1-glyphs" onclick={() => handleTocClick('learn-u1-glyphs')}>{language === 'fr' ? 'Le tableau des glyphes' : 'The Glyph Table'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u1-try')} data-heading-id="learn-u1-try" onclick={() => handleTocClick('learn-u1-try')}>{language === 'fr' ? 'Essayez' : 'Try This'}</button></li>
								</ul></div></div>
							</li>

							<!-- ── Unit 2 ── -->
							<li>
								<div class="toc-parent">
									<button class="toc-chevron" class:expanded={toc.has('learn-unit-2')} class:contains-active={sectionContainsActive('learn-unit-2')} onclick={() => toc.toggle('learn-unit-2')} aria-label={t('a11y.tocToggle', language)}><svg class="chevron-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,1.5 7,5 3,8.5" /></svg></button>
									<button class="toc-link" class:active={isActive('learn-unit-2')} data-heading-id="learn-unit-2" onclick={() => handleTocClick('learn-unit-2')}>
										{language === 'fr' ? '2 \u00b7 L\u2019accent tonique' : '2 \u00b7 Stress'}
									</button>
								</div>
								<div class="toc-children" class:expanded={toc.has('learn-unit-2')}><div class="toc-children-inner"><ul class="toc-subsections">
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u2-meaning')} data-heading-id="learn-u2-meaning" onclick={() => handleTocClick('learn-u2-meaning')}>{language === 'fr' ? 'L\u2019accent change le sens' : 'Stress changes meaning'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u2-moves')} data-heading-id="learn-u2-moves" onclick={() => handleTocClick('learn-u2-moves')}>{language === 'fr' ? 'L\u2019accent se d\u00e9place' : 'Stress moves'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u2-dictionary')} data-heading-id="learn-u2-dictionary" onclick={() => handleTocClick('learn-u2-dictionary')}>{language === 'fr' ? 'Probl\u00e8me de dictionnaire' : 'A dictionary problem'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u2-sounds')} data-heading-id="learn-u2-sounds" onclick={() => handleTocClick('learn-u2-sounds')}>{language === 'fr' ? 'Comment l\u2019accent sonne' : 'How stress sounds'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u2-try')} data-heading-id="learn-u2-try" onclick={() => handleTocClick('learn-u2-try')}>{language === 'fr' ? 'Essayez' : 'Try this'}</button></li>
								</ul></div></div>
							</li>

							<!-- ── Unit 3 ── -->
							<li>
								<div class="toc-parent">
									<button class="toc-chevron" class:expanded={toc.has('learn-unit-3')} class:contains-active={sectionContainsActive('learn-unit-3')} onclick={() => toc.toggle('learn-unit-3')} aria-label={t('a11y.tocToggle', language)}><svg class="chevron-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,1.5 7,5 3,8.5" /></svg></button>
									<button class="toc-link" class:active={isActive('learn-unit-3')} data-heading-id="learn-unit-3" onclick={() => handleTocClick('learn-unit-3')}>
										{language === 'fr' ? '3 \u00b7 Les voyelles accentu\u00e9es' : '3 \u00b7 Stressed Vowels'}
									</button>
								</div>
								<div class="toc-children" class:expanded={toc.has('learn-unit-3')}><div class="toc-children-inner"><ul class="toc-subsections">
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u3-inventory')} data-heading-id="learn-u3-inventory" onclick={() => handleTocClick('learn-u3-inventory')}>{language === 'fr' ? 'Ce sont les voyelles accentu\u00e9es qui constituent les cibles' : 'Stressed vowels are the targets'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u3-note-o')} data-heading-id="learn-u3-note-o" onclick={() => handleTocClick('learn-u3-note-o')}>{language === 'fr' ? 'Un mot sur le /o/' : 'A note on /o/'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u3-interpalatal')} data-heading-id="learn-u3-interpalatal" onclick={() => handleTocClick('learn-u3-interpalatal')}>{language === 'fr' ? 'Deux voyelles changent de couleur au voisinage des consonnes molles' : 'Two vowels change colour near soft consonants'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u3-iotated')} data-heading-id="learn-u3-iotated" onclick={() => handleTocClick('learn-u3-iotated')}>{language === 'fr' ? 'Quatre lettres vocaliques portent une consonne cach\u00e9e' : 'Four vowel letters carry a hidden consonant'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u3-yo')} data-heading-id="learn-u3-yo" onclick={() => handleTocClick('learn-u3-yo')}>{language === 'fr' ? '\u27E8\u0451\u27E9 est toujours accentu\u00e9' : '\u27E8\u0451\u27E9 is always stressed'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u3-try')} data-heading-id="learn-u3-try" onclick={() => handleTocClick('learn-u3-try')}>{language === 'fr' ? 'Essayez dans Ilya' : 'Try this in Ilya'}</button></li>
								</ul></div></div>
							</li>

							<!-- ── Unit 4 ── -->
							<li>
								<div class="toc-parent">
									<button class="toc-chevron" class:expanded={toc.has('learn-unit-4')} class:contains-active={sectionContainsActive('learn-unit-4')} onclick={() => toc.toggle('learn-unit-4')} aria-label={t('a11y.tocToggle', language)}><svg class="chevron-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,1.5 7,5 3,8.5" /></svg></button>
									<button class="toc-link" class:active={isActive('learn-unit-4')} data-heading-id="learn-unit-4" onclick={() => handleTocClick('learn-unit-4')}>
										{language === 'fr' ? '4 \u00b7 La r\u00e9duction vocalique' : '4 \u00b7 Vowel Reduction'}
									</button>
								</div>
								<div class="toc-children" class:expanded={toc.has('learn-unit-4')}><div class="toc-children-inner"><ul class="toc-subsections">
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u4-akanye')} data-heading-id="learn-u4-akanye" onclick={() => handleTocClick('learn-u4-akanye')}>{language === 'fr' ? '\u27E8\u043E\u27E9 et \u27E8\u0430\u27E9 sans accent' : '\u27E8\u043E\u27E9 and \u27E8\u0430\u27E9 when unstressed'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u4-ikanye')} data-heading-id="learn-u4-ikanye" onclick={() => handleTocClick('learn-u4-ikanye')}>{language === 'fr' ? '\u27E8\u0435\u27E9 et \u27E8\u044F\u27E9 vers [\u026A]' : '\u27E8\u0435\u27E9 and \u27E8\u044F\u27E9 toward [\u026A]'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u4-reconstitution')} data-heading-id="learn-u4-reconstitution" onclick={() => handleTocClick('learn-u4-reconstitution')}>{language === 'fr' ? 'La reconstitution' : 'Reconstitution'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u4-try')} data-heading-id="learn-u4-try" onclick={() => handleTocClick('learn-u4-try')}>{language === 'fr' ? 'Essayez dans Ilya' : 'Try this in Ilya'}</button></li>
								</ul></div></div>
							</li>

							<!-- ── Unit 5 ── -->
							<li>
								<div class="toc-parent">
									<button class="toc-chevron" class:expanded={toc.has('learn-unit-5')} class:contains-active={sectionContainsActive('learn-unit-5')} onclick={() => toc.toggle('learn-unit-5')} aria-label={t('a11y.tocToggle', language)}><svg class="chevron-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,1.5 7,5 3,8.5" /></svg></button>
									<button class="toc-link" class:active={isActive('learn-unit-5')} data-heading-id="learn-unit-5" onclick={() => handleTocClick('learn-unit-5')}>
										{language === 'fr' ? '5 \u00b7 Les consonnes' : '5 \u00b7 The Consonants'}
									</button>
								</div>
								<div class="toc-children" class:expanded={toc.has('learn-unit-5')}><div class="toc-children-inner"><ul class="toc-subsections">
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u5-familiar')} data-heading-id="learn-u5-familiar" onclick={() => handleTocClick('learn-u5-familiar')}>{language === 'fr' ? 'Le syst\u00e8me consonantique' : 'The consonant system'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u5-pairs')} data-heading-id="learn-u5-pairs" onclick={() => handleTocClick('learn-u5-pairs')}>{language === 'fr' ? 'Paires vois\u00e9es-non vois\u00e9es' : 'Voiced-voiceless pairs'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u5-attention')} data-heading-id="learn-u5-attention" onclick={() => handleTocClick('learn-u5-attention')}>{language === 'fr' ? 'Attention cibl\u00e9e' : 'Focused attention'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u5-fixed')} data-heading-id="learn-u5-fixed" onclick={() => handleTocClick('learn-u5-fixed')}>{language === 'fr' ? 'Duret\u00e9 ou mollesse fixe' : 'Fixed hardness or softness'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u5-signs')} data-heading-id="learn-u5-signs" onclick={() => handleTocClick('learn-u5-signs')}>{language === 'fr' ? 'Les deux signes' : 'The two signs'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u5-devoicing')} data-heading-id="learn-u5-devoicing" onclick={() => handleTocClick('learn-u5-devoicing')}>{language === 'fr' ? 'D\u00e9voisement final' : 'Final devoicing'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u5-try')} data-heading-id="learn-u5-try" onclick={() => handleTocClick('learn-u5-try')}>{language === 'fr' ? 'Essayez dans Ilya' : 'Try this in Ilya'}</button></li>
								</ul></div></div>
							</li>

							<!-- ── Unit 6 ── -->
							<li>
								<div class="toc-parent">
									<button class="toc-chevron" class:expanded={toc.has('learn-unit-6')} class:contains-active={sectionContainsActive('learn-unit-6')} onclick={() => toc.toggle('learn-unit-6')} aria-label={t('a11y.tocToggle', language)}><svg class="chevron-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,1.5 7,5 3,8.5" /></svg></button>
									<button class="toc-link" class:active={isActive('learn-unit-6')} data-heading-id="learn-unit-6" onclick={() => handleTocClick('learn-unit-6')}>
										{language === 'fr' ? '6 \u00b7 La palatalisation' : '6 \u00b7 Palatalization'}
									</button>
								</div>
								<div class="toc-children" class:expanded={toc.has('learn-unit-6')}><div class="toc-children-inner"><ul class="toc-subsections">
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u6-what')} data-heading-id="learn-u6-what" onclick={() => handleTocClick('learn-u6-what')}>{language === 'fr' ? 'Qu\u2019est-ce que la palatalisation\u00A0?' : 'What palatalization is'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u6-signals')} data-heading-id="learn-u6-signals" onclick={() => handleTocClick('learn-u6-signals')}>{language === 'fr' ? 'Rep\u00E9rer la palatalisation \u00E0 l\u2019\u00E9crit' : 'Signals on the page'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u6-stops')} data-heading-id="learn-u6-stops" onclick={() => handleTocClick('learn-u6-stops')}>{language === 'fr' ? 'Les six fronti\u00E8res' : 'What stops the spread'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u6-paired')} data-heading-id="learn-u6-paired" onclick={() => handleTocClick('learn-u6-paired')}>{language === 'fr' ? 'Appari\u00E9es et non appari\u00E9es' : 'Paired versus unpaired'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u6-clusters')} data-heading-id="learn-u6-clusters" onclick={() => handleTocClick('learn-u6-clusters')}>{language === 'fr' ? 'R\u00E9gressive dans les groupes' : 'Regressive in clusters'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u6-practice')} data-heading-id="learn-u6-practice" onclick={() => handleTocClick('learn-u6-practice')}>{language === 'fr' ? 'Mise en pratique' : 'Putting it together'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u6-velari')} data-heading-id="learn-u6-velari" onclick={() => handleTocClick('learn-u6-velari')}>{language === 'fr' ? 'Le i v\u00E9laire [\u0268]' : 'Velar-i [\u0268]'}</button></li>
								</ul></div></div>
							</li>

							<!-- ── Unit 7 ── -->
							<li>
								<div class="toc-parent">
									<button class="toc-chevron" class:expanded={toc.has('learn-unit-7')} class:contains-active={sectionContainsActive('learn-unit-7')} onclick={() => toc.toggle('learn-unit-7')} aria-label={t('a11y.tocToggle', language)}><svg class="chevron-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,1.5 7,5 3,8.5" /></svg></button>
									<button class="toc-link" class:active={isActive('learn-unit-7')} data-heading-id="learn-unit-7" onclick={() => handleTocClick('learn-unit-7')}>
										{language === 'fr' ? '7 \u00b7 Assimilation et fronti\u00e8res' : '7 \u00b7 Assimilation and Boundaries'}
									</button>
								</div>
								<div class="toc-children" class:expanded={toc.has('learn-unit-7')}><div class="toc-children-inner"><ul class="toc-subsections">
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u7-two')} data-heading-id="learn-u7-two" onclick={() => handleTocClick('learn-u7-two')}>{language === 'fr' ? 'Deux formes d\u2019assimilation' : 'Two kinds of assimilation'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u7-voiced')} data-heading-id="learn-u7-voiced" onclick={() => handleTocClick('learn-u7-voiced')}>{language === 'fr' ? 'Vois\u00e9e rencontre sourde' : 'Voiced meets voiceless'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u7-stops')} data-heading-id="learn-u7-stops" onclick={() => handleTocClick('learn-u7-stops')}>{language === 'fr' ? 'Les limites du voisement' : 'What stops the spread'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u7-boundary')} data-heading-id="learn-u7-boundary" onclick={() => handleTocClick('learn-u7-boundary')}>{language === 'fr' ? 'D\u2019un mot \u00e0 l\u2019autre' : 'Across word boundaries'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u7-deletion')} data-heading-id="learn-u7-deletion" onclick={() => handleTocClick('learn-u7-deletion')}>{language === 'fr' ? 'L\u2019effacement consonantique' : 'Consonant deletion'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u7-mergers')} data-heading-id="learn-u7-mergers" onclick={() => handleTocClick('learn-u7-mergers')}>{language === 'fr' ? 'Fusions et absorptions' : 'Mergers and acquisitions'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u7-unusual')} data-heading-id="learn-u7-unusual" onclick={() => handleTocClick('learn-u7-unusual')}>{language === 'fr' ? '\u0441\u043A\u0443\u0447\u043D\u043E et \u0447\u0442\u043E' : '\u0441\u043A\u0443\u0447\u043D\u043E and \u0447\u0442\u043E'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u7-geminates')} data-heading-id="learn-u7-geminates" onclick={() => handleTocClick('learn-u7-geminates')}>{language === 'fr' ? 'Les g\u00e9min\u00e9es' : 'Geminates'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('learn-u7-tryit')} data-heading-id="learn-u7-tryit" onclick={() => handleTocClick('learn-u7-tryit')}>{language === 'fr' ? '\u00C0 vous de jouer' : 'Try this in Ilya'}</button></li>
								</ul></div></div>
							</li>

							<!-- ── Section 8 + closing items ── -->
							<li>
								<div class="toc-parent">
									<span class="toc-chevron-spacer" aria-hidden="true"></span>
									<button class="toc-link" class:active={isActive('learn-coda')} data-heading-id="learn-coda" onclick={() => handleTocClick('learn-coda')}>
										{language === 'fr' ? '8 \u00b7 Les inclassables' : '8 \u00b7 What These Rules Do Not Teach'}
									</button>
								</div>
							</li>
							<li>
								<button class="toc-link" class:active={isActive('learn-try')} data-heading-id="learn-try" onclick={() => handleTocClick('learn-try')}>
									{language === 'fr' ? 'Essayez' : 'Try This'}
								</button>
							</li>
							<li>
								<button class="toc-link" class:active={isActive('learn-notation')} data-heading-id="learn-notation" onclick={() => handleTocClick('learn-notation')}>
									{language === 'fr' ? 'Note sur la notation' : 'A Note on Notation'}
								</button>
							</li>
						</ul>
					</nav>
				{:else if destination === 'guide'}
					<nav class="learn-toc guide-toc" aria-label={language === 'fr' ? 'Table des matières du Guide' : 'Guide table of contents'}>
						<h2 class="toc-heading toc-heading-guide">GUIDE</h2>
						<ul class="toc-list">

							<!-- ── How Ilya Works ── -->
							<li>
								<div class="toc-parent">
									<button class="toc-chevron" class:expanded={toc.has('guide-how')} class:contains-active={sectionContainsActive('guide-how')} onclick={() => toc.toggle('guide-how')} aria-label={t('a11y.tocToggle', language)}><svg class="chevron-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,1.5 7,5 3,8.5" /></svg></button>
									<button class="toc-link toc-title" class:active={isActive('guide-how')} data-heading-id="guide-how" onclick={() => handleTocClick('guide-how')}>
										{language === 'fr' ? 'Comment fonctionne Ilya' : 'How Ilya Works'}
									</button>
								</div>
								<div class="toc-children" class:expanded={toc.has('guide-how')}><div class="toc-children-inner"><ul class="toc-subsections">
									<li><button class="toc-link toc-sub" class:active={isActive('guide-what')} data-heading-id="guide-what" onclick={() => handleTocClick('guide-what')}>{language === 'fr' ? 'Que fait Ilya?' : 'What does Ilya do?'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('guide-paste')} data-heading-id="guide-paste" onclick={() => handleTocClick('guide-paste')}>{language === 'fr' ? 'Saisie d\u2019un texte russe' : 'Pasting a Russian text'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('guide-source')} data-heading-id="guide-source" onclick={() => handleTocClick('guide-source')}>{language === 'fr' ? 'Pourquoi une seule source?' : 'Why only one source?'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('guide-ai')} data-heading-id="guide-ai" onclick={() => handleTocClick('guide-ai')}>{language === 'fr' ? 'Ilya et l\u2019IA' : 'Is Ilya an AI tool?'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('guide-role')} data-heading-id="guide-role" onclick={() => handleTocClick('guide-role')}>{language === 'fr' ? 'R\u00f4le de l\u2019utilisateur' : 'Your role as user'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('guide-limits')} data-heading-id="guide-limits" onclick={() => handleTocClick('guide-limits')}>{language === 'fr' ? 'Limites d\u2019Ilya' : 'Limitations'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('guide-future')} data-heading-id="guide-future" onclick={() => handleTocClick('guide-future')}>{language === 'fr' ? 'O\u00f9 va Ilya?' : 'Where is Ilya headed?'}</button></li>
								<li><button class="toc-link toc-sub" class:active={isActive('guide-fit-forecast')} data-heading-id="guide-fit-forecast" onclick={() => handleTocClick('guide-fit-forecast')}>{language === 'fr' ? 'Fit pr\u00e9voit, il ne d\u00e9clare pas' : 'Fit forecasts, it doesn\u2019t declare'}</button></li>
								<li><button class="toc-link toc-sub" class:active={isActive('guide-fit-characteristics')} data-heading-id="guide-fit-characteristics" onclick={() => handleTocClick('guide-fit-characteristics')}>{language === 'fr' ? 'Caract\u00e9ristiques vocales' : 'Voice characteristics'}</button></li>
								<li><button class="toc-link toc-sub" class:active={isActive('guide-fit-notation')} data-heading-id="guide-fit-notation" onclick={() => handleTocClick('guide-fit-notation')}>{language === 'fr' ? 'Conventions de notation de Fit' : 'Fit\u2019s notation conventions'}</button></li>
								</ul></div></div>
							</li>

							<!-- ── Walkthrough ── -->
							<li>
								<div class="toc-parent">
									<button class="toc-chevron" class:expanded={toc.has('guide-walkthrough')} class:contains-active={sectionContainsActive('guide-walkthrough')} onclick={() => toc.toggle('guide-walkthrough')} aria-label={t('a11y.tocToggle', language)}><svg class="chevron-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,1.5 7,5 3,8.5" /></svg></button>
									<button class="toc-link toc-title" class:active={isActive('guide-walkthrough')} data-heading-id="guide-walkthrough" onclick={() => handleTocClick('guide-walkthrough')}>
										{language === 'fr' ? 'Une visite guidée' : 'A Walkthrough'}
									</button>
								</div>
								<div class="toc-children" class:expanded={toc.has('guide-walkthrough')}><div class="toc-children-inner"><ul class="toc-subsections">
									<li><button class="toc-link toc-sub" class:active={isActive('guide-walk-interface')} data-heading-id="guide-walk-interface" onclick={() => handleTocClick('guide-walk-interface')}>{language === 'fr' ? 'L’interface en un coup d’œil' : 'The interface at a glance'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('guide-walk-tabs')} data-heading-id="guide-walk-tabs" onclick={() => handleTocClick('guide-walk-tabs')}>{language === 'fr' ? 'Naviguer entre les onglets' : 'Navigating the tabs'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('guide-walk-metadata')} data-heading-id="guide-walk-metadata" onclick={() => handleTocClick('guide-walk-metadata')}>{language === 'fr' ? 'Renseigner les métadonnées' : 'Entering metadata'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('guide-walk-transcribe')} data-heading-id="guide-walk-transcribe" onclick={() => handleTocClick('guide-walk-transcribe')}>{language === 'fr' ? 'Transcrire' : 'Transcribing'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('guide-walk-analysis')} data-heading-id="guide-walk-analysis" onclick={() => handleTocClick('guide-walk-analysis')}>{language === 'fr' ? 'Analyser les mots' : 'Analysing words'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('guide-walk-notation')} data-heading-id="guide-walk-notation" onclick={() => handleTocClick('guide-walk-notation')}>{language === 'fr' ? 'Les préférences de notation' : 'Notation preferences'}</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('guide-walk-print')} data-heading-id="guide-walk-print" onclick={() => handleTocClick('guide-walk-print')}>{language === 'fr' ? 'Imprimer et réinitialiser' : 'Printing and resetting'}</button></li>
								</ul></div></div>
							</li>

							<!-- ── Contributors ── -->
							<li>
								<div class="toc-parent">
									<button class="toc-chevron" class:expanded={toc.has('guide-contributors')} class:contains-active={sectionContainsActive('guide-contributors')} onclick={() => toc.toggle('guide-contributors')} aria-label={t('a11y.tocToggle', language)}><svg class="chevron-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,1.5 7,5 3,8.5" /></svg></button>
									<button class="toc-link toc-title" class:active={isActive('guide-contributors')} data-heading-id="guide-contributors" onclick={() => handleTocClick('guide-contributors')}>
										{language === 'fr' ? 'Collaborateurs' : 'Contributors'}
									</button>
								</div>
								<div class="toc-children" class:expanded={toc.has('guide-contributors')}><div class="toc-children-inner"><ul class="toc-subsections">

									<!-- Craig Grayson -->
									<li>
										<div class="toc-parent toc-parent-nested">
											<button class="toc-chevron toc-chevron-nested" class:expanded={toc.has('guide-grayson')} class:contains-active={sectionContainsActive('guide-grayson')} onclick={() => toc.toggle('guide-grayson')} aria-label={t('a11y.tocToggle', language)}><svg class="chevron-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,1.5 7,5 3,8.5" /></svg></button>
											<button class="toc-link toc-sub" class:active={isActive('guide-grayson')} data-heading-id="guide-grayson" onclick={() => handleTocClick('guide-grayson')}>Craig Grayson</button>
										</div>
										<div class="toc-children" class:expanded={toc.has('guide-grayson')}><div class="toc-children-inner"><ul class="toc-subsections">
											<li><button class="toc-link toc-deep" class:active={isActive('guide-grayson-intro')} data-heading-id="guide-grayson-intro" onclick={() => handleTocClick('guide-grayson-intro')}>{language === 'fr' ? 'Introduction \u00e0 Russian Lyric Diction' : 'Introduction to Russian Lyric Diction'}</button></li>
										</ul></div></div>
									</li>

									<!-- Dann Mitton -->
									<li>
										<div class="toc-parent toc-parent-nested">
											<button class="toc-chevron toc-chevron-nested" class:expanded={toc.has('guide-mitton')} class:contains-active={sectionContainsActive('guide-mitton')} onclick={() => toc.toggle('guide-mitton')} aria-label={t('a11y.tocToggle', language)}><svg class="chevron-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,1.5 7,5 3,8.5" /></svg></button>
											<button class="toc-link toc-sub" class:active={isActive('guide-mitton')} data-heading-id="guide-mitton" onclick={() => handleTocClick('guide-mitton')}>Dann Mitton</button>
										</div>
										<div class="toc-children" class:expanded={toc.has('guide-mitton')}><div class="toc-children-inner"><ul class="toc-subsections">
											<li><button class="toc-link toc-deep" class:active={isActive('guide-mitton-note')} data-heading-id="guide-mitton-note" onclick={() => handleTocClick('guide-mitton-note')}>{language === 'fr' ? 'Mot du cr\u00e9ateur' : "Builder's Note"}</button></li>
										</ul></div></div>
									</li>

									<li><button class="toc-link toc-sub" class:active={isActive('guide-claude')} data-heading-id="guide-claude" onclick={() => handleTocClick('guide-claude')}>Claude</button></li>
									<li><button class="toc-link toc-sub" class:active={isActive('guide-kimi')} data-heading-id="guide-kimi" onclick={() => handleTocClick('guide-kimi')}>Kimi</button></li>
								</ul></div></div>
							</li>

							<!-- Licences -->
							<li><button class="toc-link" class:active={isActive('guide-licences')} data-heading-id="guide-licences" onclick={() => handleTocClick('guide-licences')}>{language === 'fr' ? 'Licences et remerciements' : 'Licences and Acknowledgments'}</button></li>
						</ul>
					</nav>
				{/if}
		</div>
		<!-- THE CALIBRATION TAKEOVER (N.73 S3 ship one, redressed at N.108
		     increment 3). Always in the tree on Studio and hidden until it is
		     entered; see the `voiceTakeover` prop for why it is not a
		     conditional mount. It is a SIBLING of the three groups above and
		     hides all of them, which is E.27's "replaces the entire drawer":
		     the groups, their bands and the voice line are not visible during
		     the ritual. Its back affordance reuses `inspector.back`, a
		     ratified string, so the takeover writes no new French.

		     THE NEW DRESS IS ONE GROUP, GROWN. Ruled by Dann 2026-09-02:
		     calibration stays a takeover and Design restyles it in the new
		     dress. So this is a fourth frame at the 20 px surface radius,
		     wearing the Score markup band, because the ritual IS the Score
		     markup group's Voice station filling the drawer. The prototype
		     draws it at `.takeover-frame`, `.takeover-band`,
		     `.takeover-title` (`n108-drawer-prototype_r2_2026-09-02.html`).

		     BACK IS ON THE LEFT OF THE BAND, which is the build brief §1.2
		     overriding the prototype: "Back sits on the LEFT of the
		     takeover's band, where `Drawer.svelte:619` puts it today. The
		     prototype has it on the right; reverse the flex order." It is
		     first in the markup, which is that reversal.

		     THE BAND SAYS THE GROUP AND THE TITLE SAYS THE STATION. Two
		     labels rather than one, and the prototype gives the reason: the
		     band is the group's name, so the station the ritual grew from
		     has to say its own. -->
		{#if isStudio && voiceTakeover}
			<div class="drawer-takeover" class:stowed={!takeoverActive}>
				<div class="takeover-frame">
					<h2 class="takeover-band">
						<button type="button" class="takeover-back" onclick={() => onexittakeover?.()}>
							{t('inspector.back', language)}
						</button>
						<span class="band-name">{t('group.scoreMarkup', language)}</span>
					</h2>
					<div class="takeover-body" bind:this={takeoverBodyEl}>
						<p class="takeover-title">{t('voice.heading', language)}</p>
						{@render voiceTakeover()}
					</div>
				</div>
			</div>
		{/if}
	</div>
	</div>
</aside>

<!-- ── THE PULL (N.108 increment 1a), PHONE ONLY ────────────────────────
     `docs/sessions/drawing-n108-pull_r2_2026-09-02.png`, ruled by Dann
     2026-09-02: one horizontal labelled pull on the bottom edge, 44 px tall,
     drawer paper, reading PAPER when the drawer is up and DRAWER when the
     paper is up. One control, one place, both states.

     THIS AMENDS THE 2026-08-19 RULING IN BOTH ITS PARTS
     (`claude/ruling-drawer-horizontal-motion-and-bare-chevron_2026-08-19.md`).
     That ruling withdrew the phone's vertical motion as a form-factor
     concession and made the pull a bare chevron. His words tonight: "The
     vertical model for mobile that you offered is fine. Let's go with that."
     So the motion is vertical again and the pull carries a word again.

     A SIBLING OF THE DRAWER, NOT A CHILD, and that is load-bearing: the drawer
     translates off the bottom of the screen and the pull must not go with it.

     THE CHEVRON POINTS THE WAY THE DRAWER WILL MOVE when pressed, which is the
     rule this drawer's chevron has always followed: down with the drawer up,
     up with the paper up. It leads the word, as the drawing draws it.

     ON THE DESK IT DOES NOT EXIST. Not hidden: not rendered. There is nothing
     for it to do, because the drawer is always present. -->
{#if isMobile}
	<button
		type="button"
		class="drawer-pull"
		onclick={ontogglepull}
		ontouchstart={onTouchStart}
		ontouchend={(e) => onTouchEnd(e, false)}
		aria-expanded={raised}
		aria-controls="drawer-body"
	>
		<svg class="pull-chevron" class:up={!raised} aria-hidden="true" width="14" height="9" viewBox="0 0 14 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="2,2 7,7 12,2" />
		</svg>
		<span class="pull-label">{raised ? t('drawer.paper', language) : t('drawer.pull', language)}</span>
	</button>
{/if}

<style>
	.drawer {
		position: relative;
		display: flex;
		flex-direction: row;
		height: 100%;
		flex-shrink: 0;
		/* ── THE LIFT IS GONE (N.108 increment 1a) ────────────────────
		   `filter: drop-shadow(0 3px 12px rgba(0, 0, 0, 0.35))` was N.73 S1b's
		   one ruled shadow, and Dann moved it onto this element on 2026-08-20
		   for a reason that no longer exists: it had to trace the union of the
		   drawer body and the handle's SVG so the outline would read as one
		   shape lifted off the desk. There is no outline and no handle.

		   AND IT MUST GO RATHER THAN MERELY BEING UNUSED. This ship makes the
		   drawer transparent so the three groups float on the desk; a
		   drop-shadow traces the alpha of what is painted, so with the slab
		   gone it would have drawn a shadow around each group's 20 px corners
		   and around the divots between them. The groups float; they do not
		   hover.

		   The `transition: width` went with the collapse it animated. */
	}

	.drawer-clip {
		/* Clips the body to the drawer's own box. It was clipping around a
		   pull that lived outside it; the pull is a sibling of the drawer
		   itself now, so nothing crosses this boundary. */
		flex: 1;
		min-width: 0;
		overflow: hidden;
		position: relative;
	}

	/* ── THE SLAB IS GONE (N.108 increment 1a) ───────────────
	   Ruled by Dann 2026-09-02 on his walk of `2c1cecf`: "allowing the Drawer
	   to fully become a floating control set." No fill behind the groups; they
	   float directly on the desk of whichever document is showing.

	   WHAT WENT WRONG WITH THE SLAB, and it is worth keeping because the fault
	   was in the idea and not in the value. Increment 1 gave this box the
	   desk's surround, keyed off `data-tab`, on the ruling of 2026-09-02
	   ("the slab takes the desk's surround"). Two painted boxes then had to
	   agree, and they did not: the drawer showed the transcription desk's
	   corner under the Score markup document, because the class that keys the
	   desk and the attribute that keyed the slab are set at different moments.
	   ONE PAINTED DESK CANNOT MISMATCH ITSELF, so `.app-content` in
	   `+page.svelte` paints it now, once, under the drawer and the paper both,
	   and this box paints nothing at all.

	   `--slab-fill` and the two `data-tab` rules that set it are deleted with
	   it. `data-tab` returns to what N.73 S3 ship two kept it for: a mark on
	   the drawer that a harness can read, which no selector uses. */
	.drawer-body {
		height: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		/* THE RIGHT EDGE IS GONE ENTIRELY (N.108 increment 1a). It was
		   `2px solid var(--sage)` until Dann's ruling of 2026-08-20 retired
		   the drawer's last vertical spine, and then `2px solid transparent`,
		   because the silhouette's SVG painted that line from outside the clip
		   and the content had to be held off it. There is no silhouette, so
		   there is nothing to reserve, and the 2 px goes back to the drawer. */
	}


	/* THE ONE SCROLL. N.108: the drawer never scrolls itself, except once, on
	   entry to the calibration takeover, and that one call is the takeover's
	   (increment 3). Nothing in this file calls `scrollTo` on this box; the
	   only thing that touches its `scrollTop` is the takeover's stow and
	   restore below, which gives the singer back the position they had. A
	   station opens IN PLACE. Do not add a scroll here. */
	.drawer-content {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		/* ── THE GROUPS FLOAT, SO THEY NEED AIR ON EVERY SIDE ─────
		   N.108 increment 1a. With the slab gone the groups sit on the desk,
		   and a 20 px corner against the viewport's own edge is a corner that
		   has been sliced off rather than drawn. Dann's words for what he
		   wanted are "allowing the Drawer to fully become a floating control
		   set", and `drawing-n108-pull_r2_2026-09-02.png` draws desk on every
		   side of the cards.

		   16 px IS THE DRAWER'S OWN INSET AND NOT A NEW VALUE. It is the 1rem
		   that `.root-panel`, `.drawer-anchor-top` and `.drawer-anchor-bottom`
		   each spent before N.108, ruled by Dann 2026-08-20 when he required
		   every station rule in the drawer to share one inset. The stations'
		   own 18 px lives inside the group; this is the group's own margin
		   from the desk.

		   THE TOP IS 16 NOW, AND IT WAS 0. RULED BY DANN 2026-09-03 on his walk
		   of `42f6871`: "negative space between the Piece band and the Ilya
		   banner. This will increase the illusion that the controls float. On
		   my screen, simply moving the controls down a few pixels would be
		   sufficient." His ruling REVERSES what stood here at increment 1a,
		   which is reproduced so the next reader sees what was traded and does
		   not undo him: "the first group's 20 px corners now meet the slab at
		   the top, which is the same join they make at the bottom", and "16 px
		   there costs 16 px of height, and at 1366 x 768 on a coarse pointer
		   the opening state then overruns its box by 10 px". The slab is gone,
		   so the first join is now against the viewport rather than against a
		   fill, and the height is the cost he accepted by ruling.

		   THE FOOT IS 12, not 16, and it was 12 before: it is
		   `.root-panel:last-child`'s 40 px replaced at increment 1 by the
		   prototype's own value, and nothing about the bottom changed here. */
		padding: 16px 16px 12px;
	}

	/* ── THE THREE GROUPS (N.108) ─────────────────────────────
	   Contiguous squircles at the fourth radius, flush, no gap between them.
	   THE DIVOT IS THE TWO 20 px CORNERS MEETING, depth 20 and chord 40, cut
	   out of the slab's desk fill. A margin between groups would draw a gap
	   instead of a divot, which is a different mark.

	   THE FOURTH RADIUS IS 20 px, ruled by Dann 2026-09-02 from
	   `drawing-n108-radius_r1_2026-09-02.png`: "20 looks terrific." It is a
	   SURFACE radius and it amends "three radii, no fourth" of 2026-08-18. The
	   ruled set is now 0, 4 (control), 20 (surface), and full-round. */
	.group {
		background: var(--drawer-bg);
		border-radius: 20px;
		overflow: hidden;
		padding-bottom: 4px;
	}

	/* ── THE GROUP BAND ───────────────────────────────────────
	   Option A of `drawing-n108-group-headers_r1_2026-09-02.png`, ruled by
	   Dann 2026-09-02: "a band of full-strength colour with reverse text in a
	   light neutral", his own drawing over Design's three. "I honestly prefer
	   mine."

	   THE HUE IS THE LANGUAGE-CHIP TOKEN, one step down from the band hue, and
	   THE TEXT IS WHITE RATHER THAN CREAM. That is the fix Dann ruled inside
	   option A on the same day, because the ruled hues fail 4.5:1 against
	   cream, cobalt included at 4.23:1. Measured on the chips: Piece 4.77:1,
	   Text 4.58:1, Score markup 4.63:1. NO HEX IS ADDED HERE; all three tokens
	   are `app.css`'s own, ratified 2026-08-20 as option D of the language
	   toggle. If a band ever moves, it moves there.

	   THE LABEL RECIPE IS `StationHeader.svelte`'s, reversed: 0.7rem, 600,
	   0.12em, uppercase. The build brief rules it, and that file's header
	   records that the recipe moved up here from the station row. */
	.group-band {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		height: 40px;
		margin: 0;
		padding: 0 18px;
		color: #fff;
		font-family: var(--font-sans);
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.band-name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.group-piece .group-band {
		background: var(--lang-chip-guide);
	}

	/* INPUT AND TEXT SHARE ONE TOKEN, N.108-5, and that is Dann's ruling
	   rather than an economy: "painted sage like Text (hue names place: it is
	   text)". The intake takes text in, so it is the text hue. They are two
	   selectors and not one grouped rule, so that ruling one of them a
	   different colour later is a one-line change in the file that draws it. */
	.group-input .group-band {
		background: var(--lang-chip-transcription);
	}

	.group-text .group-band {
		background: var(--lang-chip-transcription);
	}

	.group-score .group-band {
		background: var(--lang-chip-marked);
	}

	/* THE SCORE MARKUP GROUP'S FOCUS RING IS LAVENDER, not the global sage.
	   Dann's arrangement of 2026-07-13, so focusing a score field mirrors the
	   sage ring in purple. It was `.shane-panel :global(:focus-visible)` in
	   `+page.svelte` and it came here with the column that carried it; the set
	   of surfaces is the same set, under a name that says what they are. */
	.group-score :global(:focus-visible) {
		outline-color: var(--deeper-lavender);
	}

	/* METADATA'S AFFORDANCE. The same recipe as the band it sits on, held one
	   step back by opacity rather than by a second colour, so the band still
	   reads as the group's name with a way in beside it rather than as two
	   labels. Its target is the band's own 40px height. */
	.band-link {
		display: inline-flex;
		align-items: center;
		flex: none;
		min-height: 40px;
		padding: 0;
		font: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
		color: #fff;
		background: none;
		border: none;
		opacity: 0.85;
		cursor: pointer;
	}

	.band-link:hover {
		opacity: 1;
	}

	.band-link:focus-visible {
		outline: 2px solid #fff;
		outline-offset: -2px;
	}

	/* Metadata's body sits directly under the band, where its station row
	   would have been, and takes the same inset every station takes. */
	.band-body {
		margin: 0 18px;
	}

	/* ── THE STATION BOX, ONE OWNER ───────────────────────────
	   `:global`, and deliberately: the stations are authored by five other
	   components (`SongList`, `NotationFields`, `MetadataFields`,
	   `RootPanel`, `+page.svelte`'s own group snippets), and Svelte scopes a
	   rule to the file that writes the markup. The INSET and the BOUNDARY are
	   properties of the group frame, not of any one station, so the frame
	   owns them here and no station repeats them. That is the same argument
	   `StationHeader.svelte` makes for the label, and it is why the drawer
	   stopped having five copies of that.

	   THE HAIRLINE REPLACES THE 2 px SAGE RULE, which was the drawer's one
	   boundary treatment under Dann's ruling of 2026-08-20. It is retired
	   INSIDE a group rather than everywhere: the sage rule said "a region ends
	   here", and inside a frame the region does not end, the station does. The
	   band is what says a region ends now, and it says it louder than 2px ever
	   did. No boundary above the first station in a group, because the band
	   above it is that boundary. */
	.group :global(.station) {
		margin: 0 18px;
		border-top: 1px solid rgba(26, 22, 18, 0.1);
	}

	/* NO BOUNDARY UNDER THE BAND, and it is written as adjacency rather than
	   as `:first-of-type` because Metadata's body may stand between the two.
	   With Metadata open the first station DOES take a hairline, which is
	   right: the body above it is content, not a band. Whatever a group's
	   contents turn out to be, the rule is the same one this drawer has used
	   since 2026-08-27 for its station rules: one rule per boundary, drawn by
	   the thing below it, and none above the first. */
	.group-band + :global(.station) {
		border-top: none;
	}

	/* A station's contents. The prototype's `.station-body`: no top padding,
	   because the header's own 8px is the gap, and 12px below, because the
	   next station's hairline needs air above it. Global for the same reason
	   the box above is: five components author these bodies and the frame owns
	   the measure. */
	.group :global(.station-body) {
		padding: 0 0 12px;
	}

	/* ── THE ONE MOTION (N.108 §2) ────────────────────────────
	   A station body arrives at `--motion`, `app.css`'s one duration, and it
	   arrives on OPACITY AND TRANSFORM ONLY. HEIGHT IS NOT ANIMATED, which is
	   the ruling and not a shortcut: an animated height would make every group
	   below the opened station travel for 180 ms, and the whole of N.108 is
	   that the drawer does not rearrange under the singer's hand. The groups
	   below step down in one frame; only the body that arrived fades in.

	   `both` LEAVES `transform: none` APPLIED, which matters: a live transform
	   would make the body a containing block for the Inspector's absolutely
	   positioned parts and for `SearchableSelect`'s dropdown. The final frame
	   removes it. */
	.group :global(.station-body),
	.band-body {
		animation: bodyIn var(--motion) both;
	}

	@keyframes bodyIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	/* ── THE ANCHORS ARE GONE (N.108 increment 1) ────────────
	   `.drawer-anchor`, `.drawer-anchor-top` and `.drawer-anchor-bottom` are
	   deleted with the two pinned regions they dressed. Three of the four
	   declarations of the drawer's ONE boundary treatment lived here: the top
	   anchor's 2px sage down-facing rule, ruled by Dann 2026-08-20, and the
	   bottom anchor's 2px lavender up-facing one, ruled the same day. THE
	   RULING THEY CARRY IS NOT REVERSED, IT IS SPENT: it said a drawer with
	   one horizontal is worth more than a drawer that grades its horizontals,
	   and the new dress has no horizontals to grade. A band of full colour is
	   what says "a region ends here" now, and a 1px hairline is what separates
	   two stations inside one region. The fourth declaration, `.takeover-head`,
	   survives untouched below and is increment 3's to restyle.

	   THE LAVENDER IS NOT LOST EITHER. It was the voice's rule under the S0
	   slate of 2026-08-19; the voice is inside the Score markup group now, and
	   that group's band is `--lang-chip-marked`, the same hue one step down.
	   The ruling survives in a stronger form, which is the argument Design
	   made for the takeover's own rule and it holds here for the same reason. */

	/* ── The takeover (N.73 S3, redressed at N.108 increment 3) ──────
	   Takes .drawer-content's place in the column when it has the drawer:
	   same flex:1, same min-height:0, so a long ritual scrolls inside itself
	   rather than pushing the back affordance off the top.

	   THE INSET IS `.drawer-content`'s OWN, repeated rather than shared,
	   because these two boxes never exist at once and neither can be the
	   other's parent. 16 px at the sides so the frame's 20 px corners have
	   desk beside them, 12 px at the foot, and 16 px at the top since Dann's
	   ruling of 2026-09-03: the same three values and the same reasoning as
	   the groups, written out where `.drawer-content` writes them. The top
	   moves with the groups' top or the frame jumps 16 px up the moment the
	   ritual is entered, which is the one motion this drawer does not make.

	   IT PAINTS NOTHING NOW. The fill moved onto `.takeover-frame`, which is
	   the box with the corners; a fill out here would square them off
	   against the desk. */
	.drawer-takeover {
		flex: 1;
		min-width: 0;
		min-height: 0;
		display: flex;
		flex-direction: column;
		padding: 16px 16px 12px;
	}

	/* THE FOURTH FRAME. One group, grown to fill the drawer, at the same 20 px
	   surface radius Dann ruled on 2026-09-02 ("20 looks terrific"). It
	   arrives on the drawer's one motion, `bodyIn`, exactly as a station body
	   does, because entering the ritual is the same act as opening a station:
	   the prototype animates it at `:230`. */
	.takeover-frame {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		background: var(--drawer-bg);
		border-radius: 20px;
		overflow: hidden;
		animation: bodyIn var(--motion) both;
	}

	/* THE BAND. `.group-band`'s recipe and the Score markup group's hue,
	   because this IS that group's Voice station filling the drawer. It
	   replaces the 2 px lavender rule and the quiet Back this takeover wore
	   until now. DANN'S RULING OF 2026-08-23 IS NOT REVERSED, IT IS CARRIED:
	   he ruled that the takeover's rule is lavender, matching
	   `.wizard-phase`'s border-top, because the takeover is the calibration
	   ritual. `--lang-chip-marked` IS `--deeper-lavender` one step down
	   (`app.css:124`), so the hue survives in a stronger form, which is the
	   argument Design made for it and the same one the anchors' rules made
	   when they went. */
	.takeover-band {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex: none;
		height: 40px;
		margin: 0;
		padding: 0 18px;
		background: var(--lang-chip-marked);
		color: #fff;
		font-family: var(--font-sans);
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	/* The ONE back affordance, E.27, reversed onto the band. Quiet by weight
	   and opacity rather than by colour: this is the way out of a ritual, not
	   an invitation to leave it. It drops the band's uppercase register on
	   purpose, so the band reads as the group's name and this reads as a
	   control beside it.

	   THE ARROW IS THE STRING'S OWN. `inspector.back` is `\u2190 Back`
	   (`i18n.ts:381`), ratified with its arrow in both languages, so the
	   prototype's 10 x 10 polyline chevron was drawn and then removed: it
	   put two left-pointing marks side by side on the band, observed on the
	   build. The string is not touched, which is what keeps the French out
	   of this increment.

	   THE TARGET IS THE BAND'S OWN 40 px, and that is `.band-link`'s
	   geometry, not a new exemption: increment 1 shipped Metadata's affordance
	   at 40 px in a 40 px band and Dann walked it. The `@media (pointer:
	   coarse)` block that raised this button to 44 px is gone with the row it
	   sat in, because 44 px inside a 40 px band is a target taller than the
	   thing it is in. Recorded in the memo as the desk's. */
	.takeover-back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex: none;
		min-height: 40px;
		padding: 0;
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: none;
		color: #fff;
		background: transparent;
		border: none;
		opacity: 0.88;
		cursor: pointer;
	}

	.takeover-back:hover {
		opacity: 1;
	}

	.takeover-back:focus-visible {
		outline: 2px solid #fff;
		outline-offset: -2px;
	}

	/* The ritual's own scroll, as it has been since N.73 S3. The measures are
	   the prototype's (`:241`): 18 px at the sides, the station inset the
	   groups spend, and the wizard's own outer padding drops in favour of it
	   (`.takeover-panel`, `+page.svelte`). */
	.takeover-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 4px 18px 16px;
	}

	/* THE STATION'S OWN NAME. The band says the group, so this says the
	   station the ritual grew from, in the label recipe that left the station
	   row for the band at increment 1 (`StationHeader.svelte`, which records
	   the move). Tertiary ink, because it names where you are rather than
	   asking for anything. */
	.takeover-title {
		margin: 0;
		padding-top: 10px;
		font-family: var(--font-sans);
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-tertiary);
	}

	/* What the takeover switch actually does. A stowed region keeps its
	   component tree and its state and gives up its box, which is the whole
	   reason the wizard can be entered, left, and re-entered without losing a
	   captured vowel. Declared last so it beats .drawer-content's own flex
	   sizing above by source order at equal specificity. */
	.stowed {
		display: none;
	}

	/* ── THE TAB SLIDE IS GONE FROM THE DRAWER (N.108 increment 3) ────
	   RULED BY DANN 2026-09-03 on his walk of increment 2: the drawer stays
	   still on a tab change. Four rules stood here, `tabSlideFromRight` and
	   `tabSlideFromLeft` applied to `.drawer-content` itself and to any
	   descendant carrying the class, with the two keyframes they used; the
	   reduced-motion block that turned them off went with them.

	   IT IS STILL ON THE PAPER. `.main-content` in `+page.svelte` keeps the
	   same 175 ms slide and its own copy of the keyframes, so the document
	   still enters from the side the singer travelled. The drawer does not,
	   and that is the whole of N.108 in one line: THE DRAWER DOES NOT
	   REARRANGE UNDER THE SINGER'S HAND. Both of Studio's documents share
	   this drawer byte for byte since N.73 S2, so a slide here was animating
	   an arrival that never happened.

	   `tabTransitionClass` LEFT THIS COMPONENT WITH THEM. It was the only
	   thing that put the class on `.drawer-content`, and nothing else in the
	   drawer carries it, so the `:global` pair had no subject either. */

	/* ── THE BOTTOM PULL (N.108 increment 1a) ─────────────────
	   Drawn at `docs/sessions/drawing-n108-pull_r2_2026-09-02.png`: horizontal,
	   on the bottom edge, 44 px tall, drawer paper, the chevron leading the
	   word. It replaces `.drawer-lip`, `.lip-silhouette`, `.sil-fill`,
	   `.sil-line`, `--lip-grey`, `.lip-chevron` and the two measured optical
	   nudges, all deleted; the script above records what each was for.

	   44 px ON EVERY POINTER, not only a coarse one. It is the ruled height
	   and it is also the touch floor, so the two agree by construction and no
	   `@media (pointer: coarse)` block is needed to raise it. The old tab
	   needed one because it painted 20 px and had to reach 44.

	   DRAWER PAPER, ruled. It is the one piece of the drawer that is not a
	   group, so it takes the groups' own fill rather than the desk's, and a
	   hairline above it separates it from whatever it is sitting on. NO
	   SHADOW: nothing in this drawer is lifted any more.

	   FIXED, so it holds the bottom edge whether the drawer is up or the paper
	   is. z-index 70 clears the drawer's own 60 and stays under the loupe and
	   its dock at 9100, which are ruled nearest the singer, and under the
	   update toast at 200. */
	.drawer-pull {
		display: none;
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		height: 44px;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin: 0;
		padding: 0;
		background: var(--drawer-bg, #FAF8F5);
		border: none;
		border-top: 1px solid rgba(26, 22, 18, 0.1);
		cursor: pointer;
		z-index: 70;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}

	.drawer-pull:focus-visible {
		outline: 2px solid var(--ink-primary, #1a1612);
		outline-offset: -2px;
	}

	/* The label recipe, the drawer's own, the one the group bands carry. Ink
	   on paper here rather than reversed, because this is not a band. */
	.pull-label {
		font-family: var(--font-sans);
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-secondary, #4a4540);
	}

	/* DRAWN POINTING DOWN, flipped when the paper is up. The chevron points
	   the way the drawer will MOVE when pressed, which is the rule every
	   chevron in this drawer follows and the one the station headers keep. */
	.pull-chevron {
		flex: none;
		color: var(--ink-secondary, #4a4540);
		transition: transform var(--motion, 180ms ease-out);
	}

	.pull-chevron.up {
		transform: rotate(180deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.pull-chevron {
			transition: none;
		}
	}

	/* ── THE PLACEHOLDER PANELS ARE GONE (N.108 increment 3) ─────────
	   `.placeholder-panel` and `.placeholder-text` had no markup in this
	   component and had not had any for some time. THEY WERE MASKED BY THE
	   TAB SLIDE, and the mechanism is worth recording because it can hide
	   anything: `.drawer-content` carried `class="drawer-content
	   {tabTransitionClass}"`, and a class attribute with a dynamic part
	   makes Svelte treat that element as possibly carrying ANY class, so
	   every bare class selector in the file counted as reachable. Removing
	   the slide's class removed the mask and `svelte-check` named them the
	   same minute. Deleted rather than disclosed, so gate 3 returns to its
	   recorded 7 warnings in 4 files. */

	/* N.65 ship one. RENAMED FROM `.section-label`, VALUES UNCHANGED, and
	   the rename is the point. This heads the table of contents in Learn and
	   Guide. It is NOT a station label and cannot be folded into
	   `StationHeader.svelte`: its colour is the reading room's own ruled rose
	   and cobalt, not sage, and its 1rem gap belongs to a nav list rather
	   than to a station body. It carried the station label's name anyway,
	   which is how a fifth declaration of that recipe came to exist and
	   drift. One name for one concept: a station label is `StationHeader`,
	   and this is the TOC's heading. */
	.toc-heading {
		font-family: var(--font-sans, 'Source Sans 3', sans-serif);
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-secondary, #4a4540);
		margin: 0 0 1rem 0;
	}

	.toc-heading-learn {
		color: var(--dusty-rose, #A67B7B);
	}

	.toc-heading-guide {
		color: var(--quiet-cobalt, #5C739E);
	}

	/* ── TOC base styles ─────────────────────────────────── */

	.learn-toc {
		padding: 1.5rem;
	}

	.toc-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.toc-list li {
		margin: 0;
		padding: 0;
	}

	.toc-link {
		display: block;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		border-left: 3px solid transparent;
		font-family: var(--font-serif, 'Source Serif 4', serif);
		font-size: 0.9rem;
		color: var(--ink-secondary, #4a4540);
		line-height: 1.4;
		padding: 0.4rem 0 0.4rem 0.75rem;
		cursor: pointer;
		transition: border-color 150ms ease, color 150ms ease, background-color 150ms ease;
	}

	.toc-link:hover {
		border-left-color: rgba(166, 123, 123, 0.4);
		background: rgba(166, 123, 123, 0.06);
		color: var(--ink-primary, #1a1612);
	}

	.toc-link:focus-visible {
		outline: 2px solid var(--sage, #8B9A7D);
		outline-offset: -2px;
		border-radius: 2px;
	}

	/* ── Active heading indicator ─────────────────────────── */

	.toc-link.active {
		border-left-color: var(--dusty-rose, #A67B7B);
		border-left-width: 4px;
		color: var(--ink-primary, #1a1612);
		background: rgba(166, 123, 123, 0.08);
		font-weight: 500;
		padding-left: calc(0.75rem - 1px);
	}

	.toc-link.active:hover {
		border-left-color: var(--dusty-rose, #A67B7B);
		color: var(--ink-primary, #1a1612);
	}

	.toc-link.toc-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--ink-primary, #1a1612);
		padding-top: 0.25rem;
		padding-bottom: 0.5rem;
	}

	.toc-subsections {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.toc-subsections li {
		margin: 0;
		padding: 0;
	}

	.toc-sub {
		padding-left: 2.5rem !important;
		font-size: 0.8rem !important;
		color: var(--ink-secondary, #4a4540);
		opacity: 0.85;
	}

	.toc-sub:hover {
		opacity: 1;
	}

	.toc-sub.active {
		opacity: 1;
	}

	.toc-deep {
		padding-left: 3.5rem !important;
		font-size: 0.75rem !important;
		color: var(--ink-secondary, #4a4540);
		opacity: 0.75;
	}

	.toc-deep:hover {
		opacity: 1;
	}

	.toc-deep.active {
		opacity: 1;
	}

	/* ── Parent row: chevron + text side by side ──────────── */

	.toc-parent {
		display: flex;
		align-items: center;
	}

	.toc-parent .toc-link {
		flex: 1;
		min-width: 3px;
	}

	/* ── Chevron button ──────────────────────────────────── */

	.toc-chevron {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		flex-shrink: 0;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		color: var(--ink-tertiary, #8a8780);
		transition: color 150ms ease;
	}

	.toc-chevron:hover {
		color: var(--ink-secondary, #4a4540);
	}

	.toc-chevron.contains-active {
		color: var(--dusty-rose, #A67B7B);
	}

	.toc-chevron-spacer {
		width: 24px;
		height: 24px;
		flex-shrink: 0;
	}


	/* -- Guide tab: quiet-cobalt colour identity ----------- */

	.guide-toc .toc-link:hover {
		border-left-color: rgba(92, 115, 158, 0.4);
		background: rgba(92, 115, 158, 0.06);
	}

	.guide-toc .toc-link.active {
		border-left-color: var(--quiet-cobalt, #5C739E);
		background: rgba(92, 115, 158, 0.08);
	}

	.guide-toc .toc-link.active:hover {
		border-left-color: var(--quiet-cobalt, #5C739E);
	}

	.guide-toc .toc-chevron.contains-active {
		color: var(--quiet-cobalt, #5C739E);
	}

	.toc-chevron:focus-visible {
		outline: 2px solid var(--sage, #8B9A7D);
		outline-offset: -2px;
		border-radius: 2px;
	}

	.chevron-icon {
		transition: transform 200ms ease-out;
	}

	.toc-chevron.expanded .chevron-icon {
		transform: rotate(90deg);
	}

	.toc-parent-nested {
		padding-left: 0;
	}

	.toc-parent-nested .toc-sub {
		padding-left: calc(2.5rem - 20px) !important;
	}

	.toc-chevron-nested {
		width: 20px;
		height: 20px;
	}

	/* ── Collapsible children: grid animation ────────────── */

	.toc-children {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 250ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.toc-children.expanded {
		grid-template-rows: 1fr;
	}

	.toc-children-inner {
		overflow: hidden;
	}

	/* ── THE PHONE'S LAYOUT (N.108 increment 1a) ─────────────
	   THE BREAKPOINT IS 1400, NOT 768, and it is an arithmetic rather than a
	   round number: `layout.ts` derives it from the drawer's 520, the letter
	   sheet's 816 and the desk's 2 rem, so below it a whole sheet cannot sit
	   beside the drawer. Dann's ruling of 2026-09-02: "Below that width the
	   layout is the phone's." The literal is repeated here because there is no
	   custom-media syntax; `layout.ts` is its owner and the test beside it
	   pins the sum.

	   THE VERTICAL MODEL RETURNS. The drawer rises from the BOTTOM, and this
	   AMENDS the ruling of 2026-08-19
	   (`claude/ruling-drawer-horizontal-motion-and-bare-chevron_2026-08-19.md`)
	   in both its parts, on Dann's word of 2026-09-02: "The vertical model for
	   mobile that you offered is fine. Let's go with that." That ruling had
	   withdrawn vertical motion as a form-factor concession and made the pull
	   a bare chevron; the motion is vertical again and the pull carries a word
	   again. What the old ruling was protecting, one motion model on every
	   display, is answered a different way: the desk has no motion at all
	   now, so there is only one. */
	@media (max-width: 1399px) {
		.drawer {
			position: fixed !important;
			left: 0 !important;
			right: 0 !important;
			/* THE DRAWER STOPS AT THE PULL. 44px is the bar's own height, and
			   the bar is a sibling that does not travel, so the drawer that
			   rises has to leave it room or it would rise over its own
			   control. */
			top: 0 !important;
			bottom: 44px !important;
			width: auto !important;
			height: auto !important;
			z-index: 60;
			/* The pull sits outside this box, so nothing here may clip it.
			   `.drawer-clip` is what clips the body, which is what it is for. */
			overflow: visible;
			/* THE DESK, INHERITED, NOT COPIED (N.108 increment 1a). On the
			   phone the drawer is a full-screen overlay that covers the app
			   bar as well as the desk, so the groups would otherwise float on
			   the sage of `HeaderBar` for the first 48 px. `--desk-fill` is
			   declared once, on `.app-content` in `+page.svelte`, and this
			   element inherits it through the DOM, which `position: fixed`
			   does not break. So this is not a second slab: it is the same
			   value, and there is nothing for it to disagree with.

			   IT IS ON `.drawer` AND NOT `.drawer-body`, because the body is
			   the box Dann ruled to have no fill and it keeps none. This is
			   the overlay's own ground. On the desk this rule does not apply
			   at all and the drawer paints nothing. */
			background: var(--desk-fill, var(--desk-surface, #D8D4C8));
			/* ONE DURATION FOR THE TRAVEL. It was 400ms with the horizontal
			   slide; the vertical model is a shorter distance under a thumb
			   and takes `--motion`, `app.css`'s one duration, like every other
			   thing this drawer animates since N.108. TRANSFORM ONLY: nothing
			   here animates a height. */
			transition: transform var(--motion, 180ms ease-out) !important;
		}

		/* Lowered, the drawer sits entirely below the viewport, under the bar
		   that brought it. It takes no touches there, so the paper behind it
		   is reachable everywhere.

		   `inert` ON THE ELEMENT ITSELF, in the markup, rather than
		   `aria-hidden` here. A drawer translated off-screen is still in the
		   document: `aria-hidden` would hide it from a screen reader while
		   leaving every station header in the Tab order, which is the one
		   combination the a11y model forbids. `inert` takes both. */
		.drawer.lowered {
			transform: translateY(calc(100% + 44px));
			pointer-events: none;
		}

		.drawer:not(.lowered) {
			transform: translateY(0);
		}

		.drawer-pull {
			display: flex;
		}

		.drawer-clip {
			width: 100% !important;
			height: 100%;
			overflow: hidden;
		}

		/* NO GUTTER AND NO RESERVED EDGE. Both were the bookmark tab's:
		   `padding-right: 44px` kept the tab's touch target off the drawer's
		   own controls, and `border-right: 2px solid transparent` reserved the
		   line the silhouette painted. There is no tab and no silhouette, so
		   the drawer gets those 46 px of a 430 px phone back. */
		.drawer-body {
			width: 100% !important;
			height: 100%;
			flex-direction: column;
			border-right: none;
			box-sizing: border-box;
		}

		.toc-chevron {
			width: 44px;
			height: 44px;
		}
	}

	/* ── Reduced motion ──────────────────────────────────── */

	@media (prefers-reduced-motion: reduce) {
		.drawer {
			transition: none;
		}

		.toc-children {
			transition: none;
		}

		/* N.108's one motion, off. A station still opens and the takeover
		   still takes the drawer; they arrive without the 180 ms. */
		.group :global(.station-body),
		.band-body,
		.takeover-frame {
			animation: none;
		}

		.chevron-icon {
			transition: none;
		}
	}
</style>
