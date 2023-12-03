import { AnimationClip } from '@/PaleGL/core/AnimationClip';

export class Animator {
    private _animationClips: AnimationClip[];
    private playingAnimationClip: AnimationClip | null = null;

    get animationClips() {
        return this._animationClips;
    }

    constructor(animationClips: AnimationClip[] = []) {
        this._animationClips = animationClips;
    }

    setAnimationClips(animationClips: AnimationClip[]) {
        this._animationClips = animationClips;
    }

    play(name: string, loop: boolean = false) {
        const animationClip = this._animationClips.find((animationClip) => name === animationClip.name);
        if (!animationClip) {
            return;
        }
        animationClip.play();
        animationClip.loop = loop;
        this.playingAnimationClip = animationClip;
    }

    // 呼ぶ側によってはdeltaTimeでもfixedDeltaTimeでもOK
    update(deltaTime: number) {
        if (!this.playingAnimationClip) {
            return;
        }
        this.playingAnimationClip.loop = true;
        this.playingAnimationClip.update(deltaTime);
    }
}
