import { Plugin } from 'vite';
import * as fs from 'node:fs';
import { glob } from 'glob';

/**
 * Optimizes shader #include directives by shortening include names.
 *
 * This plugin:
 * 1. Extracts include names from buildShader.ts's includesDict
 * 2. Scans all shader files to count usage frequency
 * 3. Assigns 1-character names to frequently used includes (2 chars for less frequent)
 * 4. Replaces include names in both buildShader.ts and .glsl files
 *
 * Expected savings: ~788 bytes (compressed)
 */
export function optimizeShaderIncludesPlugin(): Plugin {
    let includeMapping: Map<string, string> | null = null;
    let buildShaderProcessed = false;
    let includeNames: string[] = [];

    return {
        name: 'optimize-shader-includes',
        enforce: 'pre',

        buildStart() {
            // Reset state for each build
            includeMapping = null;
            buildShaderProcessed = false;
            includeNames = [];

            // Pre-scan buildShader.ts to extract include names
            try {
                const buildShaderPath = 'PaleGL/src/PaleGL/core/buildShader.ts';
                const buildShaderContent = fs.readFileSync(buildShaderPath, 'utf-8');

                // Extract include names from includesDict
                const dictPattern = /\['([^']+)',\s*\w+/g;
                const matches = [...buildShaderContent.matchAll(dictPattern)];
                includeNames = matches.map(m => m[1]);

                if (includeNames.length > 0) {
                    // Generate mapping based on actual file usage
                    includeMapping = generateIncludeMapping(includeNames);

                    console.log('[optimize-shader-includes] Generated mapping:');
                    includeMapping.forEach((shortName, longName) => {
                        console.log(`  ${longName} -> ${shortName}`);
                    });
                }
            } catch (err) {
                console.warn('[optimize-shader-includes] Failed to pre-scan buildShader.ts:', err);
            }
        },

        transform(code, id) {
            // Step 1: Process buildShader.ts to replace include names
            if (id.includes('buildShader.ts') && !buildShaderProcessed && includeMapping) {
                buildShaderProcessed = true;

                // Replace include names in buildShader.ts
                let modified = code;
                includeMapping.forEach((shortName, longName) => {
                    // Replace ['longName', with ['shortName',
                    const pattern = new RegExp(`\\['${escapeRegex(longName)}',`, 'g');
                    modified = modified.replace(pattern, `['${shortName}',`);
                });

                return { code: modified, map: null };
            }

            // Step 2: Replace #include directives in .glsl files
            if (id.endsWith('.glsl') && includeMapping) {
                let modified = code;
                let hasChanges = false;

                includeMapping.forEach((shortName, longName) => {
                    const pattern = new RegExp(`#include<${escapeRegex(longName)}>`, 'g');
                    if (pattern.test(modified)) {
                        modified = modified.replace(pattern, `#include<${shortName}>`);
                        hasChanges = true;
                    }
                });

                if (hasChanges) {
                    return { code: modified, map: null };
                }
            }

            return null;
        },
    };
}

/**
 * Generates a mapping from long include names to short names based on usage frequency.
 * More frequently used includes get 1-character names, less frequent ones get 2 characters.
 */
function generateIncludeMapping(includeNames: string[]): Map<string, string> {
    // Scan all shader files to count usage
    const glslFiles = [
        ...glob.sync('PaleGL/src/PaleGL/shaders/**/*.glsl'),
        ...glob.sync('src/**/*.glsl'),
    ];

    console.log(`[optimize-shader-includes] Scanning ${glslFiles.length} shader files...`);

    const usageCount = new Map<string, number>();
    includeNames.forEach(name => usageCount.set(name, 0));

    glslFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        includeNames.forEach(name => {
            const pattern = new RegExp(`#include<${escapeRegex(name)}>`, 'g');
            const matches = content.match(pattern);
            if (matches) {
                usageCount.set(name, (usageCount.get(name) || 0) + matches.length);
            }
        });
    });

    // Sort by usage frequency (descending)
    const sorted = [...usageCount.entries()].sort((a, b) => b[1] - a[1]);

    console.log('[optimize-shader-includes] Usage frequency:');
    sorted.forEach(([name, count]) => {
        console.log(`  ${name}: ${count} times`);
    });

    // Assign short names
    // 1-character names for most frequent (26 available: a-z)
    // 2-character names for less frequent
    const oneCharCandidates = 'lcurdatgvomfsneplhwkbjqxyz'.split('');
    const mapping = new Map<string, string>();

    sorted.forEach(([name], index) => {
        if (index < oneCharCandidates.length) {
            // Use 1-character name
            mapping.set(name, oneCharCandidates[index]);
        } else {
            // Use 2-character name (first 2 chars of original name)
            const shortName = name.substring(0, 2);
            mapping.set(name, shortName);
        }
    });

    return mapping;
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
