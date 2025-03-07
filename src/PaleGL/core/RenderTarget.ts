// import { Texture } from '@/PaleGL/core/Texture';
// import { Framebuffer } from '@/PaleGL/core/Framebuffer';
// import { Renderbuffer } from '@/PaleGL/core/renderbuffer.ts';
// import {
//     RenderbufferTypes,
//     RenderTargetType,
//     RenderTargetTypes,
//     TextureFilterType,
//     TextureFilterTypes,
//     TextureTypes,
//     GLColorAttachment,
//     TextureDepthPrecisionType,
//     TextureWrapTypes,
//     TextureWrapType,
//     GL_FRAMEBUFFER_COMPLETE,
//     GL_EXT_color_buffer_float,
//     GL_FRAMEBUFFER,
//     GL_DEPTH_ATTACHMENT,
//     GL_RENDERBUFFER,
//     GL_TEXTURE_2D,
//     GL_READ_FRAMEBUFFER,
//     GL_DRAW_FRAMEBUFFER,
//     GL_DEPTH_BUFFER_BIT,
//     GLTextureFilter,
// } from '@/PaleGL/constants';
// import { AbstractRenderTarget } from '@/PaleGL/core/AbstractRenderTarget';
// import { GPU } from '@/PaleGL/core/GPU';
// 
// export type RenderTargetOptions = {
//     // require
//     gpu: GPU;
//     // optional
//     width?: number;
//     height?: number;
//     name?: string;
//     type?: RenderTargetType;
//     useDepthBuffer?: boolean;
//     writeDepthTexture?: boolean;
//     minFilter?: TextureFilterType;
//     magFilter?: TextureFilterType;
//     wrapS?: TextureWrapType;
//     wrapT?: TextureWrapType;
//     mipmap?: boolean;
//     depthPrecision?: TextureDepthPrecisionType;
// };
// 
// // ref: https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html
// // TODO:
// // depth texture を外から渡す形でもいいかも
// export class RenderTarget extends AbstractRenderTarget {
//     name: string;
//     width: number;
//     height: number;
//     type: RenderTargetType;
//     _framebuffer: Framebuffer;
//     _depthRenderbuffer: Renderbuffer | null = null;
//     _texture: Texture | null = null;
//     _depthTexture: Texture | null = null;
//     _gpu;
//     
//     $getTexture() {
//         return this._texture;
//     }
// 
//     $getDepthTexture() {
//         return this._depthTexture;
//     }
// 
//     $getFramebuffer() {
//         return this._framebuffer;
//     }
// 
//     get read() {
//         return this;
//     }
// 
//     get write() {
//         return this;
//     }
//     
//     /**
//      *
//      * @param gpu
//      * @param name
//      * @param type
//      * @param width
//      * @param height
//      * @param useDepthBuffer
//      * @param writeDepthTexture
//      * @param minFilter
//      * @param magFilter
//      * @param mipmap
//      */
//     constructor({
//         gpu,
//         name = '',
//         type = RenderTargetTypes.RGBA,
//         width = 1,
//         height = 1,
//         useDepthBuffer = false,
//         writeDepthTexture = false,
//         minFilter = TextureFilterTypes.Linear,
//         magFilter = TextureFilterTypes.Linear,
//         wrapT = TextureWrapTypes.ClampToEdge,
//         wrapS = TextureWrapTypes.ClampToEdge,
//         mipmap = false,
//         depthPrecision,
//     }: RenderTargetOptions) {
//         super();
// 
//         this._gpu = gpu;
//         const gl = this._gpu.gl;
// 
//         this.name = name;
//         this.type = type;
// 
//         this.width = width;
//         this.height = height;
// 
//         this._framebuffer = new Framebuffer({ gpu });
//         this._framebuffer.bind();
// 
//         // for debug
//         // console.log(useDepthBuffer, writeDepthTexture, this.type, writeDepthTexture)
// 
//         if (useDepthBuffer) {
//             this._depthRenderbuffer = new Renderbuffer({ gpu, type: RenderbufferTypes.Depth, width, height });
//         }
// 
//         // depth as render buffer
//         if (this._depthRenderbuffer) {
//             gl.framebufferRenderbuffer(
//                 GL_FRAMEBUFFER,
//                 GL_DEPTH_ATTACHMENT,
//                 GL_RENDERBUFFER,
//                 this._depthRenderbuffer.glObject
//             );
//         }
// 
//         //
//         // create texture
//         //
//         switch (this.type) {
//             // RGBA8整数バッファ
//             case RenderTargetTypes.RGBA:
//                 this._texture = new Texture({
//                     gpu,
//                     width: this.width,
//                     height: this.height,
//                     mipmap,
//                     type: TextureTypes.RGBA,
//                     minFilter,
//                     magFilter,
//                     wrapS,
//                     wrapT,
//                 });
//                 gl.framebufferTexture2D(
//                     GL_FRAMEBUFFER,
//                     GLColorAttachment.COLOR_ATTACHMENT0,
//                     GL_TEXTURE_2D,
//                     this._texture.glObject,
//                     0
//                 );
//                 break;
// 
//             // RGBA16F浮動小数点バッファ
//             case RenderTargetTypes.RGBA16F:
//                 if (!gpu.checkExtension(GL_EXT_color_buffer_float)) {
//                     console.error('EXT_color_buffer_float not supported');
//                     return;
//                 }
//                 this._texture = new Texture({
//                     gpu,
//                     width: this.width,
//                     height: this.height,
//                     mipmap,
//                     type: TextureTypes.RGBA16F,
//                     minFilter,
//                     magFilter,
//                     wrapS,
//                     wrapT,
//                 });
//                 gl.framebufferTexture2D(
//                     GL_FRAMEBUFFER,
//                     GLColorAttachment.COLOR_ATTACHMENT0,
//                     GL_TEXTURE_2D,
//                     this._texture.glObject,
//                     0
//                 );
//                 break;
// 
//             // R11G11B10F浮動小数点バッファ
//             case RenderTargetTypes.R11F_G11F_B10F:
//                 // TODO: r11g11b10 の場合はなくてもよい？
//                 if (!gpu.checkExtension(GL_EXT_color_buffer_float)) {
//                     console.error('EXT_color_buffer_float not supported');
//                     return;
//                 }
//                 this._texture = new Texture({
//                     gpu,
//                     width: this.width,
//                     height: this.height,
//                     mipmap,
//                     type: TextureTypes.R11F_G11F_B10F,
//                     minFilter,
//                     magFilter,
//                     wrapS,
//                     wrapT,
//                 });
// 
//                 gl.framebufferTexture2D(
//                     GL_FRAMEBUFFER,
//                     GLColorAttachment.COLOR_ATTACHMENT0,
//                     GL_TEXTURE_2D,
//                     this._texture.glObject,
//                     0
//                 );
//                 break;
// 
//             case RenderTargetTypes.R16F:
//                 this._texture = new Texture({
//                     gpu,
//                     width: this.width,
//                     height: this.height,
//                     mipmap,
//                     type: TextureTypes.R16F,
//                     minFilter,
//                     magFilter,
//                     wrapS,
//                     wrapT,
//                 });
// 
//                 gl.framebufferTexture2D(
//                     GL_FRAMEBUFFER,
//                     GLColorAttachment.COLOR_ATTACHMENT0,
//                     GL_TEXTURE_2D,
//                     this._texture.glObject,
//                     0
//                 );
//                 break;
// 
//             default:
//                 break;
//         }
// 
//         // check frame buffer status for color attachment
//         if (this._texture) {
//             const checkFramebufferStatus = gl.checkFramebufferStatus(GL_FRAMEBUFFER);
//             if (checkFramebufferStatus !== GL_FRAMEBUFFER_COMPLETE) {
//                 console.error('framebuffer not completed');
//             }
//             this._framebuffer.registerDrawBuffer(GLColorAttachment.COLOR_ATTACHMENT0);
//         }
// 
//         // 深度バッファをテクスチャとして扱う場合
//         if (this.type === RenderTargetTypes.Depth || writeDepthTexture) {
//             this._depthTexture = new Texture({
//                 gpu,
//                 width: this.width,
//                 height: this.height,
//                 mipmap: false,
//                 type: TextureTypes.Depth,
//                 // 一旦linear固定
//                 // minFilter: TextureFilterTypes.Linear,
//                 // magFilter: TextureFilterTypes.Linear
//                 minFilter,
//                 magFilter,
//                 wrapS,
//                 wrapT,
//                 depthPrecision,
//             });
//             // depth as texture
//             gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, this._depthTexture.glObject, 0);
//         }
// 
//         // depth texture と depth render buffer は両立できないので確認のエラー
//         if (this._depthTexture && this._depthRenderbuffer) {
//             console.error('[RenderTarget.constructor] depth texture and depth render buffer are active.');
//         }
// 
//         //
//         // TODO: check frame buffer depth status
//         //
// 
//         // unbind
//         gl.bindTexture(GL_TEXTURE_2D, null);
//         if (this._depthRenderbuffer) {
//             gl.bindRenderbuffer(GL_RENDERBUFFER, null);
//         }
//         // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
//         this._framebuffer.unbind();
//         // Framebuffer.unbind();
//     }
// 
//     /**
//      *
//      * @param width
//      * @param height
//      */
//     setSize(width: number, height: number) {
//         // this.width = width;
//         // this.height = height;
//         this.width = Math.floor(width);
//         this.height = Math.floor(height);
//         if (this._texture) {
//             this._texture.setSize(this.width, this.height);
//         }
//         if (this._depthTexture) {
//             this._depthTexture.setSize(this.width, this.height);
//         }
//         if (this._depthRenderbuffer) {
//             this._depthRenderbuffer.setSize(width, height);
//         }
//     }
// 
//     /**
//      *
//      * @param texture
//      */
//     setTexture(texture: Texture) {
//         const gl = this._gpu.gl;
//         this._texture = texture;
//         gl.bindFramebuffer(GL_FRAMEBUFFER, this._framebuffer.glObject);
//         gl.framebufferTexture2D(
//             GL_FRAMEBUFFER,
//             GLColorAttachment.COLOR_ATTACHMENT0,
//             GL_TEXTURE_2D,
//             this._texture.glObject,
//             0
//         );
//         gl.bindFramebuffer(GL_FRAMEBUFFER, null);
//     }
// 
//     /**
//      *
//      * @param depthTexture
//      */
//     setDepthTexture(depthTexture: Texture) {
//         const gl = this._gpu.gl;
//         this._depthTexture = depthTexture;
//         this._framebuffer.bind();
//         // depth as texture
//         gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, this._depthTexture.glObject, 0);
//         this._framebuffer.unbind();
//     }
// 
//     /**
//      *
//      * @param gpu
//      * @param sourceRenderTarget
//      * @param destRenderTarget
//      * @param width
//      * @param height
//      */
//     static blitDepth({
//         gpu,
//         sourceRenderTarget,
//         destRenderTarget,
//         width,
//         height,
//     }: {
//         gpu: GPU;
//         sourceRenderTarget: RenderTarget;
//         destRenderTarget: RenderTarget;
//         width: number;
//         height: number;
//     }) {
//         const gl = gpu.gl;
//         gl.bindFramebuffer(GL_READ_FRAMEBUFFER, sourceRenderTarget.$getFramebuffer().glObject);
//         gl.bindFramebuffer(GL_DRAW_FRAMEBUFFER, destRenderTarget.$getFramebuffer().glObject);
// 
//         gl.clear(GL_DEPTH_BUFFER_BIT);
// 
//         // NOTE: 本来は呼ぶべきだが呼び出しが重い。エラーを確認したいときは必ず有効にする
//         // if (gl.checkFramebufferStatus(GL_READ_FRAMEBUFFER) !== GL_FRAMEBUFFER_COMPLETE) {
//         //     console.error('[RenderTarget.blitDepth] invalid state');
//         //     return;
//         // }
//       
//         gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, GL_DEPTH_BUFFER_BIT, GLTextureFilter.NEAREST);
//         gl.bindFramebuffer(GL_READ_FRAMEBUFFER, null);
//         gl.bindFramebuffer(GL_DRAW_FRAMEBUFFER, null);
//     }
// }


