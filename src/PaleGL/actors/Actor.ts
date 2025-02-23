import { Transform } from '@/PaleGL/core/Transform';
import { ActorType, ActorTypes } from '@/PaleGL/constants';
import { uuidv4 } from '@/PaleGL/utilities/uuid';
import { Animator } from '@/PaleGL/core/Animator';
import { GPU } from '@/PaleGL/core/GPU';
import { Component } from '@/PaleGL/core/Component.ts';
import { Camera } from '@/PaleGL/actors/Camera';
import { Scene } from '@/PaleGL/core/scene.ts';

export type ActorStartArgs = { scene: Scene; gpu: GPU };
export type ActorFixedUpdateArgs = { scene: Scene; gpu: GPU; fixedTime: number; fixedDeltaTime: number };
export type ActorUpdateArgs = { scene: Scene; gpu: GPU; time: number; deltaTime: number };
export type ActorLastUpdateArgs = { scene: Scene; gpu: GPU; time: number; deltaTime: number };

type OnStartCallback = (args: { scene: Scene; actor: Actor; gpu: GPU }) => void;
type OnFixedUpdateCallback = (args: {
    scene: Scene;
    actor: Actor;
    gpu: GPU;
    fixedTime: number;
    fixedDeltaTime: number;
}) => void;
type OnUpdateCallback = (args: { scene: Scene; actor: Actor; gpu: GPU; time: number; deltaTime: number }) => void;
type OnLastUpdateCallback = (args: { scene: Scene; actor: Actor; gpu: GPU; time: number; deltaTime: number }) => void;
type OnBeforeRenderCallback = (actor: Actor) => void;
type OnProcessPropertyBinder = (key: string, value: number) => void;
type OnProcessTimeline = (timelineTime: number) => void;

export type ActorArgs = { name?: string; type?: ActorType };

export class Actor {
    name: string;
    transform: Transform;
    type: ActorType;
    uuid: number;
    isStarted: boolean = false;
    parent: Actor | null = null;
    children: Actor[] = [];
    components: Component[] = [];
    animator: Animator | null = null; // TODO: component化

    // lifecycle callback
    _onStart: OnStartCallback[] = [];
    _onFixedUpdate: OnFixedUpdateCallback | null = null;
    _onUpdate: OnUpdateCallback | null = null;
    _onLastUpdate: OnLastUpdateCallback | null = null;
    _onProcessClipFrame: OnProcessPropertyBinder | null = null;
    _onBeforeRender: OnBeforeRenderCallback | null = null;
    _onProcessPropertyBinder: OnProcessPropertyBinder | null = null;
    _onPreProcessTimeline: OnProcessTimeline | null = null;
    _onPostProcessTimeline: OnProcessTimeline | null = null;
    _enabled: boolean = true;

    get childCount() {
        return this.children.length;
    }

    get hasChild() {
        return this.childCount > 0;
    }

    set enabled(value: boolean) {
        this._enabled = value;
    }

    get enabled() {
        return this._enabled;
    }

    subscribeOnStart(value: OnStartCallback) {
        this._onStart.push(value);
    }

    // TODO: onStartと同じで配列方式にする
    set onFixedUpdate(value: OnFixedUpdateCallback) {
        this._onFixedUpdate = value;
    }

    // TODO: onStartと同じで配列方式にする
    set onUpdate(value: OnUpdateCallback) {
        this._onUpdate = value;
    }

    set onLastUpdate(value: OnLastUpdateCallback) {
        this._onLastUpdate = value;
    }

    set onBeforeRender(value: OnBeforeRenderCallback) {
        this._onBeforeRender = value;
    }

    set onProcessPropertyBinder(value: OnProcessPropertyBinder) {
        this._onProcessPropertyBinder = value;
    }

    set onPreProcessTimeline(value: OnProcessTimeline) {
        this._onPreProcessTimeline = value;
    }

