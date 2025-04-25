import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';
import { Scene } from '@/PaleGL/core/scene.ts';
import {TimelinePropertyValue} from "@/Marionetter/types";

// export type ComponentStartArgs = { scene: Scene; gpu: Gpu };
// export type ComponentFixedUpdateArgs = { gpu: Gpu; fixedTime: number; fixedDeltaTime: number };
// export type ComponentBeforeUpdateArgs = { gpu: Gpu; time: number; deltaTime: number };
// export type ComponentUpdateArgs = { gpu: Gpu; time: number; deltaTime: number };
// export type ComponentLastUpdateArgs = { gpu: Gpu; time: number; deltaTime: number };

type OnStartCallback = (actor: Actor, componentModel: ComponentModel, gpu: Gpu, scene: Scene) => void;
type OnFixedUpdateCallback = (actor: Actor, componentModel: ComponentModel, gpu: Gpu, fixedTime: number, fixedDeltaTime: number) => void;
type OnBeforeUpdateCallback = (actor: Actor, componentModel: ComponentModel, gpu: Gpu, time: number, deltaTime: number) => void;
type OnUpdateCallback = (actor: Actor, componentModel: ComponentModel, gpu: Gpu, time: number, deltaTime: number) => void;
type OnLastUpdateCallback = (actor: Actor, componentModel: ComponentModel, gpu: Gpu, time: number, deltaTime: number) => void;
type OnProcessPropertyBinderCallback = <T extends TimelinePropertyValue>(actor: Actor, componentModel: ComponentModel, key: string, value: T) => void;
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
    name?: string,
    actor?: Actor,
}

export type ComponentBehaviour = {
    onStartCallback?: OnStartCallback,
    onFixedUpdateCallback?: OnFixedUpdateCallback,
    onBeforeUpdateCallback?: OnBeforeUpdateCallback,
    onUpdateCallback?: OnUpdateCallback,
    onLastUpdateCallback?: OnLastUpdateCallback,
    onProcessPropertyBinder?: OnProcessPropertyBinderCallback,
    onPostProcessTimeline?: OnPostProcessTimelineCallback,
}

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
        onProcessPropertyBinder,
        onPostProcessTimeline,
    } = args;
   
    // const start = (args: ComponentStartArgs) => {
    //     if (onStartCallback && _actor) {
    //         onStartCallback(_actor, args);
    //     }
    // };

    // const fixedUpdate = (args: ComponentFixedUpdateArgs) => {
    //     if (onFixedUpdateCallback) {
    //         onFixedUpdateCallback(args);
    //     }
    // };

    // const beforeUpdate = (args: ComponentBeforeUpdateArgs) => {
    //     if (onBeforeUpdateCallback) {
    //         onBeforeUpdateCallback(args);
    //     }
    // };

    // const update = (args: ComponentUpdateArgs) => {
    //     if (onUpdateCallback) {
    //         onUpdateCallback(args);
    //     }
    // };

    // const lastUpdate = (args: ComponentLastUpdateArgs) => {
    //     if (onLastUpdateCallback) {
    //         onLastUpdateCallback(args);
    //     }
    // };

    // const processPropertyBinder = (key: string, value: number) => {
    //     if (onProcessPropertyBinder) {
    //         onProcessPropertyBinder(key, value);
    //     }
    // };

    // const postProcessTimeline = (timelineTime: number) => {
    //     if (onPostProcessTimeline) {
    //         onPostProcessTimeline(timelineTime);
    //     }
    // };
    
    const model: ComponentModel = {
        name: name || "",
    }
    const behaviour: ComponentBehaviour = {
        onStartCallback,
        onFixedUpdateCallback,
        onBeforeUpdateCallback,
        onUpdateCallback,
        onLastUpdateCallback,
        onProcessPropertyBinder,
        onPostProcessTimeline,
    }
    
    return [model, behaviour];
    
    // return {
    //     name: name || "",
    //     onStartCallback,
    //     onProcessPropertyBinder,
    //     // start,
    //     // fixedUpdate,
    //     // beforeUpdate,
    //     // update,
    //     // lastUpdate,
    //     // processPropertyBinder,
    //     // postProcessTimeline,
    // };
}

export function setActorToComponent(componentModel: ComponentModel, actor: Actor) {
    componentModel.actor = actor;
}
