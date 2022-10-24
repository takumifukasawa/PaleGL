import {GLObject} from "./GLObject.js";

export class IndexBufferObject extends GLObject {
    #ibo;
    
    get glObject() {
        return this.#ibo;
    }
    
    constructor({ gpu, indices }) {
        super();
        
        const gl = gpu.gl;
        
        this.#ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}