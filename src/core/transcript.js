// ============================================================================
// MSR (My Sung Russian) - Core Transcript Module
// ============================================================================
// Version: 4.16 (extracted to ES module)
// 
// This file contains the complete transcription engine extracted from the
// original monolithic index.html. Phase-0 of modularization: no logic changes,
// just extraction into ES module format.
//
// STRUCTURE:
// - Stress dictionary lookup
// - Grayson IPA inventory
// - Character utilities
// - Syllabification
// - Phonological analysis (voicing, palatalization)
// - Special cluster handling
// - Core transcription engine
// - Word/text processing
// - UI rendering (to be extracted in later phases)
//
// ============================================================================

/* global Ё_EXCEPTION_DICTIONARY, STRESS_CORRECTIONS, EXCEPTION_WORDS, jspdf */

// ============================================================================
// SECTION 1: VUIZUR STRESS DICTIONARY (47,283 entries)
// ============================================================================
// Extracted from Wiktionary via Vuizur/add-stress-to-epub
// Obsolete orthography normalized per Grayson (ѳ→ф, і→и, ѣ→е, ѵ→и)
// Format: word -> stress position (0-based vowel/syllable index)
//
// NOTE: GRAYSON_RULES object and old rule-lookup functions (ruleMatchScore,
// findApplicableRules, getBestExplanation, getRule, explainHardConsonant)
// were removed in v4.14. The "Why" feature now uses generateCuratedExplanations().
// ============================================================================

// ============================================================================
// CHAPTER 8 EXCEPTION DICTIONARY: Printed ⟨е⟩ = Actual ⟨ё⟩
// ============================================================================
// In standard Russian printing, ⟨ё⟩ usually appears as ⟨е⟩.
// These high-frequency words must be recognized and transcribed with /o/ not /ɛ/.
// Source: Grayson Chapter 8, pp. 275-280
// ============================================================================
// Data files loaded externally via <script> tags in <head>
// - Ё_EXCEPTION_DICTIONARY from data/yo-exceptions.js
// - STRESS_CORRECTIONS from data/stress-corrections.js  
// - EXCEPTION_WORDS from data/exception-words.js
// - STRESS_DICTIONARY loaded async from data/vuizur.json


// STRESS_DICTIONARY loaded from external file (data/vuizur.json)
let STRESS_DICTIONARY = {};


// ============================================================================
// STRESS LOOKUP FUNCTIONS
// ============================================================================

// Manual corrections for known errors in the Vuizur/Wiktionary data
// These override the dictionary when there are homograph issues or errors
// Format: word -> correct stress position (0-based syllable index)

// ============================================================================
// WIKTIONARY HARVEST SYSTEM
// ============================================================================
// Collects Wiktionary-verified stress data to grow the dictionary over time.
// Only harvests words NOT already in Vuizur dictionary.
// Stored in localStorage, exportable as JSON for dictionary merging.
//
// Data structure:
// {
//   "word": { stress: 2, timestamp: "2026-01-13T...", count: 3 }
// }
// ============================================================================

const HARVEST_STORAGE_KEY = 'msr_wiki_harvest';

// In-memory harvest (loaded from localStorage on init)
let wikiHarvest = {};

/**
 * Load harvest from localStorage
 */
function loadHarvest() {
    try {
        const saved = localStorage.getItem(HARVEST_STORAGE_KEY);
        if (saved) {
            wikiHarvest = JSON.parse(saved);
            console.log(`[Harvest] Loaded ${Object.keys(wikiHarvest).length} words from localStorage`);
        }
    } catch (e) {
        console.warn('[Harvest] Failed to load from localStorage:', e);
        wikiHarvest = {};
    }
}

/**
 * Save harvest to localStorage
 */
function saveHarvest() {
    try {
        localStorage.setItem(HARVEST_STORAGE_KEY, JSON.stringify(wikiHarvest));
    } catch (e) {
        console.warn('[Harvest] Failed to save to localStorage:', e);
    }
}

/**
 * Add a Wiktionary-verified word to the harvest
 * Only adds if NOT already in Vuizur dictionary
 * @param {string} word - The word (will be normalized)
 * @param {number} stressIndex - 0-based syllable index
 */
function harvestWord(word, stressIndex) {
    const normalized = word.toLowerCase().replace(/[.,!?;:"""''„‚«»—–]/g, '');
    
    // Skip if already in Vuizur dictionary
    if (typeof STRESS_DICTIONARY !== 'undefined' && STRESS_DICTIONARY.hasOwnProperty(normalized)) {
        console.log(`[Harvest] Skipped "${normalized}" — already in Vuizur`);
        return false;
    }
    
    // Skip if in manual corrections
    if (STRESS_CORRECTIONS.hasOwnProperty(normalized)) {
        console.log(`[Harvest] Skipped "${normalized}" — already in corrections`);
        return false;
    }
    
    // Add or update entry
    if (wikiHarvest[normalized]) {
        wikiHarvest[normalized].count++;
        wikiHarvest[normalized].lastSeen = new Date().toISOString();
        console.log(`[Harvest] Updated "${normalized}" — seen ${wikiHarvest[normalized].count} times`);
    } else {
        wikiHarvest[normalized] = {
            stress: stressIndex,
            timestamp: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            count: 1
        };
        console.log(`[Harvest] Added "${normalized}" — stress on syllable ${stressIndex + 1}`);
    }
    
    saveHarvest();
    return true;
}

/**
 * Get harvest statistics
 * @returns {object} { total, newest, oldest }
 */
function getHarvestStats() {
    const words = Object.keys(wikiHarvest);
    if (words.length === 0) {
        return { total: 0, newest: null, oldest: null };
    }
    
    let newest = null, oldest = null;
    for (const word of words) {
        const ts = wikiHarvest[word].timestamp;
        if (!oldest || ts < oldest) oldest = ts;
        if (!newest || ts > newest) newest = ts;
    }
    
    return {
        total: words.length,
        newest: newest ? new Date(newest).toLocaleDateString() : null,
        oldest: oldest ? new Date(oldest).toLocaleDateString() : null
    };
}

/**
 * Export harvest as JSON (for dictionary merging)
 * Format matches Vuizur: { "word": stressIndex, ... }
 * @returns {string} JSON string
 */
function exportHarvest() {
    const vuizurFormat = {};
    for (const [word, data] of Object.entries(wikiHarvest)) {
        vuizurFormat[word] = data.stress;
    }
    return JSON.stringify(vuizurFormat, null, 2);
}

/**
 * Export harvest with full metadata
 * @returns {string} JSON string with timestamps and counts
 */
function exportHarvestFull() {
    return JSON.stringify(wikiHarvest, null, 2);
}

/**
 * Download harvest as file
 * @param {boolean} full - Include metadata (true) or Vuizur format (false)
 */
function downloadHarvest(full = false) {
    const data = full ? exportHarvestFull() : exportHarvest();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `msr-harvest-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`[Harvest] Downloaded ${Object.keys(wikiHarvest).length} words`);
}

/**
 * Clear the harvest (use with caution!)
 */
function clearHarvest() {
    wikiHarvest = {};
    saveHarvest();
    console.log('[Harvest] Cleared all harvested words');
}

// Expose harvest functions to console for developer access
window.MSR = window.MSR || {};
window.MSR.harvest = {
    stats: getHarvestStats,
    export: exportHarvest,
    exportFull: exportHarvestFull,
    download: downloadHarvest,
    clear: clearHarvest,
    data: () => wikiHarvest
};

/**
 * Look up stress position for a word in the dictionary
 * @param {string} word - Russian word (will be normalized to lowercase)
 * @returns {number} - Syllable index (0-based) or -1 if not found
 */
function lookupStress(word) {
    // Normalize: lowercase, remove punctuation
    const normalized = word.toLowerCase().replace(/[.,!?;:"""''„‚«»\-—–]/g, '');
    
    // Check manual corrections first (highest priority)
    if (STRESS_CORRECTIONS.hasOwnProperty(normalized)) {
        return STRESS_CORRECTIONS[normalized];
    }
    
    // Then check main dictionary
    if (typeof STRESS_DICTIONARY !== 'undefined' && STRESS_DICTIONARY.hasOwnProperty(normalized)) {
        return STRESS_DICTIONARY[normalized];
    }
    
    return -1;
}

/**
 * Check if a word exists in the stress dictionary
 * @param {string} word - Russian word
 * @returns {boolean}
 */
function hasStressEntry(word) {
    return lookupStress(word) !== -1;
}

// ============================================================================
// GRAYSON'S CANONICAL IPA INVENTORY (2012) - DO NOT MODIFY
// ============================================================================
// Source: Craig Grayson, "Russian Lyric Diction" (University of Washington, 2012)
// This is the AUTHORITATIVE symbol set. Any deviation is INCORRECT.
//
// Key page references:
// - Stressed vowels: Chapter 3, Section 1 (p. 81-96)
// - Intermediate allophones [a], [e]: Chapter 3, Section 4 (p. 104-107)
// - Unstressed reduction: Chapter 3, Section 7 (p. 125-127)
// - Consonants: Chapter 4 (p. 139-192)
// - Palatalization: Chapter 5 (p. 203+)
// ============================================================================

const GRAYSON_IPA_INVENTORY = Object.freeze({
    // VOWELS - STRESSED (Grayson Ch. 3, Sec. 1)
    vowels_stressed: {
        'а': 'ɑ',        // Back open (default) - Grayson p. 82
        'а_interpalatal': 'a',  // Front open - Grayson p. 104: only interpalatally
        'о': 'o',        // Grayson p. 86: "transcribed simply as /o/"
        'е': 'ɛ',        // Open-mid front (default) - Grayson p. 84
        'е_interpalatal': 'e',  // Close-mid front - Grayson p. 106
        'ё': 'o',        // Same as stressed о - Grayson p. 85-86
        'и': 'i',        // Close front - Grayson p. 96: never reduces
        'ы': 'ɨ',        // Close central - Grayson p. 89-90
        'у': 'u',        // Close back rounded - Grayson p. 88
        'ю': 'u',        // Same as stressed у
        'я': 'ɑ',        // Same as stressed а (default)
        'я_interpalatal': 'a',  // Grayson p. 104: only interpalatally
        'э': 'ɛ'         // Same as stressed е - Grayson p. 84
    },
    
    // VOWELS - UNSTRESSED (Grayson Ch. 3, Sec. 7 - Reduction Rules)
    vowels_unstressed: {
        'а_pretonic_immediate': 'ɑ',     // Grayson p. 127: immediate pretonic
        'а_remote': 'ʌ',                  // Grayson p. 127: remote positions
        'а_interpalatal_remote': 'ɪ',    // Grayson p. 127: ikanye after palatalized
        'о_pretonic_immediate': 'ɑ',     // Grayson p. 127: akanye
        'о_remote': 'ʌ',                  // Grayson p. 127: remote positions
        'е_unstressed': 'ɪ',              // Ikanye (default)
        'е_unstressed_interpalatal': 'i', // Grayson p. 125: fronts to /i/ interpalatally
        'е_after_hard': 'ɨ',              // Grayson p. 127: after ж, ш, ц
        'и_stressed': 'i',                // Grayson p. 96: never reduces
        'и_unstressed': 'i',              // Grayson p. 96: "neither syllabic stress nor position affects the reading as /i/"
        'ы_unstressed': 'ɨ',              // Grayson p. 89-90
        'у_unstressed': 'u',              // Grayson: never reduces
        'ю_unstressed': 'u',              // Grayson: never reduces
        'я_unstressed': 'ɪ',              // Grayson p. 127: ikanye after palatalized
        'я_unstressed_remote': 'ʌ',       // Grayson p. 127: remote (not interpalatal)
        'э_unstressed': 'ɪ'               // Grayson p. 127: ikanye
    },
    
    // CONSONANTS - BASIC (Grayson Ch. 4)
    consonants: {
        'б': 'b',   'п': 'p',
        'в': 'v',   'ф': 'f',
        'д': 'd',   'т': 't',
        'г': 'ɡ',   'к': 'k',   // NOTE: ɡ not g (IPA opentail glyph)
        'з': 'z',   'с': 's',
        'ж': 'ʒ',   'ш': 'ʃ',
        'х': 'x',
        'ц': 'ts',
        'ч': 'tʃʲ',             // Grayson p. 169: inherently palatalized
        'щ': 'ʃʲʃʲ',            // Grayson p. 171-173: double palatalized fricative (NOT ʃtʃ)
        'л': 'l',   'л_hard': 'ɫ',  'л_soft': 'lʲ',  // Grayson p. 184
        'м': 'm',
        'н': 'n',   'н_soft': 'ɲ',  // Grayson p. 186: palatal nasal (NOT nʲ)
        'р': 'r',
        'й': 'j'
    },
    
    // SPECIAL MARKERS
    markers: {
        'palatalization': 'ʲ',      // Superscript (NOT used for н, which gets ɲ - Grayson p. 183)
        'length': 'ː',              // Geminate consonants
        'stress': 'ˈ',              // Before stressed syllable
        'j_glide': 'j'              // Iotized vowels after vowels
    }
});

// FORBIDDEN GLYPHS - These must NEVER appear in MSR output
// Each entry documents why the glyph is forbidden per Grayson
const FORBIDDEN_IPA_GLYPHS = Object.freeze({
    'g': 'ɡ',      // Typography: Latin g → IPA ɡ (opentail)
    'ə': 'ʌ',      // Grayson p. 127: "Further reduction to schwa (/ə/) should 
                   // be avoided, when singing Russian." Use [ʌ] for remote positions.
    'ɐ': 'ɑ',      // Grayson uses [ɑ] for pretonic immediate, not near-open [ɐ]
    'nʲ': 'ɲ',     // Grayson p. 183: palatalized н → [ɲ] (palatal nasal), not [nʲ]
    'ɔ': 'o',      // Grayson p. 86: "stressed /o/ will be transcribed simply as /o/"
    'ʊ': 'u'       // Grayson inventory: у/ю never reduce - always [u], never [ʊ]
});

// Debug mode - set to true to enable console logging of validation errors
const DEBUG = false;

/**
 * Validate IPA output against Grayson's inventory
 * Returns false and logs error (if DEBUG) when forbidden glyph found
 */
function validateIPAOutput(ipaString) {
    for (const [forbidden, correct] of Object.entries(FORBIDDEN_IPA_GLYPHS)) {
        if (ipaString.includes(forbidden)) {
            if (DEBUG) {
                console.error(`FORBIDDEN GLYPH: "${forbidden}" should be "${correct}" in: ${ipaString}`);
            }
            return false;
        }
    }
    return true;
}

// ============================================================================
// SECTION 3: GLOBAL STATE & UTILITIES
// ============================================================================

// Global state - array of processed word objects
let processedWords = [];

// Character normalization map (Latin/Greek to Cyrillic)
// Also includes pre-revolutionary orthography (Grayson Ch. 9, p. 291)
const charMap = {
    // Latin lookalikes
    'A': 'А', 'a': 'а', 'B': 'В', 'C': 'С', 'E': 'Е', 'e': 'е',
    'H': 'Н', 'K': 'К', 'M': 'М', 'O': 'О', 'o': 'о', 'P': 'Р',
    'p': 'р', 'T': 'Т', 'X': 'Х', 'x': 'х', 'Y': 'У', 'y': 'у',
    // Greek lookalikes
    'α': 'а', 'β': 'в', 'γ': 'г', 'ε': 'е', 'η': 'н', 'ι': 'и',
    'κ': 'к', 'μ': 'м', 'ν': 'н', 'ο': 'о', 'ρ': 'р', 'τ': 'т',
    'υ': 'у', 'χ': 'х', 'ω': 'о',
    // Pre-revolutionary orthography (Grayson Ch. 9, p. 291)
    // These obsolete letters appear in pre-1918 music publications
    'ѣ': 'е', 'Ѣ': 'Е',  // yat → е
    'і': 'и', 'І': 'И',  // dotted i → и
    'ѵ': 'и', 'Ѵ': 'И',  // izhitsa → и
    'ѳ': 'ф', 'Ѳ': 'Ф'   // fita → ф
};

// Cyrillic character sets
const vowels = new Set(['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я']);
const consonants = new Set([
    'б', 'в', 'г', 'д', 'ж', 'з', 'й', 'к', 'л', 'м', 'н', 'п', 'р', 'с', 'т', 'ф', 'х', 'ц', 'ч', 'ш', 'щ'
]);
const softSign = 'ь';
const hardSign = 'ъ';

// Prepositions and clitics that attach to following words
// Grayson p. 263: "particles (such as, бы; же, не and ни)" are unstressed
// Clitics: words that are inherently unstressed
// Vowelless ones merge with host word; voweled ones get their own cards but are still unstressed
const clitics = new Set(['в', 'к', 'с', 'б', 'во', 'ко', 'со', 'о', 'об', 'у', 'за', 'на', 'по', 'до', 'из', 'от', 'при', 'про', 'и', 'а', 'но', 'да', 'ль', 'ли', 'же', 'ж', 'бы', 'б', 'не', 'ни']);

// ============================================================================
// NOTATION SETTINGS
// ============================================================================
// These settings control how IPA is displayed without affecting the
// underlying transcription (which follows Grayson's conventions).
// ============================================================================

const notationSettings = {
    // Grayson uses ʃʲʃʲ for щ; some prefer ʃʲː for visual clarity
    // true = use ʃʲː (length mark), false = use ʃʲʃʲ (Grayson default)
    shchaUseLengthMark: false,
    
    // Grayson uses ɲ for palatalized н; some prefer nʲ for consistency
    // true = use nʲ, false = use ɲ (Grayson default)
    palatalnUseNj: false
};

// ============================================================================
// STYLE PRESETS - Chapter 9 Regional/Historical Variations
// ============================================================================
// These settings affect actual transcription output (unlike notationSettings
// which are purely cosmetic). Based on Grayson Ch. 9 (pp. 289-311).
// ============================================================================

const STYLE_PRESETS = {
    "sung_russian_grayson": {
        id: "sung_russian_grayson",
        label: "Sung Russian (Grayson)",
        description: "Traditional Old Muscovite / Stage pronunciation",
        settings: {
            vowelReduction: "ikanye",        // е→/ɪ/, я→/ɪ/ after soft (p. 297)
            щPronunciation: "shshokanye",    // щ→/ʃʲʃʲ/ (p. 299)
            velarИЙ: "stage",                // -кий→/kɨj/ (p. 301)
            regressivePalatalization: "full" // Entire cluster (p. 310)
        },
        source: "Grayson (2012) throughout"
    },
    "modern_standard": {
        id: "modern_standard",
        label: "Modern Standard",
        description: "Contemporary educated Moscow speech",
        settings: {
            vowelReduction: "ikanye",
            щPronunciation: "shshokanye",
            velarИЙ: "modern",               // -кий→/kʲij/ (p. 303)
            regressivePalatalization: "partial"
        },
        source: "Grayson Ch. 9, p. 295"
    },
    "petersburg": {
        id: "petersburg",
        label: "Petersburg Style",
        description: "Northern/academic tradition",
        settings: {
            vowelReduction: "ekanye",        // е→/ɛ/, я→/ɛ/ after soft (p. 297)
            щPronunciation: "shchokanye",    // щ→/ʃʲtʃʲ/ (p. 299-300)
            velarИЙ: "modern",
            regressivePalatalization: "partial"
        },
        source: "Grayson Ch. 9, p. 300"
    },
    "choir": {
        id: "choir",
        label: "Choral (Simplified)",
        description: "No vowel reduction — for ensemble vowel matching",
        settings: {
            vowelReduction: "none",          // All vowels at full value (p. 308)
            щPronunciation: "shshokanye",
            velarИЙ: "modern",
            regressivePalatalization: "partial"
        },
        source: "Grayson Ch. 9, pp. 306-311",
        notes: [
            "Unstressed а/о sung as /ɑ/ (no reduction to [ʌ])",
            "Unstressed е sung as /ɛ/ (no reduction to [ɪ])",
            "я always /jɑ/ or [ja] before palatalized C",
            "Exception: -чай- in pre-stress still /tʃi-/"
        ]
    }
};

// Current active style settings (starts with Grayson default)
let activeStyleSettings = { ...STYLE_PRESETS.sung_russian_grayson.settings };
let activePresetId = "sung_russian_grayson";

/**
 * Get current style setting value
 */
function getStyleSetting(key) {
    return activeStyleSettings[key];
}

/**
 * Apply a preset by ID
 */
function applyStylePreset(presetId) {
    const preset = STYLE_PRESETS[presetId];
    if (!preset) {
        console.error('Unknown preset:', presetId);
        return;
    }
    
    activeStyleSettings = { ...preset.settings };
    activePresetId = presetId;
    
    // Update description text
    const descEl = document.getElementById('presetDescription');
    if (descEl) {
        descEl.textContent = preset.description;
    }
    
    // Update UI
    updateStyleUI();
    
    // Re-transcribe all words with new settings
    reprocessAllWords();
}

/**
 * Set individual style toggle
 */
function setStyleSetting(key, value) {
    activeStyleSettings[key] = value;
    
    // When manually changing, we're no longer using a preset
    activePresetId = "custom";
    
    // Update UI
    updateStyleUI();
    
    // Re-transcribe
    reprocessAllWords();
}

/**
 * Update style preset UI to reflect current state
 */
function updateStyleUI() {
    // Update preset radio buttons
    const radioId = `preset-${activePresetId === 'sung_russian_grayson' ? 'grayson' : 
                     activePresetId === 'modern_standard' ? 'csr' : 
                     activePresetId}`;
    const radio = document.getElementById(radioId);
    if (radio) {
        radio.checked = true;
    }
}

/**
 * Reprocess all words with current style settings
 */
function reprocessAllWords() {
    if (processedWords.length > 0) {
        processedWords.forEach((wordData, idx) => {
            const stressIndex = wordData.processed.stressIndex;
            const wordToProcess = wordData.correctedWord || wordData.originalWord;
            wordData.processed = processWord(wordToProcess, stressIndex);
        });
        renderOutput();
    }
}

/**
 * Apply notation preferences to IPA string for display
 */
function applyNotationPreferences(ipa) {
    let result = ipa;
    
    if (notationSettings.shchaUseLengthMark) {
        // Replace doubled palatalized fricative with length mark
        result = result.replace(/ʃʲʃʲ/g, 'ʃʲː');
    }
    
    if (notationSettings.palatalnUseNj) {
        // Replace palatal nasal with n + palatalization marker
        result = result.replace(/ɲ/g, 'nʲ');
    }
    
    return result;
}

/**
 * Apply style settings to IPA string
 * This handles regional/historical variations from Chapter 9
 */
function applyStyleSettings(ipa) {
    let result = ipa;
    
    // 1. Vowel reduction style
    const vowelStyle = getStyleSetting('vowelReduction');
    if (vowelStyle === 'ekanye') {
        // Petersburg style: unstressed е/я stay as /ɛ/ not /ɪ/
        // Only change unstressed positions (not stressed or in specific patterns)
        // This is a simplified approximation - full implementation would
        // require access to stress context during transcription
        result = result.replace(/ɪ/g, 'ɛ');
    } else if (vowelStyle === 'none') {
        // Choral simplified: no reduction at all
        // ɪ → ɛ (for е), ʌ → ɑ (for о/а in remote positions)
        result = result.replace(/ɪ/g, 'ɛ');
        result = result.replace(/ʌ/g, 'ɑ');
    }
    
    // 2. Щ pronunciation
    const shchaStyle = getStyleSetting('щPronunciation');
    if (shchaStyle === 'shchokanye') {
        // Petersburg/Church Slavonic: щ → /ʃʲtʃʲ/
        result = result.replace(/ʃʲʃʲ/g, 'ʃʲtʃʲ');
    }
    
    // 3. Velar + ий ending (more complex, needs word-level context)
    // This is handled partially through pattern matching
    // Full implementation would need to detect -кий/-гий/-хий endings
    
    return result;
}

/**
 * Toggle shcha notation and re-render
 */
function toggleShchaNotation() {
    notationSettings.shchaUseLengthMark = !notationSettings.shchaUseLengthMark;
    const btn = document.getElementById('shchaToggle');
    if (btn) {
        btn.textContent = notationSettings.shchaUseLengthMark ? 'ʃʲː' : 'ʃʲʃʲ';
        btn.classList.toggle('alt-state', notationSettings.shchaUseLengthMark);
    }
    renderOutput();
}

/**
 * Toggle palatal n notation and re-render
 */
function togglePalatalnNotation() {
    notationSettings.palatalnUseNj = !notationSettings.palatalnUseNj;
    const btn = document.getElementById('palatalnToggle');
    if (btn) {
        btn.textContent = notationSettings.palatalnUseNj ? 'nʲ' : 'ɲ';
        btn.classList.toggle('alt-state', notationSettings.palatalnUseNj);
    }
    renderOutput();
}

function normalizeChar(char) {
    return charMap[char] || char;
}

function normalizeText(text) {
    return Array.from(text).map(normalizeChar).join('');
}

function isVowel(char) {
    return vowels.has(char?.toLowerCase());
}

function isConsonant(char) {
    return consonants.has(char?.toLowerCase());
}

function isSonorant(char) {
    const sonorants = new Set(['л', 'м', 'н', 'р', 'й']);
    return sonorants.has(char?.toLowerCase());
}

function getSonority(char) {
    char = char?.toLowerCase();
    if (isVowel(char)) return 4;
    if (char === 'й') return 3;
    if (isSonorant(char)) return 2;
    if (isConsonant(char)) return 1;
    return 0;
}

// Syllabification based on open syllable preference for singers
// 
// RULE: ALL consonants between vowels go to the NEXT syllable
// 
// EXCEPTIONS:
// 1. Cь and Cъ stay together as a unit (soft/hard signs modify consonant)
// 2. й stays with PRECEDING vowel (Grayson Ch. 3 Sec. 2, p. 96-97)
//    - й is a semivowel that forms diphthongs: ай, ей, ий, ой, уй, ый, etc.
//    - The pattern is always Vй (vowel + й), so й closes the syllable
//    - Example: мой → мой (one syllable), not мо-й
//    - Example: войти → вой-ти, not во-йти
//
function syllabify(word) {
    const chars = Array.from(word.toLowerCase());
    const syllables = [];
    let currentSyllable = '';
    let i = 0;

    while (i < chars.length) {
        const char = chars[i];
        
        // Soft/hard signs attach to previous consonant
        if (char === 'ь' || char === 'ъ') {
            currentSyllable += char;
            i++;
            continue;
        }
        
        currentSyllable += char;

        // Check if this is a vowel (nucleus of syllable)
        if (isVowel(char)) {
            // Check if next char is й (semivowel) - it stays with this vowel
            // Grayson p. 96-97: й forms diphthongs with preceding vowels
            if (i + 1 < chars.length && chars[i + 1] === 'й') {
                currentSyllable += 'й';
                i++; // Skip the й, we've added it
            }
            
            // Look ahead for consonants after this vowel (and any й we just added)
            let j = i + 1;
            while (j < chars.length && !isVowel(chars[j])) {
                j++;
            }

            // If we hit the end of the word, attach all remaining consonants to this syllable
            if (j >= chars.length) {
                currentSyllable += chars.slice(i + 1).join('');
                syllables.push(currentSyllable);
                currentSyllable = ''; // Clear so leftover check doesn't duplicate
                break; // Exit loop completely
            }

            // If next character is a vowel (no consonants between), close the syllable
            if (j === i + 1) {
                syllables.push(currentSyllable);
                currentSyllable = '';
                i++;
                continue;
            }

            // We have consonants before the next vowel
            // OPEN SYLLABLE RULE: ALL consonants go to next syllable
            // Just close the current syllable after the vowel
            syllables.push(currentSyllable);
            currentSyllable = '';
        }
        
        i++;
    }

    // Handle any leftover (shouldn't happen with well-formed words)
    if (currentSyllable) {
        // Check if it's just signs attached to nothing
        const trimmed = currentSyllable.replace(/[ьъ]/g, '');
        if (trimmed.length > 0) {
            syllables.push(currentSyllable);
        }
    }

    return syllables.length > 0 ? syllables : [word.toLowerCase()];
}

function countVowels(word) {
    return Array.from(word.toLowerCase()).filter(char => isVowel(char)).length;
}

// Get position of syllable relative to stress
function getSyllablePosition(syllableIndex, stressIndex, totalSyllables) {
    if (syllableIndex === stressIndex) return 'stressed';
    if (stressIndex === -1) return 'unstressed'; // No stress marked
    if (syllableIndex === stressIndex - 1) return 'pretonic-immediate';
    if (syllableIndex < stressIndex) return 'pretonic-remote';
    if (syllableIndex === stressIndex + 1) return 'posttonic-immediate';
    return 'posttonic-remote';
}

// Check if consonant is "interpalatal" (palatalized)
// ============================================================================
// PALATALIZING AGENT DETECTION
// Grayson p. 104: "[a] only occurs interpalatally" - bounded by palatalized
// phonemes on BOTH sides. Right side can be "a palatalized consonant or /j/
// (spelled -й-)."
// ============================================================================

/**
 * Check if a character is a palatalizing agent (for interpalatal right-side check)
 * Grayson p. 104: Right side of interpalatal position requires
 * "a palatalized consonant or /j/ (spelled -й-)"
 */
function isPalatalizingAgent(char, nextChar) {
    char = char?.toLowerCase();
    nextChar = nextChar?.toLowerCase();
    
    // Grayson p. 104: "/j/ (spelled -й-)" - й always counts
    if (char === 'й') return true;
    
    // Palatalizing vowels themselves are palatalizing agents
    // (they represent /j/ + vowel, so the /j/ palatalizes what precedes)
    if (['и', 'е', 'ё', 'ю', 'я'].includes(char)) return true;
    
    // Grayson p. 104: ч and щ are inherently palatal (transcribed /tʃʲ/ and /ʃʲʃʲ/)
    const inherentlyPalatal = new Set(['ч', 'щ']);
    if (inherentlyPalatal.has(char)) return true;
    
    // Grayson p. 127: "after the consonants /ʃ/ (-ш-), /ʒ/ (-ж-), or /ts/ (-ц-)"
    // these are always hard - never palatalizing agents
    const alwaysHard = new Set(['ж', 'ш', 'ц']);
    if (alwaysHard.has(char)) return false;
    
    // Other consonants are palatalizing agents if followed by ь or palatalizing vowel
    if (nextChar === 'ь') return true;
    if (['и', 'е', 'ё', 'ю', 'я'].includes(nextChar)) return true;
    
    return false;
}

/**
 * Check if consonant is palatalized (for transcription purposes)
 * Used for determining consonant IPA output and left-side interpalatal check
 * Grayson p. 104: Left side requires ч, щ, or "any other palatalized consonant"
 */
function isInterpalatal(consonant, nextChar) {
    // Grayson p. 104: ч, щ, й are inherently palatal
    // Note: ж, ш, ц are ALWAYS HARD - never palatalizing agents
    const inherentlyPalatal = new Set(['ч', 'щ', 'й']);
    consonant = consonant?.toLowerCase();
    nextChar = nextChar?.toLowerCase();
    
    if (inherentlyPalatal.has(consonant)) return true;
    // ж, ш, ц are always hard - never count as palatalized
    if (['ж', 'ш', 'ц'].includes(consonant)) return false;
    if (nextChar === 'ь') return true;
    if (nextChar === 'и' || nextChar === 'е' || nextChar === 'ё' || nextChar === 'ю' || nextChar === 'я') {
        return true;
    }
    return false;
}

// ============================================================================
// REGRESSIVE VOICING ASSIMILATION (Grayson Chapter 6, pp. 214-224)
// ============================================================================
// "Regressive assimilation of voicing occurs when one consonant phoneme takes
// on the voicing quality (voiced or unvoiced) of an immediately following
// consonant phoneme." (p. 214)
//
// Key rules:
// 1. Sonorants (л, м, н, р, й) do NOT influence voicing and are never devoiced
// 2. в has NO assimilative power - look past it to the next consonant
// 3. Last consonant in cluster determines voicing of entire cluster
// ============================================================================

/**
 * Analyze a word and return a map of character indices to their assimilated voicing
 * Returns: Map<index, 'voiced'|'unvoiced'|null> where null means no change
 * 
 * KEY INSIGHT: Voicing assimilation only occurs within consonant clusters,
 * NOT across vowels. A vowel breaks the assimilation chain.
 */
