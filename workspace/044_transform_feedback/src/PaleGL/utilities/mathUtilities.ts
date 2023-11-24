// ------------------------------------------------------
//
// # 3x3
// もしガウシアンブラーなら、
// 1/4, 2/4, 1/4 を縦横 => 3 + 3 => 6回 fetch
//
// --------------------------
// | 1 | 2 | 1 |
// | 2 | 4 | 2 | * (1 / 16)
// | 1 | 2 | 1 |
// --------------------------
//
// # 5x5
// もしガウシアンブラーなら、
// 1/16, 4/16, 6/16, 4/16, 1/16 を縦横 => 5 + 5 => 10回 fetch
//
// -------------------------------------
// | 1 | 4  | 6  | 4  | 1 |
// | 4 | 16 | 24 | 16 | 4 |
// | 6 | 24 | 36 | 24 | 6 | * (1/ 256)
// | 4 | 16 | 24 | 16 | 4 |
// | 1 | 4  | 6  | 4  | 1 |
// -------------------------------------
//
// ------------------------------------------------------

// ref: https://techblog.kayac.com/unity-light-weight-bloom-effect
export function gaussCoefficient(sigma: number, x: number) {
    const sigma2 = sigma * sigma;
    return Math.exp(-(x * x) / (2 * sigma2));
}

export function clamp(x: number, min: number, max: number) {
    return Math.min(max, Math.max(x, min));
}

export function saturate(x: number) {
    return clamp(x, 0, 1);
}

export function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

export function randomRange(a: number, b: number) {
    return lerp(a, b, Math.random());
}
