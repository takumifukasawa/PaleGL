import { saturate } from '@/PaleGL/utilities/mathUtilities.ts';

export function easeInOutQuad(t: number) {
    if (t < 0.5) {
        return saturate(2 * t * t);
    }
    return saturate(-1 + (4 - 2 * t) * t);
}

export function easeInOutCubic(t: number) {
    if (t < 0.5) {
        return saturate(4 * t * t * t);
    }
    return saturate((t - 1) * (2 * t - 2) * (2 * t - 2) + 1);
}

export function easeOut(t: number) {
    return saturate(Math.sin(t * Math.PI / 2));
}

export function easeOutQuad(t: number) {
    return saturate(1 - Math.pow(1 - t, 2));
}

export function easeOutCube(t: number) {
    return saturate(1 - Math.pow(1 - t, 3));
}
