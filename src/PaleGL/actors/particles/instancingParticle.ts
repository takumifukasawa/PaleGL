import { iterateAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { setGeometryAttribute } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import {
    ActorType,
    ATTRIBUTE_NAME_INSTANCE_ANIMATION_OFFSET,
    ATTRIBUTE_NAME_INSTANCE_EMISSIVE_COLOR,
    ATTRIBUTE_NAME_INSTANCE_POSITION,
    ATTRIBUTE_NAME_INSTANCE_ROTATION,
    ATTRIBUTE_NAME_INSTANCE_SCALE,
    ATTRIBUTE_NAME_INSTANCE_VELOCITY,
    ATTRIBUTE_NAME_INSTANCE_VERTEX_COLOR,
    ATTRIBUTE_USAGE_TYPE_STATIC_DRAW,
    MESH_TYPE_INSTANCING_PARTICLE,
    MeshType,
} from '@/PaleGL/constants.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { Material } from '@/PaleGL/materials/material.ts';

type DataPerInstance = {
    position?: number[];
    scale?: number[];
    rotation?: number[];
    velocity?: number[];
    color?: number[];
    emissiveColor?: number[];
    animationOffset?: number;
};

export type InstancingParticleArgs = {
    name?: string;
    mesh?: Mesh;
    type?: ActorType;
    meshType?: MeshType;
    geometry?: Geometry;
    material?: Material;
    instanceCount: number;
    makeDataPerInstanceFunction?: (index: number) => DataPerInstance;
    position?: number[][];
    scale?: number[][];
    rotation?: number[][];
    velocity?: number[][];
    color?: number[][];
    emissiveColor?: number[][];
    animationOffset?: number[];
    // vat
    // vatData?: VATData;
};

export type InstancingParticle = Mesh;

export const createInstancingParticle = (args: InstancingParticleArgs): InstancingParticle => {
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
        // default
        // vat
        // vatData,
        makeDataPerInstanceFunction,
    } = args;
    console.log(args);

    const mesh =
        args.mesh ||
        createMesh({
            // name: args.name || '',
            // meshType: args.meshType,
            // type: args.type || ACTOR_TYPE_INSTANCING_PARTICLE,
            geometry: args.geometry!,
            material: args.material!,
        });

    mesh.name = args.name || '';
    mesh.meshType = args.meshType || MESH_TYPE_INSTANCING_PARTICLE;
    mesh.castShadow = true; // TODO: 出し分け
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
        animationOffset: [],
    };

    let tmpPosition: number[] | undefined;
    let tmpScale: number[] | undefined;
    let tmpRotation: number[] | undefined;
    let tmpVelocity: number[] | undefined;
    let tmpColor: number[] | undefined;
    let tmpEmissiveColor: number[] | undefined;
    let tmpAnimationOffset: number | undefined;

    maton.range(instanceCount).forEach((_, i) => {
        if (makeDataPerInstanceFunction) {
            const perData = makeDataPerInstanceFunction(i);
            tmpPosition = perData.position;
            tmpScale = perData.scale;
            tmpRotation = perData.rotation;
            tmpVelocity = perData.velocity;
            tmpColor = perData.color; // RGBA
            tmpEmissiveColor = perData.emissiveColor; // RGBA
            tmpAnimationOffset = perData.animationOffset;
        }

        instanceInfo.position.push(tmpPosition || [0, 0, 0]);
        instanceInfo.scale.push(tmpScale || [1, 1, 1]);
        instanceInfo.rotation.push(tmpRotation || [0, 0, 0]);
        instanceInfo.velocity.push(tmpVelocity || [0, 0, 0]);
        instanceInfo.color.push(tmpColor || [1, 1, 1, 1]);
        instanceInfo.emissiveColor.push(tmpEmissiveColor || [0, 0, 0, 1]);
        instanceInfo.animationOffset.push(tmpAnimationOffset || 0);
    });

    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    setGeometryAttribute(
        mesh.geometry,
        createAttribute(
            ATTRIBUTE_NAME_INSTANCE_POSITION,
            new Float32Array(instanceInfo.position.flat()),
            3,
            0,
            0,
            ATTRIBUTE_USAGE_TYPE_STATIC_DRAW,
            1
        )
    );
    setGeometryAttribute(
        mesh.geometry,
        createAttribute(
            ATTRIBUTE_NAME_INSTANCE_SCALE,
            new Float32Array(instanceInfo.scale.flat()),
            3,
            0,
            0,
            ATTRIBUTE_USAGE_TYPE_STATIC_DRAW,
            1
        )
    );
    setGeometryAttribute(
        mesh.geometry,
        createAttribute(
            ATTRIBUTE_NAME_INSTANCE_ROTATION,
            new Float32Array(instanceInfo.rotation.flat()),
            3,
            0,
            0,
            ATTRIBUTE_USAGE_TYPE_STATIC_DRAW,
            1
        )
    );
    // aInstanceAnimationOffsetは予約語
    setGeometryAttribute(
        mesh.geometry,
        createAttribute(
            ATTRIBUTE_NAME_INSTANCE_ANIMATION_OFFSET,
            new Float32Array(instanceInfo.animationOffset.flat()),
            1,
            0,
            0,
            ATTRIBUTE_USAGE_TYPE_STATIC_DRAW,
            1
        )
    );
    setGeometryAttribute(
        mesh.geometry,
        createAttribute(
            ATTRIBUTE_NAME_INSTANCE_VERTEX_COLOR,
            new Float32Array(instanceInfo.color.flat()),
            4,
            0,
            0,
            ATTRIBUTE_USAGE_TYPE_STATIC_DRAW,
            1
        )
    );
    setGeometryAttribute(
        mesh.geometry,
        createAttribute(
            ATTRIBUTE_NAME_INSTANCE_EMISSIVE_COLOR,
            new Float32Array(instanceInfo.emissiveColor.flat()),
            4,
            0,
            0,
            ATTRIBUTE_USAGE_TYPE_STATIC_DRAW,
            1
        )
    );
    setGeometryAttribute(
        mesh.geometry,
        createAttribute(
            ATTRIBUTE_NAME_INSTANCE_VELOCITY,
            new Float32Array(instanceInfo.velocity.flat()),
            3,
            0,
            0,
            ATTRIBUTE_USAGE_TYPE_STATIC_DRAW,
            1
        )
    );

    overrideInstancingParticleMaterialSettings(mesh);

    return mesh;
};

export const overrideInstancingParticleMaterialSettings = (particle: Mesh) => {
    iterateAllMeshMaterials(particle, (mat) => {
        mat.isInstancing = true; // 強制trueにしちゃう
        mat.cachedArgs.isInstancing = true;
    });
};
