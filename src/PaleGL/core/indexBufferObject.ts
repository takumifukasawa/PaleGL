// import { GlObject, RawGLObject } from '@/PaleGL/core/GlObject';
// import { Gpu } from '@/PaleGL/core/Gpu';
// import { GL_ELEMENT_ARRAY_BUFFER, GL_STATIC_DRAW } from '@/PaleGL/constants.ts';

// export class IndexBufferObject extends GlObject {
//     _ibo: WebGLBuffer;
//     _gpu: Gpu;
// 
//     get glObject() {
//         return this._ibo;
//     }
// 
//     constructor({ gpu, indices }: { gpu: Gpu; indices: number[] }) {
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

import { Gpu } from '@/PaleGL/core/gpu.ts';
import { GL_ELEMENT_ARRAY_BUFFER, GL_STATIC_DRAW, GL_UNSIGNED_SHORT, GL_UNSIGNED_INT } from '@/PaleGL/constants.ts';
import { createGLObject, GLObjectBase } from '@/PaleGL/core/glObject.ts';

export type IndexBufferObject = GLObjectBase<WebGLBuffer> & {
    indexType: number; // GL_UNSIGNED_SHORT or GL_UNSIGNED_INT
};

export function createIndexBufferObject(gpu: Gpu, indices: number[] | Uint16Array | Uint32Array): IndexBufferObject {
    const ibo = gpu.gl.createBuffer()!;
    bindRawIndexBufferObject(gpu.gl, ibo);

    // Check if we need 32-bit indices
    let maxIndex = 0;
    for (let i = 0; i < indices.length; i++) {
        if (indices[i] > maxIndex) {
            maxIndex = indices[i];
        }
    }

    const use32Bit = maxIndex > 65535;
    const indexType = use32Bit ? GL_UNSIGNED_INT : GL_UNSIGNED_SHORT;
    const indexArray = use32Bit ? new Uint32Array(indices) : new Uint16Array(indices);

    gpu.gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, indexArray, GL_STATIC_DRAW);

    return {
        ...createGLObject(gpu, ibo),
        indexType,
    };
}

// function bindIndexBufferObject(gpu: Gpu, ibo: IndexBufferObject) {
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
