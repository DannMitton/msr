<!--
	ScoreUploader — the Fit ingest widget (Round 9 §2 Items 1, 2, 6; handover
	v35 §E.5). One drag-and-drop surface with click-to-browse, auto-detection,
	provenance-driven fidelity treatment, and inline persistent errors keyed by
	IngestError code. Agentless throughout: the copy never speaks as an agent,
	IPA and analysis live elsewhere.

	This component owns both converter lifecycles (§B.2): it constructs a
	WorkerScoreReader (denigma, .musx) and a WebmscoreMsczConverter (webmscore,
	.mscz) lazily on first need and disposes them on destroy. Each is
	constructed only when a file of its own kind actually arrives: the webmscore
	converter's warm-up prefetches ~17.5 MB of runtime assets, and the denigma
	reader's pulls a 4,511,746-byte WASM artifact (1,039,849 gzipped, measured
	2026-08-10). N.26 gave the reader the same treatment the converter always
	had; before it, a drop of any kind paid for denigma. The parsed result is
	handed up through
	`oningested`; live wiring (§E.7) consumes it. MIDI is not read and is no
	longer offered: N.58 closed on 2026-08-19 by dropping it.

	N.108 INCREMENT 2. THIS COMPONENT NO LONGER HAS A FIELD OF ITS OWN, and
	that is the whole of the change. The drawer has ONE intake now, drawn by
	`RootPanel.svelte`, and it is the surface a singer pastes into, types into,
	drops onto, and picks a file with. So the dropzone, its watermark, its
	placeholder, its format list, its scan icon and its hidden file input are
	gone from this file, and with them `browse`, `onPick`, `onDrop`,
	`onDragOver`, `onDragLeave`, `dragging`, and N.70's `acceptList`. The
	ruling in `acceptList` IS NOT SPENT: it moved with the picker it governs,
	and `RootPanel` carries it with its reasons.

	WHAT IS LEFT IS THE ENGINE AND EVERY ANSWER IT GIVES. The two converter
	lifecycles, the page reader, the clef-and-key prompt, the busy labels, the
	fidelity banner, the read report, and `classify`'s twenty-odd named errors
	are untouched, line for line. They render UNDER the one field, because
	`+page.svelte` renders this component inside the intake, which is where a
	question about a file the singer just dropped belongs.

	THE INTAKE HANDS FILES IN THROUGH `take()`, exported as an instance method
	and called from `+page.svelte` on the `bind:this`. It is `handleFile` with
	one thing in front of it: the PDF question below.

	THE ONE KIND THE BYTES CANNOT SETTLE IS A PDF, so it is the one kind that
	asks. Ruled by the build brief: "A PDF asks once, in place, which it is. Do
	not guess." Every other format the sniff meets answers for itself: MusicXML,
	MNX, the three ZIP containers and a photograph are all the SCORE, and text
	typed or pasted is the POEM. A PDF is honestly either, so `askKind` puts the
	question where the file landed and takes the singer's answer. The score
	answer is the path this component always took. The poem answer is
	`extractPdfText`, and it hands the words up through `onpoem`.
