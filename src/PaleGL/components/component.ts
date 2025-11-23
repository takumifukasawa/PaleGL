import { MarionetterClipKinds, MarionetterTimelineDefaultTrack, TimelinePropertyValue } from '@/Marionetter/types';
import { Actor } from '@/PaleGL/actors/actor.ts';
import { COMPONENT_TYPE_DEFAULT, ComponentType } from '@/PaleGL/constants.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Scene } from '@/PaleGL/core/scene.ts';

// export type ComponentStartArgs = { scene: Scene; gpu: Gpu };
// export type ComponentFixedUpdateArgs = { gpu: Gpu; fixedTime: number; fixedDeltaTime: number };
// export type ComponentBeforeUpdateArgs = { gpu: Gpu; time: number; deltaTime: number };
// export type ComponentUpdateArgs = { gpu: Gpu; time: number; deltaTime: number };
// export type ComponentLastUpdateArgs = { gpu: Gpu; time: number; deltaTime: number };

export type OnStartCallback = (actor: Actor, componentModel: ComponentModel, gpu: Gpu, scene: Scene) => void;
type OnFixedUpdateCallback = (
    actor: Actor,
    componentModel: ComponentModel,
    gpu: Gpu,
    fixedTime: number,
    fixedDeltaTime: number
) => void;
type OnBeforeUpdateCallback = (
    actor: Actor,
    componentModel: ComponentModel,
    gpu: Gpu,
    time: number,
    deltaTime: number
) => void;
type OnUpdateCallback = (
    actor: Actor,
    componentModel: ComponentModel,
    gpu: Gpu,
    scene: Scene,
    time: number,
    deltaTime: number
) => void;
type OnLastUpdateCallback = (
    actor: Actor,
    componentModel: ComponentModel,
    gpu: Gpu,
    time: number,
    deltaTime: number
) => void;
type OnFilterPropertyBinderCallback = (key: string) => boolean;
export type OnPreProcessTimelineCallback = (actor: Actor, componentModel: ComponentModel, timelineTime: number) => void;
export type OnProcessPropertyBinderCallback = <T extends TimelinePropertyValue>(
    actor: Actor,
    componentModel: ComponentModel,
    key: string,
    value: T
) => void;
export type OnPostProcessClipCallback = (
    actor: Actor,
    componentModel: ComponentModel,
    track: MarionetterTimelineDefaultTrack,
    clip: MarionetterClipKinds,
    clipTime: number
) => void;
export type OnPostProcessTimelineCallback = (
    actor: Actor,
    componentModel: ComponentModel,
    timelineTime: number
) => void;
type OnBeforeRenderCallback = (actor: Actor, componentModel: ComponentModel, gpu: Gpu, scene: Scene) => void;

export type ComponentModel = {
    actor?: Actor;
    type: ComponentType;
};

export type ComponentBehaviour = {
    onStartCallback?: OnStartCallback;
    onFixedUpdateCallback?: OnFixedUpdateCallback;
    onBeforeUpdateCallback?: OnBeforeUpdateCallback;
    onUpdateCallback?: OnUpdateCallback;
    onLastUpdateCallback?: OnLastUpdateCallback;
    onFilterPropertyBinder: OnFilterPropertyBinderCallback;
    onPreProcessTimeline?: OnPreProcessTimelineCallback;
    onProcessPropertyBinder?: OnProcessPropertyBinderCallback;
    onPostProcessClip?: OnPostProcessClipCallback;
    onPostProcessTimeline?: OnPostProcessTimelineCallback;
    onBeforeRenderCallback?: OnBeforeRenderCallback;
};

// export type Component<T> = [ComponentModel, ComponentBehaviour];
export type Component<T extends ComponentModel = ComponentModel, U extends ComponentBehaviour = ComponentBehaviour> = [
    T,
    U,
];

export type ComponentArgs = {
    type?: ComponentType;
    onStartCallback?: OnStartCallback;
    onFixedUpdateCallback?: OnFixedUpdateCallback;
    onBeforeUpdateCallback?: OnBeforeUpdateCallback;
    onUpdateCallback?: OnUpdateCallback;
    onLastUpdateCallback?: OnLastUpdateCallback;
    onFilterPropertyBinder?: OnFilterPropertyBinderCallback;
    onPreProcessTimeline?: OnPreProcessTimelineCallback;
    onProcessPropertyBinder?: OnProcessPropertyBinderCallback;
    onPostProcessClip?: OnPostProcessClipCallback;
    onPostProcessTimeline?: OnPostProcessTimelineCallback;
    onBeforeRenderCallback?: OnBeforeRenderCallback;
};

type AdditionalComponentBehaviour = object;

export const createComponent = <
    T extends ComponentModel = ComponentModel,
    U extends ComponentBehaviour = ComponentBehaviour,
>(
    args: ComponentArgs,
    additionalBehaviour: AdditionalComponentBehaviour = {}
): Component<T, U> => {
    const {
        type,
        onStartCallback,
        onFixedUpdateCallback,
        onBeforeUpdateCallback,
        onUpdateCallback,
        onLastUpdateCallback,
        onFilterPropertyBinder = () => true,
        onPreProcessTimeline,
        onProcessPropertyBinder,
        onPostProcessClip,
        onPostProcessTimeline,
        onBeforeRenderCallback,
    } = args;

    const model: ComponentModel = {
        type: type || COMPONENT_TYPE_DEFAULT,
    };
    const behaviour: ComponentBehaviour = {
        onStartCallback,
        onFixedUpdateCallback,
        onBeforeUpdateCallback,
        onUpdateCallback,
        onLastUpdateCallback,
        onFilterPropertyBinder,
        onPreProcessTimeline,
        onProcessPropertyBinder,
        onPostProcessClip,
        onPostProcessTimeline,
        onBeforeRenderCallback,
        ...additionalBehaviour,
    };

    return [model, behaviour] as Component<T, U>;
};

export const setActorToComponent = (componentModel: ComponentModel, actor: Actor) => {
    componentModel.actor = actor;
};

export function findComponentByType<T extends Component>(components: Component[], type: ComponentType): T | null {
    for (let i = 0; i < components.length; i++) {
        const component = components[i];
        if (component[0].type === type) {
            return components[i] as T;
        }
    }
    return null;
}
export function getComponentModel<T extends ComponentModel>(component: Component) {
    return component[0] as T;
}
export function getComponentBehaviour<T extends ComponentBehaviour>(component: Component) {
    return component[1] as T;
}
