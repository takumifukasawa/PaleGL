
import { PrimitiveTypes } from "./constants.js";

export class GPU {
    gl;
    #shader;
    #vao;
    
    constructor ({ gl }) {
        this.gl = gl;
    }
    
    setShader(shader) {
        this.#shader = shader;
    }
    
    setVertexArrayObject(vao) {
        this.#vao = vao;
    }

    setSize(width, height) {
        this.gl.viewport(0, 0, width, height);
    }
    
    flush() {
        this.gl.flush();
    }
    
    #getGLPrimitive(primitiveType) {
        switch(primitiveType) {
            case PrimitiveTypes.Points:
                return this.gl.POINTS;
            case PrimitiveTypes.Lines:
                return this.gl.LINES;
            case PrimitiveTypes.Triangles:
                return this.gl.TRIANGLES;
            default:
                throw "invalid primitive type";
        }
    }
    
    draw(vertexCount, primitiveType, startVertexOffset = 0) {
        this.gl.useProgram(this.#shader.glObject);
        const glPrimitiveType = this.#getGLPrimitive(primitiveType);
        this.gl.bindVertexArray(this.#vao.glObject);
        this.gl.drawArrays(glPrimitiveType, startVertexOffset, vertexCount);
    }
}