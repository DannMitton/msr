/**
 * sections.svelte.ts — THE DRAWER'S ONE RETRACTION MECHANISM.
 *
 * N.65, the drawer's stations, ship B. Dann's ruling of 2026-08-21: "I'd like
 * a retraction chevron applied to every header. Every header begins a section
 * that is retractable and expandable."
 *
 * EXTRACTED, NOT WRITTEN FRESH. `Drawer.svelte` already held this exact shape
 * inline as `expandedSections`, a `Set<string>`, with a `toggleSection(id)`
 * that rebuilt the set rather than mutating it, and it drove Learn and Guide's
 * table of contents. The brief's instruction was "extract it so the drawer has
 * one mechanism, do not write a second," so this file is that code moved out,
 * with the reassign-rather-than-mutate discipline kept: Svelte does not proxy
 * a `Set`, so a fresh set assigned to the field is what makes a reader run.
 *
 * TWO INSTANCES OF ONE MECHANISM, NOT TWO MECHANISMS. The table of contents
 * keeps its own instance, which persists nothing and holds heading ids. The
 * stations take a second, which persists and holds station ids. They are
 * separate state because they are separate things: a remembered table of
 * contents is not what §B.4 asks to remember, and one shared set would have
 * written Learn's open units into the stations' key.
 *
 * THE PERSISTENCE IS IMPERATIVE, NOT AN EFFECT. Every mutation runs through
 * `toggle` and `open`, so the write sits at the two mutation sites and needs
 * no effect context. `SongDocument` reaches the same conclusion for the same
 * reason and its header says so: this repository's vitest runs in the `node`
 * environment, where a `.svelte.ts` module compiles in server mode, `$state`
 * is a plain assignment and `$effect` compiles to nothing. Anything with a
 * decision in it belongs in plain TypeScript, which is why `parseOpenSections`
 * below is a free function and this class holds fields and writes.
 */

/**
 * The one new key of ship B, `ilya:` namespaced like every other key this app
 * writes. It stores a JSON array of station ids.
 */
export const OPEN_STATIONS_KEY = 'ilya:openStations';

/**
 * FIRST RUN: NOTHING OPEN. N.108 increment 1.
 *
 * IT WAS `['piece', 'source']` (§B.5), and the reason it was is the reason it
 * is empty now. Those two were open on arrival because they were the first two
 * things a singer needed and a wall of closed headers is what §B.5 exists to
 * stop. Under the three groups BOTH ARE VISIBLE WITHOUT A TOGGLE: Metadata is
 * an affordance on the Piece band, and the intake is a station with no header
 * that is never closed. So the ruling is satisfied by construction and the
 * default is the empty array, which is what Design's revision 2 §4.4 asked for
 * and what the build brief ruled.
 *
 * The opening state is now the MAP: every station name visible, every station
 * shut, and it fits without scrolling at all three ruled viewports.
 */
export const FIRST_RUN_STATIONS: readonly string[] = [];

/**
 * NOTATION DOES NOT JOIN THE PERSISTED SET, AND THIS IS DELIBERATE (§B.4).
 * `+page.svelte`'s own comment carries the reason and it is unchanged: "a
 * remembered collapse hides the toggles from a singer who forgot they exist."
 * NOTATION keeps its ruled collapsed-on-arrival default, so it is filtered out
 * on the way to storage and is never read back in. Do not tidy this away.
 */
export const UNPERSISTED_STATIONS: readonly string[] = ['notation'];

/**
 * The station ids, which are WIRE VALUES: they are written to `localStorage`
 * and read back on the next visit, so renaming one drops that singer's stored
 * open set back to the first-run default. `destinations.ts` carries the same
 * warning about `ilya:activeTab` for the same reason.
 */
export const STATION_IDS = {
	repertoire: 'repertoire',
	metadata: 'metadata',
	binder: 'binder',
	notation: 'notation',
	analysis: 'analysis',
	corrections: 'corrections',
	voice: 'voice',
} as const;

