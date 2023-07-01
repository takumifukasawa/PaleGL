import {Vector3} from "./Vector3.ts";

export class Vector2 {
    elements: Float32Array = new Float32Array(2);

    get x() {
        return this.elements[0];
    }

    get y() {
        return this.elements[1];
    }

    set x(value) {
        this.elements[0] = value;
    }

    set y(value) {
        this.elements[1] = value;
    }

    constructor(x: number, y: number) {
        this.set(x, y);
    }

    set(x: number, y: number) {
        this.elements = new Float32Array([x, y]);
        return this;
    }

    static get identity() {
        return new Vector2(0, 0);
    }

    static get one() {
        return new Vector2(1, 1);
    }

    static get zero() {
        return new Vector2(0, 0);
    }

    static subVectors(v1: Vector2, v2: Vector2) {
        return new Vector2(v1.x - v2.x, v1.y - v2.y);
    }

    copy(v: Vector2) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    div(v: Vector2) {
        this.x /= v.x;
        this.y /= v.y;
        return this;
    }

    log() {
        console.log(`--------------------
${this.x}, ${this.y}
--------------------`);
    }
}
