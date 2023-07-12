// import "@/style.css";

// import smokeImgUrl from "../images/particle-smoke.png";
// import leaveDiffuseImgUrl from "../images/brown_mud_leaves_01_diff_1k.jpg";
// import leaveNormalImgUrl from "../images/brown_mud_leaves_01_nor_gl_1k.jpg"
// import CubeMapPositiveXImgUrl from "../images/px.jpg";
// import CubeMapNegativeXImgUrl from "../images/nx.jpg";
// import CubeMapPositiveYImgUrl from "../images/py.jpg";
// import CubeMapNegativeYImgUrl from "../images/ny.jpg";
// import CubeMapPositiveZImgUrl from "../images/pz.jpg";
// import CubeMapNegativeZImgUrl from "../images/nz.jpg";
// import gltfModelUrl from "../models/glass-wind-poly.gltf";
import smokeImgUrl from '../images/particle-smoke.png?url';
import leaveDiffuseImgUrl from '../images/brown_mud_leaves_01_diff_1k.jpg?url';
import leaveNormalImgUrl from '../images/brown_mud_leaves_01_nor_gl_1k.jpg?url';
import CubeMapPositiveXImgUrl from '../images/px.jpg?url';
import CubeMapNegativeXImgUrl from '../images/nx.jpg?url';
import CubeMapPositiveYImgUrl from '../images/py.jpg?url';
import CubeMapNegativeYImgUrl from '../images/ny.jpg?url';
import CubeMapPositiveZImgUrl from '../images/pz.jpg?url';
import CubeMapNegativeZImgUrl from '../images/nz.jpg?url';
import gltfModelUrl from '../models/glass-wind-poly.gltf?url';

// actors
import { DirectionalLight } from '@/PaleGL/actors/DirectionalLight';
import { Mesh } from '@/PaleGL/actors/Mesh';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera';
import { Skybox } from '@/PaleGL/actors/Skybox';
import { SkinnedMesh } from '@/PaleGL/actors/SkinnedMesh';

// core
import { Engine } from '@/PaleGL/core/Engine';
import { Renderer } from '@/PaleGL/core/Renderer';
import { GPU } from '@/PaleGL/core/GPU';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets';
import { Scene } from '@/PaleGL/core/Scene';
import { Texture } from '@/PaleGL/core/Texture';
import { OrbitCameraController } from '@/PaleGL/core/OrbitCameraController';

// geometries
import { Geometry } from '@/PaleGL/geometries/Geometry';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry';

// loaders
import { loadCubeMap } from '@/PaleGL/loaders/loadCubeMap';
import { loadGLTF } from '@/PaleGL/loaders/loadGLTF';
import { loadImg } from '@/PaleGL/loaders/loadImg';

// materials
import { Material } from '@/PaleGL/materials/Material';
import { PhongMaterial } from '@/PaleGL/materials/PhongMaterial';

// math
import { Color } from '@/PaleGL/math/Color';
import { Vector2 } from '@/PaleGL/math/Vector2';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Vector4 } from '@/PaleGL/math/Vector4';

// postprocess
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess';
import { FXAAPass } from '@/PaleGL/postprocess/FXAAPass';
import { BloomPass } from '@/PaleGL/postprocess/BloomPass';

// inputs
import { TouchInputController } from '@/PaleGL/inputs/TouchInputController';
import { MouseInputController } from '@/PaleGL/inputs/MouseInputController';

// others
import {
    UniformTypes,
    TextureWrapTypes,
    TextureFilterTypes,
    BlendTypes,
    CubeMapAxis,
    RenderTargetTypes,
    AttributeNames,
} from '@/PaleGL/constants';

import { DebuggerGUI } from '@/DebuggerGUI';
import { Camera } from '@/PaleGL/actors/Camera';
// import {Light} from "@/PaleGL/actors/Light";
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
import { Attribute } from '@/PaleGL/core/Attribute';
// import {Actor} from "@/PaleGL/actors/Actor.ts";

