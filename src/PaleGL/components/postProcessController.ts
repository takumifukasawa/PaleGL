import { MarionetterPostProcessControllerComponentInfo } from '@/Marionetter/types';
import { Component, createComponent } from '@/PaleGL/components/component.ts';
import {
    buildPostProcessControllerEntries,
    PostProcessParameterBindingValue,
} from '@/PaleGL/components/postProcessControllerEntries.ts';
import { Renderer } from '@/PaleGL/core/renderer.ts';
import { findActorByName } from '@/PaleGL/core/scene.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';
import { getVector3Distance } from '@/PaleGL/math/vector3.ts';
import {
    DepthOfFieldPassParametersKey,
    DepthOfFieldPassParametersPropertyMap,
} from '@/PaleGL/postprocess/depthOfFieldPass.ts';
import { DOF_TARGET_ACTOR_NAME } from '../../../../src/pages/scripts/sceneConstants.ts';


export type PostProcessController = Component;

const assignPropertyInternal = (bindingValue: PostProcessParameterBindingValue, newValue: unknown) => {
    const [target, targetPropertyKey, converter] = bindingValue;
    // for debug
    // console.log("assignProperty", target, targetPropertyKey, newValue);
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
    bindings.forEach((bindingValue, bindingKey) => {
        const newValue =
            postProcessControllerComponentInfo[bindingKey as keyof MarionetterPostProcessControllerComponentInfo];
        // for debug
        // console.log('Assigning property', bindingKey, bindingValue, newValue, postProcessControllerComponentInfo);
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
    let dofTarget: Actor | null = null;
    const bindings = buildPostProcessControllerEntries(renderer);
    return createComponent({
        onStartCallback: (actor, componentModel, gpu, scene) => {
            assignProperties(postProcessControllerComponentInfo, bindings);
            dofTarget = findActorByName(scene.children, DOF_TARGET_ACTOR_NAME);
            if (!dofTarget) {
                console.error(`dof target is not found. should apply name ${DOF_TARGET_ACTOR_NAME}`);
            }
        },
        // eslint-disable-next-line
        onProcessPropertyBinder: (_a, _b, key, value) => {
            assignProperty(bindings, key, value);
        },
        onUpdateCallback: (actor, model, gpu, scene, time, deltaTime) => {
            const camera = scene.mainCamera;
            if (camera && dofTarget) {
                const distance = getVector3Distance(camera.transform.position, dofTarget.transform.position);
                assignProperty(bindings, DepthOfFieldPassParametersPropertyMap.focusDistance, distance);
            }
        }
    });
}
