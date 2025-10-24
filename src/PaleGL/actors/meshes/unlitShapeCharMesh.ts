import {
    MESH_TYPE_SPRITE_ATLAS,
    UI_QUEUE_TYPE_NONE,
} from '@/PaleGL/constants.ts';
import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { createShapeCharMeshBase, ShapeCharMesh, ShapeCharMeshArgs } from '@/PaleGL/actors/meshes/shapeCharMeshBase.ts';
import {SpriteAtlasMesh} from "@/PaleGL/actors/meshes/SpriteAtlasMesh.ts";

export type UnlitShapeCharMesh = SpriteAtlasMesh & {
    charWidth: number;
    charHeight: number;
    char: string;
};

// TODO: なぜかcastshadowがきかない
export const createUnlitShapeCharMesh: <T, U extends ShapeFontBase<T>>(
    options: ShapeCharMeshArgs<T, U>
) => ShapeCharMesh = <T, U extends ShapeFontBase<T>>({
    gpu,
    name = '',
    // color = createColorWhite(),
    // fontTexture,
    char,
    // shapeFont,
    // shapeFontAtlas,
    shapeFontRenderer,
    x,
    y,
    material,
    // atlasInfo,
    // charInfo,
    castShadow,
    // uniforms = [],
    planeWidth,
}: ShapeCharMeshArgs<T, U>): UnlitShapeCharMesh => {
    // const mergedUniforms: UniformsData = [
    //     {
    //         name: UNIFORM_NAME_SHADING_MODEL_ID,
    //         type: UNIFORM_TYPE_INT,
    //         value: ShadingModelIds.Unlit,
    //     },
    //     ...(uniforms || []),
    // ];

    // const depthUniforms: UniformsData = [...(uniforms || [])];

    // const material = createMaterial({
    //     name: 'shapeCharMeshMaterial',
    //     vertexShader: gBufferVert,
    //     fragmentShader: unlitShapeTextFrag,
    //     depthFragmentShader: unlitShapeTextDepthFrag,
    //     uniforms: mergedUniforms,
    //     depthUniforms,
    //     alphaTest: 0.5,
    //     depthTest: true,
    //     depthWrite: false,
    //     // receiveShadow: !!receiveShadow,
    //     primitiveType: PrimitiveTypes.Triangles,
    //     depthFuncType: DepthFuncTypes.Equal,
    //     uniformBlockNames: [UNIFORM_BLOCK_NAME_COMMON, UNIFORM_BLOCK_NAME_TRANSFORMATIONS, UNIFORM_BLOCK_NAME_CAMERA],
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
            castShadow,
            // uniforms: mergedUniforms,
            meshType: MESH_TYPE_SPRITE_ATLAS,
            planeWidth,
            uiQueueType: UI_QUEUE_TYPE_NONE,
        }),
    };
};
