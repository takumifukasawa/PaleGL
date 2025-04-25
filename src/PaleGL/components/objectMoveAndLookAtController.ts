import { ComponentBehaviour, ComponentModel, createComponent } from '@/PaleGL/components/component.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';
import { Vector3 } from '@/PaleGL/math/vector3.ts';
import { findActorInSceneByName, Scene } from '@/PaleGL/core/scene.ts';
import { setLookAtActor } from '@/PaleGL/core/transform.ts';

export type ObjectMoveAndLookAtController = [
    ComponentModel,
    ComponentBehaviour & {
        execute: (args: { actor: Actor; localPosition: Vector3; scene: Scene }) => void;
    },
];

// timeline から操作される
export function createObjectMoveAndLookAtController(args: {
    localPosition: Vector3;
    lookAtTargetName: string;
}): ObjectMoveAndLookAtController {
    const initialLocalPosition = args.localPosition;
    const lookAtTargetName = args.lookAtTargetName;
    let lookAtTargetActor: Actor | null = null;

    const update = (actor: Actor, scene: Scene, localPosition: Vector3) => {
        lookAtTargetActor = findActorInSceneByName(scene, lookAtTargetName);
        actor.transform.position = localPosition;
        if (lookAtTargetActor) {
            setLookAtActor(actor.transform, lookAtTargetActor);
        }
    };

    const [componentModel, componentBehaviour] = createComponent({
        onStartCallback: (actor, _model, _gpu, scene) => {
            update(actor, scene, initialLocalPosition);
        },
    });

    return [
        componentModel,
        {
            ...componentBehaviour,
            execute: (args) => {
                const { actor, scene, localPosition } = args;
                update(actor, scene, localPosition);
            },

            // onUpdateCallback: (args) => {
            //     // const { actor } = args;
            //     // actor.transform.position = localPosition;
            //     // if(lookAtTargetActor) {
            //     //     actor.transform.lookAtActor(lookAtTargetActor);
            //     // }
            // }
        },
    ];
}
