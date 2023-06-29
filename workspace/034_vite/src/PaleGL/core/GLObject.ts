export class GLObject {
    get glObject(): WebGLProgram {
        throw "[GLObject.glObject] should implementation";
    }
    
    bind(): void {
        throw "[GLObject.bind] should implementation";
    }

    unbind(): void {
        throw "[GLObject.unbind] should implementation";
    }
}