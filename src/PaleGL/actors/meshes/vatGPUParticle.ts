import { iterateAllMeshMaterials, setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { addUniformValue } from '@/PaleGL/core/uniforms.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
import { createGPUParticle, GPUParticleArgs } from '@/PaleGL/actors/meshes/gpuParticle.ts';
import {
    createGraphicsDoubleBuffer,
    GraphicsDoubleBuffer,
    updateGraphicsDoubleBuffer,
} from '@/PaleGL/core/graphicsDoubleBuffer.ts';
import {
    getReadRenderTargetOfDoubleBuffer,
    getWriteRenderTargetOfDoubleBuffer,
    swapDoubleBuffer,
} from '@/PaleGL/core/doubleBuffer.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { subscribeActorOnStart, subscribeActorOnUpdate } from '@/PaleGL/actors/actor.ts';
import { tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { updateTexture } from '@/PaleGL/core/texture.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';

type PerInstanceData = {
    position: number[];
    velocity: number[];
};

export type VATGPUParticleArgs = GPUParticleArgs & {
    gpu: Gpu;
    vatWidth: number;
    vatHeight: number;
    positionFragmentShader: string;
    velocityFragmentShader: string;
    makePerVATInstanceDataFunction?: (index: number) => PerInstanceData;
};

export type GPUParticle = Mesh & { positionGraphicsDoubleBuffer: GraphicsDoubleBuffer };

export const createVATGPUParticle = (args: VATGPUParticleArgs): GPUParticle => {
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
        positionFragmentShader,
        velocityFragmentShader,
        makePerVATInstanceDataFunction,
    } = args;

    const gpuParticle = createGPUParticle(args);

    iterateAllMeshMaterials(gpuParticle, (mat) => {
        mat.useVAT = true;
        // depthが作られる前なのでdepthUniformsにも設定する
        const vatResolution = createVector2(vatWidth, vatHeight);
        addUniformValue(mat.uniforms, UniformNames.VATPositionMap, UniformTypes.Texture, null);
        addUniformValue(mat.depthUniforms, UniformNames.VATPositionMap, UniformTypes.Texture, null);
        addUniformValue(mat.uniforms, UniformNames.VATResolution, UniformTypes.Vector2, vatResolution);
        addUniformValue(mat.depthUniforms, UniformNames.VATResolution, UniformTypes.Vector2, vatResolution);
    });

    const positionGraphicsDoubleBuffer = createGraphicsDoubleBuffer({
        gpu,
        width: vatWidth,
        height: vatHeight,
        fragmentShader: positionFragmentShader,
        type: RenderTargetTypes.RGBA16F,
        uniforms: [
            {
                name: UniformNames.VATVelocityMap,
                type: UniformTypes.Texture,
                value: null,
            },
        ],
    });

    const velocityGraphicsDoubleBuffer = createGraphicsDoubleBuffer({
        gpu,
        width: vatWidth,
        height: vatHeight,
        fragmentShader: velocityFragmentShader,
        type: RenderTargetTypes.RGBA16F,
    });

    const vatGPUParticle = { ...gpuParticle, positionGraphicsDoubleBuffer };

    subscribeActorOnStart(vatGPUParticle, (args) => {
        tryStartMaterial(
            gpu,
            args.renderer,
            positionGraphicsDoubleBuffer.geometry,
            positionGraphicsDoubleBuffer.material
        );
        tryStartMaterial(
            gpu,
            args.renderer,
            velocityGraphicsDoubleBuffer.geometry,
            velocityGraphicsDoubleBuffer.material
        );

        const positionDataArray: number[][] = [];
        const velocityDataArray: number[][] = [];
        let tmpPosition: number[] | undefined;
        let tmpVelocity: number[] | undefined;

        maton.range(instanceCount).forEach((_, i) => {
            if (makePerVATInstanceDataFunction) {
                const perData = makePerVATInstanceDataFunction(i);
                tmpPosition = perData.position;
                tmpVelocity = perData.velocity;
            }

            positionDataArray.push(tmpPosition || [0, 0, 0, 1]);
            velocityDataArray.push(tmpVelocity || [0, 0, 0, 0]);
        });

        const positionData = new Float32Array(Array.from(positionDataArray.flat()));
        const velocityData = new Float32Array(Array.from(velocityDataArray.flat()));

        // read, write どちらも初期値を与えておく

        updateTexture(getWriteRenderTargetOfDoubleBuffer(positionGraphicsDoubleBuffer.doubleBuffer).texture!, {
            data: positionData,
        });
        updateTexture(getWriteRenderTargetOfDoubleBuffer(velocityGraphicsDoubleBuffer.doubleBuffer).texture!, {
            data: velocityData,
        });

        swapDoubleBuffer(positionGraphicsDoubleBuffer.doubleBuffer);
        swapDoubleBuffer(velocityGraphicsDoubleBuffer.doubleBuffer);

        updateTexture(getWriteRenderTargetOfDoubleBuffer(positionGraphicsDoubleBuffer.doubleBuffer).texture!, {
            data: positionData,
        });
        updateTexture(getWriteRenderTargetOfDoubleBuffer(velocityGraphicsDoubleBuffer.doubleBuffer).texture!, {
            data: velocityData,
        });

        swapDoubleBuffer(positionGraphicsDoubleBuffer.doubleBuffer);
        swapDoubleBuffer(velocityGraphicsDoubleBuffer.doubleBuffer);
    });

    subscribeActorOnUpdate(vatGPUParticle, ({ renderer }) => {
        // update velocity
        updateGraphicsDoubleBuffer(renderer, velocityGraphicsDoubleBuffer);
        const readVelocityTexture = getReadRenderTargetOfDoubleBuffer(
            velocityGraphicsDoubleBuffer.doubleBuffer
        ).texture;
        setUniformValueToAllMeshMaterials(vatGPUParticle, UniformNames.VATVelocityMap, readVelocityTexture);

        // 更新した速度をposition更新doublebufferのuniformに設定
        setMaterialUniformValue(
            positionGraphicsDoubleBuffer.material,
            UniformNames.VATVelocityMap,
            getWriteRenderTargetOfDoubleBuffer(velocityGraphicsDoubleBuffer.doubleBuffer).texture
        );

        // update position
        updateGraphicsDoubleBuffer(renderer, positionGraphicsDoubleBuffer);
        const readPositionTexture = getReadRenderTargetOfDoubleBuffer(
            positionGraphicsDoubleBuffer.doubleBuffer
        ).texture;
        setUniformValueToAllMeshMaterials(vatGPUParticle, UniformNames.VATPositionMap, readPositionTexture);
    });

    return vatGPUParticle;
};
