import {GLObject} from "./GLObject.js";
import {AttributeUsageType} from "../constants.js";
import {IndexBufferObject} from "./IndexBufferObject.js";

export class VertexArrayObject extends GLObject {
    #vao;
    #vboList = {};
    #gpu;
    #ibo;
    
    get hasIndices() {
        return !!this.#ibo;
    }

    get glObject() {
        return this.#vao;
    }
    
    getUsage(gl, usageType) {
        switch(usageType) {
            case AttributeUsageType.StaticDraw:
                return gl.STATIC_DRAW;
            case AttributeUsageType.DynamicDraw:
                return gl.DYNAMIC_DRAW;
            default:
                throw "invalid usage";
        }
    }

    constructor({gpu, attributes, indices = null}) {
        super();
        
        this.#gpu = gpu;

        const gl = this.#gpu.gl;
        this.#vao = gl.createVertexArray();

        // bind vertex array to webgl context
        gl.bindVertexArray(this.#vao);

        Object.keys(attributes).forEach(key => {
            const attribute = attributes[key];
            const {data, size, location, usageType} = attribute;
            const vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            const usage = this.getUsage(gl, usageType);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), usage);
            gl.enableVertexAttribArray(location);
            // size ... 頂点ごとに埋める数
            // stride is always 0 because buffer is not interleaved.
            // ref: https://developer.mozilla.org/ja/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
            
            this.#vboList[key] = { vbo, usage };
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
        gl.bindBuffer(gl.ARRAY_BUFFER, this.#vboList[key].vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), this.#vboList[key].usage);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}