// shaderDepot.ts — HMR永続ストア版（eager + self-accept + 差分通知）

// 1) HMR間で持続するストアを用意
type Listener = (changedPaths: string[], all: Record<string, string>) => void;
type Store = {
    CURRENT: Record<string, string>;
    subs: Map<Listener, Set<string>>;
    ready: boolean; // 初回起動かどうか
};

const hot = import.meta.hot;
const store: Store = hot?.data.__shaderStore ?? { CURRENT: {}, subs: new Map(), ready: false };
if (hot) hot.data.__shaderStore = store;

// 2) 全シェーダを vite-plugin-glsl で処理されたものとして eager import
// glob pattern は literalを入れる必要がある
const rawShaders = import.meta.glob([
    // prettier-ignore
    // '../../../pages/**/*.{glsl,vert,frag,wgsl,comp}', // pages
    '../../../../src/pages/**/*.{glsl,vert,frag,wgsl,comp}' // root
], {
    eager: true,
});

// vite-plugin-glsl処理結果を文字列に変換
export const shaders = Object.fromEntries(
    Object.entries(rawShaders).map(([path, shader]) => {
        // vite-plugin-glslは通常default exportで文字列を返す
        let shaderString: string;
        
        if (typeof shader === 'string') {
            shaderString = shader;
        } else if (shader && typeof shader === 'object' && 'default' in shader) {
            const defaultExport = (shader as { default: any }).default;
            if (typeof defaultExport === 'string') {
                shaderString = defaultExport;
            } else if (typeof defaultExport === 'function') {
                // 関数の場合は実行して結果を取得
                try {
                    shaderString = defaultExport();
                } catch (error) {
                    console.error(`[watchShader] Failed to execute shader function for ${path}:`, error);
                    shaderString = '';
                }
            } else {
                console.warn(`[watchShader] Unexpected shader type for ${path}:`, typeof defaultExport, defaultExport);
                shaderString = String(defaultExport || '');
            }
        } else {
            console.warn(`[watchShader] Unexpected shader structure for ${path}:`, typeof shader, shader);
            shaderString = String(shader || '');
        }
        
        console.log(`[watchShader] Processed ${path}: ${shaderString.length} characters`);
        return [path, shaderString];
    })
) as Record<string, string>;

// 3) 差分検出（モジュール再評価のたびに走る）
const NEXT = shaders;
const changed = Object.keys(NEXT).filter((k) => NEXT[k] !== store.CURRENT[k]);

// スナップショットを更新
store.CURRENT = NEXT;

// 初回起動（ready=false）は通知しない。2回目以降のHMR時のみ通知
if (store.ready && changed.length) {
    for (const [cb, set] of store.subs) {
        if (changed.some((p) => set.has(p))) cb(changed, store.CURRENT);
    }
}
store.ready = true;

// 4) API（get / getMany / subscribe）
export const get = (path: string) => store.CURRENT[path] ?? '';

export function getMany(paths: string[]) {
    return Object.fromEntries(paths.map((p) => [p, store.CURRENT[p] ?? ''])) as Record<string, string>;
}

export function subscribeShaders(paths: string[], cb: Listener) {
    store.subs.set(cb, new Set(paths));
    // 解除したい時だけ呼ぶ。呼ばなければずっと呼ばれ続けます。
    return () => store.subs.delete(cb);
}

// 5) self-accept（depsなし）: 親に伝播させず、このモジュールだけをホット更新
if (import.meta.hot) {
    import.meta.hot.accept(); // コールバック不要。再評価時のトップレベルで差分通知済み。
}
