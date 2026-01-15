/**
 * MSR Phonology Module
 * Voicing assimilation, palatalization analysis, and special cluster handling
 * 
 * Based on Grayson Chapter 5-6
 */

import { isConsonant, isVowel } from './transcribe.js';

// ============================================================================
// CONSONANT CLASSIFICATION
// ============================================================================

const SONORANTS = new Set(['л', 'м', 'н', 'р', 'й']);
const DENTALS = new Set(['т', 'д', 'с', 'з', 'н', 'ц']);
const VELARS = new Set(['к', 'г', 'х']);
const LABIALS = new Set(['б', 'п', 'в', 'ф', 'м']);
const ALWAYS_HARD = new Set(['ж', 'ш', 'ц']);
const INHERENTLY_PALATALIZED = new Set(['ч', 'щ', 'й']);
const PALATALIZING_VOWELS = new Set(['е', 'ё', 'и', 'ю', 'я']);

const VOICED_CONSONANTS = new Set(['б', 'в', 'г', 'д', 'ж', 'з']);
const UNVOICED_CONSONANTS = new Set(['п', 'ф', 'к', 'т', 'ш', 'с', 'х', 'ц', 'ч', 'щ']);

// Voicing pairs (Grayson p. 258-259)
const VOICED_TO_UNVOICED = {
    'б': 'p', 'в': 'f', 'г': 'k', 'д': 't', 'ж': 'ʃ', 'з': 's'
};

const UNVOICED_TO_VOICED = {
    'п': 'b', 'ф': 'v', 'к': 'ɡ', 'т': 'd', 'ш': 'ʒ', 'с': 'z',
    'х': 'ɣ',   // p. 257
    'ц': 'dz',  // p. 256
    'ч': 'dʒʲ', // p. 256
    'щ': 'ʒʲʒʲ' // p. 224
};

// ============================================================================
// VOICING ASSIMILATION (Grayson Chapter 6)
// ============================================================================

export function analyzeVoicingAssimilation(word) {
    const chars = Array.from(word.toLowerCase());
    const voicingMap = new Map();
    
    // Process right-to-left to find voicing agents
    for (let i = chars.length - 1; i >= 0; i--) {
        const char = chars[i];
        
        if (!isConsonant(char) || char === 'ъ' || char === 'ь') continue;
        if (SONORANTS.has(char)) continue;
        
        // Find next consonant in cluster
        let nextConsonant = null;
        
        for (let j = i + 1; j < chars.length; j++) {
            const nc = chars[j];
            if (nc === 'ь' || nc === 'ъ') continue;
            if (isVowel(nc)) break;
            if (SONORANTS.has(nc)) continue;
            if (nc === 'в') continue; // в has no assimilative power (p. 251)
            if (isConsonant(nc)) {
                nextConsonant = nc;
                break;
            }
        }
        
        if (nextConsonant === null) continue;
        
        const nextIsVoiced = VOICED_CONSONANTS.has(nextConsonant);
        const nextIsUnvoiced = UNVOICED_CONSONANTS.has(nextConsonant);
        
        if (nextIsUnvoiced && VOICED_CONSONANTS.has(char)) {
            voicingMap.set(i, { type: 'devoice', ipa: VOICED_TO_UNVOICED[char] });
        } else if (nextIsVoiced && UNVOICED_CONSONANTS.has(char)) {
            voicingMap.set(i, { type: 'voice', ipa: UNVOICED_TO_VOICED[char] });
        }
    }
    
    return voicingMap;
}

// ============================================================================
// REGRESSIVE PALATALIZATION (Grayson Chapter 5, pp. 205-211)
// ============================================================================

