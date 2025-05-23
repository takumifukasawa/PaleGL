import { iterateAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { createColorFromRGB } from '@/PaleGL/math/color.ts';
import { setGeometryAttribute } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { AttributeNames } from '@/PaleGL/constants.ts';
import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { Material } from '@/PaleGL/materials/material.ts';

export type GPUParticleArgs = {
    mesh?: Mesh;
    geometry?: Geometry;
    material?: Material;
    instanceCount: number;
    useVAT?: boolean;
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
        useVAT
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

    maton.range(instanceCount).forEach(() => {
        // const posRangeX = 20;
        // const posRangeZ = 20;
        // const px = (Math.random() * 2 - 1) * posRangeX;
        // const py = 0.5 + Math.random() * 2.;
        // const pz = (Math.random() * 2 - 1) * posRangeZ;
        // const p = [px, py, pz];
        // instanceInfo.position.push(p);
        instanceInfo.position.push([0, 0, 0]);

        // const baseScale = 0.04;
        // const randomScaleRange = 0.08;
        const baseScale = 0.2;
        const randomScaleRange = 0.6;
        const s = Math.random() * randomScaleRange + baseScale;
        // instanceInfo.scale.push([s, s * 2, s]);
        instanceInfo.scale.push([s, s, s]);

        instanceInfo.rotation.push([0, 0, 0]);

        instanceInfo.velocity.push([0, 0, 0]);

        const c = createColorFromRGB(
            Math.floor(Math.random() * 200 + 30),
            Math.floor(Math.random() * 80 + 20),
            Math.floor(Math.random() * 200 + 30)
        );
        instanceInfo.color.push([...c.e]);

        const ec = createColorFromRGB(0, 0, 0);
        instanceInfo.emissiveColor.push([...ec.e]);

        instanceInfo.animationOffset.push(Math.random() * 30);
    });


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
