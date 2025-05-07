import {
    ActorTypes,
    DepthFuncTypes,
    MeshTypes,
    PrimitiveTypes,
    UIQueueType,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import { createMesh, Mesh, MeshArgs } from '@/PaleGL/actors/meshes/mesh.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createVector4 } from '@/PaleGL/math/vector4.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { createMaterial } from '@/PaleGL/materials/material.ts';
import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import unlitShapeTextFrag from '@/PaleGL/shaders/unlit-shape-text-fragment.glsl';
import unlitShapeTextDepthFrag from '@/PaleGL/shaders/unlit-shape-text-depth-fragment.glsl';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { ShapeFontRenderer } from '@/PaleGL/shapeFont/shapeFontRenderer.ts';
import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { Color, createColorWhite } from '@/PaleGL/math/color.ts';
import { Texture } from '@/PaleGL/core/texture.ts';
import { ShapeFontService } from '@/PaleGL/shapeFont/shapeFontService.ts';
import { TextAlignType } from '@/PaleGL/actors/meshes/textMesh.ts';

export type UIShapedTextMeshArgs<T, U extends ShapeFontBase<T>> = MeshArgs & {
    gpu: Gpu;
    queueType: UIQueueType;
    color?: Color;
    text: string;
    uniforms?: UniformsData;
    shapeFontTexture: Texture;
    shapeFontService: ShapeFontService<T, U>;
    shapeFontRenderer: ShapeFontRenderer<T, U>;
    align?: TextAlignType;
    characterSpacing?: number;
};

export type UiShapedTextMesh = Mesh & {
    queueType: UIQueueType;
};

export function createUIShapedTextMesh<T, U extends ShapeFontBase<T>>(
    options: UIShapedTextMeshArgs<T, U>
): UiShapedTextMesh {
    const { gpu, name, uniforms = [], color, shapeFontTexture, queueType, shapeFontRenderer } = options;

    // const w = atlasInfo.width;
    // const h = atlasInfo.height;
    const { shapeFontAtlas } = shapeFontRenderer;
    const sw = shapeFontAtlas.cellWidth / shapeFontAtlas.textureWidth;
    const sh = shapeFontAtlas.cellHeight / shapeFontAtlas.textureHeight;
    // xは左からでOK
    const sx = (shapeFontAtlas.cellWidth / shapeFontAtlas.textureWidth) * x;
    // atlasは上基準、uvは下基準なので、cellHeightは下から加算し、縦軸の余白を考慮
    const ySurplus = shapeFontAtlas.textureHeight - shapeFontAtlas.cellHeight * shapeFontAtlas.rowNum;
    const sy =
        (shapeFontAtlas.cellHeight / shapeFontAtlas.textureHeight) * (shapeFontAtlas.rowNum - y - 1) +
        ySurplus / shapeFontAtlas.textureHeight;

    const bUniforms: UniformsData = [
        {
            name: 'uColor',
            type: UniformTypes.Color,
            value: color || createColorWhite(),
        },
        {
            name: UniformNames.FontMap,
            type: UniformTypes.Texture,
            value: shapeFontTexture,
        },
        {
            name: UniformNames.FontTiling,
            type: UniformTypes.Vector4,
            // value: Vector4.one
            value: createVector4(sw, sh, sx, sy), // TODO: dummy
        },
    ];

    const mergedUniforms: UniformsData = [...bUniforms, ...uniforms];

    const depthUniforms: UniformsData = [...bUniforms, ...uniforms];

    // const maxWidth = 2;
    // const maxHeight = 2;
    // const pixelSizeW = maxWidth / atlasInfo.lh;
    // const pixelSizeH = maxHeight / atlasInfo.lh;
    // const planeHeight = charInfo.height * pixelSizeH;
    // const planeWidth = charInfo.width * pixelSizeW;
    // const topPadding = (maxHeight - planeHeight) * 0.5;
    // // 上下: 上に揃えてからoffsetYする. yOffsetは左上が原点なので反転
    // const offsetY = topPadding - charInfo.yOffset * pixelSizeH;
    // // 左右: widthの時点で幅調整がかかっているので、xOffsetのみでよい
    // const offsetX = charInfo.xOffset * pixelSizeW;

    const { aspect } = shapeFontRenderer.shapeFontAtlas;

    const planeWidth = 1;
    const planeHeight = planeWidth / aspect;

    // // const topPadding = planeHeight * 0.5;
    // // // 上下: 上に揃えてからoffsetYする. yOffsetは左上が原点なので反転
    // const offsetY = -planeHeight * 0.5;
    // // 左右: widthの時点で幅調整がかかっているので、xOffsetのみでよい
    // // const offsetX = charInfo.xOffset * pixelSizeW;
    // const offsetX = 0;

    const geometry = createPlaneGeometry({
        gpu,
        // flipUvY: true,
        width: planeWidth,
        height: planeHeight,
        // // offset: new Vector3(offsetX, offsetY, 0),
    });
    const material = createMaterial({
        name: 'shapeCharMeshMaterial',
        vertexShader: gBufferVert,
        fragmentShader: unlitShapeTextFrag,
        depthFragmentShader: unlitShapeTextDepthFrag,
        uniforms: mergedUniforms,
        depthUniforms,
        alphaTest: 0.5,
        depthTest: true,
        depthWrite: false,
        // receiveShadow: !!receiveShadow,
        primitiveType: PrimitiveTypes.Triangles,
        depthFuncType: DepthFuncTypes.Equal,
        uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Transformations, UniformBlockNames.Camera],
    });

    const mesh = createMesh({
        ...options,
        name,
        geometry,
        material,
        type: ActorTypes.UIMesh,
        meshType: MeshTypes.UI,
    });

    return {
        ...mesh,
        queueType,
    };
}
