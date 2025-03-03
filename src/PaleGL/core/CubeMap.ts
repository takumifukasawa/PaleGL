import { GlObject } from '@/PaleGL/core/glObject.ts';
// import { CubeMapAxis } from '@/PaleGL/constants.js';
import { GPU } from '@/PaleGL/core/GPU';
import {
    GL_RGBA,
    GL_TEXTURE_CUBE_MAP,
    GL_TEXTURE_CUBE_MAP_NEGATIVE_X,
    GL_TEXTURE_CUBE_MAP_NEGATIVE_Y,
    GL_TEXTURE_CUBE_MAP_NEGATIVE_Z,
    GL_TEXTURE_CUBE_MAP_POSITIVE_X,
    GL_TEXTURE_CUBE_MAP_POSITIVE_Y,
    GL_TEXTURE_CUBE_MAP_POSITIVE_Z,
    GL_TEXTURE_MAG_FILTER,
    GL_TEXTURE_MIN_FILTER,
    GL_TEXTURE_WRAP_S,
    GL_TEXTURE_WRAP_T,
    GL_UNPACK_FLIP_Y_WEBGL,
    GL_UNSIGNED_BYTE,
    GLTextureFilter,
    GLTextureWrap,
} from '@/PaleGL/constants.ts';

// type CubeMapArgs = {
//     gpu: GPU;
//     // images: {
//     //     [key in CubeMapAxis]: HTMLImageElement | HTMLCanvasElement | null;
//     // };
//     width: number;
//     height: number;
// };

export class CubeMap extends GlObject {
    #texture: WebGLTexture;
    width: number;
    height: number;
    maxLodLevel;

    get glObject() {
        return this.#texture;
    }

    constructor(
        gpu: GPU,
        width: number,
        height: number,
        posXImage: HTMLImageElement | HTMLCanvasElement,
        negXImage: HTMLImageElement | HTMLCanvasElement,
        posYImage: HTMLImageElement | HTMLCanvasElement,
        negYImage: HTMLImageElement | HTMLCanvasElement,
        posZImage: HTMLImageElement | HTMLCanvasElement,
        negZImage: HTMLImageElement | HTMLCanvasElement
        // images = {
        //     [CubeMapAxis.PositiveX]: null,
        //     [CubeMapAxis.NegativeX]: null,
        //     [CubeMapAxis.PositiveY]: null,
        //     [CubeMapAxis.NegativeY]: null,
        //     [CubeMapAxis.PositiveZ]: null,
        //     [CubeMapAxis.NegativeZ]: null,
        // },
    ) {
        super();

        const gl = gpu.gl;

        this.width = width;
        this.height = height;
        this.maxLodLevel = Math.log2(Math.max(this.width, this.height));

        // NOTE: 作れるはずという前提
        this.#texture = gl.createTexture()!;

        gl.bindTexture(GL_TEXTURE_CUBE_MAP, this.#texture);

        // cubemapの場合は html img でも falseで良い。というのがよくわかってない。そういうもの？
        // ただ、たしかに反転すると上下が反転して見た目がおかしくなる
        gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, false);

        gl.texImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, posXImage);
        gl.texImage2D(GL_TEXTURE_CUBE_MAP_NEGATIVE_X, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, negXImage);
        gl.texImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_Y, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, posYImage);
        gl.texImage2D(GL_TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, negYImage);
        gl.texImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_Z, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, posZImage);
        gl.texImage2D(GL_TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, negZImage);

        gl.texParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GLTextureFilter.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MAG_FILTER, GLTextureFilter.LINEAR);
        gl.texParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_S, GLTextureWrap.CLAMP_TO_EDGE);
        gl.texParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_T, GLTextureWrap.CLAMP_TO_EDGE);

        gl.generateMipmap(GL_TEXTURE_CUBE_MAP);

        // TODO: unbindしない方がよい？
        gl.bindTexture(GL_TEXTURE_CUBE_MAP, null);
    }
}
