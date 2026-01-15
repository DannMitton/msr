/**
 * MSR Chapter 6 Tests
 * Consonant cluster tests from Grayson Chapter 6
 */

import { processWord } from '../index.js';

// Test data for Chapter 6 clusters
export const CH6_TESTS = {
    // These would be populated from the original test file
    // For now, this is a placeholder structure
};

/**
 * Normalize IPA for comparison (ignore minor differences)
 */
export function normalizeForComparison(ipa) {
    return ipa
        .replace(/\s+/g, '')
        .replace(/ˈ/g, '')
        .replace(/ː/g, 'ː');
}

/**
 * Run Chapter 6 tests and return results
 */
export function runCh6Tests() {
    let totalPassed = 0;
    let totalFailed = 0;
    const failures = [];
    
    for (const [category, tests] of Object.entries(CH6_TESTS)) {
        for (const test of tests) {
            const result = processWord(test.word, test.stress);
            const actual = result.syllables.map(s => s.ipa).join(' ');
            
            const normalizedActual = normalizeForComparison(actual);
            const normalizedExpected = normalizeForComparison(test.expected);
            const passed = normalizedActual === normalizedExpected;
            
            if (passed) {
                totalPassed++;
            } else {
                totalFailed++;
                failures.push({ ...test, actual });
            }
        }
    }
    
    return { passed: totalPassed, failed: totalFailed, failures };
}

/**
 * Display test results in a new window
 */
export function displayCh6Tests() {
    const results = runCh6Tests();
    
    let html = '<div style="background:#1a1a2e;color:#eee;padding:20px;font-family:system-ui;">';
    html += '<h2 style="color:#d4a820;">Chapter 6 Test Results</h2>';
    html += `<p>${results.passed}/${results.passed + results.failed} passed</p>`;
    
    if (results.failures.length > 0) {
        html += '<h3 style="color:#f87171;">Failures:</h3>';
        for (const f of results.failures) {
            html += `<div style="margin:5px 0;padding:8px;background:#2d1a1a;border-radius:4px;">
                <strong>${f.word}</strong>: got /${f.actual}/, expected /${f.expected}/
                <br><span style="color:#888;">${f.note}</span>
            </div>`;
        }
    }
    
    html += '</div>';
    
    const w = window.open('', 'Ch6Tests', 'width=800,height=600');
    w.document.write('<!DOCTYPE html><html><head><title>Ch6 Tests</title></head><body style="margin:0;">' + html + '</body></html>');
    w.document.close();
    
    return results;
}

export default {
    CH6_TESTS,
    normalizeForComparison,
    runCh6Tests,
    displayCh6Tests
};