-->
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { t, type Language } from '$lib/i18n';
	import { WorkerScoreReader } from './engine/score-reader';
	import { WebmscoreMsczConverter } from './engine/mscz-converter';
	import { WorkerPageReader, type ClefKeyProbe } from './engine/page-reader';
	import { ImageUndecodableError, pieceIdFor, toGreyscalePng } from './engine/page-image';
	import {
		ingestScoreFile,
		fidelityBanner,
		type IngestedScore,
		type IngestError,
		type IngestOutcome,
		type IngestProvenance,
		type PageRead,
	} from './ingestion/ingest';
	import { detectScoreFormat, SNIFF_LENGTH } from './ingestion/format-detection';
	import { prefillFrom } from './ingestion/clef-key-prompt';
	import type { EngravingAnswers } from './ingestion/recognized-to-musicxml';
	import type { ReadReport } from './ingestion/recognized';
	import type { PageProvenance } from '$lib/library/types';

	interface Props {
		language: Language;
		/** The parsed score, accepted by the user via "Continue to analysis".
		 *  Live wiring (§E.7) consumes this.
		 *
		 *  N.67 step 2: the FILE travels with it, because the library stores the
		 *  singer's own bytes and only this component ever holds them. */
		oningested: (
			ingested: IngestedScore,
			file: File,
			origin: 'upload' | 'restore',
			/** N.59 step 7: present only on the reader route. `file` is then the
			 *  GREYSCALE INK, not the picture the singer supplied, because the ink
			 *  is what the retention ruling stores and what a re-read reproduces. */
			page?: PageProvenance,
		) => void;
		/** N.67 step 2: a stored source, re-ingested at boot so a reload brings
		 *  the score back without the singer re-uploading it. The converters
		 *  live in this component (§B.2), so the re-ingest does too. */
		restore?: {
			fileName: string;
			bytes: ArrayBuffer;
			/** N.59 step 7: the clef and key this page was read with, so a
			 *  restore never asks the two questions again. */
			answers?: EngravingAnswers | null;
		} | null;
		/**
		 * N.108 increment 2. THE POEM, where a PDF turned out to hold one.
		 *
		 * This component reads a PDF either way; only the destination differs, and
		 * the destination is not this component's to write. `+page.svelte` owns
		 * `doc.inputText` and every other writer of it, so the words go up the same
		 * way a score does.
		 */
		onpoem: (text: string) => void;
	}

	let { language, oningested, restore = null, onpoem }: Props = $props();

	const T = (key: string) => t(key, language);

	/* THE DROP ZONE AND ITS SENTENCE LEFT THIS FILE (N.108 increment 2), and
	   with them `dropPlaceholder`, `ACCEPT` and `acceptList`.

	   DANN'S RULING OF 2026-08-21 IS NOT REVERSED, IT IS SPENT. It said the
	   score box says one sentence and the format list sits outside it. There is
	   no score box: there is one intake, and `RootPanel.svelte` draws it. The
	   two strings that sentence was assembled from, `upload.drop.title` and
	   `upload.drop.browse`, stay in `i18n.ts` unused, as does
	   `upload.drop.acceptedNow`, because the French table is not ruled yet and a
	   ratified French string is not this ship's to delete.

	   N.70'S RULING TRAVELLED WITH THE PICKER IT GOVERNS. `RootPanel` holds the
	   two file inputs now and carries the whole reasoning: iOS matches `accept`
	   by registered type, knows none of `.musicxml`, `.mnx`, `.musx`, `.mscz`,
	   and so greys out every format Ilya reads. The attribute is kept on a fine
	   pointer and dropped on a coarse one. */

	type UiState =
		| { kind: 'idle' }
		/** N.59, Ruling A: a picture waits here while the singer answers.
		 *  N.97: `detected` is true where the page's own clef and key signature
		 *  are what the two controls now show. False is the old prompt, word for
		 *  word. */
		| { kind: 'asking'; file: File; detected: boolean }
		/** N.108 increment 2: a PDF waits here for the one answer its bytes
		 *  cannot give. See this file's header.
		 *
		 *  N.108 increment 4: A PICTURE WAITS HERE TOO, and `picture` says
		 *  which it is. The question is the same and the two answers are the
		 *  same words; only the route behind each answer differs, because a
		 *  PDF's words are extracted and a picture's are recognised. */
		| { kind: 'askKind'; file: File; picture: boolean }
		| { kind: 'busy'; label: string }
		| { kind: 'done'; ingested: IngestedScore; file: File }
		| { kind: 'error'; message: string }
		| { kind: 'soon'; message: string };

	let ui = $state<UiState>({ kind: 'idle' });
	let bannerDismissed = $state(false);

	/* ── converter lifecycles (this component owns them, §B.2) ──────── */
	let reader: WorkerScoreReader | null = null;
	const getReader = (): WorkerScoreReader => (reader ??= new WorkerScoreReader());
	let converter: WebmscoreMsczConverter | null = null;
	const getConverter = (): WebmscoreMsczConverter => (converter ??= new WebmscoreMsczConverter());
	/** N.59, Ruling E: constructed on the first real picture, per N.26's law
	 *  that a drop of one kind never pays for another's warm-up. Pyodide plus
	 *  numpy, opencv-python, and matplotlib is the heaviest warm-up in the app. */
	let pageReader: WorkerPageReader | null = null;
	const getPageReader = (): WorkerPageReader => (pageReader ??= new WorkerPageReader());
	onDestroy(() => {
		reader?.dispose();
		converter?.dispose();
		pageReader?.dispose();
	});

	/* ── N.59: the singer's two answers (Ruling A) ──────────────────── */

	/** Defaults per Ruling A: treble, no sharps or flats, no octave change. */
	const CLEF_CHOICES: { key: string; clef: { sign: string; line: number }; octaveChange: number }[] = [
		{ key: 'upload.ask.clefTreble', clef: { sign: 'G', line: 2 }, octaveChange: 0 },
		{ key: 'upload.ask.clefTrebleOttava', clef: { sign: 'G', line: 2 }, octaveChange: -1 },
		{ key: 'upload.ask.clefBass', clef: { sign: 'F', line: 4 }, octaveChange: 0 },
	];
	let clefChoice = $state(0);
	let fifths = $state(0);

	/**
	 * N.97. THE PROMPT CONFIRMS WHAT THE PAGE PRINTS, or falls back to asking.
	 *
	 * The reader now reads the clef glyph and the run of sharps or flats beside
	 * it, and this moves the two controls onto that reading before the singer
	 * sees them. Everything else about the prompt is unchanged: the same two
	 * selects, the same options, the same buttons, and the same two answers
	 * travelling to the reader.
	 *
	 * THE RULE ITSELF IS IN `clef-key-prompt.ts` and tested there, because
	 * vitest never compiles a `.svelte` file. What is left here is the
	 * assignment.
	 */
	function preselect(probe: ClefKeyProbe | null): boolean {
		const fill = prefillFrom(probe);
		if (!fill) return false;
		clefChoice = fill.clefChoice;
		fifths = fill.fifths;
		return true;
	}

	/** -7 through 7, flats first, so the list reads the way a circle of fifths does. */
	const FIFTHS_CHOICES = Array.from({ length: 15 }, (_, i) => i - 7);
	function fifthsLabel(n: number): string {
		if (n === 0) return T('upload.ask.keyNone');
		if (n === 1) return T('upload.ask.keySharp');
		if (n === -1) return T('upload.ask.keyFlat');
		return n > 0
			? T('upload.ask.keySharps').replace('%s', String(n))
			: T('upload.ask.keyFlats').replace('%s', String(-n));
	}
	const answers = $derived<EngravingAnswers>({
		clef: CLEF_CHOICES[clefChoice].clef,
		octaveChange: CLEF_CHOICES[clefChoice].octaveChange,
		fifths,
	});

	/* ── Intake ─────────────────────────────────────────────────────── */

	/**
	 * THE ONE WAY IN, N.108 increment 2. `RootPanel`'s field takes the drop and
	 * the pick; `+page.svelte` calls this on the instance.
	 *
	 * A PDF STOPS HERE AND ASKS, and SINCE N.108 INCREMENT 4 SO DOES A PICTURE.
	 * Ruled by Dann 2026-09-03 when he consolidated the three ways in: the
	 * camera icon was how a singer used to say "this picture is text", and with
	 * one picker there is no button left to say it, so the picture asks. Every
	 * other file goes straight to `handleFile`, unchanged, because the sniff
	 * answers for it. The question is asked ONCE per file: answering it calls
	 * `handleFile`, `readPdfAsPoem` or `readPictureAsPoem` directly, and none of
	 * them comes back through here.
	 *
	 * A DROPPED PICTURE ASKS TOO, which reverses the increment 2 brief's "a
	 * photograph goes to the reader". That rule was written while the camera
	 * icon existed to mean the other thing. Recorded in
	 * `memo-n108-finishings_r1_2026-09-03.md` §5 as a departure.
	 *
	 * THE SNIFF IS `readableKind`, WHICH IS `detectScoreFormat`, THE SAME ONE
	 * DISPATCH USES, so this cannot disagree with what `ingestScoreFile` decides
	 * a moment later. A file whose head cannot be read at all is neither, so it
	 * falls through to the score route and earns that route's own named refusal.
	 */
	export async function take(file: File): Promise<void> {
		const kind = await readableKind(file);
		if (kind !== null) {
			bannerDismissed = false;
			ui = { kind: 'askKind', file, picture: kind === 'image' };
			return;
		}
		await handleFile(file);
	}

	/**
	 * The singer answered "the poem".
	 *
	 * IT IS AN EXTRACTION AND NOT AN OCR, so a scanned PDF holds no text and
	 * comes back empty. That is a mis-answer rather than a fault, and it is
	 * reported as one: the singer is told the PDF carries no text and is left
	 * where they were, with the file still nameable and the score answer still
	 * one press away.
	 */
	async function readPdfAsPoem(file: File): Promise<void> {
		ui = { kind: 'busy', label: T('intake.pdf.reading') };
		let text: string;
		try {
			const { extractPdfText } = await import('./engine/page-pdf');
			text = await extractPdfText(file);
		} catch (err) {
			console.error('[ScoreUploader] the PDF text could not be read:', err);
			ui = { kind: 'error', message: T('upload.err.pdfUnreadable') };
			return;
		}
		if (text === '') {
			ui = { kind: 'error', message: T('intake.pdf.noText') };
			return;
		}
		onpoem(text);
		reset();
	}

	/**
	 * The singer answered "the poem" on a PICTURE. N.108 increment 4.
	 *
	 * THIS IS THE CAMERA ICON'S OWN CODE, MOVED, NOT REWRITTEN. It was
	 * `handleOcrFile` in `RootPanel.svelte`: the same dynamic `tesseract.js`
	 * import, the same `rus` worker, the same `terminate`, and the same two
	 * failure messages in both languages, which were English and French
	 * literals there and are English and French literals here. Nothing about
	 * the recognition changed; only what a singer presses to ask for it.
	 *
	 * IT REPORTS THROUGH `ui`, WHICH THE ICON COULD NOT. The icon spun in the
	 * field's corner and wrote its refusal into a line under the intake; this
	 * component already owns a wait and a refusal for every other file, and a
	 * picture's OCR is now one more answer about a file, shown where the rest
	 * are.
	 *
	 * A PICTURE WITH NO WORDS IN IT IS A MIS-ANSWER, not a fault, exactly as an
	 * imageless PDF is: the singer is told, and the score answer is still one
	 * press away behind the same question.
	 */
	async function readPictureAsPoem(file: File): Promise<void> {
		ui = { kind: 'busy', label: T('intake.picture.reading') };
		try {
			const { createWorker } = await import('tesseract.js');
			const worker = await createWorker('rus');
			const { data: { text } } = await worker.recognize(file);
			await worker.terminate();
			if (text.trim() === '') {
				ui = {
					kind: 'error',
					message: language === 'en'
						? 'No text recognised in image.'
						: 'Aucun texte reconnu dans l\u2019image.',
				};
				return;
			}
			onpoem(text.trim());
			reset();
		} catch (err) {
			console.error('[ScoreUploader] the picture could not be recognised:', err);
			ui = {
				kind: 'error',
				message: language === 'en'
					? 'OCR processing failed.'
					: 'Échec du traitement OCR.',
			};
		}
	}

	/** Is this a page the reader can read? Sniffed by bytes, as dispatch will. */
	async function isPicture(file: File): Promise<boolean> {
		return (await readableKind(file)) !== null;
	}

	async function readableKind(file: File): Promise<'image' | 'pdf' | null> {
		const head = new Uint8Array(await file.slice(0, SNIFF_LENGTH).arrayBuffer());
		const detected = detectScoreFormat(file.name, head);
		if (!detected.ok) return null;
		if (detected.format === 'image') return 'image';
		if (detected.format === 'pdf') return 'pdf';
		return null;
	}

	/**
	 * N.59, Ruling A. A picture stops here and asks its two questions BEFORE
	 * the read, because the reader detects neither clef nor key and E.43
	 * measured the cost of wrong values at 38% against 73%. A restored page
	 * does not ask again: its answers came back with it.
	 */
	async function handleFile(file: File, storedAnswers?: EngravingAnswers): Promise<void> {
		bannerDismissed = false;
		if (!storedAnswers && (await isPicture(file))) {
			// N.97. The reader looks at the page BEFORE the prompt appears, so the
			// prompt can show what it found. The wait is named honestly with the
			// strings the read itself uses, because this IS the reader reading the
			// page, and the first one pays Pyodide's warm-up either way.
			ui = {
				kind: 'busy',
				label: WorkerPageReader.hasLoadedBefore
					? T('upload.status.readingPage')
					: T('upload.status.preparingReader'),
			};
			ui = { kind: 'asking', file, detected: preselect(await probeFile(file)) };
			return;
		}
		// A .musx or .mscz routes through conversion; name the wait honestly.
		const isMusx = /\.musx$/i.test(file.name);
		const isMscz = /\.mscz$/i.test(file.name);
		// Start the matching converter's warm-up (module import + asset
		// prefetch) while the bytes are read and the container pre-check runs.
		// N.26: the denigma reader is warmed on a real .musx only, the same way
		// the webmscore converter always has been, so a MusicXML or .mxl drop no
		// longer pulls a WASM artifact it cannot use.
		if (isMusx) getReader();
		if (isMscz) getConverter();
		const picture = !!storedAnswers || (await isPicture(file));
		if (picture) getPageReader();
		ui = {
			kind: 'busy',
			label: isMusx
				? T('upload.status.converting')
				: isMscz
					? T('upload.status.convertingMscz')
					: picture
						? WorkerPageReader.hasLoadedBefore
							? T('upload.status.readingPage')
							: T('upload.status.preparingReader')
						: T('upload.status.reading'),
		};

		let outcome: IngestOutcome;
		try {
			outcome = await ingestScoreFile(file, {
				// Both constructed inside their closures, so only a real .musx
				// and a real .mscz pay their converter's warm-up (N.26).
				scoreReader: {
					convert: (f: File) => getReader().convert(f),
					dispose: () => reader?.dispose(),
				},
				msczConvert: (bytes, name) => getConverter().convert(bytes, name),
				readPages: readPages,
				engravingAnswers: storedAnswers ?? answers,
			});
		} catch (err) {
			console.error('[ScoreUploader] unexpected ingest failure:', err);
			ui = { kind: 'error', message: T('upload.err.parseFailed') };
			return;
		}

		if (outcome.ok) {
			ui = { kind: 'done', ingested: outcome.ingested, file };
			return;
		}
		const c = classify(outcome.error, isMscz);
		ui = c.soon ? { kind: 'soon', message: c.message } : { kind: 'error', message: c.message };
	}

	/**
	 * The page-reader seam handed to dispatch. Greyscale conversion happens
	 * here, once, and the SAME bytes are what step 7 stores, so a restored page
	 * re-reads to the same answer rather than an approximate one.
	 */
	async function readPages(file: File, forAnswers: EngravingAnswers): Promise<PageRead> {
		const kind = await readableKind(file);
		let inks: ArrayBuffer[];
		try {
			if (kind === 'pdf') {
				// Dynamic import: pdf.js is 644 KB gzipped and nobody who has not
				// dropped a PDF ever pays for it (N.26's law, and the same shape as
				// denigma and webmscore above).
				const { rasterizePdf } = await import('./engine/page-pdf');
				inks = await rasterizePdf(file);
			} else {
				inks = [await toGreyscalePng(file)];
			}
		} catch (e) {
			if (e instanceof ImageUndecodableError) throw { code: 'IMAGE_UNDECODABLE', message: e.message };
			if (typeof e === 'object' && e !== null && 'code' in e) throw e;
			throw e;
		}
		// A PDF is STORED BYTE FOR BYTE, not as its rasters, which is Dann's own
		// ruled precedent for `.musx`: storing the conversion would freeze the
		// song at today's rasterizer. A photograph has no such original to keep,
		// so its ink is both what is read and what is stored.
		lastInk = kind === 'pdf' ? await file.arrayBuffer() : inks[0].slice(0);
		// The original's hash is BEST EFFORT and the ink is not: `crypto.subtle`
		// is absent outside a secure context, and losing it must cost a recorded
		// provenance line, never the singer's page.
		let originalHash = '';
		try {
			const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
			originalHash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
		} catch (err) {
			console.error('[ScoreUploader] page kept, but the original could not be hashed:', err);
		}
		lastKind = kind;
		lastPage = {
			clef: forAnswers.clef,
			octaveChange: forAnswers.octaveChange,
			fifths: forAnswers.fifths,
			originalName: file.name,
			originalHash,
			staffSpace: [],
		};
		return getPageReader().read(inks, {
			clef: [forAnswers.clef.sign, forAnswers.clef.line],
			key: forAnswers.fifths,
			octaveChange: forAnswers.octaveChange,
			pieceId: await pieceIdFor(file),
		});
	}

	/**
	 * N.59 step 7. The greyscale ink of the last picture read, and the answers
	 * it was read with, so the owner can store them and restore without asking
	 * again. Held here because this component is the only one that ever sees
	 * the singer's bytes, which is why N.67 step 2 put the restore here too.
	 */
	let lastInk: ArrayBuffer | null = null;
	let lastPage: PageProvenance | null = null;
	let lastKind: 'image' | 'pdf' | null = null;

	/**
	 * N.97. The clef and key signature this page PRINTS, or null.
	 *
	 * Only the FIRST page is probed, because the prompt asks one question about
	 * the whole upload and the first page is what a singer looking at their
	 * paper will check it against. A multi-page PDF therefore rasterizes page 1
	 * twice, once here and once for the read; that cost is named rather than
	 * traded for a cache that would have to stay in step with the read's own
	 * rasterizing.
	 *
	 * NOTHING HERE CAN FAIL THE UPLOAD. Every failure path returns null, the
	 * prompt asks the way it always did, and the read that follows reports its
	 * own errors in its own words.
	 */
	async function probeFile(file: File): Promise<ClefKeyProbe | null> {
		try {
			const kind = await readableKind(file);
			let ink: ArrayBuffer;
			if (kind === 'pdf') {
				const { rasterizePdf } = await import('./engine/page-pdf');
				const pages = await rasterizePdf(file, 1);
				if (pages.length === 0) return null;
				ink = pages[0];
			} else {
				ink = await toGreyscalePng(file);
			}
			return await getPageReader().probe(ink);
		} catch (err) {
			console.error('[ScoreUploader] the clef and key probe failed; asking instead:', err);
			return null;
		}
	}

	/** The singer pressed "Read this page". */
	async function readAsked(): Promise<void> {
		if (ui.kind !== 'asking') return;
		await handleFile(ui.file, answers);
	}

	/**
	 * N.108-5. Accept a score that is standing at Continue, if one is.
	 *
	 * RULED BY DANN 2026-09-04: Transcribe and Continue to analysis are one
	 * action, *"one should invoke the other."* This is the half the drawer's
	 * Transcribe button reaches for. It returns whether it did anything, so
	 * the caller can say so; every other state, and there are seven, is a
	 * score that is not waiting on an answer and this must not disturb it.
	 *
	 * `accept()` ITSELF IS UNCHANGED, and that is deliberate: one press of
	 * Continue and one press of Transcribe now run the SAME line, so the two
	 * paths cannot drift apart into two behaviours.
	 */
	export function acceptWaiting(): boolean {
		if (ui.kind !== 'done') return false;
		accept();
		return true;
	}

	function accept(): void {
		if (ui.kind !== 'done') return;
		const page = pageFor(ui.ingested);
		oningested(ui.ingested, page ? inkFile(ui.file) : ui.file, 'upload', page ?? undefined);
		reset();
	}

	/** The page provenance for a reader arrival, with the measured spacing filled in. */
	function pageFor(ingested: IngestedScore): PageProvenance | null {
		if (ingested.provenance.via !== 'reader' || !lastPage) return null;
		return { ...lastPage, staffSpace: ingested.readReport?.staffSpace ?? [] };
	}

	/**
	 * What the owner stores. For a photograph that is the greyscale ink, because
	 * there is no better original to keep. For a PDF it is the PDF itself, kept
	 * under its own name and type.
	 */
	function inkFile(original: File): File {
		if (lastKind === 'pdf') {
			return new File([lastInk ?? new ArrayBuffer(0)], original.name, { type: 'application/pdf' });
		}
		const stem = original.name.replace(/\.[^.]+$/, '') || 'page';
		return new File([lastInk ?? new ArrayBuffer(0)], `${stem}.png`, { type: 'image/png' });
	}

	/**
	 * N.67 step 2. A song with a stored source re-ingests it on boot.
	 *
	 * No "Continue to analysis" step: the singer accepted this file already,
	 * and asking twice for the same score would be the tool forgetting. The
	 * busy label still shows, because a `.musx` really does take a conversion.
	 */
	onMount(async () => {
		if (!restore) return;
		const file = new File([restore.bytes], restore.fileName);
		// N.59 step 7: a stored picture carries its own answers, so restoring
		// never re-asks. Re-asking on every reload is the tool forgetting, which
		// is the same principle N.67 step 2's restore already states.
		await handleFile(file, restore.answers ?? undefined);
		if (ui.kind === 'done') {
			// 'restore', not 'upload': these bytes CAME from the vault, and
			// writing them back would be the tool rewriting what it just read.
			oningested(ui.ingested, ui.file, 'restore');
			reset();
		}
		// A stored source that no longer parses leaves its own error on screen,
		// which is the honest outcome: the song is still there, the score is not.
	});

	function reset(): void {
		ui = { kind: 'idle' };
		bannerDismissed = false;
	}

	/* ── Presentation mappings ──────────────────────────────────────── */

	function formatLabel(p: IngestProvenance): string {
		if (p.via === 'direct') {
			return p.format === 'mnx' ? T('upload.format.mnxDirect') : T('upload.format.musicxmlDirect');
		}
		if (p.via === 'mxl') return T('upload.format.mxl');
		if (p.via === 'denigma') return T('upload.format.musxDenigma');
		if (p.via === 'reader') {
			return T(p.sourceFormat === 'pdf' ? 'upload.format.pdfReader' : 'upload.format.imageReader');
		}
		return T('upload.format.msczWebmscore'); // via === 'webmscore'
	}

	/** Map a typed ingest error to user copy, and flag the "coming soon" cases
	 *  so they render as a calm note rather than an error. CONVERSION_FAILED
	 *  and WASM_LOAD_FAILED are shared between the denigma (.musx) and
	 *  webmscore (.mscz) paths, so the dropped file's kind picks the copy. */
	function classify(err: IngestError, isMscz = false): { soon: boolean; message: string } {
		switch (err.code) {
			case 'DETECTION_FAILED': {
				const f = err.failure;
				switch (f.kind) {
					case 'pre-2014-finale':
						return { soon: false, message: T('upload.err.mus') };
					case 'midi':
						return { soon: false, message: T('upload.err.midi') };
					case 'json-not-mnx':
						return { soon: false, message: T('upload.err.jsonNotMnx') };
					case 'xml-not-musicxml': {
						const base = T('upload.err.xmlNotMusicxml');
						return {
							soon: false,
							message: f.rootElement
								? `${base} ${T('upload.err.xmlRootIs').replace('%s', f.rootElement)}`
								: base,
						};
					}
					case 'zip-unrecognised':
						return { soon: false, message: T('upload.err.zipUnrecognised') };
					default:
						return { soon: false, message: T('upload.err.unrecognised') };
				}
			}
			case 'CONTAINER_UNREADABLE':
				return {
					soon: false,
					message: T(err.container === 'mxl' ? 'upload.err.mxlUnreadable' : 'upload.err.msczUnreadable'),
				};
			case 'MXL_NO_ROOTFILE':
				return { soon: false, message: T('upload.err.mxlNoRootfile') };
			case 'INVALID_MNX_JSON':
				return { soon: false, message: T('upload.err.invalidMnxJson') };
			case 'PARSE_FAILED':
				return { soon: false, message: T('upload.err.parseFailed') };
			case 'MSCZ_CONVERTER_UNAVAILABLE':
				return { soon: true, message: T('upload.soon.mscz') };
			case 'PAGE_READER_UNAVAILABLE':
			case 'PAGE_READER_LOAD_FAILED':
				return { soon: false, message: T('upload.err.readerLoadFailed') };
			case 'PAGE_READ_FAILED':
				return { soon: false, message: T('upload.err.pageReadFailed') };
			case 'IMAGE_UNDECODABLE':
				return { soon: false, message: T('upload.err.imageUndecodable') };
			case 'PDF_UNREADABLE':
				return { soon: false, message: T('upload.err.pdfUnreadable') };
			case 'PDF_JBIG2_UNDECODED':
				return { soon: false, message: T('upload.err.pdfJbig2') };
			case 'CONVERSION_FAILED':
				return {
					soon: false,
					message: T(isMscz ? 'upload.err.msczConversionFailed' : 'upload.err.conversionFailed'),
				};
			case 'WASM_LOAD_FAILED':
				return {
					soon: false,
					message: T(isMscz ? 'upload.err.msczWasmLoadFailed' : 'upload.err.wasmLoadFailed'),
				};
			case 'SCORE_TOO_LARGE_FOR_DEVICE':
				return {
					soon: false,
					message: `${T('upload.err.tooLarge')}${err.suggestedAction ? ` ${err.suggestedAction}` : ''}`,
				};
			default:
				return { soon: false, message: T('upload.err.unrecognised') };
		}
	}

	const bannerTier = $derived(
		ui.kind === 'done' && !bannerDismissed ? fidelityBanner(ui.ingested.provenance) : null
	);
	const showBanner = $derived(bannerTier !== null);
	const readReport = $derived<ReadReport | null>(
		ui.kind === 'done' ? (ui.ingested.readReport ?? null) : null
	);
	const measureList = (subs: { measureIndex: number; count: number }[]): string =>
		subs.map((x) => x.measureIndex + 1).join(', ');
	const subTotal = (subs: { measureIndex: number; count: number }[]): number =>
		subs.reduce((n, x) => n + x.count, 0);
