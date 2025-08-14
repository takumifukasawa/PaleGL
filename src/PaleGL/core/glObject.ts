import { Gpu } from '@/PaleGL/core/gpu.ts';

export class GlObject {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    get glObject(): WebGLProgram {
        console.error('[GlObject.glObject] should implementation');
    }

    bind(): void {
        console.error('[GlObject.bind] should implementation');
    }

    unbind(): void {
        console.error('[GlObject.unbind] should implementation');
    }

    dispose(): void {
        console.error('[GlObject.dispose] should implementation');
    }
}

export type RawGLObject =
    WebGLShader |
    WebGLVertexArrayObject |
    WebGLBuffer
    ;

export type GLObjectBase<T extends RawGLObject> = {
    gpu: Gpu;
    glObject: T
}

export function createGLObject<T extends RawGLObject>(gpu: Gpu, glObject: T) {
    return { gpu, glObject };
}
