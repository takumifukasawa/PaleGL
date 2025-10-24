import { Plugin } from 'vite';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Marionetter定数の置換プラグイン
 *
 * types/index.tsから `export const MARIONETTER_*_PROPERTY_* = "value"` を読み込み、
 * 対象ファイルで `obj[CONSTANT_NAME]` を `obj["value"]` に置換します。
 *
 * これにより、Terserのmangleが適用されてもJSON側とのマッチングが保証されます。
 */
export const replaceMarionetterConstantsPlugin: () => Plugin = () => {
    const TYPES_FILE_PATH = path.resolve(__dirname, '../src/Marionetter/types/index.ts');
    const TARGET_DIRS = [
        'src/Marionetter',
        'src/pages/scripts',
    ];

    // types/index.tsから定数をパースしてマップを作成
    const constantsMap = new Map<string, string>();

    return {
        name: 'replace-marionetter-constants',
        enforce: 'pre',

        buildStart() {
            console.log(`[replaceMarionetterConstantsPlugin] Parsing constants from ${TYPES_FILE_PATH}`);

            try {
                const content = fs.readFileSync(TYPES_FILE_PATH, 'utf-8');

                // export const MARIONETTER_*_PROPERTY_* = NeedsShorten ? 'short' : 'long'; のパターン
                const ternaryPattern = /export const (MARIONETTER_[A-Z_]+_PROPERTY_[A-Z_]+)\s*=\s*NeedsShorten\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g;

                let match;
                while ((match = ternaryPattern.exec(content)) !== null) {
                    const [, constantName, shortValue] = match;
                    // NeedsShorten = true なので shortValue を使用
                    constantsMap.set(constantName, shortValue);
                }

                console.log(`[replaceMarionetterConstantsPlugin] Parsed ${constantsMap.size} constants`);

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
                console.error(`[replaceMarionetterConstantsPlugin] Error parsing types file:`, error);
            }
        },

        transform(code: string, id: string) {
            // types/index.ts自体は対象外
            if (id.includes('types/index.ts')) {
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
