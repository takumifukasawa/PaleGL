import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { createShapeTextMeshBase, ShapeTextMesh, ShapeTextMeshArgs } from '@/PaleGL/actors/meshes/shapeTextMeshBase.ts';
import { MeshTypes, UIQueueTypes } from '@/PaleGL/constants.ts';
import { createUIShapeCharMesh } from '@/PaleGL/actors/meshes/uiShapeCharMesh.ts';

export function createUIShapeTextMesh<T, U extends ShapeFontBase<T>>(
    options: ShapeTextMeshArgs<T, U>
): ShapeTextMesh<T, U> {
    return createShapeTextMeshBase({
        ...options,
        createCharMeshFunc: createUIShapeCharMesh,
        uiQueueType: UIQueueTypes.AfterTone,
        meshType: MeshTypes.UI,
    });
}
