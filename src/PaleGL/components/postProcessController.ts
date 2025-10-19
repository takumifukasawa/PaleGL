import { Component, createComponent } from '@/PaleGL/components/component.ts';
import { Renderer } from '@/PaleGL/core/renderer.ts';
import { BloomPassParameters, BloomPassParametersProperty } from '@/PaleGL/postprocess/bloomPass.ts';

export type PostProcessController = Component;

// type Bindings = Map<string, string>; // propertyName, uniformName

// timeline から操作される
export function createPostProcessController(renderer: Renderer): PostProcessController {
    return createComponent({
        onProcessPropertyBinder: (actor, _, key, value) => {
            // // for debug
            // console.log(
            //     `[PostProcessController] onProcessPropertyBinder: actor=${actor.name}, key=${key}, value=${value}`
            // );
            switch (key) {
                case BloomPassParametersProperty.bloomAmount:
                    renderer.bloomPass.bloomAmount = value as number;
                    // console.log(`[PostProcessController] Set bloomAmount: ${renderer.bloomPass.bloomAmount}`);
                    break;
            }
            // if (bindings.has(key)) {
            //     const uniformName = bindings.get(key)!;
            //     setUniformValueToAllMeshMaterials(actor as Mesh, uniformName, value);
            // }
        },
    });
}
