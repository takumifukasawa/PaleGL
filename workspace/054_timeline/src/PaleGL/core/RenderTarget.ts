import { Texture } from '@/PaleGL/core/Texture';
import { Framebuffer } from '@/PaleGL/core/Framebuffer';
import { Renderbuffer } from '@/PaleGL/core/Renderbuffer';
import {
    RenderbufferTypes,
    RenderTargetType,
    RenderTargetTypes,
    TextureFilterType,
    TextureFilterTypes,
    TextureTypes,
    GLColorAttachment,
    GLFrameBufferStatus,
    GLExtensionName,
    TextureDepthPrecisionType, TextureWrapTypes, TextureWrapType,
} from '@/PaleGL/constants';
import { AbstractRenderTarget } from '@/PaleGL/core/AbstractRenderTarget';
import { GPU } from '@/PaleGL/core/GPU';

export type RenderTargetOptions = {
    // require
    gpu: GPU;
    // optional
    width?: number;
    height?: number;
    name?: string;
    type?: RenderTargetType;
    useDepthBuffer?: boolean;
    writeDepthTexture?: boolean;
    minFilter?: TextureFilterType;
    magFilter?: TextureFilterType;
    wrapS?: TextureWrapType;
    wrapT?: TextureWrapType;
    mipmap?: boolean;
    depthPrecision?: TextureDepthPrecisionType;
};

// ref: https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html
// TODO:
// depth texture を外から渡す形でもいいかも
export class RenderTarget extends AbstractRenderTarget {
    name: string;
    width: number;
    height: number;
    type: RenderTargetType;
    private _framebuffer: Framebuffer;
    private depthRenderbuffer: Renderbuffer | null = null;
    private _texture: Texture | null = null;
    private _depthTexture: Texture | null = null;
    private gpu;

    get texture() {
        return this._texture;
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

    /**
     *
     * @param gpu
     * @param name
     * @param type
     * @param width
     * @param height
     * @param useDepthBuffer
     * @param writeDepthTexture
     * @param minFilter
     * @param magFilter
     * @param mipmap
     */
    constructor({
        gpu,
        name = '',
        type = RenderTargetTypes.RGBA,
        width = 1,
        height = 1,
        useDepthBuffer = false,
        writeDepthTexture = false,
        minFilter = TextureFilterTypes.Linear,
        magFilter = TextureFilterTypes.Linear,
        wrapT = TextureWrapTypes.ClampToEdge,
        wrapS = TextureWrapTypes.ClampToEdge,
        mipmap = false,
        depthPrecision,
    }: RenderTargetOptions) {
        super();

        this.gpu = gpu;
        const gl = this.gpu.gl;

        this.name = name;
        this.type = type;

        this.width = width;
        this.height = height;

        this._framebuffer = new Framebuffer({ gpu });
        this._framebuffer.bind();

        // for debug
        // console.log(useDepthBuffer, writeDepthTexture, this.type, writeDepthTexture)

        if (useDepthBuffer) {
            this.depthRenderbuffer = new Renderbuffer({ gpu, type: RenderbufferTypes.Depth, width, height });
        }

        // depth as render buffer
        if (this.depthRenderbuffer) {
            gl.framebufferRenderbuffer(
                gl.FRAMEBUFFER,
                gl.DEPTH_ATTACHMENT,
                gl.RENDERBUFFER,
                this.depthRenderbuffer.glObject
            );
        }

        //
        // create texture
        //
        switch (this.type) {
            // RGBA8整数バッファ
            case RenderTargetTypes.RGBA:
                this._texture = new Texture({
                    gpu,
                    width: this.width,
                    height: this.height,
                    mipmap,
                    type: TextureTypes.RGBA,
                    minFilter,
                    magFilter,
                    wrapS,
                    wrapT,
                });
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture.glObject, 0);
                break;

            // RGBA16F浮動小数点バッファ
            case RenderTargetTypes.RGBA16F:
                if (!gpu.checkExtension(GLExtensionName.ColorBufferFloat)) {
                    console.error('EXT_color_buffer_float not supported');
                    return;
                }
                this._texture = new Texture({
                    gpu,
                    width: this.width,
                    height: this.height,
                    mipmap,
                    type: TextureTypes.RGBA16F,
                    minFilter,
                    magFilter,
                    wrapS,
                    wrapT,
                });
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture.glObject, 0);
                break;

            // R11G11B10F浮動小数点バッファ
            case RenderTargetTypes.R11F_G11F_B10F:
                // TODO: r11g11b10 の場合はなくてもよい？
                if (!gpu.checkExtension(GLExtensionName.ColorBufferFloat)) {
                    console.error('EXT_color_buffer_float not supported');
                    return;
                }
                this._texture = new Texture({
                    gpu,
                    width: this.width,
                    height: this.height,
                    mipmap,
                    type: TextureTypes.R11F_G11F_B10F,
                    minFilter,
                    magFilter,
                    wrapS,
                    wrapT,
                });

                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture.glObject, 0);
                break;

