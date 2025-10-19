import { Component, createComponent } from '@/PaleGL/components/component.ts';
import { Renderer } from '@/PaleGL/core/renderer.ts';
import { BloomPassParametersProperty } from '@/PaleGL/postprocess/bloomPass.ts';
import { DepthOfFieldPassParametersProperty } from '@/PaleGL/postprocess/depthOfFieldPass.ts';

export type PostProcessController = Component;

// type Bindings = Map<string, string>; // propertyName, uniformName

// timeline から操作される
export function createPostProcessController(renderer: Renderer): PostProcessController {
    return createComponent({
        onProcessPropertyBinder: (_a, _b, key, value) => {
            // // for debug
            // console.log(
            //     `[PostProcessController] onProcessPropertyBinder: actor=${actor.name}, key=${key}, value=${value}`
            // );
            switch (key) {
                // bloom
                case BloomPassParametersProperty.bloomAmount:
                    renderer.bloomPass.bloomAmount = value as number;
                    break;
                case BloomPassParametersProperty.tone:
                    renderer.bloomPass.tone = value as number;
                    break;
                case BloomPassParametersProperty.threshold:
                    renderer.bloomPass.threshold = value as number;
                    break;
                // dof
                case DepthOfFieldPassParametersProperty.focusDistance:
                    renderer.depthOfFieldPass.focusDistance = value as number;
                    break;
                case DepthOfFieldPassParametersProperty.focusRange:
                    renderer.depthOfFieldPass.focusRange = value as number;
                    break;
                case DepthOfFieldPassParametersProperty.bokehRadius:
                    renderer.depthOfFieldPass.bokehRadius = value as number;
                    break;
            }
        },
    });
}
