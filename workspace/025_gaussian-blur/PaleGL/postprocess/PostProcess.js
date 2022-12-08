import {OrthographicCamera} from "./../actors/OrthographicCamera.js";
import {RenderTarget} from "../core/RenderTarget.js";
import {Vector3} from "../math/Vector3.js";

// TODO: actorを継承してもいいかもしれない
export class PostProcess {
    passes = [];
    renderTarget;
    #camera;
    
    #selfEnabled = true;
    
    get enabled() {
        if(!this.#selfEnabled) {
            return false;
        }
        
        for(let i = 0; i < this.passes.length; i++) {
            if(this.passes[i].enabled) {
                return true;
            }
        }
        
        return false;
    }

    set enabled(value) {
        this.#selfEnabled = value;
    }
    
    constructor({ gpu }) {
        this.renderTarget = new RenderTarget({ gpu, width: 1, height: 1, useDepthBuffer: true });
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

    render({ gpu, renderer, camera }) {
        this.#camera.updateTransform();
        let prevRenderTarget = this.renderTarget;

        // TODO
        // - filterでenabledなpassのみ抽出
        const enabledPasses = this.passes.filter(pass => pass.enabled);
        enabledPasses.forEach((pass, i) => {
            const isLastPass = i === enabledPasses.length - 1;
            // if(isLastPass) {
            //     renderer.setRenderTarget(camera.renderTarget);
            // } else {
            //     renderer.setRenderTarget(pass.renderTarget);
            // }

            pass.render({
                gpu,
                renderer,
                camera: this.#camera,
                prevRenderTarget,
                isLastPass,
            });

            renderer.renderMesh(pass.mesh.geometry, pass.mesh.material);

            prevRenderTarget = pass.renderTarget;
        });
    }
}