import { createGeometry, createTangentsAndBinormals, Geometry } from '@/PaleGL/geometries/geometry.ts';
import { AttributeNames } from '@/PaleGL/constants';
import {Attribute, createAttribute} from '@/PaleGL/core/attribute.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createVector3Zero, v3x, v3y, v3z, Vector3 } from '@/PaleGL/math/vector3.ts';

type PlaneGeometryRawDataOptions = {
    calculateTangent?: boolean;
    calculateBinormal?: boolean;
    flipUvY?: boolean;
    width?: number;
    height?: number;
    offset?: Vector3;
    divColNum?: number; // 列分割数
    divRowNum?: number; // 行分割数
};

export function createPlaneGeometryRawData({
    calculateTangent,
    calculateBinormal,
    flipUvY,
    width = 2,
    height = 2,
    offset = createVector3Zero(),
    divColNum = 1, // 列分割数
    divRowNum = 1, // 行分割数
}: PlaneGeometryRawDataOptions) {
    const normal = [0, 0, 1]; // +z方向を向いている板ポリ

    const rawPositions: number[] = [];
    const rawUvs: number[] = [];
    const rawNormals: number[] = [];
    const indices: number[] = [];

    const rowCellWidth = width / divColNum; // 列分割数で割った幅
    const colCellHeight = height / divRowNum; // 行分割数で割った高さ

    const rowCellUv = 1 / divColNum; // 列分割数で割ったUV幅
    const colCellUv = 1 / divRowNum; // 行分割数で割ったUV高さ

    for (let y = 0; y < divRowNum + 1; y++) {
        for (let x = 0; x < divColNum + 1; x++) {
            const posX = rowCellWidth * x - width / 2 + v3x(offset);
            const posY = colCellHeight * y - height / 2 + v3y(offset);
            rawPositions.push(posX, posY, v3z(offset));

            // UV座標計算
            const uvX = rowCellUv * x; // 0から1の範囲
            // flipUvYがtrueならY軸を反転
            const uvY = flipUvY ? 1 - colCellUv * y : colCellUv * y; // 0から1の範囲
            rawUvs.push(uvX, uvY);

            // 法線ベクトルを追加
            rawNormals.push(...normal);
        }
    }

    // インデックス計算
    for (let y = 0; y < divRowNum; y++) {
        for (let x = 0; x < divColNum; x++) {
            const leftBottom = y * (divColNum + 1) + x; // 左下
            const rightBottom = leftBottom + 1; // 右下
            const rightTop = rightBottom + (divColNum + 1); // 右上
            const leftTop = rightTop - 1; // 左上

            indices.push(leftBottom, rightBottom, rightTop);
            indices.push(rightTop, leftTop, leftBottom);
        }
    }

    let tangents: Float32Array = new Float32Array();
    let binormals: Float32Array = new Float32Array();

    if (calculateTangent || calculateBinormal) {
        // const tbs = createTangentsAndBinormals(rawPositions);
        const tbs = createTangentsAndBinormals(rawNormals);
        if (calculateTangent) {
            tangents = new Float32Array(tbs.tangents);
        }
        if (calculateBinormal) {
            binormals = new Float32Array(tbs.binormals);
        }
    }

    return {
        positions: new Float32Array(rawPositions),
        uvs: new Float32Array(rawUvs),
        normals: new Float32Array(rawNormals),
        tangents,
        binormals,
        indices,
        drawCount: indices.length,
    };
}

export function createPlaneGeometryData(args: PlaneGeometryRawDataOptions) {
    const rawData = createPlaneGeometryRawData(args);

    const attributes: Attribute[] = [
        createAttribute(
            AttributeNames.Position,
            rawData.positions,
            3
        ),
        createAttribute(
            AttributeNames.Uv,
            rawData.uvs,
            2
        ),
        createAttribute(
            AttributeNames.Normal,
            rawData.normals,
            3
        ),
    ];

    if (args.calculateTangent) {
        attributes.push(
            createAttribute(
                AttributeNames.Tangent,
                rawData.tangents,
                3
            )
        );
    }
    if (args.calculateBinormal) {
        attributes.push(
            createAttribute(
                AttributeNames.Binormal,
                rawData.binormals,
                3
            )
        );
    }

    return {
        attributes,
        indices: rawData.indices,
        drawCount: rawData.drawCount,
    };
}

export type PlaneGeometry = Geometry;

export function createPlaneGeometry({
    gpu,
    ...args
}: {
    gpu: Gpu;
} & PlaneGeometryRawDataOptions): Geometry {
    const { attributes, indices, drawCount } = createPlaneGeometryData(args);

    const geometry = createGeometry({
        gpu,
        attributes,
        indices,
        drawCount,
    });

    return geometry;
}
