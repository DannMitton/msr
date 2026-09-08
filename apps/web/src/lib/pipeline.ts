/**
 * Text processing pipeline for Ilya.
 *
 * This module orchestrates the three Phase 1 packages to transform
 * Russian text into fully annotated transcription data. It replicates
 * the prototype's InputManager.transcribe() + InputManager.transcribeAllLines()
 * logic as a single processText() function.
 *
 * Architectural guardrail: this file is the ONLY place in the app
 * that imports from @ilya/phonology, @ilya/dictionary, and @ilya/blurb.
 * Components receive prepared data via props.
 */

import {
  GraysonEngine,
  DEFAULT_ENGINE_CONFIG,
  resolveCliticChain,
} from '@ilya/phonology';
import type {
  EngineConfig,
  TranscriptionResult,
  SyllableData,
  ProcliticPosition,
} from '@ilya/phonology';

import {
  formatGlossForDisplay,
  extractGloss,
  addStressMarkToCyrillic,
  lookupFullEntry,
  normalizePoetic,
  hasAbolishedLetter,
  modernisePreReform,
  restoreCasing,
} from '@ilya/dictionary';
import type { GlossLanguage, BilingualGloss, DictionaryEntry } from '@ilya/dictionary';

import { buildDisplayLog } from '@ilya/blurb';

import { applyReconstitution } from './reconstitution';

import type { WordStackData, LineData, ProcessTextOptions, UserStressOverride, YoToggle } from './types';

// ── Constants ────────────────────────────────────────────────────

const PUNCTUATION_REGEX = /[.,!?;:"""''–—…()«»]/g;
const TRAILING_PUNCT_REGEX = /[.,!?;:"""''\-–—]+$/;
const DASH_REGEX = /[-–—]/g;

const CYRILLIC_VOWELS = new Set([
  'а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я',
  'А', 'Е', 'Ё', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я',
]);

function hasVowel(word: string): boolean {
  return Array.from(word).some((char) => CYRILLIC_VOWELS.has(char));
}

// Hyphenated enclitic particles that should be split from their host
// word for independent lookup and enclitic treatment. Lowercase forms
// only; matching is case-insensitive.
const HYPHENATED_PARTICLES = new Set(['ли', 'ль', 'бы', 'б', 'же', 'ж']);

/**
 * Expand hyphenated particles into separate tokens.
 *
 * "велит-ли" → ["велит-", "ли"]  (hyphen preserved on host for display)
 * "места-б," → ["места-", "б,"]  (trailing punct stays on particle)
 * "кое-что"  → ["кое-что"]       (unchanged: "что" is not a particle)
 *
 * Splits on the LAST hyphen only. The hyphen character stays on the
 * host word as trailing punctuation so the Paper faithfully renders
 * the source text.
 */
function expandHyphenatedParticles(tokens: string[]): string[] {
  const result: string[] = [];
  for (const token of tokens) {
    // Find the last hyphen (regular, en-dash, or em-dash)
    const lastHyphen = Math.max(
      token.lastIndexOf('-'),
      token.lastIndexOf('–'),
      token.lastIndexOf('—'),
    );
    if (lastHyphen > 0 && lastHyphen < token.length - 1) {
      const before = token.slice(0, lastHyphen + 1); // includes hyphen
      const after = token.slice(lastHyphen + 1);
      // Strip trailing punctuation from the suffix to test against particle set
      const afterClean = after.replace(TRAILING_PUNCT_REGEX, '').toLowerCase();
      if (HYPHENATED_PARTICLES.has(afterClean)) {
        result.push(before, after);
        continue;
      }
    }
    result.push(token);
  }
  return result;
}

// ── Intermediate types (internal to pipeline) ────────────────────

/** Word data after stress lookup, before engine transcription. */
interface PreTranscribeWord {
  cyrillic: string;
  cleanWord: string;
  punctuation: string;
  stress: number;
  stressSource: string;
  gloss: string | BilingualGloss | undefined;
  pos: string;
  lemma: string;
  isHomograph: boolean;
  originalInput: string | null;
  dictionaryForm: string | null;
  /**
   * The spelling the engraver set, when N.12 modernised a pre-1918 form at
   * intake; null otherwise. NOT for display: the page prints the modernised
   * form. This retains the score's witness so the change is recoverable, and it
   * is the homograph disambiguator the reform destroyed, because миръ and міръ
   * both print мир today. Consuming it for the homograph pick is NOT built.
   *
   * Deliberately a field of its own rather than a second use of `originalInput`,
   * which belongs to ё restoration. A word can be both, and one field cannot
   * carry two reasons.
   */
  preReformSource: string | null;
  yoSource: string | null;
  hasYo: boolean;
  rightBoundary: 'hard' | 'soft' | 'clitic';
  boundarySource: 'user' | 'auto' | 'punctuation';
  /** Engine's original stress (before any user override). */
  originalStress: number;
  /** Engine's original stress source (before any user override). */
  originalStressSource: string;
  /** Whether ё ↔ е toggle is available (both forms exist independently). */
  yoAlternation: boolean;
  /** The other form (not currently displayed) for ё ↔ е toggle. */
  yoAlternateForm: string | null;
  /** True when a clitic has been promoted to independent word via user stress assignment. */
  promotedFromClitic?: boolean;
}

