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
        
        attributes.forEach((attribute, i) => {
            const { data, stride, location, size, offset } = attribute;
            const vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, stride, gl.FLOAT, false, 0, 0);
        });

        // unbind vertex array to webgl context
        gl.bindVertexArray(null);
    }
}