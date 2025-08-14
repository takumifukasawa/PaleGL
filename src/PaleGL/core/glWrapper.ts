
// glの関数を共通化

export function glCompileShader(gl: WebGLRenderingContext, shader: WebGLShader) {
    gl.compileShader(shader);
}
