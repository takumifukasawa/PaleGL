import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { ATTRIBUTE_NAME_POSITION, ATTRIBUTE_NAME_UV, ATTRIBUTE_NAME_NORMAL } from '@/PaleGL/constants.ts';

type ConeGeometryRawData = {
    positions: number[];
    normals: number[];
    uvs: number[];
    indices: number[];
    drawCount: number;
};

type ConeGeometryArgs = {
    gpu: Gpu;
    radius?: number;
    height?: number;
    radialSegments?: number;
    heightSegments?: number;
    bottomCap?: boolean;
};

export const createConeGeometryRawData = (
    radius: number = 0.5,
    height: number = 1,
    radialSegments: number = 8,
    heightSegments: number = 1,
    bottomCap: boolean = true
): ConeGeometryRawData => {
    radialSegments = Math.max(3, Math.floor(radialSegments));
    heightSegments = Math.max(1, Math.floor(heightSegments));

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const halfHeight = height / 2;
    const slantHeight = Math.sqrt(radius * radius + height * height);
    const normalY = radius / slantHeight;
    const normalXZ = height / slantHeight;

    // 頂点（apex）
    positions.push(0, halfHeight, 0);
    normals.push(0, 1, 0);
    uvs.push(0.5, 0);

    // 側面のリング
    for (let y = 0; y <= heightSegments; y++) {
        const v = y / heightSegments;
        const py = halfHeight - height * v;
        const currentRadius = radius * v;

        for (let x = 0; x <= radialSegments; x++) {
            const u = x / radialSegments;
            const phi = 2 * Math.PI * u;
            const sinP = Math.sin(phi);
            const cosP = Math.cos(phi);

            // 位置
            const px = currentRadius * cosP;
            const pz = currentRadius * sinP;
            positions.push(px, py, pz);

            // 法線（側面に垂直）
            const nx = normalXZ * cosP;
            const nz = normalXZ * sinP;
            normals.push(nx, normalY, nz);

            // UV
            uvs.push(u, v);
        }
    }

    // インデックス生成
    // 頂点から第1リングへの三角形
    const apexIndex = 0;
    const firstRingStart = 1;
    for (let x = 0; x < radialSegments; x++) {
        indices.push(apexIndex, firstRingStart + x, firstRingStart + x + 1);
    }

    // リング間の四角形
    for (let y = 0; y < heightSegments - 1; y++) {
        const ringStart = 1 + y * (radialSegments + 1);
        const nextRingStart = ringStart + radialSegments + 1;
        for (let x = 0; x < radialSegments; x++) {
            const a = ringStart + x;
            const b = nextRingStart + x;
            indices.push(a, b, a + 1);
            indices.push(b, b + 1, a + 1);
        }
    }

    // 底面キャップ
    if (bottomCap) {
        const bottomCenterIndex = positions.length / 3;
        positions.push(0, -halfHeight, 0);
        normals.push(0, -1, 0);
        uvs.push(0.5, 0.5);

        const lastRingStart = 1 + (heightSegments - 1) * (radialSegments + 1);
        for (let x = 0; x < radialSegments; x++) {
            indices.push(bottomCenterIndex, lastRingStart + x + 1, lastRingStart + x);
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

export const createConeGeometry = (args: ConeGeometryArgs) => {
    const {
        gpu,
        radius = 0.5,
        height = 1,
        radialSegments = 8,
        heightSegments = 1,
        bottomCap = true,
    } = args;

    const rawData = createConeGeometryRawData(radius, height, radialSegments, heightSegments, bottomCap);

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