function analyzeVoicingAssimilation(word) {
    const chars = Array.from(word.toLowerCase());
    const voicingMap = new Map();
    
    // Sonorants: never devoice, don't influence others (p. 214, 251)
    const sonorants = new Set(['л', 'м', 'н', 'р', 'й']);
    
    // Voiced consonants that can be devoiced
    const voicedConsonants = new Set(['б', 'в', 'г', 'д', 'ж', 'з']);
    
    // Unvoiced consonants that can be voiced
    const unvoicedConsonants = new Set(['п', 'ф', 'к', 'т', 'ш', 'с', 'х', 'ц', 'ч', 'щ']);
    
    // Voiced/unvoiced pairs (p. 258-259)
    const voicedToUnvoiced = {
        'б': 'p', 'в': 'f', 'г': 'k', 'д': 't', 'ж': 'ʃ', 'з': 's'
    };
    const unvoicedToVoiced = {
        'п': 'b', 'ф': 'v', 'к': 'ɡ', 'т': 'd', 'ш': 'ʒ', 'с': 'z',
        'х': 'ɣ',  // p. 257: х → [ɣ] when voiced
        'ц': 'dz', // p. 256: ц → [dz] when voiced
        'ч': 'dʒʲ', // p. 256: ч → [dʒʲ] when voiced (stays palatalized)
        'щ': 'ʒʲʒʲ' // p. 224: щ → [ʒʲʒʲ] when voiced (rare)
    };
    
    // Process right-to-left to find voicing agents
    for (let i = chars.length - 1; i >= 0; i--) {
        const char = chars[i];
        
        // Skip non-consonants and signs
        if (!isConsonant(char) || char === 'ъ' || char === 'ь') continue;
        
        // Skip sonorants - they don't participate in voicing assimilation
        if (sonorants.has(char)) continue;
        
        // Find the IMMEDIATELY following consonant in the cluster
        // A vowel BREAKS the cluster - no assimilation across vowels
        let nextConsonantIdx = -1;
        let nextConsonant = null;
        
        for (let j = i + 1; j < chars.length; j++) {
            const nc = chars[j];
            
            // Signs don't break the cluster
            if (nc === 'ь' || nc === 'ъ') continue;
            
            // A VOWEL BREAKS THE CLUSTER - stop looking
            if (isVowel(nc)) break;
            
            // Sonorants don't influence voicing but are part of cluster
            // They don't trigger assimilation but we continue past them
            if (sonorants.has(nc)) continue;
            
            // в has no assimilative power (p. 251) - look past it
            // BUT в itself IS influenced by what follows
            if (nc === 'в') {
                // Keep looking for the actual voicing agent
                continue;
            }
            
            if (isConsonant(nc)) {
                nextConsonantIdx = j;
                nextConsonant = nc;
                break;
            }
        }
        
        // No following consonant in this cluster to assimilate from
        if (nextConsonant === null) continue;
        
        // Determine if next consonant is voiced or unvoiced
        const nextIsVoiced = voicedConsonants.has(nextConsonant);
        const nextIsUnvoiced = unvoicedConsonants.has(nextConsonant);
        
        // Apply assimilation
        if (nextIsUnvoiced && voicedConsonants.has(char)) {
            // Voiced consonant before unvoiced → devoice
            // e.g., водка: д before к → т (p. 217)
            voicingMap.set(i, { type: 'devoice', ipa: voicedToUnvoiced[char] });
        } else if (nextIsVoiced && unvoicedConsonants.has(char)) {
            // Unvoiced consonant before voiced → voice
            // e.g., вокзал: к before з → г (p. 219-220)
            // e.g., сделка: с before д → з (p. 220)
            voicingMap.set(i, { type: 'voice', ipa: unvoicedToVoiced[char] });
        }
    }
    
    return voicingMap;
}

// ============================================================================
// REGRESSIVE PALATALIZATION IN CLUSTERS (Grayson Chapter 5, pp. 205-211)
// ============================================================================
// "Since one consonant can be a palatalizing agent of preceding consonants,
// one must determine that the first consonant is palatalized." (p. 206)
//
// Russian lyric diction follows Old Muscovite pronunciation which palatalizes
// nearly all secondary cluster members (p. 209).
//
// LIMITING RULES (p. 209):
// 1. Do NOT regressively palatalize /ɫ/ except when doubled (лль → lʲlʲ)
// 2. Do NOT regressively palatalize /r/ except when doubled OR after stressed и,е,э
// 3. Do NOT regressively palatalize /n/ except before palatalized /n/ or dental
// 4. ONLY regressively palatalize velars (к,г,х) before another palatalized velar
// 5. ONLY regressively palatalize labials (б,п,в,ф,м) before another palatalized labial
//
// BOUNDARIES that block palatalization (p. 206):
// 1. ш, ж, ц (always hard consonants)
// 2. ъ (hard sign) - except after в, с, з
// 3. Vowels (though vowel may be fronted)
// 4. New palatalizing agent (starts new chain)
// 5. Word boundary - except в, с, з before indicator letters
// 6. Punctuation (absolute)
// ============================================================================

/**
 * Analyze regressive palatalization in consonant clusters
 * Returns: Map<index, boolean> where true means this consonant should be palatalized
 */
function analyzeRegressivePalatalization(word) {
    const chars = Array.from(word.toLowerCase());
    const palatalizationMap = new Map();
    
    // Consonant groups for limiting rules
    const dentals = new Set(['т', 'д', 'с', 'з', 'н', 'ц']);
    const velars = new Set(['к', 'г', 'х']);
    const labials = new Set(['б', 'п', 'в', 'ф', 'м']);
    const sonorants = new Set(['л', 'м', 'н', 'р', 'й']);
    
    // Always hard consonants - boundaries to palatalization
    const alwaysHard = new Set(['ж', 'ш', 'ц']);
    
    // Inherently palatalized
    const inherentlyPalatalized = new Set(['ч', 'щ', 'й']);
    
    // Palatalizing vowels
    const palatalizingVowels = new Set(['е', 'ё', 'и', 'ю', 'я']);
    
    // First pass: identify directly palatalized consonants
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const nextChar = chars[i + 1];
        
        if (!isConsonant(char)) continue;
        if (alwaysHard.has(char)) continue; // Never palatalized
        
        // Check if directly palatalized
        if (inherentlyPalatalized.has(char)) {
            palatalizationMap.set(i, true);
        } else if (nextChar === 'ь') {
            palatalizationMap.set(i, true);
        } else if (palatalizingVowels.has(nextChar) && !alwaysHard.has(char)) {
            palatalizationMap.set(i, true);
        }
    }
    
    // Second pass: regressive palatalization through clusters
    // Process right-to-left, spreading palatalization backward
    for (let i = chars.length - 1; i >= 0; i--) {
        const char = chars[i];
        
        if (!isConsonant(char)) continue;
        if (alwaysHard.has(char)) continue;
        if (palatalizationMap.get(i)) continue; // Already palatalized
        
        // Look for next consonant in cluster (vowels break clusters)
        let nextConsIdx = -1;
        let nextCons = null;
        for (let j = i + 1; j < chars.length; j++) {
            const nc = chars[j];
            if (nc === 'ь' || nc === 'ъ') continue;
            if (isVowel(nc)) break; // Vowel breaks cluster
            if (isConsonant(nc)) {
                nextConsIdx = j;
                nextCons = nc;
                break;
            }
        }
        
        if (nextCons === null) continue;
        if (!palatalizationMap.get(nextConsIdx)) continue; // Next consonant not palatalized
        
        // Check if the always-hard consonants block this
        if (alwaysHard.has(nextCons)) continue;
        
        // Apply limiting rules (Grayson p. 209)
        
        // Rule 1: Don't palatalize л except when doubled
        if (char === 'л') {
            if (nextCons === 'л' && palatalizationMap.get(nextConsIdx)) {
                palatalizationMap.set(i, true); // лль → lʲlʲ
            }
            continue;
        }
        
        // Rule 2: Don't palatalize р except when doubled OR after stressed front vowel
        // Grayson p. 209, fn. 277: "directly following -и-, -е-, or -э- (in the stressed syllable only)"
        // Examples: смерть /sʲmʲerʲtʲ/, терпеть /tʲirʲ ˈpʲetʲ/, кирпич /kʲirʲ ˈpʲitʃʲ/
        if (char === 'р') {
            // Check if doubled
            if (nextCons === 'р' && palatalizationMap.get(nextConsIdx)) {
                palatalizationMap.set(i, true); // ррь → rʲrʲ
                continue;
            }
            // Check if preceded by stressed front vowel (и, е, э)
            // This requires knowing stress position, which we check in transcribeSyllable
            // For now, we allow р to palatalize if directly following palatalized consonant
            // The stressed-vowel check happens separately in transcribeSyllable
            continue;
        }
        
        // Rule 3: н only palatalizes before palatalized н or dental
        if (char === 'н') {
            if (nextCons === 'н' || dentals.has(nextCons)) {
                palatalizationMap.set(i, true);
            }
            continue;
        }
        
        // Rule 4: Velars only palatalize before palatalized velars
        if (velars.has(char)) {
            if (velars.has(nextCons) && palatalizationMap.get(nextConsIdx)) {
                palatalizationMap.set(i, true);
            }
            continue;
        }
        
        // Rule 5: Labials only palatalize before palatalized labials
        if (labials.has(char)) {
            if (labials.has(nextCons) && palatalizationMap.get(nextConsIdx)) {
                palatalizationMap.set(i, true);
            }
            continue;
        }
        
        // Default for dentals (т, д, с, з): palatalize before any palatalized consonant
        // This is the Old Muscovite style (p. 209)
        if (dentals.has(char)) {
            palatalizationMap.set(i, true);
        }
    }
    
    return palatalizationMap;
}

// ============================================================================
// EXCEPTION WORDS - Complete IPA overrides
// ============================================================================
// Sources: Grayson Ch. 8.5 (pp. 287-288), Ch. 6 (pp. 243-246),
//          Appendix F (pp. 344-353)
// These words have exceptional pronunciations that override standard rules.
// ============================================================================

/**
 * Check if word has a complete IPA exception override
 */
function checkExceptionWord(word) {
    const normalized = word.toLowerCase();
    return EXCEPTION_WORDS[normalized] || null;
}

// ============================================================================
// SPECIAL CLUSTER READINGS (Grayson Chapter 6, Section 2, pp. 235-247)
// ============================================================================
// Certain consonant clusters have special pronunciations that don't directly
// reflect the usually associated phonemes of the Cyrillic spelling.
// ============================================================================

/**
 * Check for special cluster readings and return replacement IPA
 * Returns: { startIdx, length, ipa } or null if no special cluster
 */
function checkSpecialCluster(word, startIdx) {
    const chars = Array.from(word.toLowerCase());
    const remaining = chars.slice(startIdx).join('');
    
    // Two-letter clusters that read as one double consonant (p. 235-236)
    // сш, зш → /ʃː/
    if (remaining.startsWith('сш') || remaining.startsWith('зш')) {
        return { length: 2, ipa: 'ʃː', description: 'сш/зш → ʃː (p. 235)' };
    }
    // зж, сж → /ʒː/
    if (remaining.startsWith('зж') || remaining.startsWith('сж')) {
        return { length: 2, ipa: 'ʒː', description: 'зж/сж → ʒː (p. 236)' };
    }
    
    // Two- and three-letter clusters that read like another consonant (p. 236)
    // сч, зч → /ʃʲʃʲ/ (like щ)
    if (remaining.startsWith('сч') || remaining.startsWith('зч')) {
        return { length: 2, ipa: 'ʃʲʃʲ', description: 'сч/зч → ʃʲʃʲ (p. 236)' };
    }
    // жч → /ʃʲʃʲ/ (like щ)
    if (remaining.startsWith('жч')) {
        return { length: 2, ipa: 'ʃʲʃʲ', description: 'жч → ʃʲʃʲ (p. 236)' };
    }
    // стч, здч → /ʃʲʃʲ/ (like щ)
    if (remaining.startsWith('стч') || remaining.startsWith('здч')) {
        return { length: 3, ipa: 'ʃʲʃʲ', description: 'стч/здч → ʃʲʃʲ (p. 236)' };
    }
    // ссч → /ʃʲʃʲ/ (like щ)
    if (remaining.startsWith('ссч')) {
        return { length: 3, ipa: 'ʃʲʃʲ', description: 'ссч → ʃʲʃʲ (p. 236)' };
    }
    
    // тш, дш, чш → /tʃː/ (p. 236)
    if (remaining.startsWith('тш') || remaining.startsWith('дш') || remaining.startsWith('чш')) {
        return { length: 2, ipa: 'tʃː', description: 'тш/дш/чш → tʃː (p. 236)' };
    }
    
    // дж, тж → /dʒː/ (p. 237)
    // Example: поджёг /pɑ ˈdʒːok/, отжил /ˈo dʒːɨɫ/
    if (remaining.startsWith('дж') || remaining.startsWith('тж')) {
        return { length: 2, ipa: 'dʒː', description: 'дж/тж → dʒː (p. 237)' };
    }
    
    // тч, дч → /tʲːʃʲː/ (p. 237)
    // Example: вотчина /ˈvo tʲːʃʲːi nʌ/, подчас /pɑ ˈtʲːʃʲːɑs/
    if (remaining.startsWith('тч') || remaining.startsWith('дч')) {
        return { length: 2, ipa: 'tʲʃʲ', description: 'тч/дч → tʲʃʲ (p. 237)' };
    }
    
    // тц, дц → /tːs/ - assimilated (p. 237-238)
    // Example: отца /ɑ ˈtːsɑ/, молодцы /mʌ ɫɑ ˈtːsɨ/
    if (remaining.startsWith('тц') || remaining.startsWith('дц')) {
        return { length: 2, ipa: 'tːs', description: 'тц/дц → tːs (p. 237)' };
    }
    
    // Grayson p. 239-240: чн → /ʃn/ (скучно rule)
    // Limited to specific common words: скучный, скучно, конечно
    // BUT NOT конечный (which is /tʃʲn/)
    if (remaining.startsWith('чн')) {
        // Check if this is one of the special words
        const word = chars.join('');
        if (word.includes('скучн') || word === 'конечно') {
            return { length: 2, ipa: 'ʃn', description: 'чн → ʃn (скучно rule, p. 239)' };
        }
    }
    
    // Grayson p. 240: чт → /ʃt/ (что rule)
    // Only for что and derivatives (чтобы, ничто), NOT нечто
    if (remaining.startsWith('чт')) {
        const word = chars.join('');
        if (word === 'что' || word.startsWith('чтоб') || word === 'ничто') {
            return { length: 2, ipa: 'ʃt', description: 'чт → ʃt (что rule, p. 240)' };
        }
    }
    
    // Grayson p. 240: гк → /xk/ or /xʲkʲ/ (мягко/мягкий rule)
    // The palatalization of х depends on whether the following к is soft
    // гк before hard vowel (а, о, у, ы, э) or word-end → /xk/
    // гк before soft vowel (е, ё, и, ю, я) → /xʲkʲ/
    // Examples: мягко /ˈmʲɑx kʌ/, мягкий /ˈmʲɑxʲ kʲij/
    //           легко /lʲɪx ˈko/, лёгкий /ˈlʲoxʲ kʲij/
    if (remaining.startsWith('гк')) {
        const word = chars.join('');
        if (word.includes('мягк') || word.includes('лёгк') || word.includes('легк')) {
            // Check what follows the к to determine palatalization
            const afterK = chars[startIdx + 2]; // character after гк
            const softVowels = ['е', 'ё', 'и', 'ю', 'я', 'ь'];
            if (afterK && softVowels.includes(afterK)) {
                return { length: 2, ipa: 'xʲkʲ', description: 'гк → xʲkʲ before soft vowel (p. 240)' };
            } else {
                return { length: 2, ipa: 'xk', description: 'гк → xk before hard vowel (p. 240)' };
            }
        }
    }
    
    // Grayson p. 241: гч → /xtʃʲ/ (мягче - comparative forms)
    // CRITICAL: The х is NOT palatalized before ч (exception to regressive palatalization)
    // "Note that although /tʃʲ/ is a palatalized phoneme, the preceding /x/-phoneme is
    // not palatalized. This is an exception to the normal, regressive assimilation of
    // palatalization rule." (p. 241)
    if (remaining.startsWith('гч')) {
        const word = chars.join('');
        if (word.includes('мягч') || word.includes('лёгч') || word.includes('легч')) {
            return { length: 1, ipa: 'x', description: 'г → x before ч (NOT palatalized, p. 241)' };
        }
    }
    
    // Grayson p. 243: стн → /sn/ or /sɲ/ (deletion)
    // Example: страстный /ˈstrɑ snɨj/, честнее /tʃʲɪ ˈsʲɲe jɪ/
    // The н palatalizes if followed by a palatalizing vowel
    if (remaining.startsWith('стн')) {
        const afterCluster = remaining.substring(3);
        const palatalizingVowels = ['е', 'ё', 'и', 'ю', 'я', 'ь'];
        if (afterCluster.length > 0 && palatalizingVowels.includes(afterCluster[0])) {
            return { length: 3, ipa: 'sɲ', description: 'стн → sɲ before soft vowel (p. 243)' };
        }
        return { length: 3, ipa: 'sn', description: 'стн → sn (deletion, p. 243)' };
    }
    
    // Grayson p. 243: здн → /zn/ or /zɲ/ (deletion)
    // Example: поздно /ˈpo znʌ/, поздний /ˈpo zɲij/
    // The н palatalizes if followed by a palatalizing vowel (е, ё, и, ю, я, ь)
    // Exception: бездна keeps all three consonants
    if (remaining.startsWith('здн')) {
        const word = chars.join('');
        if (!word.includes('бездн')) {
            // Check what follows the здн cluster
            const afterCluster = remaining.substring(3);
            const palatalizingVowels = ['е', 'ё', 'и', 'ю', 'я', 'ь'];
            if (afterCluster.length > 0 && palatalizingVowels.includes(afterCluster[0])) {
                return { length: 3, ipa: 'zɲ', description: 'здн → zɲ before soft vowel (p. 243)' };
            }
            return { length: 3, ipa: 'zn', description: 'здн → zn (deletion, p. 243)' };
        }
    }
    
    // Grayson p. 243: рдц → /rts/ (deletion)
    // Example: сердце /ˈsʲɛr tsɨ/
    if (remaining.startsWith('рдц')) {
        return { length: 3, ipa: 'rts', description: 'рдц → rts (deletion, p. 243)' };
    }
    
    // Grayson p. 246: лнц → /nts/ (солнце rule - unique)
    // Example: солнце /ˈson tsɨ/
    if (remaining.startsWith('лнц')) {
        return { length: 3, ipa: 'nts', description: 'лнц → nts (солнце rule, p. 246)' };
    }
    
    // Grayson p. 246: вств → /stv/ (deletion)
    // Example: чувство /ˈtʃʲu stvʌ/, здравствуйте /ˈzdrɑ stvuj tʲɪ/
    if (remaining.startsWith('вств')) {
        return { length: 4, ipa: 'stv', description: 'вств → stv (deletion, p. 246)' };
    }
    
    // Grayson p. 237: -ться/-тся verb endings → /tːsʌ/
    // "The clusters -тс-/-дс- and -тьс-/-дьс- as part of the reflexive verb endings
    // -тся-/-дся- and -ться-/-дься-... resemble the reading of the letter -ц- (/ts/),
    // but have an elongated stop on the /t/-portion of the phoneme."
    // Example: купаться → /ku ˈpɑ tːsʌ/
    if (remaining.startsWith('ться') || remaining.startsWith('тся')) {
        return { length: remaining.startsWith('ться') ? 4 : 3, ipa: 'tːsʌ', description: '-ться/-тся → tːsʌ (p. 237)' };
    }
    if (remaining.startsWith('дься') || remaining.startsWith('дся')) {
        return { length: remaining.startsWith('дься') ? 4 : 3, ipa: 'tːsʌ', description: '-дься/-дся → tːsʌ (p. 237)' };
    }
    
    // Grayson p. 267: Reflexive -ся/-сь endings (without preceding т/д)
    // "except in the reflexive verbal endings -ться and -тся, when it is read as [ʌ]"
    // The с in reflexive endings stays unpalatalized (like in /ts/), я → ʌ
    // This applies to all reflexive verbs: сжалься, бойся, etc.
    // Example: сжалься → /ʒːɑlʲsʌ/
    // Only match at word end AND not if preceded by т/д (those are handled above)
    if ((remaining === 'ся' || remaining === 'сь') || 
        (remaining.startsWith('ся') && remaining.length === 2) ||
        (remaining.startsWith('сь') && remaining.length === 2)) {
        // Check that this isn't part of -тся/-дся (already handled above)
        const prevCharInWord = chars[startIdx - 1];
        const prevPrevCharInWord = chars[startIdx - 2];
        // If preceded by т, ть, д, or дь, skip — already handled by -тся/-дся rule
        if (prevCharInWord === 'т' || prevCharInWord === 'д' ||
            (prevCharInWord === 'ь' && (prevPrevCharInWord === 'т' || prevPrevCharInWord === 'д'))) {
            return null;
        }
        return { length: 2, ipa: 'sʌ', description: '-ся/-сь reflexive → sʌ (p. 267)' };
    }
    
    // ================================================================
    // GENITIVE/ADJECTIVE ENDING: -ого/-его → г = /v/
    // ================================================================
    // Grayson p. 189: "The letter ⟨г⟩ in the endings -ого and -его is 
    // pronounced /v/, not /ɡ/."
    // This applies to:
    // - Genitive singular masculine/neuter adjectives: красивого, синего
    // - Genitive singular masculine/neuter pronouns: его, моего, твоего
    // - Words ending in -ого/-его at word end
    // 
    // Examples: 
    //   милого /ˈmʲi ɫʌ vʌ/
    //   красного /ˈkrɑ snʌ vʌ/
    //   синего /ˈsʲi ɲɪ vʌ/
    //   его /jɪ ˈvo/
    // ================================================================
    if (remaining.startsWith('г')) {
        const word = chars.join('');
        // Check if word ends in -ого or -его (genitive adjective/pronoun ending)
        if (word.endsWith('ого') || word.endsWith('его')) {
            // Check if this г is in the -ого/-его ending
            const endingStart = word.length - 3; // position of о in -ого/-его
            if (startIdx === endingStart + 1) { // г is at position endingStart+1
                return { length: 1, ipa: 'v', description: '-ого/-его: г → v (p. 189)' };
            }
        }
    }
    
    return null;
}

