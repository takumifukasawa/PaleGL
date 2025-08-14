import { Vector3 } from '@/PaleGL/math/vector3.ts';

export type Ray = ReturnType<typeof createRay>;

export function createRay(origin: Vector3, dir: Vector3) {
    return {
        origin,
        dir,
    };
}
