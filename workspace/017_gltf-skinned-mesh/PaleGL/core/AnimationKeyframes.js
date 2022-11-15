import {AnimationClipTypes} from "../constants.js";
import {Vector3} from "../math/Vector3.js";
import {Rotator} from "../math/Rotator.js";

export class AnimationKeyframes {
    target;
    key;
    interpolation;
    #data;
    size;

    get data() {
        return this.#data;
    }

    constructor({ target, key, interpolation, data }) {
        this.target = target;
        this.key = key;
        this.interpolation = interpolation;
        this.type = type;
        this.#data = data;
    }
    
    getFrameValue(frame) {
        return (new Array(this.size)).fill(0).map((e, i) => {
            return this.#data[frame * this.size + i];
        });
    }
}