// Transcribe a single syllable
function transcribeSyllable(syllable, position, wordContext, lockedSyllables = new Set()) {
    const chars = Array.from(syllable.toLowerCase());
    let ipa = '';
    
    // Get voicing assimilation map from word context
    const voicingMap = wordContext.voicingMap || new Map();
    // Get regressive palatalization map from word context
    const palatalizationMap = wordContext.palatalizationMap || new Map();
    const syllableStartInWord = wordContext.syllableStartInWord || 0;
    // Get cross-syllable geminates set
    const crossSyllableGeminates = wordContext.crossSyllableGeminates || new Set();
    
    // Grayson p. 199-202: Final consonant devoicing
    // "In Russian, as in German, final consonants are generally unvoiced"
    // Exception: sonorants (л, м, н, р) are not devoiced
    const isLastSyllable = wordContext.isLastSyllable || false;
    
    // Devoicing map: voiced → unvoiced (Grayson p. 199-202)
    const devoicingMap = {
        'б': 'p',   // p. 199-200
        'в': 'f',   // p. 200
        'г': 'k',   // p. 201
        'д': 't',   // p. 201
        'ж': 'ʃ',   // p. 202 (stays hard, NOT palatalized)
        'з': 's'    // p. 202
    };
    
    // Helper: check if consonant is word-final (possibly followed only by ь or ъ)
    function isWordFinal(index) {
        if (!isLastSyllable) return false;
        // Check if only ь or ъ follow this consonant
        for (let j = index + 1; j < chars.length; j++) {
            if (chars[j] !== 'ь' && chars[j] !== 'ъ') return false;
        }
        return true;
    }
    
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const prevChar = chars[i - 1];
        const nextChar = chars[i + 1];
        const nextNextChar = chars[i + 2];

        // Skip hard and soft signs in initial pass (handled with consonants)
        if (char === 'ъ' || char === 'ь') {
            continue;
        }

        // Consonants
        if (isConsonant(char)) {
            const isGeminate = char === nextChar;
            
            // Calculate this character's position in the full word
            const wordCharIdx = syllableStartInWord + i;
            
            // Check if this consonant is the SECOND part of a cross-syllable geminate
            // (i.e., the first consonant of this syllable that matches the last of previous)
            // If so, skip it - the ː was already added by the previous syllable
            if (crossSyllableGeminates.has(wordCharIdx) && i === 0) {
                // This is the first char of syllable AND it's marked as part of cross-syllable geminate
                // Skip it - the previous syllable will handle the geminate mark
                continue;
            }
            
            // Check if this с is part of -тся/-дся cluster that was handled in previous syllable
            // The cluster was found when processing т, so we need to skip the с here
            if (char === 'с') {
                const wordCharsCheck = Array.from(wordContext.word.toLowerCase());
                const prevInWord = wordCharsCheck[wordCharIdx - 1];
                const prevPrevInWord = wordCharsCheck[wordCharIdx - 2];
                const nextInWord = wordCharsCheck[wordCharIdx + 1];
                // If preceded by т/д (or ть/дь) and followed by я, this с was part of -тся cluster
                if ((prevInWord === 'т' || prevInWord === 'д' || 
                     (prevInWord === 'ь' && (prevPrevInWord === 'т' || prevPrevInWord === 'д'))) &&
                    nextInWord === 'я') {
                    continue; // Skip - already handled by -тся cluster
                }
            }
            
            // Check for special cluster at this position
            const specialCluster = checkSpecialCluster(wordContext.word, wordCharIdx);
            if (specialCluster) {
                // Check if this special cluster starts at current position
                const clusterChars = Array.from(wordContext.word.toLowerCase()).slice(wordCharIdx, wordCharIdx + specialCluster.length).join('');
                const expectedStart = chars.slice(i, i + specialCluster.length).join('');
                
                if (clusterChars.startsWith(expectedStart.substring(0, Math.min(expectedStart.length, specialCluster.length)))) {
                    ipa += specialCluster.ipa;
                    // Skip ALL characters consumed by this cluster in the syllable
                    // The cluster.length tells us how many Cyrillic chars were consumed
                    // We need to skip that many chars from position i
                    const charsInSyllableForCluster = Math.min(specialCluster.length, chars.length - i);
                    i += (charsInSyllableForCluster - 1); // -1 because for loop will do i++
                    continue;
                }
            }
            
            // Check if this consonant has voicing assimilation
            const voicingChange = voicingMap.get(wordCharIdx);
            
            // Check if this consonant should be devoiced (word-final position)
            const shouldDevoice = isWordFinal(i) && devoicingMap.hasOwnProperty(char);
            
            // Priority: voicing assimilation > word-final devoicing > default
            if (voicingChange) {
                // Use the assimilated IPA from the voicing map
                ipa += voicingChange.ipa;
            } else {
                switch (char) {
                    // Grayson p. 181, 199-200: Labials (б, п, ф, в)
                    // б → p when word-final; в → f when word-final
                    case 'б': ipa += shouldDevoice ? 'p' : 'b'; break;
                    case 'п': ipa += 'p'; break;
                    case 'в': ipa += shouldDevoice ? 'f' : 'v'; break;
                    case 'ф': ipa += 'f'; break;
                    // Grayson p. 179-180, 201: Dentals (д, т)
                    // д → t when word-final
                    case 'д': ipa += shouldDevoice ? 't' : 'd'; break;
                    case 'т': ipa += 't'; break;
                    // Grayson p. 187-189, 201: Velars (г, к, х)
                    // г → k when word-final
                    case 'г': ipa += shouldDevoice ? 'k' : 'ɡ'; break;
                    case 'к': ipa += 'k'; break;
                    case 'х': ipa += 'x'; break;
                    // Grayson p. 177-178, 202: Dental sibilants (з, с)
                    // з → s when word-final
                    case 'з': ipa += shouldDevoice ? 's' : 'z'; break;
                    case 'с': ipa += 's'; break;
                    // Grayson p. 162-165, 202: Hard hushers (ж, ш) - always hard
                    // ж → ʃ when word-final (NOT ʒ → ʃʲ, stays unpalatalized)
                    case 'ж': ipa += shouldDevoice ? 'ʃ' : 'ʒ'; break;
                    case 'ш': ipa += 'ʃ'; break;
                    // Grayson p. 166-168: ц - always hard (except цвет derivatives)
                    case 'ц': ipa += 'ts'; break;
                    // Grayson p. 169: ч is inherently palatalized /tʃʲ/
                    case 'ч': ipa += 'tʃʲ'; break;
                    // Grayson p. 171-173: щ is double palatalized /ʃʲʃʲ/ (NOT ʃtʃ)
                    case 'щ': ipa += 'ʃʲʃʲ'; break;
                    case 'л':
                        // Grayson p. 184: Hard л → /ɫ/ (velarized), Soft л → /lʲ/
                        // Check both direct and regressive palatalization
                        const lIsPalatalized = palatalizationMap.get(wordCharIdx) ||
                            nextChar === 'ь' || 
                            (isInterpalatal(char, nextChar) && !['ж', 'ш', 'ц', 'ч', 'щ'].includes(char));
                        if (lIsPalatalized) {
                            ipa += 'lʲ';
                        } else {
                            ipa += 'ɫ';
                        }
                        break;
                    // Grayson p. 185: м palatalization
                    case 'м': ipa += 'm'; break;
                    case 'н': 
                    // Grayson p. 186: Soft н → /ɲ/ (palatal nasal, NOT nʲ)
                    // "The single IPA symbol incorporates palatalization"
                    // "The single IPA symbol incorporates palatalization"
                    // Check both direct and regressive palatalization
                    const nIsPalatalized = palatalizationMap.get(wordCharIdx) || 
                        nextChar === 'ь' || 
                        (isInterpalatal(char, nextChar) && !['ж', 'ш', 'ц', 'ч', 'щ'].includes(char));
                    if (nIsPalatalized) {
                        ipa += 'ɲ';
                    } else {
                        ipa += 'n';
                    }
                    break;
                // Grayson p. 190: р is difficult to palatalize for Anglophones
                // Grayson p. 209 fn. 277: р palatalizes after stressed и, е, э
                case 'р': 
                    // Grayson p. 209, fn. 277: р palatalizes after stressed и, е, э
                    // BUT only when followed by a consonant cluster, NOT word-finally
                    // Examples: смерть /sʲmʲerʲtʲ/, терпеть /tʲirʲ ˈpʲetʲ/, кирпич /kʲirʲ ˈpʲitʃʲ/
                    // Counter-example: мир /mʲir/ (word-final, no cluster)
                    const rIsPalatalized = palatalizationMap.get(wordCharIdx) ||
                        nextChar === 'ь';
                    
                    // Check for stressed front vowel + following cluster condition
                    const prevCharForR = chars[i - 1];
                    const frontVowels = ['и', 'е', 'э'];
                    const hasFollowingCluster = nextChar && isConsonant(nextChar) && nextChar !== 'ь';
                    const afterStressedFrontVowel = position === 'stressed' && 
                        frontVowels.includes(prevCharForR) &&
                        hasFollowingCluster;  // MUST have following cluster
                    
                    if (rIsPalatalized || afterStressedFrontVowel) {
                        ipa += 'rʲ';
                    } else {
                        ipa += 'r';
                    }
                    break;
                case 'й': ipa += 'j'; break;
                }
            } // Close the else block for voicingChange check

            // Grayson p. 169-170, 195-198: Add palatalization marker
            // Triggered by: ь, palatalizing vowels (е, ё, и, ю, я), or regressive palatalization
            // 
            // Grayson p. 206: "a consonant that is generally not palatalized, as 
            // represented by the letters, -ш-, -ж-, or -ц-"
            // These consonants do NOT palatalize even when followed by ь.
            // Example: мышь /mɨʃ/ (mouse), видишь /ˈvʲidʲiʃ/ (you see)
            //
            // Exceptions: ч, щ already inherently palatalized
            // Note: Don't add palatalization if we already used voicingChange IPA
            // (voicingChange.ipa already includes palatalization where needed)
            
            // ж, ш, ц NEVER palatalize, even with ь (Grayson p. 206)
            const neverPalatalize = ['ж', 'ш', 'ц'];
            
            // Check if this consonant should be palatalized (direct OR regressive)
            const shouldPalatalize = !neverPalatalize.includes(char) && (
                palatalizationMap.get(wordCharIdx) ||
                nextChar === 'ь' || 
                isInterpalatal(char, nextChar)
            );
            
            if (shouldPalatalize && !voicingChange) {
                if (!['й', 'ч', 'щ', 'н', 'л', 'р'].includes(char)) { // й, ч, щ already palatal; н uses ɲ; л, р handled separately
                    ipa += 'ʲ';
                }
            }
            
            // Handle voicing change with palatalization
            // If voicingChange was applied, we need to add palatalization marker if needed
            if (voicingChange && shouldPalatalize) {
                // The voicingChange.ipa is the base sound; add ʲ if needed
                // Exception: ч→dʒʲ already includes palatalization
                if (!voicingChange.ipa.includes('ʲ') && !['н'].includes(char)) {
                    ipa += 'ʲ';
                }
            }

            // Mark geminate with length marker
            if (isGeminate && !['ж', 'ш', 'щ', 'ч'].includes(char)) {
                ipa += 'ː';
                i++; // Skip next char
            }
            // Also mark cross-syllable geminates (this char is last of syllable, next syllable starts with same)
            else if (crossSyllableGeminates.has(wordCharIdx) && !['ж', 'ш', 'щ', 'ч'].includes(char)) {
                ipa += 'ː';
                // Don't skip - the next char is in the next syllable (and will be skipped there)
            }
        }
        // Vowels
        else if (isVowel(char)) {
            // Check if preceded by consonant for context
            const prevIsVowel = isVowel(prevChar);
            const prevIsConsonant = isConsonant(prevChar);
            const afterInterpalatal = prevIsConsonant && isInterpalatal(prevChar, char);

            switch (char) {
                case 'а':
                    // Grayson p. 266: "the letter -а- is read as /ɑ/ in all positions except 
                    // for the remote-pre- or post-stress, when not the initial letter or 
                    // the adjectival, feminine ending -ая (always /ɑ jɑ/, in Russian lyric diction)."
                    //
                    // The -ая ending applies to feminine adjectives like:
                    // - красивая, голубая, волшебная, колыбельная
                    // The pattern is: any consonant + ая at word end
                    //
                    // Must use FULL WORD context, not just syllable
                    const wordCharsA = Array.from(wordContext.word.toLowerCase());
                    const wordCharIdxA = syllableStartInWord + i;
                    const nextCharInWordA = wordCharsA[wordCharIdxA + 1];
                    const nextNextCharInWordA = wordCharsA[wordCharIdxA + 2];
                    
                    // Grayson p. 266: "-ая (always /ɑ jɑ/, in Russian lyric diction)"
                    // Check if this а is part of feminine adjectival ending:
                    // - This а followed by я at word end (standard -ая)
                    // - OR this а IS the final а in -ная/-яая/-лая etc. pattern
                    //   (where я follows this а and is word-final)
                    const isAyaEndingA = nextCharInWordA === 'я' && 
                        (wordCharIdxA + 2 === wordCharsA.length || // я is last char
                         (wordCharIdxA + 2 === wordCharsA.length - 1 && wordCharsA[wordCharIdxA + 2] === 'ь'));
                    
                    const beforePalatalA = isPalatalizingAgent(nextCharInWordA, nextNextCharInWordA);
                    const inInterpalatalA = afterInterpalatal && beforePalatalA;
                    
                    if (position === 'stressed') {
                        // Grayson p. 266: -ая ending exception → always /ɑ/
                        if (isAyaEndingA) {
                            ipa += 'ɑ';
                        } else {
                            // Grayson p. 104: [a] only interpalatally; otherwise [ɑ]
                            ipa += inInterpalatalA ? 'a' : 'ɑ';
                        }
                    } else if (position === 'pretonic-immediate') {
                        // Grayson p. 127: unstressed а in immediate pretonic → [ɑ]
                        ipa += inInterpalatalA ? 'a' : 'ɑ';
                    } else if (position === 'posttonic-immediate') {
                        // Grayson p. 266 footnote 306: "This guide suggests that -а- in 
                        // the immediate-post-stress position be read as /ɑ/ in order to 
                        // aurally differentiate from words that have the letter -о- in 
                        // the same position."
                        // Example: блюдa /ˈblʲu dɑ/ (platters) vs блюдо /ˈblʲu dʌ/ (a platter)
                        ipa += 'ɑ';
                    } else if (!lockedSyllables.has(position)) {
                        // Grayson p. 266: -ая ending exception → always /ɑ/ even in remote post-tonic
                        // This overrides the normal remote reduction to [ʌ] or [ɪ]
                        if (isAyaEndingA) {
                            ipa += 'ɑ';
                        } else {
                            // Grayson p. 266: remote positions (not initial) → [ʌ]
                            // Note: interpalatal [ɪ] only applies when BETWEEN two palatalizing
                            // agents, not just after one. Remote unstressed а → ʌ.
                            ipa += 'ʌ';
                        }
                    } else {
                        // Locked syllable: use full vowel quality
                        ipa += inInterpalatalA ? 'a' : 'ɑ';
                    }
                    break;

                case 'о':
                    // Grayson p. 86: "stressed /o/ will be transcribed simply as /o/"
                    if (position === 'stressed') {
                        ipa += 'o';
                    } else if (position === 'pretonic-immediate') {
                        // Grayson p. 127: Akanye - unstressed о → [ɑ] in immediate pretonic
                        ipa += 'ɑ';
                    } else if (position === 'posttonic-immediate') {
                        // Grayson p. 97: immediate posttonic о → [ʌ]
                        // (Unlike а which stays ɑ, о reduces to ʌ)
                        ipa += 'ʌ';
                    } else if (!lockedSyllables.has(position)) {
                        // Grayson p. 127: remote positions → [ʌ]
                        // EXCEPTION: Word-initial о → [ɑ] (same as immediate pretonic)
                        // Grayson p. 97 treats word-initial as a special case
                        const wordCharIdxO = syllableStartInWord + i;
                        const isCliticWord = wordContext.isClitic || false;
                        if (wordCharIdxO === 0 || isCliticWord) {
                            // Word-initial OR standalone clitic (во, ко, со)
                            // Clitics function as immediate pretonic to host word
                            // MSR extension: singable /ɑ/ preferred (p.97 parallel)
                            ipa += 'ɑ';
                        } else {
                            ipa += 'ʌ';
                        }
                    } else {
                        // Locked syllable: use full vowel quality
                        ipa += 'o';
                    }
                    break;

                case 'е':
                case 'ё':
                    // Grayson p. 106: е/ё after vowel, ъ, ь, or word-initial → j + vowel
                    if (prevIsVowel || prevChar === 'ъ' || prevChar === 'ь' || i === 0) {
                        ipa += 'j';
                    }
                    
                    // Check for interpalatal context (between two palatalizing agents)
                    // Must use FULL WORD context, not just syllable
                    const wordChars = Array.from(wordContext.word.toLowerCase());
                    const wordCharIdxE = syllableStartInWord + i;
                    const nextCharInWord = wordChars[wordCharIdxE + 1];
                    const nextNextCharInWord = wordChars[wordCharIdxE + 2];
                    
                    // Left side: previous char must be a palatalizing agent
                    // Right side: next char must be a palatalizing agent
                    const leftIsPalatalizing = afterInterpalatal || 
                        (prevIsVowel && ['и', 'е', 'ё', 'ю', 'я'].includes(prevChar)) ||
                        prevChar === 'ь' || prevChar === 'й' ||
                        (i === 0 && wordCharIdxE === 0); // word-initial е gets j, which counts as palatalizing
                    const rightIsPalatalizing = isPalatalizingAgent(nextCharInWord, nextNextCharInWord);
                    const inInterpalatal = leftIsPalatalizing && rightIsPalatalizing;
                    
                    if (position === 'stressed') {
                        // Grayson p. 85-86: ё is always stressed /o/
                        if (char === 'ё') {
                            ipa += 'o';
                        } else if (inInterpalatal) {
                            // Grayson p. 106: [e] when interpalatal
                            ipa += 'e';
                        } else {
                            // Grayson p. 106: default stressed е → [ɛ]
                            ipa += 'ɛ';
                        }
                    } else if (position === 'pretonic-immediate') {
                        // Grayson p. 127: Ikanye - unstressed е → [ɪ]
                        // But interpalatal → [i]
                        if (inInterpalatal) {
                            ipa += 'i';
                        } else {
                            ipa += 'ɪ';
                        }
                    } else if (!lockedSyllables.has(position)) {
                        // Grayson p. 125: "The allophone is [ɪ]... and it fronts to 
                        // the /i/-phoneme when interpalatal."
                        if (inInterpalatal) {
                            ipa += 'i';
                        } else {
                            ipa += 'ɪ';
                        }
                    } else {
                        // Locked syllable: use full vowel quality
                        ipa += inInterpalatal ? 'e' : 'ɛ';
                    }
                    break;

                case 'я':
                    // Check if this я is part of -тся/-дся/-ться/-дься ending
                    // Those clusters include the vowel in their IPA output (tːsʌ)
                    // so we must skip processing this я to avoid double output
                    const wordCharsYaCheck = Array.from(wordContext.word.toLowerCase());
                    const wordCharIdxYaCheck = syllableStartInWord + i;
                    const prevCharYaCheck = wordCharsYaCheck[wordCharIdxYaCheck - 1];
                    const prevPrevCharYaCheck = wordCharsYaCheck[wordCharIdxYaCheck - 2];
                    const prevPrevPrevCharYaCheck = wordCharsYaCheck[wordCharIdxYaCheck - 3];
                    
                    // Check for -тся/-дся pattern (с preceded by т or д)
                    const isPartOfTsyaCluster = prevCharYaCheck === 'с' && 
                        (prevPrevCharYaCheck === 'т' || prevPrevCharYaCheck === 'д' ||
                         (prevPrevCharYaCheck === 'ь' && (prevPrevPrevCharYaCheck === 'т' || prevPrevPrevCharYaCheck === 'д')));
                    
                    if (isPartOfTsyaCluster) {
                        // Skip this я - it was already included in the tːsʌ cluster output
                        break;
                    }
                    
                    // Grayson p. 104: я after vowel, ъ, ь, or word-initial → j + vowel
                    if (prevIsVowel || prevChar === 'ъ' || prevChar === 'ь' || i === 0) {
                        ipa += 'j';
                    }
                    // Grayson p. 104: "я only in the stressed syllable, when preceded 
                    // by a palatalized consonant, and only when followed by a 
                    // palatalized consonant or /j/ (spelled -й-)."
                    // Must use FULL WORD context, not just syllable
                    const wordCharsYa = Array.from(wordContext.word.toLowerCase());
                    const wordCharIdxYa = syllableStartInWord + i;
                    const nextCharInWordYa = wordCharsYa[wordCharIdxYa + 1];
                    const nextNextCharInWordYa = wordCharsYa[wordCharIdxYa + 2];
                    const prevCharInWordYa = wordCharsYa[wordCharIdxYa - 1];
                    
                    const beforePalatalYa = isPalatalizingAgent(nextCharInWordYa, nextNextCharInWordYa);
                    const inInterpalatalYa = afterInterpalatal && beforePalatalYa;
                    
                    // Grayson p. 266: "-ая (always /ɑ jɑ/, in Russian lyric diction)"
                    // This is a special exception for feminine adjectival endings
                    // Check using WORD context, not syllable
                    const isAyaEnding = prevCharInWordYa === 'а' && 
                        (wordCharIdxYa === wordCharsYa.length - 1 || 
                         (wordCharIdxYa === wordCharsYa.length - 2 && wordCharsYa[wordCharIdxYa + 1] === 'ь'));
                    
                    // Grayson p. 266-267: "except in the reflexive verbal endings -ться 
                    // and -тся, when it is read as [ʌ]"
                    // This applies to all reflexive -ся/-сь endings (я preceded by с)
                    // BUT NOT if preceded by тс/дс — those are handled by cluster rule
                    // Examples: сжалься, бойся (NOT купаться, боится)
                    const isReflexiveEnding = prevCharInWordYa === 'с' && 
                        (wordCharIdxYa === wordCharsYa.length - 1 || 
                         (wordCharIdxYa === wordCharsYa.length - 2 && wordCharsYa[wordCharIdxYa + 1] === 'ь'));
                    
                    if (position === 'stressed') {
                        // Grayson p. 104: [a] only interpalatally; otherwise [ɑ]
                        ipa += inInterpalatalYa ? 'a' : 'ɑ';
                    } else if (position === 'pretonic-immediate') {
                        // Grayson p. 127: immediate pretonic after palatalized
                        ipa += inInterpalatalYa ? 'a' : 'ɑ';
                    } else if (!lockedSyllables.has(position)) {
                        // Grayson p. 266: -ая ending exception → always /ɑ/
                        if (isAyaEnding) {
                            ipa += 'ɑ';
                        } else if (isReflexiveEnding) {
                            // Grayson p. 266-267: reflexive -ся/-сь → [ʌ]
                            ipa += 'ʌ';
                        } else if (position === 'posttonic-immediate' && wordCharIdxYa === wordCharsYa.length - 1) {
                            // MSR extension (pending Grayson clarification):
                            // Word-final posttonic я → /ɑ/ (parallels posttonic а pattern)
                            // Examples: няня, Ваня, Соня
                            // See TODO-grayson-questions.md #1
                            ipa += 'ɑ';
                        } else {
                            // Grayson p. 127: Ikanye - unstressed я after palatalized → [ɪ]
                            // Remote after non-palatalized → [ʌ]
                            ipa += afterInterpalatal ? 'ɪ' : 'ʌ';
                        }
                    } else {
                        // Locked syllable: use full vowel quality
                        ipa += inInterpalatalYa ? 'a' : 'ɑ';
                    }
                    break;

                case 'ю':
                    // Grayson p. 104: ю after vowel, ъ, ь, or word-initial → j + vowel
                    if (prevIsVowel || prevChar === 'ъ' || prevChar === 'ь' || i === 0) {
                        ipa += 'j';
                    }
                    // Grayson: у/ю never reduce - always /u/ (see vowels_unstressed inventory)
                    ipa += 'u';
                    break;

                case 'и':
                    // Grayson p. 96: "neither syllabic stress nor position affects 
                    // the reading as /i/, in sung Russian"
                    // EXCEPT: After always-hard consonants ж, ш, ц, the spelling и
                    // represents [ɨ] — the tongue position of these consonants is
                    // physically incompatible with cardinal [i]
                    const alwaysHardConsonants = ['ж', 'ш', 'ц'];
                    if (prevIsConsonant && alwaysHardConsonants.includes(prevChar?.toLowerCase())) {
                        ipa += 'ɨ';
                    } else {
                        ipa += 'i';
                    }
                    break;

                case 'ы':
                    // Grayson p. 89-90: ы → [ɨ] (close central unrounded)
                    // Note: unstressed may be slightly lowered [ɨ̞] but Grayson
                    // does not require this distinction for lyric diction
                    ipa += 'ɨ';
                    break;

                case 'у':
                    // Grayson inventory: у never reduces - always /u/
                    // (unlike о which reduces via akanye)
                    ipa += 'u';
                    break;

                case 'э':
                    // Grayson p. 106-107: stressed э → [ɛ] (or [e] if followed by palatalized)
                    // Grayson p. 127: unstressed э → [ɪ] (ikanye)
                    if (position === 'stressed') {
                        ipa += 'ɛ';
                    } else if (!lockedSyllables.has(position)) {
                        ipa += 'ɪ';
                    } else {
                        // Locked syllable: use full vowel quality
                        ipa += 'ɛ';
                    }
                    break;
            }
        }
    }

    return ipa;
}

// Process a word with stress information
function processWord(word, stressIndex = -1, options = {}) {
    const { isClitic = false } = options;
    const normalized = normalizeText(word);
    
    // Check for exception words with complete IPA override
    // BUT only use exception IPA if stress is NOT being overridden by user
    const exception = checkExceptionWord(normalized);
    console.log('[processWord] word:', normalized, 'stressIndex:', stressIndex, 'exception:', exception ? exception.stressIndex : 'none');
    if (exception && (stressIndex === -1 || stressIndex === exception.stressIndex)) {
        console.log('[processWord] Using exception IPA');
        // Use exception's pre-computed IPA (stress matches dictionary or not specified)
        const syllableIPAs = exception.ipa.split('.');
        const syllables = syllabify(normalized);
        
        // Use passed stressIndex if provided, otherwise use exception's default
        const effectiveStress = (stressIndex !== -1) ? stressIndex : exception.stressIndex;
        
        return {
            word: normalized,
            syllables: syllableIPAs.map((ipa, idx) => ({
                cyrillic: syllables[idx] || '',
                ipa: ipa,
                isStressed: idx === effectiveStress,
                showStressMarker: idx === effectiveStress && syllableIPAs.length > 1
            })),
            stressIndex: effectiveStress,
            originalStressIndex: stressIndex,
            isMonosyllable: syllableIPAs.length === 1,
            showStressMarker: syllableIPAs.length > 1,
            isException: true,
            exceptionRule: exception.rule || null
        };
    }
    console.log('[processWord] Using normal transcription (user override or no exception)');
    // If user overrides stress on exception word, fall through to normal processing
    // so vowel reduction recalculates based on new stress position
    
    const syllables = syllabify(normalized);
    const vowelCount = countVowels(normalized);
    
    // Detect cross-syllable geminates (e.g., груп|па where пп spans boundary)
    // Build a set of character indices that are part of cross-syllable geminates
    const crossSyllableGeminates = new Set();
    let charIdx = 0;
    for (let i = 0; i < syllables.length - 1; i++) {
        const currentSyl = syllables[i];
        const nextSyl = syllables[i + 1];
        const lastCharOfCurrent = currentSyl[currentSyl.length - 1]?.toLowerCase();
        const firstCharOfNext = nextSyl[0]?.toLowerCase();
        
        // Check for soft sign - if current ends in Cь, check the C
        let actualLastChar = lastCharOfCurrent;
        let lastCharIdx = charIdx + currentSyl.length - 1;
        if (lastCharOfCurrent === 'ь' && currentSyl.length >= 2) {
            actualLastChar = currentSyl[currentSyl.length - 2]?.toLowerCase();
            lastCharIdx = charIdx + currentSyl.length - 2;
        }
        
        if (actualLastChar && firstCharOfNext && 
            isConsonant(actualLastChar) && actualLastChar === firstCharOfNext) {
            // Mark both positions as cross-syllable geminate
            crossSyllableGeminates.add(lastCharIdx); // Last C of current syllable (gets ː)
            crossSyllableGeminates.add(charIdx + currentSyl.length); // First C of next syllable (skip)
        }
        
        charIdx += currentSyl.length;
    }

    // Grayson rule: Monosyllabic words don't show stress MARKER (ˈ)
    // BUT the vowel still has STRESSED QUALITY (no reduction)
    // So we track two things:
    // 1. effectiveStressIndex: which syllable gets stressed vowel quality
    // 2. showStressMarker: whether to display ˈ
    const isMonosyllable = vowelCount === 1;
    const showStressMarker = !isMonosyllable;
    
    // For monosyllables, vowel quality is always stressed (index 0)
    // UNLESS stressIndex is explicitly -1 (clitic/unstressed word)
    // For polysyllables, use provided stress or -1 if unknown
    const effectiveStressIndex = isMonosyllable && stressIndex !== -1 ? 0 : stressIndex;
    
    // Compute voicing assimilation for the entire word (Grayson Ch. 6)
    const voicingMap = analyzeVoicingAssimilation(normalized);
    
    // Compute regressive palatalization for the entire word (Grayson Ch. 5)
    const palatalizationMap = analyzeRegressivePalatalization(normalized);
    
    // Track character position as we process syllables
    let charPosition = 0;

    const transcribedSyllables = syllables.map((syl, idx) => {
        const position = getSyllablePosition(idx, effectiveStressIndex, syllables.length);
        const isLastSyllable = idx === syllables.length - 1;
        const syllableStartInWord = charPosition;
        
        const ipa = transcribeSyllable(syl, position, { 
            word: normalized, 
            syllables, 
            isLastSyllable,
            voicingMap,
            palatalizationMap,
            syllableStartInWord,
            crossSyllableGeminates,
            isClitic  // Pass clitic flag for vowel handling
        });
        
        // Update character position for next syllable
        charPosition += syl.length;
        
        return {
            cyrillic: syl,
            ipa: ipa,
            isStressed: idx === effectiveStressIndex,
            showStressMarker: showStressMarker && idx === effectiveStressIndex
        };
    });

    return {
        word: normalized,
        syllables: transcribedSyllables,
        stressIndex: effectiveStressIndex,
        originalStressIndex: stressIndex,
        isMonosyllable: isMonosyllable,
        showStressMarker: showStressMarker
    };
}

