import {Transform} from "../core/Transform.js";
import {ActorTypes} from "./../constants.js";

export class Actor {
    transform = new Transform();
    type;
    
    constructor(type) {
        this.transform.actor = this;
        this.type = type || ActorTypes.Null;
    }
    
    addChild(child) {
        this.transform.addChild(child);
        child.transform.parent = this.transform;
    }

    update({ gpu }) {
    }

    updateTransform() {
        this.transform.updateMatrix();
    }
    
    afterUpdatedTransform() {
    }
}