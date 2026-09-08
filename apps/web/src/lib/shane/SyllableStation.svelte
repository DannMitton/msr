<!--
  SyllableStation.svelte

  N.55b R4: Finale's Lyrics window, in Ilya's drawer.

  Updated 2026-08-14 to the shape RULED by Dann, 2026-08-13 (STATE.md,
  "N.55b's station shape"): the lyric runs as ONE piece of readable text,
  hyphenated at slot boundaries, not a wrapped grid of chips. No IPA row —
  the station reorients you in the poem as source text; IPA reappears under
  the note once the correspondence exists. One moving highlight marks the
  cursor. The whole verse is present; this component sets no height and no
  overflow of its own, so the drawer's own scroll (`Drawer.svelte`'s
  `.drawer-content`) carries it and there is never a second, nested scroll.
  The 44 px touch floor sits on the cursor alone, not on every syllable;
  direct tapping of any syllable stays available regardless of its size.

  Finale puts the text in one window and the notes in another: you place the
  cursor at a syllable, then click notes in the score. Neither gesture is
  overloaded and there is no mode. Transcribe is the Lyrics window, but it is
  a separate tab, so the CURSOR needs a home on the score surface. It lives
  here, because drawer manipulates and page displays and prints (E.27's
  binding paradigm, which Fable lists among the rulings that may not be
  re-decided). A strip beside the stave would put a control on the paper.

  READ-ONLY, and that is not a shortcut: Transcribe owns every text
  operation. This shows the syllables and where you are in them. It never
  edits one.

  NOTHING IS CONSUMED. Placing a syllable does not remove it from the queue,
  exactly as Finale's Lyrics window keeps its text. The queue is derived from
  the transcription on every render, so a syllable you have not placed is
  still here, and one you place twice is still here.

  N.65 SHIP B: THIS STATION HAS NO HEADER. RULED BY DANN 2026-08-21 walking
  `2238e8b`: "I'm bothered by the elements here. I think we should eliminate
  the Syllables header and make the boxed syllabified text the first element
  under the Shift Lyrics header followed by the 'to the End of the Lyric'
  row." So this component is the text and the drift line, rendered by
  `+page.svelte` into `ShiftLyricsControl`'s own body, and SHIFT LYRICS is
  the one header over both.

  The placed count is a numeral pair rather than a sentence, so it needs no
  translation and no plural agreement. IT LEFT WITH THE HEADER: it is the
  status slot on the SHIFT LYRICS header now, on the desk's recommendation
  and Dann's ratification the same minute, which is where it sat relative to
  its own header before, so nothing moved in his eye except the word beside
  it. `+page.svelte` derives both numbers because the header is no longer
  this component's to draw.

  THE DRIFT LINE IS GONE, N.112, and with it this component's only
  translated string. It read "Text changed" and a count, ratified by Dann
  2026-08-14, and it existed because a seat could not follow its word: a
  changed poem left every seat where it was and the honest thing to do was
  say so. `text-diff.ts` and `reseat.ts` move the seats now, so the count had
  nothing left to count. `station.textChanged` is retired from `i18n.ts` in
  both languages, and `.station-drift` with it.
