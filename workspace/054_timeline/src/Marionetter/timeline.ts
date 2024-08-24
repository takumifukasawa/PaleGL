import { curveUtilityEvaluateCurve } from '@/Marionetter/curveUtilities.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { Light } from '@/PaleGL/actors/Light.ts';
import { Scene } from '@/PaleGL/core/Scene.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera.ts';
import {
    MarionetterActivationControlClip,
    MarionetterActivationControlClipInfo,
    MarionetterAnimationClip,
    MarionetterAnimationClipInfo,
    MarionetterAnimationClipType,
    MarionetterClipInfoKinds,
    MarionetterClipInfoType,
    MarionetterClipKinds,
    MarionetterDefaultTrackInfo,
    MarionetterLightControlClip,
    MarionetterLightControlClipInfo,
    MarionetterMarkerTrackInfo,
    MarionetterPlayableDirectorComponentInfo,
    MarionetterSignalEmitter,
    MarionetterTimeline,
    MarionetterTimelineDefaultTrack,
    MarionetterTimelineMarkerTrack,
    MarionetterTimelineSignalEmitter,
    MarionetterTimelineTrackKinds,
    MarionetterTrackInfoType,
} from '@/Marionetter/types';
import {
    PROPERTY_COLOR_A,
    PROPERTY_COLOR_B,
    PROPERTY_COLOR_G,
    PROPERTY_COLOR_R,
    PROPERTY_FIELD_OF_VIEW,
    PROPERTY_INTENSITY,
    PROPERTY_LOCAL_EULER_ANGLES_RAW_X,
    PROPERTY_LOCAL_EULER_ANGLES_RAW_Y,
    PROPERTY_LOCAL_EULER_ANGLES_RAW_Z,
    PROPERTY_LOCAL_POSITION_X,
    PROPERTY_LOCAL_POSITION_Y,
    PROPERTY_LOCAL_POSITION_Z,
    PROPERTY_LOCAL_SCALE_X,
    PROPERTY_LOCAL_SCALE_Y,
    PROPERTY_LOCAL_SCALE_Z,
    PROPERTY_MATERIAL_BASE_COLOR_A,
    PROPERTY_MATERIAL_BASE_COLOR_B,
    PROPERTY_MATERIAL_BASE_COLOR_G,
    PROPERTY_MATERIAL_BASE_COLOR_R,
    PROPERTY_POST_PROCESS_BLOOM_INTENSITY,
    PROPERTY_POST_PROCESS_DEPTH_OF_FIELD_FOCUS_DISTANCE,
} from '@/Marionetter/constants.ts';
import { Rotator } from '@/PaleGL/math/Rotator.ts';
import { Quaternion } from '@/PaleGL/math/Quaternion.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { DEG_TO_RAD, PostProcessPassType } from '@/PaleGL/constants.ts';
import { PostProcessVolume } from '@/PaleGL/actors/PostProcessVolume.ts';
import { BloomPassParameters } from '@/PaleGL/postprocess/BloomPass.ts';

// import { resolveInvertRotationLeftHandAxisToRightHandAxis } from '@/Marionetter/buildMarionetterScene.ts';

/**
 *
 * @param marionetterPlayableDirectorComponentInfo
 */
