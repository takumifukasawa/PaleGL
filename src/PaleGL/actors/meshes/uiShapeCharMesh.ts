import { BlendType, MeshTypes, UIAnchorType, UIAnchorTypes, UIQueueType, UIQueueTypes } from '@/PaleGL/constants.ts';
import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { createShapeCharMeshBase, ShapeCharMeshArgs } from '@/PaleGL/actors/meshes/shapeCharMeshBase.ts';
import { UIMesh } from '@/PaleGL/actors/meshes/uiMesh.ts';
import {SpriteAtlasMesh} from "@/PaleGL/actors/meshes/SpriteAtlasMesh.ts";

export type UIShapeCharMesh = UIMesh & SpriteAtlasMesh & {
    charWidth: number;
    charHeight: number;
    char: string;
};

export type UIShapeCharMeshArgs<T, U extends ShapeFontBase<T>> = ShapeCharMeshArgs<T, U> & {
    blendType?: BlendType;
    uiQueueType?: UIQueueType;
    anchor?: UIAnchorType;
};

export const createUIShapeCharMesh: <T, U extends ShapeFontBase<T>>(
    options: UIShapeCharMeshArgs<T, U>
) => UIShapeCharMesh = <T, U extends ShapeFontBase<T>>({
    gpu,
    name = '',
    char,
    shapeFontRenderer,
    x,
    y,
    planeWidth,
    uiQueueType = UIQueueTypes.None,
    anchor = UIAnchorTypes.Center,
    material,
}: UIShapeCharMeshArgs<T, U>): UIShapeCharMesh => {
    // const mergedUniforms: UniformsData = [
    //     {
    //         name: UniformNames.UICharRect,
    //         type: UniformTypes.Vector2,
    //         value: createVector2(1, 1 / shapeFontRenderer.shapeFontAtlas.aspect), // w: 1 を基準とする
    //     },
    //     {
    //         name: UniformNames.UIAnchor,
    //         type: UniformTypes.Vector2,
    //         value: createVector2(0, 0),
    //     },
    //     {
    //         name: UniformNames.UIFontSize,
    //         type: UniformTypes.Float,
    //         value: planeWidth,
    //     },
    //     ...(uniforms || []),
    // ];

    // const material = createMaterial({
    //     name: 'uiShapeCharMeshMaterial',
    //     vertexShader: uiVert,
    //     fragmentShader: uiShapeTextFrag,
    //     depthFragmentShader: depthFrag,
    //     uniforms: mergedUniforms,
    //     depthUniforms: [],
    //     depthTest: false,
    //     depthWrite: false,
    //     blendType,
    //     primitiveType: PrimitiveTypes.Triangles,
    //     depthFuncType: DepthFuncTypes.Equal,
    //     uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Transformations, UniformBlockNames.Camera],
    // });

    return {
        ...createShapeCharMeshBase({
            gpu,
            name,
            // color,
            // fontTexture,
            material,
            char,
            shapeFontRenderer,
            x,
            y,
            // uniforms: mergedUniforms,
            // meshType: MeshTypes.UI,
            meshType: MeshTypes.SpriteAtlas,
            planeWidth,
            uiQueueType,
        }),
        uiQueueType,
        anchor,
    };
};