// import testVert from '@/PaleGL/shaders/test-shader-vert.glsl';
// import testFrag from '@/PaleGL/shaders/test-shader-frag.glsl';
// import phongVert from '@/PaleGL/shaders/phong-vertex.glsl';

// console.log('----- vert -----');
// console.log(testVert);
// console.log('----- frag -----');
// console.log(testFrag);
// console.log('----- phong vert -----');
// console.log(phongVert);
// console.log('----------------');

const stylesText = `
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

body {
  overflow: hidden;
}

* {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
} 

#wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  background-color: black;
}
`;
const styleElement = document.createElement('style');
styleElement.innerText = stylesText;
document.head.appendChild(styleElement);

const debuggerStates: {
    instanceNum: number;
} = {
    instanceNum: 0,
};

const searchParams = new URLSearchParams(location.search);
const instanceNumStr = searchParams.get('instance-num');
const instanceNum = instanceNumStr ? Number.parseInt(instanceNumStr, 10) : 500;
console.log(`instance num: ${instanceNum}`);

debuggerStates.instanceNum = instanceNum;

let debuggerGUI: DebuggerGUI;
let width: number, height: number;
let floorPlaneMesh: Mesh;
let floorDiffuseMap: Texture;
let floorNormalMap: Texture;
let skinnedMesh: SkinnedMesh;

const isSP = !!window.navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i);
const inputController = isSP ? new TouchInputController() : new MouseInputController();
inputController.start();

// const wrapperElement = document.getElementById("wrapper")!;
const wrapperElement = document.createElement('div');
document.body.appendChild(wrapperElement);
wrapperElement.setAttribute('id', 'wrapper');

// const canvasElement = document.getElementById("js-canvas")! as HTMLCanvasElement;
const canvasElement = document.createElement('canvas')!;
wrapperElement.appendChild(canvasElement);

const gl = canvasElement.getContext('webgl2', { antialias: false });

if (!gl) {
    throw 'invalid gl';
}

const gpu = new GPU({ gl });

const instanceNumView = document.createElement('p');
instanceNumView.textContent = `instance num: ${instanceNum}`;
instanceNumView.style.cssText = `
position: absolute;
bottom: 0;
left: 0;
padding: 0.2em 0.5em;
font-size: 9px;
color: white;
font-weight: bold;
text-shadow: rgba(0, 0, 0, 0.7) 1px 1px;
`;
wrapperElement?.appendChild(instanceNumView);

const captureScene = new Scene();
const compositeScene = new Scene();

const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
// const pixelRatio = Math.min(window.devicePixelRatio, 1);
// const pixelRatio = ;

const renderer = new Renderer({
    gpu,
    canvas: canvasElement,
    pixelRatio,
});

const engine = new Engine({ gpu, renderer });

engine.setScenes([captureScene, compositeScene]);

// const captureSceneCamera = new PerspectiveCamera(60, 1, 0.1, 70);
const captureSceneCamera = new PerspectiveCamera(70, 1, 0.1, 50);
captureScene.add(captureSceneCamera);

const orbitCameraController = new OrbitCameraController(captureSceneCamera);

// const captureSceneDepthRenderTarget = new RenderTarget({
//     gpu,
//     width: 1, height: 1,
//     type: RenderTargetTypes.Depth,
//     writeDepthTexture: true,
//     name: "capture scene depth render target"
// });
// const captureSceneColorRenderTarget = new RenderTarget({
//     gpu,
//     width: 1, height: 1,
//     type: RenderTargetTypes.RGBA,
//     useDepthBuffer: true,
//     name: "capture scene color render target"
// });
const gBufferRenderTarget = new GBufferRenderTargets({
    gpu,
    width: 1,
    height: 1,
    name: 'g-buffer render target',
});
const afterGBufferRenderTarget = new RenderTarget({
    gpu,
    type: RenderTargetTypes.Empty,
    width: 1,
    height: 1,
    name: 'after g-buffer render target',
});

