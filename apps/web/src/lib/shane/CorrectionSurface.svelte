<script lang="ts">
	/* ── THE CORRECTION SURFACE (N.92, slices 2 to 4) ────────────────────
	   The four correction stations, in the ruled order: DURATION, PITCH,
	   ACCIDENTAL · ENTRY, LYRIC. Durations lead because N.95 measured
	   durations as the broken channel, 0 of 28 confident before re-derivation,
	   and pitch as nearly fine.

	   ONE COMPONENT, TWO CONTAINERS, which is slice 4's whole point. `variant`
	   decides only WHERE the surface sits: `dock` is the phone's fixed shell,
	   anchored to an edge; `panel` is the desktop drawer's scrolling tenant.
	   Everything above that line, every station, every label, every verb and
	   every string, is one implementation. A singer who learned the phone has
	   learned the desktop because there is only one thing to learn, and two
	   copies could not stay that way for a week.

	   THE DOCK IS A SIBLING OF THE DRAWER, NOT THE DRAWER RE-ANCHORED. The
	   drawer is a side-entering object whose anchors are ruled in E.36 §1.4,
	   and re-anchoring it to the bottom edge in portrait would move those
	   anchors and make geometry answer width. The dock keeps the drawer's
	   grammar: one bare pull pointing the way it moves, the same station
	   labels, the same 180 ms.

	   THE VERBS ARE THE SHIPPED VERBS RE-HOMED. Nothing here is new function.
	   Every one of them calls `+page.svelte`'s own handler, the same handler
	   the desktop `CorrectionControls` calls, so the phone and the desk cannot
	   drift. Three cells render DISABLED and carry no behaviour at all:
	   tuplet, Rest, and Tie are slice 3's.

	   ONE DISTINCTION, DRAWN EVERYWHERE. A verb sits in a box, because a box
	   says something happens to the score when you touch it. A navigation mark
	   is bare: the stepper arrows and the dismissal chevron carry no box,
	   because they move the singer around rather than change the music.

	   44 PX FLOOR, unconditional, on every control here. The page's own glyphs
	   are the ruled exemption and this surface takes none. -------------- */
	import { t, type Language } from '$lib/i18n';
	import { loadNotationFont } from '$lib/shane/engine/notation-fonts';
	import { centredViewBox, commonInkBox, type InkBox } from '$lib/shane/loupe';
	import type { NoteBase } from '@ilya/score-parser';
	import type { ShiftDirection } from '$lib/shane/pairings';
	import {
		stepCount,
		stepValue,
		TUPLET_VALUES,
		type TupletDefinition,
	} from '$lib/shane/entry';
	import { onMount, type Snippet } from 'svelte';

	interface Props {
		language: Language;
		/**
		 * Where this surface sits. `dock` is the phone's fixed shell; `panel` is
		 * the desktop drawer's tenant. Nothing else about the surface changes.
		 */
		variant?: 'dock' | 'panel';
		/** Portrait anchors the dock to the bottom edge; landscape to the left. */
		portrait?: boolean;
		/**
		 * The syllabified text, first under the LYRIC label. Dann's N.65 ship B
		 * arrangement, kept: the boxed text, then the shift rows. Passed only by
		 * the container that has room for it, which is the drawer; the dock's
		 * stations are sized to fit a phone and the queue is not a verb.
		 */
		syllables?: Snippet;
		/* N.111's `seat` SNIPPET IS GONE, N.108-5. It rendered `CliticSeat`
		   at the foot of the LYRIC station in both shells. RULED BY DANN
		   2026-09-04 on his walk of `c574cf8`: the sentence about the seated
		   clitic and its Undo leave Corrections and the loupe dock entirely,
		   and Ilya seats and says nothing. Nothing else ever passed this
		   snippet, so the prop went with the component. */
		/** `F3 · quarter · на`, composed by the caller from the taken entry. */
		readout: string;
		/** The Undo pill's sentence, or null when nothing can be undone. */
		undoLabel: string | null;
		selectedBase: NoteBase | null;
		selectedDotted: boolean;
		/** True when the station cursor's syllable sits on no note. */
		shiftDisabled: boolean;

		/* ── N.92 slice 3 ─────────────────────────────────────────────────── */
		/** Whether the loupe is up, which is what the panel's chevron can act on. */
		open?: boolean;
		/** The bar stands between two entries rather than on one. */
		inGap: boolean;
		/** In a gap, the value a fresh entry takes; on an entry, unused. */
		armedBase: NoteBase;
		armedDots: boolean;
		/** What the PITCH station names as the arrival, or null for the middle line. */
		arrivalName: string | null;
		/** The taken entry is a rest, so the Rest cell reads engaged. */
		selectedIsRest: boolean;
		selectedTied: boolean;
		/** Whether a tie may legally start at the taken entry. */
		tieAvailable: boolean;
		onrest: () => void;
		ontie: () => void;
		/** Clear every correction on the taken entry, back by ruling 2026-08-27. */
		onrestore: () => void;
		restoreAvailable: boolean;
		/** N.65's counter, on the LYRIC label. Drawn only where there are slots. */
		placed?: number;
		total?: number;
		/** The Nolet row, disclosed in place of the DURATION station. */
		tupletOpen: boolean;
		tupletDef: TupletDefinition;
		tupletFits: boolean;
		onopentuplet: () => void;
		onclosetuplet: () => void;
		ontupletdef: (next: TupletDefinition) => void;
		/** Press and hold repeats a stepper arrow or a pitch verb while held. */
		onhold: (fire: () => void) => (e: PointerEvent) => void;
		onundo: () => void;
		ondismiss: () => void;
		/** The stepper: entry by entry, across barlines. */
		onwalk: (direction: 1 | -1) => void;
		onbase: (base: NoteBase) => void;
		ondot: () => void;
		onstep: (direction: 1 | -1) => void;
		onoctave: (direction: 1 | -1) => void;
		onaccidental: (kind: 'flat' | 'natural' | 'sharp') => void;
		ondelete: () => void;
		onshift: (scope: 'end' | 'nextOpen', direction: ShiftDirection) => void;
		/** The measured height, so the loupe can sit clear of the dock. */
		onheight?: (height: number) => void;
	}

	let {
		language,
		variant = 'dock',
		portrait = true,
		syllables = undefined,
		readout,
		undoLabel,
		selectedBase,
		selectedDotted,
		shiftDisabled,
		onundo,
		ondismiss,
		onwalk,
		onbase,
		ondot,
		onstep,
		onoctave,
		onaccidental,
		ondelete,
		onshift,
		onheight = undefined,
		open = true,
		inGap,
		armedBase,
		armedDots,
		arrivalName,
		selectedIsRest,
		selectedTied,
		tieAvailable,
		onrest,
		ontie,
		onrestore,
		restoreAvailable,
		placed = 0,
		total = 0,
		tupletOpen,
		tupletDef,
		tupletFits,
		onopentuplet,
		onclosetuplet,
		ontupletdef,
		onhold,
	}: Props = $props();

	const T = (key: string) => t(key, language);

	/* THE NOTATION FACE, AND IT IS THE PAGE'S OWN. Finale Maestro is the
	   product default for every rendering (Dann, 2026-07-12 and 2026-07-13),
	   registered as a document-wide FontFace by `notation-fonts.ts:53`, and
	   the score's glyphs are drawn from it by `staff-renderer.ts:505`. These
	   cells set the same family, so a duration on this surface and the same
	   duration on the page are one object at two sizes, which is what the
	   design handoff's own NOT ESTABLISHED note asks for.

	   THE CODEPOINTS ARE WRITTEN HERE rather than read from the package's
	   `SMUFL_CODEPOINTS`, and that duplication has a reason. The package's
	   registry (`smufl-metadata.ts:71`) carries the glyphs the RENDERER needs,
	   which is noteheads, flags, and stems drawn separately; it carries no
	   combined duration glyph, because a staff never draws one. Adding five
	   entries to `REQUIRED_GLYPHS` changes what `prepareSmuflFont` validates
	   and reaches gate 5, and slice 3 needs those glyphs' METRICS rather than
	   only their characters, so that is where it belongs. Finale Maestro
	   carries all five (`FinaleMaestro.json`, `glyphBBoxes`).

	   THE WORD IS THE NAME, the shipped `CorrectionControls` discipline: the
	   glyph is `aria-hidden` and a screen reader hears "Eighth", never a
	   codepoint. Where the font has not loaded, the word is drawn instead, so
	   nobody ever meets a row of empty boxes. */
	const DURATIONS: { base: NoteBase; glyph: string; key: string }[] = [
		{ base: '16th', glyph: '\uE1D9', key: 'correct.len16th' },
		{ base: 'eighth', glyph: '\uE1D7', key: 'correct.len8th' },
		{ base: 'quarter', glyph: '\uE1D5', key: 'correct.lenQuarter' },
		{ base: 'half', glyph: '\uE1D3', key: 'correct.lenHalf' },
		{ base: 'whole', glyph: '\uE1D2', key: 'correct.lenWhole' },
	];
	/** SMuFL `augmentationDot`, the one duration glyph the renderer draws too. */
	const DOT_GLYPH = '\uE1E7';

	/* SMuFL's accidentals rather than Unicode's U+266D/E/F, so these cells and
	   the page's own accidentals are one ink at two sizes. The desktop
	   `CorrectionControls` keeps the Unicode characters, which is right there:
	   it sets in the interface face, not in the score's. */
	const ACCIDENTALS: { kind: 'flat' | 'natural' | 'sharp'; glyph: string; key: string }[] = [
		{ kind: 'flat', glyph: '\uE260', key: 'notation.tool.flat' },
		{ kind: 'natural', glyph: '\uE261', key: 'notation.tool.natural' },
		{ kind: 'sharp', glyph: '\uE262', key: 'notation.tool.sharp' },
	];

	/* ── CENTRING THE GLYPH, NOT THE CHARACTER ───────────────────────────
	   Dann, 2026-08-26, at the walk: the noteheads look centred and the notes
	   do not, and the margin inside the cell is not consistent.

	   HE IS DESCRIBING SMuFL'S ORIGIN. A duration glyph's origin is its
	   NOTEHEAD, and the stem and flag run out of the character's advance
	   width, so a row of characters laid out as text lines up the noteheads
	   and leaves every note hanging off its own centre by a different amount.
	   A whole note, which has no stem at all, is the only one that looks
	   right.

	   SO THE INK IS MEASURED AND THE INK IS CENTRED. Each glyph is drawn once
	   into a hidden SVG, `getBBox` gives its real inked box, and every glyph in
	   a set is then drawn through a viewBox of one size with its own ink
	   centred inside it. One box for the set gives one scale for the set, so a
	   whole note does not swell to the height of a sixteenth, and one box size
	   gives the same margin inside every cell of that row.

	   THREE SETS, NOT ONE, because they are three different sizes of thing: a
	   sharp is not as tall as a sixteenth and an augmentation dot is not as
	   tall as either. Each set is internally consistent, which is what the eye
	   reads along a row.

	   MEASURED RATHER THAN DECLARED. The numbers could be read out of
	   `FinaleMaestro.json`'s `glyphBBoxes` instead, and then they would be
	   right for exactly one face and cost a second parse of a 386 KB file on a
	   phone. Measuring what the browser actually drew is right for whichever
	   face is loaded, including the day someone chooses Bravura or Leland.

	   THE MEASUREMENT IS CANVAS, NOT `getBBox`, and that is a correction rather
	   than a preference. `getBBox` on an SVG `<text>` returns its LAYOUT box,
	   which is the advance width by the font's own ascent and descent: every
	   one of these nine glyphs measured 402 units tall at 100 px, which is the
	   em box and not the note. `measureText`'s `actualBoundingBox*` are the
	   inked bounds, and they are relative to the same origin and the same
	   baseline that `<text x="0" y="0">` uses, so the numbers carry across
	   without conversion. Measured through it, `noteQuarterUp` runs from 88.9
	   above the baseline to 13.2 below: the notehead sits AT the origin and the
	   stem is all of the rest, which is exactly the offset Dann saw. */
	const MEASURE_PX = 100;
	const NOTE_H = 26;
	const ACCIDENTAL_H = 22;

	/* THE DOT IS DRAWN IN ENGRAVING PROPORTION, ruled by Dann 2026-08-27 after
	   his desktop walk found it oversized against its siblings.

	   IT JOINS THE NOTES' OWN SET, which is the whole fix: one common box means
	   one scale, so the augmentation dot is drawn at the size it has beside a
	   notehead rather than at a size chosen to make it easy to see. It had its
	   own set and its own target height, 10 px against the notes' 26, which is
	   about four times its engraving proportion; the measurement that fixes it
	   is the one every other cell already uses. */
	const NOTE_GLYPHS = DURATIONS.map((d) => d.glyph);
	const ACCIDENTAL_GLYPHS = ACCIDENTALS.map((a) => a.glyph);
	const ALL_GLYPHS = [...NOTE_GLYPHS, DOT_GLYPH, ...ACCIDENTAL_GLYPHS];

	let boxes = $state<Record<string, InkBox>>({});

	onMount(() => {
		let alive = true;
		loadNotationFont()
			.then(async () => {
				// The FontFace is registered by now; this waits for the browser to
				// have it ready to SHAPE with, so `getBBox` measures the real face
				// rather than the fallback serif.
				try {
					await document.fonts.load(`${MEASURE_PX}px 'Finale Maestro'`);
				} catch {
					// A browser that refuses the check still has the face registered.
				}
				if (!alive) return;
				measureGlyphs();
			})
			.catch(() => {
				// The page falls back to primitive shapes on the same failure, and
				// these cells fall back to their words. Neither waits on a font.
			});
		return () => {
			alive = false;
		};
	});

	function measureGlyphs(): void {
		const ctx = document.createElement('canvas').getContext('2d');
		if (!ctx) return;
		ctx.font = `${MEASURE_PX}px 'Finale Maestro'`;
		const next: Record<string, InkBox> = {};
		for (const glyph of ALL_GLYPHS) {
			const m = ctx.measureText(glyph);
			const left = m.actualBoundingBoxLeft ?? 0;
			const right = m.actualBoundingBoxRight ?? 0;
			const ascent = m.actualBoundingBoxAscent ?? 0;
			const descent = m.actualBoundingBoxDescent ?? 0;
			const width = left + right;
			const height = ascent + descent;
			// A browser without the inked bounds reports zeros, and a cell with
			// no box draws its word instead. Nobody meets an empty square.
			if (width > 0 && height > 0) {
				next[glyph] = { x: -left, y: -ascent, width, height };
			}
		}
		boxes = next;
	}

	const noteCommon = $derived(
		commonInkBox(
			[...NOTE_GLYPHS, DOT_GLYPH].map((g) => boxes[g]).filter((b): b is InkBox => !!b),
		),
	);
	const accidentalCommon = $derived(
		commonInkBox(ACCIDENTAL_GLYPHS.map((g) => boxes[g]).filter((b): b is InkBox => !!b)),
	);

	/** One cell's drawing, or null where the face never arrived. */
	function drawn(
		glyph: string,
		common: { width: number; height: number },
		height: number,
	): { viewBox: string; width: number; height: number } | null {
		const box = boxes[glyph];
		if (!box || common.height <= 0) return null;
		return {
			viewBox: centredViewBox(box, common),
			width: (height * common.width) / common.height,
			height,
		};
	}

	let height = $state(0);
	$effect(() => {
		onheight?.(height);
	});

	/** The dock's own tightening, which the drawer's column does not want. */
	const tight = $derived(variant === 'dock' && !portrait);

	/* THE ARRIVAL, which is what the contextual line says in a gap: the question
	   the singer is about to ask, answered before they ask it. The two strings
	   are the ratified ones, unchanged; only where they are drawn has moved. */
	const pitchLine = $derived(
		arrivalName === null
			? T('loupe.station.pitchMiddle')
			: T('loupe.station.pitchTakes').replace('%s', arrivalName),
	);
