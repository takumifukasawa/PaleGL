import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { Vector4 } from '@/PaleGL/math/vector4.ts';

export type SpriteAtlasMesh = Mesh & {
    tilingOffset: Vector4;
};
