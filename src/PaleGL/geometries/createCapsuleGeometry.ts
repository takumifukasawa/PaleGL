import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { ATTRIBUTE_NAME_POSITION, ATTRIBUTE_NAME_UV, ATTRIBUTE_NAME_NORMAL } from '@/PaleGL/constants.ts';

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
    torusRadius?: number;
};

export function createCapsuleGeometryRawData(
    radius: number = 0.5,
    height: number = 1,
    radialSegments: number = 8,
    heightSegments: number = 1,
    capSegments: number = 4,
    topCap: boolean = true,
    bottomCap: boolean = true,
    torusRadius?: number
): CapsuleGeometryRawData {
    radialSegments = Math.max(3, Math.floor(radialSegments));
    heightSegments = Math.max(1, Math.floor(heightSegments));
    capSegments = Math.max(1, Math.floor(capSegments));

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const isTorus = torusRadius !== undefined && torusRadius > 0;
    const halfHeight = height / 2;

    let vertexIndex = 0;

    // 上極点（topCapがある場合）
    if (topCap && !isTorus) {
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

                let px, py, pz, nx, ny, nz;

                px = radius * sinT * cosP;
                py = halfHeight + radius * cosT;
                pz = radius * sinT * sinP;
                nx = sinT * cosP;
                ny = cosT;
                nz = sinT * sinP;

                positions.push(px, py, pz);
                normals.push(nx, ny, nz);
                uvs.push(u, v * 0.25);
                vertexIndex++;
            }
        }
    }

    // 円柱部分
    for (let y = 0; y <= heightSegments; y++) {
        const v = y / heightSegments;
        const torusAngle = isTorus ? 2 * Math.PI * v : 0;

        for (let x = 0; x <= radialSegments; x++) {
            const u = x / radialSegments;
            const tubeAngle = 2 * Math.PI * u;
            const cosT = Math.cos(tubeAngle);
            const sinT = Math.sin(tubeAngle);

            let px, py, pz, nx, ny, nz;

            if (isTorus) {
                const cosR = Math.cos(torusAngle);
                const sinR = Math.sin(torusAngle);
                px = (torusRadius + radius * cosT) * cosR;
                py = radius * sinT;
                pz = (torusRadius + radius * cosT) * sinR;
                nx = cosT * cosR;
                ny = sinT;
                nz = cosT * sinR;
            } else {
                const currentHeight = halfHeight - v * height;
                px = radius * cosT;
                py = currentHeight;
                pz = radius * sinT;
                nx = cosT;
                ny = 0;
                nz = sinT;
            }

            positions.push(px, py, pz);
            normals.push(nx, ny, nz);
            uvs.push(u, 0.25 + v * 0.5);
            vertexIndex++;
        }
    }

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

                let px, py, pz, nx, ny, nz;

                px = radius * sinT * cosP;
                py = -halfHeight + radius * cosT;
                pz = radius * sinT * sinP;
                nx = sinT * cosP;
                ny = cosT;
                nz = sinT * sinP;

                positions.push(px, py, pz);
                normals.push(nx, ny, nz);
                uvs.push(u, 0.75 + v * 0.25);
                vertexIndex++;
            }
        }
    }

    // 下極点（bottomCapがある場合）
    if (bottomCap && !isTorus) {
        positions.push(0, -halfHeight - radius, 0);
        normals.push(0, -1, 0);
        uvs.push(0.5, 1);
        vertexIndex++;
    }

    // インデックス生成
    let currentIdx = 0;

    // 上極点のキャップ
    if (topCap && !isTorus) {
        const poleIdx = 0;
        const ringStart = 1;
        for (let x = 0; x < radialSegments; x++) {
            indices.push(poleIdx, ringStart + x + 1, ringStart + x);
        }
        currentIdx = 1 + (radialSegments + 1) * capSegments;
    } else if (topCap) {
        currentIdx = (radialSegments + 1) * capSegments;
    }

    // 上半球の中間リング
    if (topCap && !isTorus) {
        const ringStart = 1;
        for (let y = 0; y < capSegments - 1; y++) {
            for (let x = 0; x < radialSegments; x++) {
                const a = ringStart + y * (radialSegments + 1) + x;
                const b = a + radialSegments + 1;
                indices.push(a, a + 1, b);
                indices.push(a + 1, b + 1, b);
            }
        }
    }

    // 円柱部分
    const cylinderStart = currentIdx;
    const cylinderRings = isTorus ? heightSegments : heightSegments;
    for (let y = 0; y < cylinderRings; y++) {
        for (let x = 0; x < radialSegments; x++) {
            const a = cylinderStart + y * (radialSegments + 1) + x;
            const b = a + radialSegments + 1;
            indices.push(a, a + 1, b);
            indices.push(a + 1, b + 1, b);
        }
    }
    currentIdx += (heightSegments + 1) * (radialSegments + 1);

    // 円柱と下半球の接続
    if (bottomCap && !isTorus) {
        const cylinderLastRing = cylinderStart + heightSegments * (radialSegments + 1);
        const bottomFirstRing = currentIdx;
        for (let x = 0; x < radialSegments; x++) {
            const a = cylinderLastRing + x;
            const b = bottomFirstRing + x;
            indices.push(a, a + 1, b);
            indices.push(a + 1, b + 1, b);
        }
    }

    // 下半球の中間リング
    if (bottomCap && !isTorus) {
        for (let y = 0; y < capSegments - 1; y++) {
            for (let x = 0; x < radialSegments; x++) {
                const a = currentIdx + y * (radialSegments + 1) + x;
                const b = a + radialSegments + 1;
                indices.push(a, a + 1, b);
                indices.push(a + 1, b + 1, b);
            }
        }
    }

    // 下極点のキャップ
    if (bottomCap && !isTorus) {
        const poleIdx = vertexIndex - 1;
        const lastRingStart = poleIdx - radialSegments - 1;
        for (let x = 0; x < radialSegments; x++) {
            indices.push(poleIdx, lastRingStart + x, lastRingStart + x + 1);
        }
    }

    // トーラスの場合、最後のリングと最初のリングを接続
    if (isTorus) {
        const firstRingStart = cylinderStart;
        const lastRingStart = cylinderStart + heightSegments * (radialSegments + 1);
        for (let x = 0; x < radialSegments; x++) {
            const a = lastRingStart + x;
            const b = firstRingStart + x;
            indices.push(a, a + 1, b);
            indices.push(a + 1, b + 1, b);
        }
    }

    return {
        positions,
        normals,
        uvs,
        indices,
        drawCount: indices.length,
    };
}

export function createCapsuleGeometry(args: CapsuleGeometryArgs) {
    const {
        gpu,
        radius = 0.5,
        height = 1,
        radialSegments = 8,
        heightSegments = 1,
        capSegments = 4,
        topCap = true,
        bottomCap = true,
        torusRadius,
    } = args;

    const rawData = createCapsuleGeometryRawData(
        radius,
        height,
        radialSegments,
        heightSegments,
        capSegments,
        topCap,
        bottomCap,
        torusRadius
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
}
