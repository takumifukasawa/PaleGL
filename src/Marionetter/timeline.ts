import {
    PROPERTY_COLOR_A,
    PROPERTY_COLOR_B,
    PROPERTY_COLOR_G,
    PROPERTY_COLOR_R,
    PROPERTY_FIELD_OF_VIEW,
    PROPERTY_LIGHT_INTENSITY,
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
    PROPERTY_SPOTLIGHT_RANGE,
} from '@/Marionetter/constants.ts';
import { curveUtilityEvaluateCurve } from '@/Marionetter/curveUtilities.ts';
import { isTimeInClip } from '@/Marionetter/timelineUtilities.ts';
import {
    MARIONETTER_ANIMATION_CLIP_BINDINGS_INDEX,
    MARIONETTER_ANIMATION_CLIP_DURATION_INDEX,
    MARIONETTER_ANIMATION_CLIP_NAME_INDEX,
    MARIONETTER_ANIMATION_CLIP_POST_EXTRAPORATION_INDEX,
    MARIONETTER_ANIMATION_CLIP_START_INDEX,
    MARIONETTER_ANIMATION_CLIP_TYPE_INDEX,
    MARIONETTER_CLIP_INFO_TYPE_ACTIVATION_CONTROL_CLIP,
    MARIONETTER_CLIP_INFO_TYPE_ANIMATION_CLIP,
    MARIONETTER_CLIP_INFO_TYPE_LIGHT_CONTROL_CLIP,
    MARIONETTER_CLIP_INFO_TYPE_OBJECT_MOVE_AND_LOOK_AT_CLIP,
    MARIONETTER_CLIP_POST_EXTRAPORATION_MODE,
    MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_HOLD,
    MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_LOOP,
    MARIONETTER_CLIP_TYPE_ACTIVATION_CONTROL_CLIP,
    MARIONETTER_CLIP_TYPE_ANIMATION_CLIP,
    MARIONETTER_CLIP_TYPE_LIGHT_CONTROL_CLIP,
    MARIONETTER_CLIP_TYPE_OBJECT_MOVE_AND_LOOK_AT_CLIP,
    MARIONETTER_DEFAULT_TRACK_INFO_CLIPS_INDEX,
    MARIONETTER_DEFAULT_TRACK_INFO_NAME_INDEX,
    MARIONETTER_DEFAULT_TRACK_INFO_TARGET_NAME_INDEX,
    MARIONETTER_DEFAULT_TRACK_INFO_TYPE_INDEX,
    MARIONETTER_MARKER_TRACK_INFO_NAME_INDEX,
    MARIONETTER_MARKER_TRACK_INFO_SIGNAL_EMITTERS_INDEX,
    MARIONETTER_MARKER_TRACK_INFO_TYPE_INDEX,
    MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOCAL_POSITION_X,
    MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOCAL_POSITION_Y,
    MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOCAL_POSITION_Z,
    MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_UP_VECTOR_X,
    MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_UP_VECTOR_Y,
    MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_UP_VECTOR_Z,
    MARIONETTER_PLAYABLE_DIRECTOR_COMPONENT_INFO_PROPERTY_DURATION,
    MARIONETTER_PLAYABLE_DIRECTOR_COMPONENT_INFO_PROPERTY_TRACKS,
    MARIONETTER_SIGNAL_EMITTER_PROPERTY_NAME,
    MARIONETTER_SIGNAL_EMITTER_PROPERTY_TIME,
    MARIONETTER_TRACK_INFO_BASE_NAME_INDEX,
    MARIONETTER_TRACK_INFO_BASE_TYPE_INDEX,
    MARIONETTER_TRACK_INFO_TYPE_ACTIVATION_CONTROL_TRACK,
    MARIONETTER_TRACK_INFO_TYPE_MARKER_TRACK,
    MARIONETTER_TRACK_TYPE_DEFAULT,
    MARIONETTER_TRACK_TYPE_MARKER,
    MarionetterActivationControlClip,
    MarionetterActivationControlClipInfo,
    MarionetterAnimationClip,
    MarionetterAnimationClipInfo,
    MarionetterClipArgs,
    MarionetterClipInfoBase,
    MarionetterClipInfoKinds,
    MarionetterClipKinds,
    MarionetterDefaultTrackInfo,
    MarionetterLightControlClip,
    MarionetterLightControlClipInfo,
    MarionetterMarkerTrackInfo,
    MarionetterObjectMoveAndLookAtClip,
    MarionetterObjectMoveAndLookAtClipInfo,
    MarionetterPlayableDirectorComponentInfo,
    MarionetterSignalEmitter,
    MarionetterTimeline,
    MarionetterTimelineDefaultTrack,
    MarionetterTimelineMarkerTrack,
    MarionetterTimelineSignalEmitter,
    MarionetterTimelineTrackExecuteArgs,
    MarionetterTimelineTrackKinds,
} from '@/Marionetter/types';
import { Actor, getActorComponent } from '@/PaleGL/actors/actor.ts';
import {
    postProcessActorTimeline,
    preProcessActorTimeline,
    processActorPostProcessClip,
    processActorPropertyBinder,
} from '@/PaleGL/actors/actorBehaviours.ts';
import { updateProjectionMatrix } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera';
import { Light } from '@/PaleGL/actors/lights/light.ts';
import { SpotLight } from '@/PaleGL/actors/lights/spotLight.ts';
import { ObjectMoveAndLookAtController } from '@/PaleGL/components/objectMoveAndLookAtController.ts';
import { ACTOR_TYPE_LIGHT, DEG_TO_RAD, LIGHT_TYPE_DIRECTIONAL, LIGHT_TYPE_SPOT } from '@/PaleGL/constants.ts';
import { findActorByName, Scene } from '@/PaleGL/core/scene.ts';
import { setRotation } from '@/PaleGL/core/transform.ts';
import {
    Color,
    createColor,
    getColorA,
    getColorB,
    getColorG,
    getColorR,
    setColorA,
    setColorB,
    setColorChannel,
    setColorG,
    setColorR,
} from '@/PaleGL/math/color.ts';
import {
    createRotationXMatrix,
    createRotationYMatrix,
    createRotationZMatrix,
    multiplyMat4Array,
} from '@/PaleGL/math/matrix4.ts';
import { createQuaternionInvertAxis, rotationMatrixToQuaternion } from '@/PaleGL/math/quaternion.ts';
import { createRotator } from '@/PaleGL/math/rotator.ts';
import { createVector2, Vector2 } from '@/PaleGL/math/vector2.ts';
import {
    copyVector3,
    createVector3,
    createVector3One,
    createVector3Zero,
    negateVector3,
    setV3,
    setV3x,
    setV3y,
    setV3z,
    v3x,
    v3y,
    v3z,
    Vector3,
} from '@/PaleGL/math/vector3.ts';
import { createVector4zero, setVector4Component, v4x, v4y, v4z, Vector4 } from '@/PaleGL/math/vector4.ts';

