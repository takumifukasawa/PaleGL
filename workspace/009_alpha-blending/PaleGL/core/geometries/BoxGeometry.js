
import {Geometry} from "./Geometry.js";

export class BoxGeometry extends Geometry {
    constructor({ gpu }) {
        const boxPosition_0 = [-0.5, 0.5, 0.5];
        const boxPosition_1 = [-0.5, -0.5, 0.5];
        const boxPosition_2 = [0.5, 0.5, 0.5];
        const boxPosition_3 = [0.5, -0.5, 0.5];
        const boxPosition_4 = [0.5, 0.5, -0.5];
        const boxPosition_5 = [0.5, -0.5, -0.5];
        const boxPosition_6 = [-0.5, 0.5, -0.5];
        const boxPosition_7 = [-0.5, -0.5, -0.5];

        super({
            gpu,
            attributes: {
                // -----------------------------
                //    
                //   6 ---- 4
                //  /|     /|
                // 0 ---- 2 |
                // | 7 -- | 5
                // |/     |/
                // 1 ---- 3
                // -----------------------------
                position: {
                    data: [
                        // front
                        ...boxPosition_0, ...boxPosition_1, ...boxPosition_2, ...boxPosition_3,
                        // right
                        ...boxPosition_2, ...boxPosition_3, ...boxPosition_4, ...boxPosition_5,
                        // back
                        ...boxPosition_4, ...boxPosition_5, ...boxPosition_6, ...boxPosition_7,
                        // left
                        ...boxPosition_6, ...boxPosition_7, ...boxPosition_0, ...boxPosition_1,
                        // top
                        ...boxPosition_6, ...boxPosition_0, ...boxPosition_4, ...boxPosition_2,
                        // bottom
                        ...boxPosition_1, ...boxPosition_7, ...boxPosition_3, ...boxPosition_5,
                    ],
                    size: 3,
                },
                uv: {
                    data: (new Array(6)).fill(0).map(() => ([
                        0, 1,
                        0, 0,
                        1, 1,
                        1, 0,
                    ])).flat(),
                    size: 2
                },
            },
            indices: Array.from(Array(6).keys()).map(i => ([
                i * 4 + 0, i * 4 + 1, i * 4 + 2,
                i * 4 + 2, i * 4 + 1, i * 4 + 3,
            ])).flat(),
            drawCount: 6 * 6 // indices count
        });
    }
}
