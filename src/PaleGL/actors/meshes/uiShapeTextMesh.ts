import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { createShapeTextMeshBase, ShapeTextMesh, ShapeTextMeshArgs } from '@/PaleGL/actors/meshes/shapeTextMeshBase.ts';
import { MeshTypes, UIQueueTypes } from '@/PaleGL/constants.ts';
import { createUIShapeCharMesh } from '@/PaleGL/actors/meshes/uiShapeCharMesh.ts';
import { TextAlignType } from '@/PaleGL/actors/meshes/textMesh.ts';
import { createVector3, setV3x, setV3y } from '@/PaleGL/math/vector3.ts';
import {setScaling, setTranslation} from '@/PaleGL/core/transform.ts';
import { subscribeActorOnSetSize } from '@/PaleGL/actors/actor.ts';

type UIShapeTextMeshArgs<T, U extends ShapeFontBase<T>> = Omit<ShapeTextMeshArgs<T, U>, 'planeWidth'> & {
    fontSize?: number;
};

export function createUIShapeTextMesh<T, U extends ShapeFontBase<T>>(
    options: UIShapeTextMeshArgs<T, U>
): ShapeTextMesh<T, U> {
    const { align, characterSpacing = 0, fontSize = 13 } = options;

    const shapeText = createShapeTextMeshBase({
        ...options,
        createCharMeshFunc: createUIShapeCharMesh,
        uiQueueType: UIQueueTypes.AfterTone,
        meshType: MeshTypes.UI,
        planeWidth: fontSize,
    });

    const { shapeCharMeshes } = shapeText;

    subscribeActorOnSetSize(shapeText, (width, height) => {
        let accWidth = 0;
        let originX = 0;
        let offsetX = 0;
        let offsetY = 0;

        // for (let i = 0; i < shapeCharMeshes.length; i++) {
        //     const mesh = shapeCharMeshes[i];
        //     accWidth += mesh.charWidth;
        // }

        switch (align) {
            case TextAlignType.LeftTop:
                break;
            case TextAlignType.Center:
                // originX -= accWidth / 2 + (characterSpacing * (shapeCharMeshes.length - 1)) / 2;
                offsetY = height * .5 - (height - 1080) * .5;
                break;
        }

        for (let i = 0; i < shapeCharMeshes.length; i++) {
            const mesh = shapeCharMeshes[i];
            const offset = i === 0 ? mesh.charWidth * .5 : mesh.charWidth * 1;
            originX += offset;
            setV3x(mesh.transform.position, originX);
            accWidth += offset;
        }
       
        switch (align) {
            case TextAlignType.Center:
                // setTranslation(shapeText.transform, createVector3(accWidth * -0.5, 0, 0));
                // setTranslation(shapeText.transform, createVector3((width - accWidth) * .5, 0, 0));
                offsetX = (width - accWidth) * .5 - (width - 1920) * .5;
                break;
        }

        setTranslation(shapeText.transform, createVector3(offsetX, offsetY, 0));
    });

    return shapeText;
}
