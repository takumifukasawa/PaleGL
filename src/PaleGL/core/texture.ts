import { createGLObject, GLObjectBase } from '@/PaleGL/core/glObject.ts';
import {
    GL_DEPTH_COMPONENT,
    GL_DEPTH_COMPONENT16,
    GL_DEPTH_COMPONENT32F,
    GL_FLOAT,
    GL_R11F_G11F_B10F,
    GL_R16F,
    GL_RED,
    GL_RGB,
    GL_RGBA,
    GL_RGBA16F,
    GL_RGBA32F,
    GL_TEXTURE_2D,
    GL_TEXTURE_MAG_FILTER,
    GL_TEXTURE_MIN_FILTER,
    GL_TEXTURE_WRAP_S,
    GL_TEXTURE_WRAP_T,
    GL_UNPACK_FLIP_Y_WEBGL,
    GL_UNSIGNED_BYTE,
    GL_UNSIGNED_SHORT,
    GLTextureFilter,
    GLTextureWrap,
    TextureDepthPrecisionType,
    TextureFilterType,
    TextureFilterTypes,
    TextureType,
    TextureTypes,
    TextureWrapType,
    TextureWrapTypes,
} from '@/PaleGL/constants';
import { Gpu } from './gpu.ts';
import { isNeededCompact } from '@/PaleGL/utilities/envUtilities.ts';

type TextureImage = HTMLImageElement | HTMLCanvasElement;

export type TextureArgs = {
    // require
    gpu: Gpu;
    // optional
    name?: string;
    img?: TextureImage | null;
    arraybuffer?: ArrayBuffer | null;
    type?: TextureType;
    width?: number;
    height?: number;
    mipmap?: boolean;
    minFilter?: TextureFilterType;
    magFilter?: TextureFilterType;
    wrapS?: TextureWrapType;
    wrapT?: TextureWrapType;
    flipY?: boolean;
    depthPrecision?: TextureDepthPrecisionType;
    dxt1?: boolean;
};

/**
 *
 * @param glTextureFilter
 */
export function resolveGLEnumTextureFilterType(glTextureFilter: GLTextureFilter) {
    switch (glTextureFilter) {
        case GLTextureFilter.NEAREST:
            return TextureFilterTypes.Nearest;
        case GLTextureFilter.LINEAR:
            return TextureFilterTypes.Linear;
        case GLTextureFilter.NEAREST_MIPMAP_NEAREST:
            return TextureFilterTypes.NearestMipmapNearest;
        case GLTextureFilter.LINEAR_MIPMAP_NEAREST:
            return TextureFilterTypes.LinearMipmapNearest;
        case GLTextureFilter.NEAREST_MIPMAP_LINEAR:
            return TextureFilterTypes.NearestMipmapLinear;
        case GLTextureFilter.LINEAR_MIPMAP_LINEAR:
            return TextureFilterTypes.LinearMipmapLinear;
        default:
            console.error('[resolveGLEnumTextureFilterType] invalid glTextureFilter');
    }
}

/**
 *
 * @param glTextureWrap
 */
export function resolveGLEnumTextureWrapType(glTextureWrap: number) {
    switch (glTextureWrap) {
        case WebGLRenderingContext.CLAMP_TO_EDGE:
            return TextureWrapTypes.ClampToEdge;
        case WebGLRenderingContext.REPEAT:
            return TextureWrapTypes.Repeat;
        case WebGLRenderingContext.MIRRORED_REPEAT:
            return TextureWrapTypes.MirroredRepeat;
        default:
            console.error('[resolveGLEnumTextureWrapType] invalid glTextureWrap');
    }
}

export type Texture = GLObjectBase<WebGLTexture> & {
    type: TextureType;
    name: string;
    img: HTMLImageElement | HTMLCanvasElement | null;
    minFilter: TextureFilterType;
    magFilter: TextureFilterType;
    mipmap: boolean;
    wrapS: TextureWrapType;
    wrapT: TextureWrapType;
    flipY: boolean;
    width: number | undefined;
    height: number | undefined;
    depthPrecision: TextureDepthPrecisionType | undefined;
};

