import { createTransform, Transform } from '@/PaleGL/core/transform.ts';
import { ActorType, ActorTypes } from '@/PaleGL/constants';
import { uuidv4 } from '@/PaleGL/utilities/uuid';
import { Animator, createAnimator } from '@/PaleGL/core/animator.ts';
import { GPU } from '@/PaleGL/core/GPU';
import { Component } from '@/PaleGL/core/component.ts';
import { Scene } from '@/PaleGL/core/scene.ts';

export type ActorStartArgs = { scene: Scene; gpu: GPU };
export type ActorFixedUpdateArgs = { scene: Scene; gpu: GPU; fixedTime: number; fixedDeltaTime: number };
export type ActorUpdateArgs = { scene: Scene; gpu: GPU; time: number; deltaTime: number };
export type ActorLastUpdateArgs = { scene: Scene; gpu: GPU; time: number; deltaTime: number };

type OnStartCallback = (args: { scene: Scene; gpu: GPU }) => void;
type OnFixedUpdateCallback = (args: { scene: Scene; gpu: GPU; fixedTime: number; fixedDeltaTime: number }) => void;
type OnUpdateCallback = (args: { scene: Scene; gpu: GPU; time: number; deltaTime: number }) => void;
type OnLastUpdateCallback = (args: { scene: Scene; gpu: GPU; time: number; deltaTime: number }) => void;
type OnBeforeRenderCallback = () => void;
type OnProcessPropertyBinder = (key: string, value: number) => void;
type OnProcessTimeline = (timelineTime: number) => void;

export type ActorArgs = { name?: string; type?: ActorType };