</script>

<div class="uploader">
	<!-- THE IDLE BRANCH IS EMPTY (N.108 increment 2), and that is the shape of
	     the change rather than a hole in it. This component drew the score
	     intake; the drawer has one intake now and `RootPanel` draws it. What
	     stood here was the dropzone with its watermark and one placeholder
	     sentence, the scan icon, the format list, and the hidden file input.
	     Every one of them has a successor in `RootPanel`'s field, and the two
	     rulings they carried are recorded at the top of this file.

	     SO THIS COMPONENT RENDERS NOTHING UNTIL A FILE ARRIVES, and everything
	     it renders after that is an answer about that file: the PDF question,
	     the clef and key question, the wait, the read report, the refusals. It
	     is mounted inside the intake, so every one of them appears where the
	     file landed. -->
	{#if ui.kind === 'askKind'}
		<!-- N.108 increment 2. THE ONE QUESTION THE BYTES CANNOT ANSWER, asked
		     once, in place, per the build brief §3: "A PDF asks once, in place,
		     which it is. Do not guess."

		     N.108 increment 4: A PICTURE ASKS IT TOO. Only the title changes,
		     because only the noun does; `intake.pdf.why`, `intake.pdf.poem` and
		     `intake.pdf.score` name no format and are reused word for word. The
		     poem answer runs OCR on a picture and a text extraction on a PDF,
		     which is the whole of the difference and it is behind the button.

		     TWO ANSWERS AND A WAY OUT, in the shape the clef-and-key prompt
		     below already uses, because it is the same kind of thing: a file is
		     held, nothing is mutated, and the singer decides. Cancel is
		     `upload.ask.cancel`, that prompt's own ratified string.

		     THE FILE NAME IS SHOWN, because a singer who dropped two files in a
		     row must be able to see which one is being asked about. -->
		<div class="ask">
			<p class="ask-title">{ui.picture ? T('intake.picture.title') : T('intake.pdf.title')}</p>
			<p class="ask-why">{T('intake.pdf.why').replace('%s', ui.file.name)}</p>
			<div class="result-actions">
				<button type="button" class="btn-secondary" onclick={reset}>{T('upload.ask.cancel')}</button>
				<button
					type="button"
					class="btn-secondary"
					onclick={() => {
						const asked = ui as { file: File; picture: boolean };
						void (asked.picture ? readPictureAsPoem(asked.file) : readPdfAsPoem(asked.file));
					}}
				>
					{T('intake.pdf.poem')}
				</button>
				<button type="button" class="btn-primary" onclick={() => void handleFile((ui as { file: File }).file)}>
					{T('intake.pdf.score')}
				</button>
			</div>
		</div>
	{:else if ui.kind === 'asking'}
		<!-- N.59, Ruling A, as amended by N.97. Two things the reader now READS
		     off the page and asks the singer to confirm. The drawer manipulates,
		     so the control is lawful here; nothing about this appears on the
		     paper.

		     WHERE THE READ ABSTAINED THE OLD PROMPT RETURNS, word for word:
		     `detected` is null, the two frame strings are `upload.ask.*` again,
		     and the defaults are treble and no accidentals with the octave-down
		     treble one tap away. Every other string in this block is shared by
		     both, because only the frame changed and not the question. -->
		<div class="ask">
			<p class="ask-title">{ui.detected ? T('upload.confirm.title') : T('upload.ask.title')}</p>
			<p class="ask-why">{ui.detected ? T('upload.confirm.why') : T('upload.ask.why')}</p>
			<label class="ask-field">
				<span class="ask-label">{T('upload.ask.clef')}</span>
				<select class="ask-select" bind:value={clefChoice}>
					{#each CLEF_CHOICES as choice, i (choice.key)}
						<option value={i}>{T(choice.key)}</option>
					{/each}
				</select>
			</label>
			<label class="ask-field">
				<span class="ask-label">{T('upload.ask.key')}</span>
				<select class="ask-select" bind:value={fifths}>
					{#each FIFTHS_CHOICES as n (n)}
						<option value={n}>{fifthsLabel(n)}</option>
					{/each}
				</select>
			</label>
			<div class="result-actions">
				<button type="button" class="btn-secondary" onclick={reset}>{T('upload.ask.cancel')}</button>
				<button type="button" class="btn-primary" onclick={readAsked}>{T('upload.ask.read')}</button>
			</div>
		</div>
	{:else if ui.kind === 'busy'}
		<div class="status">
			<span class="spinner"></span>
			<span class="status-label">{ui.label}</span>
		</div>
	{:else if ui.kind === 'done'}
		<div class="result">
			<p class="format-label">{formatLabel(ui.ingested.provenance)}</p>
			{#if showBanner}
				<div class="banner">
					<p class="banner-text">
						{bannerTier === 'reader' ? T('upload.banner.reader') : T('upload.banner.denigma')}
					</p>
					<button type="button" class="banner-dismiss" onclick={() => (bannerDismissed = true)}>
						{T('upload.banner.dismiss')}
					</button>
				</div>
			{/if}
			{#if readReport}
				<!-- N.59, Ruling D. The read report lives in the DRAWER and counts
				     every substitution. Nothing is marked on the page: a mark that
				     appears on everything says nothing (E.47's strike). -->
				<div class="read-report">
					<p class="report-title">{T('upload.report.title')}</p>
					<p class="report-line">
						{T('upload.report.systems')
							.replace('%s', String(readReport.systems))
							.replace('%s', String(readReport.staves))}
					</p>
					<p class="report-line">
						{T('upload.report.events')
							.replace('%s', String(readReport.notes))
							.replace('%s', String(readReport.rests))
							.replace('%s', String(readReport.measures))}
					</p>
					<p class="report-line">
						{T('upload.report.spacing').replace(
							'%s',
							readReport.staffSpace.map((v) => v.toFixed(1)).join(', ')
						)}
					</p>
					<p class="report-line">
						{T('upload.report.seconds').replace('%s', readReport.readSeconds.toFixed(1))}
					</p>
					{#if readReport.pitchSubstitutions.length > 0}
						<p class="report-sub">
							{T('upload.report.pitchSubs')
								.replace('%s', String(subTotal(readReport.pitchSubstitutions)))
								.replace('%s', measureList(readReport.pitchSubstitutions))}
						</p>
					{/if}
					{#if readReport.durationSubstitutions.length > 0}
						<p class="report-sub">
							{T('upload.report.durationSubs')
								.replace('%s', String(subTotal(readReport.durationSubstitutions)))
								.replace('%s', measureList(readReport.durationSubstitutions))}
						</p>
					{/if}
					<!-- N.96 ship 1b. Named FIRST among the report's caveats, because a
					     page nobody read is a bigger fact about this upload than any
					     per-note assumption below it. One line per failed page: the
					     ruled string takes one page number, and rendering it twice
					     beats coining a plural nobody approved. -->
					{#each readReport.failedPages as pageNo (pageNo)}
						<p class="report-sub">
							{T('upload.report.pageFailed').replace('%s', String(pageNo))}
						</p>
					{/each}
					{#if readReport.staffSelectionFallbacks > 0}
						<p class="report-sub">
							{T('upload.report.staffFallback').replace(
								'%s',
								String(readReport.staffSelectionFallbacks)
							)}
						</p>
					{/if}
				</div>
			{/if}
			<div class="result-actions">
				<button type="button" class="btn-secondary" onclick={reset}>{T('upload.tryAnother')}</button>
				<button type="button" class="btn-primary" onclick={accept}>{T('upload.continue')}</button>
			</div>
		</div>
	{:else if ui.kind === 'soon'}
		<div class="note">
			<p class="note-text">{ui.message}</p>
			<button type="button" class="btn-secondary" onclick={reset}>{T('upload.tryAnother')}</button>
		</div>
	{:else if ui.kind === 'error'}
		<div class="error">
			<p class="error-text">{ui.message}</p>
			<button type="button" class="btn-secondary" onclick={reset}>{T('upload.tryAnother')}</button>
		</div>
	{/if}

	<!-- THE HIDDEN FILE INPUT LEFT WITH THE DROPZONE (N.108 increment 2). One
	     intake means one picker, and `RootPanel` holds it, along with the
	     `accept` rule N.70 wrote for it. -->

	<!-- THE OLDER-FINALE DISCLOSURE IS GONE. Dann's ruling, 2026-08-20 on his
	     walk: "Let's eliminate the 'have an older Finale file' subsection. It
	     is useless. That will let the button row beneath it snug up to the
	     input like the buttons and input field above it."

	     IT WAS REDUNDANT, WHICH IS WHY THIS IS NOT A LOSS. Dropping a `.mus`
	     file already returns `upload.err.mus`, which carries the same two
	     live options: resave as `.musx` in Finale 2014 or later, or export to
	     MusicXML. Its third option was "print to PDF and upload the PDF (PDF
	     import is coming soon)", and PDF import has since shipped, so PDF is
	     named in the drop zone's own sentence. That path is untouched:
	     `format-detection.ts` still returns `pre-2014-finale` for a `.mus`
	     and `:421` above still renders `upload.err.mus`.

	     The trial-version line is the only sentence with no other home, and
	     it went with the block rather than being rehoused unasked. -->
</div>

<style>
	.uploader {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		/* Match the Transcription textarea-wrapper's 8px top margin, so the
		   input box sits the same 14px below the metadata on both tabs. */
		margin-top: 8px;
		font-family: var(--font-sans);
	}

	/* ── THE DROPZONE'S RULES LEFT WITH IT (N.108 increment 2) ──
	   `.dropzone`, `.dropzone:hover`, `.dropzone.dragging`, `.dz-wrap`,
	   `.dz-formats`, `.dz-placeholder`, `.scan-btn` and `.scan-btn:hover` are
	   deleted with the markup they dressed. Svelte scopes a rule to the file
	   that writes the markup, and the markup is `RootPanel`'s field now.

	   THREE OF DANN'S RULINGS WERE DECLARED IN THEM, and here is where each
	   went:
	   - The placeholder top left, at the field size, in the textarea's exact
	     treatment (2026-08-20 and 2026-08-21, asked four times): the one field
	     IS the textarea, so the treatment is the textarea's by construction and
	     no second box has to be made to look like it.
	   - Three quarters of 152px (2026-08-20): there is no second box to size.
	     The one field keeps `.text-input`'s own `calc(6.75em + 13.5px)`, which
	     is the same ruling applied to the field that survived.
	   - Lavender names the score intake and sage names the text intake
	     (2026-07-13, ratified since): SPENT, not reversed. Hue names place, and
	     there is one place. The one field takes the neutral dashed frame Design
	     drew for it in the r2 prototype at `:190`; the memo says so and it is
	     Dann's to rule on the walk.

	/* ── Busy status ──────────────────────────────────────── */

	.status {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-height: 132px;
		justify-content: center;
	}

	.status-label {
		font-size: 0.85rem;
		color: var(--ink-secondary);
	}

	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid var(--stone-300);
		border-top-color: var(--sage);
		border-radius: 50%;
		animation: uploader-spin 0.8s linear infinite;
	}

	@keyframes uploader-spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ── Result ───────────────────────────────────────────── */

	.result {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.format-label {
		font-size: 0.75rem;
		color: var(--ink-tertiary);
	}

	.banner {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.6rem 0.7rem;
		border-left: 3px solid #7c6bb0; /* lavender, denigma tier (Round 9 Item 1) */
		background: rgba(124, 107, 176, 0.08);
		border-radius: 3px;
	}

	.banner-text {
		font-size: 0.75rem;
		line-height: 1.45;
		color: var(--ink-secondary);
	}

	.banner-dismiss {
		align-self: flex-end;
		font-size: 0.72rem;
		color: var(--ink-tertiary);
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.banner-dismiss:hover {
		color: var(--ink-secondary);
	}

	.result-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	/* ── Note (coming soon) and error ─────────────────────── */

	.note,
	.error {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-start;
		padding: 0.7rem;
		border-radius: 4px;
	}

	.note {
		background: rgba(0, 0, 0, 0.03);
	}

	.note-text {
		font-size: 0.8rem;
		color: var(--ink-secondary);
	}

	.error {
		background: rgba(217, 119, 6, 0.06);
	}

	.error-text {
		font-size: 0.8rem;
		color: #b45309;
		line-height: 1.4;
	}

	/* ── Buttons ──────────────────────────────────────────── */

	/* PILL ENDS, N.108 increment 4. Ruled by Dann 2026-09-03 from the
	   calibration ritual's own two buttons (`CalibrationWizard.svelte`'s
	   `.wizard-primary` and `.wizard-secondary`, `border-radius: 999px`):
	   "The buttons shown here can form the template. Can we make other
	   buttons share its rounded ends?" Only the corners move; the fill, the
	   border, the type and the padding are untouched.

	   Both answers to every question this component asks, the PDF and picture
	   kind question included. */
	.btn-primary,
	.btn-secondary {
		padding: 0.4rem 0.7rem;
		font-family: var(--font-sans);
		font-size: 0.78rem;
		font-weight: 600;
		border-radius: 999px;
		cursor: pointer;
		border: none;
		transition: opacity 0.12s;
	}

	.btn-primary {
		color: white;
		background: var(--sage);
	}

	.btn-secondary {
		color: var(--ink-secondary);
		background: white;
		border: 1px solid var(--stone-300);
	}

	.btn-primary:hover,
	.btn-secondary:hover {
		opacity: 0.85;
	}

	/* The older-Finale guidance's six rules went with its markup, Dann's
	   ruling 2026-08-20. Its `.mus-help` also carried the drop zone's only
	   `border-top: 1px solid var(--stone-300)`, which is the line that stood
	   between the score box and the Output row. */

	/* ── N.59: the two questions, and the read report ──────── */

	.ask,
	.read-report {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.75rem;
		border: 1px solid var(--rule);
		border-radius: 4px;
		background: var(--paper-cream);
	}

	.ask-title,
	.report-title {
		margin: 0;
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--ink);
	}

	.ask-why {
		margin: 0 0 0.25rem;
		font-size: 0.82rem;
		line-height: 1.4;
		color: var(--ink-soft, var(--ink));
	}

	.ask-field {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		font-size: 0.85rem;
	}

	.ask-label {
		color: var(--ink);
	}

	/* The 44px floor is the cursor's alone (CONTRACT, corrected 2026-08-14),
	   but a select is a real touch target and takes it. */
	.ask-select {
		min-height: 44px;
		flex: 1 1 auto;
		max-width: 62%;
		padding: 0 0.5rem;
		font-family: inherit;
		font-size: 0.85rem;
		color: var(--ink);
		background: var(--paper);
		border: 1px solid var(--rule);
		border-radius: 3px;
	}

	.report-line,
	.report-sub {
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.4;
		color: var(--ink-soft, var(--ink));
	}

	.report-sub {
		color: var(--ink);
	}
</style>
