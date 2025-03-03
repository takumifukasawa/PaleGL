import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { CubeMap } from '@/PaleGL/core/CubeMap.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { UniformTypes } from '@/PaleGL/constants.ts';
import { UniformBufferObject } from '@/PaleGL/core/uniformBufferObject.ts';

//
// uniform values
//

type UniformTypeValuePair = {
    type: UniformTypes;
    value: UniformValue;
};

type UniformData = {
    name: string;
} & UniformTypeValuePair;

export type UniformStructValue = UniformData[];

export type UniformStructArrayValue = UniformStructValue[];

// TODO: fix type
export type UniformValue =
    | number
    | number[]
    | Vector2
    | Vector2[]
    | Vector3
    | Vector3[]
    | Vector4
    | Vector4[]
    | Matrix4
    | Matrix4[]
    | Texture
    | Texture[]
    | CubeMap
    | Color
    | Color[]
    | boolean
    | Float32Array
    | UniformStructValue
    | UniformStructArrayValue
    | null
    | null[]
    | (Texture | null)[];

export type UniformsData = UniformData[];

//
// uniform buffer object values
//

type UniformBufferObjectTypeValuePair = {
    type: UniformTypes;
    value: UniformBufferObjectValue;
};

type UniformBufferObjectData = {
    name: string;
} & UniformBufferObjectTypeValuePair;

export type UniformBufferObjectStructValue = UniformBufferObjectData[];

export type UniformBufferObjectStructArrayValue = UniformBufferObjectStructValue[];

export type UniformBufferObjectElementValueNeedsPadding = boolean | number;

export type UniformBufferObjectElementValueNoNeedsPadding = Vector2 | Vector3 | Vector4 | Matrix4 | Color;

export type UniformBufferObjectElementValue =
    | UniformBufferObjectElementValueNeedsPadding
    | UniformBufferObjectElementValueNoNeedsPadding;

export type UniformBufferObjectElementValueArray = UniformBufferObjectElementValue[];

// export type UniformBufferObjectStructValue = UniformBufferObjectElementValue[];

export type UniformBufferObjectValue =
    | UniformBufferObjectElementValue
    | UniformBufferObjectElementValueArray
    | Float32Array
    | UniformStructValue
    | UniformStructArrayValue;

export type UniformBufferObjectBlockData = UniformBufferObjectData[];


// export class Uniforms {
//     // TODO: 配列じゃなくて uniform name を key とした Map objectの方がいいかも
//     _data: UniformsData;
//     _uniformBlocks: {
//         blockIndex: number;
//         uniformBufferObject: UniformBufferObject;
//         data: UniformBufferObjectBlockData;
//         // elements: Float32Array
//     }[] = [];
//     
//     get data() {
//         return _data;
//     }
// 
//     constructor(...dataArray: UniformsData[]) {
//         _data = [];
//         for (let i = 0; i < dataArray.length; i++) {
//             for (let j = 0; j < dataArray[i].length; j++) {
//                 const elem = dataArray[i][j];
//                 const elemIndex = _data.findIndex((d) => d.name === elem.name);
//                 if (elemIndex < 0) {
//                     _data.push(elem);
//                 } else {
//                     _data[elemIndex].value = elem.value;
//                 }
//             }
//         }
//     }
// 
//     find(name: string) {
//         return _data.find((d) => d.name === name);
//     }
// 
//     // 新しい要素を追加
//     addValue(name: string, type: UniformTypes, value: UniformValue) {
//         _data.push({
//             name,
//             type,
//             value,
//         });
//     }
// 
//     /// uniformの値を上書き。
//     // 対象のuniformが存在する場合にのみ上書きをする。
//     // struct, struct array の場合はその中身まで探索し上書き
//     // @param name
//     // @param newValue
//     setValue(name: string, newValue: UniformValue, log: boolean = false) {
//         const data = this.find(name);
//         if (log) {
//             console.log(name, newValue, data);
//         }
//         // | UniformStructValue
//         // | UniformStructArrayValue
//         if (data) {
//             if (data.type === UniformTypes.Struct) {
//                 (newValue as UniformStructValue).forEach((elem) => {
//                     const index = (data.value as UniformStructValue).findIndex((needle) => needle.name === elem.name);
//                     if (index >= 0) {
//                         (data.value as UniformStructValue)[index].value = elem.value;
//                     }
//                 });
//             } else if (data.type === UniformTypes.StructArray) {
//                 (newValue as UniformStructArrayValue).forEach((newStructValue, structArrayIndex) => {
//                     newStructValue.forEach((elem) => {
//                         const index = (data.value as UniformStructArrayValue)[structArrayIndex].findIndex(
//                             (needle) => needle.name === elem.name
//                         );
//                         if (index >= 0) {
//                             (data.value as UniformStructArrayValue)[structArrayIndex][index].value = elem.value;
//                         }
//                     });
//                 });
//             } else {
//                 data.value = newValue;
//             }
//         }
//     }
// 
//     setValues() {}
// 
//     addUniformBlock(blockIndex: number, uniformBufferObject: UniformBufferObject, data: UniformBufferObjectBlockData) {
//         // const blockIndex = uniformBufferObject.gpu.gl.getUniformBlockIndex(
//         //     this.shader.glObject,
//         // //     uniformBufferObject.blockName
//         // );
//         _uniformBlocks.push({ blockIndex, uniformBufferObject, data });
//     }
// }


