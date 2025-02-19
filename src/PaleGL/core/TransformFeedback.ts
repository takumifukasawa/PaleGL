import { GPU } from '@/PaleGL/core/GPU.ts';
import { GLObject } from '@/PaleGL/core/GLObject.ts';
import { GL_ARRAY_BUFFER, GL_TRANSFORM_FEEDBACK, GL_TRANSFORM_FEEDBACK_BUFFER } from '@/PaleGL/constants.ts';

export class TransformFeedback extends GLObject {
    _transformFeedback: WebGLTransformFeedback;
    _gpu: GPU;

    get glObject() {
        return this._transformFeedback;
    }

    constructor({ gpu, buffers }: { gpu: GPU; buffers: WebGLBuffer[] }) {
        super();
        this._gpu = gpu;
        const { gl } = gpu;

        this._transformFeedback = gl.createTransformFeedback()!;
        this.bind();
        for (let i = 0; i < buffers.length; i++) {
            gl.bindBufferBase(GL_TRANSFORM_FEEDBACK_BUFFER, i, buffers[i]);
        }
        gl.bindBuffer(GL_ARRAY_BUFFER, null);
        this.unbind();
    }

    bind() {
        const { gl } = this._gpu;
        gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, this.glObject);
    }

    unbind() {
        const { gl } = this._gpu;
        gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, null);
    }
}
