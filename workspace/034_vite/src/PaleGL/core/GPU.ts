import {
    BlendType,
    BlendTypes,
    FaceSide,
    PrimitiveType,
    PrimitiveTypes,
    TextureWrapTypes, UniformType,
    UniformTypes
} from "./../constants";
import {Texture} from "./Texture";
import {Shader} from "./Shader";
import {VertexArrayObject} from "./VertexArrayObject";
import {Framebuffer} from "./Framebuffer";
import {Uniforms, UniformStructValue, UniformValue} from "../materials/Material";
import {Vector2} from "../math/Vector2";
import {Vector3} from "../math/Vector3";
import {Matrix4} from "../math/Matrix4";
import {Color} from "../math/Color";
import {CubeMap} from "./CubeMap";

const createWhite1x1: () => HTMLCanvasElement = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw "invalid context";
    }
    canvas.width = 1;
    canvas.height = 1;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 1, 1);
    return canvas;
};

export class GPU {
    gl: WebGL2RenderingContext;
    private shader: Shader | null = null;
    private vao: VertexArrayObject | null = null;
    private uniforms: Uniforms = {};
    dummyTexture: Texture;

    constructor({gl}: { gl: WebGL2RenderingContext }) {
        this.gl = gl;
        this.dummyTexture = new Texture({
            gpu: this,
            img: createWhite1x1(),
            wrapS: TextureWrapTypes.Repeat,
            wrapT: TextureWrapTypes.Repeat,
        });
    }

    setShader(shader: Shader) {
        this.shader = shader;
    }

    setVertexArrayObject(vao: VertexArrayObject) {
        this.vao = vao;
    }

    setUniforms(uniforms: Uniforms) {
        this.uniforms = uniforms;
    }

    setSize(x: number, y: number, width: number, height: number) {
        this.gl.viewport(x, y, width, height);
    }

    setFramebuffer(framebuffer: Framebuffer | null) {
        const gl = this.gl;
        if (!framebuffer) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.glObject);
        if (framebuffer.hasMultipleDrawBuffers) {
            gl.drawBuffers(framebuffer.drawBufferList);
        }

