export class AnimationClip {
    target;
    key;
    interpolation;
    // type;
    #data;
    start;
    end;
    frames;
    frameCount;
    elementsNum;
    
    #startTime;
    currentFrame;
    
    isPlaying;
    
    // TODO: fpsをgltfから引っ張ってこれるかどうか
    fps = 30; // default
    
    get data() {
        return this.#data;
    }

    constructor({ target, key, interpolation, /*type,*/ data, start, end, frames, frameCount, elementsNum }) {
        this.target = target;
        this.key = key;
        this.interpolation = interpolation;
        // this.type = type; // VEC3
        this.#data = data;
        this.start = start;
        this.end = end;
        this.frames = frames;
        this.frameCount = frameCount;
        this.elementsNum = elementsNum;
    }
   
    // start at 0 frame
    play(startTime) {
        this.#startTime = startTime;
        this.currentTime = 0;
        this.isPlaying = true;
        console.log(this.target);
    }

    update(currentTime) {
        if(!this.isPlaying) {
            return;
        }
        
        // spf ... [s / frame]
        const spf = 1 / this.fps;

        const elapsedTime = currentTime - this.#startTime;
        this.currentFrame = Math.floor(elapsedTime / spf);
        
        // console.log(this.target[this.key], this.data[]);
    }
}
