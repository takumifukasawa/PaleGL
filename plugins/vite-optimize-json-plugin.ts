import { Plugin } from 'vite';
import { readFileSync } from 'fs';
import { optimizeJsonData } from './json-optimizer';

export type OptimizeJsonPluginOptions = {
    enabled?: boolean;
    enableRound?: boolean;
    precision?: number;
    verbose?: boolean;
};

// Viteプラグインの定義
// importされるJSONファイル（?raw含む）を最適化（publicディレクトリは対象外）
// - 小数点以下を指定桁数に丸める
// - 整数に変換可能な値（1.0, 0.0など）は整数に変換
export const optimizeJsonPlugin: (options?: OptimizeJsonPluginOptions) => Plugin = (options = {}) => {
    const { enabled = true, enableRound = true, precision = 3, verbose = false } = options;

    return {
        name: 'vite-plugin-optimize-json',
        enforce: 'pre',
        load(id: string) {
            if (!enabled) return null;

            // ?rawでimportされるJSONファイルを処理（publicディレクトリは除外）
            if (id.includes('.json?raw') && !id.includes('/public/')) {
                console.log(`[optimizeJsonPlugin] load ?raw: ${id}`);
                try {
                    const cleanId = id.replace('?raw', '');
                    const content = readFileSync(cleanId, 'utf-8');
                    const parsed = JSON.parse(content);
                    const optimized = optimizeJsonData({
                        obj: parsed,
                        enableRound,
                        decimalPlaces: precision,
                        filePath: cleanId,
                        currentPath: '',
                        verbose,
                    });
                    const optimizedStr = JSON.stringify(optimized);
                    return `export default ${JSON.stringify(optimizedStr)}`;
                } catch (error) {
                    console.error(`[optimizeJsonPlugin] Failed to process ${id}:`, error);
                    return null;
                }
            }
        },
        transform(code: string, id: string) {
            if (!enabled) return null;

            // 通常のJSONファイルも処理（publicディレクトリは除外）
            if (id.endsWith('.json') && !id.includes('/public/') && !id.includes('?')) {
                console.log(`[optimizeJsonPlugin] transform: ${id}`);
                try {
                    const parsed = JSON.parse(code);
                    const optimized = optimizeJsonData({
                        obj: parsed,
                        enableRound,
                        decimalPlaces: precision,
                        filePath: id,
                        currentPath: '',
                        verbose,
                    });
                    return {
                        code: `export default ${JSON.stringify(optimized)}`,
                        map: null,
                    };
                } catch (error) {
                    console.error(`[optimizeJsonPlugin] Failed to process ${id}:`, error);
                    return null;
                }
            }
        }
    };
};
