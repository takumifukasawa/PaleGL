import { GPU } from '@/PaleGL/core/GPU.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { Scene } from '@/PaleGL/core/scene.ts';

export type ComponentStartArgs = { scene: Scene; actor: Actor; gpu: GPU };
export type ComponentFixedUpdateArgs = { actor: Actor; gpu: GPU; fixedTime: number; fixedDeltaTime: number };
export type ComponentBeforeUpdateArgs = { actor: Actor; gpu: GPU; time: number; deltaTime: number };
export type ComponentUpdateArgs = { actor: Actor; gpu: GPU; time: number; deltaTime: number };
export type ComponentLastUpdateArgs = { actor: Actor; gpu: GPU; time: number; deltaTime: number };

type OnStartCallback = (args: { scene: Scene; actor: Actor; gpu: GPU }) => void;
type OnFixedUpdateCallback = (args: { actor: Actor; gpu: GPU; fixedTime: number; fixedDeltaTime: number }) => void;
type OnBeforeUpdateCallback = (args: { actor: Actor; gpu: GPU; time: number; deltaTime: number }) => void;
type OnUpdateCallback = (args: { actor: Actor; gpu: GPU; time: number; deltaTime: number }) => void;
type OnLastUpdateCallback = (args: { actor: Actor; gpu: GPU; time: number; deltaTime: number }) => void;
type OnProcessPropertyBinderCallback = (key: string, value: number) => void;
type OnPostProcessTimelineCallback = (actor: Actor, timelineTime: number) => void;

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

    const postProcessTimeline = (actor: Actor, timelineTime: number) => {
        if (onPostProcessTimeline) {
            onPostProcessTimeline(actor, timelineTime);
        }
    };
    
    return {
        name: name || "",
        start,
        fixedUpdate,
        beforeUpdate,
        update,
        lastUpdate,
        processPropertyBinder,
        postProcessTimeline,
    };
}
