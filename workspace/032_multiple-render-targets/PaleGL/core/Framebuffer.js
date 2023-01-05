import {GLObject} from "./GLObject.js";

export class Framebuffer extends GLObject {
    #framebuffer;
    #drawBuffersList = [];
    
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
        
        const gl = gpu.gl;
        
        this.#framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
    }
}