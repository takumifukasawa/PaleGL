
import {Geometry} from "./Geometry.js";

const tipSize = 0.05;
const rootSize = 0.25;
const arrowLength = 2;

export class ArrowGeometry extends Geometry {
    constructor({ gpu }) {
        const boxPosition_z0 = [-tipSize, tipSize, arrowLength];
        const boxPosition_z1 = [-tipSize, -tipSize, arrowLength];
        const boxPosition_z2 = [tipSize, tipSize, arrowLength];
        const boxPosition_z3 = [tipSize, -tipSize, arrowLength];
        const boxPosition_z4 = [rootSize, rootSize, 0];
        const boxPosition_z5 = [rootSize, -rootSize, 0];
        const boxPosition_z6 = [-rootSize, rootSize, 0];
        const boxPosition_z7 = [-rootSize, -rootSize, 0];
        
        const boxPosition_x0 = [-tipSize, tipSize, arrowLength];
        const boxPosition_x1 = [-tipSize, -tipSize, arrowLength];
        const boxPosition_x2 = [tipSize, tipSize, arrowLength];
        const boxPosition_x3 = [tipSize, -tipSize, arrowLength];
        const boxPosition_x4 = [rootSize, rootSize, 0];
        const boxPosition_x5 = [rootSize, -rootSize, 0];
        const boxPosition_x6 = [-rootSize, rootSize, 0];
        const boxPosition_x7 = [-rootSize, -rootSize, 0];
       
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
                        // z
                        // front
                        ...boxPosition_z0, ...boxPosition_z1, ...boxPosition_z2, ...boxPosition_z3,
                        // right
                        ...boxPosition_z2, ...boxPosition_z3, ...boxPosition_z4, ...boxPosition_z5,
                        // back
                        ...boxPosition_z4, ...boxPosition_z5, ...boxPosition_z6, ...boxPosition_z7,
                        // left
                        ...boxPosition_z6, ...boxPosition_z7, ...boxPosition_z0, ...boxPosition_z1,
                        // top
                        ...boxPosition_z6, ...boxPosition_z0, ...boxPosition_z4, ...boxPosition_z2,
                        // bottom
                        ...boxPosition_z1, ...boxPosition_z7, ...boxPosition_z3, ...boxPosition_z5,
                        // x
                        // front 
                        // right
                        // back
                        // left
                        // top
                        // bottom
                    ],
                    size: 3,
                },
           },
            indices: Array.from(Array(6 * 1).keys()).map(i => ([
                i * 4 + 0, i * 4 + 1, i * 4 + 2,
                i * 4 + 2, i * 4 + 1, i * 4 + 3,
            ])).flat(),
            drawCount: 6 * 6 * 1 // indices count
        });
    }
}
