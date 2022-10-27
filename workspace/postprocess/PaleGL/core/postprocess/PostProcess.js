import {OrthographicCamera} from "./../OrthographicCamera.js";
import {Scene} from "../Scene.js";

export class PostProcess {
    #orthographicCamera;
    #scene;
    #passes;
    
    constructor({ gpu }) {
        this.#orthographicCamera = new OrthographicCamera(-1, 1, -1, 1, -1, 1);
        this.#scene = new Scene();
        this.#passes = [];
    }
    
    addPass() {
    }
  
    render() {
    }
}