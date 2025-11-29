import { Actor } from '@/PaleGL/actors/actor.ts';
import { ComponentBehaviour, ComponentModel, createComponent } from '@/PaleGL/components/component.ts';
import { COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT } from '@/PaleGL/constants.ts';
import { findActorInSceneByName, Scene } from '@/PaleGL/core/scene.ts';
import { setLookAtActor, setLookAtPosition } from '@/PaleGL/core/transform.ts';
import { addVector3AndVector3, cloneVector3, copyVector3, createVector3, createVector3Zero, Vector3 } from '@/PaleGL/math/vector3.ts';

export type ObjectMoveAndLookAtControllerBehaviour = ComponentBehaviour & {
    execute: (args: { actor: Actor; localPosition: Vector3; upVector: Vector3; scene: Scene }) => void;
    setPositionOffset: (v: Vector3) => void;
    setLookAtOffset: (v: Vector3) => void;
};

export type ObjectMoveAndLookAtController = [ComponentModel, ObjectMoveAndLookAtControllerBehaviour];

// timeline から操作される
export const createObjectMoveAndLookAtController = (args: {
    localPosition: Vector3;
    upVector: Vector3;
    lookAtTargetName: string;
}): ObjectMoveAndLookAtController => {
    const initialLocalPosition = args.localPosition;
    const initialUpVector = args.upVector;
    const lookAtTargetName = args.lookAtTargetName;
    let lookAtTargetActor: Actor | undefined;
    const offsetCache: Vector3 = createVector3Zero();
    const lookAtOffsetCache: Vector3 = createVector3Zero();
    let currentLocalPosition = createVector3Zero();
    let currentLookAtOffset = createVector3Zero();

    const update = (actor: Actor, scene: Scene, localPosition: Vector3, upVector: Vector3) => {
        copyVector3(currentLocalPosition, localPosition);
        currentLocalPosition = addVector3AndVector3(localPosition, offsetCache);

        actor.transform.position = currentLocalPosition;
        copyVector3(actor.transform.upVector, upVector);

        lookAtTargetActor = findActorInSceneByName(scene, lookAtTargetName);
        if (lookAtTargetActor) {
            copyVector3(currentLookAtOffset, cloneVector3(lookAtTargetActor.transform.position));
            currentLookAtOffset = addVector3AndVector3(currentLookAtOffset, lookAtOffsetCache);
            // どっち使うか出し分けられる方がよい
            // setLookAtActor(actor.transform, lookAtTargetActor);
            // TODO: これを使いたいがこれを使うとなぜかバグい. 多分updateの順番の問題
            // console.log(lookAtTargetActor.transform.position, currentLookAtOffset, lookAtOffsetCache);
            // setLookAtPosition(actor.transform, currentLookAtOffset);
            // copyVector3(actor.transform.lookAtTargetOffset, currentLookAtOffset);
            setLookAtPosition(actor.transform, lookAtTargetActor.transform.position)
            // setLookAtPosition(actor.transform, addV lookAtTargetActor.transform.position)
        }
    };

    const [componentModel, componentBehaviour] = createComponent({
        type: COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT,
        onStartCallback: (actor, _model, _gpu, scene) => {
            update(actor, scene, initialLocalPosition, initialUpVector);
        },
    });

    return [
        componentModel,
        {
            ...componentBehaviour,
            execute: (args) => {
                const { actor, scene, localPosition, upVector } = args;
                update(actor, scene, localPosition, upVector);
            },
            setPositionOffset: (v: Vector3) => {
                copyVector3(offsetCache, v);
            },
            setLookAtOffset: (v: Vector3) => {
                // なんかバグい
                copyVector3(lookAtOffsetCache, v);
            },
        },
    ];
};
