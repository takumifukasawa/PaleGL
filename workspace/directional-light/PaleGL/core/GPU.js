import {BlendTypes, PrimitiveTypes, UniformTypes} from "./../constants.js";
import {Texture} from "./Texture.js";

const createWhite1x1 = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1;
    canvas.height = 1;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 1, 1);
    return canvas;
};

export class GPU {
    gl;
    #shader;
    #vao;
    #ibo;
    #uniforms;
    dummyTexture;

    constructor({gl}) {
        this.gl = gl;
        this.dummyTexture = new Texture({ gpu: this, img: createWhite1x1() });
    }

    setShader(shader) {
        this.#shader = shader;
    }

    setVertexArrayObject(vao) {
        this.#vao = vao;
    }

    setIndexBufferObject(ibo) {
        this.#ibo = ibo;
    }

    setUniforms(uniforms) {
        this.#uniforms = uniforms;
    }

    setSize(x, y, width, height) {
        this.gl.viewport(x, y, width, height);
    }

    flush() {
        this.gl.flush();
    }

    clear(r, g, b, a) {
        const gl = this.gl;
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    #getGLPrimitive(primitiveType) {
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
    
    draw(drawCount, primitiveType, blendType, startOffset = 0) {
        const glPrimitiveType = this.#getGLPrimitive(primitiveType);
        const gl = this.gl;
       
        // culling
        // TODO: cull type
        gl.enable(gl.CULL_FACE);

        // depth test
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
     
        // TODO: renderer側でやるべき？
        // blend
        // gl.blendFunc(src, dest)
        // - src: current draw
        // - dest: drawn 
        switch(blendType) {
            case BlendTypes.Opaque:
                gl.depthMask(true);
                gl.disable(gl.BLEND);
                // for enabled blend
                // gl.blendFunc(gl.ONE, gl.ZERO);
                break;
            case BlendTypes.Transparent:
                gl.depthMask(false);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                break;
            case BlendTypes.Additive:
                gl.depthMask(false);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                break;
            default:
                throw "invalid blend type";
        }

        gl.useProgram(this.#shader.glObject);
        
        let activeTextureIndex = 0;

        // uniforms
        Object.keys(this.#uniforms).forEach(uniformName => {
            const uniform = this.#uniforms[uniformName];
            let location;
            switch (uniform.type) {
                case UniformTypes.Matrix4:
                    location = gl.getUniformLocation(this.#shader.glObject, uniformName);
                    gl.uniformMatrix4fv(location, false, uniform.value.elements);
                    break;
                case UniformTypes.Texture:
                    location = gl.getUniformLocation(this.#shader.glObject, uniformName);
                    const activeTextureKey = gl[`TEXTURE${activeTextureIndex}`];
                    gl.activeTexture(activeTextureKey);
                    gl.bindTexture(gl.TEXTURE_2D, uniform.value ? uniform.value.glObject : this.dummyTexture.glObject);
                    gl.uniform1i(location, activeTextureIndex);
                    activeTextureIndex++;
                    break;
                case UniformTypes.Struct:
                    Object.keys(uniform.value).forEach(key => {
                        location = gl.getUniformLocation(this.#shader.glObject, `${uniformName}.${key}`);
                        switch(uniform.value[key].type) {
                            case UniformTypes.Vector3:
                                gl.uniform3fv(location, uniform.value[key].value.elements);
                                break;
                            case UniformTypes.Float:
                                gl.uniform1f(location, uniform.value[key].value);
                        }
                    });
                    break;
                default:
                    throw "invalid uniform type";
            }
        });
        
        // set vertex
        gl.bindVertexArray(this.#vao.glObject);

        if (this.#ibo) { // draw by indices
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo.glObject);
            gl.drawElements(glPrimitiveType, drawCount, gl.UNSIGNED_SHORT, startOffset);
        } else { // draw by array
            gl.drawArrays(glPrimitiveType, startOffset, drawCount);
        }
    }
}