        // tmp
        // !!framebuffer
        //     ? gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.glObject)
        //     : gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    flush() {
        this.gl.flush();
    }

    clear(r: number, g: number, b: number, a: number) {
        const gl = this.gl;
        // TODO: mask設定は外側からやった方がよい気がする
        gl.depthMask(true);
        gl.colorMask(true, true, true, true);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // gl.depthMask(true);
        // gl.colorMask(true, true, true, true);
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    #getGLPrimitive(primitiveType: PrimitiveType) {
        const gl = this.gl;
        switch (primitiveType) {
            case PrimitiveTypes.Points:
                return gl.POINTS;
            case PrimitiveTypes.Lines:
                return gl.LINES;
            case PrimitiveTypes.Triangles:
                return gl.TRIANGLES;
            default:
                throw "invalid primitive type";
        }
    }

    // TODO:
    // - start offset と instanceCount は逆の方が良い
    // - なんなら object destructuring の方がよさそう
    draw(
        drawCount: number,
        primitiveType: PrimitiveType,
        depthTest: boolean,
        depthWrite: boolean,
        blendType: BlendType,
        faceSide: FaceSide,
        instanceCount: number | null,
        startOffset = 0
    ) {
        const glPrimitiveType = this.#getGLPrimitive(primitiveType);
        const gl = this.gl;

        // culling
        switch (faceSide) {
            case FaceSide.Front:
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.BACK);
                gl.frontFace(gl.CCW);
                break;
            case FaceSide.Back:
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.FRONT);
                gl.frontFace(gl.CCW);
                break;
            case FaceSide.Double:
                gl.disable(gl.CULL_FACE);
                gl.frontFace(gl.CCW);
                break;
            default:
                throw "invalid face side";
        }

        // depth write
        gl.depthMask(depthWrite);
        // for debug
        // console.log(gl.getParameter(gl.DEPTH_WRITEMASK));

        // depth test
        if (depthTest) {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL); // TODO: set by arg
        } else {
            gl.disable(gl.DEPTH_TEST);
        }

        // TODO: renderer側でやるべき？
        // blend
        // gl.blendFunc(src, dest)
        // - src: current draw
        // - dest: drawn 
        switch (blendType) {
            case BlendTypes.Opaque:
                gl.disable(gl.BLEND);
                // pattern_2: for enabled blend
                // gl.enable(gl.BLEND);
                // gl.blendFunc(gl.ONE, gl.ZERO);
                break;
            case BlendTypes.Transparent:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                break;
            case BlendTypes.Additive:
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                break;
            default:
                throw "invalid blend type";
        }

        if(!this.shader) {
            throw "shader is not set";
        }
        if(!this.vao) {
            throw "vao is not set";
        }

        gl.useProgram(this.shader.glObject);

        let activeTextureIndex = 0;

        const setUniformValue = (type: UniformType, uniformName: string, value: UniformValue) => {
            const gl = this.gl;
            const location = gl.getUniformLocation(this.shader!.glObject, uniformName);
            // TODO:
            // - nullなとき,値がおかしいときはセットしない方がよいけど、あえてエラーを出したいかもしれない
            switch (type) {
                case UniformTypes.Int:
                    gl.uniform1i(location, value as number);
                    break;
                case UniformTypes.Float:
                    gl.uniform1f(location, value as number);
                    break;
                case UniformTypes.FloatArray:
                    gl.uniform1fv(location, value as Float32Array);
                    break;
                case UniformTypes.Vector2:
                    gl.uniform2fv(location, (value as Vector2).elements);
                    break;
                case UniformTypes.Vector2Array:
                    gl.uniform2fv(location, (value as Vector2[]).map(v => [...v.elements]).flat());
                    break;
                case UniformTypes.Vector3:
                    gl.uniform3fv(location, (value as Vector3).elements);
                    break;
                case UniformTypes.Matrix4:
                    // arg[1] ... use transpose.
                    gl.uniformMatrix4fv(location, false, (value as Matrix4).elements);
                    break;
                case UniformTypes.Matrix4Array:
                    if (value) {
                        // arg[1] ... use transpose.
                        gl.uniformMatrix4fv(location, false, (value as Matrix4[]).map(v => [...v.elements]).flat());
                    }
                    break;
                case UniformTypes.Color:
                    gl.uniform4fv(location, (value as Color).elements);
                    break;
                case UniformTypes.ColorArray:
                    if (value) {
                        // arg[1] ... use transpose.
                        gl.uniform4fv(location, (value as Color[]).map(v => [...v.elements]).flat());
                    }
                    break;
                case UniformTypes.Texture:
                    gl.activeTexture(gl.TEXTURE0 + activeTextureIndex);
                    gl.bindTexture(
                        gl.TEXTURE_2D,
                        value ? (value as Texture).glObject : this.dummyTexture.glObject
                    );
                    gl.uniform1i(location, activeTextureIndex);
                    activeTextureIndex++;
                    break;
                case UniformTypes.CubeMap:
                    // TODO: valueのguardなくて大丈夫なはず
                    if (value) {
                        gl.activeTexture(gl.TEXTURE0 + activeTextureIndex);
                        gl.bindTexture(
                            gl.TEXTURE_CUBE_MAP,
                            value ? (value as CubeMap).glObject : this.dummyTexture.glObject
                        );
                        gl.uniform1i(location, activeTextureIndex);
                        activeTextureIndex++;
                    }
                    break;
                default:
                    throw `invalid uniform - name: ${uniformName}, type: ${type}`;
            }
        };

        // uniforms
        Object.keys(this.uniforms).forEach(uniformName => {
            const uniform = this.uniforms[uniformName];
            if (uniform.type === UniformTypes.Struct) {
                // default
                // Object.keys(uniform.value).forEach(key => {
                //     setUniformValue(uniform.value[key].type, `${uniformName}.${key}`, uniform.value[key].value)
                // });
                const uniformStructValue = uniform.value as UniformStructValue;
                Object.keys(uniformStructValue).forEach(key => {
                    // setUniformValue(uniform.value[key].type, `${uniformName}.${key}`, uniform.value[key].value)
                    setUniformValue(uniformStructValue[key].type, `${uniformName}.${key}`, uniformStructValue[key].value);
                });
            } else {
                setUniformValue(uniform.type, uniformName, uniform.value);
                // console.log(uniformName === "uDepthTexture");
                // console.log(uniform.type, uniformName, uniform.value);
            }
        });

        // set vertex
        gl.bindVertexArray(this.vao.glObject);

        // if (this.#ibo) {
        if (this.vao.hasIndices) {
            // draw by indices
            // drawCount ... use indices count
            if (instanceCount) {
                gl.drawElementsInstanced(glPrimitiveType, drawCount, gl.UNSIGNED_SHORT, startOffset, instanceCount)
            } else {
                gl.drawElements(glPrimitiveType, drawCount, gl.UNSIGNED_SHORT, startOffset);
            }
        } else {
            // draw by array
            // draw count ... use vertex num
            if (instanceCount) {
                gl.drawArraysInstanced(glPrimitiveType, startOffset, drawCount, instanceCount);
            } else {
                gl.drawArrays(glPrimitiveType, startOffset, drawCount);
            }
        }

        // unbind when end render
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
}
