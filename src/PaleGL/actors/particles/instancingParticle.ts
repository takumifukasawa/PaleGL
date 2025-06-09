import { iterateAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { setGeometryAttribute } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { AttributeNames } from '@/PaleGL/constants.ts';
import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
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
    mesh?: Mesh;
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
        makeDataPerInstanceFunction
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

    // const useVAT = !!vatData;

    iterateAllMeshMaterials(mesh, (mat) => {
        // mat.useVAT = useVAT;
        mat.isInstancing = true; // 強制trueにしちゃう
        // if (useVAT) {
        //     // depthが作られる前なのでdepthUniformsにも設定する
        //     const vatResolution = createVector2(vatData.width, vatData.height);
        //     addUniformValue(
        //         mat.uniforms,
        //         UniformNames.VATPositionMap,
        //         UniformTypes.Texture,
        //         null
        //     );
        //     addUniformValue(
        //         mat.depthUniforms,
        //         UniformNames.VATPositionMap,
        //         UniformTypes.Texture,
        //         null
        //     );
        //     addUniformValue(
        //         mat.uniforms,
        //         UniformNames.VATResolution,
        //         UniformTypes.Vector2,
        //         vatResolution
        //     );
        //     addUniformValue(
        //         mat.depthUniforms,
        //         UniformNames.VATResolution,
        //         UniformTypes.Vector2,
        //         vatResolution
        //     );
        // }
    });

    return mesh;
};
