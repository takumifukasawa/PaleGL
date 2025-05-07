import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import {
    DepthFuncTypes,
    PrimitiveTypes,
    ShadingModelIds,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import { createMaterial } from '@/PaleGL/materials/material.ts';
import unlitShapeTextFrag from '@/PaleGL/shaders/unlit-shape-text-fragment.glsl';
import unlitShapeTextDepthFrag from '@/PaleGL/shaders/unlit-shape-text-depth-fragment.glsl';
import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { createColorWhite } from '@/PaleGL/math/color.ts';
import {createShapeCharMeshBase, ShapeCharMesh, ShapeCharMeshArgs} from '@/PaleGL/actors/meshes/shapeCharMeshBase.ts';

export type UnlitShapeCharMesh = Mesh & {
    charWidth: number;
    charHeight: number;
    char: string;
};

// TODO: なぜかcastshadowがきかない
export const createUnlitShapeCharMesh: <T, U extends ShapeFontBase<T>>(options: ShapeCharMeshArgs<T, U>) => ShapeCharMesh = <T, U extends ShapeFontBase<T>>({
    gpu,
    name = '',
    color = createColorWhite(),
    fontTexture,
    char,
    // shapeFont,
    // shapeFontAtlas,
    shapeFontRenderer,
    x,
    y,
    // atlasInfo,
    // charInfo,
    castShadow,
    uniforms = [],
}: ShapeCharMeshArgs<T, U>): UnlitShapeCharMesh => {
    const mergedUniforms: UniformsData = [
        {
            name: UniformNames.ShadingModelId,
            type: UniformTypes.Int,
            value: ShadingModelIds.Unlit,
        },
        ...(uniforms || []),
    ];

    const depthUniforms: UniformsData = [...(uniforms || [])];

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

    const meshBase = createShapeCharMeshBase({
        gpu,
        name,
        color,
        fontTexture,
        material,
        char,
        shapeFontRenderer,
        x,
        y,
        castShadow,
        uniforms: mergedUniforms,
    });

    return {
        ...meshBase,
        char,
    };
}
