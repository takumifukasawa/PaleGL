import { GLObject } from '@/PaleGL/core/GLObject';
import { GPU } from '@/PaleGL/core/GPU';

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
    
    updateBufferData(variableName: string, data: Float32Array | Uint16Array | number) {
        const info = this.variableInfo.find((v) => v.name === variableName);
        if(!info) {
            throw new Error(`variableName ${variableName} not found`);
        }
        // if(info.name === "uViewPosition" || info.name === "uViewDirection") {
        // console.log("updateBufferData", info, data);
        // }
        this.bind();
        this.gpu.gl.bufferSubData(this.gpu.gl.UNIFORM_BUFFER, info.offset, typeof(data) === "number" ? new Float32Array(data) : data, 0);
        this.unbind();
    }  
}
