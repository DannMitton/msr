#!/usr/bin/env node
// ============================================================================
// MSR Build Script
// ============================================================================
// Bundles src/ into a single dist/msr.js file
// Run: node build.mjs
// ============================================================================

import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    outfile: 'public/msr.js',
    format: 'iife',
    globalName: 'MSR',
    sourcemap: true,
    minify: false,  // Keep readable for debugging
    target: ['es2020'],
    banner: {
        js: '// MSR (My Sung Russian) v4.16 - Bundled build\n// https://github.com/DannMitton/msr\n'
    }
});

console.log('✓ Built public/msr.js');
