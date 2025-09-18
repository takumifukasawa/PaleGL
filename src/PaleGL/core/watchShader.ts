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

// 2) 全シェーダを「文字列」で eager import（?raw不要）
// glob pattern は literalを入れる必要がある
export const shaders = import.meta.glob(['./shaders/**/*.{glsl,vert,frag,wgsl,comp}'], {
    as: 'raw',
    eager: true,
}) as Record<string, string>;

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

export function subscribe(paths: string[], cb: Listener) {
    store.subs.set(cb, new Set(paths));
    // 解除したい時だけ呼ぶ。呼ばなければずっと呼ばれ続けます。
    return () => store.subs.delete(cb);
}

// 5) self-accept（depsなし）: 親に伝播させず、このモジュールだけをホット更新
if (import.meta.hot) {
    import.meta.hot.accept(); // コールバック不要。再評価時のトップレベルで差分通知済み。
}
