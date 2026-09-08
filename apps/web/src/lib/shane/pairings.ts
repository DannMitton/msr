/**
 * pairings.ts
 *
 * N.55b: the pairing layer. A sparse correction map from score EVENT ID to
 * what the singer decided that note carries.
 *
 * WHY A CORRECTION LAYER AND NOT A FIELD ON ParsedScore. `types.ts:470-479`
 * in score-parser says melismas are encoded by the ABSENCE of a syllable,
 * so the parsed score has two states and N.55b needs three. The third has
 * nowhere to live there. (Same wall LilyPond hit: its documentation forbids
 * `_` for skipping because an underscore already means melisma.)
 *
 * WHY BY VALUE AND NOT BY REFERENCE (R6, Dann, E.47). A pairing is a record
 * of a decision, not a derivation of the engine's. There is no stable
 * syllable id in this tree and inventing one would not survive the two
 * events it would exist to survive: a re-division is not a rename, and
 * `+page.svelte:275`, `:321`, `:376` rebuild the word objects from scratch
 * on every re-transcription. So a pairing COPIES the text at the moment of
 * the click, exactly as Finale's Click Assignment transfers a syllable onto
 * a note rather than pointing at the Lyrics window.
 *
 * WHY THE VOWEL IS STORED (R8, Dann, E.47). `vowelOfSyllable` reads the
 * engine's transcription log, not the syllable's IPA string, so a pairing
 * carrying only text would print a syllable and carry no acoustic marks.
 * The glyph is an INPUT to the forecast, never its output: nothing measured
 * is stored here and recalibration still recomputes everything downstream.
 * This is a deliberate, named exception to "do not store anything derived".
 *
 * WHAT THIS FILE MAY NOT DO. It never writes to `ParsedScore`, it never
 * touches `VocalLineEvent`, and it never proposes the `empty` state: for
 * Ilya to mark a note deliberately empty is a claim, and Ilya may only ever
 * leave a note undecided (Dann, E.46).
 */

import type { LineData, WordStackData } from '$lib/types';
import { CYRILLIC_VOWEL, vowelOfSyllable } from '$lib/shane/vowel-resolver';

/**
 * The engine's stress mark, declared at `engine.ts:230` as `'stress'`.
 * Written as an escape rather than the literal so this file stays ASCII.
 * U+02C8 MODIFIER LETTER VERTICAL LINE.
 */
const STRESS_MARK = '\u02C8';

/**
 * U+00A0 NO-BREAK SPACE, between a clitic and its host on the CYRILLIC line.
 *
 * The IPA line fuses a vowelless clitic to its host with NO space, because
 * that is the phonetics and because it is what the tree already does
 * (`pipeline.ts:967` for an enclitic, `:923-936` for a proclitic tucking in
 * behind the stress mark). THE CYRILLIC IS DIFFERENT: «v lesu» is two words
 * and keeps its space in the orthography. It is a hard space rather than an
 * ordinary one because the two sit inside a single underlay cell under a
 * single note, and nothing may break them apart there.
 *
 * Dann, E.47, catching that this code dropped the clitic's Cyrillic
 * altogether rather than spacing it.
 */
const NBSP = '\u00A0';

/** The localStorage key. Interim until N.67; migrated wholesale then (R5). */
export const PAIRINGS_KEY = 'ilya:pairings';

/**
 * Where a slot came from in the transcription. A BREADCRUMB, never a key:
 * the map is keyed by event id.
 *
 * IT HAS TWO READERS SINCE N.112, and the second one is why the item works.
 * `refreshPairings` compares the stored text against the slot at the same
 * position and brings a re-divided word's text forward. `reseat.ts` reads
 * `lineIndex` and `wordIndex` as the seat's WORD IDENTITY, runs it through
 * `text-diff.ts`'s map, and re-originates the seat onto wherever that word has
 * moved to. Before N.112 the mismatch could only be reported, as drift.
 */
