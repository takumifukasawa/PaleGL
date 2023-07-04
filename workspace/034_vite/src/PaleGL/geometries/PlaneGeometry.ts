
import {Geometry} from "@/PaleGL/geometries/Geometry";
import {AttributeNames} from "@/PaleGL/constants";
import {Attribute} from "@/PaleGL/core/Attribute";
import {GPU} from "@/PaleGL/core/GPU";

export class PlaneGeometry extends Geometry {
    constructor({
        gpu,
        calculateTangent = false,
        calculateBinormal = false 
    }: {
        gpu: GPU,
        calculateTangent?: boolean,
        calculateBinormal?: boolean
    }) {
        const { attributes, indices, drawCount } = PlaneGeometry.createPlaneGeometryData({ calculateTangent, calculateBinormal });

        super({
            gpu,
            attributes,
            indices,
            drawCount,
        });
    }
    
    static createPlaneGeometryData({
        calculateTangent = false,
        calculateBinormal = false 
    } = {}) {
        // -----------------------------
        // 0 ---- 2
        // |    / |
        // |   /  |
        // |  /   |
        // | /    |
        // 1 ---- 3
        // -----------------------------

        const normals = [
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
        ];
        
        const { tangents, binormals } = Geometry.createTangentsAndBinormals(normals);
      
        // TODO: uniqでfilter
        const attributes = [
            new Attribute({
                name: AttributeNames.Position,
                data: new Float32Array([
                    -1, 1, 0,
                    -1, -1, 0,
                    1, 1, 0,
                    1, -1, 0,
                ]),
                size: 3
            }),
            new Attribute({
                name: AttributeNames.Uv,
                data: new Float32Array([
                    0, 1,
                    0, 0,
                    1, 1,
                    1, 0,
                ]),
                size: 2
            }),
            new Attribute({
                name: AttributeNames.Normal,
                data: new Float32Array(normals),
                size: 3
            }),
        ];
        
        if(calculateTangent) {
            attributes.push(new Attribute({
                name: AttributeNames.Tangent,
                data: new Float32Array(tangents),
                size: 3
            }));
        }
        if(calculateBinormal) {
            attributes.push(new Attribute({
                name: AttributeNames.Binormal,
                data: new Float32Array(binormals),
                size: 3
            }));
        }
        
        return {
            attributes,
            indices: [0, 1, 2, 2, 1, 3],
            drawCount: 6,
        };
    }
}
