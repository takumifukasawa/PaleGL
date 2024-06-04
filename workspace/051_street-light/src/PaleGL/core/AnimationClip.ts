import { Rotator } from '@/PaleGL/math/Rotator';
import { AnimationKeyframes } from '@/PaleGL/core/AnimationKeyframes';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Quaternion } from '@/PaleGL/math/Quaternion';
import { GLTFAnimationChannelTargetPath, GLTFNodeActorKind } from '@/PaleGL/loaders/loadGLTF';
import { Bone } from '@/PaleGL/core/Bone';
import { Actor } from '@/PaleGL/actors/Actor';

// import {GLTFAnimationSamplerInterpolation} from "@/PaleGL/loaders/loadGLTF";

type UpdateProxyKeyframe = {
    target: GLTFNodeActorKind;
    key: GLTFAnimationChannelTargetPath;
    frameValue: Vector3 | Quaternion;
};

export class AnimationClip {
    name: string;
    // target;
    // key;
    // interpolation: GLTFAnimationSamplerInterpolation;
    // type; // animation clip type
    // private data;
    // start: number;
    // end: number;
    // frames: number;
    frameCount: number;
    // elementSize; // TODO: typeを元に振り分けても良い気がする

    private currentTime: number = 0;
    currentFrame: number = 0;

    loop: boolean = false;
    isPlaying: boolean = false;

    speed: number = 1;

    // TODO: fpsをgltfから引っ張ってこれるかどうか
    fps: number = 30; // default

    onUpdateProxy: ((keyframe: UpdateProxyKeyframe[]) => void) | null = null;

    private _keyframes: AnimationKeyframes[] = [];

    get keyframes() {
        return this._keyframes;
    }

    // get data() {
    //     return this.data;
    // }

    // constructor({name, start, end, frames, frameCount, keyframes}: {
    constructor({
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
        this.name = name;
        // this.start = start;
        // this.end = end;
        // this.frameCount = frameCount;
        this._keyframes = keyframes;

        // TODO: add keyframes した時も計算するようにした方が便利そう
        this.frameCount = Math.max(...keyframes.map(({ frameCount }) => frameCount));
    }

    // addAnimationKeyframes(animationKeyframe) {
    //     this._keyframes.push(animationKeyframe);
    // }

    // start at 0 frame
    play() {
        this.currentTime = 0;
        this.isPlaying = true;
    }

    update(deltaTime: number) {
        if (!this.isPlaying) {
            return;
        }

        // spf ... [s / frame]
        const spf = 1 / this.fps;

        this.currentTime += deltaTime * this.speed;

        // TODO: durationはendと常にイコールならendを参照する形でもよい
        const duration = spf * this.frameCount;

        if (this.currentTime > duration) {
            if (!this.loop) {
                this.currentFrame = this.frameCount;
                this.currentTime = duration;
                return;
            }
            this.currentTime %= duration;
        }

        this.currentFrame = Math.floor(this.currentTime / spf);

        // 代理でupdateしたい場合
        if (this.onUpdateProxy) {
            const keyframes = this._keyframes.map((animationKeyframes) => {
                // console.log(this.currentFrame, animationKeyframes.getFrameValue(this.currentFrame))
                return {
                    target: animationKeyframes.target,
                    key: animationKeyframes.key,
                    frameValue: animationKeyframes.getFrameValue(this.currentFrame),
                };
            });
            this.onUpdateProxy(keyframes);
        } else {
            this._keyframes.forEach((animationKeyframes) => {
                // console.log("-------")
                const frameValue = animationKeyframes.getFrameValue(this.currentFrame);
                switch (animationKeyframes.key) {
                    case 'translation':
                        const p = frameValue as Vector3;
                        if ((animationKeyframes.target as Actor).transform) {
                            (animationKeyframes.target as Actor).transform.position = p;
                        } else {
                            (animationKeyframes.target as Bone).position = p;
                        }
                        break;
                    case 'rotation':
                       
                        // TODO: quaternion-bug: 本当はこっちを使いたい
                        // const q = frameValue as Quaternion;
                        // const r = Rotator.fromQuaternion(q);

                        const q = frameValue as Quaternion;
                        const r = Rotator.fromMatrix4(q.toMatrix4());
                        
                        // for debug
                        // console.log("[AnimationClip.update] rotation", this.currentFrame, frameValue.elements, r.getAxes());
                        if ((animationKeyframes.target as Actor).transform) {
                            (animationKeyframes.target as Actor).transform.rotation = r;
                        } else {
                            (animationKeyframes.target as Bone).rotation = r;
                        }
                        break;
                    case 'scale':
                        const s = frameValue as Vector3;
                        if ((animationKeyframes.target as Actor).transform) {
                            (animationKeyframes.target as Actor).transform.scale = s;
                        } else {
                            (animationKeyframes.target as Bone).scale = s;
                        }
                        break;
                    default:
                        throw 'invalid animation keyframes key';
                }
            });
        }
    }

    getAllKeyframesValue() {
        return new Array(this.frameCount).fill(0).map((_, i) => {
            const keyframes = this._keyframes.map((animationKeyframes) => {
                return {
                    target: animationKeyframes.target,
                    key: animationKeyframes.key,
                    frameValue: animationKeyframes.getFrameValue(i),
                };
            });
            return keyframes;
        });
    }
}
