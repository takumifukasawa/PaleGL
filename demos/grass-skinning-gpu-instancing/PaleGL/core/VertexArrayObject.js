import {GLObject} from "./GLObject.js";
import {AttributeUsageType} from "../constants.js";
import {IndexBufferObject} from "./IndexBufferObject.js";

export class VertexArrayObject extends GLObject {
    #gpu;
    #vao;
    #vboList = [];
    #ibo;
    
    get hasIndices() {
        return !!this.#ibo;
    }

    get glObject() {
        return this.#vao;
    }
    
    get vboList() {
    }
    
    getUsage(gl, usageType) {
        switch(usageType) {
            case AttributeUsageType.StaticDraw:
                return gl.STATIC_DRAW;
            case AttributeUsageType.DynamicDraw:
                return gl.DYNAMIC_DRAW;
            default:
                throw "[VertexArrayObject.getUsage] invalid usage";
        }
    }

    constructor({gpu, attributes = [], indices = null}) {
        super();
        
        this.#gpu = gpu;

        const gl = this.#gpu.gl;
        this.#vao = gl.createVertexArray();

        // bind vertex array to webgl context
        gl.bindVertexArray(this.#vao);

        // Object.keys(attributes).forEach(key => {
        //     const attribute = attributes[key];
        //     this.setAttribute(key, attribute);
        // });
        attributes.forEach(attribute => {
            this.setAttribute(attribute);
        });

        if(indices) {
            this.#ibo = new IndexBufferObject({gpu, indices})
        }

        // unbind vertex array to webgl context
        gl.bindVertexArray(null);

        // unbind array buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        // unbind index buffer
        if(this.#ibo) {
            this.#ibo.unbind();
        }
    }

    updateAttribute(key, data) {
        const gl = this.#gpu.gl;
        const targetVBO = this.#vboList.find(({ name }) => key === name);
        gl.bindBuffer(gl.ARRAY_BUFFER, targetVBO.vbo);
        // TODO: uint16対応
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(targetVBO.data), targetVBO.usage);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    
    setAttribute(attribute, push = false) {
        const gl = this.#gpu.gl;

        if(push) {
            // bind vertex array to webgl context
            gl.bindVertexArray(this.#vao);
        }

        const {name, data, size, location, usageType, divisor} = attribute;
        const newLocation = (location !== null && location !== undefined) ? location : this.#vboList.length;
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        const usage = this.getUsage(gl, usageType);
        gl.bufferData(gl.ARRAY_BUFFER, data, usage);
        gl.enableVertexAttribArray(newLocation);

        console.log(name, data)
        // TODO: uint16対応
        switch(data.constructor) {
            case Float32Array:
                // size ... 頂点ごとに埋める数
                // stride is always 0 because buffer is not interleaved.
                // ref: https://developer.mozilla.org/ja/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
                gl.vertexAttribPointer(newLocation, size, gl.FLOAT, false, 0, 0);
                break;
            case Uint16Array:
                gl.vertexAttribIPointer(newLocation, size, gl.FLOAT, 0, 0);
                break;
            default:
                throw "[VertexArrayObject.setAttribute] invalid data type";
        }

        if(divisor) {
            gl.vertexAttribDivisor(newLocation, divisor);
        }

        this.#vboList.push({ name, vbo, usage });
        
        if(push) {
            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
    }
}