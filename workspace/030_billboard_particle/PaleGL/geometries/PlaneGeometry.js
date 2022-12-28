
import {Geometry} from "./Geometry.js";
import {Vector3} from "../math/Vector3.js";
import {AttributeNames} from "../constants.js";

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
            attributes: [
                {
                    name: AttributeNames.Position,
                    data: new Float32Array([
                        -1, 1, 0,
                        -1, -1, 0,
                        1, 1, 0,
                        1, -1, 0,
                    ]),
                    size: 3
                }, {
                    name: AttributeNames.Uv,
                    data: new Float32Array([
                        0, 1,
                        0, 0,
                        1, 1,
                        1, 0,
                    ]),
                    size: 2
                }, {
                    name: AttributeNames.Normal,
                    data: new Float32Array(normals),
                    size: 3
                },
                (calculateTangent ?
                    {
                        name: AttributeNames.Tangent,
                        data: new Float32Array(tangents),
                        size: 3
                    } : {}
                ),
                (calculateBinormal ?
                    {
                        name: AttributeNames.Binormal,
                        data: new Float32Array(binormals),
                        size: 3
                    } : {}
                ),
            ],
            indices: [0, 1, 2, 2, 1, 3],
            drawCount: 6
        });
    }
}
