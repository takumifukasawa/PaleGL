import { iterateAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { createColorFromRGB } from '@/PaleGL/math/color.ts';
import { setGeometryAttribute } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { AttributeNames } from '@/PaleGL/constants.ts';
import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { Material } from '@/PaleGL/materials/material.ts';

type PerInstanceData = {
    position?: number[];
    scale?: number[];
    rotation?: number[];
    velocity?: number[];
    color?: number[];
    emissiveColor?: number[];
    animationOffset?: number;
}

export type GPUParticleArgs = {
    mesh?: Mesh;
    geometry?: Geometry;
    material?: Material;
    instanceCount: number;
    useVAT?: boolean;
    makePerInstanceDataFunction?: (index: number) => PerInstanceData;
};

export type GPUParticle = Mesh;

export const createGPUParticle = (args: GPUParticleArgs): GPUParticle => {
    const {
        // gpu,
        // particleMap = null,
        // mesh,
        // geometry,
        // material,
        // vertexShader,
        // fragmentShader,
        // particleNum,
        instanceCount,
        useVAT,
        makePerInstanceDataFunction
    } = args;

    const mesh =
        args.mesh ||
        createMesh({
            geometry: args.geometry!,
            material: args.material!,
        });

    mesh.castShadow = true;
    mesh.geometry.instanceCount = instanceCount;

    const instanceInfo: {
        position: number[][];
        scale: number[][];
        rotation: number[][];
        velocity: number[][];
        color: number[][];
        emissiveColor: number[][];
        animationOffset: number[];
    } = {
        position: [],
        scale: [],
        rotation: [],
        velocity: [],
        color: [],
        emissiveColor: [],
        animationOffset: []
    };

    if (makePerInstanceDataFunction) {
    maton.range(instanceCount).forEach((i) => {
        const perData = makePerInstanceDataFunction(i);
        instanceInfo.position.push(perData.position || [0, 0, 0]);
        instanceInfo.scale.push(perData.scale || [1, 1, 1]);
        instanceInfo.rotation.push(perData.rotation || [0, 0, 0]);
        instanceInfo.velocity.push(perData.velocity || [0, 0, 0]);
        instanceInfo.color.push(perData.color || [...(createColorFromRGB(1, 1, 1).e)]);
        instanceInfo.emissiveColor.push(perData.emissiveColor || [...(createColorFromRGB(0, 0, 0).e)]);
        instanceInfo.animationOffset.push(perData.animationOffset || 0);
    });
    }


    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    setGeometryAttribute(
        mesh.geometry,
        createAttribute({
            name: AttributeNames.InstancePosition,
            data: new Float32Array(instanceInfo.position.flat()),
            size: 3,
            divisor: 1,
        })
    );
    setGeometryAttribute(
        mesh.geometry,
        createAttribute({
            name: AttributeNames.InstanceScale,
            data: new Float32Array(instanceInfo.scale.flat()),
            size: 3,
            divisor: 1,
        })
    );
    setGeometryAttribute(
        mesh.geometry,
        createAttribute({
            name: AttributeNames.InstanceRotation,
            data: new Float32Array(instanceInfo.rotation.flat()),
            size: 3,
            divisor: 1,
        })
    );
    // aInstanceAnimationOffsetは予約語
    setGeometryAttribute(
        mesh.geometry,
        createAttribute({
            name: AttributeNames.InstanceAnimationOffset,
            data: new Float32Array(instanceInfo.animationOffset.flat()),
            size: 1,
            divisor: 1,
        })
    );
    setGeometryAttribute(
        mesh.geometry,
        createAttribute({
            name: AttributeNames.InstanceVertexColor,
            data: new Float32Array(instanceInfo.color.flat()),
            size: 4,
            divisor: 1,
        })
    );
    setGeometryAttribute(
        mesh.geometry,
        createAttribute({
            name: AttributeNames.InstanceEmissiveColor,
            data: new Float32Array(instanceInfo.emissiveColor.flat()),
            size: 4,
            divisor: 1,
        })
    );
    setGeometryAttribute(
        mesh.geometry,
        createAttribute({
            name: AttributeNames.InstanceVelocity,
            data: new Float32Array(instanceInfo.velocity.flat()),
            size: 3,
            divisor: 1,
        })
    );

    iterateAllMeshMaterials(mesh, (mat) => {
        mat.useVAT = !!useVAT;
        mat.isInstancing = true; // 強制trueにしちゃう
    });

    return mesh;
};
