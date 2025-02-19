import { GLObject } from '@/PaleGL/core/GLObject';
import { GPU } from '@/PaleGL/core/GPU';
import { GL_ELEMENT_ARRAY_BUFFER, GL_STATIC_DRAW } from '@/PaleGL/constants.ts';

export class IndexBufferObject extends GLObject {
    _ibo: WebGLBuffer;
    _gpu: GPU;

    get glObject() {
        return this._ibo;
    }

    constructor({ gpu, indices }: { gpu: GPU; indices: number[] }) {
        super();

        this._gpu = gpu;

        const gl = this._gpu.gl;

        this._ibo = gl.createBuffer()!;

        this.bind();
        gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), GL_STATIC_DRAW);
    }

    bind() {
        const gl = this._gpu.gl;
        gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, this._ibo);
    }

    unbind() {
        const gl = this._gpu.gl;
        gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, null);
    }
}
