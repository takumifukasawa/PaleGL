import { Plugin } from 'vite';
import { readFileSync } from 'fs';
import { optimizeJsonData } from './json-optimizer';

const PRECISION: number = 3;

// Viteプラグインの定義
// importされるJSONファイル（?raw含む）を変換（publicディレクトリは対象外）
export const roundFloatPlugin: () => Plugin = () => {
    return {
        name: 'vite-plugin-round-float',
        enforce: 'pre',
        load(id: string) {
            // ?rawでimportされるJSONファイルを処理（publicディレクトリは除外）
            if (id.includes('.json?raw') && !id.includes('/public/')) {
                console.log(`[roundFloatPlugin] load ?raw: ${id}`);
                try {
                    const cleanId = id.replace('?raw', '');
                    const content = readFileSync(cleanId, 'utf-8');
                    const parsed = JSON.parse(content);
                    const optimized = optimizeJsonData(parsed, PRECISION);
                    const optimizedStr = JSON.stringify(optimized);
                    return `export default ${JSON.stringify(optimizedStr)}`;
                } catch (error) {
                    console.error(`[roundFloatPlugin] Failed to process ${id}:`, error);
                    return null;
                }
            }
        },
        transform(code: string, id: string) {
            // 通常のJSONファイルも処理（publicディレクトリは除外）
            if (id.endsWith('.json') && !id.includes('/public/') && !id.includes('?')) {
                console.log(`[roundFloatPlugin] transform: ${id}`);
                try {
                    const parsed = JSON.parse(code);
                    const optimized = optimizeJsonData(parsed, PRECISION);
                    return {
                        code: `export default ${JSON.stringify(optimized)}`,
                        map: null,
                    };
                } catch (error) {
                    console.error(`[roundFloatPlugin] Failed to process ${id}:`, error);
                    return null;
                }
            }
        }
    };
};
