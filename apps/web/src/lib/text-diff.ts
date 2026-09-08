/**
 * N.112, THE TEXT IS AUTHORITATIVE. One word diff, used by everything.
 *
 * RULED BY DANN 2026-09-07: *"whenever text is present, the transcription
 * exists."* Numbered 2026-09-06 as step 2 of the text-to-score sequence. The
 * model is Finale's Lyrics window, which E.46 adopted: change a word and it
 * changes in the score; delete one and the syllables slide left to close the
 * gap.
 *
 * WHAT THIS MODULE IS. The ONE place the old text and the new text are
 * compared. Everything keyed to a word position reads its answer: the stress
 * overrides, the ё toggles, the syllable divisions, the glosses, and (increment
 * 2) the seats on the score. Nothing else diffs text, and nothing downstream
 * re-derives word identity for itself.
 *
 * WHY IT IS HERE AND NOT IN `+page.svelte`. `vitest` never compiles a `.svelte`
 * file (`ENVIRONMENT.md`, "RUNES ARE INERT UNDER VITEST"), so a rule written
 * there is a rule nothing can pin. This is the half that can be tested, lifted
 * out on purpose, exactly as `one-action.ts` was for N.108-5.
 *
 * WHAT IT REPLACES. The reset that N.108-5 introduced and named as a cost in
 * the same breath: an implicit run dropped every override, because the keys
 * are positional and a kept override on a slid position prints a WRONG stress
 * rather than none. Between losing a mark and printing a wrong one, N.108-5
 * lost the mark. This gives the position a way to move, so neither happens.
 */

/** A word's place in the poem: `"lineIndex-wordIndex"`, the tree's own key. */
export type WordKey = string;

/** Build the key the override maps and `SlotOrigin` both use. */
export function wordKey(lineIndex: number, wordIndex: number): WordKey {
	return `${lineIndex}-${wordIndex}`;
}

/**
 * Where every word of the old poem went.
 *
 * `moved` holds ONLY matched words, old key to new key, and it includes the
 * ones that did not move (their key maps to itself). A key absent from `moved`
 * is in `removed`. `added` is the new keys nothing old maps onto.
 */
export interface TextDiff {
	moved: Map<WordKey, WordKey>;
	removed: Set<WordKey>;
	added: Set<WordKey>;
	/** True when the grids are equal, so every caller can take a fast path. */
	unchanged: boolean;
}

/** The identity diff, for a text that did not change and for a first run. */
export function emptyDiff(): TextDiff {
	return { moved: new Map(), removed: new Set(), added: new Set(), unchanged: true };
}

/**
 * The largest middle this will align exactly, per side, in words.
 *
 * **DESK DEFAULT, 2026-09-07: 600.** The alignment below is a
 * longest-common-subsequence, which is O(n × m) in both time and table space,
 * and this runs on the 600 ms typing pause. 600 × 600 is 360,000 cells, about
 * 1.4 MB of `Int32Array`, which is a few milliseconds.
 *
 * IT ALMOST NEVER BITES, because the common prefix and suffix are trimmed
 * first. A one-word edit anywhere in a poem of any length leaves a middle of
 * one word against one word. The cap is reached only by an edit that changes
 * more than 600 consecutive words at once, which is a paste of a different
 * poem, and there the answer below is the right one anyway.
 *
 * ABOVE THE CAP the middle is reported as wholly removed and wholly added,
 * which is EXACTLY what shipped before N.112 for the whole poem. The degraded
 * case is never worse than the old behaviour, which is what makes the cap safe
 * to pick without asking.
 */
const ALIGN_CAP = 600;

/** One flat word with the coordinate it came from. */
interface FlatWord {
	word: string;
	key: WordKey;
}

/**
 * Flatten the grid to one sequence, keeping each word's coordinate.
 *
 * THE DIFF IS FLAT, NOT PER LINE, and that is a decision with a reason. A poem
 * edited by moving a line break changes no word at all, and a per-line diff
 * would report every word of both lines as removed and re-added. Flat, a split
 * or a joined line is invisible to the alignment, which is what the brief means
 * by "across lines when a line was split or joined". One rule covers both
 * cases instead of a per-line rule plus a repair.
 */
function flatten(grid: readonly (readonly string[])[]): FlatWord[] {
	const out: FlatWord[] = [];
	for (let li = 0; li < grid.length; li++) {
		for (let wi = 0; wi < grid[li].length; wi++) {
			out.push({ word: grid[li][wi], key: wordKey(li, wi) });
		}
	}
	return out;
}

/**
 * The matched pairs of a longest-common-subsequence, as index pairs.
 *
 * Classic dynamic programming with a full table, because the backtrack needs
 * it. `Int32Array` rather than nested arrays: the table is the only allocation
 * that scales, and one flat typed array is the cheap way to hold it.
 */
function lcsPairs(a: readonly string[], b: readonly string[]): [number, number][] {
	const n = a.length;
	const m = b.length;
	if (n === 0 || m === 0) return [];
	const w = m + 1;
	const table = new Int32Array((n + 1) * w);
	for (let i = n - 1; i >= 0; i--) {
		for (let j = m - 1; j >= 0; j--) {
			table[i * w + j] =
				a[i] === b[j]
					? table[(i + 1) * w + (j + 1)] + 1
					: Math.max(table[(i + 1) * w + j], table[i * w + (j + 1)]);
		}
	}
	const pairs: [number, number][] = [];
	let i = 0;
	let j = 0;
	while (i < n && j < m) {
		if (a[i] === b[j]) {
			pairs.push([i, j]);
			i++;
			j++;
		} else if (table[(i + 1) * w + j] >= table[i * w + (j + 1)]) {
			i++;
		} else {
			j++;
		}
	}
	return pairs;
}

