import { Component, createComponent } from '@/PaleGL/components/component.ts';
import { setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';

export type TimelinePropertyBinderController = Component;

// timeline から操作される
export function createTimelineMaterialPropertyBinderController(
    uniformName: string,
    propertyName: string,
): TimelinePropertyBinderController {
    return createComponent({
        onProcessPropertyBinder: (actor, _, key, value) => {
            // // for debug
            // console.log(
            //     `[TimelinePropertyBinderController] actor: ${actor.name}, key: ${key},`, uniformName, value
            // );
            if(propertyName === key) {
                setUniformValueToAllMeshMaterials(actor as Mesh, uniformName, value);
            }
        },
    });
}
