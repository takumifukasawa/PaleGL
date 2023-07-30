import { Texture } from '@/PaleGL/core/Texture';
import { Framebuffer } from '@/PaleGL/core/Framebuffer';
import { GLColorAttachment, TextureFilterTypes, TextureTypes } from '@/PaleGL/constants';
import { AbstractRenderTarget } from '@/PaleGL/core/AbstractRenderTarget';
import { GPU } from '@/PaleGL/core/GPU';

export class GBufferRenderTargets extends AbstractRenderTarget {
    gpu: GPU;
    name: string;
    width: number;
    height: number;
    private _framebuffer: Framebuffer;
    private _textures: Texture[] = [];
    private _baseColorTexture: Texture;
    private _normalTexture: Texture;
    private _depthTexture: Texture | null = null

    get textures() {
        return this._textures;
    }

    get baseColorTexture() {
        return this._baseColorTexture;
    }

    get normalTexture() {
        return this._normalTexture;
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
        this._baseColorTexture = new Texture({
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
            this._baseColorTexture.glObject,
            0
        );
        this._textures.push(this._baseColorTexture);
        this.framebuffer.registerDrawBuffer((gl.COLOR_ATTACHMENT0 + 0) as GLColorAttachment);

        // 2: normal
        this._normalTexture = new Texture({
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
            this._normalTexture.glObject,
            0
        );
        this.framebuffer.registerDrawBuffer((gl.COLOR_ATTACHMENT0 + 1) as GLColorAttachment);

        this._textures.push(this._normalTexture);

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
