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

export type ComponentModel = {
    name?: string;
    actor?: Actor;
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
};

export type Component = [ComponentModel, ComponentBehaviour];
// name: string,
// actor: Actor | undefined,
// onStartCallback?: OnStartCallback,
// onProcessPropertyBinder?: OnProcessPropertyBinderCallback,
// }

export type ComponentArgs = {
    name?: string;
    onStartCallback?: OnStartCallback;
    onFixedUpdateCallback?: OnFixedUpdateCallback;
    onBeforeUpdateCallback?: OnBeforeUpdateCallback;
    onUpdateCallback?: OnUpdateCallback;
    onLastUpdateCallback?: OnLastUpdateCallback;
    onFilterPropertyBinder?: OnFilterPropertyBinderCallback;
    onProcessPropertyBinder?: OnProcessPropertyBinderCallback;
    onPostProcessTimeline?: OnPostProcessTimelineCallback;
};

export function createComponent(args: ComponentArgs): Component {
    const {
        name,
        onStartCallback,
        onFixedUpdateCallback,
        onBeforeUpdateCallback,
        onUpdateCallback,
        onLastUpdateCallback,
        onFilterPropertyBinder = () => true, 
        onProcessPropertyBinder,
        onPostProcessTimeline,
    } = args;

    const model: ComponentModel = {
        name: name || '',
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
    };

    return [model, behaviour];
}

export function setActorToComponent(componentModel: ComponentModel, actor: Actor) {
    componentModel.actor = actor;
}