import { Texture } from '@/PaleGL/core/Texture';
import {
    bindFramebuffer,
    createFramebuffer,
    Framebuffer,
    registerDrawBufferToFramebuffer, unbindFramebuffer,
} from '@/PaleGL/core/framebuffer.ts';
import { createRenderbuffer, Renderbuffer, setRenderbufferSize } from '@/PaleGL/core/renderbuffer.ts';
import {
    RenderbufferTypes,
    RenderTargetType,
    RenderTargetTypes,
    TextureFilterType,
    TextureFilterTypes,
    TextureTypes,
    GLColorAttachment,
    TextureDepthPrecisionType,
    TextureWrapTypes,
    TextureWrapType,
    GL_FRAMEBUFFER_COMPLETE,
    GL_EXT_color_buffer_float,
    GL_FRAMEBUFFER,
    GL_DEPTH_ATTACHMENT,
    GL_RENDERBUFFER,
    GL_TEXTURE_2D,
    GL_READ_FRAMEBUFFER,
    GL_DRAW_FRAMEBUFFER,
    GL_DEPTH_BUFFER_BIT,
    GLTextureFilter, RenderTargetKind, RenderTargetKinds,
} from '@/PaleGL/constants';
import { AbstractRenderTarget } from '@/PaleGL/core/AbstractRenderTarget';
import { GPU } from '@/PaleGL/core/GPU';
import { SetRenderTargetSizeFunc } from '@/PaleGL/core/renderTargetBehaviours.ts';

