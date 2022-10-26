﻿
import { Texture } from "./Texture.js";
import {Framebuffer} from "./Framebuffer.js";

export class RenderTarget {
    #texture;
    #framebuffer;
    
    get texture() {
        return this.#texture;
    }
    
    get framebuffer() {
        return this.#framebuffer;
    }
    
    constructor({ gpu, width = 1, height = 1 }) {
        const gl = gpu.gl;

        this.#framebuffer = new Framebuffer({ gpu });
        
        this.#texture = new Texture({
            gpu,
            width: 1,
            height: 1,
            mipmap: false,
        });
    
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.#texture.glObject,
            0
        );
    }
    
    setSize(width, height) {
        this.#texture.setSize(width, height);
    }
}