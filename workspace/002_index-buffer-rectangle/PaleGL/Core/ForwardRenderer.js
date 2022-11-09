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
        scene.children.forEach(mesh => {
            this.#gpu.setVertexArrayObject(mesh.geometry.vertexArrayObject);
            if (mesh.geometry.indexBufferObject) {
                this.#gpu.setIndexBufferObject(mesh.geometry.indexBufferObject);
            }
            this.#gpu.setShader(mesh.material.shader);
            this.#gpu.draw(mesh.geometry.drawCount, mesh.material.primitiveType);
        });
    }
}