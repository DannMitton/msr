/**
 * MSR Transcription Engine
 * Core syllable-to-IPA conversion
 * 
 * Based on Grayson's "Russian Lyric Diction" (2012)
 */

import { isConsonant, isVowel, isInterpalatal } from './transcribe.js';
import { checkSpecialCluster } from './phonology.js';

// ============================================================================
// DEVOICING MAP (Grayson p. 199-202)
// ============================================================================

const DEVOICING_MAP = {
    'б': 'p',   // p. 199-200
    'в': 'f',   // p. 200
    'г': 'k',   // p. 201
    'д': 't',   // p. 201
    'ж': 'ʃ',   // p. 202
    'з': 's'    // p. 202
};

// ============================================================================
// TRANSCRIBE SYLLABLE
// ============================================================================

/**
 * Transcribe a single syllable to IPA
 * @param {string} syllable - The Cyrillic syllable
 * @param {string} position - Stress position: 'stressed', 'pretonic-immediate', 'pretonic-remote', 'posttonic-immediate', 'posttonic-remote', 'unstressed'
 * @param {object} wordContext - Context including word, voicingMap, palatalizationMap, etc.
 * @param {Set} lockedSyllables - Set of syllable indices that should not reduce
 * @returns {string} IPA transcription
 */
export function transcribeSyllable(syllable, position, wordContext, lockedSyllables = new Set()) {
    const chars = Array.from(syllable.toLowerCase());
    let ipa = '';
    
    const voicingMap = wordContext.voicingMap || new Map();
    const palatalizationMap = wordContext.palatalizationMap || new Map();
    const syllableStartInWord = wordContext.syllableStartInWord || 0;
    const crossSyllableGeminates = wordContext.crossSyllableGeminates || new Set();
    const isLastSyllable = wordContext.isLastSyllable || false;
    
    // Helper: check if consonant is word-final
    function isWordFinal(index) {
        if (!isLastSyllable) return false;
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

        // Skip signs
        if (char === 'ъ' || char === 'ь') continue;

        // CONSONANTS
        if (isConsonant(char)) {
            const wordCharIdx = syllableStartInWord + i;
            
            // Skip if part of cross-syllable geminate already handled
            if (crossSyllableGeminates.has(wordCharIdx) && i === 0) continue;
            
            // Check for special cluster
            const specialCluster = checkSpecialCluster(wordContext.word, wordCharIdx);
            if (specialCluster) {
                ipa += specialCluster.ipa;
                const charsInSyllable = Math.min(specialCluster.length, chars.length - i);
                i += (charsInSyllable - 1);
                continue;
            }
            
            // Check voicing assimilation
            const voicingChange = voicingMap.get(wordCharIdx);
            const shouldDevoice = isWordFinal(i) && DEVOICING_MAP.hasOwnProperty(char);
            
            if (voicingChange) {
                ipa += voicingChange.ipa;
            } else {
                // Transcribe consonant
                switch (char) {
                    // Labials
                    case 'б': ipa += shouldDevoice ? 'p' : 'b'; break;
                    case 'п': ipa += 'p'; break;
                    case 'в': ipa += shouldDevoice ? 'f' : 'v'; break;
                    case 'ф': ipa += 'f'; break;
                    
                    // Dentals
                    case 'д': ipa += shouldDevoice ? 't' : 'd'; break;
                    case 'т': ipa += 't'; break;
                    
                    // Velars
                    case 'г': ipa += shouldDevoice ? 'k' : 'ɡ'; break;
                    case 'к': ipa += 'k'; break;
                    case 'х': ipa += 'x'; break;
                    
                    // Sibilants
                    case 'з': ipa += shouldDevoice ? 's' : 'z'; break;
                    case 'с': ipa += 's'; break;
                    
                    // Hard hushers
                    case 'ж': ipa += shouldDevoice ? 'ʃ' : 'ʒ'; break;
                    case 'ш': ipa += 'ʃ'; break;
                    
                    // Affricates
                    case 'ц': ipa += 'ts'; break;
                    case 'ч': ipa += 'tʃʲ'; break;
                    case 'щ': ipa += 'ʃʲʃʲ'; break;
                    
                    // Sonorants
                    case 'л':
                        const lPal = palatalizationMap.get(wordCharIdx) ||
                            nextChar === 'ь' || 
                            (isInterpalatal(char, nextChar) && !['ж', 'ш', 'ц'].includes(char));
                        ipa += lPal ? 'lʲ' : 'ɫ';
                        break;
                        
                    case 'м': ipa += 'm'; break;
                    
                    case 'н':
                        const nPal = palatalizationMap.get(wordCharIdx) || 
                            nextChar === 'ь' || 
                            (isInterpalatal(char, nextChar) && !['ж', 'ш', 'ц'].includes(char));
                        ipa += nPal ? 'ɲ' : 'n';
                        break;
                    
                    case 'р':
                        const rPal = palatalizationMap.get(wordCharIdx) || nextChar === 'ь';
                        const prevCharForR = chars[i - 1];
                        const frontVowels = ['и', 'е', 'э'];
                        const hasFollowingCluster = nextChar && isConsonant(nextChar) && nextChar !== 'ь';
                        const afterStressedFrontVowel = position === 'stressed' && 
                            frontVowels.includes(prevCharForR) && hasFollowingCluster;
                        ipa += (rPal || afterStressedFrontVowel) ? 'rʲ' : 'r';
                        break;
                    
                    case 'й': ipa += 'j'; break;
                }
            }

            // Add palatalization marker for non-inherent cases
            const inherentlyPalatalized = ['й', 'ч', 'щ'];
            const alwaysHard = ['ж', 'ш', 'ц'];
            
            if (!inherentlyPalatalized.includes(char) && !alwaysHard.includes(char)) {
                const isPalatalized = palatalizationMap.get(wordCharIdx) ||
                    nextChar === 'ь' ||
                    (isInterpalatal(char, nextChar) && !alwaysHard.includes(char));
                
                // Only add ʲ if not already handled (л, н, р have special handling)
                if (isPalatalized && !['л', 'н', 'р'].includes(char)) {
                    ipa += 'ʲ';
                }
            }
            
            // Handle geminates
            const isGeminate = char === nextChar;
            if (isGeminate && !['ж', 'ш', 'щ', 'ч'].includes(char)) {
                ipa += 'ː';
                i++;
            }
        }
        
        // VOWELS
        else if (isVowel(char)) {
            const prevIsVowel = isVowel(prevChar);
            const prevIsConsonant = isConsonant(prevChar);
            const afterInterpalatal = prevIsConsonant && isInterpalatal(prevChar, char);
            
            // J-glide for iotated vowels after vowels, signs, or word-initially
            const needsJGlide = prevIsVowel || prevChar === 'ъ' || prevChar === 'ь' || i === 0;
            
            switch (char) {
                case 'а':
                    if (position === 'stressed') {
                        ipa += afterInterpalatal ? 'a' : 'ɑ';
                    } else if (position === 'pretonic-immediate') {
                        ipa += afterInterpalatal ? 'a' : 'ɑ';
                    } else {
                        ipa += afterInterpalatal ? 'ɪ' : 'ʌ';
                    }
                    break;

                case 'о':
                    if (position === 'stressed') {
                        ipa += 'o';
                    } else if (position === 'pretonic-immediate') {
                        ipa += 'ɑ';
                    } else {
                        ipa += 'ʌ';
                    }
                    break;

                case 'е':
                case 'ё':
                    if (needsJGlide) ipa += 'j';
                    if (position === 'stressed') {
                        if (char === 'ё') {
                            ipa += 'o';
                        } else {
                            ipa += afterInterpalatal ? 'e' : 'ɛ';
                        }
                    } else if (position === 'pretonic-immediate') {
                        ipa += 'ɪ';
                    } else {
                        ipa += 'ɪ';
                    }
                    break;

                case 'я':
                    if (needsJGlide) ipa += 'j';
                    if (position === 'stressed') {
                        ipa += afterInterpalatal ? 'a' : 'ɑ';
                    } else if (position === 'pretonic-immediate') {
                        ipa += afterInterpalatal ? 'a' : 'ɑ';
                    } else {
                        ipa += afterInterpalatal ? 'ɪ' : 'ʌ';
                    }
                    break;

                case 'ю':
                    if (needsJGlide) ipa += 'j';
                    ipa += position === 'stressed' ? 'u' : 'ʊ';
                    break;

                case 'и':
                    // Grayson p. 96: и NEVER reduces
                    ipa += 'i';
                    break;

                case 'ы':
                    ipa += position === 'stressed' ? 'ɨ' : 'ɨ̞';
                    break;

                case 'у':
                    ipa += position === 'stressed' ? 'u' : 'ʊ';
                    break;

                case 'э':
                    ipa += position === 'stressed' ? 'ɛ' : 'ɪ';
                    break;
            }
        }
    }

    return ipa;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default transcribeSyllable;
