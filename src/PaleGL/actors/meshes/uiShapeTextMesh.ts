import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { createShapeTextMeshBase, ShapeTextMesh, ShapeTextMeshArgs } from '@/PaleGL/actors/meshes/shapeTextMeshBase.ts';
import { MeshTypes, UIQueueTypes } from '@/PaleGL/constants.ts';
import { createUIShapeCharMesh } from '@/PaleGL/actors/meshes/uiShapeCharMesh.ts';
import { TextAlignType } from '@/PaleGL/actors/meshes/textMesh.ts';
import { createVector3, setV3x, setV3y } from '@/PaleGL/math/vector3.ts';
import { setScaling } from '@/PaleGL/core/transform.ts';

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

    let accWidth = 0;
    let originX = 0;

    for (let i = 0; i < shapeCharMeshes.length; i++) {
        const mesh = shapeCharMeshes[i];
        accWidth += mesh.charWidth;
    }

    switch (align) {
        case TextAlignType.Center:
            originX -= accWidth / 2 + (characterSpacing * (shapeCharMeshes.length - 1)) / 2;
            break;
    }

    for (let i = 0; i < shapeCharMeshes.length; i++) {
        const mesh = shapeCharMeshes[i];
        // originX += mesh.charWidth / 2;
        originX += i === 0 ? 0 : 100;
        setV3x(mesh.transform.position, originX);
        const offsetY = mesh.charHeight * 0.5 + 500;
        setV3y(mesh.transform.position, offsetY);
        originX += mesh.charWidth / 2 + characterSpacing;
        // const baseScale = createVector3(1 / 16, 1 / 16, 1 / 16);
        // const baseScale = createVector3(1 / 1, 1 / 1, 1);
        const baseScale = createVector3(1, 1, 1);
        setScaling(mesh.transform, baseScale);
    }

    return shapeText;
}
