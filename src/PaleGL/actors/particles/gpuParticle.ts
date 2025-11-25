import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { iterateAllMeshMaterials, setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import {
    createInstancingParticle,
    InstancingParticleArgs,
    overrideInstancingParticleMaterialSettings,
} from '@/PaleGL/actors/particles/instancingParticle.ts';
import {
    FragmentShaderModifiers,
    MESH_TYPE_GPU_PARTICLE,
    TEXTURE_FILTER_TYPE_NEAREST,
    TEXTURE_TYPE_RGBA16F,
    UNIFORM_NAME_POSITION_MAP,
    UNIFORM_NAME_UP_MAP,
    UNIFORM_NAME_VAT_RESOLUTION,
    UNIFORM_NAME_VELOCITY_MAP,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_VECTOR2,
    UniformBlockName,
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
import { isActorEnabledInHierarchy } from '@/PaleGL/actors/actorBehaviours.ts';
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
import { deleteProgram } from '@/PaleGL/core/shader.ts';
import { createMaterial, Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';

const UPDATER_FOR_INITIALIZE_INDEX = 0;
const UPDATER_FOR_UPDATE_INDEX = 1;

export type GPUParticleArgsBase = InstancingParticleArgs & {
    gpu: Gpu;
    vatWidth: number;
    vatHeight: number;
    shaders: GPUParticleUpdaterShaders[];
    initialUpdaterIndex?: number;
};

export type GPUParticleArgs = GPUParticleArgsBase & {
    useVATLookForward?: boolean;
};

export type GPUParticleUpdaterShaders = {
    initializeFragmentShader: string;
    updateFragmentShader: string;
    initializeFragmentModifiers?: FragmentShaderModifiers;
    updateFragmentModifiers?: FragmentShaderModifiers;
    initializeUniforms?: UniformsData;
    initializeUniformBlockNames?: UniformBlockName[];
    updateUniforms?: UniformsData;
    updateUniformBlockNames?: UniformBlockName[];
};

// materialForInitialize: Material;
// materialForUpdate: Material;
export type GPUParticleUpdater = [Material, Material];

export type GpuParticleBase = Mesh & {
    gpu: Gpu;
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
    //
    needsReplaceUpdaterInfo: [number, [string, string]][]; // updater index, material for initialize, material for update
};

export type GpuParticle = GpuParticleBase & {
    useVATLookForward: boolean;
};

const getReadVelocityMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getReadMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[0];
const getReadPositionMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getReadMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[1];
const getReadUpMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getReadMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[2];

export const renderMRTDoubleBufferAndSwap = (
    renderer: Renderer,
    mrtDoubleBuffer: MRTDoubleBuffer,
    material: Material
) => {
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
    const { gpu, vatWidth, vatHeight, shaders, initialUpdaterIndex = 0, useVATLookForward = false } = args;

    const instancingParticle = createInstancingParticle({ ...args, meshType: MESH_TYPE_GPU_PARTICLE });

    const mrtDoubleBuffer = createMRTDoubleBuffer({
        gpu,
        // CUSTOM_BEGIN comment out
        // name: 'mrt',
        // CUSTOM_END
        width: vatWidth,
        height: vatHeight,
        minFilter: TEXTURE_FILTER_TYPE_NEAREST,
        magFilter: TEXTURE_FILTER_TYPE_NEAREST,
        textureTypes: [TEXTURE_TYPE_RGBA16F, TEXTURE_TYPE_RGBA16F, TEXTURE_TYPE_RGBA16F], // 0: velocity, 1: position, 2: up
    });

    const createUniforms = (): UniformsData => [
        [UNIFORM_NAME_VELOCITY_MAP, UNIFORM_TYPE_TEXTURE],
        [UNIFORM_NAME_POSITION_MAP, UNIFORM_TYPE_TEXTURE],
        [UNIFORM_NAME_UP_MAP, UNIFORM_TYPE_TEXTURE],
        [UNIFORM_NAME_VAT_RESOLUTION, UNIFORM_TYPE_VECTOR2, createVector2(vatWidth, vatHeight)],
    ];

    const updaters: GPUParticleUpdater[] = shaders.map((initializer) => {
        const {
            initializeFragmentShader,
            initializeFragmentModifiers,
            updateFragmentShader,
            updateFragmentModifiers,
            initializeUniforms = [],
            initializeUniformBlockNames = [],
            updateUniforms = [],
            updateUniformBlockNames = [],
        } = initializer;
        const materialForInitialize = createGraphicsDoubleBufferMaterial(
            initializeFragmentShader,
            vatWidth,
            vatHeight,
            [...initializeUniforms, ...createUniforms()],
            // [...initializeUniformBlockNames, UNIFORM_BLOCK_NAME_TIMELINE],
            [...initializeUniformBlockNames],
            initializeFragmentModifiers
        );
        const materialForUpdate = createGraphicsDoubleBufferMaterial(
            updateFragmentShader,
            vatWidth,
            vatHeight,
            [...updateUniforms, ...createUniforms()],
            // [...updateUniformBlockNames, UNIFORM_BLOCK_NAME_TIMELINE],
            [...updateUniformBlockNames],
            updateFragmentModifiers
        );
        return [materialForInitialize, materialForUpdate];
    });

    const gpuParticle: GpuParticle = {
        ...instancingParticle,
        gpu,
        mrtDoubleBuffer,
        // materialForInitialize,
        // materialForUpdate,
        vatWidth,
        vatHeight,
        prevUpdaterIndex: initialUpdaterIndex,
        updaterIndex: initialUpdaterIndex,
        updaters,
        needsReplaceUpdaterInfo: [],
        useVATLookForward,
    };

    addActorComponent(gpuParticle, createGPUParticleController(gpuParticle));

    overrideGPUParticleMaterialSettings(gpuParticle);

    subscribeActorOnStart(gpuParticle, ({ renderer }) => {
        for (let i = 0; i < gpuParticle.updaters.length; i++) {
            const [materialForInitialize, materialForUpdate] = gpuParticle.updaters[i];
            tryStartMaterial(gpu, renderer, renderer.sharedQuad, materialForInitialize);
            tryStartMaterial(gpu, renderer, renderer.sharedQuad, materialForUpdate);
        }
        resetGPUParticleByInitialize(renderer, gpuParticle);
    });

    let tmpReadVelocityMap;
    let tmpReadPositionMap;
    let tmpReadUpMap;
    let prevIsActorEnabledInHierarchy = false;
    let currentActorEnabledInHierarchy = false;

    subscribeActorOnUpdate(gpuParticle, ({ gpu, renderer }) => {
        // particleがenabledになったら強制的に初期化
        currentActorEnabledInHierarchy = isActorEnabledInHierarchy(gpuParticle);
        if (currentActorEnabledInHierarchy && !prevIsActorEnabledInHierarchy) {
            resetGPUParticleByInitialize(renderer, gpuParticle);
        }
        prevIsActorEnabledInHierarchy = currentActorEnabledInHierarchy;

        // 更新すべきupdaterを確認
        checkNeedsReplaceGPUParticleUpdater(gpu, renderer, gpuParticle);

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
        mat.useVATLookForward = gpuParticle.useVATLookForward;
        mat.cachedArgs.useVATLookForward = gpuParticle.useVATLookForward;
        // depthが作られる前なのでdepthUniformsにも設定する
        const vatResolution = createVector2(gpuParticle.vatWidth, gpuParticle.vatHeight);
        addUniformValue(mat.uniforms, UNIFORM_NAME_VELOCITY_MAP, UNIFORM_TYPE_TEXTURE);
        addUniformValue(mat.uniforms, UNIFORM_NAME_POSITION_MAP, UNIFORM_TYPE_TEXTURE);
        addUniformValue(mat.uniforms, UNIFORM_NAME_UP_MAP, UNIFORM_TYPE_TEXTURE);
        addUniformValue(mat.uniforms, UNIFORM_NAME_VAT_RESOLUTION, UNIFORM_TYPE_VECTOR2, vatResolution);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_VELOCITY_MAP, UNIFORM_TYPE_TEXTURE);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_POSITION_MAP, UNIFORM_TYPE_TEXTURE);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_UP_MAP, UNIFORM_TYPE_TEXTURE);
        addUniformValue(mat.depthUniforms, UNIFORM_NAME_VAT_RESOLUTION, UNIFORM_TYPE_VECTOR2, vatResolution);
    });
};

