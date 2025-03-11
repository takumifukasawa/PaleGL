import { createGLSLSound, GlslSound } from '@/PaleGL/core/glslSound.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';

export function initGLSLSound(gpu: Gpu, shader: string, duration: number) {
    let glslSound: GlslSound | null = null;
    let _isPlaying = false;

    const load = () => {
        glslSound = createGLSLSound(gpu, shader, duration);
    };

    // const warmup = () => {
    //     glslSound?.setVolume(0);
    //     glslSound?.play(0);
    // };

    const play = ({ volume = 1, time = 0, reload = false }: { volume?: number; time?: number, reload?: boolean } = {}) => {
        console.log(`[GLSLSound.play] time: ${time}`);
        if (reload) {
            stop();
            // 120BPM x 64measure = 128sec
            // 120BPM x 72measure = 144sec
            load();
        }
        _isPlaying = true;
        glslSound?.setVolume(volume);
        glslSound?.play(time);
    };

    const stop = () => {
        if(!_isPlaying) {
            return;
        }
        console.log('[GlslSound.stop]');
        _isPlaying = false;
        glslSound?.stop();
    };
    
    const isPlaying = () => _isPlaying;
    
    const getCurrentTime = () => {
        return glslSound?.getCurrentTime();
    }

    return {
        glslSound,
        isPlaying,
        load,
        play,
        stop,
        getCurrentTime
        // warmup,
    };
}
