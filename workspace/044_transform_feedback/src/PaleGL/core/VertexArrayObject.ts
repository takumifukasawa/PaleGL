import { GLObject } from '@/PaleGL/core/GLObject';
import { AttributeUsageType } from '@/PaleGL/constants.js';
import { IndexBufferObject } from '@/PaleGL/core/IndexBufferObject';
import { GPU } from '@/PaleGL/core/GPU';
import { Attribute } from '@/PaleGL/core/Attribute';

type VertexBufferObject = {
    name: string;
    vbo: WebGLBuffer;
    usage: number;
};

export class VertexArrayObject extends GLObject {
    private gpu: GPU;
    private vao: WebGLVertexArrayObject;
    private vboList: VertexBufferObject[] = [];
    private ibo: IndexBufferObject | null = null;

    get hasIndices() {
        return !!this.ibo;
    }

    get glObject() {
        return this.vao;
    }

    // get vboList() {
    // }

    getUsage(gl: WebGL2RenderingContext, usageType: AttributeUsageType) {
        switch (usageType) {
            case AttributeUsageType.StaticDraw:
                return gl.STATIC_DRAW;
            case AttributeUsageType.DynamicDraw:
                return gl.DYNAMIC_DRAW;
            default:
                throw '[VertexArrayObject.getUsage] invalid usage';
        }
    }

    constructor({ gpu, attributes = [], indices }: { gpu: GPU; attributes: Attribute[]; indices?: number[] | null }) {
        super();

        this.gpu = gpu;

        const gl = this.gpu.gl;
        const vao = gl.createVertexArray();
        if (!vao) {
            throw 'invalid vao';
        }
        this.vao = vao;

        // bind vertex array to webgl context
        // gl.bindVertexArray(this.vao);
        this.bind();

        attributes.forEach((attribute) => {
            this.setAttribute(attribute, true);
        });

        if (indices) {
            this.ibo = new IndexBufferObject({ gpu, indices });
        }

        // set attribute の方でやってるのでいらないはず
        // unbind array buffer
        // gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // unbind vertex array to webgl context
        // gl.bindVertexArray(null);
        this.unbind();

        // unbind index buffer
        if (this.ibo) {
            this.ibo.unbind();
        }
    }

    bind() {
        const { gl } = this.gpu;
        gl.bindVertexArray(this.glObject);
    }

    unbind() {
        const { gl } = this.gpu;
        gl.bindVertexArray(null);
    }

    setAttribute(attribute: Attribute, push = false) {
        const gl = this.gpu.gl;

        if (push) {
            // bind vertex array to webgl context
            gl.bindVertexArray(this.vao);
        }

        const { name, data, size, location, usageType, divisor } = attribute;
        const newLocation = location !== null && location !== undefined ? location : this.vboList.length;
        const vbo = gl.createBuffer();
        if (!vbo) {
            throw 'invalid vbo';
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        const usage = this.getUsage(gl, usageType);
        gl.bufferData(gl.ARRAY_BUFFER, data, usage);
        gl.enableVertexAttribArray(newLocation);

        switch (data.constructor) {
            case Float32Array:
                // size ... 頂点ごとに埋める数
                // stride is always 0 because buffer is not interleaved.
                // ref: https://developer.mozilla.org/ja/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
                gl.vertexAttribPointer(newLocation, size, gl.FLOAT, false, 0, 0);
                break;
            case Uint16Array:
                gl.vertexAttribIPointer(newLocation, size, gl.UNSIGNED_SHORT, 0, 0);
                break;
            default:
                throw '[VertexArrayObject.setAttribute] invalid data type';
        }

        if (divisor) {
            gl.vertexAttribDivisor(newLocation, divisor);
        }

        this.vboList.push({ name, vbo, usage });

        if (push) {
            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
    }

    updateAttribute(key: string, data: ArrayBufferView | BufferSource) {
        const gl = this.gpu.gl;
        // const targetVBO = this.vboList.find(({ name }) => key === name);
        const targetVBO = this.findVertexBufferObjectInfo(key);
        // if (!targetVBO) {
        //     throw 'invalid target vbo';
        // }
        gl.bindBuffer(gl.ARRAY_BUFFER, targetVBO.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data, targetVBO.usage);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    // setBuffer(key: string, buffer: WebGLBuffer) {
    //     const gl = this.gpu.gl;
    //     // const targetVBO = this.vboList.find(({ name }) => key === name);
    //     const targetVBO = this.findVertexBufferObjectInfo(key);
    //     // if (!targetVBO) {
    //     //     throw 'invalid target vbo';
    //     // }
    //     gl.bindVertexArray(this.vao);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    //     gl.bufferData(gl.ARRAY_BUFFER, , targetVBO.usage);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, null);
    //     gl.bindVertexArray(null);
    // }

    getBuffers() {
        return this.vboList.map(({ vbo }) => vbo);
    }

    // getBuffer(name: string) {
    //     const buffer = this.vboList.find(({ name: key }) => key === name);
    //     if (!buffer) {
    //         throw 'invalid name';
    //     }
    //     return buffer;
    // }

    findVertexBufferObjectInfo(key: string) {
        const vbo = this.vboList.find(({ name }) => key === name);
        if (!vbo) {
            throw 'invalid target vbo';
        }
        return vbo;
    }

    findBuffer(key: string) {
        const target = this.findVertexBufferObjectInfo(key);
        if (!target) {
            throw 'invalid name';
        }
        return target.vbo;
    }
}
