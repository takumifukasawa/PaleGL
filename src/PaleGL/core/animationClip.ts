import { Rotator } from '@/PaleGL/math/Rotator';
import { AnimationKeyframes } from '@/PaleGL/core/animationKeyframes.ts';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Quaternion } from '@/PaleGL/math/Quaternion';
// import { GLTFAnimationChannelTargetPath, GLTFNodeActorKind } from '@/PaleGL/loaders/loadGLTF';
import { Bone } from '@/PaleGL/core/bone.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';
import { setRotation, setScaling, setTranslation } from '@/PaleGL/core/transform.ts';

// type UpdateProxyKeyframe = {
//     target: GLTFNodeActorKind;
//     key: GLTFAnimationChannelTargetPath;
//     frameValue: Vector3 | Quaternion;
// };

export type AnimationClip = ReturnType<typeof createAnimationClip>;

export function createAnimationClip({
    name,
    keyframes,
}: {
    name: string;
    // start?: number,
    // end?: number,
    // frames: number,
    // frameCount?: number,
    keyframes: AnimationKeyframes[];
}) {
    const _name: string = name;
    const _keyframes: AnimationKeyframes[] = keyframes;
    const _frameCount: number = Math.max(...keyframes.map((keyframe) => keyframe.getFrameCount()));
    let _currentTime: number = 0;
    let _currentFrame: number = 0;
    let _loop: boolean = false;
    let _isPlaying: boolean = false;
    const _speed: number = 1;
    const _fps: number = 30; // default
    // const _onUpdateProxy: ((keyframe: UpdateProxyKeyframe[]) => void) | null = null;

    // start at 0 frame
    const play = () => {
        _currentTime = 0;
        _isPlaying = true;
    };

    const update = (deltaTime: number) => {
        if (!_isPlaying) {
            return;
        }

        // spf ... [s / frame]
        const spf = 1 / _fps;

        _currentTime += deltaTime * _speed;

        // TODO: durationはendと常にイコールならendを参照する形でもよい
        const duration = spf * _frameCount;

        if (_currentTime > duration) {
            if (!_loop) {
                _currentFrame = _frameCount;
                _currentTime = duration;
                return;
            }
            _currentTime %= duration;
        }

        _currentFrame = Math.floor(_currentTime / spf);

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
        _keyframes.forEach((animationKeyframes) => {
            // console.log("-------")
            const frameValue = animationKeyframes.getFrameValue(_currentFrame);
            switch (animationKeyframes.getKey()) {
                case 'translation':
                    const p = frameValue as Vector3;
                    if ((animationKeyframes.getTarget() as Actor).transform) {
                        setTranslation((animationKeyframes.getTarget() as Actor).transform, p);
                    } else {
                        (animationKeyframes.getTarget() as Bone).setPosition(p);
                    }
                    break;
                case 'rotation':
                    // TODO: quaternion-bug: 本当はこっちを使いたい
                    // const q = frameValue as Quaternion;
                    // const r = Rotator.fromQuaternion(q);

                    const q = frameValue as Quaternion;
                    const r = Rotator.fromMatrix4(q.toMatrix4());

                    // for debug
                    // console.log("[AnimationClip.update] rotation", _currentFrame, frameValue.elements, r.getAxes());
                    if ((animationKeyframes.getTarget() as Actor).transform) {
                        setRotation((animationKeyframes.getTarget() as Actor).transform, r);
                    } else {
                        (animationKeyframes.getTarget() as Bone).setRotation(r);
                    }
                    break;
                case 'scale':
                    const s = frameValue as Vector3;
                    if ((animationKeyframes.getTarget() as Actor).transform) {
                        setScaling((animationKeyframes.getTarget() as Actor).transform, s);
                    } else {
                        (animationKeyframes.getTarget() as Bone).setScale(s);
                    }
                    break;
                default:
                    console.error('invalid animation keyframes key');
            }
        });
        // }
    };

    const getAllKeyframesValue = () => {
        return new Array(_frameCount).fill(0).map((_, i) => {
            const keyframes = _keyframes.map((animationKeyframes) => {
                return {
                    target: animationKeyframes.getTarget(),
                    key: animationKeyframes.getKey(),
                    frameValue: animationKeyframes.getFrameValue(i),
                };
            });
            return keyframes;
        });
    };

    return {
        // setter, getter
        getName: () => _name,
        getFrameCount: () => _frameCount,
        setLoop: (loop: boolean) => (_loop = loop),
        // methods
        play,
        update,
        getAllKeyframesValue,
    };
}