// Main text processing function
function processText() {
    const input = document.getElementById('russianInput').value;
    
    // Split into lines first, preserving structure
    const inputLines = input.split(/\n/);
    
    // === CLITIC MERGING ===
    // Proclitics (vowelless prepositions + particles): attach to FOLLOWING word
    // Grayson p. 263: не and ни are particles, treated as unstressed
    const proclitics = new Set(['в', 'к', 'с', 'б']);  // Vowelless prepositions only — attach forward
    const enclitics = new Set(['ли', 'ль', 'же', 'ж', 'бы', 'б']);  // Particles, attach backward
    
    // Helper: check if string contains any Cyrillic letters
    const hasCyrillic = (str) => /[а-яёА-ЯЁ]/.test(str);
    
    // Helper: normalize Unicode (handle combining characters)
    const normalizeUnicode = (str) => str.normalize('NFC');
    
    // Helper: strip ALL punctuation from word except hyphens
    // Returns [cleanWord, strippedPunctuation]
    const stripPunctuation = (str) => {
        // First strip trailing punctuation (not hyphens)
        const trailingMatch = str.match(/^(.+?)([.,!?;:»«"'—–…]+)$/);
        let word = trailingMatch ? trailingMatch[1] : str;
        let trailing = trailingMatch ? trailingMatch[2] : '';
        
        // Also strip leading punctuation (not hyphens)
        const leadingMatch = word.match(/^([.,!?;:»«"'—–…]+)(.+)$/);
        if (leadingMatch) {
            word = leadingMatch[2];
        }
        
        return [word, trailing];
    };
    
    // Process each line separately, marking line breaks
    const allMergedWords = [];
    
    inputLines.forEach((line, lineIndex) => {
        const rawWords = line.split(/\s+/).filter(w => w.length > 0 && hasCyrillic(w));
        if (rawWords.length === 0) return; // Skip empty lines or punctuation-only lines
        
        let i = 0;
        while (i < rawWords.length) {
            let word = rawWords[i];
            const [cleanWord, trailingPunct] = stripPunctuation(word);
            const lowerWord = normalizeUnicode(cleanWord).toLowerCase();
            
            // Check if this is the last word (accounting for enclitics)
            let isLastWordInLine = (i >= rawWords.length - 1);
            if (i === rawWords.length - 2) {
                const [nextClean, nextPunct] = stripPunctuation(rawWords[i + 1]);
                const nextNormalized = normalizeUnicode(nextClean).toLowerCase();
                if (enclitics.has(nextNormalized)) {
                    isLastWordInLine = true;
                }
            }
            
            // Check if this is a proclitic (attach to next word)
            if (proclitics.has(lowerWord) && i + 1 < rawWords.length) {
                const nextWord = rawWords[i + 1];
                const [cleanNextWord, nextPunct] = stripPunctuation(nextWord);
                const isLastMerged = i + 1 >= rawWords.length - 1;
                allMergedWords.push({
                    combined: word + ' ' + nextWord,
                    parts: [{ text: cleanWord, type: 'proclitic' }, { text: cleanNextWord, type: 'main' }],
                    trailingPunctuation: nextPunct,
                    lineBreakAfter: isLastMerged,
                    lineIndex: lineIndex
                });
                i += 2;
                continue;
            }
            
            // Check if NEXT word is an enclitic (attach to this word)
            if (i + 1 < rawWords.length) {
                const nextWordRaw = rawWords[i + 1];
                const [cleanNext, punct] = stripPunctuation(nextWordRaw);
                const normalizedNext = normalizeUnicode(cleanNext).toLowerCase();
                
                if (enclitics.has(normalizedNext)) {
                    const isLastMerged = i + 1 >= rawWords.length - 1;
                    // Strip punctuation from enclitic for processing, store punct separately
                    const [cleanEnclitic, encliticPunct] = stripPunctuation(nextWordRaw);
                    allMergedWords.push({
                        combined: word + ' ' + nextWordRaw,
                        parts: [{ text: cleanWord, type: 'main' }, { text: cleanEnclitic, type: 'enclitic' }],
                        trailingPunctuation: encliticPunct || trailingPunct,
                        lineBreakAfter: isLastMerged,  // Only break if this is actually the last word in the line
                        lineIndex: lineIndex
                    });
                    i += 2;
                    continue;
                }
            }
            
            // Regular word - strip punctuation for processing
            allMergedWords.push({
                combined: word,
                parts: [{ text: cleanWord, type: 'main' }],
                trailingPunctuation: trailingPunct,
                lineBreakAfter: isLastWordInLine,
                lineIndex: lineIndex
            });
            i++;
        }
    });

    processedWords = allMergedWords.map(mergedWord => {
        const word = mergedWord.combined;
        const hasMergedParts = mergedWord.parts.length > 1;  // Has proclitic or enclitic attached
        
        // Check if this word itself is a standalone clitic (inherently unstressed)
        const standaloneWord = mergedWord.parts.length === 1 ? mergedWord.parts[0].text.toLowerCase() : null;
        const isStandaloneClitic = standaloneWord && clitics.has(normalizeUnicode(standaloneWord).toLowerCase());
        
        // For merged words, we need to process each part separately then combine
        // But for now, process as a unit and let the main word carry stress
        
        // Find the main word part for dictionary lookup
        const mainPart = mergedWord.parts.find(p => p.type === 'main');
        const mainWord = mainPart ? mainPart.text : word;
        
        // Normalize and lowercase for lookups (use main word, not clitic)
        let normalizedWord = normalizeText(mainWord);
        const lowerWord = normalizedWord.toLowerCase();
        
        // CHECK EXCEPTION DICTIONARY (Chapter 8)
        // Two types of exceptions:
        // 1. е→ё: printed ⟨е⟩ = actual ⟨ё⟩ (has actualForm property)
        // 2. Pure exceptions: words with irregular pronunciations (has exception property)
        let ёException = null;
        let pureException = null;
        let wordToProcess = mainWord;
        
        if (Ё_EXCEPTION_DICTIONARY[lowerWord]) {
            const entry = Ё_EXCEPTION_DICTIONARY[lowerWord];
            
            if (entry.actualForm) {
                // Type 1: е→ё substitution
                ёException = entry;
                wordToProcess = entry.actualForm;
            } else if (entry.exception) {
                // Type 2: Pure pronunciation exception (no spelling change)
                pureException = entry;
                // Word stays the same, but we note the exception
            }
        }
        
        // Look up stress in dictionary (returns syllable index or -1)
        let dictionaryStress = ёException ? ёException.stress : lookupStress(mainWord);
        let stressSource = dictionaryStress !== -1 ? 'dictionary' : 'none';
        
        // If from ё-exception dictionary, mark it specially
        if (ёException) {
            stressSource = 'ё-exception';
        }
        
        // Also check EXCEPTION_WORDS for words with special IPA
        // These should be treated as dictionary words for stress source tracking
        const exceptionWord = typeof checkExceptionWord === 'function' ? checkExceptionWord(mainWord) : null;
        if (exceptionWord && dictionaryStress === -1) {
            dictionaryStress = exceptionWord.stressIndex;
            stressSource = 'dictionary';  // Exception words count as dictionary entries
            console.log('[processText] Found exception word:', mainWord, 'stress:', dictionaryStress);
        }
        
        // RULE: ё always takes stress (one of the few reliable Russian orthography rules)
        // If word contains ё and we don't have dictionary stress, find the ё syllable
        if (dictionaryStress === -1) {
            const normalized = normalizeText(wordToProcess).toLowerCase();
            const ёIndex = normalized.indexOf('ё');
            if (ёIndex !== -1) {
                // Find which syllable contains the ё
                const syllables = syllabify(normalized);
                let charPos = 0;
                for (let sylIdx = 0; sylIdx < syllables.length; sylIdx++) {
                    const sylEnd = charPos + syllables[sylIdx].length;
                    if (ёIndex >= charPos && ёIndex < sylEnd) {
                        dictionaryStress = sylIdx;
                        stressSource = 'ё-rule';
                        break;
                    }
                    charPos = sylEnd;
                }
            }
        }
        
        // For merged words, adjust stress index to account for proclitic syllables
        let adjustedStress = dictionaryStress;
        if (dictionaryStress !== -1 && mergedWord.parts.length > 1) {
            const procliticPart = mergedWord.parts.find(p => p.type === 'proclitic');
            if (procliticPart) {
                // Count syllables in the proclitic
                const procliticSyllables = syllabify(procliticPart.text.toLowerCase()).length;
                adjustedStress = dictionaryStress + procliticSyllables;
            }
        }
        
        // PLACEHOLDER STRESS: Unknown words get temporary stress on syllable 1
        // This ensures every word is actionable immediately (no blank states)
        // Grey dotted circle signals "needs attention"
        // EXCEPTION: Standalone clitics are inherently unstressed — no placeholder
        if (stressSource === 'none' && adjustedStress === -1 && !isStandaloneClitic) {
            adjustedStress = 0;  // Syllable 1
            stressSource = 'placeholder';
        }
        
        // Standalone clitics: force unstressed (no stress index)
        if (isStandaloneClitic) {
            adjustedStress = -1;
            stressSource = 'clitic';  // Special source to indicate inherently unstressed
        }
        
        // Build the combined word for processing (remove spaces)
        const combinedWord = mergedWord.parts.map(p => p.text).join('');
        
        return {
            originalWord: word,
            displayWord: word,  // Keep spaces for display
            combinedWord: combinedWord,  // For reprocessing (no spaces)
            // Store the corrected form (with ё) for reprocessing
            correctedWord: ёException ? ёException.actualForm : combinedWord,
            // Process the full combined word with adjusted stress
            processed: processWord(combinedWord, adjustedStress, { isClitic: isStandaloneClitic }),
            isClitic: hasMergedParts,
            isStandaloneClitic: isStandaloneClitic,
            mergedParts: mergedWord.parts,  // Track what was merged
            trailingPunctuation: mergedWord.trailingPunctuation || '',  // Store punctuation separately
            lineBreakAfter: mergedWord.lineBreakAfter,  // Preserve poetry line breaks
            lineIndex: mergedWord.lineIndex,  // Track which line this word is from
            stressSource: stressSource,  // Track where stress came from
            ёException: ёException,  // Store е→ё exception info for Why screen
            pureException: pureException  // Store pure pronunciation exception info
        };
    });

    // Apply cross-boundary voicing assimilation (Grayson 6.3, pp. 250-257)
    applyCrossBoundaryVoicing();

    renderOutput();
}

// ============================================================================
// CROSS-BOUNDARY VOICING ASSIMILATION (Grayson 6.3, pp. 250-257)
// ============================================================================
// Rule: Final consonants assimilate voicing to following word's initial consonant
// Exception: Punctuation blocks assimilation (Grayson p. 250, Rule #1)
// Exception: Sonorants and vowels don't trigger voicing changes

function applyCrossBoundaryVoicing() {
    if (processedWords.length < 2) return;
    
    // Voicing pairs: voiceless → voiced
    const voicingMap = {
        'p': 'b', 'pʲ': 'bʲ',
        't': 'd', 'tʲ': 'dʲ',
        'k': 'ɡ', 'kʲ': 'ɡʲ',
        's': 'z', 'sʲ': 'zʲ',
        'f': 'v', 'fʲ': 'vʲ',
        'ʃ': 'ʒ',
        'x': 'ɣ',           // Special: x → ɣ (p.257)
        'ts': 'dz',         // Special: ц → dz (p.256)
        'tʃʲ': 'dʒʲ',       // Special: ч → dʒʲ (p.256)
    };
    
    // Devoicing pairs: voiced → voiceless
    const devoicingMap = {
        'b': 'p', 'bʲ': 'pʲ',
        'd': 't', 'dʲ': 'tʲ',
        'ɡ': 'k', 'ɡʲ': 'kʲ',
        'z': 's', 'zʲ': 'sʲ',
        'v': 'f', 'vʲ': 'fʲ',
        'ʒ': 'ʃ',
    };
    
    const voicedObstruents = new Set(['b', 'bʲ', 'd', 'dʲ', 'ɡ', 'ɡʲ', 'z', 'zʲ', 'v', 'vʲ', 'ʒ', 'dz', 'dʒʲ', 'ɣ']);
    const voicelessObstruents = new Set(['p', 'pʲ', 't', 'tʲ', 'k', 'kʲ', 's', 'sʲ', 'f', 'fʲ', 'ʃ', 'x', 'ts', 'tʃʲ']);
    const sonorants = new Set(['m', 'mʲ', 'n', 'nʲ', 'ɲ', 'l', 'lʲ', 'ɫ', 'r', 'rʲ', 'j']);
    const vowels = new Set(['ɑ', 'a', 'o', 'ɔ', 'u', 'ʊ', 'i', 'ɪ', 'ɨ', 'e', 'ɛ', 'ʌ']);
    
    for (let i = 0; i < processedWords.length - 1; i++) {
        const currentWord = processedWords[i];
        const nextWord = processedWords[i + 1];
        
        // Rule #1: Punctuation blocks assimilation
        if (currentWord.trailingPunctuation && /[.!?;:,]/.test(currentWord.trailingPunctuation)) {
            continue;
        }
        
        // Get the last syllable's IPA of current word
        const currentSyllables = currentWord.processed.syllables;
        if (!currentSyllables || currentSyllables.length === 0) continue;
        const lastSyllable = currentSyllables[currentSyllables.length - 1];
        let lastIPA = lastSyllable.ipa;
        
        // Get the first syllable's IPA of next word
        const nextSyllables = nextWord.processed.syllables;
        if (!nextSyllables || nextSyllables.length === 0) continue;
        const firstSyllable = nextSyllables[0];
        const firstIPA = firstSyllable.ipa;
        
        // Extract final consonant(s) from last syllable
        let finalC = extractFinalConsonant(lastIPA);
        if (!finalC) continue;
        
        // Extract initial consonant(s) from first syllable
        let initialC = extractInitialConsonant(firstIPA);
        
        // No assimilation before sonorants or vowels
        if (!initialC || sonorants.has(initialC) || vowels.has(firstIPA[0])) {
            continue;
        }
        
        // Determine voicing direction
        if (voicedObstruents.has(initialC)) {
            // Voice the final consonant
            const voiced = voicingMap[finalC];
            if (voiced && voiced !== finalC) {
                lastSyllable.ipa = replaceLastConsonant(lastIPA, finalC, voiced);
                lastSyllable.crossBoundaryVoicing = { from: finalC, to: voiced, trigger: initialC };
            }
        } else if (voicelessObstruents.has(initialC)) {
            // Devoice the final consonant
            const voiceless = devoicingMap[finalC];
            if (voiceless && voiceless !== finalC) {
                lastSyllable.ipa = replaceLastConsonant(lastIPA, finalC, voiceless);
                lastSyllable.crossBoundaryVoicing = { from: finalC, to: voiceless, trigger: initialC };
            }
        }
    }
}

// Helper: Extract final consonant(s) from IPA string
function extractFinalConsonant(ipa) {
    // Check for affricates and complex consonants first (longest match)
    if (ipa.endsWith('tʃʲ')) return 'tʃʲ';
    if (ipa.endsWith('dʒʲ')) return 'dʒʲ';
    if (ipa.endsWith('ts')) return 'ts';
    if (ipa.endsWith('dz')) return 'dz';
    
    // Check for palatalized consonants
    const palatalized = ipa.match(/([pbtdkɡszfvʃʒxmnlr])ʲ$/);
    if (palatalized) return palatalized[0];
    
    // Check for single consonants
    const single = ipa.match(/([pbtdkɡszfvʃʒxɣmnɲlɫrj])$/);
    if (single) return single[1];
    
    return null;
}

// Helper: Extract initial consonant(s) from IPA string
function extractInitialConsonant(ipa) {
    // Check for affricates first
    if (ipa.startsWith('tʃʲ')) return 'tʃʲ';
    if (ipa.startsWith('dʒʲ')) return 'dʒʲ';
    if (ipa.startsWith('ts')) return 'ts';
    if (ipa.startsWith('dz')) return 'dz';
    
    // Check for palatalized consonants
    const palatalized = ipa.match(/^([pbtdkɡszfvʃʒxmnlr])ʲ/);
    if (palatalized) return palatalized[0];
    
    // Check for single consonants
    const single = ipa.match(/^([pbtdkɡszfvʃʒxɣmnɲlɫrj])/);
    if (single) return single[1];
    
    return null;
}

// Helper: Replace final consonant in IPA string
function replaceLastConsonant(ipa, oldC, newC) {
    // Escape special regex characters
    const escaped = oldC.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return ipa.replace(new RegExp(escaped + '$'), newC);
}

// ============================================================================
// STRESS SOURCE MODAL - User vs Composer attribution
// ============================================================================

let pendingStressChange = null;  // Stores {wordIndex, syllableIndex} while modal is open

function showStressSourceModal(wordIndex, syllableIndex, wordText) {
    pendingStressChange = { wordIndex, syllableIndex };
    document.getElementById('stressSourceWord').textContent = wordText;
    document.getElementById('stressSourceModal').classList.add('show');
}

function closeStressSourceModal() {
    document.getElementById('stressSourceModal').classList.remove('show');
    pendingStressChange = null;
}

function confirmStressSource(source) {
    if (!pendingStressChange) return;
    
    const { wordIndex, syllableIndex } = pendingStressChange;
    closeStressSourceModal();
    
    // Now apply the stress change with the chosen source
    applyStressChange(wordIndex, syllableIndex, source);
}

// ============================================================================
// CLICK HANDLING: Single-click for stress, Double-click for е↔ё
// ============================================================================

let clickTimer = null;
let clickedWordIndex = null;
let clickedSyllableIndex = null;
const DOUBLE_CLICK_DELAY = 300; // ms

function handleSyllableClick(wordIndex, syllableIndex) {
    
    // If this is a second click on the same syllable within the delay, it's a double-click
    if (clickTimer && clickedWordIndex === wordIndex && clickedSyllableIndex === syllableIndex) {
        clearTimeout(clickTimer);
        clickTimer = null;
        cycleYo(wordIndex, syllableIndex);
        return;
    }
    
    // Clear any existing timer
    if (clickTimer) {
        clearTimeout(clickTimer);
    }
    
    // Store click info
    clickedWordIndex = wordIndex;
    clickedSyllableIndex = syllableIndex;
    
    // Set timer for single-click action
    clickTimer = setTimeout(() => {
        clickTimer = null;
        toggleStress(wordIndex, syllableIndex);
    }, DOUBLE_CLICK_DELAY);
}

// Toggle stress on a syllable (called after single-click confirmed)
function toggleStress(wordIndex, syllableIndex) {
    const wordData = processedWords[wordIndex];
    const currentStress = wordData.processed.stressIndex;
    
    console.log('[toggleStress] START:', {
        word: wordData.originalWord,
        currentStress,
        clickedSyllable: syllableIndex,
        stressSource: wordData.stressSource,
        originalDictionaryStress: wordData.originalDictionaryStress
    });
    
    // RULE: If word contains ё, stress CANNOT be moved away from ё syllable
    // ё is always stressed in Russian; allowing unstressed ё violates Grayson's schema
    if (wordData.stressSource === 'ё-rule') {
        showTooltip('The letter ⟨ё⟩ is always stressed in Russian.', wordIndex);
        return;
    }

    // Clicking same syllable does nothing (no toggle off)
    if (currentStress === syllableIndex) {
        // Exception: clicking placeholder confirms it
        if (wordData.stressSource === 'placeholder') {
            showStressSourceModal(wordIndex, syllableIndex, wordData.originalWord);
        }
        return;
    }
    
    // Clicking a different syllable...
    const isOverridingDictionary = ['dictionary', 'wiktionary', 'ё-exception'].includes(wordData.stressSource);
    const isOverridingVerified = isOverridingDictionary || 
        (wordData.originalDictionaryStress !== undefined && syllableIndex !== wordData.originalDictionaryStress);
    
    if (isOverridingVerified) {
        // Show modal to ask: user choice or composer's score?
        // Save original dictionary stress before showing modal
        if (wordData.originalDictionaryStress === undefined) {
            wordData.originalDictionaryStress = currentStress;
        }
        showStressSourceModal(wordIndex, syllableIndex, wordData.originalWord);
        return;
    }
    
    // For placeholder words or returning to dictionary stress, apply directly
    if (wordData.stressSource === 'placeholder') {
        showStressSourceModal(wordIndex, syllableIndex, wordData.originalWord);
        return;
    }
    
    // User/composer clicking different syllable — show modal
    if (wordData.stressSource === 'user' || wordData.stressSource === 'composer') {
        showStressSourceModal(wordIndex, syllableIndex, wordData.originalWord);
        return;
    }
    
    // Default: apply change as user
    applyStressChange(wordIndex, syllableIndex, 'user');
}

// Apply the stress change after source is determined
function applyStressChange(wordIndex, syllableIndex, source) {
    const wordData = processedWords[wordIndex];
    const currentStress = wordData.processed.stressIndex;
    
    console.log('[applyStressChange]', { wordIndex, syllableIndex, source });

    // Reprocess word with new stress
    // Priority: correctedWord (has ё fixes) > combinedWord (has proclitic) > originalWord
    const wordToUse = wordData.correctedWord || wordData.combinedWord || wordData.originalWord;
    const oldIPA = wordData.processed.syllables.map(s => s.ipa).join('.');
    wordData.processed = processWord(wordToUse, syllableIndex);
    const newIPA = wordData.processed.syllables.map(s => s.ipa).join('.');
    console.log('[applyStressChange] IPA changed:', oldIPA, '->', newIPA);
    
    // Track original dictionary stress for comparison
    if (wordData.originalDictionaryStress === undefined && 
        ['dictionary', 'wiktionary', 'ё-exception'].includes(wordData.stressSource)) {
        wordData.originalDictionaryStress = currentStress;
    }
    
    // Update stressSource
    const oldSource = wordData.stressSource;
    if (wordData.originalDictionaryStress !== undefined && syllableIndex === wordData.originalDictionaryStress) {
        // User returned to dictionary stress
        wordData.stressSource = 'dictionary';
    } else {
        // Apply the chosen source (user or composer)
        wordData.stressSource = source;
    }
    console.log('[applyStressChange] stressSource:', oldSource, '->', wordData.stressSource);
    
    // Clear cached IPA editor state so it regenerates with new stress
    delete wordData.ipaEditorState;

    // Update BOTH views so changes propagate everywhere
    renderOutput();
    if (currentView === 'singers') {
        renderSingersView();
    }
}

// ============================================================================
// DOUBLE-CLICK/TAP: Cycle е↔ё on stressed syllables
// ============================================================================
// When a syllable is already stressed and contains ⟨е⟩, double-clicking
// converts it to ⟨ё⟩ (and vice versa). This handles the common case where
// Russian text uses ⟨е⟩ in place of ⟨ё⟩ (standard publishing practice).
// ============================================================================

function cycleYo(wordIndex, syllableIndex) {
    const wordData = processedWords[wordIndex];
    const processed = wordData.processed;
    
    // Only works on stressed syllable
    if (processed.stressIndex !== syllableIndex) {
        showTooltip('Stress this syllable first, then double-tap to change е↔ё', wordIndex);
        return;
    }
    
    // Get the syllable text
    const syllable = processed.syllables[syllableIndex];
    if (!syllable) return;
    
    const syllableText = syllable.cyrillic;
    
    // Check if syllable contains е or ё
    const hasYe = syllableText.includes('е') || syllableText.includes('Е');
    const hasYo = syllableText.includes('ё') || syllableText.includes('Ё');
    
    if (!hasYe && !hasYo) {
        showTooltip('No ⟨е⟩ or ⟨ё⟩ in this syllable', wordIndex);
        return;
    }
    
    // Get the current word form
    const currentWord = wordData.correctedWord || wordData.originalWord;
    let newWord;
    
    if (hasYo) {
        // ё → е (user is reverting)
        newWord = currentWord.replace(/ё/g, 'е').replace(/Ё/g, 'Е');
        wordData.correctedWord = newWord;
        wordData.stressSource = 'user';
        showTooltip('Changed ⟨ё⟩ → ⟨е⟩', wordIndex);
    } else {
        // е → ё (user is correcting hidden ё)
        // Only convert the е in the stressed syllable, not all е's in the word
        newWord = convertStressedYeToYo(currentWord, syllableIndex);
        wordData.correctedWord = newWord;
        wordData.stressSource = 'ё-rule';
        showTooltip('Changed ⟨е⟩ → ⟨ё⟩', wordIndex);
    }
    
    // Reprocess with the corrected word
    wordData.processed = processWord(newWord, processed.stressIndex);
    
    // Clear cached IPA editor state
    delete wordData.ipaEditorState;
    
    // Update views
    renderOutput();
    if (currentView === 'singers') {
        renderSingersView();
    }
}

/**
 * Convert ⟨е⟩ to ⟨ё⟩ only in the stressed syllable
 */
function convertStressedYeToYo(word, stressedSyllableIndex) {
    // Syllabify to find which characters belong to stressed syllable
    const syllables = syllabify(word.toLowerCase());
    if (stressedSyllableIndex >= syllables.length) return word;
    
    const stressedSyllable = syllables[stressedSyllableIndex];
    
    // Find the position of this syllable in the original word
    let pos = 0;
    for (let i = 0; i < stressedSyllableIndex; i++) {
        pos += syllables[i].length;
    }
    
    // Convert е→ё within this syllable range
    const chars = Array.from(word);
    for (let i = pos; i < pos + stressedSyllable.length && i < chars.length; i++) {
        if (chars[i] === 'е') chars[i] = 'ё';
        if (chars[i] === 'Е') chars[i] = 'Ё';
    }
    
    return chars.join('');
}

// Show a temporary tooltip near a word card
function showTooltip(message, wordIndex) {
    // Remove any existing tooltip
    const existing = document.querySelector('.msr-tooltip');
    if (existing) existing.remove();
    
    const card = document.getElementById(`card-${wordIndex}`);
    if (!card) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'msr-tooltip';
    tooltip.textContent = message;
    
    // Position near the card
    const rect = card.getBoundingClientRect();
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.bottom + 8}px`;
    tooltip.style.transform = 'translateX(-50%)';
    
    document.body.appendChild(tooltip);
    
    // Fade out and remove after 2.5 seconds
    setTimeout(() => {
        tooltip.style.opacity = '0';
        setTimeout(() => tooltip.remove(), 300);
    }, 2500);
}

// ============================================================================
// ONLINE STRESS VERIFICATION (Wiktionary Integration)
// ============================================================================
// When user clicks the person+X icon, we query Wiktionary for the correct
// stress. This requires network access, so we ask for permission first.
// 
// Flow:
// 1. Check localStorage for permission ('msr_online_lookup')
// 2. If no permission, show one-time prompt
// 3. If permitted, query Wiktionary API
// 4. Compare result to user's stress assignment
// 5. Update icon: match → 📖✓, mismatch → 👤⚠️, not found → 👤✎
// ============================================================================

// Permission states: 'allowed', 'denied', or null (not yet asked)
function getOnlineLookupPermission() {
    return localStorage.getItem('msr_online_lookup');
}

function setOnlineLookupPermission(value) {
    localStorage.setItem('msr_online_lookup', value);
}

/**
 * Request permission to use online lookup
 * Returns promise that resolves to true (allowed) or false (denied)
 */
function requestOnlineLookupPermission() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2>Verify Stress Online?</h2>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 15px;">MSR can look up word stress from Wiktionary to verify your assignment. This requires internet access.</p>
                    <p style="font-size: 0.9em; color: #666;">Your word will be sent to Wiktionary's public API. No personal data is collected.</p>
                </div>
                <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="secondary-button" id="lookup-deny">Not Now</button>
                    <button class="primary-button" id="lookup-allow">Allow</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('lookup-allow').onclick = () => {
            setOnlineLookupPermission('allowed');
            modal.remove();
            resolve(true);
        };
        
        document.getElementById('lookup-deny').onclick = () => {
            modal.remove();
            resolve(false);
        };
    });
}

/**
 * Query Wiktionary for stress information
 * Returns: { found: boolean, stressIndex: number, stressedForm: string } or null on error
 */
async function queryWiktionaryStress(word) {
    const normalizedWord = word.toLowerCase().replace(/[.,!?;:»"'\-—–]/g, '');
    
    try {
        // Query Russian Wiktionary API
        const url = `https://ru.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(normalizedWord)}&format=json&origin=*&prop=wikitext`;
        
        const response = await fetch(url);
        if (!response.ok) {
            console.warn('Wiktionary API error:', response.status);
            return null;
        }
        
        const data = await response.json();
        
        if (data.error) {
            // Page doesn't exist
            return { found: false };
        }
        
        const wikitext = data.parse?.wikitext?.['*'] || '';
        
        // Debug: log what we're searching
        console.log(`[Wiktionary] Querying: "${normalizedWord}"`);
        
        // Look for stress mark (combining acute accent U+0301) in the headword
        // Wiktionary typically has the stressed form in the first line or заголовок template
        
        // Method 1: Look for word with combining acute accent
        const stressedWordMatch = wikitext.match(new RegExp(`[а-яёА-ЯЁ]*${normalizedWord.split('').join('[́]?')}[а-яёА-ЯЁ]*`.replace(/е/g, '[её]'), 'i'));
        
        // Method 2: Look for explicit stress mark anywhere in first few lines
        const lines = wikitext.split('\n').slice(0, 20).join('\n');
        const acuteMatch = lines.match(/([а-яёА-ЯЁ]+́[а-яёА-ЯЁ]*)/);
        
        // Method 3: Look for stress in templates like {{по-слогам|...}} or headword
        const templateMatch = wikitext.match(/\{\{по-слогам\|([^}]+)\}\}/);
        const slogi = templateMatch ? templateMatch[1] : null;
        
        // Debug: log what we found
        console.log(`[Wiktionary] Acute match: ${acuteMatch ? acuteMatch[1] : 'none'}`);
        console.log(`[Wiktionary] Template match: ${slogi || 'none'}`);
        
        if (acuteMatch) {
            const stressedForm = acuteMatch[1];
            // Find position of stress mark (combining acute U+0301)
            const stressPos = stressedForm.indexOf('\u0301');
            if (stressPos > 0) {
                // Count which syllable this falls in
                const beforeStress = stressedForm.substring(0, stressPos);
                const syllables = syllabify(beforeStress.replace(/\u0301/g, ''));
                const stressIndex = syllables.length - 1;
                
                return {
                    found: true,
                    stressIndex: stressIndex,
                    stressedForm: stressedForm.replace(/\u0301/g, '')
                };
            }
        }
        
        // If no stress mark found but page exists, return found but unknown stress
        if (data.parse?.title) {
            return { found: true, stressIndex: -1, stressedForm: normalizedWord };
        }
        
        return { found: false };
        
    } catch (error) {
        console.error('Wiktionary lookup failed:', error);
        return null;
    }
}

/**
 * Main entry point: verify stress online for a word
 */
async function verifyStressOnline(wordIndex) {
    const wordData = processedWords[wordIndex];
    if (!wordData) return;
    
    // Check permission
    const permission = getOnlineLookupPermission();
    if (permission === 'denied') {
        showTooltip('Online lookup disabled. Change in settings.', wordIndex);
        return;
    }
    
    if (permission !== 'allowed') {
        const allowed = await requestOnlineLookupPermission();
        if (!allowed) {
            showTooltip('Online lookup declined', wordIndex);
            return;
        }
    }
    
    // Show loading state
    showTooltip('Looking up...', wordIndex);
    
    // Get the main word (without clitics)
    const mainPart = wordData.mergedParts?.find(p => p.type === 'main');
    const wordToLookup = mainPart ? mainPart.text : wordData.originalWord;
    // Strip punctuation but KEEP hyphens (compound words like чей-нибудь need them)
    const cleanWord = wordToLookup.replace(/[.,!?;:»"'—–]/g, '');
    
    // Query Wiktionary
    const result = await queryWiktionaryStress(cleanWord);
    
    if (result === null) {
        // Network error
        showTooltip('Network error. Try again later.', wordIndex);
        return;
    }
    
    if (!result.found) {
        // Not in Wiktionary either
        wordData.stressSource = 'user';
        showTooltip('Not found in Wiktionary. Your stress saved.', wordIndex);
        renderOutput();
        return;
    }
    
    if (result.stressIndex === -1) {
        // Found but stress not marked
        wordData.stressSource = 'user';
        showTooltip('Found but stress not marked. Your stress saved.', wordIndex);
        renderOutput();
        return;
    }
    
    // Compare with user's stress
    const userStress = wordData.processed.stressIndex;
    
    if (userStress === result.stressIndex) {
        // Match! Promote to verified
        wordData.stressSource = 'wiktionary';
        wordData.wiktionaryStress = result.stressIndex;
        harvestWord(cleanWord, result.stressIndex);  // Harvest verified word
        showTooltip('✓ Verified! Stress confirmed.', wordIndex);
    } else if (userStress === -1) {
        // User hasn't assigned stress yet — use Wiktionary's
        wordData.processed = processWord(cleanWord, result.stressIndex);
        wordData.stressSource = 'wiktionary';
        wordData.wiktionaryStress = result.stressIndex;
        harvestWord(cleanWord, result.stressIndex);  // Harvest new word
        showTooltip(`Stress found: syllable ${result.stressIndex + 1}`, wordIndex);
    } else {
        // Mismatch — user has different stress than Wiktionary
        wordData.stressSource = 'mismatch';
        wordData.wiktionaryStress = result.stressIndex;
        // Also harvest the Wiktionary stress (it's authoritative even if user overrides)
        harvestWord(cleanWord, result.stressIndex);
        showTooltip(`Wiktionary: syllable ${result.stressIndex + 1}. Yours: ${userStress + 1}. Musical override?`, wordIndex);
    }
    
    renderOutput();
    if (currentView === 'singers') {
        renderSingersView();
    }
}

// ============================================================================
// EXPLANATION PANEL - "Why?" Feature
// ============================================================================
// Shows pedagogical explanations from Grayson Rules knowledge base
// 
// CURATION PHILOSOPHY (2026-01-12):
// - Lead with what's UNUSUAL about this word
// - Express transformations in IPA (what user sees), not Cyrillic
// - Format: ⟨cluster⟩ → /ipa/ — explanation (p. X)
// - Suppress "default" rules unless nothing else applies
// ============================================================================

/**
 * Generate curated explanation for a word's transcription
 * Returns array of { html: string, priority: number } objects
 */
function generateCuratedExplanations(wordData) {
    const { processed, originalWord, ёException, mergedParts } = wordData;
    const wordLower = originalWord.toLowerCase();
    const explanations = [];
    
    // Priority tiers:
    // -1 = Clitic/particle explanation - HIGHEST (structural info)
    // 0 = ё-exception (printed е = actual ё)
    // 1 = Special clusters, deletions, unusual readings (ALWAYS show)
    // 2 = Voicing/devoicing assimilation (show if present)
    // 3 = Palatalization notes (show if space)
    // 4 = Default vowel/consonant rules (only if nothing else)
    
    // ================================================================
    // TIER -1: Clitic/particle explanation (structural info)
    // ================================================================
    
    if (mergedParts && mergedParts.length > 1) {
        const procliticPart = mergedParts.find(p => p.type === 'proclitic');
        const encliticPart = mergedParts.find(p => p.type === 'enclitic');
        const mainPart = mergedParts.find(p => p.type === 'main');
        
        if (procliticPart && mainPart) {
            const procLower = procliticPart.text.toLowerCase();
            
            // Check for voweled preposition variants
            const voweledPrepositions = {
                'во': 'в',
                'ко': 'к', 
                'со': 'с',
                'обо': 'об',
                'ото': 'от',
                'изо': 'из',
                'надо': 'над',
                'подо': 'под',
                'предо': 'пред'
            };
            
            let extraNote = '';
            if (voweledPrepositions[procLower]) {
                extraNote = ` (the voweled form of ⟨${voweledPrepositions[procLower]}⟩, used before certain consonant clusters)`;
            }
            
            explanations.push({
                html: `<strong>⟨${procliticPart.text}⟩</strong>${extraNote} is unstressed by definition — it attaches to ⟨${mainPart.text}⟩ like a prefix, even though it is written as a separate word <span class="cite">(p. 263)</span>`,
                priority: -1
            });
        }
        
        if (encliticPart && mainPart) {
            const isQuestionParticle = ['ли', 'ль', 'ли', 'л'].includes(encliticPart.text.toLowerCase());
            const particleNote = isQuestionParticle ? ' (a question particle, like adding "?" to the phrase)' : '';
            explanations.push({
                html: `<strong>⟨${encliticPart.text}⟩</strong>${particleNote} is unstressed by definition — it attaches to ⟨${mainPart.text}⟩ like a suffix, even though it is written as a separate word <span class="cite">(p. 263)</span>`,
                priority: -1
            });
        }
    }
    
    // ================================================================
    // TIER 0: ё-exception (Chapter 8) - printed е = actual ё
    // ================================================================
    
    if (ёException) {
        const ambiguousNote = ёException.ambiguous 
            ? ' <em>(context-dependent — may be ⟨е⟩ /ɛ/ if referring to people)</em>' 
            : '';
        explanations.push({
            html: `<strong>⟨${originalWord}⟩</strong> → printed ⟨е⟩ is actually ⟨${ёException.actualForm}⟩ with /o/ — ${ёException.note}${ambiguousNote} <span class="cite">(Ch. 8, p. 275)</span>`,
            priority: 0
        });
    }
    
    // ================================================================
    // TIER 0.5: Pure pronunciation exceptions (Chapter 8, Section 5)
    // ================================================================
    
    const pureException = wordData.pureException;
    if (pureException) {
        const ipaNote = pureException.ipa_note ? ` → ${pureException.ipa_note}` : '';
        explanations.push({
            html: `<strong>⟨${originalWord}⟩</strong> — ${pureException.note}${ipaNote} <span class="cite">(Ch. 8, p. 287)</span>`,
            priority: 0
        });
    }
    
    // ================================================================
    // TIER 1: Special clusters and deletions (highest priority)
    // ================================================================
    
    const specialPatterns = [
        // Deletions - always interesting
        { pattern: /стн/, cyrillic: 'стн', ipa: '/sn/', note: 'the /t/ is silent', page: 243 },
        { pattern: /здн/, cyrillic: 'здн', ipa: '/zn/', note: 'the /d/ is silent', page: 243, 
          exception: { pattern: /бездн/, note: '(exception: бездна keeps /zdn/)' } },
        { pattern: /рдц/, cyrillic: 'рдц', ipa: '/rts/', note: 'the /d/ is silent', page: 243 },
        { pattern: /лнц/, cyrillic: 'лнц', ipa: '/nts/', note: 'the /l/ is silent', page: 244 },
        { pattern: /вств/, cyrillic: 'вств', ipa: '/stv/', note: 'first /v/ is silent', page: 244 },
        { pattern: /стск/, cyrillic: 'стск', ipa: '/sk/', note: 'simplified cluster', page: 245 },
        
        // Special readings
        { pattern: /чн/, cyrillic: 'чн', ipa: '/ʃn/', note: 'not /tʃʲn/', page: 239,
          wordList: ['скучн', 'конечн', 'яичн', 'прачечн', 'скворечн', 'нарочн'] },
        { pattern: /чт/, cyrillic: 'чт', ipa: '/ʃt/', note: 'the "что rule"', page: 240,
          wordList: ['что', 'чтоб', 'ничт', 'кое-чт'] },
        { pattern: /гк/, cyrillic: 'гк', ipa: '/xk/', note: 'г becomes fricative /x/', page: 240 },
        { pattern: /гч/, cyrillic: 'гч', ipa: '/xtʃʲ/', note: '/x/ does NOT palatalize', page: 241 },
        
        // Chapter 8: Palatalized ц in -ция/-ционный suffixes (p. 283-284)
        // Only when analogous to English -tion/-ence (not -ture like лекция)
        { pattern: /ция$|ционн/, cyrillic: '-ция/-ционн-', ipa: '/tʲsʲi/', note: 'palatalized ц (rare exception)', page: 283,
          wordList: ['революц', 'декламац', 'каденц', 'нац', 'констит', 'организац', 'информац', 'операц', 'станц', 'эволюц', 'авиац'] },
        
        // Cluster mergers
        { pattern: /сш|зш/, cyrillic: 'сш/зш', ipa: '/ʃː/', note: 'merged long fricative', page: 235 },
        { pattern: /сж|зж/, cyrillic: 'сж/зж', ipa: '/ʒː/', note: 'merged long fricative', page: 236 },
        { pattern: /сч|зч|жч|стч|здч|ссч/, cyrillic: 'cluster', ipa: '/ʃʲʃʲ/', note: 'like ⟨щ⟩', page: 236 },
        { pattern: /тш|дш|чш/, cyrillic: 'тш/дш/чш', ipa: '/tʃː/', note: 'merged affricate', page: 236 },
        { pattern: /дж|тж/, cyrillic: 'дж/тж', ipa: '/dʒː/', note: 'merged affricate', page: 237 },
        { pattern: /тч|дч/, cyrillic: 'тч/дч', ipa: '/tːʃʲ/', note: 'elongated ⟨ч⟩', page: 237 },
        
        // Reflexive verbs
        { pattern: /ться|тся/, cyrillic: '-ться/-тся', ipa: '/tːsʌ/', note: 'reflexive ending', page: 238 },
        { pattern: /тц|дц/, cyrillic: 'тц/дц', ipa: '/tːs/', note: 'elongated /t/', page: 238 },
    ];
    
    for (const sp of specialPatterns) {
        if (sp.pattern.test(wordLower)) {
            // Check wordList filter if specified
            if (sp.wordList && !sp.wordList.some(stem => wordLower.includes(stem))) {
                continue;
            }
            // Check for exception
            let note = sp.note;
            if (sp.exception && sp.exception.pattern.test(wordLower)) {
                note = sp.exception.note;
            }
            explanations.push({
                html: `<strong>⟨${sp.cyrillic}⟩</strong> → ${sp.ipa} — ${note} <span class="cite">(p. ${sp.page})</span>`,
                priority: 1
            });
        }
    }
    
    // ================================================================
    // TIER 2: Voicing assimilation (interesting but common)
    // ================================================================
    
    const voicedConsonants = { 'б': 'b', 'в': 'v', 'г': 'ɡ', 'д': 'd', 'ж': 'ʒ', 'з': 'z' };
    const unvoicedConsonants = { 'п': 'p', 'ф': 'f', 'к': 'k', 'т': 't', 'ш': 'ʃ', 'с': 's', 'х': 'x', 'ц': 'ts', 'ч': 'tʃʲ', 'щ': 'ʃʲʃʲ' };
    const devoiceMap = { 'б': 'p', 'г': 'k', 'д': 't', 'ж': 'ʃ', 'з': 's' };
    const voiceMap = { 'к': 'ɡ', 'с': 'z', 'т': 'd', 'п': 'b', 'ф': 'v' };
    const devoicePages = { 'б': 215, 'г': 216, 'д': 217, 'ж': 218, 'з': 218 };
    const voicePages = { 'к': 219, 'с': 220, 'т': 221, 'п': 221, 'ф': 222 };
    
    for (let i = 0; i < wordLower.length - 1; i++) {
        const curr = wordLower[i];
        const next = wordLower[i + 1];
        
        // Skip if this is part of a special cluster already handled
        const twoChar = curr + next;
        const threeChar = i < wordLower.length - 2 ? curr + next + wordLower[i + 2] : '';
        if (['гк', 'гч', 'сш', 'зш', 'сж', 'зж', 'сч', 'зч', 'жч', 'тш', 'дш', 'чш', 'дж', 'тж', 'тч', 'дч', 'тц', 'дц'].includes(twoChar)) {
            continue;
        }
        if (['стн', 'здн', 'рдц', 'лнц', 'стч', 'здч'].includes(threeChar)) {
            continue;
        }
        
        // Devoicing: voiced before unvoiced
        if (devoiceMap[curr] && unvoicedConsonants[next]) {
            const fromIPA = voicedConsonants[curr];
            const toIPA = devoiceMap[curr];
            explanations.push({
                html: `<strong>⟨${curr}${next}⟩</strong> → /${toIPA}${unvoicedConsonants[next]}/ — /${fromIPA}/ devoices before unvoiced consonant <span class="cite">(p. ${devoicePages[curr]})</span>`,
                priority: 2
            });
        }
        
        // Voicing: unvoiced before voiced (except sonorants and в)
        const voicingTriggers = ['б', 'г', 'д', 'ж', 'з'];
        if (voiceMap[curr] && voicingTriggers.includes(next)) {
            const fromIPA = unvoicedConsonants[curr];
            const toIPA = voiceMap[curr];
            explanations.push({
                html: `<strong>⟨${curr}${next}⟩</strong> → /${toIPA}${voicedConsonants[next]}/ — /${fromIPA}/ voices before voiced consonant <span class="cite">(p. ${voicePages[curr]})</span>`,
                priority: 2
            });
        }
    }
    
    // ================================================================
    // TIER 3: Notable palatalization (if word has interesting cases)
    // ================================================================
    
    // Check for soft н → ɲ (often surprises learners)
    if (/н[еёиюяь]/.test(wordLower)) {
        explanations.push({
            html: `<strong>⟨нь⟩</strong> or ⟨н⟩+soft vowel → /ɲ/ — true palatal nasal <span class="cite">(p. 183)</span>`,
            priority: 3
        });
    }
    
    // Check for hard л → ɫ 
    if (/л[аоуыэ]|л$|л[бвгджзклмнпрстфхцчшщ]/.test(wordLower)) {
        explanations.push({
            html: `<strong>⟨л⟩</strong> (hard) → /ɫ/ — velarized, tongue back raised <span class="cite">(p. 150)</span>`,
            priority: 4  // Lower priority, common knowledge
        });
    }
    
    // ================================================================
    // TIER 4: Default rules (only show if nothing else applies)
    // ================================================================
    
    // Only add default vowel rule if we have almost nothing else
    if (explanations.filter(e => e.priority <= 2).length === 0) {
        // Check for akanye (о → а in pretonic)
        if (/о/.test(wordLower) && processed.stressIndex >= 0) {
            const syllables = processed.syllables;
            for (let i = 0; i < syllables.length; i++) {
                if (i !== processed.stressIndex && /о/.test(syllables[i].cyrillic.toLowerCase())) {
                    explanations.push({
                        html: `Unstressed ⟨о⟩ → /ɑ/ or /ʌ/ — vowel reduction (akanye) <span class="cite">(p. 127)</span>`,
                        priority: 4
                    });
                    break;
                }
            }
        }
    }
    
    // Sort by priority, then take top results
    explanations.sort((a, b) => a.priority - b.priority);
    
    // Deduplicate by checking for similar content
    const seen = new Set();
    const unique = explanations.filter(exp => {
        const key = exp.html.substring(0, 30);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    
    return unique.slice(0, 4);  // Max 4 explanations
}

/**
 * Show explanation panel for a word's transcription
 */
function showExplanationPanel(wordIndex) {
    // Remove any existing panel
    closeExplanationPanel();
    
    const wordData = processedWords[wordIndex];
    if (!wordData) return;
    
    // Get card element for positioning (the visible front face, not container)
    const cardContainer = document.getElementById(`card-${wordIndex}`);
    const card = cardContainer?.querySelector('.word-card-front') || cardContainer;
    
    const { processed, originalWord } = wordData;
    
    // Generate curated explanations
    const explanations = generateCuratedExplanations(wordData);
    
    // Build explanation panel HTML
    const panel = document.createElement('div');
    panel.className = 'explanation-panel';
    panel.id = 'explanation-panel';
    
    const cyrillicDisplay = getCyrillicWithStress(processed);
    
    // Get IPA for display
    let ipaDisplay;
    if (wordData.ipaEditorState) {
        const { units, boundaries } = wordData.ipaEditorState;
        const parts = [];
        let start = 0;
        for (const b of boundaries) {
            parts.push(units.slice(start, b).map(u => u.symbol).join(''));
            start = b;
        }
        parts.push(units.slice(start).map(u => u.symbol).join(''));
        const stressIdx = processed.stressIndex;
        if (stressIdx >= 0 && stressIdx < parts.length && processed.showStressMarker) {
            parts[stressIdx] = 'ˈ' + parts[stressIdx];
        }
        ipaDisplay = parts.filter(p => p.length > 0).join(' ');
    } else {
        ipaDisplay = processed.syllables.map((s, idx) => {
            const stressMark = s.showStressMarker ? 'ˈ' : '';
            return stressMark + s.ipa;
        }).filter(s => s.length > 0).join(' ');
    }
    ipaDisplay = applyNotationPreferences(applyStyleSettings(ipaDisplay));
    
    let explanationHTML;
    if (explanations.length > 0) {
        explanationHTML = explanations.map(exp => `<p class="why-item">${exp.html}</p>`).join('');
    } else {
        explanationHTML = '<p class="why-item">This word follows standard transcription rules.</p>';
    }
    
    panel.innerHTML = `
        <span class="explanation-panel-close" onclick="closeExplanationPanel()" title="Close">✕</span>
        <div class="explanation-panel-header">
            <span class="explanation-panel-title">${cyrillicDisplay}</span>
            <span class="explanation-panel-ipa">/${ipaDisplay}/</span>
        </div>
        <div class="explanation-panel-body">
            ${explanationHTML}
        </div>
        <div class="explanation-panel-citation">
            Source: Grayson, <em>Russian Lyric Diction</em> (2012)
        </div>
    `;
    
    // Position panel near the card using scroll-aware coordinates
    if (card) {
        placePanelNearCard(card, panel);
    } else {
        // Fallback: center on screen
        panel.style.position = 'fixed';
        panel.style.left = '50%';
        panel.style.top = '50%';
        panel.style.transform = 'translate(-50%, -50%)';
        panel.style.transformOrigin = 'center center';
    }
    
    panel.style.animation = 'emergeFromCard 0.45s ease-out forwards';
    
    document.body.appendChild(panel);
    
    // Re-position on scroll/resize (throttled)
    let repositionTimeout;
    const repositionHandler = () => {
        clearTimeout(repositionTimeout);
        repositionTimeout = setTimeout(() => {
            if (card && document.getElementById('explanation-panel')) {
                placePanelNearCard(card, panel);
            }
        }, 50);
    };
    window.addEventListener('scroll', repositionHandler);
    window.addEventListener('resize', repositionHandler);
    
    // Store handlers for cleanup
    panel._repositionHandler = repositionHandler;
    
    // Prevent scroll on panel wheel events
    panel.addEventListener('wheel', (e) => {
        const body = panel.querySelector('.explanation-panel-body');
        if (body) {
            const atTop = body.scrollTop === 0;
            const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight;
            
            if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
                e.preventDefault();
            }
        }
    }, { passive: false });
    
    // Close on click outside panel (delay to avoid immediate close)
    setTimeout(() => {
        document.addEventListener('click', handleExplanationClickOutside);
    }, 10);
    
    // Close on escape key
    document.addEventListener('keydown', handleExplanationEscape);
}

/**
 * Position panel adjacent to card, scroll-aware
 * KIMI's fix: use absolute positioning with scrollX/scrollY offsets
 */
function placePanelNearCard(card, panel, gap = 12) {
    const r = card.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    
    const panelWidth = Math.min(350, vw - 40);
    panel.style.maxWidth = `${panelWidth}px`;
    
    // Start with panel to the right of card
    let left = r.right + scrollX + gap;
    let top = r.top + scrollY;
    
    // If overflows right, try left side
    if (left + panelWidth > scrollX + vw - 20) {
        left = r.left + scrollX - panelWidth - gap;
    }
    
    // Clamp to viewport
    if (left < scrollX + 10) {
        left = scrollX + 10;
    }
    
    // Keep top within reasonable bounds
    if (top < scrollY + 10) {
        top = scrollY + 10;
    }
    
    panel.style.position = 'absolute';
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
}

function handleExplanationClickOutside(e) {
    const panel = document.getElementById('explanation-panel');
    if (panel && !panel.contains(e.target) && !e.target.closest('.why-icon')) {
        closeExplanationPanel();
    }
}

function closeExplanationPanel() {
    const panel = document.getElementById('explanation-panel');
    if (panel) {
        // Clean up scroll/resize handlers
        if (panel._repositionHandler) {
            window.removeEventListener('scroll', panel._repositionHandler);
            window.removeEventListener('resize', panel._repositionHandler);
        }
        // Animate out
        panel.style.animation = 'recedeToCard 0.3s ease-in forwards';
        // Remove after animation completes
        setTimeout(() => {
            if (panel.parentNode) panel.remove();
        }, 300);
    }
    document.removeEventListener('keydown', handleExplanationEscape);
    document.removeEventListener('click', handleExplanationClickOutside);
}

function handleExplanationEscape(e) {
    if (e.key === 'Escape') closeExplanationPanel();
}

// Render the output
/**
 * Add stress mark (combining acute accent) to the vowel in a syllable
 * Exception: ё already indicates stress via its dieresis, so no acute needed
 */
function addStressToSyllable(syllable) {
    const vowelSet = new Set(['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я',
                              'А', 'Е', 'Ё', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я']);
    const chars = Array.from(syllable);
    let result = '';
    let stressAdded = false;
    
    for (const char of chars) {
        result += char;
        // Skip adding acute to ё/Ё - the dieresis already indicates stress
        if (!stressAdded && vowelSet.has(char) && char !== 'ё' && char !== 'Ё') {
            result += '\u0301'; // Combining acute accent
            stressAdded = true;
        }
        // For ё, mark stress as "added" so we don't add acute to a later vowel
        if (char === 'ё' || char === 'Ё') {
            stressAdded = true;
        }
    }
    return result;
}

/**
 * Get Cyrillic word with stress mark (combining acute accent) on stressed vowel
 * Exception: ё already indicates stress via its dieresis, so no acute needed
 */
function getCyrillicWithStress(processed) {
    const stressIdx = processed.stressIndex;
    if (stressIdx === -1) {
        // No stress marked, return plain
        return processed.syllables.map(s => s.cyrillic).join('');
    }
    
    // Build the word, adding combining acute (U+0301) after the stressed vowel
    const vowelSet = new Set(['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я']);
    let result = '';
    
    processed.syllables.forEach((syl, sylIdx) => {
        if (sylIdx === stressIdx) {
            // Find the vowel in this syllable and add stress mark after it
            const chars = Array.from(syl.cyrillic);
            let stressAdded = false;
            for (let i = 0; i < chars.length; i++) {
                result += chars[i];
                const lowerChar = chars[i].toLowerCase();
                // Skip adding acute to ё - the dieresis already indicates stress
                if (!stressAdded && vowelSet.has(lowerChar) && lowerChar !== 'ё') {
                    result += '\u0301'; // Combining acute accent
                    stressAdded = true;
                }
                // For ё, mark stress as "added" so we don't add acute to a later vowel
                if (lowerChar === 'ё') {
                    stressAdded = true;
                }
            }
        } else {
            result += syl.cyrillic;
        }
    });
    
    return result;
}

function renderOutput() {
    const outputDiv = document.getElementById('output');

    if (processedWords.length === 0) {
        outputDiv.innerHTML = '';
        return;
    }
    
    // Count statistics
    const dictCount = processedWords.filter(w => ['dictionary', 'wiktionary', 'ё-rule', 'ё-exception'].includes(w.stressSource)).length;
    const userCount = processedWords.filter(w => w.stressSource === 'user').length;
    const composerCount = processedWords.filter(w => w.stressSource === 'composer').length;
    const overrideCount = userCount + composerCount + processedWords.filter(w => w.stressSource === 'mismatch').length;
    const placeholderCount = processedWords.filter(w => w.stressSource === 'placeholder').length;
    const totalCount = processedWords.length;
    
    // Build override label
    let overrideLabel = 'your choice';
    if (userCount > 0 && composerCount > 0) {
        overrideLabel = `your choice (${userCount}) + composer (${composerCount})`;
    } else if (composerCount > 0) {
        overrideLabel = `composer's score`;
    }

    const html = `
        <div class="info-box" style="margin-top: 30px;">
            <h3>Transcription Results</h3>
            <p style="line-height: 1.8;">
                <span style="display: inline-block; width: 12px; height: 12px; border: 2px solid #48bb78; border-radius: 50%; vertical-align: middle; margin-right: 4px;"></span>verified (${dictCount})
                <span style="display: inline-block; width: 12px; height: 12px; border: 2px solid #3B82F6; border-radius: 50%; vertical-align: middle; margin-left: 12px; margin-right: 4px;"></span>${overrideLabel} (${overrideCount})
                <span style="display: inline-block; width: 12px; height: 12px; border: 2px dashed rgba(140,140,140,0.35); border-radius: 50%; vertical-align: middle; margin-left: 12px; margin-right: 4px;"></span>needs attention (${placeholderCount})
            </p>
        </div>
        <div class="word-grid">
            ${processedWords.map((wordData, wordIdx) => {
                const { processed, isClitic, isStandaloneClitic, stressSource, ёException } = wordData;
                
                // Initialize IPA editor state if not present (for proper syllable spacing)
                if (!wordData.ipaEditorState && processed.syllables.length > 1) {
                    getWordIPAWithBoundaries(wordIdx);
                }
                
                // Build IPA with syllable spacing
                let fullIPA;
                if (wordData.ipaEditorState) {
                    // Use edited state with boundaries
                    const { units, boundaries } = wordData.ipaEditorState;
                    const parts = [];
                    let start = 0;
                    for (const b of boundaries) {
                        parts.push(units.slice(start, b).map(u => u.symbol).join(''));
                        start = b;
                    }
                    parts.push(units.slice(start).map(u => u.symbol).join(''));
                    // Add stress mark to stressed syllable
                    const stressIdx = processed.stressIndex;
                    if (stressIdx >= 0 && stressIdx < parts.length && processed.showStressMarker) {
                        parts[stressIdx] = 'ˈ' + parts[stressIdx];
                    }
                    fullIPA = parts.filter(p => p.length > 0).join(' ');
                } else {
                    // Original syllable-based IPA (monosyllables)
                    fullIPA = processed.syllables.map((s, idx) => {
                        const stressMark = s.showStressMarker ? 'ˈ' : '';
                        return stressMark + s.ipa;
                    }).filter(s => s.length > 0).join(' ');
                }
                
                // Apply notation preferences (e.g., ʃʲʃʲ → ʃʲː toggle)
                fullIPA = applyNotationPreferences(applyStyleSettings(fullIPA));
                
                // Validate IPA output against Grayson inventory
                if (DEBUG && !validateIPAOutput(fullIPA)) {
                    console.error(`Validation failed for: ${wordData.originalWord}`);
                }
                
                // PROVENANCE VIA CIRCLE COLOUR ONLY (no icons)
                // - Green = verified (dictionary, Wiktionary, ё-rule)
                // - Blue = user-assigned
                // - Grey dotted = placeholder (needs attention)
                // Tooltip on stressed syllable carries the full provenance sentence
                // Exception info (pronunciation irregularities) shown in Why section, not on card

                return `
                    <div class="word-card-container${isStandaloneClitic ? ' clitic-card' : ''}" id="card-${wordIdx}">
                        <div class="word-card-inner">
                            <div class="word-card-front word-card">
                                                                        <button class="why-icon" onclick="showExplanationPanel(${wordIdx})" aria-label="IPA notes" title="Why this transcription?">?</button>
                                <div class="cyrillic">
                                    ${(() => {
                                        // Calculate proclitic syllable count for spacing
                                        let procliticSyllableCount = 0;
                                        let procliticText = '';
                                        let encliticText = '';
                                        let mainText = '';
                                        
                                        if (wordData.mergedParts && wordData.mergedParts.length > 1) {
                                            const procliticPart = wordData.mergedParts.find(p => p.type === 'proclitic');
                                            const encliticPart = wordData.mergedParts.find(p => p.type === 'enclitic');
                                            const mainPart = wordData.mergedParts.find(p => p.type === 'main');
                                            
                                            if (procliticPart) {
                                                // Count vowels in proclitic to estimate syllables
                                                const vowels = procliticPart.text.toLowerCase().match(/[аеёиоуыэюя]/g);
                                                procliticSyllableCount = vowels ? vowels.length : 0; // 0 for vowelless proclitics
                                                procliticText = procliticPart.text.toLowerCase();
                                            }
                                            if (encliticPart) {
                                                encliticText = encliticPart.text.toLowerCase();
                                            }
                                            if (mainPart) {
                                                mainText = mainPart.text.toLowerCase();
                                            }
                                        }
                                        
                                        // Track cumulative characters to detect when enclitic starts
                                        let charCount = 0;
                                        const mainLength = mainText.length;
                                        
                                        return processed.syllables.map((syl, sylIdx) => {
                                        // Determine circle style based on stress source
                                        const isUserStress = wordData.stressSource === 'user' || wordData.stressSource === 'composer' || wordData.stressSource === 'mismatch';
                                        const isPlaceholder = wordData.stressSource === 'placeholder';
                                        const isVerified = ['dictionary', 'wiktionary', 'ё-rule', 'ё-exception'].includes(wordData.stressSource);
                                        
                                        let stressClass = '';
                                        if (syl.isStressed) {
                                            if (isPlaceholder) {
                                                stressClass = 'stressed placeholder-stress';
                                            } else if (isUserStress) {
                                                stressClass = 'stressed user-stress';
                                            } else {
                                                stressClass = 'stressed'; // green = verified
                                            }
                                        }
                                        
                                        // Add spacer class after proclitic
                                        const isAfterProclitic = procliticSyllableCount > 0 && sylIdx === procliticSyllableCount;
                                        
                                        // For enclitics: check if this syllable contains enclitic characters
                                        // by looking at whether the syllable text matches or contains the enclitic
                                        const sylLower = syl.cyrillic.toLowerCase();
                                        const containsEnclitic = encliticText && sylLower.includes(encliticText);
                                        const startsWithEnclitic = encliticText && sylLower.startsWith(encliticText);
                                        
                                        // If syllable contains enclitic and it's not the whole syllable, we need inline spacing
                                        // For now, add before-clitic class to syllables that END with the enclitic
                                        const endsWithEnclitic = encliticText && sylLower.endsWith(encliticText) && sylLower !== encliticText;
                                        
                                        let spacerClass = isAfterProclitic ? 'after-clitic' : '';
                                        // For vowelless enclitics merged into previous syllable, we handle via CSS
                                        if (encliticText && sylLower === encliticText) {
                                            spacerClass = 'before-clitic';
                                        }
                                        
                                        const clickableClass = 'clickable';
                                        
                                        // Check if this is the last syllable and contains an absorbed enclitic
                                        const isLastSyl = sylIdx === processed.syllables.length - 1;
                                        const hasAbsorbedEnclitic = isLastSyl && encliticText && 
                                            sylLower.endsWith(encliticText) && sylLower !== encliticText;
                                        
                                        // Add stress mark to stressed syllable
                                        let displayText = syl.isStressed ? addStressToSyllable(syl.cyrillic) : syl.cyrillic;
                                        
                                        // If proclitic is absorbed into first syllable, split it off with spacing
                                        const isFirstSyl = sylIdx === 0;
                                        const sylLowerForProclitic = syl.cyrillic.toLowerCase();
                                        const hasAbsorbedProclitic = isFirstSyl && procliticText && 
                                            sylLowerForProclitic.startsWith(procliticText) && sylLowerForProclitic !== procliticText;
                                        
                                        if (hasAbsorbedProclitic) {
                                            const procliticDisplay = syl.cyrillic.slice(0, procliticText.length);
                                            const mainPartDisplay = syl.cyrillic.slice(procliticText.length);
                                            const stressedMain = syl.isStressed ? addStressToSyllable(mainPartDisplay) : mainPartDisplay;
                                            displayText = `${procliticDisplay}<span class="proclitic-spacer"></span>${stressedMain}`;
                                        }
                                        
                                        // If enclitic is absorbed, split it off with spacing
                                        if (hasAbsorbedEnclitic) {
                                            const mainPart = syl.cyrillic.slice(0, -encliticText.length);
                                            const encliticDisplay = syl.cyrillic.slice(-encliticText.length);
                                            const stressedMain = syl.isStressed ? addStressToSyllable(mainPart) : mainPart;
                                            displayText = `${stressedMain}<span class="enclitic-spacer"></span>${encliticDisplay}`;
                                        }
                                        
                                        // Dynamic tooltip based on provenance
                                        const hasЁ = /ё/i.test(syl.cyrillic);
                                        const hasЕ = /е/i.test(syl.cyrillic);
                                        let tooltip = 'Click to stress';
                                        
                                        if (syl.isStressed) {
                                            if (isPlaceholder) {
                                                tooltip = 'Temporary stress — tap to confirm or move';
                                            } else if (wordData.stressSource === 'user') {
                                                tooltip = `Your choice — syllable ${sylIdx + 1}`;
                                            } else if (wordData.stressSource === 'composer') {
                                                tooltip = `Composer's score — syllable ${sylIdx + 1}`;
                                            } else if (wordData.stressSource === 'dictionary') {
                                                tooltip = 'Stress verified — Vuizur dictionary';
                                            } else if (wordData.stressSource === 'wiktionary') {
                                                tooltip = 'Stress verified — Wiktionary lookup';
                                            } else if (wordData.stressSource === 'ё-rule') {
                                                tooltip = 'Stress on ⟨ё⟩ is always marked';
                                            } else if (wordData.stressSource === 'ё-exception') {
                                                tooltip = 'Printed ⟨е⟩ is actually ⟨ё⟩ — stress verified';
                                            }
                                            
                                            // Add е↔ё hint if applicable
                                            if (hasЁ) {
                                                tooltip += ' • Double-click to restore ⟨е⟩';
                                            } else if (hasЕ && isVerified) {
                                                tooltip += ' • Double-click to change to ⟨ё⟩';
                                            }
                                        } else if (hasЕ || hasЁ) {
                                            tooltip = 'Click to stress • Then double-click for е↔ё';
                                        }
                                        
                                        return `<span class="syllable ${stressClass} ${clickableClass} ${spacerClass}" 
                                                     onclick="handleSyllableClick(${wordIdx}, ${sylIdx})"
                                                     title="${tooltip}">
                                                    ${displayText}
                                                </span>`;
                                        }).join('');
                                    })()}${(() => {
                                        // If there's an enclitic, render it as a separate visual element
                                        if (wordData.mergedParts && wordData.mergedParts.length > 1) {
                                            const encliticPart = wordData.mergedParts.find(p => p.type === 'enclitic');
                                            if (encliticPart) {
                                                // Check if the enclitic is absorbed into the last syllable
                                                const lastSyl = processed.syllables[processed.syllables.length - 1];
                                                const lastSylLower = lastSyl?.cyrillic.toLowerCase() || '';
                                                const encliticLower = encliticPart.text.toLowerCase();
                                                
                                                if (lastSylLower.endsWith(encliticLower) && lastSylLower !== encliticLower) {
                                                    // Enclitic was absorbed — we need to visually separate it
                                                    // Return empty here; we'll handle this by modifying the syllable rendering above
                                                }
                                            }
                                        }
                                        return '';
                                    })()}
                                </div>
                                <div class="ipa">/${fullIPA}/</div>
                                                                        <button class="flip-button" onclick="flipCard(${wordIdx})" aria-label="Edit syllables"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M4 12a8 8 0 0 1 8-8c2.8 0 5.2 1.4 6.7 3.5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M20 12a8 8 0 0 1-8 8c-2.8 0-5.2-1.4-6.7-3.5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M20 4v4h-4" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 20v-4h4" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                            </div>
                            <div class="word-card-back">
                                <div class="card-back-header">
                                    <span class="card-back-title">${getCyrillicWithStress(processed)}</span>
                                </div>
                                ${renderSyllableEditor(wordIdx)}
                                <button class="card-back-close" onclick="flipCard(${wordIdx})" title="Done"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M4 12a8 8 0 0 1 8-8c2.8 0 5.2 1.4 6.7 3.5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M20 12a8 8 0 0 1-8 8c-2.8 0-5.2-1.4-6.7-3.5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M20 4v4h-4" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 20v-4h4" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                            </div>
                            <div class="word-card-sizer">
                                                                        <div class="sizer-front">
                                                                            <div class="cyrillic">${processed.syllables.map(s => s.cyrillic).join('')}</div>
                                                                            <div class="ipa">/${fullIPA}/</div>
                                                                        </div>
                                                                        <div class="sizer-back">${getIPAForSizer(wordIdx)}</div>
                                                                    </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    outputDiv.innerHTML = html;
    showViewToggle();
    
    // Equalize card heights per row after render
    requestAnimationFrame(() => {
        equalizeCardHeights();
    });
}

/**
 * Equalize card heights within each visual row
 * Cards in the same row should have uniform height
 */
function equalizeCardHeights() {
    const cards = document.querySelectorAll('.word-card-container');
    if (cards.length === 0) return;
    
    // Group cards by their top position (same row = same top)
    const rows = new Map();
    cards.forEach(card => {
        const top = Math.round(card.getBoundingClientRect().top);
        if (!rows.has(top)) rows.set(top, []);
        rows.get(top).push(card);
    });
    
    // For each row, find max height and apply to all
    rows.forEach(rowCards => {
        // Reset heights first to get natural height
        rowCards.forEach(card => {
            const inner = card.querySelector('.word-card');
            if (inner) inner.style.height = 'auto';
        });
        
        // Measure max natural height in this row
        let maxHeight = 0;
        rowCards.forEach(card => {
            const inner = card.querySelector('.word-card');
            if (inner) {
                maxHeight = Math.max(maxHeight, inner.offsetHeight);
            }
        });
        
        // Apply max height to all cards in row
        rowCards.forEach(card => {
            const inner = card.querySelector('.word-card');
            if (inner) {
                inner.style.height = maxHeight + 'px';
            }
        });
    });
}

// ============================================================================
// SYLLABLE BOUNDARY EDITOR
// ============================================================================
// These functions power the card-flip syllable adjustment feature.
// 
// UX Philosophy: This is COSMETIC adjustment, not structural editing.
// Users are "tinkering with the guts" but really just moving consonants
// across syllable boundaries to suit their preferred syllabification.
// 
// The IPA retranscribes automatically after each move, maintaining
// phonetic accuracy while letting users choose boundary placement.
// ============================================================================

/**
 * Flip a word card to show/hide the syllable boundary editor
 * Uses CSS 3D transform (rotateY) for satisfying flip animation
 */
function flipCard(wordIdx) {
    const container = document.getElementById(`card-${wordIdx}`);
    if (container) {
        // Add flipping class for transition effects
        container.classList.add('flipping');
        container.classList.toggle('flipped');
        
        // Remove flipping class after animation completes
        setTimeout(() => {
            container.classList.remove('flipping');
        }, 600); // Match transition duration
    }
}

/**
 * Parse IPA string into phoneme units for the syllable editor
 * 
 * Returns array of { symbol, isVowel, isGeminate, baseConsonant }
 * Handles: single consonants, geminates (Cː), affricates (ts, tʃ, etc.), vowels
 * 
 * NOTE: tːs is NOT an affricate - it's elongated t + plain s (from -тся cluster)
 * The tː is the geminate that can split, s is a separate consonant
 */
function parseIPAtoUnits(ipa) {
    const units = [];
    const ipaVowels = new Set(['ɑ', 'a', 'o', 'ɔ', 'ɛ', 'e', 'i', 'ɪ', 'ɨ', 'u', 'ʊ', 'ʌ']);
    // True affricates (single articulation units) - NOT tːs which is t + s
    const affricates = ['ʃʲʃʲ', 'tʃʲ', 'tʃ', 'ts', 'dʒ', 'ʃː', 'ʒː'];
    
    let i = 0;
    while (i < ipa.length) {
        // Skip stress markers
        if (ipa[i] === 'ˈ' || ipa[i] === 'ˌ') {
            i++;
            continue;
        }
        
        // Check for affricates/clusters first (multi-char units)
        let foundAffricate = false;
        for (const aff of affricates) {
            if (ipa.substring(i).startsWith(aff)) {
                units.push({
                    symbol: aff,
                    isVowel: false,
                    isGeminate: aff.includes('ː'),
                    baseConsonant: aff.replace('ː', '')
                });
                i += aff.length;
                foundAffricate = true;
                break;
            }
        }
        if (foundAffricate) continue;
        
        // Check for vowels
        if (ipaVowels.has(ipa[i])) {
            units.push({
                symbol: ipa[i],
                isVowel: true,
                isGeminate: false,
                baseConsonant: null
            });
            i++;
            continue;
        }
        
        // Consonant - check for following modifiers
        let consonant = ipa[i];
        i++;
        
        // Collect modifiers: palatalization ʲ, length ː, etc.
        while (i < ipa.length && (ipa[i] === 'ʲ' || ipa[i] === 'ʷ' || ipa[i] === 'ˠ' || ipa[i] === 'ː')) {
            consonant += ipa[i];
            i++;
        }
        
        const isGeminate = consonant.includes('ː');
        
        units.push({
            symbol: consonant,
            isVowel: false,
            isGeminate: isGeminate,
            baseConsonant: consonant.replace('ː', '')
        });
    }
    
    return units;
}

/**
 * Convert IPA units back to string
 */
function unitsToIPA(units) {
    return units.map(u => u.symbol).join('');
}

/**
 * Get combined IPA units for the whole word with boundary positions
 * 
 * Returns { units: [...], boundaries: [index1, index2, ...] }
 * where boundaries are indices in units array where syllable breaks occur
 */
function getWordIPAWithBoundaries(wordIdx) {
    const wordData = processedWords[wordIdx];
    
    // Initialize if needed
    if (!wordData.ipaEditorState) {
        // Parse each syllable's IPA separately to preserve original boundaries
        const syllables = wordData.processed.syllables;
        const allUnits = [];
        const boundaries = [];
        
        for (let sylIdx = 0; sylIdx < syllables.length; sylIdx++) {
            const sylIPA = syllables[sylIdx].ipa;
            const sylUnits = parseIPAtoUnits(sylIPA);
            
            // Add units from this syllable
            allUnits.push(...sylUnits);
            
            // Add boundary after this syllable (except after last syllable)
            if (sylIdx < syllables.length - 1) {
                boundaries.push(allUnits.length);
            }
        }
        
        wordData.ipaEditorState = { units: allUnits, boundaries };
    }
    
    return wordData.ipaEditorState;
}

/**
 * Get IPA content for hidden sizer element (controls card width)
 */
function getIPAForSizer(wordIdx) {
    const wordData = processedWords[wordIdx];
    if (!wordData) return '';
    const syllables = wordData.processed.syllables;
    
    // Always return IPA content for proper sizing
    if (syllables.length <= 1) {
        return syllables[0]?.ipa || '';
    }
    
    // Build IPA string with pipes for boundaries
    const parts = syllables.map(s => s.ipa);
    return parts.join(' | ');
}

/**
 * Render the IPA syllable boundary editor
 * 
 * Features:
 * - Shows IPA (not Cyrillic) for direct phonetic editing
 * - Red pipe | at syllable boundaries
 * - Drag consonant to move it across boundary
 * - Geminates split when dragged: tː → t|t (with fade animation on ː)
 * - Adjacent identical consonants merge: t+t → tː
 */
function renderSyllableEditor(wordIdx) {
    const wordData = processedWords[wordIdx];
    const syllables = wordData.processed.syllables;
    
    if (syllables.length <= 1) {
        // Single syllable — show IPA only (no boundaries to edit)
        const ipa = syllables[0]?.ipa || '';
        // Add stress mark if this syllable is stressed
        const stressMarker = syllables[0]?.isStressed ? 'ˈ' : '';
        return `<div class="syllable-editor" style="font-size: 2em;">${stressMarker}${ipa}</div>`;
    }
    
    const state = getWordIPAWithBoundaries(wordIdx);
    const { units, boundaries } = state;
    
    // Get stress info to add stress marker
    const stressIdx = wordData.processed.stressIndex;
    const showStressMarker = wordData.processed.showStressMarker;
    
    // Find which unit index starts the stressed syllable
    // Syllable N starts at boundary[N-1] (or 0 for first syllable)
    let stressedUnitStart = -1;
    if (showStressMarker && stressIdx >= 0) {
        if (stressIdx === 0) {
            stressedUnitStart = 0;
        } else if (stressIdx <= boundaries.length) {
            stressedUnitStart = boundaries[stressIdx - 1];
        }
    }
    
    let html = '<div class="syllable-editor">';
    
    units.forEach((unit, idx) => {
        // Check if there's a boundary before this unit
        const boundaryBefore = boundaries.includes(idx);
        
        if (boundaryBefore) {
            html += `<span class="boundary-pipe" data-boundary="${idx}">|</span>`;
        }
        
        // Add stress marker before the first unit of the stressed syllable
        if (idx === stressedUnitStart) {
            html += `<span class="stress-marker">ˈ</span>`;
        }
        
        // Is this unit at a boundary? (movable)
        const isAtBoundaryLeft = boundaries.includes(idx); // unit is right after a boundary
        const isAtBoundaryRight = boundaries.includes(idx + 1); // unit is right before a boundary
        const isMovable = !unit.isVowel && (isAtBoundaryLeft || isAtBoundaryRight);
        
        
        // Determine drag direction
        let dragDir = '';
        if (isAtBoundaryLeft && !isAtBoundaryRight) dragDir = 'left';
        else if (isAtBoundaryRight && !isAtBoundaryLeft) dragDir = 'right';
        else if (isAtBoundaryLeft && isAtBoundaryRight) dragDir = 'both';
        
        const classes = [
            'char-unit',
            unit.isVowel ? 'vowel' : '',
            isMovable ? 'movable' : '',
            unit.isGeminate ? 'geminate' : ''
        ].filter(Boolean).join(' ');
        
        // For geminates, split the display to allow length marker to fade
        let displaySymbol = unit.symbol;
        if (unit.isGeminate && isMovable) {
            const base = unit.baseConsonant;
            displaySymbol = `${base}<span class="length-marker">ː</span>`;
        }
        
        const mouseHandler = isMovable ? 
            `onmousedown="startDrag(event, ${wordIdx}, ${idx}, '${dragDir}', ${unit.isGeminate}, '${unit.baseConsonant || unit.symbol}')"` 
            : '';
        
        const title = isMovable ? 
            (unit.isGeminate ? 'Drag to split and move' : 'Drag to move') : '';
        
        html += `<span class="${classes}" ${mouseHandler} title="${title}" id="unit-${wordIdx}-${idx}">${displaySymbol}</span>`;
    });
    
    html += '</div>';
    return html;
}

// Drag state
let dragState = null;
let dragGhost = null;

/**
 * Start dragging a consonant
 */
function startDrag(event, wordIdx, unitIdx, dir, isGeminate, baseConsonant) {
    event.preventDefault();
    
    const state = getWordIPAWithBoundaries(wordIdx);
    const { units, boundaries } = state;
    
    
    // Create ghost element
    dragGhost = document.createElement('span');
    dragGhost.className = 'drag-ghost';
    dragGhost.textContent = baseConsonant.replace('ː', '');
    document.body.appendChild(dragGhost);
    
    // Position ghost at cursor
    dragGhost.style.left = event.clientX + 'px';
    dragGhost.style.top = event.clientY + 'px';
    
    // Find the boundary element based on direction
    const boundaryDataIdx = dir === 'left' ? unitIdx : unitIdx + 1;
    const boundaryEl = document.querySelector(`#card-${wordIdx} .boundary-pipe[data-boundary="${boundaryDataIdx}"]`);
    
    const boundaryX = boundaryEl ? boundaryEl.getBoundingClientRect().left + boundaryEl.offsetWidth / 2 : null;
    
    if (!boundaryX) {
    }
    
    dragState = {
        wordIdx,
        unitIdx,
        dir,
        isGeminate,
        baseConsonant: baseConsonant.replace('ː', ''),
        startX: event.clientX,
        boundaryX: boundaryX || event.clientX
    };
    
    // Mark original element
    const originalEl = document.getElementById(`unit-${wordIdx}-${unitIdx}`);
    if (originalEl) {
        if (isGeminate) {
            // Geminate: fade the element (length marker fades separately)
            originalEl.classList.add('dragging');
        } else {
            // Non-geminate: hide completely (we're lifting it)
            originalEl.classList.add('dragging-away');
        }
    }
    
    // Add event listeners
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
}

/**
 * Handle drag movement
 */
function onDrag(event) {
    if (!dragState || !dragGhost) return;
    
    // Move ghost
    dragGhost.style.left = event.clientX + 'px';
    dragGhost.style.top = event.clientY + 'px';
    
    // If geminate, fade the length marker based on distance from start
    if (dragState.isGeminate) {
        const originalEl = document.getElementById(`unit-${dragState.wordIdx}-${dragState.unitIdx}`);
        const lengthMarker = originalEl?.querySelector('.length-marker');
        if (lengthMarker) {
            const distance = Math.abs(event.clientX - dragState.startX);
            const fadeAmount = Math.min(1, distance / 60);
            lengthMarker.style.opacity = 1 - fadeAmount;
        }
    }
    
    // Update ghost opacity based on valid drop position
    const crossedBoundary = dragState.dir === 'left' 
        ? event.clientX < dragState.boundaryX - 10
        : event.clientX > dragState.boundaryX + 10;
    
    dragGhost.style.opacity = crossedBoundary ? '1' : '0.5';
}

/**
 * End drag - execute move if valid drop
 * 
 * Simple rule: if cursor ends up on the opposite side of the pipe from where
 * it started, execute the move. Otherwise return to origin.
 */
function endDrag(event) {
    if (!dragState) return;
    
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    
    // Simple check: is cursor on the opposite side of the boundary?
    // For LEFT drag: cursor needs to be LEFT of the pipe (dropX < boundaryX)
    // For RIGHT drag: cursor needs to be RIGHT of the pipe (dropX > boundaryX)
    const crossedBoundary = dragState.dir === 'left' 
        ? event.clientX < dragState.boundaryX
        : event.clientX > dragState.boundaryX;
    
    
    // Clean up ghost
    if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
    }
    
    // Reset original element
    const originalEl = document.getElementById(`unit-${dragState.wordIdx}-${dragState.unitIdx}`);
    if (originalEl) {
        originalEl.classList.remove('dragging');
        originalEl.classList.remove('dragging-away');
        const lengthMarker = originalEl.querySelector('.length-marker');
        if (lengthMarker) {
            lengthMarker.style.opacity = '1';
        }
    }
    
    // Execute move if crossed boundary
    if (crossedBoundary) {
        if (dragState.dir === 'left') {
            moveIPAUnitLeft(dragState.wordIdx, dragState.unitIdx);
        } else {
            moveIPAUnitRight(dragState.wordIdx, dragState.unitIdx);
        }
    } else {
    }
    
    dragState = null;
}

/**
 * Move a consonant left across the boundary
 * 
 * RULE: Consonant lands at the EXTREMITY of the destination syllable
 * - Lands immediately to the LEFT of the boundary (right edge of left syllable)
 * - Pushes existing consonants further left (toward vowel)
 */
function moveIPAUnitLeft(wordIdx, unitIdx) {
    const state = getWordIPAWithBoundaries(wordIdx);
    const { units, boundaries } = state;
    
    const boundaryIdx = boundaries.indexOf(unitIdx);
    if (boundaryIdx === -1) {
        return;
    }
    
    const unit = units[unitIdx];
    const boundaryPos = boundaries[boundaryIdx];
    
    if (unit.isGeminate) {
        // SPLIT: one stays at boundary, one goes immediately left of boundary
        const base = unit.baseConsonant;
        
        // Replace geminate with single (stays on right side of boundary)
        units[unitIdx] = { symbol: base, isVowel: false, isGeminate: false, baseConsonant: base };
        
        // Insert new consonant immediately before the boundary
        units.splice(boundaryPos, 0, { symbol: base, isVowel: false, isGeminate: false, baseConsonant: base });
        
        // Boundary shifts right (we inserted at its position)
        boundaries[boundaryIdx]++;
        
        
        // Check merge with left neighbor
        checkAndMergeAt(units, boundaries, boundaryPos - 1);
        
    } else {
        // SIMPLE MOVE: remove from right of boundary, place at right edge of left syllable
        //
        // Example: vʲjotː | sʌ with boundary at 4
        // Units: [vʲ(0), j(1), o(2), tː(3), s(4), ʌ(5)]
        // We want: vʲjotːs | ʌ with boundary at 5
        // Result: [vʲ(0), j(1), o(2), tː(3), s(4), ʌ(5)] with boundary at 5
        //
        // The s stays at position 4, but boundary moves from 4 to 5!
        
        const removed = units.splice(unitIdx, 1)[0];
        // After removal: [vʲ, j, o, tː, ʌ] - tː at 3, ʌ at 4
        
        // Insert at boundaryPos (which is now where ʌ is, but we want s BEFORE ʌ)
        // splice(4, 0, s) puts s at index 4, pushing ʌ to 5
        units.splice(boundaryPos, 0, removed);
        // After insert: [vʲ, j, o, tː, s, ʌ] - s at 4, ʌ at 5
        
        // Boundary moves to 5 (after s, before ʌ)
        boundaries[boundaryIdx]++;
        
        
        // Check merge with LEFT neighbor (at boundaryPos - 1, which is tː at index 3)
        // The moved consonant is now at boundaryPos (index 4)
        checkAndMergeAt(units, boundaries, boundaryPos - 1);
    }
    
    updateDisplayFromState(wordIdx);
    rerenderSyllableEditor(wordIdx);
}

/**
 * Move a consonant right across the boundary
 * 
 * RULE: Consonant lands at the EXTREMITY of the destination syllable
 * - Lands immediately to the RIGHT of the boundary (left edge of right syllable)
 * - Pushes existing consonants further right (toward vowel)
 */
function moveIPAUnitRight(wordIdx, unitIdx) {
    const state = getWordIPAWithBoundaries(wordIdx);
    const { units, boundaries } = state;
    
    const boundaryIdx = boundaries.indexOf(unitIdx + 1);
    if (boundaryIdx === -1) {
        return;
    }
    
    const unit = units[unitIdx];
    const boundaryPos = boundaries[boundaryIdx];
    
    if (unit.isGeminate) {
        // SPLIT: one stays before boundary, one goes immediately right of boundary
        const base = unit.baseConsonant;
        
        // Replace geminate with single (stays on left side of boundary)
        units[unitIdx] = { symbol: base, isVowel: false, isGeminate: false, baseConsonant: base };
        
        // The boundary is between unitIdx and boundaryPos
        // Insert new consonant AT boundaryPos (which pushes everything right)
        // This puts it immediately AFTER the boundary
        units.splice(boundaryPos, 0, { symbol: base, isVowel: false, isGeminate: false, baseConsonant: base });
        
        // Boundary stays at boundaryPos (we inserted at its position, pushing it right)
        // Actually no - splice at boundaryPos pushes boundary right too
        // We want boundary to stay between the two t's
        // So boundary should stay at unitIdx + 1 = boundaryPos
        boundaries[boundaryIdx] = boundaryPos;  // Keep it where it was (between the two t's)
        
        
        // The new consonant at boundaryPos, check if it merges with its right neighbor
        checkAndMergeAt(units, boundaries, boundaryPos);
        
    } else {
        // SIMPLE MOVE: remove from left of boundary, place immediately right of boundary
        //
        // Example: vʲjotːs | ʌ with boundary at 5, s at index 4
        // Units: [vʲ(0), j(1), o(2), tː(3), s(4), ʌ(5)]
        // We want: vʲjotː | sʌ with boundary at 4
        // Result: [vʲ(0), j(1), o(2), tː(3), s(4), ʌ(5)] with boundary at 4
        //
        // The s stays at position 4, but boundary moves from 5 to 4!
        
        const removed = units.splice(unitIdx, 1)[0];
        // After removal: [vʲ, j, o, tː, ʌ] - tː at 3, ʌ at 4
        // Boundary was at 5, now should point to index 4 (where ʌ now is)
        
        // Boundary shifts left by 1 (we removed before it)
        boundaries[boundaryIdx]--;
        const newBoundaryPos = boundaries[boundaryIdx]; // Now 4
        
        // Insert AFTER the boundary (at newBoundaryPos, which is where ʌ is)
        // splice(4, 0, s) puts s at 4, pushing ʌ to 5
        units.splice(newBoundaryPos, 0, removed);
        // After insert: [vʲ, j, o, tː, s, ʌ] - but we want s AFTER boundary!
        
        // Hmm, this puts s back where it was. We need to insert at newBoundaryPos + 1
        // But wait, after removal ʌ is at 4. We want s to go AFTER ʌ.
        // splice(5, 0, s) would put s at 5, after ʌ.
        // But array only has 5 elements [0-4], so splice(5,0,s) appends.
        
        // Actually, the issue is we want boundary to DECREASE, not stay same.
        // Let me reconsider...
        //
        // Before: [vʲ,j,o,tː,s,ʌ] boundary=5 → vʲjotːs | ʌ
        // After:  [vʲ,j,o,tː,s,ʌ] boundary=4 → vʲjotː | sʌ
        //
        // The array doesn't change! Only the boundary moves left.
        // So we should: remove s, decrease boundary, insert s at NEW boundary position.
        
        // WAIT. That's what we did. Let me re-trace:
        // 1. Remove s at 4: [vʲ,j,o,tː,ʌ]
        // 2. boundary-- → 4
        // 3. Insert at 4: [vʲ,j,o,tː,s,ʌ] with s at 4
        // 4. boundary stays at 4
        // Result: vʲjotː | sʌ ✓
        //
        // But we're also doing boundary++ which puts it back to 5!
        
        // DON'T increment boundary - it should stay at newBoundaryPos
        // (we removed before boundary, inserted at boundary, net: boundary stays decreased)
        
        
        // Check merge with right neighbor
        const mergedAt = checkAndMergeAt(units, boundaries, newBoundaryPos);
        
        if (mergedAt) {
            boundaries[boundaryIdx] = newBoundaryPos;
        }
    }
    
    updateDisplayFromState(wordIdx);
    rerenderSyllableEditor(wordIdx);
}

/**
 * Re-render just the syllable editor without rebuilding entire output
 */
function rerenderSyllableEditor(wordIdx) {
    const cardBack = document.querySelector(`#card-${wordIdx} .word-card-back`);
    if (!cardBack) return;
    
    // Update the title with stress mark
    const titleEl = cardBack.querySelector('.card-back-title');
    if (titleEl) {
        const wordData = processedWords[wordIdx];
        titleEl.textContent = getCyrillicWithStress(wordData.processed);
    }
    
    // Find the syllable-editor div and replace its content
    const editorContainer = cardBack.querySelector('.syllable-editor');
    if (editorContainer) {
        const newEditorHTML = renderSyllableEditor(wordIdx);
        // Extract just the inner content (between the outer div tags)
        const temp = document.createElement('div');
        temp.innerHTML = newEditorHTML;
        editorContainer.innerHTML = temp.firstChild.innerHTML;
    }
}

/**
 * Check if units at idx and idx+1 should merge into a geminate
 * Returns true if merge happened, false otherwise
 * 
 * Special case: if merging at a boundary, the boundary shifts to after the geminate
 */
function checkAndMergeAt(units, boundaries, idx) {
    
    if (idx < 0 || idx >= units.length - 1) {
        return false;
    }
    
    const current = units[idx];
    const next = units[idx + 1];
    
    
    const boundaryBetween = boundaries.includes(idx + 1);
    
    // Merge if same base consonant, neither is already geminate
    // ALLOW merge even if boundary is between them (we'll shift the boundary)
    if (!current.isVowel && !next.isVowel &&
        current.baseConsonant && next.baseConsonant &&
        current.baseConsonant === next.baseConsonant &&
        !current.isGeminate && !next.isGeminate) {
        
        
        // If there was a boundary between them, note it
        if (boundaryBetween) {
        }
        
        // Merge into geminate
        units[idx] = {
            symbol: current.baseConsonant + 'ː',
            isVowel: false,
            isGeminate: true,
            baseConsonant: current.baseConsonant
        };
        units.splice(idx + 1, 1);
        
        // Adjust boundaries (shift down any that were after the removed element)
        for (let i = 0; i < boundaries.length; i++) {
            if (boundaries[i] > idx + 1) {
                boundaries[i]--;
            } else if (boundaries[i] === idx + 1) {
                // Boundary was between the two consonants - it stays at idx + 1
                // which now points to what was after the second consonant
            }
        }
        
        return true;
    } else {
        return false;
    }
}

/**
 * Update the displayed IPA from the editor state
 * Also updates the front card display and Singer's View if visible
 */
function updateDisplayFromState(wordIdx) {
    const wordData = processedWords[wordIdx];
    const state = wordData.ipaEditorState;
    const { units, boundaries } = state;
    
    // Split units into syllables based on boundaries
    const syllableIPAs = [];
    let start = 0;
    
    for (const boundary of boundaries) {
        syllableIPAs.push(unitsToIPA(units.slice(start, boundary)));
        start = boundary;
    }
    syllableIPAs.push(unitsToIPA(units.slice(start)));
    
    // Update syllable IPA strings
    wordData.processed.syllables.forEach((syl, idx) => {
        if (idx < syllableIPAs.length) {
            syl.ipa = syllableIPAs[idx];
        }
    });
    
    // Update the front card IPA display
    const cardFront = document.querySelector(`#card-${wordIdx} .word-card-front .ipa`);
    if (cardFront) {
        // Build full IPA with boundaries and stress mark
        const parts = [];
        start = 0;
        for (const b of boundaries) {
            parts.push(units.slice(start, b).map(u => u.symbol).join(''));
            start = b;
        }
        parts.push(units.slice(start).map(u => u.symbol).join(''));
        
        // Add stress mark to stressed syllable
        const stressIdx = wordData.processed.stressIndex;
        if (stressIdx >= 0 && stressIdx < parts.length && wordData.processed.showStressMarker) {
            parts[stressIdx] = 'ˈ' + parts[stressIdx];
        }
        
        let fullIPA = parts.filter(p => p.length > 0).join(' ');
        fullIPA = applyNotationPreferences(applyStyleSettings(fullIPA));
        cardFront.textContent = '/' + fullIPA + '/';
    }
    
    // If Singer's View is active, update it too
    if (currentView === 'singers') {
        renderSingersView();
    }
}

// NOTE: moveCharLeft() and moveCharRight() removed in v4.14
// The syllable boundary editor now uses drag-and-drop with moveIPAUnitLeft/Right

/**
 * Re-run IPA transcription for a single syllable after boundary change
 * 
 * This keeps the IPA accurate after user moves consonants around.
 * Position-dependent rules (stressed/unstressed) are recalculated.
 */

// Global storage for locked syllables (prevents vowel reduction)
// Key format: "wordIdx-sylIdx", Value: true
const lockedSyllables = new Set();

/**
 * Toggle lock state for a syllable (prevents/allows vowel reduction)
 * @param {number} wordIdx - Word index
 * @param {number} sylIdx - Syllable index within word
 */
function toggleLock(wordIdx, sylIdx, event) {
    const key = `${wordIdx}-${sylIdx}`;
    if (lockedSyllables.has(key)) {
        lockedSyllables.delete(key);
    } else {
        lockedSyllables.add(key);
    }
    // Update button appearance immediately
    const btn = event.target;
    btn.textContent = lockedSyllables.has(key) ? '🔓' : '🔒';
    btn.style.opacity = lockedSyllables.has(key) ? '1' : '0.4';
    // Retranscribe and refresh display
    retranscribeSyllablesWithLock(wordIdx);
    renderOutput();
}

/**
 * Retranscribe all syllables in a word, respecting locks
 * @param {number} wordIdx - Word index
 */
function retranscribeSyllablesWithLock(wordIdx) {
    const wordData = processedWords[wordIdx];
    if (!wordData) return;
    
    // Build set of locked positions for this word
    const wordLockedPositions = new Set();
    wordData.processed.syllables.forEach((syl, idx) => {
        if (lockedSyllables.has(`${wordIdx}-${idx}`)) {
            const position = getSyllablePosition(idx, wordData.processed.stressIndex, wordData.processed.syllables.length);
            wordLockedPositions.add(position);
        }
    });
    
    // Retranscribe each syllable
    wordData.processed.syllables.forEach((syllable, idx) => {
        const position = getSyllablePosition(idx, wordData.processed.stressIndex, wordData.processed.syllables.length);
        syllable.ipa = transcribeSyllable(syllable.cyrillic, position, { 
            word: wordData.originalWord, 
            syllables: wordData.processed.syllables 
        }, wordLockedPositions);
    });
}

function retranscribeSyllables(wordIdx, sylIdx) {
    const wordData = processedWords[wordIdx];
    const syllable = wordData.processed.syllables[sylIdx];
    const position = getSyllablePosition(sylIdx, wordData.processed.stressIndex, wordData.processed.syllables.length);
    
    // Retranscribe this syllable with current position context
    syllable.ipa = transcribeSyllable(syllable.cyrillic, position, { 
        word: wordData.originalWord, 
        syllables: wordData.processed.syllables 
    });
}

function clearAll() {
    document.getElementById('russianInput').value = '';
    processedWords = [];
    renderOutput();
    hideViewToggle();
    switchView('workspace');
    editingWordIndex = null;
    const singersViewControls = document.getElementById('singersViewControls');
    if (singersViewControls) {
        singersViewControls.style.display = 'none';
    }
    updatePlaceholderVisibility(); // Show animated placeholder again
}

function copyIPA() {
    const ipaText = processedWords
        .map(wd => wd.processed.syllables.map(s => s.ipa).join(''))
        .join(' ');
    
    navigator.clipboard.writeText(ipaText).then(() => {
        alert('IPA transcription copied to clipboard!');
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
}

// ============================================================================
// VIEW SWITCHING - Workspace ↔ Singer's View
// ============================================================================

let currentView = 'workspace';
let editingWordIndex = null;
let metadataPanelExpanded = true;
let metadataComplete = false;

function switchView(view) {
    currentView = view;
    
    const workspaceView = document.getElementById('workspaceView');
    const singersView = document.getElementById('singersView');
    const singersViewControls = document.getElementById('singersViewControls');
    const workspaceTab = document.getElementById('workspaceTab');
    const singersTab = document.getElementById('singersTab');
    
    if (view === 'workspace') {
        workspaceView.style.display = 'block';
        singersView.style.display = 'none';
        singersViewControls.style.display = 'none';
        workspaceTab.classList.add('active');
        singersTab.classList.remove('active');
    } else {
        workspaceView.style.display = 'none';
        singersView.style.display = 'block';
        singersViewControls.style.display = 'flex';
        workspaceTab.classList.remove('active');
        singersTab.classList.add('active');
        
        // Check if metadata is complete
        validateMetadata();
        if (!metadataComplete) {
            expandMetadataPanel();
        }
        
        renderSingersView();
    }
}

// ============================================================================
// METADATA PANEL FUNCTIONS
// ============================================================================

function toggleMetadataPanel() {
    const panel = document.getElementById('metadataPanel');
    metadataPanelExpanded = !metadataPanelExpanded;
    
    if (metadataPanelExpanded) {
        panel.classList.remove('collapsed');
    } else {
        panel.classList.add('collapsed');
    }
}

function expandMetadataPanel() {
    const panel = document.getElementById('metadataPanel');
    metadataPanelExpanded = true;
    panel.classList.remove('collapsed');
}

function collapseMetadataPanel() {
    const panel = document.getElementById('metadataPanel');
    metadataPanelExpanded = false;
    panel.classList.add('collapsed');
}

function updateDocumentMeta() {
    // Read values from form
    documentMeta.title = document.getElementById('metaTitle')?.value.trim() || '';
    documentMeta.poet = document.getElementById('metaPoet')?.value.trim() || '';
    documentMeta.composer = document.getElementById('metaComposer')?.value.trim() || '';
    documentMeta.opus = document.getElementById('metaOpus')?.value.trim() || '';
    
    // Validate and update UI
    validateMetadata();
    updateMetadataSummary();
    
    // Re-render canvas with new metadata
    if (currentView === 'singers') {
        renderSingersView();
    }
}

function validateMetadata() {
    const title = documentMeta.title;
    const poet = documentMeta.poet;
    const composer = documentMeta.composer;
    
    const titleInput = document.getElementById('metaTitle');
    const poetInput = document.getElementById('metaPoet');
    const composerInput = document.getElementById('metaComposer');
    const validationEl = document.getElementById('metadataValidation');
    
    let errors = [];
    
    // Check required fields
    if (!title) {
        errors.push('Title');
        titleInput?.classList.add('invalid');
    } else {
        titleInput?.classList.remove('invalid');
    }
    
    if (!poet) {
        errors.push('Poet');
        poetInput?.classList.add('invalid');
    } else {
        poetInput?.classList.remove('invalid');
    }
    
    if (!composer) {
        errors.push('Composer');
        composerInput?.classList.add('invalid');
    } else {
        composerInput?.classList.remove('invalid');
    }
    
    metadataComplete = errors.length === 0;
    
    // Update validation message
    if (validationEl) {
        if (errors.length > 0) {
            validationEl.textContent = 'Required: ' + errors.join(', ');
        } else {
            validationEl.textContent = '';
        }
    }
    
    return metadataComplete;
}

function updateMetadataSummary() {
    const summaryEl = document.getElementById('metadataSummary');
    if (!summaryEl) return;
    
    if (metadataComplete) {
        // Show condensed info
        let summary = documentMeta.title;
        if (documentMeta.poet) {
            summary += ' — ' + documentMeta.poet;
        }
        if (documentMeta.composer && documentMeta.composer !== documentMeta.poet) {
            summary += ' / ' + documentMeta.composer;
        }
        // Truncate if too long
        if (summary.length > 50) {
            summary = summary.substring(0, 47) + '...';
        }
        summaryEl.textContent = summary;
        summaryEl.classList.add('complete');
        summaryEl.classList.remove('incomplete');
    } else {
        summaryEl.textContent = 'Enter work details';
        summaryEl.classList.add('incomplete');
        summaryEl.classList.remove('complete');
    }
}

function setPageSize(size) {
    documentMeta.pageSize = size;
    
    const btnLetter = document.getElementById('btnLetter');
    const btnA4 = document.getElementById('btnA4');
    
    if (size === 'letter') {
        btnLetter?.classList.add('active');
        btnA4?.classList.remove('active');
    } else {
        btnLetter?.classList.remove('active');
        btnA4?.classList.add('active');
    }
    
    // Re-render canvas with new page size
    if (currentView === 'singers') {
        renderSingersView();
    }
}

function showViewToggle() {
    const toggle = document.getElementById('viewToggle');
    if (toggle && processedWords.length > 0) {
        toggle.style.display = 'flex';
    }
}

function hideViewToggle() {
    const toggle = document.getElementById('viewToggle');
    if (toggle) {
        toggle.style.display = 'none';
    }
}

// ============================================================================
// SINGER'S VIEW - Interlinear Display with Tap-to-Edit
// ============================================================================

function addStressMark(cyrillic, stressedSyllableIndex) {
    // Add combining acute accent (́) to the stressed vowel
    // Exception: ё already indicates stress via its dieresis, so no acute needed
    if (stressedSyllableIndex < 0) return cyrillic;
    
    const vowelSet = new Set(['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я',
                               'А', 'Е', 'Ё', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я']);
    let syllableCount = 0;
    let result = '';
    
    for (let i = 0; i < cyrillic.length; i++) {
        const char = cyrillic[i];
        const lowerChar = char.toLowerCase();
        result += char;
        
        if (vowelSet.has(char)) {
            // Skip adding acute to ё - the dieresis already indicates stress
            if (syllableCount === stressedSyllableIndex && lowerChar !== 'ё') {
                result += '\u0301'; // Combining acute accent
            }
            syllableCount++;
        }
    }
    
    return result;
}

// ============================================================================
// SINGER'S VIEW - Canvas-based Zoomable Viewport
// ============================================================================
// The Singer's View renders to a canvas that can be pinch-zoomed and panned.
// This creates a "live PDF preview" that IS the document being exported.
// 
// Lifecycle:
// - Ephemeral: regenerates on every edit (debounced)
// - Stable: user is reviewing (zoom/pan activity)  
// - Persistent: user exports/prints (becomes actual file)
// ============================================================================

let canvasScale = 1;
let canvasOffsetX = 0;
let canvasOffsetY = 0;
let renderDebounceTimer = null;
let lastRenderTime = 0;
const RENDER_DEBOUNCE_MS = 150;

// ============================================================================
// COMPOSER DATABASE - Canonical names with search aliases
// ============================================================================

const COMPOSER_DATABASE = [
    // === THE BIG NAMES ===
    { canonical: "Tchaikovsky, Pyotr Ilyich", search: ["чайковский", "пётр", "петр", "tchaikovsky", "chaikovsky", "tschaikowsky", "tschaikovsky", "czajkowski", "ciaikovski", "pyotr", "peter", "piotr"], birth: 1840, death: 1893 },
    { canonical: "Rachmaninoff, Sergei", search: ["рахманинов", "сергей", "rachmaninoff", "rachmaninov", "rakhmaninov", "rachmaninow", "sergei", "sergey", "serge"], birth: 1873, death: 1943 },
    { canonical: "Mussorgsky, Modest", search: ["мусоргский", "модест", "mussorgsky", "musorgsky", "moussorgsky", "musorgskij", "modest"], birth: 1839, death: 1881 },
    { canonical: "Rimsky-Korsakov, Nikolai", search: ["римский-корсаков", "римский", "корсаков", "николай", "rimsky-korsakov", "rimsky", "korsakov", "rimskij", "nikolai", "nikolay"], birth: 1844, death: 1908 },
    { canonical: "Glinka, Mikhail", search: ["глинка", "михаил", "glinka", "mikhail", "michail", "michael"], birth: 1804, death: 1857 },
    { canonical: "Borodin, Alexander", search: ["бородин", "александр", "borodin", "alexander", "aleksandr"], birth: 1833, death: 1887 },
    { canonical: "Cui, César", search: ["кюи", "цезарь", "cui", "cesar", "caesar", "kyui", "tzesar"], birth: 1835, death: 1918 },
    { canonical: "Balakirev, Mily", search: ["балакирев", "милий", "balakirev", "balakirew", "mily", "milij", "mili"], birth: 1837, death: 1910 },
    { canonical: "Prokofiev, Sergei", search: ["прокофьев", "сергей", "prokofiev", "prokofieff", "prokofjev", "prokofjew", "sergei", "sergey", "serge"], birth: 1891, death: 1953 },
    { canonical: "Shostakovich, Dmitri", search: ["шостакович", "дмитрий", "shostakovich", "schostakowitsch", "chostakovitch", "sostakovic", "dmitri", "dmitry", "dmitrij"], birth: 1906, death: 1975 },
    { canonical: "Stravinsky, Igor", search: ["стравинский", "игорь", "stravinsky", "strawinsky", "stravinskij", "igor"], birth: 1882, death: 1971 },
    // === ROMANTIC ERA ===
    { canonical: "Arensky, Anton", search: ["аренский", "антон", "arensky", "arenski", "anton"], birth: 1861, death: 1906 },
    { canonical: "Dargomyzhsky, Alexander", search: ["даргомыжский", "александр", "dargomyzhsky", "dargomyschski", "dargomijsky", "alexander", "aleksandr"], birth: 1813, death: 1869 },
    { canonical: "Rubinstein, Anton", search: ["рубинштейн", "антон", "rubinstein", "rubinštejn", "anton"], birth: 1829, death: 1894 },
    { canonical: "Taneyev, Sergei", search: ["танеев", "сергей", "taneyev", "taneiev", "tanejew", "taneev", "sergei", "sergey"], birth: 1856, death: 1915 },
    { canonical: "Glazunov, Alexander", search: ["глазунов", "александр", "glazunov", "glasunow", "alexander", "aleksandr"], birth: 1865, death: 1936 },
    { canonical: "Lyadov, Anatoly", search: ["лядов", "анатолий", "lyadov", "liadov", "ljadov", "anatoly", "anatoli"], birth: 1855, death: 1914 },
    { canonical: "Medtner, Nikolai", search: ["метнер", "николай", "medtner", "metner", "nikolai", "nikolay", "nicolas"], birth: 1880, death: 1951 },
    { canonical: "Scriabin, Alexander", search: ["скрябин", "александр", "scriabin", "skriabin", "skrjabin", "scriabine", "alexander", "aleksandr"], birth: 1872, death: 1915 },
    { canonical: "Gretchaninov, Alexander", search: ["гречанинов", "александр", "gretchaninov", "grechaninov", "gretchaninoff", "alexander", "aleksandr"], birth: 1864, death: 1956 },
    { canonical: "Ippolitov-Ivanov, Mikhail", search: ["ипполитов-иванов", "михаил", "ippolitov-ivanov", "ippolitov", "ivanov", "mikhail", "michail"], birth: 1859, death: 1935 },
    { canonical: "Kalinnikov, Vasily", search: ["калинников", "василий", "kalinnikov", "vasily", "vasili", "wassili"], birth: 1866, death: 1901 },
    { canonical: "Rebikov, Vladimir", search: ["ребиков", "владимир", "rebikov", "vladimir"], birth: 1866, death: 1920 },
    // === 20TH CENTURY ===
    { canonical: "Kabalevsky, Dmitry", search: ["кабалевский", "дмитрий", "kabalevsky", "kabalewsky", "kabalevskij", "dmitry", "dmitri"], birth: 1904, death: 1987 },
    { canonical: "Khachaturian, Aram", search: ["хачатурян", "арам", "khachaturian", "chatschaturjan", "khatchaturian", "aram"], birth: 1903, death: 1978 },
    { canonical: "Myaskovsky, Nikolai", search: ["мясковский", "николай", "myaskovsky", "miaskovsky", "mjaskowski", "nikolai", "nikolay"], birth: 1881, death: 1950 },
    { canonical: "Sviridov, Georgy", search: ["свиридов", "георгий", "sviridov", "georgy", "georgi", "yuri"], birth: 1915, death: 1998 },
    { canonical: "Schnittke, Alfred", search: ["шнитке", "альфред", "schnittke", "shnitke", "alfred"], birth: 1934, death: 1998 },
    { canonical: "Gubaidulina, Sofia", search: ["губайдулина", "софия", "gubaidulina", "gubajdulina", "sofia", "sofiya", "sophie"], birth: 1931, death: null },
    { canonical: "Shchedrin, Rodion", search: ["щедрин", "родион", "shchedrin", "schedrin", "chtchedrine", "rodion"], birth: 1932, death: 2025 },
    // === EARLIER COMPOSERS ===
    { canonical: "Bortniansky, Dmitry", search: ["бортнянский", "дмитрий", "bortniansky", "bortnjanski", "dmitry", "dmitri"], birth: 1751, death: 1825 },
    { canonical: "Alyabyev, Alexander", search: ["алябьев", "александр", "alyabyev", "aljabjew", "aliabiev", "alexander", "aleksandr"], birth: 1787, death: 1851 },
    { canonical: "Varlamov, Alexander", search: ["варламов", "александр", "varlamov", "alexander", "aleksandr"], birth: 1801, death: 1848 },
    { canonical: "Gurilyov, Alexander", search: ["гурилёв", "гурилев", "александр", "gurilyov", "gurilev", "guriljow", "alexander", "aleksandr"], birth: 1803, death: 1858 },
    // === CHURCH MUSIC ===
    { canonical: "Kastalsky, Alexander", search: ["кастальский", "александр", "kastalsky", "kastalski", "alexander", "aleksandr"], birth: 1856, death: 1926 },
    { canonical: "Chesnokov, Pavel", search: ["чесноков", "павел", "chesnokov", "tschesnokow", "pavel", "paul"], birth: 1877, death: 1944 },
    { canonical: "Arkhangelsky, Alexander", search: ["архангельский", "александр", "arkhangelsky", "archangelski", "alexander", "aleksandr"], birth: 1846, death: 1924 },
    // === OTHER SIGNIFICANT ===
    { canonical: "Glière, Reinhold", search: ["глиэр", "рейнгольд", "gliere", "glier", "reinhold"], birth: 1875, death: 1956 },
    { canonical: "Tcherepnin, Nikolai", search: ["черепнин", "николай", "tcherepnin", "cherepnin", "tscherepnin", "nikolai", "nikolay"], birth: 1873, death: 1945 },
    { canonical: "Tcherepnin, Alexander", search: ["черепнин", "александр", "tcherepnin", "cherepnin", "tscherepnin", "alexander", "aleksandr"], birth: 1899, death: 1977 },
];

// ============================================================================
// POET DATABASE - Canonical names with search aliases
// ============================================================================

const POET_DATABASE = [
    // === GOLDEN AGE ===
    { canonical: "Pushkin, Aleksandr Sergeyevich", search: ["пушкин", "александр", "сергеевич", "pushkin", "pouchkine", "puschkin", "puszkin", "aleksandr", "alexander"], birth: 1799, death: 1837 },
    { canonical: "Lermontov, Mikhail", search: ["лермонтов", "михаил", "lermontov", "lermontow", "mikhail", "michail", "michael"], birth: 1814, death: 1841 },
    { canonical: "Tyutchev, Fyodor", search: ["тютчев", "фёдор", "федор", "tyutchev", "tjutschew", "tiutchev", "fyodor", "fedor", "theodore"], birth: 1803, death: 1873 },
    { canonical: "Fet, Afanasy", search: ["фет", "афанасий", "fet", "afanasy", "afanasij", "afanasi"], birth: 1820, death: 1892 },
    { canonical: "Koltsov, Aleksey", search: ["кольцов", "алексей", "koltsov", "kolzow", "kol'cov", "aleksey", "alexey", "alexei"], birth: 1809, death: 1842 },
    { canonical: "Nekrasov, Nikolai", search: ["некрасов", "николай", "nekrasov", "nekrassow", "nikolai", "nikolay"], birth: 1821, death: 1878 },
    { canonical: "Tolstoy, Aleksey Konstantinovich", search: ["толстой", "алексей", "константинович", "tolstoy", "tolstoi", "aleksey", "alexey", "konstantinovich", "a.k."], birth: 1817, death: 1875 },
    { canonical: "Pleshcheyev, Aleksey", search: ["плещеев", "алексей", "pleshcheyev", "pleschtschejew", "plescheev", "aleksey", "alexey"], birth: 1825, death: 1893 },
    { canonical: "Mey, Lev", search: ["мей", "лев", "mey", "mei", "lev", "leo"], birth: 1822, death: 1862 },
    { canonical: "Polonsky, Yakov", search: ["полонский", "яков", "polonsky", "polonski", "yakov", "jakov", "jacob"], birth: 1819, death: 1898 },
    { canonical: "Maikov, Apollon", search: ["майков", "аполлон", "maikov", "majkow", "apollon", "apollo"], birth: 1821, death: 1897 },
    { canonical: "Apukhtin, Aleksey", search: ["апухтин", "алексей", "apukhtin", "apuchtin", "aleksey", "alexey"], birth: 1840, death: 1893 },
    { canonical: "Rathaus, Daniil", search: ["ратгауз", "даниил", "rathaus", "ratgauz", "daniil", "daniel"], birth: 1868, death: 1937 },
    // === PRE-GOLDEN AGE ===
    { canonical: "Derzhavin, Gavriil", search: ["державин", "гавриил", "derzhavin", "derschawin", "gavriil", "gavrila"], birth: 1743, death: 1816 },
    { canonical: "Zhukovsky, Vasily", search: ["жуковский", "василий", "zhukovsky", "schukowski", "zhukovskij", "vasily", "vassili", "basil"], birth: 1783, death: 1852 },
    { canonical: "Batyushkov, Konstantin", search: ["батюшков", "константин", "batyushkov", "batjuschkow", "konstantin"], birth: 1787, death: 1855 },
    { canonical: "Delvig, Anton", search: ["дельвиг", "антон", "delvig", "delwig", "anton"], birth: 1798, death: 1831 },
    { canonical: "Baratynsky, Yevgeny", search: ["баратынский", "евгений", "baratynsky", "boratynski", "yevgeny", "evgeni", "eugene"], birth: 1800, death: 1844 },
    // === SILVER AGE ===
    { canonical: "Blok, Alexander", search: ["блок", "александр", "blok", "block", "alexander", "aleksandr"], birth: 1880, death: 1921 },
    { canonical: "Akhmatova, Anna", search: ["ахматова", "анна", "akhmatova", "achmatowa", "anna"], birth: 1889, death: 1966 },
    { canonical: "Tsvetaeva, Marina", search: ["цветаева", "марина", "tsvetaeva", "zwetajewa", "cvetaeva", "marina"], birth: 1892, death: 1941 },
    { canonical: "Mandelstam, Osip", search: ["мандельштам", "осип", "mandelstam", "mandelshtam", "osip"], birth: 1891, death: 1938 },
    { canonical: "Pasternak, Boris", search: ["пастернак", "борис", "pasternak", "boris"], birth: 1890, death: 1960 },
    { canonical: "Yesenin, Sergei", search: ["есенин", "сергей", "yesenin", "esenin", "jessenin", "sergei", "sergey"], birth: 1895, death: 1925 },
    { canonical: "Mayakovsky, Vladimir", search: ["маяковский", "владимир", "mayakovsky", "majakowski", "maiakowski", "vladimir"], birth: 1893, death: 1930 },
    { canonical: "Gumilev, Nikolay", search: ["гумилёв", "гумилев", "николай", "gumilev", "gumiljow", "nikolay", "nikolai"], birth: 1886, death: 1921 },
    { canonical: "Balmont, Konstantin", search: ["бальмонт", "константин", "balmont", "bal'mont", "konstantin"], birth: 1867, death: 1942 },
    { canonical: "Bryusov, Valery", search: ["брюсов", "валерий", "bryusov", "brjussow", "briusov", "valery", "valeri"], birth: 1873, death: 1924 },
    { canonical: "Annensky, Innokenty", search: ["анненский", "иннокентий", "annensky", "annenskij", "innokenty", "innokentij"], birth: 1855, death: 1909 },
    // === PROSE WRITERS SET TO MUSIC ===
    { canonical: "Gogol, Nikolai", search: ["гоголь", "николай", "gogol", "nikolai", "nikolay"], birth: 1809, death: 1852 },
    { canonical: "Turgenev, Ivan", search: ["тургенев", "иван", "turgenev", "turgenjew", "ivan"], birth: 1818, death: 1883 },
    { canonical: "Tolstoy, Leo", search: ["толстой", "лев", "николаевич", "tolstoy", "tolstoi", "leo", "lev"], birth: 1828, death: 1910 },
    { canonical: "Chekhov, Anton", search: ["чехов", "антон", "chekhov", "tschechow", "cechov", "anton"], birth: 1860, death: 1904 },
    // === FOLK/ANONYMOUS ===
    { canonical: "Traditional (Folk)", search: ["народная", "народный", "traditional", "folk", "фольклор", "народное"], birth: null, death: null },
    { canonical: "Anonymous", search: ["аноним", "anonymous", "unknown", "неизвестный"], birth: null, death: null },
    // === GERMAN POETS (set by Russian composers) ===
    { canonical: "Goethe, Johann Wolfgang von", search: ["гёте", "гете", "иоганн", "goethe", "göthe", "johann", "wolfgang"], birth: 1749, death: 1832 },
    { canonical: "Heine, Heinrich", search: ["гейне", "генрих", "heine", "heinrich"], birth: 1797, death: 1856 },
];

// ============================================================================
// AUTOCOMPLETE FUNCTIONS
// ============================================================================
// USER PROFILE SYSTEM - Country/jurisdiction for copyright calculations
// ============================================================================

// Copyright terms by jurisdiction (years after death)
const COPYRIGHT_TERMS = {
    'CA': { term: 70, name: 'Canada', note: 'Life + 70 years (since 2022)' },
    'US': { term: 70, name: 'United States', note: 'Life + 70 years (works after 1978). Pre-1928 works are public domain.' },
    'MX': { term: 100, name: 'Mexico', note: 'Life + 100 years' },
    'EU': { term: 70, name: 'European Union', note: 'Life + 70 years (harmonized)' },
    'GB': { term: 70, name: 'United Kingdom', note: 'Life + 70 years' },
    'RU': { term: 70, name: 'Russia', note: 'Life + 70 years (+4 for WWII veterans)' },
    'UA': { term: 70, name: 'Ukraine', note: 'Life + 70 years' },
    'CH': { term: 70, name: 'Switzerland', note: 'Life + 70 years' },
    'AU': { term: 70, name: 'Australia', note: 'Life + 70 years' },
    'NZ': { term: 50, name: 'New Zealand', note: 'Life + 50 years' },
    'JP': { term: 70, name: 'Japan', note: 'Life + 70 years (since 2018)' },
    'KR': { term: 70, name: 'South Korea', note: 'Life + 70 years' },
    'CN': { term: 50, name: 'China', note: 'Life + 50 years' },
    'OTHER': { term: 70, name: 'Other', note: 'Using international standard: Life + 70 years' }
};

// User profile (loaded from localStorage)
let userProfile = {
    country: '',
    name: '',
    institution: ''
};

function loadUserProfile() {
    try {
        const saved = localStorage.getItem('msr_user_profile');
        if (saved) {
            userProfile = JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Could not load user profile:', e);
    }
}

// Called after documentMeta is defined to sync profile data
function applyUserProfileToMeta() {
    if (userProfile.name) {
        documentMeta.userName = userProfile.name;
    }
    if (userProfile.institution) {
        documentMeta.institution = userProfile.institution;
    }
}

function saveUserProfile() {
    userProfile.country = document.getElementById('profileCountry')?.value || '';
    userProfile.name = document.getElementById('profileName')?.value.trim() || '';
    userProfile.institution = document.getElementById('profileInstitution')?.value.trim() || '';
    
    try {
        localStorage.setItem('msr_user_profile', JSON.stringify(userProfile));
    } catch (e) {
        console.warn('Could not save user profile:', e);
    }
    
    // Update documentMeta
    documentMeta.userName = userProfile.name;
    documentMeta.institution = userProfile.institution;
    
    // Refresh public domain status with new jurisdiction
    updatePublicDomainStatus();
    
    // Re-render if in Singer's View
    if (currentView === 'singers') {
        renderSingersView();
    }
    
    closeProfileModal();
}

function openProfileModal() {
    const modal = document.getElementById('profileModal');
    if (!modal) return;
    
    // Populate form with current values
    const countrySelect = document.getElementById('profileCountry');
    const nameInput = document.getElementById('profileName');
    const institutionInput = document.getElementById('profileInstitution');
    
    if (countrySelect) countrySelect.value = userProfile.country || '';
    if (nameInput) nameInput.value = userProfile.name || '';
    if (institutionInput) institutionInput.value = userProfile.institution || '';
    
    updateCopyrightPreview();
    
    modal.classList.add('show');
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ============================================================================
// FIRST-LAUNCH ONBOARDING
// ============================================================================

const ONBOARDING_KEY = 'msr_onboarding_complete';

function checkFirstLaunch() {
    try {
        const completed = localStorage.getItem(ONBOARDING_KEY);
        if (!completed) {
            showOnboardingModal();
        }
    } catch (e) {
        // localStorage not available, skip onboarding
    }
}

function showOnboardingModal() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
        modal.classList.add('show');
        // Focus the name input
        setTimeout(() => {
            document.getElementById('onboardingName')?.focus();
        }, 100);
    }
}

function skipOnboarding() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
        modal.classList.remove('show');
    }
    // Mark as complete so we don't ask again
    try {
        localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {}
}

function completeOnboarding() {
    const nameInput = document.getElementById('onboardingName');
    const name = nameInput?.value.trim() || '';
    
    // Save the name to user profile
    if (name) {
        userProfile.name = name;
        documentMeta.userName = name;
        try {
            localStorage.setItem('msr_user_profile', JSON.stringify(userProfile));
        } catch (e) {}
        
        // Also update the profile form if it exists
        const profileNameInput = document.getElementById('profileName');
        if (profileNameInput) {
            profileNameInput.value = name;
        }
    }
    
    // Mark as complete
    try {
        localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {}
    
    // Close modal
    const modal = document.getElementById('onboardingModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function updateCopyrightPreview() {
    const preview = document.getElementById('copyrightPreview');
    const countryCode = document.getElementById('profileCountry')?.value;
    
    if (!preview) return;
    
    if (!countryCode) {
        preview.innerHTML = 'Select a country to see copyright terms.';
        return;
    }
    
    const info = COPYRIGHT_TERMS[countryCode];
    if (info) {
        const pdYear = 2026 - info.term;
        preview.innerHTML = `<strong>${info.name}:</strong> ${info.note}<br>` +
            `<span style="color: #2d5a3d;">Works by creators who died before ${pdYear} are in the public domain.</span>`;
    }
}

function getCopyrightTerm() {
    const country = userProfile.country || 'OTHER';
    return COPYRIGHT_TERMS[country]?.term || 70;
}

// ============================================================================
// AUTOCOMPLETE FUNCTIONS
// ============================================================================

let autocompleteSelectedIndex = { poet: -1, composer: -1 };
let autocompleteResults = { poet: [], composer: [] };

function normalizeSearchTerm(str) {
    return str.toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/й/g, 'и')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function searchDatabase(query, database) {
    if (!query || query.length < 2) return [];
    
    const normalizedQuery = normalizeSearchTerm(query);
    const results = [];
    
    for (const entry of database) {
        // Check canonical name
        if (normalizeSearchTerm(entry.canonical).includes(normalizedQuery)) {
            results.push({ ...entry, score: 100 });
            continue;
        }
        
        // Check search aliases
        for (const term of entry.search) {
            if (normalizeSearchTerm(term).includes(normalizedQuery)) {
                const score = term.toLowerCase() === normalizedQuery ? 90 : 50;
                results.push({ ...entry, score });
                break;
            }
        }
    }
    
    // Sort by score, then alphabetically
    results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.canonical.localeCompare(b.canonical);
    });
    
    return results.slice(0, 8);
}

function isPublicDomain(entry, currentYear = 2026) {
    if (!entry.death) {
        return entry.canonical.includes('Traditional') || entry.canonical.includes('Anonymous');
    }
    // Use user's jurisdiction for copyright term
    const term = getCopyrightTerm();
    return (currentYear - entry.death) >= term;
}

function formatDates(entry) {
    if (!entry.birth) return '';
    if (entry.death) {
        return `${entry.birth}–${entry.death}`;
    }
    return `b. ${entry.birth}`;
}

function renderAutocompleteDropdown(type, results) {
    const dropdown = document.getElementById(type + 'Dropdown');
    if (!dropdown) return;
    
    autocompleteResults[type] = results;
    autocompleteSelectedIndex[type] = -1;
    
    if (results.length === 0) {
        dropdown.innerHTML = '<div class="autocomplete-no-results">No matches found — type to enter custom name</div>';
        dropdown.classList.add('show');
        return;
    }
    
    dropdown.innerHTML = results.map((entry, idx) => {
        const pd = isPublicDomain(entry);
        const statusIcon = pd ? '✓' : '©';
        const statusClass = pd ? 'pd' : 'copyright';
        const dates = formatDates(entry);
        
        return `<div class="autocomplete-item" data-index="${idx}" 
                    onclick="selectAutocompleteItem('${type}', ${idx})"
                    onmouseenter="highlightAutocompleteItem('${type}', ${idx})">
            <span>
                <span class="autocomplete-name">${entry.canonical}</span>
                <span class="autocomplete-dates">${dates}</span>
            </span>
            <span class="autocomplete-status ${statusClass}">${statusIcon}</span>
        </div>`;
    }).join('');
    
    dropdown.classList.add('show');
}

function highlightAutocompleteItem(type, index) {
    const dropdown = document.getElementById(type + 'Dropdown');
    if (!dropdown) return;
    
    // Remove existing selection
    dropdown.querySelectorAll('.autocomplete-item').forEach(el => el.classList.remove('selected'));
    
    // Add selection to new item
    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (items[index]) {
        items[index].classList.add('selected');
        autocompleteSelectedIndex[type] = index;
    }
}

function selectAutocompleteItem(type, index) {
    const results = autocompleteResults[type];
    if (!results || !results[index]) return;
    
    const entry = results[index];
    const input = document.getElementById(type === 'poet' ? 'metaPoet' : 'metaComposer');
    
    if (input) {
        input.value = entry.canonical;
    }
    
    // Store dates in documentMeta
    if (type === 'poet') {
        documentMeta.poet = entry.canonical;
        documentMeta.poetDates = formatDates(entry);
    } else {
        documentMeta.composer = entry.canonical;
        documentMeta.composerDates = formatDates(entry);
    }
    
    // Update public domain status
    updatePublicDomainStatus();
    
    hideAutocomplete(type);
    updateDocumentMeta();
}

function updatePublicDomainStatus() {
    // Check both poet and composer
    const poetEntry = POET_DATABASE.find(p => p.canonical === documentMeta.poet);
    const composerEntry = COMPOSER_DATABASE.find(c => c.canonical === documentMeta.composer);
    
    const poetPD = poetEntry ? isPublicDomain(poetEntry) : true;
    const composerPD = composerEntry ? isPublicDomain(composerEntry) : true;
    
    if (poetPD && composerPD) {
        documentMeta.publicDomainStatus = 'public_domain';
    } else {
        documentMeta.publicDomainStatus = 'likely_copyright';
    }
}

function hideAutocomplete(type) {
    const dropdown = document.getElementById(type + 'Dropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    autocompleteSelectedIndex[type] = -1;
}

function handlePoetInput(input) {
    const query = input.value.trim();
    if (query.length >= 2) {
        const results = searchDatabase(query, POET_DATABASE);
        renderAutocompleteDropdown('poet', results);
    } else {
        hideAutocomplete('poet');
    }
    // Clear stored dates if user types something new
    documentMeta.poetDates = '';
    updateDocumentMeta();
}

function handleComposerInput(input) {
    const query = input.value.trim();
    if (query.length >= 2) {
        const results = searchDatabase(query, COMPOSER_DATABASE);
        renderAutocompleteDropdown('composer', results);
    } else {
        hideAutocomplete('composer');
    }
    // Clear stored dates if user types something new
    documentMeta.composerDates = '';
    updateDocumentMeta();
}

function handleAutocompleteKey(event, type) {
    const dropdown = document.getElementById(type + 'Dropdown');
    if (!dropdown || !dropdown.classList.contains('show')) return;
    
    const results = autocompleteResults[type];
    if (!results || results.length === 0) return;
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            const nextIdx = Math.min(autocompleteSelectedIndex[type] + 1, results.length - 1);
            highlightAutocompleteItem(type, nextIdx);
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            const prevIdx = Math.max(autocompleteSelectedIndex[type] - 1, 0);
            highlightAutocompleteItem(type, prevIdx);
            break;
            
        case 'Enter':
            event.preventDefault();
            if (autocompleteSelectedIndex[type] >= 0) {
                selectAutocompleteItem(type, autocompleteSelectedIndex[type]);
            } else if (results.length > 0) {
                selectAutocompleteItem(type, 0);
            }
            break;
            
        case 'Escape':
            hideAutocomplete(type);
            break;
            
        case 'Tab':
            if (autocompleteSelectedIndex[type] >= 0) {
                selectAutocompleteItem(type, autocompleteSelectedIndex[type]);
            }
            hideAutocomplete(type);
            break;
    }
}

// Document metadata for PDF header/footer
let documentMeta = {
    title: '',
    poet: '',
    poetDates: '',
    composer: '',
    composerDates: '',
    opus: '',
    userName: '',
    institution: '',
    pageSize: 'letter',  // 'letter' or 'a4'
    publicDomainStatus: 'unknown'  // 'public_domain', 'likely_copyright', 'unknown'
};

// Runtime document metadata (updated on each render)
let currentDocumentMeta = {
    generatedAt: null,
    sourceText: '',
    stressPositions: [],
    stylePreset: 'sung_russian_grayson',
    hash: null
};

function renderSingersView() {
    if (processedWords.length === 0) return;
    
    // Debounce rapid re-renders
    clearTimeout(renderDebounceTimer);
    renderDebounceTimer = setTimeout(() => {
        actuallyRenderCanvas();
    }, RENDER_DEBOUNCE_MS);
    
    // Show "Live" status while debouncing
    updateDocumentStatus('live');
}

function actuallyRenderCanvas() {
    const canvas = document.getElementById('singersCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // ================================================================
    // PAGE DIMENSIONS - Full letter/A4 page
    // ================================================================
    const pageSize = documentMeta.pageSize || 'letter';
    
    // Dimensions in points (1 pt = 1/72 inch)
    const PAGE_SIZES = {
        letter: { width: 612, height: 792, name: 'US Letter (8.5" × 11")' },
        a4: { width: 595, height: 842, name: 'A4 (210 × 297 mm)' }
    };
    
    const page = PAGE_SIZES[pageSize];
    const margin = 54; // 0.75 inch margins (restored)
    const contentWidth = page.width - (margin * 2);
    const contentHeight = page.height - (margin * 2);
    
    // ================================================================
    // ZONE HEIGHTS
    // ================================================================
    const headerHeight = 90;   // Title, poet, composer (restored for page 1)
    const footerHeight = 50;   // Slightly tighter
    const contentZoneHeight = contentHeight - headerHeight - footerHeight;
    
    // ================================================================
    // LAYOUT CALCULATIONS
    // ================================================================
    const lineHeight = 48; // Tighter: fits ~1 more line per page
    const wordSpacing = 28;
    
    // Measure and layout words
    ctx.font = '12px "Noto Serif", serif';
    
    let allLines = [];
    let currentLine = [];
    let currentLineWidth = 0;
    
    const wordData = processedWords.map((wd) => {
        const { processed, originalWord } = wd;
        
        // Get IPA
        let ipa;
        if (wd.ipaEditorState) {
            const { units, boundaries } = wd.ipaEditorState;
            const parts = [];
            let start = 0;
            for (const b of boundaries) {
                parts.push(units.slice(start, b).map(u => u.symbol).join(''));
                start = b;
            }
            parts.push(units.slice(start).map(u => u.symbol).join(''));
            const stressIdx = processed.stressIndex;
            if (stressIdx >= 0 && stressIdx < parts.length && processed.showStressMarker) {
                parts[stressIdx] = 'ˈ' + parts[stressIdx];
            }
            ipa = parts.filter(p => p.length > 0).join(' ');
        } else {
            ipa = processed.syllables.map((s, i) => {
                const stressMark = s.showStressMarker ? 'ˈ' : '';
                return stressMark + s.ipa;
            }).join(' ');
        }
        ipa = applyNotationPreferences(applyStyleSettings(ipa));
        
        const cyrillic = addStressMark(originalWord, processed.stressIndex);
        const ipaText = ipa;  // No brackets - line-level solidi instead
        
        // Measure widths
        ctx.font = '11px "Noto Serif", "Doulos SIL", serif';
        const ipaWidth = ctx.measureText(ipaText).width;
        ctx.font = '13px "Noto Serif", serif';
        const cyrWidth = ctx.measureText(cyrillic).width;
        const width = Math.max(ipaWidth, cyrWidth);
        
        return { 
            ipa: ipaText, 
            cyrillic, 
            width,
            lineBreakAfter: wd.lineBreakAfter  // Preserve poetry line breaks
        };
    });
    
    // Flow words into lines, respecting poetry line breaks
    wordData.forEach((word) => {
        // Check if we need to wrap due to width
        if (currentLineWidth + word.width + wordSpacing > contentWidth && currentLine.length > 0) {
            allLines.push(currentLine);
            currentLine = [];
            currentLineWidth = 0;
        }
        currentLine.push(word);
        currentLineWidth += word.width + wordSpacing;
        
        // If this word ends a poetry line, force a new line
        if (word.lineBreakAfter && currentLine.length > 0) {
            allLines.push(currentLine);
            currentLine = [];
            currentLineWidth = 0;
        }
    });
    if (currentLine.length > 0) {
        allLines.push(currentLine);
    }
    
    // ================================================================
    // PAGINATION - Calculate lines per page (differs for page 1 vs continuation)
    // ================================================================
    const continuationHeaderHeight = 32; // Compact header for pages 2+
    const page1ContentZone = contentHeight - headerHeight - footerHeight;
    const page2ContentZone = contentHeight - continuationHeaderHeight - footerHeight;
    
    const linesPerPage1 = Math.floor(page1ContentZone / lineHeight);
    const linesPerPageN = Math.floor(page2ContentZone / lineHeight);
    
    // Calculate total pages needed
    let totalPages = 1;
    let remainingLines = allLines.length - linesPerPage1;
    if (remainingLines > 0) {
        totalPages += Math.ceil(remainingLines / linesPerPageN);
    }
    
    // Store for export
    currentDocumentMeta.totalPages = totalPages;
    
    // ================================================================
    // CANVAS SETUP - All pages stacked vertically
    // ================================================================
    const scale = 1.0; // 1:1 with PDF points for accurate preview
    const dpr = window.devicePixelRatio || 1;
    const pageGap = 20; // Gap between pages
    const totalHeight = (page.height * totalPages) + (pageGap * (totalPages - 1));
    
    canvas.width = page.width * dpr * scale;
    canvas.height = totalHeight * dpr * scale;
    canvas.style.width = (page.width * scale) + 'px';
    canvas.style.height = (totalHeight * scale) + 'px';
    ctx.scale(dpr * scale, dpr * scale);
    
    // ================================================================
    // DRAW ALL PAGES
    // ================================================================
    let lineIndex = 0; // Track which line we're on globally
    
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        const pageOffsetY = pageNum * (page.height + pageGap);
        
        // Different line counts for page 1 vs continuation pages
        const linesThisPage = (pageNum === 0) ? linesPerPage1 : linesPerPageN;
        const endLine = Math.min(lineIndex + linesThisPage, allLines.length);
        const pageLines = allLines.slice(lineIndex, endLine);
        lineIndex = endLine;
        
        // ================================================================
        // DRAW PAGE BACKGROUND
        // ================================================================
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, pageOffsetY, page.width, page.height);
        
        // Page border (subtle)
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, pageOffsetY, page.width, page.height);
        
        // ================================================================
        // DRAW HEADER ZONE
        // ================================================================
        const headerY = pageOffsetY + margin;
        
        if (pageNum === 0) {
            // ============================================================
            // PAGE 1: FULL HEADER
            // ============================================================
            
            // Title
            ctx.fillStyle = '#1a1a1a';
            ctx.font = 'bold 18px "Noto Serif", Georgia, serif';
            const title = documentMeta.title || 'Untitled';
            ctx.fillText(title, margin, headerY + 22);
            
            // Poet line
            ctx.fillStyle = '#444444';
            ctx.font = '12px "Noto Serif", Georgia, serif';
            let poetLine = '';
            if (documentMeta.poet) {
                poetLine = 'Poetry: ' + documentMeta.poet;
                if (documentMeta.poetDates) {
                    poetLine += ' (' + documentMeta.poetDates + ')';
                }
            }
            if (poetLine) {
                ctx.fillText(poetLine, margin, headerY + 42);
            }
            
            // Composer line
            let composerLine = '';
            if (documentMeta.composer) {
                composerLine = 'Music: ' + documentMeta.composer;
                if (documentMeta.composerDates) {
                    composerLine += ' (' + documentMeta.composerDates + ')';
                }
                if (documentMeta.opus) {
                    composerLine += '  •  ' + documentMeta.opus;
                }
            }
            if (composerLine) {
                ctx.fillText(composerLine, margin, headerY + 58);
            }
        } else {
            // ============================================================
            // PAGE 2+: CONTINUATION HEADER (compact)
            // ============================================================
            
            // Title, cont'd (left side, smaller)
            ctx.fillStyle = '#1a1a1a';
            ctx.font = '13px "Noto Serif", Georgia, serif';
            const title = documentMeta.title || 'Untitled';
            // Truncate title if too long
            const maxTitleLen = 40;
            const displayTitle = title.length > maxTitleLen ? title.substring(0, maxTitleLen - 3) + '...' : title;
            ctx.fillText(displayTitle + ", cont'd", margin, headerY + 20);
            
            // Poet / Composer surnames (right side, same line)
            const getSurname = (fullName) => {
                if (!fullName) return '';
                // Handle "Surname, First..." format
                const commaIdx = fullName.indexOf(',');
                if (commaIdx > 0) {
                    return fullName.substring(0, commaIdx);
                }
                // Handle "First Surname" format
                const parts = fullName.split(' ');
                return parts[parts.length - 1];
            };
            
            const poetSurname = getSurname(documentMeta.poet);
            const composerSurname = getSurname(documentMeta.composer);
            
            let rightText = '';
            if (poetSurname && composerSurname && poetSurname !== composerSurname) {
                rightText = poetSurname + ' / ' + composerSurname;
            } else if (poetSurname) {
                rightText = poetSurname;
            } else if (composerSurname) {
                rightText = composerSurname;
            }
            
            if (rightText) {
                ctx.fillStyle = '#444444';
                ctx.font = '12px "Noto Serif", Georgia, serif';
                const rightWidth = ctx.measureText(rightText).width;
                ctx.fillText(rightText, page.width - margin - rightWidth, headerY + 20);
            }
        }
        
        // Dynamic header height: full for page 1, compact for continuation pages
        const effectiveHeaderHeight = (pageNum === 0) ? headerHeight : 32;
        
        // Header divider line
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(margin, headerY + effectiveHeaderHeight - 8);
        ctx.lineTo(page.width - margin, headerY + effectiveHeaderHeight - 8);
        ctx.stroke();
        
        // ================================================================
        // DRAW CONTENT ZONE - Interlinear text
        // ================================================================
        let y = pageOffsetY + margin + effectiveHeaderHeight + 12;
        
        pageLines.forEach((line) => {
            let x = margin;
            
            // Draw opening solidus at start of IPA line
            ctx.fillStyle = '#555555';
            ctx.font = '11px "Noto Serif", "Doulos SIL", serif';
            ctx.fillText('/', x, y);
            x += ctx.measureText('/ ').width;
            
            line.forEach((word, wordIndex) => {
                // IPA (smaller, grey)
                ctx.fillStyle = '#555555';
                ctx.font = '11px "Noto Serif", "Doulos SIL", serif';
                ctx.fillText(word.ipa, x, y);
                
                // Cyrillic (larger, bold, dark)
                ctx.fillStyle = '#1a1a1a';
                ctx.font = '600 13px "Noto Serif", serif';
                ctx.fillText(word.cyrillic, x, y + 16);
                
                x += word.width + wordSpacing;
            });
            
            // Draw closing solidus at end of IPA line
            ctx.fillStyle = '#555555';
            ctx.font = '11px "Noto Serif", "Doulos SIL", serif';
            ctx.fillText('/', x - wordSpacing + 4, y);  // Adjust for word spacing
            
            y += lineHeight;
        });
        
        // ================================================================
        // DRAW FOOTER ZONE
        // ================================================================
        const footerY = pageOffsetY + page.height - margin - footerHeight;
        
        // Footer divider
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(margin, footerY);
        ctx.lineTo(page.width - margin, footerY);
        ctx.stroke();
        
        // Line 1: Attribution
        ctx.fillStyle = '#555555';
        ctx.font = '8px "Noto Sans", sans-serif';
        // Format: 24hr timestamp HH:MM:SS
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const timeStr = now.toTimeString().slice(0, 8);  // HH:MM:SS
        let attrLine = '';
        if (documentMeta.userName) {
            attrLine = `Transcribed by ${documentMeta.userName} using My Sung Russian | ${dateStr} ${timeStr}`;
        } else {
            attrLine = `Transcribed using My Sung Russian | ${dateStr} ${timeStr}`;
        }
        ctx.fillText(attrLine, margin, footerY + 14);
        
        // Line 2: Disclaimer
        ctx.fillStyle = '#777777';
        ctx.font = '7.5px "Noto Sans", sans-serif';
        const disclaimer = documentMeta.publicDomainStatus === 'public_domain'
            ? 'Source text believed to be in the public domain. IPA transcription provided for lyric diction study.'
            : 'Source text anchors its phonetic analysis here in the spirit of fair academic use. Fair dealing (CA/UK/AU) and fair use (US) provisions apply.';
        ctx.fillText(disclaimer, margin, footerY + 28);
        
        // Line 3: MSR credit (left) and page number (right)
        ctx.fillStyle = '#555555';
        ctx.font = '7.5px "Noto Sans", sans-serif';
        ctx.fillText('MSR is based on Grayson, Russian Lyric Diction (2012) and developed by Dann Mitton. Open source (AGPL-3.0)', margin, footerY + 42);
        
        // Page number (right-aligned)
        const pageNumText = `Page ${pageNum + 1} of ${totalPages}`;
        const pageNumWidth = ctx.measureText(pageNumText).width;
        ctx.fillText(pageNumText, page.width - margin - pageNumWidth, footerY + 42);
    }
    
    // ================================================================
    // Draw gap backgrounds (grey between pages)
    // ================================================================
    ctx.fillStyle = '#e8e0d8';
    for (let i = 0; i < totalPages - 1; i++) {
        const gapY = (i + 1) * page.height + i * pageGap;
        ctx.fillRect(0, gapY, page.width, pageGap);
    }
    
    // ================================================================
    // UPDATE DOCUMENT METADATA
    // ================================================================
    currentDocumentMeta = {
        ...documentMeta,
        generatedAt: new Date().toISOString(),
        sourceText: processedWords.map(w => w.originalWord).join(' '),
        stressPositions: processedWords.map(w => w.processed.stressIndex),
        stylePreset: activePresetId,
        wordCount: processedWords.length,
        totalPages: totalPages,
        pageSize: pageSize
    };
    
    // Calculate simple hash for deduplication
    currentDocumentMeta.hash = simpleHash(
        currentDocumentMeta.sourceText + 
        currentDocumentMeta.stressPositions.join(',') +
        currentDocumentMeta.stylePreset
    );
    
    lastRenderTime = Date.now();
    updateDocumentStatus('stable');
}

// Simple hash function for document fingerprinting
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
}

function updateDocumentStatus(status) {
    const statusEl = document.getElementById('documentStatus');
    if (!statusEl) return;
    
    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('.status-text');
    
    if (status === 'live') {
        dot.classList.remove('stable');
        text.textContent = 'Updating...';
    } else {
        dot.classList.add('stable');
        text.textContent = 'Ready';
    }
}

// Zoom controls
function zoomCanvas(factor) {
    canvasScale *= factor;
    canvasScale = Math.max(0.25, Math.min(3, canvasScale)); // Clamp 25% - 300%
    
    const canvas = document.getElementById('singersCanvas');
    if (canvas) {
        canvas.style.transform = `scale(${canvasScale})`;
    }
    
    const zoomEl = document.getElementById('zoomLevel');
    if (zoomEl) {
        zoomEl.textContent = Math.round(canvasScale * 100) + '%';
    }
}

function resetCanvasView() {
    canvasScale = 1;
    const canvas = document.getElementById('singersCanvas');
    if (canvas) {
        canvas.style.transform = 'scale(1)';
    }
    
    const viewport = document.getElementById('canvasViewport');
    if (viewport) {
        viewport.scrollLeft = 0;
        viewport.scrollTop = 0;
    }
    
    const zoomEl = document.getElementById('zoomLevel');
    if (zoomEl) {
        zoomEl.textContent = '100%';
    }
}

// Touch gesture support for pinch-zoom
let initialPinchDistance = null;
let initialScale = 1;

// Drag-to-pan support
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let scrollStartX = 0;
let scrollStartY = 0;

document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.getElementById('canvasViewport');
    if (!viewport) return;
    
    // === MOUSE DRAG ===
    viewport.addEventListener('mousedown', (e) => {
        // Only left mouse button
        if (e.button !== 0) return;
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        scrollStartX = viewport.scrollLeft;
        scrollStartY = viewport.scrollTop;
        viewport.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        viewport.scrollLeft = scrollStartX - dx;
        viewport.scrollTop = scrollStartY - dy;
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            const viewport = document.getElementById('canvasViewport');
            if (viewport) viewport.style.cursor = 'grab';
        }
    });
    
    // === TOUCH PINCH-ZOOM ===
    viewport.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialPinchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialScale = canvasScale;
        } else if (e.touches.length === 1) {
            // Single finger drag
            isDragging = true;
            dragStartX = e.touches[0].clientX;
            dragStartY = e.touches[0].clientY;
            scrollStartX = viewport.scrollLeft;
            scrollStartY = viewport.scrollTop;
        }
    }, { passive: true });
    
    viewport.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && initialPinchDistance) {
            // Pinch zoom
            const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const scale = (currentDistance / initialPinchDistance) * initialScale;
            canvasScale = Math.max(0.25, Math.min(3, scale));
            
            const canvas = document.getElementById('singersCanvas');
            if (canvas) {
                canvas.style.transform = `scale(${canvasScale})`;
            }
            
            const zoomEl = document.getElementById('zoomLevel');
            if (zoomEl) {
                zoomEl.textContent = Math.round(canvasScale * 100) + '%';
            }
        } else if (e.touches.length === 1 && isDragging) {
            // Single finger pan
            const dx = e.touches[0].clientX - dragStartX;
            const dy = e.touches[0].clientY - dragStartY;
            viewport.scrollLeft = scrollStartX - dx;
            viewport.scrollTop = scrollStartY - dy;
        }
    }, { passive: true });
    
    viewport.addEventListener('touchend', () => {
        initialPinchDistance = null;
        isDragging = false;
    }, { passive: true });
});