-->
<script lang="ts">
	import { t, type Language } from '$lib/i18n';
	import type { Slot, PairingMap } from '$lib/shane/pairings';

	interface Props {
		slots: readonly Slot[];
		pairings: PairingMap;
		/** Index into `slots` of the syllable the next note click will place. */
		cursor: number;
		language: Language;
		oncursor: (index: number) => void;
	}
	let { slots, pairings, cursor, language, oncursor }: Props = $props();

	const keyOf = (s: Slot) => `${s.origin.lineIndex}-${s.origin.wordIndex}-${s.origin.slotIndex}`;

	// A slot counts as placed when SOME note carries a pairing that came from
	// it. Keyed by origin rather than by text, so two identical syllables in
	// one line are still two slots.
	const placed = $derived.by(() => {
		const s = new Set<string>();
		for (const p of Object.values(pairings)) {
			if (p.kind === 'syllable') {
				s.add(`${p.origin.lineIndex}-${p.origin.wordIndex}-${p.origin.slotIndex}`);
			}
		}
		return s;
	});
	/* N.65 ship B. `placedCount` LEFT THIS FILE with the header it fed. It is
	   `+page.svelte`'s `placedSlotCount` now, derived from the same two
	   inputs by the same rule, because the header that shows it is
	   `ShiftLyricsControl`'s. `placed` stays: it is what greys a placed
	   syllable in the running text. */

	// The reading order for the running text: a new line at a line boundary,
	// a space at a word boundary, a hyphen (kept inside the PRECEDING
	// syllable's own button, not a separate element) at a boundary within one
	// word. `buildSlotQueue` (pairings.ts:187) already walks slots in that
	// document order, so this only has to look at neighbours.
	type Lead = 'line' | 'space' | null;
	const items = $derived.by(() => {
		return slots.map((s, i) => {
			const prev = i > 0 ? slots[i - 1] : undefined;
			const next = i < slots.length - 1 ? slots[i + 1] : undefined;
			let lead: Lead = null;
			if (prev) {
				lead =
					prev.origin.lineIndex !== s.origin.lineIndex
						? 'line'
						: prev.origin.wordIndex !== s.origin.wordIndex
							? 'space'
							: null;
			}
			const trailingHyphen =
				next !== undefined &&
				next.origin.lineIndex === s.origin.lineIndex &&
				next.origin.wordIndex === s.origin.wordIndex;
			return { slot: s, index: i, lead, trailingHyphen };
		});
	});
</script>

{#if slots.length > 0}
	<section class="syllable-station">
		<p class="station-text">
			{#each items as it (keyOf(it.slot))}{#if it.lead === 'line'}<br />{:else if it.lead === 'space'}{' '}{/if}<button
					type="button"
					class="slot"
					class:is-placed={placed.has(keyOf(it.slot))}
					class:is-cursor={it.index === cursor}
					aria-current={it.index === cursor ? 'true' : undefined}
					onclick={() => oncursor(it.index)}
				>{it.slot.cyrillic}{it.trailingHyphen ? '-' : ''}</button>{/each}
		</p>
	</section>
{/if}

<style>
	.syllable-station {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	/* N.65 ship B. `.station-head` AND ITS `<h3>` ARE GONE with the header.
	   Their recipe was this file's own, 0.6875rem at 0.08em in #6a655f,
	   against the drawer's 0.7rem at 0.12em; nothing inherits it, because
	   SHIFT LYRICS's header is `StationHeader` and always was. */
	/* `.station-drift` AND `.station-count` ARE GONE, N.112, with the drift
	   line they drew. They are deleted rather than left, because
	   `svelte-check` counts an unused selector as a warning and gate 3's
	   baseline is 7. */
	/* The whole verse as one piece of readable text, hyphenated at slot
	   boundaries. No height and no overflow here: the drawer's own scroll
	   carries it (`Drawer.svelte`'s `.drawer-content`, overflow-y: auto).
	   A second overflow on this element would be the nested-scroll failure
	   mode the ruling names. */
	.station-text {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.6;
		color: #1a1612;
	}
	/* Plain inline text, not a chip: only the cursor (below) gets a visible
	   box and the 44 px floor. Every other syllable is a same-size word in
	   the sentence, still a real button, still directly tappable. */
	.slot {
		display: inline;
		border: none;
		background: none;
		margin: 0;
		padding: 0;
		border-radius: 2px;
		cursor: pointer;
		color: inherit;
		font: inherit;
	}
	.slot.is-placed {
		color: #9a948c;
	}
	/* The one moving highlight (STATE.md, "N.55b's station shape"). This is
	   the sole surface that spends the 44 px touch floor; every other
	   syllable stays plain text, per the same ruling. */
	.slot.is-cursor {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		min-width: 44px;
		padding: 2px 6px;
		color: #1a1612;
		background: #FFFFFF;
		border: 1px solid #8E7E9B;
		vertical-align: middle;
	}
	.slot:focus-visible {
		outline: 2px solid #8E7E9B;
		outline-offset: 1px;
	}
</style>
