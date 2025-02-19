import { GLObject } from '@/PaleGL/core/GLObject';
// import { AttributeUsageType } from '@/PaleGL/constants.js';
import { IndexBufferObject } from '@/PaleGL/core/IndexBufferObject';
import { getAttributeUsage, GPU } from '@/PaleGL/core/GPU';
import { Attribute } from '@/PaleGL/core/Attribute';
import { GL_ARRAY_BUFFER, GL_FLOAT, GL_UNSIGNED_SHORT } from '@/PaleGL/constants.ts';

type VertexBufferObject = {
    name: string;
    vbo: WebGLBuffer;
    usage: number;
    location: number;
    size: number;
    divisor: number;
};

export class VertexArrayObject extends GLObject {
    _gpu: GPU;
    _vao: WebGLVertexArrayObject;
    _vboList: VertexBufferObject[] = [];
    _ibo: IndexBufferObject | null = null;

    /**
     *
     */
    get hasIndices() {
        return !!this._ibo;
    }

    /**
     *
     */
    get glObject() {
        return this._vao;
    }

    constructor({ gpu, attributes = [], indices }: { gpu: GPU; attributes: Attribute[]; indices?: number[] | null }) {
        super();

        this._gpu = gpu;

        const gl = this._gpu.gl;
        const vao = gl.createVertexArray()!;
        // if (!vao) {
        //     console.error('invalid vao');
        // }
        this._vao = vao;

        // bind vertex array to webgl context
        // gl.bindVertexArray(this.vao);
        this.bind();

        attributes.forEach((attribute) => {
            // this.setAttribute(attribute, true);
            this.setAttribute(attribute);
        });

        if (indices) {
            this._ibo = new IndexBufferObject({ gpu, indices });
        }

        // set attribute の方でやってるのでいらないはず
        // unbind array buffer
        // gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // unbind vertex array to webgl context
        // gl.bindVertexArray(null);
        this.unbind();

        // unbind index buffer
        if (this._ibo) {
            this._ibo.unbind();
        }
    }


    /**
     *
     */
    bind() {
        const { gl } = this._gpu;
        gl.bindVertexArray(this.glObject);
    }

    /**
     *
     */
    unbind() {
        const { gl } = this._gpu;
        gl.bindVertexArray(null);
    }

    /**
     *
     * @param attribute
     * @param push
     */
    // setAttribute(attribute: Attribute, push = false) {
    setAttribute(attribute: Attribute) {
        const gl = this._gpu.gl;

        // if (push) {
        // bind vertex array to webgl context
        gl.bindVertexArray(this._vao);
        // }

        const { name, data, size, location, usageType, divisor } = attribute;
        const newLocation = location !== null && location !== undefined ? location : this._vboList.length;
        const vbo = gl.createBuffer()!;
        gl.bindBuffer(GL_ARRAY_BUFFER, vbo);
        const usage = getAttributeUsage(usageType);
        gl.bufferData(GL_ARRAY_BUFFER, data, usage);
        gl.enableVertexAttribArray(newLocation);

        switch (data.constructor) {
            case Float32Array:
                // size ... 頂点ごとに埋める数
                // stride is always 0 because buffer is not interleaved.
                // ref: https://developer.mozilla.org/ja/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
                gl.vertexAttribPointer(newLocation, size, GL_FLOAT, false, 0, 0);
                break;
            case Uint16Array:
                gl.vertexAttribIPointer(newLocation, size, GL_UNSIGNED_SHORT, 0, 0);
                break;
            default:
                console.error('[VertexArrayObject.setAttribute] invalid data type');
        }

        if (divisor) {
            gl.vertexAttribDivisor(newLocation, divisor);
        }

        this._vboList.push({ name, vbo, usage, location, size, divisor });

        // if (push) {
        gl.bindVertexArray(null);
        gl.bindBuffer(GL_ARRAY_BUFFER, null);
        // }
    }
    