            case RenderTargetTypes.R16F:
                this._texture = new Texture({
                    gpu,
                    width: this.width,
                    height: this.height,
                    mipmap,
                    type: TextureTypes.R16F,
                    minFilter,
                    magFilter,
                    wrapS,
                    wrapT,
                });

                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture.glObject, 0);
                break;

            default:
                break;
        }

        // check frame buffer status for color attachment
        if (this._texture) {
            const checkFramebufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if (checkFramebufferStatus !== GLFrameBufferStatus.FRAMEBUFFER_COMPLETE) {
                throw 'framebuffer not completed';
            }
            this._framebuffer.registerDrawBuffer(GLColorAttachment.COLOR_ATTACHMENT0);
        }

        // 深度バッファをテクスチャとして扱う場合
        if (this.type === RenderTargetTypes.Depth || writeDepthTexture) {
            this._depthTexture = new Texture({
                gpu,
                width: this.width,
                height: this.height,
                mipmap: false,
                type: TextureTypes.Depth,
                // 一旦linear固定
                // minFilter: TextureFilterTypes.Linear,
                // magFilter: TextureFilterTypes.Linear
                minFilter,
                magFilter,
                wrapS,
                wrapT,
                depthPrecision,
            });
            // depth as texture
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this._depthTexture.glObject, 0);
        }

        // depth texture と depth render buffer は両立できないので確認のエラー
        if (this._depthTexture && this.depthRenderbuffer) {
            throw '[RenderTarget.constructor] depth texture and depth render buffer are active.';
        }

        //
        // TODO: check frame buffer depth status
        //

        // unbind
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (this.depthRenderbuffer) {
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }
        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this._framebuffer.unbind();
        // Framebuffer.unbind();
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        // this.width = width;
        // this.height = height;
        this.width = Math.floor(width);
        this.height = Math.floor(height);
        if (this._texture) {
            this._texture.setSize(this.width, this.height);
        }
        if (this._depthTexture) {
            this._depthTexture.setSize(this.width, this.height);
        }
        if (this.depthRenderbuffer) {
            this.depthRenderbuffer.setSize(width, height);
        }
    }

    /**
     *
     * @param texture
     */
    setTexture(texture: Texture) {
        const gl = this.gpu.gl;
        this._texture = texture;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer.glObject);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture.glObject, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /**
     *
     * @param depthTexture
     */
    setDepthTexture(depthTexture: Texture) {
        const gl = this.gpu.gl;
        this._depthTexture = depthTexture;
        this._framebuffer.bind();
        // depth as texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this._depthTexture.glObject, 0);
        this._framebuffer.unbind();
    }

    /**
     *
     * @param gpu
     * @param sourceRenderTarget
     * @param destRenderTarget
     * @param width
     * @param height
     */
    static blitDepth({
        gpu,
        sourceRenderTarget,
        destRenderTarget,
        width,
        height,
    }: {
        gpu: GPU;
        sourceRenderTarget: RenderTarget;
        destRenderTarget: RenderTarget;
        width: number;
        height: number;
    }) {
        const gl = gpu.gl;
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, sourceRenderTarget.framebuffer.glObject);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, destRenderTarget.framebuffer.glObject);
        // gl.clearColor(0, 0, 0, 1);
        // gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        if (gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('[RenderTarget.blitDepth] invalid state');
            return;
        }
        gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    }
}
