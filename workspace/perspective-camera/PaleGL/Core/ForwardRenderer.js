import {UniformTypes} from "./constants.js";

export class ForwardRenderer {
    #gpu;

    constructor({gpu}) {
        this.#gpu = gpu;
    }

    setSize(width, height) {
        this.#gpu.setSize(width, height);
    }

    flush() {
        this.#gpu.flush();
    }

    clear(r, g, b, a) {
        this.#gpu.clear(r, g, b, a);
    }
    
    render(scene, camera) {
        // update all actors matrix
        scene.traverse((actor) => { actor.transform.updateMatrix() })
        
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