export function createTexture({
    gpu,
    name,
    img = null,
    arraybuffer,
    type = TextureTypes.RGBA,
    width,
    height,
    mipmap = false,
    minFilter = TextureFilterTypes.Nearest,
    magFilter = TextureFilterTypes.Nearest,
    wrapS = TextureWrapTypes.Repeat,
    wrapT = TextureWrapTypes.Repeat,
    flipY,
    depthPrecision,
    dxt1 = false,
}: TextureArgs): Texture {
    const gl = gpu.gl;

    const texture = gl.createTexture()!;
    // if (!texture) {
    //     console.error('[Texture.constructor] invalid texture');
    // }
    img = img || null;

    // imgがあるがwidth, heightが指定されていない場合はimgのwidth, heightを使う
    if (img !== null) {
        if (width === undefined) {
            width = img.width;
        }
        if (height === undefined) {
            height = img.height;
        }
    }

    // depthPrecision: TextureDepthPrecisionType | undefined = depthPrecision;

    // imgを持つが特に指定がない場合はflipする
    flipY = img && flipY === undefined ? true : !!flipY;

    depthPrecision = type === TextureTypes.Depth && depthPrecision !== undefined ? depthPrecision : undefined;

    if (img === null) {
        // this._img = createWhite1x1();
        // console.error("invalid img");
    }

    if (!img && !arraybuffer && (!width || !height)) {
        console.error('[Texture.constructor] invalid width or height');
    }
    // bind texture object to gl
    gl.bindTexture(GL_TEXTURE_2D, texture);

    if (!isNeededCompact()) {
        if (dxt1) {
            const extDXT1 = gl.getExtension('WEBGL_compressed_texture_s3tc');
            console.log(`[Texture.constructor] extDXT1`, extDXT1);

            // ref: https://mklearning.blogspot.com/2014/10/webgldds.html

            // FCCを32bit符号付き整数に変換する
            const fourCCToInt32 = (value: string) => {
                return (
                    (value.charCodeAt(0) << 0) +
                    (value.charCodeAt(1) << 8) +
                    (value.charCodeAt(2) << 16) +
                    (value.charCodeAt(3) << 24)
                );
            };

            const ddsHeader = new Int32Array(arraybuffer!, 0, 32);
            if (ddsHeader[0] !== fourCCToInt32('DDS ')) {
                console.error('[Texture.constructor] invalid DDS');
            }

            const fourCCDXT1 = fourCCToInt32('DXT1');
            const fourCCDXT3 = fourCCToInt32('DXT3');
            const fourCCDXT5 = fourCCToInt32('DXT5');
            let ddsBlockBytes: number = -1;
            // let ddsFormat = extDXT1.COMPRESSED_RGB_S3TC_DXT1_EXT;
            let ddsFormat: number | undefined = -1;
            console.log(`[Texture.constructor] is DXT5: ${ddsHeader[21] === fourCCDXT5}`, ddsHeader[21], fourCCDXT5);
            switch (ddsHeader[21]) {
                case fourCCDXT1:
                    ddsBlockBytes = 8;
                    ddsFormat = extDXT1?.COMPRESSED_RGBA_S3TC_DXT1_EXT;
                    break;
                case fourCCDXT3:
                    ddsBlockBytes = 16;
                    ddsFormat = extDXT1?.COMPRESSED_RGBA_S3TC_DXT3_EXT;
                    break;
                case fourCCDXT5:
                    ddsBlockBytes = 16;
                    ddsFormat = extDXT1?.COMPRESSED_RGBA_S3TC_DXT5_EXT;
                    break;
            }
            const ddsWidth = ddsHeader[4];
            const ddsHeight = ddsHeader[3];
            const ddsOffset = ddsHeader[1] + 4;
            const ddsLength = (((Math.max(4, ddsWidth) / 4) * Math.max(4, ddsHeight)) / 4) * ddsBlockBytes;
            const ddsBuffer = new Uint8Array(arraybuffer!, ddsOffset, ddsLength);

            console.log(
                `[Texture.constructor] ddsBlockBytes: ${ddsBlockBytes}, ddsFormat: ${ddsFormat}, ddsWidth: ${ddsWidth}, ddsHeight: ${ddsHeight}, ddsOffset: ${ddsOffset}, ddsLength: ${ddsLength}, ddsBuffer:`,
                ddsBuffer
            );

            gl.compressedTexImage2D(GL_TEXTURE_2D, 0, ddsFormat!, ddsWidth, ddsHeight, 0, ddsBuffer);
        }
    }

    // mipmap settings
    if (mipmap) {
        gl.generateMipmap(GL_TEXTURE_2D);
    }

    //
    // filter
    //

    // filterable ref: https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html
    switch (type) {
        case TextureTypes.RGBA:
        case TextureTypes.RGBA16F:
        case TextureTypes.RGBA32F:
        case TextureTypes.R11F_G11F_B10F:
        case TextureTypes.R16F:
            // min filter settings
            switch (minFilter) {
                case TextureFilterTypes.Nearest:
                    gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GLTextureFilter.NEAREST);
                    break;
                case TextureFilterTypes.Linear:
                    gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GLTextureFilter.LINEAR);
                    break;
                default:
                    console.warn('[Texture.constructor] invalid min filter type and fallback to LINEAR');
                    gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GLTextureFilter.LINEAR);
                    break;
            }
            // mag filter settings
            switch (magFilter) {
                case TextureFilterTypes.Nearest:
                    gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GLTextureFilter.NEAREST);
                    break;
                case TextureFilterTypes.Linear:
                    gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GLTextureFilter.LINEAR);
                    break;
                default:
                    console.warn('[Texture.constructor] invalid mag filter type and fallback to LINEAR');
                    gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GLTextureFilter.LINEAR);
                    break;
            }
            break;

        // TODO: depthの場合nearest必須？
        case TextureTypes.Depth:
            gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GLTextureFilter.NEAREST);
            gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GLTextureFilter.NEAREST);
            break;

        // // 「filterできない」で合っているはず？
        // case TextureTypes.RGBA32F:
        //     // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        //     // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        //     break;

        default:
            console.error('[Texture.constructor] invalid texture type');
    }

    //
    // wrap settings
    //

    switch (wrapS) {
        case TextureWrapTypes.ClampToEdge:
            gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GLTextureWrap.CLAMP_TO_EDGE);
            break;
        case TextureWrapTypes.Repeat:
            gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GLTextureWrap.REPEAT);
            break;
        default:
            console.warn('[Texture.constructor] invalid wrapS type and fallback to REPEAT');
            gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GLTextureWrap.REPEAT);
            break;
    }
    switch (wrapT) {
        case TextureWrapTypes.ClampToEdge:
            gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GLTextureWrap.CLAMP_TO_EDGE);
            break;
        case TextureWrapTypes.Repeat:
            gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GLTextureWrap.REPEAT);
            break;
        default:
            console.warn('[Texture.constructor] invalid wrapT type and fallback to REPEAT');
            gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GLTextureWrap.REPEAT);
            break;
    }

    //
    // storei
    //

    // if (!!this.img || this.flipY) {
    if (flipY) {
        // uv座標そのものは左下からなのでglもそれに合わせるためにflip
        // html image coord -> gl texture coord
        // (0, 0) - (1, 0)     (0, 1) - (1, 1)
        //   |         |         |         |
        // (0, 1) - (1, 1)     (0, 0) - (1, 0)
        gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, true);
    } else {
        gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, false);
    }

    //
    // bind texture data
    // TODO: startみたいな関数でtextureにdataをセットした方が効率よい？
    //

    switch (type) {
        case TextureTypes.RGBA:
            if (width && height) {
                // for render target
                if (img) {
                    gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, img);
                } else {
                    gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, null);
                }
            } else {
                // set img to texture
                if (img) {
                    gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, img);
                } else {
                    // TODO: fix type
                    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,null);
                }
            }
            break;

        case TextureTypes.Depth:
            if (width && height) {
                // for render target
                // 1: use 16bit
                if (img) {
                    gl.texImage2D(
                        GL_TEXTURE_2D,
                        0,
                        depthPrecision === TextureDepthPrecisionType.High
                            ? GL_DEPTH_COMPONENT32F
                            : GL_DEPTH_COMPONENT16,
                        width,
                        height,
                        0,
                        GL_DEPTH_COMPONENT,
                        depthPrecision === TextureDepthPrecisionType.High ? GL_FLOAT : GL_UNSIGNED_SHORT,
                        img
                    );
                } else {
                    gl.texImage2D(
                        GL_TEXTURE_2D,
                        0,
                        depthPrecision === TextureDepthPrecisionType.High
                            ? GL_DEPTH_COMPONENT32F
                            : GL_DEPTH_COMPONENT16,
                        width,
                        height,
                        0,
                        GL_DEPTH_COMPONENT,
                        depthPrecision === TextureDepthPrecisionType.High ? GL_FLOAT : GL_UNSIGNED_SHORT,
                        null
                    );
                }
                // 2: use 32bit
                // gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, img);
            } else {
                // set img to texture
                // 1: use 16bit
                // TODO: fix img nullable
                if (img) {
                    gl.texImage2D(
                        GL_TEXTURE_2D,
                        0,
                        depthPrecision === TextureDepthPrecisionType.High
                            ? GL_DEPTH_COMPONENT32F
                            : GL_DEPTH_COMPONENT16,
                        GL_DEPTH_COMPONENT,
                        depthPrecision === TextureDepthPrecisionType.High ? GL_FLOAT : GL_UNSIGNED_SHORT,
                        img
                    );
                    // } else {
                    //     gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
                }
                // 2: use 32bit
                // gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, gl.DEPTH_COMPONENT, gl.FLOAT, img);
            }
            break;

        case TextureTypes.RGBA16F:
            if (width && height) {
                if (img) {
                    gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, width, height, 0, GL_RGBA, GL_FLOAT, img);
                } else {
                    gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, width, height, 0, GL_RGBA, GL_FLOAT, null);
                }
            } else {
                if (img) {
                    gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, GL_RGBA, GL_FLOAT, img);
                    // TODO: fix type
                    // } else {
                    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, gl.RGBA, gl.FLOAT, null);
                }
            }
            break;

        case TextureTypes.RGBA32F:
            if (width && height) {
                if (img) {
                    gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, width, height, 0, GL_RGBA, GL_FLOAT, img);
                } else {
                    gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, width, height, 0, GL_RGBA, GL_FLOAT, null);
                }
            } else {
                if (img) {
                    gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, GL_RGBA, GL_FLOAT, img);
                } else {
                    // TODO: fix type
                    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, gl.RGBA, gl.FLOAT, null);
                }
            }
            break;

        case TextureTypes.R11F_G11F_B10F:
            if (width && height) {
                if (img) {
                    gl.texImage2D(GL_TEXTURE_2D, 0, GL_R11F_G11F_B10F, width, height, 0, GL_RGB, GL_FLOAT, img);
                } else {
                    gl.texImage2D(GL_TEXTURE_2D, 0, GL_R11F_G11F_B10F, width, height, 0, GL_RGB, GL_FLOAT, null);
                }
            } else {
                if (img) {
                    gl.texImage2D(GL_TEXTURE_2D, 0, GL_R11F_G11F_B10F, GL_RGB, GL_FLOAT, img);
                } else {
                    // TODO: fix type
                    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.R11F_G11F_B10F, gl.RGB, gl.FLOAT, null);
                }
            }
            break;

        case TextureTypes.R16F:
            if (width && height) {
                if (img) {
                    gl.texImage2D(GL_TEXTURE_2D, 0, GL_R16F, width, height, 0, GL_RED, GL_FLOAT, img);
                } else {
                    gl.texImage2D(GL_TEXTURE_2D, 0, GL_R16F, width, height, 0, GL_RED, GL_FLOAT, null);
                }
            } else {
                if (img) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, gl.RED, gl.FLOAT, img);
                } else {
                    // TODO: fix type
                    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, gl.RED, gl.FLOAT, null);
                }
            }
            break;

        default:
            console.error('[Texture.constructor] invalid type');
    }

    // TODO: あった方がよい？
    // unbind img
    gl.bindTexture(GL_TEXTURE_2D, null);

    return {
        ...createGLObject(gpu, texture),
        name: name ?? '',
        img,
        type,
        minFilter,
        magFilter,
        mipmap,
        wrapS,
        wrapT,
        flipY,
        width,
        height,
        depthPrecision,
    };
}

