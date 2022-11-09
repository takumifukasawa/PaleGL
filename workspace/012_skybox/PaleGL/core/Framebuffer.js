import {GLObject} from "./GLObject.js";

export class Framebuffer extends GLObject {
    #framebuffer;
    
    get glObject() {
        return this.#framebuffer;
    }
    
    constructor({ gpu }) {
        super();
        
        const gl = gpu.gl;
        
        this.#framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
    }
}