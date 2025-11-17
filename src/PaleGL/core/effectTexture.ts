import {
    RENDER_TARGET_TYPE_RGBA,
    RenderTargetType,
    TEXTURE_FILTER_TYPE_LINEAR,
    TEXTURE_WRAP_TYPE_REPEAT,
    TextureFilterType,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_NAME_EFFECT_TEXTURE_COMPOSITE_EDGE_MASK_MIX,
    UNIFORM_NAME_EFFECT_TEXTURE_COMPOSITE_ONE_MINUS,
    UNIFORM_NAME_EFFECT_TEXTURE_COMPOSITE_REMAP_MAX,
    UNIFORM_NAME_EFFECT_TEXTURE_COMPOSITE_REMAP_MIN,
    UNIFORM_NAME_EFFECT_TEXTURE_COMPOSITE_TILING_ENABLED,
    UNIFORM_NAME_SRC_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_TEXTURE,
} from '@/PaleGL/constants.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Renderer, renderMesh, setRenderTargetToRendererAndClear, tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { createRenderTarget, RenderTarget } from '@/PaleGL/core/renderTarget.ts';
import { Texture } from '@/PaleGL/core/texture.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createMaterial, Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { getPostProcessBaseVertexShader } from '@/PaleGL/postprocess/postProcessPassBase.ts';
import effectTexturePostProcessFragment from '@/PaleGL/shaders/effect-texture-postprocess-fragment.glsl';

const createEffectTextureTarget = ({
    gpu,
    width,
    height,
    type = RENDER_TARGET_TYPE_RGBA,
    minFilter = TEXTURE_FILTER_TYPE_LINEAR,
    magFilter = TEXTURE_FILTER_TYPE_LINEAR,
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
        wrapS: TEXTURE_WRAP_TYPE_REPEAT,
        wrapT: TEXTURE_WRAP_TYPE_REPEAT,
    });
};

export type EffectTextureSystem = {
    effectMaterial: Material;
    effectRenderTarget: RenderTarget;
    compositeMaterial: Material | null;
    compositeRenderTarget: RenderTarget | null;
    // useComposite: boolean;
    texture: Texture;
    needsUpdate: boolean;
    compositeParameters: EffectTextureCompositeParameters;
};

export type EffectTextureCompositeParameters = {
    useComposite?: boolean;
    tilingEnabled?: boolean;
    edgeMaskMix?: number;
    remapMin?: number;
    remapMax?: number;
    oneMinus?: number;
};

export type EffectTextureInfo = {
    width: number;
    height: number;
    effectFragmentShader: string;
    effectUniforms: UniformsData;
    minFilter?: TextureFilterType;
    magFilter?: TextureFilterType;
    compositeParameters: EffectTextureCompositeParameters;
    // useComposite: boolean;
    // composite settings
    // tilingEnabled?: boolean;
    // edgeMaskMix?: number;
    // remapMin?: number;
    // remapMax?: number;
};

export const createEffectTextureSystem: (
    gpu: Gpu,
    renderer: Renderer,
    effectTextureInfo: EffectTextureInfo
) => EffectTextureSystem = (gpu, renderer, effectTextureInfo) => {
    const {
        // key,
        width,
        height,
        effectFragmentShader,
        effectUniforms,
        minFilter,
        magFilter,
        compositeParameters,
        // update,
        // useComposite,
    } = effectTextureInfo;
    const {
        useComposite = false,
        tilingEnabled = false,
        edgeMaskMix = 1,
        remapMin = 0,
        remapMax = 1,
        oneMinus = 0,
    } = compositeParameters;

    const effectRenderTarget = createEffectTextureTarget({ gpu, width, height, minFilter, magFilter });
    let compositeRenderTarget: RenderTarget | null = null;

    const effectMaterial = createMaterial({
        vertexShader: getPostProcessBaseVertexShader(),
        fragmentShader: effectFragmentShader,
        uniforms: [...effectUniforms],
        uniformBlockNames: [UNIFORM_BLOCK_NAME_COMMON],
    });

    let compositeMaterial: Material | null = null;

    // const useComposite = tilingEnabled !== undefined || remapMin !== undefined || remapMax !== undefined;

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
            [UNIFORM_NAME_SRC_TEXTURE, UNIFORM_TYPE_TEXTURE],
            [UNIFORM_NAME_EFFECT_TEXTURE_COMPOSITE_TILING_ENABLED, UNIFORM_TYPE_FLOAT, tilingEnabled],
            [UNIFORM_NAME_EFFECT_TEXTURE_COMPOSITE_EDGE_MASK_MIX, UNIFORM_TYPE_FLOAT, edgeMaskMix],
            [UNIFORM_NAME_EFFECT_TEXTURE_COMPOSITE_REMAP_MIN, UNIFORM_TYPE_FLOAT, remapMin],
            [UNIFORM_NAME_EFFECT_TEXTURE_COMPOSITE_REMAP_MAX, UNIFORM_TYPE_FLOAT, remapMax],
            [UNIFORM_NAME_EFFECT_TEXTURE_COMPOSITE_ONE_MINUS, UNIFORM_TYPE_FLOAT, oneMinus],
        ];

        compositeMaterial = createMaterial({
            vertexShader: getPostProcessBaseVertexShader(),
            fragmentShader: effectTexturePostProcessFragment,
            uniforms,
            uniformBlockNames: [UNIFORM_BLOCK_NAME_COMMON],
        });

        tryStartMaterial(gpu, renderer, renderer.sharedQuad, compositeMaterial);
        setMaterialUniformValue(compositeMaterial, UNIFORM_NAME_SRC_TEXTURE, effectRenderTarget.texture);
    }

    return {
        effectMaterial,
        effectRenderTarget,
        compositeMaterial,
        compositeRenderTarget,
        needsUpdate: false,
        // useComposite,
        texture: useComposite ? compositeRenderTarget!.texture! : effectRenderTarget.texture!,
        compositeParameters: {
            useComposite,
            tilingEnabled,
            edgeMaskMix,
            remapMin,
            remapMax,
            oneMinus,
        },
    };
};

const renderEffectTextureInternal = (renderer: Renderer, renderTarget: RenderTarget, material: Material) => {
    setRenderTargetToRendererAndClear(renderer, renderTarget, true);
    renderMesh(renderer, renderer.sharedQuad, material);
    setRenderTargetToRendererAndClear(renderer, null);
};

export const renderEffectTexture = (renderer: Renderer, effectTextureSystem: EffectTextureSystem) => {
    renderEffectTextureInternal(renderer, effectTextureSystem.effectRenderTarget, effectTextureSystem.effectMaterial);
    if (effectTextureSystem.compositeParameters.useComposite) {
        renderEffectTextureInternal(
            renderer,
            effectTextureSystem.compositeRenderTarget!,
            effectTextureSystem.compositeMaterial!
        );
    }
};
