import { GLObject } from '@/PaleGL/core/GLObject';
import { RenderbufferType, RenderbufferTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';

export class Renderbuffer extends GLObject {
    #gpu: GPU;
    #type: RenderbufferType;
    #renderbuffer: WebGLRenderbuffer;

    get glObject() {
        return this.#renderbuffer;
    }

    constructor({ gpu, type, width, height }: { gpu: GPU; type: RenderbufferType; width: number; height: number }) {
        super();

        this.#gpu = gpu;
        this.#type = type;

        const gl = this.#gpu.gl;

        const rb = gl.createRenderbuffer();
        if (!rb) {
            throw 'invalid render buffer';
        }
        this.#renderbuffer = rb;

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.#renderbuffer);

        switch (this.#type) {
            case RenderbufferTypes.Depth:
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
                break;
            default:
                throw '[Renderbuffer.constructor] invalid render buffer type.';
        }

        // TODO: あったほうがよい？
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }

    setSize(width: number, height: number) {
        const gl = this.#gpu.gl;

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.#renderbuffer);

        switch (this.#type) {
            case RenderbufferTypes.Depth:
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
                break;
        }

        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }
}
