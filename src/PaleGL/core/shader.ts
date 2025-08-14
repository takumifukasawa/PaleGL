// import { GlObject } from '@/PaleGL/core/glObject.ts';
// import { Gpu } from '@/PaleGL/core/Gpu';
// import { GL_FRAGMENT_SHADER, GL_SEPARATE_ATTRIBS, GL_VERTEX_SHADER } from '@/PaleGL/constants.ts';
// 
// type ShaderParams = { gpu: Gpu; vertexShader: string; fragmentShader: string; transformFeedbackVaryings?: string[] };
// 
// function createShader(gl: WebGL2RenderingContext, type: number, src: string) {
//     // create vertex shader
//     const shader = gl.createShader(type)!;
//     // if (!shader) {
//     //     console.error('invalid shader');
//     //     return;
//     // }
//     // set shader source (string)
//     gl.shaderSource(shader, src);
//     // compile shader
//     gl.compileShader(shader);
//     // check shader info log
//     const info = gl.getShaderInfoLog(shader);
//     if (!!info && info.length > 0) {
//         console.error(Shader.buildErrorInfo(info, src, '[Shader] shader has error'));
//     }
// 
//     return shader;
// }
// 
// export class Shader extends GlObject {
//     _program: WebGLProgram | null;
//     _gpu: Gpu;
// 
//     get glObject(): WebGLProgram {
//         return this._program!;
//     }
// 
//     constructor({ gpu, vertexShader, fragmentShader, transformFeedbackVaryings }: ShaderParams) {
//         super();
// 
//         this._gpu = gpu;
// 
//         const { gl } = gpu;
//         const program = gl.createProgram()!;
// 
//         // if (!program) {
//         //     console.error('invalid program');
//         //     return;
//         // }
// 
//         //
//         // vertex shader
//         //
// 
//         const vs = createShader(gl, GL_VERTEX_SHADER, vertexShader);
//         gl.attachShader(program, vs);
// 
//         //
//         // fragment shader
//         //
// 
//         const fs = createShader(gl, GL_FRAGMENT_SHADER, fragmentShader);
//         gl.attachShader(program, fs);
// 
//         //
//         // transform feedback
//         //
// 
//         if (transformFeedbackVaryings && transformFeedbackVaryings.length > 0) {
//             gl.transformFeedbackVaryings(
//                 program,
//                 transformFeedbackVaryings,
//                 // bufferと頂点属性が別の場合に限定している
//                 GL_SEPARATE_ATTRIBS // or INTERLEAVED_ATTRIBS
//             );
//         }
// 
//         //
//         // program object
//         //
// 
//         // program link to gl context
//         gl.linkProgram(program);
// 
//         // for debug
//         // console.log(vertexShader)
//         // console.log(fragmentShader)
// 
//         // check program info log
//         const programInfo = gl.getProgramInfoLog(program);
//         if (!!programInfo && programInfo.length > 0) {
//             console.error('program error: ', vertexShader, fragmentShader);
//             console.error(programInfo);
//         }
// 
//         this._program = program;
//     }
// 
//     dispose() {
//         this._gpu.gl.deleteShader(this._program);
//         this._program = null;
//     }
// 
//     // uniformBlockInfos:{
//     //     bindingPoint: number;
//     //     blockIndex: number;
//     //     blockSize: number;
//     // }[] = [];
//     //
//     // addUniformBlock(bindingPoint: number, blockIndex: number, blockSize: number) {
//     //     this.gpu.gl.uniformBlockBinding(this.program!, blockIndex, bindingPoint);
//     // }
// 
//     // bindUniformBlock(blockIndex: number, bindingPoint: number) {
//     //     this.gpu.gl.uniformBlockBinding(this.program!, blockIndex, bindingPoint);
//     // }
// 
//     static buildErrorInfo(infoLog: string, shaderSource: string, header: string) {
//         return `${header}
//             
// ---
// 
// ${infoLog}
// 
// ---
//             
// ${shaderSource
//     .split('\n')
//     .map((line, i) => {
//         return `${i + 1}: ${line}`;
//     })
//     .join('\n')}       
// `;
//     }
// }

import { createGLObject, GLObjectBase } from '@/PaleGL/core/glObject.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { GL_FRAGMENT_SHADER, GL_SEPARATE_ATTRIBS, GL_VERTEX_SHADER } from '@/PaleGL/constants.ts';

type ShaderParams = { gpu: Gpu; vertexShader: string; fragmentShader: string; transformFeedbackVaryings?: string[] };

export type Shader = GLObjectBase<WebGLProgram>;

export function createShader({ gpu, vertexShader, fragmentShader, transformFeedbackVaryings }: ShaderParams) {
    const { gl } = gpu;
    const program = gl.createProgram()!;

    if (!program) {
        console.error('invalid program');
    }

    // vertex shader

    const vs = createRawShader(gl, GL_VERTEX_SHADER, vertexShader);
    gl.attachShader(program, vs);

    // fragment shader

    const fs = createRawShader(gl, GL_FRAGMENT_SHADER, fragmentShader);
    gl.attachShader(program, fs);

    // transform feedback

    if (transformFeedbackVaryings && transformFeedbackVaryings.length > 0) {
        gl.transformFeedbackVaryings(
            program,
            transformFeedbackVaryings,
            // bufferと頂点属性が別の場合に限定している
            GL_SEPARATE_ATTRIBS, // or INTERLEAVED_ATTRIBS
        );
    }

    // program object

    // program link to gl context
    gl.linkProgram(program);

    // for debug
    // console.log(vertexShader)
    // console.log(fragmentShader)

    // check program info log
    const programInfo = gl.getProgramInfoLog(program);
    if (!!programInfo && programInfo.length > 0) {
        console.error('program error: ', vertexShader, fragmentShader);
        console.error(programInfo);
    }

    return {
        ...createGLObject(gpu, program),
    };

}

function createRawShader(gl: WebGL2RenderingContext, type: number, src: string) {
    // create vertex shader
    const shader = gl.createShader(type)!;
    // if (!shader) {
    //     console.error('invalid shader');
    //     return;
    // }
    // set shader source (string)
    gl.shaderSource(shader, src);
    // compile shader
    gl.compileShader(shader);
    // check shader info log
    const info = gl.getShaderInfoLog(shader);
    if (!!info && info.length > 0) {
        console.error(buildErrorInfo(info, src, '[Shader] shader has error'));
    }

    return shader;
}

// export function disposeShader(shader: Shader) {
//     shader.gpu.gl.deleteShader(shader.glObject);
//     shader.glObject = null;
// }

function buildErrorInfo(infoLog: string, shaderSource: string, header: string) {
    return `${header}
            
---

${infoLog}

---
            
${shaderSource
        .split('\n')
        .map((line, i) => {
            return `${i + 1}: ${line}`;
        })
        .join('\n')}       
`;
}
