import { Plugin } from 'vite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

export interface ShaderIdentifierReplacementOptions {
    includeUniforms?: boolean;
    includeVaryings?: boolean;
    includeAttributes?: boolean;
    verbose?: boolean;
}

interface IdentifierInfo {
    name: string;
    type: 'uniform' | 'varying' | 'attribute';
    count: number;
    length: number;
    savings: number;
}

/**
 * Shader Identifier Replacement Plugin
 *
 * GLSLファイル内のuniform/varying/attribute名を短縮し、
 * TypeScript/JavaScriptファイル内の文字列リテラルも同期して置換します。
 *
 * 処理フロー:
 * 1. buildStart: 全GLSLファイルを走査して識別子を収集＆マッピング生成、置換済みGLSLをキャッシュ
 * 2. load: GLSLファイル読み込み時に置換済みコードを返す（vite-plugin-glslより前に実行）
 * 3. transform: TS/JSファイル内の文字列リテラルを置換
 */
export const shaderIdentifierReplacementPlugin = (
    options: ShaderIdentifierReplacementOptions = {}
): Plugin => {
    const {
        includeUniforms = true,
        includeVaryings = false,
        includeAttributes = false,
        verbose = false,
    } = options;

    const identifierMap = new Map<string, string>(); // 元の名前 → 短縮名
    const existingIdentifiers = new Set<string>(); // 既存の識別子（衝突回避用）
    const glslFileCache = new Map<string, string>(); // GLSLファイルの置換済みコードキャッシュ

    return {
        name: 'shader-identifier-replacement',
        // enforceを指定しない（デフォルトのタイミングで実行）
        // load()はpreで実行、transform()はnormalタイミングで実行される

        async buildStart() {
            console.log('[shader-identifier] Starting identifier collection...');

            try {
                // 全GLSLファイルのパスを取得（PaleGLとsrc/pages両方）
                const glslFiles = await glob('{PaleGL/src,src}/**/*.glsl', {
                    cwd: process.cwd(),
                    absolute: true,
                });

                // TypeScriptファイルも取得（シェーダーソースが直接埋め込まれている可能性）
                const tsFiles = await glob('{PaleGL/src,src}/**/*.ts', {
                    cwd: process.cwd(),
                    absolute: true,
                });

                console.log(`[shader-identifier] Found ${glslFiles.length} GLSL files`);
                console.log(`[shader-identifier] Found ${tsFiles.length} TypeScript files`);

                // 既存の識別子を収集（衝突回避用）
                const allContent = [...glslFiles, ...tsFiles]
                    .map((file) => fs.readFileSync(file, 'utf-8'))
                    .join('\n');

                collectExistingIdentifiers(allContent, existingIdentifiers);
                console.log(`[shader-identifier] Collected ${existingIdentifiers.size} existing identifiers`);

                // uniform/varying/attributeを収集
                const identifiers: IdentifierInfo[] = [];

                if (includeUniforms) {
                    // 通常のuniform宣言（uniform 型 名前 および uniform 型[サイズ] 名前 の両方に対応）
                    const uniforms = collectIdentifiers(allContent, /\buniform\s+\w+(?:\[[^\]]*\])?\s+(u[A-Z]\w+)\b/g, 'uniform');
                    identifiers.push(...uniforms);
                    console.log(`[shader-identifier] Found ${uniforms.length} regular uniforms`);

                    // UBO内のuniform
                    const uboUniforms = collectUBOIdentifiers(allContent);
                    identifiers.push(...uboUniforms);
                    console.log(`[shader-identifier] Found ${uboUniforms.length} UBO uniforms`);

                    console.log(`[shader-identifier] Total uniforms: ${uniforms.length + uboUniforms.length}`);
                }

                if (includeVaryings) {
                    const varyings = collectIdentifiers(allContent, /\b(?:varying|in|out)\s+\w+\s+(v[A-Z]\w+)\b/g, 'varying');
                    identifiers.push(...varyings);
                    console.log(`[shader-identifier] Found ${varyings.length} varyings`);
                }

                if (includeAttributes) {
                    const attributes = collectIdentifiers(allContent, /\b(?:attribute|in)\s+\w+\s+(a[A-Z]\w+)\b/g, 'attribute');
                    identifiers.push(...attributes);
                    console.log(`[shader-identifier] Found ${attributes.length} attributes`);
                }

                // 優先順位付け（削減効果の高い順）
                identifiers.sort((a, b) => b.savings - a.savings || b.length - a.length);

                // マッピング生成（衝突回避）
                generateMappings(identifiers, identifierMap, existingIdentifiers, verbose);

                console.log(`[shader-identifier] Generated ${identifierMap.size} mappings`);

                if (verbose && identifierMap.size > 0) {
                    const totalSavings = Array.from(identifierMap.entries()).reduce((sum, [oldName]) => {
                        const info = identifiers.find(i => i.name === oldName);
                        return sum + (info?.savings || 0);
                    }, 0);
                    console.log(`[shader-identifier] Estimated savings: ${totalSavings} bytes`);
                }

                // デバッグ: 検出したuniformリストをファイルに保存
                const uniformList = identifiers
                    .filter(i => i.type === 'uniform')
                    .map(i => ({
                        name: i.name,
                        count: i.count,
                        savings: i.savings,
                        newName: identifierMap.get(i.name)
                    }));
                const tmpDir = path.join(process.cwd(), 'tmp');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }
                fs.writeFileSync(
                    path.join(tmpDir, 'vite-plugin-uniforms.json'),
                    JSON.stringify(uniformList, null, 2)
                );
                console.log(`[shader-identifier] Saved uniform list to tmp/vite-plugin-uniforms.json (${uniformList.length} uniforms)`);


                // 各GLSLファイルの置換済みコードをキャッシュに保存
                if (identifierMap.size > 0) {
                    console.log('[shader-identifier] Caching replaced GLSL files...');
                    for (const file of glslFiles) {
                        const originalContent = fs.readFileSync(file, 'utf-8');
                        const replacedContent = replaceInGlsl(originalContent, identifierMap);
                        glslFileCache.set(file, replacedContent);

                        if (verbose && originalContent !== replacedContent) {
                            console.log(`[shader-identifier] Cached ${path.basename(file)}`);
                        }
                    }
                    console.log(`[shader-identifier] Cached ${glslFileCache.size} GLSL files`);
                }
            } catch (error) {
                console.error('[shader-identifier] Error during buildStart:', error);
            }
        },

        load(id: string) {
            // GLSLファイルの読み込み時に置換済みコードを返す
            // これによりvite-plugin-glslには置換済みのGLSLが渡される
            if (id.endsWith('.glsl')) {
                const normalizedId = path.resolve(id);

                if (glslFileCache.has(normalizedId)) {
                    const replacedCode = glslFileCache.get(normalizedId);

                    // デバッグ: 特定のファイルの置換内容を確認
                    if (id.includes('gbuffer-vertex.glsl')) {
                        const originalCode = fs.readFileSync(normalizedId, 'utf-8');
                        console.log('\n=== gbuffer-vertex.glsl DEBUG ===');
                        console.log('Original uniforms:', originalCode.match(/uniform\s+\w+\s+u[A-Z]\w+/g)?.slice(0, 5));
                        console.log('Replaced uniforms:', replacedCode?.match(/uniform\s+\w+\s+u\d+/g)?.slice(0, 5));
                        console.log('=================================\n');
                    }

                    if (verbose) {
                        console.log(`[shader-identifier] Returning replaced GLSL: ${path.basename(id)}`);
                    }
                    return replacedCode;
                }
            }

            return null; // 他のプラグインに処理を委譲
        },

        transform(code: string, id: string) {
            if (identifierMap.size === 0) {
                return null;
            }

            // GLSLファイル: vite-plugin-glslが#includeを処理した後に置換
            if (id.endsWith('.glsl')) {
                const result = replaceInGlsl(code, identifierMap);
                if (result !== code) {
                    if (verbose) {
                        console.log(`[shader-identifier] Replaced uniforms in GLSL (transform): ${path.basename(id)}`);
                    }
                    return { code: result, map: null };
                }
                return null;
            }

            // TypeScript/JavaScriptファイル: 文字列リテラルのみ置換
            if (id.endsWith('.ts') || id.endsWith('.js')) {
                const result = replaceInTypeScript(code, identifierMap);
                if (result !== code) {
                    if (verbose) {
                        console.log(`[shader-identifier] Replaced string literals in ${path.basename(id)}`);
                    }
                    return { code: result, map: null };
                }
                return null;
            }

            return null;
        },
    };
};