    getBufferSubData(key: string, index: number, elementsNum: number) {
        const { gl } = this._gpu;
        const vboInfo = this.findVertexBufferObjectInfo(key);
        const offset = index * elementsNum * Float32Array.BYTES_PER_ELEMENT;
        const data = new Float32Array(elementsNum);
        gl.bindBuffer(GL_ARRAY_BUFFER, vboInfo!.vbo);
        gl.getBufferSubData(GL_ARRAY_BUFFER, offset, data);
        gl.bindBuffer(GL_ARRAY_BUFFER, null);
        return data;
    }

    /**
     *
     * @param key
     * @param data
     */
    updateBufferData(key: string, data: ArrayBufferView | BufferSource) {
        const { gl } = this._gpu;
        const vboInfo = this.findVertexBufferObjectInfo(key);

        // performance overhead
        // gl.bindBuffer(gl.ARRAY_BUFFER, vboInfo.vbo);
        // gl.bufferData(gl.ARRAY_BUFFER, data, vboInfo.usage);
        // gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // optimize
        gl.bindBuffer(GL_ARRAY_BUFFER, vboInfo!.vbo);
        gl.bufferSubData(GL_ARRAY_BUFFER, 0, data);
        gl.bindBuffer(GL_ARRAY_BUFFER, null);
    }

    updateBufferSubData(key: string, index: number, data: ArrayBufferView | BufferSource) {
        const { gl } = this._gpu;
        const vboInfo = this.findVertexBufferObjectInfo(key);
        const offset = index * data.byteLength;
        gl.bindBuffer(GL_ARRAY_BUFFER, vboInfo!.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, offset, data);
        gl.bindBuffer(GL_ARRAY_BUFFER, null);
    }

    /**
     *
     * @param key
     * @param buffer
     */
    replaceBuffer(key: string, buffer: WebGLBuffer) {
        const { gl } = this._gpu;

        // const { location, size } = this.findVertexBufferObjectInfo(key);
        const index = this.findVertexBufferObjectInfoIndex(key);
        if(index === null) {
            console.error('invalid target vbo');
        }
        const { location, size } = this._vboList[index!];

        this.bind();

        gl.bindBuffer(GL_ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(location);
        // TODO: 毎フレームやるの重くない？大丈夫？
        gl.vertexAttribPointer(location, size, GL_FLOAT, false, 0, 0);
        // divisorはもう一度指定しなくてもいいっぽい
        // if (divisor) {
        //     gl.vertexAttribDivisor(location, divisor);
        // }
        gl.bindBuffer(GL_ARRAY_BUFFER, null);

        this.unbind();

        // replace buffer
        this._vboList[index!].vbo = buffer;
    }

    /**
     *
     */
    getBuffers() {
        return this._vboList.map(({ vbo }) => vbo);
    }
    
    /**
     *
     * @param key
     */
    findVertexBufferObjectInfo(key: string): VertexBufferObject | null {
        // let vboInfo: VertexBufferObject | null = null;
        // let index: number = -1;
        // for (let i = 0; i < this.vboList.length; i++) {
        //     if (key === this.vboList[i].name) {
        //         vboInfo = this.vboList[i];
        //         index = i;
        //         break;
        //     }
        // }
        const vboInfo = this._vboList.find(({ name }) => key === name);
        // const vbo = this.vboList.find(({ name }) => key === name);
        if (!vboInfo) {
            console.error('invalid target vbo');
            return null;
        }
        return vboInfo;
    }

    findVertexBufferObjectInfoIndex(key: string): number | null {
        for (let i = 0; i < this._vboList.length; i++) {
            if (key === this._vboList[i].name) {
                return i;
            }
        }
        console.error('invalid target vbo');
        return null;
    }

    /**
     *
     * @param key
     */
    findBuffer(key: string): WebGLBuffer | null {
        const target = this.findVertexBufferObjectInfo(key);
        if (!target) {
            console.error('invalid target vbo');
            return null;
        }
        // return target.vboInfo.vbo;
        return target.vbo;
    }
}
