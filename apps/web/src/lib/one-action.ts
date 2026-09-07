/**
 * N.108-5. WHENEVER TEXT IS PRESENT, THE TRANSCRIPTION EXISTS.
 *
 * RULED BY DANN 2026-09-07, widening his own ruling of 2026-09-04. The first
 * one made Transcribe and Continue to analysis one action: *"I think one
 * should invoke the other."* The second widens the join from "a score is
 * present" to **"text is present"**: at boot, if the field holds text, Ilya
 * transcribes once the dictionary is ready, score or no score; a paste
 * transcribes at once; typing transcribes after a short pause, never per
 * keystroke.
 *
 * WHAT IT CLOSES. N.67 step 4b's boot asymmetry, whole. `lines` is session
 * state that is never stored, and nothing at boot ever ran the pipeline, so a
 * reload of a song with a poem in it drew a blank Transcription page and said
 * *"Enter your Cyrillic text in the drawer on the left"* while the drawer
 * plainly held the text. Dann walked into exactly that on 2026-09-07.
 *
 * THE BUTTON STAYS, and that is his ruling too. It keeps its explicit act;
 * this is not a replacement for it.
 *
 * THIS MODULE IS THE HALF THAT CAN BE TESTED. The timer, the effects and the
 * uploader reach live in `+page.svelte`, where no vitest in this repository
 * can reach them. What is here is the decision, lifted out on purpose: a rule
 * in a `.svelte` file is a rule nothing can pin.
 *
 * PAIRINGS ARE UNTOUCHED BY EVERY PATH THROUGH HERE. Re-seating a score when
 * the text changes under it is **N.112**, the next item in the text-to-score
 * sequence Dann ruled on 2026-09-06, and doing it here would be building N.112
 * early under another name.
 */

/**
 * How long the field must be quiet before typing is transcribed.
 *
 * **DESK DEFAULT, 2026-09-07: 600 ms.** Dann asked for "a short pause" and
 * named 600 as the desk's to choose. It is above the ~300 ms that a fast
 * typist leaves between words, so a line is not re-transcribed mid-phrase,
 * and well under the ~1 s at which a pause starts to read as the app having
 * missed the keystroke. Reversible: it is one number, read by one caller.
 */
export const QUIET_MS = 600;

/** How the text got into the field. */
export type TextArrival =
	/** A restore, at boot. */
	| 'boot'
	/** A paste, a drop read as a poem, an OCR result, or an arriving score. */
	| 'paste'
	/** A keystroke. */
	| 'typing';

/** What the page knows about the field and the pipeline. */
export interface TranscribeState {
	/** The intake field's contents, exactly as the singer left them. */
	poem: string;
	/**
	 * The text the current `lines` were built from, or `null` when there are
	 * none.
	 *
	 * IT IS THE TEXT AND NOT A BOOLEAN, and that is the whole difference
	 * between this and the 2026-09-04 version. "Has the pipeline run?" was
	 * enough when the only trigger was a score arriving once. Under Dann's
	 * widening the question is "has it run **over this text**", because a
	 * singer types, and a stale transcription of the previous keystroke is
	 * exactly the blank-page defect wearing different clothes.
	 */
	transcribedText: string | null;
	/**
	 * Whether the dictionary is loaded, so a transcription can run at all.
	 *
	 * THIS IS WHY THERE IS A `wait` AND NOT JUST A `no`. At boot the poem is
	 * restored before `loadDictionary` has finished, so the honest answer at
	 * that instant is "not yet", not "never".
	 */
	dictionaryReady: boolean;
}

/**
 * `now` runs the pipeline this tick; `soon` starts the quiet timer; `wait`
 * holds for the dictionary; `nothing` leaves the field alone.
 */
export type TranscribeVerdict = 'now' | 'soon' | 'wait' | 'nothing';

/**
 * Whether the text in the field should be transcribed, and how soon.
 *
 * THE ORDER OF THE GUARDS IS THE RULE. An empty field is asked about first,
 * so clearing a poem never schedules anything. An up-to-date transcription is
 * asked about second, so nothing re-runs the pipeline over text it has already
 * read: that is what makes a boot with a restored transcription, a repeated
 * `oninput` carrying an unchanged value, and a second press of the button all
 * free.
 *
 * WHITESPACE-ONLY IS AN EMPTY FIELD, matching `canTranscribe`, which trims
 * before it measures. A poem of spaces has nothing to transcribe and must not
 * hold a timer open.
 */
export function transcribeVerdict(
	state: TranscribeState,
	how: TextArrival,
): TranscribeVerdict {
	if (state.poem.trim().length === 0) return 'nothing';
	if (state.transcribedText === state.poem) return 'nothing';
	if (!state.dictionaryReady) return 'wait';
	return how === 'typing' ? 'soon' : 'now';
}
