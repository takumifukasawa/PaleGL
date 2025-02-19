import { Geometry } from '@/PaleGL/geometries/Geometry';
import { AttributeNames } from '@/PaleGL/constants';
import { Attribute } from '@/PaleGL/core/Attribute';
import { GPU } from '@/PaleGL/core/GPU';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import {easeInOutQuad} from "@/PaleGL/utilities/easingUtilities.ts";

const edgePairs = [
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

const surfacePairs = [
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

export function createBoxGeometryRawData(size: number = 1) {
    const s = size / 2;

    // -----------------------------
    //
    //   6 ---- 4
    //  /|     /|
    // 0 ---- 2 |
    // | 7 -- | 5
    // |/     |/
    // 1 ---- 3
    // -----------------------------

    const boxPosition_0 = [-s, s, s];
    const boxPosition_1 = [-s, -s, s];
    const boxPosition_2 = [s, s, s];
    const boxPosition_3 = [s, -s, s];
    const boxPosition_4 = [s, s, -s];
    const boxPosition_5 = [s, -s, -s];
    const boxPosition_6 = [-s, s, -s];
    const boxPosition_7 = [-s, -s, -s];

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

export function createBoxGeometryData(size: number) {
    const rawData = createBoxGeometryRawData(size);

    // TODO: uniqでfilter
    const attributes = [
        new Attribute({
            name: AttributeNames.Position,
            data: new Float32Array(rawData.positions),
            size: 3,
        }),
        new Attribute({
            name: AttributeNames.Uv,
            data: new Float32Array(rawData.uvs),
            size: 2,
        }),
        new Attribute({
            name: AttributeNames.Normal,
            data: new Float32Array(rawData.normals),
            size: 3,
        }),
    ];

    return {
        attributes,
        indices: rawData.indices,
        drawCount: rawData.drawCount,
    };
}

export class BoxGeometry extends Geometry {
    // localPositions: number[];
    _cornerPositions: number[][];

    constructor({ gpu, size = 1 }: { gpu: GPU; size?: number }) {
        const s = size / 2;
        const boxPosition_0 = [-s, s, s];
        const boxPosition_1 = [-s, -s, s];
        const boxPosition_2 = [s, s, s];
        const boxPosition_3 = [s, -s, s];
        const boxPosition_4 = [s, s, -s];
        const boxPosition_5 = [s, -s, -s];
        const boxPosition_6 = [-s, s, -s];
        const boxPosition_7 = [-s, -s, -s];

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

        super({
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
                new Attribute({
                    name: AttributeNames.Position,
                    data: new Float32Array(localPositions),
                    size: 3,
                }),
                new Attribute({
                    name: AttributeNames.Uv,
                    data: new Float32Array(
                        new Array(6)
                            .fill(0)
                            .map(() => [0, 1, 0, 0, 1, 1, 1, 0])
                            .flat()
                    ),
                    size: 2,
                }),
                new Attribute({
                    name: AttributeNames.Normal,
                    data: new Float32Array(normals.map((normal) => new Array(4).fill(0).map(() => normal)).flat(2)),
                    size: 3,
                }),
            ],
            indices: Array.from(Array(6).keys())
                .map((i) => [i * 4 + 0, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3])
                .flat(),
            drawCount: 6 * 6, // indices count
        });

        this._cornerPositions = [
            boxPosition_0,
            boxPosition_1,
            boxPosition_2,
            boxPosition_3,
            boxPosition_4,
            boxPosition_5,
            boxPosition_6,
            boxPosition_7,
        ];
    }

    getRandomLocalPositionOnEdge(rand1: number, rand2: number): Vector3 {
        const edgePair = edgePairs[Math.floor(rand1 * edgePairs.length % edgePairs.length)];
        const p0 = this._cornerPositions[edgePair[0]];
        const p1 = this._cornerPositions[edgePair[1]];
        const t = 1. - easeInOutQuad(rand2 % 1);
        return Vector3.lerpVectors(new Vector3(p0[0], p0[1], p0[2]), new Vector3(p1[0], p1[1], p1[2]), t);
    }

    getRandomLocalPositionOnSurface(index: number, rand2: number, rand3: number): Vector3 {
        const surfacePair = surfacePairs[Math.floor(index % surfacePairs.length)];
        const p0 = this._cornerPositions[surfacePair[0]];
        const p1 = this._cornerPositions[surfacePair[1]];
        const p2 = this._cornerPositions[surfacePair[2]];
        const p3 = this._cornerPositions[surfacePair[3]];
        const v1 = Vector3.lerpVectors(new Vector3(p0[0], p0[1], p0[2]), new Vector3(p1[0], p1[1], p1[2]), rand2);
        const v2 = Vector3.lerpVectors(new Vector3(p2[0], p2[1], p2[2]), new Vector3(p3[0], p3[1], p3[2]), rand2);
        return Vector3.lerpVectors(v1, v2, rand3);
    }
}
