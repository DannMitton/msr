/**
 * Remove Redundant Exceptions
 * 
 * Run auditExceptions() first, then run this to get the cleaned dictionary.
 * 
 * Usage:
 *   const results = auditExceptions();
 *   removeRedundantExceptions(results);
 * 
 * This will output a new exception-words.js file content to the console.
 */

function removeRedundantExceptions(auditResults) {
    if (!auditResults || !auditResults.redundant) {
        console.error('Run auditExceptions() first and pass the results to this function.');
        return;
    }
    
    const redundantWords = new Set(auditResults.redundant.map(r => r.word));
    
    console.log(`\nRemoving ${redundantWords.size} redundant entries...\n`);
    console.log('Redundant words being removed:');
    redundantWords.forEach(w => console.log(`  - ${w}`));
    
    // Build new dictionary without redundant entries
    const cleanedEntries = {};
    let removedCount = 0;
    let keptCount = 0;
    
    for (const [word, data] of Object.entries(EXCEPTION_WORDS)) {
        if (redundantWords.has(word)) {
            removedCount++;
        } else {
            cleanedEntries[word] = data;
            keptCount++;
        }
    }
    
    console.log(`\n✅ Removed: ${removedCount}`);
    console.log(`✅ Kept: ${keptCount}`);
    console.log(`\n════════════════════════════════════════════════════════════`);
    console.log('CLEANED EXCEPTION DICTIONARY');
    console.log('Copy everything below this line into data/exception-words.js');
    console.log('════════════════════════════════════════════════════════════\n');
    
    // Generate the cleaned file content
    let output = `// Exception Words - full IPA transcriptions for irregular words
// Sources: Grayson Ch. 8.5, Ch. 6, Appendix F
// CLEANED: ${new Date().toISOString().split('T')[0]} - removed ${removedCount} redundant entries

const EXCEPTION_WORDS = {
`;
    
    // Group by category based on rule text
    const categories = {
        'счастье family': [],
        'Silent letters': [],
        'Cluster rules': [],
        'Old Muscovite': [],
        'Loanwords': [],
        'Other': []
    };
    
    for (const [word, data] of Object.entries(cleanedEntries)) {
        const rule = data.rule || '';
        
        if (word.startsWith('счасть')) {
            categories['счастье family'].push({ word, data });
        } else if (rule.includes('silent') || rule.includes('Silent')) {
            categories['Silent letters'].push({ word, data });
        } else if (rule.includes('→') && (rule.includes('чт') || rule.includes('чн') || rule.includes('гк') || rule.includes('здн'))) {
            categories['Cluster rules'].push({ word, data });
        } else if (rule.includes('Old Muscovite') || rule.includes('tradition')) {
            categories['Old Muscovite'].push({ word, data });
        } else if (rule.includes('Loan word') || rule.includes('Loanword')) {
            categories['Loanwords'].push({ word, data });
        } else {
            categories['Other'].push({ word, data });
        }
    }
    
    // Output each category
    for (const [catName, entries] of Object.entries(categories)) {
        if (entries.length === 0) continue;
        
        output += `\n    // ════════════════════════════════════════════════════════════\n`;
        output += `    // ${catName.toUpperCase()} (${entries.length} entries)\n`;
        output += `    // ════════════════════════════════════════════════════════════\n\n`;
        
        for (const { word, data } of entries) {
            const ipa = data.ipa;
            const stressIndex = data.stressIndex;
            const rule = data.rule.replace(/'/g, "\\'");
            output += `    '${word}': { ipa: '${ipa}', stressIndex: ${stressIndex}, rule: '${rule}' },\n`;
        }
    }
    
    output += `};\n`;
    
    console.log(output);
    
    // Also copy to clipboard if available
    if (navigator.clipboard) {
        navigator.clipboard.writeText(output).then(() => {
            console.log('\n📋 Copied to clipboard!');
        }).catch(() => {
            console.log('\n⚠️ Could not copy to clipboard. Please copy manually from above.');
        });
    }
    
    return {
        removed: removedCount,
        kept: keptCount,
        output: output
    };
}

// Make available globally
window.removeRedundantExceptions = removeRedundantExceptions;
