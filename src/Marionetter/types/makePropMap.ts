// T の各キーに対する短縮名の表（値は文字列ならOK）。
export type ShortNamesFor<T extends object> = { [K in keyof T]: string };

// T(元の型) と M(短縮名表) から、短縮キーを「キー側」に持つ拡張型を作る
export type WithShortKeys<
    T extends object,
    M extends ShortNamesFor<T>
> = T & {
    [K in keyof M as M[K]]: T[K & keyof T];
};

// NeedsShorten（真偽リテラル）に応じた「キー名マップ」を生成（実値）
// 戻り値の型も Flag（true/false リテラル）に応じて推論される
export function buildPropMap<
    T extends object,
    M extends ShortNamesFor<T>,
    Flag extends boolean
>(shortNames: M, needsShorten: Flag) {
    const out = {} as {
        readonly [K in keyof T]: Flag extends true ? M[K] : K;
    };
    for (const k in shortNames) {
        // ランタイムは単に短縮名か元名かを選ぶ
        // eslint-disable-next-line
        (out as any)[k] = needsShorten ? (shortNames as any)[k] : k;
    }
    return out;
}

// 型・値セットアップを少し楽にするための小さなファクトリ
export function createShortenKit<T extends object>() {
    return function <M extends ShortNamesFor<T>>(shortNames: M) {
        return {
            // これを型エイリアスに使うと WithShortKeys<T, M> を得られる
            type: null as unknown as WithShortKeys<T, M>,
            // 実際のプロパティマップを NeedsShorten に応じて作る
            map: <Flag extends boolean>(flag: Flag) =>
                buildPropMap<T, M, Flag>(shortNames, flag),
            shortNames, // 必要なら外でも参照できるよう返しておく
        };
    };
}

export function makeLongKeyMap<const T extends Record<string, unknown>>(obj: T) {
    const out = {} as { [K in keyof T]: K };
    for (const k in obj) {
        (out as any)[k] = k;
    }
    return Object.freeze(out) as { readonly [K in keyof T]: K };
}
