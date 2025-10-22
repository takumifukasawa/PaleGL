import { TimelinePropertyValue } from '@/Marionetter/types';
import {
    Actor,
    ActorFixedUpdateArgs,
    ActorLastUpdateArgs,
    ActorStartArgs,
    ActorUpdateArgs,
} from '@/PaleGL/actors/actor.ts';
import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { setSizeCamera, updateCamera, updateCameraTransform } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { Light } from '@/PaleGL/actors/lights/light.ts';
import { updateLight } from '@/PaleGL/actors/lights/lightBehaviours.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { iterateAllMeshMaterials, setSizeMesh, startMesh, updateMesh } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { updateSkyboxTransform } from '@/PaleGL/actors/meshes/skybox.ts';
import { ActorType, ACTOR_TYPE_MESH, ACTOR_TYPE_SKYBOX, ACTOR_TYPE_CAMERA, ACTOR_TYPE_LIGHT } from '@/PaleGL/constants.ts';
import { updateAnimator } from '@/PaleGL/core/animator.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { disposeRenderTarget } from '@/PaleGL/core/renderTarget.ts';
import { updateActorTransformMatrix } from '@/PaleGL/core/transform.ts';
import { disposeMaterial } from '@/PaleGL/materials/material.ts';

// try start actor -------------------------------------------------------

export const tryStartActor = (actor: Actor, args: ActorStartArgs) => {
    if (actor.isStarted) {
        return;
    }
    actor.isStarted = true;
    // console.log("hogehoge - try start actor", actor.name, actor.isStarted)
    startActor(actor, args);
};

// start actor -------------------------------------------------------

export type StartActorFunc = (actor: Actor, args: ActorStartArgs) => void;

export function startActorBehaviourBase(actor: Actor, args: ActorStartArgs) {
    const { gpu, scene } = args;
    actor.components.forEach(([model, behaviour]) => {
        behaviour.onStartCallback?.(actor, model, gpu, scene);
    });
    actor.onStart.forEach((cb) => {
        cb(args);
    });
}

export const startActorBehaviour: Partial<Record<ActorType, (actor: Actor, { gpu, scene }: ActorStartArgs) => void>> = {
    [ACTOR_TYPE_MESH]: startMesh,
    [ACTOR_TYPE_SKYBOX]: startMesh,
};

const startActor = (actor: Actor, args: ActorStartArgs) => {
    // // startの場合は必ず共通処理を通す
    // actor.components.forEach((component) => {
    //     component.start({ gpu, scene });
    // });
    // actor.onStart.forEach((cb) => {
    //     cb({ gpu, scene });
    // });

    (startActorBehaviour[actor.type] ?? startActorBehaviourBase)(actor, args);
};

// set size -------------------------------------------------------

export type SetSizeActorFunc = (
    actor: Actor,
    width: number,
    height: number,
    camera: Camera | null,
    uiCamera: OrthographicCamera | null
) => void;

const setSizeActorBehaviour: Partial<Record<ActorType, SetSizeActorFunc>> = {
    [ACTOR_TYPE_CAMERA]: setSizeCamera,
    [ACTOR_TYPE_MESH]: setSizeMesh,
};

export const setSizeActor: SetSizeActorFunc = (
    actor,
    width,
    height,
    camera: Camera | null = null,
    uiCamera: OrthographicCamera | null = null
) => {
    actor.onSetSize.forEach((cb) => {
        cb(width, height, camera, uiCamera);
    });
    setSizeActorBehaviour[actor.type]?.(actor, width, height, camera, uiCamera);
};

// fixed update -------------------------------------------------------

export const fixedUpdateActor = (actor: Actor, args: ActorFixedUpdateArgs) => {
    const { gpu, renderer, scene, fixedTime, fixedDeltaTime } = args;
    tryStartActor(actor, { gpu, scene, renderer });
    actor.components.forEach(([model, behaviour]) => {
        behaviour.onFixedUpdateCallback?.(actor, model, gpu, fixedTime, fixedDeltaTime);
    });
    if (actor.animator) {
        updateAnimator(actor.animator, fixedDeltaTime);
    }
    actor.onFixedUpdate.forEach((cb) => {
        cb({ gpu, scene, fixedTime, fixedDeltaTime });
    });
};

// update -------------------------------------------------------

export type UpdateActorFunc = (actor: Actor, { gpu, scene, time, deltaTime }: ActorUpdateArgs) => void;

// export const defaultUpdateActorBehaviour: UpdateActorFunc = (actor: Actor, { gpu, scene, time, deltaTime }: ActorUpdateArgs) => {

