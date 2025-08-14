import { createGLObject, GLObjectBase } from '@/PaleGL/core/glObject.ts';
import {
    createIndexBufferObject,
    IndexBufferObject,
    unbindIndexBufferObject,
} from '@/PaleGL/core/indexBufferObject.ts';
import { getAttributeUsage, Gpu } from '@/PaleGL/core/gpu.ts';
import { Attribute } from '@/PaleGL/core/attribute.ts';
import { GL_ARRAY_BUFFER, GL_FLOAT, GL_UNSIGNED_SHORT } from '@/PaleGL/constants.ts';

type VertexBufferObject = {
    name: string;
    vbo: WebGLBuffer;
    usage: number;
    location: number;
    size: number;
    divisor: number;
    // 実質デバッグ用
    elementSize: number;
    dataLength: number;
};

export type VertexArrayObject = GLObjectBase<WebGLVertexArrayObject> & {
    vboList: VertexBufferObject[];
    ibo: IndexBufferObject | null;
    indicesCount: number | null,
    attributes: Attribute[],
};

export function createVertexArrayObject({ gpu, attributes = [], indices }: {
    gpu: Gpu;
    attributes: Attribute[];
    indices?: number[] | Uint16Array | null
}): VertexArrayObject {
    const gl = gpu.gl;
    const vao = gl.createVertexArray();
    const vboList: VertexBufferObject[] = [];

    const vertexArrayObject: VertexArrayObject = {
        ...createGLObject(gpu, vao),
        vboList,
        ibo: null,
        indicesCount: indices ? indices.length : null,
        attributes,
    };

    // bind vertex array to webgl context
    // gl.bindVertexArray(this.vao);
    bindVertexArrayObject(vertexArrayObject);

    attributes.forEach((attribute) => {
        // this.setAttribute(attribute, true);
        setVertexArrayObjectAttribute(vertexArrayObject, attribute)
    });

    if (indices) {
        vertexArrayObject.ibo = createIndexBufferObject(gpu, indices);
    }

    // set attribute の方でやってるのでいらないはず
    // unbind array buffer
    // gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // unbind vertex array to webgl context
    // gl.bindVertexArray(null);
    unbindVertexArrayObject(vertexArrayObject);

    // unbind index buffer
    if (vertexArrayObject.ibo) {
        unbindIndexBufferObject(vertexArrayObject.ibo);
    }
   
    vertexArrayObject.attributes = attributes;

    return vertexArrayObject;
}

export function hasIndicesVertexArrayObject(vao: VertexArrayObject) {
    return !!vao.ibo;
}

function bindVertexArrayObject(vao: VertexArrayObject) {
    bindRawVertexArrayObject(vao.gpu.gl, vao.glObject);
}

function unbindVertexArrayObject(vao: VertexArrayObject) {
    unbindRawVertexArrayObject(vao.gpu.gl);
}

function bindRawVertexArrayObject(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject) {
    gl.bindVertexArray(vao);
}

function unbindRawVertexArrayObject(gl: WebGL2RenderingContext) {
    gl.bindVertexArray(null);
}

export function setVertexArrayObjectAttribute(vao: VertexArrayObject, attribute: Attribute) {
    const gl = vao.gpu.gl;

    bindVertexArrayObject(vao);

    const { name, data, size, location, usageType, divisor } = attribute;
    const newLocation = location !== null && location !== undefined ? location : vao.vboList.length;

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

    vao.vboList.push({ name, vbo, usage, location, size, divisor, elementSize: data.length / size,  dataLength: data.length });

    gl.bindVertexArray(null);
    gl.bindBuffer(GL_ARRAY_BUFFER, null);
}

export function getVertexArrayObjectBufferSubData(vao: VertexArrayObject, key: string, index: number, elementsNum: number) {
    const { gl } = vao.gpu;
    const vboInfo = findVertexArrayObjectVertexBufferObjectInfo(vao, key);
    const offset = index * elementsNum * Float32Array.BYTES_PER_ELEMENT;
    const data = new Float32Array(elementsNum);
    gl.bindBuffer(GL_ARRAY_BUFFER, vboInfo!.vbo);
    gl.getBufferSubData(GL_ARRAY_BUFFER, offset, data);
    gl.bindBuffer(GL_ARRAY_BUFFER, null);
    return data;
}

