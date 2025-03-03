// import { GlObject } from '@/PaleGL/core/glObject.ts';
// import { GPU } from '@/PaleGL/core/GPU';
// import { GL_DYNAMIC_DRAW, GL_UNIFORM_BUFFER, UniformTypes } from '@/PaleGL/constants.ts';
// import {
//     UniformBufferObjectElementValueArray,
//     UniformBufferObjectElementValueNoNeedsPadding,
//     UniformBufferObjectStructArrayValue,
//     UniformBufferObjectStructValue,
//     UniformBufferObjectValue,
// } from '@/PaleGL/core/uniforms.ts';
// import { Vector2 } from '@/PaleGL/math/Vector2.ts';
// import { Vector3 } from '@/PaleGL/math/Vector3.ts';
// import { Vector4 } from '@/PaleGL/math/Vector4.ts';
// import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
// import { Color } from '@/PaleGL/math/Color.ts';
// 
// function getStructElementValue(type: UniformTypes, value: UniformBufferObjectValue) {
//     const data: number[] = [];
//     switch (type) {
//         case UniformTypes.Float:
//         case UniformTypes.Int:
//             data.push(value as number);
//             data.push(0);
//             data.push(0);
//             data.push(0);
//             break;
//         case UniformTypes.Bool:
//             data.push((value as boolean) ? 1 : 0);
//             data.push(0);
//             data.push(0);
//             data.push(0);
//             break;
//         case UniformTypes.Vector2:
//             data.push(...(value as Vector2).e);
//             data.push(0);
//             break;
//         case UniformTypes.Vector3:
//             data.push(...(value as Vector3).e);
//             data.push(0);
//             break;
//         case UniformTypes.Vector4:
//             data.push(...(value as Vector4).e);
//             break;
//         case UniformTypes.Matrix4:
//             data.push(...(value as Matrix4).e);
//             break;
//         case UniformTypes.Color:
//             data.push(...(value as Color).e);
//             break;
//         default:
//             console.error(`invalid uniform type: ${type}`);
//     }
//     return data;
// }
// 
// export class UniformBufferObject extends GlObject {
//     gpu: GPU;
//     ubo: WebGLBuffer;
//     _blockName: string;
//     _blockSize: number;
//     _dataSize: number;
//     bindingPoint: number;
//     _variableInfo: { name: string; index: number; offset: number }[];
// 
//     get glObject() {
//         return this.ubo;
//     }
//     
//     get blockName() {
//         return this._blockName;
//     }
// 
//     constructor(
//         gpu: GPU,
//         blockName: string,
//         blockSize: number,
//         variableNames: string[],
//         indices: number[],
//         offsets: number[],
//         dataSize: number,
//         bindingPoint: number
//     ) {
//         super();
//         this.gpu = gpu;
//         this._blockName = blockName;
//         this._blockSize = blockSize;
//         this._dataSize = dataSize;
//         this.bindingPoint = bindingPoint;
//         const { gl } = this.gpu;
// 
//         this.ubo = gl.createBuffer()!;
// 
//         this.bind();
// 
//         // 必要なbyte数を確保しておく
//         gl.bufferData(GL_UNIFORM_BUFFER, this._dataSize, GL_DYNAMIC_DRAW);
// 
//         this.unbind();
// 
//         // uboとbindingPointを関連付ける
//         gl.bindBufferBase(GL_UNIFORM_BUFFER, this.bindingPoint, this.ubo);
// 
//         // console.log(gpu, blockName, blockSize, variableNames, indices, offsets, dataSize, bindingPoint);
// 
//         this._variableInfo = variableNames.map((name, i) => {
//             return {
//                 name,
//                 index: indices[i],
//                 offset: offsets[i],
//             };
//         });
//     }
// 
//     bind() {
//         const { gl } = this.gpu;
//         gl.bindBuffer(GL_UNIFORM_BUFFER, this.ubo);
//     }
// 
//     unbind() {
//         const { gl } = this.gpu;
//         gl.bindBuffer(GL_UNIFORM_BUFFER, null);
//     }
//     
//     updateBufferData(variableName: string, data: Float32Array | Uint16Array, showLog: boolean = false) {
//         const info = this._variableInfo.find((v) => v.name === variableName);
//         if (showLog) {
//             // console.log("updateBufferData", info);
//         }
//         if (!info) {
//             console.error(`variableName ${variableName} not found`);
//             return;
//         }
//         // if(info.name === "uViewPosition" || info.name === "uViewDirection") {
//         // console.log("updateBufferData", info, data);
//         // }
//         this.bind();
//         this.gpu.gl.bufferSubData(GL_UNIFORM_BUFFER, info.offset, data, 0);
//         this.unbind();
//     }
// 
//     updateUniformValue(uniformName: string, uniformType: UniformTypes, value: UniformBufferObjectValue) {
//         switch (uniformType) {
//             // TODO: update struct
//             case UniformTypes.Struct:
//                 (value as unknown as UniformBufferObjectStructValue).forEach((v) => {
//                     const structElementName = `${uniformName}.${v.name}`;
//                     const data: number[] = getStructElementValue(v.type, v.value);
//                     this.updateBufferData(structElementName, new Float32Array(data));
//                 });
//                 break;
//             case UniformTypes.StructArray:
//                 (value as UniformBufferObjectStructArrayValue).forEach((v, i) => {
//                     v.forEach((vv) => {
//                         const structElementName = `${uniformName}[${i}].${vv.name}`;
//                         const data: number[] = getStructElementValue(vv.type, vv.value);
//                         // for debug
//                         this.updateBufferData(structElementName, new Float32Array(data));
//                     });
//                 });
//                 break;
//             default:
//                 if (Array.isArray(value)) {
//                     const data: number[] = [];
//                     (value as UniformBufferObjectElementValueArray).forEach((v) => {
//                         if (typeof v === 'number') {
//                             data.push(v);
//                             data.push(0);
//                             data.push(0);
//                             data.push(0);
//                         } else if (typeof v === 'boolean') {
//                             data.push(v ? 1 : 0);
//                             data.push(0);
//                             data.push(0);
//                             data.push(0);
//                         } else {
//                             data.push(...(v as UniformBufferObjectElementValueNoNeedsPadding).e);
//                         }
//                     });
//                     this.updateBufferData(uniformName, new Float32Array(data));
//                 } else {
//                     this.updateBufferData(
//                         uniformName,
//                         typeof value === 'number'
//                             ? new Float32Array([value])
//                             : (value as Vector2 | Vector3 | Vector4 | Matrix4 | Color).e
//                     );
//                 }
//                 break;
//         }
//     }
// }


