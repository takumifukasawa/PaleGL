import { iterateAllMeshMaterials, setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { TextureFilterTypes, TextureTypes, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { addUniformValue } from '@/PaleGL/core/uniforms.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
import { createInstancingParticle, InstancingParticleArgs } from '@/PaleGL/actors/particles/instancingParticle.ts';
// import {
//     createGraphicsDoubleBuffer,
//     GraphicsDoubleBuffer,
// } from '@/PaleGL/core/graphicsDoubleBuffer.ts';
import {
    createMRTDoubleBuffer,
    getReadMultipleRenderTargetOfMRTDoubleBuffer,
    getWriteMultipleRenderTargetOfMRTDoubleBuffer,
    MRTDoubleBuffer,
    swapMRTDoubleBuffer,
    updateMRTDoubleBufferAndSwap,
} from '@/PaleGL/core/doubleBuffer.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { subscribeActorOnStart, subscribeActorOnUpdate } from '@/PaleGL/actors/actor.ts';
import { Renderer, tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { updateTexture } from '@/PaleGL/core/texture.ts';
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { createGraphicsDoubleBufferMaterial } from '@/PaleGL/core/graphicsDoubleBuffer.ts';

export type GPUParticleArgs = InstancingParticleArgs & {
    gpu: Gpu;
    vatWidth: number;
    vatHeight: number;
    initializeFragmentShader: string;
    updateFragmentShader: string;
};

export type GpuParticle = Mesh & { mrtDoubleBuffer: MRTDoubleBuffer };

const getReadVelocityMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getReadMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[0];
const getReadPositionMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getReadMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[1];
const getReadUpMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getReadMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[2];

const renderMRTDoubleBufferAndSwap = (renderer: Renderer, mrtDoubleBuffer: MRTDoubleBuffer, material: Material) => {
    // velocity 更新前に前フレームのpositionをvelocityのuniformに設定する
    // prettier-ignore
    setMaterialUniformValue(
        material,
        UniformNames.VelocityMap,
        getReadVelocityMap(mrtDoubleBuffer)
    );

    // 更新した速度をposition更新doublebufferのuniformに設定
    // prettier-ignore
    setMaterialUniformValue(
        material,
        UniformNames.PositionMap,
        getReadPositionMap(mrtDoubleBuffer)
    );

    // prettier-ignore
    setMaterialUniformValue(
        material,
        UniformNames.UpMap,
        getReadUpMap(mrtDoubleBuffer)
    );

    updateMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, material);
};

export const createGPUParticle = (args: GPUParticleArgs): GpuParticle => {
    const {
        gpu,
        vatWidth,
        vatHeight,
        initializeFragmentShader,
        updateFragmentShader,
    } = args;

    const gpuParticle = createInstancingParticle(args);

    const mrtDoubleBuffer = createMRTDoubleBuffer({
        gpu,
        name: 'mrt',
        width: vatWidth,
        height: vatHeight,
        minFilter: TextureFilterTypes.Nearest,
        magFilter: TextureFilterTypes.Nearest,
        textureTypes: [TextureTypes.RGBA16F, TextureTypes.RGBA16F], // 0: velocity, 1: position
    });

    const createUniforms = () => [
        {
            name: UniformNames.VelocityMap,
            type: UniformTypes.Texture,
            value: null,
        },
        {
            name: UniformNames.PositionMap,
            type: UniformTypes.Texture,
            value: null,
        },
        {
            name: UniformNames.UpMap,
            type: UniformTypes.Texture,
            value: null,
        },
    ];

    const materialForInitialize = createGraphicsDoubleBufferMaterial(
        initializeFragmentShader,
        vatWidth,
        vatHeight,
        createUniforms()
    );
    const materialForUpdate = createGraphicsDoubleBufferMaterial(
        updateFragmentShader,
        vatWidth,
        vatHeight,
        createUniforms()
    );

    iterateAllMeshMaterials(gpuParticle, (mat) => {
        mat.useVAT = true;
        // depthが作られる前なのでdepthUniformsにも設定する
        const vatResolution = createVector2(vatWidth, vatHeight);
        addUniformValue(mat.uniforms, UniformNames.VelocityMap, UniformTypes.Texture, null);
        addUniformValue(mat.uniforms, UniformNames.PositionMap, UniformTypes.Texture, null);
        addUniformValue(mat.uniforms, UniformNames.UpMap, UniformTypes.Texture, null);
        addUniformValue(mat.uniforms, UniformNames.VATResolution, UniformTypes.Vector2, vatResolution);
        addUniformValue(mat.depthUniforms, UniformNames.VelocityMap, UniformTypes.Texture, null);
        addUniformValue(mat.depthUniforms, UniformNames.PositionMap, UniformTypes.Texture, null);
        addUniformValue(mat.depthUniforms, UniformNames.UpMap, UniformTypes.Texture, null);
        addUniformValue(mat.depthUniforms, UniformNames.VATResolution, UniformTypes.Vector2, vatResolution);
    });

    const vatGPUParticle: GpuParticle = { ...gpuParticle, mrtDoubleBuffer };

    subscribeActorOnStart(vatGPUParticle, ({ renderer }) => {
        tryStartMaterial(gpu, renderer, renderer.sharedQuad, materialForInitialize);
        tryStartMaterial(gpu, renderer, renderer.sharedQuad, materialForUpdate);

        renderMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, materialForInitialize);
        renderMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, materialForInitialize);
    });

    let tmpReadVelocityMap;
    let tmpReadPositionMap;
    let tmpReadUpMap;

    subscribeActorOnUpdate(vatGPUParticle, ({ renderer }) => {
        renderMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, materialForUpdate);

        tmpReadVelocityMap = getReadVelocityMap(mrtDoubleBuffer);
        tmpReadPositionMap = getReadPositionMap(mrtDoubleBuffer);
        tmpReadUpMap = getReadUpMap(mrtDoubleBuffer);
        setUniformValueToAllMeshMaterials(gpuParticle, UniformNames.VelocityMap, tmpReadVelocityMap);
        setUniformValueToAllMeshMaterials(gpuParticle, UniformNames.PositionMap, tmpReadPositionMap);
        setUniformValueToAllMeshMaterials(gpuParticle, UniformNames.UpMap, tmpReadUpMap);
    });

    return vatGPUParticle;
};
