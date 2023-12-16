import { curveUtilityEvaluateCurve } from '@/Marionetter/curveUtilities.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import {Color} from "@/PaleGL/math/Color.ts";
import {Light} from "@/PaleGL/actors/Light.ts";

// TODO: 短縮系を渡すようにしたい
const PROPERTY_COLOR_R = 'color.r';
const PROPERTY_COLOR_G = 'color.g';
const PROPERTY_COLOR_B = 'color.b';
const PROPERTY_COLOR_A = 'color.a';
const PROPERTY_INTENSITY = 'intensity';
// const PROPERTY_BOUNCE_INTENSITY = 'bounceIntensity';
// const PROPERTY_RANGE = 'range';

// TODO: 短縮系を渡すようにしたい
const PROPERTY_LOCAL_POSITION_X = 'm_LocalPosition.x';
const PROPERTY_LOCAL_POSITION_Y = 'm_LocalPosition.y';
const PROPERTY_LOCAL_POSITION_Z = 'm_LocalPosition.z';
const PROPERTY_LOCAL_EULER_ANGLES_RAW_X = 'localEulerAnglesRaw.x';
const PROPERTY_LOCAL_EULER_ANGLES_RAW_Y = 'localEulerAnglesRaw.y';
const PROPERTY_LOCAL_EULER_ANGLES_RAW_Z = 'localEulerAnglesRaw.z';
const PROPERTY_LOCAL_SCALE_X = 'm_LocalScale.x';
const PROPERTY_LOCAL_SCALE_Y = 'm_LocalScale.y';
const PROPERTY_LOCAL_SCALE_Z = 'm_LocalScale.z';

//
// scene
//

export type MarionetterScene = {
    name: string; // shorthand: n
    objects: MarionetterObjectInfo[]; // shorthand: o
};

type MarionetterObjectInfo = {
    name: string; // shorthand: n
    transform: MarionetterTransformInfo; // shorthand: t
    components: MarionetterComponentInfoKinds[]; // shorthand: c
    children: MarionetterObjectInfo[]; // shorthand: o
};

type MarionetterTransformInfo = {
    localPosition: Vector3; // shorthand: lp
    localRotation: Vector3; // shorthand: lr
    localScale: Vector3; // shorthand: ls
};

//
// track
//

type MarionetterTrackInfo = {
    targetName: string; // shorthand: tn
    animationClips: MarionetterAnimationClipInfoKinds[]; // shorthand: a
};

type MarionetterAnimationClipInfoKinds = MarionetterAnimationClipInfo | MarionetterLightControlClipInfo;

const enum MarionetterAnimationClipInfoType {
    AnimationClip = 0,
    LightControlClip = 1,
}

type MarionetterAnimationClipInfoBase = {
    type: MarionetterAnimationClipInfoType; // shorthand: t
    start: number; // shorthand: s
    duration: number; // shorthand: d
    bindings: MarionetterAnimationClipBinding[]; // shorthand: b
};

type MarionetterAnimationClipInfo = MarionetterAnimationClipInfoBase & {
    offsetPosition: Vector3; // shorthand: op
    offsetRotation: Vector3; // shorthand: or
};

type MarionetterLightControlClipInfo = MarionetterAnimationClipInfoBase; // TODO: 追加が必要なはず

type MarionetterAnimationClipBinding = {
    propertyName: string; // short hand: n
    keyframes: MarionetterAnimationClipKeyframe[];
};

type MarionetterAnimationClipKeyframe = {
    time: number; // shorthand: t
    value: number; // shorthand: v
    inTangent: number; // shorthand: i
    outTangent: number; // shorthand: o
};

//
// components
//

type MarionetterComponentInfoBase = {
    type: MarionetterComponentType; // shorthand: t
};

const enum MarionetterComponentType {
    PlayableDirector = 0,
    Light = 1,
}

type MarionetterComponentInfoKinds = MarionetterPlayableDirectorComponentInfo | MarionetterLightComponentInfo;

