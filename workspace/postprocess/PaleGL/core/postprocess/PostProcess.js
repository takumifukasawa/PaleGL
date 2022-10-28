import {OrthographicCamera} from "./../OrthographicCamera.js";
import {Scene} from "../Scene.js";
import {RenderTarget} from "../RenderTarget.js";
import {Vector3} from "../../math/Vector3.js";

export class PostProcess {
    // #scene = new Scene();
    #sceneCamera;
    passes = [];
    renderTarget;
    camera;
    
    // get firstPass() {
    //     return this.#passes[0];
    // }
    
    // get lastPass() {
    //     return this.#passes[this.#passes.length - 1];
    // }
    
    // get firstRenderTarget() {
    //     return this.firstPass.renderTarget;
    // }
    // 
    // get lastRenderTarget() {
    //     return this.lastPass.renderTarget;
    // }
    
    constructor({ gpu }) {
        this.renderTarget = new RenderTarget({ gpu, width: 1, height: 1 });
        this.camera = new OrthographicCamera(-1, 1, -1, 1, 0, 2);
        this.camera.transform.setTranslation(new Vector3(0, 0, 1));
    }
    
    setSize(width, height) {
        this.camera.setSize(width, height);
        this.renderTarget.setSize(width, height);
        this.passes.forEach(pass => pass.setSize(width, height));
    }
   
    addPass(pass) {
        this.passes.push(pass);
    }

    // render(renderer, sceneCamera) {
    //     // camera.setRenderTarget(this.#renderTarget);
    //     // this.#renderer.render(scene, camera);

    //     this.passes.forEach((pass, i) => {
    //         pass.renderToScreen = sceneCamera.renderTarget
    //             ? false
    //             : i === this.passes.length - 1;
    //         // pass.render(renderer, i === 0 ? this.renderTarget : this.#passes[i - 1].renderTarget);
    //         pass.render(renderer, i === 0 ? sceneRenderTarget : this.passes[i - 1].renderTarget);
    //     });
    // }
}