export interface SlotOrigin {
	lineIndex: number;
	wordIndex: number;
	/** The nucleus ordinal WITHIN its word, not within the line. */
	slotIndex: number;
	/**
	 * The word's cleaned Cyrillic, verbatim. THE DISCRIMINATOR between a
	 * re-division and a re-transcription (Dann, 2026-08-13).
	 *
	 * Both reslicers reslice the SAME concatenated letters: `openSyllabify`
	 * maps over its input and cannot change length, and
	 * `applySyllableOverride` takes its count from the override, whose
	 * boundary list `InspectorPanel.svelte:781-818` only ever MOVES, never
	 * pushes or splices. So a re-division leaves this string identical and
	 * only changes where it splits. A re-transcription changes it.
	 *
	 * The syllable text itself cannot serve: a slot growing a consonant is
	 * indistinguishable from a real edit. Nor can the vowel: two different
	 * words can carry the same vowel sequence.
	 */
	word: string;
}

/**
 * One consumable unit of the queue: a Cyrillic-vowel nucleus with its
 * vowelless clitics already fused in.
 *
 * N.9 is why this is not a syllable. A word with no vowel can never own a
 * slot on the score side (`vowel-resolver.ts:478-496`), yet the engine still
 * returns one syllable for it (`engine.ts:1119` falls back to `[word]`), so
 * walking `WordStackData.syllables` would hand a bare consonant to a note.
 */
export interface Slot {
	/** The syllable's Cyrillic, verbatim from the engine. */
	cyrillic: string;
	/** The full syllable IPA, stress mark included, clitics fused. */
	ipa: string;
	/** The single sung vowel, or undefined where the engine resolved none. */
	vowel: string | undefined;
	origin: SlotOrigin;
}

/** What one note carries. Keyed by event id in a `PairingMap`. */
export type Pairing =
	| {
			kind: 'syllable';
			cyrillic: string;
			ipa: string;
			vowel: string | undefined;
			origin: SlotOrigin;
	  }
	| { kind: 'melisma' }
	| { kind: 'empty' };

/** Event id to pairing. Sparse: an absent id is UNDECIDED, and draws bare. */
export type PairingMap = Record<string, Pairing>;

/* ── The queue ──────────────────────────────────────────────────── */

/** The syllable's IPA with the engine's stress mark restored.
 *  Stress is a FLAG on `SyllableData` (`engine.ts:52-56`), not a character
 *  in `.ipa`, and reading `.ipa` alone once printed Ilya's transcription
 *  with the stress removed (`vowel-resolver.ts:295-299`). */
/**
 * The syllable's Cyrillic WITH THE SINGER'S CASE.
 *
 * `engine.ts:1026` lowercases before syllabifying, so `SyllableData.cyrillic`
 * has lost the capital the singer typed. That never mattered while these
 * strings stayed inside Transcribe's own display, and it started mattering
 * the moment N.55b put them on the page: the score-underlay path prints the
 * capital and this path printed lowercase, on the same sheet. Observed on
 * `08a0dae`, 13 August, with a lyric-bearing negative control beside it.
 *
 * `cleanWord` keeps the case and the syllabifier only lowercases and slices,
 * so the offsets line up. Where they do not, the engine's own string stands
 * rather than a wrong slice.
 */
function cyrOfSyllable(w: WordStackData, k: number): string {
	const own = w.syllables[k]?.cyrillic ?? '';
	let at = 0;
	for (let i = 0; i < k; i++) at += w.syllables[i]?.cyrillic.length ?? 0;
	const slice = w.cleanWord.slice(at, at + own.length);
	return slice.length === own.length && slice.toLowerCase() === own.toLowerCase()
		? slice
		: own;
}

function syllableIpa(w: WordStackData, k: number): string {
	const syl = w.syllables[k];
	if (!syl) return '';
	return syl.isStressed && !syl.ipa.includes(STRESS_MARK)
		? STRESS_MARK + syl.ipa
		: syl.ipa;
}

/**
 * Build the consumable slot queue from Transcribe's own output.
 *
 * The clitic rule is N.9's and it is not re-derived here: a word carrying no
 * Cyrillic vowel owns no slot, and its IPA rides on the slot at either end,
 * a proclitic tucked in BEHIND the stress mark and an enclitic appended.
 * That rule is already implemented at three sites and this mirrors them:
 * `pipeline.ts:919-943` and `:960-976`, `syllable-utils.ts:289-332`, and
 * `vowel-resolver.ts:497-512` with `:544-554`.
 *
 * Direction follows the pipeline's own classification where it has one, and
 * falls back to `vowel-resolver.ts:503-506`'s rule otherwise: before any
 * nucleus it is proclitic, after one it is enclitic.
 */
