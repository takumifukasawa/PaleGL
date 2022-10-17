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

    setUniform(uniformName, uniformType, value) {
        const gl = this.gl;
        switch (uniformType) {
            case UniformTypes.Matrix4:
                const location = gl.getUniformLocation(this.#shader.glObject, uniformName);
                gl.uniformMatrix4fv(location, false, value.transpose().elements);
                break;
        }
    }

    draw(drawCount, primitiveType, startOffset = 0) {
        const glPrimitiveType = this.#getGLPrimitive(primitiveType);
        const gl = this.gl;

        gl.useProgram(this.#shader.glObject);

        // uniforms
        Object.keys(this.#uniforms).forEach(uniformName => {
            const uniform = this.#uniforms[uniformName];
            this.setUniform(uniformName, uniform.type, uniform.value)
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