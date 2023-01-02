import {Texture} from "./Texture.js";
import {Framebuffer} from "./Framebuffer.js";
import {Renderbuffer} from "./Renderbuffer.js";
import {RenderbufferTypes, RenderTargetTypes, TextureFilterTypes, TextureTypes} from "./../constants.js";
import {AbstractRenderTarget} from "./AbstractRenderTarget.js";

// TODO:
// depth texture を外から渡す形でもいいかも
export class RenderTarget extends AbstractRenderTarget {
    name;
    #framebuffer;
    // #depthRenderbuffer;
    width;
    height;
    #texture;
    #depthTexture;

    get texture() {
        return this.#texture;
    }
    
    get depthTexture() {
        return this.#depthTexture;
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
        // useDepthBuffer = false,
        writeDepthTexture = false,
        minFilter = TextureFilterTypes.Linear,
        magFilter = TextureFilterTypes.Linear,
        mipmap = false,
    }) {
        super();

        const gl = gpu.gl;

        this.name = name;
        this.type = type;
        
        this.width = width;
        this.height = height;

        this.#framebuffer = new Framebuffer({gpu});

        // if (useDepthBuffer) {
        //     this.#depthRenderbuffer = new Renderbuffer({gpu, type: RenderbufferTypes.Depth, width, height});
        // }

        // // depth as render buffer
        // if (this.#depthRenderbuffer) {
        //     gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.#depthRenderbuffer.glObject);
        // }

        // let textureType;
        // switch (this.type) {
        //     case RenderTargetTypes.RGBA:
        //         textureType = TextureTypes.RGBA;
        //         break;
        //     case RenderTargetTypes.Depth:
        //         textureType = TextureTypes.Depth;
        //         break;
        //     default:
        //         throw "[RenderTarget.constructor] invalid texture type";
        // }
        
        // if(this.type === RenderTargetTypes.Depth) {
        //     this.#depthTexture = new Texture({
        //         gpu,
        //         width: this.width,
        //         height: this.height,
        //         mipmap: false,
        //         type: TextureTypes.Depth,
        //         // 一旦linear固定
        //         minFilter: TextureFilterTypes.Nearest,
        //         magFilter: TextureFilterTypes.Nearest
        //     })
        //     // depth as texture
        //     gl.framebufferTexture2D(
        //         gl.FRAMEBUFFER,
        //         gl.DEPTH_ATTACHMENT,
        //         gl.TEXTURE_2D,
        //         this.#depthTexture.glObject,
        //         0
        //     );           
        // } else {
        //     this.#texture = new Texture({
        //         gpu,
        //         width: this.width,
        //         height: this.height,
        //         mipmap,
        //         type: TextureTypes.RGBA,
        //         minFilter,
        //         magFilter
        //     });
        //     gl.framebufferTexture2D(
        //         gl.FRAMEBUFFER,
        //         gl.COLOR_ATTACHMENT0,
        //         gl.TEXTURE_2D,
        //         this.#texture.glObject,
        //         0
        //     );

        //     if(writeDepthTexture) {
        //         this.#depthTexture = new Texture({
        //             gpu,
        //             width: this.width,
        //             height: this.height,
        //             mipmap: false,
        //             type: TextureTypes.Depth,
        //             // 一旦linear固定
        //             minFilter: TextureFilterTypes.Linear,
        //             magFilter: TextureFilterTypes.Linear
        //         })
        //         // depth as texture
        //         gl.framebufferTexture2D(
        //             gl.FRAMEBUFFER,
        //             gl.DEPTH_ATTACHMENT,
        //             gl.TEXTURE_2D,
        //             this.#depthTexture.glObject,
        //             0
        //         );
        //     }
        // }
        
        if(this.type === RenderTargetTypes.RGBA) {
            this.#texture = new Texture({
                gpu,
                width: this.width,
                height: this.height,
                mipmap,
                type: TextureTypes.RGBA,
                minFilter,
                magFilter
            });
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                this.#texture.glObject,
                0
            );
        }

        if(this.type === RenderTargetTypes.Depth || writeDepthTexture) {
            this.#depthTexture = new Texture({
                gpu,
                width: this.width,
                height: this.height,
                mipmap: false,
                type: TextureTypes.Depth,
                // 一旦linear固定
                minFilter: TextureFilterTypes.Linear,
                magFilter: TextureFilterTypes.Linear
            })
            // depth as texture
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.DEPTH_ATTACHMENT,
                gl.TEXTURE_2D,
                this.#depthTexture.glObject,
                0
            );                      
        }
       
        // unbind
        gl.bindTexture(gl.TEXTURE_2D, null);
        // if (this.#depthRenderbuffer) {
        //     gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        // }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        if(this.#texture) {
            this.#texture.setSize(this.width, this.height);
        }
        if(this.#depthTexture) {
            this.#depthTexture.setSize(this.width, this.height);
        }
        // if (this.#depthRenderbuffer) {
        //     this.#depthRenderbuffer.setSize(width, height);
        // }
    }
}