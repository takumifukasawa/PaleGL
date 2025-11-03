import { Actor } from '@/PaleGL/actors/actor.ts';
import {
    COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT,
    ComponentBehaviour,
    ComponentModel,
    createComponent,
} from '@/PaleGL/components/component.ts';
import { findActorInSceneByName, Scene } from '@/PaleGL/core/scene.ts';
import { setLookAtActor } from '@/PaleGL/core/transform.ts';
import { addVector3AndVector3, copyVector3, createVector3Zero, Vector3 } from '@/PaleGL/math/vector3.ts';

export type ObjectMoveAndLookAtControllerBehaviour = ComponentBehaviour & {
    execute: (args: { actor: Actor; localPosition: Vector3; scene: Scene }) => void;
    setOffset: (v: Vector3) => void;
};

export type ObjectMoveAndLookAtController = [ComponentModel, ObjectMoveAndLookAtControllerBehaviour];

// timeline から操作される
export const createObjectMoveAndLookAtController = (args: {
    localPosition: Vector3;
    lookAtTargetName: string;
}): ObjectMoveAndLookAtController => {
    const initialLocalPosition = args.localPosition;
    const lookAtTargetName = args.lookAtTargetName;
    let lookAtTargetActor: Actor | null = null;
    let offset: Vector3 = createVector3Zero();
    let currentLocalPosition = createVector3Zero();

    const update = (actor: Actor, scene: Scene, localPosition: Vector3) => {
        lookAtTargetActor = findActorInSceneByName(scene, lookAtTargetName);
        copyVector3(currentLocalPosition, localPosition);
        currentLocalPosition = addVector3AndVector3(localPosition, offset);

        // actor.transform.position = localPosition;
        actor.transform.position = currentLocalPosition;

        if (lookAtTargetActor) {
            setLookAtActor(actor.transform, lookAtTargetActor);
        }
    };

    const [componentModel, componentBehaviour] = createComponent({
        name: 'ObjectMoveAndLookAtController',
        type: COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT,
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
            setOffset: (v: Vector3) => {
                copyVector3(v, offset);
            },
        },
    ];
};
