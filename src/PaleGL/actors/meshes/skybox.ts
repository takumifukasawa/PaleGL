import { defaultUpdateActorTransform, UpdateActorTransformFunc } from '@/PaleGL/actors/actorBehaviours.ts';
import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import {
    ACTOR_TYPE_SKYBOX,
    FACE_SIDE_BACK,
    PRIMITIVE_TYPE_TRIANGLES,
    RENDER_QUEUE_TYPE_SKYBOX,
    SHADING_MODEL_ID_SKYBOX,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_NAME_CUBE_TEXTURE,
    UNIFORM_NAME_ROTATION_OFFSET,
    UNIFORM_NAME_SHADING_MODEL_ID,
    UNIFORM_TYPE_CUBE_MAP,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_INT,
} from '@/PaleGL/constants.ts';
import { CubeMap } from '@/PaleGL/core/cubeMap.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { setScaling, setTranslation } from '@/PaleGL/core/transform.ts';
import { createSphereGeometry } from '@/PaleGL/geometries/createSphereGeometry.ts';
import { createMaterial } from '@/PaleGL/materials/material.ts';
import { createVector3Fill } from '@/PaleGL/math/vector3.ts';
import skyboxFragmentShader from '@/PaleGL/shaders/skybox-fragment.glsl';
import skyboxVertexShader from '@/PaleGL/shaders/skybox-vertex.glsl';

type SkyboxArgs = {
    gpu: Gpu;
    cubeMap: CubeMap;
    baseIntensity: number;
    specularIntensity: number;
    rotationOffset?: number;
    renderMesh?: boolean;
};

export type Skybox = Mesh & {
    cubeMap: CubeMap;
    baseIntensity: number;
    specularIntensity: number;
    rotationOffset: number;
    renderMesh: boolean;
};

export function createSkybox({
    gpu,
    cubeMap,
    baseIntensity = 1,
    specularIntensity = 1,
    rotationOffset = 0,
    renderMesh = true,
}: SkyboxArgs): Skybox {
    const geometry = createSphereGeometry({
        gpu,
        widthSegments: 32,
        heightSegments: 32,
        invertNormals: true,
    });

    const material = createMaterial({
        // gpu,
        // CUSTOM_BEGIN comment out
        // name: 'Skybox',
        // CUSTOM_END
        vertexShader: skyboxVertexShader,
        fragmentShader: skyboxFragmentShader,
        primitiveType: PRIMITIVE_TYPE_TRIANGLES,
        renderQueueType: RENDER_QUEUE_TYPE_SKYBOX,
        depthTest: true,
        depthWrite: false,
        useEnvMap: true,
        faceSide: FACE_SIDE_BACK,
        uniforms: [
            [UNIFORM_NAME_CUBE_TEXTURE, UNIFORM_TYPE_CUBE_MAP, cubeMap],
            // {
            //     name: UNIFORM_NAME_VIEW_DIRECTION_PROJECTION_INVERSE,
            //     type: UNIFORM_TYPE_MATRIX4,
            //     value: Matrix4.identity,
            // },
            [UNIFORM_NAME_ROTATION_OFFSET, UNIFORM_TYPE_FLOAT, rotationOffset],
            [UNIFORM_NAME_SHADING_MODEL_ID, UNIFORM_TYPE_INT, SHADING_MODEL_ID_SKYBOX],
        ],
        uniformBlockNames: [UNIFORM_BLOCK_NAME_TRANSFORMATIONS, UNIFORM_BLOCK_NAME_CAMERA],
    });

    const mesh = createMesh({ geometry, material, type: ACTOR_TYPE_SKYBOX });

    return {
        ...mesh,
        cubeMap,
        baseIntensity,
        specularIntensity,
        rotationOffset,
        renderMesh,
        // // overrides
        // updateTransform: updateSkyboxTransform,
    };
}

// TODO: renderer側で2回走らないようにする
export const updateSkyboxTransform: UpdateActorTransformFunc = (actor, camera) => {
    const skybox = actor as Skybox;

    if (camera) {
        setTranslation(skybox.transform, camera.transform.position);
        // 1.733 ... 単位立方体の対角線の長さ sqrt(1 + 1 + 1)
        setScaling(skybox.transform, createVector3Fill(camera.far / 1.733));
    }

    defaultUpdateActorTransform(actor);
};
