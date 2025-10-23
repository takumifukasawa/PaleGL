import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import {
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_INT,
    UNIFORM_TYPE_CUBE_MAP,

    PRIMITIVE_TYPE_TRIANGLES,
    ACTOR_TYPE_SKYBOX,
    UniformNames,
    SHADING_MODEL_ID_SKYBOX,
    UniformBlockNames,
    RENDER_QUEUE_TYPE_SKYBOX,
    FACE_SIDE_BACK,
} from '@/PaleGL/constants.ts';
import { createMaterial } from '@/PaleGL/materials/material.ts';
import { CubeMap } from '@/PaleGL/core/cubeMap.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import skyboxVertexShader from '@/PaleGL/shaders/skybox-vertex.glsl';
import skyboxFragmentShader from '@/PaleGL/shaders/skybox-fragment.glsl';
import { UpdateActorTransformFunc, defaultUpdateActorTransform } from '@/PaleGL/actors/actorBehaviours.ts';
import { setScaling, setTranslation } from '@/PaleGL/core/transform.ts';
import { createFillVector3 } from '@/PaleGL/math/vector3.ts';
import { createSphereGeometry } from '@/PaleGL/geometries/createSphereGeometry.ts';

// tmp
// // 法線が内側を向いた単位立方体
// const skyboxGeometryObjText: string = `
// # Blender 3.3.1
// # www.blender.org
// mtllib skybox-cube.mtl
// v -1.000000 -1.000000 1.000000
// v -1.000000 1.000000 1.000000
// v -1.000000 -1.000000 -1.000000
// v -1.000000 1.000000 -1.000000
// v 1.000000 -1.000000 1.000000
// v 1.000000 1.000000 1.000000
// v 1.000000 -1.000000 -1.000000
// v 1.000000 1.000000 -1.000000
// vn 0.5774 0.5774 0.5774
// vn 0.5774 -0.5774 -0.5774
// vn 0.5774 0.5774 -0.5774
// vn -0.5774 0.5774 0.5774
// vn 0.5774 -0.5774 0.5774
// vn -0.5774 0.5774 -0.5774
// vn -0.5774 -0.5774 0.5774
// vn -0.5774 -0.5774 -0.5774
// vt 0.375000 0.000000
// vt 0.375000 1.000000
// vt 0.125000 0.750000
// vt 0.625000 0.000000
// vt 0.625000 1.000000
// vt 0.875000 0.750000
// vt 0.125000 0.500000
// vt 0.375000 0.250000
// vt 0.625000 0.250000
// vt 0.875000 0.500000
// vt 0.375000 0.750000
// vt 0.625000 0.750000
// vt 0.375000 0.500000
// vt 0.625000 0.500000
// s 1
// f 3/8/1 2/4/2 1/1/3
// f 7/13/4 4/9/5 3/8/1
// f 5/11/6 8/14/7 7/13/4
// f 1/2/3 6/12/8 5/11/6
// f 1/3/3 7/13/4 3/7/1
// f 6/12/8 4/10/5 8/14/7
// f 3/8/1 4/9/5 2/4/2
// f 7/13/4 8/14/7 4/9/5
// f 5/11/6 6/12/8 8/14/7
// f 1/2/3 2/5/2 6/12/8
// f 1/3/3 5/11/6 7/13/4
// f 6/12/8 2/6/2 4/10/5
// `;

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
    // const skyboxObjData = parseObj(skyboxGeometryObjText);
    // const geometry = createGeometry({
    //     gpu,
    //     attributes: [
    //         createAttribute({
    //             name: AttributeNames.Position,
    //             data: new Float32Array(skyboxObjData.positions),
    //             size: 3,
    //         }),
    //         createAttribute({
    //             name: AttributeNames.Uv,
    //             data: new Float32Array(skyboxObjData.uvs),
    //             size: 2,
    //         }),
    //         createAttribute({
    //             name: AttributeNames.Normal,
    //             data: new Float32Array(skyboxObjData.normals),
    //             size: 3,
    //         }),
    //     ],
    //     indices: skyboxObjData.indices,
    //     drawCount: skyboxObjData.indices.length,
    // });
    const geometry = createSphereGeometry({
        gpu,
        widthSegments: 32,
        heightSegments: 32,
        invertNormals: true,
    });

    const material = createMaterial({
        // gpu,
        name: 'Skybox',
        vertexShader: skyboxVertexShader,
        fragmentShader: skyboxFragmentShader,
        primitiveType: PRIMITIVE_TYPE_TRIANGLES,
        renderQueueType: RENDER_QUEUE_TYPE_SKYBOX,
        depthTest: true,
        depthWrite: false,
        useEnvMap: true,
        faceSide: FACE_SIDE_BACK,
        uniforms: [
            {
                name: UniformNames.CubeTexture,
                type: UNIFORM_TYPE_CUBE_MAP,
                value: cubeMap,
            },
            // {
            //     name: UniformNames.ViewDirectionProjectionInverse,
            //     type: UNIFORM_TYPE_MATRIX4,
            //     value: Matrix4.identity,
            // },
            {
                name: UniformNames.RotationOffset,
                type: UNIFORM_TYPE_FLOAT,
                value: rotationOffset,
            },
            {
                name: UniformNames.ShadingModelId,
                type: UNIFORM_TYPE_INT,
                value: SHADING_MODEL_ID_SKYBOX,
            },
        ],
        uniformBlockNames: [UniformBlockNames.Transformations, UniformBlockNames.Camera],
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
        setScaling(skybox.transform, createFillVector3(camera.far / 1.733));
    }

    defaultUpdateActorTransform(actor);
};
