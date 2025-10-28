import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { ATTRIBUTE_NAME_POSITION, ATTRIBUTE_NAME_UV, ATTRIBUTE_NAME_NORMAL } from '@/PaleGL/constants.ts';
import { generateQuadRingIndices, generateCylinderRings } from '@/PaleGL/geometries/geometryHelpers.ts';

type CapsuleGeometryRawData = {
    positions: number[];
    normals: number[];
    uvs: number[];
    indices: number[];
    drawCount: number;
};

type CapsuleGeometryArgs = {
    gpu: Gpu;
    radius?: number;
    height?: number;
    radialSegments?: number;
    heightSegments?: number;
    capSegments?: number;
    topCap?: boolean;
    bottomCap?: boolean;
};

export const createCapsuleGeometryRawData = (
    radius: number = 0.5,
    height: number = 1,
    radialSegments: number = 8,
    heightSegments: number = 1,
    capSegments: number = 4,
    topCap: boolean = true,
    bottomCap: boolean = true
): CapsuleGeometryRawData => {
    radialSegments = Math.max(3, Math.floor(radialSegments));
    heightSegments = Math.max(1, Math.floor(heightSegments));
    capSegments = Math.max(1, Math.floor(capSegments));

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const halfHeight = height / 2;

    let vertexIndex = 0;

    // 上極点
    if (topCap) {
        positions.push(0, halfHeight + radius, 0);
        normals.push(0, 1, 0);
        uvs.push(0.5, 0);
        vertexIndex++;
    }

    // 上半球
    if (topCap) {
        for (let y = 1; y <= capSegments; y++) {
            const v = y / capSegments;
            const theta = (Math.PI / 2) * v;
            const sinT = Math.sin(theta);
            const cosT = Math.cos(theta);

            for (let x = 0; x <= radialSegments; x++) {
                const u = x / radialSegments;
                const phi = 2 * Math.PI * u;
                const sinP = Math.sin(phi);
                const cosP = Math.cos(phi);

                const px = radius * sinT * cosP;
                const py = halfHeight + radius * cosT;
                const pz = radius * sinT * sinP;
                const nx = sinT * cosP;
                const ny = cosT;
                const nz = sinT * sinP;

                positions.push(px, py, pz);
                normals.push(nx, ny, nz);
                uvs.push(u, v * 0.25);
                vertexIndex++;
            }
        }
    }

    // 円柱部分
    generateCylinderRings(positions, normals, uvs, radius, height, radialSegments, heightSegments, 0.25, 0.5);
    vertexIndex += (heightSegments + 1) * (radialSegments + 1);

    // 下半球
    if (bottomCap) {
        for (let y = 1; y <= capSegments; y++) {
            const v = y / capSegments;
            const theta = Math.PI / 2 + (Math.PI / 2) * v;
            const sinT = Math.sin(theta);
            const cosT = Math.cos(theta);

            for (let x = 0; x <= radialSegments; x++) {
                const u = x / radialSegments;
                const phi = 2 * Math.PI * u;
                const sinP = Math.sin(phi);
                const cosP = Math.cos(phi);

                const px = radius * sinT * cosP;
                const py = -halfHeight + radius * cosT;
                const pz = radius * sinT * sinP;
                const nx = sinT * cosP;
                const ny = cosT;
                const nz = sinT * sinP;

                positions.push(px, py, pz);
                normals.push(nx, ny, nz);
                uvs.push(u, 0.75 + v * 0.25);
                vertexIndex++;
            }
        }
    }

    // 下極点
    if (bottomCap) {
        positions.push(0, -halfHeight - radius, 0);
        normals.push(0, -1, 0);
        uvs.push(0.5, 1);
        vertexIndex++;
    }

    // インデックス生成
    let currentIdx = 0;

    // 上極点のキャップ
    if (topCap) {
        const poleIdx = 0;
        const ringStart = 1;
        for (let x = 0; x < radialSegments; x++) {
            indices.push(poleIdx, ringStart + x + 1, ringStart + x);
        }
        currentIdx = 1 + (radialSegments + 1) * capSegments;
    }

    // 上半球の中間リング
    if (topCap) {
        const ringStart = 1;
        for (let y = 0; y < capSegments - 1; y++) {
            const startA = ringStart + y * (radialSegments + 1);
            const startB = startA + radialSegments + 1;
            generateQuadRingIndices(indices, startA, startB, radialSegments);
        }
    }

    // 円柱部分
    const cylinderStart = currentIdx;
    for (let y = 0; y < heightSegments; y++) {
        const startA = cylinderStart + y * (radialSegments + 1);
        const startB = startA + radialSegments + 1;
        generateQuadRingIndices(indices, startA, startB, radialSegments);
    }
    currentIdx += (heightSegments + 1) * (radialSegments + 1);

    // 円柱と下半球の接続
    if (bottomCap) {
        const cylinderLastRing = cylinderStart + heightSegments * (radialSegments + 1);
        const bottomFirstRing = currentIdx;
        generateQuadRingIndices(indices, cylinderLastRing, bottomFirstRing, radialSegments);
    }

    // 下半球の中間リング
    if (bottomCap) {
        for (let y = 0; y < capSegments - 1; y++) {
            const startA = currentIdx + y * (radialSegments + 1);
            const startB = startA + radialSegments + 1;
            generateQuadRingIndices(indices, startA, startB, radialSegments);
        }
    }

    // 下極点のキャップ
    if (bottomCap) {
        const poleIdx = vertexIndex - 1;
        const lastRingStart = poleIdx - radialSegments - 1;
        for (let x = 0; x < radialSegments; x++) {
            indices.push(poleIdx, lastRingStart + x, lastRingStart + x + 1);
        }
    }

    return {
        positions,
        normals,
        uvs,
        indices,
        drawCount: indices.length,
    };
};

export const createCapsuleGeometry = (args: CapsuleGeometryArgs) => {
    const {
        gpu,
        radius = 0.5,
        height = 1,
        radialSegments = 8,
        heightSegments = 1,
        capSegments = 4,
        topCap = true,
        bottomCap = true,
    } = args;

    const rawData = createCapsuleGeometryRawData(
        radius,
        height,
        radialSegments,
        heightSegments,
        capSegments,
        topCap,
        bottomCap
    );

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