/**
 * 既存の識別子を収集（衝突回避用）
 */
function collectExistingIdentifiers(content: string, existing: Set<string>): void {
    // よくあるローカル変数名
    const commonVars = ['u', 'v', 't', 'i', 'n', 'r', 'a', 'o', 's', 'c', 'p', 'd', 'm', 'f', 'g', 'h', 'x', 'y', 'z'];
    commonVars.forEach(v => existing.add(v));

    // 1-2文字の変数を収集
    const shortVarPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]?)\b/g;
    const matches = content.matchAll(shortVarPattern);
    for (const match of matches) {
        const name = match[1];
        if (name.length <= 2) {
            existing.add(name);
        }
    }
}

/**
 * 識別子を収集してカウント
 */
function collectIdentifiers(
    content: string,
    pattern: RegExp,
    type: 'uniform' | 'varying' | 'attribute'
): IdentifierInfo[] {
    const counts = new Map<string, number>();
    const matches = content.matchAll(pattern);

    for (const match of matches) {
        const name = match[1];
        counts.set(name, (counts.get(name) || 0) + 1);
    }

    return Array.from(counts.entries()).map(([name, count]) => ({
        name,
        type,
        count,
        length: name.length,
        savings: count * (name.length - 2), // 最短2文字（u1, v1など）と仮定
    }));
}