export function buildSlotQueue(lines: readonly LineData[]): Slot[] {
	const queue: Slot[] = [];
	for (const line of lines) {
		// Proclitic IPA waiting for the next nucleus in THIS line. A clitic
		// never reaches across a line break.
		let pendingIpa = '';
		let pendingCyr = '';
		let lastInLine: Slot | null = null;
		for (let wordIndex = 0; wordIndex < line.words.length; wordIndex++) {
			const w = line.words[wordIndex];
			if (!CYRILLIC_VOWEL.test(w.cleanWord)) {
				const cliticIpa = w.ipaContent || '';
				const cliticCyr = w.cleanWord;
				if (!cliticIpa && !cliticCyr) continue;
				const enclitic = w.isEnclitic || (!w.isProclitic && lastInLine !== null);
				if (enclitic && lastInLine) {
					lastInLine.ipa = lastInLine.ipa + cliticIpa;
					lastInLine.cyrillic = lastInLine.cyrillic + NBSP + cliticCyr;
				} else {
					pendingIpa += cliticIpa;
					pendingCyr = pendingCyr ? pendingCyr + NBSP + cliticCyr : cliticCyr;
				}
				continue;
			}
			for (let k = 0; k < w.syllables.length; k++) {
				let ipa = syllableIpa(w, k);
				if (k === 0 && pendingIpa) {
					// The stress mark stays leftmost and the clitic tucks in behind
					// it, following `vowel-resolver.ts:547-551`.
					ipa = ipa.startsWith(STRESS_MARK)
						? STRESS_MARK + pendingIpa + ipa.slice(STRESS_MARK.length)
						: pendingIpa + ipa;
				}
				const cyr = cyrOfSyllable(w, k);
				const slot: Slot = {
					cyrillic: k === 0 && pendingCyr ? pendingCyr + NBSP + cyr : cyr,
					ipa,
					vowel: vowelOfSyllable(w, k),
					origin: { lineIndex: w.lineIndex, wordIndex, slotIndex: k, word: w.cleanWord },
				};
				queue.push(slot);
				lastInLine = slot;
			}
			pendingIpa = '';
			pendingCyr = '';
		}
	}
	return queue;
}

/* ── The first pass (R3) ────────────────────────────────────────── */

/**
 * One slot per note, in document order, until one side runs out.
 *
 * IT NEVER CREATES A MELISMA (Dann, E.46). The ordinary outcome on a
 * melismatic setting is trailing notes with an empty queue.
 *
 * NOTHING IS CONSUMED AND NOTHING IS DISCARDED. The queue is rebuilt from
 * the transcription on every accept, so slots this pass did not reach are
 * still there to be assigned by hand, which is Finale's behaviour too: the
 * Lyrics window keeps what you have not clicked yet.
 *
 * NO PROVENANCE IS RECORDED, and that is Dann's ruling of E.47, against my
 * design. A mark on every syllable carries no information, and unlike
 * inferred stress or a withheld syllable, a misplaced syllable is something
 * the singer can simply SEE. The drawer says in one sentence that these are
 * proposals; the page says it with the syllables themselves.
 *
 * @param eventIds sung note events in document order, rests already excluded
 */
export function firstPass(eventIds: readonly string[], queue: readonly Slot[]): PairingMap {
	const map: PairingMap = {};
	const n = Math.min(eventIds.length, queue.length);
	for (let i = 0; i < n; i++) {
		const slot = queue[i];
		map[eventIds[i]] = {
			kind: 'syllable',
			cyrillic: slot.cyrillic,
			ipa: slot.ipa,
			vowel: slot.vowel,
			origin: slot.origin,
		};
	}
	return map;
}

/* ── The merge rule (N.67 step 3, design §2.6) ──────────────────── */

/**
 * What an upload does to the placements already on the page.
 *
 * ONE SENTENCE: an upload never destroys placements; only the singer does, on
 * purpose. Before this existed, `+page.svelte` replaced the map unconditionally
 * on every accepted score, so re-uploading the same file rebuilt over the
 * singer's own decisions, and a score WITH lyrics erased them outright. That
 * was N.68.
 *
 * The keys are the parsers' positional event ids (`musicxml-parser.ts:701`,
 * identically `mnx-parser.ts:899`), so every note that stayed where it was
 * keeps its pairing by construction. Nothing is matched by text, and nothing
 * is guessed.
 *
 * `firstPass` runs ONLY into an empty map, and only where the score carried no
 * underlay of its own. That preserves N.55a's behaviour on the genuinely fresh
 * path (Ilya proposes where the score is silent, and never over a score that
 * already speaks) while ending the unconditional rebuild.
 */
