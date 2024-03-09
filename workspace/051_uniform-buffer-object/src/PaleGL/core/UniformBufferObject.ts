import { GLObject } from '@/PaleGL/core/GLObject';
import { GPU } from '@/PaleGL/core/GPU';
import { UniformTypes } from '@/PaleGL/constants.ts';
import {
    UniformBufferObjectElementValueArray, UniformBufferObjectElementValueNoNeedsPadding,
    UniformBufferObjectStructArrayValue,
    UniformBufferObjectStructValue,
    UniformBufferObjectValue
} from '@/PaleGL/core/Uniforms.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { Color } from '@/PaleGL/math/Color.ts';

function getStructElementValue(type: UniformTypes, value: UniformBufferObjectValue) {
    const data: number[] = [];
    switch (type) {
        case UniformTypes.Float:
        case UniformTypes.Int:
            data.push(value as number);
            data.push(0);
            data.push(0);
            data.push(0);
            break;
        case UniformTypes.Bool:
            data.push((value as boolean) ? 1 : 0);
            data.push(0);
            data.push(0);
            data.push(0);
            break;
        case UniformTypes.Vector2:
            data.push(...(value as Vector2).elements);
            data.push(0);
            break;
        case UniformTypes.Vector3:
            data.push(...(value as Vector3).elements);
            data.push(0);
            break;
        case UniformTypes.Vector4:
            data.push(...(value as Vector4).elements);
            break;
        case UniformTypes.Matrix4:
            data.push(...(value as Matrix4).elements);
            break;
        case UniformTypes.Color:
            data.push(...(value as Color).elements);
            break;
        default:
            throw `invalid uniform type: ${type}`;
    }
    return data;
}

export class UniformBufferObject extends GLObject {
    gpu: GPU;
    ubo: WebGLBuffer;
    blockName: string;
    blockSize: number;
    dataSize: number;
    bindingPoint: number;
    variableInfo: { name: string; index: number; offset: number }[];

    get glObject() {
        return this.ubo;
    }

    constructor(
        gpu: GPU,
        blockName: string,
        blockSize: number,
        variableNames: string[],
        indices: number[],
        offsets: number[],
        dataSize: number,
        bindingPoint: number
    ) {
        super();
        this.gpu = gpu;
        this.blockName = blockName;
        this.blockSize = blockSize;
        this.dataSize = dataSize;
        this.bindingPoint = bindingPoint;
        const { gl } = this.gpu;

        this.ubo = gl.createBuffer()!;

        this.bind();

        // 必要なbyte数を確保しておく
        gl.bufferData(gl.UNIFORM_BUFFER, this.dataSize, gl.DYNAMIC_DRAW);

        this.unbind();

        // uboとbindingPointを関連付ける
        gl.bindBufferBase(gl.UNIFORM_BUFFER, this.bindingPoint, this.ubo);

        console.log(gpu, blockName, blockSize, variableNames, indices, offsets, dataSize, bindingPoint);

        this.variableInfo = variableNames.map((name, i) => {
            return {
                name,
                index: indices[i],
                offset: offsets[i],
            };
        });
    }

    bind() {
        const { gl } = this.gpu;
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.ubo);
    }

    unbind() {
        const { gl } = this.gpu;
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }

    updateBufferData(variableName: string, data: Float32Array | Uint16Array) {
        const info = this.variableInfo.find((v) => v.name === variableName);
        if (!info) {
            throw new Error(`variableName ${variableName} not found`);
        }
        // if(info.name === "uViewPosition" || info.name === "uViewDirection") {
        // console.log("updateBufferData", info, data);
        // }
        this.bind();
        this.gpu.gl.bufferSubData(this.gpu.gl.UNIFORM_BUFFER, info.offset, data, 0);
        this.unbind();
    }

    updateUniformValue(uniformName: string, uniformType: UniformTypes, value: UniformBufferObjectValue) {
        // targetGlobalUniformBufferObject.data.forEach((targetBlock) => {
        // const uniformName = targetBlock.name;
        // const value = targetBlock.value;
        // switch (targetBlock.type) {
        switch (uniformType) {
            // TODO: update struct
            case UniformTypes.Struct:
                (value as unknown as UniformBufferObjectStructValue).forEach((v) => {
                    const structElementName = `${uniformName}.${v.name}`;
                    const data: number[] = getStructElementValue(v.type, v.value);
                    this.updateBufferData(structElementName, new Float32Array(data));
                });
                break;
            case UniformTypes.StructArray:
                (value as UniformBufferObjectStructArrayValue).forEach((v, i) => {
                    v.forEach((vv) => {
                        const structElementName = `${uniformName}[${i}].${vv.name}`;
                        const data: number[] = getStructElementValue(vv.type, vv.value);
                        // for debug
                        this.updateBufferData(structElementName, new Float32Array(data));
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
                            data.push(...(v as UniformBufferObjectElementValueNoNeedsPadding).elements);
                        }
                    });
                    this.updateBufferData(uniformName, new Float32Array(data));
                } else {
                    this.updateBufferData(
                        uniformName,
                        typeof value === 'number'
                            ? new Float32Array([value])
                            : (value as Vector2 | Vector3 | Vector4 | Matrix4 | Color).elements
                    );
                }
                break;
        }
    }

}