const copyDepthSourceRenderTarget = new RenderTarget({
    gpu,
    type: RenderTargetTypes.Empty,
    width: 1,
    height: 1,
    name: 'copy depth source render target',
});

const copyDepthDestRenderTarget = new RenderTarget({
    gpu,
    type: RenderTargetTypes.Depth,
    width: 1,
    height: 1,
    name: 'copy depth dest render target',
});

captureSceneCamera.onStart = ({ actor }) => {
    (actor as Camera).setClearColor(new Vector4(0, 0, 0, 1));
};
// captureSceneCamera.onFixedUpdate = ({ actor}: {actor: Actor}) => {
captureSceneCamera.onFixedUpdate = () => {
    // 1: fixed position
    // actor.transform.position = new Vector3(-7 * 1.1, 4.5 * 1.4, 11 * 1.2);

    // 2: orbit controls
    if (inputController.isDown) {
        orbitCameraController.setDelta(inputController.deltaNormalizedInputPosition);
    }
    orbitCameraController.fixedUpdate();
};

const directionalLight = new DirectionalLight({
    intensity: 1,
    color: Color.fromRGB(255, 210, 200),
});
// shadows
// TODO: directional light は constructor で shadow camera を生成してるのでこのガードいらない
if (directionalLight.shadowCamera) {
    directionalLight.castShadow = true;
    directionalLight.shadowCamera.near = 1;
    directionalLight.shadowCamera.far = 30;
    (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -10, 10, -10, 10);
    directionalLight.shadowMap = new RenderTarget({
        gpu,
        width: 1024,
        height: 1024,
        type: RenderTargetTypes.Depth,
    });
}

directionalLight.onStart = ({ actor }) => {
    actor.transform.setTranslation(new Vector3(-8, 8, -2));
    actor.transform.lookAt(new Vector3(0, 0, 0));
    // const lightActor = actor as DirectionalLight;
    // lightActor.castShadow = true;
    // // lightActor.castShadow = false;
    // if (lightActor.shadowCamera) {
    //     lightActor.shadowCamera.near = 1;
    //     lightActor.shadowCamera.far = 30;
    //     (lightActor.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -10, 10, -10, 10);
    //     lightActor.shadowMap = new RenderTarget({gpu, width: 1024, height: 1024, type: RenderTargetTypes.Depth});
    // }
};
captureScene.add(directionalLight);

// const postProcess = new PostProcess({gpu, renderer});
// const postProcess = new PostProcess({gpu});
const postProcess = new PostProcess();

const bloomPass = new BloomPass({
    gpu,
    threshold: 0.9,
    bloomAmount: 0.8,
});
bloomPass.enabled = true;
postProcess.addPass(bloomPass);

const fxaaPass = new FXAAPass({ gpu });
fxaaPass.enabled = true;
postProcess.addPass(fxaaPass);

const showBuffersPass = new FragmentPass({
    gpu,
    fragmentShader: `#version 300 es
 
precision highp float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uBaseColorTexture;
uniform sampler2D uNormalTexture;
uniform sampler2D uDepthTexture;
uniform float uNearClip;
uniform float uFarClip;
uniform float uShowGBuffer;

#pragma function_depth

float isArea(vec2 uv) {
    return step(0., uv.x) * (1. - step(1., uv.x)) * step(0., uv.y) * (1. - step(1., uv.y));
}

void main() {
    vec2 baseColorUV = vUv * 2. + vec2(0., -1.);
    vec2 normalUV = vUv * 2. + vec2(-1., -1.);
    vec2 depthUV = vUv * 2.;
    // vec2 depthUV = vUv;
    
    vec4 baseColor = texture(uBaseColorTexture, baseColorUV) * isArea(baseColorUV);
    vec4 normalColor = (texture(uNormalTexture, normalUV) * 2. - 1.) * isArea(normalUV);
    
    float rawDepth = texture(uDepthTexture, depthUV).x * isArea(depthUV);
    // float sceneDepth = viewZToLinearDepth(z, uNearClip, uFarClip);
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip) * isArea(depthUV);

    outColor = baseColor + normalColor + sceneDepth;
}
`,
    uniforms: {
        uBaseColorTexture: {
            type: UniformTypes.Texture,
            value: null,
        },
        uNormalTexture: {
            type: UniformTypes.Texture,
            value: null,
        },
        uDepthTexture: {
            type: UniformTypes.Texture,
            value: null,
        },
        uNearClip: {
            type: UniformTypes.Float,
            value: captureSceneCamera.near,
        },
        uFarClip: {
            type: UniformTypes.Float,
            value: captureSceneCamera.far,
        },
    },
});
showBuffersPass.enabled = false;
postProcess.addPass(showBuffersPass);

