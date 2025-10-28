import { MarionetterPostProcessControllerComponentInfo } from '@/Marionetter/types';
import { Component, createComponent } from '@/PaleGL/components/component.ts';
import {
    buildPostProcessControllerEntries,
    PostProcessParameterBindingValue,
} from '@/PaleGL/components/postProcessControllerEntries.ts';
import { Renderer } from '@/PaleGL/core/renderer.ts';

export type PostProcessController = Component;

const assignPropertyInternal = (bindingValue: PostProcessParameterBindingValue, newValue: unknown) => {
    const [target, targetPropertyKey, converter] = bindingValue;
    // for debug
    // console.log("assignProperty", target, targetPropertyKey, converter, newValue);
    if (converter) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line
        converter(newValue, target, targetPropertyKey);
    } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        target[targetPropertyKey] = newValue;
    }
};

const assignProperties = (
    // renderer: Renderer,
    postProcessControllerComponentInfo: MarionetterPostProcessControllerComponentInfo,
    bindings = new Map<string, PostProcessParameterBindingValue>()
) => {
    // for debug
    // console.log('assignProperties', postProcessControllerComponentInfo, bindings);
    bindings.forEach((bindingValue, bindingKey) => {
        const newValue =
            postProcessControllerComponentInfo[bindingKey as keyof MarionetterPostProcessControllerComponentInfo];
        // for debug
        // console.log('Assigning property', bindingKey, bindingValue, newValue);
        assignPropertyInternal(bindingValue, newValue);
    });
};

const assignProperty = (bindings: Map<string, PostProcessParameterBindingValue>, key: string, value: unknown) => {
    const binding = bindings.get(key);
    if (binding) {
        assignPropertyInternal(binding, value);
    } else {
        console.error(`unknown pp key: ${key}`);
    }
};

// timeline から操作される
export const createPostProcessController = (
    renderer: Renderer,
    postProcessControllerComponentInfo: MarionetterPostProcessControllerComponentInfo
): PostProcessController => {
    const bindings = buildPostProcessControllerEntries(renderer);
    return createComponent({
        onStartCallback: () => {
            assignProperties(postProcessControllerComponentInfo, bindings);
        },
        // eslint-disable-next-line
        onProcessPropertyBinder: (_a, _b, key, value) => {
            assignProperty(bindings, key, value);
        },
    });
}
