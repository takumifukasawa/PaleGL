import { createGeometry, Geometry } from '@/PaleGL/geometries/geometry.ts';
import { ATTRIBUTE_NAME_POSITION, ATTRIBUTE_NAME_UV, ATTRIBUTE_NAME_NORMAL } from '@/PaleGL/constants';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createVector3One, scaleVector3ByScalar, Vector3 } from '@/PaleGL/math/vector3.ts';

export const boxGeometryEdgePairs = [
    [0, 1],
    [1, 3],
    [3, 2],
    [2, 0],
    [0, 6],
    [1, 7],
    [2, 4],
    [3, 5],
    [4, 6],
    [5, 7],
    [6, 7],
    [4, 5],
];

export const boxGeometrySurfacePairs = [
    // front
    [0, 1, 2, 3],
    // right
    [2, 3, 4, 5],
    // back
    [4, 5, 6, 7],
    // left
    [6, 7, 0, 1],
    // top
    [6, 0, 4, 2],
    // bottom
    [1, 7, 3, 5],
];

export function createBoxGeometryRawData(size: Vector3 = createVector3One()) {
    const s = scaleVector3ByScalar(size, 0.5);

    // -----------------------------
    //
    //   6 ---- 4
    //  /|     /|
    // 0 ---- 2 |
    // | 7 -- | 5
    // |/     |/
    // 1 ---- 3
    // -----------------------------

    const boxPosition_0 = [-s[0], s[1], s[2]];
    const boxPosition_1 = [-s[0], -s[1], s[2]];
    const boxPosition_2 = [s[0], s[1], s[2]];
    const boxPosition_3 = [s[0], -s[1], s[2]];
    const boxPosition_4 = [s[0], s[1], -s[2]];
    const boxPosition_5 = [s[0], -s[1], -s[2]];
    const boxPosition_6 = [-s[0], s[1], -s[2]];
    const boxPosition_7 = [-s[0], -s[1], -s[2]];

    const normalsRaw = [
        [0, 0, 1], // front
        [1, 0, 0], // right
        [0, 0, -1], // back
        [-1, 0, 0], // left
        [0, 1, 0], // top
        [0, -1, 0], // bottom
    ];

    const positions = [
        // front
        ...boxPosition_0,
        ...boxPosition_1,
        ...boxPosition_2,
        ...boxPosition_3,
        // right
        ...boxPosition_2,
        ...boxPosition_3,
        ...boxPosition_4,
        ...boxPosition_5,
        // back
        ...boxPosition_4,
        ...boxPosition_5,
        ...boxPosition_6,
        ...boxPosition_7,
        // left
        ...boxPosition_6,
        ...boxPosition_7,
        ...boxPosition_0,
        ...boxPosition_1,
        // top
        ...boxPosition_6,
        ...boxPosition_0,
        ...boxPosition_4,
        ...boxPosition_2,
        // bottom
        ...boxPosition_1,
        ...boxPosition_7,
        ...boxPosition_3,
        ...boxPosition_5,
    ];
    const uvs = new Array(6)
        .fill(0)
        .map(() => [0, 1, 0, 0, 1, 1, 1, 0])
        .flat();
    const normals = normalsRaw.map((normal) => new Array(4).fill(0).map(() => normal)).flat(2);

    const indices = Array.from(Array(6).keys())
        .map((i) => [i * 4 + 0, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3])
        .flat();

    const drawCount = 6 * 6;

    return {
        positions,
        uvs,
        normals,
        indices,
        drawCount,
    };
}

export function createBoxGeometryData(size: Vector3) {
    const rawData = createBoxGeometryRawData(size);

    // TODO: uniqでfilter
    const attributes = [
        createAttribute(
            ATTRIBUTE_NAME_POSITION,
            new Float32Array(rawData.positions),
            3
        ),
        createAttribute(
            ATTRIBUTE_NAME_UV,
            new Float32Array(rawData.uvs),
            2
        ),
        createAttribute(
            ATTRIBUTE_NAME_NORMAL,
            new Float32Array(rawData.normals),
            3
        ),
    ];

    return {
        attributes,
        indices: rawData.indices,
        drawCount: rawData.drawCount,
    };
}

export type BoxGeometry = Geometry & { cornerPositions: number[][] };

// type BoxGeometryArgs = GeometryArgs & { size: number };
type BoxGeometryArgs = { gpu: Gpu, size?: Vector3 };

export function createBoxGeometry(args: BoxGeometryArgs): BoxGeometry {
    const { gpu, size = createVector3One() } = args; // デフォルトが長さ1

    const s = scaleVector3ByScalar(size, 0.5);
    const boxPosition_0 = [-s[0], s[1], s[2]];
    const boxPosition_1 = [-s[0], -s[1], s[2]];
    const boxPosition_2 = [s[0], s[1], s[2]];
    const boxPosition_3 = [s[0], -s[1], s[2]];
    const boxPosition_4 = [s[0], s[1], -s[2]];
    const boxPosition_5 = [s[0], -s[1], -s[2]];
    const boxPosition_6 = [-s[0], s[1], -s[2]];
    const boxPosition_7 = [-s[0], -s[1], -s[2]];

    const localPositions = [
        // front
        ...boxPosition_0,
        ...boxPosition_1,
        ...boxPosition_2,
        ...boxPosition_3,
        // right
        ...boxPosition_2,
        ...boxPosition_3,
        ...boxPosition_4,
        ...boxPosition_5,
        // back
        ...boxPosition_4,
        ...boxPosition_5,
        ...boxPosition_6,
        ...boxPosition_7,
        // left
        ...boxPosition_6,
        ...boxPosition_7,
        ...boxPosition_0,
        ...boxPosition_1,
        // top
        ...boxPosition_6,
        ...boxPosition_0,
        ...boxPosition_4,
        ...boxPosition_2,
        // bottom
        ...boxPosition_1,
        ...boxPosition_7,
        ...boxPosition_3,
        ...boxPosition_5,
    ];

    const normals = [
        [0, 0, 1], // front
        [1, 0, 0], // right
        [0, 0, -1], // back
        [-1, 0, 0], // left
        [0, 1, 0], // top
        [0, -1, 0], // bottom
    ];

    const geometry = createGeometry({
        gpu,
        attributes: [
            // -----------------------------
            //   6 ---- 4
            //  /|     /|
            // 0 ---- 2 |
            // | 7 -- | 5
            // |/     |/
            // 1 ---- 3
            // -----------------------------
            createAttribute(
                ATTRIBUTE_NAME_POSITION,
                new Float32Array(localPositions),
                3
            ),
            createAttribute(
                ATTRIBUTE_NAME_UV,
                new Float32Array(
                    new Array(6)
                        .fill(0)
                        .map(() => [0, 1, 0, 0, 1, 1, 1, 0])
                        .flat()
                ),
                2
            ),
            createAttribute(
                ATTRIBUTE_NAME_NORMAL,
                new Float32Array(normals.map((normal) => new Array(4).fill(0).map(() => normal)).flat(2)),
                3
            ),
        ],
        indices: Array.from(Array(6).keys())
            .map((i) => [i * 4 + 0, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3])
            .flat(),
        drawCount: 6 * 6, // indices count
    });

    // localPositions: number[];
    const cornerPositions: number[][] = [
        boxPosition_0,
        boxPosition_1,
        boxPosition_2,
        boxPosition_3,
        boxPosition_4,
        boxPosition_5,
        boxPosition_6,
        boxPosition_7,
    ];

    return {
        ...geometry,
        cornerPositions,
    };
}
