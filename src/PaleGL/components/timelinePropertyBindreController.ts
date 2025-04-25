import { Component, createComponent } from '@/PaleGL/components/component.ts';
import { setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';

export type TimelinePropertyBinderController = Component;

// timeline から操作される
export function createTimelineMaterialPropertyBinderController(
    uniformName: string
): TimelinePropertyBinderController {
    return createComponent({
        onProcessPropertyBinder: (actor, _, __, value) => {
            // for debug
            // console.log(
            //     `[TimelinePropertyBinderController] actor: ${actor.name} component: ${componentModel.name}, key: ${key},`, uniformName, value
            // );
            setUniformValueToAllMeshMaterials(actor as Mesh, uniformName, value);
        },
    });
}
