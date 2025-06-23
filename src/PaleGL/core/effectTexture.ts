import {
    RenderTargetType,
    RenderTargetTypes,
    TextureFilterType,
    TextureFilterTypes,
    TextureWrapTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
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
            {
                name: 'uSpeed',
                type: UniformTypes.Float,
                value: 1.0, // Default speed, can be overridden
            },
        ],
        uniformBlockNames: [UniformBlockNames.Common],
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
                value: remapMin!,
            },
            {
                name: 'uRemapMax',
                type: UniformTypes.Float,
                value: remapMax!,
            },
        ];

        compositeMaterial = createMaterial({
            vertexShader: getPostProcessBaseVertexShader(),
            fragmentShader: effectTexturePostProcessFragment,
            uniforms,
            uniformBlockNames: [UniformBlockNames.Common],
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
