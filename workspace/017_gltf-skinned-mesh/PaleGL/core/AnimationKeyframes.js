import {AnimationClipTypes} from "../constants.js";
import {Vector3} from "../math/Vector3.js";
import {Rotator} from "../math/Rotator.js";

export class AnimationKeyframes {
    target;
    key;
    interpolation;
    #data;
    elementSize;

    get data() {
        return this.#data;
    }

    constructor({ target, type, key, interpolation, data, start, end, frameCount, elementSize }) {
        this.target = target;
        this.key = key;
        this.interpolation = interpolation;
        this.type = type;
        this.#data = data;
        this.start = start;
        this.end = end;
        this.frameCouns = frameCount;
        this.elementSize = elementSize;
    }
    
    getFrameValue(frame) {
        return (new Array(this.elementSize)).fill(0).map((e, i) => {
            return this.#data[frame * this.elementSize + i];
        });
    }
}