// Footer collapse/expand for mobile
function toggleFooter() {
    const footer = document.getElementById('mainFooter');
    if (footer) {
        footer.classList.toggle('collapsed');
        const label = footer.querySelector('.footer-collapsed-label');
        if (label) {
            if (footer.classList.contains('collapsed')) {
                label.innerHTML = 'My Sung Russian (MSR) <span id="versionNumber" onclick="event.stopPropagation()">v4.16</span> — tap for credits & license <span class="footer-arrow">▲</span>';
            } else {
                label.innerHTML = 'My Sung Russian (MSR) <span id="versionNumber" onclick="event.stopPropagation()">v4.16</span> — tap to collapse <span class="footer-arrow">▼</span>';
            }
            // Re-attach triple-click handler after innerHTML change
            attachVersionClickHandlers();
        }
    }
}

// ============================================================================
// DEVELOPER TOOLS - Hidden Harvest Export
// ============================================================================
// Triple-click the version number (v4.16) in the footer to:
//   - First time: Unlock "developer mode" (stored in localStorage)
//   - After unlock: Shows harvest indicator (🌾 + count) next to version
//   - Click the indicator: Downloads harvest immediately
//
// Regular users never see the indicator because they never triple-click.
// ============================================================================

const DEV_MODE_KEY = 'msr_dev_mode';
let versionClickCount = 0;
let versionClickTimer = null;