// export class Actor {
//     name: string;
//     transform: Transform;
//     type: ActorType;
//     uuid: number;
//     isStarted: boolean = false;
//     parent: Actor | null = null;
//     children: Actor[] = [];
//     components: Component[] = [];
//     animator: Animator | null = null; // TODO: component化
//
//     // lifecycle callback
//     _onStart: OnStartCallback[] = [];
//     _onFixedUpdate: OnFixedUpdateCallback | null = null;
//     _onUpdate: OnUpdateCallback | null = null;
//     _onLastUpdate: OnLastUpdateCallback | null = null;
//     _onProcessClipFrame: OnProcessPropertyBinder | null = null;
//     _onBeforeRender: OnBeforeRenderCallback | null = null;
//     _onProcessPropertyBinder: OnProcessPropertyBinder | null = null;
//     _onPreProcessTimeline: OnProcessTimeline | null = null;
//     _onPostProcessTimeline: OnProcessTimeline | null = null;
//     _enabled: boolean = true;
//
//     get childCount() {
//         return _children.length;
//     }
//
//     get hasChild() {
//         return _childCount > 0;
//     }
//
//     set enabled(value: boolean) {
//         this._enabled = value;
//     }
//
//     get enabled() {
//         return this._enabled;
//     }
//
//     subscribeOnStart(value: OnStartCallback) {
//         _onStart.push(value);
//     }
//
//     // TODO: onStartと同じで配列方式にする
//     set onFixedUpdate(value: OnFixedUpdateCallback) {
//         _onFixedUpdate = value;
//     }
//
//     // TODO: onStartと同じで配列方式にする
//     set onUpdate(value: OnUpdateCallback) {
//         _onUpdate = value;
//     }
//
//     set onLastUpdate(value: OnLastUpdateCallback) {
//         _onLastUpdate = value;
//     }
//
//     set onBeforeRender(value: OnBeforeRenderCallback) {
//         _onBeforeRender = value;
//     }
//
//     set onProcessPropertyBinder(value: OnProcessPropertyBinder) {
//         _onProcessPropertyBinder = value;
//     }
//
//     set onPreProcessTimeline(value: OnProcessTimeline) {
//         _onPreProcessTimeline = value;
//     }
//
//     set onPostProcessTimeline(value: OnProcessTimeline) {
//         _onPostProcessTimeline = value;
//     }
//
//     constructor({ name = '', type = ActorTypes.Null }: ActorArgs = {}) {
//         this.name = name;
//         _transform = createTransform(this);
//         this.type = type || ActorTypes.Null;
//         this.uuid = uuidv4();
//         _animator = createAnimator();
//     }
//
//     addChild(child: Actor) {
//         _children.push(child);
//         // _transform.addChild(child);
//         // // _transform.addChild(child.transform); // NOTE: こっちが正しいはず？
//         child.parent = this;
//     }
//
//     addComponent(component: Component) {
//         _components.push(component);
//     }
//
//     getComponent<T extends Component>(): T | null {
//         return _components.find((component) => component) as T;
//     }
//
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     setSize(width: number, height: number) {}
//
//     $tryStart({ gpu, scene }: ActorStartArgs) {
//         if (_isStarted) {
//             return;
//         }
//         _isStarted = true;
//         this.start({ gpu, scene });
//     }
//
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     $updateTransform(cameras?: Camera) {
//         _transform.updateMatrix();
//     }
//
//     // -----------------------------------------------------------------
//     // actor lifecycle
//     // -----------------------------------------------------------------
//
//     start({ gpu, scene }: ActorStartArgs) {
//         _components.forEach((component) => {
//             component.start({ actor: this, gpu, scene });
//         });
//         _onStart.forEach((cb) => {
//             cb({ actor: this, gpu, scene });
//         });
//     }
//
//     fixedUpdate({ gpu, scene, fixedTime, fixedDeltaTime }: ActorFixedUpdateArgs) {
//         _tryStart({ gpu, scene });
//         _components.forEach((component) => {
//             component.fixedUpdate({ actor: this, gpu, fixedTime, fixedDeltaTime });
//         });
//         if (_animator) {
//             _animator.update(fixedDeltaTime);
//         }
//         if (_onFixedUpdate) {
//             _onFixedUpdate({ actor: this, gpu, scene, fixedTime, fixedDeltaTime });
//         }
//     }
//
//     // update({gpu, time, deltaTime}: { gpu: GPU, time: number, deltaTime: number } = {}) {
//     update({ gpu, scene, time, deltaTime }: ActorUpdateArgs) {
//         _tryStart({ gpu, scene });
//         _components.forEach((component) => {
//             component.update({ actor: this, gpu, time, deltaTime });
//         });
//         if (_onUpdate) {
//             _onUpdate({ actor: this, gpu, scene, time, deltaTime });
//         }
//     }
//
//     lastUpdate({ gpu, scene, time, deltaTime }: ActorLastUpdateArgs) {
//         _tryStart({ gpu, scene });
//         _components.forEach((component) => {
//             component.lastUpdate({ actor: this, gpu, time, deltaTime });
//         });
//         if (_onLastUpdate) {
//             _onLastUpdate({ actor: this, gpu, scene, time, deltaTime });
//         }
//     }
//
//     // updateTimeline(time: number, prevTime: number, deltaTime: number) {
//     //     if()
//     // }
//
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     beforeRender({ gpu }: { gpu: GPU }) {
//         if (_onBeforeRender) {
//             _onBeforeRender(this);
//         }
//
//         // TODO: componentで必要になったら呼ぶ
//     }
//
//     processPropertyBinder(key: string, value: number) {
//         if (_onProcessPropertyBinder) {
//             _onProcessPropertyBinder(key, value);
//         }
//         _components.forEach((component) => {
//             component.processPropertyBinder?.(key, value);
//         });
//     }
//
//     preProcessTimeline(timelineTime: number) {
//         if (_onPreProcessTimeline) {
//             _onPreProcessTimeline(timelineTime);
//         }
//         // _components.forEach((component) => {
//         //     component.processTimeline?.(timelineTime, timelinePrevTime, timelineDeltaTime);
//         // });
//     }
//
//     postProcessTimeline(timelineTime: number) {
//         if (_onPostProcessTimeline) {
//             _onPostProcessTimeline(timelineTime);
//         }
//         _components.forEach((component) => {
//             component.postProcessTimeline?.(this, timelineTime);
//         });
//     }
// }

// export type ActorBase = {
//     getName: () => string;
//     getType: () => ActorType;
//     getUUID: () => number;
//     getEnabled: () => boolean;
//     setEnabled: (value: boolean) => void;
//     setOnFixedUpdate: (value: OnFixedUpdateCallback) => void;
//     setOnUpdate: (value: OnUpdateCallback) => void;
//     setOnLastUpdate: (value: OnLastUpdateCallback) => void;
//     setOnBeforeRender: (value: OnBeforeRenderCallback) => void;
//     setOnProcessPropertyBinder: (value: OnProcessPropertyBinder) => void;
//     setOnPreProcessTimeline: (value: OnProcessTimeline) => void;
//     setOnPostProcessTimeline: (value: OnProcessTimeline) => void;
//     subscribeOnStart: (value: OnStartCallback) => void;
//     addComponent: (component: Component) => void;
//     getComponent: <T extends Component>() => T | null;
//     setSize: (width: number, height: number) => void;
//     start: (args: ActorStartArgs) => void;
//     fixedUpdate: (args: ActorFixedUpdateArgs) => void;
//     update: (args: ActorUpdateArgs) => void;
//     lastUpdate: (args: ActorLastUpdateArgs) => void;
//     beforeRender: (args: { gpu: GPU }) => void;
//     processPropertyBinder: (key: string, value: number) => void;
//     preProcessTimeline: (timelineTime: number) => void;
//     postProcessTimeline: (timelineTime: number) => void;
// };

// export type Actor = ActorBase & {
//     // parent: Actor;
//     getTransform: () => Transform;
//     updateTransform: (cameras?: Camera) => void;
//     getChildCount: () => number;
//     getHasChild: () => boolean;
//     addChild: (child: Actor) => void;
//     getParent: () => Actor | null;
//     setParent: (parent: Actor) => void;
// };

// export type UpdateActorFunc = (actor: Actor, args: ActorUpdateArgs) => void;
// export type UpdateActorTransformFunc = (actor: Actor, cameras?: Camera) => void;

export type Actor = {
    name: string;
    type: ActorType;
    uuid: number;
    isStarted: boolean;
    transform: Transform;
    parent: Actor | null;
    children: Actor[];
    components: Component[];
    animator: Animator;
    onStart: OnStartCallback[];
    onFixedUpdate: OnFixedUpdateCallback | null;
    onUpdate: OnUpdateCallback | null;
    onLastUpdate: OnLastUpdateCallback | null;
    onBeforeRender: OnBeforeRenderCallback | null;
    onProcessPropertyBinder: OnProcessPropertyBinder | null;
    onPreProcessTimeline: OnProcessTimeline | null;
    onPostProcessTimeline: OnProcessTimeline | null;
    enabled: boolean;
    // // methods
    // start: StartActorFunc;
    // setSize: SetSizeActorFunc;
    // tryStart: (actor: Actor, args: ActorStartArgs) => void;
    // fixedUpdate: (actor: Actor, args: ActorFixedUpdateArgs) => void;
    // update: UpdateActorFunc;
    // lastUpdate: (actor: Actor, args: ActorLastUpdateArgs) => void;
    // beforeRender: (actor: Actor, args: { gpu: GPU }) => void;
    // processPropertyBinder: (actor: Actor, key: string, value: number) => void;
    // preProcessTimeline: (actor: Actor, timelineTime: number) => void;
    // postProcessTimeline: (actor: Actor, timelineTime: number) => void;
    // updateTransform: UpdateActorTransformFunc;
};

export const createActor = ({ name = '', type = ActorTypes.Null }: ActorArgs = {}): Actor => {
    // let _transform: Transform = createTransform(null); // あとで自身がセットされる
    const uuid: number = uuidv4();
    const isStarted: boolean = false;
    // let _parent: Actor | null = null;
    const transform = createTransform();
    const children: Actor[] = [];
    const components: Component[] = [];
    const animator: Animator = createAnimator(); // TODO: component化

    // lifecycle callback
    const onStart: OnStartCallback[] = [];
    const onFixedUpdate: OnFixedUpdateCallback | null = null;
    const onUpdate: OnUpdateCallback | null = null;
    const onLastUpdate: OnLastUpdateCallback | null = null;
    // TODO: timeline
    // let _onProcessClipFrame: OnProcessPropertyBinder | null = null;
    const onBeforeRender: OnBeforeRenderCallback | null = null;
    const onProcessPropertyBinder: OnProcessPropertyBinder | null = null;
    const onPreProcessTimeline: OnProcessTimeline | null = null;
    const onPostProcessTimeline: OnProcessTimeline | null = null;
    const enabled: boolean = true;

    const actor = {
        name,
        type,
        uuid,
        isStarted,
        transform,
        parent: null,
        children,
        components,
        animator,
        onStart,
        onFixedUpdate,
        onUpdate,
        onLastUpdate,
        onBeforeRender,
        onProcessPropertyBinder,
        onPreProcessTimeline,
        onPostProcessTimeline,
        enabled,
        // // methods
        // start: startActor,
        // setSize: setSizeActor,
        // tryStart: tryStartActor,
        // fixedUpdate: fixedUpdateActor,
        // update: updateActor,
        // lastUpdate: lastUpdateActor,
        // beforeRender: beforeRenderActor,
        // processPropertyBinder: processActorPropertyBinder,
        // preProcessTimeline: preProcessActorTimeline,
        // postProcessTimeline: postProcessActorTimeline,
        // updateTransform: updateActorTransform
    };

    // actor.transform.setActor(actor);

    return actor;
};

// // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// // @ts-ignore
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// export const updateActorTransform: UpdateActorTransformFunc = (actor, cameras) => {
//     actor.transform.updateMatrix();
// };

export const getActorChildCount = (actor: Actor) => {
    return actor.children.length;
};

export const getActorHasChild = (actor: Actor) => {
    return getActorChildCount(actor) > 0;
};

export const addChildActor = (parent: Actor, child: Actor) => {
    parent.children.push(child);
    // _transform.addChild(child);
    // // _transform.addChild(child.transform); // NOTE: こっちが正しいはず？
    // child.setParent(_actor);
    // child.parent = parent;
    child.parent = parent;
};

export const subscribeActorOnStart = (actor: Actor, value: OnStartCallback) => {
    actor.onStart.push(value);
};

export const addActorComponent = (actor: Actor, component: Component) => {
    actor.components.push(component);
};

export function getActorComponent<T extends Component>(actor: Actor): T | null {
    return actor.components.find((component) => component) as T;
}
