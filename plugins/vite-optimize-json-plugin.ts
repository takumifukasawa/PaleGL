import { Plugin } from 'vite';
import { readFileSync } from 'fs';
import { optimizeJsonData } from './json-optimizer';

const PRECISION: number = 3;

// Viteプラグインの定義
// importされるJSONファイル（?raw含む）を最適化（publicディレクトリは対象外）
// - 小数点以下を指定桁数に丸める
// - 整数に変換可能な値（1.0, 0.0など）は整数に変換
export const optimizeJsonPlugin: () => Plugin = () => {
    return {
        name: 'vite-plugin-optimize-json',
        enforce: 'pre',
        load(id: string) {
            // ?rawでimportされるJSONファイルを処理（publicディレクトリは除外）
            if (id.includes('.json?raw') && !id.includes('/public/')) {
                console.log(`[optimizeJsonPlugin] load ?raw: ${id}`);
                try {
                    const cleanId = id.replace('?raw', '');
                    const content = readFileSync(cleanId, 'utf-8');
                    const parsed = JSON.parse(content);
                    const optimized = optimizeJsonData(parsed, PRECISION, cleanId);
                    const optimizedStr = JSON.stringify(optimized);
                    return `export default ${JSON.stringify(optimizedStr)}`;
                } catch (error) {
                    console.error(`[optimizeJsonPlugin] Failed to process ${id}:`, error);
                    return null;
                }
            }
        },
        transform(code: string, id: string) {
            // 通常のJSONファイルも処理（publicディレクトリは除外）
            if (id.endsWith('.json') && !id.includes('/public/') && !id.includes('?')) {
                console.log(`[optimizeJsonPlugin] transform: ${id}`);
                try {
                    const parsed = JSON.parse(code);
                    const optimized = optimizeJsonData(parsed, PRECISION, id);
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
