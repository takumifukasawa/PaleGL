import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { ATTRIBUTE_NAME_POSITION, ATTRIBUTE_NAME_UV, ATTRIBUTE_NAME_NORMAL } from '@/PaleGL/constants.ts';
import {
    generateCylinderRings,
    generateDiskCap,
    generateQuadRingIndices,
} from '@/PaleGL/geometries/geometryHelpers.ts';

type TubeGeometryRawData = {
    positions: number[];
    normals: number[];
    uvs: number[];
    indices: number[];
    drawCount: number;
};

type TubeGeometryArgs = {
    gpu: Gpu;
    radius?: number;
    height?: number;
    radialSegments?: number;
    heightSegments?: number;
};

export const createTubeGeometryRawData = (
    radius: number = 0.5,
    height: number = 1,
    radialSegments: number = 8,
    heightSegments: number = 1
): TubeGeometryRawData => {
    radialSegments = Math.max(3, Math.floor(radialSegments));
    heightSegments = Math.max(1, Math.floor(heightSegments));

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const halfHeight = height / 2;

    let vertexIndex = 0;

    // 上面キャップ
    generateDiskCap(positions, normals, uvs, indices, halfHeight, radius, radialSegments, vertexIndex, false);
    vertexIndex += 1 + radialSegments + 1;

    // 円柱側面
    const cylinderStart = vertexIndex;
    generateCylinderRings(positions, normals, uvs, radius, height, radialSegments, heightSegments);
    vertexIndex += (heightSegments + 1) * (radialSegments + 1);

    // 円柱側面のインデックス
    for (let y = 0; y < heightSegments; y++) {
        const startA = cylinderStart + y * (radialSegments + 1);
        const startB = startA + radialSegments + 1;
        generateQuadRingIndices(indices, startA, startB, radialSegments);
    }

    // 下面キャップ
    generateDiskCap(positions, normals, uvs, indices, -halfHeight, radius, radialSegments, vertexIndex, true);

    return {
        positions,
        normals,
        uvs,
        indices,
        drawCount: indices.length,
    };
};

export const createTubeGeometry = (args: TubeGeometryArgs) => {
    const { gpu, radius = 0.5, height = 1, radialSegments = 8, heightSegments = 1 } = args;

    const rawData = createTubeGeometryRawData(radius, height, radialSegments, heightSegments);

    const attributes = [
        createAttribute(ATTRIBUTE_NAME_POSITION, new Float32Array(rawData.positions), 3),
        createAttribute(ATTRIBUTE_NAME_UV, new Float32Array(rawData.uvs), 2),
        createAttribute(ATTRIBUTE_NAME_NORMAL, new Float32Array(rawData.normals), 3),
    ];

    const geometry = createGeometry({
        gpu,
        attributes,
        indices: rawData.indices,
        drawCount: rawData.drawCount,
    });

    return geometry;
};
