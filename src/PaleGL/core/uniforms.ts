import {
    UNIFORM_INDEX_VALUE,
    UNIFORM_TYPE_STRUCT,
    UNIFORM_TYPE_STRUCT_ARRAY,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import { CubeMap } from '@/PaleGL/core/cubeMap.ts';
import { Texture } from '@/PaleGL/core/texture.ts';
import { UniformBufferObject } from '@/PaleGL/core/uniformBufferObject.ts';
import { Color } from '@/PaleGL/math/color.ts';
import { Matrix4 } from '@/PaleGL/math/matrix4.ts';
import { Vector2 } from '@/PaleGL/math/vector2.ts';
import { Vector3 } from '@/PaleGL/math/vector3.ts';
import { Vector4 } from '@/PaleGL/math/vector4.ts';

//
// uniform values
//

type UniformData = [name: string, type: UniformTypes, value?: UniformValue];

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
    | (Texture | undefined)[]
    | undefined;

export type UniformsData = UniformData[];

//
// uniform buffer object values
//

type UniformBufferObjectData = [name: string, type: UniformTypes, value: UniformBufferObjectValue];

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
    | UniformStructArrayValue
    | UniformBufferObjectStructArrayValue;

export type UniformBufferObjectBlockData = UniformBufferObjectData[];

// export type Uniforms = ReturnType<typeof createUniforms>;
export type Uniforms = { data: UniformsData; uniformBlocks: UniformBlocks };

type UniformBlock = {
    blockIndex: number;
    uniformBufferObject: UniformBufferObject;
    data: UniformBufferObjectBlockData;
};

type UniformBlocks = UniformBlock[];

export const createUniforms = (...dataArray: UniformsData[]): Uniforms => {
    // TODO: 配列じゃなくて uniform name を key とした Map objectの方がいいかも
    const data: UniformsData = [];
    const uniformBlocks: UniformBlocks = [];

    for (let i = 0; i < dataArray.length; i++) {
        for (let j = 0; j < dataArray[i].length; j++) {
            const [elemName, , elemValue] = dataArray[i][j];
            const elemIndex = data.findIndex(([name]) => name === elemName);
            if (elemIndex < 0) {
                data.push(dataArray[i][j]);
            } else {
                data[elemIndex][UNIFORM_INDEX_VALUE] = elemValue;
            }
        }
    }

    return {
        data,
        uniformBlocks,
        // getData: () => _data,
        // getUniformBlocks: () => _uniformBlocks,
        // // methods
        // find,
        // addValue,
        // setValue,
        // addUniformBlock,
    };
}

export const findUniformByName = (uniforms: Uniforms, name: string) => {
    return uniforms.data.find(([uniformName]) => uniformName === name);
};

// 新しい要素を追加
export const addUniformValue = (uniforms: Uniforms, name: string, type: UniformTypes, value?: UniformValue) => {
    uniforms.data.push([name, type, value]);
};

export const addUniformData = (uniforms: Uniforms, uniformsData: UniformsData) => {
    for (let i = 0; i < uniformsData.length; i++) {
        const [name, type, value] = uniformsData[i];
        addUniformValue(uniforms, name, type, value);
    }
};

/// uniformの値を上書き。
// 対象のuniformが存在する場合にのみ上書きをする。
// struct, struct array の場合はその中身まで探索し上書き
// @param name
// @param newValue
export const setUniformValue = (uniforms: Uniforms, name: string, newValue: UniformValue, log: boolean = false) => {
    const data = findUniformByName(uniforms, name);
    if (log) {
        console.log(uniforms, name, data, newValue);
    }
    // | UniformStructValue
    // | UniformStructArrayValue
    if (data) {
        const [, type] = data;
        if (type === UNIFORM_TYPE_STRUCT) {
            (newValue as UniformStructValue).forEach(([elemName, , elemValue]) => {
                const structValue = data[UNIFORM_INDEX_VALUE] as UniformStructValue;
                const index = structValue.findIndex(([needleName]) => needleName === elemName);
                if (index >= 0) {
                    structValue[index][UNIFORM_INDEX_VALUE] = elemValue;
                }
            });
        } else if (type === UNIFORM_TYPE_STRUCT_ARRAY) {
            (newValue as UniformStructArrayValue).forEach((newStructValue, structArrayIndex) => {
                const structArrayValue = data[UNIFORM_INDEX_VALUE] as UniformStructArrayValue;
                newStructValue.forEach(([elemName, , elemValue]) => {
                    const index = structArrayValue[structArrayIndex].findIndex(
                        ([needleName]) => needleName === elemName
                    );
                    if (index >= 0) {
                        structArrayValue[structArrayIndex][index][UNIFORM_INDEX_VALUE] = elemValue;
                    }
                });
            });
        } else {
            data[UNIFORM_INDEX_VALUE] = newValue;
        }
    }
};

// setValues() {}

export const addUniformBlock = (
    uniforms: Uniforms,
    blockIndex: number,
    uniformBufferObject: UniformBufferObject,
    data: UniformBufferObjectBlockData
) => {
    uniforms.uniformBlocks.push({ blockIndex, uniformBufferObject, data });
};
