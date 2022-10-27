import {GLObject} from "./GLObject.js";
import {TextureFilterTypes, TextureWrapTypes} from "./constants.js";

export class Texture extends GLObject {
    #texture;
    #img;
    #gpu;

    get glObject() {
        return this.#texture;
    }

    constructor({
        gpu,
        img,
        width, height,
        mipmap = false,
        minFilter = TextureFilterTypes.Linear, magFilter = TextureFilterTypes.Linear,
        wrapS = TextureWrapTypes.ClampToEdge, wrapT = TextureWrapTypes.ClampToEdge,
        flipY = false,
    }) {
        super();

        this.#gpu = gpu;
        const gl = this.#gpu.gl;

        this.#img = img || null;

        this.#texture = gl.createTexture();

        // bind texture object to gl
        gl.bindTexture(gl.TEXTURE_2D, this.#texture);

        // mipmap settings
        if (mipmap) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        
        // filter settings
        switch(minFilter) {
            case TextureFilterTypes.Linear:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                break;
            case TextureFilterTypes.Linear:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                break;
        }
        
        // wrap settings
        switch(wrapS) {
            case TextureWrapTypes.ClampToEdge:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                break;
            case TextureWrapTypes.Repeat:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                break;
        }
        switch(wrapT) {
            case TextureWrapTypes.ClampToEdge:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                break;
            case TextureWrapTypes.Repeat:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                break;
        }

        if (width && height) {
            // for render target
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.#img);
        } else {
            // set img to texture
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.#img);
        }

        // flipY
        if (this.#img || flipY) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        }

        // unbind img
        // gl.bindTexture(gl.TEXTURE_2D, null);
    }
    
    setSize(width, height) {
        const gl = this.#gpu.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.#texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.#img);
        // gl.bindTexture(gl.TEXTURE_2D, null);
    }
}