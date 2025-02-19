import { GLObject } from '@/PaleGL/core/GLObject';
import { RenderbufferType, RenderbufferTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';

export class Renderbuffer extends GLObject {
    _gpu: GPU;
    _type: RenderbufferType;
    _renderbuffer: WebGLRenderbuffer;

    get glObject() {
        return this._renderbuffer;
    }

    constructor({ gpu, type, width, height }: { gpu: GPU; type: RenderbufferType; width: number; height: number }) {
        super();

        this._gpu = gpu;
        this._type = type;

        const gl = this._gpu.gl;

        const rb = gl.createRenderbuffer()!;
        this._renderbuffer = rb;

        gl.bindRenderbuffer(gl.RENDERBUFFER, this._renderbuffer);

        switch (this._type) {
            case RenderbufferTypes.Depth:
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
                break;
            default:
                console.error('[Renderbuffer.constructor] invalid render buffer type.');
        }

        // TODO: あったほうがよい？
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }

    setSize(width: number, height: number) {
        const gl = this._gpu.gl;

        gl.bindRenderbuffer(gl.RENDERBUFFER, this._renderbuffer);

        switch (this._type) {
            case RenderbufferTypes.Depth:
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
                break;
        }

        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }
}
