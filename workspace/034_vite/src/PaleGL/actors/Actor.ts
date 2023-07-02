import {Transform} from "../core/Transform";
import {ActorType, ActorTypes} from "./../constants";
import {uuidv4} from "../utilities/uuid";
import {Animator} from "../core/Animator";
import {GPU} from "../core/GPU";
import {Camera} from "./Camera";

type OnStartCallback = (args: { actor: Actor, gpu: GPU }) => void;
type OnFixedUpdateCallback = (args: { actor: Actor, gpu: GPU, fixedTime: number, fixedDeltaTime: number }) => void;
type OnUpdateCallback = (args: { actor: Actor, gpu: GPU, time: number, deltaTime: number }) => void;

export type ActorStartArgs = { gpu: GPU };
export type ActorFixedUpdateArgs = { gpu: GPU, fixedTime: number, fixedDeltaTime: number };
export type ActorUpdateArgs = { gpu: GPU, time: number, deltaTime: number };

export class Actor {
    transform: Transform;
    type: ActorType
    uuid: number;
    isStarted: boolean = false;
    animator: Animator; // NOTE: いよいよcomponentっぽくしたくなってきた
    // lifecycle callback
    private _onStart: OnStartCallback | null = null;
    private _onFixedUpdate: OnFixedUpdateCallback | null = null;
    private _onUpdate: OnUpdateCallback | null = null;
    private _enabled: boolean = true;

    set enabled(value: boolean) {
        this._enabled = value;
    }

    get enabled() {
        return this._enabled;
    }

    set onStart(value: OnStartCallback) {
        this._onStart = value;
    }

    set onFixedUpdate(value: OnFixedUpdateCallback) {
        this._onFixedUpdate = value;
    }

    set onUpdate(value: OnUpdateCallback) {
        this._onUpdate = value;
    }

    constructor(type: ActorType = ActorTypes.Null) {
        this.transform = new Transform(this);
        this.type = type || ActorTypes.Null;
        this.uuid = uuidv4();
        this.animator = new Animator();
    }

    addChild(child: Actor) {
        // this.transform.addChild(child);
        this.transform.addChild(child.transform); // NOTE: こっちが正しいはず？
        child.transform.parent = this.transform;
    }

    // @ts-ignore
    setSize(width: number, height: number) {
    }

    #tryStart({gpu}: { gpu: GPU }) {
        if (this.isStarted) {
            return;
        }
        this.isStarted = true;
        this.start({gpu});
    }

    // @ts-ignore
    updateTransform(camera?: Camera) {
        this.transform.updateMatrix();
    }

    // -----------------------------------------------------------------
    // actor lifecycle
    // -----------------------------------------------------------------

    // start({gpu}: { gpu: GPU } = {}) {
    start({gpu}: ActorStartArgs) {
        if (this._onStart) {
            this._onStart({actor: this, gpu});
        }
    }

    // fixedUpdate({gpu, fixedTime, fixedDeltaTime}: { gpu: GPU, fixedTime: number, fixedDeltaTime: number } = {}) {
    fixedUpdate({gpu, fixedTime, fixedDeltaTime}: ActorFixedUpdateArgs) {
        this.#tryStart({gpu});
        if (this.animator) {
            this.animator.update(fixedDeltaTime);
        }
        if (this._onFixedUpdate) {
            this._onFixedUpdate({actor: this, gpu, fixedTime, fixedDeltaTime});
        }
    }

    // update({gpu, time, deltaTime}: { gpu: GPU, time: number, deltaTime: number } = {}) {
    update({gpu, time, deltaTime}: ActorUpdateArgs) {
        this.#tryStart({gpu});
        if (this._onUpdate) {
            this._onUpdate({actor: this, gpu, time, deltaTime});
        }
    }

    // @ts-ignore
    beforeRender({gpu}: { gpu: GPU }) {
    }
}
