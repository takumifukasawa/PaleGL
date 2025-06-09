import { iterateAllMeshMaterials, setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { TextureFilterTypes, TextureTypes, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { addUniformValue } from '@/PaleGL/core/uniforms.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
import { createInstancingParticle, InstancingParticleArgs } from '@/PaleGL/actors/particles/instancingParticle.ts';
import {
    createGraphicsDoubleBuffer,
    GraphicsDoubleBuffer,
    updateMRTGraphicsDoubleBuffer,
} from '@/PaleGL/core/graphicsDoubleBuffer.ts';
import {
    createMRTDoubleBuffer,
    getReadMultipleRenderTargetOfMRTDoubleBuffer,
    getWriteMultipleRenderTargetOfMRTDoubleBuffer,
    MRTDoubleBuffer,
    swapMRTDoubleBuffer,
} from '@/PaleGL/core/doubleBuffer.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { subscribeActorOnStart, subscribeActorOnUpdate } from '@/PaleGL/actors/actor.ts';
import { tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { updateTexture } from '@/PaleGL/core/texture.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';

type DataPerInstance = {
    position: number[];
    velocity?: number[];
};

export type GPUParticleArgs = InstancingParticleArgs & {
    gpu: Gpu;
    vatWidth: number;
    vatHeight: number;
    fragmentShader: string;
    // positionFragmentShader: string;
    // velocityFragmentShader: string;
    makeStateDataPerInstanceFunction?: (index: number) => DataPerInstance;
};

// export type InstancingParticle = Mesh & { positionGraphicsDoubleBuffer: GraphicsDoubleBuffer };
export type GpuParticle = Mesh & { mrtGraphicsDoubleBuffer: GraphicsDoubleBuffer };

export const getReadVelocityMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getReadMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[0];
export const getReadPositionMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getReadMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[1];
export const getWriteVelocityMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getWriteMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[0];
export const getWritePositionMap = (mrtDoubleBuffer: MRTDoubleBuffer) =>
    getWriteMultipleRenderTargetOfMRTDoubleBuffer(mrtDoubleBuffer).textures[1];

export const createGPUParticle = (args: GPUParticleArgs): GpuParticle => {
    const {
        gpu,
        // particleMap = null,
        // mesh,
        // geometry,
        // material,
        // vertexShader,
        // fragmentShader,
        // particleNum,
        // default
        // vat
        instanceCount,
        vatWidth,
        vatHeight,
        fragmentShader,
        // positionFragmentShader,
        // velocityFragmentShader,
        makeStateDataPerInstanceFunction,
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

    const mrtGraphicsDoubleBuffer = createGraphicsDoubleBuffer({
        gpu,
        width: vatWidth,
        height: vatHeight,
        fragmentShader,
        uniforms: [
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
        ],
        doubleBuffer: mrtDoubleBuffer,
    });

    iterateAllMeshMaterials(gpuParticle, (mat) => {
        mat.useVAT = true;
        // depthが作られる前なのでdepthUniformsにも設定する
        const vatResolution = createVector2(vatWidth, vatHeight);
        addUniformValue(mat.uniforms, UniformNames.PositionMap, UniformTypes.Texture, null);
        addUniformValue(mat.depthUniforms, UniformNames.PositionMap, UniformTypes.Texture, null);
        addUniformValue(mat.uniforms, UniformNames.VATResolution, UniformTypes.Vector2, vatResolution);
        addUniformValue(mat.depthUniforms, UniformNames.VATResolution, UniformTypes.Vector2, vatResolution);
    });

    const vatGPUParticle: GpuParticle = { ...gpuParticle, mrtGraphicsDoubleBuffer };

    subscribeActorOnStart(vatGPUParticle, (args) => {
        tryStartMaterial(gpu, args.renderer, mrtGraphicsDoubleBuffer.geometry, mrtGraphicsDoubleBuffer.material);

        const positionDataArray: number[][] = [];
        const velocityDataArray: number[][] = [];
        let tmpPosition: number[] | undefined;
        let tmpVelocity: number[] | undefined;

        maton.range(instanceCount).forEach((_, i) => {
            if (makeStateDataPerInstanceFunction) {
                const perData = makeStateDataPerInstanceFunction(i);
                tmpPosition = perData.position;
                tmpVelocity = perData.velocity;
            }

            positionDataArray.push(tmpPosition || [0, 0, 0, 1]);
            velocityDataArray.push(tmpVelocity || [0, 0, 0, 0]);
        });

        const positionData = new Float32Array(Array.from(positionDataArray.flat()));
        const velocityData = new Float32Array(Array.from(velocityDataArray.flat()));

        // read, write どちらも初期値を与えておく

        updateTexture(getWriteVelocityMap(mrtDoubleBuffer), {
            data: velocityData,
        });
        updateTexture(getWritePositionMap(mrtDoubleBuffer), {
            data: positionData,
        });

        swapMRTDoubleBuffer(mrtDoubleBuffer);

        updateTexture(getWriteVelocityMap(mrtDoubleBuffer), {
            data: velocityData,
        });
        updateTexture(getWritePositionMap(mrtDoubleBuffer), {
            data: positionData,
        });

        swapMRTDoubleBuffer(mrtDoubleBuffer);
    });

    let tmpReadPositionMap;

    subscribeActorOnUpdate(vatGPUParticle, ({ renderer }) => {
        // velocity 更新前に前フレームのpositionをvelocityのuniformに設定する
        setMaterialUniformValue(
            mrtGraphicsDoubleBuffer.material,
            UniformNames.VelocityMap,
            getReadVelocityMap(mrtDoubleBuffer)
        );

        // 更新した速度をposition更新doublebufferのuniformに設定
        setMaterialUniformValue(
            mrtGraphicsDoubleBuffer.material,
            UniformNames.PositionMap,
            getReadPositionMap(mrtDoubleBuffer)
        );

        // // update velocity
        updateMRTGraphicsDoubleBuffer(renderer, mrtGraphicsDoubleBuffer);

        tmpReadPositionMap = getReadPositionMap(mrtDoubleBuffer);
        setUniformValueToAllMeshMaterials(gpuParticle, UniformNames.PositionMap, tmpReadPositionMap);
    });

    return vatGPUParticle;
};
