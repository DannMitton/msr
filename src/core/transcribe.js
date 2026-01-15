/**
 * MSR Transcription Engine
 * Core phonological functions for Russian IPA transcription
 * 
 * Based on Craig Grayson's "Russian Lyric Diction" (2012)
 */

// ============================================================================
// CHARACTER CLASSIFICATION
// ============================================================================

const VOWELS = new Set(['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я']);
const CONSONANTS = new Set([
    'б', 'в', 'г', 'д', 'ж', 'з', 'й', 'к', 'л', 'м', 'н', 'п', 'р', 'с', 'т', 'ф', 'х', 'ц', 'ч', 'ш', 'щ'
]);
const SONORANTS = new Set(['л', 'м', 'н', 'р', 'й']);

// Character normalization map (Latin/Greek to Cyrillic)
const CHAR_MAP = {
    'A': 'А', 'a': 'а', 'B': 'В', 'C': 'С', 'E': 'Е', 'e': 'е',
    'H': 'Н', 'K': 'К', 'M': 'М', 'O': 'О', 'o': 'о', 'P': 'Р',
    'p': 'р', 'T': 'Т', 'X': 'Х', 'x': 'х', 'Y': 'У', 'y': 'у',
    'α': 'а', 'β': 'в', 'γ': 'г', 'ε': 'е', 'η': 'н', 'ι': 'и',
    'κ': 'к', 'μ': 'м', 'ν': 'н', 'ο': 'о', 'ρ': 'р', 'τ': 'т',
    'υ': 'у', 'χ': 'х', 'ω': 'о',
    // Pre-revolutionary orthography normalization (Grayson)
    'ѣ': 'е', 'і': 'и', 'ѵ': 'и', 'ѳ': 'ф', 'Ѣ': 'Е', 'І': 'И', 'Ѵ': 'И', 'Ѳ': 'Ф'
};

export function normalizeChar(char) {
    return CHAR_MAP[char] || char;
}

export function normalizeText(text) {
    return Array.from(text).map(normalizeChar).join('');
}

export function isVowel(char) {
    return VOWELS.has(char?.toLowerCase());
}

export function isConsonant(char) {
    return CONSONANTS.has(char?.toLowerCase());
}

export function isSonorant(char) {
    return SONORANTS.has(char?.toLowerCase());
}

export function getSonority(char) {
    char = char?.toLowerCase();
    if (isVowel(char)) return 4;
    if (char === 'й') return 3;
    if (isSonorant(char)) return 2;
    if (isConsonant(char)) return 1;
    return 0;
}

// ============================================================================
// SYLLABIFICATION
// ============================================================================

export function syllabify(word) {
    const chars = Array.from(word.toLowerCase());
    const syllables = [];
    let currentSyllable = '';
    let i = 0;

    while (i < chars.length) {
        const char = chars[i];
        
        // Handle soft/hard signs
        if (char === 'ь' || char === 'ъ') {
            currentSyllable += char;
            i++;
            continue;
        }
        
        currentSyllable += char;

        // Check if this is a vowel (nucleus of syllable)
        if (isVowel(char)) {
            // Look ahead for consonants after this vowel
            let j = i + 1;
            while (j < chars.length && !isVowel(chars[j]) && chars[j] !== 'ь' && chars[j] !== 'ъ') {
                j++;
            }

            // If we hit the end of the word, attach all remaining consonants
            if (j >= chars.length) {
                currentSyllable += chars.slice(i + 1).join('');
                syllables.push(currentSyllable);
                break;
            }

            // If next character is a vowel, close the syllable
            if (j === i + 1 && isVowel(chars[j])) {
                syllables.push(currentSyllable);
                currentSyllable = '';
                i++;
                continue;
            }

            // We have consonants before the next vowel
            const consonantCluster = chars.slice(i + 1, j);
            
            if (consonantCluster.length === 0) {
                syllables.push(currentSyllable);
                currentSyllable = '';
            } else if (consonantCluster.length === 1) {
                // Single consonant goes with next syllable (CV.CV pattern)
                syllables.push(currentSyllable);
                currentSyllable = '';
            } else {
                // Multiple consonants: split by sonority
                let minSonority = 5;
                let splitPoint = 1;
                
                for (let k = 0; k < consonantCluster.length; k++) {
                    const sonority = getSonority(consonantCluster[k]);
                    if (sonority < minSonority) {
                        minSonority = sonority;
                        splitPoint = k;
                    }
                }

                if (splitPoint > 0) {
                    currentSyllable += consonantCluster.slice(0, splitPoint).join('');
                }
                syllables.push(currentSyllable);
                currentSyllable = '';
                i = i + splitPoint;
            }
        }
        
        i++;
    }

    if (currentSyllable) {
        syllables.push(currentSyllable);
    }

    return syllables.length > 0 ? syllables : [word.toLowerCase()];
}

