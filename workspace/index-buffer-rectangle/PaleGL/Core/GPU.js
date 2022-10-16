
import { PrimitiveTypes } from "./constants.js";

export class GPU {
    gl;
    #shader;
    #vao;
    #ibo;
    
    constructor ({ gl }) {
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
        switch(primitiveType) {
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
        gl.useProgram(this.#shader.glObject);
        gl.bindVertexArray(this.#vao.glObject);
        if(this.#ibo) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo.glObject);
            gl.drawElements(glPrimitiveType, drawCount, gl.UNSIGNED_SHORT, startOffset);
        } else {
            gl.drawArrays(glPrimitiveType, startOffset, drawCount);
        }
    }
}