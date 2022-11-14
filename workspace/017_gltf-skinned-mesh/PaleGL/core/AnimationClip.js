import {AnimationClipTypes} from "../constants";
import {Vector3} from "../math/Vector3.js";

export class AnimationClip {
    target;
    key;
    interpolation;
    type; // animation clip type
    #data;
    start;
    end;
    frames;
    frameCount;
    elementSize; // TODO: typeを元に振り分けても良い気がする
    
    #currentTime;
    currentFrame;
    
    loop;
    isPlaying;

    speed = 1;
    
    // TODO: fpsをgltfから引っ張ってこれるかどうか
    fps = 30; // default
    
    onUpdate;
    
    get data() {
        return this.#data;
    }

    constructor({ target, key, interpolation, type, data, start, end, frames, frameCount, elementSize }) {
        this.target = target;
        this.key = key;
        this.interpolation = interpolation;
        this.type = type;
        this.#data = data;
        this.start = start;
        this.end = end;
        this.frames = frames;
        this.frameCount = frameCount;
        this.elementSize = elementSize;
    }
   
    // start at 0 frame
    play() {
        this.#currentTime = 0;
        this.isPlaying = true;
    }

    update(deltaTime) {
        if(!this.isPlaying) {
            return;
        }
        
        // spf ... [s / frame]
        const spf = 1 / this.fps;

        this.#currentTime += deltaTime * this.speed;
       
        // TODO: durationはendと常にイコールならendを参照する形でもよい
        const duration = spf * this.frameCount;
        
        if(this.#currentTime > duration) {
            if(!this.loop) {
                this.currentFrame = this.frameCount;
                this.#currentTime = duration; 
                return;
            }
            this.#currentTime %= duration;
        }

        this.currentFrame = Math.floor(this.#currentTime / spf);
        
        const rawFrameValue = (new Array(this.elementSize)).map((e, i) => this.data[this.currentFrame + i]);

        // build frame value each animation clip type
        // 関数に切り出してもいいかも
        let frameValue;
        switch(this.type) {
            case AnimationClipTypes.Vector3:
                frameValue = new Vector3(rawFrameValue[0], rawFrameValue[1], rawFrameValue[2]);
                break;
            // TODO: typeごとの処理
            default:
                throw "invalid animation clip type";
        }
        
        if(this.onUpdate) {
            this.onUpdate({
                currentTime: this.currentFrame,
                currentFrame: this.currentFrame,
                value: frameValue
            });
        } else {
            // TODO: あんまりやりたくないけど、onUpdateがない場合は直接データを入れる?
            // this.target[this.key] = frameValue;
        }
    }
}
