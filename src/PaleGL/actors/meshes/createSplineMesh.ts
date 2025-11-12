import { Actor } from '@/PaleGL/actors/actor.ts';
import { UpdateActorFunc } from '@/PaleGL/actors/actorBehaviours.ts';
import { createMesh, Mesh, MeshArgs } from '@/PaleGL/actors/meshes/mesh.ts';
import { MESH_TYPE_SPLINE } from '@/PaleGL/constants.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import {
    createSplineMeshGeometry,
    SplineMeshData,
    SplineMeshModifiers,
    updateSplineMeshGeometry,
} from '@/PaleGL/geometries/createSplineMeshGeometry.ts';
import { copyVector3, Vector3 } from '@/PaleGL/math/vector3.ts';

type CrossSection = { x: number; y: number }[];

export type SplineMesh = Mesh & {
    geometry: Geometry;
    splineMeshData: SplineMeshData;
    needsUpdateGeometry: boolean;
};

type CreateSplineMeshArgs = Omit<MeshArgs, 'geometry'> & {
    gpu: Gpu;
    controlPoints: Vector3[];
    crossSection: CrossSection;
    segmentSamples?: number;
    dynamic?: boolean;
    caps?: boolean;
    modifiers?: SplineMeshModifiers;
};
// } & Partial<{ geometry: SplineGeometry }>;

export const createSplineMesh = (args: CreateSplineMeshArgs): SplineMesh => {
    const { gpu, name, controlPoints, crossSection, segmentSamples = 10, dynamic, caps = true, modifiers } = args;

    const geometry = createSplineMeshGeometry({
        gpu,
        controlPoints,
        crossSection,
        segmentSamples,
        dynamic,
        caps,
        modifiers,
    });

    const mesh = createMesh({
        ...args,
        // override
        name,
        meshType: MESH_TYPE_SPLINE,
        geometry,
    }) as SplineMesh;

    mesh.splineMeshData = {
        controlPoints,
        crossSection,
        segmentSamples,
        caps,
        modifiers,
    };
    mesh.needsUpdateGeometry = false;

    return mesh;
};

export const setSplineMeshControlPoint = (mesh: SplineMesh, index: number, point: Vector3): void => {
    copyVector3(mesh.splineMeshData.controlPoints[index], point);
    mesh.needsUpdateGeometry = true;
};

export const setSplineMeshControlPoints = (mesh: SplineMesh, updates: { index: number; point: Vector3 }[]): void => {
    updates.forEach(({ index, point }) => {
        copyVector3(mesh.splineMeshData.controlPoints[index], point);
    });
    mesh.needsUpdateGeometry = true;
};

export const updateSplineMeshBehaviour: UpdateActorFunc = (actor: Actor) => {
    const mesh = actor as SplineMesh;
    if (mesh.needsUpdateGeometry) {
        updateSplineMeshGeometry(mesh.geometry, mesh.splineMeshData);
        mesh.needsUpdateGeometry = false;
    }
};
