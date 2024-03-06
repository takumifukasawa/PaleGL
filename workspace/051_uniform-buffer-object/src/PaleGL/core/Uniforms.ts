import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { CubeMap } from '@/PaleGL/core/CubeMap.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { UniformTypes } from '@/PaleGL/constants.ts';
import { UniformBufferObject } from '@/PaleGL/core/UniformBufferObject.ts';

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
    value: UniformValue;
};

type UniformBufferObjectData = {
    name: string;
} & UniformBufferObjectTypeValuePair;

export type UniformBufferObjectStructValue = UniformBufferObjectData[];

export type UniformBufferObjectStructArrayValue = UniformBufferObjectStructValue[];

export type UniformBufferObjectValue =
    | boolean
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
    | Color
    | Color[]
    | Float32Array
    | UniformStructValue
    | UniformStructArrayValue;

export type UniformBufferObjectBlockData = UniformBufferObjectData[];

/**
 * 
 */
export class Uniforms {
    // TODO: 配列じゃなくて uniform name を key とした Map objectの方がいいかも
    data: UniformsData;
    uniformBlocks: {
        blockIndex: number;
        uniformBufferObject: UniformBufferObject;
        data: UniformBufferObjectBlockData;
        // elements: Float32Array
    }[] = [];

    constructor(...dataArray: UniformsData[]) {
        this.data = [];
        for (let i = 0; i < dataArray.length; i++) {
            for (let j = 0; j < dataArray[i].length; j++) {
                const elem = dataArray[i][j];
                const elemIndex = this.data.findIndex((d) => d.name === elem.name);
                if (elemIndex < 0) {
                    this.data.push(elem);
                } else {
                    this.data[elemIndex].value = elem.value;
                }
            }
        }
    }

    find(name: string) {
        return this.data.find((d) => d.name === name);
    }

    /**
     * uniformの値を上書き。
     * 対象のuniformが存在する場合にのみ上書きをする。
     * struct, struct array の場合はその中身まで探索し上書き
     * @param name
     * @param newValue
     */
    setValue(name: string, newValue: UniformValue, log: boolean = false) {
        const data = this.find(name);
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

    setValues() {}

    addUniformBlock(blockIndex: number, uniformBufferObject: UniformBufferObject, data: UniformBufferObjectBlockData) {
        // const blockIndex = uniformBufferObject.gpu.gl.getUniformBlockIndex(
        //     this.shader.glObject,
        // //     uniformBufferObject.blockName
        // );
        this.uniformBlocks.push({ blockIndex, uniformBufferObject, data });
    }
}