function isDevModeUnlocked() {
    try {
        return localStorage.getItem(DEV_MODE_KEY) === 'true';
    } catch (e) {
        return false;
    }
}

function unlockDevMode() {
    try {
        localStorage.setItem(DEV_MODE_KEY, 'true');
        console.log('[Dev] Developer mode unlocked');
    } catch (e) {
        console.warn('[Dev] Could not save dev mode state');
    }
}

function handleVersionClick(event) {
    event.stopPropagation();
    versionClickCount++;
    
    if (versionClickTimer) {
        clearTimeout(versionClickTimer);
    }
    
    versionClickTimer = setTimeout(() => {
        if (versionClickCount >= 3) {
            // Triple-click detected
            if (!isDevModeUnlocked()) {
                // First triple-click: unlock dev mode
                unlockDevMode();
                updateHarvestIndicator();
                alert('Developer mode unlocked.\n\nYou\'ll now see a harvest indicator (🌾) next to the version number when words have been collected.\n\nClick it to download.');
            } else {
                // Already unlocked: just download
                downloadHarvestWithFeedback();
            }
        }
        versionClickCount = 0;
    }, 400);
}

function handleHarvestIndicatorClick(event) {
    event.stopPropagation();
    downloadHarvestWithFeedback();
}

function downloadHarvestWithFeedback() {
    const stats = getHarvestStats();
    if (stats.total === 0) {
        alert('Harvest is empty.\n\nUse MSR to look up words via Wiktionary first.');
    } else {
        downloadHarvest(false); // Vuizur format
        alert(`Downloaded ${stats.total} words.\n\nOldest: ${stats.oldest || 'N/A'}\nNewest: ${stats.newest || 'N/A'}`);
    }
}

