export class ForwardRenderer {
    #gpu;

    constructor({gpu}) {
        this.#gpu = gpu;
    }
    
    setSize(width, height) {
        this.#gpu.setSize(width, height);
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