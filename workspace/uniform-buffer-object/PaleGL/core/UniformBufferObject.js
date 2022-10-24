import {GLObject} from "./GLObject.js";

export class UniformBufferObject extends GLObject {
    #ubo
    
    get glObject() {
        return this.#ubo;
    }
    
    constructor({ gpu, program, name }) {
        super();
        
        const gl = gpu.gl;
        
        const blockIndex = gl.getUniformBlockIndex(program, name);
        const blockSize = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE);
        
        this.#ubo = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.#ubo);
        gl.bufferData()
    } 
}
