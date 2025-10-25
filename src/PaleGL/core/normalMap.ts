import { Texture } from '@/PaleGL/core/texture.ts';
import { blitRenderTarget, Renderer, tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { createRenderTarget, RenderTarget } from '@/PaleGL/core/renderTarget.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import {
    RENDER_TARGET_TYPE_RGBA,
    TEXTURE_WRAP_TYPE_REPEAT,
    UNIFORM_NAME_TEXEL_SIZE,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_VECTOR2,

} from '@/PaleGL/constants.ts';
import { createMaterial, Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import vertexShader from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';
import fragmentShader from '@/PaleGL/shaders/normal-map-converter-fragment.glsl';
import { createVector2, setV2 } from '@/PaleGL/math/vector2.ts';

let convertNormalMapFromHeightMapMaterial: Material;

const uniformNameSrcMap = 'uSrcMap';

export type NormalMapFromHeightMapConverter = {
    renderTarget: RenderTarget; // 出力先
    width: number;
    height: number;
    // どちらかが入力元
    srcTexture?: Texture; // 入力元テクスチャ
    srcRenderTarget?: RenderTarget; // 入力元レンダーターゲット
};

type Options = { srcTexture?: Texture; srcRenderTarget?: RenderTarget };

export const createNormalMapConverter: (
    gpu: Gpu,
    renderer: Renderer,
    options: Options
) => NormalMapFromHeightMapConverter = (gpu, renderer, { srcTexture, srcRenderTarget }) => {
    if (srcTexture === undefined && srcRenderTarget === undefined) {
        throw new Error('[normal map] Either srcTexture or srcRenderTarget must be provided.');
    }
    // src texture か render target のどっちかは必ず渡す
    const width: number = (srcTexture !== undefined ? srcTexture.width : srcRenderTarget!.width) as number;
    const height: number = (srcTexture !== undefined ? srcTexture.height : srcRenderTarget!.height) as number;
    const renderTarget = createRenderTarget({
        gpu,
        type: RENDER_TARGET_TYPE_RGBA,
        width,
        height,
        wrapT: TEXTURE_WRAP_TYPE_REPEAT,
        wrapS: TEXTURE_WRAP_TYPE_REPEAT,
    });

    if (!convertNormalMapFromHeightMapMaterial) {
        convertNormalMapFromHeightMapMaterial = createMaterial({
            vertexShader,
            fragmentShader,
            uniforms: [
                [uniformNameSrcMap, UNIFORM_TYPE_TEXTURE, null],
                ['uParallaxScale', UNIFORM_TYPE_FLOAT, 0.001],
                ['uNormalScale', UNIFORM_TYPE_FLOAT, 1.0],
                [UNIFORM_NAME_TEXEL_SIZE, UNIFORM_TYPE_VECTOR2, createVector2(1, 1)],
            ],
        });
        tryStartMaterial(gpu, renderer, renderer.sharedQuad, convertNormalMapFromHeightMapMaterial);
    }

    return { renderTarget, srcTexture, srcRenderTarget, width, height };
};

const tmpTexelSize = createVector2(0, 0);

export const convertNormalMapFromHeightMap = (renderer: Renderer, converter: NormalMapFromHeightMapConverter) => {
    setMaterialUniformValue(
        convertNormalMapFromHeightMapMaterial,
        uniformNameSrcMap,
        converter.srcTexture || converter.srcRenderTarget!.texture
    );
    setV2(tmpTexelSize, 1 / converter.width, 1 / converter.height);
    setMaterialUniformValue(convertNormalMapFromHeightMapMaterial, UNIFORM_NAME_TEXEL_SIZE, tmpTexelSize);

    blitRenderTarget(renderer, converter.renderTarget, renderer.sharedQuad, convertNormalMapFromHeightMapMaterial);
};
