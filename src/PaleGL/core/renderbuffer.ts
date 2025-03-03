// import { GlObject } from '@/PaleGL/core/glObject.ts';
// import { RenderbufferType, RenderbufferTypes } from '@/PaleGL/constants';
// import { GPU } from '@/PaleGL/core/GPU';
// 
// export class Renderbuffer extends GlObject {
//     _gpu: GPU;
//     _type: RenderbufferType;
//     _renderbuffer: WebGLRenderbuffer;
// 
//     get glObject() {
//         return this._renderbuffer;
//     }
// 
//     constructor({ gpu, type, width, height }: { gpu: GPU; type: RenderbufferType; width: number; height: number }) {
//         super();
// 
//         this._gpu = gpu;
//         this._type = type;
// 
//         const gl = this._gpu.gl;
// 
//         const rb = gl.createRenderbuffer()!;
//         this._renderbuffer = rb;
// 
//         gl.bindRenderbuffer(gl.RENDERBUFFER, this._renderbuffer);
// 
//         switch (this._type) {
//             case RenderbufferTypes.Depth:
//                 gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
//                 break;
//             default:
//                 console.error('[Renderbuffer.constructor] invalid render buffer type.');
//         }
// 
//         // TODO: あったほうがよい？
//         gl.bindRenderbuffer(gl.RENDERBUFFER, null);
//     }
// 
//     setSize(width: number, height: number) {
//         const gl = this._gpu.gl;
// 
//         gl.bindRenderbuffer(gl.RENDERBUFFER, this._renderbuffer);
// 
//         switch (this._type) {
//             case RenderbufferTypes.Depth:
//                 gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
//                 break;
//         }
// 
//         gl.bindRenderbuffer(gl.RENDERBUFFER, null);
//     }
// }


import { createGLObject, GLObjectBase } from '@/PaleGL/core/glObject.ts';
import { RenderbufferType, RenderbufferTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';

export type Renderbuffer = GLObjectBase<WebGLRenderbuffer> & {
    type: RenderbufferType;
};

export function createRenderbuffer(gpu: GPU, type: RenderbufferType, width: number, height: number): Renderbuffer {
    const gl = gpu.gl;

    const renderbuffer = gl.createRenderbuffer()!;

    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

    switch (type) {
        case RenderbufferTypes.Depth:
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
            break;
        default:
            console.error('[Renderbuffer.constructor] invalid render buffer type.');
    }

    // TODO: あったほうがよい？
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return {
        ...createGLObject(gpu, renderbuffer),
        type,
    };
}

export function setRenderbufferSize(renderbuffer: Renderbuffer, width: number, height: number) {
    const gl = renderbuffer.gpu.gl;
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer.glObject);

    switch (renderbuffer.type) {
        case RenderbufferTypes.Depth:
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
            break;
    }

    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
}
