import {GLObject} from "./GLObject.js";
import {CubeMapAxis} from "../constants.js";
import {GPU} from "./GPU";

type CubeMapArgs =
    {
        gpu: GPU, images: {
            [key in CubeMapAxis]: HTMLImageElement | null
        }
    };

export class CubeMap extends GLObject {
    #texture: WebGLTexture;

    get glObject() {
        return this.#texture;
    }

    constructor({
                    gpu, images = {
            [CubeMapAxis.PositiveX]: null,
            [CubeMapAxis.NegativeX]: null,
            [CubeMapAxis.PositiveY]: null,
            [CubeMapAxis.NegativeY]: null,
            [CubeMapAxis.PositiveZ]: null,
            [CubeMapAxis.NegativeZ]: null,
        }
                }: CubeMapArgs) {
        super();

        const gl = gpu.gl;

        // NOTE: 作れるはずという前提
        this.#texture = gl.createTexture()!;

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.#texture);

        // cubemapの場合は html img でも falseで良い。というのがよくわかってない。そういうもの？
        // ただ、たしかに反転すると上下が反転して見た目がおかしくなる
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        Object.keys(images).forEach((key) => {
            let axis = null;
            switch (key) {
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
            if (images[key] === null) {
                throw `invalid img: ${key}`;
            }
            // TODO: なんで non null assertion 必要？？
            gl.texImage2D(axis, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[key]!);
        });

        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // TODO: unbindしない方がよい？
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
}
