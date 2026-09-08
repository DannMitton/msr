/**
 * loupe.ts — the arithmetic behind the loupe, as pure functions.
 *
 * N.92 mobile slice 2. The loupe is a VIEW TRANSFORM over the page that is
 * already on screen: it clones the held measure out of the rendered system and
 * shows it larger. Nothing here draws, and nothing here knows about the DOM.
 * `Loupe.svelte` reads the geometry off the injected SVG and hands it to these
 * functions, which is the `note-picker.ts` discipline: every rule is testable
 * under vitest's node environment with no browser.
 *
 * `VocalLineEvent` IS NOT TOUCHED. Nothing here adds a field to it, and the
 * reconciliation package is not read or imported.
 */

/** A system's measure range, from the renderer's own `data-system` attribute. */
export interface SystemRange {
	fromMeasure: number;
	toMeasure: number;
}

/** A hit rectangle's geometry, in its system's own coordinate space. */
export interface HitRect {
	x: number;
	width: number;
}

/** The x window the loupe shows, in the system's own coordinate space. */
export interface MeasureWindow {
	left: number;
	right: number;
}

/**
 * Parse one `data-system="12-17"` attribute. Returns null on anything that is
 * not two integers, so a renderer change cannot silently produce a system
 * numbered NaN of NaN in the measure tag.
 */
export function parseSystemRange(attr: string | null | undefined): SystemRange | null {
	if (!attr) return null;
	const m = /^(\d+)-(\d+)$/.exec(attr.trim());
	if (!m) return null;
	const fromMeasure = Number(m[1]);
	const toMeasure = Number(m[2]);
	if (toMeasure < fromMeasure) return null;
	return { fromMeasure, toMeasure };
}

/**
 * Which system holds a measure, zero-based, or -1 when none does.
 *
 * The ranges are the page's own, in document order, so the index this returns
 * is the number the measure tag prints after adding one. A measure belongs to
 * exactly one system: `paginateScore` packs by measure and never splits one.
 */
export function systemIndexOf(ranges: readonly SystemRange[], measureIndex: number): number {
	return ranges.findIndex((r) => measureIndex >= r.fromMeasure && measureIndex <= r.toMeasure);
}

/**
 * The x window of one measure inside its system.
 *
 * The renderer tiles the system with hit rectangles that meet at the midpoints
 * between neighbouring columns (`staff-renderer.ts:1011`), so a measure's own
 * hits START at the midpoint before its first note. The window therefore runs
 * from that midpoint to the midpoint before the NEXT measure's first note,
 * which puts a barline just inside each end and no neighbouring notehead
 * inside at all.
 *
 * A measure that ends its system has no next measure to bound it, so the
 * window runs to the system's right edge, which is where the closing barline
 * is drawn.
 *
 * THIS LEFT EDGE IS COUPLED TO `headBound` AND MUST NOT OVERLAP IT.
 * `clipToHead` carries the whole of that rule and what it cost when it was
 * only an accident of construction. Read it before changing either.
 */
export function measureWindow(
	own: readonly HitRect[],
	next: readonly HitRect[],
	systemWidth: number,
): MeasureWindow | null {
	if (own.length === 0) return null;
	const left = Math.max(0, Math.min(...own.map((r) => r.x)));
	const rightRaw = next.length > 0 ? Math.min(...next.map((r) => r.x)) : systemWidth;
	const right = Math.min(systemWidth, Math.max(rightRaw, left + 1));
	return { left, right };
}

/** A tappable entry, with its centre in viewport coordinates. */
export interface TapTarget {
	id: string;
	cx: number;
	cy: number;
	/** The band a tap must land in, if this target is bounded. See `tapBand`. */
	top?: number;
	bottom?: number;
}