// import { resolveInvertRotationLeftHandAxisToRightHandAxis } from '@/Marionetter/buildMarionetterScene.ts';

export const destructureClipInfoBase = (clipInfoBase: MarionetterClipInfoBase) => {
    const start = clipInfoBase[MARIONETTER_ANIMATION_CLIP_START_INDEX];
    const duration = clipInfoBase[MARIONETTER_ANIMATION_CLIP_DURATION_INDEX];
    const postExtrapolation = clipInfoBase[MARIONETTER_ANIMATION_CLIP_POST_EXTRAPORATION_INDEX];
    // Speed is optional and appears as the last element if != 1.0
    // postExtrapolation is 0-4 (integer), speed is typically 0.1-10.0 (float)
    const lastElement = clipInfoBase[clipInfoBase.length - 1];
    const isSpeedPresent = clipInfoBase.length > 5 &&
                          typeof lastElement === 'number' &&
                          (lastElement < 0.9 || lastElement > 1.1);
    const speed = isSpeedPresent ? lastElement : 1.0;
    return [start, duration, postExtrapolation, speed];
};

/**
 *
 * @param marionetterPlayableDirectorComponentInfo
 */
export function buildMarionetterTimeline(
    marionetterActors: Actor[],
    marionetterPlayableDirectorComponentInfo: MarionetterPlayableDirectorComponentInfo
    // placedScene: Scene
    // needsSomeActorsConvertLeftHandAxisToRightHandAxis = false
): MarionetterTimeline {
    const tracks: MarionetterTimelineTrackKinds[] = [];

    const { d } = marionetterPlayableDirectorComponentInfo;

    // for debug
    // console.log(
    //     `[buildMarionetterTimeline] marionetterPlayableDirectorComponentInfo:`,
    //     marionetterPlayableDirectorComponentInfo,
    //     marionetterActors
    // );

    const buildSignalEmitter = (signalEmitter: MarionetterSignalEmitter): MarionetterTimelineSignalEmitter => {
        let triggered = false;
        const execute = (time: number) => {
            if (time > signalEmitter[MARIONETTER_SIGNAL_EMITTER_PROPERTY_TIME] && triggered) {
                triggered = true;
            }
        };
        return {
            name: signalEmitter[MARIONETTER_SIGNAL_EMITTER_PROPERTY_NAME],
            time: signalEmitter[MARIONETTER_SIGNAL_EMITTER_PROPERTY_TIME],
            // ...signalEmitter,
            triggered,
            execute,
        };
    };

    //
    // build track
    //

    for (
        let i = 0;
        i <
        marionetterPlayableDirectorComponentInfo[MARIONETTER_PLAYABLE_DIRECTOR_COMPONENT_INFO_PROPERTY_TRACKS].length;
        i++
    ) {
        const track =
            marionetterPlayableDirectorComponentInfo[MARIONETTER_PLAYABLE_DIRECTOR_COMPONENT_INFO_PROPERTY_TRACKS][i];

        if (track[MARIONETTER_TRACK_INFO_BASE_TYPE_INDEX] === MARIONETTER_TRACK_INFO_TYPE_MARKER_TRACK) {
            const signalEmitters = (track as MarionetterMarkerTrackInfo)[
                MARIONETTER_MARKER_TRACK_INFO_SIGNAL_EMITTERS_INDEX
            ];
            const data = {
                name: track[MARIONETTER_TRACK_INFO_BASE_NAME_INDEX],
                trackType: MARIONETTER_TRACK_TYPE_MARKER,
                signalEmitters: signalEmitters.map((signalEmitter) => {
                    return buildSignalEmitter(signalEmitter);
                }),
                execute: () => {},
            } as MarionetterTimelineMarkerTrack;
            tracks.push(data);
        } else {
            const targetName = (track as MarionetterDefaultTrackInfo)[
                MARIONETTER_DEFAULT_TRACK_INFO_TARGET_NAME_INDEX
            ];
            const clips = (track as MarionetterDefaultTrackInfo)[MARIONETTER_DEFAULT_TRACK_INFO_CLIPS_INDEX];
            // const targetActors = [
            //     findActorByName(marionetterActors, targetName),
            //     // Scene.find(placedScene.children, targetName),
            // ];
            let targetActor = findActorByName(marionetterActors, targetName);

            if (!targetActor) {
                console.warn(`[buildMarionetterTimeline] target actor is not found: ${targetName}`);
            }

            targetActor = targetActor as Actor;

            const data: MarionetterTimelineDefaultTrack = {
                name: track[MARIONETTER_TRACK_INFO_BASE_NAME_INDEX],
                trackType: MARIONETTER_TRACK_TYPE_DEFAULT,
                targetName,
                targetActor,
                clips: [],
                // TODO: clip間の mixer,interpolate,extrapolate の挙動が必要
                execute: (args: MarionetterTimelineTrackExecuteArgs) => {},
            };
            
            
            //const marionetterClips = createMarionetterClips(clips, needsSomeActorsConvertLeftHandAxisToRightHandAxis);
            const marionetterClips = createMarionetterClips(data, clips);
            // if (targetActors.length < 1) {
            //     console.warn(`[buildMarionetterTimeline] target actor is not found: ${targetName}`);
            // }
            // for debug
            // console.log(
            //     `[buildMarionetterTimeline] targetName: ${targetName}, targetActor:`,
            //     targetActor.name,
            //     targetActor,
            //     marionetterClips
            // );

            const execute = (args: MarionetterTimelineTrackExecuteArgs) => {
                const { time, scene } = args;
                let beforeClipAtTime: MarionetterClipKinds | null = null;
                let clipAtTime: MarionetterClipKinds | null = null;
                for (let i = 0; i < marionetterClips.length; i++) {
                    const { clipInfo } = marionetterClips[i];
                    const start = clipInfo[MARIONETTER_ANIMATION_CLIP_START_INDEX];
                    const duration = clipInfo[MARIONETTER_ANIMATION_CLIP_DURATION_INDEX];
                    // その時間再生すべきclipがあったら
                    if (isTimeInClip(time, start, start + duration)) {
                        clipAtTime = marionetterClips[i];
                        break;
                    }

                    if (time > start + duration) {
                        beforeClipAtTime = marionetterClips[i];
                    }
                }

                // 現在時刻にclipはないが直前にclipがある場合
                // 直前のclipが終了後も再生すべきclipなら直前のclipを再生
                if (beforeClipAtTime && !clipAtTime) {
                    if (
                        isHoldClipPostExtrapolate(beforeClipAtTime) ||
                        isLoopClipPostExtrapolate(beforeClipAtTime)
                    ) {
                        clipAtTime = beforeClipAtTime;
                    }
                }

                // const clipAtTime = marionetterClips.find(
                //     ({ clipInfo }) => {
                //         const start = clipInfo[MARIONETTER_ANIMATION_CLIP_START_INDEX];
                //         const duration = clipInfo[MARIONETTER_ANIMATION_CLIP_DURATION_INDEX];
                //         return isTimeInClip(time, start, start + duration);
                //     }
                // );

                // NOTE: 渡されるtimeそのものがframeTimeになった
                // const frameTime = time % marionetterPlayableDirectorComponentInfo.d;

                // まずactorのprocessTimelineを実行
                if (targetActor) {
                    preProcessActorTimeline(targetActor, time);
                }

                if (
                    track[MARIONETTER_TRACK_INFO_BASE_TYPE_INDEX] ===
                    MARIONETTER_TRACK_INFO_TYPE_ACTIVATION_CONTROL_TRACK
                ) {
                    if (targetActor) {
                        if (clipAtTime) {
                            targetActor.enabled = true;
                        } else {
                            targetActor.enabled = false;
                        }
                    }
                } else {
                    // // 非アクティブなactorはclipの処理は走らせない
                    // if (targetActor && targetActor.enabled && clipAtTime) {
                    if (targetActor && clipAtTime) {
                        clipAtTime.execute({ actor: targetActor, time, scene });
                    }
                }

                // clipの実行後にupdate
                if (targetActor) {
                    postProcessActorTimeline(targetActor, time);
                }
                // });
            };
            
            data.clips = marionetterClips;
            data.execute = execute;

            // const data: MarionetterTimelineDefaultTrack = {
            //     name: track[MARIONETTER_TRACK_INFO_BASE_NAME],
            //     trackType: MARIONETTER_TRACK_TYPE_DEFAULT,
            //     targetName,
            //     targetActor,
            //     clips: marionetterClips,
            //     // TODO: clip間の mixer,interpolate,extrapolate の挙動が必要
            //     execute: (args: MarionetterTimelineTrackExecuteArgs) => {
            //         const { time, scene } = args;
            //         let beforeClipAtTime: MarionetterClipKinds | null = null;
            //         let clipAtTime: MarionetterClipKinds | null = null;
            //         for (let i = 0; i < marionetterClips.length; i++) {
            //             const { clipInfo } = marionetterClips[i];
            //             const start = clipInfo[MARIONETTER_ANIMATION_CLIP_START_INDEX];
            //             const duration = clipInfo[MARIONETTER_ANIMATION_CLIP_DURATION_INDEX];
            //             // その時間再生すべきclipがあったら
            //             if (isTimeInClip(time, start, start + duration)) {
            //                 clipAtTime = marionetterClips[i];
            //                 break;
            //             }

            //             if (time > start + duration) {
            //                 beforeClipAtTime = marionetterClips[i];
            //             }
            //         }

            //         // 現在時刻にclipはないが直前にclipがある場合
            //         // 直前のclipが終了後も再生すべきclipなら直前のclipを再生
            //         if (beforeClipAtTime && !clipAtTime) {
            //             if (
            //                 isHoldClipPostExtrapolate(beforeClipAtTime) ||
            //                 isLoopClipPostExtrapolate(beforeClipAtTime)
            //             ) {
            //                 clipAtTime = beforeClipAtTime;
            //             }
            //         }

            //         // const clipAtTime = marionetterClips.find(
            //         //     ({ clipInfo }) => {
            //         //         const start = clipInfo[MARIONETTER_ANIMATION_CLIP_START_INDEX];
            //         //         const duration = clipInfo[MARIONETTER_ANIMATION_CLIP_DURATION_INDEX];
            //         //         return isTimeInClip(time, start, start + duration);
            //         //     }
            //         // );

            //         // NOTE: 渡されるtimeそのものがframeTimeになった
            //         // const frameTime = time % marionetterPlayableDirectorComponentInfo.d;

            //         // まずactorのprocessTimelineを実行
            //         if (targetActor) {
            //             preProcessActorTimeline(targetActor, time);
            //         }

            //         if (
            //             track[MARIONETTER_TRACK_INFO_BASE_PROPERTY_TYPE] ===
            //             MARIONETTER_TRACK_INFO_TYPE_ACTIVATION_CONTROL_TRACK
            //         ) {
            //             if (targetActor) {
            //                 if (clipAtTime) {
            //                     targetActor.enabled = true;
            //                 } else {
            //                     targetActor.enabled = false;
            //                 }
            //             }
            //         } else {
            //             if (targetActor && clipAtTime) {
            //                 clipAtTime.execute({ actor: targetActor, time, scene });
            //             }
            //         }

            //         // clipの実行後にupdate
            //         if (targetActor) {
            //             postProcessActorTimeline(targetActor, time);
            //         }
            //         // });
            //     },
            // };
            tracks.push(data);
        }
    }

    //
    // exec timeline
    //

    const execute = (args: { time: number; scene: Scene }) => {
        const { time, scene } = args;
        // pattern1: use frame
        // const spf = 1 / fps;
        // const frameTime = Math.floor(rawTime / spf) * spf;
        // pattern2: use raw time
        const frameTime =
            time %
            marionetterPlayableDirectorComponentInfo[MARIONETTER_PLAYABLE_DIRECTOR_COMPONENT_INFO_PROPERTY_DURATION];
        for (let i = 0; i < tracks.length; i++) {
            tracks[i].execute({ time: frameTime, scene });
        }
    };

    const bindActors = (actors: Actor[]) => {
        actors.forEach((actor) => {
            const targetName = actor.name;
            if (!targetName) return;
            tracks.forEach((track) => {
                // TODO: ここなんかうまいことやりたい
                if (Object.hasOwn(track, 'targetName')) {
                    const t = track as MarionetterTimelineDefaultTrack;
                    const targetActor = findActorByName(actors, targetName);
                    if (targetActor) {
                        t.targetActor = targetActor;
                    } else {
                        console.warn(`[buildMarionetterTimeline][bindActors] target actor is not found: ${targetName}`);
                    }
                }
                // // TODO: ここなんかうまいことやりたい
                // if (Object.hasOwn(track, 'targetName')) {
                //     const t = track as MarionetterTimelineDefaultTrack;
                //     if (t.targetName === targetName) {
                //         // t.targetActors.push(actor);
                //         t.targetActor = actor;
                //     }
                // }
            });
        });
    };

    // return { tracks, execute, bindActor };
    return { tracks, execute, bindActors, duration: d };
}