/** Word data after engine transcription, used for cross-word assimilation. */
interface TranscribedWord {
  wordData: PreTranscribeWord;
  wordIdx: number;
  lineIdx: number;
  /** Flattened from wordData.cyrillic; GraysonEngine.applyCrossWordAssimilation
   * expects BoundaryWord, which requires cyrillic at the top level. */
  cyrillic: string;
  cleanWord: string;
  punct: string;
  isProclitic: boolean;
  isEnclitic: boolean;
  isOInterjection: boolean;
  isFirstWord: boolean;
  lineEndsWithQuestion: boolean;
  procliticPosition: ProcliticPosition;
  hasYo: boolean;
  /** Raw engine result (syllables and transcriptionLog may be mutated in place). */
  engineResult: TranscriptionResult;
  syllables: SyllableData[];
  ipaUnderlying: string;
  transcriptionLog: any[];
  /** Placeholder until GraysonEngine.applyCrossWordAssimilation() runs; that
   * call unconditionally overwrites this with ipaUnderlying before anything
   * else in the pipeline reads it, so the placeholder itself is never observed. */
  ipaSurface: string;
  skipFinalDevoicing: boolean;
  rightBoundary: 'hard' | 'soft' | 'clitic';
  boundarySource: 'user' | 'auto' | 'punctuation';
  ipaContent?: string;
  ipaDisplay?: string;
  ipaReconstituted?: string;
  ipaOwnReconstituted?: string;
  isVowellessClitic?: boolean;
}

// ── Main pipeline ────────────────────────────────────────────────

/**
 * Process Russian text into fully annotated transcription data.
 *
 * This is the single entry point for the transcription loop.
 * Call it when the user clicks Transcribe.
 *
 * @param text - Raw Russian text (may contain multiple lines)
 * @param options - Engine config and display language
 * @returns Array of LineData, one per non-empty input line
 */
/**
 * Step 1 of `processText`, lifted out whole so N.112's word diff can ask what
 * the words ARE without transcribing them.
 *
 * IT IS LIFTED RATHER THAN COPIED, and that is the whole point. The diff has
 * to agree with the pipeline about what counts as a word, down to the
 * punctuation set, the hyphenated-particle split, the ё restoration and N.12's
 * pre-1918 modernisation. A second tokenizer would agree on the day it was
 * written and drift the first time any of those five moved.
 *
 * ONE CALLER PAIR, and no behaviour change: `processText` calls this exactly
 * where the block used to sit, and `wordGrid` calls it to read `cleanWord`.
 */
function splitIntoPreLines(
  allRawLines: readonly string[],
): { rawIndex: number; words: PreTranscribeWord[] }[] {
  return allRawLines
    .map((line, rawIndex) => ({ line, rawIndex }))
    .filter((entry) => entry.line.trim())
    .map((entry) => {
      const words = entry.line
        .trim()
        .split(/\s+/)
        .filter((word) => {
          const cleaned = word.replace(PUNCTUATION_REGEX, '');
          return cleaned.length > 0;
        });

      // Expand hyphenated particles into separate tokens before lookup
      const expanded = expandHyphenatedParticles(words);

      return {
        rawIndex: entry.rawIndex,
        words: expanded.map((word) => buildPreTranscribeWord(word)),
      };
    })
    .filter((entry) => entry.words.length > 0);
}

/**
 * The poem's words, cleaned, line by line, in the pipeline's own reckoning.
 *
 * N.112. THIS IS THE IDENTITY THE WHOLE ITEM TURNS ON: `[lineIndex][wordIndex]`
 * here is the same coordinate the override maps key on
 * (`+page.svelte`'s `"lineIndex-wordIndex"`) and the same one `SlotOrigin`
 * records, so a diff computed over this grid re-keys both without a second
 * mapping in between.
 *
 * IT READS THE WORD BEFORE ANY OVERRIDE TOUCHES IT, which is why it takes the
 * raw text rather than `LineData[]`. `processText`'s step 1.5 applies the ё
 * toggles, and a ё toggle CHANGES `cleanWord` (е ↔ ё). Diffing the transcribed
 * lines would therefore compare the singer's marks as though they were their
 * text, and a toggle would read as a word replaced. The grid is the text and
 * nothing else.
 *
 * An empty or whitespace-only poem is an empty grid, matching `processText`.
 */
export function wordGrid(text: string): string[][] {
  if (!text.trim()) return [];
  return splitIntoPreLines(text.split('\n')).map((entry) =>
    entry.words.map((w) => w.cleanWord),
  );
}