/* ── HOW FAR BEYOND THE STAFF A TAP STILL COUNTS ─────────────────────────
   Dann's walk on `893ccb4` found the page's tap band unbounded vertically: a
   click an inch below the staff still raised the loupe, because the search
   took the nearest hit rectangle's centre with no limit on how far away that
   was. Ruled: a tap must land on or near the staff to count, bounded in
   STAVE-SPACES and not pixels so it holds at every zoom.

   FINE POINTERS GET TWO LEDGER LINES' WORTH, plus the half-space a notehead
   sitting on the second of them occupies: 2.5 spaces beyond the staff. That is
   not only the ruling's own figure, it is this document's: MEASURED for §14,
   the highest ink on the page stands 13.88 units above the staff's top line
   against a 5.5-unit space, which is 2.52 spaces. So the band covers every
   note the engraving actually draws and little else.

   COARSE POINTERS GET SEVEN, and the number is the thumb's, not the music's.
   MEASURED on the portrait thumbnail, one stave-space is 2.57 px and the
   renderer's own hit rectangle is 28.3 px tall — well under the 44 px floor
   this project holds for touch. Clearing 44 needs 17.1 spaces of total band,
   so seven beyond the staff gives 18 spaces, 46.3 px, and clears it. GEOMETRY
   ANSWERS MODALITY (principle 7): the same staff, read twice.

   WHAT THIS COSTS, said plainly: on the portrait thumbnail the systems are
   pitched 49 px apart, so bands 46.3 px tall very nearly meet, and between two
   systems a tap picks whichever staff is nearer rather than nothing. The band
   still ends: taps in the title, in the margins, beside the page and below the
   last system now do nothing, which is the defect that was reported. */
export const FINE_TAP_SPACES = 2.5;
export const COARSE_TAP_SPACES = 7;

/**
 * One target's tap band, from the hit rectangle the renderer drew for it.
 *
 * The rectangle runs `staffTop - 3.5 * lineGap` to `staffBottom + 3.5 * lineGap`
 * around a staff of `4 * lineGap` (`staff-renderer.ts:1007-1011`), so it is
 * eleven spaces tall with the staff as its middle four, and one space is an
 * eleventh of it. That is the same arithmetic the loupe recovers `lineGap` by,
 * and it is why the band can be read off the rectangle without the caller
 * knowing anything about the renderer's units.
 */
export function tapBand(
	rectTop: number,
	rectHeight: number,
	spaces: number,
): { top: number; bottom: number } {
	const space = rectHeight / 11;
	return {
		top: rectTop + (3.5 - spaces) * space,
		bottom: rectTop + (7.5 + spaces) * space,
	};
}

/**
 * The entry nearest a tap.
 *
 * The page's own glyphs are far below the 44 px floor at thumbnail scale, and
 * item 9 exempts them. This is what makes the exemption safe: a coarse tap
 * lands somewhere in the measure and resolves to the nearest entry, rather
 * than needing to land on a 7 px notehead. Ties go to the earlier target, so
 * the same tap always resolves to the same entry.
 */
export function nearestTarget(targets: readonly TapTarget[], x: number, y: number): string | null {
	let best: string | null = null;
	let bestD = Infinity;
	for (const t of targets) {
		/* A TARGET MAY CARRY A BAND, and where it does the tap must land inside
		   it however near the centre is otherwise. A target without one is
		   unbounded on purpose: the loupe's own targets live inside a window
		   that is cropped and `overflow: hidden`, so the window is already the
		   bound and a second one would only be a place for the two to drift. */
		if (t.top !== undefined && (y < t.top || y > t.bottom!)) continue;
		const dx = t.cx - x;
		const dy = t.cy - y;
		const d = dx * dx + dy * dy;
		if (d < bestD) {
			bestD = d;
			best = t.id;
		}
	}
	return best;
}

/**
 * Whether a pointer gesture is the dismissal swipe.
 *
 * Down, and more down than sideways, and far enough that a thumb resting on
 * the dock cannot make it by accident. The threshold is 56 px, one 44 px
 * target plus a little: below that the gesture is inside the size of the
 * control the finger started on.
 */
export const SWIPE_DISMISS_PX = 56;

export function isDismissSwipe(dx: number, dy: number): boolean {
	return dy >= SWIPE_DISMISS_PX && dy > Math.abs(dx);
}

/* THE INSERTION BAR IS GONE, N.113a. `InsertionBar` and `insertionBar` stood
   here from 2026-08-26 until 2026-09-07, when Dann walked `e1bcb67` and ruled
   the mark out: the bar drew AFTER the notehead and read as an insertion point
   between two notes, *"misleading because the insertion point was in the space
   after тес"*. The loupe now keeps the page's own selection ring in its clone
   (`Loupe.svelte`, the clone cleanup), so there is one mark for the taken note
   on both surfaces and no geometry here for a second one. */

/** A glyph's inked box, measured from the rendered face rather than declared. */
export interface InkBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * The box every glyph in one set is drawn into.
 *
 * WHY THE SET SHARES A BOX. A SMuFL duration glyph's origin is its NOTEHEAD,
 * and the stem runs out of the character's advance width, so laying the raw
 * characters out as text centres each notehead and leaves each note visibly
 * off-centre in its cell. Dann, 2026-08-26, at the walk: the centroid of the
 * note looks uncentred, and the margin inside the cell is not consistent.
 *
 * The cure is to draw each glyph's INK centred instead. Take the widest and
 * the tallest ink in the set, give every glyph that same box, and centre its
 * own ink inside it. One box for the set means one scale for the set, so a
 * whole note does not swell to the height of a sixteenth, and centred ink
 * means the same margin inside every cell.
 */
