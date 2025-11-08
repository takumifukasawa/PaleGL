import { Plugin } from 'vite';
import * as path from 'node:path';

export type InlineShaderPluginOptions = {
    /** シェーダー定数名 → ファイル名のマッピング */
    shaderFileMap: Map<string, string>;
    /** シェーダーインライン化の対象ディレクトリ */
    targetDirs: string[];
};

/**
 * シェーダーインライン化プラグイン
 *
 * ビルド時（VITE_COMPACT=true）に、getShaderCache(SHADER_XXX) / getShaderPath(SHADER_XXX) 呼び出しを
 * 直接importに変換し、watchShader.ts/shaderCache.tsをTree-shakingで削除可能にする。
 *
 * 改行やコメント（// prettier-ignore等）を含む複数行の呼び出しにも対応。
 *
 * 変換例:
 * Before: const shader = getShaderCache(SHADER_OBJECT_SPACE_RAYMARCH_HUMAN);
 * Before: getShaderPath(
 *             // prettier-ignore
 *             SHADER_TEST_FLOOR
 *         )
 * After:  import __inline_shader_0 from '../shaders/object-space-raymarch-human-particle.glsl';
 *         const shader = __inline_shader_0;
 */
export const inlineShaderPlugin = (options: InlineShaderPluginOptions): Plugin => {
    const { shaderFileMap, targetDirs } = options;

    let isCompact = false;

    return {
        name: 'inline-shader-plugin',
        enforce: 'pre',

        configResolved(config) {
            isCompact = config.env.VITE_COMPACT === 'true';
            if (isCompact) {
                console.log('[inlineShaderPlugin] Shader inlining enabled (VITE_COMPACT=true)');
            }
        },

        transform(code: string, id: string) {
            // VITE_COMPACT=true でない場合はスキップ
            if (!isCompact) {
                return null;
            }

            // 対象ディレクトリのTSファイルのみ処理
            const isTargetFile = targetDirs.some((dir) => id.includes(dir)) && id.endsWith('.ts');

            if (!isTargetFile) {
                return null;
            }

            // getShaderCache() / getShaderPath() 呼び出しをチェック（改行・コメント対応）
            // 括弧内の空白・改行・コメント（// prettier-ignore等）を許容
            const getShaderPattern = /get(?:ShaderCache|ShaderPath)\s*\((?:\s|\/\/[^\n]*\n)*(SHADER_[A-Z_]+)\s*\)/g;
            const matches = [...code.matchAll(getShaderPattern)];

            if (matches.length === 0) {
                return null;
            }

            let modified = code;
            const importsToAdd: string[] = [];
            let importCounter = 0;

            // 各呼び出しを置き換え
            for (const match of matches) {
                const [fullMatch, constantName] = match;
                const shaderFileName = shaderFileMap.get(constantName);

                if (!shaderFileName) {
                    console.warn(
                        `[inlineShaderPlugin] Unknown shader constant: ${constantName} in ${path.basename(id)}`
                    );
                    continue;
                }

                const varName = `__inline_shader_${importCounter++}`;
                const importPath = `../shaders/${shaderFileName}`;

                // import文を追加
                importsToAdd.push(`import ${varName} from '${importPath}';`);

                // getShaderCache(SHADER_XXX) を変数に置き換え
                modified = modified.replace(fullMatch, varName);
            }

            if (importsToAdd.length === 0) {
                return null;
            }

            // import文を先頭に追加（既存のimport文の後に挿入）
            const lastImportIndex = findLastImportIndex(modified);
            if (lastImportIndex !== -1) {
                const insertPosition = lastImportIndex;
                modified =
                    modified.slice(0, insertPosition) +
                    '\n' +
                    importsToAdd.join('\n') +
                    '\n' +
                    modified.slice(insertPosition);
            } else {
                // import文がない場合はファイルの先頭に追加
                modified = importsToAdd.join('\n') + '\n\n' + modified;
            }

            // shaderCache.tsからのimport文をクリーンアップ
            modified = cleanupShaderCacheImports(modified);

            // watchShader.tsからのimport文をクリーンアップ
            modified = cleanupWatchShaderImports(modified);

            // HMR関連のコード（subscribeShaders）を削除
            modified = removeHMRCode(modified);

            console.log(
                `[inlineShaderPlugin] Inlined ${importsToAdd.length} shader(s) in ${path.basename(id)}`
            );

            return {
                code: modified,
                map: null,
            };
        },
    };
};

