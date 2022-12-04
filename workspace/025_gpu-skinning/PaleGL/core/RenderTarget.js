import {Texture} from "./Texture.js";
import {Framebuffer} from "./Framebuffer.js";
import {Renderbuffer} from "./Renderbuffer.js";
import {RenderbufferTypes, RenderTargetTypes, TextureFilterTypes, TextureTypes} from "./../constants.js";
import {AbstractRenderTarget} from "./AbstractRenderTarget.js";

export class RenderTarget extends AbstractRenderTarget {
    // #texture;
    name;
    #framebuffer;
    #depthRenderbuffer;
    width;
    height;
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
        type = RenderTargetTypes.RGBA,
        width = 1,
        height = 1,
        useDepthBuffer = false,
        minFilter = TextureFilterTypes.Linear,
        magFilter = TextureFilterTypes.Linear,
    }) {
        super();
        
        this.name = name;
        
        this.width = width;
        this.height = height;

        const gl = gpu.gl;

        this.#framebuffer = new Framebuffer({gpu});

        if (useDepthBuffer) {
            this.#depthRenderbuffer = new Renderbuffer({gpu, type: RenderbufferTypes.Depth, width, height});
        }

        // depth as render buffer
        if (this.#depthRenderbuffer) {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.#depthRenderbuffer.glObject);
        }

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

        this.#texture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            mipmap: false,
            type: textureType,
            minFilter,
            magFilter
        });

        // set texture to render buffer
        switch (type) {
            case RenderTargetTypes.RGBA:
                // color as texture
                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER,
                    gl.COLOR_ATTACHMENT0,
                    gl.TEXTURE_2D,
                    this.#texture.glObject,
                    0
                );
                break;
            case RenderTargetTypes.Depth:
                // depth as texture
                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER,
                    gl.DEPTH_ATTACHMENT,
                    gl.TEXTURE_2D,
                    this.#texture.glObject,
                    0
                );
                break;
            default:
                throw "invalid type";
        }

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