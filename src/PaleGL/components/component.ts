import { TimelinePropertyValue } from '@/Marionetter/types';
import { Actor } from '@/PaleGL/actors/actor.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Scene } from '@/PaleGL/core/scene.ts';

// export type ComponentStartArgs = { scene: Scene; gpu: Gpu };
// export type ComponentFixedUpdateArgs = { gpu: Gpu; fixedTime: number; fixedDeltaTime: number };
// export type ComponentBeforeUpdateArgs = { gpu: Gpu; time: number; deltaTime: number };
// export type ComponentUpdateArgs = { gpu: Gpu; time: number; deltaTime: number };
// export type ComponentLastUpdateArgs = { gpu: Gpu; time: number; deltaTime: number };

type OnStartCallback = (actor: Actor, componentModel: ComponentModel, gpu: Gpu, scene: Scene) => void;
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
type OnProcessPropertyBinderCallback = <T extends TimelinePropertyValue>(
    actor: Actor,
    componentModel: ComponentModel,
    key: string,
    value: T
) => void;
type OnPostProcessTimelineCallback = (actor: Actor, componentModel: ComponentModel, timelineTime: number) => void;
type OnBeforeRenderCallback = (actor: Actor, componentModel: ComponentModel, gpu: Gpu) => void;

// export type Component = {
//     name: string;
//     start: (args: ComponentStartArgs) => void;
//     fixedUpdate: (args: ComponentFixedUpdateArgs) => void;
//     beforeUpdate: (args: ComponentBeforeUpdateArgs) => void;
//     update: (args: ComponentUpdateArgs) => void;
//     lastUpdate: (args: ComponentLastUpdateArgs) => void;
//     processPropertyBinder?: (key: string, value: number) => void;
//     postProcessTimeline?: (actor: Actor, timelineTime: number) => void;
// };

export const COMPONENT_TYPE_DEFAULT = 0;
export const COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT = 1;

export type ComponentType = typeof COMPONENT_TYPE_DEFAULT | typeof COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT;

export type ComponentModel = {
    name?: string;
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
    onProcessPropertyBinder?: OnProcessPropertyBinderCallback;
    onPostProcessTimeline?: OnPostProcessTimelineCallback;
    onBeforeRenderCallback?: OnBeforeRenderCallback;
};

export type Component = [ComponentModel, ComponentBehaviour];
// name: string,
// actor: Actor | undefined,
// onStartCallback?: OnStartCallback,
// onProcessPropertyBinder?: OnProcessPropertyBinderCallback,
// }

export type ComponentArgs = {
    name?: string;
    type?: ComponentType;
    onStartCallback?: OnStartCallback;
    onFixedUpdateCallback?: OnFixedUpdateCallback;
    onBeforeUpdateCallback?: OnBeforeUpdateCallback;
    onUpdateCallback?: OnUpdateCallback;
    onLastUpdateCallback?: OnLastUpdateCallback;
    onFilterPropertyBinder?: OnFilterPropertyBinderCallback;
    onProcessPropertyBinder?: OnProcessPropertyBinderCallback;
    onPostProcessTimeline?: OnPostProcessTimelineCallback;
    onBeforeRenderCallback?: OnBeforeRenderCallback;
};

export const createComponent = (args: ComponentArgs): Component => {
    const {
        name,
        type,
        onStartCallback,
        onFixedUpdateCallback,
        onBeforeUpdateCallback,
        onUpdateCallback,
        onLastUpdateCallback,
        onFilterPropertyBinder = () => true,
        onProcessPropertyBinder,
        onPostProcessTimeline,
        onBeforeRenderCallback,
    } = args;

    const model: ComponentModel = {
        name: name || '',
        type: type || COMPONENT_TYPE_DEFAULT,
    };
    const behaviour: ComponentBehaviour = {
        onStartCallback,
        onFixedUpdateCallback,
        onBeforeUpdateCallback,
        onUpdateCallback,
        onLastUpdateCallback,
        onFilterPropertyBinder,
        onProcessPropertyBinder,
        onPostProcessTimeline,
        onBeforeRenderCallback,
    };

    return [model, behaviour];
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
