import {Transform} from "./Transform.js";

export class Actor {
    transform = new Transform();
    
    constructor() {
        this.transform.actor = this;
    }
    
    addChild(child) {
        this.transform.addChild(child);
        child.transform.parent = this.transform;
    }
    
    updateTransform() {
        this.transform.updateMatrix();
    }
}