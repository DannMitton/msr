/**
 * MSR Styles Module
 * Style presets and notation preferences
 */

// ============================================================================
// STYLE PRESETS (Grayson Chapter 9)
// ============================================================================

export const STYLE_PRESETS = {
    'sung-russian': {
        name: 'Sung Russian (Grayson)',
        description: 'Standard lyric diction per Grayson dissertation',
        settings: {
            vowelReduction: 'ikanye',
            shchaNotation: 'ʃtʃ',
            palatalnNotation: 'ɲ',
            velarIyEnding: false,
            regressivePalatalization: 'full'
        }
    },
    'modern-standard': {
        name: 'Modern Standard',
        description: 'Contemporary Russian pronunciation',
        settings: {
            vowelReduction: 'ikanye',
            shchaNotation: 'ɕː',
            palatalnNotation: 'nʲ',
            velarIyEnding: false,
            regressivePalatalization: 'partial'
        }
    },
    'petersburg': {
        name: 'Petersburg School',
        description: 'Conservative theatrical pronunciation',
        settings: {
            vowelReduction: 'ekanye',
            shchaNotation: 'ʃtʃ',
            palatalnNotation: 'ɲ',
            velarIyEnding: true,
            regressivePalatalization: 'full'
        }
    },
    'choir': {
        name: 'Choral Russian',
        description: 'Clear diction for ensemble singing',
        settings: {
            vowelReduction: 'none',
            shchaNotation: 'ʃtʃ',
            palatalnNotation: 'ɲ',
            velarIyEnding: false,
            regressivePalatalization: 'minimal'
        }
    }
};

// ============================================================================
// STATE
// ============================================================================

const STORAGE_KEY = 'msr_style_settings';

let currentSettings = {
    vowelReduction: 'ikanye',
    shchaNotation: 'ʃtʃ',
    palatalnNotation: 'ɲ',
    velarIyEnding: false,
    regressivePalatalization: 'full'
};

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

export function getStyleSetting(key) {
    return currentSettings[key];
}

export function setStyleSetting(key, value) {
    currentSettings[key] = value;
    saveSettings();
}

export function applyStylePreset(presetId) {
    const preset = STYLE_PRESETS[presetId];
    if (!preset) return false;
    
    currentSettings = { ...preset.settings };
    saveSettings();
    return true;
}

export function getCurrentPreset() {
    for (const [id, preset] of Object.entries(STYLE_PRESETS)) {
        const match = Object.entries(preset.settings).every(
            ([key, value]) => currentSettings[key] === value
        );
        if (match) return id;
    }
    return 'custom';
}

function saveSettings() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
    } catch (e) {
        console.warn('[Styles] Failed to save settings:', e);
    }
}

export function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            currentSettings = { ...currentSettings, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.warn('[Styles] Failed to load settings:', e);
    }
}

// ============================================================================
// NOTATION TRANSFORMS
// ============================================================================

export function applyNotationPreferences(ipa) {
    let result = ipa;
    
    // Shcha notation
    if (currentSettings.shchaNotation === 'ɕː') {
        result = result.replace(/ʃtʃ/g, 'ɕː');
    }
    
    // Palatal n notation
    if (currentSettings.palatalnNotation === 'nʲ') {
        result = result.replace(/ɲ/g, 'nʲ');
    }
    
    return result;
}

export function applyStyleSettings(ipa) {
    return applyNotationPreferences(ipa);
}

// ============================================================================
// TOGGLE FUNCTIONS (for UI)
// ============================================================================

export function toggleShchaNotation() {
    const current = currentSettings.shchaNotation;
    currentSettings.shchaNotation = current === 'ʃtʃ' ? 'ɕː' : 'ʃtʃ';
    saveSettings();
    return currentSettings.shchaNotation;
}

export function togglePalatalnNotation() {
    const current = currentSettings.palatalnNotation;
    currentSettings.palatalnNotation = current === 'ɲ' ? 'nʲ' : 'ɲ';
    saveSettings();
    return currentSettings.palatalnNotation;
}

// Initialize on load
loadSettings();
