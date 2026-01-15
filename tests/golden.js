/**
 * MSR Golden-Master Tests
 * 
 * These are known-good word → IPA pairs verified against Grayson's
 * Russian Lyric Diction (2012). Run these before any refactoring
 * to catch regressions.
 * 
 * Usage (browser console):
 *   runGoldenTests()
 * 
 * Usage (Node.js - future):
 *   node tests/golden.js
 * 
 * Test format:
 *   { word, stress, expected, note }
 *   - word: Cyrillic input
 *   - stress: syllable index (0-based), or -1 for unstressed/clitic
 *   - expected: IPA output (spaces between syllables, no slashes)
 *   - note: Grayson page reference or rule description
 */

const GOLDEN_TESTS = {
    
    // ================================================================
    // CLITICS AND PREPOSITIONS (inherently unstressed)
    // Grayson p. 263: particles and prepositions don't carry stress
    // Word-initial unstressed о → /ɑ/ (Grayson p. 97)
    // ================================================================
    'Clitics and Prepositions': [
        { word: 'во', stress: -1, expected: 'vɑ', note: 'Voweled preposition, unstressed, word-initial о → /ɑ/ (p.97, p.263)' },
        { word: 'ко', stress: -1, expected: 'kɑ', note: 'Voweled preposition, unstressed, word-initial о → /ɑ/ (p.97, p.263)' },
        { word: 'со', stress: -1, expected: 'sɑ', note: 'Voweled preposition, unstressed, word-initial о → /ɑ/ (p.97, p.263)' },
        { word: 'не', stress: -1, expected: 'ɲɪ', note: 'Particle, unstressed (p.263)' },
        { word: 'ни', stress: -1, expected: 'ɲi', note: 'Particle, unstressed (p.263)' },
        // Note: в, к, с, б merge with following word, not tested standalone
    ],
    
    // ================================================================
    // STRESSED VOWELS (Chapter 3, Section 1)
    // Grayson p. 81-96
    // ================================================================
    'Stressed Vowels': [
        { word: 'мама', stress: 0, expected: 'mɑ mɑ', note: 'Stressed а → ɑ, immediate posttonic а → ɑ (p.82, p.97)' },
        { word: 'папа', stress: 0, expected: 'pɑ pɑ', note: 'Stressed а → ɑ, immediate posttonic а → ɑ (p.82, p.97)' },
        { word: 'дом', stress: 0, expected: 'dom', note: 'Stressed о → o (p.86)' },
        { word: 'ночь', stress: 0, expected: 'notʃʲ', note: 'Stressed о → o, ч always palatalized /tʃʲ/ (p.86, p.176)' },
        { word: 'сон', stress: 0, expected: 'son', note: 'Stressed о → o (p.86)' },
        { word: 'лес', stress: 0, expected: 'lʲɛs', note: 'Stressed е → ɛ (p.89)' },
        { word: 'мир', stress: 0, expected: 'mʲir', note: 'Stressed и → i, final р not palatalized (no following cluster) (p.96, p.209 fn.277)' },
        { word: 'сын', stress: 0, expected: 'sɨn', note: 'Stressed ы → ɨ (p.94)' },
        { word: 'дух', stress: 0, expected: 'dux', note: 'Stressed у → u (p.93)' },
    ],
    
    // ================================================================
    // UNSTRESSED VOWEL REDUCTION (Chapter 3, Section 7)
    // Grayson p. 125-137
    // ================================================================
    'Vowel Reduction - Akanye': [
        { word: 'вода', stress: 1, expected: 'vɑ dɑ', note: 'Immediate pretonic о → ɑ (p.127)' },
        { word: 'молоко', stress: 2, expected: 'mʌ ɫɑ ko', note: 'Remote о → ʌ, immediate → ɑ (p.127)' },
        { word: 'хорошо', stress: 2, expected: 'xʌ rɑ ʃo', note: 'Remote о → ʌ, immediate → ɑ (p.127)' },
        { word: 'голова', stress: 2, expected: 'ɡʌ ɫɑ vɑ', note: 'Remote о → ʌ, immediate → ɑ (p.127)' },
    ],
    
    'Vowel Reduction - Ikanye': [
        { word: 'весна', stress: 1, expected: 'vʲɪ snɑ', note: 'Unstressed е → ɪ (p.130)' },
        { word: 'земля', stress: 1, expected: 'zʲɪ mlʲɑ', note: 'Unstressed е → ɪ (p.130)' },
    ],
    
    'И Never Reduces': [
        { word: 'игра', stress: 1, expected: 'i ɡrɑ', note: 'Unstressed и stays i (p.96)' },
        { word: 'книга', stress: 0, expected: 'kɲi ɡɑ', note: 'кн→kɲ before и, unstressed и stays i, immediate posttonic а → ɑ (p.96, p.97, p.183)' },
    ],
    
    // ================================================================
    // PALATALIZATION (Chapter 5)
    // Grayson p. 203-214
    // ================================================================
    'Palatal Nasal': [
        { word: 'няня', stress: 0, expected: 'ɲa ɲɑ', note: 'н before я → ɲ, stressed interpalatal → /a/, word-final posttonic я → /ɑ/ (p.183, p.104, MSR extension of p.97)' },
        { word: 'конь', stress: 0, expected: 'koɲ', note: 'нь → ɲ (p.183)' },
        { word: 'день', stress: 0, expected: 'dʲeɲ', note: 'Interpalatal е → /e/, нь → ɲ (p.106, p.183)' },
        { word: 'очень', stress: 0, expected: 'otʃʲiɲ', note: 'Unstressed interpalatal е: reduces to /ɪ/ then fronts to /i/ (p.126), нь → ɲ (p.183)' },
    ],
    
    'Hard vs Soft Л': [
        { word: 'был', stress: 0, expected: 'bɨɫ', note: 'Hard л → ɫ (p.184)' },
        { word: 'была', stress: 1, expected: 'bɨ ɫɑ', note: 'Hard л → ɫ (p.184)' },
        { word: 'люди', stress: 0, expected: 'lʲu dʲi', note: 'Soft л → lʲ (p.184)' },
        { word: 'любовь', stress: 1, expected: 'lʲu bofʲ', note: 'Soft л → lʲ (p.184)' },
    ],
    
    // ================================================================
    // VOICING ASSIMILATION (Chapter 6)
    // Grayson p. 215-225
    // ================================================================
    'Voicing Assimilation - Devoicing': [
        { word: 'трубка', stress: 0, expected: 'trup kɑ', note: 'б→п before к (p.215)' },
        { word: 'обход', stress: 1, expected: 'ɑp xot', note: 'б→п before х (p.215)' },
        { word: 'ногти', stress: 0, expected: 'nok tʲi', note: 'г→к before т (p.216)' },
        { word: 'водка', stress: 0, expected: 'vot kɑ', note: 'д→т before к (p.217)' },
        { word: 'подход', stress: 1, expected: 'pɑt xot', note: 'д→т before х (p.217)' },
        { word: 'ложка', stress: 0, expected: 'ɫoʃ kɑ', note: 'ж→ш before к (p.218)' },
        { word: 'лезть', stress: 0, expected: 'lʲɛsʲtʲ', note: 'з→с before т (p.219)' },
    ],
    
    'Voicing Assimilation - Voicing': [
        { word: 'вокзал', stress: 1, expected: 'vɑɡ zɑɫ', note: 'к→г before з (p.220)' },
        { word: 'сбор', stress: 0, expected: 'zbor', note: 'с→з before б (p.220)' },
        { word: 'просьба', stress: 0, expected: 'prozʲ bɑ', note: 'с→з before б (p.220)' },
        { word: 'отбой', stress: 1, expected: 'ɑd boj', note: 'т→д before б (p.221)' },
    ],
    
    // ================================================================
    // SPECIAL CLUSTERS (Chapter 6)
    // Grayson p. 235-244
    // ================================================================
    'Special Clusters': [
        { word: 'что', stress: 0, expected: 'ʃto', note: 'чт→ʃt (p.240)' },
        { word: 'конечно', stress: 1, expected: 'kɑ ɲɛ ʃnʌ', note: 'чн→ʃn (p.239)' },
        { word: 'скучно', stress: 0, expected: 'sku ʃnʌ', note: 'чн→ʃn (p.239)' },
    ],
    
    'Reflexive Verbs': [
        { word: 'боится', stress: 1, expected: 'bɑ i tːsʌ', note: '-тся→tːsʌ (p.238)' },
        { word: 'купаться', stress: 1, expected: 'ku pɑ tːsʌ', note: '-ться→tːsʌ (p.238)' },
    ],
    
    // ================================================================
    // EXCEPTION WORDS (Chapter 8)
    // Words with irregular pronunciations
    // ================================================================
    'Exception Words': [
        { word: 'счастье', stress: 0, expected: 'ʃʲʃʲɑ sʲtʲjɪ', note: 'сч→ʃʲʃʲ (p.236, Grayson default), exception to interpalatal /a/ (p.287)' },
        { word: 'сердце', stress: 0, expected: 'sʲɛr tsɨ', note: 'рдц→рц, д silent (p.243), unstressed е after ц → ɨ (p.127)' },
        { word: 'солнце', stress: 0, expected: 'son tsɨ', note: 'лнц→нц, л silent (p.243), unstressed е after ц → ɨ (p.127)' },
    ],
    
    // ================================================================
    // Ё WORDS (always stressed)
    // Grayson p. 85-86
    // ================================================================
    'Ё Stress Rule': [
        { word: 'ёлка', stress: 0, expected: 'joɫ kɑ', note: 'ё always stressed, hard л → ɫ, immediate posttonic а → ɑ (p.85, p.184, p.97)' },
        { word: 'моё', stress: 1, expected: 'mɑ jo', note: 'ё always stressed (p.85)' },
        { word: 'её', stress: 1, expected: 'ji jo', note: 'ё always stressed, first е interpalatal (j on both sides) → /i/ (p.85, p.104)' },
    ],
    
    // ================================================================
    // REAL REPERTOIRE TESTS
    // Words from actual vocal literature
    // ================================================================
    'Pushkin/Tchaikovsky Vocabulary': [
        { word: 'храм', stress: 0, expected: 'xrɑm', note: 'Monosyllable, stressed' },
        { word: 'брожу', stress: 1, expected: 'brɑ ʒu', note: 'Common verb' },
        { word: 'улиц', stress: 0, expected: 'u lʲits', note: 'Genitive plural' },
        { word: 'шумных', stress: 0, expected: 'ʃum nɨx', note: 'Adjective genitive plural' },
    ],
    
};