/**
 * THE MIGRATION, as Design's revision 2 §4.4 wrote it and the N.108 build
 * brief ruled it: `piece` to `metadata`, `songs` to `repertoire`, `analysis`
 * to `analysis`.
 *
 * `shiftLyrics` MAPPED TO `underlay` UNTIL N.114, RULED BY DANN 2026-09-07.
 * That ruling moved the queue and the SABB out of Score markup and under the
 * poem field, where they are a row inside the intake and not a station: there
 * is no UNDERLAY station left, so `underlay` is out of `STATION_IDS` and
 * `shiftLyrics` has no successor to be mapped to. It is DROPPED, exactly as
 * `source` is and for the same reason.
 *
 * THE FIVE IDS SHIP B COULD WRITE were `piece`, `source`, `songs`, `analysis`
 * and `shiftLyrics`; `notation` was a station under both maps and was never
 * written. Three of the five are mapped above. `source` IS DROPPED AND HAS NO
 * SUCCESSOR: the intake is always open and has no id to store, so a stored
 * `source` has nothing to become. A stored `underlay`, from a browser that
 * visited between N.108 and N.114, is dropped the same way.
 *
 * A NEW ID MAPS TO ITSELF, which is what makes this idempotent. Run it on an
 * already-migrated array and it returns that array, so a browser that has been
 * here once is not rewritten a second time; `restore` below is what decides
 * whether anything is written at all.
 */
const SUCCESSOR: Readonly<Record<string, string>> = {
	piece: STATION_IDS.metadata,
	songs: STATION_IDS.repertoire,
	analysis: STATION_IDS.analysis,
	...Object.fromEntries(Object.values(STATION_IDS).map((id) => [id, id])),
};

/**
 * Map a stored open set onto the three-group drawer.
 *
 * Anything unrecognised is dropped rather than kept, because an id this build
 * does not know cannot name a station a singer can see, and a set carrying one
 * would write it back out again on the next toggle.
 *
 * ON A PHONE, ONLY THE FIRST SURVIVOR. The phone holds one open station, so a
 * stored set of three would otherwise arrive in a state the singer cannot
 * reach by hand. First rather than last, because the stored array is in the
 * order the ids were added and the first is the one that has been open
 * longest.
 */
export function migrateOpenStations(stored: readonly string[], onPhone: boolean): string[] {
	const out: string[] = [];
	for (const id of stored) {
		const successor = SUCCESSOR[id];
		if (successor === undefined) continue;
		if (out.includes(successor)) continue;
		out.push(successor);
	}
	return onPhone ? out.slice(0, 1) : out;
}

/** Whether two open sets, in order, are the same array. */
function sameOrder(a: readonly string[], b: readonly string[]): boolean {
	return a.length === b.length && a.every((id, i) => id === b[i]);
}

/**
 * THE STORED SHAPE CARRIES ITS OWN VERSION. N.108 increment 1a.
 *
 * Ruled by Dann 2026-09-02 on his walk of `2c1cecf`: the migration "lands
 * every singer on the opening state once: drop the old set, write the empty
 * array, so nothing is open except the intake." His own drawer had come back
 * with Repertoire and Analysis open and pushed the Score markup group off the
 * bottom, which is the defect this closes.
 *
 * WHY A VERSION AND NOT JUST AN EMPTY ARRAY, and this is the whole reason the
 * shape changed. "Once" needs a mark. After increment 1 a returning singer's
 * key already holds NEW ids, `["repertoire","analysis"]`, and a bare array
 * cannot say whether that was written by increment 1 or by the singer's own
 * hand five seconds ago. Reset every boot and no station could ever stay open;
 * reset only sets holding OLD ids and Dann's own drawer is not reset, which is
 * the one case he reported. So the SHAPE is the mark: a bare array is what
 * every build before 1a wrote, and an object is what 1a writes.
 *
 * IT IS STILL ONE KEY AND ONE SAVE SITE. N.27 is open and no second silent
 * save may enter; `#write` below is the same single writer it has always been,
 * and the only thing that changed is the bytes it puts there.
 *
 * AN UNRECOGNISED OR CORRUPT VALUE FALLS BACK AND DOES NOT THROW (§B.4), the
 * pattern N.73 S3 ship two established for `ilya:activeTab` in
 * `restoreSurface`. A corrupt value reads as version 0, so it is reset with
 * everything else rather than being trusted.
 */
