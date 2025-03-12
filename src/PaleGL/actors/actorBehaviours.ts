import { ActorType, ActorTypes } from '@/PaleGL/constants.ts';
import {
    Actor,
    ActorFixedUpdateArgs,
    ActorLastUpdateArgs,
    ActorStartArgs,
    ActorUpdateArgs,
    // SetSizeActorFunc,
} from '@/PaleGL/actors/actor.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import {Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { updateSkyboxTransform } from '@/PaleGL/actors/meshes/skybox.ts';
import { updateLight } from '@/PaleGL/actors/lights/lightBehaviours.ts';
import { setSizeMesh, startMesh, updateMesh } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import {setSizeCamera, updateCamera, updateCameraTransform} from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { updateActorTransformMatrix } from '@/PaleGL/core/transform.ts';
import {updateAnimator} from "@/PaleGL/core/animator.ts";

// try start actor -------------------------------------------------------

export const tryStartActor = (actor: Actor, { gpu, scene }: ActorStartArgs) => {
    if (actor.isStarted) {
        return;
    }
    actor.isStarted = true;
    // console.log("hogehoge - try start actor", actor.name, actor.isStarted)
    startActor(actor, { gpu, scene });
};

// start actor -------------------------------------------------------

export type StartActorFunc = (actor: Actor, args: ActorStartArgs) => void;

export function startActorBehaviourBase(actor: Actor, { gpu, scene }: ActorStartArgs) {
    actor.components.forEach((component) => {
        component.start({ gpu, scene });
    });
    actor.onStart.forEach((cb) => {
        cb({ gpu, scene });
    });
}

export const startActorBehaviour: Partial<Record<ActorType, (actor: Actor, { gpu, scene }: ActorStartArgs) => void>> = {
    [ActorTypes.Mesh]: startMesh,
    // [ActorTypes.SkinnedMesh]: startSkinnedMesh,
    [ActorTypes.Skybox]: startMesh,
    // [ActorTypes.ObjectSpaceRaymarchMesh]: startMesh,
    // [ActorTypes.ScreenSpaceRaymarchMesh]: startMesh,
};

const startActor = (actor: Actor, { gpu, scene }: ActorStartArgs) => {
    // // startの場合は必ず共通処理を通す
    // actor.components.forEach((component) => {
    //     component.start({ gpu, scene });
    // });
    // actor.onStart.forEach((cb) => {
    //     cb({ gpu, scene });
    // });

    (startActorBehaviour[actor.type] ?? startActorBehaviourBase)(actor, { gpu, scene });
};

// set size -------------------------------------------------------

export type SetSizeActorFunc = (actor: Actor, width: number, height: number) => void;

const setSizeActorBehaviour: Partial<Record<ActorType, SetSizeActorFunc>> = {
    [ActorTypes.Camera]: setSizeCamera,
    [ActorTypes.Mesh]: setSizeMesh,
};

export const setSizeActor: SetSizeActorFunc = (actor, width, height) => {
    setSizeActorBehaviour[actor.type]?.(actor, width, height);
};

// fixed update -------------------------------------------------------

export const fixedUpdateActor = (actor: Actor, { gpu, scene, fixedTime, fixedDeltaTime }: ActorFixedUpdateArgs) => {
    tryStartActor(actor, { gpu, scene });
    actor.components.forEach((component) => {
        component.fixedUpdate({ gpu, fixedTime, fixedDeltaTime });
    });
    if (actor.animator) {
        updateAnimator(actor.animator, fixedDeltaTime);
    }
    if (actor.onFixedUpdate) {
        actor.onFixedUpdate({ gpu, scene, fixedTime, fixedDeltaTime });
    }
};

// update -------------------------------------------------------

export type UpdateActorFunc = (actor: Actor, { gpu, scene, time, deltaTime }: ActorUpdateArgs) => void;

// export const defaultUpdateActorBehaviour: UpdateActorFunc = (actor: Actor, { gpu, scene, time, deltaTime }: ActorUpdateArgs) => {

const updateActorBehaviour: Partial<Record<ActorType, UpdateActorFunc>> = {
    [ActorTypes.Light]: updateLight,
    [ActorTypes.Mesh]: updateMesh,
    [ActorTypes.Camera]: updateCamera
};

// update({gpu, time, deltaTime}: { gpu: Gpu, time: number, deltaTime: number } = {}) {
export const updateActor: UpdateActorFunc = (actor, { gpu, scene, time, deltaTime }) => {
    // updateの場合は必ず共通処理を通す
    tryStartActor(actor, { gpu, scene });
    actor.components.forEach((component) => {
        component.update({ gpu, time, deltaTime });
    });
    if (actor.onUpdate) {
        actor.onUpdate({ gpu, scene, time, deltaTime });
    }

    // console.log(actor.type, actor.name)
    updateActorBehaviour[actor.type]?.(actor, { gpu, scene, time, deltaTime });
};

//

export const lastUpdateActor = (actor: Actor, { gpu, scene, time, deltaTime }: ActorLastUpdateArgs) => {
    tryStartActor(actor, { gpu, scene });
    actor.components.forEach((component) => {
        component.lastUpdate({ gpu, time, deltaTime });
    });
    if (actor.onLastUpdate) {
        actor.onLastUpdate({ gpu, scene, time, deltaTime });
    }
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const beforeRenderActor = (actor: Actor, { gpu }: { gpu: Gpu }) => {
    if (actor.onBeforeRender) {
        actor.onBeforeRender();
    }
    // TODO: componentで必要になったら呼ぶ
};

export const processActorPropertyBinder = (actor: Actor, key: string, value: number) => {
    if (actor.onProcessPropertyBinder) {
        actor.onProcessPropertyBinder(key, value);
    }
    actor.components.forEach((component) => {
        component.processPropertyBinder?.(key, value);
    });
};

export const preProcessActorTimeline = (actor: Actor, timelineTime: number) => {
    if (actor.onPreProcessTimeline) {
        actor.onPreProcessTimeline(timelineTime);
    }
    // _components.forEach((component) => {
    //     component.processTimeline?.(timelineTime, timelinePrevTime, timelineDeltaTime);
    // });
};

export const postProcessActorTimeline = (actor: Actor, timelineTime: number) => {
    if (actor.onPostProcessTimeline) {
        actor.onPostProcessTimeline(timelineTime);
    }
    actor.components.forEach((component) => {
        component.postProcessTimeline?.(timelineTime);
    });
};

// export const setActorLookAt = (actor: Actor, p: Vector3) => {
//     setActorLookAt(actor, p);
// };

// update actor transform -------------------------------------------------------

export type UpdateActorTransformFunc = (actor: Actor, camera?: Camera) => void;

export const defaultUpdateActorTransform: UpdateActorTransformFunc = (actor) => {
    // // console.log("hogehoge - default update actor transform:", `name: ${actor.name}`, actor.isStarted, actor.parent, actor.children, actor.transform.getActor())
    // console.log("hogehoge - default update actor transform:", `name: ${actor.name}`, actor.isStarted)
    updateActorTransformMatrix(actor);
};

const updateActorTransformBehaviour: Partial<Record<ActorType, UpdateActorTransformFunc>> = {
    [ActorTypes.Skybox]: updateSkyboxTransform,
    [ActorTypes.Camera]: updateCameraTransform,
};

export const updateActorTransform: UpdateActorTransformFunc = (actor: Actor, camera?: Camera) => {
    (updateActorTransformBehaviour[actor.type] ?? defaultUpdateActorTransform)(actor, camera);
};