postProcess.enabled = true;
// TODO: set post process いらないかも
captureSceneCamera.setPostProcess(postProcess);

const createGLTFSkinnedMesh = async () => {
    const gltfActor = await loadGLTF({ gpu, path: gltfModelUrl });

    // skinned mesh おｎはずなので cast
    const skinningMesh: SkinnedMesh = gltfActor.transform.children[0].transform.children[0] as SkinnedMesh;
    console.log(gltfActor, skinningMesh);

    // ルートにanimatorをattachしてるので一旦ここでassign
    skinningMesh.setAnimationClips(gltfActor.animator.animationClips);

    const instanceInfo: {
        position: number[][];
        scale: number[][];
        color: number[][];
    } = {
        position: [],
        scale: [],
        color: [],
    };
    // new Array(instanceNum).fill(0).forEach((_, i) => {
    new Array(instanceNum).fill(0).forEach(() => {
        const posRangeX = 7.4;
        const posRangeZ = 7.4;
        const px = (Math.random() * 2 - 1) * posRangeX;
        const pz = (Math.random() * 2 - 1) * posRangeZ;
        const p = [px, 0, pz];
        instanceInfo.position.push(p);

        const baseScale = 0.04;
        const randomScaleRange = 0.08;
        const s = Math.random() * randomScaleRange + baseScale;
        instanceInfo.scale.push([s, s * 2, s]);

        const c = Color.fromRGB(
            Math.floor(Math.random() * 240 + 15),
            Math.floor(Math.random() * 10 + 245),
            Math.floor(Math.random() * 245 + 10)
        );
        instanceInfo.color.push([...c.elements]);
    });
    const animationOffsetInfo = instanceInfo.position.map(([x, , z]) => {
        const animationOffsetAdjust = Math.random() * 0.6 - 0.3 + 2;
        return (-x + z) * animationOffsetAdjust;
    });

    skinningMesh.castShadow = true;
    skinningMesh.geometry.instanceCount = instanceNum;

    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstancePosition,
            data: new Float32Array(instanceInfo.position.flat()),
            size: 3,
            // usageType: AttributeUsageType.StaticDraw,
            divisor: 1,
        })
    );
    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceScale,
            data: new Float32Array(instanceInfo.scale.flat()),
            size: 3,
            // usageType: AttributeUsageType.StaticDraw,
            divisor: 1,
        })
    );
    // aInstanceAnimationOffsetは予約語
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceAnimationOffset,
            data: new Float32Array(animationOffsetInfo),
            size: 1,
            // usageType: AttributeUsageType.StaticDraw,
            divisor: 1,
        })
    );
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceVertexColor,
            data: new Float32Array(instanceInfo.color.flat()),
            size: 4,
            // usageType: AttributeUsageType.StaticDraw,
            divisor: 1,
        })
    );
    skinningMesh.material = new PhongMaterial({
        // gpu,
        specularAmount: 0.5,
        receiveShadow: true,
        isSkinning: true,
        gpuSkinning: true,
        isInstancing: true,
        useVertexColor: true,
        vertexShaderModifier: {
            worldPositionPostProcess: `
    mat4 instanceTransform = mat4(
        aInstanceScale.x,       0,                      0,                      0,
        0,                      aInstanceScale.y,       0,                      0,
        0,                      0,                      aInstanceScale.z,       0,
        aInstancePosition.x,    aInstancePosition.y,    aInstancePosition.z,    1
    );
    
    // NOTE: 本当はworldMatrixをかける前の方がよい
    
    worldPosition = instanceTransform * worldPosition;
`,
            outClipPositionPreProcess: `
    vVertexColor = aInstanceVertexColor;
`,
        },
    });

    return skinningMesh;
};

