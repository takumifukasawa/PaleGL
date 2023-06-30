import {AnimationClip} from "./AnimationClip";

export class Animator {
    private _animationClips;
    private playingAnimationClip;
    
    get animationClips() {
        return this._animationClips;
    }
    
    constructor(animationClips: AnimationClip[] = []) {
        this._animationClips = animationClips;
    }
    
    setAnimationClips(animationClips) {
        this._animationClips = animationClips;
    }
    
    play(name) {
        const animationClip = this._animationClips.find(animationClip => name === animationClip.name);
        if(!animationClip) {
            return;
        }
        animationClip.play();
        this.playingAnimationClip = animationClip;
    }
   
    // 呼ぶ側によってはdeltaTimeでもfixedDeltaTimeでもOK
    update(deltaTime) {
        if(!this.playingAnimationClip) {
            return;
        }
        this.playingAnimationClip.update(deltaTime);
    }
}
