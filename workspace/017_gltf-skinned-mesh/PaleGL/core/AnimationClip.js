﻿import {AnimationClipTypes} from "../constants.js";
import {Vector3} from "../math/Vector3.js";
import {Rotator} from "../math/Rotator.js";

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
    // elementSize; // TODO: typeを元に振り分けても良い気がする
    
    #currentTime;
    currentFrame;
    
    loop;
    isPlaying;

    speed = 1;
    
    // TODO: fpsをgltfから引っ張ってこれるかどうか
    fps = 30; // default
    
    onUpdate;
    
    #keyframes = [];
    
    get data() {
        return this.#data;
    }

    constructor({ name, start, end, frames, frameCount }) {
        this.name = name;
        this.start = start;
        this.end = end;
        this.frames = frames;
        this.frameCount = frameCount;
        // this.elementSize = elementSize;
    }
    
    addAnimationKeyframes(animationKeyframe) {
        this.#keyframes.push(animationKeyframe);
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
        
        // // build frame value each animation clip type
        // // TODO:
        // // - 関数に切り出してもいいかも
        // // - 必ず生の値を渡すでもいいかもしれない
        // let frameValue;
        // switch(this.type) {
        //     case AnimationClipTypes.Vector3:
        //         frameValue = new Vector3(rawFrameValue[0], rawFrameValue[1], rawFrameValue[2]);
        //         break;
        //     case AnimationClipTypes.Rotator:
        //         // TODO: raw frame value は quaternion ?
        //         frameValue = Rotator.fromRadian(rawFrameValue[0], rawFrameValue[1], rawFrameValue[2]);
        //         break;
        //     // TODO: typeごとの処理
        //     default:
        //         throw "invalid animation clip type";
        // }
        
        if(this.onUpdate) {
            // this.onUpdate(frameValue);
            // TODO: rawframevalueだけ送っちゃうのがわかりやすい気もしてきた
            const keyframes = this.#keyframes.map(animationKeyframes => {
                // console.log(this.currentFrame, animationKeyframes.getFrameValue(this.currentFrame))
                return {
                    target: animationKeyframes.target,
                    key: animationKeyframes.key,
                    value: animationKeyframes.getFrameValue(this.currentFrame)
                }
            });
            this.onUpdate(keyframes);
        // } else {
        //     // TODO: あんまりやりたくないけど、onUpdateがない場合は直接データを入れる?
        //     // this.target[this.key] = frameValue;
        }
    }
}
