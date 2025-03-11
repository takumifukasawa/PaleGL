import { Gpu } from '@/PaleGL/core/gpu.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { Color } from '@/PaleGL/math/color.ts';
import { Texture } from '@/PaleGL/core/texture.ts';
import { createMesh, Mesh, MeshOptionsArgs } from '@/PaleGL/actors/meshes/mesh.ts';
import {
    DepthFuncTypes,
    MeshTypes,
    PrimitiveTypes,
    ShadingModelIds,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import { createVector4 } from '@/PaleGL/math/Vector4.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import { createMaterial } from '@/PaleGL/materials/material.ts';
import unlitTextFrag from '@/PaleGL/shaders/unlit-text-fragment.glsl';
import unlitTextDepthFrag from '@/PaleGL/shaders/unlit-text-depth-fragment.glsl';

type CharMeshArgs = {
    gpu: Gpu;
    name?: string;
    uniforms?: UniformsData;
    color: Color;
    fontTexture: Texture;
    atlasInfo: {
        width: number;
        height: number;
        lh: number;
        b: number;
    };
    charInfo: {
        char: string;
        x: number;
        y: number;
        xOffset: number;
        yOffset: number;
        width: number;
        height: number;
    };
} & MeshOptionsArgs;

export type CharMesh = Mesh & {
    charWidth: number;
    charHeight: number;
    charOffsetX: number;
    charOffsetY: number;
    char: string;
};

// TODO: なぜかcastshadowがきかない
export function createCharMesh({
    gpu,
    name = '',
    color,
    fontTexture,
    atlasInfo,
    charInfo,
    castShadow,
    uniforms = [],
}: CharMeshArgs) {
    const w = atlasInfo.width;
    const h = atlasInfo.height;
    const sw = charInfo.width / w;
    const sh = charInfo.height / h;
    const sx = charInfo.x / w;
    const sy = charInfo.y / h;

    const bUniforms: UniformsData = [
        {
            name: 'uColor',
            type: UniformTypes.Color,
            value: color,
        },
        {
            name: UniformNames.FontMap,
            type: UniformTypes.Texture,
            value: fontTexture,
        },
        {
            name: UniformNames.FontTiling,
            type: UniformTypes.Vector4,
            // value: Vector4.one
            value: createVector4(sw, sh, sx, sy), // TODO: dummy
        },
    ];

    const mergedUniforms: UniformsData = [
        {
            name: UniformNames.ShadingModelId,
            type: UniformTypes.Int,
            value: ShadingModelIds.Unlit,
        },
        ...bUniforms,
        ...uniforms,
    ];

    const depthUniforms: UniformsData = [...bUniforms, ...uniforms];

    const maxWidth = 2;
    const maxHeight = 2;
    const pixelSizeW = maxWidth / atlasInfo.lh;
    const pixelSizeH = maxHeight / atlasInfo.lh;
    const planeHeight = charInfo.height * pixelSizeH;
    const planeWidth = charInfo.width * pixelSizeW;
    const topPadding = (maxHeight - planeHeight) * 0.5;
    // 上下: 上に揃えてからoffsetYする. yOffsetは左上が原点なので反転
    const offsetY = topPadding - charInfo.yOffset * pixelSizeH;
    // 左右: widthの時点で幅調整がかかっているので、xOffsetのみでよい
    const offsetX = charInfo.xOffset * pixelSizeW;

    const geometry = createPlaneGeometry({
        gpu,
        flipUvY: true,
        width: planeWidth,
        height: planeHeight,
        // offset: new Vector3(offsetX, offsetY, 0),
    });
    const material = createMaterial({
        name: 'charMeshMaterial',
        vertexShader: gBufferVert,
        fragmentShader: unlitTextFrag,
        depthFragmentShader: unlitTextDepthFrag,
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

    const mesh = createMesh({ name, geometry, material, meshType: MeshTypes.Text, castShadow });

    const charWidth = planeWidth;
    const charHeight = planeHeight;
    const charOffsetX = offsetX;
    const charOffsetY = offsetY;
    const char = charInfo.char;

    // for debug
    // console.log(this.char, planeWidth, planeHeight, offsetX, offsetY);

    return {
        ...mesh,
        charWidth,
        charHeight,
        charOffsetX,
        charOffsetY,
        char,
    };
}
