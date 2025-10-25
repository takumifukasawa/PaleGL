import {
    GL_DYNAMIC_DRAW,
    GL_UNIFORM_BUFFER,
    UNIFORM_TYPE_INT,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_BOOL,
    UNIFORM_TYPE_VECTOR2,
    UNIFORM_TYPE_VECTOR3,
    UNIFORM_TYPE_VECTOR4,
    UNIFORM_TYPE_MATRIX4,
    UNIFORM_TYPE_COLOR,
    UNIFORM_TYPE_STRUCT,
    UNIFORM_TYPE_STRUCT_ARRAY,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import { createGLObject, GLObjectBase } from '@/PaleGL/core/glObject.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import {
    UniformBufferObjectElementValueArray,
    UniformBufferObjectElementValueNoNeedsPadding,
    UniformBufferObjectStructArrayValue,
    UniformBufferObjectStructValue,
    UniformBufferObjectValue,
} from '@/PaleGL/core/uniforms.ts';
import { Color } from '@/PaleGL/math/color.ts';
import { Matrix4 } from '@/PaleGL/math/matrix4.ts';
import { Vector2 } from '@/PaleGL/math/vector2.ts';
import { Vector3 } from '@/PaleGL/math/vector3.ts';
import { Vector4 } from '@/PaleGL/math/vector4.ts';

function getStructElementValue(type: UniformTypes, value: UniformBufferObjectValue) {
    const data: number[] = [];
    switch (type) {
        case UNIFORM_TYPE_FLOAT:
        case UNIFORM_TYPE_INT:
            data.push(value as number);
            data.push(0);
            data.push(0);
            data.push(0);
            break;
        case UNIFORM_TYPE_BOOL:
            data.push((value as boolean) ? 1 : 0);
            data.push(0);
            data.push(0);
            data.push(0);
            break;
        case UNIFORM_TYPE_VECTOR2:
            data.push(...(value as Vector2));
            data.push(0);
            break;
        case UNIFORM_TYPE_VECTOR3:
            data.push(...(value as Vector3));
            data.push(0);
            break;
        case UNIFORM_TYPE_VECTOR4:
            data.push(...(value as Vector4));
            break;
        case UNIFORM_TYPE_MATRIX4:
            data.push(...(value as Matrix4).e);
            break;
        case UNIFORM_TYPE_COLOR:
            data.push(...(value as Color).e);
            break;
        default:
            console.error(`invalid uniform type: ${type}`);
    }
    return data;
}

export type UniformBufferObject = GLObjectBase<WebGLBuffer> & {
    blockName: string;
    blockSize: number;
    dataSize: number;
    bindingPoint: number;
    variableInfo: { name: string; index: number; offset: number }[];
};

export function createUniformBufferObject(
    gpu: Gpu,
    blockName: string,
    blockSize: number,
    variableNames: string[],
    indices: number[],
    offsets: number[],
    dataSize: number,
    bindingPoint: number
): UniformBufferObject {
    const { gl } = gpu;

    const ubo: WebGLBuffer = gl.createBuffer();

    bindRawUniformBufferObject(gl, ubo);

    // 必要なbyte数を確保しておく
    gl.bufferData(GL_UNIFORM_BUFFER, dataSize, GL_DYNAMIC_DRAW);

    unbindRawUniformBufferObject(gl);

    // uboとbindingPointを関連付ける
    gl.bindBufferBase(GL_UNIFORM_BUFFER, bindingPoint, ubo);

    // console.log(gpu, blockName, blockSize, variableNames, indices, offsets, dataSize, bindingPoint);

    const variableInfo: { name: string; index: number; offset: number }[] = variableNames.map((name, i) => {
        return {
            name,
            index: indices[i],
            offset: offsets[i],
        };
    });

    return {
        ...createGLObject(gpu, ubo),
        blockName,
        blockSize,
        dataSize,
        bindingPoint,
        variableInfo,
    };
}

export function bindUniformBufferObject(ubo: UniformBufferObject) {
    bindRawUniformBufferObject(ubo.gpu.gl, ubo.glObject);
}

export function unbindUniformBufferObject(ubo: UniformBufferObject) {
    unbindRawUniformBufferObject(ubo.gpu.gl);
}

export function bindRawUniformBufferObject(gl: WebGL2RenderingContext, ubo: WebGLBuffer) {
    gl.bindBuffer(GL_UNIFORM_BUFFER, ubo);
}

function unbindRawUniformBufferObject(gl: WebGL2RenderingContext) {
    gl.bindBuffer(GL_UNIFORM_BUFFER, null);
}

export const updateUniformBufferData = (
    ubo: UniformBufferObject,
    variableName: string,
    data: Float32Array | Uint16Array,
    showLog: boolean = false
) => {
    const info = ubo.variableInfo.find((v) => v.name === variableName);
    if (showLog) {
        // console.log("updateBufferData", info);
    }
    if (!info) {
        console.error(`variableName ${variableName} not found`);
        return;
    }
    bindUniformBufferObject(ubo);
    ubo.gpu.gl.bufferSubData(GL_UNIFORM_BUFFER, info.offset, data, 0);
    unbindUniformBufferObject(ubo);
};

export const updateUniformBufferValue = (
    ubo: UniformBufferObject,
    uniformName: string,
    uniformType: UniformTypes,
    value: UniformBufferObjectValue
) => {
    switch (uniformType) {
        // TODO: update struct
        case UNIFORM_TYPE_STRUCT:
            (value as unknown as UniformBufferObjectStructValue).forEach((v) => {
                const structElementName = `${uniformName}.${v.name}`;
                const data: number[] = getStructElementValue(v.type, v.value);
                updateUniformBufferData(ubo, structElementName, new Float32Array(data));
            });
            break;
        case UNIFORM_TYPE_STRUCT_ARRAY:
            (value as UniformBufferObjectStructArrayValue).forEach((v, i) => {
                v.forEach((vv) => {
                    const structElementName = `${uniformName}[${i}].${vv.name}`;
                    const data: number[] = getStructElementValue(vv.type, vv.value);
                    updateUniformBufferData(ubo, structElementName, new Float32Array(data));
                });
            });
            break;
        default:
            if (Array.isArray(value)) {
                const data: number[] = [];
                (value as UniformBufferObjectElementValueArray).forEach((v) => {
                    if (typeof v === 'number') {
                        data.push(v);
                        data.push(0);
                        data.push(0);
                        data.push(0);
                    } else if (typeof v === 'boolean') {
                        data.push(v ? 1 : 0);
                        data.push(0);
                        data.push(0);
                        data.push(0);
                    } else {
                        const val = v as UniformBufferObjectElementValueNoNeedsPadding;
                        data.push(...(val instanceof Float32Array ? val : (val as {e: Float32Array}).e));
                    }
                });
                updateUniformBufferData(ubo, uniformName, new Float32Array(data));
            } else {
                updateUniformBufferData(
                    ubo,
                    uniformName,
                    typeof value === 'number'
                        ? new Float32Array([value])
                        : value instanceof Float32Array
                        ? value
                        : (value as {e: Float32Array}).e
                );
            }
            break;
    }
};
