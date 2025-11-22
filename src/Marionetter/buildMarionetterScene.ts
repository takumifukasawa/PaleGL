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
    MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_BASE_COLOR_INDEX,
    MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_EMISSIVE_COLOR_INDEX,
    MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_METALLIC_INDEX,
    MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_ROUGHNESS_INDEX,
    MARIONETTER_LIGHT_COMPONENT_INFO_INDEX_COLOR,
    MARIONETTER_LIGHT_COMPONENT_INFO_INDEX_INTENSITY,
    MARIONETTER_LIGHT_COMPONENT_INFO_INDEX_LIGHT_TYPE,
    MARIONETTER_LIGHT_COMPONENT_INFO_PROPERTY_DATA,
    MARIONETTER_LIT_MATERIAL_INFO_EMISSION_INDEX,
    MARIONETTER_LIT_MATERIAL_INFO_METALLIC_INDEX,
    MARIONETTER_LIT_MATERIAL_INFO_RECEIVE_SHADOW_INDEX,
    MARIONETTER_LIT_MATERIAL_INFO_ROUGHNESS_INDEX,
    MARIONETTER_LIT_MATERIAL_INFO_TILING_INDEX,
    MARIONETTER_MATERIAL_INFO_COLOR_INDEX,
    MARIONETTER_MATERIAL_INFO_TYPE_INDEX,
    MARIONETTER_MATERIAL_TYPE_LIT,
    MARIONETTER_MATERIAL_TYPE_UNLIT,
    MARIONETTER_MESH_FILTER_COMPONENT_INFO_PROPERTY_MESH_NAME,
    MARIONETTER_MESH_RENDERER_COMPONENT_INFO_PROPERTY_MATERIAL,
    MARIONETTER_OBJECT_INFO_INDEX_CHILDREN,
    MARIONETTER_OBJECT_INFO_INDEX_COMPONENTS,
    MARIONETTER_OBJECT_INFO_INDEX_NAME,
    MARIONETTER_OBJECT_INFO_INDEX_TRANSFORM,
    MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER_COMPONENT_INFO_PROPERTY_LOCAL_POSITION,
    MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER_COMPONENT_INFO_PROPERTY_LOOK_AT_TARGET_NAME,
    MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER_COMPONENT_INFO_PROPERTY_UP_VECTOR,
    MARIONETTER_SCENE_PROPERTY_OBJECTS,
    MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_INDEX_INNER_SPOT_ANGLE,
    MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_INDEX_RANGE,
    MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_INDEX_SPOT_ANGLE,
    // MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_POSITION,
    // MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_ROTATION,
    // MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_SCALE,
    MarionetterCameraComponentInfo,
    MarionetterDirectionalLightComponentInfo,
    MarionetterFbmNoiseTextureControllerComponentInfo,
    MarionetterGBufferMaterialControllerComponentInfo,
    MarionetterLightComponentInfo,
    MarionetterLitMaterialInfo,
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
import {
    createGBufferMaterialController,
    GBufferMaterialControllerInitialValues,
} from '@/PaleGL/components/gbufferMaterialController.ts';
import { createObjectMoveAndLookAtController } from '@/PaleGL/components/objectMoveAndLookAtController.ts';
import { createPostProcessController } from '@/PaleGL/components/postProcessController.ts';
import { ACTOR_TYPE_LIGHT, LIGHT_TYPE_DIRECTIONAL, LIGHT_TYPE_SPOT } from '@/PaleGL/constants.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Renderer } from '@/PaleGL/core/renderer.ts';
import { setRotation, setScaling } from '@/PaleGL/core/transform.ts';
import { createBoxGeometry } from '@/PaleGL/geometries/boxGeometry.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { createGBufferMaterial } from '@/PaleGL/materials/gBufferMaterial.ts';
import { Material } from '@/PaleGL/materials/material.ts';
import { createUnlitMaterial } from '@/PaleGL/materials/unlitMaterial.ts';
import { createColorFromHex, createEmissiveColorFromHex, Color } from '@/PaleGL/math/color.ts';
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
    return (
        // @ts-ignore
        (obj[MARIONETTER_OBJECT_INFO_INDEX_COMPONENTS].find(
            (c) => c[MARIONETTER_COMPONENT_INFO_BASE_PROPERTY_TYPE] === componentType
        ) as T) || null
    );
}

