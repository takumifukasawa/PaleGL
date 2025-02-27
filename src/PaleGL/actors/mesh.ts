﻿import { Actor, ActorArgs, createActor } from '@/PaleGL/actors/actor.ts';
import { ActorType, ActorTypes,  } from '@/PaleGL/constants';
import {  Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { UniformValue } from '@/PaleGL/core/uniforms.ts';
import { updateObjectSpaceRaymarchMeshMaterial } from '@/PaleGL/actors/objectSpaceRaymarchMeshBehaviour.ts';

export type MeshOptionsArgs = {
    castShadow?: boolean;
    instanced?: boolean;
    autoGenerateDepthMaterial?: boolean;
    renderEnabled?: boolean;
};

export type MeshArgs = ActorArgs & {
    // required
    geometry: Geometry;
    // optional
    material?: Material;
    actorType?: ActorType;
    materials?: Material[];
    depthMaterial?: Material;
    depthMaterials?: Material[];
    // actorType?: ActorTypes,
} & MeshOptionsArgs;

export type Mesh = Actor & {
    geometry: Geometry;
    materials: Material[];
    depthMaterials: Material[];
    castShadow: boolean;
    instanced: boolean;
    autoGenerateDepthMaterial: boolean;
    renderEnabled: boolean;
};

export function createMesh({
    name,
    geometry,
    material,
    materials = [],
    depthMaterial,
    depthMaterials = [],
    actorType,
    castShadow = false,
    instanced = false,
    autoGenerateDepthMaterial = true,
    renderEnabled = true,
}: MeshArgs): Mesh {
    const actor = createActor({ name, type: actorType || ActorTypes.Mesh });

    // TODO: check material is array
    materials = material ? [material] : materials ? materials : [];
    depthMaterials = depthMaterial ? [depthMaterial] : depthMaterials ? depthMaterials : [];
    castShadow = !!castShadow;
    instanced = !!instanced;
    autoGenerateDepthMaterial = !!autoGenerateDepthMaterial;
    renderEnabled = !!renderEnabled;

    return {
        ...actor,
        geometry,
        materials,
        depthMaterials,
        castShadow,
        instanced,
        autoGenerateDepthMaterial,
        renderEnabled,
        // methods
        // start: startMesh,
    };
}


// -------------------------------------------------------

export const getMeshMaterial = (mesh: Mesh) => {
    if (hasMeshMaterials(mesh)) {
        console.warn('[Mesh.material getter] materials length > 1. material is head of materials.');
    }
    // return this.materials[0];
    return getMeshMainMaterial(mesh);
};

export const setMeshMaterial = (mesh: Mesh, material: Material) => {
    mesh.materials = [material];
};

export const getMeshMainMaterial = (mesh: Mesh) => {
    return mesh.materials[0];
};

export const hasMeshMaterials = (mesh: Mesh) => {
    return mesh.materials.length > 1;
};

// beforeRender({ gpu }: { gpu: GPU }) {
//     super.beforeRender({ gpu });
//     // this.materials.forEach(material => material.updateUniforms({ gpu }));
//     // this.depthMaterial.updateUniforms({ gpu });
// }

export type UpdateMeshMaterial = (mesh: Mesh, args: { camera: Camera }) => void;

export const updateMeshMaterialBehaviour: Partial<Record<ActorType, UpdateMeshMaterial>> = {
    [ActorTypes.ObjectSpaceRaymarchMesh]: updateObjectSpaceRaymarchMeshMaterial,
};

// TODO: render前の方がよい気がする
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const updateMeshMaterial: UpdateMeshMaterial = (mesh, { camera }) => {
    mesh.materials.forEach((material) => material.updateUniforms());

    updateMeshMaterialBehaviour[mesh.type]?.(mesh, { camera });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const updateMeshDepthMaterial = (mesh: Mesh, _args: { camera: Camera }) => {
    mesh.depthMaterials.forEach((material) => material.updateUniforms());
};

export const setUniformValueToMeshPairMaterial = (mesh: Mesh, i: number, name: string, newValue: UniformValue) => {
    setMaterialUniformValue(mesh.materials[i], name, newValue);
    setMaterialUniformValue(mesh.depthMaterials[i], name, newValue);
};

export const setUniformValueToAllMeshMaterials = (mesh: Mesh, name: string, newValue: UniformValue) => {
    mesh.materials.forEach((material) => setMaterialUniformValue(material, name, newValue));
    mesh.depthMaterials.forEach((material) => setMaterialUniformValue(material, name, newValue));
};

export const setCanRenderMeshMaterial = (mesh: Mesh, index: number, flag: boolean) => {
    mesh.materials[index].setCanRender(flag);
    mesh.depthMaterials[index].setCanRender(flag);
};
