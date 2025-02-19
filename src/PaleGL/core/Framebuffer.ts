import { GLObject } from '@/PaleGL/core/GLObject';
import {GL_FRAMEBUFFER, GLColorAttachment} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';

export class Framebuffer extends GLObject {
    _framebuffer: WebGLFramebuffer;
    _drawBuffersList: GLColorAttachment[] = [];
    _gpu;

    get drawBufferList() {
        return this._drawBuffersList;
    }

    get glObject() {
        return this._framebuffer;
    }

    get hasMultipleDrawBuffers() {
        return this._drawBuffersList.length >= 2;
    }

    registerDrawBuffer(drawBufferName: GLColorAttachment) {
        this._drawBuffersList.push(drawBufferName);
    }

    constructor({ gpu }: { gpu: GPU }) {
        super();

        this._gpu = gpu;
        const gl = this._gpu.gl;

        const fb = gl.createFramebuffer()!;
        // if (!fb) {
        //     console.error('invalid framebuffer');
        // }
        this._framebuffer = fb;
    }

    bind() {
        const gl = this._gpu.gl;
        gl.bindFramebuffer(GL_FRAMEBUFFER, this._framebuffer);
    }

    unbind() {
        const gl = this._gpu.gl;
        gl.bindFramebuffer(GL_FRAMEBUFFER, null);
    }
}