export function setTextureSize(texture: Texture, width: number, height: number) {
    // this.width = width;
    // this.height = height;
    texture.width = Math.floor(width);
    texture.height = Math.floor(height);

    // if (this._img === null) {
    //     console.error("[Texture.setSize] invalid img");
    // }

    const gl = texture.gpu.gl;
    gl.bindTexture(GL_TEXTURE_2D, texture.glObject);

    // bind texture data
    switch (texture.type) {
        case TextureTypes.RGBA:
            if (texture.img) {
                gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, texture.img);
            } else {
                gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, null);
            }
            break;

        case TextureTypes.Depth:
            // 1: use 16bit
            if (texture.img) {
                gl.texImage2D(
                    GL_TEXTURE_2D,
                    0,
                    texture.depthPrecision === TextureDepthPrecisionType.High
                        ? GL_DEPTH_COMPONENT32F
                        : GL_DEPTH_COMPONENT16,
                    width,
                    height,
                    0,
                    GL_DEPTH_COMPONENT,
                    texture.depthPrecision === TextureDepthPrecisionType.High ? GL_FLOAT : GL_UNSIGNED_SHORT,
                    texture.img
                );
            } else {
                gl.texImage2D(
                    GL_TEXTURE_2D,
                    0,
                    texture.depthPrecision === TextureDepthPrecisionType.High
                        ? GL_DEPTH_COMPONENT32F
                        : GL_DEPTH_COMPONENT16,
                    width,
                    height,
                    0,
                    GL_DEPTH_COMPONENT,
                    texture.depthPrecision === TextureDepthPrecisionType.High ? GL_FLOAT : GL_UNSIGNED_SHORT,
                    null
                );
            }
            // 2: use 32bit
            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, this._img);
            break;

        case TextureTypes.RGBA16F:
            if (texture.img) {
                gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, width, height, 0, GL_RGBA, GL_FLOAT, texture.img);
            } else {
                gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, width, height, 0, GL_RGBA, GL_FLOAT, null);
            }
            break;

        case TextureTypes.RGBA32F:
            if (texture.img) {
                gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, width, height, 0, GL_RGBA, GL_FLOAT, texture.img);
            } else {
                gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, width, height, 0, GL_RGBA, GL_FLOAT, null);
            }
            break;

        case TextureTypes.R11F_G11F_B10F:
            if (texture.img) {
                gl.texImage2D(GL_TEXTURE_2D, 0, GL_R11F_G11F_B10F, width, height, 0, GL_RGB, GL_FLOAT, texture.img);
            } else {
                gl.texImage2D(GL_TEXTURE_2D, 0, GL_R11F_G11F_B10F, width, height, 0, GL_RGB, GL_FLOAT, null);
            }
            break;

        case TextureTypes.R16F:
            if (texture.img) {
                gl.texImage2D(GL_TEXTURE_2D, 0, GL_R16F, width, height, 0, GL_RED, GL_FLOAT, texture.img);
            } else {
                gl.texImage2D(GL_TEXTURE_2D, 0, GL_R16F, width, height, 0, GL_RED, GL_FLOAT, null);
            }
            break;

        default:
            console.error('[Texture.setSize] invalid type');
    }

    gl.bindTexture(GL_TEXTURE_2D, null);
}

