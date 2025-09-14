import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { AttributeNames } from '@/PaleGL/constants.ts';

type SphereGeometry = {
    positions: number[];
    normals: number[];
    uvs: number[];
    indices: number[];
    drawCount: number;
};

/**
 * 半径 r、横分割数 widthSegments、縦分割数 heightSegments の球ジオメトリを生成する。
 * position, normal, uv, index（インデックス描画用）を返す。
 */
export function createSphereGeometryRawData(
    radius: number,
    widthSegments: number,
    heightSegments: number,
    invertNormals: boolean = false
): SphereGeometry {
    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));

    const ringCount = heightSegments - 1;
    const ringVerts = widthSegments + 1;
    const normalSign = invertNormals ? -1 : 1;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // 1) 上極
    positions.push(0, radius, 0);
    normals.push(0, 1 * normalSign, 0);
    uvs.push(0.5, 0);

    // 2) 中間リング
    for (let y = 1; y < heightSegments; y++) {
        const v = y / heightSegments;
        const theta = Math.PI * v;
        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);

        for (let x = 0; x <= widthSegments; x++) {
            const u = x / widthSegments;
            const phi = 2 * Math.PI * u;
            const sinP = Math.sin(phi);
            const cosP = Math.cos(phi);

            // 位置
            const px = radius * sinT * cosP;
            const py = radius * cosT;
            const pz = radius * sinT * sinP;
            positions.push(px, py, pz);

            // 法線
            normals.push(sinT * cosP * normalSign, cosT * normalSign, sinT * sinP * normalSign);

            // UV
            uvs.push(u, 1 - v);
        }
    }

    // 3) 下極
    positions.push(0, -radius, 0);
    normals.push(0, -1 * normalSign, 0);
    uvs.push(0.5, 1);

    // --- インデックス生成 ---
    // 上極キャップ（ワインディングをCCWに修正）
    for (let x = 0; x < widthSegments; x++) {
        indices.push(0, 1 + x + 1, 1 + x);
    }

    // 中間クワッド → 三角形 2 つ（ワインディングをCCWに修正）
    for (let y = 1; y < ringCount; y++) {
        const inOffset = 1 + (y - 1) * ringVerts;
        const outOffset = inOffset + ringVerts;
        for (let x = 0; x < widthSegments; x++) {
            const a = inOffset + x;
            const b = outOffset + x;
            // 三角形1
            indices.push(a, a + 1, b);
            // 三角形2
            indices.push(a + 1, b + 1, b);
        }
    }

    // 下極キャップ（ワインディングをCCWに修正）
    const southIndex = positions.length / 3 - 1;
    const lastRingOffset = 1 + (ringCount - 1) * ringVerts;
    for (let x = 0; x < widthSegments; x++) {
        indices.push(southIndex, lastRingOffset + x, lastRingOffset + x + 1);
    }

    const drawCount = indices.length;

    return {
        positions,
        normals,
        uvs,
        indices,
        drawCount,
    };
}

type SphereGeometryArgs = {
    gpu: Gpu;
    radius?: number;
    widthSegments?: number;
    heightSegments?: number;
    invertNormals?: boolean;
};

export function createSphereGeometry(args: SphereGeometryArgs) {
    const { gpu, radius = 1, widthSegments = 8, heightSegments = 8, invertNormals } = args;

    const rawData = createSphereGeometryRawData(radius, widthSegments, heightSegments, invertNormals);

    // TODO: uniqでfilter
    const attributes = [
        createAttribute(
            AttributeNames.Position,
            new Float32Array(rawData.positions),
            3
        ),
        createAttribute(
            AttributeNames.Uv,
            new Float32Array(rawData.uvs),
            2
        ),
        createAttribute(
            AttributeNames.Normal,
            new Float32Array(rawData.normals),
            3
        ),
    ];

    const geometry = createGeometry({
        gpu,
        attributes,
        indices: rawData.indices,
        drawCount: rawData.drawCount,
    });

    return geometry;
}
