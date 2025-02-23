import { AnimationClip } from '@/PaleGL/core/AnimationClip';

export type Animator = ReturnType<typeof createAnimator>;

export function createAnimator(animationClips: AnimationClip[] = []) {
    let _animationClips: AnimationClip[] = animationClips;
    let _playingAnimationClip: AnimationClip | null = null;

    const getAnimationClips = () => _animationClips;

    const setAnimationClips = (animationClips: AnimationClip[]) => {
        _animationClips = animationClips;
    }

    const play = (name: string, loop: boolean = false) => {
        const animationClip = _animationClips.find((animationClip) => name === animationClip.name);
        if (!animationClip) {
            return;
        }
        animationClip.play();
        animationClip.loop = loop;
        _playingAnimationClip = animationClip;
    }

    // 呼ぶ側によってはdeltaTimeでもfixedDeltaTimeでもOK
    const update = (deltaTime: number) => {
        if (!_playingAnimationClip) {
            return;
        }
        _playingAnimationClip.loop = true;
        _playingAnimationClip.update(deltaTime);
    }
    
    return {
        getAnimationClips,
        setAnimationClips,
        play,
        update,
    }
}
