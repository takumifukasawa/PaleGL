import { Attribute } from '@/PaleGL/core/attribute.ts';
import { createVertexArrayObject, VertexArrayObject } from '@/PaleGL/core/vertexArrayObject.ts';
// import { AttributeUsageType } from '@/PaleGL/constants';
import { getAttributeUsage, GPU } from '@/PaleGL/core/GPU';
import { Shader } from '@/PaleGL/core/Shader.ts';
import { TransformFeedback } from '@/PaleGL/core/TransformFeedback.ts';
import transformFeedbackFragmentShader from '@/PaleGL/shaders/transform-feedback-fragment.glsl';
import { AttributeUsageType, GL_ARRAY_BUFFER } from '@/PaleGL/constants.ts';
import {createUniforms, Uniforms, UniformsData} from '@/PaleGL/core/uniforms.ts';

// TODO: location, divisorをいい感じに指定したい

export type TransformFeedbackBufferArgs = {
    gpu: GPU;
    attributes: Attribute[];
    drawCount: number;
    vertexShader: string;
    // fragmentShader: string;
    varyings: {
        name: string;
        data: Float32Array | Uint16Array;
        usageType?: AttributeUsageType;
    }[];
    uniforms?: UniformsData;
    uniformBlockNames?: string[];
};

export class TransformFeedbackBuffer {
    // private gpu: GPU;

    shader: Shader;
    attributes: Attribute[] = [];
    // vertexCount: number = 0;
    vertexArrayObject: VertexArrayObject;
    drawCount: number;

    uniforms: Uniforms;
    uniformBlockNames: string[] = [];

    transformFeedback: TransformFeedback;

    _outputs: {
        // name: string;
        buffer: WebGLBuffer;
        // size: number
    }[] = [];

    constructor({
        gpu,
        attributes,
        drawCount,
        vertexShader,
        // fragmentShader,
        varyings,
        uniforms = [],
        uniformBlockNames = [],
    }: TransformFeedbackBufferArgs) {
        // this.gpu = gpu;
        const { gl } = gpu;
        const transformFeedbackVaryings = varyings.map(({ name }) => name);
        this.shader = new Shader({
            gpu,
            vertexShader,
            fragmentShader: transformFeedbackFragmentShader,
            transformFeedbackVaryings,
        });
        this.uniforms = createUniforms(uniforms);
        this.uniformBlockNames = uniformBlockNames;

        this.drawCount = drawCount;

        // fallback
        // TODO: fix
        attributes.forEach((attribute, i) => {
            attribute.location = i;
            attribute.divisor = 0;
        });
        this.attributes = attributes;

        this.vertexArrayObject = createVertexArrayObject({
            gpu,
            attributes,
        });

        const outputBuffers = varyings.map(({ data, usageType }) => {
            const buffer = gl.createBuffer();
            gl.bindBuffer(GL_ARRAY_BUFFER, buffer);
            gl.bufferData(GL_ARRAY_BUFFER, data, getAttributeUsage(usageType || AttributeUsageType.DynamicDraw));
            gl.bindBuffer(GL_ARRAY_BUFFER, null);
            this._outputs.push({
                // name,
                buffer: buffer!,
            });
            return buffer!;
        });

        this.transformFeedback = new TransformFeedback({ gpu, buffers: outputBuffers });
    }

    // dispose() {
    // }

    // getBufferSubData(name: string) {
    //     return this.outputs.find(elem => elem.name === name)?.buffer;
    // }
}
