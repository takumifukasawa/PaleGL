
import { Texture } from "./Texture.js";
import {Framebuffer} from "./Framebuffer.js";

export class RenderTarget {
    #texture;
    #framebuffer;
    width;
    height;
    
    get texture() {
        return this.#texture;
    }
    
    get framebuffer() {
        return this.#framebuffer;
    }
    
    constructor({ gpu, width = 1, height = 1 }) {
        this.width = width;
        this.height = height;
        
        const gl = gpu.gl;

        this.#framebuffer = new Framebuffer({ gpu });
        
        this.#texture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            mipmap: false,
        });
    
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.#texture.glObject,
            0
        );
       
        // unbind
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.#texture.setSize(this.width, this.height);
    }
}