export const OPEN_STATIONS_VERSION = 2;

/** What a stored value turned out to be. */
export interface StoredOpenSet {
	/**
	 * The version the bytes were written by. 1 for the bare array every build
	 * before N.108 increment 1a wrote; 0 for absent, corrupt or unreadable.
	 */
	version: number;
	/** The ids it carried, empty when there were none to read. */
	open: string[];
}

/**
 * Read a stored value into its version and its ids.
 *
 * An empty array is NOT corrupt. It is a singer who shut everything, and it
 * round-trips as everything shut.
 */
export function readStoredOpenSet(raw: string | null): StoredOpenSet {
	if (raw === null) return { version: 0, open: [] };
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return { version: 0, open: [] };
	}
	if (Array.isArray(parsed)) {
		if (!parsed.every((id) => typeof id === 'string')) return { version: 0, open: [] };
		return { version: 1, open: parsed as string[] };
	}
	if (parsed !== null && typeof parsed === 'object') {
		const o = parsed as { v?: unknown; open?: unknown };
		const version = typeof o.v === 'number' ? o.v : 0;
		const open = Array.isArray(o.open) && o.open.every((id) => typeof id === 'string')
			? (o.open as string[])
			: [];
		return { version, open };
	}
	return { version: 0, open: [] };
}

/**
 * `parseOpenSections`, KEPT AND NARROWED. It was ship B's whole reader; it is
 * now the array half of `readStoredOpenSet` above, and it survives because the
 * fallback behaviour it documents is a ruling (§B.4) and because a caller that
 * only wants ids should not have to know about versions. Nothing in the tree
 * calls it but the tests that pin that ruling.
 */
export function parseOpenSections(raw: string | null, fallback: readonly string[]): string[] {
	const stored = readStoredOpenSet(raw);
	return stored.version === 0 ? [...fallback] : stored.open;
}

/** What the class needs to know to be either instance. */
interface SectionSetOptions {
	/** Open on construction. The fallback a corrupt stored value lands on. */
	open?: readonly string[];
	/** Where to write. Omit for an instance that remembers nothing. */
	storageKey?: string;
	/** Ids that are held but never written. See `UNPERSISTED_STATIONS`. */
	unpersisted?: readonly string[];
}

/**
 * A set of open section ids. `Drawer.svelte`'s `expandedSections` and
 * `toggleSection`, moved out, with `open` added for the table of contents'
 * two bulk cases and the storage write added for the stations.
 */
export class SectionSet {
	#open = $state(new Set<string>());
	readonly #storageKey: string | null;
	readonly #unpersisted: ReadonlySet<string>;

	/**
	 * ONE OPEN STATION AT A TIME. N.108 increment 1, ruled 2026-09-02: on a
	 * phone "one at a time; opening a second closes the first."
	 *
	 * A FIELD RATHER THAN A CONSTRUCTOR OPTION, because the answer changes
	 * under the singer: a desk rotated, a window narrowed, and `+page.svelte`'s
	 * `checkMobile` is the one owner of the 767 px rule. It sets this on the
	 * same line it sets `isMobile`. The table of contents' instance never
	 * touches it and stays at `false`, which is what it has always done.
	 *
	 * NARROWING DOES NOT CLOSE ANYTHING. A desktop singer with three stations
	 * open who drags the window under 768 keeps all three until the next
	 * toggle, which then leaves one. Closing two of them on a resize would be
	 * the drawer rearranging itself under the hand, which is the thing the
	 * whole item forbids.
	 */
	exclusive = $state(false);

	constructor(options: SectionSetOptions = {}) {
		this.#open = new Set(options.open ?? []);
		this.#storageKey = options.storageKey ?? null;
		this.#unpersisted = new Set(options.unpersisted ?? []);
	}

	/** Whether the section is open. This is what a chevron and a body read. */
	has(id: string): boolean {
		return this.#open.has(id);
	}

