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
            gl.viewport(0, 0, this.#renderTarget.width, this.#renderTarget.height);
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
        if(camera.enabledPostProcess) {
            this.setRenderTarget(camera.postProcess.renderTarget);
        } else {
            this.setRenderTarget(camera.renderTarget);
        }

        // TODO: refactor
        this.clear(
            camera.clearColor.x,
            camera.clearColor.y,
            camera.clearColor.z,
            camera.clearColor.w
        );
       
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
            
            this.renderMesh(mesh);
            
            // // vertex
            // this.#gpu.setVertexArrayObject(mesh.geometry.vertexArrayObject);
            // if (mesh.geometry.indexBufferObject) {
            //     this.#gpu.setIndexBufferObject(mesh.geometry.indexBufferObject);
            // }
            // // material
            // this.#gpu.setShader(mesh.material.shader);
            // // uniforms
            // this.#gpu.setUniforms(mesh.material.uniforms);
            // // draw
            // this.#gpu.draw(mesh.geometry.drawCount, mesh.material.primitiveType);
        });
        
        // TODO: postprocessに渡してもよい
        if(camera.enabledPostProcess) {
            camera.postProcess.render(this, camera);
            // const { postProcess } = camera;
            // camera.updateTransform();
            // let prevRenderTarget = postProcess.renderTarget;
            // // TODO
            // // - filterでenabledなpassのみ抽出
            // postProcess.passes.forEach((pass, i) => {
            //     const isLastPass = i === postProcess.passes.length - 1;
            //     if(isLastPass) {
            //         this.setRenderTarget(camera.renderTarget);
            //     } else {
            //         this.setRenderTarget(pass.renderTarget);
            //     }
            //     this.clear(
            //         postProcess.camera.clearColor.x,
            //         postProcess.camera.clearColor.y,
            //         postProcess.camera.clearColor.z,
            //         postProcess.camera.clearColor.w
            //     );
            //     // this.setRenderTarget(renderToScreen
            //     //     ? null
            //     //     : pass.renderTarget
            //     // );
            //     pass.mesh.updateTransform();
            //     pass.mesh.material.uniforms.uSceneTexture.value = prevRenderTarget.texture;
            //     this.renderMesh(pass.mesh);
            //     prevRenderTarget = pass.renderTarget;
            // });
        }
    }

    renderMesh(mesh) {
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
    }
}