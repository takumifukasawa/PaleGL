import { Plugin } from 'vite';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface PartialGlslMinifierPluginOptions {
    targetDirs?: string[];
    verbose?: boolean;
}

interface VariableInfo {
    name: string;
    count: number;
    length: number;
    savings: number;
}

/**
 * Partial GLSL Minifier Plugin
 *
 * 指定されたディレクトリ配下のmain関数を持たないpartial GLSLファイルの
 * ローカル変数と関数引数を短縮し、ビルドサイズを削減する。
 */
export const partialGlslMinifierPlugin = (
    options: PartialGlslMinifierPluginOptions = {}
): Plugin => {
    const {
        targetDirs = ['src/pages/shaders'],
        verbose = false,
    } = options;

    const variableMap = new Map<string, string>(); // 元の名前 → 短縮名

    return {
        name: 'partial-glsl-minifier',

        transform(code: string, id: string) {
            // 対象ディレクトリのGLSLファイルのみ処理
            if (!id.endsWith('.glsl') || !targetDirs.some(dir => id.includes(dir))) {
                return null;
            }

            // vite-plugin-glslの出力形式を解析
            // eslint-disable-next-line no-useless-escape
            const contentRegex = /^var\s([a-zA-Z_]*)_default\s?\=\s?\"(.*)\"/;
            const bundledContent = code.split('\n').join(' ').match(contentRegex);

            if (!bundledContent) {
                return null;
            }

            let [, , glslContent] = bundledContent;

            // エスケープを元に戻す
            glslContent = glslContent.replaceAll('\\n', '\n');
            glslContent = glslContent.replaceAll('\\r', '\n');

            // main関数があるファイルは除外（shader-minifierで処理される）
            const entryPointRegex = /void main\(/;
            const isEntryPoint = entryPointRegex.test(glslContent);

            if (isEntryPoint) {
                if (verbose) {
                    console.log(`[partial-glsl-minifier] Skipping entry point: ${path.basename(id)}`);
                }
                return null;
            }

            if (verbose) {
                console.log(`[partial-glsl-minifier] Processing: ${path.basename(id)}`);
            }

            // ファイルごとにマッピングをリセット
            variableMap.clear();

            // 変数を収集
            const variables = collectVariables(glslContent, verbose);

            if (variables.length === 0) {
                if (verbose) {
                    console.log(`[partial-glsl-minifier] No variables found in ${path.basename(id)}`);
                }
                return null;
            }

            // マッピング生成
            generateMappings(variables, variableMap, verbose);

            if (variableMap.size === 0) {
                return null;
            }

            // 変数を置換
            const minifiedContent = replaceVariables(glslContent, variableMap);

            if (minifiedContent === glslContent) {
                return null;
            }

            // デバッグ情報を保存
            if (verbose) {
                const variableList = variables.map(v => ({
                    name: v.name,
                    count: v.count,
                    savings: v.savings,
                    newName: variableMap.get(v.name),
                }));

                const tmpDir = path.join(process.cwd(), 'tmp');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                const filename = path.basename(id, '.glsl');
                fs.writeFileSync(
                    path.join(tmpDir, `partial-glsl-minifier-${filename}.json`),
                    JSON.stringify(variableList, null, 2)
                );

                console.log(`[partial-glsl-minifier] Saved variable list for ${filename} (${variableList.length} variables)`);
            }

            // eslint-disable-next-line no-useless-escape
            const resultContent = `export default \`${minifiedContent}\``;

            if (verbose) {
                const originalSize = glslContent.length;
                const minifiedSize = minifiedContent.length;
                const savings = originalSize - minifiedSize;
                console.log(`[partial-glsl-minifier] ${path.basename(id)}: ${originalSize} → ${minifiedSize} bytes (-${savings} bytes)`);
            }

            return {
                code: resultContent,
            };
        },
    };
};

/**
 * ローカル変数と関数引数を収集
 */
function collectVariables(content: string, verbose: boolean = false): VariableInfo[] {
    const counts = new Map<string, number>();
    const excludePatterns = [
        // uniform/varying/attribute/struct/function
        /^u[A-Z]/,
        /^v[A-Z]/,
        /^a[A-Z]/,
        /^s[A-Z]/,
        /^f[A-Z]/,
        // 既に短い変数
        /^[a-zA-Z_]$/,
        /^[a-zA-Z_][0-9]$/,
    ];

    // struct内の変数名を収集（除外用）
    const structFieldNames = new Set<string>();
    const structPattern = /struct\s+\w+\s*\{([^}]*)\}/g;
    const structMatches = content.matchAll(structPattern);
    for (const match of structMatches) {
        const structBody = match[1];
        const fieldPattern = /\b(sampler2D|samplerCube|vec3|vec2|vec4|mat2|mat3|mat4|float|int|bool|s[A-Z0-9]\w*)\s+([a-zA-Z_]\w+)/g;
        const fieldMatches = structBody.matchAll(fieldPattern);
        for (const fieldMatch of fieldMatches) {
            const fieldName = fieldMatch[2];
            structFieldNames.add(fieldName);
        }
    }

    // 関数名を収集（除外用）
    const functionNames = new Set<string>();
    const functionDefPattern = /\b(sampler2D|samplerCube|vec3|vec2|vec4|mat2|mat3|mat4|float|int|bool|void|s[A-Z0-9]\w*)\s+([a-zA-Z_]\w+)\s*\(/g;
    const functionDefMatches = content.matchAll(functionDefPattern);
    for (const match of functionDefMatches) {
        const functionName = match[2];
        functionNames.add(functionName);
    }

    // 関数本体を抽出（グローバル変数を除外するため）
    let functionBodiesContent = '';
    const functionBodyPattern = /\b(sampler2D|samplerCube|vec3|vec2|vec4|mat2|mat3|mat4|float|int|bool|void|s[A-Z0-9]\w*)\s+([a-zA-Z_]\w+)\s*\([^)]*\)\s*\{/g;

    // 各関数の開始位置を見つける
    const functionStarts: { index: number, matchLength: number }[] = [];
    for (const match of content.matchAll(functionBodyPattern)) {
        functionStarts.push({ index: match.index!, matchLength: match[0].length });
    }

    // 各関数の本体を抽出（波括弧のネストを考慮）
    for (const { index, matchLength } of functionStarts) {
        const startBracePos = index + matchLength - 1; // '{' の位置
        let braceCount = 1;
        let endBracePos = startBracePos + 1;

        while (endBracePos < content.length && braceCount > 0) {
            if (content[endBracePos] === '{') braceCount++;
            if (content[endBracePos] === '}') braceCount--;
            endBracePos++;
        }

        if (braceCount === 0) {
            const bodyContent = content.substring(startBracePos + 1, endBracePos - 1);
            functionBodiesContent += '\n' + bodyContent;
        }
    }

    // 関数本体内のローカル変数を検出
    const localVarPattern = /\b(sampler2D|samplerCube|vec3|vec2|vec4|mat2|mat3|mat4|float|int|bool|s[A-Z0-9]\w*)\s+([a-zA-Z_]\w+)\b/g;
    const localVarMatches = functionBodiesContent.matchAll(localVarPattern);

    for (const match of localVarMatches) {
        const name = match[2];

        // struct内の変数名は除外
        if (structFieldNames.has(name)) {
            continue;
        }

        // 関数名は除外
        if (functionNames.has(name)) {
            continue;
        }

        // 除外パターンに該当するかチェック
        if (excludePatterns.some(pattern => pattern.test(name))) {
            continue;
        }

        // 変数の出現回数をカウント（元のcontent全体から）
        const varRegex = new RegExp(`\\b${name}\\b`, 'g');
        const allMatches = content.match(varRegex);
        const count = allMatches ? allMatches.length : 0;

        counts.set(name, count);
    }

    // 関数引数の検出
    const functionPattern = /\b(sampler2D|samplerCube|vec3|vec2|vec4|mat2|mat3|mat4|float|int|bool|void|s[A-Z0-9]\w*)\s+([a-zA-Z_]\w+)\s*\(([^)]*)\)/g;
    const functionMatchesArray = Array.from(content.matchAll(functionPattern));


    for (const match of functionMatchesArray) {
        const params = match[3]; // 関数名のキャプチャグループが追加されたため3番目
        if (!params || params.trim() === '') continue;

        // パラメータを分割して各引数名を抽出
        const paramList = params.split(',');
        for (const param of paramList) {
            const trimmed = param.trim();
            // "vec3 pSpine2" から "pSpine2" を抽出
            const paramMatch = trimmed.match(/\b(sampler2D|samplerCube|vec3|vec2|vec4|mat2|mat3|mat4|float|int|bool|s[A-Z0-9]\w*)\s+([a-zA-Z_]\w+)\b/);
            if (paramMatch) {
                const name = paramMatch[2];

                // struct内の変数名は除外
                if (structFieldNames.has(name)) {
                    continue;
                }

                // 除外パターンに該当するかチェック
                if (excludePatterns.some(pattern => pattern.test(name))) {
                    continue;
                }

                // 変数の出現回数をカウント
                const varRegex = new RegExp(`\\b${name}\\b`, 'g');
                const allMatches = content.match(varRegex);
                const count = allMatches ? allMatches.length : 0;

                // 既にカウント済みでなければ追加
                if (!counts.has(name)) {
                    counts.set(name, count);
                }
            }
        }
    }

    return Array.from(counts.entries()).map(([name, count]) => ({
        name,
        count,
        length: name.length,
        savings: count * (name.length - 2), // 最短2文字（p1, d1など）と仮定
    }));
}

