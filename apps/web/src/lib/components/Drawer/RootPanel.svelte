<script lang="ts">
	import { t, type Language } from '$lib/i18n';
import SongList from './SongList.svelte';
import StationHeader from './StationHeader.svelte';
import type { SongRow } from '$lib/library/songs';
import { STATION_IDS, type SectionSet } from './sections.svelte';

	/*
	 * N.108 INCREMENT 1. THIS PANEL IS THE PIECE GROUP'S CONTENTS AND NOTHING
	 * ELSE. It held four things and now holds three, and it holds them without
	 * a wrapper.
	 *
	 * ANALYSIS LEFT FOR THE TEXT GROUP. It is `AnalysisStation.svelte` now,
	 * rendered from `+page.svelte`'s `textGroup` snippet beside Notation, and
	 * the five props that fed it left with it: `hasResults`, `wordCount`,
	 * `transcribeMs`, `showInspector` and the `consoleContent` snippet. The
	 * ruling that put Analysis first in the scroll (Dann, 2026-08-27, "the
	 * bottom is the MUSIC half and the top is the TEXT half") is not reversed:
	 * it is what the three groups make structural. Analysis is with the text
	 * because Text is a group.
	 *
	 * SOURCE BECAME THE INTAKE AND LOST ITS HEADER. Ruled 2026-09-02: the
	 * intake has no station row and is never closed. Its two intakes are
	 * unchanged in increment 1, the textarea above and the score drop below,
	 * which is increment 2's to unify.
	 *
	 * THE BINDER ROW BECAME A STATION. It was a bare row at the foot of
	 * Source, which N.65 ship B ruled it into ("the appearance that the
	 * Print/Export/Import row shares the same relationship to the score field
	 * as the Clear text/Transcribe row does to the text field above it"). The
	 * three-group map names it: Piece holds "Export and import". That ruling
	 * is superseded by the map, and the row's own arrangement inside the
	 * station is untouched.
	 *
	 * THERE IS NO `.root-panel` WRAPPER. The stations are direct children of
	 * the group, because the group frame owns their inset and their boundary
	 * (`Drawer.svelte`'s `.group :global(.station)`), and a wrapper between
	 * them and the frame would put the band's adjacency rule out of reach.
	 * Svelte lets a component have more than one root element; this one has
	 * three.
	 */
	interface Props {
		language: Language;
		/*
		 * N.73 S3 ship one. `metadata`, `onmetadatachange`, `fromScore`,
		 * `onrevert` and `arrangerProvenance` are gone from this panel. They
		 * fed the metadata block and the provenance line, and both are pinned
		 * at the top of the drawer now; `+page.svelte` passes them straight to
		 * `MetadataFields` in the `pieceAnchor` snippet.
		 */
		/* `onprint` AND `printDisabled` LEFT WITH THE BUTTON, N.65, Dann's
		   ruling of 2026-08-21. Print is not a drawer control any more; it
		   sits under the sheet, rendered by `+page.svelte`, which is where
		   `handlePrint` always lived. The guard left with it because the
		   control under the sheet is ALWAYS LIVE, which is the same ruling. */
		onexport: () => void;
		onimport: () => void;
		onexportall: () => void;
		/**
		 * N.67 step 4b, the library door. Passed WHOLE rather than as seven
		 * separate props, so `+page.svelte` gains one line of wiring instead of
		 * seven and this panel's prop list stays readable.
		 */
		songLibrary: {
			songs: SongRow[];
			activeId: string;
			plural: boolean;
			error: string | null;
			/** N.67 step 6: what a row says when its record cannot be read. */
			unreadable: string;
			/** N.67 step 6: what a row says when a newer Ilya wrote it. */
			newerIlya: string;
			onopen: (id: string) => void;
			onnew: () => void;
			onrename: (id: string, name: string) => void;
			ondelete: (id: string) => void;
		};
		/**
		 * N.65 ship B. THE DRAWER'S ONE OPEN SET. Passed whole rather than as
		 * a pair of props per station, so this panel drills one name for its
		 * own two headers and REPERTOIRE's, and every station in the drawer
		 * reads the same object. `sections.svelte.ts` holds the mechanism.
		 */
		sections: SectionSet;
	}

	let {
		language,
		onexport,
		onimport,
		onexportall,
		songLibrary,
		sections,
	}: Props = $props();

	/* THE INTAKE'S OWN STATE MOVED TO `IntakePanel.svelte`, N.108-5.
	   `sourceIsEmpty`, `charCount`, `showWarning` and `lineCount` went with
	   the field, the receipts and the frame they measure, on Dann's ruling of
	   2026-09-07 that the intake becomes its own group band named INPUT. This
	   panel is Piece's contents now: Repertoire and the binder. */


	// Metadata field handlers now live in MetadataFields.svelte.
	// The notation toggles and their cascade left this panel at item N.7.
	// They are NotationFields.svelte, rendered once by Drawer.svelte and
	// anchored below the scroll, because they govern the document rather than
	// this tab. This panel no longer sees notationPrefs at all.