/**
 *
 * @param clips
 */
function createMarionetterClips(
    track: MarionetterTimelineDefaultTrack,
    clips: MarionetterClipInfoKinds[]
    // needsSomeActorsConvertLeftHandAxisToRightHandAxis = false
): MarionetterClipKinds[] {
    const marionetterClips = [] as MarionetterClipKinds[];

    for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const clipType = clip[MARIONETTER_ANIMATION_CLIP_TYPE_INDEX];
        // switch (clip[MARIONETTER_CLIP_INFO_BASE_PROPERTY_TYPE]) {
        switch (clipType) {
            case MARIONETTER_CLIP_INFO_TYPE_ANIMATION_CLIP:
                marionetterClips.push(
                    createMarionetterAnimationClip(
                        track,
                        clip as MarionetterAnimationClipInfo
                        // needsSomeActorsConvertLeftHandAxisToRightHandAxis
                    )
                );
                break;
            case MARIONETTER_CLIP_INFO_TYPE_LIGHT_CONTROL_CLIP:
                marionetterClips.push(createMarionetterLightControlClip(track, clip as MarionetterLightControlClipInfo));
                break;
            case MARIONETTER_CLIP_INFO_TYPE_ACTIVATION_CONTROL_CLIP:
                marionetterClips.push(
                    createMarionetterActivationControlClip(track, clip as MarionetterActivationControlClipInfo)
                );
                break;
            case MARIONETTER_CLIP_INFO_TYPE_OBJECT_MOVE_AND_LOOK_AT_CLIP:
                marionetterClips.push(
                    createMarionetterObjectMoveAndLookAtClip(track, clip as MarionetterObjectMoveAndLookAtClipInfo)
                );
                break;

            // case MarionetterClipInfoType.HumanClip:
            //     // TODO: custom track は外から注入したい
            //     marionetterClips.push(createMarionetterHumanClip(clip as MarionetterHumanClipInfo));
            //     break;

            default:
                console.error(`[createMarionetterClips] invalid animation clip type`);
        }
    }

    return marionetterClips;
}