/**
 * UBO (Uniform Buffer Object) 内のuniform識別子を収集してカウント
 */
function collectUBOIdentifiers(content: string): IdentifierInfo[] {
    const counts = new Map<string, number>();

    // layout (std140) uniform ブロック全体を検出
    const uboPattern = /layout\s*\([^)]*\)\s*uniform\s+\w+\s*\{([^}]*)\}/gs;
    const uboMatches = content.matchAll(uboPattern);

    for (const uboMatch of uboMatches) {
        const blockContent = uboMatch[1];

        // ブロック内のuniform変数を抽出（型 名前; または 型 名前[サイズ]; の形式）
        const uboVarPattern = /\s+(\w+)\s+(u[A-Z]\w+)(?:\[[^\]]*\])?\s*;/g;
        const varMatches = blockContent.matchAll(uboVarPattern);

        for (const varMatch of varMatches) {
            const name = varMatch[2];
            counts.set(name, (counts.get(name) || 0) + 1);
        }
    }

    return Array.from(counts.entries()).map(([name, count]) => ({
        name,
        type: 'uniform',
        count,
        length: name.length,
        savings: count * (name.length - 2),
    }));
}

/**
 * マッピングを生成（衝突回避）
 */
function generateMappings(
    identifiers: IdentifierInfo[],
    map: Map<string, string>,
    existing: Set<string>,
    verbose: boolean
): void {
    let uIndex = 1;
    let vIndex = 1;
    let aIndex = 1;

    for (const info of identifiers) {
        let candidate: string;
        let index: number;

        if (info.type === 'uniform') {
            index = uIndex;
            do {
                candidate = `u${index++}`;
            } while (existing.has(candidate));
            uIndex = index;
        } else if (info.type === 'varying') {
            index = vIndex;
            do {
                candidate = `v${index++}`;
            } while (existing.has(candidate));
            vIndex = index;
        } else {
            // attribute
            index = aIndex;
            do {
                candidate = `a${index++}`;
            } while (existing.has(candidate));
            aIndex = index;
        }

        map.set(info.name, candidate);
        existing.add(candidate);

        if (verbose && (info.count >= 2 || info.savings >= 10)) {
            console.log(`  ${info.name} → ${candidate} (${info.count}x, ${info.savings} bytes)`);
        }
    }
}

/**
 * GLSLファイル内の識別子を置換
 */
function replaceInGlsl(code: string, map: Map<string, string>): string {
    let result = code;

    // 長い名前から順に置換（部分一致を避けるため）
    const sortedEntries = Array.from(map.entries()).sort((a, b) => b[0].length - a[0].length);

    for (const [oldName, newName] of sortedEntries) {
        // word boundaryを使って正確にマッチ
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        result = result.replace(regex, newName);
    }

    return result;
}

/**
 * TypeScript/JavaScriptファイル内の文字列リテラルを置換
 */
function replaceInTypeScript(code: string, map: Map<string, string>): string {
    let result = code;

    // 長い名前から順に置換
    const sortedEntries = Array.from(map.entries()).sort((a, b) => b[0].length - a[0].length);

    for (const [oldName, newName] of sortedEntries) {
        // 1. 完全な文字列リテラルとしての置換（安全）
        const singleQuoteRegex = new RegExp(`'${oldName}'`, 'g');
        const doubleQuoteRegex = new RegExp(`"${oldName}"`, 'g');
        const backQuoteRegex = new RegExp(`\`${oldName}\``, 'g');

        result = result.replace(singleQuoteRegex, `'${newName}'`);
        result = result.replace(doubleQuoteRegex, `"${newName}"`);
        result = result.replace(backQuoteRegex, `\`${newName}\``);

        // 2. 文字列内のword boundaryでの置換（シェーダーソース内のuniform名用）
        // uniform名は特殊なパターン（u[A-Z]で始まる）なので比較的安全
        const wordBoundaryRegex = new RegExp(`\\b${oldName}\\b`, 'g');
        result = result.replace(wordBoundaryRegex, newName);
    }

    return result;
}
