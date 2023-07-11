import { GLObject } from '@/PaleGL/core/GLObject';
import { GPU } from '@/PaleGL/core/GPU';

export class Shader extends GLObject {
    private program: WebGLProgram;

    get glObject(): WebGLProgram {
        return this.program;
    }

    constructor({ gpu, vertexShader, fragmentShader }: { gpu: GPU; vertexShader: string; fragmentShader: string }) {
        super();

        // cache
        const gl = gpu.gl;

        // vertex shader

        // create vertex shader
        const vs = gl.createShader(gl.VERTEX_SHADER);
        if (!vs) {
            throw new Error('invalid vs');
        }
        // set shader source (string)
        gl.shaderSource(vs, vertexShader);
        // compile vertex shader
        gl.compileShader(vs);
        // check shader info log
        const vsInfo = gl.getShaderInfoLog(vs);
        if (!!vsInfo && vsInfo.length > 0) {
            const errorInfo = Shader.buildErrorInfo(vsInfo, vertexShader, '[Shader] vertex shader has error');
            throw errorInfo;
        }

        // fragment shader

        // create fragment shader
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fs) {
            throw new Error('invalid fs');
        }
        // set shader source (string)
        gl.shaderSource(fs, fragmentShader);
        // compile fragment shader
        gl.compileShader(fs);
        const fsInfo = gl.getShaderInfoLog(fs);
        // check shader info log
        if (!!fsInfo && fsInfo.length > 0) {
            const errorInfo = Shader.buildErrorInfo(fsInfo, fragmentShader, '[Shader] fragment shader has error');
            throw errorInfo;
        }

        // program object

        const program = gl.createProgram();
        if (!program) {
            throw new Error('invalid program');
        }
        this.program = program;

        // attach shaders
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);

        // program link to gl context
        gl.linkProgram(this.program);

        // check program info log
        const programInfo = gl.getProgramInfoLog(this.program);
        if (!!programInfo && programInfo.length > 0) {
            throw programInfo;
        }
    }

    static buildErrorInfo(infoLog: string, shaderSource: string, header: string) {
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
}
