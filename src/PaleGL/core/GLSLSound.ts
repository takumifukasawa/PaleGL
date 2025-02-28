import { GPU } from '@/PaleGL/core/GPU.ts';
import { TransformFeedbackBuffer } from '@/PaleGL/core/TransformFeedbackBuffer.ts';
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
    play: (time: number) => void;
    setVolume: (value: number) => void;
    stop: () => void;
    getCurrentTime: () => number;
};

export function createGLSLSound(gpu: GPU, vertexShader: string, duration: number) {
    const channelNum: number = 2;
    // let audioContext: AudioContext;
    let node: AudioBufferSourceNode | null;
    let gainNode: GainNode | null;
    let volume: number = 1;
    // let audioBuffer: AudioBuffer;

    let currentTime = 0;
    let startTime = 0;
    let offsetTime = 0;

    const audioContext = new AudioContext();
    const audioBuffer = audioContext.createBuffer(
        channelNum,
        audioContext.sampleRate * duration,
        audioContext.sampleRate,
    );

    const { gl } = gpu;

    const data = new Float32Array(channelNum * SAMPLES);

    const varyingName = 'vSound';

    const transformFeedbackBuffer = new TransformFeedbackBuffer({
        gpu,
        attributes: [],
        varyings: [
            {
                name: varyingName,
                data,
                usageType: AttributeUsageType.DynamicCopy,
            },
        ],
        vertexShader,
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

    const numBlocks = Math.ceil((audioContext.sampleRate * duration) / SAMPLES);
    const outputL = audioBuffer.getChannelData(0);
    const outputR = audioBuffer.getChannelData(1);

    console.log(`[GLSLSound] ----------------------------------------`);
    console.log(`[GLSLSound] sample rate: ${audioContext.sampleRate}`);
    console.log(`[GLSLSound] duration: ${duration}`);
    console.log(`[GLSLSound] samples: ${SAMPLES}`);
    console.log(`[GLSLSound] num blocks: ${numBlocks}`);
    console.log(`[GLSLSound] outputL length: ${outputL.length}`);
    console.log(`[GLSLSound] outputR length: ${outputR.length}`);
    console.log(`[GLSLSound] ----------------------------------------`);

    setUniformValue(
        transformFeedbackBuffer.uniforms,
        UNIFORM_NAME_SAMPLE_RATE,
        audioContext.sampleRate,
    );

    for (let i = 0; i < numBlocks; i++) {
        const blockOffset = (i * SAMPLES) / audioContext.sampleRate;
        // gl.uniform1f(uniformLocations['uBlockOffset'], blockOffset);

        setUniformValue(
            transformFeedbackBuffer.uniforms,
            UNIFORM_NAME_BLOCK_OFFSET,
            blockOffset,
        );

        // TODO: vao, shader の bind,unbind がたくさん発生するので最適化した方がよい
        gpu.updateTransformFeedback({
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

    const play = (time: number) => {
        if (gainNode) {
            gainNode.disconnect();
            gainNode = null;
        }
        if (node) {
            node.stop();
            node = null;
        }
        console.log(`[GLSLSound.play] time: ${time}`);

        node = audioContext.createBufferSource();
        gainNode = audioContext.createGain();

        gainNode.connect(audioContext.destination);
        gainNode.gain.value = volume;

        node.connect(gainNode);
        node.buffer = audioBuffer;
        node.loop = false;
        // node.playbackRate.value = time / duration;
        node.start(0, time);

        startTime = audioContext.currentTime;
        offsetTime = time;
    };

    const setVolume = (value: number) => {
        volume = value;
        if (gainNode) {
            gainNode.gain.value = volume;
        }
    };

    // seek(time: number) {
    //     console.log(`[GLSLSound.seek] time: ${time}`);
    //     // if(this.node) {
    //     //     this.node.playbackRate.value = time / this.duration;
    //     // }
    // }

    const stop = () => {
        console.log('[GLSLSound.stop]');
        node?.stop();
        // await this.audioContext?.suspend();
    };

    const getCurrentTime = () => {
        currentTime = audioContext.currentTime - startTime + offsetTime;
        // for debug
        // console.log(
        //     `[GLSLSound.getCurrentTime] audio context currentTime: ${audioContext.currentTime}, current time: ${currentTime}, offset time: ${offsetTime}`
        // );
        return currentTime;
    };

    return {
        play,
        setVolume,
        stop,
        getCurrentTime,
    };

    // reload(vertexShader: string, duration: number) {
    //     this.create(vertexShader, duration);
    // }
}