/**
 * マッピングを生成（衝突回避、削減効果の高い順）
 */
function generateMappings(
    variables: VariableInfo[],
    map: Map<string, string>,
    verbose: boolean
): void {
    // 削減効果の高い順にソート
    variables.sort((a, b) => b.savings - a.savings || b.length - a.length);

    // 既存の短い識別子を収集（衝突回避用）
    const existingIdentifiers = new Set<string>();
    const commonVars = ['p', 'd', 'v', 's', 'e', 'i', 'j', 'k', 'n', 'r', 'a', 'o', 'c', 't', 'm', 'f', 'g', 'h', 'x', 'y', 'z'];
    commonVars.forEach(v => existingIdentifiers.add(v));

    let pIndex = 1; // position系
    let dIndex = 1; // distance系
    let tIndex = 1; // その他変数（vはvaryingと衝突するため使用しない）
    let sIndex = 1; // scale系
    let eIndex = 1; // envelope系

    for (const info of variables) {
        const name = info.name;
        let candidate: string;

        // プレフィックスで分類
        if (name.startsWith('p') && name.length > 1) {
            // position系
            do {
                candidate = `p${pIndex++}`;
            } while (existingIdentifiers.has(candidate));
        } else if (name.startsWith('d') && name.length > 1) {
            // distance系
            do {
                candidate = `d${dIndex++}`;
            } while (existingIdentifiers.has(candidate));
        } else if (name.includes('Scale') || name.includes('scale')) {
            // scale系
            do {
                candidate = `s${sIndex++}`;
            } while (existingIdentifiers.has(candidate));
        } else if (name.includes('Env') || name.includes('env')) {
            // envelope系
            do {
                candidate = `e${eIndex++}`;
            } while (existingIdentifiers.has(candidate));
        } else {
            // その他（vはvaryingと衝突するためtを使用）
            do {
                candidate = `t${tIndex++}`;
            } while (existingIdentifiers.has(candidate));
        }

        map.set(name, candidate);
        existingIdentifiers.add(candidate);

        if (verbose && info.savings >= 10) {
            console.log(`  ${name} → ${candidate} (${info.count}x, ${info.savings} bytes)`);
        }
    }
}

/**
 * 変数を置換
 */
function replaceVariables(code: string, map: Map<string, string>): string {
    let result = code;

    // 長い名前から順に置換（部分一致を避けるため）
    const sortedEntries = Array.from(map.entries()).sort((a, b) => b[0].length - a[0].length);

    for (const [oldName, newName] of sortedEntries) {
        // word boundaryを使って正確にマッチ
        // ただし、ドット（.）の直後は除外（メンバーアクセス/swizzle演算子）
        const regex = new RegExp(`(?<!\\.)\\b${oldName}\\b`, 'g');
        result = result.replace(regex, newName);
    }

    return result;
}