export type MarionetterPlayableDirectorComponentInfo = MarionetterComponentInfoBase & {
    name: string; // shorthand: n
    duration: number; // shorthand: d
    tracks: MarionetterTrackInfo[]; // shorthand: t
};

type MarionetterLightComponentInfo = MarionetterComponentInfoBase & {
    lightType: string; // shorthand: l
    color: string; // shorthand: c, hex string
};

// export function createLightTrackBinder(animationClips: AnimationClip[], time: number) {}

export function createMarionetterTrackBinder(animationClips: MarionetterAnimationClipInfoKinds[], rawTime: number) {
    // pattern1: use frame
    // const spf = 1 / fps;
    // const frameTime = Math.floor(rawTime / spf) * spf;
    // pattern2: use raw time
    const frameTime = rawTime;

    // TODO: pre-extrapolate, post-extrapolate
    // NOTE: 一個だけ抽出 = animation clip の blend は対応していない
    // const animationClip = animationClips.find((ac) => ac.start <= time && time < ac.start + ac.duration);
    const animationClip = animationClips.find((ac) => ac.start <= frameTime && frameTime < ac.start + ac.duration);
    if (!animationClip) {
        return;
    }
    switch (animationClip.type) {
        case MarionetterAnimationClipInfoType.AnimationClip:
            return createMarionetterAnimationTrackBinder(animationClip as MarionetterAnimationClipInfo, frameTime);
        case MarionetterAnimationClipInfoType.LightControlClip:
            return createmarionetterLightControlTrackBinder(animationClip as MarionetterLightControlClipInfo, frameTime);
            break;
    }
}

type MarionetterLightControlTrack = {
    type: "LightControlTrack";
    assignProperty: (light: Light) => void;
}

function createmarionetterLightControlTrackBinder(lightControlClip: MarionetterLightControlClipInfo, time: number): MarionetterLightControlTrack {
    let hasPropertyColorR: boolean = false;
    let hasPropertyColorG: boolean = false;
    let hasPropertyColorB: boolean = false;
    let hasPropertyColorA: boolean = false;
    let hasPropertyIntensity: boolean = false;
    // let hasPropertyBounceIntensity: boolean = false;
    // let hasPropertyRange: boolean = false;
    
    const color = new Color();
    let intensity = 0;
    // let bounceIntensity = 0;
    // let range = 0;
    
    const { start, bindings } = lightControlClip;

    // TODO: typeがあった方がよい. ex) animation clip, light control clip
    bindings.forEach(({ propertyName, keyframes }) => {
        const value = curveUtilityEvaluateCurve(time - start, keyframes);
        
        switch (propertyName) {
            case PROPERTY_COLOR_R:
                hasPropertyColorR = true;
                color.r = value;
                break;
            case PROPERTY_COLOR_G:
                hasPropertyColorG = true;
                color.g = value;
                break;
            case PROPERTY_COLOR_B:
                hasPropertyColorB = true;
                color.b = value;
                break;
            case PROPERTY_COLOR_A:
                hasPropertyColorA = true;
                color.a = value;
                break;
            case PROPERTY_INTENSITY:
                hasPropertyIntensity = true;
                intensity = value;
                break;
            // case PROPERTY_BOUNCE_INTENSITY:
            //     hasPropertyBounceIntensity = true;
            //     bounceIntensity = value;
            //     break;
            // case PROPERTY_RANGE:
            //     hasPropertyRange = true;
            //     range = value;
            //     break;
        }
    });
    
    const assignProperty = (obj: Light) => {
        if(hasPropertyColorR) {
            obj.color.r = color.r;
        }
        if(hasPropertyColorG) {
            obj.color.g = color.g;
        }
        if(hasPropertyColorB) {
            obj.color.b = color.b;
        }
        if(hasPropertyColorA) {
            obj.color.a = color.a;
        }
        if(hasPropertyIntensity) {
            obj.intensity = intensity;
        }
        // if(hasPropertyBounceIntensity) {
        //     obj.bounceIntensity = bounceIntensity;
        // }
        // for spot light
        // if(hasPropertyRange) {
        //     obj.range = range;
        // }
    }
    
    return {
        type: "LightControlTrack",
        assignProperty
    }
}