/**
 * Normalize IPA for comparison
 * Strips spaces, stress marks, and brackets for fuzzy matching
 */
function normalizeForComparison(ipa) {
    return ipa
        .replace(/\s+/g, '')      // Remove spaces
        .replace(/ˈ/g, '')        // Remove primary stress
        .replace(/ˌ/g, '')        // Remove secondary stress
        .replace(/[\/\[\]]/g, '') // Remove slashes/brackets
        .replace(/\./g, '');      // Remove syllable dots
}

/**
 * Run all golden-master tests
 * Returns { passed, failed, failures[] }
 */
function runGoldenTests() {
    let totalPassed = 0;
    let totalFailed = 0;
    const failures = [];
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('MSR Golden-Master Tests');
    console.log('═══════════════════════════════════════════════════════════');
    
    for (const [category, tests] of Object.entries(GOLDEN_TESTS)) {
        console.log(`\n▶ ${category}`);
        
        for (const test of tests) {
            // processWord is defined in index.html
            // Pass isClitic: true for words with stress = -1 (unstressed clitics)
            const options = test.stress === -1 ? { isClitic: true } : {};
            const result = processWord(test.word, test.stress, options);
            const actual = result.syllables.map(s => s.ipa).join(' ');
            
            const normalizedActual = normalizeForComparison(actual);
            const normalizedExpected = normalizeForComparison(test.expected);
            const passed = normalizedActual === normalizedExpected;
            
            if (passed) {
                totalPassed++;
                console.log(`  ✅ ${test.word}: /${actual}/`);
            } else {
                totalFailed++;
                failures.push({ ...test, actual });
                console.log(`  ❌ ${test.word}: got /${actual}/, expected /${test.expected}/`);
                console.log(`     ${test.note}`);
            }
        }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    const total = totalPassed + totalFailed;
    const passRate = ((totalPassed / total) * 100).toFixed(1);
    
    if (totalFailed === 0) {
        console.log(`🎉 ALL TESTS PASSED: ${totalPassed}/${total} (${passRate}%)`);
    } else {
        console.log(`⚠️  ${totalPassed}/${total} passed (${passRate}%)`);
        console.log(`\nFailed tests:`);
        failures.forEach(f => {
            console.log(`  - ${f.word}: expected /${f.expected}/, got /${f.actual}/`);
        });
    }
    console.log('═══════════════════════════════════════════════════════════');
    
    return { passed: totalPassed, failed: totalFailed, total, failures };
}

/**
 * Run a single test (for debugging)
 */
function testWord(word, stress = -1) {
    const result = processWord(word, stress);
    const ipa = result.syllables.map(s => s.ipa).join(' ');
    console.log(`${word} (stress: ${stress}) → /${ipa}/`);
    return result;
}

// Expose for browser console
if (typeof window !== 'undefined') {
    window.runGoldenTests = runGoldenTests;
    window.testWord = testWord;
    window.GOLDEN_TESTS = GOLDEN_TESTS;
}

// Export for Node.js (future)
if (typeof module !== 'undefined') {
    module.exports = { GOLDEN_TESTS, runGoldenTests, testWord, normalizeForComparison };
}
