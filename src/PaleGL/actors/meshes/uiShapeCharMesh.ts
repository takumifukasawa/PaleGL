import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import {
    DepthFuncTypes,
    MeshTypes,
    PrimitiveTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes
} from '@/PaleGL/constants.ts';
import uiVert from '@/PaleGL/shaders/ui-vertex.glsl';
import depthFrag from '@/PaleGL/shaders/depth-fragment.glsl';
import uiShapeTextFrag from '@/PaleGL/shaders/ui-shape-text-fragment.glsl';
import { createMaterial } from '@/PaleGL/materials/material.ts';
// import unlitShapeTextFrag from '@/PaleGL/shaders/unlit-shape-text-fragment.glsl';
import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { createColorWhite } from '@/PaleGL/math/color.ts';
import { createShapeCharMeshBase, ShapeCharMesh, ShapeCharMeshArgs } from '@/PaleGL/actors/meshes/shapeCharMeshBase.ts';
import { createVector4 } from '@/PaleGL/math/vector4.ts';

export type UnlitShapeCharMesh = Mesh & {
    charWidth: number;
    charHeight: number;
    char: string;
};

export const createUIShapeCharMesh: <T, U extends ShapeFontBase<T>>(
    options: ShapeCharMeshArgs<T, U>
) => ShapeCharMesh = <T, U extends ShapeFontBase<T>>({
    gpu,
    name = '',
    color = createColorWhite(),
    fontTexture,
    char,
    shapeFontRenderer,
    x,
    y,
    uniforms = [],
    planeWidth,
}: ShapeCharMeshArgs<T, U>): UnlitShapeCharMesh => {
    const mergedUniforms: UniformsData = [
        {
            name: UniformNames.UICanvas,
            type: UniformTypes.Vector4,
            value: createVector4(1, 1, 1, 1),
        },
        // {
        //     name: "uUICanvasProjectionMatrix",
        //     type: UniformTypes.Matrix4,
        //     value: createMat4Identity()
        // },
        ...(uniforms || []),
    ];

    const material = createMaterial({
        name: 'uiShapeCharMeshMaterial',
        vertexShader: uiVert,
        fragmentShader: uiShapeTextFrag,
        depthFragmentShader: depthFrag,
        uniforms: mergedUniforms,
        depthUniforms: [],
        // alphaTest: 0.5,
        depthTest: false,
        depthWrite: false,
        // receiveShadow: !!receiveShadow,
        primitiveType: PrimitiveTypes.Triangles,
        depthFuncType: DepthFuncTypes.Equal,
        uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Transformations, UniformBlockNames.Camera],
    });

    return createShapeCharMeshBase({
        gpu,
        name,
        color,
        fontTexture,
        material,
        char,
        shapeFontRenderer,
        x,
        y,
        uniforms: mergedUniforms,
        meshType: MeshTypes.UI,
        planeWidth,
    });
};