type MarionetterAnimationTrack = {
    type: "AnimationTrack";
    assignProperty: (actor: Actor) => void;
}

function createMarionetterAnimationTrackBinder(animationClip: MarionetterAnimationClipInfo, time: number): MarionetterAnimationTrack {
    let hasLocalPosition: boolean = false;
    let hasLocalRotationEuler: boolean = false;
    let hasLocalScale: boolean = false;
    const localPosition: Vector3 = Vector3.zero;
    const localRotationEuler: Vector3 = Vector3.zero;
    const localScale: Vector3 = Vector3.one;

    const { start, bindings } = animationClip;

    // TODO: typeがあった方がよい. ex) animation clip, light control clip
    bindings.forEach(({ propertyName, keyframes }) => {
        const value = curveUtilityEvaluateCurve(time - start, keyframes);

        switch (propertyName) {
            case PROPERTY_LOCAL_POSITION_X:
                hasLocalPosition = true;
                localPosition.x = value;
                break;
            case PROPERTY_LOCAL_POSITION_Y:
                hasLocalPosition = true;
                localPosition.y = value;
                break;
            case PROPERTY_LOCAL_POSITION_Z:
                hasLocalPosition = true;
                localPosition.z = value;
                break;
            case PROPERTY_LOCAL_EULER_ANGLES_RAW_X:
                hasLocalRotationEuler = true;
                localRotationEuler.x = value;
                break;
            case PROPERTY_LOCAL_EULER_ANGLES_RAW_Y:
                hasLocalRotationEuler = true;
                localRotationEuler.y = value;
                break;
            case PROPERTY_LOCAL_EULER_ANGLES_RAW_Z:
                hasLocalRotationEuler = true;
                localRotationEuler.z = value;
                break;
            case PROPERTY_LOCAL_SCALE_X:
                hasLocalScale = true;
                localScale.x = value;
                break;
            case PROPERTY_LOCAL_SCALE_Y:
                hasLocalScale = true;
                localScale.y = value;
                break;
            case PROPERTY_LOCAL_SCALE_Z:
                hasLocalScale = true;
                localScale.z = value;
                break;
            default:
                throw new Error(`invalid property: ${propertyName}`);
        }
        // }
    });
    // }

    const assignProperty = (obj: Actor) => {
        // Debug.Log("==========");
        // Debug.Log(LocalPosition);
        // Debug.Log(LocalRotationEuler);
        // Debug.Log(LocalScale);
        if (hasLocalPosition) {
            obj.transform.position.copy(localPosition);
        }

        if (hasLocalRotationEuler) {
            obj.transform.rotation.setV(localRotationEuler);
            // obj.transform.rotation.copy(
            //     (localRotationEuler.x / 180) * Math.PI,
            //     (localRotationEuler.y / 180) * Math.PI,
            //     // (10 / 180) * Math.PI,
            //     (localRotationEuler.z / 180) * Math.PI
            // ));
        }

        if (hasLocalScale) {
            obj.transform.scale.copy(localScale);
            // obj.scale.copy(localScale);
        }
    };

    return {
        type: "AnimationTrack",
        assignProperty,
    };
}