export const resetGPUParticleByInitialize = (renderer: Renderer, gpuParticle: GpuParticleBase) => {
    const [materialForInitialize] = gpuParticle.updaters[gpuParticle.updaterIndex];
    const { mrtDoubleBuffer } = gpuParticle;
    renderMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, materialForInitialize);
    renderMRTDoubleBufferAndSwap(renderer, mrtDoubleBuffer, materialForInitialize);
};

export const switchGPUParticleUpdater = (gpuParticle: GpuParticleBase, index: number) => {
    gpuParticle.updaterIndex = index;
};

// 更新用のマテリアルを差し替え。shaderのcompileなどはupdateで行う
export const replaceGPUParticleMaterial = (gpuParticle: GpuParticle, index: number, updaters: [Material, Material]) => {
    gpuParticle.updaters[index] = updaters;
};

export const replaceGPUParticleUpdater = (
    gpuParticle: GpuParticleBase,
    updaterIndex: number,
    fragmentShaders: [string, string]
) => {
    gpuParticle.needsReplaceUpdaterInfo.push([updaterIndex, fragmentShaders]);
};

// 更新すべきupdaterがあったら更新
export const checkNeedsReplaceGPUParticleUpdater = (gpu: Gpu, renderer: Renderer, gpuParticle: GpuParticleBase) => {
    while (gpuParticle.needsReplaceUpdaterInfo.length) {
        const elem = gpuParticle.needsReplaceUpdaterInfo.pop();
        if (elem) {
            const [updaterIndex, [fragmentShaderForInitialize, fragmentShaderForUpdate]] = elem;
            replaceGPUParticleUpdaterByArgsInternal(gpu, renderer, gpuParticle, updaterIndex, [
                fragmentShaderForInitialize,
                fragmentShaderForUpdate,
            ]);
            resetGPUParticleByInitialize(renderer, gpuParticle);
        }
    }
};

