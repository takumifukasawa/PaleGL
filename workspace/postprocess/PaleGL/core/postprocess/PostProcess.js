import {OrthographicCamera} from "./../OrthographicCamera.js";
import {Scene} from "../Scene.js";
import {RenderTarget} from "../RenderTarget.js";

export class PostProcess {
    #scene;
    #sceneCamera;
    #passes = [];
    #renderer;
    #renderTarget;
    
    constructor({ gpu, renderer }) {
        this.#renderer = renderer;
        this.#renderTarget = new RenderTarget({ gpu, width: 1, height: 1 });
    }
    
    setSize(width, height) {
        this.#renderTarget.setSize(width, height);
        this.#passes.forEach(pass => pass.setSize(width, height));
    }
    
    addPass(pass) {
        this.#passes.push(pass);
    }
  
    render(scene, camera) {
        camera.setRenderTarget(this.#renderTarget);
        this.#renderer.render(scene, camera);
        
        this.#passes.forEach((pass, i) => {
            pass.renderToScreen = i === this.#passes.length - 1;
            pass.render(this.#renderer, i === 0 ? this.#renderTarget : this.#passes[i - 1].renderTarget);
        });
    }
}