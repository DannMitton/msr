/**
 * N.112 increment 1. The word diff and the re-keying.
 *
 * WHAT THESE PIN, and why each one is here rather than assumed:
 *
 * - The brief's four increment-1 tests, verbatim in intent: edit one word and
 *   overrides elsewhere survive; delete a word and its override goes while the
 *   rest re-key; split a line and everything after re-keys; identical text is
 *   a no-op.
 * - Round-trip stability, which the brief pins twice: the same text twice
 *   gives the identical map, and editing a word and editing it back gives the
 *   original map.
 *
 * THE GRIDS HERE ARE WRITTEN BY HAND, not produced by `wordGrid`. That is
 * deliberate: `wordGrid` needs the dictionary loaded, and what is under test is
 * the alignment, not the tokenizer. `pipeline.test.ts`'s own coverage is what
 * says the tokenizer is right, and `wordGrid` is step 1 of `processText`
 * unchanged rather than a second copy of it.
 */
import { describe, it, expect } from 'vitest';
import {
	diffWordGrid,
	emptyDiff,
	rekeyByWord,
	rekeyByWordChar,
	wordKey,
} from './text-diff';

/** `Ком-нат-ка тес-на-я / ти-ха-я ми-ла-я`, the alias's own first two lines. */
const POEM = [
	['комнатка', 'тесная'],
	['тихая', 'милая'],
];

describe('wordKey', () => {
	it('is the key shape the override maps and SlotOrigin already use', () => {
		expect(wordKey(0, 0)).toBe('0-0');
		expect(wordKey(3, 12)).toBe('3-12');
	});
});

describe('diffWordGrid', () => {
	it('reports identical text as unchanged, and that is a no-op everywhere', () => {
		const diff = diffWordGrid(POEM, POEM);
		expect(diff.unchanged).toBe(true);
		expect(diff.removed.size).toBe(0);
		expect(diff.added.size).toBe(0);
	});

	it('gives the identical map when the same text is transcribed twice', () => {
		const a = diffWordGrid(POEM, POEM);
		const b = diffWordGrid(POEM, POEM);
		expect([...a.moved]).toEqual([...b.moved]);
		expect(a.unchanged).toBe(b.unchanged);
	});

	it('matches every word but the one that changed, and leaves the rest in place', () => {
		const after = [
			['комнатка', 'тесная'],
			['тихая', 'светлая'],
		];
		const diff = diffWordGrid(POEM, after);
		expect(diff.unchanged).toBe(false);
		expect(diff.moved.get('0-0')).toBe('0-0');
		expect(diff.moved.get('0-1')).toBe('0-1');
		expect(diff.moved.get('1-0')).toBe('1-0');
		expect(diff.removed.has('1-1')).toBe(true);
		expect(diff.added.has('1-1')).toBe(true);
		expect(diff.moved.has('1-1')).toBe(false);
	});

	it('slides every later word back when a word is deleted', () => {
		const after = [['комнатка'], ['тихая', 'милая']];
		const diff = diffWordGrid(POEM, after);
		expect(diff.removed.has('0-1')).toBe(true);
		// The two words of line 2 keep their own coordinates, because deleting
		// a word from line 1 does not renumber line 2.
		expect(diff.moved.get('1-0')).toBe('1-0');
		expect(diff.moved.get('1-1')).toBe('1-1');
	});

	it('renumbers within a line when a word is deleted from the middle of it', () => {
		const before = [['раз', 'два', 'три']];
		const after = [['раз', 'три']];
		const diff = diffWordGrid(before, after);
		expect(diff.moved.get('0-0')).toBe('0-0');
		expect(diff.removed.has('0-1')).toBe(true);
		expect(diff.moved.get('0-2')).toBe('0-1');
	});

	it('pushes every later word forward when a word is inserted', () => {
		const before = [['раз', 'три']];
		const after = [['раз', 'два', 'три']];
		const diff = diffWordGrid(before, after);
		expect(diff.moved.get('0-0')).toBe('0-0');
		expect(diff.moved.get('0-1')).toBe('0-2');
		expect(diff.added.has('0-1')).toBe(true);
		expect(diff.removed.size).toBe(0);
	});

	it('re-keys everything after a line split, and loses no word to it', () => {
		const before = [['комнатка', 'тесная', 'тихая']];
		const after = [['комнатка'], ['тесная', 'тихая']];
		const diff = diffWordGrid(before, after);
		expect(diff.unchanged).toBe(false);
		expect(diff.removed.size).toBe(0);
		expect(diff.added.size).toBe(0);
		expect(diff.moved.get('0-0')).toBe('0-0');
		expect(diff.moved.get('0-1')).toBe('1-0');
		expect(diff.moved.get('0-2')).toBe('1-1');
	});

	it('re-keys everything after a line join, which is the split run backwards', () => {
		const before = [['комнатка'], ['тесная', 'тихая']];
		const after = [['комнатка', 'тесная', 'тихая']];
		const diff = diffWordGrid(before, after);
		expect(diff.removed.size).toBe(0);
		expect(diff.added.size).toBe(0);
		expect(diff.moved.get('1-1')).toBe('0-2');
	});

	it('returns the original map when a word is edited and edited back', () => {
		const edited = [
			['комнатка', 'тесная'],
			['тихая', 'светлая'],
		];
		const there = diffWordGrid(POEM, edited);
		const back = diffWordGrid(edited, POEM);
		// Every word that survived the round trip is at the coordinate it
		// started from, which is the whole of "editing it back yields the
		// original map".
		for (const [from, to] of there.moved) {
			expect(back.moved.get(to)).toBe(from);
		}
		expect(diffWordGrid(POEM, POEM).unchanged).toBe(true);
	});

	it('treats a repeated word as one match per occurrence, not one per spelling', () => {
		const before = [['я', 'тихая', 'я']];
		const after = [['я', 'милая', 'я']];
		const diff = diffWordGrid(before, after);
		expect(diff.moved.get('0-0')).toBe('0-0');
		expect(diff.moved.get('0-2')).toBe('0-2');
		expect(diff.removed.has('0-1')).toBe(true);
	});

	it('is empty in both directions when the poem arrives from nothing', () => {
		const diff = diffWordGrid([], POEM);
		expect(diff.moved.size).toBe(0);
		expect(diff.added.size).toBe(4);
		expect(diff.removed.size).toBe(0);
	});

	it('reports every word removed when the poem is emptied', () => {
		const diff = diffWordGrid(POEM, []);
		expect(diff.removed.size).toBe(4);
		expect(diff.added.size).toBe(0);
	});
});

