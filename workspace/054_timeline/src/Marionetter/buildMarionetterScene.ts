import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera.ts';
import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { BoxGeometry } from '@/PaleGL/geometries/BoxGeometry.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { GBufferMaterial } from '@/PaleGL/materials/GBufferMaterial.ts';
import { Geometry } from '@/PaleGL/geometries/Geometry.ts';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry.ts';
import { DirectionalLight } from '@/PaleGL/actors/DirectionalLight.ts';
import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';
import { Rotator } from '@/PaleGL/math/Rotator.ts';
import { Quaternion } from '@/PaleGL/math/Quaternion.ts';
import {
    MarionetterCameraComponentInfo,
    MarionetterComponentType,
    MarionetterDirectionalLightComponentInfo,
    MarionetterLightComponentInfo,
    MarionetterMeshFilterComponentInfo,
    MarionetterMeshRendererComponentInfo,
    MarionetterObjectInfo,
    MarionetterPlayableDirectorComponentInfo,
    MarionetterScene,
    MarionetterSpotLightComponentInfo,
    MarionetterTimeline,
} from '@/Marionetter/types';
import { buildMarionetterTimeline } from '@/Marionetter/timeline.ts';
import { ActorTypes, LightTypes } from '@/PaleGL/constants.ts';
import { Light } from '@/PaleGL/actors/Light.ts';

export function tryParseJsonString<T>(str: string) {
    let json: T | null = null;
    try {
        json = JSON.parse(str) as T;
    } catch (e) {
        throw new Error('Failed to parse JSON string');
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
    if (actor.type == ActorTypes.Light) {
        const light = actor as Light;
        if (light.lightType === LightTypes.Spot) {
            // return new Quaternion(q.x, q.y, -q.z, -q.w);
        }
    }

    return q;
}


/**
 *
 * @param gpu
 * @param scene
 */
export function buildMarionetterScene(
    gpu: GPU,
    scene: MarionetterScene
    // needsSomeActorsConvertLeftHandAxisToRightHandAxis: boolean = false
): { actors: Actor[]; marionetterTimeline: MarionetterTimeline | null } {
    const actors: Actor[] = [];

    function recursiveBuildActor(
        obj: MarionetterObjectInfo,
        parentActor: Actor | null = null,
        needsSomeActorsConvertLeftHandAxisToRightHandAxis: boolean = false
    ) {
        const { name } = obj;
        const mfComponent = obj.components.find((c) => c.type === MarionetterComponentType.MeshFilter);
        const mrComponent = obj.components.find((c) => c.type === MarionetterComponentType.MeshRenderer);
        const cameraComponent = obj.components.find((c) => c.type === MarionetterComponentType.Camera);
        const lightComponent = obj.components.find((c) => c.type === MarionetterComponentType.Light);

        let actor: Actor | null = null;

        //
        // component情報
        //

        if (mrComponent && mfComponent) {
            const meshFilter = mfComponent as MarionetterMeshFilterComponentInfo;
            const meshRenderer = mrComponent as MarionetterMeshRendererComponentInfo;

            let geometry: Geometry | null = null;
            let material: Material | null = null;

            // build geometry
            switch (meshFilter.meshName) {
                case 'Cube':
                    geometry = new BoxGeometry({ gpu });
                    break;
                case 'Quad':
                    geometry = new PlaneGeometry({ gpu });
                    break;
            }

            // build material
            switch (meshRenderer.materialName) {
                case 'Lit':
                    material = new GBufferMaterial();
                    break;
                default:
                    // TODO: fallback
                    material = new GBufferMaterial();
                    break;
            }

            if (geometry && material) {
                actor = new Mesh({ name, geometry, material });
            }
        } else if (cameraComponent) {
            const camera = cameraComponent as MarionetterCameraComponentInfo;
            if (camera.cameraType === 'Perspective') {
                actor = new PerspectiveCamera(camera.fov, 1, 0.1, 1000, name);
            } else {
                throw `[buildMarionetterActors] invalid camera type: ${camera.cameraType}`;
            }
        } else if (lightComponent) {
            // light
            const light = lightComponent as MarionetterLightComponentInfo;
            switch (light.lightType) {
                case 'Directional':
                    const directionalLightInfo = light as MarionetterDirectionalLightComponentInfo;
                    actor = new DirectionalLight({
                        name,
                        intensity: directionalLightInfo.intensity,
                        color: Color.fromHex(directionalLightInfo.color),
                    });
                    break;
                case 'Spot':
                    const spotLightInfo = light as MarionetterSpotLightComponentInfo;
                    actor = new SpotLight({
                        name,
                        // intensity: light.intensity,
                        color: Color.fromHex(spotLightInfo.color),
                        // distance: spotLightInfo.range,
                        // attenuation: 1, // TODO: 1で問題ない？
                        // coneCos: spotLightInfo.innerSpotAngle,
                        // penumbraCos: spotLightInfo.spotAngle,
                        intensity: 1.4,
                        // color: new Color(1, 1, 1),
                        distance: 15,
                        attenuation: 1.06,
                        coneCos: 0.8,
                        penumbraCos: 0.9,
                    });
                    break;
                default:
                    throw `[buildMarionetterActors] invalid light type: ${light.lightType}`;
            }
        } else {
            // others
            actor = new Actor({ name });
        }

        //
        // transform情報
        //

        if (actor) {
            // actors.push(actor);
            actor.transform.scale = new Vector3(
                obj.transform.localScale.x,
                obj.transform.localScale.y,
                obj.transform.localScale.z
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
            actor.transform.rotation = Rotator.fromQuaternion(
                resolveInvertRotationLeftHandAxisToRightHandAxis(
                    new Quaternion(
                        obj.transform.localRotation.x,
                        obj.transform.localRotation.y,
                        obj.transform.localRotation.z,
                        obj.transform.localRotation.w
                    ),
                    actor,
                    needsSomeActorsConvertLeftHandAxisToRightHandAxis
                )
            );
            actor.transform.position = new Vector3(
                obj.transform.localPosition.x,
                obj.transform.localPosition.y,
                obj.transform.localPosition.z
            );
          
            // 親が存在する場合は親に追加、親がない場合はシーン直下に配置したいので配列に追加
            if(parentActor) {
                parentActor.addChild(actor);
            } else {
                actors.push(actor);
            }
         
            // 子要素があれば再帰的に処理
            for(let i = 0; i < obj.children.length; i++) {
                recursiveBuildActor(
                    obj.children[i],
                    actor,
                );
            }
            
            return;
        }

        throw `[recursiveBuildActor] actor is null`;
    }


    //
    // parse scene
    //
    
    for(let i = 0; i < scene.objects.length; i++) {
        const obj = scene.objects[i];
        // recursiveBuildActor(obj, null, needsSomeActorsConvertLeftHandAxisToRightHandAxis);
        recursiveBuildActor(obj, null);
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

    let marionetterTimeline: MarionetterTimeline | null = null;

    scene.objects.forEach((obj) => {
        const timelineComponent = obj.components.find((c) => c.type === MarionetterComponentType.PlayableDirector);
        if (timelineComponent) {
            marionetterTimeline = buildMarionetterTimeline(
                actors,
                timelineComponent as MarionetterPlayableDirectorComponentInfo
                // needsSomeActorsConvertLeftHandAxisToRightHandAxis
            );
        }
    });

    return { actors, marionetterTimeline };
}
