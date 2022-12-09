import {Attribute} from "./../core/Attribute.js";
import {VertexArrayObject} from "./../core/VertexArrayObject.js";
import {IndexBufferObject} from "./../core/IndexBufferObject.js";
import {Vector3} from "../math/Vector3.js";


// NOTE: あんまりgpu持たせたくないけど持たせた方がいろいろと楽
// TODO: actorをlifecycleに乗せたのでgpuもたせなくてもいいかも
export class Geometry {
    attributes;
    vertexCount;
    vertexArrayObject;
    // indexBufferObject;
    indices;
    drawCount;

    #gpu;

    constructor({
        gpu,
        attributes,
        indices,
        drawCount,
        immediateCreate = true,
        calculateTangent = false,
        calculateBinormal = false
    }) {
        this.#gpu = gpu;

        this.attributes = {};
        Object.keys(attributes).forEach((key, i) => {
            const attribute = attributes[key];
            this.attributes[key] = new Attribute({
                data: attribute.data,
                location: attribute.location || i,
                size: attribute.size,
                offset: attribute.offset,
                usage: attribute.usage,
            });
        });
        
        this.drawCount = drawCount;

        if (indices) {
            this.indices = indices;
        }

        if(gpu && immediateCreate) {
            this.#createGeometry({ gpu })
        }
    }
    
    #createGeometry({ gpu }) {
        this.vertexArrayObject = new VertexArrayObject({
            gpu,
            attributes: this.attributes,
            indices: this.indices
        });
        // if (this.indices) {
        //     this.indexBufferObject = new IndexBufferObject({gpu, indices: this.indices})
        // }
    }
    
    update() {
        if(!this.vertexArrayObject) {
            this.#createGeometry({ gpu: this.#gpu })
        }
    }

    updateAttribute(key, data) {
        this.vertexArrayObject.updateAttribute(key, data);
    }
    
    static createTangentsAndBinormals(normals) {
        const tangents = [];
        const binormals = [];
        for(let i = 0; i < normals.length / 3; i++) {
            const x = normals[i * 3 + 0];
            const y = normals[i * 3 + 1];
            const z = normals[i * 3 + 2];
            const n = new Vector3(x, y, z);
            const t = Vector3.getTangent(n);
            const b = Vector3.getBinormalFromTangent(t, n);
            tangents.push(...t.elements);
            binormals.push(...b.elements);
        }
        return {
            tangents,
            binormals
        };
    }
}