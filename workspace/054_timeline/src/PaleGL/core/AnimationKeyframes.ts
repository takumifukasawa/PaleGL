import { AnimationKeyframeType, AnimationKeyframeTypes } from '@/PaleGL/constants';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Quaternion } from '@/PaleGL/math/Quaternion';
import {
    GLTFAnimationChannelTargetPath, GLTFAnimationSamplerInterpolation,
    // GLTFAnimationKeyframeType,
    GLTFNodeActorKind,
} from '@/PaleGL/loaders/loadGLTF';
import {maton} from "@/PaleGL/utilities/maton.ts";

export type AnimationKeyframeValue = Vector3 | Quaternion;

export class AnimationKeyframes {
    target: GLTFNodeActorKind;
    key;
    interpolation: GLTFAnimationSamplerInterpolation;
    private _data: Float32Array;
    private elementSize: number = -1;
    frameCount: number;
    type: AnimationKeyframeType;
    start: number;
    end: number;
    frames: Float32Array;

    get data() {
        return this._data;
    }

    constructor({
        target,
        type,
        key,
        interpolation,
        data,
        start,
        end,
        frameCount,
        frames,
    }: {
        target: GLTFNodeActorKind;
        type: AnimationKeyframeType;
        key: GLTFAnimationChannelTargetPath;
        interpolation: GLTFAnimationSamplerInterpolation;
        data: Float32Array;
        start: number;
        end: number;
        frameCount: number;
        frames: Float32Array;
    }) {
        this.target = target;
        this.key = key;
        this.interpolation = interpolation;
        this.type = type;
        this._data = data;
        this.start = start;
        this.end = end;
        this.frameCount = frameCount;
        this.frames = frames;

        switch (this.type) {
            case AnimationKeyframeTypes.Vector3:
                this.elementSize = 3;
                break;
            case AnimationKeyframeTypes.Quaternion:
                this.elementSize = 4;
                break;
            default:
                console.error(`[AnimationKeyframes.getFrameValue] invalid type: ${type}`);
        }
    }

    /**
     * 
     * @param frame
     */
    getFrameValue(frame: number): AnimationKeyframeValue {
        const arr = maton(new Array(this.elementSize).fill(0).map((_, i) => {
            switch (this.interpolation) {
                case GLTFAnimationSamplerInterpolation.LINEAR:
                    return this._data[frame * this.elementSize + i];
                case GLTFAnimationSamplerInterpolation.STEP:
                    // TODO: Stepの場合って0frameだけ見て問題ない？
                    return this._data[i];
                default:
                    console.error('invalid interp');
            }
        })).compact().value();

        // for debug
        // console.log("data", this.interpolation, this._data, arr)
        // console.log("data", frame, this.interpolation, arr)
        
        switch (this.type) {
            case AnimationKeyframeTypes.Vector3:
                // return new Vector3(...arr);
                return new Vector3(arr[0], arr[1], arr[2]);
            case AnimationKeyframeTypes.Quaternion:
                // return new Quaternion(...arr);
                return new Quaternion(arr[0], arr[1], arr[2], arr[3]);
            default:
                console.error('[AnimationKeyframes.getFrameValue] invalid type');
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                return null;
        }
    }
}
