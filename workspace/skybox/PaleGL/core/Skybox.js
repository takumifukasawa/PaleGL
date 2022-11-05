import {Mesh} from "./../core/Mesh.js";
import {UniformTypes,PrimitiveTypes} from "./../constants.js";
import {Material} from "./../materials/Material.js";
import {loadImg} from "./../loaders/loadImg.js";
import {loadObj} from "./../loaders/loadObj.js";
import {Geometry} from "./../geometries/Geometry.js";
import {CubeMap} from "./../core/CubeMap.js";

const skyboxVertexShader = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aUv;
layout (location = 2) in vec3 aNormal;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

out vec2 vUv;
out vec3 vNormal;
out vec3 vRawNormal;
out vec3 vLocalPosition;
out vec3 vWorldPosition;

void main() {
    vUv = aUv;
    vLocalPosition = aPosition;
    vRawNormal = aNormal;
    vNormal = (uNormalMatrix * vec4(aNormal, 1)).xyz;
    vec4 worldPosition = uWorldMatrix * vec4(aPosition, 1);
    vWorldPosition = worldPosition.xyz;
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

const skyboxFragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;
in vec3 vNormal;
in vec3 vRawNormal;
in vec3 vWorldPosition;
in vec3 vLocalPosition;

uniform samplerCube uCubeTexture;
uniform vec3 uViewPosition;

out vec4 outColor;

mat2 rotate(float r) {
    float c = cos(r);
    float s = sin(r);
    return mat2(c, s, -s, c);
}

void main() {
    vec3 N = normalize(vNormal);

    vec3 reflectDir = -N;
    reflectDir.x *= -1.;
    reflectDir.xz *= rotate(3.14);
    vec4 textureColor = texture(uCubeTexture, reflectDir);
    
    outColor = textureColor;
}
`;

export class Skybox extends Mesh {
    constructor({gpu, cubeMap}) {
        const material = new Material({
            gpu,
            vertexShader: skyboxVertexShader,
            fragmentShader: skyboxFragmentShader,
            primitiveType: PrimitiveTypes.Triangles,
            uniforms: {
                uCubeTexture: {
                    type: UniformTypes.CubeMap,
                    value: cubeMap
                },
            }
        });

        super(null, material);
    }

    async load({ gpu }) {
        const skyboxObjData = await loadObj("./models/skybox-32-32.obj");
        this.geometry = new Geometry({
            gpu,
            attributes: {
                position: {
                    data: skyboxObjData.positions,
                    size: 3
                },
                uv: {
                    data: skyboxObjData.uvs,
                    size: 2,
                },
                normal: {
                    data: skyboxObjData.normals,
                    size: 3
                },
            },
            indices: skyboxObjData.indices,
            drawCount: skyboxObjData.indices.length
        });
    }
}