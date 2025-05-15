import { Attribute } from '@/PaleGL/core/attribute.ts';
import { createShader, Shader } from '@/PaleGL/core/shader.ts';
import { createTransformFeedback, TransformFeedback } from '@/PaleGL/core/transformFeedback.ts';
import { TransformFeedbackBufferArgs } from '@/PaleGL/core/transformFeedbackBuffer.ts';
import transformFeedbackFragmentShader from '@/PaleGL/shaders/transform-feedback-fragment.glsl';
import { createUniforms, Uniforms } from '@/PaleGL/core/uniforms.ts';
import {
    createVertexArrayObject,
    getVertexArrayObjectBuffers,
    updateVertexArrayObjectBufferSubData,
    VertexArrayObject,
} from '@/PaleGL/core/vertexArrayObject.ts';

// TODO: location, divisorをいい感じに指定したい

type TransformFeedbackBuffer = {
    attributes: Attribute[];
    srcVertexArrayObject: VertexArrayObject;
    transformFeedback: TransformFeedback;
    outputVertexArrayobject: VertexArrayObject;
};

export type TransformFeedbackDoubleBuffer = {
    shader: Shader;
    drawCount: number;
    transformFeedbackBuffers: TransformFeedbackBuffer[];
    uniforms: Uniforms;
    uniformBlockNames: string[];
};

export function createTransformFeedbackDoubleBuffer(args: TransformFeedbackBufferArgs) {
    const { gpu, attributes, drawCount, vertexShader, varyings, uniformBlockNames = [] } = args;

    const transformFeedbackBuffers: TransformFeedbackBuffer[] = [];

    const transformFeedbackVaryings = varyings.map(({ name }) => name);
    const shader = createShader({
        gpu,
        vertexShader,
        fragmentShader: transformFeedbackFragmentShader,
        transformFeedbackVaryings,
    });

    const uniforms = createUniforms(args.uniforms || []);

    attributes.forEach((attribute, i) => {
        attribute.location = i;
        attribute.divisor = 0; // divisorはない想定で問題ないはず？
    });
    const attributes1 = attributes;

    // copy
    const attributes2 = attributes.map((attribute) => {
        return {
            ...attribute,
        } as Attribute;
    });

    const vertexArrayObject1 = createVertexArrayObject({
        gpu,
        attributes: attributes1,
    });
    const vertexArrayObject2 = createVertexArrayObject({
        gpu,
        attributes: attributes2,
    });

    const transformFeedback1 = createTransformFeedback({
        gpu,
        buffers: getVertexArrayObjectBuffers(vertexArrayObject1),
    });
    const transformFeedback2 = createTransformFeedback({
        gpu,
        buffers: getVertexArrayObjectBuffers(vertexArrayObject2),
    });

    transformFeedbackBuffers.push({
        attributes: attributes1,
        srcVertexArrayObject: vertexArrayObject1,
        transformFeedback: transformFeedback2,
        outputVertexArrayobject: vertexArrayObject2,
    });

    transformFeedbackBuffers.push({
        attributes: attributes2,
        srcVertexArrayObject: vertexArrayObject2,
        transformFeedback: transformFeedback1,
        outputVertexArrayobject: vertexArrayObject1,
    });

    return {
        shader,
        drawCount,
        transformFeedbackBuffers,
        uniforms,
        uniformBlockNames,
    };
}

export function getReadTransformFeedbackDoubleBuffer(transformFeedbackDoubleBuffer: TransformFeedbackDoubleBuffer) {
    const buffer = transformFeedbackDoubleBuffer.transformFeedbackBuffers[0];
    return {
        vertexArrayObject: buffer.srcVertexArrayObject,
        transformFeedback: buffer.transformFeedback,
    };
}

export function getWriteTransformFeedbackDoubleBuffer(transformFeedbackDoubleBuffer: TransformFeedbackDoubleBuffer) {
    const buffer = transformFeedbackDoubleBuffer.transformFeedbackBuffers[0];
    return {
        vertexArrayObject: buffer.srcVertexArrayObject,
        transformFeedback: buffer.transformFeedback,
    };
}

export function swapTransformFeedbackDoubleBuffer(transformFeedbackDoubleBuffer: TransformFeedbackDoubleBuffer) {
    const tmp = transformFeedbackDoubleBuffer.transformFeedbackBuffers[0];
    transformFeedbackDoubleBuffer.transformFeedbackBuffers[0] =
        transformFeedbackDoubleBuffer.transformFeedbackBuffers[1];
    transformFeedbackDoubleBuffer.transformFeedbackBuffers[1] = tmp;
}

export function updateTransformFeedbackDoubleBufferSubData(
    transformFeedbackDoubleBuffer: TransformFeedbackDoubleBuffer,
    key: string,
    index: number,
    data: ArrayBufferView | BufferSource
) {
    transformFeedbackDoubleBuffer.transformFeedbackBuffers.forEach((buffer) => {
        updateVertexArrayObjectBufferSubData(buffer.srcVertexArrayObject, key, index, data);
    });
}
