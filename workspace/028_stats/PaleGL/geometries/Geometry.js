import {Attribute} from "./../core/Attribute.js";
import {VertexArrayObject} from "./../core/VertexArrayObject.js";
import {IndexBufferObject} from "./../core/IndexBufferObject.js";
import {Vector3} from "../math/Vector3.js";
import {AttributeUsageType} from "../constants.js";


// NOTE: あんまりgpu持たせたくないけど持たせた方がいろいろと楽
// TODO: actorをlifecycleに乗せたのでgpuもたせなくてもいいかも
export class Geometry {
    attributes = [];
    vertexCount;
    vertexArrayObject;
    // indexBufferObject;
    indices;
    drawCount;

    instanceCount;

    #gpu;

    constructor({
        gpu,
        attributes,
        indices,
        drawCount,
        // immediateCreate = true,
        // calculateTangent = false,
        calculateBinormal = false,
        instanceCount = null,
    }) {
        this.#gpu = gpu;
        
        this.instanceCount = instanceCount;
        this.drawCount = drawCount;

        if (indices) {
            this.indices = indices;
        }
        
        this.vertexArrayObject = new VertexArrayObject({
            gpu,
            attributes: [],
            indices: this.indices
        });
        
        (attributes.filter(e => Object.keys(e).length > 0)).forEach(attribute => {
            this.setAttribute(attribute);
        });
    }
    
    // TODO: attribute class を渡す、で良い気がする
    setAttribute(attribute) {
        const location = attribute.location
            ? attribute.location
            : this.attributes.length;
        
        const attr = new Attribute({
            name: attribute.name,
            data: attribute.data,
            // location: i > -1 ? attribute.location || i,
            location,
            size: attribute.size,
            offset: attribute.offset,
            usage: attribute.usage || AttributeUsageType.StaticDraw,
            divisor: attribute.divisor
        });
        this.attributes.push(attr);

        this.vertexArrayObject.setAttribute(attr, true);
    }
   
    // TODO: startで create geometry する？
    // start() {}
    
    #createGeometry({ gpu }) {
        console.log("[Geometry.createGeometry]", this.attributes)
        this.vertexArrayObject = new VertexArrayObject({
            gpu,
            attributes: this.attributes,
            indices: this.indices
        });
    }
    
    start() {
        if(!this.vertexArrayObject) {
            this.#createGeometry({ gpu: this.#gpu })
        }
    }
    
    update() {
        if(!this.vertexArrayObject) {
            this.#createGeometry({ gpu: this.#gpu })
        }
    }

    updateAttribute(key, data) {
        const attribute = this.attributes.find(({ name }) => name === key);
        attribute.data = data;
        this.vertexArrayObject.updateAttribute(key, attribute.data);
    }

    getAttributeDescriptors() {
        return this.attributes.map(attribute => attribute.getDescriptor());
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
    
    static createBinormals(normals, tangents) {
        const binormals = [];
        for(let i = 0; i < normals.length / 3; i++) {
            const n = new Vector3(
                normals[i * 3 + 0],
                normals[i * 3 + 1],
                normals[i * 3 + 2]
            );
            const t = new Vector3(
                tangents[i * 3 + 0],
                tangents[i * 3 + 1],
                tangents[i * 3 + 2]
            );
            const b = Vector3.getBinormalFromTangent(t, n);
            binormals.push(...b.elements);
        }
        return binormals;
    }
}