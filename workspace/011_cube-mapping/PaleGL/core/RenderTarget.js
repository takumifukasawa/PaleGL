
import { Texture } from "./Texture.js";
import {Framebuffer} from "./Framebuffer.js";
import {Renderbuffer} from "./Renderbuffer.js";
import {RenderbufferTypes} from "./../constants.js";

export class RenderTarget {
    #texture;
    #framebuffer;
    #depthRenderbuffer;
    width;
    height;
    
    get texture() {
        return this.#texture;
    }
    
    get framebuffer() {
        return this.#framebuffer;
    }
    
    constructor({ gpu, width = 1, height = 1, useDepth }) {
        this.width = width;
        this.height = height;
        
        const gl = gpu.gl;

        this.#framebuffer = new Framebuffer({ gpu });
        
        if(useDepth) {
            this.#depthRenderbuffer = new Renderbuffer({gpu, type: RenderbufferTypes.Depth, width: 1, height: 1 });
        }
       
        // depth as render buffer
        if(this.#depthRenderbuffer) {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.#depthRenderbuffer.glObject);
        }
        
        this.#texture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            mipmap: false,
        });
   
        // color as texture
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.#texture.glObject,
            0
        );
       
        // unbind
        gl.bindTexture(gl.TEXTURE_2D, null);
        if(this.#depthRenderbuffer) {
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.#texture.setSize(this.width, this.height);
        if(this.#depthRenderbuffer) {
            this.#depthRenderbuffer.setSize(width, height);
        }
    }
}