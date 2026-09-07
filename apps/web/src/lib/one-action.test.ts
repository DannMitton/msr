/**
 * Tests for N.108-5's text join.
 *
 * WHY THESE EXIST AS A GATE RATHER THAN AS A WALK. A walk shows the happy
 * paths: reload and the page is drawn, paste and it follows, type and it
 * follows after the pause. What a walk cannot show in one pass is the boot
 * case where the dictionary is still loading, and it cannot show the two
 * cases this rule must never cause, which are a pipeline that re-runs over
 * text it has already read and a timer held open by an empty field. Both are
 * invisible, and the first one resets the singer's own stress overrides every
 * time it happens.
 *
 * NO DOM HERE. `apps/web` runs vitest with no DOM environment, so these pass a
 * plain object and read a verdict. The timer and the effects are
 * `+page.svelte`'s.
 */

import { describe, expect, it } from 'vitest';
import { QUIET_MS, transcribeVerdict, type TranscribeState } from './one-action';

const POEM = 'Ночь была темна';

/** Ready, with nothing transcribed yet. Each test overrides what it is about. */
function state(over: Partial<TranscribeState> = {}): TranscribeState {
	return { poem: POEM, transcribedText: null, dictionaryReady: true, ...over };
}

describe('transcribeVerdict', () => {
	it('transcribes a restored poem at boot, with no score anywhere in sight', () => {
		// N.67 step 4b's asymmetry, and the defect Dann walked into on
		// 2026-09-07: the drawer held the poem and the page said to enter one.
		expect(transcribeVerdict(state(), 'boot')).toBe('now');
	});

	it('transcribes a paste at once', () => {
		expect(transcribeVerdict(state(), 'paste')).toBe('now');
	});

	it('holds typing for the quiet pause rather than running per keystroke', () => {
		expect(transcribeVerdict(state(), 'typing')).toBe('soon');
	});

	it('leaves a transcription that is already this text alone', () => {
		// The destructive case. Re-running the pipeline resets the singer's
		// stress overrides, their ë toggles and their syllable divisions,
		// because those key on word POSITION and a changed poem moves them.
		const s = state({ transcribedText: POEM });
		expect(transcribeVerdict(s, 'boot')).toBe('nothing');
		expect(transcribeVerdict(s, 'paste')).toBe('nothing');
		expect(transcribeVerdict(s, 'typing')).toBe('nothing');
	});

	it('runs again once the text has actually changed', () => {
		const s = state({ poem: POEM + ' и', transcribedText: POEM });
		expect(transcribeVerdict(s, 'typing')).toBe('soon');
		expect(transcribeVerdict(s, 'paste')).toBe('now');
	});

	it('has nothing to do when the field is empty', () => {
		const s = state({ poem: '' });
		expect(transcribeVerdict(s, 'boot')).toBe('nothing');
		expect(transcribeVerdict(s, 'typing')).toBe('nothing');
	});

	it('treats whitespace as an empty field, so clearing holds no timer open', () => {
		expect(transcribeVerdict(state({ poem: '  \n\t ' }), 'typing')).toBe('nothing');
	});

	it('waits for the dictionary rather than giving up, which is the boot case', () => {
		// The poem is restored before `loadDictionary` finishes, so "not ready"
		// at this instant is not "no poem".
		expect(transcribeVerdict(state({ dictionaryReady: false }), 'boot')).toBe('wait');
	});

	it('waits rather than scheduling, so typing before the dictionary lands is not lost', () => {
		expect(transcribeVerdict(state({ dictionaryReady: false }), 'typing')).toBe('wait');
	});

	it('does not wait for a dictionary it has no poem for', () => {
		expect(transcribeVerdict(state({ poem: '', dictionaryReady: false }), 'boot')).toBe(
			'nothing',
		);
	});

	it('does not wait for a dictionary when the text is already transcribed', () => {
		expect(
			transcribeVerdict(state({ transcribedText: POEM, dictionaryReady: false }), 'boot'),
		).toBe('nothing');
	});

	it('keeps the quiet pause under a second and over a fast typist’s word gap', () => {
		// The DESK DEFAULT's own reasoning, pinned so a later change is
		// deliberate rather than a drift.
		expect(QUIET_MS).toBeGreaterThan(300);
		expect(QUIET_MS).toBeLessThan(1000);
	});
});
