import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';
import { Scene } from '@/PaleGL/core/scene.ts';

export type ComponentStartArgs = { scene: Scene; gpu: Gpu };
export type ComponentFixedUpdateArgs = { gpu: Gpu; fixedTime: number; fixedDeltaTime: number };
export type ComponentBeforeUpdateArgs = { gpu: Gpu; time: number; deltaTime: number };
export type ComponentUpdateArgs = { gpu: Gpu; time: number; deltaTime: number };
export type ComponentLastUpdateArgs = { gpu: Gpu; time: number; deltaTime: number };

type OnStartCallback = (args: { scene: Scene; gpu: Gpu }) => void;
type OnFixedUpdateCallback = (args: { gpu: Gpu; fixedTime: number; fixedDeltaTime: number }) => void;
type OnBeforeUpdateCallback = (args: { gpu: Gpu; time: number; deltaTime: number }) => void;
type OnUpdateCallback = (args: { gpu: Gpu; time: number; deltaTime: number }) => void;
type OnLastUpdateCallback = (args: { gpu: Gpu; time: number; deltaTime: number }) => void;
type OnProcessPropertyBinderCallback = (key: string, value: number) => void;
type OnPostProcessTimelineCallback = (timelineTime: number) => void;

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

export type Component = ReturnType<typeof createComponent>;

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


export function createComponent(args: ComponentArgs) {
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
   
    let _actor: Actor | null = null;

    const start = (args: ComponentStartArgs) => {
        if (onStartCallback) {
            onStartCallback(args);
        }
    };

    const fixedUpdate = (args: ComponentFixedUpdateArgs) => {
        if (onFixedUpdateCallback) {
            onFixedUpdateCallback(args);
        }
    };

    const beforeUpdate = (args: ComponentBeforeUpdateArgs) => {
        if (onBeforeUpdateCallback) {
            onBeforeUpdateCallback(args);
        }
    };

    const update = (args: ComponentUpdateArgs) => {
        if (onUpdateCallback) {
            onUpdateCallback(args);
        }
    };

    const lastUpdate = (args: ComponentLastUpdateArgs) => {
        if (onLastUpdateCallback) {
            onLastUpdateCallback(args);
        }
    };

    const processPropertyBinder = (key: string, value: number) => {
        if (onProcessPropertyBinder) {
            onProcessPropertyBinder(key, value);
        }
    };

    const postProcessTimeline = (timelineTime: number) => {
        if (onPostProcessTimeline) {
            onPostProcessTimeline(timelineTime);
        }
    };
    
    return {
        name: name || "",
        getActor: () => _actor,
        setActor: (actor: Actor) => (_actor = actor),
        start,
        fixedUpdate,
        beforeUpdate,
        update,
        lastUpdate,
        processPropertyBinder,
        postProcessTimeline,
    };
}
