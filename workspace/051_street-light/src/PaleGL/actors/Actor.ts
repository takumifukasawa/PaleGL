import { Transform } from '@/PaleGL/core/Transform';
import { ActorType, ActorTypes } from '@/PaleGL/constants';
import { uuidv4 } from '@/PaleGL/utilities/uuid';
import { Animator } from '@/PaleGL/core/Animator';
import { GPU } from '@/PaleGL/core/GPU';
import { Camera } from '@/PaleGL/actors/Camera';

type OnStartCallback = (args: { actor: Actor; gpu: GPU }) => void;
type OnFixedUpdateCallback = (args: { actor: Actor; gpu: GPU; fixedTime: number; fixedDeltaTime: number }) => void;
type OnUpdateCallback = (args: { actor: Actor; gpu: GPU; time: number; deltaTime: number }) => void;

export type ActorStartArgs = { gpu: GPU };
export type ActorFixedUpdateArgs = { gpu: GPU; fixedTime: number; fixedDeltaTime: number };
export type ActorUpdateArgs = { gpu: GPU; time: number; deltaTime: number };

export type ActorArgs = { name?: string; type?: ActorType };

export class Actor {
    name: string;
    transform: Transform;
    type: ActorType;
    uuid: number;
    isStarted: boolean = false;
    animator: Animator; // TODO: いよいよcomponentっぽくしたくなってきた
    // lifecycle callback
    private _onStart: OnStartCallback[] = [];
    private _onFixedUpdate: OnFixedUpdateCallback | null = null;
    private _onUpdate: OnUpdateCallback | null = null;
    private _enabled: boolean = true;

    set enabled(value: boolean) {
        this._enabled = value;
    }

    get enabled() {
        return this._enabled;
    }

    subscribeOnStart(value: OnStartCallback) {
        this._onStart.push(value)
    }

    // TODO: onStartと同じで配列方式にする
    set onFixedUpdate(value: OnFixedUpdateCallback) {
        this._onFixedUpdate = value;
    }

    // TODO: onStartと同じで配列方式にする
    set onUpdate(value: OnUpdateCallback) {
        this._onUpdate = value;
    }

    constructor({ name = '', type = ActorTypes.Null }: ActorArgs = {}) {
        this.name = name;
        this.transform = new Transform(this);
        this.type = type || ActorTypes.Null;
        this.uuid = uuidv4();
        this.animator = new Animator();
    }

    addChild(child: Actor) {
        this.transform.addChild(child);
        // this.transform.addChild(child.transform); // NOTE: こっちが正しいはず？
        child.transform.parent = this.transform;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setSize(width: number, height: number) {}

    #tryStart({ gpu }: { gpu: GPU }) {
        if (this.isStarted) {
            return;
        }
        this.isStarted = true;
        this.start({ gpu });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateTransform(camera?: Camera) {
        this.transform.updateMatrix();
    }

    // -----------------------------------------------------------------
    // actor lifecycle
    // -----------------------------------------------------------------

    // start({gpu}: { gpu: GPU } = {}) {
    start({ gpu }: ActorStartArgs) {
        // if (this._onStart) {
        //     this._onStart({ actor: this, gpu });
        // }
        this._onStart.forEach((cb) => {
            cb({ actor: this, gpu });
        });
    }

    // fixedUpdate({gpu, fixedTime, fixedDeltaTime}: { gpu: GPU, fixedTime: number, fixedDeltaTime: number } = {}) {
    fixedUpdate({ gpu, fixedTime, fixedDeltaTime }: ActorFixedUpdateArgs) {
        this.#tryStart({ gpu });
        if (this.animator) {
            this.animator.update(fixedDeltaTime);
        }
        if (this._onFixedUpdate) {
            this._onFixedUpdate({ actor: this, gpu, fixedTime, fixedDeltaTime });
        }
    }

    // update({gpu, time, deltaTime}: { gpu: GPU, time: number, deltaTime: number } = {}) {
    update({ gpu, time, deltaTime }: ActorUpdateArgs) {
        this.#tryStart({ gpu });
        if (this._onUpdate) {
            this._onUpdate({ actor: this, gpu, time, deltaTime });
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    beforeRender({ gpu }: { gpu: GPU }) {}
}
