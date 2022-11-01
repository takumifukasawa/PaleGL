import {BlendTypes} from "./constants.js";

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
        scene.traverse((actor) => actor.updateTransform());
      
        const opaqueQueueMeshActors = [];
        const transparentQueueMeshActors = [];
        
        const sortedMeshActors = [];
        scene.traverse((actor) => {
            if (!actor.geometry || !actor.material) {
                return;
            }
            sortedMeshActors.push(actor);
        });
        
        sortedMeshActors.sort((a, b) => {
            if (a.material.renderQueue < b.material.renderQueue) {
                return -1;
            }
            if (a.material.renderQueue > b.material.renderQueue) {
                return 1;
            }
            return 0;
        });
        
        // switch(actor.material.blendType) {
        //     case BlendTypes.Opaque:
        //         opaqueQueueMeshActors.push(actor)
        //         break;
        //     case BlendTypes.Transparent:
        //     case BlendTypes.Additive:
        //         transparentQueueMeshActors.push(actor);
        //         break;
        //     default:
        //         throw "invalid blend types";
        // }
        
        // const sortedMeshActors = [...opaqueQueueMeshActors, ...transparentQueueMeshActors];
        
        // draw 
        sortedMeshActors.forEach(mesh => {
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
        });
        
        if(camera.enabledPostProcess) {
            camera.postProcess.render(this, camera);
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
        this.#gpu.draw(
            mesh.geometry.drawCount,
            mesh.material.primitiveType,
            mesh.material.blendType
        );
    }
}