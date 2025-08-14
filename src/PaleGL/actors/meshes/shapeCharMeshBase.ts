import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createMesh, MeshOptionsArgs } from '@/PaleGL/actors/meshes/mesh.ts';
import { MeshType, UIQueueType } from '@/PaleGL/constants.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { Material } from '@/PaleGL/materials/material.ts';
import { ShapeFontRenderer } from '@/PaleGL/shapeFont/shapeFontRenderer.ts';
import { createVector4, Vector4 } from '@/PaleGL/math/vector4.ts';
import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { ShapeFontAtlas } from '@/PaleGL/shapeFont/buildShaderFontAtlas.ts';
import { SpriteAtlasMesh } from '@/PaleGL/actors/meshes/SpriteAtlasMesh.ts';

type ShapeCharMeshBaseArgs<T, U extends ShapeFontBase<T>> = {
    gpu: Gpu;
    name?: string;
    // uniforms?: UniformsData;
    // color?: Color;
    // fontTexture: Texture;
    char: string;
    shapeFontRenderer: ShapeFontRenderer<T, U>;
    x: number;
    y: number;
    material: Material;
    meshType: MeshType;
    planeWidth: number;
    uiQueueType: UIQueueType;
} & MeshOptionsArgs;

// export type ShapeCharMeshArgs<T, U extends ShapeFontBase<T>> = Omit<ShapeCharMeshBaseArgs<T, U>, 'material'>;
export type ShapeCharMeshArgs<T, U extends ShapeFontBase<T>> = ShapeCharMeshBaseArgs<T, U>;

export type ShapeCharMesh = SpriteAtlasMesh & {
    charWidth: number;
    charHeight: number;
    char: string;
};

export const getShapeFontTilingOffset: (s: ShapeFontAtlas, x: number, y: number) => Vector4 = (
    shapeFontAtlas: ShapeFontAtlas,
    x: number,
    y: number
) => {
    const sw = shapeFontAtlas.cellWidth / shapeFontAtlas.textureWidth;
    const sh = shapeFontAtlas.cellHeight / shapeFontAtlas.textureHeight;
    // xは左からでOK
    const sx = (shapeFontAtlas.cellWidth / shapeFontAtlas.textureWidth) * x;
    // atlasは上基準、uvは下基準なので、cellHeightは下から加算し、縦軸の余白を考慮
    const ySurplus = shapeFontAtlas.textureHeight - shapeFontAtlas.cellHeight * shapeFontAtlas.rowNum;
    const sy =
        (shapeFontAtlas.cellHeight / shapeFontAtlas.textureHeight) * (shapeFontAtlas.rowNum - y - 1) +
        ySurplus / shapeFontAtlas.textureHeight;
    return createVector4(sw, sh, sx, sy);
};

export type CreateShapeCharMeshFunc<T, U extends ShapeFontBase<T>> = (
    options: ShapeCharMeshArgs<T, U>
) => ShapeCharMesh;

// TODO: なぜかcastshadowがきかない
export const createShapeCharMeshBase: <T, U extends ShapeFontBase<T>>(
    options: ShapeCharMeshBaseArgs<T, U>
) => ShapeCharMesh = <T, U extends ShapeFontBase<T>>({
    gpu,
    name = '',
    material,
    // color = createColorWhite(),
    // fontTexture,
    char,
    shapeFontRenderer,
    castShadow,
    x,
    y,
    meshType,
    planeWidth = 1,
}: ShapeCharMeshBaseArgs<T, U>): ShapeCharMesh => {
    const { shapeFontAtlas } = shapeFontRenderer;
    const { aspect } = shapeFontAtlas;

    const tilingOffset = getShapeFontTilingOffset(shapeFontAtlas, x, y);

    // const bUniforms: UniformsData = [
    //     {
    //         name: 'uColor',
    //         type: UniformTypes.Color,
    //         value: color,
    //     },
    //     {
    //         name: UniformNames.FontMap,
    //         type: UniformTypes.Texture,
    //         value: fontTexture,
    //     },
    //     {
    //         name: UniformNames.FontTiling,
    //         type: UniformTypes.Vector4,
    //         value: tilingOffset,
    //     },
    //     {
    //         name: 'uFontAspect',
    //         type: UniformTypes.Float,
    //         value: shapeFontRenderer.shapeFontAtlas.aspect,
    //     },
    // ];

    // // 追加
    // addUniformData(material.uniforms, bUniforms);
    // addUniformData(material.depthUniforms, bUniforms);

    const planeHeight = planeWidth / aspect;

    const geometry = createPlaneGeometry({
        gpu,
        width: 1,
        height: 1,
    });

    // const mesh = createMesh({ name, geometry, material, type: ActorTypes.UiActor, meshType: MeshTypes.Text, castShadow });
    const mesh = createMesh({ name, geometry, material, meshType, castShadow });

    return {
        ...mesh,
        charWidth: planeWidth,
        charHeight: planeHeight,
        char,
        tilingOffset,
    };
};
