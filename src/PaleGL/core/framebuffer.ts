
import { createGLObject, GLObjectBase } from '@/PaleGL/core/glObject.ts';
import {GL_FRAMEBUFFER, GLColorAttachment} from '@/PaleGL/constants';
import { Gpu } from '@/PaleGL/core/gpu.ts';

export type Framebuffer = GLObjectBase<WebGLFramebuffer> & {
    drawBufferList: GLColorAttachment[];
};

export function createFramebuffer({ gpu }: { gpu: Gpu }): Framebuffer {
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
