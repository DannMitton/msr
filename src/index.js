/**
 * MSR (My Sung Russian) - Main Entry Point
 * Version: 4.16-modular
 * 
 * This module exports all the core functionality for Russian IPA transcription.
 */

// Core transcription utilities
export {
    normalizeChar,
    normalizeText,
    isVowel,
    isConsonant,
    isSonorant,
    getSonority,
    syllabify,
    countVowels,
    getSyllablePosition,
    isPalatalizingAgent,
    isInterpalatal,
    getVoicingPair,
    isVoiced,
    isVoiceless
} from './core/transcribe.js';

// Phonological analysis
export {
    analyzeVoicingAssimilation,
    analyzeRegressivePalatalization,
    checkSpecialCluster
} from './core/phonology.js';

// Dictionary and stress lookup
export {
    setDictionaries,
    lookupStress,
    hasStressEntry,
    checkYoException,
    checkExceptionWord,
    loadHarvest,
    saveHarvest,
    harvestWord,
    getHarvestStats,
    exportHarvest,
    downloadHarvest,
    clearHarvest,
    getHarvestData,
    validateIPAOutput
} from './core/dictionary.js';

// Style presets and notation
export {
    STYLE_PRESETS,
    getStyleSetting,
    setStyleSetting,
    applyStylePreset,
    getCurrentPreset,
    loadSettings,
    applyNotationPreferences,
    applyStyleSettings,
    toggleShchaNotation,
    togglePalatalnNotation
} from './core/styles.js';

// Transcription engine
export { transcribeSyllable } from './core/engine.js';

// ============================================================================
// HIGH-LEVEL PROCESSING FUNCTIONS
// ============================================================================

import { normalizeText, syllabify, countVowels, getSyllablePosition } from './core/transcribe.js';
import { analyzeVoicingAssimilation, analyzeRegressivePalatalization } from './core/phonology.js';
import { lookupStress, checkExceptionWord } from './core/dictionary.js';
import { transcribeSyllable } from './core/engine.js';
import { applyStyleSettings, applyNotationPreferences } from './core/styles.js';

/**
 * Process a single word and return transcription data
 * @param {string} word - Russian word
 * @param {number} stressIndex - Known stress index, or -1 for auto-lookup
 * @param {object} options - Processing options
 * @returns {object} Processed word data
 */
export function processWord(word, stressIndex = -1, options = {}) {
    const normalized = normalizeText(word);
    
    // Check for complete exception override
    const exception = checkExceptionWord(normalized);
    if (exception) {
        return {
            word: normalized,
            syllables: [{ cyrillic: normalized, ipa: exception.ipa, isStressed: true }],
            stressIndex: 0,
            source: 'exception',
            exception: exception
        };
    }
    
    // Syllabify
    const syllables = syllabify(normalized);
    const vowelCount = countVowels(normalized);
    
    // Determine stress
    let effectiveStressIndex = stressIndex;
    let stressSource = 'user';
    
    if (stressIndex === -1) {
        const lookup = lookupStress(normalized);
        if (lookup.index !== -1) {
            effectiveStressIndex = lookup.index;
            stressSource = lookup.source;
        }
    }
    
    // Suppress stress for monosyllables
    const shouldSuppressStress = vowelCount === 1 && effectiveStressIndex !== -1;
    if (shouldSuppressStress) {
        effectiveStressIndex = -1;
    }
    
    // Analyze phonological processes
    const voicingMap = analyzeVoicingAssimilation(normalized);
    const palatalizationMap = analyzeRegressivePalatalization(normalized);
    
    // Build word context
    let charOffset = 0;
    const transcribedSyllables = syllables.map((syl, idx) => {
        const position = getSyllablePosition(idx, effectiveStressIndex, syllables.length);
        const isLastSyllable = idx === syllables.length - 1;
        
        const wordContext = {
            word: normalized,
            syllables: syllables,
            voicingMap: voicingMap,
            palatalizationMap: palatalizationMap,
            syllableStartInWord: charOffset,
            isLastSyllable: isLastSyllable,
            crossSyllableGeminates: new Set()
        };
        
        let ipa = transcribeSyllable(syl, position, wordContext, options.lockedSyllables || new Set());
        ipa = applyStyleSettings(ipa);
        ipa = applyNotationPreferences(ipa);
        
        charOffset += syl.length;
        
        return {
            cyrillic: syl,
            ipa: ipa,
            isStressed: idx === effectiveStressIndex
        };
    });
    
    return {
        word: normalized,
        syllables: transcribedSyllables,
        stressIndex: effectiveStressIndex,
        originalStressIndex: stressIndex,
        source: stressSource,
        monosyllabicStressSuppressed: shouldSuppressStress
    };
}

/**
 * Process text (multiple words) and return array of processed words
 * @param {string} text - Russian text
 * @returns {Array} Array of processed word objects
 */
export function processText(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    return words.map(word => processWord(word));
}

// ============================================================================
// VERSION INFO
// ============================================================================

export const VERSION = '4.16-modular';
export const BUILD_DATE = new Date().toISOString().slice(0, 10);
