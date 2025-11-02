import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { ATTRIBUTE_NAME_POSITION, ATTRIBUTE_NAME_UV, ATTRIBUTE_NAME_NORMAL } from '@/PaleGL/constants.ts';

type GrassGeometryRawData = {
    positions: number[];
    normals: number[];
    uvs: number[];
    indices: number[];
    drawCount: number;
};

type GrassGeometryArgs = {
    gpu: Gpu;
    height?: number;
    width?: number;
    heightSegments?: number;
    tipWidth?: number;
};

export const createGrassGeometryRawData = (
    height: number = 1.0,
    width: number = 0.1,
    heightSegments: number = 3,
    tipWidth: number = 0
): GrassGeometryRawData => {
    heightSegments = Math.max(1, Math.floor(heightSegments));

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const halfWidth = width / 2;
    const halfTipWidth = tipWidth / 2;

    // 頂点生成
    for (let i = 0; i <= heightSegments; i++) {
        const t = i / heightSegments;
        const y = t * height;
        const currentHalfWidth = halfWidth + (halfTipWidth - halfWidth) * t;
        const v = t;

        // 左右の頂点
        positions.push(-currentHalfWidth, y, 0);
        normals.push(0, 0, 1);
        uvs.push(0, v);

        positions.push(currentHalfWidth, y, 0);
        normals.push(0, 0, 1);
        uvs.push(1, v);
    }

    // インデックス生成（クワッドを2つの三角形に分割）
    for (let i = 0; i < heightSegments; i++) {
        const base = i * 2;
        const nextBase = base + 2;

        // 左下三角形
        indices.push(base, nextBase, base + 1);
        // 右上三角形
        indices.push(base + 1, nextBase, nextBase + 1);
    }

    return {
        positions,
        normals,
        uvs,
        indices,
        drawCount: indices.length,
    };
};

export const createGrassGeometry = (args: GrassGeometryArgs) => {
    const { gpu, height = 1.0, width = 0.1, heightSegments = 3, tipWidth = 0 } = args;

    const rawData = createGrassGeometryRawData(height, width, heightSegments, tipWidth);

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
