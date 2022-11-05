import {GLObject} from "./GLObject.js";
import {RenderbufferTypes} from "./../constants.js";

export class Renderbuffer extends GLObject {
    #gpu;
    #type;
    #renderbuffer;

    get glObject() {
        return this.#renderbuffer;
    }

    constructor({ gpu, type, width, height }) {
        super();
       
        this.#gpu = gpu;
        this.#type = type;
        
        const gl = this.#gpu.gl;
        
        this.#renderbuffer = gl.createRenderbuffer();
        
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.#renderbuffer);
    
        switch(this.#type) {
            case RenderbufferTypes.Depth:
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
                break;
            default:
                throw "invalid render buffer type.";
        }
    }
    
    setSize(width, height) {
        const gl = this.#gpu.gl;

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.#renderbuffer);
        
        switch(this.#type) {
            case RenderbufferTypes.Depth:
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
                break;
        }
    }
}