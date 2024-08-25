import { GLObject } from '@/PaleGL/core/GLObject';
import {
    GLTextureFilter,
    TextureDepthPrecisionType,
    TextureFilterType,
    TextureFilterTypes,
    TextureType,
    TextureTypes,
    TextureWrapType,
    TextureWrapTypes,
} from '@/PaleGL/constants';
import { GPU } from './GPU';

export type TextureArgs = {
    // require
    gpu: GPU;
    // optional
    img?: HTMLImageElement | HTMLCanvasElement | null;
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

// ref:
// https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html
// TODO: texStorage2Dを使う場合と出し分ける
export class Texture extends GLObject {
    private texture: WebGLTexture;
    private img: HTMLImageElement | HTMLCanvasElement | null = null;
    private gpu: GPU;
    type: TextureType;

    minFilter: TextureFilterType;
    magFilter: TextureFilterType;
    mipmap: boolean;
    wrapS: TextureWrapType;
    wrapT: TextureWrapType;
    flipY: boolean;
    width: number | undefined;
    height: number | undefined;
    depthPrecision: TextureDepthPrecisionType | undefined;

    get glObject() {
        return this.texture;
    }

    constructor({
        gpu,
        img,
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
    }: TextureArgs) {
        super();

        this.gpu = gpu;
        const gl = this.gpu.gl;

        this.img = img || null;
        this.type = type;
        this.mipmap = mipmap;
        this.minFilter = minFilter;
        this.magFilter = magFilter;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
        this.width = width;
        this.height = height;
        // imgを持つが特に指定がない場合はflipする
        this.flipY = this.img && flipY === undefined ? true : !!flipY;

        this.depthPrecision =
            this.type === TextureTypes.Depth && depthPrecision !== undefined ? depthPrecision : undefined;

        if (this.img === null) {
            // this.img = createWhite1x1();
            // throw "invalid img";
        }

        if (!this.img && (!width || !height)) {
            console.error('[Texture.constructor] invalid width or height');
        }

        const texture = gl.createTexture()!;
        // if (!texture) {
        //     console.error('[Texture.constructor] invalid texture');
        // }
        this.texture = texture;

        // bind texture object to gl
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // mipmap settings
        if (mipmap) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        //
        // filter
        //

        // filterable ref: https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html
        switch (this.type) {
            case TextureTypes.RGBA:
            case TextureTypes.RGBA16F:
            case TextureTypes.RGBA32F:
            case TextureTypes.R11F_G11F_B10F:
            case TextureTypes.R16F:
                // min filter settings
                switch (this.minFilter) {
                    case TextureFilterTypes.Nearest:
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                        break;
                    case TextureFilterTypes.Linear:
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        break;
                    default:
                        console.warn('[Texture.constructor] invalid min filter type and fallback to LINEAR');
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        break;
                }
                // mag filter settings
                switch (this.magFilter) {
                    case TextureFilterTypes.Nearest:
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                        break;
                    case TextureFilterTypes.Linear:
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                        break;
                    default:
                        console.warn('[Texture.constructor] invalid mag filter type and fallback to LINEAR');
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                        break;
                }
                break;

            // TODO: depthの場合nearest必須？
            case TextureTypes.Depth:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                break;
            case TextureWrapTypes.Repeat:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                break;
            default:
                console.warn('[Texture.constructor] invalid wrapS type and fallback to REPEAT');
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                break;
        }
        switch (wrapT) {
            case TextureWrapTypes.ClampToEdge:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                break;
            case TextureWrapTypes.Repeat:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                break;
            default:
                console.warn('[Texture.constructor] invalid wrapT type and fallback to REPEAT');
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                break;
        }

        //
        // storei
        //

        // if (!!this.img || this.flipY) {
        if (this.flipY) {
            // uv座標そのものは左下からなのでglもそれに合わせるためにflip
            // html image coord -> gl texture coord
            // (0, 0) - (1, 0)     (0, 1) - (1, 1)
            //   |         |         |         |
            // (0, 1) - (1, 1)     (0, 0) - (1, 0)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        } else {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        }

        //
        // bind texture data
        // TODO: startみたいな関数でtextureにdataをセットした方が効率よい？
        //

        switch (this.type) {
            case TextureTypes.RGBA:
                if (width && height) {
                    // for render target
                    if (this.img) {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
                    } else {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                    }
                } else {
                    // set img to texture
                    if (this.img) {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
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
                    if (this.img) {
                        gl.texImage2D(
                            gl.TEXTURE_2D,
                            0,
                            this.depthPrecision === TextureDepthPrecisionType.High
                                ? gl.DEPTH_COMPONENT32F
                                : gl.DEPTH_COMPONENT16,
                            width,
                            height,
                            0,
                            gl.DEPTH_COMPONENT,
                            this.depthPrecision === TextureDepthPrecisionType.High ? gl.FLOAT : gl.UNSIGNED_SHORT,
                            this.img
                        );
                    } else {
                        gl.texImage2D(
                            gl.TEXTURE_2D,
                            0,
                            this.depthPrecision === TextureDepthPrecisionType.High
                                ? gl.DEPTH_COMPONENT32F
                                : gl.DEPTH_COMPONENT16,
                            width,
                            height,
                            0,
                            gl.DEPTH_COMPONENT,
                            this.depthPrecision === TextureDepthPrecisionType.High ? gl.FLOAT : gl.UNSIGNED_SHORT,
                            null
                        );
                    }
                    // 2: use 32bit
                    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, this.img);
                } else {
                    // set img to texture
                    // 1: use 16bit
                    // TODO: fix img nullable
                    if (this.img) {
                        gl.texImage2D(
                            gl.TEXTURE_2D,
                            0,
                            this.depthPrecision === TextureDepthPrecisionType.High
                                ? gl.DEPTH_COMPONENT32F
                                : gl.DEPTH_COMPONENT16,
                            gl.DEPTH_COMPONENT,
                            this.depthPrecision === TextureDepthPrecisionType.High ? gl.FLOAT : gl.UNSIGNED_SHORT,
                            this.img
                        );
                        // } else {
                        //     gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
                    }
                    // 2: use 32bit
                    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, gl.DEPTH_COMPONENT, gl.FLOAT, this.img);
                }
                break;

            case TextureTypes.RGBA16F:
                if (width && height) {
                    if (this.img) {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, this.img);
                    } else {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
                    }
                } else {
                    if (this.img) {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, gl.RGBA, gl.FLOAT, this.img);
                        // TODO: fix type
                        // } else {
                        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, gl.RGBA, gl.FLOAT, null);
                    }
                }
                break;

            case TextureTypes.RGBA32F:
                if (width && height) {
                    if (this.img) {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, this.img);
                    } else {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
                    }
                } else {
                    if (this.img) {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, gl.RGBA, gl.FLOAT, this.img);
                    } else {
                        // TODO: fix type
                        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, gl.RGBA, gl.FLOAT, null);
                    }
                }
                break;

            case TextureTypes.R11F_G11F_B10F:
                if (width && height) {
                    if (this.img) {
                        gl.texImage2D(
                            gl.TEXTURE_2D,
                            0,
                            gl.R11F_G11F_B10F,
                            width,
                            height,
                            0,
                            gl.RGB,
                            gl.FLOAT,
                            this.img
                        );
                    } else {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R11F_G11F_B10F, width, height, 0, gl.RGB, gl.FLOAT, null);
                    }
                } else {
                    if (this.img) {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R11F_G11F_B10F, gl.RGB, gl.FLOAT, this.img);
                    } else {
                        // TODO: fix type
                        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.R11F_G11F_B10F, gl.RGB, gl.FLOAT, null);
                    }
                }
                break;

            case TextureTypes.R16F:
                if (width && height) {
                    if (this.img) {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, width, height, 0, gl.RED, gl.FLOAT, this.img);
                    } else {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, width, height, 0, gl.RED, gl.FLOAT, null);
                    }
                } else {
                    if (this.img) {
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, gl.RED, gl.FLOAT, this.img);
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
        gl.bindTexture(gl.TEXTURE_2D, null);
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

        // if (this.img === null) {
        //     throw "[Texture.setSize] invalid img";
        // }

        const gl = this.gpu.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // bind texture data
        switch (this.type) {
            case TextureTypes.RGBA:
                if (this.img) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
                } else {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                }
                break;

            case TextureTypes.Depth:
                // 1: use 16bit
                if (this.img) {
                    gl.texImage2D(
                        gl.TEXTURE_2D,
                        0,
                        this.depthPrecision === TextureDepthPrecisionType.High
                            ? gl.DEPTH_COMPONENT32F
                            : gl.DEPTH_COMPONENT16,
                        width,
                        height,
                        0,
                        gl.DEPTH_COMPONENT,
                        this.depthPrecision === TextureDepthPrecisionType.High ? gl.FLOAT : gl.UNSIGNED_SHORT,
                        this.img
                    );
                } else {
                    gl.texImage2D(
                        gl.TEXTURE_2D,
                        0,
                        this.depthPrecision === TextureDepthPrecisionType.High
                            ? gl.DEPTH_COMPONENT32F
                            : gl.DEPTH_COMPONENT16,
                        width,
                        height,
                        0,
                        gl.DEPTH_COMPONENT,
                        this.depthPrecision === TextureDepthPrecisionType.High ? gl.FLOAT : gl.UNSIGNED_SHORT,
                        null
                    );
                }
                // 2: use 32bit
                // gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, this.img);
                break;

            case TextureTypes.RGBA16F:
                if (this.img) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, this.img);
                } else {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
                }
                break;

            case TextureTypes.RGBA32F:
                if (this.img) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, this.img);
                } else {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
                }
                break;

            case TextureTypes.R11F_G11F_B10F:
                if (this.img) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R11F_G11F_B10F, width, height, 0, gl.RGB, gl.FLOAT, this.img);
                } else {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R11F_G11F_B10F, width, height, 0, gl.RGB, gl.FLOAT, null);
                }
                break;

            case TextureTypes.R16F:
                if (this.img) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, width, height, 0, gl.RED, gl.FLOAT, this.img);
                } else {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, width, height, 0, gl.RED, gl.FLOAT, null);
                }
                break;

            default:
                console.error('[Texture.setSize] invalid type');
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     *
     * @param width
     * @param height
     * @param data
     */
    update({ width, height, data }: { width: number; height: number; data: ArrayBufferView }) {
        this.width = width;
        this.height = height;

        // if (this.img === null) {
        //     throw "invalid img";
        // }

        const gl = this.gpu.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // TODO: execute all type
        switch (this.type) {
            // case TextureTypes.RGBA16F:
            //     if (this.img) {
            //         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, this.img);
            //     } else {
            //         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
            //     }
            //     break;

            case TextureTypes.RGBA32F:
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, data);
                break;

            default:
                console.error('[Texture.update] invalid type');
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     *
     */
    generate() {
        return new Texture({
            gpu: this.gpu,
            img: this.img,
            type: this.type,
            width: this.width,
            height: this.height,
            mipmap: this.mipmap,
            minFilter: this.minFilter,
            magFilter: this.magFilter,
            wrapS: this.wrapS,
            wrapT: this.wrapT,
            flipY: this.flipY,
        });
    }
}
