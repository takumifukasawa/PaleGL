import {Texture} from "./Texture.js";
import {Framebuffer} from "./Framebuffer.js";
import {Renderbuffer} from "./Renderbuffer.js";
import {
    RenderbufferTypes,
    RenderTargetType,
    RenderTargetTypes, TextureFilterType,
    TextureFilterTypes,
    TextureTypes
} from "./../constants.js";
import {AbstractRenderTarget} from "./AbstractRenderTarget.js";
import {GPU} from "./GPU";

// TODO:
// depth texture を外から渡す形でもいいかも
export class RenderTarget extends AbstractRenderTarget {
    name;
    width;
    height;
    type: RenderTargetType;
    private framebuffer: Framebuffer;
    private depthRenderbuffer: Renderbuffer;
    private texture: Texture | null = null;
    private depthTexture: Texture | null = null;
    private gpu;

    get texture() {
        return this.texture;
    }
    
    get depthTexture() {
        return this.depthTexture;
    }

    get framebuffer() {
        return this.framebuffer;
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
        writeDepthTexture = false,
        minFilter = TextureFilterTypes.Linear,
        magFilter = TextureFilterTypes.Linear,
        mipmap = false,
    }: {
        // require
        gpu: GPU,
        width: number,
        height: number,
        // optional
        name?: string,
        type?: RenderTargetType,
        useDepthBuffer?: boolean,
        writeDepthTexture? :boolean,
        minFilter?: TextureFilterType,
        magFilter?: TextureFilterType,
        mipmap?: boolean,
        
    }) {
        super();

        this.gpu = gpu;
        const gl = this.gpu.gl;

        this.name = name;
        this.type = type;
        
        this.width = width;
        this.height = height;

        this.framebuffer = new Framebuffer({gpu});
        this.framebuffer.bind();

        if (useDepthBuffer) {
            this.depthRenderbuffer = new Renderbuffer({gpu, type: RenderbufferTypes.Depth, width, height});
        }

        // depth as render buffer
        if (this.depthRenderbuffer) {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthRenderbuffer.glObject);
        }
        
        if(this.type === RenderTargetTypes.RGBA) {
            this.texture = new Texture({
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
                this.texture.glObject,
                0
            );

            this.framebuffer.registerDrawBuffer(gl.COLOR_ATTACHMENT0);
        }

        if(this.type === RenderTargetTypes.Depth || writeDepthTexture) {
            this.depthTexture = new Texture({
                gpu,
                width: this.width,
                height: this.height,
                mipmap: false,
                type: TextureTypes.Depth,
                // 一旦linear固定
                // minFilter: TextureFilterTypes.Linear,
                // magFilter: TextureFilterTypes.Linear
                minFilter,
                magFilter
            })
            // depth as texture
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.DEPTH_ATTACHMENT,
                gl.TEXTURE_2D,
                this.depthTexture.glObject,
                0
            );                      
        }
        
        if(this.depthTexture && this.depthRenderbuffer) {
            throw "[RenderTarget.constructor] depth texture and depth render buffer are active.";
        }

        // unbind
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (this.depthRenderbuffer) {
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }
        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.framebuffer.unbind();
        // Framebuffer.unbind();
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        if(this.texture) {
            this.texture.setSize(this.width, this.height);
        }
        if(this.depthTexture) {
            this.depthTexture.setSize(this.width, this.height);
        }
        if (this.depthRenderbuffer) {
            this.depthRenderbuffer.setSize(width, height);
        }
    }
    
    setTexture(texture) {
        const gl = this.gpu.gl;
        this.texture = texture;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer.glObject);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.texture.glObject,
            0
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    setDepthTexture(depthTexture) {
        const gl = this.gpu.gl;
        this.depthTexture = depthTexture;
        this.framebuffer.bind();
        // gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer.glObject);
        // depth as texture
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.TEXTURE_2D,
            this.depthTexture.glObject,
            0
        );
        // Framebuffer.unbind();
        this.framebuffer.unbind();
        // // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    static blitDepth({ gpu, sourceRenderTarget, destRenderTarget, width, height }) {
        const gl = gpu.gl;
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, sourceRenderTarget.framebuffer.glObject);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, destRenderTarget.framebuffer.glObject);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        if(gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error("invalid state");
            return;
        }
        gl.blitFramebuffer(
            0, 0,
            width, height,
            0, 0,
            width, height,
            gl.DEPTH_BUFFER_BIT,
            gl.NEAREST
        );
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    }
}
