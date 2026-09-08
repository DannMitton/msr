/**
 * N.92 mobile slice 2. The loupe's arithmetic, with no DOM.
 *
 * The geometry cases below are built from the renderer's own rule, that hit
 * rectangles meet at the midpoints between columns, rather than from numbers
 * read back out of a rendered page: an expectation that takes its value from
 * the mechanism under test proves nothing.
 */

import { describe, it, expect } from 'vitest';
import {
	COARSE_TAP_SPACES,
	FINE_TAP_SPACES,
	centreOnPage,
	centredViewBox,
	clipToHead,
	commonInkBox,
	headBound,
	inkCrop,
	isDismissSwipe,
	measureWindow,
	nearestTarget,
	pageInset,
	parseSystemRange,
	systemIndexOf,
	tapBand,
	windowScale,
	SWIPE_DISMISS_PX,
	type Crop,
	type PageInk,
} from './loupe';

describe('parseSystemRange', () => {
	it('reads the renderer’s own attribute', () => {
		expect(parseSystemRange('4-9')).toEqual({ fromMeasure: 4, toMeasure: 9 });
		expect(parseSystemRange('0-0')).toEqual({ fromMeasure: 0, toMeasure: 0 });
	});

	it('refuses anything that is not two ordered integers', () => {
		expect(parseSystemRange(null)).toBeNull();
		expect(parseSystemRange('')).toBeNull();
		expect(parseSystemRange('4')).toBeNull();
		expect(parseSystemRange('9-4')).toBeNull();
		expect(parseSystemRange('a-b')).toBeNull();
	});
});

describe('systemIndexOf', () => {
	const ranges = [
		{ fromMeasure: 0, toMeasure: 3 },
		{ fromMeasure: 4, toMeasure: 7 },
		{ fromMeasure: 8, toMeasure: 11 },
	];

	it('names the system that holds the measure', () => {
		expect(systemIndexOf(ranges, 0)).toBe(0);
		expect(systemIndexOf(ranges, 3)).toBe(0);
		expect(systemIndexOf(ranges, 4)).toBe(1);
		expect(systemIndexOf(ranges, 11)).toBe(2);
	});

	it('returns -1 for a measure no system claims', () => {
		expect(systemIndexOf(ranges, 12)).toBe(-1);
		expect(systemIndexOf([], 0)).toBe(-1);
	});
});

describe('measureWindow', () => {
	it('runs from this measure’s first midpoint to the next measure’s', () => {
		// Three columns in the held measure, two in the next. The renderer's
		// rectangles tile without gaps, so each x is the midpoint before a note.
		const own = [
			{ x: 100, width: 30 },
			{ x: 130, width: 30 },
			{ x: 160, width: 30 },
		];
		const next = [
			{ x: 190, width: 30 },
			{ x: 220, width: 30 },
		];
		expect(measureWindow(own, next, 620)).toEqual({ left: 100, right: 190 });
	});

	it('runs to the system’s right edge when the measure ends the system', () => {
		const own = [{ x: 480, width: 40 }];
		expect(measureWindow(own, [], 620)).toEqual({ left: 480, right: 620 });
	});

	it('clamps a negative left edge to the system origin', () => {
		const own = [{ x: -12, width: 40 }];
		expect(measureWindow(own, [{ x: 90, width: 30 }], 620)).toEqual({ left: 0, right: 90 });
	});

	it('never returns an inverted or empty window', () => {
		const own = [{ x: 300, width: 20 }];
		const w = measureWindow(own, [{ x: 250, width: 20 }], 620);
		expect(w).not.toBeNull();
		expect(w!.right).toBeGreaterThan(w!.left);
	});

	it('has nothing to show for a measure with no entries', () => {
		expect(measureWindow([], [{ x: 10, width: 10 }], 620)).toBeNull();
	});
});

describe('nearestTarget', () => {
	const targets = [
		{ id: 'a', cx: 10, cy: 10 },
		{ id: 'b', cx: 50, cy: 10 },
		{ id: 'c', cx: 90, cy: 10 },
	];

	it('resolves a coarse tap to the entry nearest it', () => {
		expect(nearestTarget(targets, 12, 40)).toBe('a');
		expect(nearestTarget(targets, 46, 200)).toBe('b');
		expect(nearestTarget(targets, 200, 10)).toBe('c');
	});

	it('breaks a tie toward the earlier entry, so one tap has one answer', () => {
		expect(nearestTarget(targets, 30, 10)).toBe('a');
	});

	it('has no answer when the page carries no entries', () => {
		expect(nearestTarget([], 5, 5)).toBeNull();
	});
});

