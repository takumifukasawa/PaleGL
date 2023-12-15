import { curveUtilityEvaluateCurve } from '@/Marionetter/curveUtilities.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';

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
    components: MarionetterComponentInfoTypes[]; // shorthand: c
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

type MarionetterTrack = {
    animationClips: MarionetterAnimationClipInfoTypes[];
};

type MarionetterAnimationClipInfoTypes = (MarionetterAnimationClipInfo | MarionetterLightControlClipInfo);

type MarionetterAnimationClipBase = {
    start: number; // shorthand: s
    duration: number; // shorthand: d
    bindings: MarionetterAnimationClipBinding[]; // shorthand: b
};

type MarionetterAnimationClipInfo = MarionetterAnimationClipBase & {
    offsetPosition: Vector3; // shorthand: op
    offsetRotation: Vector3; // shorthand: or
};

type MarionetterLightControlClipInfo = MarionetterAnimationClipBase; // TODO: 追加が必要なはず

type MarionetterAnimationClipBinding = {
    propertyName: string; // short hand: n
    keyframes: MarionetterAnimationClipKeyframe[];
};

type MarionetterAnimationClipKeyframe = {
    time: number; // shorthand: t
    value: number; // shorthand: v
    inTangent: number; // shorthand: i
    outTangent: number; // shorthand: o
}

//
// components
//

type MarionetterComponentInfoBase = {
    type: MarionetterComponentType;
};

const enum MarionetterComponentType {
    PlayableDirector = 0,
    Light = 1,
}

type MarionetterComponentInfoTypes = (MarionetterPlayableDirectorComponentInfo | MarionetterLightComponentInfo);

export type MarionetterPlayableDirectorComponentInfo = MarionetterComponentInfoBase & {
    name: string; // shorthand: n
    duration: number; // shorthand: d
    tracks: MarionetterTrack[]; // shorthand: t
};

type MarionetterLightComponentInfo = MarionetterComponentInfoBase & {
    lightType: string; // shorthand: l
    color: string; // shorthand: c, hex string
};

// export function createLightTrackBinder(animationClips: AnimationClip[], time: number) {}

/**
 *
 */
export function createMarionetterAnimationTrackBinder(animationClips: MarionetterAnimationClipInfoTypes[], rawTime: number) {
    // ---------------------------------------------------------------------------
    // public
    // ---------------------------------------------------------------------------

    let hasLocalPosition: boolean = false;
    let hasLocalRotationEuler: boolean = false;
    let hasLocalScale: boolean = false;
    const localPosition: Vector3 = Vector3.zero;
    const localRotationEuler: Vector3 = Vector3.zero;
    const localScale: Vector3 = Vector3.one;
   
    // const spf = 1 / fps;
    // const frameTime = Math.floor(rawTime / spf) * spf;
    const frameTime = rawTime;

    // TODO: pre-extrapolate, post-extrapolate
    // NOTE: 一個だけ抽出 = animation clip の blend は対応していない
    // const animationClip = animationClips.find((ac) => ac.start <= time && time < ac.start + ac.duration);
    const animationClip = animationClips.find((ac) => ac.start <= frameTime && frameTime < ac.start + ac.duration);
    if (!animationClip) {
        return;
    }
    const { start, bindings } = animationClip;

    // TODO: typeがあった方がよい. ex) animation clip, light control clip
    bindings.forEach(({ propertyName, keyframes }) => {
        // Debug.Log(binding.type.FullName);
        // animated transform

        // TODO: check transform type
        // if (binding.type.FullName == typeof(Transform).FullName) {
        // var curve = AnimationUtility.GetEditorCurve(animationClip, binding);
        // for debug
        // Debug.Log(binding.propertyName);
        const value = curveUtilityEvaluateCurve(frameTime - start, keyframes);

        // // animated transform
        // if (binding.type.FullName == typeof(Transform).FullName)
        // {
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
        assignProperty,
    };
}
