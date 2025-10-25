import { iterateAllMeshMaterials, setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import {
    TEXTURE_FILTER_TYPE_NEAREST,
    TEXTURE_TYPE_RGBA16F,
    UNIFORM_NAME_POSITION_MAP,
    UNIFORM_NAME_UP_MAP,
    UNIFORM_NAME_VAT_RESOLUTION,
    UNIFORM_NAME_VELOCITY_MAP,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_VECTOR2,

} from '@/PaleGL/constants.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
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
    MRTDoubleBuffer,
    updateMRTDoubleBufferAndSwap,
} from '@/PaleGL/core/doubleBuffer.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { subscribeActorOnStart, subscribeActorOnUpdate } from '@/PaleGL/actors/actor.ts';
import { Renderer, tryStartMaterial } from '@/PaleGL/core/renderer.ts';
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
        UNIFORM_NAME_VELOCITY_MAP,
        getReadVelocityMap(mrtDoubleBuffer)
    );

    // 更新した速度をposition更新doublebufferのuniformに設定
    // prettier-ignore
    setMaterialUniformValue(
        material,
        UNIFORM_NAME_POSITION_MAP,
        getReadPositionMap(mrtDoubleBuffer)
    );

    // prettier-ignore
    setMaterialUniformValue(
        material,
        UNIFORM_NAME_UP_MAP,
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
        minFilter: TEXTURE_FILTER_TYPE_NEAREST,
        magFilter: TEXTURE_FILTER_TYPE_NEAREST,
        textureTypes: [TEXTURE_TYPE_RGBA16F, TEXTURE_TYPE_RGBA16F], // 0: velocity, 1: position
    });

    const createUniforms = (): UniformsData => [
        [UNIFORM_NAME_VELOCITY_MAP, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_POSITION_MAP, UNIFORM_TYPE_TEXTURE, null],
        [UNIFORM_NAME_UP_MAP, UNIFORM_TYPE_TEXTURE, null],
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
        addUniformValue(mat.uniforms, UNIFORM_NAME_VELOCITY_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.uniforms, UNIFORM_NAME_POSITION_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.uniforms, UNIFORM_NAME_UP_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.uniforms, UNIFORM_NAME_VAT_RESOLUTION, UNIFORM_TYPE_VECTOR2, vatResolution);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_VELOCITY_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_POSITION_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_UP_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_VAT_RESOLUTION, UNIFORM_TYPE_VECTOR2, vatResolution);
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
        setUniformValueToAllMeshMaterials(gpuParticle, UNIFORM_NAME_VELOCITY_MAP, tmpReadVelocityMap);
        setUniformValueToAllMeshMaterials(gpuParticle, UNIFORM_NAME_POSITION_MAP, tmpReadPositionMap);
        setUniformValueToAllMeshMaterials(gpuParticle, UNIFORM_NAME_UP_MAP, tmpReadUpMap);
    });

    return vatGPUParticle;
};
