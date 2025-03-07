// import { GlObject } from '@/PaleGL/core/glObject.ts';
// import {GL_FRAMEBUFFER, GLColorAttachment} from '@/PaleGL/constants';
// import { GPU } from '@/PaleGL/core/GPU';
// 
// export class Framebuffer extends GlObject {
//     _framebuffer: WebGLFramebuffer;
//     _drawBufferList: GLColorAttachment[] = [];
//     _gpu;
// 
//     get drawBufferList() {
//         return this._drawBufferList;
//     }
// 
//     get glObject() {
//         return this._framebuffer;
//     }
// 
//     get hasMultipleDrawBuffers() {
//         return this._drawBufferList.length >= 2;
//     }
// 
//     registerDrawBuffer(drawBufferName: GLColorAttachment) {
//         this._drawBufferList.push(drawBufferName);
//     }
// 
//     constructor({ gpu }: { gpu: GPU }) {
//         super();
// 
//         this._gpu = gpu;
//         const gl = this._gpu.gl;
// 
//         const fb = gl.createFramebuffer()!;
//         // if (!fb) {
//         //     console.error('invalid framebuffer');
//         // }
//         this._framebuffer = fb;
//     }
// 
//     bind() {
//         const gl = this._gpu.gl;
//         gl.bindFramebuffer(GL_FRAMEBUFFER, this._framebuffer);
//     }
// 
//     unbind() {
//         const gl = this._gpu.gl;
//         gl.bindFramebuffer(GL_FRAMEBUFFER, null);
//     }
// }


import { createGLObject, GLObjectBase } from '@/PaleGL/core/glObject.ts';
import {GL_FRAMEBUFFER, GLColorAttachment} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';

export type Framebuffer = GLObjectBase<WebGLFramebuffer> & {
    drawBufferList: GLColorAttachment[];
};

export function createFramebuffer({ gpu }: { gpu: GPU }): Framebuffer {
    const { gl } = gpu;

    const fb = gl.createFramebuffer()!;
    // if (!fb) {
    //     console.error('invalid framebuffer');
    // }
    
    const drawBufferList: GLColorAttachment[] = [];
  
    return {
        ...createGLObject(gpu, fb),
        drawBufferList
    }
}

// get drawBufferList() {
//     return this._drawBufferList;
// }

// get glObject() {
//     return this._framebuffer;
// }

export function hasFramebufferMultipleDrawBuffers(framebuffer: Framebuffer) {
    return framebuffer.drawBufferList.length >= 2;
}

export function registerDrawBufferToFramebuffer(framebuffer: Framebuffer, drawBufferName: GLColorAttachment) {
    framebuffer.drawBufferList.push(drawBufferName);
}

export function bindFramebuffer(framebuffer: Framebuffer) {
    bindRawFramebuffer(framebuffer.gpu.gl, framebuffer.glObject);
}

export function unbindFramebuffer(framebuffer: Framebuffer) {
    unbindRawFramebuffer(framebuffer.gpu.gl);
}

function bindRawFramebuffer(gl: WebGL2RenderingContext, glObject: WebGLFramebuffer) {
    gl.bindFramebuffer(GL_FRAMEBUFFER, glObject);
}

function unbindRawFramebuffer(gl: WebGL2RenderingContext) {
    gl.bindFramebuffer(GL_FRAMEBUFFER, null);
}