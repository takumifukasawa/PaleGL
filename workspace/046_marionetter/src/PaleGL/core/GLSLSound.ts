import { GPU } from '@/PaleGL/core/GPU.ts';
// import { Shader } from '@/PaleGL/core/Shader.ts';
// import transformFeedbackFragmentShader from '@/PaleGL/shaders/transform-feedback-fragment.glsl';
// import { TransformFeedback } from '@/PaleGL/core/TransformFeedback.ts';
import { TransformFeedbackBuffer } from '@/PaleGL/core/TransformFeedbackBuffer.ts';
import { AttributeUsageType, UniformTypes } from '@/PaleGL/constants.ts';
// import { Attribute } from '@/PaleGL/core/Attribute.ts';

// ------------------------------------------------------------------------------
// ref:
// https://qiita.com/aa_debdeb/items/5e1204987236f7b52393
// https://raku-phys.hatenablog.com/entry/2020/04/19/002400
// ------------------------------------------------------------------------------

const SAMPLES = 65536;

export class GLSLSound {
    // bpm;
    gpu: GPU;
    // transformFeedbackBuffer: TransformFeedbackBuffer;
    channelNum;

    constructor({ gpu, vertexShader, duration }: { gpu: GPU; vertexShader: string; duration: number }) {
        this.gpu = gpu;
        this.channelNum = 2;

        const audioContext = new AudioContext();
        const audioBuffer = audioContext.createBuffer(
            this.channelNum,
            audioContext.sampleRate * duration,
            audioContext.sampleRate
        );

        const { gl } = gpu;

        // const shader = new Shader({
        //     gpu, vertexShader, fragmentShader: transformFeedbackFragmentShader, transformFeedbackVaryings: [
        //         'vSound'
        //     ]
        // });

        //const getUniformLocations = (gl: WebGL2RenderingContext, program: WebGLProgram, names: string[]) => {
        //    const locations: { [name: string]: WebGLUniformLocation } = {};
        //    names.forEach((name) => {
        //        locations[name] = gl.getUniformLocation(program, name)!;
        //    });
        //    return locations;
        //};

        const uniforms = {
            uBlockOffset: {
                type: UniformTypes.Float,
                value: 0,
            },
            uSampleRate: {
                type: UniformTypes.Float,
                value: 0,
            },
        };
        // const uniformLocations = getUniformLocations(gl, shader.glObject);

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
            uniforms,
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
        console.log(`[GLSLSound] outputL len: ${outputL.length}`);
        console.log(`[GLSLSound] outputR len: ${outputR.length}`);
        console.log(`[GLSLSound] ----------------------------------------`);

        transformFeedbackBuffer.uniforms.uSampleRate.value = audioContext.sampleRate;

        for (let i = 0; i < numBlocks; i++) {
            const blockOffset = (i * SAMPLES) / audioContext.sampleRate;
            // gl.uniform1f(uniformLocations['uBlockOffset'], blockOffset);

            transformFeedbackBuffer.uniforms.uBlockOffset.value = blockOffset;

            // TODO: vao, shader の bind,unbind がたくさん発生するので最適化した方がよい
            gpu.updateTransformFeedback({
                shader: transformFeedbackBuffer.shader,
                uniforms,
                transformFeedback: transformFeedbackBuffer.transformFeedback,
                vertexArrayObject: transformFeedbackBuffer.vertexArrayObject,
                drawCount: SAMPLES,
            });

            gpu.gl.getBufferSubData(
                gl.TRANSFORM_FEEDBACK_BUFFER,
                0,
                data
                // transformFeedbackBuffer.getBufferSubData(varyingName)!
            );

            for (let j = 0; j < SAMPLES; j++) {
                outputL[i * SAMPLES + j] = data[j * 2 + 0];
                outputR[i * SAMPLES + j] = data[j * 2 + 1];
            }
        }

        const node = audioContext.createBufferSource();
        node.connect(audioContext.destination);
        node.buffer = audioBuffer;
        node.loop = false;

        // this.audioBuffer = audioBuffer;
        // this.audioContext = audioContext;
        this.node = node;
    }

    // audioContext;
    // audioBuffer;
    node: AudioBufferSourceNode;

    play() {
        this.node.start(0);
    }
}