/**
 *
 * @param animationClip
 */
function createMarionetterAnimationClip(
    track: MarionetterTimelineDefaultTrack,
    animationClipInfo: MarionetterAnimationClipInfo
    // needsSomeActorsConvertLeftHandAxisToRightHandAxis = false
): MarionetterAnimationClip {
    // TODO: 負荷対策のためにキャッシュしたい
    const numberPropertyMap = new Map<string, number>();
    const vector2PropertyMap = new Map<string, Vector2>();
    const vector3PropertyMap = new Map<string, Vector3>();
    const vector4PropertyMap = new Map<string, Vector4>();
    const tmpVector4PropertyMap = new Map<string, Vector4>();
    const tmpVector4LengthMap = new Map<string, number>();
    const colorPropertyMap = new Map<string, Color>();
    const localPosition: Vector3 = createVector3Zero();
    const localRotationEulerDegree: Vector3 = createVector3Zero();
    const localScale: Vector3 = createVector3One();

    // console.log('hogehoge - clip', animationClip);
    const name = animationClipInfo[MARIONETTER_ANIMATION_CLIP_NAME_INDEX];
    const [start, duration, postExtrapolation, speed] = destructureClipInfoBase(animationClipInfo);
    const bindings = animationClipInfo[MARIONETTER_ANIMATION_CLIP_BINDINGS_INDEX];

    const animationClip: MarionetterAnimationClip = {
        name,
        type: MARIONETTER_CLIP_TYPE_ANIMATION_CLIP,
        clipInfo: animationClipInfo,
        // bind,
        execute: () => {},
    };

    // actorに直接valueを割り当てる関数
    animationClip.execute = (args: MarionetterClipArgs) => {
        const { actor, time } = args;
        let hasLocalPosition: boolean = false;
        let hasLocalRotationEuler: boolean = false;
        let hasLocalScale: boolean = false;

        numberPropertyMap.clear();
        vector2PropertyMap.clear();
        vector3PropertyMap.clear();
        vector4PropertyMap.clear();
        tmpVector4PropertyMap.clear();
        tmpVector4LengthMap.clear();
        colorPropertyMap.clear();
        setV3(localPosition, 0, 0, 0);
        setV3(localRotationEulerDegree, 0, 0, 0);
        setV3(localScale, 1, 1, 1);

        // const start = animationClip[MARIONETTER_CLIP_INFO_BASE_PROPERTY_START];
        // const bindings = animationClip[MARIONETTER_ANIMATION_CLIP_INFO_PROPERTY_BINDINGS];

        // // for debug
        // const animationClipType = animationClip[MarionetterAnimationClipInfoProperty.animationClipType];
        // console.log('createMarionetterAnimationClip execute', bindings, animationClipType);

        const timeInClip = resolveClipTime(time, start, duration, postExtrapolation, speed);

        // TODO: typeがあった方がよい. ex) animation clip, light control clip
        bindings.forEach((binding) => {
            const [propertyName, keyframes = [[]]] = binding;
            const value = curveUtilityEvaluateCurve(timeInClip, duration, keyframes, postExtrapolation);

            switch (propertyName) {
                case PROPERTY_LOCAL_POSITION_X:
                    hasLocalPosition = true;
                    setV3x(localPosition, value);
                    break;
                case PROPERTY_LOCAL_POSITION_Y:
                    hasLocalPosition = true;
                    setV3y(localPosition, value);
                    break;
                case PROPERTY_LOCAL_POSITION_Z:
                    hasLocalPosition = true;
                    setV3z(localPosition, value);
                    break;
                case PROPERTY_LOCAL_EULER_ANGLES_RAW_X:
                    hasLocalRotationEuler = true;
                    setV3x(localRotationEulerDegree, value);
                    break;
                case PROPERTY_LOCAL_EULER_ANGLES_RAW_Y:
                    hasLocalRotationEuler = true;
                    setV3y(localRotationEulerDegree, value);
                    break;
                case PROPERTY_LOCAL_EULER_ANGLES_RAW_Z:
                    hasLocalRotationEuler = true;
                    setV3z(localRotationEulerDegree, value);
                    break;
                case PROPERTY_LOCAL_SCALE_X:
                    hasLocalScale = true;
                    setV3x(localScale, value);
                    break;
                case PROPERTY_LOCAL_SCALE_Y:
                    hasLocalScale = true;
                    setV3y(localScale, value);
                    break;
                case PROPERTY_LOCAL_SCALE_Z:
                    hasLocalScale = true;
                    setV3z(localScale, value);
                    break;
                case PROPERTY_FIELD_OF_VIEW:
                    (actor as PerspectiveCamera).fov = value;
                    updateProjectionMatrix(actor as PerspectiveCamera);
                    break;
                case PROPERTY_MATERIAL_BASE_COLOR_R:
                case PROPERTY_MATERIAL_BASE_COLOR_G:
                case PROPERTY_MATERIAL_BASE_COLOR_B:
                case PROPERTY_MATERIAL_BASE_COLOR_A:
                    // TODO: GBufferMaterialとの連携？
                    break;
                default:
                    const accessors = propertyName.split('.');
                    if (accessors.length > 1) {
                        // vector, color
                        const [accessorKey, accessorElement] = accessors;
                        switch (accessorElement) {
                            case 'x':
                            case 'y':
                            case 'z':
                            case 'w':
                                if (!tmpVector4PropertyMap.has(accessorKey)) {
                                    tmpVector4PropertyMap.set(accessorKey, createVector4zero());
                                    tmpVector4LengthMap.set(accessorKey, 0);
                                }
                                setVector4Component(tmpVector4PropertyMap.get(accessorKey)!, accessorElement, value);
                                tmpVector4LengthMap.set(accessorKey, tmpVector4LengthMap.get(accessorKey)! + 1);
                                break;
                            case 'r':
                            case 'g':
                            case 'b':
                            case 'a':
                                if (!colorPropertyMap.has(accessorKey)) {
                                    colorPropertyMap.set(accessorKey, createColor());
                                }
                                setColorChannel(colorPropertyMap.get(accessorKey)!, accessorElement, value);
                                break;
                        }
                    } else {
                        if (!numberPropertyMap.has(propertyName)) {
                            numberPropertyMap.set(propertyName, value);
                        }
                    }
                    break;
            }
        });

        // 自動割り当て(transform関連など) ---

        // set local scale
        if (hasLocalScale) {
            copyVector3(actor.transform.scale, localScale);
        } else {
            // ない場合はセットしない方（sceneに任せる）
            // copyVector3(actor.transform.scale, createVector3One());
        }

        // set local rotation
        // TODO: なぜか一回行列に落とさないとうまく動かない. まわりくどいかつ余計な計算が走るが
        if (hasLocalRotationEuler) {
            const rm = multiplyMat4Array(
                // // TODO: 本当はc#側でxyを反転させて渡したいが、なぜかうまくいかないのでここだけフロント側で反転
                // createRotationYMatrix(v3y(negateVector3(localRotationEulerDegree)) * DEG_TO_RAD),
                // createRotationXMatrix(v3x(negateVector3(localRotationEulerDegree)) * DEG_TO_RAD),
                // createRotationZMatrix(v3z(localRotationEulerDegree) * DEG_TO_RAD)
                // TODO: 本当はc#側yzを反転させて渡したいが、なぜかうまくいかないのでここだけフロント側で反転
                // 旧PaleGLだとxy反転だったが
                createRotationYMatrix(v3y(negateVector3(localRotationEulerDegree)) * DEG_TO_RAD),
                createRotationXMatrix(v3x(localRotationEulerDegree) * DEG_TO_RAD),
                createRotationZMatrix(v3z(negateVector3(localRotationEulerDegree)) * DEG_TO_RAD)
            );
            const q = rotationMatrixToQuaternion(rm);
            setRotation(
                actor.transform,
                createRotator(
                    // actor.type === ACTOR_TYPE_LIGHT && (actor as Light).lightType === LIGHT_TYPE_SPOT ? q.invertAxis() : q
                    actor.type === ACTOR_TYPE_LIGHT &&
                        ((actor as Light).lightType === LIGHT_TYPE_SPOT ||
                            (actor as Light).lightType === LIGHT_TYPE_DIRECTIONAL)
                        ? createQuaternionInvertAxis(q)
                        : q
                )
            );
        } else {
            // ない場合はセットしない方（sceneに任せる）
            // setRotation(actor.transform, createRotatorFromQuaternion(createQuaternionIdentity()));
        }

        // set local position
        if (hasLocalPosition) {
            // localPosition.z *= -1;
            copyVector3(actor.transform.position, localPosition);
        } else {
            // ない場合はセットしない方（sceneに任せる）
            // copyVector3(actor.transform.position, createVector3Zero());
        }

        // カスタム値などhook的に流す ---

        // set float
        // numberの場合はすぐにセットしちゃう
        numberPropertyMap.forEach((numberValue, numberKey) => {
            processActorPropertyBinder(actor, numberKey, numberValue, animationClip, timeInClip);
        });

        // iterate vector4
        tmpVector4PropertyMap.forEach((v4, key) => {
            switch (tmpVector4LengthMap.get(key)) {
                case 2:
                    vector2PropertyMap.set(key, createVector2(v4x(v4), v4y(v4)));
                    break;
                case 3:
                    vector3PropertyMap.set(key, createVector3(v4x(v4), v4y(v4), v4z(v4)));
                    break;
                case 4:
                    vector4PropertyMap.set(key, v4);
                    break;
                default:
                    console.error(`[createMarionetterAnimationClip] invalid vector4 length: ${v4.length}`);
                    break;
            }
        });

        // set vector2
        vector2PropertyMap.forEach((vector2, key) => {
            processActorPropertyBinder(actor, key, vector2, animationClip, timeInClip);
        });
        // set vector3
        vector3PropertyMap.forEach((vector3, key) => {
            processActorPropertyBinder(actor, key, vector3, animationClip, timeInClip);
        });
        // set vector4
        vector4PropertyMap.forEach((vector4, key) => {
            processActorPropertyBinder(actor, key, vector4, animationClip, timeInClip);
        });

        // set color
        colorPropertyMap.forEach((color, key) => {
            processActorPropertyBinder(actor, key, color, animationClip, timeInClip);
        });

        processActorPostProcessClip(actor, track, animationClip, timeInClip);
    };

    return animationClip;
}

