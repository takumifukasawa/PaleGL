import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { ShapeTextMeshBase } from '@/PaleGL/actors/meshes/shapeTextMeshBase.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';

export type ShapeTextMesh<T, U extends ShapeFontBase<T>> = ShapeTextMeshBase<T, U> & Actor;
