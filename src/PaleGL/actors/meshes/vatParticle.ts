import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
// import { Gpu } from '@/PaleGL/core/gpu.ts';
import { iterateAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { Material } from '@/PaleGL/materials/material.ts';

export type VATParticleArgs = {
    // gpu: Gpu;
    // mesh: Mesh;
    geometry: Geometry;
    material: Material;
    // vertexShader: string;
    // fragmentShader: string;
    // minPosition: Vector3;
    // maxPosition: Vector3;
    // minSize: Vector2 | number;
    // maxSize: Vector2 | number;
    // minColor: Color;
    // maxColor: Color;
    // particleNum: number;
    // particleMap?: Texture;
    // blendType?: BlendType;
    // vertexShaderModifiers?: VertexShaderModifiers;
    // fragmentShaderModifiers?: FragmentShaderModifiers;
};

export type VATParticle = Mesh;

export const createVATParticle = (args: VATParticleArgs) => {
    const {
        // gpu,
        // particleMap = null,
        geometry,
        material,
        // vertexShader,
        // fragmentShader,
        // particleNum,
    } = args;

    const mesh = createMesh({
        geometry,
        material,
    });

    iterateAllMeshMaterials(mesh, (mat) => (mat.useVAT = true));

    return mesh;
};
