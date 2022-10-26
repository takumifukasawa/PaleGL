import {UniformTypes} from "./constants.js";

export class ForwardRenderer {
    #gpu;
    canvas;
    pixelRatio;
    #renderTarget;
    #realWidth;
    #realHeight;

    constructor({gpu, canvas, pixelRatio = 1}) {
        this.#gpu = gpu;
        this.canvas = canvas;
        this.pixelRatio = pixelRatio;
    }

    setSize(width, height) {
        this.#realWidth = Math.floor(width * this.pixelRatio);
        this.#realHeight = Math.floor(height * this.pixelRatio);
        this.canvas.width = this.#realWidth;
        this.canvas.height = this.#realHeight;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.#gpu.setSize(0, 0, this.#realWidth, this.#realHeight);
    }
    
    setRenderTarget(renderTarget) {
        const gl = this.#gpu.gl;
        this.#renderTarget = renderTarget;
        
        if(this.#renderTarget) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.#renderTarget.framebuffer.glObject);

            let x = Math.floor((this.#realWidth - this.#renderTarget.width) / 2);
            let y = Math.floor((this.#realHeight - this.#renderTarget.height) / 2);
            // gl.enable(gl.SCISSOR_TEST);
            gl.viewport(x, y, this.#renderTarget.width, this.#renderTarget.height);
            // gl.scissor(x, y, this.#renderTarget.width, this.#renderTarget.height);
            // console.log(x, y, this.#renderTarget.width, this.#renderTarget.height);
            // gl.scissor(x, y, this.#realWidth, this.#realHeight);
            // this.#gpu.setSize(0, 0, this.#realWidth, this.#realHeight)
            
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            // gl.disable(gl.SCISSOR_TEST);
            // this.#gpu.gl.scissor(0, 0, this.#realWidth, this.#realHeight);
            gl.viewport(0, 0, this.#realWidth, this.#realHeight);
        }
    }
    
    flush() {
        this.#gpu.flush();
    }

    clear(r, g, b, a) {
        this.#gpu.clear(r, g, b, a);
    }
    
    render(scene, camera) {
       
        // update all actors matrix
        // TODO: scene 側でやった方がよい？
        scene.traverse((actor) => actor.updateTransform())
        
        // draw 
        scene.traverse((actor) => {
            if(!actor.geometry || !actor.material) {
                return;
            }
            
            const mesh = actor;

            // TODO: material 側でやった方がよい？
            if(mesh.material.uniforms.uWorldMatrix) {
                mesh.material.uniforms.uWorldMatrix.value = mesh.transform.worldMatrix;
            }
            if(mesh.material.uniforms.uViewMatrix) {
                mesh.material.uniforms.uViewMatrix.value = camera.viewMatrix;
            }
            if(mesh.material.uniforms.uProjectionMatrix) {
                mesh.material.uniforms.uProjectionMatrix.value = camera.projectionMatrix;
            }
            
            // vertex
            this.#gpu.setVertexArrayObject(mesh.geometry.vertexArrayObject);
            if (mesh.geometry.indexBufferObject) {
                this.#gpu.setIndexBufferObject(mesh.geometry.indexBufferObject);
            }
            // material
            this.#gpu.setShader(mesh.material.shader);
            // uniforms
            this.#gpu.setUniforms(mesh.material.uniforms);
            // draw
            this.#gpu.draw(mesh.geometry.drawCount, mesh.material.primitiveType);
        });
    }
}