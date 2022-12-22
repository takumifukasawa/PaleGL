import {AnimationKeyframeTypes} from "../constants.js";
import {Vector3} from "../math/Vector3.js";
import {Quaternion} from "../math/Quaternion.js";

export class AnimationKeyframes {
    target;
    key;
    interpolation;
    #data;
    #elementSize;
    frameCount

    get data() {
        return this.#data;
    }

    constructor({ target, type, key, interpolation, data, start, end, frameCount }) {
        this.target = target;
        this.key = key;
        this.interpolation = interpolation;
        this.type = type;
        this.#data = data;
        this.start = start;
        this.end = end;
        this.frameCount = frameCount;

        switch(this.type) {
            case AnimationKeyframeTypes.Vector3:
                this.#elementSize = 3;
                break;
            case AnimationKeyframeTypes.Quaternion:
                this.#elementSize = 4;
                break;
            default:
                throw "[AnimationKeyframes.getFrameValue] invalid type";
        }       
    }

    getFrameValue(frame) {
        const arr = (new Array(this.#elementSize)).fill(0).map((e, i) => this.#data[frame * this.#elementSize + i]);

        switch(this.type) {
            case AnimationKeyframeTypes.Vector3:
                return new Vector3(...arr);
            case AnimationKeyframeTypes.Quaternion:
                return new Quaternion(...arr);
            default:
                throw "[AnimationKeyframes.getFrameValue] invalid type";
        }
    }
}
