import { Attribute } from '@/PaleGL/core/Attribute';
import { VertexArrayObject } from '@/PaleGL/core/VertexArrayObject';
// import { AttributeUsageType } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import { Shader } from '@/PaleGL/core/Shader.ts';
import { TransformFeedback } from '@/PaleGL/core/TransformFeedback.ts';
import { Uniforms } from '@/PaleGL/materials/Material.ts';

// TODO: location, divisorをいい感じに指定したい

export type TransformFeedbackBufferArgs = {
    gpu: GPU;
    attributes: Attribute[];
    drawCount: number;
    vertexShader: string;
    fragmentShader: string;
    varyings: {
        name: string;
        data: Float32Array | Uint16Array;
    }[];
    uniforms?: Uniforms;
    // shader: Shader;
    // targets: {
    //     data: Float32Array | Uint16Array,
    //     size: number
    // }[]
};

export class TransformFeedbackBuffer {
    // private gpu: GPU;

    shader: Shader;
    attributes: Attribute[] = [];
    // vertexCount: number = 0;
    vertexArrayObject: VertexArrayObject;
    drawCount: number;

    uniforms: Uniforms = {};

    transformFeedback: TransformFeedback;

    outputs: {
        buffer: WebGLBuffer;
        // size: number
    }[] = [];

    constructor({ gpu, attributes, drawCount, vertexShader, fragmentShader, varyings, uniforms = {} }: TransformFeedbackBufferArgs) {
        // this.gpu = gpu;
        const { gl } = gpu;
        const transformFeedbackVaryings = varyings.map(({ name }) => name);
        this.shader = new Shader({ gpu, vertexShader, fragmentShader, transformFeedbackVaryings });
        this.uniforms = uniforms;

        this.drawCount = drawCount;

        // fallback
        // TODO: fix
        attributes.forEach((attribute, i) => {
            attribute.location = i;
            attribute.divisor = 0;
        });
        this.attributes = attributes;

        this.vertexArrayObject = new VertexArrayObject({
            gpu,
            attributes,
        });

        const outputBuffers = varyings.map(({ data }) => {
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            this.outputs.push({
                buffer: buffer!,
            });
            return buffer!;
        });

        this.transformFeedback = new TransformFeedback({ gpu, buffers: outputBuffers });
    }
}
