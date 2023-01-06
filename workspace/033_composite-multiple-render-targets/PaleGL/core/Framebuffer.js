import {GLObject} from "./GLObject.js";

export class Framebuffer extends GLObject {
    #framebuffer;
    #drawBuffersList = [];
    #gpu;
    
    get drawBufferList() {
        return this.#drawBuffersList;
    }
    
    get glObject() {
        return this.#framebuffer;
    }
    
    get hasMultipleDrawBuffers() {
        return this.#drawBuffersList.length >= 2;
    }
   
    registerDrawBuffer(drawBufferName) {
        this.#drawBuffersList.push(drawBufferName);
    }
    
    constructor({ gpu }) {
        super();
       
        this.#gpu = gpu;
        const gl = this.#gpu.gl;
        
        this.#framebuffer = gl.createFramebuffer();
    }
    
    bind() {
        const gl = this.#gpu.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
    }

    unbind() {
        const gl = this.#gpu.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}