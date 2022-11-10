import {Transform} from "../core/Transform.js";
import {ActorTypes} from "./../constants.js";
import {uuidv4} from "../utilities/uuid.js";

export class Actor {
    transform = new Transform();
    type;
    uuid;
    
    constructor(type) {
        this.transform.actor = this;
        this.type = type || ActorTypes.Null;
        this.uuid = uuidv4();
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