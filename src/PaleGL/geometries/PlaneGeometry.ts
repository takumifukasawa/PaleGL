import { Geometry } from '@/PaleGL/geometries/Geometry';
import { AttributeNames } from '@/PaleGL/constants';
import { Attribute } from '@/PaleGL/core/Attribute';
import { GPU } from '@/PaleGL/core/GPU';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';

type PlaneGeometryRawDataOptions = {
    calculateTangent?: boolean;
    calculateBinormal?: boolean;
    flipUvY?: boolean;
    width?: number;
    height?: number;
    offset?: Vector3;
};

/**
 * NOTE: +z方向を向いている板ポリ
 * @param calculateTangent
 * @param calculateBinormal
 * @param flipUvY
 * @param width
 * @param height
 * @param offset
 */
export function createPlaneGeometryRawData({
    calculateTangent,
    calculateBinormal,
    flipUvY,
    width = 2,
    height = 2,
    offset = Vector3.zero,
}: PlaneGeometryRawDataOptions) {
    // -----------------------------
    // 0 ---- 2
    // |    / |
    // |   /  |
    // |  /   |
    // | /    |
    // 1 ---- 3
    // -----------------------------

    // prettier-ignore
    const normalsRaw = [
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1
    ];

    const hw = width / 2;
    const hh = height / 2;

    // prettier-ignore
    const positions = new Float32Array([
        -hw + offset.x, hh + offset.y, 0 + offset.z,
        -hw + offset.x, -hh + offset.y, 0 + offset.z,
        hw + offset.x, hh + offset.y, 0 + offset.z,
        hw + offset.x, -hh + offset.y, 0 + offset.z
    ]);

    // prettier-ignore
    const uvs = new Float32Array(flipUvY ?
        [
            0, 0,
            0, 1,
            1, 0,
            1, 1,
        ] : [
            0, 1,
            0, 0,
            1, 1,
            1, 0,
        ]);

    const normals = new Float32Array(normalsRaw);

    let tangents: Float32Array = new Float32Array();
    let binormals: Float32Array = new Float32Array();

    if (calculateTangent || calculateBinormal) {
        const tbs = Geometry.createTangentsAndBinormals(normalsRaw);
        if (calculateTangent) {
            tangents = new Float32Array(tbs.tangents);
        }
        if (calculateBinormal) {
            binormals = new Float32Array(tbs.binormals);
        }
    }

    // prettier-ignore
    const indices = [
        0, 1, 2,
        2, 1, 3
    ];

    return {
        positions,
        uvs,
        normals,
        tangents,
        binormals,
        indices,
        drawCount: 6,
    };
}

export function createPlaneGeometryData(args: PlaneGeometryRawDataOptions) {
    // -----------------------------
    // 0 ---- 2
    // |    / |
    // |   /  |
    // |  /   |
    // | /    |
    // 1 ---- 3
    // -----------------------------

    const rawData = createPlaneGeometryRawData(args);

    // const normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
    //const { tangents, binormals } = Geometry.createTangentsAndBinormals(normals);

    // TODO: uniqでfilter
    const attributes = [
        new Attribute({
            name: AttributeNames.Position,
            // data: new Float32Array([-1, 1, 0, -1, -1, 0, 1, 1, 0, 1, -1, 0]),
            data: rawData.positions,
            size: 3,
        }),
        new Attribute({
            name: AttributeNames.Uv,
            // data: new Float32Array([0, 1, 0, 0, 1, 1, 1, 0]),
            data: rawData.uvs,
            size: 2,
        }),
        new Attribute({
            name: AttributeNames.Normal,
            // data: new Float32Array(normals),
            data: rawData.normals,
            size: 3,
        }),
    ];

    if (args.calculateTangent) {
        attributes.push(
            new Attribute({
                name: AttributeNames.Tangent,
                // data: new Float32Array(tangents),
                data: rawData.tangents,
                size: 3,
            })
        );
    }
    if (args.calculateBinormal) {
        attributes.push(
            new Attribute({
                name: AttributeNames.Binormal,
                // data: new Float32Array(binormals),
                data: rawData.binormals,
                size: 3,
            })
        );
    }

    return {
        attributes,
        indices: [0, 1, 2, 2, 1, 3],
        drawCount: 6,
    };
}

export class PlaneGeometry extends Geometry {
    constructor({
        gpu,
        ...args
    }: {
        gpu: GPU;
    } & PlaneGeometryRawDataOptions) {
        const { attributes, indices, drawCount } = createPlaneGeometryData(args);

        super({
            gpu,
            attributes,
            indices,
            drawCount,
        });
    }
}