describe('isDismissSwipe', () => {
	it('takes a downward drag past the threshold', () => {
		expect(isDismissSwipe(0, SWIPE_DISMISS_PX)).toBe(true);
		expect(isDismissSwipe(20, 120)).toBe(true);
	});

	it('refuses a short drag, an upward one, and a sideways one', () => {
		expect(isDismissSwipe(0, SWIPE_DISMISS_PX - 1)).toBe(false);
		expect(isDismissSwipe(0, -120)).toBe(false);
		expect(isDismissSwipe(-140, 80)).toBe(false);
	});
});

describe('commonInkBox and centredViewBox', () => {
	// A whole note is wide and short; a sixteenth is narrow and tall, because
	// SMuFL hangs its stem and flags off a notehead sitting at the origin.
	const whole = { x: 0, y: -25, width: 40, height: 50 };
	const sixteenth = { x: 0, y: -220, width: 30, height: 245 };

	it('takes the widest width and the tallest height in the set', () => {
		expect(commonInkBox([whole, sixteenth])).toEqual({ width: 40, height: 245 });
	});

	it('is zero for an empty set, so a missing face draws no box', () => {
		expect(commonInkBox([])).toEqual({ width: 0, height: 0 });
	});

	it('centres each glyph’s own ink inside the shared box', () => {
		const common = commonInkBox([whole, sixteenth]);
		// The tallest glyph fills the box and is not moved.
		expect(centredViewBox(sixteenth, common)).toBe('-5 -220 40 245');
		// The short one is inset by half the difference, top and bottom alike.
		expect(centredViewBox(whole, common)).toBe('0 -122.5 40 245');
	});

	it('gives every glyph in a set the same box, which is what fixes the margin', () => {
		const common = commonInkBox([whole, sixteenth]);
		const dims = (v: string) => v.split(' ').slice(2).join(' ');
		expect(dims(centredViewBox(whole, common))).toBe(dims(centredViewBox(sixteenth, common)));
	});
});

describe('the crop, cut to the page’s ink', () => {
	/* The numbers are this document's, measured 2026-08-27: the page's ink
	   reaches 13.88 units above the staff and 68.61 below it, on a 5.5-unit
	   line gap, against the 103-unit box the crop used to take. */
	const page: PageInk = { above: 13.88, below: 68.61, minTotalSpan: 200 };
	const fallback: Crop = { top: 68, height: 103 };

	it('cuts to the ink band with half a space of air on each side', () => {
		const crop = inkCrop(page, 88, 5.5, 0.5, fallback);
		expect(crop.height).toBeCloseTo(13.88 + 68.61 + 5.5, 5);
		expect(crop.top).toBeCloseTo(88 - 13.88 - 2.75, 5);
	});

	it('is shorter than the box it replaces, which is the whole point', () => {
		expect(inkCrop(page, 88, 5.5, 0.5, fallback).height).toBeLessThan(fallback.height);
	});

	it('DOES NOT BREATHE as the singer steps: one height for every measure', () => {
		// Three measures at three staff positions on the same page.
		const heights = [70, 88, 240].map((staffTop) => inkCrop(page, staffTop, 5.5, 0.5, fallback).height);
		expect(new Set(heights).size).toBe(1);
	});

	it('follows the staff, so each measure’s crop sits over its own system', () => {
		expect(inkCrop(page, 240, 5.5, 0.5, fallback).top - inkCrop(page, 70, 5.5, 0.5, fallback).top).toBe(170);
	});

	it('falls back to the system’s declared box when the page cannot be measured', () => {
		expect(inkCrop(null, 88, 5.5, 0.5, fallback)).toEqual(fallback);
		expect(inkCrop({ above: Infinity, below: 1, minTotalSpan: 1 }, 88, 5.5, 0.5, fallback)).toEqual(fallback);
	});
});

describe('the window’s scale', () => {
	const page: PageInk = { above: 13.88, below: 68.61, minTotalSpan: 200 };

	it('drops to what the narrowest measure can actually be drawn at', () => {
		// 200 units into a 380 px loupe is 1.9, below the 2.4 asked for.
		expect(windowScale(page, 2.4, 380)).toBeCloseTo(1.9, 5);
	});

	it('never exceeds the magnification asked for, so it cannot grow the window', () => {
		expect(windowScale(page, 2.4, 4000)).toBe(2.4);
	});

	it('keeps full magnification when the page’s measures are unknown', () => {
		expect(windowScale(null, 2.4, 380)).toBe(2.4);
		expect(windowScale({ above: 1, below: 1, minTotalSpan: Infinity }, 2.4, 380)).toBe(2.4);
	});
});

