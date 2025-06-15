import { TextureFilterType, TextureFilterTypes, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';
import { createEffectTextureSystem, EffectTextureSystem } from '@/PaleGL/core/effectTexture.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Renderer, renderMesh, setRenderTargetToRendererAndClear } from '@/PaleGL/core/renderer.ts';
import { RenderTarget } from '@/PaleGL/core/renderTarget.ts';
import { setUniformValue, UniformsData } from '@/PaleGL/core/uniforms.ts';
import { Material } from '@/PaleGL/materials/material.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
import fbmNoiseFragment from '@/PaleGL/shaders/fbm-noise.glsl';
import perlinNoiseFragment from '@/PaleGL/shaders/perlin-noise-fragment.glsl';
import randomNoiseFragment from '@/PaleGL/shaders/random-noise-fragment.glsl';
import simplexNoiseFragment from '@/PaleGL/shaders/simplex-noise.glsl';

const gridUniformName = 'uGridSize';

const TEXTURE_SIZE = 1024;

export const SharedTexturesTypes = {
    RANDOM_NOISE: 0,
    PERLIN_NOISE: 1,
    IMPROVE_NOISE: 2,
    SIMPLEX_NOISE: 3,
    FBM_NOISE: 4,
} as const;

export type SharedTexturesType = (typeof SharedTexturesTypes)[keyof typeof SharedTexturesTypes];

// type SharedTexture = {
//     texture: Texture;
//     needsUpdate: boolean;
//     // update: (time: number) => void;
//     // render: (time: number) => void;
//     effectMaterial: Material;
//     effectRenderTarget: RenderTarget;
//     compositeMaterial: Material;
//     compositeRenderTarget: RenderTarget;
// };

export type SharedTextures = Map<SharedTexturesType, EffectTextureSystem>;

type SharedTextureInfo = {
    key: SharedTexturesType;
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

const sharedTextureInfos: SharedTextureInfo[] = [
    {
        key: SharedTexturesTypes.FBM_NOISE,
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        effectFragmentShader: fbmNoiseFragment,
        effectUniforms: [
            {
                name: UniformNames.Time,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: gridUniformName,
                type: UniformTypes.Vector2,
                value: createVector2(4.4, 4.4),
            },
            {
                name: 'uOctaves',
                type: UniformTypes.Float,
                value: 8,
            },
            {
                name: 'uAmplitude',
                type: UniformTypes.Float,
                value: 0.307,
            },
            {
                name: 'uFrequency',
                type: UniformTypes.Float,
                value: 1.357,
            },
            {
                name: 'uFactor',
                type: UniformTypes.Float,
                value: 0.597,
            },
        ],
        tilingEnabled: true,
        edgeMaskMix: 1,
        remapMin: 0,
        remapMax: 1,
    },
    ...[
        {
            key: SharedTexturesTypes.RANDOM_NOISE,
            width: TEXTURE_SIZE,
            height: TEXTURE_SIZE,
            effectFragmentShader: randomNoiseFragment,
            effectUniforms: [
                {
                    name: UniformNames.Time,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: gridUniformName,
                    type: UniformTypes.Vector2,
                    value: createVector2(TEXTURE_SIZE, TEXTURE_SIZE),
                },
            ],
            tilingEnabled: true,
            edgeMaskMix: 1,
            remapMin: 0,
            remapMax: 1,
            minFilter: TextureFilterTypes.Nearest,
            magFilter: TextureFilterTypes.Nearest,
        },
        {
            key: SharedTexturesTypes.PERLIN_NOISE,
            width: TEXTURE_SIZE,
            height: TEXTURE_SIZE,
            effectFragmentShader: perlinNoiseFragment,
            effectUniforms: [
                {
                    name: UniformNames.Time,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: gridUniformName,
                    type: UniformTypes.Vector2,
                    value: createVector2(4, 4),
                },
                {
                    name: 'uIsImproved',
                    type: UniformTypes.Float,
                    value: 0,
                },
            ],
            tilingEnabled: true,
            edgeMaskMix: 1,
            remapMin: 0,
            remapMax: 1,
        },
        {
            key: SharedTexturesTypes.IMPROVE_NOISE,
            width: TEXTURE_SIZE,
            height: TEXTURE_SIZE,
            effectFragmentShader: perlinNoiseFragment,
            effectUniforms: [
                {
                    name: UniformNames.Time,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: gridUniformName,
                    type: UniformTypes.Vector2,
                    value: createVector2(4, 4),
                },
                {
                    name: 'uIsImproved',
                    type: UniformTypes.Float,
                    value: 1,
                },
            ],
            tilingEnabled: true,
            edgeMaskMix: 1,
            remapMin: 0,
            remapMax: 1,
        },
        {
            key: SharedTexturesTypes.SIMPLEX_NOISE,
            width: TEXTURE_SIZE,
            height: TEXTURE_SIZE,
            effectFragmentShader: simplexNoiseFragment,
            effectUniforms: [
                {
                    name: UniformNames.Time,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: gridUniformName,
                    type: UniformTypes.Vector2,
                    value: createVector2(4, 4),
                },
            ],
            tilingEnabled: true,
            edgeMaskMix: 1,
            remapMin: 0,
            remapMax: 1,
        },
    ],
];

export function createSharedTextures({ gpu, renderer }: { gpu: Gpu; renderer: Renderer }): SharedTextures {
    const sharedTextures: SharedTextures = new Map();

    for (let i = 0; i < sharedTextureInfos.length; i++) {
        const sharedTextureInfo = sharedTextureInfos[i];
        const {
            key,
            // width,
            // height,
            // effectFragmentShader,
            // effectUniforms,
            // tilingEnabled,
            // edgeMaskMix,
            // remapMin,
            // remapMax,
            // minFilter,
            // magFilter,
            // update,
        } = sharedTextureInfo;

        const effectTextureSystem = createEffectTextureSystem(gpu, renderer, sharedTextureInfo);

        // const effectRenderTarget = createEffectTextureTarget({ gpu, width, height, minFilter, magFilter });
        // const compositeRenderTarget = createEffectTextureTarget({ gpu, width, height, minFilter, magFilter });

        // const effectMaterial = createMaterial({
        //     vertexShader: getPostProcessBaseVertexShader(),
        //     fragmentShader: effectFragmentShader,
        //     uniforms: effectUniforms,
        // });
        // const compositeMaterial = createMaterial({
        //     vertexShader: getPostProcessBaseVertexShader(),
        //     fragmentShader: effectTexturePostProcessFragment,
        //     uniforms: [
        //         {
        //             name: UniformNames.SrcTexture,
        //             type: UniformTypes.Texture,
        //             value: null,
        //         },
        //         {
        //             name: 'uTilingEnabled',
        //             type: UniformTypes.Float,
        //             value: tilingEnabled ? 1 : 0,
        //         },
        //         {
        //             name: 'uEdgeMaskMix',
        //             type: UniformTypes.Float,
        //             value: edgeMaskMix,
        //         },
        //         {
        //             name: 'uRemapMin',
        //             type: UniformTypes.Float,
        //             value: remapMin,
        //         },
        //         {
        //             name: 'uRemapMax',
        //             type: UniformTypes.Float,
        //             value: remapMax,
        //         },
        //     ],
        // });

        // tryStartMaterial(gpu, renderer, renderer.sharedQuad, effectMaterial);
        // tryStartMaterial(gpu, renderer, renderer.sharedQuad, compositeMaterial);
        // setMaterialUniformValue(compositeMaterial, UniformNames.SrcTexture, effectRenderTarget.texture);

        // const sharedTexture: SharedTexture = {
        //     texture: compositeRenderTarget.texture!,
        //     needsUpdate: false,
        //     effectMaterial,
        //     effectRenderTarget,
        //     compositeMaterial,
        //     compositeRenderTarget,
        // };

        // renderSharedTexture(renderer, sharedTexture, 0); // 最初なので一旦time=0でいいかという判断

        renderSharedTexture(renderer, effectTextureSystem, 0); // 最初なので一旦time=0でいいかという判断

        sharedTextures.set(key, effectTextureSystem);
    }

    return sharedTextures;
}

const renderMaterial = (renderer: Renderer, renderTarget: RenderTarget, material: Material) => {
    setRenderTargetToRendererAndClear(renderer, renderTarget, true);
    renderMesh(renderer, renderer.sharedQuad, material);
    setRenderTargetToRendererAndClear(renderer, null);
};

const renderSharedTexture = (renderer: Renderer, effectTextureSystem: EffectTextureSystem, time: number) => {
    setUniformValue(effectTextureSystem.effectMaterial.uniforms, UniformNames.Time, time);
    renderMaterial(renderer, effectTextureSystem.effectRenderTarget, effectTextureSystem.effectMaterial);
    if (effectTextureSystem.useComposite) {
        renderMaterial(renderer, effectTextureSystem.compositeRenderTarget!, effectTextureSystem.compositeMaterial!);
    }
};

export function renderSharedTextures(renderer: Renderer, sharedTextures: SharedTextures, time: number) {
    sharedTextures.forEach((sharedTexture) => {
        if (sharedTexture.needsUpdate) {
            renderSharedTexture(renderer, sharedTexture, time);
        }
    });
}
