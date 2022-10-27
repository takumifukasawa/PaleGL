
import {Geometry} from "./Geometry.js";

export class PlaneGeometry extends Geometry {
    constructor({ gpu }) {
        super({
            gpu,
            // -----------------------------
            // 0 ---- 2
            // |    / |
            // |   /  |
            // |  /   |
            // | /    |
            // 1 ---- 3
            // -----------------------------
            attributes: {
                position: {
                    data: [
                        -1, 1, 0,
                        -1, -1, 0,
                        1, 1, 0,
                        1, -1, 0,
                    ],
                    size: 3
                },
                uv: {
                    data: [
                        0, 0,
                        0, 1,
                        1, 0,
                        1, 1,
                    ],
                    size: 2
                },
                color: {
                    data: [
                        1, 0, 0,
                        0, 1, 0,
                        0, 0, 1,
                        1, 1, 0
                    ],
                    size: 3
                }
            },
            indices: [0, 1, 2, 2, 1, 3],
            drawCount: 6
        });
    }
}