const main = async () => {
    const particleImg = await loadImg(smokeImgUrl);
    const particleMap = new Texture({
        gpu,
        img: particleImg,
    });

    const floorDiffuseImg = await loadImg(leaveDiffuseImgUrl);
    floorDiffuseMap = new Texture({
        gpu,
        img: floorDiffuseImg,
        // mipmap: true,
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
        minFilter: TextureFilterTypes.Linear,
        magFilter: TextureFilterTypes.Linear,
    });

    const floorNormalImg = await loadImg(leaveNormalImgUrl);
    floorNormalMap = new Texture({
        gpu,
        img: floorNormalImg,
        // mipmap: true,
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
        minFilter: TextureFilterTypes.Linear,
        magFilter: TextureFilterTypes.Linear,
    });

    const images = {
        [CubeMapAxis.PositiveX]: CubeMapPositiveXImgUrl,
        [CubeMapAxis.NegativeX]: CubeMapNegativeXImgUrl,
        [CubeMapAxis.PositiveY]: CubeMapPositiveYImgUrl,
        [CubeMapAxis.NegativeY]: CubeMapNegativeYImgUrl,
        [CubeMapAxis.PositiveZ]: CubeMapPositiveZImgUrl,
        [CubeMapAxis.NegativeZ]: CubeMapNegativeZImgUrl,
    };

    const cubeMap = await loadCubeMap({ gpu, images });

    const skyboxMesh = new Skybox({
        gpu,
        cubeMap,
        rotationOffset: 0.8,
    });

    skinnedMesh = await createGLTFSkinnedMesh();

    const floorGeometry = new PlaneGeometry({
        gpu,
        calculateTangent: true,
        calculateBinormal: true,
    });
    floorPlaneMesh = new Mesh({
        geometry: floorGeometry,
        material: new PhongMaterial({
            // gpu,
            diffuseMap: floorDiffuseMap,
            normalMap: floorNormalMap,
            receiveShadow: true,
            specularAmount: 0.4,
        }),
        castShadow: false,
    });
    floorPlaneMesh.onStart = ({ actor }) => {
        const meshActor = actor as Mesh;
        actor.transform.setScaling(Vector3.fill(10));
        actor.transform.setRotationX(-90);
        // actor.material.uniforms.uDiffuseMapUvScale.value = new Vector2(3, 3);
        // actor.material.uniforms.uNormalMapUvScale.value = new Vector2(3, 3);
        meshActor.material.updateUniform('uDiffuseMapUvScale', new Vector2(3, 3));
        meshActor.material.updateUniform('uNormalMapUvScale', new Vector2(3, 3));
    };

    const particleNum = 50;
    const particleGeometry = new Geometry({
        gpu,
        attributes: [
            new Attribute({
                name: AttributeNames.Position.toString(),
                // dummy data
                data: new Float32Array(
                    new Array(particleNum)
                        .fill(0)
                        .map(() => {
                            const x = Math.random() * 18 - 10;
                            const y = Math.random() * 0.5;
                            // const y = 3.;
                            const z = Math.random() * 18 - 8;
                            return [x, y, z, x, y, z, x, y, z, x, y, z];
                        })
                        .flat()
                ),
                size: 3,
            }),
            new Attribute({
                name: AttributeNames.Uv.toString(),
                data: new Float32Array(
                    new Array(particleNum)
                        .fill(0)
                        .map(() => [0, 1, 0, 0, 1, 1, 1, 0])
                        .flat()
                ),
                size: 2,
            }),
            new Attribute({
                name: AttributeNames.Color.toString(),
                data: new Float32Array(
                    new Array(particleNum)
                        .fill(0)
                        .map(() => {
                            const c = Color.fromRGB(
                                Math.random() * 50 + 200,
                                Math.random() * 50 + 190,
                                Math.random() * 50 + 180,
                                Math.random() * 150 + 50
                            );
                            return [...c.elements, ...c.elements, ...c.elements, ...c.elements];
                        })
                        .flat()
                ),
                size: 4,
            }),
            new Attribute({
                name: 'aBillboardSize',
                data: new Float32Array(
                    new Array(particleNum)
                        .fill(0)
                        .map(() => {
                            const s = Math.random() * 3.5 + 0.5;
                            return [s, s, s, s];
                        })
                        .flat()
                ),
                size: 1,
            }),
            new Attribute({
                name: 'aBillboardRateOffset',
                data: new Float32Array(
                    new Array(particleNum)
                        .fill(0)
                        .map(() => {
                            const r = Math.random();
                            return [r, r, r, r];
                        })
                        .flat()
                ),
                size: 1,
            }),
        ],
        indices: new Array(particleNum)
            .fill(0)
            .map((_, i) => {
                const offset = i * 4;
                const index = [0 + offset, 1 + offset, 2 + offset, 2 + offset, 1 + offset, 3 + offset];
                return index;
            })
            .flat(),
        drawCount: particleNum * 6,
    });
    const particleMaterial = new Material({
        // gpu,
        vertexShader: `#version 300 es

#pragma BLOCK_ATTRIBUTES

out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;

out vec4 vVertexColor;
out vec4 vViewPosition;
out vec4 vClipPosition;

#pragma uniform_transform_vertex
#pragma uniform_engine

uniform vec2[4] uBillboardPositionConverters;

void main() {
    int particleId = int(mod(float(gl_VertexID), 4.));
    float t = 3.;
    float r = mod((uTime / t) + aBillboardRateOffset, 1.);

    vec4 localPosition = vec4(aPosition, 1.);

    localPosition.x += mix(0., 4., r) * mix(.4, .8, aBillboardRateOffset);
    localPosition.z += mix(0., 4., r) * mix(-.4, -.8, aBillboardRateOffset);

    // assign common varyings 
    vUv = aUv; 
    vVertexColor = aColor;
    vVertexColor.a *= (smoothstep(0., .2, r) * (1. - smoothstep(.2, 1., r)));

    vec4 worldPosition = uWorldMatrix * localPosition;
  
    vWorldPosition = worldPosition.xyz;
    
    vec4 viewPosition = uViewMatrix * worldPosition;
    viewPosition.xy += uBillboardPositionConverters[particleId] * aBillboardSize;
    vViewPosition = viewPosition;
    
    vec4 clipPosition = uProjectionMatrix * viewPosition;
 
    gl_Position = clipPosition;
    
    vClipPosition = clipPosition;
}`,
        fragmentShader: `#version 300 es
            
precision highp float;

in vec2 vUv;
in vec4 vVertexColor;
in vec4 vViewPosition;
in vec4 vClipPosition;

out vec4 outColor;
// layout (location = 0) out vec4 outBaseColor;
// layout (location = 1) out vec4 outNormalColor;

uniform sampler2D uParticleMap;
uniform sampler2D uDepthTexture;
uniform float uNearClip;
uniform float uFarClip;

#pragma function_depth

void main() {
    // int particleId = int(mod(float(gl_VertexID), 4.));

    vec4 texColor = texture(uParticleMap, vUv);
    vec3 baseColor = vVertexColor.xyz;
    float alpha = texColor.x * vVertexColor.a;
    
    // calc soft fade
    
    float rawDepth = texelFetch(uDepthTexture, ivec2(gl_FragCoord.xy), 0).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    // for debug
    // outColor = vec4(vec3(sceneDepth), 1.);

    float currentDepth = viewZToLinearDepth(vViewPosition.z, uNearClip, uFarClip);
    // for debug
    // outColor = vec4(vec3(currentDepth), 1.);
    
    float diffDepth = abs(sceneDepth) - abs(currentDepth);
    float softFade = smoothstep(0., .01, diffDepth);
    // for debug
    // outColor = vec4(vec3(softFade), 1.);
    
    // result
    
    // outBaseColor = vec4(1., 0., 0., 1.);
    // outColor = vec4(1., 0., 0., 1.);

    float fadedAlpha = alpha * softFade;
    if(fadedAlpha < .01) {
        discard;
    }

    outColor = vec4(baseColor, fadedAlpha);
    // outBaseColor = vec4(baseColor, fadedAlpha);
    // outNormalColor = vec4(0., 0., 1., 1.); // dummy
}
        `,
        uniforms: {
            uParticleMap: {
                type: UniformTypes.Texture,
                value: particleMap,
            },
            uBillboardPositionConverters: {
                type: UniformTypes.Vector2Array,
                value: [new Vector2(-1, 1), new Vector2(-1, -1), new Vector2(1, 1), new Vector2(1, -1)],
            },
            uTime: {
                type: UniformTypes.Float,
                value: 0,
            },
            uDepthTexture: {
                type: UniformTypes.Texture,
                // value: captureSceneDepthRenderTarget.read.depthTexture,
                // value: gBufferRenderTarget.read.depthTexture,
                value: null,
            },
            uNearClip: {
                type: UniformTypes.Float,
                value: captureSceneCamera.near,
            },
            uFarClip: {
                type: UniformTypes.Float,
                value: captureSceneCamera.far,
            },
        },
        // blendType: BlendTypes.Additive
        blendType: BlendTypes.Transparent,
        depthWrite: false,
    });
    const particleMesh = new Mesh({
        geometry: particleGeometry,
        material: particleMaterial,
    });
    particleMesh.onFixedUpdate = ({ fixedTime }) => {
        // particleMaterial.uniforms.uTime.value = fixedTime;
        particleMaterial.updateUniform('uTime', fixedTime);
    };

    captureScene.add(skinnedMesh);
    captureScene.add(floorPlaneMesh);
    captureScene.add(skyboxMesh);
    captureScene.add(particleMesh);

    // TODO: engine側に移譲したい
    const onWindowResize = () => {
        width = wrapperElement.offsetWidth;
        height = wrapperElement.offsetHeight;
        inputController.setSize(width, height);
        engine.setSize(width, height);

        gBufferRenderTarget.setSize(width * pixelRatio, height * pixelRatio);
        afterGBufferRenderTarget.setSize(width * pixelRatio, height * pixelRatio);
        copyDepthSourceRenderTarget.setSize(width * pixelRatio, height * pixelRatio);
        copyDepthDestRenderTarget.setSize(width * pixelRatio, height * pixelRatio);
    };

    engine.onBeforeStart = () => {
        onWindowResize();
        window.addEventListener('resize', onWindowResize);

        orbitCameraController.distance = isSP ? 20 : 15;
        orbitCameraController.attenuation = 0.01;
        orbitCameraController.dampingFactor = 0.2;
        orbitCameraController.azimuthSpeed = 100;
        orbitCameraController.altitudeSpeed = 100;
        orbitCameraController.deltaAzimuthPower = 2;
        orbitCameraController.deltaAltitudePower = 2;
        orbitCameraController.lookAtTarget = new Vector3(0, -1, 0);
        orbitCameraController.start(20, -30);
    };

    // engine.onAfterStart = () => {
    //     window.setTimeout(() => {
    //         onWindowResize()
    //     },1000)
    // }

    engine.onBeforeUpdate = () => {
        if (!debuggerGUI) initDebugger();
    };

    engine.onBeforeFixedUpdate = () => {
        inputController.fixedUpdate();
    };

    // engine.onRender = (time: number, deltaTime: number) => {
    engine.onRender = () => {
        captureSceneCamera.setRenderTarget(gBufferRenderTarget);
        skyboxMesh.enabled = true;
        floorPlaneMesh.enabled = true;
        skinnedMesh.enabled = true;
        particleMesh.enabled = false;
        renderer.render(captureScene, captureSceneCamera, {});

        afterGBufferRenderTarget.setTexture(gBufferRenderTarget.baseColorTexture);
        afterGBufferRenderTarget.setDepthTexture(gBufferRenderTarget.depthTexture);

        // TODO: copy depth texture
        copyDepthSourceRenderTarget.setDepthTexture(gBufferRenderTarget.depthTexture);
        RenderTarget.blitDepth({
            gpu,
            sourceRenderTarget: copyDepthSourceRenderTarget,
            destRenderTarget: copyDepthDestRenderTarget,
            width: width * pixelRatio,
            height: height * pixelRatio,
        });
        particleMesh.material.updateUniform('uDepthTexture', copyDepthDestRenderTarget.depthTexture);

        captureSceneCamera.setRenderTarget(afterGBufferRenderTarget);
        skyboxMesh.enabled = false;
        floorPlaneMesh.enabled = false;
        skinnedMesh.enabled = false;
        particleMesh.enabled = true;
        renderer.render(captureScene, captureSceneCamera, {
            useShadowPass: false,
            clearScene: false,
        });

        showBuffersPass.material.updateUniform('uBaseColorTexture', gBufferRenderTarget.baseColorTexture);
        showBuffersPass.material.updateUniform('uNormalTexture', gBufferRenderTarget.normalTexture);
        showBuffersPass.material.updateUniform('uDepthTexture', gBufferRenderTarget.depthTexture);
        // showBuffersPass.material.updateUniform("uDepthTexture", directionalLight.shadowMap!.read.depthTexture);
        postProcess.render({
            gpu,
            renderer,
            sceneRenderTarget: afterGBufferRenderTarget,
        });
    };

    const tick = (time: number) => {
        engine.run(time);
        requestAnimationFrame(tick);
    };

    engine.start();
    requestAnimationFrame(tick);
};

