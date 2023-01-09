export class GLObject {
    get glObject() {
        throw "[GLObject.glObject] should implementation";
    }
    
    bind() {
        throw "[GLObject.bind] should implementation";
    }

    unbind() {
        throw "[GLObject.unbind] should implementation";
    }
}