describe('rekeyByWord', () => {
	it('leaves a map untouched when the text did not change', () => {
		const marks = new Map([['1-1', 'stress']]);
		const next = rekeyByWord(marks, emptyDiff());
		expect([...next]).toEqual([['1-1', 'stress']]);
	});

	it('keeps a mark elsewhere in the poem when one word is edited', () => {
		const after = [
			['комнатка', 'тесная'],
			['тихая', 'светлая'],
		];
		const diff = diffWordGrid(POEM, after);
		const marks = new Map([['1-0', 'stress on тихая']]);
		expect(rekeyByWord(marks, diff).get('1-0')).toBe('stress on тихая');
	});

	it('drops the mark on a word that was deleted and re-keys the rest', () => {
		const before = [['раз', 'два', 'три']];
		const after = [['раз', 'три']];
		const diff = diffWordGrid(before, after);
		const marks = new Map([
			['0-0', 'a'],
			['0-1', 'b'],
			['0-2', 'c'],
		]);
		const next = rekeyByWord(marks, diff);
		expect(next.get('0-0')).toBe('a');
		expect(next.get('0-1')).toBe('c');
		expect(next.size).toBe(2);
	});

	it('carries every mark across a line split', () => {
		const before = [['комнатка', 'тесная', 'тихая']];
		const after = [['комнатка'], ['тесная', 'тихая']];
		const diff = diffWordGrid(before, after);
		const marks = new Map([
			['0-1', 'b'],
			['0-2', 'c'],
		]);
		const next = rekeyByWord(marks, diff);
		expect(next.get('1-0')).toBe('b');
		expect(next.get('1-1')).toBe('c');
		expect(next.has('0-1')).toBe(false);
	});

	it('drops a key the diff never heard of, rather than keeping it stale', () => {
		const before = [['раз', 'два']];
		const after = [['раз']];
		const diff = diffWordGrid(before, after);
		const marks = new Map([['9-9', 'orphan']]);
		expect(rekeyByWord(marks, diff).size).toBe(0);
	});

	it('does not mutate the map it is given', () => {
		const before = [['раз', 'два']];
		const after = [['раз']];
		const marks = new Map([
			['0-0', 'a'],
			['0-1', 'b'],
		]);
		rekeyByWord(marks, diffWordGrid(before, after));
		expect(marks.size).toBe(2);
	});
});

describe('rekeyByWordChar', () => {
	it('moves the word half of the key and leaves the character ordinal alone', () => {
		const before = [['раз', 'два', 'три']];
		const after = [['раз', 'три']];
		const diff = diffWordGrid(before, after);
		const toggles = new Map([
			['0-2-1', 'yo'],
			['0-1-0', 'gone'],
		]);
		const next = rekeyByWordChar(toggles, diff);
		expect(next.get('0-1-1')).toBe('yo');
		expect(next.size).toBe(1);
	});

	it('leaves a map untouched when the text did not change', () => {
		const toggles = new Map([['2-3-4', 'yo']]);
		expect([...rekeyByWordChar(toggles, emptyDiff())]).toEqual([['2-3-4', 'yo']]);
	});

	it('carries a toggle across a line split with its ordinal intact', () => {
		const before = [['комнатка', 'тесная', 'тихая']];
		const after = [['комнатка'], ['тесная', 'тихая']];
		const diff = diffWordGrid(before, after);
		const toggles = new Map([['0-2-3', 'yo']]);
		expect(rekeyByWordChar(toggles, diff).get('1-1-3')).toBe('yo');
	});
});
