import { UIActor } from '@/PaleGL/actors/meshes/uiActor.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { UIQueueType } from '@/PaleGL/constants.ts';

export type UIMesh = Mesh &
    UIActor & {
        uiQueueType: UIQueueType;
    };
