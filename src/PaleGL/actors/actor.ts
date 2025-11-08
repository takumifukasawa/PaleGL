import { createTransform, Transform } from '@/PaleGL/core/transform.ts';
import { ActorType, ACTOR_TYPE_NULL } from '@/PaleGL/constants';
import { uuidv4 } from '@/PaleGL/utilities/uuid';
import { Animator, createAnimator } from '@/PaleGL/core/animator.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Component } from '@/PaleGL/components/component.ts';
import { Scene } from '@/PaleGL/core/scene.ts';
import { MarionetterClipKinds, TimelinePropertyValue } from '@/Marionetter/types';
import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { Renderer } from '@/PaleGL/core/renderer.ts';

export type ActorStartArgs = { scene: Scene; gpu: Gpu; renderer: Renderer };
export type ActorFixedUpdateArgs = {
    scene: Scene;
    gpu: Gpu;
    renderer: Renderer;
    fixedTime: number;
    fixedDeltaTime: number;
};
export type ActorUpdateArgs = { scene: Scene; gpu: Gpu; renderer: Renderer; time: number; deltaTime: number };
export type ActorLastUpdateArgs = { scene: Scene; gpu: Gpu; renderer: Renderer; time: number; deltaTime: number };
export type ActorBeforeRenderArgs = { scene: Scene; gpu: Gpu; renderer: Renderer; time: number; deltaTime: number };

type OnStartCallback = (args: { scene: Scene; renderer: Renderer; gpu: Gpu }) => void;
type OnSetSizeCallback = (
    width: number,
    height: number,
    camera: Camera | null,
    uiCamera: OrthographicCamera | null
) => void;
type OnFixedUpdateCallback = (args: { scene: Scene; gpu: Gpu; fixedTime: number; fixedDeltaTime: number }) => void;
type OnUpdateCallback = (args: { scene: Scene; gpu: Gpu; renderer: Renderer; time: number; deltaTime: number }) => void;
type OnLastUpdateCallback = (args: { scene: Scene; gpu: Gpu; time: number; deltaTime: number }) => void;
type OnBeforeRenderCallback = (args: { scene: Scene; gpu: Gpu; renderer: Renderer; time: number; deltaTime: number }) => void;
type OnProcessPropertyBinder = <T extends TimelinePropertyValue>(
    key: string,
    value: T,
    clip: MarionetterClipKinds,
    clipTime: number
) => void;
type OnPostProcessClip = (clip: MarionetterClipKinds, clipTime: number) => void;
type OnProcessTimeline = (timelineTime: number) => void;

export type ActorArgs = { name?: string; type?: ActorType };

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
    onSetSize: OnSetSizeCallback[];
    onFixedUpdate: OnFixedUpdateCallback[];
    onUpdate: OnUpdateCallback[];
    onLastUpdate: OnLastUpdateCallback[];
    onBeforeRender: OnBeforeRenderCallback[];
    onProcessPropertyBinder: OnProcessPropertyBinder[];
    onPostProcessClip: OnPostProcessClip[]
    onPreProcessTimeline: OnProcessTimeline[];
    onPostProcessTimeline: OnProcessTimeline[];
    enabled: boolean;
};

export const createActor = ({ name = '', type = ACTOR_TYPE_NULL }: ActorArgs = {}): Actor => {
    const uuid: number = uuidv4();
    const isStarted: boolean = false;
    const transform = createTransform();
    const children: Actor[] = [];
    const components: Component[] = [];
    const animator: Animator = createAnimator(); // TODO: component化

    // lifecycle callback
    const onStart: OnStartCallback[] = [];
    const onSetSize: OnSetSizeCallback[] = [];
    const onFixedUpdate: OnFixedUpdateCallback[] = [];
    const onUpdate: OnUpdateCallback[] = [];
    const onLastUpdate: OnLastUpdateCallback[] = [];
    const onBeforeRender: OnBeforeRenderCallback[] = [];
    // TODO: timeline
    // let _onProcessClipFrame: OnProcessPropertyBinder | null = null;
    const onProcessPropertyBinder: OnProcessPropertyBinder[] = [];
    const onPostProcessClip: OnPostProcessClip[] = [];
    const onPreProcessTimeline: OnProcessTimeline[] = [];
    const onPostProcessTimeline: OnProcessTimeline[] = [];
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
        onSetSize,
        onFixedUpdate,
        onUpdate,
        onLastUpdate,
        onBeforeRender,
        onProcessPropertyBinder,
        onPostProcessClip,
        onPreProcessTimeline,
        onPostProcessTimeline,
        enabled,
    };

    return actor;
};

export const getActorChildCount = (actor: Actor) => {
    return actor.children.length;
};

export const getActorHasChild = (actor: Actor) => {
    return getActorChildCount(actor) > 0;
};

export const addChildActor = (parent: Actor, child: Actor) => {
    parent.children.push(child);
    child.parent = parent;
};

export const subscribeActorOnStart = (actor: Actor, value: OnStartCallback) => {
    actor.onStart.push(value);
};

export const subscribeActorOnSetSize = (actor: Actor, value: OnSetSizeCallback) => {
    actor.onSetSize.push(value);
};

export const subscribeActorOnUpdate = (actor: Actor, value: OnUpdateCallback) => {
    actor.onUpdate.push(value);
};

export const subscribeActorProcessPropertyBinder = (actor: Actor, value: OnProcessPropertyBinder) => {
    actor.onProcessPropertyBinder.push(value);
};

export const subscribeActorPostProcessClip = (actor: Actor, value: OnPostProcessClip) => {
    actor.onPostProcessClip.push(value);
};

export const subscribeActorPreProcessTimeline = (actor: Actor, value: OnProcessTimeline) => {
    actor.onPreProcessTimeline.push(value);
};

export const subscribeActorPostProcessTimeline = (actor: Actor, value: OnProcessTimeline) => {
    actor.onPostProcessTimeline.push(value);
};

export const subscribeActorBeforeRender = (actor: Actor, value: OnBeforeRenderCallback) => {
    actor.onBeforeRender.push(value);
};

export const addActorComponent = (actor: Actor, component: Component) => {
    actor.components.push(component);
};

export const addActorComponents = (actor: Actor, components: Component[]) => {
    actor.components.push(...components);
};

export const getActorComponent = <T extends Component>(actor: Actor): T | null => {
    return actor.components.find((component) => component) as T;
};

// export const disposeActor = (actor: Actor) => {
//     // dispose components
//     actor.components.forEach((component) => {
//         disposeComponent(component);
//     });
// }
