import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { ATTRIBUTE_NAME_POSITION, ATTRIBUTE_NAME_UV, ATTRIBUTE_NAME_NORMAL } from '@/PaleGL/constants.ts';
import { generateQuadRingIndices } from '@/PaleGL/geometries/geometryHelpers.ts';

type TorusGeometryRawData = {
    positions: number[];
    normals: number[];
    uvs: number[];
    indices: number[];
    drawCount: number;
};

type TorusGeometryArgs = {
    gpu: Gpu;
    radius?: number;
    torusRadius?: number;
    radialSegments?: number;
    tubularSegments?: number;
};

export const createTorusGeometryRawData = (
    radius: number = 0.2,
    torusRadius: number = 1,
    radialSegments: number = 16,
    tubularSegments: number = 32
): TorusGeometryRawData => {
    radialSegments = Math.max(3, Math.floor(radialSegments));
    tubularSegments = Math.max(3, Math.floor(tubularSegments));

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // 頂点生成
    for (let j = 0; j <= tubularSegments; j++) {
        const v = j / tubularSegments;
        const theta = 2 * Math.PI * v;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        for (let i = 0; i <= radialSegments; i++) {
            const u = i / radialSegments;
            const phi = 2 * Math.PI * u;
            const cosPhi = Math.cos(phi);
            const sinPhi = Math.sin(phi);

            const px = (torusRadius + radius * cosPhi) * cosTheta;
            const py = radius * sinPhi;
            const pz = (torusRadius + radius * cosPhi) * sinTheta;

            const nx = cosPhi * cosTheta;
            const ny = sinPhi;
            const nz = cosPhi * sinTheta;

            positions.push(px, py, pz);
            normals.push(nx, ny, nz);
            uvs.push(u, v);
        }
    }

    // インデックス生成
    for (let j = 0; j < tubularSegments; j++) {
        const startA = j * (radialSegments + 1);
        const startB = (j + 1) * (radialSegments + 1);
        generateQuadRingIndices(indices, startA, startB, radialSegments);
    }

    return {
        positions,
        normals,
        uvs,
        indices,
        drawCount: indices.length,
    };
};

export const createTorusGeometry = (args: TorusGeometryArgs) => {
    const {
        gpu,
        radius = 0.2,
        torusRadius = 1,
        radialSegments = 16,
        tubularSegments = 32,
    } = args;

    const rawData = createTorusGeometryRawData(radius, torusRadius, radialSegments, tubularSegments);

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
