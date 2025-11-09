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

export const createCircleCrossSection = (radius: number = 0.5, segments: number = 8): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
        });
    }
    return points;
};

export const createRectangleCrossSection = (width: number = 1, height: number = 0.1): { x: number; y: number }[] => {
    const hw = width / 2;
    const hh = height / 2;
    return [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh },
        { x: -hw, y: -hh },
    ];
};

export const generateSplineCap = (
    positions: number[],
    normals: number[],
    uvs: number[],
    indices: number[],
    centerX: number,
    centerY: number,
    centerZ: number,
    normalX: number,
    normalY: number,
    normalZ: number,
    ringPositions: number[],
    startIndex: number,
    flipNormal: boolean
) => {
    const ringCount = ringPositions.length / 3;
    const nX = flipNormal ? -normalX : normalX;
    const nY = flipNormal ? -normalY : normalY;
    const nZ = flipNormal ? -normalZ : normalZ;

    positions.push(centerX, centerY, centerZ);
    normals.push(nX, nY, nZ);
    uvs.push(0.5, 0.5);

    const centerIdx = startIndex;

    for (let i = 0; i < ringCount; i++) {
        const idx = i * 3;
        positions.push(ringPositions[idx], ringPositions[idx + 1], ringPositions[idx + 2]);
        normals.push(nX, nY, nZ);
        uvs.push(0.5, 0.5);
    }

    const ringStart = centerIdx + 1;
    for (let i = 0; i < ringCount - 1; i++) {
        if (flipNormal) {
            indices.push(centerIdx, ringStart + i, ringStart + i + 1);
        } else {
            indices.push(centerIdx, ringStart + i + 1, ringStart + i);
        }
    }
};