</script>

{#snippet cell(glyph: string, common: { width: number; height: number }, h: number, word: string)}
	{@const d = drawn(glyph, common, h)}
	{#if d}
		<svg
			class="glyph"
			viewBox={d.viewBox}
			width={d.width}
			height={d.height}
			aria-hidden="true"
			focusable="false"
		>
			<text x="0" y="0" font-family="Finale Maestro" font-size={MEASURE_PX} fill="currentColor"
				>{glyph}</text
			>
		</svg>
	{:else}
		{word}
	{/if}
{/snippet}

{#snippet count(n: number, set: (n: number) => void)}
	<!-- A STACKED TRIANGLE PAIR, two 44 px targets making 88 px in all, with
	     the number standing between them as the confirmation. Both marks are
	     BARE: they move a number, not the music, and the definition they build
	     is what acts. -->
	<div class="nolet-count">
		<button type="button" class="mark tri" aria-label={T('loupe.nolet.more')} onclick={() => set(stepCount(n, 1))}
			>&#x25B2;</button
		>
		<span class="nolet-number">{n}</span>
		<button type="button" class="mark tri" aria-label={T('loupe.nolet.fewer')} onclick={() => set(stepCount(n, -1))}
			>&#x25BC;</button
		>
	</div>
{/snippet}

{#snippet value(base: NoteBase, set: (b: NoteBase) => void)}
	<!-- A duration box that steps its own ladder on tap, five values in the
	     fixed order the DURATION station already uses. A wrong tap costs one
	     more tap, which is why five values may cycle where nine counts may not.
	     The glyph is the page's own face, at the same scale the station uses. -->
	<button
		type="button"
		class="cell nolet-value"
		aria-label={T('loupe.nolet.step')}
		onclick={() => set(stepValue(base, 1))}
	>
		{@render cell(DURATIONS[TUPLET_VALUES.indexOf(base)]?.glyph ?? '', noteCommon, NOTE_H, base)}
	</button>
{/snippet}

<!-- ONE ROOT, TWO SKINS. The panel carries NO accessible name of its own: the
     drawer's `<aside>` already says `Controls` / « Commandes » (N.62, ratified
     2026-08-23), and a nested region repeating it would be one landmark
     announced twice. The dock is not inside that aside, so it takes the name
     itself, which is the ruling of 2026-08-26 that both containers share one. -->
<section
	class="surface {variant}"
	class:portrait={variant === 'dock' && portrait}
	class:tight
	class:disclosed={tupletOpen}
	aria-label={variant === 'dock' ? T('a11y.drawer') : undefined}
	bind:offsetHeight={height}
>
	<!-- ONE HEADER OVER THE WHOLE SURFACE, ruled by Dann 2026-08-27. DURATION,
	     PITCH and ACCIDENTAL · ENTRY had a label each and the three of them said
	     less together than one word does: they named the ROWS, which a singer
	     can already tell apart by the shapes in them, and they crowded the one
	     thing worth naming, which is what this surface is for.

	     LYRIC KEEPS ITS LABEL because it is the one row a singer cannot tell by
	     shape: two lines of prose and four arrows look like prose and arrows.
	     It rides inside Corrections as a labelled row, which is the ruling.

	     N.108 INCREMENT 1: THE DOCK DRAWS IT, THE PANEL NO LONGER DOES. In the
	     drawer, Corrections is a station in the Score markup group and the
	     drawer's own `StationHeader` says its name, with the retraction chevron
	     the three-frame map gives every station. Two headers reading
	     CORRECTIONS, one above the other, is what gating this avoids; the
	     ruling that this surface has ONE header over the whole of it is not
	     touched, and the dock, which sits outside the drawer and has no station
	     header above it, keeps drawing that header itself. -->
	{#if variant === 'dock'}
		<h3 class="surface-header">{T('loupe.station.corrections')}</h3>
	{/if}

	<!-- THE CONTEXTUAL LINE, one sentence, and only one shows at a time.

	     WHAT IT SAYS AND WHY THAT ONE. The three state sentences this surface
	     carries are all GAP sentences: takes-the-pitch, take-a-note and the gap
	     line are each true only while the bar stands between two entries. So
	     "one at a time" is a choice among three, and this is the choice: the
	     ARRIVAL, because it is the one fact the singer cannot read anywhere
	     else on the surface. Where the bar is, is on the readout below; why the
	     lyric row is idle, is on the lyric row's own label, where principle 8
	     wants it, sitting with the thing it explains.

	     ITS ROW IS RESERVED, the Undo pill's rule again, so the surface does
	     not move when the bar steps in and out of a gap. -->
	<p class="surface-context" class:idle={!inGap}>{inGap ? pitchLine : ''}</p>

	<!-- THE HEADER ROW. The Undo pill sits alone on its own row so it can grow
	     to fit a long sentence, and it is ABSENT rather than disabled when
	     there is nothing to undo: a control that cannot act earns no ink.

	     THE ROW STANDS WHETHER THE PILL DOES OR NOT, ruled by Dann 2026-08-26
	     after the deploy walk. The two rulings were pulling against each other:
	     an absent pill shortened the dock by its row, the loupe is anchored
	     above the dock, and so the whole surface jumped 50 px at the first
	     correction of every session. Reserving the row settles it without
	     bending either ruling, because an empty row draws NOTHING. It has no
	     border, no fill, no text, and no target; it is height and nothing else,
	     so the pill is still absent in every sense the ruling meant and the
	     geometry stops moving. -->
	<div class="dock-row dock-row-undo">
		{#if undoLabel}
			<button type="button" class="undo-pill" onclick={onundo}>
				<span aria-hidden="true">&#x21B0;</span>
				{T('loupe.undo').replace('%s', undoLabel)}
			</button>
		{/if}
	</div>

	<!-- The stepper flanks the readout, and both marks are BARE: they walk the
	     singer along the line and change nothing in the score. A coarse tap on
	     the page chooses the measure; these are the fine step. -->
	<div class="dock-row dock-row-readout">
		<button
			type="button"
			class="mark"
			aria-label={T('correct.prev')}
			onpointerdown={onhold(() => onwalk(-1))}
			onclick={() => onwalk(-1)}>&#x2190;</button
		>
		<p class="readout">{readout}</p>
		<button
			type="button"
			class="mark"
			aria-label={T('correct.next')}
			onpointerdown={onhold(() => onwalk(1))}
			onclick={() => onwalk(1)}>&#x2192;</button
		>
		<!-- THE PUT-AWAY MARK. On the dock it sends the whole surface away, so it
		     speaks the drawer's own collapse name; in the panel the surface stays
		     and only the loupe goes, so it speaks `Done`, which is the word the
		     palette this re-cut replaces already used for exactly that. No new
		     string either way.

		     IT IS ABSENT IN THE PANEL WHEN THERE IS NO LOUPE TO PUT AWAY, and
		     that is the defect Dann walked: the panel stands in the drawer at
		     all times, loupe or no loupe, so its chevron stood there with
		     nothing to dismiss and clicking it changed nothing. Measured with
		     the loupe down: panel rendered, chevron rendered, click, no change.
		     The rule is the Undo pill's own, applied to the second control on
		     this surface that can be idle: a control that cannot act earns no
		     ink, and its 44 px stays reserved so the row does not move.

		     THE DOCK KEEPS ITS CHEVRON ALWAYS, because the dock only exists
		     while the loupe does. -->
		{#if variant === 'dock' || open}
			<button
				type="button"
				class="mark chevron"
				aria-label={variant === 'dock' ? T('drawer.collapse') : T('correct.deselect')}
				onclick={ondismiss}>{portrait ? '⌄' : '‹'}</button
			>
		{:else}
			<span class="mark" aria-hidden="true"></span>
		{/if}
	</div>

	<!-- DURATION, first, because N.95 measured it as the broken channel.

	     IN A GAP THE ROW STILL ACTS. A value entered there enters an entry at
	     the ruled arrival pitch rather than re-timing one, and the cell that
	     reads engaged is the ARMED value, which is what Rest enters and what
	     the next duration will be. -->
	<section class="station">
		{#if tupletOpen}
			<!-- THE NOLET ROW, disclosed IN PLACE. Nothing opens over anything and
			     nothing is modal: the other three stations stay where they are and
			     the label gains a back chevron, which is a navigation mark and so
			     carries no box. -->
			<h3 class="station-label">
				<button type="button" class="back" aria-label={T('loupe.nolet.back')} onclick={onclosetuplet}
					>&#x2039;</button
				>
				{T('loupe.station.duration')} &#183; {T('loupe.tuplet')}
			</h3>
			<div class="nolet" class:idle={!tupletFits}>
				{@render count(tupletDef.actualNotes, (n) => ontupletdef({ ...tupletDef, actualNotes: n }))}
				<span class="nolet-word">{T('loupe.nolet.of')}</span>
				{@render value(tupletDef.actualType, (b) => ontupletdef({ ...tupletDef, actualType: b }))}
				<span class="nolet-word">{T('loupe.nolet.inSpaceOf')}</span>
				{@render count(tupletDef.normalNotes, (n) => ontupletdef({ ...tupletDef, normalNotes: n }))}
				<span class="nolet-word">{T('loupe.nolet.of')}</span>
				{@render value(tupletDef.normalType, (b) => ontupletdef({ ...tupletDef, normalType: b }))}
			</div>
		{:else}
			<div class="cells">
				{#each DURATIONS as d (d.base)}
					{@const lit = inGap ? armedBase === d.base : selectedBase === d.base}
					<button
						type="button"
						class="cell"
						class:engaged={lit}
						aria-pressed={lit}
						aria-label={T(d.key)}
						onclick={() => onbase(d.base)}
					>
						{@render cell(d.glyph, noteCommon, NOTE_H, T(d.key))}
					</button>
				{/each}
				<button
					type="button"
					class="cell"
					class:engaged={inGap ? armedDots : selectedDotted}
					aria-pressed={inGap ? armedDots : selectedDotted}
					aria-label={T('correct.dot')}
					onclick={ondot}
				>
					{@render cell(DOT_GLYPH, noteCommon, NOTE_H, T('correct.dot'))}
				</button>
				<button type="button" class="cell" disabled={inGap} onclick={onopentuplet}
					>{T('loupe.tuplet')}</button
				>
			</div>
		{/if}
	</section>

	<!-- PITCH. The semitone verbs stay retired, per Dann's ruling of
	     2026-08-24: a B natural cannot become B flat, and down a semitone
	     respells as A sharp, which is what the spelling policy is for. -->
	<!-- PITCH. In a gap the LABEL carries the state and the greying only agrees
	     with it, which is principle 8: the sentence says the note will arrive at
	     the previous entry's pitch, and the verbs finish it once it exists. -->
	<section class="station">
		<div class="cells">
			<button
				type="button"
				class="cell"
				disabled={inGap}
				aria-label={T('correct.stepUp')}
				onpointerdown={onhold(() => onstep(1))}
				onclick={() => onstep(1)}
				><span aria-hidden="true">&#x25B2;</span> {T('loupe.pitch.step')}</button
			>
			<button
				type="button"
				class="cell"
				disabled={inGap}
				aria-label={T('correct.stepDown')}
				onpointerdown={onhold(() => onstep(-1))}
				onclick={() => onstep(-1)}
				><span aria-hidden="true">&#x25BC;</span> {T('loupe.pitch.step')}</button
			>
			<button
				type="button"
				class="cell"
				disabled={inGap}
				aria-label={T('correct.octaveUp')}
				onpointerdown={onhold(() => onoctave(1))}
				onclick={() => onoctave(1)}
				><span aria-hidden="true">&#x25B2;</span> {T('loupe.pitch.octave')}</button
			>
			<button
				type="button"
				class="cell"
				disabled={inGap}
				aria-label={T('correct.octaveDown')}
				onpointerdown={onhold(() => onoctave(-1))}
				onclick={() => onoctave(-1)}
				><span aria-hidden="true">&#x25BC;</span> {T('loupe.pitch.octave')}</button
			>
		</div>
	</section>

	<!-- ACCIDENTAL · ENTRY. The three verbs are CUMULATIVE and capped at
	     doubles, exactly as shipped, so none of them is ever "on" and none
	     carries `aria-pressed`. What the note shows is on the readout. -->
	<section class="station">
		<div class="cells">
			{#each ACCIDENTALS as a (a.kind)}
				<button
					type="button"
					class="cell"
					disabled={inGap}
					aria-label={T(a.key)}
					onclick={() => onaccidental(a.kind)}
				>
					{@render cell(a.glyph, accidentalCommon, ACCIDENTAL_H, T(a.key))}
				</button>
			{/each}
			<!-- REST is lit in a gap, where it enters one, and on an entry, where
			     it converts both ways. It is the one cell in this station that a
			     gap does not disable. -->
			<button
				type="button"
				class="cell"
				class:engaged={selectedIsRest}
				aria-pressed={!inGap && selectedIsRest}
				onclick={onrest}>{T('loupe.rest')}</button
			>
			<!-- DELETE IN A GAP DOES NOTHING, so it says nothing: there is no note
			     under the bar to remove. -->
			<button
				type="button"
				class="cell"
				disabled={inGap}
				aria-label={T('correct.delete')}
				onclick={ondelete}>{T('loupe.delete')}</button
			>
			<!-- TIE joins two soundings of ONE pitch, so it is offered only where
			     the entry after this one can legally take it. Anything else is a
			     slur, which is a different mark with a different meaning. -->
			<button
				type="button"
				class="cell"
				class:engaged={selectedTied}
				aria-pressed={selectedTied}
				disabled={!tieAvailable && !selectedTied}
				onclick={ontie}>{T('loupe.tie')}</button
			>
			<!-- RESTORE clears every correction on ONE entry, which the Undo pill
			     cannot do: the pill reverses the last verb and this reverses all
			     of them here. It is offered only where the READ still carries the
			     entry, because a hand-entered one has nothing to be restored to
			     and Delete is the verb that removes it. -->
			<button
				type="button"
				class="cell"
				disabled={!restoreAvailable}
				aria-label={T('correct.restore')}
				onclick={onrestore}>{T('loupe.restore')}</button
			>
		</div>
	</section>

	<!-- LYRIC. The shipped Shift Lyrics verbs, on the same surface as the note
	     verbs rather than in a separate place, and named for what they touch
	     rather than for Finale's scope. The melisma pair drawn in the
	     schematic is NOT here: it was never ruled. -->
	<section class="station">
		<h3 class="station-label">
			{inGap ? T('loupe.station.lyricTake') : T('loupe.station.lyric')}
			<!-- N.65 ship B's COUNTER, on the label its verbs now live under. Two
			     numbers rather than a formatted string, so the thin-space numeral
			     pair is drawn once and needs no translation. Drawn only where
			     `total` is above zero, which is that ship's own rule: an
			     unconditional counter would say `0 / 0` on an empty drawer,
			     before a singer has pasted anything. -->
			{#if total > 0}<span class="station-count">{placed}&thinsp;/&thinsp;{total}</span>{/if}
		</h3>
		{#if syllables}
			<!-- N.65 ship B, kept whole: the boxed syllabified text is the first
			     element under this label, then the shift rows. Dann ruled that
			     arrangement on his walk of `2238e8b` and the station it lived in
			     is the one this replaces, so the arrangement comes with it. -->
			<div class="lyric-syllables">{@render syllables()}</div>
		{/if}
		<div class="lyric-row">
			<span class="lyric-label">{T('loupe.lyric.toEnd')}</span>
			<button
				type="button"
				class="cell cell-arrow"
				disabled={shiftDisabled || inGap}
				aria-label={T('shiftLyrics.backAria')}
				onclick={() => onshift('end', 'back')}>&#x2190;</button
			>
			<button
				type="button"
				class="cell cell-arrow"
				disabled={shiftDisabled || inGap}
				aria-label={T('shiftLyrics.forwardAria')}
				onclick={() => onshift('end', 'forward')}>&#x2192;</button
			>
		</div>
		<div class="lyric-row">
			<span class="lyric-label">{T('loupe.lyric.toNextOpen')}</span>
			<button
				type="button"
				class="cell cell-arrow"
				disabled={shiftDisabled || inGap}
				aria-label={T('shiftLyrics.backAria')}
				onclick={() => onshift('nextOpen', 'back')}>&#x2190;</button
			>
			<button
				type="button"
				class="cell cell-arrow"
				disabled={shiftDisabled || inGap}
				aria-label={T('shiftLyrics.forwardAria')}
				onclick={() => onshift('nextOpen', 'forward')}>&#x2192;</button
			>
		</div>
	</section>
</section>

<style>
	/* ANCHORED TO AN EDGE, NEVER LIFTED. The loupe is the one ruled exception
	   to "nothing floats over the paper", and this is not it: the dock sits on
	   an edge the way the drawer sits on its own.

	   ROTATION IS THE MODE SWITCH, so the anchor answers rotation rather than
	   width. Bottom in portrait, because the thumbs are there; left in
	   landscape, which is the drawer's own ruled anchor. Only the anchor
	   moves, and it moves once, on rotation.

	   THE Z-INDEX CLEARS THE INSTALL PROMPT, and that is measured rather than
	   chosen. `InstallPrompt.svelte:157` sits at 9000 and raises itself six
	   seconds into an iOS Safari session that carries no fresh decline
	   (N.105), and at any lower value it lands on top of the LYRIC station
	   and the singer cannot reach it. The mobile
	   drawer takes 60 (`Drawer.svelte:1531`) and the update toast 200. The
	   loupe is ruled nearest the user, the dock is its other half, and a
	   working surface a thumb cannot reach is not a surface. The prompt is
	   untouched and returns the moment the loupe goes away. */
	/* THE SHARED COLUMN, which both containers get and neither owns. */
	.surface {
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 6px;
		color: var(--ink-primary, #1a1612);
	}

	/* THE PANEL ADDS NOTHING BUT ITS SEAT. It is a tenant of the drawer's
	   scroll, so it takes the station rule every other tenant carries and no
	   position of its own.

	   LAVENDER, ruled by Dann 2026-08-28. It was sage, on the reasoning that
	   sage is Studio's accent for the score document; the ruling is that
	   lavender codes music and voice and this is a MUSIC station, and that
	   this rule is what completes the drawer's gradient — sage text stations
	   at the top, lavender music stations at the foot. The token is the one
	   the voice anchor and the loupe's insertion bar already carry. */
	.surface.panel {
		border-top: 2px solid var(--deeper-lavender, #8e7e9b);
		padding-top: 6px;
	}

	.dock {
		position: fixed;
		z-index: 9100;
		/* THE SWIPE IS OURS, the same reason the loupe takes it: a downward
		   drag on a scrollable box is a scroll as far as the browser is
		   concerned, and it answers with `pointercancel` rather than the
		   `pointerup` the dismissal listens for. The stations are sized to fit
		   without scrolling, so this costs nothing; `overflow-y` below stays as
		   the safety it always was, and a pointer that is not a finger still
		   reaches it. */
		touch-action: none;
		padding: 10px 12px 14px;
		background: var(--drawer-bg, #faf8f5);
		/* THE 180 MS, opacity and transform only. The loupe carries the same
		   duration, which is what teaches the singer they are one object. */
		animation: dock-arrive 180ms ease-out;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	/* LANDSCAPE: THE LEFT EDGE, 380 PX. The schematic's figure, with its own
	   reasoning: 356 px of content is the narrowest column that holds every
	   station's row at 44 px per cell without wrapping, and a narrower dock
	   would wrap two stations and push the total past 430 px of height.

	   THE THREE TIGHTENED VALUES ARE MEASURED. At 932 by 430 this dock stood
	   478 px tall against a 430 px screen and scrolled by 48, and the 48 is
	   exactly the Undo pill's row: with no pill it measured 428 and fitted.
	   The schematic's 380 assumes a single-row LYRIC station, and this one
	   carries two rows, because the shipped shift verbs are a label with two
	   arrows rather than a cell. Closing the column gap, the label margins,
	   and the foot buys the row back and the dock measures 430. Portrait is
	   untouched: it has the height to spare. */
	.dock.tight {
		gap: 4px;
		padding: 8px 12px 6px;
		left: 0;
		top: 0;
		bottom: 0;
		width: 380px;
		border-right: 1px solid var(--stone-300, #d6d3d1);
		box-shadow: 2px 0 10px rgba(46, 42, 38, 0.08);
	}

	.dock.portrait {
		left: 0;
		right: 0;
		bottom: 0;
		max-height: 62vh;
		border-top: 1px solid var(--stone-300, #d6d3d1);
		box-shadow: 0 -2px 10px rgba(46, 42, 38, 0.08);
	}

	/* WHILE THE DEFINITION ROW IS DISCLOSED THE DOCK MAY SCROLL, so the finger
	   gets the vertical drag back and the bottom station stays reachable. The
	   Nolet station is 88 px where the DURATION row is 44, and in landscape
	   that is 30 px more than 430 holds. The swipe-to-dismiss is unavailable
	   for as long as the row is open, and the chevron is not: one gesture out
	   of three, in one state, in exchange for a station a thumb can reach. */
	.dock.disclosed {
		touch-action: pan-y;
	}

	@keyframes dock-arrive {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dock {
			animation: none;
		}
	}

	.dock-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	/* The row the pill sits on, reserved whether it is there or not. 44 px is
	   the pill's own floor, so a row holding one and a row holding none are the
	   same height and the dock's geometry never changes. Empty, it is a gap:
	   nothing is drawn in it and nothing can be tapped in it. */
	.dock-row-undo {
		min-height: 44px;
	}

	/* The pill sits alone on its row so a long sentence can grow into it. */
	.undo-pill {
		flex: 0 1 auto;
		min-height: 44px;
		padding: 8px 16px;
		border: 1px solid var(--stone-300, #d6d3d1);
		border-radius: 999px;
		background: var(--paper-light, #f5f1e8);
		color: var(--ink-primary, #1a1612);
		font: inherit;
		font-size: 0.8125rem;
		line-height: 1.2;
		cursor: pointer;
	}

	.readout {
		flex: 1 1 auto;
		margin: 0;
		text-align: center;
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--ink-primary, #1a1612);
	}

	/* A NAVIGATION MARK IS BARE. No border and no fill, and the 44 px floor is
	   met by the target rather than by the mark. */
	.mark {
		flex: 0 0 auto;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
		border: none;
		background: none;
		color: var(--ink-secondary, #4a4540);
		font-size: 1.125rem;
		line-height: 1;
		cursor: pointer;
	}

	.chevron {
		font-size: 1.375rem;
	}

	/* The one header, in the register every drawer station label uses. */
	.surface-header {
		margin: 0;
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		/* Lavender: a music station. See `.surface.panel`. */
		color: var(--deeper-lavender, #8e7e9b);
	}

	/* THE CONTEXTUAL LINE. Its row is reserved whether it speaks or not, so the
	   surface holds still as the bar steps in and out of a gap: `min-height`
	   rather than a conditional block, and nothing is drawn when it is idle. */
	.surface-context {
		margin: 0;
		min-height: 1.15rem;
		font-size: 0.75rem;
		line-height: 1.15rem;
		color: var(--ink-secondary, #4a4540);
	}

	.station-label {
		margin: 8px 0 4px;
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		/* Lavender with the header it sits under. `.station-count` inherits it
		   from here, which is right: the counter belongs to the label. */
		color: var(--deeper-lavender, #8e7e9b);
	}

	/* The counter sits after the label in the same line, quieter than it, so the
	   label still reads as the label. */
	.station-count {
		margin-left: 0.5em;
		font-weight: 400;
		letter-spacing: 0.02em;
		color: var(--ink-tertiary, #6a655f);
	}

	.cells {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	/* A VERB SITS IN A BOX. 44 px is a floor and not a target: a cell grows
	   with its text and never shrinks below it. */
	/* PILL ENDS, N.108 increment 4. Ruled by Dann 2026-09-03 from the
	   calibration ritual's own two buttons (`CalibrationWizard.svelte`'s
	   `.wizard-primary` and `.wizard-secondary`, `border-radius: 999px`):
	   "The buttons shown here can form the template. Can we make other
	   buttons share its rounded ends?" Only the corners move; the fill, the
	   border, the type and the padding are untouched.

	   THE GRID FEELS THIS MOST. A cell is 44 px tall at its floor, so 999 px
	   draws a 22 px end and the correction grid reads as a row of pills. That
	   is the ruling applied where it shows, and it is Dann's to wave off. */
	.cell {
		/* A flex box so a drawn glyph centres on both axes. The gap is what puts
		   the space back between a pitch cell's triangle and its word: inside a
		   flex container the whitespace between two children is not a text node
		   any more, and `▲ step` came out as `▲step`. */
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3em;
		flex: 1 1 auto;
		min-width: 44px;
		min-height: 44px;
		padding: 6px 8px;
		border: 1px solid var(--stone-300, #d6d3d1);
		border-radius: 999px;
		background: var(--paper-light, #f5f1e8);
		color: var(--ink-primary, #1a1612);
		font: inherit;
		font-size: 0.75rem;
		line-height: 1.15;
		cursor: pointer;
	}

	.cell:disabled {
		color: var(--ink-tertiary, #6a655f);
		opacity: 0.5;
		cursor: default;
	}

	/* THE LAST TWO SAGE MARKS IN A LAVENDER SECTION, ruled lavender by Dann
	   2026-08-28 to finish what §19 began. Both are STATE MARKERS ON MUSIC
	   VERBS — which duration a fresh entry will take, and which verb the
	   keyboard is on — so they take the section's own hue rather than the
	   score document's. */
	.cell.engaged {
		border-color: var(--deeper-lavender, #8e7e9b);
		color: var(--deeper-lavender, #8e7e9b);
		font-weight: 600;
	}

	/* THE RING SITS OUTSIDE THE CELL, not on it: `outline-offset` puts all 2 px
	   of it on the surface behind, so the contrast that decides whether it can
	   be seen is against the surface rather than against the cell's own fill.
	   MEASURED on both, before and after, in §21 of the memo. */
	.cell:focus-visible,
	.mark:focus-visible,
	.undo-pill:focus-visible {
		outline: 2px solid var(--deeper-lavender, #8e7e9b);
		outline-offset: 2px;
	}

	/* THE CELL CENTRES A BOX, and the box is the same size for every cell in a
	   row, so the margin around the drawing is the same in every one of them.
	   `display: block` keeps the SVG off the text baseline, which would
	   otherwise reintroduce the very offset this replaces. */
	.glyph {
		display: block;
		overflow: visible;
	}


	.surface.tight .station-label {
		margin: 2px 0 3px;
	}

	.lyric-row {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.lyric-label {
		flex: 1 1 auto;
		font-size: 0.75rem;
		line-height: 1.2;
		color: var(--ink-secondary, #4a4540);
	}

	/* ── THE NOLET ROW ───────────────────────────────────────────────────
	   One row, read left to right as the sentence it is. The station is one
	   row of 88 px because each triangle pair is two stacked 44 px targets,
	   which is the schematic's own arithmetic, and the other three stations
	   stay on screen behind it. */
	.nolet {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 6px;
	}

	/* IDLE, NOT HIDDEN. Where the run the count names does not fit, the row
	   still reads and still steps; what it cannot do is land. The greying
	   agrees with that rather than carrying it alone: the readout above says
	   which entry is taken, and a definition with nowhere to go simply does
	   not change the page. */
	.nolet.idle {
		opacity: 0.55;
	}

	.nolet-count {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* THE TARGETS ARE 44 PX EACH AND STACKED TO 88, which the schematic states
	   and the standing 44 px floor requires. The MARK inside each one is small
	   and sits toward the number, so the pair reads as belonging to the figure
	   between them rather than overhanging it.

	   THIS IS THE ONE PLACE ON THIS SURFACE WHERE THE TARGET AND THE MARK ARE
	   NOT THE SAME RECTANGLE, and it is deliberate: the schematic says so in
	   its own words. Everywhere else a box is exactly what it accepts.

	   MEASURED and then corrected: the first pass drew 22 px targets, which
	   made the pair 60 px against the ruled 88 and broke the floor on the only
	   control in this slice that could break it. */
	.tri {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
		font-size: 0.6875rem;
		line-height: 1;
	}

	.nolet-count .tri:first-child {
		align-items: flex-end;
	}

	.nolet-count .tri:last-child {
		align-items: flex-start;
	}

	.nolet-number {
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 1rem;
		font-weight: 600;
		line-height: 1;
		color: var(--ink-primary, #1a1612);
	}

	.nolet-word {
		font-size: 0.75rem;
		font-style: italic;
		color: var(--ink-secondary, #4a4540);
	}

	.nolet-value {
		flex: 0 0 auto;
		min-width: 52px;
	}

	/* The back chevron is a NAVIGATION MARK: it leaves the definition row and
	   changes nothing in the music, so it carries no box. */
	.back {
		min-width: 32px;
		min-height: 32px;
		margin-right: 2px;
		padding: 0;
		border: none;
		background: none;
		/* IT FOLLOWS ITS LABEL. A button does not inherit colour from its
		   parent, so this is pinned rather than left to cascade — and pinned to
		   sage it would have been the one thing left behind when the label
		   above turned lavender, splitting one header line across two hues. */
		color: var(--deeper-lavender, #8e7e9b);
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		vertical-align: middle;
	}

	.cell-arrow {
		flex: 0 0 auto;
		min-width: 52px;
		text-align: center;
		font-size: 1rem;
	}

	/* THE DOCK NEVER PRINTS. The drawer manipulates; the page displays and
	   prints. */
	@media print {
		.dock {
			display: none !important;
		}
	}
</style>
