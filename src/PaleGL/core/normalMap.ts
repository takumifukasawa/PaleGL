import { Texture, TextureBase } from '@/PaleGL/core/texture.ts';
import { blitRenderTarget, Renderer, tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { createRenderTarget, RenderTarget, setRenderTargetSize } from '@/PaleGL/core/renderTarget.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { RenderTargetTypes, TextureWrapTypes, UniformTypes } from '@/PaleGL/constants.ts';
import { createMaterial, Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import vertexShader from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';
import fragmentShader from '@/PaleGL/shaders/normal-map-converter-fragment.glsl';
import { setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { createVector2, setV2, setV2x } from '@/PaleGL/math/vector2.ts';
import { createVector3 } from '@/PaleGL/math/vector3.ts';

let convertNormalMapFromHeightMapMaterial: Material;

const uniformNameSrcMap = 'uSrcMap';

type NormalMapFromHeightMapConverter = {
    renderTarget: RenderTarget;
    srcTexture?: Texture;
    srcRenderTarget?: RenderTarget;
    width: number;
    height: number;
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
        type: RenderTargetTypes.RGBA,
        width,
        height,
        wrapT: TextureWrapTypes.Repeat,
        wrapS: TextureWrapTypes.Repeat,
    });

    if (!convertNormalMapFromHeightMapMaterial) {
        convertNormalMapFromHeightMapMaterial = createMaterial({
            vertexShader,
            fragmentShader,
            uniforms: [
                {
                    name: uniformNameSrcMap,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uParallaxScale',
                    type: UniformTypes.Float,
                    value: 0.001,
                },
                {
                    name: 'uNormalScale',
                    type: UniformTypes.Float,
                    value: 1.0,
                },
                {
                    name: 'uTexelSize',
                    type: UniformTypes.Vector2,
                    value: createVector2(1, 1),
                },
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
    setMaterialUniformValue(convertNormalMapFromHeightMapMaterial, 'uTexelSize', tmpTexelSize);

    blitRenderTarget(renderer, converter.renderTarget, renderer.sharedQuad, convertNormalMapFromHeightMapMaterial);
};
