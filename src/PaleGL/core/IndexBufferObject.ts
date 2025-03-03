// import { GlObject, RawGLObject } from '@/PaleGL/core/GlObject';
// import { GPU } from '@/PaleGL/core/GPU';
// import { GL_ELEMENT_ARRAY_BUFFER, GL_STATIC_DRAW } from '@/PaleGL/constants.ts';

// export class IndexBufferObject extends GlObject {
//     _ibo: WebGLBuffer;
//     _gpu: GPU;
// 
//     get glObject() {
//         return this._ibo;
//     }
// 
//     constructor({ gpu, indices }: { gpu: GPU; indices: number[] }) {
//         super();
// 
//         this._gpu = gpu;
// 
//         const gl = this._gpu.gl;
// 
//         this._ibo = gl.createBuffer()!;
// 
//         this.bind();
//         gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), GL_STATIC_DRAW);
//     }
// 
//     bind() {
//         const gl = this._gpu.gl;
//         gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, this._ibo);
//     }
// 
//     unbind() {
//         const gl = this._gpu.gl;
//         gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, null);
//     }
// }

import { GPU } from '@/PaleGL/core/GPU';
import { GL_ELEMENT_ARRAY_BUFFER, GL_STATIC_DRAW } from '@/PaleGL/constants.ts';
import { createGLObject, GLObjectBase } from '@/PaleGL/core/glObject.ts';

export type IndexBufferObject = GLObjectBase<WebGLBuffer>;

export function createIndexBufferObject(gpu: GPU, indices: number[]): IndexBufferObject {
    const ibo = gpu.gl.createBuffer()!;
    bindRawIndexBufferObject(gpu.gl, ibo);
    gpu.gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), GL_STATIC_DRAW);
    return createGLObject(gpu, ibo);
}

// function bindIndexBufferObject(gpu: GPU, ibo: IndexBufferObject) {
//     bindRawIndexBufferObject(gpu.gl, ibo.glObject);
// }

export function unbindIndexBufferObject(ibo: IndexBufferObject) {
    unbindRawIndexBufferObject(ibo.gpu.gl);
}

// internal -----------------------------------------------------------------

function bindRawIndexBufferObject(gl: WebGL2RenderingContext, ibo: WebGLBuffer) {
    gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, ibo);
}

function unbindRawIndexBufferObject(gl: WebGL2RenderingContext) {
    gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, null);
}