export function commonInkBox(boxes: readonly InkBox[]): { width: number; height: number } {
	return {
		width: Math.max(0, ...boxes.map((b) => b.width)),
		height: Math.max(0, ...boxes.map((b) => b.height)),
	};
}

/**
 * One glyph's `viewBox`, its ink centred inside the set's common box.
 *
 * Returned as the attribute string, because that is the only thing the caller
 * does with it and a four-number object would just be taken apart again.
 */
export function centredViewBox(box: InkBox, common: { width: number; height: number }): string {
	const x = box.x - (common.width - box.width) / 2;
	const y = box.y - (common.height - box.height) / 2;
	return `${round(x)} ${round(y)} ${round(common.width)} ${round(common.height)}`;
}

function round(n: number): number {
	return Math.round(n * 100) / 100;
}

/**
 * THE DISCRIMINATOR: where the head's ink stops and the music's begins.
 *
 * The head is the clef and the key signature, ruled by Dann 2026-08-27, and it
 * ends where the music's first ink begins. Naming that boundary is the whole
 * of the rule, and it is done here rather than in the component so there is
 * one place to read it.
 *
 * IT IS PAINT ORDER, GATED BY A HANDLE. The renderer emits a system in one
 * fixed order: the staff lines, the clef (`staff-renderer.ts:1172`), the
 * octave `8` (`:1196`), the key signature (`:1215`), and only then the tacet
 * pass (`:1382`), the note loop (`:1532`) and the underlay (`:2044`). So
 * everything before the FIRST element carrying a music handle is the head's
 * furniture, and everything from it onward is not.
 *
 * `MUSIC_MARK` IS THAT GATE. Three handles, and the renderer puts them on
 * every drawn part of a note and on nothing else:
 *
 * - `[data-event-id] > :not([data-hit])`, a notehead with its stem, flag and
 *   ledger lines (`:1731`). The group itself is deliberately not matched: its
 *   own box contains the hit rectangle.
 * - `[data-of-event]`, a part drawn OUTSIDE that group because it precedes the
 *   group in paint order: an accidental (`:1559`) or an augmentation dot
 *   (`:1708`). An accidental sits LEFT of its notehead, and MEASURED on the
 *   engraved Without Sun song 1 it is the leftmost music ink on two of the
 *   seven systems, at x = 66.38 against a notehead at 72.5.
 * - `[data-tacet]`, N.104's consolidated multibar rest (`:1214-1340`).
 *
 * WHY A GATE AND NOT A LIST. The underlay carries no handle at all
 * (`:2044`, `:2049`), and it is drawn wider than the note it sits under: on
 * six of the seven systems the first syllable begins LEFT of the first
 * notehead. A head bounded on the marked music alone paints that syllable,
 * which is a word where a clef and key belong. Paint order catches it without
 * asking the renderer for a new handle, because the underlay is emitted last.
 *
 * WHAT THE HEAD KEEPS. Anything the renderer draws before the gate and leaves
 * unmarked lands INSIDE the head. That is the right side for a clef, a key
 * signature and the octave `8`, and it would be the right side for a printed
 * time signature. **Ilya draws no time signature anywhere today**: `:1102`
 * reads `timeSignature` for spacing and nothing emits it.
 */
export const MUSIC_MARK = '[data-event-id] > :not([data-hit]), [data-of-event], [data-tacet]';

/**
 * Where the loupe's head ends: the leftmost ink drawn from `MUSIC_MARK` on.
 *
 * The caller measures each candidate off the DOM as drawn rather than
 * computing any of it from the renderer's constants, which are options a
 * caller can change. Same register as the boundary-barline search in
 * `Loupe.svelte`, which the file's own comment insists is found as drawn.
 *
 * Zero when the system draws no music at all. The loupe never rises on one:
 * `Loupe.svelte`'s frame effect returns early on its `ownIds.length === 0`
 * guard when the held measure carries no event ids, and a system of nothing
 * but rests carries none.
 *
 * THIS BOUND IS COUPLED TO `measureWindow`'S LEFT EDGE AND MUST NOT OVERLAP
 * IT. `clipToHead` carries the whole of that rule. Read it before changing
 * what this returns.
 */