export function countVowels(word) {
    return Array.from(word.toLowerCase()).filter(char => isVowel(char)).length;
}

export function getSyllablePosition(syllableIndex, stressIndex, totalSyllables) {
    if (syllableIndex === stressIndex) return 'stressed';
    if (stressIndex === -1) return 'unstressed';
    if (syllableIndex === stressIndex - 1) return 'pretonic-immediate';
    if (syllableIndex < stressIndex) return 'pretonic-remote';
    if (syllableIndex === stressIndex + 1) return 'posttonic-immediate';
    return 'posttonic-remote';
}

// ============================================================================
// PALATALIZATION ANALYSIS
// ============================================================================

const PALATALIZING_VOWELS = new Set(['и', 'е', 'ё', 'ю', 'я']);
const INHERENT_SOFT = new Set(['ч', 'щ', 'й']);
const INHERENT_HARD = new Set(['ж', 'ш', 'ц']);

export function isPalatalizingAgent(char, nextChar) {
    char = char?.toLowerCase();
    nextChar = nextChar?.toLowerCase();
    
    if (nextChar === 'ь') return true;
    if (PALATALIZING_VOWELS.has(nextChar)) {
        if (INHERENT_HARD.has(char)) return false;
        return true;
    }
    return false;
}

export function isInterpalatal(consonant, nextChar) {
    consonant = consonant?.toLowerCase();
    nextChar = nextChar?.toLowerCase();
    
    if (INHERENT_SOFT.has(consonant)) return true;
    if (nextChar === 'ь') return true;
    if (PALATALIZING_VOWELS.has(nextChar) && !INHERENT_HARD.has(consonant)) {
        return true;
    }
    return false;
}

// ============================================================================
// VOICING PAIRS
// ============================================================================

const VOICING_PAIRS = {
    'б': 'п', 'п': 'б',
    'в': 'ф', 'ф': 'в',
    'г': 'к', 'к': 'г',
    'д': 'т', 'т': 'д',
    'ж': 'ш', 'ш': 'ж',
    'з': 'с', 'с': 'з'
};

const VOICED_CONSONANTS = new Set(['б', 'в', 'г', 'д', 'ж', 'з']);
const VOICELESS_CONSONANTS = new Set(['п', 'ф', 'к', 'т', 'ш', 'с', 'х', 'ц', 'ч', 'щ']);

export function getVoicingPair(consonant) {
    return VOICING_PAIRS[consonant?.toLowerCase()] || null;
}

export function isVoiced(consonant) {
    return VOICED_CONSONANTS.has(consonant?.toLowerCase());
}

export function isVoiceless(consonant) {
    return VOICELESS_CONSONANTS.has(consonant?.toLowerCase());
}

// ============================================================================
// EXPORTS FOR TESTING
// ============================================================================

export const _internals = {
    VOWELS,
    CONSONANTS,
    SONORANTS,
    CHAR_MAP,
    VOICING_PAIRS
};
