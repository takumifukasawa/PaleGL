export class AbstractRenderTarget {
    isSwappable: boolean; // bool

    constructor({isSwappable = false}: { isSwappable: boolean } = {}) {
        this.isSwappable = isSwappable;
    }

    get read(): AbstractRenderTarget {
        throw "[AbstractRenderTarget] should implementation 'read' getter";
    }

    get write(): AbstractRenderTarget {
        throw "[AbstractRenderTarget] should implementation 'write' getter";
    }
}
