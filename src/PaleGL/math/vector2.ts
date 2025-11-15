// export class Vector2 {
//     e: Float32Array = new Float32Array(2);
//
//     get x() {
//         return this.e[0];
//     }
//
//     get y() {
//         return this.e[1];
//     }
//
//     set x(value) {
//         this.e[0] = value;
//     }
//
//     set y(value) {
//         this.e[1] = value;
//     }
//
//     constructor(x: number, y: number) {
//         this.set(x, y);
//     }
//
//     set(x: number, y: number) {
//         this.e = new Float32Array([x, y]);
//         return this;
//     }
//
//     static get identity() {
//         return new Vector2(0, 0);
//     }
//
//     static get one() {
//         return new Vector2(1, 1);
//     }
//
//     static get zero() {
//         return new Vector2(0, 0);
//     }
//
//     static subVectors(v1: Vector2, v2: Vector2) {
//         return new Vector2(v1.x - v2.x, v1.y - v2.y);
//     }
//
//     copy(v: Vector2) {
//         this.x = v.x;
//         this.y = v.y;
//         return this;
//     }
//
//     div(v: Vector2) {
//         this.x /= v.x;
//         this.y /= v.y;
//         return this;
//     }
//
//     log() {
//         console.log(`--------------------
// ${this.x}, ${this.y}
// --------------------`);
//     }
// }


// [x, y]
export type RawVector2 = [number, number];

// Array indices for RawVector2
export const RAW_VECTOR2_X_INDEX = 0;
export const RAW_VECTOR2_Y_INDEX = 1;

export const createVector2FromRaw = (raw: RawVector2) => {
    return createVector2(
        raw[RAW_VECTOR2_X_INDEX],
        raw[RAW_VECTOR2_Y_INDEX]
    );
}

export type Vector2 = Float32Array;

export const createVector2 = (x: number, y: number): Vector2 => {
    return new Float32Array([x, y]);
}

export const v2x = (v2: Vector2) => v2[0];
export const v2y = (v2: Vector2) => v2[1];
export const setV2x = (v2: Vector2, value: number) => (v2[0] = value);
export const setV2y = (v2: Vector2, value: number) => (v2[1] = value);
export const setV2 = (v2: Vector2, x: number, y: number) => {
    setV2x(v2, x);
    setV2y(v2, y);
};
export const v2o = (v2: Vector2) => ({ x: v2x(v2), y: v2y(v2) });

export const createVector2Identity = () => {
    return createVector2(0, 0);
}

export const createVector2One = () => {
    return createVector2(1, 1);
}

export const createVector2Zero = () => {
    return createVector2(0, 0);
}

export const subVectorsV2 = (v1: Vector2, v2: Vector2) => {
    return createVector2(v2x(v1) - v2x(v2), v2y(v1) - v2y(v2));
}

export const copyVector2 = (sv: Vector2, tv: Vector2) => {
    setV2x(sv, v2x(tv));
    setV2y(sv, v2y(tv));
    return sv;
}

export const divVector2 = (sv: Vector2, tv: Vector2) => {
    setV2x(sv, v2x(sv) / v2x(tv));
    setV2y(sv, v2y(sv) / v2y(tv));
    return sv;
}

export const logVector2 = (v: Vector2) => {
    console.log(`--------------------
${v2x(v)}, ${v2y(v)}
--------------------`);
}

export const isVector2 = (v: unknown) => {
    return v instanceof Float32Array && v.length === 2;
}
