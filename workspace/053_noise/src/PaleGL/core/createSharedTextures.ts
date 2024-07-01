import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry.ts';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { RenderTargetTypes, TextureFilterTypes, TextureWrapTypes, UniformTypes } from '@/PaleGL/constants.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { Renderer } from '@/PaleGL/core/Renderer.ts';
import effectTexturePostProcessFragment from '@/PaleGL/shaders/effect-texture-postprocess-fragment.glsl';
import randomNoiseFragment from '@/PaleGL/shaders/random-noise-fragment.glsl';
import perlinNoiseFragment from '@/PaleGL/shaders/perlin-noise-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';

export const SharedTexturesTypes = {
    RANDOM_NOISE: 0,
    PERLIN_NOISE: 1,
} as const;

export type SharedTexturesType = (typeof SharedTexturesTypes)[keyof typeof SharedTexturesTypes];

// export type SharedTextures = Map<SharedTexturesType, { texture: Texture; update: () => void }>;
export type SharedTextures = { [key in SharedTexturesType]: { texture: Texture; update: () => void } };

type SharedTextureInfo = {
    key: SharedTexturesType;
    width: number;
    height: number;
    effectFragmentShader: string;
    effectUniforms: UniformsData;
    postprocessFragmentShader: string;
    tilingEnabled: boolean;
    edgeMaskMix: number;
    remapMin: number;
    remapMax: number;
};

const sharedTextureInfos: SharedTextureInfo[] = [
    {
        key: SharedTexturesTypes.RANDOM_NOISE,
        width: 512,
        height: 512,
        effectFragmentShader: randomNoiseFragment,
        effectUniforms: [
            {
                name: 'uTime',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uGridSize',
                type: UniformTypes.Vector2,
                value: new Vector2(512, 512),
            },
        ],
        postprocessFragmentShader: effectTexturePostProcessFragment,
        tilingEnabled: true,
        edgeMaskMix: 1,
        remapMin: 0,
        remapMax: 1,
    },
    {
        key: SharedTexturesTypes.PERLIN_NOISE,
        width: 512,
        height: 512,
        effectFragmentShader: perlinNoiseFragment,
        effectUniforms: [
            {
                name: 'uTime',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uGridSize',
                type: UniformTypes.Vector2,
                value: new Vector2(4, 4),
            },
        ],
        postprocessFragmentShader: effectTexturePostProcessFragment,
        tilingEnabled: true,
        edgeMaskMix: 1,
        remapMin: 0,
        remapMax: 1,
    },
];

export function createSharedTextures({ gpu, renderer }: { gpu: GPU; renderer: Renderer }): SharedTextures {
    const planeGeometry = new PlaneGeometry({ gpu });

    const createEffectRenderTarget = ({ gpu, width, height }: { gpu: GPU; width: number; height: number }) => {
        return new RenderTarget({
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

    const renderMaterial = (renderTarget: RenderTarget, material: Material) => {
        renderer.setRenderTarget(renderTarget, true);
        renderer.renderMesh(planeGeometry, material);
        renderer.setRenderTarget(null);
    };

    const planeGeometryAttributeDescriptors = planeGeometry.getAttributeDescriptors();

    const sharedTextures: SharedTextures = sharedTextureInfos.reduce((acc, current) => {
        const {
            key,
            width,
            height,
            effectFragmentShader,
            effectUniforms,
            postprocessFragmentShader,
            tilingEnabled,
            edgeMaskMix,
            remapMin,
            remapMax,
        } = current;
        const tmpRenderTarget = createEffectRenderTarget({ gpu, width, height });
        const ppRenderTarget = createEffectRenderTarget({ gpu, width, height });
        const tmpMaterial = new Material({
            vertexShader: PostProcessPassBase.baseVertexShader,
            fragmentShader: effectFragmentShader,
            uniforms: effectUniforms,
        });
        const ppMaterial = new Material({
            vertexShader: PostProcessPassBase.baseVertexShader,
            fragmentShader: postprocessFragmentShader,
            uniforms: [
                {
                    name: 'uSrcTexture',
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

        tmpMaterial.start({ gpu, attributeDescriptors: planeGeometryAttributeDescriptors });
        renderMaterial(tmpRenderTarget, tmpMaterial);

        ppMaterial.start({ gpu, attributeDescriptors: planeGeometryAttributeDescriptors });
        ppMaterial.uniforms.setValue('uSrcTexture', tmpRenderTarget.texture);

        renderMaterial(ppRenderTarget, ppMaterial);

        // sharedTextures.set(key, {
        //     texture: ppRenderTarget.texture!,
        //     update: () => {},
        // });
        acc[key] = {
            texture: ppRenderTarget.texture!,
            update: () => {},
        };

        return acc;
    }, {} as SharedTextures);

    // const randomNoiseRenderTarget = createEffectRenderTarget({ gpu, size: 512 });
    // const randomNoiseMaterial = new Material({
    //     vertexShader: PostProcessPassBase.baseVertexShader,
    //     fragmentShader: randomNoiseFragment,
    //     uniforms: [
    //         {
    //             name: 'uTime',
    //             type: UniformTypes.Float,
    //             value: 0,
    //         },
    //         {
    //             name: 'uGridSize',
    //             type: UniformTypes.Vector2,
    //             value: new Vector2(512, 512),
    //         },
    //     ],
    // });

    // const postProcessRenderTarget = createEffectRenderTarget({ gpu, width, height });
    // const postprocessMaterial = new Material({
    //     vertexShader: PostProcessPassBase.baseVertexShader,
    //     fragmentShader: effectTexturePostProcessFragment,
    //     uniforms: [
    //         {
    //             name: 'uSrcTexture',
    //             type: UniformTypes.Texture,
    //             value: null,
    //         },
    //         {
    //             name: 'uTilingEnabled',
    //             type: UniformTypes.Float,
    //             value: 1,
    //         },
    //         {
    //             name: 'uEdgeMaskMix',
    //             type: UniformTypes.Float,
    //             value: 1,
    //         },
    //         {
    //             name: 'uRemapMin',
    //             type: UniformTypes.Float,
    //             value: 0,
    //         },
    //         {
    //             name: 'uRemapMax',
    //             type: UniformTypes.Float,
    //             value: 1,
    //         },
    //     ],
    // });

    // randomNoiseMaterial.start({ gpu, attributeDescriptors: planeGeometryAttributeDescriptors });
    // renderMaterial(randomNoiseRenderTarget, randomNoiseMaterial);

    // postprocessMaterial.start({ gpu, attributeDescriptors: planeGeometryAttributeDescriptors });
    // postprocessMaterial.uniforms.setValue('uSrcTexture', randomNoiseRenderTarget.texture);

    // renderMaterial(postProcessRenderTarget, postprocessMaterial);

    // const sharedTextures: SharedTextures = {
    //     [SharedTexturesTypes.RANDOM_NOISE]: postProcessRenderTarget.texture!,
    // };

    return sharedTextures;
}