export interface MergeResult {
	map: PairingMap;
	/** True when `firstPass` filled an empty map, as it does on a fresh score. */
	proposed: boolean;
	/**
	 * Pairings whose note is not in the new score. KEPT, NOT DROPPED, and
	 * reported as a count: a singer who re-exports a shortened score has not
	 * asked Ilya to throw their work away, and a deletion nobody asked for is
	 * exactly what this item exists to end.
	 */
	orphaned: string[];
}

export function mergeOnUpload(
	existing: PairingMap,
	eventIds: readonly string[],
	queue: readonly Slot[],
	scoreCarriesNoLyrics: boolean,
): MergeResult {
	const present = new Set(eventIds);
	const orphaned = Object.keys(existing).filter((id) => !present.has(id));
	if (Object.keys(existing).length === 0) {
		return scoreCarriesNoLyrics
			? { map: firstPass(eventIds, queue), proposed: true, orphaned: [] }
			: { map: {}, proposed: false, orphaned: [] };
	}
	return { map: existing, proposed: false, orphaned };
}

/* ── The refresh ────────────────────────────────────────────────── */

/**
 * Bring every stored pairing's TEXT forward from the queue at its origin.
 *
 * **N.112 REDUCED THIS TO A REFRESH, and retired the drift half of it.** It was
 * `reconcilePairings`, and it returned a `drift` list of every pairing whose
 * stored text the current transcription no longer produced, which the Underlay
 * station printed as "Text changed 59". `PairingDrift`, `Reconciliation` and
 * `auditPairings` went with that list.
 *
 * **WHY DRIFT EXISTED, AND WHY IT DOES NOT NOW.** Drift was the honest answer
 * to a question this module could not answer: whether a word at a position had
 * MOVED or been REPLACED. With only the queue to look at, a changed poem could
 * not be told from a different one, so nothing was allowed to act and the
 * count was reported instead. `text-diff.ts` answers that question, and
 * `reseat.ts` acts on it at transcribe time, so by the time this runs every
 * seat already points at a word that exists. Ruled by Dann 2026-09-06 in
 * numbering N.112: *"drift retires."*
 *
 * **WHAT IS LEFT FOR IT TO DO, which is why it is not deleted outright.** The
 * queue can change without the text changing, and `handleReset`
 * (`+page.svelte`) is the case: a per-word reset drops that word's stress or ё
 * marks and re-runs the pipeline alone, never `transcribeText`, so no diff is
 * computed and no re-seat runs. The word's syllable division can move under
 * that, and its seats have to read the new text.
 *
 * TWO EVENTS THAT ARE NOT THE SAME EVENT (Dann, 2026-08-13).
 *
 * A RE-DIVISION moves consonants between slots of the same word. The nuclei
 * are the syllables, so they never move, the slot count cannot change, and the
 * singer's decision about WHICH NOTE holds WHICH NUCLEUS still stands. So the
 * text is refreshed in place. A different word at the same position is a
 * different decision and is left alone; `origin.word` is the discriminator,
 * and its own doc comment says why the syllable text and the vowel both fail
 * as tests.
 *
 * NOTHING IS MUTATED. A new map is returned.
 *
 * A pairing stored before `origin.word` existed carries `undefined`, which
 * matches no word and is therefore left exactly as it was stored. That is the
 * pre-existing behaviour and it is deliberate.
 */
export function refreshPairings(map: PairingMap, queue: readonly Slot[]): PairingMap {
	const byOrigin = new Map<string, Slot>();
	for (const s of queue) {
		byOrigin.set(`${s.origin.lineIndex}-${s.origin.wordIndex}-${s.origin.slotIndex}`, s);
	}
	const next: PairingMap = {};
	for (const [eventId, p] of Object.entries(map)) {
		if (p.kind !== 'syllable') {
			next[eventId] = p;
			continue;
		}
		const key = `${p.origin.lineIndex}-${p.origin.wordIndex}-${p.origin.slotIndex}`;
		const current = byOrigin.get(key);
		const sameWord =
			current !== undefined &&
			p.origin.word !== undefined &&
			current.origin.word === p.origin.word;
		if (sameWord && current.cyrillic !== p.cyrillic) {
			next[eventId] = {
				kind: 'syllable',
				cyrillic: current.cyrillic,
				ipa: current.ipa,
				vowel: current.vowel,
				origin: current.origin,
			};
			continue;
		}
		next[eventId] = p;
	}
	return next;
}