export function buildMarionetterTimeline(
    actors: Actor[],
    marionetterPlayableDirectorComponentInfo: MarionetterPlayableDirectorComponentInfo
    // needsSomeActorsConvertLeftHandAxisToRightHandAxis = false
): MarionetterTimeline {
    const tracks: MarionetterTimelineTrackKinds[] = [];

    const buildSignalEmitter = (signalEmitter: MarionetterSignalEmitter): MarionetterTimelineSignalEmitter => {
        let triggered = false;
        const execute = (time: number) => {
            if (time > signalEmitter.time && triggered) {
                triggered = true;
            }
        };
        return {
            ...signalEmitter,
            triggered,
            execute,
        };
    };

    //
    // build track
    //

    for (let i = 0; i < marionetterPlayableDirectorComponentInfo.tracks.length; i++) {
        const track = marionetterPlayableDirectorComponentInfo.tracks[i];
        
        if (track.type === MarionetterTrackInfoType.MarkerTrack) {
            const { signalEmitters } = track as MarionetterMarkerTrackInfo;
            tracks.push({
                signalEmitters: signalEmitters.map((signalEmitter) => {
                    return buildSignalEmitter(signalEmitter);
                }),
                execute: () => {},
            } as MarionetterTimelineMarkerTrack);
        } else {
            const { targetName, clips } = track as MarionetterDefaultTrackInfo;
            const targetActor = Scene.find(actors, targetName); // TODO: sceneを介すさなくてもいい気がする
            //const marionetterClips = createMarionetterClips(clips, needsSomeActorsConvertLeftHandAxisToRightHandAxis);
            const marionetterClips = createMarionetterClips(clips);
            if (!targetActor) {
                console.warn(`[buildMarionetterTimeline] target actor is not found: ${targetName}`);
            }

            // exec track
            // TODO: clip間の mixer,interpolate,extrapolate の挙動が必要
            const execute = (time: number) => {
                if (track.type === MarionetterTrackInfoType.ActivationControlTrack) {
                    if (targetActor != null) {
                        const clipAtTime = marionetterClips.find(
                            (clip) => clip.clipInfo.start < time && time < clip.clipInfo.start + clip.clipInfo.duration
                        );
                        if (clipAtTime) {
                            targetActor.enabled = true;
                        } else {
                            targetActor.enabled = false;
                        }
                    }
                } else {
                    if (targetActor != null) {
                        for (let j = 0; j < marionetterClips.length; j++) {
                            marionetterClips[j].execute(targetActor, time);
                        }
                    }
                }
            };
            tracks.push({
                targetName,
                clips: marionetterClips,
                execute,
            } as MarionetterTimelineDefaultTrack);
        }
    }

    //
    // exec timeline
    //

    const execute = (time: number) => {
        // pattern1: use frame
        // const spf = 1 / fps;
        // const frameTime = Math.floor(rawTime / spf) * spf;
        // pattern2: use raw time
        const frameTime = time % marionetterPlayableDirectorComponentInfo.duration;
        for (let i = 0; i < tracks.length; i++) {
            tracks[i].execute(frameTime);
        }
    };

    return { tracks, execute };
}

/**
 *
 * @param clips
 */
function createMarionetterClips(
    clips: MarionetterClipInfoKinds[]
    // needsSomeActorsConvertLeftHandAxisToRightHandAxis = false
): MarionetterClipKinds[] {
    const marionetterClips = [] as MarionetterClipKinds[];

    for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        switch (clip.type) {
            case MarionetterClipInfoType.AnimationClip:
                marionetterClips.push(
                    createMarionetterAnimationClip(
                        clip as MarionetterAnimationClipInfo
                        // needsSomeActorsConvertLeftHandAxisToRightHandAxis
                    )
                );
                break;
            case MarionetterClipInfoType.LightControlClip:
                marionetterClips.push(createMarionetterLightControlClip(clip as MarionetterLightControlClipInfo));
                break;
            case MarionetterClipInfoType.ActivationControlClip:
                marionetterClips.push(
                    createMarionetterActivationControlClip(clip as MarionetterActivationControlClipInfo)
                );
                break;
            default:
                throw new Error(`[createMarionetterClips] invalid animation clip type`);
        }
    }

    return marionetterClips;
}

/**
 *
 * @param animationClip
 */
