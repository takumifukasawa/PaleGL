import {PrimitiveTypes, UniformTypes} from "./constants.js";

export class GPU {
    gl;
    #shader;
    #vao;
    #ibo;
    #uniforms;

    constructor({gl}) {
        this.gl = gl;
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

    setSize(width, height) {
        this.gl.viewport(0, 0, width, height);
    }

    flush() {
        this.gl.flush();
    }

    clear(r, g, b, a) {
        const gl = this.gl;
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);
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

    draw(drawCount, primitiveType, startOffset = 0) {
        const glPrimitiveType = this.#getGLPrimitive(primitiveType);
        const gl = this.gl;
       
        // culling
        gl.enable(gl.CULL_FACE);
       
        // depth for opaque
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.useProgram(this.#shader.glObject);
        
        let activeTextureIndex = 0;

        // uniforms
        Object.keys(this.#uniforms).forEach(uniformName => {
            const uniform = this.#uniforms[uniformName];
            if(!uniform.value) {
                return;
            }
            const location = gl.getUniformLocation(this.#shader.glObject, uniformName);
            switch (uniform.type) {
                case UniformTypes.Matrix4:
                    gl.uniformMatrix4fv(location, false, uniform.value.elements);
                    break;
                case UniformTypes.Texture:
                    const activeTextureKey = gl[`TEXTURE${activeTextureIndex}`];
                    gl.activeTexture(activeTextureKey);
                    gl.bindTexture(gl.TEXTURE_2D, uniform.value.glObject);
                    gl.uniform1i(location, activeTextureIndex);
                    activeTextureIndex++;
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