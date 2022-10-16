import {GLObject} from "./GLObject.js";

export class VertexArrayObject extends GLObject {
    #vao;

    get glObject() {
        return this.#vao;
    }
    
    constructor({ gpu, attributes }) {
        super();
       
        const gl = gpu.gl;
        this.#vao = gl.createVertexArray();
       
        // bind vertex array to webgl context
        gl.bindVertexArray(this.#vao);
        
        Object.keys(attributes).forEach(key => {
            const attribute = attributes[key];
            const { data, size, location, } = attribute;
            const vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(location);
            // stride is always 0 because buffer is not interleaved.
            // ref: https://developer.mozilla.org/ja/docs/Web/API/WebGLRenderingContext/vertexAttribPointerk
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        });

        // unbind vertex array to webgl context
        gl.bindVertexArray(null);
    }
}