    set onPostProcessTimeline(value: OnProcessTimeline) {
        this._onPostProcessTimeline = value;
    }

    constructor({ name = '', type = ActorTypes.Null }: ActorArgs = {}) {
        this.name = name;
        this.transform = new Transform(this);
        this.type = type || ActorTypes.Null;
        this.uuid = uuidv4();
        this.animator = new Animator();
    }

    addChild(child: Actor) {
        this.children.push(child);
        // this.transform.addChild(child);
        // // this.transform.addChild(child.transform); // NOTE: こっちが正しいはず？
        child.parent = this;
    }

    addComponent(component: Component) {
        this.components.push(component);
    }

    getComponent<T extends Component>(): T | null {
        return this.components.find((component) => component) as T;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setSize(width: number, height: number) {}

    $tryStart({ gpu, scene }: ActorStartArgs) {
        if (this.isStarted) {
            return;
        }
        this.isStarted = true;
        this.start({ gpu, scene });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    $updateTransform(camera?: Camera) {
        this.transform.$updateMatrix();
    }

    // -----------------------------------------------------------------
    // actor lifecycle
    // -----------------------------------------------------------------

    start({ gpu, scene }: ActorStartArgs) {
        this.components.forEach((component) => {
            component.start({ actor: this, gpu, scene });
        });
        this._onStart.forEach((cb) => {
            cb({ actor: this, gpu, scene });
        });
    }

    fixedUpdate({ gpu, scene, fixedTime, fixedDeltaTime }: ActorFixedUpdateArgs) {
        this.$tryStart({ gpu, scene });
        this.components.forEach((component) => {
            component.fixedUpdate({ actor: this, gpu, fixedTime, fixedDeltaTime });
        });
        if (this.animator) {
            this.animator.update(fixedDeltaTime);
        }
        if (this._onFixedUpdate) {
            this._onFixedUpdate({ actor: this, gpu, scene, fixedTime, fixedDeltaTime });
        }
    }

    // update({gpu, time, deltaTime}: { gpu: GPU, time: number, deltaTime: number } = {}) {
    update({ gpu, scene, time, deltaTime }: ActorUpdateArgs) {
        this.$tryStart({ gpu, scene });
        this.components.forEach((component) => {
            component.update({ actor: this, gpu, time, deltaTime });
        });
        if (this._onUpdate) {
            this._onUpdate({ actor: this, gpu, scene, time, deltaTime });
        }
    }

    lastUpdate({ gpu, scene, time, deltaTime }: ActorLastUpdateArgs) {
        this.$tryStart({ gpu, scene });
        this.components.forEach((component) => {
            component.lastUpdate({ actor: this, gpu, time, deltaTime });
        });
        if (this._onLastUpdate) {
            this._onLastUpdate({ actor: this, gpu, scene, time, deltaTime });
        }
    }

    // updateTimeline(time: number, prevTime: number, deltaTime: number) {
    //     if()
    // }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    beforeRender({ gpu }: { gpu: GPU }) {
        if (this._onBeforeRender) {
            this._onBeforeRender(this);
        }

        // TODO: componentで必要になったら呼ぶ
    }

    processPropertyBinder(key: string, value: number) {
        if (this._onProcessPropertyBinder) {
            this._onProcessPropertyBinder(key, value);
        }
        this.components.forEach((component) => {
            component.processPropertyBinder?.(key, value);
        });
    }

    preProcessTimeline(timelineTime: number) {
        if (this._onPreProcessTimeline) {
            this._onPreProcessTimeline(timelineTime);
        }
        // this.components.forEach((component) => {
        //     component.processTimeline?.(timelineTime, timelinePrevTime, timelineDeltaTime);
        // });
    }

    postProcessTimeline(timelineTime: number) {
        if (this._onPostProcessTimeline) {
            this._onPostProcessTimeline(timelineTime);
        }
        this.components.forEach((component) => {
            component.postProcessTimeline?.(this, timelineTime);
        });
    }
}