/**
 * HMR関連のコード（subscribeShaders呼び出し）を削除
 */
function removeHMRCode(code: string): string {
    // subscribeShaders(...) ブロック全体を削除
    // 複数行にわたる可能性があるため、行ベースで処理
    const lines = code.split('\n');
    const result: string[] = [];
    let inSubscribeBlock = false;
    let braceDepth = 0;
    let removedCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // subscribeShaders の開始を検出
        if (trimmed.includes('subscribeShaders(')) {
            inSubscribeBlock = true;
            braceDepth = 0;
            removedCount++;
        }

        if (inSubscribeBlock) {
            // 括弧の深さを追跡
            for (const char of line) {
                if (char === '(') braceDepth++;
                if (char === ')') braceDepth--;
            }

            // ブロックの終わりを検出（閉じ括弧とセミコロン）
            if (braceDepth === 0 && trimmed.endsWith(');')) {
                inSubscribeBlock = false;
                // この行もスキップ
                continue;
            }

            // ブロック内の行はスキップ
            continue;
        }

        result.push(line);
    }

    if (removedCount > 0) {
        console.log(`[inlineShaderPlugin] Removed ${removedCount} HMR subscription(s)`);
    }

    return result.join('\n');
}

/**
 * watchShader.tsからのimport文をクリーンアップ
 * subscribeShaders等のHMR関連関数を削除
 */
function cleanupWatchShaderImports(code: string): string {
    // import { ... } from '@/PaleGL/core/watchShader.ts' のパターンを検索
    const importPattern = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]@\/PaleGL\/core\/watchShader\.ts['"];?/g;

    let replacementCount = 0;
    const result = code.replace(importPattern, (_match, importList) => {
        replacementCount++;
        // importリストをカンマで分割してトリム
        const imports = importList
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);

        // subscribeShaders, subscribeSomeChangedShaders を除外
        const filteredImports = imports.filter(
            (item: string) => !item.includes('subscribe')
        );

        // 残ったimportがない場合は、import文全体を削除
        if (filteredImports.length === 0) {
            return '';
        }

        // 残ったimportで再構築
        return `import { ${filteredImports.join(', ')} } from '@/PaleGL/core/watchShader.ts';`;
    });

    if (replacementCount > 0) {
        console.log(`[inlineShaderPlugin] Cleaned ${replacementCount} watchShader import(s)`);
    }

    return result;
}

/**
 * shaderCache.tsからのimport文をクリーンアップ
 * getShaderCache, getShaderPathを削除し、定数だけを残す
 */
function cleanupShaderCacheImports(code: string): string {
    // import { ... } from './shaderCache.ts' のパターンを検索
    const importPattern = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]\.\/shaderCache\.ts['"];?/g;

    let replacementCount = 0;
    const result = code.replace(importPattern, (_match, importList) => {
        replacementCount++;
        // importリストをカンマで分割してトリム
        const imports = importList
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);

        // getShaderCache, getShaderPath を除外
        const filteredImports = imports.filter(
            (item: string) => !item.includes('getShaderCache') && !item.includes('getShaderPath')
        );

        // 残ったimportがない場合は、import文全体を削除
        if (filteredImports.length === 0) {
            return '';
        }

        // 残ったimportで再構築
        return `import { ${filteredImports.join(', ')} } from './shaderCache.ts';`;
    });

    if (replacementCount > 0) {
        console.log(`[inlineShaderPlugin] Cleaned ${replacementCount} shaderCache import(s)`);
    }

    return result;
}

/**
 * 最後のimport文の終了位置を見つける
 * 複数行にわたるimport文にも対応
 */
function findLastImportIndex(code: string): number {
    const lines = code.split('\n');
    let lastImportEndLine = -1;
    let inImport = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // import文の開始を検出
        if (line.startsWith('import ') || line.startsWith('import{') || line.startsWith('import {')) {
            inImport = true;
        }

        // import文の中にいる場合
        if (inImport) {
            // セミコロンで終わっていればimport文の終わり
            if (line.endsWith(';')) {
                lastImportEndLine = i;
                inImport = false;
            }
        }

        // import文の後に空行やコメント以外が来たら終了
        if (lastImportEndLine !== -1 && !inImport && line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
            break;
        }
    }

    if (lastImportEndLine === -1) {
        return -1;
    }

    // 最後のimport行の終了位置（改行含む）を返す
    const position = lines.slice(0, lastImportEndLine + 1).join('\n').length;
    return position;
}
