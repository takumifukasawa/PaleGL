import {OrthographicCamera} from "./../OrthographicCamera.js";
import {Scene} from "../Scene.js";

export class PostProcess {
    #orthographicCamera = new OrthographicCamera(-1, 1, -1, 1, -1, 1);
    #scene = new Scene();
    #passes = [];
    
    constructor({ gpu }) {
    }
    
    addPass(pass) {
        this.#passes = pass;
    }
  
    render(scene, camera) {
    }
}