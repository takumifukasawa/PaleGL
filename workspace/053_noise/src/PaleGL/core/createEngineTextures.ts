import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry.ts';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { RenderTargetTypes, TextureFilterTypes, TextureWrapTypes, UniformTypes } from '@/PaleGL/constants.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { Renderer } from '@/PaleGL/core/Renderer.ts';
import randomNoiseFragment from '@/PaleGL/shaders/random-noise-fragment.glsl';

export const EngineTexturesTypes = {
    RANDOM_NOISE: 0,
} as const;

export type EngineTexturesType = (typeof EngineTexturesTypes)[keyof typeof EngineTexturesTypes];

export type EngineTextures = {
    [EngineTexturesTypes.RANDOM_NOISE]: Texture;
};

export function createEngineTextures({ gpu, renderer }: { gpu: GPU; renderer: Renderer }): EngineTextures {
    const planeGeometry = new PlaneGeometry({ gpu });

    const createEffectRenderTarget = ({ gpu, size }: { gpu: GPU; size: number }) => {
        return new RenderTarget({
            gpu,
            width: size,
            height: size,
            type: RenderTargetTypes.RGBA,
            minFilter: TextureFilterTypes.Linear,
            magFilter: TextureFilterTypes.Linear,
            wrapS: TextureWrapTypes.Repeat,
            wrapT: TextureWrapTypes.Repeat,
        });
    };

    const renderMaterial = (renderTarget: RenderTarget, material: Material) => {
        renderer.setRenderTarget(renderTarget, true);
        material.start({ gpu, attributeDescriptors: planeGeometry.getAttributeDescriptors() });
        renderer.renderMesh(planeGeometry, randomNoiseMaterial);
        renderer.setRenderTarget(null);
    };

    const randomNoiseRenderTarget = createEffectRenderTarget({ gpu, size: 512 });
    const randomNoiseMaterial = new Material({
        vertexShader: PostProcessPassBase.baseVertexShader,
        fragmentShader: randomNoiseFragment,
        uniforms: [
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
    });

    renderMaterial(randomNoiseRenderTarget, randomNoiseMaterial);

    const engineTextures: EngineTextures = {
        [EngineTexturesTypes.RANDOM_NOISE]: randomNoiseRenderTarget.read.texture!,
    };

    return engineTextures;
}
