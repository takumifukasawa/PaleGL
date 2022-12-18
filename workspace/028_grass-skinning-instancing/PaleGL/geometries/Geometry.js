﻿import {Attribute} from "./../core/Attribute.js";
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
            attributes: this.attributes,
            indices: this.indices
        });

        this.attributes = {};
        Object.keys(attributes).forEach((key, i) => {
            const attribute = attributes[key];
            this.setAttribute(key, attribute, i);
            // this.attributes[key] = new Attribute({
            //     data: attribute.data,
            //     location: attribute.location || i,
            //     size: attribute.size,
            //     offset: attribute.offset,
            //     usage: attribute.usage,
            //     divisor: attribute.divisor
            // });
        });
        

        // if(gpu && immediateCreate) {
        //     this.#createGeometry({ gpu })
        // }
    }
    
    setAttribute(key, attribute, i = -1) {
        const location = attribute.location ?
            attribute.location :
            i > -1 ? i : Object.keys(this.attributes).length;
        this.attributes[key] = new Attribute({
            data: attribute.data,
            // location: i > -1 ? attribute.location || i,
            location,
            size: attribute.size,
            offset: attribute.offset,
            usage: attribute.usage,
            divisor: attribute.divisor
        });       

        this.vertexArrayObject.setAttribute(key, this.attributes[key], true);
    }
   
    // TODO: startで create geometry したい
    // start() {}
    
    #createGeometry({ gpu }) {
        console.log("[Geometry.createGeometry]", this.attributes)
        this.vertexArrayObject = new VertexArrayObject({
            gpu,
            attributes: this.attributes,
            indices: this.indices
        });
        // if (this.indices) {
        //     this.indexBufferObject = new IndexBufferObject({gpu, indices: this.indices})
        // }
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
        this.attributes[key].data = data;
        this.vertexArrayObject.updateAttribute(key, this.attributes[key].data);
    }

    getAttributeDescriptors() {
        const attributes = {};
        Object.keys(this.attributes).forEach(key => attributes[key] = this.attributes[key].getDescriptor());
        return attributes;
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