	/**
	 * The singer's own gesture on a header.
	 *
	 * N.108 increment 1 adds ONE branch and nothing else: on a phone, opening
	 * a station closes whatever was open. Ruled 2026-09-02, and it is the
	 * existing 767 px rule, read from `exclusive` rather than measured here so
	 * this file keeps no second opinion about what a phone is.
	 *
	 * THE INTAKE IS NOT COUNTED, because it has no id and is never closed.
	 * Design's revision 2 §4 recorded that reading as its own; the build brief
	 * ruled it by giving the intake no station row.
	 */
	toggle(id: string): void {
		const opening = !this.#open.has(id);
		const next = opening && this.exclusive ? new Set<string>() : new Set(this.#open);
		if (opening) next.add(id);
		else next.delete(id);
		this.#open = next;
		this.#write();
	}

	/**
	 * Open sections without shutting any. The table of contents' two bulk
	 * cases: a click that opens a heading's parents, and the auto-expand that
	 * follows the active heading. IT RETURNS EARLY WHEN NOTHING CHANGES, which
	 * the auto-expand effect depends on: reassigning an equal set would make
	 * that effect re-run itself.
	 */
	open(ids: readonly string[]): void {
		const next = new Set(this.#open);
		let changed = false;
		for (const id of ids) {
			if (!next.has(id)) {
				next.add(id);
				changed = true;
			}
		}
		if (!changed) return;
		this.#open = next;
		this.#write();
	}

	/**
	 * Take a stored value. The caller reads `localStorage` and hands the raw
	 * string in, so this class is testable without a browser and the boot
	 * sequence stays in `+page.svelte` beside the other restores.
	 *
	 * N.108 increment 1: THE RESTORE IS ALSO THE MIGRATION, and it writes back.
	 * N.108 increment 1a: AND IT RESETS EVERY SINGER ONCE.
	 *
	 * THE TWO BRANCHES, and they are the whole of it:
	 *
	 * - **Anything written before 1a** (a bare array, or bytes this build
	 *   cannot read) lands on the OPENING STATE: nothing open but the intake,
	 *   which is never closed. Ruled by Dann, and it is what his own walk
	 *   asked for. The old ids are not mapped, because the point is not to
	 *   carry them across under new names; it is to land on the map.
	 * - **Anything written by 1a or later** is the singer's own and is kept.
	 *   It still goes through `migrateOpenStations`, which for a set of new
	 *   ids is the identity, and which is kept for exactly the case its own
	 *   comment describes: an id this build does not know is still dropped,
	 *   and a phone still holds one station.
	 *
	 * IT WRITES ONLY WHEN SOMETHING CHANGED, which is what makes "once" true
	 * rather than merely intended: the second boot reads version 2, keeps what
	 * it finds, and writes nothing. Constraint: N.27 is open, so no second
	 * silent save site may enter; this routes through `#write`, the one site
	 * that has always owned this key, and adds none.
	 *
	 * A FIRST-RUN BROWSER IS WRITTEN, and that is a change from increment 1.
	 * It has to be: without the mark, the next boot would read version 0 again
	 * and reset a singer who had opened a station in between.
	 */
	restore(raw: string | null, onPhone = false): void {
		const stored = readStoredOpenSet(raw);
		const next =
			stored.version < OPEN_STATIONS_VERSION
				? []
				: migrateOpenStations(stored.open, onPhone);
		this.#open = new Set(next);
		if (stored.version < OPEN_STATIONS_VERSION || !sameOrder(stored.open, next)) this.#write();
	}

	/**
	 * THE ONE SAVE SITE FOR THIS KEY, and N.108 increment 1a changed only the
	 * bytes: the array is wrapped in `{ v, open }` so a later build can tell
	 * what wrote it. See `OPEN_STATIONS_VERSION`.
	 */
	#write(): void {
		if (this.#storageKey === null) return;
		const ids = [...this.#open].filter((id) => !this.#unpersisted.has(id));
		try {
			localStorage.setItem(
				this.#storageKey,
				JSON.stringify({ v: OPEN_STATIONS_VERSION, open: ids })
			);
		} catch {
			// localStorage unavailable. The open set still works for this visit.
		}
	}
}
