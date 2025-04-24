import {Gpu, updateGPUTransformFeedback} from '@/PaleGL/core/gpu.ts';
import { createTransformFeedbackBuffer } from '@/PaleGL/core/transformFeedbackBuffer.ts';
import { AttributeUsageType, UniformTypes } from '@/PaleGL/constants.ts';
import { setUniformValue } from '@/PaleGL/core/uniforms.ts';

// ------------------------------------------------------------------------------
// ref:
// https://qiita.com/aa_debdeb/items/5e1204987236f7b52393
// https://raku-phys.hatenablog.com/entry/2020/04/19/002400
// ------------------------------------------------------------------------------

const SAMPLES = 65536;

const UNIFORM_NAME_BLOCK_OFFSET = 'uBlockOffset';
const UNIFORM_NAME_SAMPLE_RATE = 'uSampleRate';

export type GLSLSound = {
    gpu: Gpu;
    vertexShader: string;
    duration: number;
    channelNum: number;
    audioContext: AudioContext;
    node: AudioBufferSourceNode | null;
    gainNode: GainNode | null;
    audioBuffer: AudioBuffer | null;
    volume: number;
    startTime: number;
    offsetTime: number;
    currentTime: number;
    // //
    // play: (time: number) => void;
    // setVolume: (value: number) => void;
    // stop: () => void;
    // getCurrentTime: () => number;
};

export function createGLSLSound(gpu: Gpu, vertexShader: string, duration: number): GLSLSound {
    const channelNum: number = 2;
    // let audioContext: AudioContext;
    // const node: AudioBufferSourceNode | null;
    // const gainNode: GainNode | null;
    const volume: number = 1;
    // let audioBuffer: AudioBuffer;

    const currentTime = 0;
    const startTime = 0;
    const offsetTime = 0;

    const audioContext = new AudioContext();

    return {
        gpu,
        vertexShader,
        duration,
        channelNum,
        audioContext,
        node: null,
        gainNode: null,
        audioBuffer: null,
        volume,
        startTime,
        offsetTime,
        currentTime,
        // play,
        // setVolume,
        // stop,
        // getCurrentTime,
    };

    // reload(vertexShader: string, duration: number) {
    //     this.create(vertexShader, duration);
    // }
}

export function loadGLSLSound(
    glslSound: GLSLSound
) {
    // glslSound.reload(vertexShader, duration);
    // glslSound.load();
    console.log(`[GLSLSound.load]`);
    glslSound.audioBuffer = glslSound.audioContext.createBuffer(
        2,
        glslSound.audioContext.sampleRate * glslSound.duration,
        glslSound.audioContext.sampleRate,
    );

    const { gpu } = glslSound;
    const { gl } = gpu;

    const data = new Float32Array(glslSound.channelNum * SAMPLES);

    const varyingName = 'vSound';

    const transformFeedbackBuffer = createTransformFeedbackBuffer({
        gpu,
        attributes: [],
        varyings: [
            {
                name: varyingName,
                data,
                usageType: AttributeUsageType.DynamicCopy,
            },
        ],
        vertexShader: glslSound.vertexShader,
        uniforms: [
            {
                name: UNIFORM_NAME_BLOCK_OFFSET,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UNIFORM_NAME_SAMPLE_RATE,
                type: UniformTypes.Float,
                value: 0,
            },
        ],
        // fragmentShader: transformFeedbackFragmentShader,
        drawCount: SAMPLES,
    });

    const numBlocks = Math.ceil((glslSound.audioContext.sampleRate * glslSound.duration) / SAMPLES);
    const outputL = glslSound.audioBuffer.getChannelData(0);
    const outputR = glslSound.audioBuffer.getChannelData(1);

    console.log(`[loadGLSLSound] ----------------------------------------`);
    console.log(`[loadGLSLSound] sample rate: ${glslSound.audioContext.sampleRate}`);
    console.log(`[loadGLSLSound] duration: ${glslSound.duration}`);
    console.log(`[loadGLSLSound] samples: ${SAMPLES}`);
    console.log(`[loadGLSLSound] num blocks: ${numBlocks}`);
    console.log(`[loadGLSLSound] outputL length: ${outputL.length}`);
    console.log(`[loadGLSLSound] outputR length: ${outputR.length}`);
    console.log(`[loadGLSLSound] ----------------------------------------`);

    setUniformValue(
        transformFeedbackBuffer.uniforms,
        UNIFORM_NAME_SAMPLE_RATE,
        glslSound.audioContext.sampleRate,
    );

    for (let i = 0; i < numBlocks; i++) {
        const blockOffset = (i * SAMPLES) / glslSound.audioContext.sampleRate;
        // gl.uniform1f(uniformLocations['uBlockOffset'], blockOffset);

        setUniformValue(
            transformFeedbackBuffer.uniforms,
            UNIFORM_NAME_BLOCK_OFFSET,
            blockOffset,
        );

        // TODO: vao, shader の bind,unbind がたくさん発生するので最適化した方がよい
        updateGPUTransformFeedback(gpu, {
            shader: transformFeedbackBuffer.shader,
            uniforms: transformFeedbackBuffer.uniforms,
            transformFeedback: transformFeedbackBuffer.transformFeedback,
            vertexArrayObject: transformFeedbackBuffer.vertexArrayObject,
            drawCount: SAMPLES,
        });

        gpu.gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, data);

        for (let j = 0; j < SAMPLES; j++) {
            outputL[i * SAMPLES + j] = data[j * 2 + 0];
            outputR[i * SAMPLES + j] = data[j * 2 + 1];
        }
    }
}

export function playGLSLSound(
    glslSound: GLSLSound,
    time: number,
) {
    if (glslSound.gainNode) {
       glslSound.gainNode.disconnect();
       // glslSound.gainNode = null;
    }
    if (glslSound.node) {
        glslSound.node.stop();
        // glslSound.node = null;
    }
    console.log(`[GLSLSound.play] time: ${time}`);

    glslSound.node = glslSound.audioContext.createBufferSource();
    glslSound.gainNode = glslSound.audioContext.createGain();

    glslSound.gainNode.connect(glslSound.audioContext.destination);
    glslSound.gainNode.gain.value = glslSound.volume;

    glslSound.node.connect(glslSound.gainNode);
    glslSound.node.buffer = glslSound.audioBuffer;
    glslSound.node.loop = false;
    glslSound.node.start(0, time);

    glslSound.startTime = glslSound.audioContext.currentTime;
    glslSound.offsetTime = time;
}

export function setGLSLSoundVolume(
    glslSound: GLSLSound,
    value: number,
) {
    glslSound.volume = value;
    if (glslSound.gainNode) {
        glslSound.gainNode.gain.value = glslSound.volume;
    }
}

export function stopGLSLSound(glslSound: GLSLSound) {
    console.log('[GLSLSound.stop]');
    glslSound.node?.stop();
    // await this.audioContext?.suspend();
}

export function getGLSLSoundCurrentTime(glslSound: GLSLSound) {
    glslSound.currentTime = glslSound.audioContext.currentTime - glslSound.startTime + glslSound.offsetTime;
    // for debug
    // console.log(
    //     `[GlslSound.getCurrentTime] audio context currentTime: ${audioContext.currentTime}, current time: ${currentTime}, offset time: ${offsetTime}`
    // );
    return glslSound.currentTime;
}
