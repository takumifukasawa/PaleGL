import { Mesh } from '@/PaleGL/actors/Mesh';
import { UniformTypes, PrimitiveTypes, ActorTypes, AttributeNames, UniformNames } from '@/PaleGL/constants';
import { Material } from '@/PaleGL/materials/Material';
// import {loadImg} from "@/PaleGL/loaders/loadImg";
import { /*loadObj,*/ parseObj } from '@/PaleGL/loaders/loadObj';
import { Geometry } from '@/PaleGL/geometries/Geometry';
// import {CubeMap} from "@/PaleGL/core/CubeMap";
// import {BoxGeometry} from "@/PaleGL/geometries/BoxGeometry";
// import {PlaneGeometry} from "@/PaleGL/geometries/PlaneGeometry";
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { CubeMap } from '@/PaleGL/core/CubeMap';
import { Attribute } from '@/PaleGL/core/Attribute';
import { GPU } from '@/PaleGL/core/GPU';
import { Camera } from '@/PaleGL/actors/Camera';
import skyboxFragmentShader from '@/PaleGL/shaders/skybox-fragment.glsl';
import { ShadingModelIds } from '@/PaleGL/materials/GBufferMaterial.ts';

// 法線が内側を向いた単位立方体
const skyboxGeometryObjText: string = `
# Blender 3.3.1
# www.blender.org
mtllib skybox-cube.mtl
v -1.000000 -1.000000 1.000000
v -1.000000 1.000000 1.000000
v -1.000000 -1.000000 -1.000000
v -1.000000 1.000000 -1.000000
v 1.000000 -1.000000 1.000000
v 1.000000 1.000000 1.000000
v 1.000000 -1.000000 -1.000000
v 1.000000 1.000000 -1.000000
vn 0.5774 0.5774 0.5774
vn 0.5774 -0.5774 -0.5774
vn 0.5774 0.5774 -0.5774
vn -0.5774 0.5774 0.5774
vn 0.5774 -0.5774 0.5774
vn -0.5774 0.5774 -0.5774
vn -0.5774 -0.5774 0.5774
vn -0.5774 -0.5774 -0.5774
vt 0.375000 0.000000
vt 0.375000 1.000000
vt 0.125000 0.750000
vt 0.625000 0.000000
vt 0.625000 1.000000
vt 0.875000 0.750000
vt 0.125000 0.500000
vt 0.375000 0.250000
vt 0.625000 0.250000
vt 0.875000 0.500000
vt 0.375000 0.750000
vt 0.625000 0.750000
vt 0.375000 0.500000
vt 0.625000 0.500000
s 1
f 3/8/1 2/4/2 1/1/3
f 7/13/4 4/9/5 3/8/1
f 5/11/6 8/14/7 7/13/4
f 1/2/3 6/12/8 5/11/6
f 1/3/3 7/13/4 3/7/1
f 6/12/8 4/10/5 8/14/7
f 3/8/1 4/9/5 2/4/2
f 7/13/4 8/14/7 4/9/5
f 5/11/6 6/12/8 8/14/7
f 1/2/3 2/5/2 6/12/8
f 1/3/3 5/11/6 7/13/4
f 6/12/8 2/6/2 4/10/5
`;

const skyboxVertexShader: string = `#version 300 es

precision mediump float;

layout (location = 0) in vec3 ${AttributeNames.Position};
layout (location = 1) in vec2 ${AttributeNames.Uv};
layout (location = 2) in vec3 ${AttributeNames.Normal};

uniform mat4 ${UniformNames.WorldMatrix};
uniform mat4 ${UniformNames.ViewMatrix};
uniform mat4 ${UniformNames.ProjectionMatrix};
uniform mat4 ${UniformNames.NormalMatrix};

out vec2 vUv;
out vec3 vNormal;
out vec3 vWorldPosition;

void main() {
    vUv = aUv;
    vNormal = (${UniformNames.NormalMatrix} * vec4(aNormal, 1)).xyz;
    vec4 worldPosition = ${UniformNames.WorldMatrix} * vec4(aPosition, 1);
    vWorldPosition = worldPosition.xyz;
    gl_Position = ${UniformNames.ProjectionMatrix} * ${UniformNames.ViewMatrix} * worldPosition;
}
`;

