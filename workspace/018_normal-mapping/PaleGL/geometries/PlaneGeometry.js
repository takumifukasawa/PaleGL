
import {Geometry} from "./Geometry.js";
import {Vector3} from "../math/Vector3.js";

export class PlaneGeometry extends Geometry {
    constructor({
        gpu,
        calculateTangent = false,
        calculateBinormal = false 
    }) {

        const normals = [
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
        ];
        
        const { tangents, binormals } = Geometry.createTangentsAndBinormals(normals);

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
                        0, 1,
                        0, 0,
                        1, 1,
                        1, 0,
                    ],
                    size: 2
                },
                normal: {
                    data: normals,
                    size: 3
                },
                ...(calculateTangent ?
                    {
                        tangent: {
                            data: tangents,
                            size: 3
                        },
                    } : {}
                ),
                ...(calculateBinormal ?
                    {
                        binormal: {
                            data: binormals,
                            size: 3
                        },
                    } : {}
                ),
            },
            indices: [0, 1, 2, 2, 1, 3],
            drawCount: 6
        });
        console.log(this.attributes)
    }
}