export function headBound(inkXs: readonly number[]): number {
	const all = inkXs.filter((n) => Number.isFinite(n));
	if (all.length === 0) return 0;
	return Math.max(0, Math.min(...all));
}

/**
 * THE WINDOW BEGINS WHERE THE HEAD ENDS, and the two are one rule rather than
 * two quantities that happen to agree.
 *
 * WHAT THEY ARE. `headBound` is the leftmost MUSIC INK on the system, so the
 * head paints `[0, head]`. `measureWindow`'s left is the leftmost HIT
 * RECTANGLE of the held measure, which the renderer tiles from the midpoint
 * BEFORE each note (`staff-renderer.ts:1011`). The loupe draws the two crops
 * flush, at one scale, so any x they both contain is painted twice.
 *
 * THEY WERE THE SAME NUMBER BY CONSTRUCTION UNTIL 2026-08-29. The head was
 * bounded on `Math.min(...allHits)` then, which is the same quantity this
 * window opens on, so an overlap was impossible and the coupling was never
 * written down. `510a280` moved the head onto the music's ink to stop it
 * cutting the key signature, and broke the coupling without noticing.
 *
 * WHAT DANN WALKED, 2026-09-01. On a measure that OPENS a system the leftmost
 * hit rectangle stands at x = 56, LEFT of the key signature's second sharp,
 * whose ink runs 56.01 to 61.25; the head now runs to 63.53 or beyond. So the
 * head drew that sharp and the window drew it again, and the loupe showed
 * three sharps in a key signature that has two. MEASURED on all six affected
 * measures of the engraved Without Sun song 1: overlaps of 7.53, 8.98, 10.38,
 * 13.33, 14.77 and 13.14 units, with exactly one glyph inside each.
 *
 * NOTHING IS LOST, AND THAT IS A PROOF RATHER THAN A HOPE. The head paints
 * `[0, head]` and the clipped window paints `[head, right]`, so their union is
 * `[0, right]`, which is exactly the union the unclipped pair painted. The clip
 * changes the PARTITION and not the coverage, so it cannot remove a note, an
 * accidental, a rest or a syllable whatever the discarded region holds. A mark
 * that straddles the seam is cut by the head's crop and resumes at the window's,
 * and the two halves abut because the caller draws the crops adjacent at one
 * scale: MEASURED, the five staff lines cross it on every system and read as
 * one stave.
 *
 * THE CLAMP CANNOT BITE TODAY and is kept for the same reason `measureWindow`
 * keeps its own `left + 1`: a window narrower than a unit is not a window. A
 * head past the held measure's right edge would need a system whose first
 * measure carries a hit rectangle and no music ink at all, and a hit rectangle
 * is only ever emitted for a note (`staff-renderer.ts:1011`), whose notehead is
 * ink. NOT ESTABLISHED by a test on the page, because the case cannot be built
 * from this renderer.
 */
export function clipToHead(win: MeasureWindow, head: number): MeasureWindow {
	if (!Number.isFinite(head) || !(head > win.left)) return win;
	return { left: Math.min(head, win.right - 1), right: win.right };
}

/**
 * What the loupe needs to know about the page as a whole, in staff units.
 *
 * Gathered by measuring the rendered page once, so it holds for every measure
 * on it. See `Loupe.svelte`'s `pageMetrics`.
 */
export interface PageInk {
	/** How far the highest ink on the page rises above the staff's top line. */
	above: number;
	/** How far the lowest ink falls below it. */
	below: number;
	/** The narrowest measure's width, head included; `Infinity` if unknown. */
	minTotalSpan: number;
}

/** The loupe's vertical crop, in the system's own coordinates. */
export interface Crop {
	top: number;
	height: number;
}

/**
 * The crop, cut to the page's ink rather than to the renderer's reserved box.
 *
 * WHY THE PAGE'S INK AND NOT THE MEASURE'S. Dann, 2026-08-27: the loupe was
 * too loose around its content, and empty loupe is page the singer cannot see.
 * The obvious cure is to cut the frame to each measure — but the same ruling
 * forbids the frame changing size as the singer steps, and MEASURED across one
 * document's seventeen measures a per-measure frame swings between 68.15 and
 * 80.89 units. So the cut is the page's ink band: the furthest any measure
 * reaches above the staff and the furthest any reaches below it. One height
 * for the page, containing every measure, clipping none.
 *
 * ANCHORED TO THE STAFF. `staffTop` is the one landmark every system shares;
 * a system's viewBox top drifts with whatever its own highest note was.
 *
 * The fallback is the system's declared box, which is what the crop always
 * used, so a page that cannot be measured is no worse off than before.
 */
