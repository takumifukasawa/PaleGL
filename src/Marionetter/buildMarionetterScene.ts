import { buildMarionetterTimeline } from '@/Marionetter/timeline.ts';
import {
    MARIONETTER_CAMERA_COMPONENT_INFO_PROPERTY_CAMERA_TYPE,
    MARIONETTER_CAMERA_COMPONENT_INFO_PROPERTY_FOV,
    MARIONETTER_COMPONENT_INFO_BASE_PROPERTY_TYPE,
    MARIONETTER_COMPONENT_TYPE_CAMERA,
    MARIONETTER_COMPONENT_TYPE_FBM_NOISE_TEXTURE_CONTROLLER,
    MARIONETTER_COMPONENT_TYPE_GBUFFER_MATERIAL_CONTROLLER,
    MARIONETTER_COMPONENT_TYPE_LIGHT,
    MARIONETTER_COMPONENT_TYPE_MESH_FILTER,
    MARIONETTER_COMPONENT_TYPE_MESH_RENDERER,
    MARIONETTER_COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER,
    MARIONETTER_COMPONENT_TYPE_PLAYABLE_DIRECTOR,
    MARIONETTER_COMPONENT_TYPE_POST_PROCESS_CONTROLLER,
    MARIONETTER_LIGHT_COMPONENT_INFO_PROPERTY_COLOR,
    MARIONETTER_LIGHT_COMPONENT_INFO_PROPERTY_INTENSITY,
    MARIONETTER_LIGHT_COMPONENT_INFO_PROPERTY_LIGHT_TYPE,
    MARIONETTER_LIT_MATERIAL_INFO_PROPERTY_COLOR,
    MARIONETTER_LIT_MATERIAL_INFO_PROPERTY_EMISSION,
    MARIONETTER_LIT_MATERIAL_INFO_PROPERTY_METALLIC,
    MARIONETTER_LIT_MATERIAL_INFO_PROPERTY_RECEIVE_SHADOW,
    MARIONETTER_LIT_MATERIAL_INFO_PROPERTY_ROUGHNESS,
    MARIONETTER_LIT_MATERIAL_INFO_PROPERTY_TILING,
    MARIONETTER_MATERIAL_INFO_PROPERTY_TYPE,
    MARIONETTER_MATERIAL_TYPE_LIT,
    MARIONETTER_MATERIAL_TYPE_UNLIT,
    MARIONETTER_MESH_FILTER_COMPONENT_INFO_PROPERTY_MESH_NAME,
    MARIONETTER_MESH_RENDERER_COMPONENT_INFO_PROPERTY_MATERIAL,
    MARIONETTER_OBJECT_INFO_PROPERTY_CHILDREN,
    MARIONETTER_OBJECT_INFO_PROPERTY_COMPONENTS,
    MARIONETTER_OBJECT_INFO_PROPERTY_NAME,
    MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM,
    MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER_COMPONENT_INFO_PROPERTY_LOCAL_POSITION,
    MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER_COMPONENT_INFO_PROPERTY_LOOK_AT_TARGET_NAME,
    MARIONETTER_SCENE_PROPERTY_OBJECTS,
    MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_PROPERTY_INNER_SPOT_ANGLE,
    MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_PROPERTY_RANGE,
    MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_PROPERTY_SPOT_ANGLE,
    // MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_POSITION,
    // MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_ROTATION,
    // MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_SCALE,
    MarionetterCameraComponentInfo,
    MarionetterDirectionalLightComponentInfo,
    MarionetterFbmNoiseTextureControllerComponentInfo,
    MarionetterGBufferMaterialControllerComponentInfo,
    MarionetterLightComponentInfo,
    MarionetterMeshFilterComponentInfo,
    MarionetterMeshRendererComponentInfo,
    MarionetterObjectInfo,
    MarionetterObjectMoveAndLookAtControllerComponentInfo,
    MarionetterPlayableDirectorComponentInfo,
    MarionetterPostProcessControllerComponentInfo,
    MarionetterScene,
    MarionetterSceneStructure,
    MarionetterSpotLightComponentInfo,
    MarionetterTimeline,
} from '@/Marionetter/types';
import { Actor, addActorComponent, addChildActor, createActor } from '@/PaleGL/actors/actor.ts';
import { createPerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera.ts';
import { createDirectionalLight } from '@/PaleGL/actors/lights/directionalLight.ts';
import { Light } from '@/PaleGL/actors/lights/light.ts';
import { createSpotLight } from '@/PaleGL/actors/lights/spotLight.ts';
import { createMesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { createGBufferMaterialController } from '@/PaleGL/components/gbufferMaterialController.ts';
import { createObjectMoveAndLookAtController } from '@/PaleGL/components/objectMoveAndLookAtController.ts';
import { createPostProcessController } from '@/PaleGL/components/postProcessController.ts';
import { ACTOR_TYPE_LIGHT, LIGHT_TYPE_SPOT } from '@/PaleGL/constants.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Renderer } from '@/PaleGL/core/renderer.ts';
import { setRotation, setScaling } from '@/PaleGL/core/transform.ts';
import { createBoxGeometry } from '@/PaleGL/geometries/boxGeometry.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { createGBufferMaterial } from '@/PaleGL/materials/gBufferMaterial.ts';
import { Material } from '@/PaleGL/materials/material.ts';
import { createUnlitMaterial } from '@/PaleGL/materials/unlitMaterial.ts';
import { createColorFromHex, createEmissiveColorFromHex } from '@/PaleGL/math/color.ts';
import { createQuaternion, Quaternion, qw, qx, qy, qz } from '@/PaleGL/math/quaternion.ts';
import { createRotatorFromQuaternion } from '@/PaleGL/math/rotator.ts';
import { createVector3, createVector3FromRaw } from '@/PaleGL/math/vector3';
import { createVector4FromRawVector4 } from '@/PaleGL/math/vector4.ts';
// import { createHuman } from '../../../src/pages/scripts/createHuman.ts';
// // ORIGINAL
// // import { PostProcessPassType } from '@/PaleGL/constants.ts';
// import { Light } from '@/PaleGL/actors/Light.ts';
// // ORIGINAL
// // import { generateDefaultBloomPassParameters } from '@/PaleGL/postprocess/BloomPass.ts';
// // import { maton } from '@/PaleGL/utilities/maton.ts';
// // import { PostProcessVolume } from '@/PaleGL/actors/PostProcessVolume.ts';
// // import { generateDepthOfFieldPassParameters } from '@/PaleGL/postprocess/DepthOfFieldPass.ts';

// import { createObjectMoveAndLookAtController } from '@/PaleGL/components/objectMoveAndLookAtController.ts';

export function tryParseJsonString<T>(str: string) {
    let json: T | null = null;
    try {
        json = JSON.parse(str) as T;
    } catch (e) {
        console.error('Failed to parse JSON string: ', str, e);
    }
    return json;
}

export function resolveInvertRotationLeftHandAxisToRightHandAxis(
    q: Quaternion,
    actor: Actor,
    needsFlip: boolean
): Quaternion {
    if (!needsFlip) {
        return q;
    }

    // quaternionの反転が必要ならケースを列挙
    if (actor.type == ACTOR_TYPE_LIGHT) {
        const light = actor as Light;
        if (light.lightType === LIGHT_TYPE_SPOT) {
            // NOTE: なぜか逆にしないといけない
            const x1 = qx(q);
            const y1 = qy(q);
            const z1 = qz(q);
            const w1 = qw(q);
            const x2 = 1;
            const y2 = 0;
            const z2 = 0;
            const w2 = 0;
            const w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
            const x = w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2;
            const y = w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2;
            const z = w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2;
            return createQuaternion(x, y, z, w);
        }
    }

    return q;
}

// export function findMarionetterComponent<T>(obj: MarionetterObjectInfo, componentType: MarionetterComponentType): T | null {
export function findMarionetterComponent<T>(obj: MarionetterObjectInfo, componentType: number): T | null {
    const co = obj[MARIONETTER_OBJECT_INFO_PROPERTY_COMPONENTS];
    if (co) {
        return (
            // @ts-ignore
            (obj[MARIONETTER_OBJECT_INFO_PROPERTY_COMPONENTS].find(
                (c) => c[MARIONETTER_COMPONENT_INFO_BASE_PROPERTY_TYPE] === componentType
            ) as T) || null
        );
    } else {
        return null;
    }
}

// export function findMarionetterComponentAsNumber<T>(obj: MarionetterObjectInfo, componentType: number): T | null {
//     return (
//         (obj[MARIONETTER_OBJECT_INFO_PROPERTY_COMPONENTS].find(
//             (c) => c[MARIONETTER_COMPONENT_INFO_BASE_PROPERTY_TYPE] === componentType
//         ) as T) || null
//     );
// }

// ORIGINAL
// function buildPostProcessVolumeActor({
//     name,
//     volumeComponent,
// }: {
//     name: string;
//     volumeComponent: MarionetterVolumeComponentInfo;
// }) {
//     console.log(volumeComponent);
//     const parameters = maton(
//         volumeComponent.vl.map((volumeLayer) => {
//             switch (volumeLayer.l) {
//                 case 'Bloom':
//                     const bloomLayer = volumeLayer as MarionetterVolumeLayerBloom;
//                     return {
//                         type: PostProcessPassType.Bloom,
//                         parameters: generateDefaultBloomPassParameters({
//                             bloomAmount: bloomLayer.bl_i,
//                         }),
//                     };
//                 case 'DepthOfField':
//                     const depthOfFieldLayer = volumeLayer as MarionetterVolumeLayerDepthOfField;
//                     return {
//                         type: PostProcessPassType.DepthOfField,
//                         parameters: generateDepthOfFieldPassParameters({
//                             focusDistance: depthOfFieldLayer.dof_fd,
//                         }),
//                     };
//                 default:
//                     return null;
//             }
//         })
//     )
//         .compact()
//         .value();
//     return new PostProcessVolume({ name, parameters });
// }

export type BuildMarionetterSceneFallbackGenerateActorHook = (gpu: Gpu, obj: MarionetterObjectInfo) => Actor | null;

export type BuildMarionetterSceneGeneratedActorHook = (gpu: Gpu, actor: Actor) => void;

/**
 *
 * @param gpu
 * @param scene
 */
export function buildMarionetterScene(
    gpu: Gpu,
    renderer: Renderer,
    marionetterScene: MarionetterScene,
    fallbackGenerateActorHook?: BuildMarionetterSceneFallbackGenerateActorHook,
    generatedActorHook?: BuildMarionetterSceneGeneratedActorHook
    // placedScene: Scene
): MarionetterSceneStructure {
    const actors: Actor[] = [];

    console.log(`[buildMarionetterScene] build marionetter scene...`, marionetterScene);

    function recursiveBuildActor(
        obj: MarionetterObjectInfo,
        parentActor: Actor | null = null,
        needsFlip: boolean = false
    ) {
        const name = obj[MARIONETTER_OBJECT_INFO_PROPERTY_NAME];
        const mfComponent = findMarionetterComponent<MarionetterMeshFilterComponentInfo>(
            obj,
            MARIONETTER_COMPONENT_TYPE_MESH_FILTER
        );
        const mrComponent = findMarionetterComponent<MarionetterMeshRendererComponentInfo>(
            obj,
            MARIONETTER_COMPONENT_TYPE_MESH_RENDERER
        );
        const cameraComponent = findMarionetterComponent<MarionetterCameraComponentInfo>(
            obj,
            MARIONETTER_COMPONENT_TYPE_CAMERA
        );
        const lightComponent = findMarionetterComponent<MarionetterLightComponentInfo>(
            obj,
            MARIONETTER_COMPONENT_TYPE_LIGHT
        );
        // ORIGINAL
        // const volumeComponent = findMarionetterComponent<MarionetterVolumeComponentInfo>(
        //     obj,
        //     MarionetterComponentType.Volume
        // );
        const postProcessControllerComponent = findMarionetterComponent<MarionetterPostProcessControllerComponentInfo>(
            obj,
            MARIONETTER_COMPONENT_TYPE_POST_PROCESS_CONTROLLER
        );
        const objectMoveAndLookAtControllerComponent =
            findMarionetterComponent<MarionetterObjectMoveAndLookAtControllerComponentInfo>(
                obj,
                MARIONETTER_COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER
            );
        const fbmNoiseTextureControllerComponent =
            findMarionetterComponent<MarionetterFbmNoiseTextureControllerComponentInfo>(
                obj,
                MARIONETTER_COMPONENT_TYPE_FBM_NOISE_TEXTURE_CONTROLLER
            );
        // const humanControllerComponent = findMarionetterComponent<MarionetterHumanControllerComponentInfo>(
        //     obj,
        //     MarionetterComponentType.HumanController
        // );
        const gBufferMaterialControllerComponent =
            findMarionetterComponent<MarionetterGBufferMaterialControllerComponentInfo>(
                obj,
                MARIONETTER_COMPONENT_TYPE_GBUFFER_MATERIAL_CONTROLLER
            );

        let actor: Actor | null = null;

        //
        // component情報
        //

        // mesh actor
        if (mrComponent && mfComponent) {
            const meshFilter = mfComponent;
            const meshRenderer = mrComponent;

            let geometry: Geometry | null = null;
            let material: Material | null = null;

            // build geometry
            switch (meshFilter[MARIONETTER_MESH_FILTER_COMPONENT_INFO_PROPERTY_MESH_NAME]) {
                case 'Cube':
                    geometry = createBoxGeometry({ gpu });
                    break;
                case 'Quad':
                    geometry = createPlaneGeometry({ gpu, width: 1, height: 1 });
                    break;
                default:
                    console.warn(
                        `[buildMarionetterActors] invalid mesh name: ${meshFilter[MARIONETTER_MESH_FILTER_COMPONENT_INFO_PROPERTY_MESH_NAME]}`
                    );
                    // for dummy
                    geometry = createPlaneGeometry({ gpu, width: 1, height: 1 });
            }

            // build material
            switch (
                meshRenderer[MARIONETTER_MESH_RENDERER_COMPONENT_INFO_PROPERTY_MATERIAL][
                    MARIONETTER_MATERIAL_INFO_PROPERTY_TYPE
                ]
            ) {
                case MARIONETTER_MATERIAL_TYPE_LIT:
                    const litMaterial = meshRenderer[MARIONETTER_MESH_RENDERER_COMPONENT_INFO_PROPERTY_MATERIAL];
                    const tiling = createVector4FromRawVector4(
                        litMaterial[MARIONETTER_LIT_MATERIAL_INFO_PROPERTY_TILING]
                    );
                    material = createGBufferMaterial({
                        baseColor: createColorFromHex(litMaterial[MARIONETTER_LIT_MATERIAL_INFO_PROPERTY_COLOR]),
                        baseMapTiling: tiling,
                        metallic: litMaterial[MARIONETTER_LIT_MATERIAL_INFO_PROPERTY_METALLIC],
                        metallicMapTiling: tiling,
                        roughness: litMaterial[MARIONETTER_LIT_MATERIAL_INFO_PROPERTY_ROUGHNESS],
                        roughnessMapTiling: tiling,
                        emissiveColor: createEmissiveColorFromHex(
                            litMaterial[MARIONETTER_LIT_MATERIAL_INFO_PROPERTY_EMISSION]
                        ),
                        receiveShadow: !!litMaterial[MARIONETTER_LIT_MATERIAL_INFO_PROPERTY_RECEIVE_SHADOW],
                    });
                    break;
                case MARIONETTER_MATERIAL_TYPE_UNLIT:
                    const unlitMaterial = meshRenderer[MARIONETTER_MESH_RENDERER_COMPONENT_INFO_PROPERTY_MATERIAL];
                    material = createUnlitMaterial({
                        baseColor: createColorFromHex(unlitMaterial[MARIONETTER_LIT_MATERIAL_INFO_PROPERTY_COLOR]),
                        // emissiveColor: createEmissiveColorFromHex(unlitMaterial[MarionetterUnlitMaterialInfoProperty.emission]),
                        receiveShadow: !!unlitMaterial[MARIONETTER_LIT_MATERIAL_INFO_PROPERTY_RECEIVE_SHADOW],
                    });
                    break;
                default:
                    // TODO: fallback
                    material = createGBufferMaterial({});
                    break;
            }

            if (geometry && material) {
                actor = createMesh({ name, geometry, material });
            }

            // camera actor
        } else if (cameraComponent) {
            const camera = cameraComponent;
            if (camera[MARIONETTER_CAMERA_COMPONENT_INFO_PROPERTY_CAMERA_TYPE] === 'Perspective') {
                // TODO: near, far を受け取りたい
                actor = createPerspectiveCamera(
                    camera[MARIONETTER_CAMERA_COMPONENT_INFO_PROPERTY_FOV],
                    1,
                    0.1,
                    1000,
                    name
                );
            } else {
                console.error(
                    `[buildMarionetterActors] invalid camera type: ${camera[MARIONETTER_CAMERA_COMPONENT_INFO_PROPERTY_CAMERA_TYPE]}`
                );
            }

            // light actor
        } else if (lightComponent) {
            // light
            const light = lightComponent;
            switch (light[MARIONETTER_LIGHT_COMPONENT_INFO_PROPERTY_LIGHT_TYPE]) {
                case 'Directional':
                    const directionalLightInfo = light as MarionetterDirectionalLightComponentInfo;
                    actor = createDirectionalLight({
                        name,
                        intensity: directionalLightInfo[MARIONETTER_LIGHT_COMPONENT_INFO_PROPERTY_INTENSITY],
                        color: createColorFromHex(
                            directionalLightInfo[MARIONETTER_LIGHT_COMPONENT_INFO_PROPERTY_COLOR]
                        ),
                    });
                    break;
                case 'Spot':
                    const spotLightInfo = light as MarionetterSpotLightComponentInfo;
                    // angleは半分にする必要があることに注意
                    actor = createSpotLight({
                        name,
                        color: createColorFromHex(spotLightInfo[MARIONETTER_LIGHT_COMPONENT_INFO_PROPERTY_COLOR]),
                        intensity: spotLightInfo[MARIONETTER_LIGHT_COMPONENT_INFO_PROPERTY_INTENSITY],
                        distance: spotLightInfo[MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_PROPERTY_RANGE],
                        coneAngle: spotLightInfo[MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_PROPERTY_SPOT_ANGLE] / 2,
                        penumbraAngle:
                            spotLightInfo[MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_PROPERTY_INNER_SPOT_ANGLE] / 2,
                    });
                    break;
                default:
                    console.error(
                        `[buildMarionetterActors] invalid light type: ${light[MARIONETTER_LIGHT_COMPONENT_INFO_PROPERTY_LIGHT_TYPE]}`
                    );
            }
            // ORIGINAL: volumeも一旦生のactorとみなす
            // } else if (volumeComponent) {
            //     actor = buildPostProcessVolumeActor({ name, volumeComponent });
            // } else if (humanControllerComponent) {
            //     actor = createHuman(gpu);
        } else {
            // others
            if (fallbackGenerateActorHook) {
                actor = fallbackGenerateActorHook(gpu, obj);
            }
            if (!actor) {
                actor = createActor({ name });
            }
        }

        //
        // component関連
        //

        if (postProcessControllerComponent && actor) {
            const postProcessController = createPostProcessController(renderer, postProcessControllerComponent);
            addActorComponent(actor, postProcessController);
        }

        if (objectMoveAndLookAtControllerComponent) {
            const objectMoveAndLookAdController = createObjectMoveAndLookAtController({
                localPosition: createVector3FromRaw(
                    objectMoveAndLookAtControllerComponent[
                        MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER_COMPONENT_INFO_PROPERTY_LOCAL_POSITION
                    ]
                ),
                lookAtTargetName:
                    objectMoveAndLookAtControllerComponent[
                        MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER_COMPONENT_INFO_PROPERTY_LOOK_AT_TARGET_NAME
                    ],
            });
            if (actor) {
                addActorComponent(actor, objectMoveAndLookAdController);
            }
        }

        if (fbmNoiseTextureControllerComponent) {
            console.warn(
                `[buildMarionetterActors] FBM Noise Texture Controller is not supported yet. - ${name}`,
                fbmNoiseTextureControllerComponent
            );
        }

        if (gBufferMaterialControllerComponent && actor) {
            addActorComponent(actor, createGBufferMaterialController());
        }

        if (actor) {
            //
            // transform情報
            //
            
            // actors.push(actor);
            setScaling(
                actor.transform,
                createVector3(
                    obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][7],
                    obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][8],
                    obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][9]
                    // obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_SCALE].x,
                    // obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_SCALE].y,
                    // obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_SCALE].z
                )
            );
            // euler ver
            // actor.transform.rotation.setV(
            //     new Vector3(obj.transform.localRotation.x, obj.transform.localRotation.y, obj.transform.localRotation.z)
            // );
            // quaternion ver
            // const q = new Quaternion(
            //     obj.transform.localRotation.x,
            //     obj.transform.localRotation.y,
            //     obj.transform.localRotation.z,
            //     obj.transform.localRotation.w
            // );
            // console.log('hogehoge', obj.transform.localRotation, q, q.toEulerDegree());
            // if (needsSomeActorsConvertLeftHandAxisToRightHandAxis) {
            // } else {
            // }
            // actor.transform.rotation = Rotator.fromQuaternion(
            //     new Quaternion(
            //         obj.transform.localRotation.x,
            //         obj.transform.localRotation.y,
            //         obj.transform.localRotation.z,
            //         obj.transform.localRotation.w
            //     )
            // );
            setRotation(
                actor.transform,
                createRotatorFromQuaternion(
                    resolveInvertRotationLeftHandAxisToRightHandAxis(
                        createQuaternion(
                            // obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][
                            //     MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_ROTATION
                            // ].x,
                            // obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][
                            //     MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_ROTATION
                            // ].y,
                            // obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][
                            //     MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_ROTATION
                            // ].z,
                            // obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][
                            //     MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_ROTATION
                            // ].w
                            obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][3],
                            obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][4],
                            obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][5],
                            obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][6]
                        ),
                        actor,
                        needsFlip
                    )
                )
            );
            actor.transform.position = createVector3(
                // obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_POSITION].x,
                // obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_POSITION].y,
                // obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_POSITION].z
                obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][0],
                obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][1],
                obj[MARIONETTER_OBJECT_INFO_PROPERTY_TRANSFORM][2]
            );

            generatedActorHook?.(gpu, actor);

            // 親が存在する場合は親に追加、親がない場合はシーン直下に配置したいので配列に追加
            if (parentActor) {
                addChildActor(parentActor, actor);
            } else {
                actors.push(actor);
            }

            // 子要素があれば再帰的に処理
            const ch = obj[MARIONETTER_OBJECT_INFO_PROPERTY_CHILDREN];
            if (ch) {
                for (let i = 0; i < ch.length; i++) {
                    recursiveBuildActor(ch[i], actor, needsFlip);
                }
            }

            return;
        }

        console.error(`[recursiveBuildActor] actor is null - name: ${obj[MARIONETTER_OBJECT_INFO_PROPERTY_NAME]}`);
    }

    //
    // parse scene
    //

    for (let i = 0; i < marionetterScene[MARIONETTER_SCENE_PROPERTY_OBJECTS].length; i++) {
        const obj = marionetterScene[MARIONETTER_SCENE_PROPERTY_OBJECTS][i];
        // recursiveBuildActor(obj, null, needsSomeActorsConvertLeftHandAxisToRightHandAxis);
        recursiveBuildActor(obj, null, true);
        // actors.push(actor);
    }

    // scene.objects.forEach((obj) => {
    //     const actor = recursiveBuildActor(obj, null, needsSomeActorsConvertLeftHandAxisToRightHandAxis);
    //     actors.push(actor);
    // });

    //
    // parse timeline
    // NOTE: timelineは一個という想定
    //
    const marionetterTimeline = buildMarionetterTimelineFromScene(
        marionetterScene,
        actors
        // placedScene
    );

    return { actors, marionetterTimeline };
}

export function buildMarionetterTimelineFromScene(
    marionetterScene: MarionetterScene,
    marionetterSceneActors: Actor[]
    // placedScene: Scene
): MarionetterTimeline | null {
    let marionetterTimeline: MarionetterTimeline | null = null;
    marionetterScene[MARIONETTER_SCENE_PROPERTY_OBJECTS].forEach((obj) => {
        const co = obj[MARIONETTER_OBJECT_INFO_PROPERTY_COMPONENTS];
        if (co) {
            const timelineComponent = co.find(
                (c) => c[MARIONETTER_COMPONENT_INFO_BASE_PROPERTY_TYPE] === MARIONETTER_COMPONENT_TYPE_PLAYABLE_DIRECTOR
            );
            if (timelineComponent) {
                marionetterTimeline = buildMarionetterTimeline(
                    marionetterSceneActors,
                    timelineComponent as MarionetterPlayableDirectorComponentInfo
                    // placedScene
                    // needsSomeActorsConvertLeftHandAxisToRightHandAxis
                );
            }
        }
    });
    return marionetterTimeline;
}
