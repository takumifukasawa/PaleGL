import {GLObject} from "./GLObject.js";

export class Renderbuffer extends GLObject {
    #renderbuffer;

    get glObject() {
        return this.#renderbuffer;
    }

    constructor({ gpu }) {
        super();
        
        const gl = gpu.gl;
        
        this.#renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.#renderbuffer);
    }
}