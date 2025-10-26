import { Plugin } from 'vite';

/**
 * Shader Constants Compression Plugin
 *
 * buildShader.tsで使用されるシェーダー定数とPragmaディレクティブを短縮し、
 * ファイルサイズを削減します。
 *
 * 圧縮対象:
 * 1. シェーダー定数: USE_VERTEX_COLOR → D0, USE_NORMAL_MAP → D1, etc.
 * 2. Pragma: UNROLL_START → P0, UNROLL_END → P1, UNROLL_N → N
 * 3. includesDict キー: 'common' → 'c', 'lighting' → 'l', etc.
 */
export const shaderConstantsCompressionPlugin = (): Plugin => {
    // シェーダー定数のマッピング
    const SHADER_DEFINES_MAP = new Map<string, string>([
        ['USE_RECEIVE_SHADOW', 'D0'],
        ['USE_SKINNING_GPU', 'D1'],
        ['USE_SKINNING_CPU', 'D2'],
        ['USE_NORMAL_MAP', 'D3'],
        ['USE_ENV_MAP', 'D4'],
        ['USE_VERTEX_COLOR', 'D5'],
        ['USE_ALPHA_TEST', 'D6'],
        ['USE_INSTANCING', 'D7'],
        ['USE_INSTANCE_LOOK_DIRECTION', 'D8'],
        ['USE_VAT', 'D9'],
        ['USE_TRAIL', 'DA'],
        ['USE_HEIGHT_MAP', 'DB'],
    ]);

    // Pragmaディレクティブのマッピング
    const PRAGMA_MAP = new Map<string, string>([
        ['UNROLL_START', 'P0'],
        ['UNROLL_END', 'P1'],
        ['UNROLL_N', 'N'],
    ]);

    // includesDict キーのマッピング（頻出順）
    const INCLUDES_MAP = new Map<string, string>([
        ['common', 'c'],
        ['lighting', 'l'],
        ['ub', 'u'],
        ['rand', 'r'],
        ['tone', 't'],
        ['depth', 'd'],
        ['gbuffer', 'g'],
        ['gbuffer_o', 'o'],
        ['etex', 'e'],
        ['raymarch_df', 'rdf'],
        ['raymarch_sf', 'rsf'],
        ['alpha_test', 'at'],
        ['alpha_test_f', 'af'],
        ['shape_font_h', 'sfh'],
        ['shape_font_f', 'sff'],
        ['vcolor_vh', 'vvh'],
        ['vcolor_fh', 'vfh'],
        ['normal_map_fh', 'nmf'],
        ['normal_map_f', 'nf'],
        ['env_map', 'em'],
        ['skybox_h', 'sh'],
        ['geometry_h', 'gh'],
        ['os_raymarch_f', 'orf'],
        ['perlin', 'p'],
        ['buffer_visualizer_h', 'bvh'],
    ]);

    return {
        name: 'shader-constants-compression',
        enforce: 'pre', // buildShader.ts の処理前に実行

        transform(code: string, id: string) {
            let transformedCode = code;
            let modified = false;

            // buildShader.ts の処理
            if (id.includes('buildShader.ts')) {
                // 1. シェーダー定数文字列の置換
                SHADER_DEFINES_MAP.forEach((shortName, longName) => {
                    const regex = new RegExp(`'#define ${longName}'`, 'g');
                    const newCode = transformedCode.replace(regex, `'#define ${shortName}'`);
                    if (newCode !== transformedCode) {
                        transformedCode = newCode;
                        modified = true;
                    }
                });

                // 2. includesDict キーの置換（スキップ - 圧縮効果が小さく、エラーリスクが高い）
                // INCLUDES_MAP.forEach(...)

                // 3. transformUnroll 関数内の pragma 文字列を置換（スキップ - buildShader.tsとの競合を避けるため）
                // PRAGMA_MAP.forEach(...)
            }

            // GLSLファイルの処理
            if (id.endsWith('.glsl')) {
                // 1. #define の置換
                SHADER_DEFINES_MAP.forEach((shortName, longName) => {
                    const regex = new RegExp(`#ifdef\\s+${longName}\\b`, 'g');
                    const newCode = transformedCode.replace(regex, `#ifdef ${shortName}`);
                    if (newCode !== transformedCode) {
                        transformedCode = newCode;
                        modified = true;
                    }
                });

                // 2. #pragma の置換（スキップ - buildShader.tsとの競合を避けるため）
                // PRAGMA_MAP.forEach(...)

                // 3. #include キーの置換（スキップ - 圧縮効果が小さく、エラーリスクが高い）
                // INCLUDES_MAP.forEach(...)
            }

            if (modified) {
                return {
                    code: transformedCode,
                    map: null,
                };
            }

            return null;
        },
    };
};
