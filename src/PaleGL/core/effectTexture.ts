import {
    RenderTargetType,
    RENDER_TARGET_TYPE_RGBA,
    TextureFilterType,
    TEXTURE_FILTER_TYPE_LINEAR,
    TEXTURE_WRAP_TYPE_REPEAT,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_NAME_SRC_TEXTURE,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,

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
    useComposite: boolean;
    texture: Texture;
    needsUpdate: boolean;
};

export type EffectTextureInfo = {
    width: number;
    height: number;
    effectFragmentShader: string;
    effectUniforms: UniformsData;
    minFilter?: TextureFilterType;
    magFilter?: TextureFilterType;
    // useComposite: boolean;
    // composite settings
    tilingEnabled?: boolean;
    edgeMaskMix?: number;
    remapMin?: number;
    remapMax?: number;
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
        tilingEnabled,
        edgeMaskMix = 1,
        remapMin,
        remapMax,
        minFilter,
        magFilter,
        // update,
        // useComposite,
    } = effectTextureInfo;

    const effectRenderTarget = createEffectTextureTarget({ gpu, width, height, minFilter, magFilter });
    let compositeRenderTarget: RenderTarget | null = null;

    const effectMaterial = createMaterial({
        vertexShader: getPostProcessBaseVertexShader(),
        fragmentShader: effectFragmentShader,
        uniforms: [
            ...effectUniforms,
            ['uSpeed', UNIFORM_TYPE_FLOAT, 1.0],
        ],
        uniformBlockNames: [UNIFORM_BLOCK_NAME_COMMON],
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
            [UNIFORM_NAME_SRC_TEXTURE, UNIFORM_TYPE_TEXTURE, null],
            ['uTilingEnabled', UNIFORM_TYPE_FLOAT, tilingEnabled ? 1 : 0],
            ['uEdgeMaskMix', UNIFORM_TYPE_FLOAT, edgeMaskMix],
            ['uRemapMin', UNIFORM_TYPE_FLOAT, remapMin!],
            ['uRemapMax', UNIFORM_TYPE_FLOAT, remapMax!],
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
        useComposite,
        texture: useComposite ? compositeRenderTarget!.texture! : effectRenderTarget.texture!,
    };
};

const renderEffectTextureInternal = (renderer: Renderer, renderTarget: RenderTarget, material: Material) => {
    setRenderTargetToRendererAndClear(renderer, renderTarget, true);
    renderMesh(renderer, renderer.sharedQuad, material);
    setRenderTargetToRendererAndClear(renderer, null);
};

export const renderEffectTexture = (renderer: Renderer, effectTextureSystem: EffectTextureSystem) => {
    renderEffectTextureInternal(renderer, effectTextureSystem.effectRenderTarget, effectTextureSystem.effectMaterial);
    if (effectTextureSystem.useComposite) {
        renderEffectTextureInternal(
            renderer,
            effectTextureSystem.compositeRenderTarget!,
            effectTextureSystem.compositeMaterial!
        );
    }
};
