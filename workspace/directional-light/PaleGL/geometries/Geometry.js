import {Attribute} from "./../core/Attribute.js";
import {VertexArrayObject} from "./../core/VertexArrayObject.js";
import {IndexBufferObject} from "./../core/IndexBufferObject.js";

export class Geometry {
    attributes;
    vertexCount;
    vertexArrayObject;
    indexBufferObject;
    indices;
    drawCount;

    constructor({gpu, attributes, indices, drawCount}) {
        this.attributes = {};
        Object.keys(attributes).forEach((key, i) => {
            const attribute = attributes[key];
            this.attributes[key] = new Attribute({
                data: attribute.data,
                location: attribute.location ?? i,
                size: attribute.size,
                offset: attribute.offset
            });
        });

        this.vertexArrayObject = new VertexArrayObject({gpu, attributes: this.attributes})
        if (indices) {
            this.indexBufferObject = new IndexBufferObject({gpu, indices})
            this.indices = indices;
        }

        this.drawCount = drawCount;
        
    }
}