export function updateVertexArrayObjectBufferData(vao: VertexArrayObject, key: string, data: ArrayBufferView | BufferSource) {
    const { gl } = vao.gpu;
    const vboInfo = findVertexArrayObjectVertexBufferObjectInfo(vao, key);

    // performance overhead
    // gl.bindBuffer(gl.ARRAY_BUFFER, vboInfo.vbo);
    // gl.bufferData(gl.ARRAY_BUFFER, data, vboInfo.usage);
    // gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // optimize
    gl.bindBuffer(GL_ARRAY_BUFFER, vboInfo!.vbo);
    gl.bufferSubData(GL_ARRAY_BUFFER, 0, data);
    gl.bindBuffer(GL_ARRAY_BUFFER, null);
}

export function updateVertexArrayObjectBufferSubData(vao: VertexArrayObject, key: string, index: number, data: ArrayBufferView | BufferSource) {
    const { gl } = vao.gpu;
    const vboInfo = findVertexArrayObjectVertexBufferObjectInfo(vao, key);
    const offset = index * data.byteLength;
    gl.bindBuffer(GL_ARRAY_BUFFER, vboInfo!.vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, offset, data);
    gl.bindBuffer(GL_ARRAY_BUFFER, null);
}

export function replaceVertexArrayObjectBuffer(vao: VertexArrayObject, key: string, buffer: WebGLBuffer) {
    const { gl } = vao.gpu;

    // const { location, size } = this.findVertexBufferObjectInfo(key);
    const index = findVertexArrayObjectVertexBufferObjectInfoIndex(vao, key);
    if (index === null) {
        console.error('invalid target vbo');
    }
    const { location, size } = vao.vboList[index!];

    bindVertexArrayObject(vao);

    gl.bindBuffer(GL_ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    // TODO: 毎フレームやるの重くない？大丈夫？
    gl.vertexAttribPointer(location, size, GL_FLOAT, false, 0, 0);
    // divisorはもう一度指定しなくてもいいっぽい
    // if (divisor) {
    //     gl.vertexAttribDivisor(location, divisor);
    // }
    gl.bindBuffer(GL_ARRAY_BUFFER, null);

    unbindVertexArrayObject(vao);

    // replace buffer
    vao.vboList[index!].vbo = buffer;
}

export function getVertexArrayObjectBuffers(vao: VertexArrayObject) {
    return vao.vboList.map(({ vbo }) => vbo);
}

function findVertexArrayObjectVertexBufferObjectInfo(vao: VertexArrayObject, key: string): VertexBufferObject | null {
    // let vboInfo: VertexBufferObject | null = null;
    // let index: number = -1;
    // for (let i = 0; i < this.vboList.length; i++) {
    //     if (key === this.vboList[i].name) {
    //         vboInfo = this.vboList[i];
    //         index = i;
    //         break;
    //     }
    // }
    const vboInfo = vao.vboList.find(({ name }) => key === name);
    // const vbo = this.vboList.find(({ name }) => key === name);
    if (!vboInfo) {
        console.error('invalid target vbo');
        return null;
    }
    return vboInfo;
}

function findVertexArrayObjectVertexBufferObjectInfoIndex(vao: VertexArrayObject, key: string): number | null {
    for (let i = 0; i < vao.vboList.length; i++) {
        if (key === vao.vboList[i].name) {
            return i;
        }
    }
    console.error('invalid target vbo');
    return null;
}

export function findVertexArrayObjectVertexBufferObjectBuffer(vao: VertexArrayObject, key: string): WebGLBuffer | null {
    const target = findVertexArrayObjectVertexBufferObjectInfo(vao, key);
    if (!target) {
        console.error('invalid target vbo');
        return null;
    }
    // return target.vboInfo.vbo;
    return target.vbo;
}
