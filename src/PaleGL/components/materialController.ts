import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { Component, createComponent } from '@/PaleGL/components/component.ts';

export type MaterialController = Component;

type Bindings = Map<string, string>; // propertyName, uniformName

// timeline から操作される
export const createMaterialController = (name: string, bindings: Bindings): MaterialController => {
    return createComponent({
        name,
        onFilterPropertyBinder: (key: string) => bindings.has(key),
        onProcessPropertyBinder: (actor, _, key, value) => {
            if (bindings.has(key)) {
                const uniformName = bindings.get(key)!;
                setUniformValueToAllMeshMaterials(actor as Mesh, uniformName, value);
                // // for debug
                // console.log(
                //     `[MaterialController] onProcessPropertyBinder: actor=${actor.name}, key=${key}, uniformName=${uniformName}, value=${value}`
                // );
            }
        },
    });
}
