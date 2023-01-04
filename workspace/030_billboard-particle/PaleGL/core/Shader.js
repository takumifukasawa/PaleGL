import {GLObject} from "./GLObject.js";

export class Shader extends GLObject {
    #program;
    
    get glObject() {
        return this.#program;
    }
    
    constructor({ gpu, vertexShader, fragmentShader }) {
        super();
       
        // cache
        const gl = gpu.gl;
      
        // vertex shader
        
        // create vertex shader  
        const vs = gl.createShader(gl.VERTEX_SHADER);
        // set shader source (string)
        gl.shaderSource(vs, vertexShader);
        // compile vertex shader
        gl.compileShader(vs);
        // check shader info log
        const vsInfo = gl.getShaderInfoLog(vs);
        if(vsInfo.length > 0) {
            const errorInfo = Shader.buildErrorInfo(vsInfo, vertexShader, "[Shader] vertex shader has error");
            throw errorInfo;
        }

        // fragment shader

        // create fragment shader  
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        // set shader source (string)
        gl.shaderSource(fs, fragmentShader);
        // compile fragment shader
        gl.compileShader(fs);
        const fsInfo = gl.getShaderInfoLog(fs);
        // check shader info log
        if(fsInfo.length > 0) {
            const errorInfo = Shader.buildErrorInfo(fsInfo, fragmentShader, "[Shader] fragment shader has error");
            throw errorInfo;
        }
        
        // program object
        
        this.#program = gl.createProgram();
       
        // attach shaders
        gl.attachShader(this.#program, vs);
        gl.attachShader(this.#program, fs);
       
        // program link to gl context
        gl.linkProgram(this.#program);

        // check program info log
        const programInfo = gl.getProgramInfoLog(this.#program);
        if(programInfo.length > 0) {
            throw programInfo;
        }
    }
    
    static buildErrorInfo(infoLog, shaderSource, header) {
        return `[Shader] fragment shader has error
            
---

${infoLog}

---
            
${shaderSource.split("\n").map((line, i) => {
    return `${i + 1}: ${line}`;
}).join("\n")}       
`;
    }
}