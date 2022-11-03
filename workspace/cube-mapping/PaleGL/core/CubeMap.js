import {GLObject} from "./GLObject.js";
import {CubeMapAxis} from "../constants.js";

export class CubeMap extends GLObject {
    #texture;
    
    get glObject() {
        return this.#texture;
    }

    constructor({gpu, images = {
        [CubeMapAxis.PositiveX]: null,
        [CubeMapAxis.NegativeX]: null,
        [CubeMapAxis.PositiveY]: null,
        [CubeMapAxis.NegativeY]: null,
        [CubeMapAxis.PositiveZ]: null,
        [CubeMapAxis.NegativeZ]: null,
    }}) {
        super();
        
        const gl = gpu.gl;
        
        this.#texture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.#texture);
        
        Object.keys(images).forEach((key) => {
            let axis = null;
            switch(key) {
                case CubeMapAxis.PositiveX:
                    axis = gl.TEXTURE_CUBE_MAP_POSITIVE_X;
                    break;
                case CubeMapAxis.NegativeX:
                    axis = gl.TEXTURE_CUBE_MAP_NEGATIVE_X;
                    break;
                case CubeMapAxis.PositiveY:
                    axis = gl.TEXTURE_CUBE_MAP_POSITIVE_Y;
                    break;
                case CubeMapAxis.NegativeY:
                    axis = gl.TEXTURE_CUBE_MAP_NEGATIVE_Y;
                    break;
                case CubeMapAxis.PositiveZ:
                    axis = gl.TEXTURE_CUBE_MAP_POSITIVE_Z;
                    break;
                case CubeMapAxis.NegativeZ:
                    axis = gl.TEXTURE_CUBE_MAP_NEGATIVE_Z;
                    break;
                default:
                    throw "invalid axis"
            }
            gl.texImage2D(axis, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[key]);
        });
        
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // TODO: unbindしない方がよい？
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
}