describe('the loupe resting on the page', () => {
	/* This document's own numbers, measured 2026-08-28: an 816-wide page on the
	   desk, a 382-wide one in portrait, and before the ruling the loupe matched
	   each exactly — no paper past it on either side. */
	const SIDE = 1 / 16;

	it('holds the frame inside the page on both sides', () => {
		expect(pageInset(816, SIDE)).toBeCloseTo(51, 5);
		expect(pageInset(382, SIDE)).toBeCloseTo(23.875, 5);
	});

	it('is a fraction, so it holds at every viewport rather than at one', () => {
		const narrow = pageInset(382, SIDE) / 382;
		const wide = pageInset(816, SIDE) / 816;
		expect(narrow).toBeCloseTo(wide, 10);
	});

	it('leaves the loupe narrower than the page, which is the whole point', () => {
		expect(816 - pageInset(816, SIDE) * 2).toBeCloseTo(714, 5);
	});
});

describe('the loupe centred on the page', () => {
	/* CENTRED, NOT IN THE LOWER THIRD. The lower third was this desk's own
	   narrowing of Dann's words and put the loupe below the eyeline; he
	   corrected it 2026-08-28. The foot is now a consequence, not a rule. */

	it('centres the frame on the page’s visible height', () => {
		// Desk: the page runs past the viewport, so the stage is 121.8 to 900.
		const centre = centreOnPage(121.8, 900, 900, 238.5, 24);
		const top = centre - 238.5 / 2;
		// Equal air above the frame and below it, within the stage.
		expect(top - 121.8).toBeCloseTo(900 - (top + 238.5), 5);
	});

	it('measures the page’s height to the DOCK when the dock is its floor', () => {
		// Portrait: the page runs on behind the dock, whose top edge is 493.6.
		const centre = centreOnPage(120.2, 493.6, 932, 145.4, 24);
		const top = centre - 145.4 / 2;
		expect(top - 120.2).toBeCloseTo(493.6 - (top + 145.4), 5);
		// And the frame stays clear of the dock rather than riding under it.
		expect(top + 145.4).toBeLessThan(493.6);
	});

	it('does NOT sit in the lower third, which is what was corrected', () => {
		const centre = centreOnPage(121.8, 900, 900, 238.5, 24);
		const lowerThirdOpens = 900 - (900 - 121.8) / 3;
		expect(centre).toBeLessThan(lowerThirdOpens);
	});

	it('clamps rather than centring when the frame is taller than the room', () => {
		// A 300-tall frame in a 200-tall stage cannot be centred in it; the
		// frame keeps its own top on screen instead.
		expect(centreOnPage(0, 200, 400, 300, 24)).toBe(24 + 300 / 2);
	});

	it('keeps the frame clear of the stage’s floor', () => {
		// A stage whose floor is above its own centre: the frame is held off
		// the floor rather than centred through it.
		expect(centreOnPage(0, 200, 900, 300, 24)).toBeLessThanOrEqual(200);
	});

	it('never pushes the frame past the viewport’s own floor', () => {
		expect(centreOnPage(0, 400, 200, 100, 24)).toBeLessThanOrEqual(200 - 50);
	});
});

describe('the tap band', () => {
	/* A hit rectangle 11 spaces tall with the staff as its middle four, which
	   is how the renderer draws them. 5.5 px to the space puts the staff from
	   19.25 to 41.25 within a rectangle running 0 to 60.5. */
	const RECT_TOP = 0;
	const RECT_H = 60.5;
	const SPACE = RECT_H / 11;

	it('opens two ledger lines’ worth beyond the staff for a fine pointer', () => {
		const band = tapBand(RECT_TOP, RECT_H, FINE_TAP_SPACES);
		expect((3.5 * SPACE - band.top) / SPACE).toBeCloseTo(2.5, 10);
		expect((band.bottom - 7.5 * SPACE) / SPACE).toBeCloseTo(2.5, 10);
	});

	it('is symmetrical about the staff', () => {
		const band = tapBand(RECT_TOP, RECT_H, FINE_TAP_SPACES);
		const staffCentre = 5.5 * SPACE;
		expect(staffCentre - band.top).toBeCloseTo(band.bottom - staffCentre, 10);
	});

	it('opens further for a coarse pointer, because a thumb needs it', () => {
		const fine = tapBand(RECT_TOP, RECT_H, FINE_TAP_SPACES);
		const coarse = tapBand(RECT_TOP, RECT_H, COARSE_TAP_SPACES);
		expect(coarse.bottom - coarse.top).toBeGreaterThan(fine.bottom - fine.top);
	});

	it('clears the 44 px thumb floor on the portrait thumbnail', () => {
		/* MEASURED there: one stave-space is 2.57 px, so the renderer's own
		   rectangle is 28.3 px — under the floor. The coarse band is the
		   reason this passes; the drawn rectangle would not. */
		const thumbnail = 2.57 * 11;
		const band = tapBand(0, thumbnail, COARSE_TAP_SPACES);
		expect(band.bottom - band.top).toBeGreaterThanOrEqual(44);
		expect(tapBand(0, thumbnail, 3.5).bottom - tapBand(0, thumbnail, 3.5).top).toBeLessThan(44);
	});

	it('is a fraction of the rectangle, so it holds at every zoom', () => {
		const small = tapBand(0, 28.3, FINE_TAP_SPACES);
		const large = tapBand(0, 60.5, FINE_TAP_SPACES);
		expect((small.bottom - small.top) / 28.3).toBeCloseTo((large.bottom - large.top) / 60.5, 10);
	});
});