/* ── Storage (R5) ───────────────────────────────────────────────── */

export type SaveOutcome = { ok: true } | { ok: false; reason: string };

function storage(): Storage | null {
	try {
		return typeof localStorage === 'undefined' ? null : localStorage;
	} catch {
		return null;
	}
}

/**
 * Write the map.
 *
 * THIS SAVE DOES NOT SWALLOW ITS EXCEPTION. N.27 is open precisely because
 * `profileStore.ts:220-224` loses a calibration in silence, and a second
 * silent save site would be the same defect written twice. The caller gets
 * the failure and is responsible for showing it.
 */
export function savePairings(map: PairingMap): SaveOutcome {
	const s = storage();
	if (!s) return { ok: false, reason: 'no-storage' };
	try {
		s.setItem(PAIRINGS_KEY, JSON.stringify(map));
		return { ok: true };
	} catch (err) {
		const reason =
			err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)
				? 'quota-exceeded'
				: 'write-failed';
		return { ok: false, reason };
	}
}

/** Read the map. An unreadable or malformed value yields an empty map, and
 *  that case is reported rather than assumed: `loadPairings` returns the
 *  reason alongside so the drawer can say the pairings did not come back. */
export function loadPairings(): { map: PairingMap; reason?: string } {
	const s = storage();
	if (!s) return { map: {}, reason: 'no-storage' };
	const raw = s.getItem(PAIRINGS_KEY);
	if (raw === null) return { map: {} };
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return { map: {}, reason: 'malformed' };
		}
		return { map: parsed as PairingMap };
	} catch {
		return { map: {}, reason: 'unparseable' };
	}
}

/* -- The override layer (R7) ------------------------------------- */

/**
 * Wrap a vowel resolver so a hand pairing outranks it, INCLUDING the
 * resolver's whole-word withhold (`vowel-resolver.ts:523-529`). A withhold
 * is Ilya declining to guess; a pairing is the singer not guessing.
 *
 * A `syllable` pairing wins even when its own `vowel` is undefined, because
 * "the singer paired this and no vowel resolved" is a different fact from
 * "no pairing exists here", and falling through would print an acoustic
 * mark the singer never asked for.
 *
 * GENERIC over the event type rather than importing `VocalLineEvent`, so
 * this module stays free of a score-parser dependency.
 *
 * It must be generic and NOT a plain `{ id: string }` parameter, and the
 * reason is the trap I fell into: parameter positions are contravariant, so
 * a `VowelResolver` is assignable to `(ev: { id: string }) => ...` only if
 * `{ id: string }` satisfies `VocalLineEvent`, which it does not. Having an
 * `id` makes the assignment work in the RETURN position and fail in the
 * ARGUMENT position. Inferring `E` from the caller sidesteps both.
 */
export function withPairedVowel<E extends { id: string }>(
	base: (ev: E) => string | undefined,
	map: PairingMap | undefined,
): (ev: E) => string | undefined {
	if (!map) return base;
	return (ev) => {
		const p = map[ev.id];
		if (p?.kind === 'syllable') return p.vowel;
		return base(ev);
	};
}

/**
 * The Cyrillic a pairing puts under each note. Undefined when there is
 * none, so the renderer takes its existing no-op path and an unpaired score
 * renders byte-for-byte as it did before N.55b.
 *
 * `blank` IS THE THIRD ANSWER, and N.111 increment 3 is why it exists. The
 * renderer reads `cyrPreview?.[id] ?? ev.syllable?.text ?? ''`
 * (`staff-renderer.ts:709`, `:2462`), so on a lyric-bearing score an event
 * ABSENT from this record is not blank: it draws the file's own cell. An event
 * mapped to the EMPTY STRING is blank, because `??` keeps an empty string and
 * the renderer's own `if (cyr || ipa)` then draws nothing.
 *
 * Only a note inside a seated run belongs here, and only while it carries no
 * pairing of its own: the seat moved the text off it, so the file's cell there
 * is stale rather than silent. Dann walked the stale reading on `7875892` as
 * the `ка ка` close and ruled it 2026-09-04. Nothing is written into the map
 * for those notes, because Ilya may claim neither an `empty` note nor a
 * melisma (E.46); the blankness is a fact about the run, not a decision about
 * the note.
 */
