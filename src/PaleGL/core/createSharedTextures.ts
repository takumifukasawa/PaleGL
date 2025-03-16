import { createPlaneGeometry, PlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { createRenderTarget, RenderTarget } from '@/PaleGL/core/renderTarget.ts';
import {
    RenderTargetTypes,
    TextureFilterTypes,
    TextureWrapTypes,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import { createMaterial, Material, setMaterialUniformValue, startMaterial } from '@/PaleGL/materials/material.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Texture } from '@/PaleGL/core/texture.ts';
import { Renderer, renderMesh, setRendererRenderTarget } from '@/PaleGL/core/renderer.ts';
import effectTexturePostProcessFragment from '@/PaleGL/shaders/effect-texture-postprocess-fragment.glsl';
import randomNoiseFragment from '@/PaleGL/shaders/random-noise-fragment.glsl';
import perlinNoiseFragment from '@/PaleGL/shaders/perlin-noise-fragment.glsl';
import simplexNoiseFragment from '@/PaleGL/shaders/simplex-noise.glsl';
import fbmNoiseFragment from '@/PaleGL/shaders/fbm-noise.glsl';
import { setUniformValue, UniformsData } from '@/PaleGL/core/uniforms.ts';
import { getGeometryAttributeDescriptors } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { getPostProcessBaseVertexShader } from '@/PaleGL/postprocess/postProcessPassBase.ts';

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

export type SharedTexture = {
    texture: Texture;
    needsUpdate: boolean;
    // update: (time: number) => void;
    // render: (time: number) => void;
    planeGeometry: PlaneGeometry;
    effectMaterial: Material;
    effectRenderTarget: RenderTarget;
    compositeMaterial: Material;
    compositeRenderTarget: RenderTarget;
};

export type SharedTextures = Map<SharedTexturesType, SharedTexture>;

type SharedTextureInfo = {
    key: SharedTexturesType;
    width: number;
    height: number;
    effectFragmentShader: string;
    effectUniforms: UniformsData;
    tilingEnabled: boolean;
    edgeMaskMix: number;
    remapMin: number;
    remapMax: number;
    // update?: (time: number, effectMaterial: Material) => void;
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
    const planeGeometry = createPlaneGeometry({ gpu });

    const createEffectRenderTarget = ({ gpu, width, height }: { gpu: Gpu; width: number; height: number }) => {
        return createRenderTarget({
            gpu,
            width,
            height,
            type: RenderTargetTypes.RGBA,
            minFilter: TextureFilterTypes.Linear,
            magFilter: TextureFilterTypes.Linear,
            wrapS: TextureWrapTypes.Repeat,
            wrapT: TextureWrapTypes.Repeat,
        });
    };

    const planeGeometryAttributeDescriptors = getGeometryAttributeDescriptors(planeGeometry);

    const sharedTextures: SharedTextures = new Map();

    for (let i = 0; i < sharedTextureInfos.length; i++) {
        const sharedTextureInfo = sharedTextureInfos[i];
        const {
            key,
            width,
            height,
            effectFragmentShader,
            effectUniforms,
            tilingEnabled,
            edgeMaskMix,
            remapMin,
            remapMax,
            // update,
        } = sharedTextureInfo;
        const tmpRenderTarget = createEffectRenderTarget({ gpu, width, height });
        const ppRenderTarget = createEffectRenderTarget({ gpu, width, height });

        const tmpMaterial = createMaterial({
            vertexShader: getPostProcessBaseVertexShader(),
            fragmentShader: effectFragmentShader,
            uniforms: effectUniforms,
        });
        const ppMaterial = createMaterial({
            vertexShader: getPostProcessBaseVertexShader(),
            fragmentShader: effectTexturePostProcessFragment,
            uniforms: [
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
            ],
        });

        startMaterial(tmpMaterial, { gpu, attributeDescriptors: planeGeometryAttributeDescriptors });
        startMaterial(ppMaterial, { gpu, attributeDescriptors: planeGeometryAttributeDescriptors });
        setMaterialUniformValue(ppMaterial, UniformNames.SrcTexture, tmpRenderTarget.texture);

        const sharedTexture: SharedTexture = {
            // let needsRender: boolean = false;
            texture: ppRenderTarget.texture!,
            needsUpdate: false,
            // update: (time: number) => {
            //     // needsRender = false;
            //     if (update) {
            //         update(time, tmpMaterial);
            //         // needsRender = true;
            //     }
            // },
            // render: (time: number) => {
            //     if (false) {
            //         setUniformValue(tmpMaterial.uniforms, UniformNames.Time, time);
            //         render();
            //         // needsRender = false;
            //     }
            // },
            planeGeometry,
            effectMaterial: tmpMaterial,
            effectRenderTarget: tmpRenderTarget,
            compositeMaterial: ppMaterial,
            compositeRenderTarget: ppRenderTarget,
        };

        renderSharedTexture(renderer, sharedTexture, 0); // 最初なので一旦time=0でいいかという判断

        sharedTextures.set(key, sharedTexture);
    }

    return sharedTextures;
}

const renderMaterial = (
    renderer: Renderer,
    planeGeometry: PlaneGeometry,
    renderTarget: RenderTarget,
    material: Material
) => {
    setRendererRenderTarget(renderer, renderTarget, true);
    renderMesh(renderer, planeGeometry, material);
    setRendererRenderTarget(renderer, null);
};

const renderSharedTexture = (renderer: Renderer, sharedTexture: SharedTexture, time: number) => {
    setUniformValue(sharedTexture.effectMaterial.uniforms, UniformNames.Time, time);
    renderMaterial(
        renderer,
        sharedTexture.planeGeometry,
        sharedTexture.effectRenderTarget,
        sharedTexture.effectMaterial
    );
    renderMaterial(
        renderer,
        sharedTexture.planeGeometry,
        sharedTexture.compositeRenderTarget,
        sharedTexture.compositeMaterial
    );
};

export function renderSharedTextures(renderer: Renderer, sharedTextures: SharedTextures, time: number) {
    sharedTextures.forEach((sharedTexture) => {
        if (sharedTexture.needsUpdate) {
            renderSharedTexture(renderer, sharedTexture, time);
        }
    });
}

// export function getSharedTexture(sharedTextures: SharedTextures, key: SharedTexturesType): SharedTexture {
//     if (!sharedTextures.has(key)) {
//         console.error('invalid shared texture key');
//     }
//     return sharedTextures.get(key)!;
// }
