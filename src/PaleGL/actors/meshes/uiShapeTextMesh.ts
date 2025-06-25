import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import {
    createShapeTextMeshBase,
    ShapeTextMeshArgs,
    ShapeTextMeshBase,
} from '@/PaleGL/actors/meshes/shapeTextMeshBase.ts';
import {
    BlendType,
    BlendTypes,
    DepthFuncTypes,
    MeshTypes,
    PrimitiveTypes,
    UIAnchorType,
    UIAnchorTypes,
    UIQueueType,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
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
        anchor = UIAnchorTypes.Center,
        align,
        characterSpacing = 0,
        fontSize = 13,
        blendType = BlendTypes.Transparent,
        shapeFontRenderer,
        uniforms,
        color = createColorWhite(),
        shapeFontTexture
    } = options;

    const actor = options.actor || createUIActor({ name: 'ui-shape-text-mesh' });

    const baseUniforms: UniformsData = [
        {
            name: 'uColor',
            type: UniformTypes.Color,
            value: color,
        },
        {
            name: UniformNames.FontMap,
            type: UniformTypes.Texture,
            value: shapeFontTexture,
        },
        {
            name: UniformNames.FontTiling,
            type: UniformTypes.Vector4,
            // value: tilingOffset,
            value: createVector4(1, 1, 0, 0),
        },
        {
            name: 'uFontAspect',
            type: UniformTypes.Float,
            value: shapeFontRenderer.shapeFontAtlas.aspect,
        },
    ];
    
    const mergedUniforms: UniformsData = [
        ...baseUniforms,
        {
            name: UniformNames.UICharRect,
            type: UniformTypes.Vector2,
            value: createVector2(1, 1 / shapeFontRenderer.shapeFontAtlas.aspect), // w: 1 を基準とする
        },
        {
            name: UniformNames.UIAnchor,
            type: UniformTypes.Vector2,
            value: createVector2(0, 0),
        },
        {
            name: UniformNames.UIFontSize,
            type: UniformTypes.Float,
            value: fontSize,
        },
        ...(uniforms || []),
    ];

    const material = createMaterial({
        name: 'uiShapeCharMeshMaterial',
        vertexShader: uiVert,
        fragmentShader: uiShapeTextFrag,
        depthFragmentShader: depthFrag,
        uniforms: mergedUniforms,
        depthUniforms: [],
        depthTest: false,
        depthWrite: false,
        blendType,
        primitiveType: PrimitiveTypes.Triangles,
        depthFuncType: DepthFuncTypes.Equal,
        uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Transformations, UniformBlockNames.Camera],
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
        meshType: MeshTypes.Default,
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
