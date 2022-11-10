import {Mesh} from "./Mesh.js";
import {UniformTypes, PrimitiveTypes, ActorTypes, FaceSide} from "./../constants.js";
import {Material} from "./../materials/Material.js";
import {loadImg} from "./../loaders/loadImg.js";
import {loadObj, parseObj} from "./../loaders/loadObj.js";
import {Geometry} from "./../geometries/Geometry.js";
import {CubeMap} from "./../core/CubeMap.js";
import {BoxGeometry} from "../geometries/BoxGeometry.js";
import {PlaneGeometry} from "../geometries/PlaneGeometry.js";
import {Matrix4} from "../math/Matrix4.js";
import {Vector3} from "../math/Vector3.js";

// 法線が内側を向いた単位立方体
const geometryObjText = `
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

const skyboxVertexShader = `#version 300 es

precision mediump float;

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aUv;
layout (location = 2) in vec3 aNormal;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

out vec2 vUv;
out vec3 vNormal;
out vec3 vWorldPosition;

void main() {
    vUv = aUv;
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
in vec3 vWorldPosition;

uniform samplerCube uCubeTexture;
uniform vec3 uViewPosition;
uniform mat4 uViewDirectionProjectionInverse;

out vec4 outColor;

mat2 rotate(float r) {
    float c = cos(r);
    float s = sin(r);
    return mat2(c, s, -s, c);
}

void main() {
    // pattern_1: inverse normal
    vec3 N = normalize(vNormal);
    vec3 reflectDir = -N;

    // pattern_2: world position dir
    // skyboxの中心 = カメラの中心なので、こちらでもよい
    // vec3 reflectDir = normalize(vWorldPosition - uViewPosition);

    reflectDir.x *= -1.;
    reflectDir.xz *= rotate(3.14);
    vec4 textureColor = texture(uCubeTexture, reflectDir);
    outColor = textureColor;
}
`;

export class Skybox extends Mesh {
    constructor({gpu, cubeMap}) {
        const skyboxObjData = parseObj(geometryObjText);
        const geometry = new Geometry({
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
        // const geometry = new PlaneGeometry({ gpu });
        
        const material = new Material({
            gpu,
            vertexShader: skyboxVertexShader,
            fragmentShader: skyboxFragmentShader,
            primitiveType: PrimitiveTypes.Triangles,
            depthTest: false,
            depthWrite: false,
            uniforms: {
                uCubeTexture: {
                    type: UniformTypes.CubeMap,
                    value: cubeMap
                },
                uViewDirectionProjectionInverse: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity(),
                },
            }
        });
        
        super(geometry, material, ActorTypes.Skybox);
    }
   
    // TODO: renderer側で2回走らないようにする
    updateTransform(camera) {
        if(camera) {
            this.transform.setTranslation(camera.transform.position);
            // 1.733 ... 単位立方体の対角線の長さ sqrt(1 + 1 + 1)
            this.transform.setScaling(Vector3.fill(camera.far / 1.733));
        }
        super.updateTransform();
    }
}