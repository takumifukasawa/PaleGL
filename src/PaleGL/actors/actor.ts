import { createTransform, Transform } from '@/PaleGL/core/transform.ts';
import { ActorType, ActorTypes } from '@/PaleGL/constants';
import { uuidv4 } from '@/PaleGL/utilities/uuid';
import { Animator, createAnimator } from '@/PaleGL/core/animator.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Component } from '@/PaleGL/components/component.ts';
import { Scene } from '@/PaleGL/core/scene.ts';
import { TimelinePropertyValue } from '@/Marionetter/types';

export type ActorStartArgs = { scene: Scene; gpu: Gpu };
export type ActorFixedUpdateArgs = { scene: Scene; gpu: Gpu; fixedTime: number; fixedDeltaTime: number };
export type ActorUpdateArgs = { scene: Scene; gpu: Gpu; time: number; deltaTime: number };
export type ActorLastUpdateArgs = { scene: Scene; gpu: Gpu; time: number; deltaTime: number };

type OnStartCallback = (args: { scene: Scene; gpu: Gpu }) => void;
type OnSetSizeCallback = (width: number, height: number) => void;
type OnFixedUpdateCallback = (args: { scene: Scene; gpu: Gpu; fixedTime: number; fixedDeltaTime: number }) => void;
type OnUpdateCallback = (args: { scene: Scene; gpu: Gpu; time: number; deltaTime: number }) => void;
type OnLastUpdateCallback = (args: { scene: Scene; gpu: Gpu; time: number; deltaTime: number }) => void;
type OnBeforeRenderCallback = () => void;
type OnProcessPropertyBinder = <T extends TimelinePropertyValue>(key: string, value: T) => void;
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
    onFixedUpdate: OnFixedUpdateCallback | null;
    onUpdate: OnUpdateCallback[];
    onLastUpdate: OnLastUpdateCallback | null;
    onBeforeRender: OnBeforeRenderCallback | null;
    onProcessPropertyBinder: OnProcessPropertyBinder | null;
    onPreProcessTimeline: OnProcessTimeline | null;
    onPostProcessTimeline: OnProcessTimeline | null;
    enabled: boolean;
};

export const createActor = ({ name = '', type = ActorTypes.Null }: ActorArgs = {}): Actor => {
    const uuid: number = uuidv4();
    const isStarted: boolean = false;
    const transform = createTransform();
    const children: Actor[] = [];
    const components: Component[] = [];
    const animator: Animator = createAnimator(); // TODO: component化

    // lifecycle callback
    const onStart: OnStartCallback[] = [];
    const onSetSize: OnSetSizeCallback[] = [];
    const onFixedUpdate: OnFixedUpdateCallback | null = null;
    const onUpdate: OnUpdateCallback[] = [];
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
        onSetSize,
        onFixedUpdate,
        onUpdate,
        onLastUpdate,
        onBeforeRender,
        onProcessPropertyBinder,
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

export const addActorComponent = (actor: Actor, component: Component) => {
    actor.components.push(component);
};

export const addActorComponents = (actor: Actor, components: Component[]) => {
    actor.components.push(...components);
};

export function getActorComponent<T extends Component>(actor: Actor): T | null {
    return actor.components.find((component) => component) as T;
}