export function analyzeRegressivePalatalization(word) {
    const chars = Array.from(word.toLowerCase());
    const palatalizationMap = new Map();
    
    // First pass: identify directly palatalized consonants
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const nextChar = chars[i + 1];
        
        if (!isConsonant(char)) continue;
        if (ALWAYS_HARD.has(char)) continue;
        
        if (INHERENTLY_PALATALIZED.has(char)) {
            palatalizationMap.set(i, true);
        } else if (nextChar === 'ь') {
            palatalizationMap.set(i, true);
        } else if (PALATALIZING_VOWELS.has(nextChar) && !ALWAYS_HARD.has(char)) {
            palatalizationMap.set(i, true);
        }
    }
    
    // Second pass: regressive palatalization through clusters
    for (let i = chars.length - 1; i >= 0; i--) {
        const char = chars[i];
        
        if (!isConsonant(char)) continue;
        if (ALWAYS_HARD.has(char)) continue;
        if (palatalizationMap.get(i)) continue;
        
        // Find next consonant in cluster
        let nextConsIdx = -1;
        let nextCons = null;
        for (let j = i + 1; j < chars.length; j++) {
            const nc = chars[j];
            if (nc === 'ь' || nc === 'ъ') continue;
            if (isVowel(nc)) break;
            if (isConsonant(nc)) {
                nextConsIdx = j;
                nextCons = nc;
                break;
            }
        }
        
        if (nextCons === null) continue;
        if (!palatalizationMap.get(nextConsIdx)) continue;
        if (ALWAYS_HARD.has(nextCons)) continue;
        
        // Limiting rules (Grayson p. 209)
        
        // Rule 1: л only when doubled
        if (char === 'л') {
            if (nextCons === 'л') palatalizationMap.set(i, true);
            continue;
        }
        
        // Rule 2: р only when doubled (stressed front vowel check in transcribeSyllable)
        if (char === 'р') {
            if (nextCons === 'р') palatalizationMap.set(i, true);
            continue;
        }
        
        // Rule 3: н before palatalized н or dental
        if (char === 'н') {
            if (nextCons === 'н' || DENTALS.has(nextCons)) {
                palatalizationMap.set(i, true);
            }
            continue;
        }
        
        // Rule 4: Velars before palatalized velars
        if (VELARS.has(char)) {
            if (VELARS.has(nextCons)) palatalizationMap.set(i, true);
            continue;
        }
        
        // Rule 5: Labials before palatalized labials
        if (LABIALS.has(char)) {
            if (LABIALS.has(nextCons)) palatalizationMap.set(i, true);
            continue;
        }
        
        // Default for dentals
        if (DENTALS.has(char)) {
            palatalizationMap.set(i, true);
        }
    }
    
    return palatalizationMap;
}

// ============================================================================
// SPECIAL CLUSTER READINGS (Grayson Chapter 6, Section 2, pp. 235-247)
// ============================================================================

