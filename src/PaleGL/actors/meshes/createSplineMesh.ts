import { createMesh, Mesh, MeshArgs } from '@/PaleGL/actors/meshes/mesh.ts';
import { MESH_TYPE_SPLINE } from '@/PaleGL/constants.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import {
    createSplineMeshGeometry,
    SplineGeometry,
    SplineMeshModifiers,
} from '@/PaleGL/geometries/createSplineMeshGeometry.ts';
import { Vector3 } from '@/PaleGL/math/vector3.ts';

type CrossSection = { x: number; y: number }[];

export type SplineMesh = Mesh & {
    geometry: SplineGeometry;
};

// type CreateSplineMeshArgs = MeshArgs & {
//     gpu: Gpu;
//     controlPoints: Vector3[];
//     crossSection: CrossSection;
//     segmentSamples?: number;
//     dynamic?: boolean;
//     caps?: boolean;
//     modifiers?: SplineMeshModifiers;
// } & Partial<{ geometry: Geometry}>; // geometryのみoption化

type CreateSplineMeshArgs = Omit<MeshArgs, 'geometry'> & {
    gpu: Gpu;
    controlPoints: Vector3[];
    crossSection: CrossSection;
    segmentSamples?: number;
    dynamic?: boolean;
    caps?: boolean;
    modifiers?: SplineMeshModifiers;
} & Partial<{ geometry: SplineGeometry }>

export const createSplineMesh = (args: CreateSplineMeshArgs): SplineMesh => {
    const { gpu, name, controlPoints, crossSection, segmentSamples, dynamic, caps, modifiers } = args;

    const geometry = args.geometry || createSplineMeshGeometry({
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
    });

    return mesh as SplineMesh;
};
