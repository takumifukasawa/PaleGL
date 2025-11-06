import { Plugin } from 'vite';
import { readFileSync } from 'fs';
import { optimizeJsonData } from './json-optimizer';
import { JSON_OPTIMIZER_EXCLUDE_KEYS } from './json-optimizer-config';

export type OptimizeJsonPluginOptions = {
    enabled?: boolean;
    enableRound?: boolean;
    precision?: number;
    verbose?: boolean;
    excludeKeys?: string[];
};

// Viteプラグインの定義
// importされるJSONファイル（?raw含む）を最適化（publicディレクトリは対象外）
// - 小数点以下を指定桁数に丸める
// - 整数に変換可能な値（1.0, 0.0など）は整数に変換
export const optimizeJsonPlugin: (options?: OptimizeJsonPluginOptions) => Plugin = (options = {}) => {
    const { enabled = true, enableRound = true, precision = 3, verbose = false, excludeKeys = JSON_OPTIMIZER_EXCLUDE_KEYS } = options;

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
                        excludeKeys,
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
                        excludeKeys,
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
