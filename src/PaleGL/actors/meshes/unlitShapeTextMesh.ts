import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import {
    createShapeTextMeshBase,
    ShapeTextMesh,
    ShapeTextMeshArgs,
} from '@/PaleGL/actors/meshes/shapeTextMeshBase.ts';
import {createUnlitShapeCharMesh} from "@/PaleGL/actors/meshes/unlitShapeCharMesh.ts";

export function createUnlitShapeTextMesh<T, U extends ShapeFontBase<T>>(
    options: ShapeTextMeshArgs<T, U>
): ShapeTextMesh<T, U> {
    return createShapeTextMeshBase({
        ...options,
        createCharMeshFunc: createUnlitShapeCharMesh
    });
}
