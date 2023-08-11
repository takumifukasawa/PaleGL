import { Texture } from '@/PaleGL/core/Texture';
import { Framebuffer } from '@/PaleGL/core/Framebuffer';
import { GLColorAttachment, TextureFilterTypes, TextureTypes } from '@/PaleGL/constants';
import { AbstractRenderTarget } from '@/PaleGL/core/AbstractRenderTarget';
import { GPU } from '@/PaleGL/core/GPU';

// ---------------------------------------------------------
// [GBufferA: RGBA8] rgb: base color, a: unused
// [GBufferB: RGBA8] rgb: normal, a: unused
// [Depth] depth prepass depth
// ---------------------------------------------------------

// TODO: depth texture を resize しなくていいようにしたい。なぜなら depthprepassでリサイズしてるから
export class GBufferRenderTargets extends AbstractRenderTarget {
    gpu: GPU;
    name: string;
    width: number;
    height: number;
    private _framebuffer: Framebuffer;
    private _textures: Texture[] = [];
    private _gBufferATexture: Texture;
    private _gBufferBTexture: Texture;
    private _depthTexture: Texture | null = null

    get textures() {
        return this._textures;
    }

    get gBufferATexture() {
        return this._gBufferATexture;
    }

    get gBufferBTexture() {
        return this._gBufferBTexture;
    }

    get depthTexture() {
        return this._depthTexture;
    }

    get framebuffer() {
        return this._framebuffer;
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
    }
    : {
        gpu: GPU;
        name: string;
        width: number;
        height: number;
    }) {
        super();
        
        this.gpu = gpu;

        const minFilter = TextureFilterTypes.Linear;
        const magFilter = TextureFilterTypes.Linear;

        const gl = gpu.gl;

        this.name = name;

        this.width = width;
        this.height = height;

        this._framebuffer = new Framebuffer({ gpu });
        this._framebuffer.bind();

        // 1: base scene
        this._gBufferATexture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            mipmap: false,
            type: TextureTypes.RGBA,
            minFilter,
            magFilter,
        });
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0 + 0,
            gl.TEXTURE_2D,
            this._gBufferATexture.glObject,
            0
        );
        this._textures.push(this._gBufferATexture);
        this.framebuffer.registerDrawBuffer((gl.COLOR_ATTACHMENT0 + 0) as GLColorAttachment);

        // 2: normal
        this._gBufferBTexture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            mipmap: false,
            type: TextureTypes.RGBA,
            minFilter,
            magFilter,
        });
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0 + 1,
            gl.TEXTURE_2D,
            this._gBufferBTexture.glObject,
            0
        );
        this.framebuffer.registerDrawBuffer((gl.COLOR_ATTACHMENT0 + 1) as GLColorAttachment);

        this._textures.push(this._gBufferBTexture);

        // 3: depth
        // this._depthTexture = new Texture({
        //     gpu,
        //     width: this.width,
        //     height: this.height,
        //     mipmap: false,
        //     type: TextureTypes.Depth,
        //     // 一旦linear固定
        //     minFilter,
        //     magFilter,
        // });
        // // depth as texture
        // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this._depthTexture.glObject, 0);

        // unbind
        gl.bindTexture(gl.TEXTURE_2D, null);
        this.framebuffer.unbind();
    }

    setSize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this._textures.forEach((texture) => texture.setSize(this.width, this.height));
        if (this._depthTexture) {
            this._depthTexture.setSize(this.width, this.height);
        }
    }

    // TODO: render target と共通化できる
    setDepthTexture(depthTexture: Texture) {
        const gl = this.gpu.gl;
        this._depthTexture = depthTexture;
        this._framebuffer.bind();
        // depth as texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this._depthTexture.glObject, 0);
        this._framebuffer.unbind();
    }
}
