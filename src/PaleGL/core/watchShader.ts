// shaderDepot.ts — HMR永続ストア版（eager + self-accept + 差分通知）

import { isNeededCompact } from '@/PaleGL/utilities/envUtilities.ts';

type Listener = (changedPath: string, changed: string, all: Record<string, string>) => void;
type Store = {
    CURRENT: Record<string, string>;
    subs: Map<Listener, Set<string>>;
    listeners: Set<Listener>;
    ready: boolean;
};

const hot = import.meta.hot;
const store: Store = hot?.data.__shaderStore ?? { CURRENT: {}, subs: new Map(), listeners: new Set(), ready: false };
if (hot) hot.data.__shaderStore = store;

// 全シェーダを vite-plugin-glsl で処理されたものとして eager import
const rawShaders = import.meta.glob([
    // prettier-ignore
    '../../../../src/pages/**/*.{glsl,vert,frag,wgsl,comp}'
], {
    eager: true,
});

// vite-plugin-glsl処理結果を文字列に変換
export const shaders = Object.fromEntries(
    Object.entries(rawShaders).map(([path, shader]) => {
        let shaderString: string;
        if (typeof shader === 'string') {
            shaderString = shader;
        } else if (shader && typeof shader === 'object' && 'default' in shader) {
            const defaultExport = (shader as { default: any }).default;
            if (typeof defaultExport === 'string') {
                shaderString = defaultExport;
            } else if (typeof defaultExport === 'function') {
                try {
                    shaderString = defaultExport();
                } catch (error) {
                    if (!isNeededCompact()) {
                        console.error(`[watchShader] Failed to execute shader function for ${path}:`, error);
                    }
                    shaderString = '';
                }
            } else {
                if (!isNeededCompact()) {
                    console.warn(`[watchShader] Unexpected shader type for ${path}:`, typeof defaultExport, defaultExport);
                }
                shaderString = String(defaultExport || '');
            }
        } else {
            if (!isNeededCompact()) {
                console.warn(`[watchShader] Unexpected shader structure for ${path}:`, typeof shader, shader);
            }
            shaderString = String(shader || '');
        }
        if (!isNeededCompact()) {
            // for debug
            // console.log(`[watchShader] Processed ${path}: ${shaderString.length} characters`);
        }
        return [path, shaderString];
    })
) as Record<string, string>;

// 差分検出（モジュール再評価のたびに走る）
const NEXT = shaders;
const changed = Object.keys(NEXT).filter((k) => NEXT[k] !== store.CURRENT[k]);
store.CURRENT = NEXT;

if (!isNeededCompact()) {
    console.log('[watchShader] store.CURRENT keys:', Object.keys(store.CURRENT));
    console.log('[watchShader] store.CURRENT entries:', Object.entries(store.CURRENT).map(([k, v]) => [k, v.length]));
}

// 初回起動（ready=false）は通知しない。2回目以降のHMR時のみ通知
if (store.ready && changed.length) {
    for (const [cb, set] of store.subs) {
        if (changed.some((p) => set.has(p))) {
            const changedPath = changed[0];
            const changedContent = store.CURRENT[changedPath];
            cb(changedPath, changedContent, store.CURRENT);
        }
    }
    for (const l of store.listeners) {
        const changedPath = changed[0];
        const changedContent = store.CURRENT[changedPath];
        l(changedPath, changedContent, store.CURRENT);
    }
}
store.ready = true;

// API
export const getCurrentShaderContent = (path: string) => store.CURRENT[path] ?? '';

export function getMany(paths: string[]) {
    return Object.fromEntries(paths.map((p) => [p, store.CURRENT[p] ?? ''])) as Record<string, string>;
}

export function subscribeShaders(paths: string[], cb: Listener) {
    if (isNeededCompact()) return () => {};
    store.subs.set(cb, new Set(paths));
    return () => store.subs.delete(cb);
}

export function subscribeSomeChangedShaders(cb: Listener) {
    if (isNeededCompact()) return () => {};
    store.listeners.add(cb);
    return () => store.listeners.delete(cb);
}

// self-accept（depsなし）: 親に伝播させず、このモジュールだけをホット更新
if (import.meta.hot) {
    import.meta.hot.accept();
}
