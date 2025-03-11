import { AnimationKeyframeType, AnimationKeyframeTypes } from '@/PaleGL/constants';
import { Vector3 } from '@/PaleGL/math/Vector3';
import {createQuaternion, Quaternion} from '@/PaleGL/math/quaternion.ts';
import {
    GLTFAnimationChannelTargetPath,
    GLTFAnimationSamplerInterpolation,
    // GLTFAnimationKeyframeType,
    GLTFNodeActorKind,
} from '@/PaleGL/loaders/loadGLTF';
import { maton } from '@/PaleGL/utilities/maton.ts';

export type AnimationKeyframeValue = Vector3 | Quaternion;

// export class AnimationKeyframes {
//     target: GLTFNodeActorKind;
//     key;
//     interpolation: GLTFAnimationSamplerInterpolation;
//     private _data: Float32Array;
//     private elementSize: number = -1;
//     frameCount: number;
//     type: AnimationKeyframeType;
//     start: number;
//     end: number;
//     frames: Float32Array;
// 
//     get data() {
//         return _data;
//     }
// 
//     constructor({
//         target,
//         type,
//         key,
//         interpolation,
//         data,
//         start,
//         end,
//         frameCount,
//         frames,
//     }: {
//         target: GLTFNodeActorKind;
//         type: AnimationKeyframeType;
//         key: GLTFAnimationChannelTargetPath;
//         interpolation: GLTFAnimationSamplerInterpolation;
//         data: Float32Array;
//         start: number;
//         end: number;
//         frameCount: number;
//         frames: Float32Array;
//     }) {
//         this.target = target;
//         this.key = key;
//         _interpolation = interpolation;
//         _type = type;
//         _data = data;
//         this.start = start;
//         this.end = end;
//         this.frameCount = frameCount;
//         this.frames = frames;
// 
//         switch (_type) {
//             case AnimationKeyframeTypes.Vector3:
//                 _elementSize = 3;
//                 break;
//             case AnimationKeyframeTypes.Quaternion:
//                 _elementSize = 4;
//                 break;
//             default:
//                 console.error(`[AnimationKeyframes.getFrameValue] invalid type: ${type}`);
//         }
//     }
// 
//     /**
//      *
//      * @param frame
//      */
//     getFrameValue(frame: number): AnimationKeyframeValue {
//         const arr = maton(
//             new Array(_elementSize).fill(0).map((_, i) => {
//                 switch (_interpolation) {
//                     case GLTFAnimationSamplerInterpolation.LINEAR:
//                         return _data[frame * _elementSize + i];
//                     case GLTFAnimationSamplerInterpolation.STEP:
//                         // TODO: Stepの場合って0frameだけ見て問題ない？
//                         return _data[i];
//                     default:
//                         console.error('invalid interp');
//                 }
//             })
//         )
//             .compact()
//             .value();
// 
//         // for debug
//         // console.log("data", _interpolation, _data, arr)
//         // console.log("data", frame, _interpolation, arr)
// 
//         switch (_type) {
//             case AnimationKeyframeTypes.Vector3:
//                 // return new Vector3(...arr);
//                 return new Vector3(arr[0], arr[1], arr[2]);
//             case AnimationKeyframeTypes.Quaternion:
//                 // return new Quaternion(...arr);
//                 return new Quaternion(arr[0], arr[1], arr[2], arr[3]);
//             default:
//                 console.error('[AnimationKeyframes.getFrameValue] invalid type');
//                 // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//                 // @ts-ignore
//                 return null;
//         }
//     }
// }

export type AnimationKeyframes = ReturnType<typeof createAnimationKeyframes>;

export function createAnimationKeyframes({
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
    const _target: GLTFNodeActorKind = target;
    const _key = key;
    const _interpolation: GLTFAnimationSamplerInterpolation = interpolation;
    const _data: Float32Array = data;
    let _elementSize: number = -1;
    const _frameCount: number= frameCount;
    const _type: AnimationKeyframeType = type;
    const _start: number = start;
    const _end: number = end;
    const _frames: Float32Array = frames;

    switch (_type) {
        case AnimationKeyframeTypes.Vector3:
            _elementSize = 3;
            break;
        case AnimationKeyframeTypes.Quaternion:
            _elementSize = 4;
            break;
        default:
            console.error(`[AnimationKeyframes.getFrameValue] invalid type: ${type}`);
    }
    const getFrameValue = (frame: number): AnimationKeyframeValue => {
        const arr = maton(
            new Array(_elementSize).fill(0).map((_, i) => {
                switch (_interpolation) {
                    case GLTFAnimationSamplerInterpolation.LINEAR:
                        return _data[frame * _elementSize + i];
                    case GLTFAnimationSamplerInterpolation.STEP:
                        // TODO: Stepの場合って0frameだけ見て問題ない？
                        return _data[i];
                    default:
                        console.error('invalid interp');
                }
            })
        )
            .compact()
            .value();

        // for debug
        // console.log("data", _interpolation, _data, arr)
        // console.log("data", frame, _interpolation, arr)

        switch (_type) {
            case AnimationKeyframeTypes.Vector3:
                // return new Vector3(...arr);
                return new Vector3(arr[0], arr[1], arr[2]);
            case AnimationKeyframeTypes.Quaternion:
                // return new Quaternion(...arr);
                return createQuaternion(arr[0], arr[1], arr[2], arr[3]);
            default:
                console.error('[AnimationKeyframes.getFrameValue] invalid type');
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                return null;
        }
    }
    
    return {
        // getter, setter
        getTarget: () => _target,
        getKey: () => _key,
        getData: () => _data,
        getStart: () => _start,
        getEnd: () => _end,
        getFrameCount: () => _frameCount,
        getFrames: () => _frames,
        // methods
        getFrameValue,
    }
}
