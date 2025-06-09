import {Mesh} from "@/PaleGL/actors/meshes/mesh.ts";
import {createMRTDoubleBuffer, swapMRTDoubleBuffer} from "@/PaleGL/core/doubleBuffer.ts";
import {TextureFilterTypes, TextureTypes, UniformNames, UniformTypes} from "@/PaleGL/constants.ts";
import {
    createGraphicsDoubleBuffer,
    GraphicsDoubleBuffer,
    updateMRTGraphicsDoubleBuffer
} from "@/PaleGL/core/graphicsDoubleBuffer.ts";
import {createInstancingParticle, InstancingParticleArgs} from "@/PaleGL/actors/particles/instancingParticle.ts";
import {Gpu} from "@/PaleGL/core/gpu.ts";
import {iterateAllMeshMaterials, setUniformValueToAllMeshMaterials} from "@/PaleGL/actors/meshes/meshBehaviours.ts";
import {createVector2} from "@/PaleGL/math/vector2.ts";
import {addUniformValue} from "@/PaleGL/core/uniforms.ts";
import {subscribeActorOnStart, subscribeActorOnUpdate} from "@/PaleGL/actors/actor.ts";
import {tryStartMaterial} from "@/PaleGL/core/renderer.ts";
import {maton} from "@/PaleGL/utilities/maton.ts";
import {updateTexture} from "@/PaleGL/core/texture.ts";
import {setMaterialUniformValue} from "@/PaleGL/materials/material.ts";
import {
    getReadPositionMap,
    getReadVelocityMap,
    getWritePositionMap,
    getWriteVelocityMap,
} from "@/PaleGL/actors/particles/gpuParticle.ts";

type PerInstanceData = {
    position: number[];
    velocity?: number[];
};

export type GPUTrailParticleArgs = InstancingParticleArgs & {
    gpu: Gpu;
    vatWidth: number;
    vatHeight: number;
    fragmentShader: string;
    // positionFragmentShader: string;
    // velocityFragmentShader: string;
    makePerVATInstanceDataFunction?: (index: number) => PerInstanceData;
};

// export type InstancingParticle = Mesh & { positionGraphicsDoubleBuffer: GraphicsDoubleBuffer };
export type GPUTrailParticle = Mesh & { mrtGraphicsDoubleBuffer: GraphicsDoubleBuffer };

export const createGPUTrailParticle = (args: GPUTrailParticleArgs) => {

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
        makePerVATInstanceDataFunction,
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


    const vatGPUParticle: GPUTrailParticle = { ...gpuParticle, mrtGraphicsDoubleBuffer };

    subscribeActorOnStart(vatGPUParticle, (args) => {
        tryStartMaterial(gpu, args.renderer, mrtGraphicsDoubleBuffer.geometry, mrtGraphicsDoubleBuffer.material);

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