import { createGLObject, GLObjectBase } from '@/PaleGL/core/glObject.ts';
import { GPU } from '@/PaleGL/core/GPU';
import { GL_DYNAMIC_DRAW, GL_UNIFORM_BUFFER, UniformTypes } from '@/PaleGL/constants.ts';
import {
    UniformBufferObjectElementValueArray,
    UniformBufferObjectElementValueNoNeedsPadding,
    UniformBufferObjectStructArrayValue,
    UniformBufferObjectStructValue,
    UniformBufferObjectValue,
} from '@/PaleGL/core/uniforms.ts';
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
            data.push(...(value as Vector2).e);
            data.push(0);
            break;
        case UniformTypes.Vector3:
            data.push(...(value as Vector3).e);
            data.push(0);
            break;
        case UniformTypes.Vector4:
            data.push(...(value as Vector4).e);
            break;
        case UniformTypes.Matrix4:
            data.push(...(value as Matrix4).e);
            break;
        case UniformTypes.Color:
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
    gpu: GPU,
    blockName: string,
    blockSize: number,
    variableNames: string[],
    indices: number[],
    offsets: number[],
    dataSize: number,
    bindingPoint: number,
): UniformBufferObject {
    const { gl } = gpu;

    const ubo: WebGLBuffer = gl.createBuffer()!;

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

export const updateUniformBufferData = (ubo: UniformBufferObject, variableName: string, data: Float32Array | Uint16Array, showLog: boolean = false) => {
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

export const updateUniformBufferValue = (ubo: UniformBufferObject, uniformName: string, uniformType: UniformTypes, value: UniformBufferObjectValue) => {
    switch (uniformType) {
        // TODO: update struct
        case UniformTypes.Struct:
            (value as unknown as UniformBufferObjectStructValue).forEach((v) => {
                const structElementName = `${uniformName}.${v.name}`;
                const data: number[] = getStructElementValue(v.type, v.value);
                updateUniformBufferData(ubo, structElementName, new Float32Array(data));
            });
            break;
        case UniformTypes.StructArray:
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
                        data.push(...(v as UniformBufferObjectElementValueNoNeedsPadding).e);
                    }
                });
                updateUniformBufferData(ubo, uniformName, new Float32Array(data));
            } else {
                updateUniformBufferData(
                    ubo,
                    uniformName,
                    typeof value === 'number'
                        ? new Float32Array([value])
                        : (value as Vector2 | Vector3 | Vector4 | Matrix4 | Color).e,
                );
            }
            break;
    }
};