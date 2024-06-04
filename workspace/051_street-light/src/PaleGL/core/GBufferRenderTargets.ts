import { Texture } from '@/PaleGL/core/Texture';
import { Framebuffer } from '@/PaleGL/core/Framebuffer';
import { GLColorAttachment, TextureFilterTypes, TextureTypes } from '@/PaleGL/constants';
import { AbstractRenderTarget } from '@/PaleGL/core/AbstractRenderTarget';
import { GPU } from '@/PaleGL/core/GPU';

// ---------------------------------------------------------------------
// TODO: B,Cはまとめられる気がする
// TODO: shading model は RGB10A2 で rgb: normal + a: shading model でいい気がする
// [GBufferA: RGBA8] rgb: base color
// [GBufferB: RGBA8] rgb: normal, a: shading model
// [GBufferC: RGBA8] r: metallic, g: roughness
// [GBufferD: R11G11B10] rgb: emissive color
// [Depth] depth prepass depth
// ---------------------------------------------------------------------

// TODO: depth texture を resize しなくていいようにしたい。なぜなら depthprepassでリサイズしてるから
export class GBufferRenderTargets extends AbstractRenderTarget {
    gpu: GPU;
    name: string;
    width: number;
    height: number;
    private _framebuffer: Framebuffer;
    private _gBufferTextures: Texture[] = [];
    private _gBufferATexture: Texture;
    private _gBufferBTexture: Texture;
    private _gBufferCTexture: Texture;
    private _gBufferDTexture: Texture;
    private _depthTexture: Texture | null = null;

    // get textures() {
    //     return this._gBufferTextures;
    // }

    get gBufferATexture() {
        return this._gBufferATexture;
    }

    get gBufferBTexture() {
        return this._gBufferBTexture;
    }

    get gBufferCTexture() {
        return this._gBufferCTexture;
    }
    
    get gBufferDTexture() {
        return this._gBufferDTexture;
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

    constructor({ gpu, name, width = 1, height = 1 }: { gpu: GPU; name: string; width: number; height: number }) {
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

        //
        // 1: GBufferA
        //
        const gBufferAAttachment = gl.COLOR_ATTACHMENT0 + 0;
        this._gBufferATexture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            mipmap: false,
            type: TextureTypes.RGBA,
            minFilter,
            magFilter,
        });
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gBufferAAttachment, gl.TEXTURE_2D, this._gBufferATexture.glObject, 0);
        this._gBufferTextures.push(this._gBufferATexture);
        this.framebuffer.registerDrawBuffer(gBufferAAttachment as GLColorAttachment);

        //
        // 2: GBufferB
        //
        const gBufferBAttachment = gl.COLOR_ATTACHMENT0 + 1;
        this._gBufferBTexture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            mipmap: false,
            type: TextureTypes.RGBA,
            minFilter,
            magFilter,
        });
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gBufferBAttachment, gl.TEXTURE_2D, this._gBufferBTexture.glObject, 0);
        this.framebuffer.registerDrawBuffer(gBufferBAttachment as GLColorAttachment);
        this._gBufferTextures.push(this._gBufferBTexture);

        //
        // 3: GBufferC
        //
        const gBufferCAttachment = gl.COLOR_ATTACHMENT0 + 2;
        this._gBufferCTexture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            mipmap: false,
            type: TextureTypes.RGBA,
            minFilter,
            magFilter,
        });
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gBufferCAttachment, gl.TEXTURE_2D, this._gBufferCTexture.glObject, 0);
        this.framebuffer.registerDrawBuffer(gBufferCAttachment as GLColorAttachment);
        this._gBufferTextures.push(this._gBufferCTexture);

        //
        // 4: GBufferD
        //
        const gBufferDAttachment = gl.COLOR_ATTACHMENT0 + 3;
        this._gBufferDTexture = new Texture({
            gpu,
            width: this.width,
            height: this.height,
            mipmap: false,
            type: TextureTypes.R11F_G11F_B10F,
            minFilter,
            magFilter,
        });
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gBufferDAttachment, gl.TEXTURE_2D, this._gBufferDTexture.glObject, 0);
        this.framebuffer.registerDrawBuffer(gBufferDAttachment as GLColorAttachment);
        this._gBufferTextures.push(this._gBufferDTexture);

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
        this._gBufferTextures.forEach((texture) => texture.setSize(this.width, this.height));
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