function updateHarvestIndicator() {
    // Only show indicator if dev mode is unlocked
    if (!isDevModeUnlocked()) return;
    
    const stats = getHarvestStats();
    const indicators = document.querySelectorAll('.harvest-indicator');
    
    // Remove existing indicators
    indicators.forEach(el => el.remove());
    
    // Add indicator next to version numbers if harvest has data
    const versionElements = document.querySelectorAll('#versionNumber, #versionNumberExpanded');
    versionElements.forEach(el => {
        const indicator = document.createElement('span');
        indicator.className = 'harvest-indicator';
        indicator.style.cssText = 'margin-left: 6px; cursor: pointer; opacity: 0.8;';
        indicator.title = stats.total > 0 
            ? `Click to download ${stats.total} harvested words`
            : 'No words harvested yet';
        
        if (stats.total > 0) {
            indicator.textContent = `🌾${stats.total}`;
            indicator.style.opacity = '1';
        } else {
            indicator.textContent = '🌾';
            indicator.style.opacity = '0.4';
        }
        
        indicator.addEventListener('click', handleHarvestIndicatorClick);
        el.parentNode.insertBefore(indicator, el.nextSibling);
    });
}

function attachVersionClickHandlers() {
    const versionElements = document.querySelectorAll('#versionNumber, #versionNumberExpanded');
    versionElements.forEach(el => {
        el.style.cursor = 'default'; // Don't hint that it's clickable
        el.removeEventListener('click', handleVersionClick);
        el.addEventListener('click', handleVersionClick);
    });
    
    // Update harvest indicator (only visible if dev mode unlocked)
    updateHarvestIndicator();
}

