import {Texture} from "@/PaleGL/core/Texture";
import {Framebuffer} from "@/PaleGL/core/Framebuffer";
// import {Renderbuffer} from "./Renderbuffer";
// import {RenderbufferTypes, RenderTargetTypes, TextureFilterTypes, TextureTypes} from "@/PaleGL/constants";
import {GLColorAttachment, TextureFilterTypes, TextureTypes} from "@/PaleGL/constants";
import {AbstractRenderTarget} from "@/PaleGL/core/AbstractRenderTarget";
import {GPU} from "@/PaleGL/core/GPU";

// NOTE:
// renderer用
export class GBufferRenderTargets extends AbstractRenderTarget {
    name: string;
    #framebuffer: Framebuffer;
    // #depthRenderbuffer;
    width: number;
    height: number;
    #textures: Texture[] = [];
    #baseColorTexture: Texture;
    #normalTexture: Texture;
    #depthTexture: Texture;

    // type;

    get textures() {
        return this.#textures;
    }

    get baseColorTexture() {
        return this.#baseColorTexture;
    }

    get normalTexture() {
        return this.#normalTexture;
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
                    // type = RenderTargetTypes.RGBA,
                    width = 1,
                    height = 1,
                    // useDepthBuffer = false,
                    // writeDepthTexture = false,
                    // mipmap = false,
                }: { gpu: GPU, name: string, width: number, height: number }) {
        super();

        const minFilter = TextureFilterTypes.Linear;
        const magFilter = TextureFilterTypes.Linear;

        const gl = gpu.gl;

        this.name = name;
        // this.type = type;

        this.width = width;
        this.height = height;

        this.#framebuffer = new Framebuffer({gpu});
        this.#framebuffer.bind();

        // if (useDepthBuffer) {
        //     this.#depthRenderbuffer = new Renderbuffer({gpu, type: RenderbufferTypes.Depth, width, height});
        // }

        // depth as render buffer
        // if (this.#depthRenderbuffer) {
        //     gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.#depthRenderbuffer.glObject);
        // }

        // 1: base scene
        this.#baseColorTexture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            mipmap: false,
            type: TextureTypes.RGBA,
            minFilter,
            magFilter
        });
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0 + 0,
            gl.TEXTURE_2D,
            this.#baseColorTexture.glObject,
            0
        );
        this.#textures.push(this.#baseColorTexture);
        this.framebuffer.registerDrawBuffer((gl.COLOR_ATTACHMENT0 + 0) as GLColorAttachment);

        // 2: normal
        this.#normalTexture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            mipmap: false,
            type: TextureTypes.RGBA,
            minFilter,
            magFilter
        });
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0 + 1,
            gl.TEXTURE_2D,
            this.#normalTexture.glObject,
            0
        );
        this.framebuffer.registerDrawBuffer((gl.COLOR_ATTACHMENT0 + 1) as GLColorAttachment);

        this.#textures.push(this.#normalTexture);

        // 3: depth
        this.#depthTexture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            mipmap: false,
            type: TextureTypes.Depth,
            // 一旦linear固定
            minFilter,
            magFilter
            // minFilter: TextureFilterTypes.Nearest,
            // magFilter: TextureFilterTypes.Nearest
        })
        // depth as texture
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.TEXTURE_2D,
            this.#depthTexture.glObject,
            0
        );

        // if(this.#depthTexture && this.#depthRenderbuffer) {
        //     throw "[RenderTarget.constructor] depth texture and depth render buffer are active.";
        // }

        // unbind
        // TODO: fix-type
        // @ts-ignore
        gl.bindTexture(gl.TEXTURE_2D, null);
        // if (this.#depthRenderbuffer) {
        //     gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        // }
        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.framebuffer.unbind();
        // Framebuffer.unbind();
    }

    setSize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.#textures.forEach(texture => texture.setSize(this.width, this.height));
        if (this.#depthTexture) {
            this.#depthTexture.setSize(this.width, this.height);
        }
        // if (this.#depthRenderbuffer) {
        //     this.#depthRenderbuffer.setSize(width, height);
        // }
    }
}
