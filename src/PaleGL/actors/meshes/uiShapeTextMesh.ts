import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import {
    createShapeTextMeshBase,
    ShapeTextMeshArgs,
    ShapeTextMeshBase,
} from '@/PaleGL/actors/meshes/shapeTextMeshBase.ts';
import {
    BlendType,
    BLEND_TYPE_TRANSPARENT,
    DEPTH_FUNC_TYPE_ALWAYS,
    MESH_TYPE_TEXT,
    PRIMITIVE_TYPE_TRIANGLES,
    UIAnchorType,
    UI_ANCHOR_TYPE_CENTER,
    UIQueueType,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_NAME_FONT_MAP,
    UNIFORM_NAME_FONT_TILING,
    UNIFORM_NAME_UI_CHAR_RECT,
    UNIFORM_NAME_UI_ANCHOR,
    UNIFORM_NAME_UI_FONT_SIZE,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_VECTOR2,
    UNIFORM_TYPE_VECTOR4,
    UNIFORM_TYPE_COLOR,

} from '@/PaleGL/constants.ts';
import { createUIShapeCharMesh } from '@/PaleGL/actors/meshes/uiShapeCharMesh.ts';
import { TextAlignType } from '@/PaleGL/actors/meshes/textMesh.ts';
import { createVector3, setV3x } from '@/PaleGL/math/vector3.ts';
import { setTranslation } from '@/PaleGL/core/transform.ts';
import { subscribeActorOnSetSize } from '@/PaleGL/actors/actor.ts';
import { getOrthoSize } from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import { createUIActor, UIActor } from '@/PaleGL/actors/meshes/uiActor.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
import { createMaterial } from '@/PaleGL/materials/material.ts';
import uiVert from '@/PaleGL/shaders/ui-vertex.glsl';
import uiShapeTextFrag from '@/PaleGL/shaders/ui-shape-text-fragment.glsl';
import depthFrag from '@/PaleGL/shaders/depth-fragment.glsl';
import {createVector4} from "@/PaleGL/math/vector4.ts";
import {createColorWhite} from "@/PaleGL/math/color.ts";

type UIShapeTextMeshArgs<T, U extends ShapeFontBase<T>> = Omit<ShapeTextMeshArgs<T, U>, 'planeWidth'> & {
    fontSize?: number;
    blendType?: BlendType;
    uiQueueType: UIQueueType;
    anchor?: UIAnchorType;
};

export type UIShapeTextMesh<T, U extends ShapeFontBase<T>> = ShapeTextMeshBase<T, U> & UIActor;

export function createUIShapeTextMesh<T, U extends ShapeFontBase<T>>(
    options: UIShapeTextMeshArgs<T, U>
): UIShapeTextMesh<T, U> {
    const {
        name,
        anchor = UI_ANCHOR_TYPE_CENTER,
        align,
        characterSpacing = 0,
        fontSize = 13,
        blendType = BLEND_TYPE_TRANSPARENT,
        shapeFontRenderer,
        uniforms,
        color = createColorWhite(),
        shapeFontTexture
    } = options;

    const actor = options.actor || createUIActor({ name });

    const baseUniforms: UniformsData = [
        ['uColor', UNIFORM_TYPE_COLOR, color],
        [UNIFORM_NAME_FONT_MAP, UNIFORM_TYPE_TEXTURE, shapeFontTexture],
        [UNIFORM_NAME_FONT_TILING, UNIFORM_TYPE_VECTOR4, createVector4(1, 1, 0, 0)],
        // value: tilingOffset,
        ['uFontAspect', UNIFORM_TYPE_FLOAT, shapeFontRenderer.shapeFontAtlas.aspect],
    ];

    const mergedUniforms: UniformsData = [
        ...baseUniforms,
        [UNIFORM_NAME_UI_CHAR_RECT, UNIFORM_TYPE_VECTOR2, createVector2(1, 1 / shapeFontRenderer.shapeFontAtlas.aspect)], // w: 1 を基準とする
        [UNIFORM_NAME_UI_ANCHOR, UNIFORM_TYPE_VECTOR2, createVector2(0, 0)],
        [UNIFORM_NAME_UI_FONT_SIZE, UNIFORM_TYPE_FLOAT, fontSize],
        ...(uniforms || []),
    ];

    const material = createMaterial({
        // CUSTOM_BEGIN comment out
        // name: 'uiShapeCharMeshMaterial',
        // CUSTOM_END
        vertexShader: uiVert,
        fragmentShader: uiShapeTextFrag,
        depthFragmentShader: depthFrag,
        uniforms: mergedUniforms,
        depthUniforms: [],
        depthTest: false,
        depthWrite: false,
        blendType,
        primitiveType: PRIMITIVE_TYPE_TRIANGLES,
        depthFuncType: DEPTH_FUNC_TYPE_ALWAYS,
        uniformBlockNames: [UNIFORM_BLOCK_NAME_COMMON, UNIFORM_BLOCK_NAME_TRANSFORMATIONS, UNIFORM_BLOCK_NAME_CAMERA],
    });

    const shapeText = createShapeTextMeshBase({
        ...options,
        actor,
        createCharMeshFunc: createUIShapeCharMesh,
        // createCharMeshFunc: (args: ShapeCharMeshArgs<T, U>) =>
        //     createUIShapeCharMesh({ ...args, blendType, uiQueueType, }),
        // // uiQueueType: UIQueueTypes.AfterTone,
        // meshType: MeshTypes.UI,
        // meshType: MeshTypes.SpriteAtlas,
        meshType: MESH_TYPE_TEXT,
        planeWidth: fontSize,
        material,
    });

    const { shapeCharMeshes } = shapeText;

    subscribeActorOnSetSize(actor, (width, height, _, uiCamera) => {
        if (!uiCamera) {
            console.error('uiCamera is null');
            return;
        }

        let accWidth = 0;
        let originX = 0;
        let offsetX = 0;
        let offsetY = 0;

        // for (let i = 0; i < shapeCharMeshes.length; i++) {
        //     const mesh = shapeCharMeshes[i];
        //     accWidth += mesh.charWidth;
        // }

        const [orthoWidth, orthoHeight] = getOrthoSize(uiCamera);
        switch (align) {
            case TextAlignType.LeftTop:
                break;
            case TextAlignType.Center:
                // originX -= accWidth / 2 + (characterSpacing * (shapeCharMeshes.length - 1)) / 2;
                offsetY = height * 0.5 - (height - orthoHeight) * 0.5;
                break;
        }

        for (let i = 0; i < shapeCharMeshes.length; i++) {
            const mesh = shapeCharMeshes[i];
            let offset = i === 0 ? mesh.charWidth * 0.5 : mesh.charWidth;
            offset += characterSpacing;
            originX += offset;
            setV3x(mesh.transform.position, originX);
            accWidth += offset;
        }

        switch (align) {
            case TextAlignType.Center:
                // setTranslation(shapeText.transform, createVector3(accWidth * -0.5, 0, 0));
                // setTranslation(shapeText.transform, createVector3((width - accWidth) * .5, 0, 0));
                offsetX = (width - accWidth) * 0.5 - (width - orthoWidth) * 0.5;
                break;
        }

        setTranslation(shapeText.container.transform, createVector3(offsetX, offsetY, 0));
    });

    return { ...actor, ...shapeText, anchor };
}
