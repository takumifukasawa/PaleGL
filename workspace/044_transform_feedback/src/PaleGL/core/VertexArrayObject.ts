import { GLObject } from '@/PaleGL/core/GLObject';
import { AttributeUsageType } from '@/PaleGL/constants.js';
import { IndexBufferObject } from '@/PaleGL/core/IndexBufferObject';
import { GPU } from '@/PaleGL/core/GPU';
import { Attribute } from '@/PaleGL/core/Attribute';

type VertexBufferObject = {
    name: string;
    vbo: WebGLBuffer;
    usage: number;
    location: number;
    size: number;
};

export class VertexArrayObject extends GLObject {
    private gpu: GPU;
    private vao: WebGLVertexArrayObject;
    private vboList: VertexBufferObject[] = [];
    private ibo: IndexBufferObject | null = null;

    /**
     *
     */
    get hasIndices() {
        return !!this.ibo;
    }

    /**
     *
     */
    get glObject() {
        return this.vao;
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

    /**
     *
     * @param gl
     * @param usageType
     */
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

    /**
     *
     */
    bind() {
        const { gl } = this.gpu;
        gl.bindVertexArray(this.glObject);
    }

    /**
     *
     */
    unbind() {
        const { gl } = this.gpu;
        gl.bindVertexArray(null);
    }

    /**
     *
     * @param attribute
     * @param push
     */
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

        this.vboList.push({ name, vbo, usage, location, size });

        if (push) {
            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
    }

    /**
     *
     * @param key
     * @param data
     */
    updateBufferData(key: string, data: ArrayBufferView | BufferSource) {
        const { gl } = this.gpu;
        const vboInfo = this.findVertexBufferObjectInfo(key);
       
        // performance overhead
        // gl.bindBuffer(gl.ARRAY_BUFFER, vboInfo.vbo);
        // gl.bufferData(gl.ARRAY_BUFFER, data, vboInfo.usage);
        // gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // optimize
        gl.bindBuffer(gl.ARRAY_BUFFER, vboInfo.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    
    updateBuffer(key: string, buffer: WebGLBuffer) {
        const { gl } = this.gpu;
        
        const { location, size } = this.findVertexBufferObjectInfo(key);
        const index = this.findVertexBufferObjectInfoIndex(key);

        this.bind();
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(location);
        // TODO: 毎フレームやるの重くない？大丈夫？
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        this.unbind();

        // replace buffer
        this.vboList[index].vbo = buffer;
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

    /**
     *
     */
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

    /**
     *
     * @param key
     */
    findVertexBufferObjectInfo(key: string): VertexBufferObject {
        // let vboInfo: VertexBufferObject | null = null;
        // let index: number = -1;
        // for (let i = 0; i < this.vboList.length; i++) {
        //     if (key === this.vboList[i].name) {
        //         vboInfo = this.vboList[i];
        //         index = i;
        //         break;
        //     }
        // }
        const vboInfo = this.vboList.find(({ name }) => key === name);
        // const vbo = this.vboList.find(({ name }) => key === name);
        if (!vboInfo) {
            throw 'invalid target vbo';
        }
        return vboInfo;
    }

    findVertexBufferObjectInfoIndex(key: string): number {
        for (let i = 0; i < this.vboList.length; i++) {
            if (key === this.vboList[i].name) {
                return i;
            }
        }
        throw 'invalid target vbo';

    }


    /**
     *
     * @param key
     */
    findBuffer(key: string): WebGLBuffer {
        const target = this.findVertexBufferObjectInfo(key);
        if (!target) {
            throw 'invalid name';
        }
        // return target.vboInfo.vbo;
        return target.vbo;
    }
}
