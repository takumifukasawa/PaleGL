import { Geometry } from '@/PaleGL/geometries/Geometry';
import { AttributeNames } from '@/PaleGL/constants';
import { Attribute } from '@/PaleGL/core/Attribute';
import { GPU } from '@/PaleGL/core/GPU';

export function createBoxGeometryRawData() {
    // -----------------------------
    //
    //   6 ---- 4
    //  /|     /|
    // 0 ---- 2 |
    // | 7 -- | 5
    // |/     |/
    // 1 ---- 3
    // -----------------------------

    const boxPosition_0 = [-0.5, 0.5, 0.5];
    const boxPosition_1 = [-0.5, -0.5, 0.5];
    const boxPosition_2 = [0.5, 0.5, 0.5];
    const boxPosition_3 = [0.5, -0.5, 0.5];
    const boxPosition_4 = [0.5, 0.5, -0.5];
    const boxPosition_5 = [0.5, -0.5, -0.5];
    const boxPosition_6 = [-0.5, 0.5, -0.5];
    const boxPosition_7 = [-0.5, -0.5, -0.5];

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

export function createBoxGeometryData() {
    const rawData = createBoxGeometryRawData();

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
    constructor({ gpu }: { gpu: GPU }) {
        const boxPosition_0 = [-0.5, 0.5, 0.5];
        const boxPosition_1 = [-0.5, -0.5, 0.5];
        const boxPosition_2 = [0.5, 0.5, 0.5];
        const boxPosition_3 = [0.5, -0.5, 0.5];
        const boxPosition_4 = [0.5, 0.5, -0.5];
        const boxPosition_5 = [0.5, -0.5, -0.5];
        const boxPosition_6 = [-0.5, 0.5, -0.5];
        const boxPosition_7 = [-0.5, -0.5, -0.5];

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
                //
                //   6 ---- 4
                //  /|     /|
                // 0 ---- 2 |
                // | 7 -- | 5
                // |/     |/
                // 1 ---- 3
                // -----------------------------
                new Attribute({
                    name: AttributeNames.Position,
                    data: new Float32Array([
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
                    ]),
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
    }
}
