export const generateQuadRingIndices = (
    indices: number[],
    startA: number,
    startB: number,
    segments: number
) => {
    for (let x = 0; x < segments; x++) {
        const a = startA + x;
        const b = startB + x;
        indices.push(a, a + 1, b);
        indices.push(a + 1, b + 1, b);
    }
};

export const generateCylinderRings = (
    positions: number[],
    normals: number[],
    uvs: number[],
    radius: number,
    height: number,
    radialSegments: number,
    heightSegments: number,
    uvOffsetY: number = 0,
    uvScaleY: number = 1
) => {
    const halfHeight = height / 2;

    for (let y = 0; y <= heightSegments; y++) {
        const v = y / heightSegments;
        const currentHeight = halfHeight - v * height;

        for (let x = 0; x <= radialSegments; x++) {
            const u = x / radialSegments;
            const phi = 2 * Math.PI * u;
            const cosP = Math.cos(phi);
            const sinP = Math.sin(phi);

            positions.push(radius * cosP, currentHeight, radius * sinP);
            normals.push(cosP, 0, sinP);
            uvs.push(u, uvOffsetY + v * uvScaleY);
        }
    }
};

export const generateDiskCap = (
    positions: number[],
    normals: number[],
    uvs: number[],
    indices: number[],
    centerY: number,
    radius: number,
    radialSegments: number,
    startIndex: number,
    flipNormal: boolean
) => {
    const normalY = flipNormal ? -1 : 1;

    // 中心点
    positions.push(0, centerY, 0);
    normals.push(0, normalY, 0);
    uvs.push(0.5, 0.5);

    const centerIdx = startIndex;

    // 外周のリング
    for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const phi = 2 * Math.PI * u;
        const cosP = Math.cos(phi);
        const sinP = Math.sin(phi);

        positions.push(radius * cosP, centerY, radius * sinP);
        normals.push(0, normalY, 0);
        uvs.push(0.5 + 0.5 * cosP, 0.5 + 0.5 * sinP);
    }

    // インデックス生成
    const ringStart = centerIdx + 1;
    for (let x = 0; x < radialSegments; x++) {
        if (flipNormal) {
            indices.push(centerIdx, ringStart + x, ringStart + x + 1);
        } else {
            indices.push(centerIdx, ringStart + x + 1, ringStart + x);
        }
    }
};
