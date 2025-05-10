import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { createShapeTextMeshBase, ShapeTextMesh, ShapeTextMeshArgs } from '@/PaleGL/actors/meshes/shapeTextMeshBase.ts';
import {BlendType, BlendTypes, MeshTypes, UIQueueType} from '@/PaleGL/constants.ts';
import { createUIShapeCharMesh } from '@/PaleGL/actors/meshes/uiShapeCharMesh.ts';
import { TextAlignType } from '@/PaleGL/actors/meshes/textMesh.ts';
import { createVector3, setV3x  } from '@/PaleGL/math/vector3.ts';
import {setTranslation} from '@/PaleGL/core/transform.ts';
import { subscribeActorOnSetSize } from '@/PaleGL/actors/actor.ts';
import {getOrthoSize} from "@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts";
import {ShapeCharMeshArgs} from "@/PaleGL/actors/meshes/shapeCharMeshBase.ts";

type UIShapeTextMeshArgs<T, U extends ShapeFontBase<T>> = Omit<ShapeTextMeshArgs<T, U>, 'planeWidth'> & {
    fontSize?: number;
    blendType?: BlendType;
    uiQueueType?: UIQueueType
};

export function createUIShapeTextMesh<T, U extends ShapeFontBase<T>>(
    options: UIShapeTextMeshArgs<T, U>
): ShapeTextMesh<T, U> {
    const { align, characterSpacing = 0, fontSize = 13, blendType = BlendTypes.Transparent, uiQueueType } = options;

    const shapeText = createShapeTextMeshBase({
        ...options,
        createCharMeshFunc: (args: ShapeCharMeshArgs<T, U>) => createUIShapeCharMesh({...args, blendType, uiQueueType}),
        // uiQueueType: UIQueueTypes.AfterTone,
        meshType: MeshTypes.UI,
        planeWidth: fontSize,
        uiQueueType
    });

    const { shapeCharMeshes } = shapeText;

    subscribeActorOnSetSize(shapeText, (width, height, _, uiCamera) => {
        if (!uiCamera) {
            console.error("uiCamera is null");
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
                offsetY = height * .5 - (height - orthoHeight) * .5;
                break;
        }

        for (let i = 0; i < shapeCharMeshes.length; i++) {
            const mesh = shapeCharMeshes[i];
            let offset = i === 0 ? mesh.charWidth * .5 : mesh.charWidth;
            offset += characterSpacing;
            originX += offset;
            setV3x(mesh.transform.position, originX);
            accWidth += offset;
        }
       
        switch (align) {
            case TextAlignType.Center:
                // setTranslation(shapeText.transform, createVector3(accWidth * -0.5, 0, 0));
                // setTranslation(shapeText.transform, createVector3((width - accWidth) * .5, 0, 0));
                offsetX = (width - accWidth) * .5 - (width - orthoWidth) * .5;
                break;
        }

        setTranslation(shapeText.container.transform, createVector3(offsetX, offsetY, 0));
    });

    return shapeText;
}