</script>

<!-- ── REPERTOIRE. N.108: the first station in the Piece group, and the
     group's band above it is its boundary, so it draws no rule of its own.
     Its own arrangement is untouched. -->
<SongList
	{language}
	songs={songLibrary.songs}
	activeId={songLibrary.activeId}
	plural={songLibrary.plural}
	error={songLibrary.error}
	unreadable={songLibrary.unreadable}
	newerIlya={songLibrary.newerIlya}
	onopen={songLibrary.onopen}
	onnew={songLibrary.onnew}
	onrename={songLibrary.onrename}
	ondelete={songLibrary.ondelete}
	expanded={sections.has(STATION_IDS.repertoire)}
	ontoggle={() => sections.toggle(STATION_IDS.repertoire)}
/>


<!-- ── EXPORT AND IMPORT. N.108: the binder row is a STATION in Piece now,
     which the three-group map names. It was a bare row at the foot of Source,
     by Dann's ruling of N.65 ship B §B.6: "I do not think we need an Output
     section articulated. What I want is the appearance that the
     Print/Export/Import row shares the same relationship to the score field
     as the Clear text/Transcribe row does to the text field above it."

     THAT RULING IS SUPERSEDED BY THE MAP, not overturned by this file. What it
     was protecting was the row's relationship to a field, and the field it sat
     under is the intake, which is now headerless and never closed; a bare row
     at the foot of a headerless station would be the orphan control the spec's
     §3.3 forbids. The row's own arrangement inside the station is untouched.

     `Export all songs` is a third cell, shown only above one song, because
     with one song it says the same thing as the button beside it. THE GRID IS
     UNCHANGED, `repeat(3, 1fr)`: two buttons where there is one song, three
     where there is more than one, on one row either way. Narrowing it to two
     columns is a separate ruling and this ship does not make it. -->
