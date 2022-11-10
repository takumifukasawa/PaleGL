import {Transform} from "../core/Transform.js";
import {ActorTypes} from "./../constants.js";
import {uuidv4} from "../utilities/uuid.js";

export class Actor {
    transform = new Transform();
    type;
    uuid;
    isStarted = false;
    // lifecycle callback
    #onStart;
    #onFixedUpdate;
    #onUpdate;
    
    set onStart(value) {
        this.#onStart = value;
    }
    
    set onFixedUpdate(value) {
        this.#onFixedUpdate = value;
    }
    
    set onUpdate(value) {
        this.#onUpdate = value;
    }
    
    constructor(type) {
        this.transform.actor = this;
        this.type = type || ActorTypes.Null;
        this.uuid = uuidv4();
    }
    
    addChild(child) {
        this.transform.addChild(child);
        child.transform.parent = this.transform;
    }
   
    setSize(width, height) {
    }
    
    #tryStart({ gpu }) {
        if(!this.isStarted) {
            return;
        }
        this.start({ gpu });
    }

    updateTransform() {
        this.transform.updateMatrix();
    }
    
    // -----------------------------------------------------------------
    // actor lifecycle
    // -----------------------------------------------------------------
    
    start({ gpu }) {
        if(this.#onStart) {
            this.#onStart({ gpu });
        }
    }
    
    fixedUpdate({ gpu, fixedTime, fixedDeltaTime }) {
        this.#tryStart({ gpu });
        if(this.#onFixedUpdate) {
            this.#onFixedUpdate({ gpu, fixedTime, fixedDeltaTime });
        }
    }

    update({ gpu, time, deltaTime }) {
        this.#tryStart({ gpu });
        if(this.#onUpdate) {
            this.#onUpdate({ gpu, time, deltaTime });
        }
    }
}