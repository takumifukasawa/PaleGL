export class Vector2 {
    e: Float32Array = new Float32Array(2);

    get x() {
        return this.e[0];
    }

    get y() {
        return this.e[1];
    }

    set x(value) {
        this.e[0] = value;
    }

    set y(value) {
        this.e[1] = value;
    }

    constructor(x: number, y: number) {
        this.set(x, y);
    }

    set(x: number, y: number) {
        this.e = new Float32Array([x, y]);
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
