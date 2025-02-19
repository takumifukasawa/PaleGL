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

import { Vector3 } from '@/PaleGL/math/Vector3.ts';

/**
 * ref: https://techblog.kayac.com/unity-light-weight-bloom-effect
 * @param sigma
 * @param x
 */
export function gaussCoefficient(sigma: number, x: number) {
    const sigma2 = sigma * sigma;
    return Math.exp(-(x * x) / (2 * sigma2));
}

/**
 *
 * @param x
 * @param min
 * @param max
 */
export function clamp(x: number, min: number, max: number) {
    return Math.min(max, Math.max(x, min));
}

/**
 *
 * @param x
 */
export function saturate(x: number) {
    return clamp(x, 0, 1);
}

/**
 *
 * @param a
 * @param b
 * @param t
 */
export function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

/**
 *
 * @param a
 * @param b
 */
export function randomRange(a: number, b: number) {
    return lerp(a, b, Math.random());
}

/**
 *
 * @param rad
 */
export function rad2Deg(rad: number) {
    return rad * (180 / Math.PI);
}

/**
 *
 * @param deg
 */
export function deg2Rad(deg: number) {
    return deg * (Math.PI / 180);
}

// ref: https://gist.github.com/avilde/3736a903560b35fd587d213a3f79fad7
function mulberry32(seed: number): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let imul = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    imul = (imul + Math.imul(imul ^ (imul >>> 7), 61 | imul)) ^ imul;
    return ((imul ^ (imul >>> 14)) >>> 0) / 4294967296;
}

export function generateRandomValue(seed: number, id: number): number {
    // seedとidを組み合わせて一意の値にする
    const combinedSeed = seed ^ id;
    return mulberry32(combinedSeed);
}

export function randomOnUnitSphere(seed: number, v: Vector3) {
    const theta = lerp(0, Math.PI * 2, generateRandomValue(seed, 0));
    const phi = Math.asin(generateRandomValue(seed, 1) * 2 - 1);

    const x = Math.cos(phi) * Math.cos(theta);
    const y = Math.cos(phi) * Math.sin(theta);
    const z = Math.sin(phi);

    // return new Vector3(x, y, z);
    v.x = x;
    v.y = y;
    v.z = z;
}

export function randomOnUnitPlane(seed: number, scale: number = 1) {
    const x = generateRandomValue(seed, 0) * 2 - 1;
    const z = generateRandomValue(seed, 1) * 2 - 1;
    return new Vector3(x * scale, 0, z * scale);
}

export function randomOnUnitCircle(id: number, scale: number, v: Vector3) {
    const t = lerp(0, Math.PI * 2, generateRandomValue(10, id));
    const x = Math.cos(t);
    const z = Math.sin(t);
    const r = scale * Math.sqrt(generateRandomValue(20, id));
    // return new Vector3(x * r, 0, z * r);
    v.x = x * r;
    v.y = 0;
    v.z = z * r;
}
