
export class Animator {
    #animationClips;
    #playingAnimationClip;
    
    get animationClips() {
        return this.#animationClips;
    }
    
    constructor(animationClips) {
        this.#animationClips = animationClips || [];
    }
    
    setAnimationClips(animationClips) {
        this.#animationClips = animationClips;
    }
    
    play(name) {
        const animationClip = this.#animationClips.find(animationClip => name === animationClip.name);
        if(!animationClip) {
            return;
        }
        animationClip.play();
        this.#playingAnimationClip = animationClip;
    }
   
    // 呼ぶ側によってはdeltaTimeでもfixedDeltaTimeでもOK
    update(deltaTime) {
        if(!this.#playingAnimationClip) {
            return;
        }
        this.#playingAnimationClip.update(deltaTime);
    }
}