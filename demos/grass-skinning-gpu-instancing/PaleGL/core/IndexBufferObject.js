import {GLObject} from "./GLObject.js";

export class IndexBufferObject extends GLObject {
    #ibo;
    #gpu;
    
    get glObject() {
        return this.#ibo;
    }
    
    constructor({ gpu, indices }) {
        super();
        
        this.#gpu = gpu;
        
        const gl = this.#gpu.gl;
        
        this.#ibo = gl.createBuffer();

        this.bind();
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }
    
    bind() {
        const gl = this.#gpu.gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo);
    }
    
    unbind() {
        const gl = this.#gpu.gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}