export type RenderTargetOptions = {
    // require
    gpu: GPU;
    renderTargetKind?: RenderTargetKind;
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
    renderTargetKind: RenderTargetKind;
    type: RenderTargetType;
    framebuffer: Framebuffer;
    _depthRenderbuffer: Renderbuffer | null = null;
    _texture: Texture | null = null;
    _depthTexture: Texture | null = null;
    _gpu;

    $getTexture() {
        return this._texture;
    }

    $getDepthTexture() {
        return this._depthTexture;
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
                    renderTargetKind = RenderTargetKinds.Default,
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

        this._gpu = gpu;
        const gl = this._gpu.gl;

        this.name = name;

        this.renderTargetKind = renderTargetKind;
        this.type = type;

        this.width = width;
        this.height = height;

        this.framebuffer = createFramebuffer({ gpu });

        bindFramebuffer(this.framebuffer);

        // for debug
        // console.log(useDepthBuffer, writeDepthTexture, this.type, writeDepthTexture)

        if (useDepthBuffer) {
            this._depthRenderbuffer = createRenderbuffer(gpu, RenderbufferTypes.Depth, this.width, this.height);
        }

        // depth as render buffer
        if (this._depthRenderbuffer) {
            gl.framebufferRenderbuffer(
                GL_FRAMEBUFFER,
                GL_DEPTH_ATTACHMENT,
                GL_RENDERBUFFER,
                this._depthRenderbuffer.glObject,
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
                gl.framebufferTexture2D(
                    GL_FRAMEBUFFER,
                    GLColorAttachment.COLOR_ATTACHMENT0,
                    GL_TEXTURE_2D,
                    this._texture.glObject,
                    0,
                );
                break;

            // RGBA16F浮動小数点バッファ
            case RenderTargetTypes.RGBA16F:
                if (!gpu.checkExtension(GL_EXT_color_buffer_float)) {
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
                gl.framebufferTexture2D(
                    GL_FRAMEBUFFER,
                    GLColorAttachment.COLOR_ATTACHMENT0,
                    GL_TEXTURE_2D,
                    this._texture.glObject,
                    0,
                );
                break;

            // R11G11B10F浮動小数点バッファ
            case RenderTargetTypes.R11F_G11F_B10F:
                // TODO: r11g11b10 の場合はなくてもよい？
                if (!gpu.checkExtension(GL_EXT_color_buffer_float)) {
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

                gl.framebufferTexture2D(
                    GL_FRAMEBUFFER,
                    GLColorAttachment.COLOR_ATTACHMENT0,
                    GL_TEXTURE_2D,
                    this._texture.glObject,
                    0,
                );
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

                gl.framebufferTexture2D(
                    GL_FRAMEBUFFER,
                    GLColorAttachment.COLOR_ATTACHMENT0,
                    GL_TEXTURE_2D,
                    this._texture.glObject,
                    0,
                );
                break;

            default:
                break;
        }

        // check frame buffer status for color attachment
        if (this._texture) {
            const checkFramebufferStatus = gl.checkFramebufferStatus(GL_FRAMEBUFFER);
            if (checkFramebufferStatus !== GL_FRAMEBUFFER_COMPLETE) {
                console.error('framebuffer not completed');
            }
            registerDrawBufferToFramebuffer(this.framebuffer, GLColorAttachment.COLOR_ATTACHMENT0);
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
            gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, this._depthTexture.glObject, 0);
        }

        // depth texture と depth render buffer は両立できないので確認のエラー
        if (this._depthTexture && this._depthRenderbuffer) {
            console.error('[RenderTarget.constructor] depth texture and depth render buffer are active.');
        }

        //
        // TODO: check frame buffer depth status
        //

        // unbind
        gl.bindTexture(GL_TEXTURE_2D, null);
        if (this._depthRenderbuffer) {
            gl.bindRenderbuffer(GL_RENDERBUFFER, null);
        }
        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        unbindFramebuffer(this.framebuffer);
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
        if (this._depthRenderbuffer) {
            setRenderbufferSize(this._depthRenderbuffer, width, height);
        }
    }

    /**
     *
     * @param texture
     */
    setTexture(texture: Texture) {
        const gl = this._gpu.gl;
        this._texture = texture;
        gl.bindFramebuffer(GL_FRAMEBUFFER, this.framebuffer.glObject);
        gl.framebufferTexture2D(
            GL_FRAMEBUFFER,
            GLColorAttachment.COLOR_ATTACHMENT0,
            GL_TEXTURE_2D,
            this._texture.glObject,
            0,
        );
        gl.bindFramebuffer(GL_FRAMEBUFFER, null);
    }

    /**
     *
     * @param depthTexture
     */
    setDepthTexture(depthTexture: Texture) {
        const gl = this._gpu.gl;
        this._depthTexture = depthTexture;
        bindFramebuffer(this.framebuffer);
        // depth as texture
        gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, this._depthTexture.glObject, 0);
        unbindFramebuffer(this.framebuffer);
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
        gl.bindFramebuffer(GL_READ_FRAMEBUFFER, sourceRenderTarget.framebuffer.glObject);
        gl.bindFramebuffer(GL_DRAW_FRAMEBUFFER, destRenderTarget.framebuffer.glObject);

        gl.clear(GL_DEPTH_BUFFER_BIT);

        // NOTE: 本来は呼ぶべきだが呼び出しが重い。エラーを確認したいときは必ず有効にする
        // if (gl.checkFramebufferStatus(GL_READ_FRAMEBUFFER) !== GL_FRAMEBUFFER_COMPLETE) {
        //     console.error('[RenderTarget.blitDepth] invalid state');
        //     return;
        // }

        gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, GL_DEPTH_BUFFER_BIT, GLTextureFilter.NEAREST);
        gl.bindFramebuffer(GL_READ_FRAMEBUFFER, null);
        gl.bindFramebuffer(GL_DRAW_FRAMEBUFFER, null);
    }
}

export type RenderTargetBase = {
    isSwappable: boolean; // TODO: kind=doublebufferで対応したい
    renderTargetKind: RenderTargetKind
}

export function createRenderTargetBase(renderTargetKind: RenderTargetKind, isSwappable: boolean): RenderTargetBase {
    return { renderTargetKind, isSwappable };
}

export const setRenderTargetSize: SetRenderTargetSizeFunc = (renderTargetBase: RenderTargetBase, width: number, height: number) => {
    const renderTarget = renderTargetBase as RenderTarget;
    const w = Math.floor(width);
    const h = Math.floor(height);
    renderTarget.width = w;
    renderTarget.height = h;
    if (renderTarget._texture) {
        renderTarget._texture.setSize(w, h);
    }
    if (renderTarget._depthTexture) {
        renderTarget._depthTexture.setSize(w, h);
    }
    if (renderTarget._depthRenderbuffer) {
        setRenderbufferSize(renderTarget._depthRenderbuffer, w, h);
    }
};
