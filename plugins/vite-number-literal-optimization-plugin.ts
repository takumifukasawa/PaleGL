import { Plugin } from 'vite';

/**
 * 数値リテラルを最適化するViteプラグイン
 *
 * - 0.0 → 0 に置換
 * - 1.0 → 1 に置換
 *
 * ビルド後のコードサイズを削減します（約2.6KB圧縮前、0.8-1.3KB圧縮後）
 */
export function numberLiteralOptimizationPlugin(): Plugin {
    return {
        name: 'number-literal-optimization',
        enforce: 'post', // ビルド後に実行
        generateBundle(_options, bundle) {
            for (const fileName in bundle) {
                const chunk = bundle[fileName];
                if (chunk.type === 'chunk') {
                    // 0.0 → 0 に置換（単語境界を使って科学的表記を除外）
                    chunk.code = chunk.code.replace(/\b0\.0\b/g, '0');
                    // 1.0 → 1 に置換
                    chunk.code = chunk.code.replace(/\b1\.0\b/g, '1');
                }
            }
        },
    };
}