// export function findMarionetterComponentAsNumber<T>(obj: MarionetterObjectInfo, componentType: number): T | null {
//     return (
//         (obj[MARIONETTER_OBJECT_INFO_INDEX_COMPONENTS].find(
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
        const name = obj[MARIONETTER_OBJECT_INFO_INDEX_NAME];
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
            const materialInfo = meshRenderer[MARIONETTER_MESH_RENDERER_COMPONENT_INFO_PROPERTY_MATERIAL];
            switch (materialInfo[MARIONETTER_MATERIAL_INFO_TYPE_INDEX]) {
                case MARIONETTER_MATERIAL_TYPE_LIT:
                    const litMaterial = materialInfo as MarionetterLitMaterialInfo;
                    const tiling = createVector4FromRawVector4(litMaterial[MARIONETTER_LIT_MATERIAL_INFO_TILING_INDEX]);
                    material = createGBufferMaterial({
                        baseColor: createColorFromHex(litMaterial[MARIONETTER_MATERIAL_INFO_COLOR_INDEX]),
                        mapTiling: tiling,
                        metallic: litMaterial[MARIONETTER_LIT_MATERIAL_INFO_METALLIC_INDEX],
                        roughness: litMaterial[MARIONETTER_LIT_MATERIAL_INFO_ROUGHNESS_INDEX],
                        emissiveColor: createEmissiveColorFromHex(
                            litMaterial[MARIONETTER_LIT_MATERIAL_INFO_EMISSION_INDEX]
                        ),
                        receiveShadow: !!litMaterial[MARIONETTER_LIT_MATERIAL_INFO_RECEIVE_SHADOW_INDEX],
                    });
                    break;
                case MARIONETTER_MATERIAL_TYPE_UNLIT:
                    const unlitMaterial = materialInfo;
                    material = createUnlitMaterial({
                        baseColor: createColorFromHex(unlitMaterial[MARIONETTER_MATERIAL_INFO_COLOR_INDEX]),
                        receiveShadow: false,
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
                    // rad2Deg(Math.acos(camera[MARIONETTER_CAMERA_COMPONENT_INFO_PROPERTY_FOV])) * 2,
                    1,
                    0.1,
                    100,
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
            const lightData = light[MARIONETTER_LIGHT_COMPONENT_INFO_PROPERTY_DATA];
            switch (lightData[MARIONETTER_LIGHT_COMPONENT_INFO_INDEX_LIGHT_TYPE]) {
                case LIGHT_TYPE_DIRECTIONAL:
                    const directionalLightInfo = light as MarionetterDirectionalLightComponentInfo;
                    const directionalData = directionalLightInfo[MARIONETTER_LIGHT_COMPONENT_INFO_PROPERTY_DATA];
                    actor = createDirectionalLight({
                        name,
                        intensity: directionalData[MARIONETTER_LIGHT_COMPONENT_INFO_INDEX_INTENSITY],
                        color: createColorFromHex(directionalData[MARIONETTER_LIGHT_COMPONENT_INFO_INDEX_COLOR]),
                    });
                    break;
                case LIGHT_TYPE_SPOT:
                    const spotLightInfo = light as unknown as MarionetterSpotLightComponentInfo;
                    const spotData = spotLightInfo[MARIONETTER_LIGHT_COMPONENT_INFO_PROPERTY_DATA];
                    // angleは半分にする必要があることに注意
                    actor = createSpotLight({
                        name,
                        color: createColorFromHex(spotData[MARIONETTER_LIGHT_COMPONENT_INFO_INDEX_COLOR]),
                        intensity: spotData[MARIONETTER_LIGHT_COMPONENT_INFO_INDEX_INTENSITY],
                        distance: spotData[MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_INDEX_RANGE],
                        coneAngle: spotData[MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_INDEX_SPOT_ANGLE] / 2,
                        penumbraAngle: spotData[MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_INDEX_INNER_SPOT_ANGLE] / 2,
                    });
                    break;
                default:
                    console.error(
                        `[buildMarionetterActors] invalid light type: ${lightData[MARIONETTER_LIGHT_COMPONENT_INFO_INDEX_LIGHT_TYPE]}`
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
            const upVectorRaw =
                objectMoveAndLookAtControllerComponent[
                    MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER_COMPONENT_INFO_PROPERTY_UP_VECTOR
                ];
            const objectMoveAndLookAdController = createObjectMoveAndLookAtController({
                localPosition: createVector3FromRaw(
                    objectMoveAndLookAtControllerComponent[
                        MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER_COMPONENT_INFO_PROPERTY_LOCAL_POSITION
                    ]
                ),
                upVector: upVectorRaw ? createVector3FromRaw(upVectorRaw) : createVector3(0, 1, 0),
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
            // WIP: 初期値
            // const data = gBufferMaterialControllerComponent.d;
            // const initialValues: GBufferMaterialControllerInitialValues = {
            //     baseColor: data[MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_BASE_COLOR_INDEX]
            //         ? createColorFromHex(data[MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_BASE_COLOR_INDEX])
            //         : undefined,
            //     metallic: data[MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_METALLIC_INDEX],
            //     roughness: data[MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_ROUGHNESS_INDEX],
            //     emissiveColor: data[MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_EMISSIVE_COLOR_INDEX]
            //         ? createEmissiveColorFromHex(data[MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_EMISSIVE_COLOR_INDEX])
            //         : undefined,
            // };
            // addActorComponent(actor, createGBufferMaterialController(initialValues));
            addActorComponent(actor, createGBufferMaterialController());
        }

        if (actor) {
            //
            // transform情報
            //

            // actors.push(actor);
            const transformScale = obj[MARIONETTER_OBJECT_INFO_INDEX_TRANSFORM][2];
            const scale = transformScale.length === 0
                ? createVector3(1, 1, 1) // デフォルト: Vector3.one
                : createVector3(transformScale[0], transformScale[1], transformScale[2]);
            setScaling(actor.transform, scale);
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
            const transformRotation = obj[MARIONETTER_OBJECT_INFO_INDEX_TRANSFORM][1];
            const quaternion = transformRotation.length === 0
                ? createQuaternion(0, 0, 0, 1) // デフォルト: Quaternion.identity
                : createQuaternion(transformRotation[0], transformRotation[1], transformRotation[2], transformRotation[3]);
            setRotation(
                actor.transform,
                createRotatorFromQuaternion(
                    resolveInvertRotationLeftHandAxisToRightHandAxis(
                        quaternion,
                        actor,
                        needsFlip
                    )
                )
            );
            const transformPosition = obj[MARIONETTER_OBJECT_INFO_INDEX_TRANSFORM][0];
            actor.transform.position = transformPosition.length === 0
                ? createVector3(0, 0, 0) // デフォルト: Vector3.zero
                : createVector3(transformPosition[0], transformPosition[1], transformPosition[2]);

            generatedActorHook?.(gpu, actor);

            // 親が存在する場合は親に追加、親がない場合はシーン直下に配置したいので配列に追加
            if (parentActor) {
                addChildActor(parentActor, actor);
            } else {
                actors.push(actor);
            }

            // 子要素があれば再帰的に処理
            const ch = obj[MARIONETTER_OBJECT_INFO_INDEX_CHILDREN];
            if (ch) {
                for (let i = 0; i < ch.length; i++) {
                    recursiveBuildActor(ch[i], actor, needsFlip);
                }
            }

            return;
        }

        console.error(`[recursiveBuildActor] actor is null - name: ${obj[MARIONETTER_OBJECT_INFO_INDEX_NAME]}`);
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
        const timelineComponent = obj[MARIONETTER_OBJECT_INFO_INDEX_COMPONENTS].find(
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
    });
    return marionetterTimeline;
}