export function pairedCyrillic(
	map: PairingMap | undefined,
	blank?: ReadonlySet<string>,
): Record<string, string> | undefined {
	if (!map) return undefined;
	const out: Record<string, string> = {};
	for (const [id, p] of Object.entries(map)) {
		if (p.kind === 'syllable' && p.cyrillic) out[id] = p.cyrillic;
	}
	applyBlank(out, blank);
	return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Mark every blanked event with the EMPTY STRING, in place, without disturbing
 * an event that already has something to say.
 *
 * ONE RULE FOR BOTH UNDERLAY CHANNELS, and the walk finding on `c574cf8` is
 * why it is a function rather than two lines in two files. The Cyrillic channel
 * blanked correctly and the IPA channel merely OMITTED the event, which is not
 * the same thing: `staff-renderer.ts:2463` reads
 * `options.ipaPreview?.[ev.id] ?? a?.vowel`, so an omission falls through to
 * the analysis's single sustained vowel and the note drew a stray `ɑ` over a
 * bare Cyrillic cell. Both channels now go through here, so they cannot drift
 * apart again.
 *
 * An EMPTY STRING rather than an absent key, because `??` falls through
 * `undefined` and keeps `''`. That is the whole mechanism, on both lines.
 */
export function applyBlank(
	out: Record<string, string>,
	blank: ReadonlySet<string> | undefined,
): void {
	if (!blank) return;
	for (const id of blank) if (out[id] === undefined) out[id] = '';
}

/* -- Shift Lyrics (N.55b design, section 8) ------------------------ */

/** What a shift displaced off the end of its range. Never silently dropped. */
export interface ShiftResult {
	map: PairingMap;
	displaced: Pairing[];
}

export type ShiftDirection = 'forward' | 'back';

/**
 * Clamp `fromIndex`/`toIndex` into a valid, ordered range over `eventIds`.
 *
 * Returns null for a range with nothing to act on: an empty `eventIds`, or
 * `toIndex < fromIndex` once both are clamped into bounds. Every exported
 * function below treats null as a no-op that still returns a fresh copy of
 * the map, matching `reconcilePairings`' habit of always handing back a new
 * object rather than the one it was given.
 *
 * `fromIndex > toIndex` is refused rather than swapped. Swapping would guess
 * which of the two the caller meant as the anchor, and nobody has ruled that
 * guess (brief section 3, "shape decisions made by this brief"). A no-op is
 * the sane default until Dann rules it.
 */
function clampRange(
	eventIds: readonly string[],
	fromIndex: number,
	toIndex: number,
): { from: number; to: number } | null {
	if (eventIds.length === 0) return null;
	const last = eventIds.length - 1;
	const from = Math.max(0, Math.min(Math.trunc(fromIndex), last));
	const to = Math.max(0, Math.min(Math.trunc(toIndex), last));
	if (to < from) return null;
	return { from, to };
}

/**
 * Shift the pairings across `eventIds[from..to]` by one position and report
 * whatever fell off the end that direction pushes toward.
 *
 * A DUPLICATE EVENT ID within the range is resolved by iteration order: the
 * write at the higher local index wins, because the map is keyed by event
 * id and cannot hold two values under one key. Nobody has ruled this either;
 * it is pinned by a test rather than left to chance.
 */
function shiftRange(
	map: PairingMap,
	eventIds: readonly string[],
	from: number,
	to: number,
	direction: ShiftDirection,
): ShiftResult {
	const next: PairingMap = { ...map };
	const len = to - from + 1;
	const vals: (Pairing | undefined)[] = [];
	for (let j = 0; j < len; j++) vals.push(map[eventIds[from + j]]);

	const newVals: (Pairing | undefined)[] = new Array(len).fill(undefined);
	let displacedVal: Pairing | undefined;
	if (direction === 'forward') {
		for (let j = 1; j < len; j++) newVals[j] = vals[j - 1];
		displacedVal = vals[len - 1];
	} else {
		for (let j = 0; j < len - 1; j++) newVals[j] = vals[j + 1];
		displacedVal = vals[0];
	}

	for (let j = 0; j < len; j++) {
		const id = eventIds[from + j];
		const v = newVals[j];
		if (v === undefined) delete next[id];
		else next[id] = v;
	}

	return { map: next, displaced: displacedVal !== undefined ? [displacedVal] : [] };
}

/**
 * Shift every pairing from `fromIndex` to the last event in `eventIds`.
 *
 * The range always runs to the end of `eventIds`, gaps included: an
 * undecided event partway through does not stop this one, unlike
 * `shiftToNextOpenNote`. A pairing shifted onto a gap fills it, and the
 * value pushed past the last index comes back in `displaced`.
 */
export function shiftToEndOfLyric(
	map: PairingMap,
	eventIds: readonly string[],
	fromIndex: number,
	direction: ShiftDirection,
): ShiftResult {
	const range = clampRange(eventIds, fromIndex, eventIds.length - 1);
	if (!range) return { map: { ...map }, displaced: [] };
	return shiftRange(map, eventIds, range.from, range.to, direction);
}

/**
 * Shift from `fromIndex` INTO the nearest undecided event in the direction of
 * travel, which absorbs the shift so nothing is displaced.
 *
 * An undecided event is one with no entry in the map at all; `melisma` and
 * `empty` are decisions and do not stop the shift.
 *
 * THE OPEN NOTE IS INCLUDED IN THE RANGE, and that is the whole scope. The
 * design says of this scope that "section 3's state is what makes this scope
 * mean anything," and the work the undecided state does here is to CATCH the
 * shifted pairing. An earlier revision of this function stopped one short of
 * the gap, which pushed a pairing into `displaced` while an empty note sat
 * beside it. That threw away a decision the singer had made, which R6 exists
 * to prevent. Opus wrote that error into the brief, 2026-08-14.
 *
 * Direction decides which way we look, because the gap can only absorb a
 * shift that travels toward it:
 *
 * - `forward` searches UP from `fromIndex + 1`. With no gap above, the range
 *   runs to the last event and this behaves exactly like `shiftToEndOfLyric`.
 * - `back` searches DOWN from `fromIndex - 1`. With no gap below, the range
 *   runs to index 0 and the pairing there falls off the front.
 */
export function shiftToNextOpenNote(
	map: PairingMap,
	eventIds: readonly string[],
	fromIndex: number,
	direction: ShiftDirection,
): ShiftResult {
	const anchor = clampRange(eventIds, fromIndex, fromIndex);
	if (!anchor) return { map: { ...map }, displaced: [] };
	const at = anchor.from;
	if (direction === 'forward') {
		let end = eventIds.length - 1;
		for (let i = at + 1; i < eventIds.length; i++) {
			if (map[eventIds[i]] === undefined) {
				end = i;
				break;
			}
		}
		return shiftRange(map, eventIds, at, end, 'forward');
	}
	let start = 0;
	for (let i = at - 1; i >= 0; i--) {
		if (map[eventIds[i]] === undefined) {
			start = i;
			break;
		}
	}
	return shiftRange(map, eventIds, start, at, 'back');
}

/**
 * Cycle the pairings within `[fromIndex, toIndex]` inclusive. Nothing falls
 * off either end, so `displaced` is always empty: a value that would leave
 * the high end wraps to the low end, and vice versa, depending on
 * `direction`.
 */
export function rotateSyllables(
	map: PairingMap,
	eventIds: readonly string[],
	fromIndex: number,
	toIndex: number,
	direction: ShiftDirection,
): ShiftResult {
	const range = clampRange(eventIds, fromIndex, toIndex);
	if (!range) return { map: { ...map }, displaced: [] };
	const { from, to } = range;
	const next: PairingMap = { ...map };
	const len = to - from + 1;
	const vals: (Pairing | undefined)[] = [];
	for (let j = 0; j < len; j++) vals.push(map[eventIds[from + j]]);

	const newVals: (Pairing | undefined)[] = new Array(len);
	if (direction === 'forward') {
		for (let j = 0; j < len; j++) newVals[j] = vals[(j - 1 + len) % len];
	} else {
		for (let j = 0; j < len; j++) newVals[j] = vals[(j + 1) % len];
	}

	for (let j = 0; j < len; j++) {
		const id = eventIds[from + j];
		const v = newVals[j];
		if (v === undefined) delete next[id];
		else next[id] = v;
	}

	return { map: next, displaced: [] };
}
