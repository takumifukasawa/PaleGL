﻿import { Attribute } from '@/PaleGL/core/attribute.ts';
import { VertexArrayObject } from '@/PaleGL/core/VertexArrayObject';
// import { AttributeUsageType } from '@/PaleGL/constants';
import { Shader } from '@/PaleGL/core/Shader.ts';
import { TransformFeedback } from '@/PaleGL/core/TransformFeedback.ts';
import { TransformFeedbackBufferArgs } from '@/PaleGL/core/TransformFeedbackBuffer.ts';
import transformFeedbackFragmentShader from '@/PaleGL/shaders/transform-feedback-fragment.glsl';
import { Uniforms } from '@/PaleGL/core/Uniforms.ts';

// TODO: location, divisorをいい感じに指定したい

type TransformFeedbackBuffer = {
    attributes: Attribute[];
    srcVertexArrayObject: VertexArrayObject;
    transformFeedback: TransformFeedback;
    outputVertexArrayobject: VertexArrayObject;
};

export class TransformFeedbackDoubleBuffer {
    shader: Shader;
    drawCount: number;
    _transformFeedbackBuffers: TransformFeedbackBuffer[] = [];
    uniforms: Uniforms;
    uniformBlockNames: string[] = [];

    // NOTE: readもwriteも実態は同じだがapiとして分ける

    get read() {
        const buffer = this._transformFeedbackBuffers[0];
        return {
            vertexArrayObject: buffer.srcVertexArrayObject,
            transformFeedback: buffer.transformFeedback,
        };
    }

    get write() {
        const buffer = this._transformFeedbackBuffers[0];
        return {
            vertexArrayObject: buffer.srcVertexArrayObject,
            transformFeedback: buffer.transformFeedback,
        };
    }

    constructor({ gpu, attributes, drawCount, vertexShader, varyings, uniforms = [], uniformBlockNames = [] }: TransformFeedbackBufferArgs) {
        const transformFeedbackVaryings = varyings.map(({ name }) => name);
        this.shader = new Shader({
            gpu,
            vertexShader,
            fragmentShader: transformFeedbackFragmentShader,
            transformFeedbackVaryings,
        });

        this.drawCount = drawCount;
        this.uniforms = new Uniforms(uniforms);
        this.uniformBlockNames = uniformBlockNames;

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

        const vertexArrayObject1 = new VertexArrayObject({
            gpu,
            attributes: attributes1,
        });
        const vertexArrayObject2 = new VertexArrayObject({
            gpu,
            attributes: attributes2,
        });

        const transformFeedback1 = new TransformFeedback({
            gpu,
            buffers: vertexArrayObject1.getBuffers(),
        });
        const transformFeedback2 = new TransformFeedback({
            gpu,
            buffers: vertexArrayObject2.getBuffers(),
        });

        this._transformFeedbackBuffers.push({
            attributes: attributes1,
            srcVertexArrayObject: vertexArrayObject1,
            transformFeedback: transformFeedback2,
            outputVertexArrayobject: vertexArrayObject2,
        });

        this._transformFeedbackBuffers.push({
            attributes: attributes2,
            srcVertexArrayObject: vertexArrayObject2,
            transformFeedback: transformFeedback1,
            outputVertexArrayobject: vertexArrayObject1,
        });
    }

    swap() {
        const tmp = this._transformFeedbackBuffers[0];
        this._transformFeedbackBuffers[0] = this._transformFeedbackBuffers[1];
        this._transformFeedbackBuffers[1] = tmp;
    }
    
    updateBufferSubData(key: string, index: number, data: ArrayBufferView | BufferSource) {
        this._transformFeedbackBuffers.forEach((buffer) => {
            buffer.srcVertexArrayObject.updateBufferSubData(key, index, data);
        });
    }
}
