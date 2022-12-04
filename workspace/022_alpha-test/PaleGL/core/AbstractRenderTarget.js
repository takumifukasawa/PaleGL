
export class AbstractRenderTarget {
    isSwappable; // bool
    
    constructor({ isSwappable = false } = {}) {
        this.isSwappable = isSwappable;
    }

    get read() {
        throw "should implementation";
    }
    get write() {
        throw "should implementation";
    }
}