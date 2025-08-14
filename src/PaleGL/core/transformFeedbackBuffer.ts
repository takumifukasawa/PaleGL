import { Attribute } from '@/PaleGL/core/attribute.ts';
import { createVertexArrayObject, VertexArrayObject } from '@/PaleGL/core/vertexArrayObject.ts';
// import { AttributeUsageType } from '@/PaleGL/constants';
import { getAttributeUsage, Gpu } from '@/PaleGL/core/gpu.ts';
import { createShader, Shader } from '@/PaleGL/core/shader.ts';
import { createTransformFeedback, TransformFeedback } from '@/PaleGL/core/transformFeedback.ts';
import transformFeedbackFragmentShader from '@/PaleGL/shaders/transform-feedback-fragment.glsl';
import { AttributeUsageType, GL_ARRAY_BUFFER } from '@/PaleGL/constants.ts';
import { createUniforms, Uniforms, UniformsData } from '@/PaleGL/core/uniforms.ts';

// TODO: location, divisorをいい感じに指定したい

export type TransformFeedbackBufferArgs = {
    gpu: Gpu;
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

type TransformFeedbackBuffer = {
    shader: Shader;
    attributes: Attribute[];
    vertexArrayObject: VertexArrayObject;
    drawCount: number;
    uniforms: Uniforms;
    uniformBlockNames: string[];
    transformFeedback: TransformFeedback;
    outputs: {
        buffer: WebGLBuffer;
    }[];
    outputBuffers: WebGLBuffer[];
};

export function createTransformFeedbackBuffer(args: TransformFeedbackBufferArgs): TransformFeedbackBuffer {
    const {
        gpu,
        attributes,
        drawCount,
        vertexShader,
        // fragmentShader,
        varyings,
        // uniforms = [],
        // uniformBlockNames = [],
    } = args;

    // const shader: Shader;
    // const attributes: Attribute[] = [];
    // const vertexArrayObject: VertexArrayObject;
    // const drawCount: number;

    // this.gpu = gpu;
    const { gl } = gpu;

    // create shader

    const transformFeedbackVaryings = varyings.map(({ name }) => name);
    const shader = createShader({
        gpu,
        vertexShader,
        fragmentShader: transformFeedbackFragmentShader,
        transformFeedbackVaryings,
    });

    // create uniforms

    const uniforms = createUniforms(args.uniforms || []);
    const uniformBlockNames: string[] = args.uniformBlockNames || [];

    // create vao

    // fallback
    // TODO: fix
    attributes.forEach((attribute, i) => {
        attribute.location = i;
        attribute.divisor = 0;
    });

    const vertexArrayObject = createVertexArrayObject({
        gpu,
        attributes,
    });

    // create output buffers

    const outputs: {
        // name: string;
        buffer: WebGLBuffer;
        // size: number
    }[] = [];

    const outputBuffers = varyings.map(({ data, usageType }) => {
        const buffer = gl.createBuffer();
        gl.bindBuffer(GL_ARRAY_BUFFER, buffer);
        gl.bufferData(GL_ARRAY_BUFFER, data, getAttributeUsage(usageType || AttributeUsageType.DynamicDraw));
        gl.bindBuffer(GL_ARRAY_BUFFER, null);
        outputs.push({
            // name,
            buffer: buffer!,
        });
        return buffer!;
    });

    const transformFeedback = createTransformFeedback({ gpu, buffers: outputBuffers });

    return {
        shader,
        attributes,
        vertexArrayObject,
        drawCount,
        uniforms,
        uniformBlockNames,
        transformFeedback,
        outputs,
        outputBuffers,
    };
}
