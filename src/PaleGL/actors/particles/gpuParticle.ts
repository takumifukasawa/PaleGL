import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { iterateAllMeshMaterials, setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import {
    createInstancingParticle,
    InstancingParticleArgs,
    overrideInstancingParticleMaterialSettings,
} from '@/PaleGL/actors/particles/instancingParticle.ts';
import {
    FragmentShaderModifiers,
    TEXTURE_FILTER_TYPE_NEAREST,
    TEXTURE_TYPE_RGBA16F,
    UNIFORM_NAME_POSITION_MAP,
    UNIFORM_NAME_UP_MAP,
    UNIFORM_NAME_VAT_RESOLUTION,
    UNIFORM_NAME_VELOCITY_MAP,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_VECTOR2,
} from '@/PaleGL/constants.ts';
import { addUniformValue, UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
// import {
//     createGraphicsDoubleBuffer,
//     GraphicsDoubleBuffer,
// } from '@/PaleGL/core/graphicsDoubleBuffer.ts';
import {
    addActorComponent,
    subscribeActorBeforeRender,
    subscribeActorOnStart,
    subscribeActorOnUpdate,
} from '@/PaleGL/actors/actor.ts';
import { createGPUParticleController } from '@/PaleGL/components/gpuParticleController.ts';
import {
    createMRTDoubleBuffer,
    getReadMultipleRenderTargetOfMRTDoubleBuffer,
    MRTDoubleBuffer,
    updateMRTDoubleBufferAndSwap,
} from '@/PaleGL/core/doubleBuffer.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createGraphicsDoubleBufferMaterial } from '@/PaleGL/core/graphicsDoubleBuffer.ts';
import { Renderer, tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { restElement } from '@babel/types';

export type GPUParticleArgs = InstancingParticleArgs & {
    gpu: Gpu;
    vatWidth: number;
    vatHeight: number;
    // initializeFragmentShader: string;
    // updateFragmentShader: string;
    // initializeFragmentModifiers?: FragmentShaderModifiers;
    // updateFragmentModifiers?: FragmentShaderModifiers;
    shaders: GPUParticleUpdaterShaders[];
    initialUpdaterIndex?: number;
};

export type GPUParticleUpdaterShaders = {
    initializeFragmentShader: string;
    updateFragmentShader: string;
    initializeFragmentModifiers?: FragmentShaderModifiers;
    updateFragmentModifiers?: FragmentShaderModifiers;
};

// materialForInitialize: Material;
// materialForUpdate: Material;
export type GPUParticleUpdater = [Material, Material];

export type GpuParticle = Mesh & {
    mrtDoubleBuffer: MRTDoubleBuffer;
    // materialForInitialize: Material;
    // materialForUpdate: Material;
    // vatWidth: number;
    // vatHeight: number;
    vatWidth: number;
    vatHeight: number;
    prevUpdaterIndex: number;
    updaterIndex: number;
    updaters: GPUParticleUpdater[];
};

const getReadVelocityMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getReadMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[0];
const getReadPositionMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getReadMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[1];
const getReadUpMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getReadMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[2];

export const renderMRTDoubleBufferAndSwap = (renderer: Renderer, mrtDoubleBuffer: MRTDoubleBuffer, material: Material) => {
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

// const getCurrentUpdater = (gpuParticle: GpuParticle) => {
//     return gpuParticle.updaters[gpuParticle.currentUpdaterIndex];
// }

export const createGPUParticle = (args: GPUParticleArgs): GpuParticle => {
    const {
        gpu,
        vatWidth,
        vatHeight,
        // initializeFragmentShader,
        // updateFragmentShader,
        // initializeFragmentModifiers,
        // updateFragmentModifiers,
        shaders,
        initialUpdaterIndex = 0,
    } = args;

    const instancingParticle = createInstancingParticle(args);

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

    const updaters: GPUParticleUpdater[] = shaders.map((initializer) => {
        const { initializeFragmentShader, initializeFragmentModifiers, updateFragmentShader, updateFragmentModifiers } =
            initializer;
        const materialForInitialize = createGraphicsDoubleBufferMaterial(
            initializeFragmentShader,
            vatWidth,
            vatHeight,
            createUniforms(),
            [],
            initializeFragmentModifiers
        );
        const materialForUpdate = createGraphicsDoubleBufferMaterial(
            updateFragmentShader,
            vatWidth,
            vatHeight,
            createUniforms(),
            [],
            updateFragmentModifiers
        );
        return [materialForInitialize, materialForUpdate];
    });

    // const materialForInitialize = createGraphicsDoubleBufferMaterial(
    //     initializeFragmentShader,
    //     vatWidth,
    //     vatHeight,
    //     createUniforms(),
    //     [],
    //     initializeFragmentModifiers
    // );
    // const materialForUpdate = createGraphicsDoubleBufferMaterial(
    //     updateFragmentShader,
    //     vatWidth,
    //     vatHeight,
    //     createUniforms(),
    //     [],
    //     updateFragmentModifiers
    // );

    const gpuParticle: GpuParticle = {
        ...instancingParticle,
        mrtDoubleBuffer,
        // materialForInitialize,
        // materialForUpdate,
        vatWidth,
        vatHeight,
        prevUpdaterIndex: initialUpdaterIndex,
        updaterIndex: initialUpdaterIndex,
        updaters,
    };

    addActorComponent(gpuParticle, createGPUParticleController(gpuParticle));

    overrideGPUParticleMaterialSettings(gpuParticle);

    subscribeActorOnStart(gpuParticle, ({ renderer }) => {
        for (let i = 0; i < gpuParticle.updaters.length; i++) {
            const [materialForInitialize, materialForUpdate] = gpuParticle.updaters[i];
            tryStartMaterial(gpu, renderer, renderer.sharedQuad, materialForInitialize);
            tryStartMaterial(gpu, renderer, renderer.sharedQuad, materialForUpdate);
        }
        // const [materialForInitialize, materialForUpdate] = gpuParticle.updaters[gpuParticle.updaterIndex];
        // tryStartMaterial(gpu, renderer, renderer.sharedQuad, materialForInitialize);
        // tryStartMaterial(gpu, renderer, renderer.sharedQuad, materialForUpdate);

        resetGPUParticleByInitialize(renderer, gpuParticle);
    });

    let tmpReadVelocityMap;
    let tmpReadPositionMap;
    let tmpReadUpMap;

    subscribeActorOnUpdate(gpuParticle, ({ renderer }) => {
        const [, materialForUpdate] = gpuParticle.updaters[gpuParticle.updaterIndex];
        renderMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, materialForUpdate);

        tmpReadVelocityMap = getReadVelocityMap(mrtDoubleBuffer);
        tmpReadPositionMap = getReadPositionMap(mrtDoubleBuffer);
        tmpReadUpMap = getReadUpMap(mrtDoubleBuffer);
        setUniformValueToAllMeshMaterials(instancingParticle, UNIFORM_NAME_VELOCITY_MAP, tmpReadVelocityMap);
        setUniformValueToAllMeshMaterials(instancingParticle, UNIFORM_NAME_POSITION_MAP, tmpReadPositionMap);
        setUniformValueToAllMeshMaterials(instancingParticle, UNIFORM_NAME_UP_MAP, tmpReadUpMap);
    });

    subscribeActorBeforeRender(gpuParticle, ({ renderer }) => {
        // renderの直前にMRTをリセットするかを確認
        if (gpuParticle.prevUpdaterIndex !== gpuParticle.updaterIndex) {
            console.log(`GPUParticle switch updater: ${gpuParticle.prevUpdaterIndex} -> ${gpuParticle.updaterIndex}`);
            resetGPUParticleByInitialize(renderer, gpuParticle);
        }
        gpuParticle.prevUpdaterIndex = gpuParticle.updaterIndex;
    });
    
    return gpuParticle;
};

export const overrideGPUParticleMaterialSettings = (gpuParticle: GpuParticle) => {
    if (!gpuParticle.materials[0].isInstancing) {
        overrideInstancingParticleMaterialSettings(gpuParticle);
    }
    iterateAllMeshMaterials(gpuParticle, (mat) => {
        mat.useVAT = true;
        mat.cachedArgs.useVAT = true;
        // depthが作られる前なのでdepthUniformsにも設定する
        const vatResolution = createVector2(gpuParticle.vatWidth, gpuParticle.vatHeight);
        addUniformValue(mat.uniforms, UNIFORM_NAME_VELOCITY_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.uniforms, UNIFORM_NAME_POSITION_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.uniforms, UNIFORM_NAME_UP_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.uniforms, UNIFORM_NAME_VAT_RESOLUTION, UNIFORM_TYPE_VECTOR2, vatResolution);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_VELOCITY_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_POSITION_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_UP_MAP, UNIFORM_TYPE_TEXTURE, null);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_VAT_RESOLUTION, UNIFORM_TYPE_VECTOR2, vatResolution);
    });
};

export const resetGPUParticleByInitialize = (renderer: Renderer, gpuParticle: GpuParticle) => {
    const [materialForInitialize] = gpuParticle.updaters[gpuParticle.updaterIndex];
    const { mrtDoubleBuffer } = gpuParticle;
    renderMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, materialForInitialize);
    renderMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, materialForInitialize);
};

export const switchGPUParticleUpdater = (gpuParticle: GpuParticle, index: number) => {
    gpuParticle.updaterIndex = index;
};