export const replaceGPUParticleUpdaterByArgsInternal = (
    gpu: Gpu,
    renderer: Renderer,
    gpuParticle: GpuParticleBase,
    updaterIndex: number,
    [fragmentShaderForInitialize, fragmentShaderForUpdate]: [string, string]
    // needsStart = true
) => {
    // TODO: uniformsの中身を引き継いだ方がいいと思われる
    replaceGPUParticleUpdaterMaterialInternal(
        gpu,
        renderer,
        gpuParticle,
        updaterIndex,
        UPDATER_FOR_INITIALIZE_INDEX,
        fragmentShaderForInitialize
    );
    replaceGPUParticleUpdaterMaterialInternal(
        gpu,
        renderer,
        gpuParticle,
        updaterIndex,
        UPDATER_FOR_UPDATE_INDEX,
        fragmentShaderForUpdate
    );
};

export const replaceGPUParticleUpdaterMaterialInternal = (
    gpu: Gpu,
    renderer: Renderer,
    gpuParticle: GpuParticleBase,
    updaterIndex: number,
    materialIndex: number,
    fragmentShader: string
) => {
    const oldMaterial = gpuParticle.updaters[updaterIndex][materialIndex];

    if (oldMaterial.shader) {
        deleteProgram(gpu.gl, oldMaterial.shader.glObject);
    }

    gpuParticle.updaters[updaterIndex][materialIndex] = createMaterial({
        ...oldMaterial.cachedArgs,
        ...{
            fragmentShader,
        },
    });

    const newMaterial = gpuParticle.updaters[updaterIndex][materialIndex];

    tryStartMaterial(gpu, renderer, renderer.sharedQuad, newMaterial);
};