describe('nearestTarget, bounded', () => {
	const band = tapBand(0, 60.5, FINE_TAP_SPACES);
	const bounded = [{ id: 'a', cx: 100, cy: 30.25, ...band }];

	it('answers a tap inside the band', () => {
		expect(nearestTarget(bounded, 100, 30.25)).toBe('a');
	});

	it('answers a tap far to the SIDE, since only the vertical is bounded', () => {
		expect(nearestTarget(bounded, 4000, 30.25)).toBe('a');
	});

	it('answers NOTHING to a tap below the band, which was the defect', () => {
		expect(nearestTarget(bounded, 100, band.bottom + 1)).toBeNull();
		// An inch below the staff, the case Dann reported.
		expect(nearestTarget(bounded, 100, 30.25 + 96)).toBeNull();
	});

	it('answers nothing above the band either', () => {
		expect(nearestTarget(bounded, 100, band.top - 1)).toBeNull();
	});

	it('leaves an unbanded target unbounded, which is the loupe’s own case', () => {
		const free = [{ id: 'a', cx: 100, cy: 30 }];
		expect(nearestTarget(free, 100, 9999)).toBe('a');
	});

	it('skips a banded target for one whose band does contain the tap', () => {
		const two = [
			{ id: 'near', cx: 100, cy: 30.25, ...band },
			{ id: 'far', cx: 100, cy: 230.25, ...tapBand(200, 60.5, FINE_TAP_SPACES) },
		];
		// A tap by the second staff takes it, though the first centre is closer
		// to nothing in particular — the band, not the distance, decides first.
		expect(nearestTarget(two, 100, 230.25)).toBe('far');
	});
});


// ── N.104 reopened: the head carries the whole clef and key ──────────
//
// Dann walked `e347311` and raised the loupe on the second and third drawn
// bars of the engraved Without Sun song 1. Both heads showed clef, key, a
// whole rest, and then the held measure's notes, on a rest that is in neither
// measure. Measuring that found a second fault of the same rule: the head was
// bounded at a hit rectangle, which begins at the midpoint BEFORE its note at
// x = 56, and the key signature's second sharp is drawn at 56.01, so six of
// the seven systems showed one sharp where the page has two.
//
// Dann ruled the one rule in, 2026-08-29: the head ends at the leftmost ink
// the music draws. `MUSIC_INK` is the discriminator; this is its arithmetic.
describe('the head’s bound', () => {
	it('stops at the leftmost ink where the music opens with a note', () => {
		// System 3 of that document: the notehead is drawn at 72.5, and the hit
		// rectangle that used to bound the head began at 56, inside the key.
		expect(headBound([72.5, 100.52, 128.91])).toBe(72.5);
	});

	it('stops at the first syllable where the underlay reaches left of the note', () => {
		// System 2: the notehead is at 72.5 and its accidental at 66.38, but
		// «тень» begins at 63.53. The underlay carries no handle, which is why
		// `MUSIC_MARK` gates on paint order rather than listing the music.
		expect(headBound([66.38, 72.5, 63.53])).toBe(63.53);
	});

	it('stops at the tacet mark where a run OPENS the system', () => {
		// System 1 of the same document: the consolidated rest is the leftmost
		// thing the music draws, and the first notehead is far right of it.
		expect(headBound([140.64, 179.1, 95.37])).toBe(95.37);
	});

	it('takes an accidental drawn left of its own notehead', () => {
		// `data-of-event` exists because an accidental is painted before the
		// group it belongs to (`staff-renderer.ts:1559`). Missing it would let
		// the head swallow one.
		expect(headBound([260.2, 254.08])).toBe(254.08);
	});

	it('takes the least of several marks', () => {
		expect(headBound([200, 180, 95.03, 140])).toBe(95.03);
	});

	it('is zero where the system draws no music, which the loupe never reaches', () => {
		// `Loupe.svelte`'s frame effect returns before the frame is computed, on
		// its `ownIds.length === 0` guard, when the held measure carries no
		// event ids, and a system of nothing but rests carries none.
		// Measured: a tap inside such a system raises no loupe
		// and the stepper stops at the last sung measure.
		expect(headBound([])).toBe(0);
	});

	it('ignores a candidate that is not a number', () => {
		// `getBBox()` throws on a detached node and the caller skips it, but a
		// NaN must not become the minimum if one ever arrives.
		expect(headBound([Number.NaN, 72.5])).toBe(72.5);
	});

	it('never returns a negative bound', () => {
		expect(headBound([-12])).toBe(0);
	});
});