export type Uniforms = ReturnType<typeof createUniforms>;

export function createUniforms(...dataArray: UniformsData[]) {
    // TODO: 配列じゃなくて uniform name を key とした Map objectの方がいいかも
    const data: UniformsData = [];
    const uniformBlocks: {
        blockIndex: number;
        uniformBufferObject: UniformBufferObject;
        data: UniformBufferObjectBlockData;
        // elements: Float32Array
    }[] = [];
    
        for (let i = 0; i < dataArray.length; i++) {
            for (let j = 0; j < dataArray[i].length; j++) {
                const elem = dataArray[i][j];
                const elemIndex = data.findIndex((d) => d.name === elem.name);
                if (elemIndex < 0) {
                    data.push(elem);
                } else {
                    data[elemIndex].value = elem.value;
                }
            }
        }


    return {
            data,
        uniformBlocks
        // getData: () => _data,
        // getUniformBlocks: () => _uniformBlocks,
        // // methods
        // find,
        // addValue,
        // setValue,
        // addUniformBlock,
    }

}

export const findUniformByName = (uniforms: Uniforms, name: string) => {
    return uniforms.data.find((d) => d.name === name);
}

// 新しい要素を追加
export const addUniformValue = (uniforms: Uniforms, name: string, type: UniformTypes, value: UniformValue) => {
    uniforms.data.push({
        name,
        type,
        value,
    });
}

/// uniformの値を上書き。
// 対象のuniformが存在する場合にのみ上書きをする。
// struct, struct array の場合はその中身まで探索し上書き
// @param name
// @param newValue
export const setUniformValue = (uniforms: Uniforms, name: string, newValue: UniformValue, log: boolean = false) => {
    const data = findUniformByName(uniforms, name);
    if (log) {
        console.log(name, newValue, data);
    }
    // | UniformStructValue
    // | UniformStructArrayValue
    if (data) {
        if (data.type === UniformTypes.Struct) {
            (newValue as UniformStructValue).forEach((elem) => {
                const index = (data.value as UniformStructValue).findIndex((needle) => needle.name === elem.name);
                if (index >= 0) {
                    (data.value as UniformStructValue)[index].value = elem.value;
                }
            });
        } else if (data.type === UniformTypes.StructArray) {
            (newValue as UniformStructArrayValue).forEach((newStructValue, structArrayIndex) => {
                newStructValue.forEach((elem) => {
                    const index = (data.value as UniformStructArrayValue)[structArrayIndex].findIndex(
                        (needle) => needle.name === elem.name
                    );
                    if (index >= 0) {
                        (data.value as UniformStructArrayValue)[structArrayIndex][index].value = elem.value;
                    }
                });
            });
        } else {
            data.value = newValue;
        }
    }
}

// setValues() {}

export const addUniformBlock = (uniforms: Uniforms, blockIndex: number, uniformBufferObject: UniformBufferObject, data: UniformBufferObjectBlockData) => {
    // const blockIndex = uniformBufferObject.gpu.gl.getUniformBlockIndex(
    //     this.shader.glObject,
    // //     uniformBufferObject.blockName
    // );
    uniforms.uniformBlocks.push({ blockIndex, uniformBufferObject, data });
}

