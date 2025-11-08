import {
    createGLSLSound,
    getGLSLSoundCurrentTime,
    getGLSLSoundFrequencyData,
    getGLSLSoundTimeDomainData,
    GLSLSound,
    loadGLSLSound,
    playGLSLSound,
    setGLSLSoundVolume,
    stopGLSLSound,
    updateGLSLSoundTextureFromFrequencyData,
    updateGLSLSoundTextureFromTimeDomainData,
} from '@/PaleGL/core/glslSound.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';

export type GLSLSoundWrapper = {
    glslSound: GLSLSound;
    isPlaying: boolean;
};

export const createGLSLSoundWrapper = (gpu: Gpu, shader: string, duration: number): GLSLSoundWrapper => {
    const glslSound: GLSLSound = createGLSLSound(gpu, shader, duration);
    return {
        glslSound,
        isPlaying: false,
    };
};

export const loadSound = (glslSoundWrapper: GLSLSoundWrapper) => {
    loadGLSLSound(glslSoundWrapper.glslSound);
};

export const playSound = (
    glslSoundWrapper: GLSLSoundWrapper,
    args: { volume?: number; time?: number; reload?: boolean } = {}
) => {
    const { volume = 1, time = 0, reload = false } = args;
    console.log(`[glslSoundWrapper.play] args - volume: ${volume}, time: ${time}, reload: ${reload}`);
    if (reload) {
        stop();
        loadSound(glslSoundWrapper);
    }
    glslSoundWrapper.isPlaying = true;
    setGLSLSoundVolume(glslSoundWrapper.glslSound, volume);
    playGLSLSound(glslSoundWrapper.glslSound, time);
    setGLSLSoundVolume(glslSoundWrapper.glslSound, volume);
};

export const stopSound = (glslSoundWrapper: GLSLSoundWrapper) => {
    if (!glslSoundWrapper.isPlaying) {
        return;
    }
    console.log('[glslSoundWrapper.stop]');
    glslSoundWrapper.isPlaying = false;
    stopGLSLSound(glslSoundWrapper.glslSound);
};

export const getSoundCurrentTime = (glslSoundWrapper: GLSLSoundWrapper) => {
    return getGLSLSoundCurrentTime(glslSoundWrapper.glslSound);
};

export const getSoundFrequencyData = (glslSoundWrapper: GLSLSoundWrapper, dataArray: Uint8Array) => {
    getGLSLSoundFrequencyData(glslSoundWrapper.glslSound, dataArray);
};

export const getSoundTimeDomainData = (glslSoundWrapper: GLSLSoundWrapper, dataArray: Uint8Array) => {
    getGLSLSoundTimeDomainData(glslSoundWrapper.glslSound, dataArray);
};

export const updateSoundTextureFromFrequencyData = (glslSoundWrapper: GLSLSoundWrapper, dataArray: Uint8Array) => {
    updateGLSLSoundTextureFromFrequencyData(glslSoundWrapper.glslSound, dataArray);
};

export const updateSoundTextureFromTimeDomainData = (glslSoundWrapper: GLSLSoundWrapper, dataArray: Uint8Array) => {
    updateGLSLSoundTextureFromTimeDomainData(glslSoundWrapper.glslSound, dataArray);
};
