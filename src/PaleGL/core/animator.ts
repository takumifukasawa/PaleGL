import {AnimationClip, playAnimationClip, updateAnimationClip} from '@/PaleGL/core/animationClip.ts';

export type Animator = {
    animationClips: AnimationClip[]
    playingAnimationClip: AnimationClip | null
};

export function createAnimator(animationClips: AnimationClip[] = []) {
    const playingAnimationClip: AnimationClip | null = null;
    return {
        animationClips,
        playingAnimationClip
    };
}


export const getAnimatorAnimationClips = (animator: Animator) => animator.animationClips;

export function setAnimatorAnimationClips (animator: Animator, animationClips: AnimationClip[]) {
    animator.animationClips = animationClips;
};

export function playAnimatorAnimationClip (animator: Animator, name: string, loop: boolean = false) {
    const animationClip = animator.animationClips.find((animationClip) => name === animationClip.name);
    if (!animationClip) {
        return;
    }
    playAnimationClip(animationClip);
    animationClip.loop = loop;
    animator.playingAnimationClip = animationClip;
};

// 呼ぶ側によってはdeltaTimeでもfixedDeltaTimeでもOK
export function updateAnimator (animator: Animator, deltaTime: number) {
    if (!animator.playingAnimationClip) {
        return;
    }
    animator.playingAnimationClip.loop = true;
    updateAnimationClip(animator.playingAnimationClip, deltaTime);
};
