import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import {
    createShapeTextMeshBase,
    ShapeTextMeshArgs,
} from '@/PaleGL/actors/meshes/shapeTextMeshBase.ts';
import { createUnlitShapeCharMesh } from '@/PaleGL/actors/meshes/unlitShapeCharMesh.ts';
import { MeshTypes, UIQueueTypes } from '@/PaleGL/constants.ts';
import { TextAlignType } from '@/PaleGL/actors/meshes/textMesh.ts';
import { setV3x, setV3y } from '@/PaleGL/math/vector3.ts';
import { createActor } from '@/PaleGL/actors/actor.ts';
import { ShapeTextMesh } from '@/PaleGL/actors/meshes/shapeTextMesh.ts';

export function createUnlitShapeTextMesh<T, U extends ShapeFontBase<T>>(
    options: ShapeTextMeshArgs<T, U>
): ShapeTextMesh<T, U> {
    const { align, characterSpacing = 0 } = options;
    
    const actor = options.actor || createActor({ name: 'unlit-shape-text-mesh' });

    const shapeText = createShapeTextMeshBase({
        ...options,
        actor,
        createCharMeshFunc: createUnlitShapeCharMesh,
        uiQueueType: UIQueueTypes.None,
        meshType: MeshTypes.Default,
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
        originX += mesh.charWidth / 2;
        setV3x(mesh.transform.position, originX);
        const offsetY = -mesh.charHeight * 0.5;
        setV3y(mesh.transform.position, offsetY);
        originX += mesh.charWidth / 2 + characterSpacing;
    }

    return { ...actor, ...shapeText };
}