function initDebugger() {
    debuggerGUI = new DebuggerGUI();

    debuggerGUI.addSliderDebugger({
        label: 'instance num',
        minValue: 1,
        maxValue: 40000,
        initialValue: debuggerStates.instanceNum,
        stepValue: 1,
        onChange: (value) => {
            debuggerStates.instanceNum = value;
        },
    });

    debuggerGUI.addButtonDebugger({
        buttonLabel: 'reload',
        onClick: () => {
            const url = `${location.origin}${location.pathname}?instance-num=${debuggerStates.instanceNum}`;
            location.replace(url);
        },
    });

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: 'show buffers',
        initialValue: showBuffersPass.enabled,
        onChange: (value) => (showBuffersPass.enabled = value),
    });

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: 'bloom pass enabled',
        initialValue: bloomPass.enabled,
        onChange: (value) => (bloomPass.enabled = value),
    });

    debuggerGUI.addSliderDebugger({
        label: 'bloom amount',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: bloomPass.bloomAmount,
        onChange: (value) => {
            bloomPass.bloomAmount = value;
        },
    });

    debuggerGUI.addSliderDebugger({
        label: 'bloom threshold',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: bloomPass.threshold,
        onChange: (value) => {
            bloomPass.threshold = value;
        },
    });

    debuggerGUI.addSliderDebugger({
        label: 'bloom tone',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: bloomPass.tone,
        onChange: (value) => {
            bloomPass.tone = value;
        },
    });

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: 'fxaa pass enabled',
        initialValue: fxaaPass.enabled,
        onChange: (value) => (fxaaPass.enabled = value),
    });

    wrapperElement.appendChild(debuggerGUI.domElement);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
