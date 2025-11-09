import {
    TEXTURE_FILTER_TYPE_NEAREST,
    UNIFORM_NAME_AMPLITUDE,
    UNIFORM_NAME_FACTOR,
    UNIFORM_NAME_FREQUENCY,
    UNIFORM_NAME_GRID_SIZE,
    UNIFORM_NAME_OCTAVES,
    UNIFORM_NAME_SPEED,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_VECTOR2,
} from '@/PaleGL/constants.ts';
import {
    createEffectTextureSystem,
    EffectTextureInfo,
    EffectTextureSystem,
    renderEffectTexture,
} from '@/PaleGL/core/effectTexture.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Renderer } from '@/PaleGL/core/renderer.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
import fbmNoiseFragment from '@/PaleGL/shaders/fbm-noise.glsl';
import perlinNoiseFragment from '@/PaleGL/shaders/perlin-noise-fragment.glsl';
import randomNoiseFragment from '@/PaleGL/shaders/random-noise-fragment.glsl';
import simplexNoiseFragment from '@/PaleGL/shaders/simplex-noise.glsl';

const gridUniformName = UNIFORM_NAME_GRID_SIZE;

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
            //     name: UNIFORM_NAME_TIME,
            //     type: UNIFORM_TYPE_FLOAT,
            //     value: 0,
            // },
            [gridUniformName, UNIFORM_TYPE_VECTOR2, createVector2(4.4, 4.4)],
            [UNIFORM_NAME_OCTAVES, UNIFORM_TYPE_FLOAT, 8],
            [UNIFORM_NAME_AMPLITUDE, UNIFORM_TYPE_FLOAT, 0.307],
            [UNIFORM_NAME_FREQUENCY, UNIFORM_TYPE_FLOAT, 1.357],
            [UNIFORM_NAME_FACTOR, UNIFORM_TYPE_FLOAT, 0.597],
            [UNIFORM_NAME_SPEED, UNIFORM_TYPE_FLOAT, 0],
        ],
        tilingEnabled: true,
        edgeMaskMix: 1,
        remapMin: 0,
        remapMax: 1,
    } as SharedTextureInfo,
    {
        key: SharedTexturesTypes.RANDOM_NOISE,
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        effectFragmentShader: randomNoiseFragment,
        effectUniforms: [
            // {
            //     name: UNIFORM_NAME_TIME,
            //     type: UNIFORM_TYPE_FLOAT,
            //     value: 0,
            // },
            [gridUniformName, UNIFORM_TYPE_VECTOR2, createVector2(TEXTURE_SIZE, TEXTURE_SIZE)],
            [UNIFORM_NAME_SPEED, UNIFORM_TYPE_FLOAT, 0],
        ],
        tilingEnabled: true,
        edgeMaskMix: 1,
        remapMin: 0,
        remapMax: 1,
        minFilter: TEXTURE_FILTER_TYPE_NEAREST,
        magFilter: TEXTURE_FILTER_TYPE_NEAREST,
    } as SharedTextureInfo,
    {
        key: SharedTexturesTypes.PERLIN_NOISE,
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        effectFragmentShader: perlinNoiseFragment,
        effectUniforms: [
            // {
            //     name: UNIFORM_NAME_TIME,
            //     type: UNIFORM_TYPE_FLOAT,
            //     value: 0,
            // },
            [gridUniformName, UNIFORM_TYPE_VECTOR2, createVector2(4, 4)],
            ['uIsImproved', UNIFORM_TYPE_FLOAT, 0],
            [UNIFORM_NAME_SPEED, UNIFORM_TYPE_FLOAT, 0],
        ],
        tilingEnabled: true,
        edgeMaskMix: 1,
        remapMin: 0,
        remapMax: 1,
    } as SharedTextureInfo,
    {
        key: SharedTexturesTypes.IMPROVE_NOISE,
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        effectFragmentShader: perlinNoiseFragment,
        effectUniforms: [
            // {
            //     name: UNIFORM_NAME_TIME,
            //     type: UNIFORM_TYPE_FLOAT,
            //     value: 0,
            // },
            [gridUniformName, UNIFORM_TYPE_VECTOR2, createVector2(4, 4)],
            ['uIsImproved', UNIFORM_TYPE_FLOAT, 1],
            [UNIFORM_NAME_SPEED, UNIFORM_TYPE_FLOAT, 0],
        ],
        tilingEnabled: true,
        edgeMaskMix: 1,
        remapMin: 0,
        remapMax: 1,
    } as SharedTextureInfo,
    {
        key: SharedTexturesTypes.SIMPLEX_NOISE,
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        effectFragmentShader: simplexNoiseFragment,
        effectUniforms: [
            // {
            //     name: UNIFORM_NAME_TIME,
            //     type: UNIFORM_TYPE_FLOAT,
            //     value: 0,
            // },
            [gridUniformName, UNIFORM_TYPE_VECTOR2, createVector2(4, 4)],
            [UNIFORM_NAME_SPEED, UNIFORM_TYPE_FLOAT, 0],
        ],
        tilingEnabled: true,
        edgeMaskMix: 1,
        remapMin: 0,
        remapMax: 1,
    } as SharedTextureInfo,
];

export const createSharedTextures = ({ gpu, renderer }: { gpu: Gpu; renderer: Renderer }): SharedTextures => {
    const sharedTextures: SharedTextures = new Map();

    for (let i = 0; i < sharedTextureInfos.length; i++) {
        const sharedTextureInfo = sharedTextureInfos[i];
        const { key } = sharedTextureInfo;

        const effectTextureSystem = createEffectTextureSystem(gpu, renderer, sharedTextureInfo);

        renderEffectTexture(renderer, effectTextureSystem);

        sharedTextures.set(key, effectTextureSystem);
    }

    return sharedTextures;
};

export const renderSharedTextures = (renderer: Renderer, sharedTextures: SharedTextures) => {
    sharedTextures.forEach((sharedTexture) => {
        if (sharedTexture.needsUpdate) {
            renderEffectTexture(renderer, sharedTexture);
        }
    });
};