/**
 * Align the old poem's words against the new poem's words.
 *
 * A WORD IS "THE SAME" WHEN ITS CLEANED FORM IS EQUAL, and nothing else. That
 * is `SlotOrigin.word`'s own discriminator, ruled by Dann 2026-08-13 as the
 * thing that tells a re-division from a re-transcription, and this reuses it
 * rather than inventing a second notion of sameness. It is also what makes the
 * round trip in the brief's walk a no-op: `тихая` to `тихая,` and back never
 * reaches here as a change at all, because the pipeline's tokenizer strips the
 * comma before `wordGrid` reports the word.
 *
 * THE PREFIX AND SUFFIX ARE TRIMMED FIRST. It is the standard diff opening and
 * it is what keeps this cheap enough to run on every typing pause, but it is
 * also what makes the result STABLE in the way the brief pins: an edit at one
 * end cannot re-align the other end, because the other end never enters the
 * alignment.
 *
 * NOTHING IS MUTATED and the same inputs always give the same output, which is
 * the round-trip property stated directly.
 */
export function diffWordGrid(
	before: readonly (readonly string[])[],
	after: readonly (readonly string[])[],
): TextDiff {
	const a = flatten(before);
	const b = flatten(after);

	/* THE FAST PATH IS ALSO THE COMMON PATH. Every run where the singer has
	   not changed a word reaches it: a second press of the button, a paste of
	   the same poem, and a punctuation-only edit. */
	let same = a.length === b.length;
	if (same) {
		for (let i = 0; i < a.length; i++) {
			if (a[i].word !== b[i].word || a[i].key !== b[i].key) {
				same = false;
				break;
			}
		}
	}
	if (same) return emptyDiff();

	let lo = 0;
	while (lo < a.length && lo < b.length && a[lo].word === b[lo].word) lo++;
	let hiA = a.length - 1;
	let hiB = b.length - 1;
	while (hiA >= lo && hiB >= lo && a[hiA].word === b[hiB].word) {
		hiA--;
		hiB--;
	}

	const moved = new Map<WordKey, WordKey>();
	const removed = new Set<WordKey>();
	const added = new Set<WordKey>();

	for (let i = 0; i < lo; i++) moved.set(a[i].key, b[i].key);
	for (let k = 1; k <= a.length - 1 - hiA; k++) {
		moved.set(a[a.length - k].key, b[b.length - k].key);
	}

	const midA = a.slice(lo, hiA + 1);
	const midB = b.slice(lo, hiB + 1);

	if (midA.length <= ALIGN_CAP && midB.length <= ALIGN_CAP) {
		const pairs = lcsPairs(
			midA.map((x) => x.word),
			midB.map((x) => x.word),
		);
		const matchedA = new Set<number>();
		const matchedB = new Set<number>();
		for (const [i, j] of pairs) {
			moved.set(midA[i].key, midB[j].key);
			matchedA.add(i);
			matchedB.add(j);
		}
		for (let i = 0; i < midA.length; i++) if (!matchedA.has(i)) removed.add(midA[i].key);
		for (let j = 0; j < midB.length; j++) if (!matchedB.has(j)) added.add(midB[j].key);
	} else {
		for (const x of midA) removed.add(x.key);
		for (const x of midB) added.add(x.key);
	}

	return { moved, removed, added, unchanged: false };
}

/**
 * Carry a map keyed `"lineIndex-wordIndex"` across the diff.
 *
 * An override on a MATCHED word keeps its value at the word's new key, so a
 * stress set in line 3 survives an edit in line 1. An override on a REMOVED
 * word is dropped, which is right: the word it described is gone, and there is
 * nothing for it to describe.
 *
 * A KEY THE DIFF NEVER HEARD OF IS DROPPED, not kept. That case is a map that
 * has fallen out of step with the text it keys on, and keeping such a key is
 * exactly the stale override N.108-5 chose to lose a mark to avoid. The rule
 * that beat it is "the text is authoritative", not "keep what you can".
 */
export function rekeyByWord<T>(map: ReadonlyMap<WordKey, T>, diff: TextDiff): Map<WordKey, T> {
	if (diff.unchanged) return new Map(map);
	const next = new Map<WordKey, T>();
	for (const [key, value] of map) {
		const to = diff.moved.get(key);
		if (to !== undefined) next.set(to, value);
	}
	return next;
}

/**
 * Carry a map keyed `"lineIndex-wordIndex-charIndex"` across the diff.
 *
 * The ё toggles are the only map shaped this way (`+page.svelte`,
 * `handleYoToggle`). The character ordinal is a fact about the WORD, and a
 * matched word is the same letters in the same order, so the ordinal rides
 * across unchanged and only its word half is re-keyed.
 *
 * THE SPLIT IS FROM THE RIGHT, on the last hyphen, because a line or word
 * index is a number and a key is three of them joined by the same character
 * the tree already uses. Splitting from the left would work today and break
 * the first time anything else is appended.
 */
export function rekeyByWordChar<T>(
	map: ReadonlyMap<string, T>,
	diff: TextDiff,
): Map<string, T> {
	if (diff.unchanged) return new Map(map);
	const next = new Map<string, T>();
	for (const [key, value] of map) {
		const cut = key.lastIndexOf('-');
		if (cut <= 0) continue;
		const word = key.slice(0, cut);
		const rest = key.slice(cut + 1);
		const to = diff.moved.get(word);
		if (to !== undefined) next.set(`${to}-${rest}`, value);
	}
	return next;
}