export function updateTexture(
    texture: Texture,
    {
        width,
        height,
        data,
        img,
    }: {
        width?: number;
        height?: number;
        data?: ArrayBufferView | null;
        img?: TextureImage | null;
    }
) {
    if (!data && !img) {
        console.error('[updateTexture] invalid data or img');
        return;
    }

    width = width ? Math.floor(width) : texture.width;
    height = height ? Math.floor(height) : texture.height;

    if (width === undefined || height === undefined) {
        console.error('[updateTexture] invalid width or height');
        return;
    }

    texture.width = width;
    texture.height = height;

    const gl = texture.gpu.gl;
    gl.bindTexture(GL_TEXTURE_2D, texture.glObject);

    // TODO: execute all type
    switch (texture.type) {
        // data: Uint8Array | null
        case TextureTypes.RGBA:
            if (data) {
                gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, data);
            }
            if (img) {
                gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, img);
            }
            break;

        // data: Float32Array | null
        case TextureTypes.RGBA16F:
            if (data) {
                gl.texImage2D(GL_TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, data);
            } else {
                gl.texImage2D(GL_TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
            }
            break;
            
        // data: Float32Array | null
        case TextureTypes.RGBA32F:
            if (data) {
                gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, width, height, 0, GL_RGBA, GL_FLOAT, data);
            }
            if (img) {
                gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, width, height, 0, GL_RGBA, GL_FLOAT, img);
            }
            break;

        default:
            console.error('[updateTexture] invalid type');
    }

    gl.bindTexture(GL_TEXTURE_2D, null);
}

export function generateTexture(texture: Texture) {
    return createTexture({
        gpu: texture.gpu,
        name: texture.name,
        img: texture.img,
        type: texture.type,
        width: texture.width,
        height: texture.height,
        mipmap: texture.mipmap,
        minFilter: texture.minFilter,
        magFilter: texture.magFilter,
        wrapS: texture.wrapS,
        wrapT: texture.wrapT,
        flipY: texture.flipY,
    });
}
