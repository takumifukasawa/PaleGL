import { createGLObject, GLObjectBase } from '@/PaleGL/core/glObject.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
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
//     gpu: Gpu;
//     // images: {
//     //     [key in CubeMapAxis]: HTMLImageElement | HTMLCanvasElement | null;
//     // };
//     width: number;
//     height: number;
// };

export type CubeMap = GLObjectBase<WebGLTexture> & {
    width: number;
    height: number;
    maxLodLevel: number;
};

function createCubeMapInternal(
    gpu: Gpu,
    width: number,
    height: number,
    posXImage: HTMLImageElement | HTMLCanvasElement,
    negXImage: HTMLImageElement | HTMLCanvasElement,
    posYImage: HTMLImageElement | HTMLCanvasElement,
    negYImage: HTMLImageElement | HTMLCanvasElement,
    posZImage: HTMLImageElement | HTMLCanvasElement,
    negZImage: HTMLImageElement | HTMLCanvasElement,
): CubeMap {
    const gl = gpu.gl;

    const maxLodLevel = Math.log2(Math.max(width, height));

    // NOTE: 作れるはずという前提
    const texture = gl.createTexture()!;

    gl.bindTexture(GL_TEXTURE_CUBE_MAP, texture);

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

    return {
        ...createGLObject(gpu, texture),
        width,
        height,
        maxLodLevel,
    };
}

export function createCubeMap(
    gpu: Gpu,
    posXImage: HTMLImageElement | HTMLCanvasElement,
    negXImage: HTMLImageElement | HTMLCanvasElement,
    posYImage: HTMLImageElement | HTMLCanvasElement,
    negYImage: HTMLImageElement | HTMLCanvasElement,
    posZImage: HTMLImageElement | HTMLCanvasElement,
    negZImage: HTMLImageElement | HTMLCanvasElement,
    width: number = -1,
    height: number = -1
) {
    return createCubeMapInternal(
        gpu,
        width > -1 ? width : posXImage.width,
        height > -1 ? height : posXImage.height,
        posXImage,
        negXImage,
        posYImage,
        negYImage,
        posZImage,
        negZImage
    );
}
