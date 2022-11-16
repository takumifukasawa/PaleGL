import {Vector3} from "../math/Vector3.js";
import {Rotator} from "../math/Rotator.js";

export class AnimationClip {
    name;
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
    
    onUpdateProxy;
    
    #keyframes = [];
    
    get keyframes() {
        return this.#keyframes;
    }
    
    get data() {
        return this.#data;
    }

    constructor({ name, start, end, frames, frameCount, keyframes }) {
        this.name = name;
        this.start = start;
        this.end = end;
        this.frames = frames;
        this.frameCount = frameCount;
        this.#keyframes = keyframes;
        // this.elementSize = elementSize;
       
        // TODO: add keyframes した時も計算するようにした方が便利そう 
        this.frameCount = Math.max(...(keyframes.map(({ frameCount }) => frameCount)));
    }
    
    // addAnimationKeyframes(animationKeyframe) {
    //     this.#keyframes.push(animationKeyframe);
    // }
   
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
       
        // 代理でupdateしたい場合 
        if(this.onUpdateProxy) {
            const keyframes = this.#keyframes.map(animationKeyframes => {
                // console.log(this.currentFrame, animationKeyframes.getFrameValue(this.currentFrame))
                return {
                    target: animationKeyframes.target,
                    key: animationKeyframes.key,
                    frameValue: animationKeyframes.getFrameValue(this.currentFrame)
                }
            });
            this.onUpdateProxy(keyframes);
        } else {
            this.#keyframes.forEach(animationKeyframes => {
                const frameValue = animationKeyframes.getFrameValue(this.currentFrame)
                switch (animationKeyframes.key) {
                    case "translation":
                        animationKeyframes.target.position = frameValue;
                        break;
                    case "rotation":
                        // TODO: rotationはquaternionなのでquaternionであるべき
                        const q = frameValue;
                        const euler = q.toEulerDegree();
                        // console.log(euler)
                        animationKeyframes.target.rotation = Rotator.fromRadian(
                            euler.x * Math.PI / 180,
                            euler.y * Math.PI / 180,
                            euler.z * Math.PI / 180,
                        );
                        break;
                    case "scale":
                        animationKeyframes.scale = frameValue;
                        break;
                    default:
                        throw "invalid animation keyframes key";
                }
            });
        }
    }
}