export function processText(
  text: string,
  options: ProcessTextOptions = {},
): LineData[] {
  const {
    engineConfig = DEFAULT_ENGINE_CONFIG,
    language = 'en' as GlossLanguage,
    userStressOverrides,
    yoToggles,
  } = options;

  if (!text.trim()) return [];

  // ── Step 1: Split into lines, build pre-transcribe word data ──

  // N.73 portrait C. The raw split is kept so a line can be asked what
  // FOLLOWED it in the singer's text. Blank lines are still dropped from the
  // document; they are read once, here, and recorded as `endsStanza`, because
  // no other part of the tree remembers where a poem breaks.
  const allRawLines = text.split('\n');

  const preEntries = splitIntoPreLines(allRawLines);

  const preLines: PreTranscribeWord[][] = preEntries.map((entry) => entry.words);

  /** True where the singer's next raw line is blank. Nothing else is read. */
  const endsStanza: boolean[] = preEntries.map((entry) => {
    const next = allRawLines[entry.rawIndex + 1];
    return next !== undefined && next.trim() === '';
  });

  // ── Step 1.5: Apply user overrides and yo toggles ────────────

  if (userStressOverrides?.size || yoToggles?.size) {
    preLines.forEach((line, lineIdx) => {
      for (let wordIdx = 0; wordIdx < line.length; wordIdx++) {
        const wordKey = `${lineIdx}-${wordIdx}`;

        // Apply character-level yo toggles first (changes individual е ↔ ё)
        if (yoToggles?.size) {
          const prefix = `${wordKey}-`;
          const wordToggles: number[] = [];
          for (const key of yoToggles.keys()) {
            if (key.startsWith(prefix)) {
              const charIdx = parseInt(key.substring(prefix.length), 10);
              if (!isNaN(charIdx)) {
                wordToggles.push(charIdx);
              }
            }
          }
          if (wordToggles.length > 0) {
            // Swap е ↔ ё at specified character positions in the cyrillic string,
            // then rebuild the PreTranscribeWord with yo-restoration suppressed
            // so the pipeline doesn't auto-restore ё on top of a user's toggle.
            const cyrillic = line[wordIdx].cyrillic;
            const chars = Array.from(cyrillic);
            // Map from cleanWord index to cyrillic index (skipping punctuation/dashes)
            let cleanIdx = 0;
            for (let ci = 0; ci < chars.length; ci++) {
              const isPunct = /[.,!?;:"""''–—\-«»]/.test(chars[ci]);
              if (isPunct) continue;
              if (wordToggles.includes(cleanIdx)) {
                switch (chars[ci]) {
                  case 'е': chars[ci] = 'ё'; break;
                  case 'ё': chars[ci] = 'е'; break;
                  case 'Е': chars[ci] = 'Ё'; break;
                  case 'Ё': chars[ci] = 'Е'; break;
                }
              }
              cleanIdx++;
            }
            const modified = chars.join('');
            line[wordIdx] = buildPreTranscribeWord(modified, true);
          }
        }

        // Apply stress override on top of current form
        const override = userStressOverrides?.get(wordKey);
        if (override) {
          line[wordIdx].stress = override.stressIndex;
          line[wordIdx].stressSource = override.stressSource;
          if (override.promotedFromClitic) {
            line[wordIdx].promotedFromClitic = true;
          }
        }
      }
    });
  }

  // ── Step 2: Auto-detect boundaries per line ───────────────────

  preLines.forEach((line) => {
    autoDetectBoundaries(line);
  });

  // ── Step 3: Transcribe each line with cross-word assimilation ─

  const lineDataArray: LineData[] = preLines.map((preLine, lineIdx) => {
    const transcribedWords = transcribeLine(preLine, lineIdx, engineConfig);

    // ── Step 4: Build final WordStackData for each word ─────────

    const wordStackDataArray: WordStackData[] = transcribedWords.map(
      (tw, wordIdx) => {
        const displayLog = buildDisplayLog(tw.transcriptionLog);

        // Gloss: clitics use their canonical gloss; regular words use the pipeline
        let gloss: string;
        if (tw.isProclitic || tw.isEnclitic) {
          const cliticEntry = GraysonEngine.cliticData.get(
            tw.cleanWord.toLowerCase(),
          );
          gloss = extractGloss(cliticEntry?.gloss ?? null, language);
        } else {
          gloss = formatGlossForDisplay(
            tw.wordData.gloss,
            tw.wordData.pos,
            tw.wordData.lemma,
            tw.cleanWord,
            language,
          );
        }

        const stressedCyrillic = addStressMarkToCyrillic(
          tw.cleanWord,
          tw.syllables,
        );

        // Derive effective stress from engine syllables (monosyllable normalization).
        // The engine correctly marks monosyllables as stressed on syllable 0,
        // but the pre-engine lookup may have -2 (unknown). Use engine truth.
        const effectiveStressIndex = tw.syllables.findIndex(s => s.isStressed);

        // ── Dictionary panel: full entry lookup ──────────────────
        // Retrieve the raw dictionary entry with E/F (full gloss) fields
        // for the Inspector's Dictionary expansion panel.
        const rawEntry = lookupFullEntry(tw.cleanWord);
        let fullGlossEn = '';
        let fullGlossFr = '';
        let allDictEntries: DictionaryEntry[] | null = null;
        /** N.14c: the homograph reading the singer's stress selects, if any. */
        let matchedEntry: DictionaryEntry | null = null;

        if (rawEntry) {
          if (Array.isArray(rawEntry)) {
            // Homograph: array of entries
            allDictEntries = rawEntry;
            // Use the stress-matched entry for primary display
            const matched = rawEntry.find(
              (ent: DictionaryEntry) => (ent.s ?? ent.stress) === (effectiveStressIndex >= 0 ? effectiveStressIndex : tw.wordData.stress)
            );
            matchedEntry = matched ?? null;
            const primary = matched || rawEntry[0];
            fullGlossEn = (primary as any).E || (primary as any).e || '';
            fullGlossFr = (primary as any).F || (primary as any).f || '';
          } else {
            // Single entry
            allDictEntries = [rawEntry];
            fullGlossEn = (rawEntry as any).E || (rawEntry as any).e || '';
            fullGlossFr = (rawEntry as any).F || (rawEntry as any).f || '';
          }
        }

        // N.14c. The printed gloss must name the reading the singer chose.
        // buildWordData took its gloss from normalizeEntry, which returns
        // element 0 of a homograph array unconditionally (engine.ts:709), so
        // without this the page would carry the stress of one word above the
        // meaning of another. Non-homographs are untouched: there is one entry,
        // it is element 0, and matchedEntry is that same entry. A homograph the
        // singer has not touched is untouched too, because the effective stress
        // is still element 0's and it is the first entry carrying it.
        // Only a stress the SINGER set may move the printed gloss. Anything
        // else and a disagreement between singer-supplement.json, which is
        // consulted first (engine.ts:735), and the dictionary would rewrite the
        // page on load rather than on a tap. вода was the case that exposed
        // this: the supplement asserted stress 0 with the gloss "water" while
        // the dictionary holds вода́ at stress 1 for water and вóда at stress 0
        // for the tag-game sense, and a stress-only test printed "it". That
        // entry has since been removed from the supplement, so the example is
        // historical, but the guard is not: it holds for the next one.
        const chosenBySinger =
          typeof tw.wordData.stressSource === "string" &&
          tw.wordData.stressSource.startsWith("user-");
        if (
          chosenBySinger &&
          allDictEntries &&
          allDictEntries.length > 1 &&
          matchedEntry &&
          !tw.isProclitic &&
          !tw.isEnclitic
        ) {
          gloss = formatGlossForDisplay(
            (matchedEntry as any).g ?? (matchedEntry as any).gloss,
            matchedEntry.p ?? '',
            matchedEntry.l ?? '',
            tw.cleanWord,
            language,
          );
        }

        return {
          cyrillic: tw.wordData.cyrillic,
          cleanWord: tw.cleanWord,
          punctuation: tw.punct,
          stressIndex: effectiveStressIndex >= 0 ? effectiveStressIndex : tw.wordData.stress,
          stressSource: tw.wordData.stressSource,
          stressedCyrillic,
          originalStressIndex: tw.wordData.originalStress,
          originalStressSource: tw.wordData.originalStressSource,
          yoAlternation: tw.wordData.yoAlternation,
          yoAlternateForm: tw.wordData.yoAlternateForm,
          result: tw.engineResult,
          ipaDisplay: tw.ipaDisplay ?? tw.ipaContent ?? '',
          ipaReconstituted: tw.ipaReconstituted ?? tw.ipaDisplay ?? tw.ipaContent ?? '',
          ipaContent: tw.ipaContent ?? '',
          ipaOwnReconstituted: tw.ipaOwnReconstituted ?? tw.ipaContent ?? '',
          displayLog,
          syllables: tw.syllables,
          gloss,
          isProclitic: tw.isProclitic,
          isEnclitic: tw.isEnclitic,
          isVowellessClitic: tw.isVowellessClitic ?? false,
          hasYo: tw.hasYo,
          isOInterjection: tw.isOInterjection,
          rightBoundary: tw.rightBoundary,
          boundarySource: tw.boundarySource,
          pos: tw.wordData.pos,
          lemma: tw.wordData.lemma,
          isHomograph: tw.wordData.isHomograph,
          originalInput: tw.wordData.originalInput,
          dictionaryForm: tw.wordData.dictionaryForm,
          yoSource: tw.wordData.yoSource,
          fullGlossEn,
          fullGlossFr,
          allDictEntries,
          wordIndex: wordIdx,
          lineIndex: lineIdx,
        };
      },
    );

    return {
      lineNumber: lineIdx,
      words: wordStackDataArray,
      endsStanza: endsStanza[lineIdx] ?? false,
    };
  });

  return lineDataArray;
}

// ── Step 1 helper: stress lookup and ё restoration ──────────────

function buildPreTranscribeWord(rawWord: string, suppressYoRestore: boolean = false): PreTranscribeWord {
  // Normalize NFC so precomposed ё is preserved, then strip combining acutes
  const rawNormalized = rawWord.normalize('NFC').replace(/\u0301/g, '');

  // ── N.12: INTAKE MODERNISATION ──────────────────────────────────
  // Dann ruled on 2026-08-08 that a pre-1918 spelling is modernised HERE, at the
  // top, before anything downstream sees the word. One string then serves all
  // four jobs, and each is correct for the first time:
  //
  //   DISPLAY. Fit and Transcribe print дети. This keeps the promise Ilya already
  //   makes at `GuideContent.svelte:291`, "It automatically updates and normalises
  //   spelling", and the instruction its own Learn table gives the singer at
  //   `LearnContent.svelte:2124-2127`, "Substitute its modern counterpart."
  //
  //   TRANSCRIPTION. `cleanWord` below is what reaches `GraysonEngine.transcribe`,
  //   whose grapheme inventory (`engine.ts:232-233`) holds NO pre-reform letter
  //   and silently DELETES what it does not recognise. Measured in E.33: дѣти as
  //   printed gives `ˈttʲi`, because dropping ѣ leaves д beside т and the д
  //   assimilates. As дети it gives `ˈdʲetʲi`.
  //
  //   LOOKUP. The dictionary holds 12,119 pre-reform headwords, of which 2,756
  //   carry a stress index disagreeing with their modern twin and 926 mark a
  //   content word unstressed at -1. Modernising first reads the modern entry
  //   instead. Census: `claude/sonnet-memo-e33-pre-reform-dictionary-census_2026-08-08.md`.
  //
  //   PROVENANCE. `preReformSource` retains what the engraver set, so the change
  //   is quiet rather than invisible.
  //   THE DICTIONARY DISPOSES, AT DISPLAY AS WELL AS AT LOOKUP. Dann ruled on
  //   2026-08-08 that intake modernisation adopts its own output only when the
  //   modernised form is a word Ilya knows. This is the module's existing "the
  //   rule proposes, the dictionary disposes" discipline extended from the lookup
  //   to the page.
  //
  //   Without the gate, the 322 dictionary-attested words that need the
  //   morphological endings print a form that never existed in any orthography:
  //   большія → большия, однѣхъ → однех where the real modern form is одних.
  //   Gated, дети modernises and большія stays exactly as the engraver set it,
  //   which is at least historically true. Sized by the census at
  //   `claude/sonnet-memo-e33-pre-reform-dictionary-census_2026-08-08.md`.
  //
  //   The probe strips guillemets and a trailing dash to match `bareWord` below,
  //   because `lookupStress` strips punctuation and lowercases but does neither of
  //   those. A wholly modern word costs nothing here: `modernisePreReform` returns
  //   null and the lookup is never reached.
  const modernisedCandidate = modernisePreReform(rawNormalized);
  const candidateIsKnown =
    modernisedCandidate !== null &&
    GraysonEngine.lookupStress(
      modernisedCandidate.replace(/[«»]/g, '').replace(/[-–—]+$/, ''),
    ) !== null;
  const modernisedForm = candidateIsKnown ? modernisedCandidate : null;
  const word = modernisedForm ?? rawNormalized;
  const preReformSource = modernisedForm !== null ? rawNormalized : null;

  //   AND WHEN THE GATE DECLINES, ABSTAIN. Dann ruled on 2026-08-08 that a printed
  //   form still carrying an abolished letter gets no stress mark at all. It is a
  //   word Ilya could not resolve, so it says so, rather than borrowing the
  //   pre-reform entry's number: большіе's own entry gives stress 0 where большие
  //   gives 1, and the engine has already deleted the і from the IPA. The gloss is
  //   still trusted, because the census found the pre-reform and modern glosses
  //   agree where the stress values do not.
  const unresolvedPreReform =
    modernisedCandidate !== null && !candidateIsKnown && hasAbolishedLetter(word);

  // Strip guillemets and trailing hyphens for dictionary lookups only; word retains them for display
  const bareWord = word.replace(/[«»]/g, '').replace(/[-–—]+$/, '');

  // Extract trailing punctuation
  const trailingPunctMatch = word.match(TRAILING_PUNCT_REGEX);
  const punctuation = trailingPunctMatch ? trailingPunctMatch[0] : '';

  let lookup = GraysonEngine.lookupStress(bareWord);

  // Normalisation fallback, tried ONLY when the direct lookup above misses.
  // That ordering is the safety property the whole design rests on: a word
  // that is already modern resolves before any rule here can touch it.
  //
  // ONE normaliser remains here. N.12's pre-reform modernisation moved to intake
  // at the top of this function on Dann's ruling of 2026-08-08, so `bareWord` is
  // already modern by the time we arrive and a pre-reform candidate could never
  // differ from it. What is left is `normalizePoetic`, which undoes soft-sign
  // contractions (восстанье → восстание).
  //
  // The two are no longer siblings, and the asymmetry is why. A poetic
  // contraction is a spelling modern Russian actually uses, so the engine reads it
  // and the printed form is kept: measured in E.33, восстанье transcribes to
  // `vɑssˈtɑɲjɪ`, correct for what is printed, and only the LOOKUP needs
  // восстание. A pre-reform letter is a spelling Russian abandoned and the engine
  // has never heard of it, so only that one has its display changed.
  //
  // Every candidate is only a PROPOSAL. It becomes the answer solely by hitting
  // the 943,096-entry dictionary, which is what stops a rule from overreaching
  // onto a modern word that merely looks contracted.
  let normalizedToForm: string | null = null;
  if (!lookup) {
    const cleanForNormalize = bareWord.normalize('NFC').replace(/\u0301/g, '').replace(/[.,!?;:"""''–—]/g, '').toLowerCase();

    for (const candidate of normalizePoetic(cleanForNormalize)) {
      const normalized = GraysonEngine.lookupStress(candidate);
      if (normalized) {
        lookup = normalized;
        normalizedToForm = restoreCasing(bareWord, candidate);
        break;
      }
    }
  }

  let displayWord = word;
  let wasYoRestored = false;
  let dictionaryForm: string | null = null;

  if (!suppressYoRestore && lookup?.source === 'yo-restored' && lookup.canonicalForm) {
    const restored = GraysonEngine.applyCasePattern(bareWord, lookup.canonicalForm);
    dictionaryForm = restored;
    // Reattach guillemets for display fidelity
    const gl = word.startsWith('«') ? '«' : '';
    const gr = word.endsWith('»') ? '»' : '';
    displayWord = gl + restored + gr;
    wasYoRestored = true;
  }

  // Poetic normalisation: record the standard form for provenance
  if (!dictionaryForm && normalizedToForm) {
    dictionaryForm = normalizedToForm;
  }

  const yoSyllable = GraysonEngine.findYoSyllable(displayWord);

  let stress: number;
  let stressSource: string;
  let yoSource: string | null;

  if (unresolvedPreReform) {
    // Abstention, and it outranks ё detection: whatever the stress would have
    // been, the transcription below is built from a spelling the engine cannot
    // read, so no mark on it would be honest.
    stress = -2;
    stressSource = 'inferred';
    yoSource = null;
  } else if (yoSyllable !== -1) {
    stress = yoSyllable;
    // Native ё (poet wrote it): stress is unambiguous, no departure to signal.
    // Restored ё (engine changed е→ё): signal the departure with provenance icon.
    stressSource = wasYoRestored ? 'yo-restored' : 'dictionary';
    yoSource = wasYoRestored ? 'yo-restored' : null;
  } else if (lookup && lookup.stress != null && lookup.stress >= 0) {
    stress = lookup.stress;
    stressSource = lookup.source;
    yoSource = null;
  } else {
    // No stress data: -2 signals unknown. All vowels render cardinal,
    // no stress mark displayed. VERIFY badge shows via stressSource 'inferred'.
    stress = -2;
    stressSource = 'inferred';
    yoSource = null;
  }

  // Clean word for pipeline use (strip punctuation and dashes)
  const cleanWord = displayWord
    .replace(PUNCTUATION_REGEX, '')
    .replace(DASH_REGEX, '');

  // ── Yo alternation detection ──────────────────────────────────
  // Detect whether this word has a genuine ё ↔ е alternation,
  // meaning both forms exist independently in the dictionary.

  let yoAlternation = false;
  let yoAlternateForm: string | null = null;

  if (wasYoRestored) {
    // For yo-restored words (user typed е-form, engine restored ё),
    // the original form is the toggle target. Covers все/всё and similar pairs
    // where Russians conventionally omit the dieresis.
    const cleanOriginal = word.replace(PUNCTUATION_REGEX, '').replace(DASH_REGEX, '');
    yoAlternation = true;
    yoAlternateForm = cleanOriginal;
  } else {
    const hasYoChar = /[ёЁ]/.test(displayWord);

    if (hasYoChar) {
      // Word has native ё: check if the е-version exists as its own word
      const eForm = displayWord.replace(/ё/g, 'е').replace(/Ё/g, 'Е');
      if (eForm !== displayWord) {
        const eLookup = GraysonEngine.lookupStress(eForm.replace(/[«»]/g, '').replace(/[-–—]+$/, ''));
        if (eLookup && eLookup.source !== 'yo-restored') {
          yoAlternation = true;
          yoAlternateForm = eForm;
        }
      }
    } else if (/[еЕ]/.test(displayWord)) {
      // Word has no ё but has е: check each е→ё substitution
      const chars = Array.from(displayWord);
      for (let i = 0; i < chars.length; i++) {
        const isLowerE = chars[i] === 'е';
        const isUpperE = chars[i] === 'Е';
        if (isLowerE || isUpperE) {
          const swapped = [...chars];
          swapped[i] = isLowerE ? 'ё' : 'Ё';
          const yoForm = swapped.join('');
          const yoLookup = GraysonEngine.lookupStress(yoForm.replace(/[«»]/g, '').replace(/[-–—]+$/, ''));
          if (yoLookup && yoLookup.stress != null && yoLookup.stress >= 0) {
            yoAlternation = true;
            yoAlternateForm = yoForm;
            break; // Take the first valid alternation
          }
        }
      }
    }
  }

  return {
    cyrillic: displayWord,
    cleanWord,
    punctuation,
    stress,
    stressSource,
    gloss: lookup ? lookup.gloss ?? '' : '',
    pos: lookup ? lookup.pos ?? '' : '',
    lemma: lookup ? lookup.lemma ?? '' : '',
    isHomograph: lookup ? lookup.isHomograph ?? false : false,
    originalInput: wasYoRestored ? rawWord : null,
    dictionaryForm,
    preReformSource,
    yoSource,
    hasYo: yoSyllable !== -1,
    // Placeholder until autoDetectBoundaries() runs immediately after, in Step 2
    // below; every word passes through one of its branches (the 'user' guard is
    // dead code today, nothing sets boundarySource to 'user' anywhere yet), so
    // these placeholders are never observed. Matches the function's own 'soft'/
    // 'auto' default branch.
    rightBoundary: 'soft',
    boundarySource: 'auto',
    originalStress: stress,
    originalStressSource: stressSource,
    yoAlternation,
    yoAlternateForm,
  };
}

// ── Step 2 helper: boundary detection ───────────────────────────

/**
 * Auto-detect word boundaries within a line.
 * Mirrors GraysonEngine.autoDetectBoundaries() but operates on
 * PreTranscribeWord[] before engine transcription.
 */
function autoDetectBoundaries(words: PreTranscribeWord[]): void {
  const punctuationRegex = /[.,!?;:"""''–—«»]$/;

  words.forEach((word, i) => {
    // Preserve user-set boundaries (future feature)
    if (word.boundarySource === 'user') return;

    const isLastWord = i === words.length - 1;
    const cleanLower = word.cleanWord.toLowerCase();
    const hasPunctuation = punctuationRegex.test(word.cyrillic);
    const isProclitic = GraysonEngine.proclitics.has(cleanLower) && !word.promotedFromClitic;

    // Check if next word is enclitic
    const nextWord = words[i + 1];
    const nextCleanLower = nextWord ? nextWord.cleanWord.toLowerCase() : null;
    const nextIsEnclitic =
      nextCleanLower != null && GraysonEngine.enclitics.has(nextCleanLower) && !nextWord.promotedFromClitic;

    // Apply rules in priority order
    if (isLastWord) {
      word.rightBoundary = 'hard';
      word.boundarySource = 'auto';
    } else if (hasPunctuation) {
      word.rightBoundary = 'hard';
      word.boundarySource = 'punctuation';
    } else if (isProclitic) {
      word.rightBoundary = 'clitic';
      word.boundarySource = 'auto';
    } else if (nextIsEnclitic) {
      word.rightBoundary = 'clitic';
      word.boundarySource = 'auto';
    } else {
      // Default: SOFT -- assimilation happens automatically
      word.rightBoundary = 'soft';
      word.boundarySource = 'auto';
    }
  });
}

// ── Step 3: per-line transcription with cross-word assimilation ──

function transcribeLine(
  preLine: PreTranscribeWord[],
  lineIdx: number,
  engineConfig: EngineConfig,
): TranscribedWord[] {
  // Build line text for context detection
  const lineText = preLine.map((w) => w.cyrillic).join(' ');
  const lineEndsWithQuestion = /\?$/.test(lineText.trim());

  // Transcribe each word
  const transcribedWords: TranscribedWord[] = preLine.map(
    (wordData, wordIdx) => {
      const cleanWord = wordData.cleanWord;
      const cleanLower = cleanWord.toLowerCase();

      const isFirstWord = wordIdx === 0;

      // Detect о as interjection vs. preposition
      const isOWord = cleanLower === 'о';
      const hasPunctAfter = /[,!]/.test(wordData.punctuation);
      const isOInterjection =
        isOWord && (hasPunctAfter || (isFirstWord && !lineEndsWithQuestion));

      const isProclitic =
        !isOInterjection && GraysonEngine.proclitics.has(cleanLower) && !wordData.promotedFromClitic;

      // Enclitic guards: a word cannot attach leftward if there is nothing
      // to attach to (first word) or if punctuation separates it from the
      // preceding word. Resolves Issues #7, #10, #19.
      const prevHasPunct = wordIdx > 0 && preLine[wordIdx - 1].punctuation.length > 0;
      const isEnclitic =
        !isFirstWord &&
        !prevHasPunct &&
        GraysonEngine.enclitics.has(cleanLower) &&
        !wordData.promotedFromClitic;

      // Determine proclitic reduction position relative to host stress.
      // Forward-scans past any intervening proclitics to find the actual host.
      // Fixes chain bug: "не в силах" — "не" must look past "в" to find "силах".
      let procliticPosition: ProcliticPosition = null;
      if (isProclitic && wordIdx < preLine.length - 1) {
        const chain = resolveCliticChain(preLine, wordIdx);
        procliticPosition = chain.position;
      }

      // Clitic stress is -1 (unstressed)
      const effectiveStress =
        isProclitic || isEnclitic ? -1 : wordData.stress;

      // Call the engine
      const engineResult = GraysonEngine.transcribe(
        cleanWord,
        effectiveStress,
        isProclitic || isEnclitic,
        procliticPosition,
        engineConfig,
      );

      return {
        wordData,
        wordIdx,
        lineIdx,
        cyrillic: wordData.cyrillic,
        cleanWord,
        punct: wordData.punctuation,
        isProclitic,
        isEnclitic,
        isOInterjection,
        isFirstWord,
        lineEndsWithQuestion,
        procliticPosition,
        hasYo: wordData.hasYo,
        engineResult,
        syllables: engineResult.syllables,
        ipaUnderlying: engineResult.ipaUnderlying,
        transcriptionLog: engineResult.transcriptionLog,
        ipaSurface: '',
        skipFinalDevoicing: false,
        rightBoundary: wordData.rightBoundary,
        boundarySource: wordData.boundarySource,
      };
    },
  );

  // ── Cross-word assimilation ──

  GraysonEngine.applyCrossWordAssimilation(transcribedWords);

  // ── Post-process: update syllable IPA after assimilation ──

  transcribedWords.forEach((tw) => {
    if (tw.ipaSurface !== tw.ipaUnderlying && tw.syllables.length > 0) {
      const lastSyl = tw.syllables[tw.syllables.length - 1];
      const underlyingConcat = tw.syllables.map((s: SyllableData) => s.ipa).join('');
      const surfaceClean = (tw.ipaSurface ?? '').replace(/[ˈ\s]+/g, '');
      const prefixLen = underlyingConcat.length - lastSyl.ipa.length;

      if (surfaceClean.length >= prefixLen) {
        const newLastSylIpa = surfaceClean.slice(prefixLen);
        lastSyl.ipa = newLastSylIpa;

        // Update transcription log: mark final consonant as devoiced
        if (tw.transcriptionLog && tw.transcriptionLog.length > 0) {
          for (let i = tw.transcriptionLog.length - 1; i >= 0; i--) {
            const entry = tw.transcriptionLog[i];
            if (entry.features && entry.features.type === 'consonant') {
              const devoicingMap = GraysonEngine.voicedToVoiceless;
              if (devoicingMap[entry.ipa]) {
                entry.ipa = devoicingMap[entry.ipa];
                entry.features.finalDevoicing = true;
              }
              break;
            }
          }
        }
      }
    }

    // Build ipaContent from syllable data (preserves intersyllabic spaces)
    const ipaCore = tw.syllables
      .map((s: SyllableData) => (s.isStressed ? 'ˈ' + s.ipa : s.ipa))
      .join(' ');
    tw.ipaContent = ipaCore;
    tw.ipaDisplay = ipaCore;

    // Pre-compute reconstituted IPA from per-word ipaContent + transcription log.
    // This runs on the word's own IPA before clitic merging, so the positional
    // vowel count in ipaContent always matches the transcription log's vowel count.
    tw.ipaReconstituted = applyReconstitution(ipaCore, tw.transcriptionLog);
  });

  // ── Clitic display merging ──

  // Preserve pre-merge reconstituted IPA for Inspector analysis.
  // After merge, ipaReconstituted on host words contains fused clitic material;
  // Inspector needs the word's own reconstituted form.
  transcribedWords.forEach((tw) => {
    tw.ipaOwnReconstituted = tw.ipaReconstituted ?? tw.ipaContent ?? '';
  });

  // First pass: resolve vowelless clitic IPA
  transcribedWords.forEach((tw) => {
    if (tw.isProclitic || tw.isEnclitic) {
      const isVowelless = !hasVowel(tw.cleanWord);
      if (isVowelless) {
        if (tw.ipaSurface !== tw.ipaUnderlying) {
          tw.ipaContent = tw.ipaSurface ?? '';
        } else {
          const cliticInfo = GraysonEngine.cliticData.get(
            tw.cleanWord.toLowerCase(),
          );
          tw.ipaContent = cliticInfo?.canonicalIpa || tw.ipaContent || '';
        }
      }
    }
  });

  // Second pass: merge clitic IPA into host words for display.
  // Both ipaDisplay and ipaReconstituted are merged in parallel
  // so the reconstituted string has the same clitic structure.
  //
  // Proclitic chains are processed as units: when consecutive proclitics
  // precede a host, ALL their IPA merges into the host in correct order
  // (closest to host first, then farther proclitics prepend).
  // Enclitic chains work symmetrically: consecutive enclitics after a host
  // all merge into the host in forward order (e.g., ли бы: host absorbs both).
  let idx = 0;
  while (idx < transcribedWords.length) {
    const tw = transcribedWords[idx];

    if (tw.isProclitic) {
      // Collect the full proclitic chain
      const chainStart = idx;
      while (idx < transcribedWords.length && transcribedWords[idx].isProclitic) {
        const p = transcribedWords[idx];
        p.ipaDisplay = '→';
        p.ipaReconstituted = '→';
        p.isVowellessClitic = !hasVowel(p.cleanWord);
        idx++;
      }
      // idx now points to the host (or end of array)
      const hostWord = idx < transcribedWords.length ? transcribedWords[idx] : null;

      if (hostWord) {
        // Merge proclitics in reverse order (closest to host first).
        // This ensures vowelless proclitics tuck into the stressed syllable
        // correctly, and vowel-bearing proclitics prepend in reading order.
        for (let ci = idx - 1; ci >= chainStart; ci--) {
          const proclitic = transcribedWords[ci];
          const isVowelless = !hasVowel(proclitic.cleanWord);

          if (isVowelless) {
            // Vowelless proclitic: tuck IPA into host's stressed syllable
            if (hostWord.ipaDisplay?.startsWith('ˈ')) {
              hostWord.ipaDisplay =
                'ˈ' + proclitic.ipaContent + hostWord.ipaDisplay!.slice(1);
            } else {
              hostWord.ipaDisplay = (proclitic.ipaContent ?? '') + (hostWord.ipaDisplay ?? '');
            }
            if (hostWord.ipaReconstituted?.startsWith('ˈ')) {
              hostWord.ipaReconstituted =
                'ˈ' + proclitic.ipaContent + hostWord.ipaReconstituted!.slice(1);
            } else {
              hostWord.ipaReconstituted = (proclitic.ipaContent ?? '') + (hostWord.ipaReconstituted ?? '');
            }
          } else {
            // Vowel-bearing proclitic: separate with space
            hostWord.ipaDisplay = proclitic.ipaContent + ' ' + hostWord.ipaDisplay;
            const cliticReconstituted = applyReconstitution(proclitic.ipaContent ?? '', proclitic.transcriptionLog);
            hostWord.ipaReconstituted = cliticReconstituted + ' ' + hostWord.ipaReconstituted;
          }
        }
      }
      // idx already points past the chain; continue to process host or next word
      idx++;
    } else if (tw.isEnclitic) {
      // Collect the full enclitic chain
      const chainStart = idx;
      while (idx < transcribedWords.length && transcribedWords[idx].isEnclitic) {
        const e = transcribedWords[idx];
        e.ipaDisplay = '←';
        e.ipaReconstituted = '←';
        e.isVowellessClitic = !hasVowel(e.cleanWord);
        idx++;
      }
      // Host is the word before the chain
      const hostWord = chainStart > 0 ? transcribedWords[chainStart - 1] : null;

      if (hostWord && !hostWord.isProclitic) {
        // Merge enclitics in forward order (closest to host first)
        for (let ci = chainStart; ci < idx; ci++) {
          const enclitic = transcribedWords[ci];
          const isVowelless = !hasVowel(enclitic.cleanWord);

          if (isVowelless) {
            hostWord.ipaDisplay = (hostWord.ipaDisplay ?? '') + enclitic.ipaContent;
            hostWord.ipaReconstituted = (hostWord.ipaReconstituted ?? '') + enclitic.ipaContent;
          } else {
            hostWord.ipaDisplay =
              (hostWord.ipaDisplay ?? '') + ' ' + enclitic.ipaContent;
            const encliticReconstituted = applyReconstitution(enclitic.ipaContent ?? '', enclitic.transcriptionLog);
            hostWord.ipaReconstituted =
              (hostWord.ipaReconstituted ?? '') + ' ' + encliticReconstituted;
          }
        }
      }
      // idx already points past the chain; no increment needed
    } else {
      idx++;
    }
  }

  return transcribedWords;
}

// ── Re-export for convenience ────────────────────────────────────

export { applyNotationPreferences } from '@ilya/phonology';
export type { NotationPreferences, EngineConfig } from '@ilya/phonology';
export type { GlossLanguage } from '@ilya/dictionary';