const updateActorBehaviour: Partial<Record<ActorType, UpdateActorFunc>> = {
    [ACTOR_TYPE_LIGHT]: updateLight,
    [ACTOR_TYPE_MESH]: updateMesh,
    [ACTOR_TYPE_CAMERA]: updateCamera,
};

// update({gpu, time, deltaTime}: { gpu: Gpu, time: number, deltaTime: number } = {}) {
export const updateActor: UpdateActorFunc = (actor, args) => {
    const { gpu, scene, renderer, time, deltaTime } = args;
    // updateの場合は必ず共通処理を通す
    tryStartActor(actor, { gpu, scene, renderer });
    actor.components.forEach(([model, behaviour]) => {
        behaviour.onUpdateCallback?.(actor, model, gpu, time, deltaTime);
    });
    actor.onUpdate.forEach((cb) => {
        cb(args);
    });

    // console.log(actor.type, actor.name)
    updateActorBehaviour[actor.type]?.(actor, { gpu, scene, renderer, time, deltaTime });
};

//

export const lastUpdateActor = (actor: Actor, args: ActorLastUpdateArgs) => {
    const { gpu, scene, renderer, time, deltaTime } = args;
    tryStartActor(actor, { gpu, renderer, scene });
    actor.components.forEach(([model, behaviour]) => {
        behaviour.onLastUpdateCallback?.(actor, model, gpu, time, deltaTime);
    });
    actor.onLastUpdate.forEach((cb) => {
        cb({ gpu, scene, time, deltaTime });
    });
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const beforeRenderActor = (actor: Actor, { gpu }: { gpu: Gpu }) => {
    actor.onBeforeRender.forEach((cb) => {
        cb();
    });
    // TODO: componentで必要になったら呼ぶ
};

export const processActorPropertyBinder = <T extends TimelinePropertyValue>(actor: Actor, key: string, value: T) => {
    actor.onProcessPropertyBinder.forEach((cb) => cb(key, value));
    // TODO: すべてのcomponentにすべてのpropertyが渡ってしまっているので不必要なプロパティは送らないようにしたい
    actor.components.forEach(([model, behaviour]) => {
        if (behaviour.onFilterPropertyBinder(key)) {
            behaviour.onProcessPropertyBinder?.(actor, model, key, value);
        }
    });
};

export const preProcessActorTimeline = (actor: Actor, timelineTime: number) => {
    actor.onPreProcessTimeline.forEach((cb) => cb(timelineTime));
    // TODO
    // _components.forEach((component) => {
    //     component.processTimeline?.(timelineTime, timelinePrevTime, timelineDeltaTime);
    // });
};

export const postProcessActorTimeline = (actor: Actor, timelineTime: number) => {
    actor.onPostProcessTimeline.forEach((cb) => cb(timelineTime));
    actor.components.forEach(([model, behaviour]) => {
        behaviour.onPostProcessTimeline?.(actor, model, timelineTime);
    });
};

// export const setActorLookAt = (actor: Actor, p: Vector3) => {
//     setActorLookAt(actor, p);
// };

// update actor transform -------------------------------------------------------

export type UpdateActorTransformFunc = (actor: Actor, camera?: Camera) => void;

export const defaultUpdateActorTransform: UpdateActorTransformFunc = (actor) => {
    updateActorTransformMatrix(actor);
};

const updateActorTransformBehaviour: Partial<Record<ActorType, UpdateActorTransformFunc>> = {
    [ACTOR_TYPE_SKYBOX]: updateSkyboxTransform,
    [ACTOR_TYPE_CAMERA]: updateCameraTransform,
};

export const updateActorTransform: UpdateActorTransformFunc = (actor: Actor, camera?: Camera) => {
    (updateActorTransformBehaviour[actor.type] ?? defaultUpdateActorTransform)(actor, camera);
};

// dispose actor -------------------------------------------------------

// TODO: disposeするものを適宜列挙していく
export const disposeActor = (actor: Actor) => {
    switch (actor.type) {
        case ACTOR_TYPE_MESH:
            const mesh = actor as Mesh;
            iterateAllMeshMaterials(mesh, (material) => {
                disposeMaterial(material);
            });
            mesh.materials = [];
            mesh.depthMaterials = [];
            break;
        case ACTOR_TYPE_LIGHT:
            const light = actor as Light;
            if (light.shadowMap) {
                disposeRenderTarget(light.shadowMap);
            }
            break;
        default:
            break;
    }
};
