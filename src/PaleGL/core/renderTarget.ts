import { createTexture, setTextureSize, Texture } from '@/PaleGL/core/texture.ts';
import {
    bindFramebuffer,
    createFramebuffer,
    Framebuffer,
    registerDrawBufferToFramebuffer,
    unbindFramebuffer,
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
    GLTextureFilter,
    RenderTargetKind,
    RenderTargetKinds, GL_COLOR_BUFFER_BIT,
} from '@/PaleGL/constants';
import { checkGPUExtension, Gpu } from '@/PaleGL/core/gpu.ts';
import { SetRenderTargetSizeFunc } from '@/PaleGL/core/renderTargetBehaviours.ts';

export type RenderTargetOptions = {
    // require
    gpu: Gpu;
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

export type RenderTarget = RenderTargetBase & {
    gpu: Gpu;
    type: RenderTargetType;
    name: string;
    width: number;
    height: number;
    framebuffer: Framebuffer;
    depthRenderbuffer: Renderbuffer | null;
    texture: Texture | null;
    depthTexture: Texture | null;
};

// ref: https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html
// TODO:
// depth texture を外から渡す形でもいいかも
export function createRenderTarget({
    gpu,
    name,
    renderTargetKind,
    type,
    width,
    height,
    useDepthBuffer,
    writeDepthTexture,
    minFilter,
    magFilter,
    wrapT,
    wrapS,
    mipmap,
    depthPrecision,
}: RenderTargetOptions): RenderTarget {
    // default variables
    name = name ?? '';
    renderTargetKind = renderTargetKind ?? RenderTargetKinds.Default;
    type = type ?? RenderTargetTypes.RGBA;
    width = width ?? 1;
    height = height ?? 1;
    useDepthBuffer = useDepthBuffer ?? false;
    writeDepthTexture = writeDepthTexture ?? false;
    minFilter = minFilter ?? TextureFilterTypes.Linear;
    magFilter = magFilter ?? TextureFilterTypes.Linear;
    wrapT = wrapT ?? TextureWrapTypes.ClampToEdge;
    wrapS = wrapS ?? TextureWrapTypes.ClampToEdge;
    mipmap = mipmap ?? false;

    const gl = gpu.gl;

    const framebuffer = createFramebuffer({ gpu });
    let depthRenderbuffer: Renderbuffer | null = null;
    let texture: Texture | null = null;
    let depthTexture: Texture | null = null;

    bindFramebuffer(framebuffer);

    // for debug
    // console.log(useDepthBuffer, writeDepthTexture, this.type, writeDepthTexture)

    if (useDepthBuffer) {
        depthRenderbuffer = createRenderbuffer(gpu, RenderbufferTypes.Depth, width, height);
    }

    // depth as render buffer
    if (depthRenderbuffer) {
        gl.framebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_RENDERBUFFER, depthRenderbuffer.glObject);
    }

    const textureName = `${name}/texture`;

    //
    // create texture
    //
    switch (type) {
        // RGBA8整数バッファ
        case RenderTargetTypes.RGBA:
            texture = createTexture({
                gpu,
                name: textureName,
                width,
                height,
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
                texture.glObject,
                0
            );
            break;

        // RGBA16F浮動小数点バッファ
        case RenderTargetTypes.RGBA16F:
            if (!checkGPUExtension(gpu, GL_EXT_color_buffer_float)) {
                console.error('EXT_color_buffer_float not supported');
                // return;
            }
            texture = createTexture({
                gpu,
                name: textureName,
                width,
                height,
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
                texture.glObject,
                0
            );
            break;

        // R11G11B10F浮動小数点バッファ
        case RenderTargetTypes.R11F_G11F_B10F:
            // TODO: r11g11b10 の場合はなくてもよい？
            if (!checkGPUExtension(gpu, GL_EXT_color_buffer_float)) {
                console.error('EXT_color_buffer_float not supported');
                // return;
            }
            texture = createTexture({
                gpu,
                name: textureName,
                width,
                height,
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
                texture.glObject,
                0
            );
            break;

        case RenderTargetTypes.R16F:
            texture = createTexture({
                gpu,
                name: textureName,
                width,
                height,
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
                texture.glObject,
                0
            );
            break;

        default:
            break;
    }

    // check frame buffer status for color attachment
    if (texture) {
        const checkFramebufferStatus = gl.checkFramebufferStatus(GL_FRAMEBUFFER);
        if (checkFramebufferStatus !== GL_FRAMEBUFFER_COMPLETE) {
            console.error('framebuffer not completed');
        }
        registerDrawBufferToFramebuffer(framebuffer, GLColorAttachment.COLOR_ATTACHMENT0);
    }

    // 深度バッファをテクスチャとして扱う場合
    if (type === RenderTargetTypes.Depth || writeDepthTexture) {
        depthTexture = createTexture({
            gpu,
            name: textureName,
            width,
            height,
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
        gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, depthTexture.glObject, 0);
    }

    // depth texture と depth render buffer は両立できないので確認のエラー
    if (depthTexture && depthRenderbuffer) {
        console.error('[RenderTarget.constructor] depth texture and depth render buffer are active.');
    }

    //
    // TODO: check frame buffer depth status
    //

    // unbind
    gl.bindTexture(GL_TEXTURE_2D, null);
    if (depthRenderbuffer) {
        gl.bindRenderbuffer(GL_RENDERBUFFER, null);
    }
    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    unbindFramebuffer(framebuffer);
    // Framebuffer.unbind();

    return {
        ...createRenderTargetBase(renderTargetKind, false),
        gpu,
        name,
        type,
        width,
        height,
        framebuffer,
        depthRenderbuffer,
        texture,
        depthTexture,
    };
}

export type RenderTargetBase = {
    isSwappable: boolean; // TODO: kind=doublebufferで対応したい
    renderTargetKind: RenderTargetKind;
};

export function createRenderTargetBase(renderTargetKind: RenderTargetKind, isSwappable: boolean): RenderTargetBase {
    return { renderTargetKind, isSwappable };
}

export const setRenderTargetSize: SetRenderTargetSizeFunc = (
    renderTargetBase: RenderTargetBase,
    width: number,
    height: number
) => {
    const renderTarget = renderTargetBase as RenderTarget;
    const w = Math.floor(width);
    const h = Math.floor(height);
    renderTarget.width = w;
    renderTarget.height = h;
    if (renderTarget.texture) {
        setTextureSize(renderTarget.texture, w, h);
    }
    if (renderTarget.depthTexture) {
        setTextureSize(renderTarget.depthTexture, w, h);
    }
    if (renderTarget.depthRenderbuffer) {
        setRenderbufferSize(renderTarget.depthRenderbuffer, w, h);
    }
};

// export function setRenderTargetTextureSize(renderTarget: RenderTarget, width: number, height: number) {
//     // this.width = width;
//     // this.height = height;
//     width = Math.floor(width);
//     height = Math.floor(height);
//
//     renderTarget.width = width;
//     renderTarget.height = height;
//
//     if (renderTarget.texture) {
//         renderTarget.texture.setSize(width, height);
//     }
//     if (renderTarget.depthTexture) {
//         renderTarget.depthTexture.setSize(width, height);
//     }
//     if (renderTarget.depthRenderbuffer) {
//         setRenderbufferSize(renderTarget.depthRenderbuffer, width, height);
//     }
// }

export function setRenderTargetTexture(renderTarget: RenderTarget, texture: Texture) {
    const gl = renderTarget.gpu.gl;
    renderTarget.texture = texture;
    gl.bindFramebuffer(GL_FRAMEBUFFER, renderTarget.framebuffer.glObject);
    gl.framebufferTexture2D(
        GL_FRAMEBUFFER,
        GLColorAttachment.COLOR_ATTACHMENT0,
        GL_TEXTURE_2D,
        renderTarget.texture.glObject,
        0
    );
    gl.bindFramebuffer(GL_FRAMEBUFFER, null);
}

export function setRenderTargetDepthTexture(renderTarget: RenderTarget, depthTexture: Texture) {
    const gl = renderTarget.gpu.gl;
    renderTarget.depthTexture = depthTexture;
    bindFramebuffer(renderTarget.framebuffer);
    // depth as texture
    gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, renderTarget.depthTexture.glObject, 0);
    unbindFramebuffer(renderTarget.framebuffer);
}

export function copyRenderTargetColor(
    gpu: Gpu,
    sourceRenderTarget: RenderTarget,
    destRenderTarget: RenderTarget,
    width: number,
    height: number
){
    const gl = gpu.gl;
    gl.bindFramebuffer(GL_READ_FRAMEBUFFER, sourceRenderTarget.framebuffer.glObject);
    gl.bindFramebuffer(GL_DRAW_FRAMEBUFFER, destRenderTarget.framebuffer.glObject);

    gl.clear(GL_COLOR_BUFFER_BIT);

    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, GL_COLOR_BUFFER_BIT, GLTextureFilter.NEAREST);
    gl.bindFramebuffer(GL_READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(GL_DRAW_FRAMEBUFFER, null);
}

export function copyRenderTargetDepth(
    gpu: Gpu,
    sourceRenderTarget: RenderTarget,
    destRenderTarget: RenderTarget,
    width: number,
    height: number
) {
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