/**
 *
 * @param lightControlClip
 */
function createMarionetterLightControlClip(
    track: MarionetterTimelineDefaultTrack,
    lightControlClipInfo: MarionetterLightControlClipInfo
): MarionetterLightControlClip {
    // let obj: Light | null;
    // const bind = (targetObj: Light) => {
    //     obj = targetObj;
    // };

    const name = lightControlClipInfo[MARIONETTER_ANIMATION_CLIP_NAME_INDEX];
    const [start, duration, postExtrapolation, speed] = destructureClipInfoBase(lightControlClipInfo);
    const bindings = lightControlClipInfo[MARIONETTER_ANIMATION_CLIP_BINDINGS_INDEX];

    const lightControlClip: MarionetterLightControlClip = {
        name,
        type: MARIONETTER_CLIP_TYPE_LIGHT_CONTROL_CLIP,
        clipInfo: lightControlClipInfo,
        // bind,
        execute: () => {},
    };

    lightControlClip.execute = (args: MarionetterClipArgs) => {
        const { actor, time } = args;
        const light = actor as Light;
        let hasPropertyColorR: boolean = false;
        let hasPropertyColorG: boolean = false;
        let hasPropertyColorB: boolean = false;
        let hasPropertyColorA: boolean = false;
        let hasPropertyLightIntensity: boolean = false;
        // let hasPropertyBounceIntensity: boolean = false;
        let hasPropertySpotLightRange: boolean = false;

        const color = createColor();
        let lightIntensity = 0;
        // let bounceIntensity = 0;
        // let range = 0;
        let spotLightRange = 0;

        // // const { start, bindings } = lightControlClip;
        // const start = lightControlClip[MARIONETTER_CLIP_INFO_BASE_PROPERTY_START];
        // const bindings = lightControlClip[MARIONETTER_LIGHT_CONTROL_CLIP_INFO_PROPERTY_BINDINGS];

        const timeInClip = resolveClipTime(time, start, duration, postExtrapolation, speed);

        // TODO: typeがあった方がよい. ex) animation clip, light control clip
        bindings.forEach((binding) => {
            // const propertyName = binding[MARIONETTER_CLIP_BINDING_PROPERTY_PROPERTY_NAME];
            // const keyframes = binding[MARIONETTER_CLIP_BINDING_PROPERTY_KEYFRAMES];
            const [propertyName, keyframes = [[]]] = binding;
            const value = curveUtilityEvaluateCurve(timeInClip, duration, keyframes, postExtrapolation);

            switch (propertyName) {
                case PROPERTY_COLOR_R:
                    hasPropertyColorR = true;
                    setColorR(color, value);
                    break;
                case PROPERTY_COLOR_G:
                    hasPropertyColorG = true;
                    setColorG(color, value);
                    break;
                case PROPERTY_COLOR_B:
                    hasPropertyColorB = true;
                    setColorB(color, value);
                    break;
                case PROPERTY_COLOR_A:
                    hasPropertyColorA = true;
                    setColorA(color, value);
                    break;
                case PROPERTY_LIGHT_INTENSITY:
                    hasPropertyLightIntensity = true;
                    lightIntensity = value;
                    break;
                case PROPERTY_SPOTLIGHT_RANGE:
                    hasPropertySpotLightRange = true;
                    spotLightRange = value;
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
            setColorR(light.color, getColorR(color));
        }
        if (hasPropertyColorG) {
            setColorG(light.color, getColorG(color));
        }
        if (hasPropertyColorB) {
            setColorB(light.color, getColorB(color));
        }
        if (hasPropertyColorA) {
            setColorA(light.color, getColorA(color));
        }
        if (hasPropertyLightIntensity) {
            light.intensity = lightIntensity;
        }
        if (hasPropertySpotLightRange) {
            (light as SpotLight).distance = spotLightRange;
        }
        // if(hasPropertyBounceIntensity) {
        //     obj.bounceIntensity = bounceIntensity;
        // }
        // for spot light
        // if(hasPropertyRange) {
        //     obj.range = range;
        // }

        processActorPostProcessClip(actor, track, lightControlClip, timeInClip);
    };

    return lightControlClip;
}

/**
 *
 * @param lightControlClip
 */
function createMarionetterActivationControlClip(
    track: MarionetterTimelineDefaultTrack,
    activationControlClipInfo: MarionetterActivationControlClipInfo
): MarionetterActivationControlClip {
    const name = activationControlClipInfo[MARIONETTER_ANIMATION_CLIP_NAME_INDEX];
    const [start, duration, postExtrapolation, speed] = destructureClipInfoBase(activationControlClipInfo);
    // const bindings = activationControlClipInfo[MARIONETTER_ANIMATION_CLIP_BINDINGS_INDEX];

    const activationControlClip: MarionetterActivationControlClip = {
        name,
        type: MARIONETTER_CLIP_TYPE_ACTIVATION_CONTROL_CLIP,
        clipInfo: activationControlClipInfo,
        execute: (args) => {
            const { actor, time } = args;
            const timeInClip = resolveClipTime(time, start, duration, postExtrapolation, speed);
            processActorPostProcessClip(actor, track, activationControlClip, timeInClip);
        },
    };

    return activationControlClip;
}

function createMarionetterObjectMoveAndLookAtClip(
    track: MarionetterTimelineDefaultTrack,
    objectMoveAndLookAtClipInfo: MarionetterObjectMoveAndLookAtClipInfo
): MarionetterObjectMoveAndLookAtClip {
    const name = objectMoveAndLookAtClipInfo[MARIONETTER_ANIMATION_CLIP_NAME_INDEX];
    const [start, duration, postExtrapolation, speed] = destructureClipInfoBase(objectMoveAndLookAtClipInfo);
    const bindings = objectMoveAndLookAtClipInfo[MARIONETTER_ANIMATION_CLIP_BINDINGS_INDEX];

    const objectMoveAndLookAtClip: MarionetterObjectMoveAndLookAtClip = {
        name,
        type: MARIONETTER_CLIP_TYPE_OBJECT_MOVE_AND_LOOK_AT_CLIP,
        clipInfo: objectMoveAndLookAtClipInfo,
        execute: (args: { actor: Actor; time: number; scene: Scene }) => {
            const { actor, time, scene } = args;

            const timeInClip = resolveClipTime(time, start, duration, postExtrapolation, speed);
            // let hasLocalPosition: boolean = false;
            // let hasLocalRotationEuler: boolean = false;
            // let hasLocalScale: boolean = false;
            // const localPosition: Vector3 = Vector3.zero;
            // const localRotationEulerDegree: Vector3 = Vector3.zero;
            // const localScale: Vector3 = Vector3.one;

            // const start = animationClip.s;
            // const bindings = animationClip.b;

            const localPosition: Vector3 = createVector3Zero();
            const upVector: Vector3 = createVector3(0, 1, 0);

            // const start = objectMoveAndLookAtClip[MARIONETTER_CLIP_INFO_BASE_PROPERTY_START];
            // const bindings = objectMoveAndLookAtClip[MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_BINDINGS];

            // TODO: typeがあった方がよい. ex) animation clip, light control clip
            bindings.forEach((binding) => {
                // const propertyName = binding[MARIONETTER_CLIP_BINDING_PROPERTY_PROPERTY_NAME];
                // const keyframes = binding[MARIONETTER_CLIP_BINDING_PROPERTY_KEYFRAMES];
                const [propertyName, keyframes = [[]]] = binding;
                const value = curveUtilityEvaluateCurve(timeInClip, duration, keyframes, postExtrapolation);

                switch (propertyName) {
                    case MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOCAL_POSITION_X:
                        setV3x(localPosition, value);
                        break;
                    case MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOCAL_POSITION_Y:
                        setV3y(localPosition, value);
                        break;
                    case MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOCAL_POSITION_Z:
                        setV3z(localPosition, value);
                        break;
                    case MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_UP_VECTOR_X:
                        setV3x(upVector, value);
                        break;
                    case MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_UP_VECTOR_Y:
                        setV3y(upVector, value);
                        break;
                    case MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_UP_VECTOR_Z:
                        setV3z(upVector, value);
                        break;
                    default:
                        // propertyが紐づいていない場合はエラーにする
                        console.error(
                            `[createMarionetterObjectMoveAndLookAtClip] invalid declared property: ${propertyName}`
                        );
                }
            });

            const component = getActorComponent<ObjectMoveAndLookAtController>(actor);
            if (component) {
                const [, behaviour] = component;
                behaviour?.execute({ actor, scene, localPosition, upVector });
            }
        },
    };

    return objectMoveAndLookAtClip;
}

// function createMarionetterHumanClip(humanClip: MarionetterHumanClipInfo): MarionetterHumanClip {
//     return {
//         type: MarionetterAnimationClipType.HumanClip,
//         clipInfo: humanClip,
//         execute: (args: { actor: Actor; time: number; scene: Scene }) => {
//             const { actor, time, scene } = args;
//
//             // let hasLocalPosition: boolean = false;
//             // let hasLocalRotationEuler: boolean = false;
//             // let hasLocalScale: boolean = false;
//             // const localPosition: Vector3 = Vector3.zero;
//             // const localRotationEulerDegree: Vector3 = Vector3.zero;
//             // const localScale: Vector3 = Vector3.one;
//
//             // const start = animationClip.s;
//             // const bindings = animationClip.b;
//
//             const leftShoulderRotationEulerDegree: Vector3 = createVector3Zero();
//
//             const start = humanClip[MARIONETTER_CLIP_INFO_BASE_PROPERTY_START];
//             const bindings = humanClip[MarionetterHumanClipInfoProperty.bindings];
//
//             // TODO: typeがあった方がよい. ex) animation clip, light control clip
//             bindings.forEach((binding) => {
//                 const propertyName = binding[MARIONETTER_CLIP_BINDING_PROPERTY_PROPERTY_NAME];
//                 const keyframes = binding[MARIONETTER_CLIP_BINDING_PROPERTY_KEYFRAMES];
//                 const value = curveUtilityEvaluateCurve(time - start, keyframes);
//
//                 switch (propertyName) {
//                     case MarionetterHumanClipInfoProperty.leftShoulderRotationX:
//                         setV3x(leftShoulderRotationEulerDegree, value);
//                         break;
//                     case MarionetterHumanClipInfoProperty.leftShoulderRotationY:
//                         setV3y(leftShoulderRotationEulerDegree, value);
//                         break;
//                     case MarionetterHumanClipInfoProperty.leftShoulderRotationZ:
//                         setV3z(leftShoulderRotationEulerDegree, value);
//                         break;
//                     default:
//                         // propertyが紐づいていない場合はエラーにする
//                         console.error(`[createMarionetterHumanClip] invalid declared property: ${propertyName}`);
//                 }
//             });
//
//             const component = getActorComponent<HumanController>(actor);
//             if (component) {
//                 const [, behaviour] = component;
//                 behaviour?.execute({ actor, scene, leftShoulderRotationEulerDegree });
//             }
//         },
//     };
// }

const isLoopClipPostExtrapolate = (clip: MarionetterClipKinds) => {
    return (
        clip.clipInfo[MARIONETTER_ANIMATION_CLIP_POST_EXTRAPORATION_INDEX] ===
        MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_LOOP
    );
};

const isHoldClipPostExtrapolate = (clip: MarionetterClipKinds) => {
    return (
        clip.clipInfo[MARIONETTER_ANIMATION_CLIP_POST_EXTRAPORATION_INDEX] ===
        MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_HOLD
    );
};

const resolveClipTime = (
    timelineTime: number,
    clipStartTime: number,
    clipDuration: number,
    postExtrapolationMode: MARIONETTER_CLIP_POST_EXTRAPORATION_MODE,
    speed: number = 1.0
) => {
    // Apply speed to clip time
    let timeInClip = (timelineTime - clipStartTime) * speed;

    // clip が time を越していた時
    if (timeInClip >= clipDuration) {
        if (postExtrapolationMode === MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_HOLD) {
            // 最後の状態で止める（hold clip）
            timeInClip = clipDuration - 0.001; // 絶妙にoffset
            // t = lastK[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME] - 0.001; // 絶妙にoffset
        } else if (postExtrapolationMode === MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_LOOP) {
            // クリップ内でループ
            timeInClip = timeInClip % clipDuration;
        } else {
            // デフォルト
            // 最後の状態で止める
            // 最後の状態で止める（hold clip）
            timeInClip = clipDuration - 0.001; // 絶妙にoffset
        }
    }

    return timeInClip;
};
