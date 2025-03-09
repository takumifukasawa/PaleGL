// import { Gpu } from '@/PaleGL/core/Gpu.ts';
// import { GlObject } from '@/PaleGL/core/glObject.ts';
// import { GL_ARRAY_BUFFER, GL_TRANSFORM_FEEDBACK, GL_TRANSFORM_FEEDBACK_BUFFER } from '@/PaleGL/constants.ts';
// 
// export class TransformFeedback extends GlObject {
//     _transformFeedback: WebGLTransformFeedback;
//     _gpu: Gpu;
// 
//     get glObject() {
//         return this._transformFeedback;
//     }
// 
//     constructor({ gpu, buffers }: { gpu: Gpu; buffers: WebGLBuffer[] }) {
//         super();
//         this._gpu = gpu;
//         const { gl } = gpu;
// 
//         this._transformFeedback = gl.createTransformFeedback()!;
//         this.bind();
//         for (let i = 0; i < buffers.length; i++) {
//             gl.bindBufferBase(GL_TRANSFORM_FEEDBACK_BUFFER, i, buffers[i]);
//         }
//         gl.bindBuffer(GL_ARRAY_BUFFER, null);
//         this.unbind();
//     }
// 
//     bind() {
//         const { gl } = this._gpu;
//         gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, this.glObject);
//     }
// 
//     unbind() {
//         const { gl } = this._gpu;
//         gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, null);
//     }
// }


import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createGLObject, GLObjectBase } from '@/PaleGL/core/glObject.ts';
import { GL_TRANSFORM_FEEDBACK, GL_TRANSFORM_FEEDBACK_BUFFER } from '@/PaleGL/constants.ts';

export type TransformFeedback = GLObjectBase<WebGLTransformFeedback> & {};

export function createTransformFeedback({ gpu, buffers }: { gpu: Gpu; buffers: WebGLBuffer[] }): TransformFeedback {
        const transformFeedback = gpu.gl.createTransformFeedback()!;
        bindRawTransformFeedback(gpu.gl, transformFeedback)
        for (let i = 0; i < buffers.length; i++) {
            gpu.gl.bindBufferBase(GL_TRANSFORM_FEEDBACK_BUFFER, i, buffers[i]);
        }
        unbindRawTransformFeedback(gpu.gl);

    return {
        ...createGLObject(gpu, transformFeedback),
    }
}

export function bindTransformFeedback(tf: TransformFeedback) {
    bindRawTransformFeedback(tf.gpu.gl, tf.glObject);
}

export function unbindTransformFeedback(tf: TransformFeedback) {
    unbindRawTransformFeedback(tf.gpu.gl);
}


function bindRawTransformFeedback(gl: WebGL2RenderingContext, buffer: WebGLTransformFeedback) {
    gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, buffer);
}

function unbindRawTransformFeedback(gl: WebGL2RenderingContext) {
    gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, null);
}
