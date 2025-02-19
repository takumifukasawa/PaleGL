export class GLObject {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    get glObject(): WebGLProgram {
        console.error('[GLObject.glObject] should implementation');
    }

    bind(): void {
        console.error('[GLObject.bind] should implementation');
    }

    unbind(): void {
        console.error('[GLObject.unbind] should implementation');
    }
    
    dispose(): void {
        console.error('[GLObject.dispose] should implementation');
    }
}
