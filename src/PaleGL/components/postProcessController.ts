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
) => {
    // for debug
    // console.log('assignProperties', postProcessControllerComponentInfo, bindings);
    bindings.forEach((bindingValue, bindingKey) => {
        const currentValue =
            postProcessControllerComponentInfo[bindingKey as keyof MarionetterPostProcessControllerComponentInfo];
        const [target, targetPropertyKey, converter] = bindingValue as [
            unknown,
            string,
            PostProcessParametersConversionFunctions?,
        ];
        // for debug
        // console.log("assignProperty", target, targetPropertyKey, currentValue, converter);
        if (converter) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line
            converter(currentValue, target, targetPropertyKey);
        } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            target[targetPropertyKey] = currentValue;
        }
    });
};

// timeline から操作される
export function createPostProcessController(
    renderer: Renderer,
    postProcessControllerComponentInfo: MarionetterPostProcessControllerComponentInfo
): PostProcessController {
    const bindings = buildPostProcessControllerEntries(renderer);
    return createComponent({
        onStartCallback: (_a, _b) => {
            assignProperties(postProcessControllerComponentInfo, bindings);
        },
        // eslint-disable-next-line
        onProcessPropertyBinder: (_a, _b, _c, _d) => {
            // assignProperties(renderer, key, value);
        },
    });
}
