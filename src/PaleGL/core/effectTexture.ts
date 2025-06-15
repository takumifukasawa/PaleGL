import {
    RenderTargetType,
    RenderTargetTypes,
    TextureFilterType,
    TextureFilterTypes,
    TextureWrapTypes,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createRenderTarget, RenderTarget } from '@/PaleGL/core/renderTarget.ts';
import { createMaterial, Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { Texture } from '@/PaleGL/core/texture.ts';
import { Renderer, tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { getPostProcessBaseVertexShader } from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import effectTexturePostProcessFragment from '@/PaleGL/shaders/effect-texture-postprocess-fragment.glsl';

const createEffectTextureTarget = ({
    gpu,
    width,
    height,
    type = RenderTargetTypes.RGBA,
    minFilter = TextureFilterTypes.Linear,
    magFilter = TextureFilterTypes.Linear,
}: {
    gpu: Gpu;
    width: number;
    height: number;
    type?: RenderTargetType;
    minFilter?: TextureFilterType;
    magFilter?: TextureFilterType;
}) => {
    return createRenderTarget({
        gpu,
        width,
        height,
        type,
        minFilter,
        magFilter,
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
    });
};

export type EffectTextureSystem = {
    effectMaterial: Material;
    effectRenderTarget: RenderTarget;
    compositeMaterial: Material | null;
    compositeRenderTarget: RenderTarget | null;
    useComposite: boolean;
    texture: Texture;
    needsUpdate: boolean;
};

export const createEffectTextureSystem: (
    gpu: Gpu,
    renderer: Renderer,
    sharedTextureInfo: SharedTextureInfo
) => EffectTextureSystem = (gpu, renderer, sharedTextureInfo) => {
    const {
        // key,
        width,
        height,
        effectFragmentShader,
        effectUniforms,
        tilingEnabled,
        edgeMaskMix = 1,
        remapMin = 0,
        remapMax = 1,
        minFilter,
        magFilter,
        // update,
        // useComposite,
    } = sharedTextureInfo;

    const effectRenderTarget = createEffectTextureTarget({ gpu, width, height, minFilter, magFilter });
    let compositeRenderTarget: RenderTarget | null = null;

    const effectMaterial = createMaterial({
        vertexShader: getPostProcessBaseVertexShader(),
        fragmentShader: effectFragmentShader,
        uniforms: effectUniforms,
    });

    let compositeMaterial: Material | null = null;

    const useComposite = tilingEnabled !== undefined || remapMin !== undefined || remapMax !== undefined;

    tryStartMaterial(gpu, renderer, renderer.sharedQuad, effectMaterial);

    if (useComposite) {
        compositeRenderTarget = createEffectTextureTarget({
            gpu,
            width,
            height,
            minFilter,
            magFilter,
        });

        const uniforms: UniformsData = [
            {
                name: UniformNames.SrcTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: 'uTilingEnabled',
                type: UniformTypes.Float,
                value: tilingEnabled ? 1 : 0,
            },
            {
                name: 'uEdgeMaskMix',
                type: UniformTypes.Float,
                value: edgeMaskMix,
            },
            {
                name: 'uRemapMin',
                type: UniformTypes.Float,
                value: remapMin,
            },
            {
                name: 'uRemapMax',
                type: UniformTypes.Float,
                value: remapMax,
            },
        ];

        compositeMaterial = createMaterial({
            vertexShader: getPostProcessBaseVertexShader(),
            fragmentShader: effectTexturePostProcessFragment,
            uniforms,
        });

        tryStartMaterial(gpu, renderer, renderer.sharedQuad, compositeMaterial);
        setMaterialUniformValue(compositeMaterial, UniformNames.SrcTexture, effectRenderTarget.texture);
    }

    return {
        effectMaterial,
        effectRenderTarget,
        compositeMaterial,
        compositeRenderTarget,
        needsUpdate: false,
        useComposite,
        texture: useComposite ? compositeRenderTarget!.texture! : effectRenderTarget.texture!,
    };
};
