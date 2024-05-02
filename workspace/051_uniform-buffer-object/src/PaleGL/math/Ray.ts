import { Vector3 } from '@/PaleGL/math/Vector3.ts';

export class Ray {
    origin: Vector3;
    dir: Vector3;

    constructor(origin: Vector3, dir: Vector3) {
        this.origin = origin;
        this.dir = dir;
    }
}