// const skyboxFragmentShader = `#version 300 es
//
// precision mediump float;
//
// in vec2 vUv;
// in vec3 vNormal;
// in vec3 vWorldPosition;
//
// uniform samplerCube uCubeTexture;
// uniform vec3 uViewPosition;
// uniform mat4 uViewDirectionProjectionInverse;
// uniform float uRotationOffset;
//
// // out vec4 outColor;
// layout (location = 0) out vec4 outBaseColor;
// layout (location = 1) out vec4 outNormalColor;
//
// // mat2 rotate(float r) {
// //     float c = cos(r);
// //     float s = sin(r);
// //     return mat2(c, s, -s, c);
// // }
//
// #include ./partial/fragment-env-map-functions.glsl
//
// void main() {
//     // pattern_1: inverse normal
//     vec3 N = normalize(vNormal);
//     vec3 reflectDir = -N;
//
//     // pattern_2: world position dir
//     // skyboxの中心 = カメラの中心なので、こちらでもよい
//     // vec3 reflectDir = normalize(vWorldPosition - uViewPosition);
//
//     // reflectDir.x *= -1.;
//     // reflectDir.xz *= rotate(3.14 + uRotationOffset);
//     // vec4 textureColor = texture(uCubeTexture, reflectDir);
//
//     vec3 envMapColor = calcEnvMap(uCubeTexture, reflectDir, uRotationOffset);
//
//     // outColor = textureColor;
//     outBaseColor = vec4(envMapColor, 1.);
//     outNormalColor = vec4(0., 0., 0., 1.);
// }
// `;

type SkyboxArgs = {
    gpu: GPU;
    cubeMap: CubeMap;
    diffuseIntensity: number;
    specularIntensity: number;
    rotationOffset?: number;
};

export class Skybox extends Mesh {
    cubeMap: CubeMap;
    diffuseIntensity: number = 1;
    specularIntensity: number = 1;
    rotationOffset: number = 0;

    constructor({ gpu, cubeMap, diffuseIntensity, specularIntensity, rotationOffset = 0 }: SkyboxArgs) {
        const skyboxObjData = parseObj(skyboxGeometryObjText);
        const geometry = new Geometry({
            gpu,
            attributes: [
                new Attribute({
                    name: AttributeNames.Position,
                    data: new Float32Array(skyboxObjData.positions),
                    size: 3,
                }),
                new Attribute({
                    name: AttributeNames.Uv,
                    data: new Float32Array(skyboxObjData.uvs),
                    size: 2,
                }),
                new Attribute({
                    name: AttributeNames.Normal,
                    data: new Float32Array(skyboxObjData.normals),
                    size: 3,
                }),
            ],
            indices: skyboxObjData.indices,
            drawCount: skyboxObjData.indices.length,
        });

        const material = new Material({
            // gpu,
            vertexShader: skyboxVertexShader,
            fragmentShader: skyboxFragmentShader,
            primitiveType: PrimitiveTypes.Triangles,
            depthTest: true,
            depthWrite: false,
            useEnvMap: true,
            uniforms: {
                uCubeTexture: {
                    type: UniformTypes.CubeMap,
                    value: cubeMap,
                },
                uViewDirectionProjectionInverse: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
                uRotationOffset: {
                    type: UniformTypes.Float,
                    value: rotationOffset,
                },
                [UniformNames.ShadingModelId]: {
                    type: UniformTypes.Int,
                    value: ShadingModelIds.Skybox,
                },
            },
        });

        super({ geometry, material, actorType: ActorTypes.Skybox });

        this.cubeMap = cubeMap;
        this.diffuseIntensity = diffuseIntensity;
        this.specularIntensity = specularIntensity;
        this.rotationOffset = rotationOffset;
    }

    // TODO: renderer側で2回走らないようにする
    updateTransform(camera: Camera) {
        if (camera) {
            this.transform.setTranslation(camera.transform.position);
            // 1.733 ... 単位立方体の対角線の長さ sqrt(1 + 1 + 1)
            this.transform.setScaling(Vector3.fill(camera.far / 1.733));
        }
        super.updateTransform();
    }
}
