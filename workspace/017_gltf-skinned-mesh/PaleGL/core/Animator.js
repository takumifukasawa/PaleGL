
export class Animator {
    #animationClips;
    
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
    }
   
    // 呼ぶ側によってはdeltaTimeでもfixedDeltaTimeでもOK
    update(deltaTime) {
        this.#animationClips.forEach(animationClip => {
            animationClip.update(deltaTime);
        });
    }
}