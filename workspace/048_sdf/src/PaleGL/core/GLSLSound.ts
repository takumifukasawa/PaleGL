import { GPU } from '@/PaleGL/core/GPU.ts';
import { TransformFeedbackBuffer } from '@/PaleGL/core/TransformFeedbackBuffer.ts';
import { AttributeUsageType, UniformTypes } from '@/PaleGL/constants.ts';

// ------------------------------------------------------------------------------
// ref:
// https://qiita.com/aa_debdeb/items/5e1204987236f7b52393
// https://raku-phys.hatenablog.com/entry/2020/04/19/002400
// ------------------------------------------------------------------------------

const SAMPLES = 65536;

export class GLSLSound {
    gpu: GPU;
    channelNum: number;
    audioContext: AudioContext;
    node: AudioBufferSourceNode | null;
    duration: number;
    audioBuffer: AudioBuffer;

    constructor(gpu: GPU, vertexShader: string, duration: number) {
        this.gpu = gpu;
        this.channelNum = 2;
        this.duration = duration;
        this.node = null;
        
        const audioContext = new AudioContext();
        const audioBuffer = audioContext.createBuffer(
            this.channelNum,
            audioContext.sampleRate * duration,
            audioContext.sampleRate
        );

        const { gl } = gpu;

        const data = new Float32Array(this.channelNum * SAMPLES);

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
                    name: 'uBlockOffset',
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: 'uSampleRate',
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

        transformFeedbackBuffer.uniforms.setValue('uSampleRate', audioContext.sampleRate);

        for (let i = 0; i < numBlocks; i++) {
            const blockOffset = (i * SAMPLES) / audioContext.sampleRate;
            // gl.uniform1f(uniformLocations['uBlockOffset'], blockOffset);

            transformFeedbackBuffer.uniforms.setValue('uBlockOffset', blockOffset);

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

        this.audioContext = audioContext;
        this.audioBuffer = audioBuffer;
    }
    
    play(time: number) {
        if(this.node) {
            this.node.stop();
            this.node = null;
        }
        console.log(`[GLSLSound.play] time: ${time}`);
        const node = this.audioContext.createBufferSource();
        node.connect(this.audioContext.destination);
        node.buffer = this.audioBuffer;
        node.loop = false;
        node.start(0, time);
        this.node = node;
    }
    
    // seek(time: number) {
    //     console.log(`[GLSLSound.seek] time: ${time}`);
    //     // if(this.node) {
    //     //     this.node.playbackRate.value = time / this.duration;
    //     // }
    // }

    stop() {
        console.log('[GLSLSound.stop]');
        this.node?.stop();
        // await this.audioContext?.suspend();
    }

    // reload(vertexShader: string, duration: number) {
    //     this.create(vertexShader, duration);
    // }
}
