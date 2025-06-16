import { TextureFilterTypes, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';
import {
    createEffectTextureSystem,
    EffectTextureInfo,
    EffectTextureSystem,
    renderEffectTexture
} from '@/PaleGL/core/effectTexture.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Renderer, renderMesh, setRenderTargetToRendererAndClear } from '@/PaleGL/core/renderer.ts';
import { RenderTarget } from '@/PaleGL/core/renderTarget.ts';
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
export type SharedTextures = Map<SharedTexturesType, EffectTextureSystem>;

type SharedTextureInfo = EffectTextureInfo & {
    key: SharedTexturesType;
};

const sharedTextureInfos: SharedTextureInfo[] = [
    {
        key: SharedTexturesTypes.FBM_NOISE,
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        effectFragmentShader: fbmNoiseFragment,
        effectUniforms: [
            // {
            //     name: UniformNames.Time,
            //     type: UniformTypes.Float,
            //     value: 0,
            // },
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
                // {
                //     name: UniformNames.Time,
                //     type: UniformTypes.Float,
                //     value: 0,
                // },
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
                // {
                //     name: UniformNames.Time,
                //     type: UniformTypes.Float,
                //     value: 0,
                // },
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
                // {
                //     name: UniformNames.Time,
                //     type: UniformTypes.Float,
                //     value: 0,
                // },
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
                // {
                //     name: UniformNames.Time,
                //     type: UniformTypes.Float,
                //     value: 0,
                // },
                {
                    name: gridUniformName,
                    type: UniformTypes.Vector2,
                    value: createVector2(4, 4),
                },
            ],
            // tilingEnabled: true,
            // edgeMaskMix: 1,
            // remapMin: 0,
            // remapMax: 1,
        },
    ],
];

export function createSharedTextures({ gpu, renderer }: { gpu: Gpu; renderer: Renderer }): SharedTextures {
    const sharedTextures: SharedTextures = new Map();

    for (let i = 0; i < sharedTextureInfos.length; i++) {
        const sharedTextureInfo = sharedTextureInfos[i];
        const { key } = sharedTextureInfo;

        const effectTextureSystem = createEffectTextureSystem(gpu, renderer, sharedTextureInfo);

        renderEffectTexture(renderer, effectTextureSystem);

        sharedTextures.set(key, effectTextureSystem);
    }

    return sharedTextures;
}


export function renderSharedTextures(renderer: Renderer, sharedTextures: SharedTextures) {
    sharedTextures.forEach((sharedTexture) => {
        if (sharedTexture.needsUpdate) {
            renderEffectTexture(renderer, sharedTexture);
        }
    });
}
