import {iterateAllMeshMaterials, setUniformValueToAllMeshMaterials} from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { createColorFromRGB } from '@/PaleGL/math/color.ts';
import { setGeometryAttribute } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { AttributeNames, RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';
import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { Material } from '@/PaleGL/materials/material.ts';
import { addUniformValue } from '@/PaleGL/core/uniforms.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
import { createGPUParticle, GPUParticleArgs } from '@/PaleGL/actors/meshes/gpuParticle.ts';
import {
    createGraphicsDoubleBuffer,
    GraphicsDoubleBuffer,
    updateGraphicsDoubleBuffer
} from '@/PaleGL/core/graphicsDoubleBuffer.ts';
import {
    DoubleBuffer,
    getReadRenderTargetOfDoubleBuffer,
    getWriteRenderTargetOfDoubleBuffer, swapDoubleBuffer
} from '@/PaleGL/core/doubleBuffer.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import {subscribeActorOnStart, subscribeActorOnUpdate} from "@/PaleGL/actors/actor.ts";
import {tryStartMaterial} from "@/PaleGL/core/renderer.ts";
import {updateTexture} from "@/PaleGL/core/texture.ts";

export type VATGPUParticleArgs = GPUParticleArgs & {
    gpu: Gpu;
    vatWidth: number;
    vatHeight: number;
    positionFragmentShader: string;
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
        vatWidth,
        vatHeight,
        positionFragmentShader,
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
        // type: RenderTargetTypes.R11F_G11F_B10F
        type: RenderTargetTypes.RGBA16F,
    });

    const vatGPUParticle = { ...gpuParticle, positionGraphicsDoubleBuffer };
    
    
    subscribeActorOnStart(vatGPUParticle, (args) => {
        tryStartMaterial(gpu, args.renderer, positionGraphicsDoubleBuffer.geometry, positionGraphicsDoubleBuffer.material);

        const dataArray = maton
            .range(vatWidth * vatHeight)
            .map((_, i) => {
                return [i * 2, 3, i * -2, 255];
            })
            .flat();
        const data = new Float32Array(Array.from(dataArray));

        // prettier-ignore
        updateTexture(
            getWriteRenderTargetOfDoubleBuffer(positionGraphicsDoubleBuffer.doubleBuffer).texture!,
            {
                data
            }
        );

        swapDoubleBuffer(positionGraphicsDoubleBuffer.doubleBuffer);
    })
    
    subscribeActorOnUpdate(vatGPUParticle, ({ renderer }) => {
        updateGraphicsDoubleBuffer(renderer, positionGraphicsDoubleBuffer);
        const readTexture = getReadRenderTargetOfDoubleBuffer(positionGraphicsDoubleBuffer.doubleBuffer).texture;
        setUniformValueToAllMeshMaterials(
            vatGPUParticle,
            UniformNames.VATPositionMap,
            readTexture
        );
    });
    
    return vatGPUParticle;
};
