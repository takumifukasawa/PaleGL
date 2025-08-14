import {
    GL_FRAMEBUFFER,
    GL_TEXTURE_2D,
    GLColorAttachment,
    GLColorAttachments,
    RenderTargetKinds,
    TextureFilterType,
    TextureFilterTypes,
    TextureType,
} from '@/PaleGL/constants';
import {
    bindFramebuffer,
    createFramebuffer,
    Framebuffer,
    registerDrawBufferToFramebuffer,
    unbindFramebuffer,
} from '@/PaleGL/core/framebuffer.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createRenderTargetBase, RenderTargetBase } from '@/PaleGL/core/renderTarget.ts';
import { createTexture, Texture } from '@/PaleGL/core/texture.ts';

export type MultipleRenderTargetOptions = {
    gpu: Gpu;
    name: string;
    width: number;
    height: number;
    minFilter?: TextureFilterType;
    magFilter?: TextureFilterType;
    textureTypes: TextureType[];
};

export type MultipleRenderTarget = RenderTargetBase & {
    gpu: Gpu;
    name: string;
    width: number;
    height: number;
    framebuffer: Framebuffer;
    textures: Texture[];
};

// TODO: depth texture を resize しなくていいようにしたい。なぜなら depthprepassでリサイズしてるから
export function createMultipleRenderTargets({
    gpu,
    name,
    width = 1,
    height = 1,
    textureTypes,
    minFilter = TextureFilterTypes.Linear,
    magFilter = TextureFilterTypes.Linear,
}: MultipleRenderTargetOptions): MultipleRenderTarget {
    const textures: Texture[] = [];

    const gl = gpu.gl;

    const framebuffer = createFramebuffer({ gpu });
    bindFramebuffer(framebuffer);

    for (let i = 0; i < textureTypes.length; i++) {
        const type = textureTypes[i];
        const attachment = GLColorAttachments[i];
        const texture = createTexture({
            name: `${name}_texture_${i}`,
            gpu,
            width,
            height,
            mipmap: false,
            type,
            minFilter,
            magFilter,
        });
        gl.framebufferTexture2D(GL_FRAMEBUFFER, attachment, GL_TEXTURE_2D, texture.glObject, 0);
        registerDrawBufferToFramebuffer(framebuffer, attachment as GLColorAttachment);
        textures.push(texture);
    }

    // unbind
    gl.bindTexture(GL_TEXTURE_2D, null);
    unbindFramebuffer(framebuffer);

    return {
        ...createRenderTargetBase(RenderTargetKinds.MRT, false),
        gpu,
        name,
        width,
        height,
        framebuffer,
        textures,
    };
}

export function readPixelsFromMultipleRenderTarget(mrt: MultipleRenderTarget, attachmentIndex: number): Float32Array {
    const gl = mrt.gpu.gl;
    bindFramebuffer(mrt.framebuffer);

    const width = mrt.width;
    const height = mrt.height;

    gl.readBuffer(GLColorAttachments[attachmentIndex]);

    const pixels = new Float32Array(width * height * 4); // RGBA
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, pixels);

    unbindFramebuffer(mrt.framebuffer);

    return pixels;
}
