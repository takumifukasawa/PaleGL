import {Vector2} from "@/PaleGL/math/Vector2.ts";
import {Vector3} from "@/PaleGL/math/Vector3.ts";
import {Vector4} from "@/PaleGL/math/Vector4.ts";
import {Matrix4} from "@/PaleGL/math/Matrix4.ts";
import {Texture} from "@/PaleGL/core/Texture.ts";
import {CubeMap} from "@/PaleGL/core/CubeMap.ts";
import {Color} from "@/PaleGL/math/Color.ts";
import {DirectionalLightStruct} from "@/PaleGL/actors/DirectionalLight.ts";
import {UniformTypes} from "@/PaleGL/constants.ts";

type UniformTypeValuePair = {
    type: UniformTypes;
    value: UniformValue;
}

export type UniformStructValue = UniformData[];
//     [key: string]: UniformTypeValuePair;
// };

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
    | CubeMap
    | Color
    | Color[]
    | Float32Array
    | DirectionalLightStruct
    | UniformStructValue
    | null;

type UniformData = {
    name: string,
} & UniformTypeValuePair;

export type UniformsData = UniformData[];

export class Uniforms {
    // TODO: 配列じゃなくて uniform name を key とした Map objectの方がいいかも
    data: UniformsData;

    constructor(...dataArray: UniformsData[]) {
        this.data = [];
        for(let i = 0; i < dataArray.length; i++) 
        {
            for(let j = 0; j < dataArray[i].length; j++ ){
                const elem = dataArray[i][j];
                const elemIndex = this.data.findIndex((d) => d.name === elem.name);
                if(elemIndex < 0) {
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
    
    setValue(name: string, value: UniformValue) {
        const data = this.find(name);
        if (data) {
            data.value = value;
        }
    }
    
    setValues() {
    }
} 