// ── THE WINDOW BEGINS WHERE THE HEAD ENDS ────────────────────────────────
//
// Dann walked `510a280` on 2026-09-01 and found the loupe drawing THREE
// sharps in a two-sharp key signature, on m. 4 and m. 7 of the engraved
// Without Sun song 1. Five gates passed and none of them could have seen it.
//
// The cause is a coupling nobody had written down. Until 2026-08-29 the head
// was bounded on `Math.min(...allHits)`, which is the same quantity
// `measureWindow` opens on, so the head's right edge and the window's left
// edge were ONE number by construction and an overlap was impossible. Moving
// the head onto the music's ink broke that, and on a measure that opens a
// system the window still opens at the leftmost hit rectangle, x = 56, while
// the head now runs to 63.53 or beyond. Both crops held the second sharp's
// ink at 56.01 to 61.25 and both drew it.
//
// These pin the coupling, so the two cannot silently diverge again. The
// numbers are MEASURED off the rendered page on 2026-09-01, before and after.
describe('the window clipped to the head', () => {
	it('opens the window where the head stops, on a measure that opens a system', () => {
		// m. 4, system 2. The head runs to 63.53 and the window opened at 56,
		// so 7.53 units were painted twice and the second sharp sat inside.
		expect(clipToHead({ left: 56, right: 241.51 }, 63.53)).toEqual({
			left: 63.53,
			right: 241.51,
		});
	});

	it('leaves a mid-system window untouched', () => {
		// m. 5, same system. The window opens at 247.42, far right of the head,
		// which is the case the fault never reached and must not now change.
		expect(clipToHead({ left: 247.42, right: 438.65 }, 63.53)).toEqual({
			left: 247.42,
			right: 438.65,
		});
	});

	it('leaves the window untouched where the head ends exactly on it', () => {
		// The construction as it stood before 2026-08-29: head and window were
		// the same number, so there was nothing to clip and nothing was lost.
		expect(clipToHead({ left: 56, right: 241.51 }, 56)).toEqual({
			left: 56,
			right: 241.51,
		});
	});

	it('tiles the system once, on every measure that opens one', () => {
		// The head paints [0, head] and the window paints [left, right], drawn
		// flush at one scale. Their total must be the system's own extent to
		// the window's right edge: no unit twice, and none missing. The six
		// heads and the one window left are MEASURED, 2026-09-01.
		const heads = [63.53, 64.98, 66.38, 69.33, 70.77, 69.14];
		const rights = [241.51, 248.38, 239.63, 248.7, 323.43, 245.03];
		for (let i = 0; i < heads.length; i++) {
			const win = clipToHead({ left: 56, right: rights[i] }, heads[i]);
			expect(win.left).toBe(heads[i]);
			expect(heads[i] + (win.right - win.left)).toBeCloseTo(rights[i], 10);
		}
	});

	it('never returns a window narrower than a unit', () => {
		// `measureWindow` keeps its own `left + 1` floor for the same reason.
		// The case cannot be built from this renderer: a hit rectangle is only
		// ever emitted for a note, whose notehead is ink left of the window's
		// right edge. The floor is here so a renderer change cannot collapse
		// the window to nothing without a test saying so.
		expect(clipToHead({ left: 56, right: 100 }, 400)).toEqual({ left: 99, right: 100 });
	});

	it('ignores a head that is not a number', () => {
		// `headBound` returns 0 for a system with no music, and a caller that
		// hands this a NaN must get the window it already had rather than one
		// bounded by nothing.
		expect(clipToHead({ left: 56, right: 241.51 }, Number.NaN)).toEqual({
			left: 56,
			right: 241.51,
		});
	});
});
