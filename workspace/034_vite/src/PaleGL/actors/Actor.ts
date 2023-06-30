import {Transform} from "../core/Transform.ts";
import {ActorType, ActorTypes} from "./../constants.ts";
import {uuidv4} from "../utilities/uuid.ts";
import {Animator} from "../core/Animator.ts";
import {GPU} from "../core/GPU";

export class Actor {
    transform = new Transform();
    type: ActorType
    uuid: number;
    isStarted: boolean = false;
    animator: Animator; // NOTE: いよいよcomponentっぽくしたくなってきた
    // lifecycle callback
    private onStart;
    private onFixedUpdate;
    private onUpdate;
    private enabled = true;

    set enabled(value) {
        this.enabled = value;
    }

    get enabled() {
        return this.enabled;
    }

    set onStart(value) {
        this.onStart = value;
    }

    set onFixedUpdate(value) {
        this.onFixedUpdate = value;
    }

    set onUpdate(value) {
        this.onUpdate = value;
    }

    constructor(type: ActorType = ActorTypes.Null) {
        this.transform.actor = this;
        this.type = type || ActorTypes.Null;
        this.uuid = uuidv4();
        this.animator = new Animator();
    }

    addChild(child) {
        this.transform.addChild(child);
        child.transform.parent = this.transform;
    }

    setSize(width, height) {
    }

    #tryStart({gpu}) {
        if (this.isStarted) {
            return;
        }
        this.isStarted = true;
        this.start({gpu});
    }

    updateTransform() {
        this.transform.updateMatrix();
    }

    // -----------------------------------------------------------------
    // actor lifecycle
    // -----------------------------------------------------------------

    start({gpu}: { gpu: GPU } = {}) {
        if (this.onStart) {
            this.onStart({actor: this, gpu});
        }
    }

    fixedUpdate({gpu, fixedTime, fixedDeltaTime}: { gpu: GPU, fixedTime: number, fixedDeltaTime: number } = {}) {
        this.#tryStart({gpu});
        if (this.animator) {
            this.animator.update(fixedDeltaTime);
        }
        if (this.onFixedUpdate) {
            this.onFixedUpdate({actor: this, gpu, fixedTime, fixedDeltaTime});
        }
    }

    update({gpu, time, deltaTime}: { gpu: GPU, time: number, deltaTime: number } = {}) {
        this.#tryStart({gpu});
        if (this.onUpdate) {
            this.onUpdate({actor: this, gpu, time, deltaTime});
        }
    }

    beforeRender({gpu}: { gpu: GPU }) {
    }
}