function createMarionetterAnimationClip(
    animationClip: MarionetterAnimationClipInfo
    // needsSomeActorsConvertLeftHandAxisToRightHandAxis = false
): MarionetterAnimationClip {
    // actorに直接valueを割り当てる関数
    const execute = (actor: Actor, time: number) => {
        let hasLocalPosition: boolean = false;
        let hasLocalRotationEuler: boolean = false;
        let hasLocalScale: boolean = false;
        const localPosition: Vector3 = Vector3.zero;
        const localRotationEulerDegree: Vector3 = Vector3.zero;
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
                    localRotationEulerDegree.x = value;
                    break;
                case PROPERTY_LOCAL_EULER_ANGLES_RAW_Y:
                    hasLocalRotationEuler = true;
                    localRotationEulerDegree.y = value;
                    break;
                case PROPERTY_LOCAL_EULER_ANGLES_RAW_Z:
                    hasLocalRotationEuler = true;
                    localRotationEulerDegree.z = value;
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
                case PROPERTY_FIELD_OF_VIEW:
                    (actor as PerspectiveCamera).fov = value;
                    (actor as PerspectiveCamera).updateProjectionMatrix();
                    break;
                case PROPERTY_MATERIAL_BASE_COLOR_R:
                case PROPERTY_MATERIAL_BASE_COLOR_G:
                case PROPERTY_MATERIAL_BASE_COLOR_B:
                case PROPERTY_MATERIAL_BASE_COLOR_A:
                    // TODO: GBufferMaterialとの連携？
                    break;
                case PROPERTY_POST_PROCESS_BLOOM_INTENSITY:
                    const params = (actor as PostProcessVolume).findParameter<BloomPassParameters>(
                        PostProcessPassType.Bloom
                    );
                    if(params) {
                        params.bloomAmount = value;
                    }
                    break;
                case PROPERTY_POST_PROCESS_DEPTH_OF_FIELD_FOCUS_DISTANCE:
                    // TODO: post process 連携
                    break;
                default:
                    // propertyが紐づいていない場合はエラーにする
                    throw new Error(`[createMarionetterAnimationClip] invalid property: ${propertyName}`);
            }
        });

        if (hasLocalScale) {
            actor.transform.scale.copy(localScale);
        }

        // TODO: なぜか一回行列に落とさないとうまく動かない. まわりくどいかつ余計な計算が走るが
        if (hasLocalRotationEuler) {
            const rm = Matrix4.multiplyMatrices(
                // TODO: 本当はc#側でxyを反転させて渡したいが、なぜかうまくいかないのでここだけフロント側で反転
                Matrix4.rotationYMatrix(-localRotationEulerDegree.y * DEG_TO_RAD),
                Matrix4.rotationXMatrix(-localRotationEulerDegree.x * DEG_TO_RAD),
                Matrix4.rotationZMatrix(localRotationEulerDegree.z * DEG_TO_RAD)
            );
            const q = Quaternion.rotationMatrixToQuaternion(rm);
            actor.transform.rotation = new Rotator(q);
        }

        if (hasLocalPosition) {
            // localPosition.z *= -1;
            actor.transform.position.copy(localPosition);
        }
    };

    return {
        type: MarionetterAnimationClipType.AnimationClip,
        clipInfo: animationClip,
        // bind,
        execute,
    };
}

/**
 *
 * @param lightControlClip
 */
function createMarionetterLightControlClip(
    lightControlClip: MarionetterLightControlClipInfo
): MarionetterLightControlClip {
    // let obj: Light | null;
    // const bind = (targetObj: Light) => {
    //     obj = targetObj;
    // };
    const execute = (actor: Actor, time: number) => {
        const light = actor as Light;
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

        if (hasPropertyColorR) {
            light.color.r = color.r;
        }
        if (hasPropertyColorG) {
            light.color.g = color.g;
        }
        if (hasPropertyColorB) {
            light.color.b = color.b;
        }
        if (hasPropertyColorA) {
            light.color.a = color.a;
        }
        if (hasPropertyIntensity) {
            light.intensity = intensity;
        }
        // if(hasPropertyBounceIntensity) {
        //     obj.bounceIntensity = bounceIntensity;
        // }
        // for spot light
        // if(hasPropertyRange) {
        //     obj.range = range;
        // }
    };

    return {
        type: MarionetterAnimationClipType.LightControlClip,
        clipInfo: lightControlClip,
        // bind,
        execute,
    };
}

/**
 *
 * @param lightControlClip
 */
function createMarionetterActivationControlClip(
    activationControlClip: MarionetterActivationControlClipInfo
): MarionetterActivationControlClip {
    // let obj: Light | null;
    // const bind = (targetObj: Light) => {
    //     obj = targetObj;
    // };
    // const execute = (actor: Actor, time: number) => {
    //     // const { start, duration} = activationControlClip;
    //     // console.log(start, duration, actor, time)
    // };

    return {
        type: MarionetterAnimationClipType.ActivationControlClip,
        clipInfo: activationControlClip,
        execute: () => {},
    };
}
