
export class RenderTarget {
    #texture;
    #framebuffer;
    
    get texture() {
        return this.#texture;
    }
    
    get framebuffer() {
        return this.#framebuffer;
    }
    
    constructor({ gpu, width = 1, height = 1 }) {
        const gl = gpu.gl;
        
        this.#texture = new Texture({
            gpu,
            width: 1,
            height: 1,
            mipmap: false,
        })
    }
}