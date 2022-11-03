import {OrthographicCamera} from "./../core/OrthographicCamera.js";
import {RenderTarget} from "../core/RenderTarget.js";
import {Vector3} from "../math/Vector3.js";

export class PostProcess {
    passes = [];
    renderTarget;
    #camera;
    
    constructor({ gpu }) {
        this.renderTarget = new RenderTarget({ gpu, width: 1, height: 1, useDepth: true });
        this.#camera = new OrthographicCamera(-1, 1, -1, 1, 0, 2);
        this.#camera.transform.setTranslation(new Vector3(0, 0, 1));
    }
 
    setSize(width, height) {
        this.#camera.setSize(width, height);
        this.renderTarget.setSize(width, height);
        this.passes.forEach(pass => pass.setSize(width, height));
    }
   
    addPass(pass) {
        this.passes.push(pass);
    }

    render(renderer, sceneCamera) {
        this.#camera.updateTransform();
        let prevRenderTarget = this.renderTarget;
        // TODO
        // - filterでenabledなpassのみ抽出
        this.passes.forEach((pass, i) => {
            const isLastPass = i === this.passes.length - 1;
            if(isLastPass) {
                renderer.setRenderTarget(sceneCamera.renderTarget);
            } else {
                renderer.setRenderTarget(pass.renderTarget);
            }
            renderer.clear(
                this.#camera.clearColor.x,
                this.#camera.clearColor.y,
                this.#camera.clearColor.z,
                this.#camera.clearColor.w
            );
            pass.mesh.updateTransform();
            pass.mesh.material.uniforms.uSceneTexture.value = prevRenderTarget.texture;
            renderer.renderMesh(pass.mesh);
            prevRenderTarget = pass.renderTarget;
        });
    }
}