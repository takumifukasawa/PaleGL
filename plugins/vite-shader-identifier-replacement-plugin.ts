import { Plugin } from 'vite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

export interface ShaderIdentifierReplacementOptions {
    includeUniforms?: boolean;
    includeVaryings?: boolean;
    includeAttributes?: boolean;
    includeStructs?: boolean;
    includeFunctions?: boolean;
    includeOutputs?: boolean;
    includeStructMembers?: boolean;
    structMemberIncludePattern?: RegExp;
    structMemberExcludePattern?: RegExp;
    verbose?: boolean;
}

interface IdentifierInfo {
    name: string;
    type: 'uniform' | 'varying' | 'attribute' | 'struct' | 'struct-member' | 'function' | 'output';
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
        includeStructs = false,
        includeFunctions = false,
        includeOutputs = false,
        includeStructMembers = false,
        structMemberIncludePattern,
        structMemberExcludePattern,
        verbose = false,
    } = options;

    const identifierMap = new Map<string, string>(); // 元の名前 → 短縮名
    const existingIdentifiers = new Set<string>(); // 既存の識別子（衝突回避用）

    return {
        name: 'shader-identifier-replacement',
        // enforceを指定しない（デフォルトのタイミングで実行）
        // transform()はnormalタイミングで実行され、HMR時も正しく動作する

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
                    // GLSL定義から検出（念のため残す）
                    const attributesFromGLSL = collectIdentifiers(allContent, /\b(?:attribute|in)\s+\w+\s+(a[A-Z]\w+)\b/g, 'attribute');

                    // TypeScript文字列リテラルから検出
                    const attributesFromStrings = collectIdentifiers(allContent, /['"`](a[A-Z]\w+)['"`]/g, 'attribute');

                    // 重複を除いてマージ
                    const attributeMap = new Map<string, IdentifierInfo>();
                    for (const attr of [...attributesFromGLSL, ...attributesFromStrings]) {
                        if (attributeMap.has(attr.name)) {
                            // 既存のcountに加算
                            const existing = attributeMap.get(attr.name)!;
                            existing.count += attr.count;
                            existing.savings = existing.count * (existing.length - 2);
                        } else {
                            attributeMap.set(attr.name, attr);
                        }
                    }
                    const attributes = Array.from(attributeMap.values());

                    identifiers.push(...attributes);
                    console.log(`[shader-identifier] Found ${attributes.length} attributes (${attributesFromGLSL.length} from GLSL, ${attributesFromStrings.length} from strings)`);
                }

                if (includeStructs) {
                    const structs = collectIdentifiers(allContent, /struct\s+(s[A-Z]\w+)/g, 'struct');
                    identifiers.push(...structs);
                    console.log(`[shader-identifier] Found ${structs.length} structs`);
                }

                if (includeFunctions) {
                    // 組み込み型とカスタム構造体（s[A-Z]\w+）を返す関数を検出
                    const functions = collectIdentifiers(allContent, /\b(?:float|vec2|vec3|vec4|mat2|mat3|mat4|int|bool|void|s[A-Z]\w+)\s+(f[A-Z]\w+)\s*\(/g, 'function');
                    identifiers.push(...functions);
                    console.log(`[shader-identifier] Found ${functions.length} functions`);
                }

                if (includeStructMembers) {
                    const structMembers = collectStructMembers(
                        allContent,
                        structMemberIncludePattern,
                        structMemberExcludePattern
                    );
                    identifiers.push(...structMembers);
                    console.log(`[shader-identifier] Found ${structMembers.length} struct members`);
                }

                if (includeOutputs) {
                    // GLSL output変数を検出（layout (location = N) out 型 out[A-Z]\w+）
                    const outputs = collectIdentifiers(allContent, /layout\s*\([^)]*\)\s*out\s+\w+\s+(out[A-Z]\w+)/g, 'output');
                    identifiers.push(...outputs);
                    console.log(`[shader-identifier] Found ${outputs.length} output variables`);
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
            } catch (error) {
                console.error('[shader-identifier] Error during buildStart:', error);
            }
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
    type: 'uniform' | 'varying' | 'attribute' | 'struct' | 'function' | 'output'
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
 * struct メンバー変数を収集してカウント
 *
 * @param content GLSLコード
 * @param includePattern 対象とするメンバー名パターン（例: /^sp[A-Z]/ で spXxx のみ対象）
 * @param excludePattern 除外するメンバー名パターン
 */
function collectStructMembers(
    content: string,
    includePattern?: RegExp,
    excludePattern?: RegExp
): IdentifierInfo[] {
    const counts = new Map<string, number>();

    // GLSL組み込み関数・キーワードを除外（これらは置換してはいけない）
    const glslBuiltins = new Set([
        // 組み込み関数
        'distance', 'dot', 'cross', 'normalize', 'length', 'reflect', 'refract',
        'min', 'max', 'clamp', 'mix', 'step', 'smoothstep',
        'abs', 'sign', 'floor', 'ceil', 'fract', 'mod',
        'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
        'pow', 'exp', 'log', 'exp2', 'log2', 'sqrt', 'inversesqrt',
        'texture', 'textureLod', 'textureProj', 'textureGrad',
        // 型名
        'float', 'vec2', 'vec3', 'vec4', 'mat2', 'mat3', 'mat4',
        'int', 'ivec2', 'ivec3', 'ivec4', 'uint', 'uvec2', 'uvec3', 'uvec4',
        'bool', 'bvec2', 'bvec3', 'bvec4',
        'sampler2D', 'samplerCube', 'sampler3D',
        // キーワード
        'const', 'uniform', 'in', 'out', 'inout', 'attribute', 'varying',
    ]);

    // struct 定義全体を検出（struct sXxx { ... }）
    const structPattern = /struct\s+\w+\s*\{([^}]+)\}/gs;
    const structMatches = content.matchAll(structPattern);

    for (const structMatch of structMatches) {
        const structBody = structMatch[1];

        // struct内のメンバー変数を抽出（型 名前; または 型 名前[サイズ]; の形式）
        // samplerCube cubeMap; float diffuseIntensity; など
        const memberPattern = /\s+\w+\s+(\w+)(?:\[[^\]]*\])?\s*;/g;
        const memberMatches = structBody.matchAll(memberPattern);

        for (const memberMatch of memberMatches) {
            const memberName = memberMatch[1];

            // GLSLビルトインは除外
            if (glslBuiltins.has(memberName)) {
                continue;
            }

            // include/exclude pattern でフィルタリング
            if (includePattern && !includePattern.test(memberName)) {
                continue;
            }
            if (excludePattern && excludePattern.test(memberName)) {
                continue;
            }

            counts.set(memberName, (counts.get(memberName) || 0) + 1);
        }
    }

    return Array.from(counts.entries()).map(([name, count]) => ({
        name,
        type: 'struct-member' as const,
        count,
        length: name.length,
        savings: count * (name.length - 2), // 最短2文字（m1, m2など）と仮定
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
    let sIndex = 1;
    let mIndex = 1; // struct member用
    let fIndex = 1;
    let oIndex = 1; // output変数用

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
        } else if (info.type === 'attribute') {
            index = aIndex;
            do {
                candidate = `a${index++}`;
            } while (existing.has(candidate));
            aIndex = index;
        } else if (info.type === 'struct') {
            index = sIndex;
            do {
                candidate = `s${index++}`;
            } while (existing.has(candidate));
            sIndex = index;
        } else if (info.type === 'struct-member') {
            index = mIndex;
            do {
                candidate = `m${index++}`;
            } while (existing.has(candidate));
            mIndex = index;
        } else if (info.type === 'output') {
            index = oIndex;
            do {
                candidate = `o${index++}`;
            } while (existing.has(candidate));
            oIndex = index;
        } else if (info.type === 'function') {
            index = fIndex;
            do {
                candidate = `f${index++}`;
            } while (existing.has(candidate));
            fIndex = index;
        } else {
            throw new Error(`Unknown identifier type: ${info.type}`);
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

    // #includeディレクティブを一時的に保護
    const includePattern = /#include\s*[<"]([^>"]+)[>"]/g;
    const includes: string[] = [];
    const includeMarker = '___INCLUDE_MARKER_';

    result = result.replace(includePattern, (match) => {
        const index = includes.length;
        includes.push(match);
        return `${includeMarker}${index}___`;
    });

    // 長い名前から順に置換（部分一致を避けるため）
    const sortedEntries = Array.from(map.entries()).sort((a, b) => b[0].length - a[0].length);

    for (const [oldName, newName] of sortedEntries) {
        // word boundaryを使って正確にマッチ
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        result = result.replace(regex, newName);
    }

    // #includeディレクティブを復元
    result = result.replace(new RegExp(`${includeMarker}(\\d+)___`, 'g'), (_, index) => {
        return includes[parseInt(index)];
    });

    return result;
}

/**
 * TypeScript/JavaScriptファイル内の文字列リテラルを置換
 *
 * NOTE: TypeScriptのプロパティアクセス（例: skybox.specularIntensity）は置換しません。
 * これらはterserによって自動的にマングルされるため、プラグインで触る必要はありません。
 */
function replaceInTypeScript(code: string, map: Map<string, string>): string {
    let result = code;

    // 長い名前から順に置換
    const sortedEntries = Array.from(map.entries()).sort((a, b) => b[0].length - a[0].length);

    // 1. 文字列リテラルのみを置換（単一の識別子が引用符で囲まれている場合）
    for (const [oldName, newName] of sortedEntries) {
        const singleQuoteRegex = new RegExp(`'${oldName}'`, 'g');
        const doubleQuoteRegex = new RegExp(`"${oldName}"`, 'g');
        const backQuoteRegex = new RegExp(`\`${oldName}\``, 'g');

        result = result.replace(singleQuoteRegex, `'${newName}'`);
        result = result.replace(doubleQuoteRegex, `"${newName}"`);
        result = result.replace(backQuoteRegex, `\`${newName}\``);
    }

    // 2. テンプレートリテラル内のGLSLコードを置換
    // バッククォートで囲まれた複数行文字列（GLSLコード）を検出して置換
    const templateLiteralRegex = /`([^`]*)`/gs;
    result = result.replace(templateLiteralRegex, (match, content) => {
        // GLSLコードっぽいかどうかを判定
        if (
            content.includes('uniform') ||
            content.includes('vec') ||
            content.includes('float') ||
            content.includes('sampler') ||
            content.includes('out ') ||
            content.includes('in ') ||
            content.includes('varying') ||
            content.includes('attribute')
        ) {
            let replacedContent = content;

            // 式補間 ${...} の部分を一時的に保護
            const placeholders = new Map<string, string>();
            let placeholderIndex = 0;
            replacedContent = replacedContent.replace(/\$\{[^}]+\}/g, (expr: string) => {
                const placeholder = `__PLACEHOLDER_${placeholderIndex++}__`;
                placeholders.set(placeholder, expr);
                return placeholder;
            });

            // 単語境界で置換（GLSLコードとして扱う）
            for (const [oldName, newName] of sortedEntries) {
                // 正規表現の特殊文字をエスケープ
                const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escapedOldName}\\b`, 'g');
                replacedContent = replacedContent.replace(regex, newName);
            }

            // プレースホルダーを元に戻す
            for (const [placeholder, expr] of placeholders) {
                replacedContent = replacedContent.replace(placeholder, expr);
            }

            return `\`${replacedContent}\``;
        }
        return match;
    });

    return result;
}