<div class="station">
	<StationHeader
		label={t('binder.heading', language)}
		expanded={sections.has(STATION_IDS.binder)}
		ontoggle={() => sections.toggle(STATION_IDS.binder)}
		controls="station-binder"
	/>
	{#if sections.has(STATION_IDS.binder)}
	<div class="station-body" id="station-binder">
	<div class="output-row">
		<!-- PRINT IS NOT HERE ANY MORE, N.65, Dann's ruling of 2026-08-21: "we
		     will simply not offer a Print button for the Learn or Guide
		     sections", and before that, on where it goes: "what if we add it
		     under the WYSIWYG flush left? Visually it can parallel the
		     Transcription button above the WYSIWYG." It is `.sheet-print` in
		     `+page.svelte`. This row is Export and Import, and `Export all
		     songs` keeps its conditional fourth cell below. -->
		<button class="action-btn btn-ghost" onclick={onexport}>{t('binder.export', language)}</button>
		<button class="action-btn btn-ghost" onclick={onimport}>{t('binder.import', language)}</button>
		{#if songLibrary.songs.length > 1}
			<button class="action-btn btn-ghost" onclick={onexportall}>{t('binder.exportAll', language)}</button>
		{/if}
	</div>
	</div>
	{/if}
</div>

<style>
	/* ── `.root-panel` IS GONE (N.108 increment 1) ────────────
	   The wrapper and its three rules left with it: the `0 1rem` sides, which
	   the group's own 18px station inset replaces; the `:last-child` 40px
	   foot, which belonged to whichever panel ended the column and there is no
	   last panel now (the scroll carries a 12px foot instead, in
	   `Drawer.svelte`); and the flex column, which the group is.

	   The 1rem was ruled: every station rule in the drawer had to share one
	   inset, Dann 2026-08-20. THE RULING HOLDS AND ITS OWNER MOVED. One inset,
	   declared once, in the frame that contains every station rather than in
	   each panel that draws some of them. */


	/* Output. Three equal columns. Print was the first of them until N.65
	   moved it under the sheet; Export and Import hold the first two now and
	   `Export all songs` takes the third when it is drawn. */
	.output-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}
	/* PILL ENDS, N.108 increment 4. Ruled by Dann 2026-09-03 from the
	   calibration ritual's own two buttons (`CalibrationWizard.svelte`'s
	   `.wizard-primary` and `.wizard-secondary`, `border-radius: 999px`):
	   "The buttons shown here can form the template. Can we make other
	   buttons share its rounded ends?" Only the corners move; the fill, the
	   border, the type and the padding are untouched.

	   It carries this panel's three `.btn-ghost` buttons, which are fill rules
	   and set no radius of their own. The intake's own copy of this rule, and
	   the `.btn-primary` that goes with it, are `IntakePanel.svelte`'s since
	   N.108-5; change one and change both. */
	.action-btn {
		padding: 0.45rem 0.5rem;
		font-family: var(--font-sans);
		font-size: 0.8rem;
		font-weight: 600;
		border: none;
		border-radius: 999px;
		cursor: pointer;
		transition: opacity 0.12s;
	}

	.btn-ghost {
		color: var(--stone-500);
		background: transparent;
		font-weight: 500;
		border: 1px solid var(--stone-600, #57534e);
	}

	/* `.btn-primary` LEFT WITH TRANSCRIBE, N.108-5. It was the one filled
	   button in this panel and the intake took it to `IntakePanel.svelte`,
	   value for value. What is left here is Export, Import and Export all,
	   which are all `.btn-ghost`. Deleted rather than kept, because
	   `svelte-check` counts an unused selector as a warning and gate 3's
	   baseline is 7. */

	.action-btn:hover:not(:disabled) {
		opacity: 0.85;
	}

	.action-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* ── THE STATION RECIPE MOVED TO THE FRAME (N.108) ───────
	   `.section`, `.section + .section`, `.section.shut` and the two exemption
	   comments are gone from this file. What they declared was: a 2px sage
	   rule between stations, 6px above a label, 12px below a body, 6px below a
	   shut one, and no rule above whatever was first in the scroll.

	   EVERY ONE OF THOSE IS NOW ONE DECLARATION IN `Drawer.svelte`, on
	   `.group :global(.station)` and its two neighbours, for the reason that
	   file gives: the inset and the boundary are properties of the FRAME, and
	   five components were declaring them. That is the same argument
	   `StationHeader.svelte` makes for the label.

	   DANN'S RULINGS INSIDE THEM ARE NOT LOST, and here is where each went:
	   - "one rule per boundary, drawn by the station below it, none above the
	     first" (2026-08-27) is `.group-band + .station { border-top: none }`.
	   - "a shut station is the same height as its twins" (2026-08-21) is
	     satisfied by construction: the row IS the station when it is shut, and
	     every row is the same box.
	   - The 2px sage rule itself (2026-08-20) is retired inside a group and
	     replaced by a 1px hairline, because inside a frame it is a station
	     that ends and not a region. The band says the region.
	   - The asymmetry, a label close to the rule above it and a body given air
	     below it (2026-08-20), survives as the header's 8px and the body's
	     12px. */

	/* A station's contents, as a box the header is NOT inside. That is what
	   makes the header's own 0.4rem the whole gap to the first entry, which
	   is Dann's ruling 2. Put the header in the flex column instead and the
	   column's gap adds to it, which is exactly how SONGS came to measure
	   12.39px where every other station measured 6.39px. Twinned on
	   SongList's `.station-body`. */
	.station-body {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}


	/* ── ANALYSIS'S RULES LEFT WITH ANALYSIS (N.108) ─────────
	   `.console-section`, `.console-placeholder-body`, `.placeholder-hint`,
	   `.result-summary` and `.result-hidden` are `AnalysisStation.svelte`'s
	   now, copied value for value, because Svelte scopes a rule to the file
	   that writes the markup and the markup went to the Text group. */

</style>
