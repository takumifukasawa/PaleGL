import { MarionetterPostProcessControllerComponentInfo } from '@/Marionetter/types';
import { Component, createComponent } from '@/PaleGL/components/component.ts';
import {
    buildPostProcessControllerEntries,
    PostProcessParametersConversionFunctions,
} from '@/PaleGL/components/postProcessControllerEntries.ts';
import { Renderer } from '@/PaleGL/core/renderer.ts';

export type PostProcessController = Component;

const assignProperties = (
    // renderer: Renderer,
    postProcessControllerComponentInfo: MarionetterPostProcessControllerComponentInfo,
    bindings = new Map<string, unknown>()
    // key: string,
    // value: any
) => {
    console.log('assignProperties', postProcessControllerComponentInfo, bindings);

    bindings.forEach((bindingValue, bindingKey) => {
        const currentValue =
            postProcessControllerComponentInfo[bindingKey as keyof MarionetterPostProcessControllerComponentInfo];
        const [target, targetPropertyKey, converter] = bindingValue as [
            unknown,
            string,
            PostProcessParametersConversionFunctions?,
        ];
        console.log(target, targetPropertyKey, currentValue, converter);
        if (converter) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line
            converter(currentValue, target[targetPropertyKey] as unknown);
        } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            target[targetPropertyKey] = currentValue;
        }
    });

    // switch (key) {
    //     // bloom
    //     case BloomPassParametersProperty.bloomAmount:
    //         renderer.bloomPass.bloomAmount = value as number;
    //         break;
    //     case BloomPassParametersProperty.tone:
    //         renderer.bloomPass.tone = value as number;
    //         break;
    //     case BloomPassParametersProperty.threshold:
    //         renderer.bloomPass.threshold = value as number;
    //         break;
    //     // dof
    //     case DepthOfFieldPassParametersProperty.focusDistance:
    //         renderer.depthOfFieldPass.focusDistance = value as number;
    //         break;
    //     case DepthOfFieldPassParametersProperty.focusRange:
    //         renderer.depthOfFieldPass.focusRange = value as number;
    //         break;
    //     case DepthOfFieldPassParametersProperty.bokehRadius:
    //         renderer.depthOfFieldPass.bokehRadius = value as number;
    //         break;
    // }
};

// timeline から操作される
export function createPostProcessController(
    renderer: Renderer,
    postProcessControllerComponentInfo: MarionetterPostProcessControllerComponentInfo
): PostProcessController {
    const bindings = buildPostProcessControllerEntries(renderer);
    return createComponent({
        onStartCallback: (_a, _b) => {
            console.log('hogehoge', _a, _b, postProcessControllerComponentInfo);
            return;
            assignProperties(postProcessControllerComponentInfo, bindings);
            console.log('hogehoge', renderer.ambientOcclusionPass, postProcessControllerComponentInfo);
        },
        // eslint-disable-next-line
        onProcessPropertyBinder: (_a, _b, _c, _d) => {
            // assignProperties(renderer, key, value);
        },
    });
}