export function checkSpecialCluster(word, startIdx) {
    const chars = Array.from(word.toLowerCase());
    const remaining = chars.slice(startIdx).join('');
    
    // сш, зш → /ʃː/ (p. 235)
    if (remaining.startsWith('сш') || remaining.startsWith('зш')) {
        return { length: 2, ipa: 'ʃː', description: 'сш/зш → ʃː (p. 235)' };
    }
    
    // зж, сж → /ʒː/ (p. 236)
    if (remaining.startsWith('зж') || remaining.startsWith('сж')) {
        return { length: 2, ipa: 'ʒː', description: 'зж/сж → ʒː (p. 236)' };
    }
    
    // сч, зч → /ʃʲʃʲ/ (p. 236)
    if (remaining.startsWith('сч') || remaining.startsWith('зч')) {
        return { length: 2, ipa: 'ʃʲʃʲ', description: 'сч/зч → ʃʲʃʲ (p. 236)' };
    }
    
    // жч → /ʃʲʃʲ/ (p. 236)
    if (remaining.startsWith('жч')) {
        return { length: 2, ipa: 'ʃʲʃʲ', description: 'жч → ʃʲʃʲ (p. 236)' };
    }
    
    // стч, здч → /ʃʲʃʲ/ (p. 236)
    if (remaining.startsWith('стч') || remaining.startsWith('здч')) {
        return { length: 3, ipa: 'ʃʲʃʲ', description: 'стч/здч → ʃʲʃʲ (p. 236)' };
    }
    
    // тш, дш, чш → /tʃː/ (p. 236)
    if (remaining.startsWith('тш') || remaining.startsWith('дш') || remaining.startsWith('чш')) {
        return { length: 2, ipa: 'tʃː', description: 'тш/дш/чш → tʃː (p. 236)' };
    }
    
    // дж, тж → /dʒː/ (p. 237)
    if (remaining.startsWith('дж') || remaining.startsWith('тж')) {
        return { length: 2, ipa: 'dʒː', description: 'дж/тж → dʒː (p. 237)' };
    }
    
    // тч, дч → /tʲʃʲ/ (p. 237)
    if (remaining.startsWith('тч') || remaining.startsWith('дч')) {
        return { length: 2, ipa: 'tʲʃʲ', description: 'тч/дч → tʲʃʲ (p. 237)' };
    }
    
    // тц, дц → /tːs/ (p. 237-238)
    if (remaining.startsWith('тц') || remaining.startsWith('дц')) {
        return { length: 2, ipa: 'tːs', description: 'тц/дц → tːs (p. 237)' };
    }
    
    // чн → /ʃn/ for specific words (p. 239-240)
    if (remaining.startsWith('чн')) {
        const wordStr = chars.join('');
        if (wordStr.includes('скучн') || wordStr === 'конечно') {
            return { length: 2, ipa: 'ʃn', description: 'чн → ʃn (скучно rule, p. 239)' };
        }
    }
    
    // чт → /ʃt/ for что derivatives (p. 240)
    if (remaining.startsWith('чт')) {
        const wordStr = chars.join('');
        if (wordStr === 'что' || wordStr.startsWith('чтоб') || wordStr === 'ничто') {
            return { length: 2, ipa: 'ʃt', description: 'чт → ʃt (что rule, p. 240)' };
        }
    }
    
    // гк → /xk/ or /xʲkʲ/ (p. 240)
    if (remaining.startsWith('гк')) {
        const wordStr = chars.join('');
        if (wordStr.includes('мягк') || wordStr.includes('лёгк') || wordStr.includes('легк')) {
            const afterK = chars[startIdx + 2];
            const softVowels = ['е', 'ё', 'и', 'ю', 'я', 'ь'];
            if (afterK && softVowels.includes(afterK)) {
                return { length: 2, ipa: 'xʲkʲ', description: 'гк → xʲkʲ (p. 240)' };
            } else {
                return { length: 2, ipa: 'xk', description: 'гк → xk (p. 240)' };
            }
        }
    }
    
    // стн → /sn/ or /sɲ/ (p. 243)
    if (remaining.startsWith('стн')) {
        const afterCluster = remaining.substring(3);
        const palatalizingVowels = ['е', 'ё', 'и', 'ю', 'я', 'ь'];
        if (afterCluster.length > 0 && palatalizingVowels.includes(afterCluster[0])) {
            return { length: 3, ipa: 'sɲ', description: 'стн → sɲ (p. 243)' };
        }
        return { length: 3, ipa: 'sn', description: 'стн → sn (p. 243)' };
    }
    
    // здн → /zn/ or /zɲ/ (p. 243)
    if (remaining.startsWith('здн')) {
        const wordStr = chars.join('');
        if (!wordStr.includes('бездн')) {
            const afterCluster = remaining.substring(3);
            const palatalizingVowels = ['е', 'ё', 'и', 'ю', 'я', 'ь'];
            if (afterCluster.length > 0 && palatalizingVowels.includes(afterCluster[0])) {
                return { length: 3, ipa: 'zɲ', description: 'здн → zɲ (p. 243)' };
            }
            return { length: 3, ipa: 'zn', description: 'здн → zn (p. 243)' };
        }
    }
    
    // рдц → /rts/ (p. 243)
    if (remaining.startsWith('рдц')) {
        return { length: 3, ipa: 'rts', description: 'рдц → rts (p. 243)' };
    }
    
    // лнц → /nts/ (солнце, p. 246)
    if (remaining.startsWith('лнц')) {
        return { length: 3, ipa: 'nts', description: 'лнц → nts (p. 246)' };
    }
    
    // вств → /stv/ (p. 246)
    if (remaining.startsWith('вств')) {
        return { length: 4, ipa: 'stv', description: 'вств → stv (p. 246)' };
    }
    
    // -ться/-тся verb endings (p. 237)
    if (remaining.startsWith('ться') || remaining.startsWith('тся')) {
        return { length: remaining.startsWith('ться') ? 4 : 3, ipa: 'tːsʌ', description: '-ться/-тся → tːsʌ (p. 237)' };
    }
    if (remaining.startsWith('дься') || remaining.startsWith('дся')) {
        return { length: remaining.startsWith('дься') ? 4 : 3, ipa: 'tːsʌ', description: '-дься/-дся → tːsʌ (p. 237)' };
    }
    
    // -ся/-сь reflexive (p. 267)
    if ((remaining === 'ся' || remaining === 'сь') || 
        (remaining.startsWith('ся') && remaining.length === 2) ||
        (remaining.startsWith('сь') && remaining.length === 2)) {
        const prevChar = chars[startIdx - 1];
        const prevPrevChar = chars[startIdx - 2];
        if (prevChar === 'т' || prevChar === 'д' ||
            (prevChar === 'ь' && (prevPrevChar === 'т' || prevPrevChar === 'д'))) {
            return null;
        }
        return { length: 2, ipa: 'sʌ', description: '-ся/-сь → sʌ (p. 267)' };
    }
    
    // -ого/-его genitive ending: г → /v/ (p. 189)
    if (remaining.startsWith('г')) {
        const wordStr = chars.join('');
        if (wordStr.endsWith('ого') || wordStr.endsWith('его')) {
            const endingStart = wordStr.length - 3;
            if (startIdx === endingStart + 1) {
                return { length: 1, ipa: 'v', description: '-ого/-его: г → v (p. 189)' };
            }
        }
    }
    
    return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const _internals = {
    SONORANTS,
    DENTALS,
    VELARS,
    LABIALS,
    VOICED_TO_UNVOICED,
    UNVOICED_TO_VOICED
};
