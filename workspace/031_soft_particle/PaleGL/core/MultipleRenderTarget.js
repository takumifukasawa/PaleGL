import {Texture} from "./Texture.js";
import {Framebuffer} from "./Framebuffer.js";
import {Renderbuffer} from "./Renderbuffer.js";
import {RenderbufferTypes, RenderTargetTypes, TextureFilterTypes, TextureTypes} from "./../constants.js";
import {AbstractRenderTarget} from "./AbstractRenderTarget.js";

// TODO: めちゃくちゃ途中
export class MultipleRenderTarget extends AbstractRenderTarget {
    name;
    #framebuffer;
    #depthRenderbuffer;
    width;
    height;
    #textures = [];
    #texture;

    get texture() {
        return this.#texture;
    }
    
    get framebuffer() {
        return this.#framebuffer;
    }
    
    get read() {
        return this;
    }
    
    get write() {
        return this;
    }
    
    constructor({
        gpu,
        name,
        width = 1,
        height = 1,
    }) {
        super();
        
        this.name = name;
        
        this.width = width;
        this.height = height;

        const gl = gpu.gl;

        this.#framebuffer = new Framebuffer({gpu});
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);

        // 1: color texture
        const colorTexture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            type: TextureTypes.RGBA
        });
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0 + 0,
            gl.TEXTURE_2D,
            colorTexture,
            0
        );
        // gl.bindTexture(gl.TEXTURE_2D, null);

        // 2: depth texture
        const depthTexture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            type: TextureTypes.Depth
        });
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0 + 1,
            gl.TEXTURE_2D,
            depthTexture,
            0
        );
        // gl.bindTexture(gl.TEXTURE_2D, null);

        this.#depthRenderbuffer = new Renderbuffer({
            gpu,
            type: RenderbufferTypes.Depth,
            width,
            height
        });
        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.RENDERBUFFER,
            this.#depthRenderbuffer.glObject
        );

        let textureType;
        switch (type) {
            case RenderTargetTypes.RGBA:
                textureType = TextureTypes.RGBA;
                break;
            case RenderTargetTypes.Depth:
                textureType = TextureTypes.Depth;
                break;
            default:
                throw "invalid texture type";
        }

        //this.#texture = new Texture({
        //    gpu,
        //    width: this.width,
        //    height: this.height,
        //    type: textureType,
        //});

        //// set texture to render buffer
        //switch (type) {
        //    case RenderTargetTypes.RGBA:
        //        // color as texture
        //        gl.framebufferTexture2D(
        //            gl.FRAMEBUFFER,
        //            gl.COLOR_ATTACHMENT0,
        //            gl.TEXTURE_2D,
        //            this.#texture.glObject,
        //            0
        //        );
        //        break;
        //    case RenderTargetTypes.Depth:
        //        // depth as texture
        //        gl.framebufferTexture2D(
        //            gl.FRAMEBUFFER,
        //            gl.DEPTH_ATTACHMENT,
        //            gl.TEXTURE_2D,
        //            this.#texture.glObject,
        //            0
        //        );
        //        break;
        //    default:
        //        throw "invalid type";
        //}

        // unbind
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (this.#depthRenderbuffer) {
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.#texture.setSize(this.width, this.height);
        if (this.#depthRenderbuffer) {
            this.#depthRenderbuffer.setSize(width, height);
        }
    }
}