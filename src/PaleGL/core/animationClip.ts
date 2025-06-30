import { createRotatorFromMatrix4 } from '@/PaleGL/math/rotator.ts';
import { AnimationKeyframes, getAnimationKeyframeValue } from '@/PaleGL/core/animationKeyframes.ts';
import { Vector3 } from '@/PaleGL/math/vector3.ts';
import { createMatrix4FromQuaternion, Quaternion } from '@/PaleGL/math/quaternion.ts';
import { Bone } from '@/PaleGL/core/bone.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';
import { setRotation, setScaling, setTranslation } from '@/PaleGL/core/transform.ts';

export type AnimationClip = {
    name: string;
    keyframes: AnimationKeyframes[];
    frameCount: number;
    currentTime: number;
    currentFrame: number;
    loop: boolean;
    isPlaying: boolean;
    speed: number;
    fps: number;
};

export function createAnimationClip(
    name: string,
    keyframes: AnimationKeyframes[]
) {
    const frameCount: number = Math.max(...keyframes.map((keyframe) => keyframe.frameCount));
    const currentTime: number = 0;
    const currentFrame: number = 0;
    const loop: boolean = false;
    const isPlaying: boolean = false;
    const speed: number = 1;
    const fps: number = 30; // default

    return {
        name,
        keyframes,
        frameCount,
        currentTime,
        currentFrame,
        loop,
        isPlaying,
        speed,
        fps,
    };
}

// start at 0 frame
export function playAnimationClip(animationClip: AnimationClip) {
    animationClip.currentTime = 0;
    animationClip.isPlaying = true;
}

export function updateAnimationClip(animationClip: AnimationClip, deltaTime: number) {
    if (!animationClip.isPlaying) {
        return;
    }

    // spf ... [s / frame]
    const spf = 1 / animationClip.fps;

    animationClip.currentTime += deltaTime * animationClip.speed;

    // TODO: durationはendと常にイコールならendを参照する形でもよい
    const duration = spf * animationClip.frameCount;

    if (animationClip.currentTime > duration) {
        if (!animationClip.loop) {
            animationClip.currentFrame = animationClip.frameCount;
            animationClip.currentTime = duration;
            return;
        }
        animationClip.currentTime %= duration;
    }

    animationClip.currentFrame = Math.floor(animationClip.currentTime / spf);

    // // 代理でupdateしたい場合
    // if (_onUpdateProxy !== null) {
    //     const keyframes = _keyframes.map((animationKeyframes) => {
    //         // console.log(_currentFrame, animationKeyframes.getFrameValue(_currentFrame))
    //         return {
    //             target: animationKeyframes.getTarget(),
    //             key: animationKeyframes.key,
    //             frameValue: animationKeyframes.getFrameValue(_currentFrame),
    //         };
    //     });
    //     _onUpdateProxy(keyframes);
    // } else {
    animationClip.keyframes.forEach((animationKeyframes) => {
        // console.log("-------")
        const frameValue = getAnimationKeyframeValue(animationKeyframes, animationClip.currentFrame);
        switch (animationKeyframes.key) {
            case 'translation':
                const p = frameValue as Vector3;
                if ((animationKeyframes.target as Actor).transform) {
                    setTranslation((animationKeyframes.target as Actor).transform, p);
                } else {
                    (animationKeyframes.target as Bone).position = p;
                }
                break;
            case 'rotation':
                // TODO: quaternion-bug: 本当はこっちを使いたい
                // const q = frameValue as Quaternion;
                // const r = Rotator.fromQuaternion(q);

                const q = frameValue as Quaternion;
                const r = createRotatorFromMatrix4(createMatrix4FromQuaternion(q));

                // for debug
                // console.log("[AnimationClip.update] rotation", _currentFrame, frameValue.elements, r.getAxes());
                if ((animationKeyframes.target as Actor).transform) {
                    setRotation((animationKeyframes.target as Actor).transform, r);
                } else {
                    (animationKeyframes.target as Bone).rotation = r;
                }
                break;
            case 'scale':
                const s = frameValue as Vector3;
                if ((animationKeyframes.target as Actor).transform) {
                    setScaling((animationKeyframes.target as Actor).transform, s);
                } else {
                    (animationKeyframes.target as Bone).scale = s;
                }
                break;
            default:
                console.error('invalid animation keyframes key');
        }
    });
    // }
}

export function getAllKeyframesValue(animationClip: AnimationClip) {
    return new Array(animationClip.frameCount).fill(0).map((_, i) => {
        const keyframes = animationClip.keyframes.map((animationKeyframes) => {
            return {
                target: animationKeyframes.target,
                key: animationKeyframes.key,
                frameValue: getAnimationKeyframeValue(animationKeyframes, i),
            };
        });
        return keyframes;
    });
}