// Also update indicator whenever harvest changes
const originalHarvestWord = harvestWord;
harvestWord = function(word, stressIndex) {
    const result = originalHarvestWord(word, stressIndex);
    updateHarvestIndicator();
    return result;
};

// NOTE: renderStressEditor(), toggleWordEditor(), and setStressFromSingersView()
// removed in v4.14 - these were part of an old Singer's View editing system
// that was never fully implemented. Stress editing now happens in Workspace view.

// Show tooltip at cursor position (for Singer's View)
function showTooltipAtCursor(message) {
    const existing = document.querySelector('.msr-tooltip');
    if (existing) existing.remove();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'msr-tooltip';
    tooltip.textContent = message;
    tooltip.style.position = 'fixed';
    tooltip.style.left = '50%';
    tooltip.style.top = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
    
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
        tooltip.style.opacity = '0';
        setTimeout(() => tooltip.remove(), 300);
    }, 2500);
}

// Close editor when clicking outside
document.addEventListener('click', function(event) {
    if (editingWordIndex !== null && !event.target.closest('.interlinear-word')) {
        editingWordIndex = null;
        renderSingersView();
    }
});

function copySingersView() {
    // Generate plain text version for clipboard
    let lines = { ipa: [], cyrillic: [], gloss: [] };
    
    processedWords.forEach((wordData) => {
        const { processed, originalWord } = wordData;
        
        let ipa = processed.syllables.map((s, i) => {
            const stressMark = s.showStressMarker ? 'ˈ' : '';
            return stressMark + s.ipa;
        }).join('');
        ipa = applyNotationPreferences(applyStyleSettings(ipa));
        
        const stressedCyrillic = addStressMark(
            originalWord, 
            processed.stressIndex
        );
        
        lines.ipa.push('[' + ipa + ']');
        lines.cyrillic.push(stressedCyrillic);
        lines.gloss.push('___');
    });
    
    const text = lines.ipa.join('  ') + '\n' + 
                lines.cyrillic.join('  ') + '\n' + 
                lines.gloss.join('  ');
    
    navigator.clipboard.writeText(text).then(() => {
        alert('Singer\'s View copied to clipboard!');
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
}

function printSingersView() {
    window.print();
}

/**
 * Export Singers View to PDF
 * Preserves user's syllable boundary adjustments and stress markings
 */
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    
    if (!jsPDF) {
        alert('PDF library not loaded. Please check your internet connection.');
        return;
    }
    
    // Make sure canvas is rendered
    actuallyRenderCanvas();
    
    const canvas = document.getElementById('singersCanvas');
    if (!canvas) {
        alert('Please switch to Singer\'s View first.');
        return;
    }
    
    // Get page dimensions based on user preference
    const pageSize = documentMeta.pageSize || 'letter';
    const format = pageSize === 'a4' ? 'a4' : 'letter';
    
    // Create PDF with correct page size
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: format
    });
    
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    
    // Get canvas as image
    const imgData = canvas.toDataURL('image/png');
    const dpr = window.devicePixelRatio || 1;
    
    // Canvas is rendered at page size, so it should fit 1:1
    // Add with no margin since canvas already has margins
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Set document metadata
    const title = documentMeta.title || 'Untitled Transcription';
    doc.setProperties({
        title: title + ' — MSR Transcription',
        subject: 'Russian IPA Transcription for Lyric Diction',
        author: documentMeta.userName || 'My Sung Russian (MSR)',
        keywords: 'IPA, Russian, diction, transcription, Grayson, ' + (documentMeta.poet || '') + ', ' + (documentMeta.composer || ''),
        creator: 'MSR v4.8 (msr.app)'
    });
    
    // Generate filename from title or first words
    let filename;
    if (documentMeta.title) {
        // Clean title for filename
        filename = 'msr_' + documentMeta.title
            .replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 40);
    } else {
        const firstWords = processedWords.slice(0, 3).map(w => w.originalWord).join('_');
        filename = 'msr_' + (firstWords || 'transcription');
    }
    filename += '.pdf';
    
    // Download
    doc.save(filename);
    
    // Log for potential cataloguing
    console.log('PDF exported:', {
        title: documentMeta.title,
        poet: documentMeta.poet,
        composer: documentMeta.composer,
        hash: currentDocumentMeta.hash,
        pages: currentDocumentMeta.totalPages
    });
}

// Animated placeholder visibility
function updatePlaceholderVisibility() {
    const textarea = document.getElementById('russianInput');
    const placeholder = document.getElementById('animatedPlaceholder');
    if (textarea && placeholder) {
        if (textarea.value.length > 0) {
            placeholder.classList.add('hidden');
        } else {
            placeholder.classList.remove('hidden');
        }
    }
}

// ============================================================================
// CHAPTER 6 TEST RUNNER
// ============================================================================

const CH6_TESTS = {
    'Voicing Assimilation (Devoicing)': [
        { word: 'трубка', stress: 0, expected: 'trup kɑ', note: 'б→п before к (p.215)' },
        { word: 'обход', stress: 1, expected: 'ɑp xot', note: 'б→п before х (p.215)' },
        { word: 'ногти', stress: 0, expected: 'nok tʲi', note: 'г→к before т (p.216)' },
        { word: 'водка', stress: 0, expected: 'vot kɑ', note: 'д→т before к (p.217)' },
        { word: 'надпись', stress: 0, expected: 'nɑ tʲpʲisʌ', note: 'д→т before п (p.217) - syllabification needs review' },
        { word: 'подход', stress: 1, expected: 'pɑt xot', note: 'д→т before х (p.217)' },
        { word: 'ложка', stress: 0, expected: 'ɫoʃ kɑ', note: 'ж→ш before к (p.218)' },
        { word: 'рожки', stress: 0, expected: 'roʃ kʲi', note: 'ж→ш before к (p.218)' },
        { word: 'мужской', stress: 1, expected: 'muʃ skoj', note: 'ж→ш before с (p.218)' },
        { word: 'лезть', stress: 0, expected: 'lʲɛsʲtʲ', note: 'з→с before т (p.219)' },
        { word: 'мазки', stress: 1, expected: 'mɑ sʲkʲi', note: 'з→с before к (p.219)' },
    ],
    'Voicing Assimilation (Voicing)': [
        { word: 'вокзал', stress: 1, expected: 'vɑɡ zɑɫ', note: 'к→г before з (p.220)' },
        { word: 'анекдот', stress: 2, expected: 'ʌ ɲɪɡ dot', note: 'к→г before д (p.220)' },
        { word: 'экзамен', stress: 1, expected: 'ɪɡ zɑ mʲɪn', note: 'к→г before з (p.220)' },
        { word: 'сбор', stress: 0, expected: 'zbor', note: 'с→з before б (p.220)' },
        { word: 'просьба', stress: 0, expected: 'prozʲ bɑ', note: 'с→з before б (p.220)' },
        { word: 'сдавать', stress: 1, expected: 'zdɑ vɑtʲ', note: 'с→з before д (p.220)' },
        { word: 'сделка', stress: 0, expected: 'zʲdʲɛɫ kɑ', note: 'с→з before д (p.220)' },
        { word: 'отбой', stress: 1, expected: 'ɑd boj', note: 'т→д before б (p.221)' },
        { word: 'отзыв', stress: 0, expected: 'od zɨf', note: 'т→д before з (p.221)' },
    ],
    'Special Clusters': [
        { word: 'бесшумно', stress: 1, expected: 'bʲɪ ʃːum nʌ', note: 'сш→ʃː (p.235)' },
        { word: 'сжигать', stress: 1, expected: 'ʒːɨ ɡɑtʲ', note: 'сж→ʒː (p.236)' },
        { word: 'изживать', stress: 2, expected: 'i ʒːɨ vɑtʲ', note: 'зж→ʒː (p.236)' },
        { word: 'мужчина', stress: 1, expected: 'mu ʃʲʃʲi nɑ', note: 'жч→ʃʲʃʲ (p.236)' },
        { word: 'младший', stress: 0, expected: 'mɫɑ tʃːɨj', note: 'дш→tʃː (p.236)' },
        { word: 'лучший', stress: 0, expected: 'ɫu tʃːɨj', note: 'чш→tʃː (p.236)' },
        { word: 'поджёг', stress: 1, expected: 'pɑ dʒːok', note: 'дж→dʒː (p.237)' },
        { word: 'подчас', stress: 1, expected: 'pɑ tʲʃʲɑs', note: 'дч→tʲʃʲ (p.237)' },
        { word: 'скучно', stress: 0, expected: 'sku ʃnʌ', note: 'чн→ʃn (p.239)' },
        { word: 'конечно', stress: 1, expected: 'kɑ ɲɛ ʃnʌ', note: 'чн→ʃn (p.239), н→ɲ before е' },
        { word: 'что', stress: 0, expected: 'ʃto', note: 'чт→ʃt (p.240)' },
        { word: 'чтобы', stress: 0, expected: 'ʃto bɨ', note: 'чт→ʃt (p.240)' },
        { word: 'ничто', stress: 1, expected: 'ɲi ʃto', note: 'чт→ʃt (p.240), н→ɲ before и' },
    ],
    'гк/гч Rules': [
        { word: 'мягко', stress: 0, expected: 'mʲɑx kʌ', note: 'гк→xk before hard (p.240)' },
        { word: 'легко', stress: 1, expected: 'lʲɪx ko', note: 'гк→xk before hard (p.240)' },
        { word: 'мягкий', stress: 0, expected: 'mʲɑ xʲkʲij', note: 'гк→xʲkʲ before soft (p.240)' },
        { word: 'лёгкий', stress: 0, expected: 'lʲo xʲkʲij', note: 'гк→xʲkʲ before soft (p.240)' },
        { word: 'легче', stress: 0, expected: 'lʲɛx tʃʲɪ', note: 'гч→xtʃʲ (p.241)' },
        { word: 'мягче', stress: 0, expected: 'mʲɑx tʃʲɪ', note: 'гч→xtʃʲ (p.241)' },
    ],
    'Additional Deletions': [
        { word: 'страстный', stress: 0, expected: 'strɑ snɨj', note: 'стн→sn (p.243)' },
        { word: 'поздно', stress: 0, expected: 'po znʌ', note: 'здн→zn (p.243)' },
        { word: 'поздний', stress: 0, expected: 'po zɲij', note: 'здн→zɲ (p.243), н→ɲ before и' },
        { word: 'бездна', stress: 0, expected: 'bʲɛz dnɑ', note: 'здн preserved (p.244)' },
    ],
    'Reflexive Verbs': [
        { word: 'боится', stress: 1, expected: 'bɑ i tːsʌ', note: '-тся→tːsʌ (p.238)' },
        { word: 'купаться', stress: 1, expected: 'ku pɑ tːsʌ', note: '-ться→tːsʌ (p.238)' },
        { word: 'отца', stress: 1, expected: 'ɑ tːsɑ', note: 'тц→tːs (p.238)' },
        { word: 'молодцы', stress: 2, expected: 'mʌ ɫɑ tːsɨ', note: 'дц→tːs (p.238)' },
    ],
};

function normalizeForComparison(ipa) {
    return ipa.replace(/\s+/g, '').replace(/ˈ/g, '').replace(/ˌ/g, '').replace(/[\/\[\]]/g, '').replace(/\./g, '');
}

function runCh6Tests() {
    let html = '<div style="background:#1a1a2e;color:#eee;padding:20px;font-family:system-ui;">';
    html += '<h2 style="color:#d4a820;">Chapter 6 Test Results</h2>';
    
    let totalPassed = 0;
    let totalFailed = 0;
    const failures = [];
    
    for (const [category, tests] of Object.entries(CH6_TESTS)) {
        html += '<h3 style="color:#d4784a;border-bottom:1px solid #333;padding-bottom:5px;">' + category + '</h3>';
        
        for (const test of tests) {
            const result = processWord(test.word, test.stress);
            const actual = result.syllables.map((s, idx) => {
                return s.ipa;
            }).join(' ');
            
            const normalizedActual = normalizeForComparison(actual);
            const normalizedExpected = normalizeForComparison(test.expected);
            const passed = normalizedActual === normalizedExpected;
            
            if (passed) {
                totalPassed++;
                html += '<div style="margin:3px 0;padding:5px;background:#0d2818;border-left:3px solid #4ade80;border-radius:4px;">✅ <strong>' + test.word + '</strong>: /' + actual + '/</div>';
            } else {
                totalFailed++;
                failures.push({ ...test, actual });
                html += '<div style="margin:3px 0;padding:5px;background:#2d1a1a;border-left:3px solid #f87171;border-radius:4px;">❌ <strong>' + test.word + '</strong>: got /' + actual + '/, expected /' + test.expected + '/ <span style="color:#888;font-size:0.9em;">— ' + test.note + '</span></div>';
            }
        }
    }
    
    const total = totalPassed + totalFailed;
    const passRate = ((totalPassed / total) * 100).toFixed(1);
    
    html = '<div style="background:#0f3460;padding:15px;border-radius:8px;margin-bottom:20px;">' +
           '<h2 style="margin:0;color:' + (totalFailed === 0 ? '#4ade80' : '#f87171') + ';">' + 
           totalPassed + '/' + total + ' passed (' + passRate + '%)</h2>' +
           (totalFailed === 0 ? '<p style="color:#4ade80;">🎉 All Chapter 6 tests passing!</p>' : '') +
           '</div>' + html;
    
    html += '</div>';
    
    // Show in new window
    const w = window.open('', 'Ch6Tests', 'width=800,height=600');
    w.document.write('<!DOCTYPE html><html><head><title>Ch6 Test Results</title></head><body style="margin:0;">' + html + '</body></html>');
    w.document.close();
    
    return { passed: totalPassed, failed: totalFailed, failures };
}

// Expose for console testing
window.runCh6Tests = runCh6Tests;

// ============================================================================
// STYLE PRESET TESTS
// Run in console: runStylePresetTests()
// ============================================================================

const STYLE_PRESET_TESTS = {
    // Test 1: Vowel reduction - unstressed е
    // весна (spring) - stress on syllable 1, so first е is unstressed
    "весна": {
        stress: 1,
        expected: {
            "sung_russian_grayson": { shouldContain: "ɪ", description: "Unstressed е → /ɪ/ (ikanye)" },
            "petersburg": { shouldContain: "ɛ", shouldNotContain: "ɪ", description: "Unstressed е → /ɛ/ (ekanye)" },
            "choir": { shouldContain: "ɛ", shouldNotContain: "ɪ", description: "Unstressed е → /ɛ/ (no reduction)" }
        }
    },
    // Test 2: Vowel reduction - remote unstressed о
    // слово (word) - stress on syllable 0, so final о is remote unstressed
    "слово": {
        stress: 0,
        expected: {
            "sung_russian_grayson": { shouldContain: "ʌ", description: "Remote unstressed о → /ʌ/" },
            "choir": { shouldNotContain: "ʌ", description: "No reduction: о stays full" }
        }
    },
    // Test 3: Щ pronunciation - ещё
    "ещё": {
        stress: 1,
        expected: {
            "sung_russian_grayson": { shouldContain: "ʃʲʃʲ", shouldNotContain: "tʃʲ", description: "Щ → /ʃʲʃʲ/ (shshokanye)" },
            "petersburg": { shouldContain: "ʃʲtʃʲ", description: "Щ → /ʃʲtʃʲ/ (shchokanye)" }
        }
    },
    // Test 4: земля - unstressed е
    "земля": {
        stress: 1,
        expected: {
            "sung_russian_grayson": { shouldContain: "ɪ", description: "Unstressed е → /ɪ/" },
            "petersburg": { shouldContain: "ɛ", shouldNotContain: "ɪ", description: "Unstressed е → /ɛ/" }
        }
    },
    // Test 5: река - unstressed е
    "река": {
        stress: 1,
        expected: {
            "sung_russian_grayson": { shouldContain: "ɪ", description: "Unstressed е → /ɪ/" },
            "choir": { shouldContain: "ɛ", shouldNotContain: "ɪ", description: "Unstressed е → /ɛ/" }
        }
    }
};

function runStylePresetTests() {
    const results = { passed: 0, failed: 0, details: [] };
    const originalPreset = activePresetId;
    
    console.log("=".repeat(60));
    console.log("STYLE PRESET TESTS");
    console.log("=".repeat(60));
    
    for (const [word, testConfig] of Object.entries(STYLE_PRESET_TESTS)) {
        console.log(`\nTesting: ${word}`);
        
        for (const [presetId, expectations] of Object.entries(testConfig.expected)) {
            applyStylePreset(presetId);
            const processed = processWord(word, testConfig.stress);
            let fullIPA = processed.syllables.map(s => s.ipa).join('');
            fullIPA = applyStyleSettings(fullIPA);
            fullIPA = applyNotationPreferences(fullIPA);
            
            let passed = true;
            let failReason = "";
            
            if (expectations.shouldContain && !fullIPA.includes(expectations.shouldContain)) {
                passed = false;
                failReason = `Expected "${expectations.shouldContain}" not found`;
            }
            if (expectations.shouldNotContain && fullIPA.includes(expectations.shouldNotContain)) {
                passed = false;
                failReason = `Should NOT contain "${expectations.shouldNotContain}"`;
            }
            
            const status = passed ? "✅ PASS" : "❌ FAIL";
            console.log(`  ${presetId}: ${status} — /${fullIPA}/`);
            console.log(`    ${expectations.description}`);
            if (!passed) console.log(`    REASON: ${failReason}`);
            
            passed ? results.passed++ : results.failed++;
            results.details.push({ word, preset: presetId, ipa: fullIPA, passed, failReason });
        }
    }
    
    applyStylePreset(originalPreset);
    console.log("\n" + "=".repeat(60));
    console.log(`RESULTS: ${results.passed} passed, ${results.failed} failed`);
    console.log("=".repeat(60));
    return results;
}

window.runStylePresetTests = runStylePresetTests;

// Process initial text on load
window.addEventListener('DOMContentLoaded', async () => {
    // Load Vuizur stress dictionary from external JSON
    try {
        const response = await fetch('data/vuizur.json');
        STRESS_DICTIONARY = await response.json();
        console.log(`[MSR] Loaded ${Object.keys(STRESS_DICTIONARY).length} words from Vuizur dictionary`);
    } catch (e) {
        console.error('[MSR] Failed to load Vuizur dictionary:', e);
        console.warn('[MSR] Stress lookup will be limited to corrections and Wiktionary');
    }
    
    // Load user profile from localStorage
    loadUserProfile();
    applyUserProfileToMeta();
    
    // Load Wiktionary harvest from localStorage
    loadHarvest();
    
    // Attach hidden developer tool (triple-click version number)
    attachVersionClickHandlers();
    
    // Check for first launch and show onboarding if needed
    checkFirstLaunch();
    
    // Set up placeholder visibility listeners
    const textarea = document.getElementById('russianInput');
    if (textarea) {
        textarea.addEventListener('input', updatePlaceholderVisibility);
        textarea.addEventListener('focus', updatePlaceholderVisibility);
        textarea.addEventListener('blur', updatePlaceholderVisibility);
        updatePlaceholderVisibility(); // Initial check
    }
    
    processText();
});

// ============================================================================
// MODULE EXPORTS
// ============================================================================
// Phase-0: Export key functions for external access
// These will be refined in later phases as we split into smaller modules

export {
    // Core transcription
    processWord,
    processText,
    transcribeSyllable,
    syllabify,
    
    // Phonological analysis
    analyzeVoicingAssimilation,
    analyzeRegressivePalatalization,
    applyCrossBoundaryVoicing,
    
    // Dictionary/lookup
    lookupStress,
    hasStressEntry,
    harvestWord,
    
    // Settings
    applyStylePreset,
    applyNotationPreferences,
    applyStyleSettings,
    getStyleSetting,
    
    // Utilities
    normalizeText,
    normalizeChar,
    isVowel,
    isConsonant,
    countVowels,
    
    // UI (to be moved to ui/ in later phases)
    renderOutput,
    clearAll,
    
    // State (to become a store in later phases)
    processedWords,
    
    // Constants
    GRAYSON_IPA_INVENTORY,
    STYLE_PRESETS,
};
