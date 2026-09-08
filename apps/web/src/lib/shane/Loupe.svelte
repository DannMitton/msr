<script lang="ts">
	/* ── THE LOUPE (N.92, mobile slice 2) ────────────────────────────────
	   Finale Speedy's editing frame, magnified in place. Ruled by Dann
	   2026-08-25 as the NAMED, SINGULAR exception to the Calm Authority shape
	   rule: nothing floats over the paper, except the loupe. Nothing else in
	   this slice floats, and the dock is anchored to an edge rather than
	   lifted.

	   IT IS A VIEW TRANSFORM, NOT A SECOND RENDERER. The magnified measure is
	   the page's own SVG, cloned out of the system it already stands in and
	   shown through a viewBox cropped to that measure. So the loupe's glyphs
	   are the page's glyphs: one Finale Maestro face, one set of coordinates,
	   one engraving. A second drawing of the same music could drift from the
	   page; a clone cannot.

	   IT DISPLACES NOTHING. Fixed to the viewport and out of the desk's flow,
	   so the page does not pan, reflow, or resize when the loupe rises, moves,
	   or leaves.

	   IT PRINTS NOTHING, like the selection mark it carries. ------------- */
	import { t, type Language } from '$lib/i18n';
	import {
		headBound,
		MUSIC_MARK,
		clipToHead,
		inkCrop,
		centreOnPage,
		pageInset,
		measureWindow,
		nearestTarget,
		parseSystemRange,
		systemIndexOf,
		windowScale,
		type HitRect,
		type PageInk,
		type SystemRange,
	} from '$lib/shane/loupe';

	interface Props {
		/** Whether the loupe is up. The dock rises and falls with it. */
		open: boolean;
		/** The held measure's display number, from `Measure.number`. */
		measureLabel: string | null;
		/**
		 * The locator's SECOND LINE (N.113b item 2, ruled by Dann 2026-09-08):
		 * the taken note, its beat in the measure, and its duration, composed
		 * from `+page.svelte`'s own readout parts. Empty where there is nothing
		 * to name, which is a gap or no selection, and the line then does not
		 * draw at all.
		 */
		noteLine?: string;
		/** The held measure's own index, for finding the system that holds it. */
		measureIndex: number | null;
		/** Entry ids in the held measure, in document order. */
		ownIds: readonly string[];
		/** Entry ids in the next measure that carries any, for the right edge. */
		nextIds: readonly string[];
		/** The taken entry, marked inside the loupe as it is on the page. */
		selectedEventId: string | null;
		/**
		 * Anything that changes when the page's SVG is rebuilt. `{@html page}`
		 * replaces the whole system, which would otherwise leave this holding a
		 * clone of a page that is no longer on screen.
		 */
		revision: unknown;
		language: Language;
		/**
		 * What the held measure holds against what its signature asks for, or
		 * null where the two agree. Ruled by Dann 2026-08-26: the tag carries
		 * the arithmetic ONLY on a measure that disagrees.
		 */
		fill: { actual: number; expected: number } | null;
		/**
		 * A tap on an entry inside the loupe. Dann's ruling of 2026-08-26 moved
		 * N.55b's syllable placement here: on a phone the page tap navigates and
		 * this one places.
		 */
		onpick: (eventId: string) => void;
		/** What the loupe must stand clear of on the left: the landscape dock, or
		    the open drawer on a desk. */
		dockInset: number;
		/** What it must stand clear of below: the portrait dock, or nothing. */
		dockHeight: number;
		/** A phone keeps the ruled 2.4; a desk aims at a readable stave. */
		isPhone: boolean;
	}

	let {
		open,
		measureLabel,
		noteLine = '',
		measureIndex,
		ownIds,
		nextIds,
		selectedEventId,
		revision,
		language,
		fill,
		onpick,
		dockInset,
		dockHeight,
		isPhone,
	}: Props = $props();

	const T = (key: string) => t(key, language);

	/* THE SCHEMATIC'S PORTRAIT FIGURE, 2.4 times, and it is a multiple of the
	   size the page is ALREADY DRAWN AT rather than of the engraved page. The
	   phone shows the true page as an oversized thumbnail (slice 1 measured
	   0.468 at 430 px) and the loupe supplies the readable zoom, so the number
	   that means anything is the one against what the eye is failing to read.
	   At 0.468 this lands the measure at 1.12 times the engraved page, which
	   is what the schematic's own arithmetic implies: a three-entry measure
	   filling 354 px of width.

	   NOT ESTABLISHED, and the schematic says so in its own terms: no source
	   establishes a correct loupe magnification, and no surveyed product
	   implements a loupe over a true page on a phone. */
	const MAGNIFICATION = 2.4;

	/* THE DESKTOP FIGURE IS DERIVED, not chosen, because no source sets one.
	   2.4 is a portrait figure: it multiplies a page already shrunk to a
	   thumbnail, and on a desk the page is drawn at full size, so the same
	   multiplier would put one measure across a monitor.

	   WHAT THE LOUPE IS FOR IS A READABLE STAVE, so that is what the desktop
	   asks for: a target stave space in CSS pixels, divided by the one the page
	   is already drawing. 12 px is the target. Gould sets a vocal score's
	   rastral around 7 mm, which at 96 dpi is about 26 px of staff height and
	   so about 6.5 px of stave space; twelve is a little under twice that,
	   which is the register a notation editor works at and roughly what Finale
	   shows at 100 percent on a modern display. The shipped print engraving
	   draws 5.5 px, so on today's pages this lands near 2.2 and it will follow
	   the engraving rather than fight it if that number ever moves.

	   CLAMPED at both ends. Below 1.2 the loupe is not a magnifier and the
	   singer would wonder what it was for; above 2.4 it would outrun the
	   phone's own ruled figure, and one grammar means the desk never magnifies
	   harder than the phone does. */
	const DESKTOP_TARGET_LINE_GAP = 12;
	const DESKTOP_MIN = 1.2;
	const DESKTOP_MAX = 2.4;

	/** The desk's own gutter (`--portrait-gutter`), so the loupe keeps the
	    page's margins rather than inventing a second measure. */
	const GUTTER = 24;

	/* ── AN APPLIANCE RESTING ABOVE THE PAGE ─────────────────────────────
	   Ruled by Dann 2026-08-28, from the walk on `9fabbf1`: the loupe matched
	   the page's width and sat on its bottom edge, so it read as a footer —
	   part of the document rather than a thing set down on it. Paper must show
	   past it on both sides and continue visibly underneath.

	   The inset, and why it is this fraction, is with `pageInset` in
	   `loupe.ts`. There is no matching constant for the vertical: the loupe is
	   CENTRED on the page's visible height, so its foot is whatever centring
	   leaves rather than a gap of its own. See `centredFoot`. */
	const SIDE_INSET = 1 / 16;

	/* The frame's own furniture above and below the window: the measure tag's
	   row, 10 px of padding over 12, and two 1.4 px borders. MEASURED at 46.5
	   on all three surfaces, since none of it varies with the music.

	   IT IS AN ESTIMATE AND ONLY THE CLAMPS READ IT. The centring itself is
	   exact whatever this is, because CSS hangs the frame off its centre; this
	   number only decides when a frame is too tall for the room to centre it
	   in, and it would have to be wrong by tens of pixels to change that
	   answer. It is written down rather than inlined so that a change to the
	   tag's type is a change to something named. */
	const CHROME = 46.5;

	/* ── THE FRAME IS CUT TO THE PAGE'S INK ──────────────────────────────
	   Ruled by Dann 2026-08-27: the loupe was too loose around its content,
	   and empty loupe is page the singer cannot see. The crop used to take the
	   held system's declared box and the window the tallest system's — 103 and
	   106 units on this document — where the ink actually occupies 82.49.

	   The reasoning, and the constraint that the frame must not breathe as the
	   singer steps, live with `inkCrop` and `windowScale` in `loupe.ts`, which
	   is where they can be tested. What lives here is the measuring: the page
	   is surveyed once, and the survey is what those two are handed.

	   HALF A STAFF SPACE OF AIR, top and bottom. The band already contains
	   every ledger line, stem, tuplet bracket and tie the page carries, so the
	   pad is only to keep the tallest of them off the frame's own edge. */
	const INK_PAD_SP = 0.5;

	/* ONE CANVAS, MEASURED THE WAY THE GLYPH CELLS ARE. `getBBox` on an SVG
	   `<text>` returns the font's LAYOUT box, not its ink, and a survey built
	   on it reported systems whose "ink" stood taller than the viewBox that
	   contained them. Canvas answers with the inked bounds. */
	let inkCanvas: CanvasRenderingContext2D | null = null;

	function textInk(el: Element): { top: number; bottom: number } | null {
		const ctx = (inkCanvas ??= document.createElement('canvas').getContext('2d'));
		if (!ctx) return null;
		const cs = getComputedStyle(el);
		ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
		const m = ctx.measureText(el.textContent ?? '');
		if (!(m.actualBoundingBoxAscent > 0 || m.actualBoundingBoxDescent > 0)) return null;
		const y = Number(el.getAttribute('y'));
		if (!Number.isFinite(y)) return null;
		return { top: y - m.actualBoundingBoxAscent, bottom: y + m.actualBoundingBoxDescent };
	}

	/** Remembered per page, so a step does not re-survey the whole score. */
	const surveys = new WeakMap<Element, { signature: string; metrics: PageInk }>();

	function pageMetrics(container: Element): PageInk | null {
		const systems = [...container.querySelectorAll('[data-system]')];
		const signature = systems.map((el) => el.getAttribute('viewBox') ?? '').join('|');
		const held = surveys.get(container);
		if (held && held.signature === signature) return held.metrics;

		let above = -Infinity;
		let below = -Infinity;
		let minTotalSpan = Infinity;
		for (const sys of systems) {
			const hit = sys.querySelector('[data-hit]');
			if (!hit) continue;
			const hitH = Number(hit.getAttribute('height'));
			const gap = hitH / 11;
			const staffTop = Number(hit.getAttribute('y')) + 3.5 * gap;
			const sysWidth = Number(sys.getAttribute('width'));
			if (!(gap > 0) || !Number.isFinite(staffTop)) continue;
			for (const el of sys.querySelectorAll('*')) {
				if (el.tagName === 'g') continue;
				/* WHAT THE LOUPE DOES NOT DRAW CANNOT SET ITS FRAME. The hit
				   rectangles, the paper behind the system, the page's own held
				   rectangle and the analysis layer are all stripped from the
				   clone, so a phonation break standing above the staff must not
				   push the frame open for ink the loupe then removes. */
				if (el.closest('[data-analysis]') || el.closest('[data-held-measure]')) continue;
				/* The page's selection ring is the pane's mark, not engraving, and
				   the clone drops it — so it must not size the frame either. */
				if (el.hasAttribute('data-selection-ring')) continue;
				if (el.tagName === 'rect') {
					if (el.hasAttribute('data-hit')) continue;
					if (Number(el.getAttribute('width')) >= sysWidth * 0.95) continue;
				}
				let top: number;
				let bottom: number;
				if (el.tagName === 'text') {
					const ink = textInk(el);
					if (!ink) continue;
					({ top, bottom } = ink);
				} else {
					let b: DOMRect;
					try {
						b = (el as SVGGraphicsElement).getBBox();
					} catch {
						continue;
					}
					if (!b || (!b.width && !b.height)) continue;
					top = b.y;
					bottom = b.y + b.height;
				}
				above = Math.max(above, staffTop - top);
				below = Math.max(below, bottom - staffTop);
			}

			/* The system's measures, off its barlines. The same vertical test
			   the held measure's own boundary search uses: a barline is the
			   vertical that spans the staff exactly. */
			const staffBottom = staffTop + 4 * gap;
			const tol = gap * 0.3;
			const bars: number[] = [];
			for (const el of sys.querySelectorAll('line')) {
				const x1 = Number(el.getAttribute('x1'));
				if (Math.abs(x1 - Number(el.getAttribute('x2'))) > 0.01) continue;
				const y1 = Number(el.getAttribute('y1'));
				const y2 = Number(el.getAttribute('y2'));
				if (Math.abs(Math.min(y1, y2) - staffTop) > tol) continue;
				if (Math.abs(Math.max(y1, y2) - staffBottom) > tol) continue;
				bars.push(x1);
			}
			const heads = [...sys.querySelectorAll('[data-hit]')].map((el) => Number(el.getAttribute('x')));
			const head = heads.length > 0 ? Math.max(0, Math.min(...heads)) : 0;
			const edges = [head, ...bars.sort((a, b) => a - b), sysWidth];
			for (let i = 0; i < edges.length - 1; i++) {
				/* The window's left edge sits half a gap inside the barline it
				   opens on, as the crop does; the first measure of a system
				   opens on the head and moves nothing. */
				const left = i === 0 ? edges[0] : edges[i] + gap * 0.5;
				const span = edges[i + 1] - left;
				if (span < gap) continue;
				minTotalSpan = Math.min(minTotalSpan, head + span);
			}
		}
		if (!Number.isFinite(above) || !Number.isFinite(below)) return null;
		const metrics = { above, below, minTotalSpan };
		surveys.set(container, { signature, metrics });
		return metrics;
	}

	/* THE PAGE CAN MOVE UNDER THE LOUPE, and the loupe has to hear about it.
	   Closing the drawer widens the desk and slides the sheet sideways over the
	   drawer's own 180 ms, and `dockInset` changes at the START of that. An
	   effect that re-ran on `dockInset` alone measured the sheet where it had
	   been, not where it was going: MEASURED, the loupe landed 255.8 px right of
	   the sheet's centre, having centred itself on a stale rectangle.

	   A `ResizeObserver` ON THE PAGE'S CONTAINER answers it. The container's
	   width really does change when the drawer moves, so the observer fires
	   when the layout has settled rather than when the intention was formed, and
	   it covers every other way the page can move too: a window resize, a
	   rotation, a re-pagination. It cannot loop, because it watches the page and
	   the loupe is not inside the page. */
	let layoutTick = $state(0);
	$effect(() => {
		const el = document.querySelector('.fit-paper-container');
		if (!el || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(() => (layoutTick += 1));
		ro.observe(el);
		return () => ro.disconnect();
	});

	interface Frame {
		inner: string;
		viewBox: string;
		/** The frame's own width, stable as the singer steps between measures. */
		width: number;
		/** Its left edge: centred on the sheet, held clear of the dock. */
		left: number;
		/** The magnified measure's width, centred inside the frame. */
		contentWidth: number;
		/** The head's width: the clef and the key signature, at the left edge. */
		headWidth: number;
		/** The head's own crop of the same system, in the same coordinates. */
		headViewBox: string;
		contentHeight: number;
		/** The window's height, sized by the TALLEST system on the page. */
		windowHeight: number;
		/** The y its CENTRE sits on; the frame hangs off it at -50%. */
		centreY: number;
		system: number;
		systems: number;
	}

	let frame = $state<Frame | null>(null);

	function hitsFor(page: Element, ids: readonly string[]): { rects: HitRect[]; nodes: Element[] } {
		const rects: HitRect[] = [];
		const nodes: Element[] = [];
		for (const id of ids) {
			const el = page.querySelector(`[data-hit="${CSS.escape(id)}"]`);
			if (!el) continue;
			nodes.push(el);
			rects.push({ x: Number(el.getAttribute('x')), width: Number(el.getAttribute('width')) });
		}
		return { rects, nodes };
	}

	/* THE CLONE, rebuilt whenever the held measure, the taken entry, or the
	   page itself changes. Reading the DOM rather than being handed geometry
	   is deliberate: the page is injected SVG, so the DOM is the only place
	   the rendered coordinates exist, and VoiceProfilePane's own selection
	   mark already reaches the page exactly this way. */
	$effect(() => {
		void revision;
		void selectedEventId;
		void layoutTick;
		if (!open || measureIndex === null || ownIds.length === 0) {
			frame = null;
			return;
		}
		const container = document.querySelector('.fit-paper-container');
		if (!container) {
			frame = null;
			return;
		}
		const own = hitsFor(container, ownIds);
		const first = own.nodes[0];
		if (!first) {
			frame = null;
			return;
		}
		const sysEl = first.closest('[data-system]');
		if (!(sysEl instanceof Element)) {
			frame = null;
			return;
		}

		// The next measure bounds the window only when it shares this system.
		const next = hitsFor(container, nextIds);
		const nextHere =
			next.nodes.length > 0 && next.nodes.every((n) => n.closest('[data-system]') === sysEl)
				? next.rects
				: [];

		const sysWidth = Number(sysEl.getAttribute('width'));
		const sysHeight = Number(sysEl.getAttribute('height'));
		const sysMinY = Number((sysEl.getAttribute('viewBox') ?? '0 0 0 0').split(/\s+/)[1] ?? 0);
		/* The staff's own extent, recovered from a hit rectangle. The renderer
		   builds each one from `staffTop - 3.5 * lineGap` to
		   `staffBottom + 3.5 * lineGap` around a staff of `4 * lineGap`
		   (`staff-renderer.ts:1007-1011`), so the rectangle is eleven line gaps
		   tall and one gap is an eleventh of it. The sage rectangle needs it. */
		const hitY = Number(first.getAttribute('y'));
		const hitH = Number(first.getAttribute('height'));
		/** One line gap, an eleventh of that rectangle. Three things need it. */
		const lineGap = hitH / 11;

		const win = measureWindow(own.rects, nextHere, sysWidth);
		if (!win || !(sysHeight > 0) || !(sysWidth > 0)) {
			frame = null;
			return;
		}

		/* The page's on-screen scale, MEASURED rather than recomputed. PageFit's
		   transform, the fitted width, and any browser pinch are all already in
		   this number, and none of them is knowable from here otherwise. */
		const box = sysEl.getBoundingClientRect();
		const unitPx = box.width / sysWidth;
		if (!(unitPx > 0)) {
			frame = null;
			return;
		}

		/* THE LOUPE NEVER EXCEEDS THE PAGE'S OWN WIDTH, ruled by Dann 2026-08-27
		   after his desktop walk found it growing to the viewport with the
		   drawer closed. It magnifies part of that page, so a frame wider than
		   the thing it is a part of reads as a second document rather than as a
		   closer look at this one.

		   THE PAGE'S WIDTH IS MEASURED, not computed from `PAGE_SIZES`: the
		   sheet on screen is what the loupe is a crop of, and on a phone that
		   sheet is already scaled by PageFit. */
		const sheet = container.querySelector('.score-page')?.getBoundingClientRect();
		const room = Math.max(160, window.innerWidth - dockInset - GUTTER * 2);

		/* THE STAGE is as much of the page as the singer can actually see: the
		   sheet, clipped to the room left over beside the dock and above it.
		   Every inset below is taken off the stage rather than off the
		   viewport, which is what makes the loupe read as resting on the PAGE
		   and not as floating in the window.

		   WHERE THE PAGE FITS THE ROOM the stage IS the page, so a fraction of
		   the stage is a fraction of the page's own width, as ruled. Landscape
		   is the one place they part: the sheet is wider than the room beside
		   the dock, so the stage is the visible part of it. That disparity is
		   the one carried since slice 2 and named again in the memo. */
		const stageWidth = sheet && sheet.width > 0 ? Math.min(room, sheet.width) : room;
		const stageBottom = Math.min(
			sheet ? sheet.bottom : window.innerHeight,
			window.innerHeight - dockHeight,
		);

		const inset = pageInset(stageWidth, SIDE_INSET);
		const width = Math.max(160, stageWidth - inset * 2);

		/* THE LOUPE CENTRES ON THE PAGE'S OWN AXIS, ruled by Dann 2026-08-27:
		   it belongs to the page it magnifies, so it lines up with it at every
		   width, drawer open or closed, on both surfaces.

		   IT WAS FLUSH LEFT BEFORE, and the width cap of §11 is what exposed
		   that: while the loupe filled the room it was given, its left edge and
		   the sheet's nearly agreed; once it was capped at the sheet's width it
		   kept the old left edge and the two came apart. MEASURED at 1400 with
		   the drawer closed, the loupe's centre was 272.2 px left of the
		   sheet's.

		   CENTRED, THEN CLAMPED CLEAR. The older ruling still binds: the loupe
		   never overlaps the dock or the open drawer. Where the sheet's centre
		   would put it under one, the clamp wins and the loupe sits as close to
		   the page's axis as it can get. That is not a compromise the code
		   makes quietly: §13 of the memo names the one case where it bites. */
		const stop = Math.max(dockInset + GUTTER, window.innerWidth - GUTTER - width);
		const left = sheet
			? Math.min(Math.max(sheet.x + sheet.width / 2 - width / 2, dockInset + GUTTER), stop)
			: dockInset + GUTTER;

		/* AN ENGRAVED EXCERPT OPENS WITH NO BARLINE BEFORE ITS FIRST NOTE, and
		   Dann walked the deploy and found one: on a mid-system measure the
		   window began at the midpoint before the first column, which is left of
		   the boundary barline, so the loupe read clef, key, barline, note. An
		   orphan barline after a key signature is not something an engraver
		   would ever set.

		   THE BARLINE IS FOUND AS DRAWN, not computed from the renderer's own
		   offset. It is the vertical line spanning exactly the staff, in the
		   left half of the window: a measure has one boundary and its internal
		   columns have none, so there is at most one to find. The staff's own
		   extent comes from the hit rectangle, as the sage mark's does.

		   THE FIRST MEASURE OF A SYSTEM NEEDS NOTHING, and gets nothing. The
		   renderer draws no barline for the first column of a slice
		   (`staff-renderer.ts:541`), so the search finds none and the window
		   keeps the edge it had. That case was already right and this does not
		   touch it. */
		const staffTop = hitY + 3.5 * lineGap;
		const staffBottom = staffTop + 4 * lineGap;
		const tolerance = lineGap * 0.3;
		const half = win.left + (win.right - win.left) / 2;
		let boundary: number | null = null;
		for (const el of sysEl.querySelectorAll('line')) {
			const x1 = Number(el.getAttribute('x1'));
			if (Math.abs(x1 - Number(el.getAttribute('x2'))) > 0.01) continue;
			const y1 = Number(el.getAttribute('y1'));
			const y2 = Number(el.getAttribute('y2'));
			if (Math.abs(Math.min(y1, y2) - staffTop) > tolerance) continue;
			if (Math.abs(Math.max(y1, y2) - staffBottom) > tolerance) continue;
			if (!(x1 >= win.left && x1 < half)) continue;
			if (boundary === null || x1 < boundary) boundary = x1;
		}
		if (boundary !== null) win.left = boundary + lineGap * 0.5;

		const span = win.right - win.left;

		/* THE CLEF AND THE KEY SIGNATURE, at the loupe's left edge. Ruled by
		   Dann 2026-08-27 from the deploy walk: a musician cannot read a stave
		   without them, and an engraved excerpt carries them however short it
		   is.

		   THEY ARE A SECOND CROP OF THE SAME CLONE, not a second drawing. The
		   renderer puts the clef and the key at the head of every system
		   (`staff-renderer.ts:739` and `:908`), so the head is already in the
		   system this loupe is showing; it is simply outside the x window of
		   every measure but the first. One clone, two viewports, and the glyphs
		   in the head are the page's glyphs for the same reason the measure's
		   are: they ARE the page's.

		   THE HEAD ENDS WHERE THE MUSIC'S FIRST INK BEGINS. `MUSIC_MARK` in
		   `loupe.ts` carries the whole of that decision and why it is paint order
		   rather than a list. Everything from the first marked element onward is
		   the music's, and this walk takes the leftmost ink of it, measured off
		   the DOM as drawn rather than recomputed from `leftMargin` or
		   `TACET_REST`, in the same register as the boundary-barline search above.

		   IT WAS BOUNDED ON HIT RECTANGLES UNTIL 2026-08-29, and that rule failed
		   twice on one walk. A hit rectangle begins at the midpoint BEFORE its
		   note, so it is neither the music's ink nor reliably right of the head's:

		   - A TACET MARK CARRIES NO HIT RECTANGLE. N.104's pass emits
		     `<g data-tacet>` and no `data-hit` at all
		     (`staff-renderer.ts:1382-1512`), so on a system that OPENS with a run
		     the smallest hit belonged to the first note AFTER the run, and the
		     head reached past the consolidated rest and painted it. Dann walked
		     `e347311` and found it: clef, key, a whole rest, then the held
		     measure, on a rest belonging to neither measure.

		   - THE HIT RECTANGLE CUT THE KEY SIGNATURE. On the engraved Without Sun
		     song 1 the first hit begins at x = 56 and the key signature's second
		     sharp is drawn at 56.01, so six of that document's seven systems
		     showed one sharp where the page has two. MEASURED on all seven and
		     looked at at nine times. Dann ruled the one rule in on 2026-08-29.

		   N.104 EXPOSED THE FIRST RATHER THAN CAUSING IT: before it, that
		   document's first measure drew nothing, so the head caught empty space
		   and the assumption held silently. Same shape as the augmentation dot.
		   The second was there the whole time.

		   FOUR THINGS ARE SKIPPED, and the last three are `pageMetrics`' own list
		   at `:222-236` for its own reason: what the loupe does not draw cannot
		   set its frame. A hit rectangle is a touch target and not ink. An
		   `[data-event-id]` group's box contains one, so the group is skipped and
		   its children carry it. A descendant of `[data-tacet]` is skipped because
		   the composed H-bar's body sits inside a `scale()` and `getBBox()` on it
		   returns local coordinates; the group's own box is the drawn one. The
		   analysis layer and the page's held rectangle are stripped from the
		   clone below, so they must not size a crop that will not paint them.
		   The selection ring is NOT stripped since N.113a and is skipped for
		   the opposite reason: it is a mark on the music rather than music, and
		   its box is two and a half times as tall as it is wide, so letting it
		   size the crop would open the frame around the taken note alone. */
		const nodes = [...sysEl.querySelectorAll('*')];
		const gate = nodes.findIndex((el) => el.matches(MUSIC_MARK));
		const inkXs: number[] = [];
		for (let i = gate; i >= 0 && i < nodes.length; i++) {
			const el = nodes[i];
			if (el.hasAttribute('data-hit') || el.hasAttribute('data-event-id')) continue;
			if (el.hasAttribute('data-selection-ring')) continue;
			if (el.closest('[data-analysis]') || el.closest('[data-held-measure]')) continue;
			const tacet = el.closest('[data-tacet]');
			if (tacet && tacet !== el) continue;
			let b: DOMRect;
			try {
				b = (el as SVGGraphicsElement).getBBox();
			} catch {
				continue;
			}
			if (b && (b.width || b.height)) inkXs.push(b.x);
		}
		const headWidthUnits = headBound(inkXs);

		/* THE WINDOW BEGINS WHERE THE HEAD ENDS. `clipToHead` in `loupe.ts`
		   carries the whole of that rule, why the two were one number until
		   2026-08-29, and the proof that clipping loses nothing.

		   WHAT DANN WALKED on `510a280`, 2026-09-01: the loupe on m. 4 painted
		   three sharps in a two-sharp key signature. On a measure that opens a
		   system the window's left edge is the leftmost hit rectangle, at
		   x = 56, and the head now runs past it, so both crops contained the
		   second sharp's ink at 56.01 to 61.25 and both drew it.

		   THE PAGE'S SAGE RECTANGLE KEEPS THE UNCLIPPED WINDOW, at `:908` and
		   after. It marks which measure the page is working on, which is a
		   question about the measure and not about the loupe's two crops; the
		   clip is the loupe's business alone. */
		const view = clipToHead(win, headWidthUnits);
		const viewSpan = view.right - view.left;

		/* THE HEAD SHARES THE FIT rather than being added to it. A measure
		   wider than the phone is shown WHOLE at less than 2.4 rather than
		   clipped at 2.4, because notes lost off the edge of a magnifier are the
		   worse failure: the singer cannot tell it happened. The head is part of
		   what must fit, so it is part of what sets the scale, and the applied
		   magnification is reported in the memo rather than assumed. */
		/* The magnification this modality asks for. On a phone it is the ruled
		   2.4 against the thumbnail; on a desk it is whatever brings the stave
		   to the target, measured against what the page is drawing right now. */
		const drawnLineGap = lineGap * unitPx;
		const magnification = isPhone
			? MAGNIFICATION
			: Math.min(
					DESKTOP_MAX,
					Math.max(DESKTOP_MIN, drawnLineGap > 0 ? DESKTOP_TARGET_LINE_GAP / drawnLineGap : DESKTOP_MIN),
				);

		const totalSpan = headWidthUnits + viewSpan;
		const drawn = Math.min(totalSpan * unitPx * magnification, width);
		const scale = drawn / totalSpan;
		const contentWidth = viewSpan * scale;
		const headWidth = headWidthUnits * scale;
		/* THE CROP'S VERTICAL EXTENT is the page's ink band, laid around this
		   system's own staff and padded by half a space so the tallest marks
		   the measure carries — a ledger line, a stem, a tuplet bracket, a
		   tie — are not shaved by their own outline. Constant for the page, so
		   the frame holds still as the singer steps. If nothing can be
		   measured the system's declared box stands in, which is what the
		   frame always used. */
		const page = pageMetrics(container);
		const crop = inkCrop(page, staffTop, lineGap, INK_PAD_SP, { top: sysMinY, height: sysHeight });
		const cropTop = crop.top;
		const cropHeight = crop.height;
		const contentHeight = cropHeight * scale;

		const ranges: SystemRange[] = [];
		for (const el of container.querySelectorAll('[data-system]')) {
			const r = parseSystemRange(el.getAttribute('data-system'));
			if (r) ranges.push(r);
		}

		const clone = sysEl.cloneNode(true) as Element;
		/* The clone arrives carrying whatever the page was wearing: its own
		   held-measure rectangle, which belongs on the page and not inside the
		   loupe, and VoiceProfilePane's `data-note-selected`, which is the
		   page's mark and not this surface's. Both come off. */
		for (const el of clone.querySelectorAll('[data-held-measure]')) el.remove();
		/* THE LOUPE IS A CONTROL SURFACE FOR ENGRAVING CONCERNS ONLY, ruled by
		   Dann 2026-08-27. The Score Markup's sage formant noteheads, the red
		   crossing squircles and the phonation breaks are analysis, and the
		   singer reads those on the page, in print, or through the browser's own
		   zoom. Inside a magnifier whose whole job is to let one measure be
		   corrected, they are marks that cannot be acted on.

		   FILTERED BY HANDLE, NOT BY COLOUR. `staff-renderer.ts` stamps every
		   analysis mark with `data-analysis` for exactly this, and the package's
		   own test asserts all four kinds carry it. Two of them could have been
		   found by their ink and the phonation break could not, so a colour
		   filter would have suppressed three quarters of a layer and left the
		   fourth mark standing with nothing to explain it.

		   ONE FILTER SERVES BOTH SURFACES, because both render this component,
		   and it serves both viewports because the head and the body are two
		   crops of this one clone. */
		for (const el of clone.querySelectorAll('[data-analysis]')) el.remove();
		/* THE PAGE'S OWN MARK STAYS, N.113a, AND ONLY THE GROUP'S ATTRIBUTE
		   COMES OFF. RULED BY DANN 2026-09-07 from his walk of `e1bcb67`: the
		   loupe marks the taken note "the way the page does, a box on the
		   notehead". His words on what it replaced: the bar drawn after the
		   notehead is *"misleading because the insertion point was in the space
		   after тес"*.

		   The page's mark is a rectangle carrying `data-selection-ring`, built
		   by `VoiceProfilePane.svelte` from the notehead's measured ink and
		   inserted at the front of the SYSTEM, so the clone already holds it
		   and it already sits in the system's coordinate space. Keeping its
		   `data-note-selected` is the whole change: the pane's stylesheet hides
		   a ring that has lost that attribute.

		   THE GROUP'S ATTRIBUTE STILL COMES OFF, and it must. Dann struck the
		   magnified outline on 2026-08-26 because it rode the note's whole
		   group, whose box includes the transparent hit rectangle, and read as
		   a tall capsule at 2.4 times. That mark is not this one: the ring is
		   sized to the notehead's ink, not to the group's box. */
		for (const el of clone.querySelectorAll('[data-note-selected]')) {
			if (el.hasAttribute('data-selection-ring')) continue;
			el.removeAttribute('data-note-selected');
		}
		/* THE HIT RECTANGLES ARE RENAMED IN THE CLONE, and that is what keeps
		   the two tap grammars apart. VoiceProfilePane's delegated listener
		   matches `[data-hit]` anywhere in the document, so a clone carrying
		   that name would put the page's meaning on a tap inside the loupe.
		   Renamed, the page keeps `data-hit` and this surface owns
		   `data-loupe-hit`, and each listener sees only its own. */
		for (const el of clone.querySelectorAll('[data-hit]')) {
			const id = el.getAttribute('data-hit') ?? '';
			el.removeAttribute('data-hit');
			el.setAttribute('data-loupe-hit', id);
		}

		/* ONE SAGE RECTANGLE ON THE PAGE, marking the measure the loupe holds.
		   It is not a control and it is not decoration: it is the page saying
		   which of its own components is under the knife, and between it and
		   the measure tag the singer never loses their place.

		   IT RIDES THE PAGE'S OWN SVG, the way VoiceProfilePane's selection
		   mark does, so it sits in the system's coordinate space and the
		   thumbnail's scale never has to be undone. */
		for (const stale of container.querySelectorAll('[data-held-measure]')) stale.remove();
		if (hitH > 0) {
			const mark = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			mark.setAttribute('data-held-measure', '');
			mark.setAttribute('x', String(win.left));
			mark.setAttribute('y', String(hitY + 3.5 * lineGap));
			mark.setAttribute('width', String(span));
			mark.setAttribute('height', String(4 * lineGap));
			mark.setAttribute('fill', 'none');
			mark.setAttribute('pointer-events', 'none');
			sysEl.insertBefore(mark, sysEl.firstChild);
		}

		/* THE LOUPE ANCHORS FIXED AND NEVER TRAVELS. Ruled by Dann 2026-08-26
		   on the deploy walk, and it replaces the placement r2 shipped, which
		   moved the loupe to keep the sage rectangle in view. The ruling is
		   that the page is the thing that stays still and the loupe is the
		   thing that stays put: the sage rectangle alone moves across the
		   still page, and the measure tag carries the name.

		   SO THE WINDOW IS A CONSTANT, and now it is the ink band's constant.
		   It used to be sized by the TALLEST system's declared box, which held
		   every system still but carried the renderer's reserved headroom with
		   it; the band is cut to what is actually drawn, and is one number for
		   the page in the same way. Every measure is now cropped to the same
		   height, so the window and the drawing agree except where a wide
		   measure meets the width cap and is scaled down whole.

		   AND THE ANCHOR IS THE PAGE, not the measure and no longer the dock.
		   Every surface now pins the loupe's bottom edge a fixed lift above
		   the stage's floor, so the singer's eye and thumb keep one
		   relationship for the whole session on all three. */
		/* The tallest drawing the page can produce, which is the narrowest
		   measure's, capped by the magnification this modality asks for. */
		const windowHeight = cropHeight * windowScale(page, unitPx * magnification, width);
		/* THE LOUPE IS CENTRED ON THE PAGE'S VISIBLE HEIGHT. It sat in the
		   page's lower third before, which put it below the eyeline; that was
		   this desk's own narrowing of Dann's words rather than his ruling,
		   and he corrected it 2026-08-28.

		   Pinning the BOTTOM rather than the top keeps the anchor on the edge
		   nearest the singer's thumb. The frame's height is a page-wide
		   constant since §14, so the two are equivalent here, and the bottom
		   is the one that cannot drift when the room above it changes. */
		const centreY = centreOnPage(
			Math.max(sheet ? sheet.top : 0, 0),
			stageBottom,
			window.innerHeight,
			windowHeight + CHROME,
			GUTTER,
		);

		frame = {
			inner: clone.innerHTML,
			viewBox: `${view.left} ${cropTop} ${viewSpan} ${cropHeight}`,
			width,
			left,
			contentWidth,
			headWidth,
			headViewBox: `0 ${cropTop} ${headWidthUnits} ${cropHeight}`,
			contentHeight,
			windowHeight,
			centreY,
			system: systemIndexOf(ranges, measureIndex) + 1,
			systems: ranges.length,
		};

		return () => {
			for (const stale of container.querySelectorAll('[data-held-measure]')) stale.remove();
		};
	});

	/* A TAP INSIDE THE LOUPE TAKES THE ENTRY, and places the armed syllable.
	   Dann's ruling of 2026-08-26 moved N.55b's placement here from the page.

	   NEAREST RATHER THAN `closest`, the same rule the page tap uses, so a tap
	   that lands between two entries still resolves to one and always the same
	   one. At 2.4 times the targets are large, and this only ever helps. */
	function handleTap(e: MouseEvent): void {
		const targets = [...(windowEl?.querySelectorAll('[data-loupe-hit]') ?? [])].map((el) => {
			const r = el.getBoundingClientRect();
			return {
				id: el.getAttribute('data-loupe-hit') ?? '',
				cx: r.left + r.width / 2,
				cy: r.top + r.height / 2,
			};
		});
		const id = nearestTarget(targets, e.clientX, e.clientY);
		if (id) onpick(id);
	}

	/* THE LISTENER IS ATTACHED RATHER THAN WRITTEN INTO THE MARKUP, and the
	   reason is VoiceProfilePane's own (`VoiceProfilePane.svelte:217`): the
	   thing being tapped is injected SVG, so there is no element here to hang a
	   Svelte handler on, and putting one on the wrapper would need a role and a
	   tabindex it should not have. This surface is `aria-hidden`, and the
	   keyboard path to every entry is the stepper. */
	let windowEl = $state<HTMLElement | undefined>(undefined);
	$effect(() => {
		const el = windowEl;
		if (!el) return;
		el.addEventListener('click', handleTap);
		return () => el.removeEventListener('click', handleTap);
	});

	const tag = $derived.by(() => {
		if (measureLabel === null || !frame) return '';
		/* THE ARITHMETIC JOINS THE CLAUSE, it does not take it. Dann's amendment
		   of 2026-08-26, answering the cost this comment used to name: a tag
		   that dropped the system exactly where the bar was wrong took the
		   singer's place away at the moment they most needed it. Where the
		   arithmetic fires the tag now says both.

		   THE SHORT FORM SURVIVES for a page whose systems cannot be read,
		   which is the same relationship `measureTagShort` has to
		   `measureTag`. Four forms, and each one says everything it knows. */
		if (fill && frame.system > 0 && frame.systems > 0) {
			return T('loupe.measureTagBoth')
				.replace('%m', measureLabel)
				.replace('%s', String(frame.system))
				.replace('%t', String(frame.systems))
				.replace('%a', String(fill.actual))
				.replace('%e', String(fill.expected));
		}
		if (fill) {
			return T('loupe.measureTagFill')
				.replace('%m', measureLabel)
				.replace('%a', String(fill.actual))
				.replace('%e', String(fill.expected));
		}
		if (frame.system > 0 && frame.systems > 0) {
			return T('loupe.measureTag')
				.replace('%m', measureLabel)
				.replace('%s', String(frame.system))
				.replace('%t', String(frame.systems));
		}
		return T('loupe.measureTagShort').replace('%m', measureLabel);
	});
</script>

{#if open && frame}
	<!-- ONE ANCHOR ON ALL THREE SURFACES: the frame's own CENTRE, on the
	     page's. It hangs off that point at -50% of its own height, so the
	     centring is exact without anything here knowing what the frame's
	     chrome measures. The rise animation carries the same -50%, or the
	     frame would drop half its height as the animation ended. -->
	<div
		class="loupe"
		style="left: {frame.left}px; width: {frame.width}px; top: {frame.centreY}px;"
	>
		<p class="loupe-tag" class:paired={!!noteLine}>{tag}</p>
		{#if noteLine}
			<p class="loupe-note">{noteLine}</p>
		{/if}
		<div class="loupe-window" bind:this={windowEl} style="height: {frame.windowHeight}px;">
			<!-- ARIA-HIDDEN for the reason the accidental glyphs already carry:
			     this is the page said louder, not a second thing to hear. The
			     score region has its own label and the dock's readout names the
			     taken entry in words.

			     TWO VIEWPORTS, ONE CLONE. The head crops the system's own left
			     edge, which is where the renderer put the clef and the key; the
			     body crops the held measure. They sit flush, at one scale, in
			     one coordinate space, so the staff lines run through both and
			     the pair reads as one stave rather than as two pictures. -->
			{#if frame.headWidth > 0}
				<svg
					class="loupe-svg loupe-head"
					viewBox={frame.headViewBox}
					width={frame.headWidth}
					height={frame.contentHeight}
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					font-family="'Source Serif 4', Georgia, serif"
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own renderer's SVG, cloned -->
					{@html frame.inner}
				</svg>
			{/if}
			<svg
				class="loupe-svg"
				viewBox={frame.viewBox}
				width={frame.contentWidth}
				height={frame.contentHeight}
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				font-family="'Source Serif 4', Georgia, serif"
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own renderer's SVG, cloned -->
				{@html frame.inner}
			</svg>
		</div>
	</div>
{/if}

<style>
	/* TWO SHADOW STEPS, so the lift reads as distance rather than as a border.
	   The loupe is nearest the user; the dock takes the same z-index, because
	   the two are one object.

	   THE Z-INDEX CLEARS THE INSTALL PROMPT, and that is measured rather than
	   chosen. `InstallPrompt.svelte:157` sits at 9000 and raises itself six
	   seconds into an iOS Safari session that carries no fresh decline
	   (N.105), and at any lower value it lands on top of the LYRIC station
	   and the singer cannot reach it. The mobile
	   drawer takes 60 (`Drawer.svelte:1531`) and the update toast 200. The
	   loupe is ruled nearest the user, the dock is its other half, and a
	   working surface a thumb cannot reach is not a surface. The prompt is
	   untouched and returns the moment the loupe goes away. */
	.loupe {
		position: fixed;
		z-index: 9100;
		/* THE SWIPE IS OURS. Without this a downward drag starting here is a
		   scroll gesture as far as the browser is concerned, it claims the
		   pointer, and the `pointerup` the dismissal listens for never arrives:
		   a `pointercancel` does. The ruled grammar gives pinch on the loupe no
		   meaning either, so nothing is lost by taking the whole surface. */
		touch-action: none;
		box-sizing: border-box;
		padding: 10px 10px 12px;
		border: 1.4px solid var(--stone-700, #44403c);
		border-radius: 10px;
		/* Hung off its own centre; see the anchor note on the element. */
		transform: translateY(-50%);
		background: var(--paper-light, #f5f1e8);
		/* ── THREE LAYERS, TO SELL THE LIFT ──────────────────────────────
		   Ruled by Dann 2026-08-28, out of §15's proposal. The geometry of
		   that same round is the precondition: while the frame matched the
		   page's width its side shadows were cut off at the page's edge and
		   read as the page's own edge treatment. There are now 51 px of paper
		   beside it and 71 px below for a shadow to land on.

		   CONTACT SPLIT FROM MID. A lift is read from the GAP between the line
		   that anchors an object to its surface and the diffuse mass beneath
		   it. The old first layer was doing both jobs at `0 4px`, where there
		   is no gap to read, so the loupe sat on the page like a card rather
		   than standing above it.

		   AMBIENT DROPPED AND SPREAD, because perceived height comes from how
		   far the shadow's centre falls below the object.

		   AND OPACITY FALLS AS BLUR RISES. On cream paper a warm black much
		   past 8% at this blur stops reading as shadow and starts reading as
		   dirt on the page. */
		box-shadow:
			0 1px 2px rgba(46, 42, 38, 0.2),
			0 8px 16px rgba(46, 42, 38, 0.13),
			0 20px 44px rgba(46, 42, 38, 0.07);
		/* OPACITY AND TRANSFORM ONLY, 180 ms, the slate's one duration. The
		   loupe and the dock arrive as one motion and leave as one. */
		animation: loupe-rise 180ms ease-out;
	}

	@keyframes loupe-rise {
		from {
			opacity: 0;
			transform: translateY(calc(-50% + 6px));
		}
		to {
			opacity: 1;
			transform: translateY(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.loupe {
			animation: none;
		}
	}

	/* The measure tag, top left, naming what the loupe holds in words. The
	   sage rectangle on the page says the same thing in its place. */
	.loupe-tag {
		margin: 0 0 6px;
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		color: var(--ink-tertiary, #6a655f);
	}

	/* THE LOCATOR IS TWO LINES WHEN THERE IS A NOTE TO NAME, and the pair keeps
	   the gap the single line had: the tag gives up its own bottom margin and
	   the second line carries it, so the window below does not move when a note
	   is taken or released. */
	.loupe-tag.paired {
		margin-bottom: 1px;
	}

	/* The second line, N.113b item 2. The measure tag says WHERE the loupe is
	   and this says WHAT is taken inside it, so it is the same face at the same
	   size, one step lighter in weight and without the tracking, which is what
	   makes the pair read as a heading and its subtitle rather than as two
	   labels. */
	.loupe-note {
		margin: 0 0 6px;
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 0.6875rem;
		font-weight: 400;
		color: var(--ink-tertiary, #6a655f);
	}

	/* The window is a constant height and the drawing is centred in it, so a
	   short system sits in air rather than moving the frame. */
	.loupe-window {
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.loupe-svg {
		display: block;
		flex: 0 0 auto;
	}

	/* The head carries the clef and the key and nothing else, and it must not
	   take a tap: the entries live in the body, and a hit rectangle that
	   happened to reach into the head belongs to a note the loupe is not
	   showing. */
	.loupe-head {
		pointer-events: none;
	}

	/* The taken entry, marked exactly as the page marks it: an outline, which
	   adds no geometry to the SVG and cannot shift a coordinate the renderer
	   computed. */
	.loupe :global([data-loupe-selected]) {
		outline: 2px solid var(--sage, #8b9a7d);
		outline-offset: 2px;
		border-radius: 2px;
	}

	/* THE HELD MEASURE'S MARK, on the page rather than on this surface. Sage,
	   Studio's accent for the score document, and hairline so it reads as a
	   bracket around the measure rather than as a box drawn on the music. */
	:global([data-held-measure]) {
		stroke: var(--sage, #8b9a7d);
		stroke-width: 1.2;
	}

	@media print {
		.loupe {
			display: none !important;
		}

		/* THE PAGE PRINTS AS IT PRINTED. The mark says what the singer is doing
		   now, which is the same reason the selection outline drops. */
		:global([data-held-measure]) {
			display: none !important;
		}
	}
</style>
