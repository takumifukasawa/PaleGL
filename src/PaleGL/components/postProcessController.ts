import { MarionetterPostProcessControllerComponentInfo } from '@/Marionetter/types';
import { Component, createComponent } from '@/PaleGL/components/component.ts';
import { Renderer } from '@/PaleGL/core/renderer.ts';
import { Color, copyColor, createColorFromHex } from '@/PaleGL/math/color.ts';
import { RawVector3, setV3, Vector3 } from '@/PaleGL/math/vector3.ts';
import { BloomPassParametersKey, BloomPassParametersPropertyMap } from '@/PaleGL/postprocess/bloomPass.ts';
import {
    ScreenSpaceShadowPassParametersKey,
    ScreenSpaceShadowPassParametersPropertyMap,
} from '@/PaleGL/postprocess/screenSpaceShadowPass.ts';
import { SSAOPassParametersKey, SSAOPassParametersPropertyMap } from '@/PaleGL/postprocess/ssaoPass.ts';

export type PostProcessController = Component;

// type Bindings = Map<string, string>; // propertyName, uniformName

type NumToBoolConverter = (n: number, prop: unknown) => void;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore-next-line
const numToBoolConverter: NumToBoolConverter = (n: number, prop: unknown) => {
    // eslint-disable-next-line
    prop = n > 0.5;
};
type AssignVector3Converter = (v: RawVector3, prop: Vector3) => void;
const assignVector3Converter: AssignVector3Converter = (v: RawVector3, prop: Vector3) => {
    setV3(prop, v.x, v.y, v.z);
};
type AssignColorConverter = (c: string, prop: Color) => void;
const assignColorConverter: AssignColorConverter = (hex: string, prop: Color) => {
    copyColor(prop, createColorFromHex(hex));
};

type ConversionFunction = NumToBoolConverter | AssignVector3Converter | AssignColorConverter;

const buildBindings = (renderer: Renderer) => {
    // prettier-ignore
    const entries = [
        // screen space shadow ---
        [
            ScreenSpaceShadowPassParametersPropertyMap.enabled,
            [
                renderer.screenSpaceShadowPass,
                ScreenSpaceShadowPassParametersKey.enabled,
                numToBoolConverter
            ]
        ],
        [
            ScreenSpaceShadowPassParametersPropertyMap.bias,
            [
                renderer.screenSpaceShadowPass,
                ScreenSpaceShadowPassParametersKey.bias
            ]
        ],
        [
            ScreenSpaceShadowPassParametersPropertyMap.jitterSize,
            [
                renderer.screenSpaceShadowPass,
                ScreenSpaceShadowPassParametersKey.jitterSize,
                assignVector3Converter
            ]
        ],
        [
            ScreenSpaceShadowPassParametersPropertyMap.sharpness,
            [
                renderer.screenSpaceShadowPass,
                ScreenSpaceShadowPassParametersKey.sharpness
            ]
        ],
        [
            ScreenSpaceShadowPassParametersPropertyMap.strength,
            [
                renderer.screenSpaceShadowPass,
                ScreenSpaceShadowPassParametersKey.strength
            ]
        ],
        [
            ScreenSpaceShadowPassParametersPropertyMap.ratio,
            [
                renderer.screenSpaceShadowPass,
                ScreenSpaceShadowPassParametersKey.ratio
            ]
        ],
        [
            ScreenSpaceShadowPassParametersPropertyMap.rayStepMultiplier,
            [
                renderer.screenSpaceShadowPass,
                ScreenSpaceShadowPassParametersKey.rayStepMultiplier
            ]
        ],
        
        // ssao ---

        [
            SSAOPassParametersPropertyMap.enabled,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.enabled, numToBoolConverter]
        ],
        [
            SSAOPassParametersPropertyMap.occlusionSampleLength,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.occlusionSampleLength],
        ],
        [
            SSAOPassParametersPropertyMap.occlusionBias,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.occlusionBias],
        ],
        [
            SSAOPassParametersPropertyMap.occlusionMinDistance,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.occlusionMinDistance],
        ],
        [
            SSAOPassParametersPropertyMap.occlusionMaxDistance,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.occlusionMaxDistance],
        ],
        [
            SSAOPassParametersPropertyMap.occlusionColor,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.occlusionColor, assignColorConverter],
        ],
        [
            SSAOPassParametersPropertyMap.occlusionPower,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.occlusionPower],
        ],
        [
            SSAOPassParametersPropertyMap.occlusionStrength,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.occlusionStrength],
        ],
        [
            SSAOPassParametersPropertyMap.blendRate,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.blendRate],
        ],
        [
            SSAOPassParametersPropertyMap.samplingTexture,
            [renderer.ambientOcclusionPass, SSAOPassParametersKey.samplingTexture],
        ],
        
        // bloom ---
        
        [
            BloomPassParametersPropertyMap.enabled,
            [
                renderer.bloomPass,
                BloomPassParametersKey.enabled,
                numToBoolConverter
            ],
        ],
        [
            BloomPassParametersPropertyMap.threshold,
            [
                renderer.bloomPass,
                BloomPassParametersKey.threshold
            ],
        ],
        [
            BloomPassParametersPropertyMap.tone,
            [
                renderer.bloomPass,
                BloomPassParametersKey.tone
            ],
        ],
        [
            BloomPassParametersPropertyMap.bloomAmount,
            [
                renderer.bloomPass,
                BloomPassParametersKey.bloomAmount
            ],
        ]
        
    ] satisfies ReadonlyArray<readonly [string, ([unknown, string] | [unknown, string, ConversionFunction])]>;

    return new Map<string, unknown>(entries);
};

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
        const [target, targetPropertyKey, converter] = bindingValue as [unknown, string, ConversionFunction?];
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
    const bindings = buildBindings(renderer);
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
