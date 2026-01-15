// ============================================================================
// MSR (My Sung Russian) - Main Entry Point
// ============================================================================
// This is the public API surface for MSR.
// Import from here, not from internal modules.
// ============================================================================

export * from './core/transcript.js';

// Schema info for future multi-schema support
export const schema = {
    id: 'grayson2012',
    name: 'Grayson (2012)',
    description: 'Russian Lyric Diction for Singers',
    version: '4.16'
};