export function inkCrop(
	page: PageInk | null,
	staffTop: number,
	lineGap: number,
	padSpaces: number,
	fallback: Crop,
): Crop {
	if (!page || !Number.isFinite(page.above) || !Number.isFinite(page.below)) return fallback;
	const pad = lineGap * padSpaces;
	return { top: staffTop - page.above - pad, height: page.above + page.below + pad * 2 };
}

/**
 * The scale the loupe's WINDOW is sized at, which is not the scale the held
 * measure is drawn at.
 *
 * A measure too wide for the capped loupe is shown whole at less than full
 * magnification (`Loupe.svelte`, "THE HEAD SHARES THE FIT"), so its drawing is
 * shorter. A window held at full magnification keeps the difference as empty
 * loupe: MEASURED in landscape, where the cap bites hardest, a 254.4 px window
 * around a 212.4 px drawing. The window cannot follow the held measure without
 * breathing, so it follows the widest drawing the page can produce, which is
 * the narrowest measure's.
 *
 * UNDERSTATED ON PURPOSE. It is bounded above by the full-magnification height
 * the window always had, so an estimate that runs small costs a little air and
 * one that runs large would clip. This one runs small.
 */
export function windowScale(page: PageInk | null, fullScale: number, width: number): number {
	if (!page || !(page.minTotalSpan > 0) || !Number.isFinite(page.minTotalSpan)) return fullScale;
	return Math.min(fullScale, width / page.minTotalSpan);
}

/**
 * How far the loupe's frame is held inside the page's own edges, in pixels.
 *
 * Ruled by Dann 2026-08-28: the loupe must read as an appliance resting above
 * the page, not as part of it. MEASURED before the ruling, its frame matched
 * the page's width exactly — 816 into 816 on the desk, 382 into 382 in
 * portrait, no paper showing past it on either side — and a full-width bar on
 * the page's own bottom edge is a footer, which is a part of a document rather
 * than a thing set down on one.
 *
 * A FRACTION OF THE PAGE'S WIDTH, not a pixel count, so it holds at every
 * viewport. The fraction is the page's own: MEASURED, the sheet sits inside
 * the desk by 24 px on a 382-wide page in portrait (6.28% of its own width)
 * and by 58.3 px on an 816-wide page in landscape (7.14%). A sixteenth, 6.25%,
 * is the round number those two straddle, so the loupe standing inside the
 * page repeats the rhythm the page already makes against the desk.
 */
export function pageInset(stageWidth: number, fraction: number): number {
	return Math.max(0, stageWidth) * fraction;
}

/**
 * The y the loupe's CENTRE sits on, in viewport coordinates.
 *
 * Ruled by Dann 2026-08-28, correcting the round before it. That round placed
 * the loupe in the page's lower third with a ruled gap of 1.4 × the side inset
 * beneath it. **The lower third was this desk's own narrowing of his words and
 * was never his ruling**, and the result sat below the eyeline. The loupe is
 * centred on the page instead, and the foot is now whatever centring leaves
 * rather than a number of its own.
 *
 * `stageTop` and `stageBottom` bound as much of the page as the singer can
 * actually see: the sheet clipped to the room beside the dock and above it —
 * the viewport's floor on a desk, the dock's top edge on a phone, whichever
 * the page reaches first.
 *
 * A CENTRE RATHER THAN AN EDGE, because the centre is the thing being ruled.
 * The caller hangs the frame on it with `translateY(-50%)`, so the centring is
 * exact whatever the frame's chrome measures; an earlier pass computed a
 * bottom edge from an estimated height and MEASURED 6.5 px off true centre for
 * exactly that reason.
 *
 * `height` is therefore needed only for the clamps, and only the degenerate
 * case reads it. WHERE CENTRING IS IMPOSSIBLE, because the frame stands taller
 * than the room it is centred in, the frame is clamped on screen rather than
 * centred and the memo says so rather than the code pretending it centred: a
 * frame whose top has left the screen has lost the tag naming the measure and
 * the top of the staff with it.
 */
export function centreOnPage(
	stageTop: number,
	stageBottom: number,
	viewportHeight: number,
	height: number,
	gutter: number,
): number {
	const centre = stageTop + (stageBottom - stageTop) / 2;
	/* Never so low that the frame crosses the stage's floor, which on a phone
	   is the dock's top edge. */
	const lowest = stageBottom - height / 2;
	/* Never so high that its own top leaves the screen. */
	const highest = gutter + height / 2;
	return Math.min(Math.max(Math.min(centre, lowest), highest), viewportHeight - height / 2);
}