// /**
//  * tmp
//  */
// export function createMarionetterAnimationTrackBinder(animationClips: MarionetterAnimationClipInfoKinds[], rawTime: number) {
//     // ---------------------------------------------------------------------------
//     // public
//     // ---------------------------------------------------------------------------
//
//     let hasLocalPosition: boolean = false;
//     let hasLocalRotationEuler: boolean = false;
//     let hasLocalScale: boolean = false;
//     const localPosition: Vector3 = Vector3.zero;
//     const localRotationEuler: Vector3 = Vector3.zero;
//     const localScale: Vector3 = Vector3.one;
//
//     // const spf = 1 / fps;
//     // const frameTime = Math.floor(rawTime / spf) * spf;
//     const frameTime = rawTime;
//
//     // TODO: pre-extrapolate, post-extrapolate
//     // NOTE: 一個だけ抽出 = animation clip の blend は対応していない
//     // const animationClip = animationClips.find((ac) => ac.start <= time && time < ac.start + ac.duration);
//     const animationClip = animationClips.find((ac) => ac.start <= frameTime && frameTime < ac.start + ac.duration);
//     if (!animationClip) {
//         return;
//     }
//     const { start, bindings } = animationClip;
//
//     // TODO: typeがあった方がよい. ex) animation clip, light control clip
//     bindings.forEach(({ propertyName, keyframes }) => {
//         // Debug.Log(binding.type.FullName);
//         // animated transform
//
//         // TODO: check transform type
//         // if (binding.type.FullName == typeof(Transform).FullName) {
//         // var curve = AnimationUtility.GetEditorCurve(animationClip, binding);
//         // for debug
//         // Debug.Log(binding.propertyName);
//         const value = curveUtilityEvaluateCurve(frameTime - start, keyframes);
//
//         // // animated transform
//         // if (binding.type.FullName == typeof(Transform).FullName)
//         // {
//         switch (propertyName) {
//             case PROPERTY_LOCAL_POSITION_X:
//                 hasLocalPosition = true;
//                 localPosition.x = value;
//                 break;
//             case PROPERTY_LOCAL_POSITION_Y:
//                 hasLocalPosition = true;
//                 localPosition.y = value;
//                 break;
//             case PROPERTY_LOCAL_POSITION_Z:
//                 hasLocalPosition = true;
//                 localPosition.z = value;
//                 break;
//             case PROPERTY_LOCAL_EULER_ANGLES_RAW_X:
//                 hasLocalRotationEuler = true;
//                 localRotationEuler.x = value;
//                 break;
//             case PROPERTY_LOCAL_EULER_ANGLES_RAW_Y:
//                 hasLocalRotationEuler = true;
//                 localRotationEuler.y = value;
//                 break;
//             case PROPERTY_LOCAL_EULER_ANGLES_RAW_Z:
//                 hasLocalRotationEuler = true;
//                 localRotationEuler.z = value;
//                 break;
//             case PROPERTY_LOCAL_SCALE_X:
//                 hasLocalScale = true;
//                 localScale.x = value;
//                 break;
//             case PROPERTY_LOCAL_SCALE_Y:
//                 hasLocalScale = true;
//                 localScale.y = value;
//                 break;
//             case PROPERTY_LOCAL_SCALE_Z:
//                 hasLocalScale = true;
//                 localScale.z = value;
//                 break;
//             default:
//                 throw new Error(`invalid property: ${propertyName}`);
//         }
//         // }
//     });
//     // }
//
//     const assignProperty = (obj: Actor) => {
//         // Debug.Log("==========");
//         // Debug.Log(LocalPosition);
//         // Debug.Log(LocalRotationEuler);
//         // Debug.Log(LocalScale);
//         if (hasLocalPosition) {
//             obj.transform.position.copy(localPosition);
//         }
//
//         if (hasLocalRotationEuler) {
//             obj.transform.rotation.setV(localRotationEuler);
//             // obj.transform.rotation.copy(
//             //     (localRotationEuler.x / 180) * Math.PI,
//             //     (localRotationEuler.y / 180) * Math.PI,
//             //     // (10 / 180) * Math.PI,
//             //     (localRotationEuler.z / 180) * Math.PI
//             // ));
//         }
//
//         if (hasLocalScale) {
//             obj.transform.scale.copy(localScale);
//             // obj.scale.copy(localScale);
//         }
//     };
//
//     return {
//         assignProperty,
//     };
// }
