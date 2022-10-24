import {GLObject} from "./GLObject.js";

export class Texture extends GLObject {
    #texture;
    
    get glObject() {
        return this.#texture;
    }
    
    constructor({ gpu, img }) {
        super();
        
        const gl = gpu.gl;
       
        this.#texture = gl.createTexture();
        
        // bind texture object to gl
        gl.bindTexture(gl.TEXTURE_2D, this.#texture);
        // set img to texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        
        // TODO: pass generate option
        gl.generateMipmap(gl.TEXTURE_2D);
       
        // unbind img
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}