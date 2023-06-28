
export class AbstractRenderTarget {
    isSwappable; // bool
    
    constructor({ isSwappable = false } = {}) {
        this.isSwappable = isSwappable;
    }
    
    get read() {
        throw "[AbstractRenderTarget] should implementation 'read' getter";
    }
    get write() {
        throw "[AbstractRenderTarget] should implementation 'write' getter";
    }
}