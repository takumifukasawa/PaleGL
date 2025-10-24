import { Plugin } from 'vite';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Marionetter & PostProcess定数の置換プラグイン
 *
 * Marionetter types/index.tsと各postprocessファイルから
 * `export const *_PROPERTY_* = NeedsShorten ? "short" : "long"` を読み込み、
 * 対象ファイルで `obj[CONSTANT_NAME]` を `obj["value"]` に置換します。
 *
 * これにより、Terserのmangleが適用されてもJSON側とのマッチングが保証されます。
 */
export const replaceMarionetterConstantsPlugin: () => Plugin = () => {
    const SOURCE_FILES = [
        path.resolve(__dirname, '../src/Marionetter/types/index.ts'),
        path.resolve(__dirname, '../src/PaleGL/postprocess/bloomPass.ts'),
        path.resolve(__dirname, '../src/PaleGL/postprocess/chromaticAberrationPass.ts'),
        path.resolve(__dirname, '../src/PaleGL/postprocess/depthOfFieldPass.ts'),
        path.resolve(__dirname, '../src/PaleGL/postprocess/fogPass.ts'),
        path.resolve(__dirname, '../src/PaleGL/postprocess/glitchPass.ts'),
        path.resolve(__dirname, '../src/PaleGL/postprocess/lightShaftPass.ts'),
        path.resolve(__dirname, '../src/PaleGL/postprocess/screenSpaceShadowPass.ts'),
        path.resolve(__dirname, '../src/PaleGL/postprocess/ssaoPass.ts'),
        path.resolve(__dirname, '../src/PaleGL/postprocess/ssrPass.ts'),
        path.resolve(__dirname, '../src/PaleGL/postprocess/streakPass.ts'),
        path.resolve(__dirname, '../src/PaleGL/postprocess/vignettePass.ts'),
        path.resolve(__dirname, '../src/PaleGL/postprocess/volumetricLightPass.ts'),
    ];
    const TARGET_DIRS = [
        'src/Marionetter',
        'src/pages/scripts',
        'src/PaleGL/components',
    ];

    // types/index.tsから定数をパースしてマップを作成
    const constantsMap = new Map<string, string>();

    return {
        name: 'replace-marionetter-constants',
        enforce: 'pre',

        buildStart() {
            console.log(`[replaceMarionetterConstantsPlugin] Parsing constants from ${SOURCE_FILES.length} files`);

            try {
                // 汎用パターン: *_PROPERTY_* 形式の定数を収集
                const ternaryPattern = /export const ([A-Z_]+_PROPERTY_[A-Z_]+)\s*=\s*NeedsShorten\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g;

                for (const sourceFile of SOURCE_FILES) {
                    if (!fs.existsSync(sourceFile)) {
                        console.warn(`[replaceMarionetterConstantsPlugin] File not found: ${sourceFile}`);
                        continue;
                    }

                    const content = fs.readFileSync(sourceFile, 'utf-8');
                    let match;
                    let fileCount = 0;

                    while ((match = ternaryPattern.exec(content)) !== null) {
                        const [, constantName, shortValue] = match;
                        // NeedsShorten = true なので shortValue を使用
                        constantsMap.set(constantName, shortValue);
                        fileCount++;
                    }

                    if (fileCount > 0) {
                        console.log(`  ${path.basename(sourceFile)}: ${fileCount} constants`);
                    }
                }

                console.log(`[replaceMarionetterConstantsPlugin] Total parsed: ${constantsMap.size} constants`);

                // デバッグ用: 最初の5個を表示
                let count = 0;
                for (const [key, value] of constantsMap.entries()) {
                    if (count++ < 5) {
                        console.log(`  ${key} -> "${value}"`);
                    }
                }
                if (constantsMap.size > 5) {
                    console.log(`  ... and ${constantsMap.size - 5} more`);
                }
            } catch (error) {
                console.error(`[replaceMarionetterConstantsPlugin] Error parsing files:`, error);
            }
        },

        transform(code: string, id: string) {
            // ソースファイル自体は対象外
            if (SOURCE_FILES.some(sourceFile => id.includes(path.basename(sourceFile)))) {
                return null;
            }

            // 対象ディレクトリのTSファイルのみ処理
            const isTargetFile = TARGET_DIRS.some(dir => id.includes(dir)) && id.endsWith('.ts');

            if (!isTargetFile || constantsMap.size === 0) {
                return null;
            }

            let modified = code;
            let replacementCount = 0;

            // 各定数について [CONSTANT_NAME] -> ["value"] に置換
            for (const [constantName, value] of constantsMap.entries()) {
                const pattern = new RegExp(`\\[${constantName}\\]`, 'g');
                const replacement = `["${value}"]`;

                const beforeLength = modified.length;
                modified = modified.replace(pattern, replacement);
                const afterLength = modified.length;

                if (beforeLength !== afterLength) {
                    const count = (beforeLength - afterLength) / (constantName.length - value.length - 3);
                    replacementCount += count;
                }
            }

            if (replacementCount > 0) {
                console.log(`[replaceMarionetterConstantsPlugin] Replaced ${replacementCount} constants in ${path.basename(id)}`);
                return {
                    code: modified,
                    map: null,
                };
            }

            return null;
        },
    };
};
