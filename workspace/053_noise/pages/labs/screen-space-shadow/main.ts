import { DirectionalLight } from '@/PaleGL/actors/DirectionalLight';
import { Mesh } from '@/PaleGL/actors/Mesh';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera';
import { Skybox } from '@/PaleGL/actors/Skybox';
import { SkinnedMesh } from '@/PaleGL/actors/SkinnedMesh';
import { Engine } from '@/PaleGL/core/Engine';
import { Renderer } from '@/PaleGL/core/Renderer';
import { GPU } from '@/PaleGL/core/GPU';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { Scene } from '@/PaleGL/core/Scene';
import { Rotator } from '@/PaleGL/math/Rotator';
import { Texture } from '@/PaleGL/core/Texture';
import { OrbitCameraController } from '@/PaleGL/core/OrbitCameraController';
import { Geometry } from '@/PaleGL/geometries/Geometry';
import { loadCubeMap } from '@/PaleGL/loaders/loadCubeMap';
import { loadGLTF } from '@/PaleGL/loaders/loadGLTF';
import { loadImg } from '@/PaleGL/loaders/loadImg';
import { Material } from '@/PaleGL/materials/Material';
import { Color } from '@/PaleGL/math/Color';
import { Vector2 } from '@/PaleGL/math/Vector2';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Vector4 } from '@/PaleGL/math/Vector4';
import { BufferVisualizerPass } from '@/PaleGL/postprocess/BufferVisualizerPass';
import { TouchInputController } from '@/PaleGL/inputs/TouchInputController';
import { MouseInputController } from '@/PaleGL/inputs/MouseInputController';
import {
    UniformTypes,
    BlendTypes,
    RenderTargetTypes,
    AttributeNames,
    AttributeUsageType,
    UniformNames,
    FaceSide,
    TextureDepthPrecisionType,
    UniformBlockNames,
    ActorTypes,
} from '@/PaleGL/constants';
import { DebuggerGUI } from '@/DebuggerGUI';
import { Camera } from '@/PaleGL/actors/Camera';
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
import { Attribute } from '@/PaleGL/core/Attribute';
import { CubeMap } from '@/PaleGL/core/CubeMap.ts';
import { GBufferMaterial } from '@/PaleGL/materials/GBufferMaterial.ts';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess.ts';
import { TransformFeedbackDoubleBuffer } from '@/PaleGL/core/TransformFeedbackDoubleBuffer.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { clamp, saturate } from '@/PaleGL/utilities/mathUtilities.ts';
import { UnlitMaterial } from '@/PaleGL/materials/UnlitMaterial.ts';
import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';

import soundVertexShader from '@/PaleGL/shaders/sound-vertex-street-light.glsl';
import { GLSLSound } from '@/PaleGL/core/GLSLSound.ts';

// assets
import smokeImgUrl from '../../../assets/images/particle-smoke.png?url';
import CubeMapPositiveXImgUrl from '../../../assets/images/laufenurg_church/px.jpg?url';
import CubeMapNegativeXImgUrl from '../../../assets/images/laufenurg_church/nx.jpg?url';
import CubeMapPositiveYImgUrl from '../../../assets/images/laufenurg_church/py.jpg?url';
import CubeMapNegativeYImgUrl from '../../../assets/images/laufenurg_church/ny.jpg?url';
import CubeMapPositiveZImgUrl from '../../../assets/images/laufenurg_church/pz.jpg?url';
import CubeMapNegativeZImgUrl from '../../../assets/images/laufenurg_church/nz.jpg?url';
import { intersectRayWithPlane, Plane } from '@/PaleGL/math/Plane.ts';
import {BoxGeometry} from "@/PaleGL/geometries/BoxGeometry.ts";
import {PointLight} from "@/PaleGL/actors/PointLight.ts";
import {PlaneGeometry} from "@/PaleGL/geometries/PlaneGeometry.ts";
import {SharedTexturesTypes} from "@/PaleGL/core/createSharedTextures.ts";

// -------------------
// constants
// -------------------

const MAX_INSTANCE_NUM = 2048;
const INITIAL_INSTANCE_NUM = 64;

const ASSET_DIR = '/labs/street-light/assets/';

//--------------------

const createSpotLightDebugger = (spotLight: SpotLight, label: string) => {
    debuggerGUI.addBorderSpacer();

    const spotLightDebuggerGroup = debuggerGUI.addGroup(label, false);

    spotLightDebuggerGroup.addColorDebugger({
        label: 'color',
        initialValue: spotLight.color.getHexCoord(),
        onChange: (value) => {
            spotLight.color = Color.fromHex(value);
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'intensity',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: spotLight.intensity,
        onChange: (value) => {
            spotLight.intensity = value;
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'distance',
        minValue: 0,
        maxValue: 100,
        stepValue: 0.01,
        initialValue: spotLight.distance,
        onChange: (value) => {
            spotLight.distance = value;
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'attenuation',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: spotLight.attenuation,
        onChange: (value) => {
            spotLight.attenuation = value;
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'coneCos',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: spotLight.coneCos,
        onChange: (value) => {
            spotLight.coneCos = value;
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'penumbraCos',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: spotLight.penumbraCos,
        onChange: (value) => {
            spotLight.penumbraCos = value;
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'pos x',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: spotLight.transform.position.x,
        onChange: (value) => {
            spotLight.transform.position.x = value;
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'pos y',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: spotLight.transform.position.y,
        onChange: (value) => {
            spotLight.transform.position.y = value;
        },
    });

    spotLightDebuggerGroup.addSliderDebugger({
        label: 'pos z',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: spotLight.transform.position.z,
        onChange: (value) => {
            spotLight.transform.position.z = value;
        },
    });
};

const createPointLightDebugger = (pointLight: PointLight, label: string) => {
    debuggerGUI.addBorderSpacer();

    const pointLightDebuggerGroup = debuggerGUI.addGroup(label, false);

    pointLightDebuggerGroup.addColorDebugger({
        label: 'color',
        initialValue: pointLight.color.getHexCoord(),
        onChange: (value) => {
            pointLight.color = Color.fromHex(value);
        },
    });

    pointLightDebuggerGroup.addSliderDebugger({
        label: 'intensity',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: pointLight.intensity,
        onChange: (value) => {
            pointLight.intensity = value;
        },
    });

    pointLightDebuggerGroup.addSliderDebugger({
        label: 'distance',
        minValue: 0,
        maxValue: 100,
        stepValue: 0.01,
        initialValue: pointLight.distance,
        onChange: (value) => {
            pointLight.distance = value;
        },
    });

    pointLightDebuggerGroup.addSliderDebugger({
        label: 'attenuation',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: pointLight.attenuation,
        onChange: (value) => {
            pointLight.attenuation = value;
        },
    });

    pointLightDebuggerGroup.addSliderDebugger({
        label: 'pos x',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: pointLight.transform.position.x,
        onChange: (value) => {
            pointLight.transform.position.x = value;
        },
    });

    pointLightDebuggerGroup.addSliderDebugger({
        label: 'pos y',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: pointLight.transform.position.y,
        onChange: (value) => {
            pointLight.transform.position.y = value;
        },
    });

    pointLightDebuggerGroup.addSliderDebugger({
        label: 'pos z',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: pointLight.transform.position.z,
        onChange: (value) => {
            pointLight.transform.position.z = value;
        },
    });
}


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

debuggerStates.instanceNum = INITIAL_INSTANCE_NUM;

let debuggerGUI: DebuggerGUI;
let width: number, height: number;
let streetFloorActor: Actor;
let streetLightActorLeft: Actor;
let streetLightActorRight: Actor;
let attractSphereMesh: Mesh;
let skinnedMesh: SkinnedMesh;
let glslSound: GLSLSound;
let cubeMap: CubeMap;
let boxMeshActor01: Actor;
let boxMeshActor02: Actor;
let boxMeshActor03: Actor;

const isSP = !!window.navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i);
const inputController = isSP ? new TouchInputController() : new MouseInputController();
inputController.start();

const wrapperElement = document.createElement('div');
document.body.appendChild(wrapperElement);
wrapperElement.setAttribute('id', 'wrapper');

const canvasElement = document.createElement('canvas')!;
wrapperElement.appendChild(canvasElement);

const gl = canvasElement.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });

if (!gl) {
    throw 'invalid gl';
}

const gpu = new GPU({ gl });

const captureScene = new Scene();

const pixelRatio = Math.min(window.devicePixelRatio, 1);

const renderer = new Renderer({
    gpu,
    canvas: canvasElement,
    pixelRatio,
});

const engine = new Engine({ gpu, renderer, showStats: true });

engine.setScene(captureScene);

const captureSceneCamera = new PerspectiveCamera(50, 1, 0.1, 50);
captureScene.add(captureSceneCamera);

const orbitCameraController = new OrbitCameraController(captureSceneCamera);
orbitCameraController.distance = isSP ? 15 : 15;
orbitCameraController.attenuation = 0.01;
orbitCameraController.dampingFactor = 0.2;
orbitCameraController.azimuthSpeed = 100;
orbitCameraController.altitudeSpeed = 100;
orbitCameraController.deltaAzimuthPower = 2;
orbitCameraController.deltaAltitudePower = 2;
orbitCameraController.maxAltitude = 5;
orbitCameraController.minAltitude = -45;
orbitCameraController.maxAzimuth = 55;
orbitCameraController.minAzimuth = -55;
orbitCameraController.defaultAzimuth = 10;
orbitCameraController.defaultAltitude = -10;
orbitCameraController.lookAtTarget = new Vector3(0, 3, 0);

captureSceneCamera.subscribeOnStart(({ actor }) => {
    (actor as Camera).setClearColor(new Vector4(0, 0, 0, 1));
});
captureSceneCamera.onFixedUpdate = () => {
    // 1: fixed position
    // actor.transform.position = new Vector3(-7 * 1.1, 4.5 * 1.4, 11 * 1.2);

    // 2: orbit controls
    // if (inputController.isDown && debuggerStates.orbitControlsEnabled) {
    if (inputController.isDown && orbitCameraController.enabled) {
        orbitCameraController.setDelta(inputController.deltaNormalizedInputPosition);
    }
    orbitCameraController.fixedUpdate();
};

const directionalLight = new DirectionalLight({
    intensity: 0.1,
    color: Color.white,
});

// shadows
// TODO: directional light は constructor で shadow camera を生成してるのでこのガードいらない
if (directionalLight.shadowCamera) {
    directionalLight.shadowCamera.visibleFrustum = false;
    directionalLight.castShadow = true;
    directionalLight.shadowCamera.near = 1;
    directionalLight.shadowCamera.far = 15;
    (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -7, 7, -7, 7);
    directionalLight.shadowMap = new RenderTarget({
        gpu,
        width: 1024,
        height: 1024,
        type: RenderTargetTypes.Depth,
        depthPrecision: TextureDepthPrecisionType.High,
    });
}

directionalLight.subscribeOnStart(({ actor }) => {
    actor.transform.setTranslation(new Vector3(-8, 8, -2));
    actor.transform.lookAt(new Vector3(0, 0, 0));
});
captureScene.add(directionalLight);

const spotLight1 = new SpotLight({
    intensity: 1.4,
    color: new Color(1, 1, 1),
    distance: 15,
    attenuation: 1.06,
    coneCos: 0.8,
    penumbraCos: 0.9,
});

if (spotLight1.shadowCamera) {
    spotLight1.shadowCamera.visibleFrustum = false;
    spotLight1.castShadow = true;
    spotLight1.shadowCamera.near = 0.1;
    spotLight1.shadowCamera.far = spotLight1.distance;
    (spotLight1.shadowCamera as PerspectiveCamera).setPerspectiveSize(1); // TODO: いらないかも
    spotLight1.shadowMap = new RenderTarget({
        gpu,
        width: 1024,
        height: 1024,
        type: RenderTargetTypes.Depth,
        depthPrecision: TextureDepthPrecisionType.High,
    });
}
spotLight1.subscribeOnStart(({ actor }) => {
    actor.transform.setTranslation(new Vector3(3.4, 8.1, 0));
    actor.transform.lookAt(new Vector3(2, 0, 0));
});

captureScene.add(spotLight1);

const spotLight2 = new SpotLight({
    intensity: 1.4,
    color: new Color(1, 1, 1),
    distance: 15,
    attenuation: 1.06,
    coneCos: 0.8,
    penumbraCos: 0.9,
});

if (spotLight2.shadowCamera) {
    spotLight2.shadowCamera.visibleFrustum = false;
    spotLight2.castShadow = true;
    spotLight2.shadowCamera.near = 0.1;
    spotLight2.shadowCamera.far = spotLight2.distance;
    (spotLight2.shadowCamera as PerspectiveCamera).setPerspectiveSize(1); // TODO: いらないかも
    spotLight2.shadowMap = new RenderTarget({
        gpu,
        width: 1024,
        height: 1024,
        type: RenderTargetTypes.Depth,
        depthPrecision: TextureDepthPrecisionType.High,
    });
}
spotLight2.subscribeOnStart(({ actor }) => {
    actor.transform.setTranslation(new Vector3(-3.4, 8.1, 0));
    actor.transform.lookAt(new Vector3(-2, 0, 0));
});

captureScene.add(spotLight2);

const pointLight1 = new PointLight({
    intensity: 6,
    color: new Color(1, 1, 1),
    distance: 15,
    attenuation: 1,
});
pointLight1.transform.position = new Vector3(0, .5, 0);

captureScene.add(pointLight1);

const cameraPostProcess = new PostProcess();

renderer.depthOfFieldPass.focusDistance = 18.5;
renderer.depthOfFieldPass.focusRange = 17;

const bufferVisualizerPass = new BufferVisualizerPass({ gpu });
bufferVisualizerPass.enabled = false;
cameraPostProcess.addPass(bufferVisualizerPass);

cameraPostProcess.enabled = true;
// TODO: set post process いらないかも
captureSceneCamera.setPostProcess(cameraPostProcess);

const createStreetFloorActor = async () => {
    // const gltfActor = await loadGLTF({gpu, path: gltfStreetFloorModelUrl});
    const gltfActor = await loadGLTF({ gpu, dir: ASSET_DIR, path: 'street-floor-separete.gltf' });
    return gltfActor;
};

const createStreetLightActor = async () => {
    // const gltfActor = await loadGLTF({gpu, dir: ASSET_DIR,  path: "street-light.gltf"});
    const gltfActor = await loadGLTF({ gpu, dir: ASSET_DIR, path: 'street-light-full.gltf' });
    return gltfActor;

    // const mesh: Mesh = gltfActor.transform.children[0] as Mesh;
    // const mesh: Mesh = gltfActor;

    // const matA = new GBufferMaterial({
    //     diffuseColor: new Color(1, 1, 1, 1),
    //     metallic: 1,
    //     roughness: 1,
    // });
    // const matB = new GBufferMaterial({
    //     diffuseColor: new Color(1, 1, 1, 1),
    //     metallic: 1,
    //     roughness: 1,
    // });
    // const matC = new GBufferMaterial({
    //     diffuseColor: new Color(1, 1, 1, 1),
    //     metallic: 1,
    //     roughness: 1,
    // });
    // mesh.materials[0] = matA;
    // mesh.materials[1] = matB;
    // mesh.materials[2] = matC;

    // return mesh;
};

const createGLTFSphereMesh = async (material: Material) => {
    // const gltfActor = await loadGLTF({ gpu, path: gltfSphereModelUrl });
    const gltfActor = await loadGLTF({ gpu, dir: ASSET_DIR, path: 'sphere-32x32.gltf' });
    const mesh: Mesh = gltfActor.transform.children[0] as Mesh;
    mesh.castShadow = true;
    mesh.material = material;

    // mesh.material = new GBufferMaterial({
    //     // gpu,
    //     // diffuseMap: floorDiffuseMap,
    //     // normalMap: floorNormalMap,
    //     // envMap: cubeMap,
    //     // diffuseColor: new Color(0.5, 0.05, 0.05, 1),
    //     diffuseColor: new Color(1, 0.76, 0.336, 1),
    //     // diffuseColor: new Color(0, 0, 0, 1),
    //     // diffuseColor: new Color(1, 1, 1, 1),
    //     receiveShadow: true,
    //     metallic: 0,
    //     roughness: 0,
    //     // specularAmount: 0.4,
    //     // ambientAmount: 0.2,
    //     emissiveColor: new Color(1., 1., 1., 1.)
    // });
    return mesh;
};

const createInstanceUpdater = (instanceNum: number) => {
    //
    // begin create mesh
    //

    // const planeNum = 512;

    const initialPosition = new Float32Array(
        maton
            .range(instanceNum)
            .map(() => {
                const range = 10;
                return [
                    Math.random() * range - range * 0.5,
                    Math.random() * 4 + 2,
                    Math.random() * range - range * 0.5,
                ];
            })
            .flat()
    );

    const initialVelocity = new Float32Array(
        maton
            .range(instanceNum)
            .map(() => {
                return [0, 0, 0];
            })
            .flat()
    );

    const initialSeed = new Float32Array(
        maton
            .range(instanceNum, true)
            .map((i) => {
                return [
                    i,
                    i,
                    // i + Math.floor(Math.random() * 100000),
                    // // Math.floor(Math.random() * 10000),
                    // Math.floor(Math.random() * 100000)
                ];
            })
            .flat()
    );

    const transformFeedbackDoubleBuffer = new TransformFeedbackDoubleBuffer({
        gpu,
        attributes: [
            new Attribute({
                name: 'aPosition',
                data: initialPosition,
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: 'aVelocity',
                data: initialVelocity,
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: 'aSeed',
                data: initialSeed,
                size: 2,
                usageType: AttributeUsageType.StaticDraw,
            }),
        ],
        varyings: [
            {
                name: 'vPosition',
                data: new Float32Array(initialPosition),
            },
            {
                name: 'vVelocity',
                data: new Float32Array(initialVelocity),
            },
        ],
        vertexShader: `#version 300 es

        precision highp float;

        // TODO: ここ動的に構築してもいい
        layout(location = 0) in vec3 aPosition;
        layout(location = 1) in vec3 aVelocity;
        layout(location = 2) in vec2 aSeed;

        out vec3 vPosition;
        // out mat4 vTransform;
        out vec3 vVelocity;


layout (std140) uniform ubCommon {
    float uTime;
};

        // uniform float uTime;
        uniform vec2 uNormalizedInputPosition;
        uniform vec3 uAttractTargetPosition;
        uniform float uAttractRate;

        // https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
        float noise(vec2 seed)
        {
            return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
            vPosition = aPosition + aVelocity;
            vec3 target = uAttractTargetPosition;
            vec2 seed = aSeed;
            float rand = noise(seed);
            target += vec3(
                cos(uTime + rand * 100. + seed.x) * (2. + rand * 1.),
                sin(uTime - rand * 400. + seed.x) * (1. + rand * 1.) + 1.,
                cos(uTime - rand * 300. + seed.x) * (2. + rand * 1.)
            );
            vec3 v = target - vPosition;
            vec3 dir = normalize(v);
            vVelocity = mix(
                aVelocity,
                dir * (.1 + uAttractRate * .1),
                .03 + sin(uTime * .2 + rand * 100.) * .02
            );
        }
        `,
        // fragmentShader: `#version 300 es

        // precision highp float;

        // void main() {
        // }
        // `,
        uniforms: [
            // {
            //     name: UniformNames.Time,
            //     type: UniformTypes.Float,
            //     value: 0,
            // },
            {
                name: 'uNormalizedInputPosition',
                type: UniformTypes.Vector2,
                value: Vector2.zero,
            },
            {
                name: 'uAttractTargetPosition',
                type: UniformTypes.Vector3,
                value: Vector3.zero,
            },
            {
                name: 'uAttractRate',
                type: UniformTypes.Float,
                value: 0,
            },
        ],
        uniformBlockNames: [UniformBlockNames.Common],
        drawCount: instanceNum,
    });

    // TODO: rendererかgpuでまとめたい
    transformFeedbackDoubleBuffer.uniformBlockNames.forEach((blockName) => {
        const targetGlobalUniformBufferObject = renderer.globalUniformBufferObjects.find(
            ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
        );
        if (!targetGlobalUniformBufferObject) {
            return;
        }
        const blockIndex = gpu.bindUniformBlockAndGetBlockIndex(
            targetGlobalUniformBufferObject.uniformBufferObject,
            transformFeedbackDoubleBuffer.shader,
            blockName
        );
        // console.log("hogehoge", blockName, blockIndex)
        // for debug
        // console.log(
        //     material.name,
        //     'addUniformBlock',
        //     material.uniformBlockNames,
        //     targetUniformBufferObject.blockName,
        //     blockIndex
        // );
        transformFeedbackDoubleBuffer.uniforms.addUniformBlock(
            blockIndex,
            targetGlobalUniformBufferObject.uniformBufferObject,
            []
        );
    });

    return transformFeedbackDoubleBuffer;
};

/**
 *
 */
const createGLTFSkinnedMesh = async (instanceNum: number) => {
    const gltfActor = await loadGLTF({ gpu, dir: ASSET_DIR, path: 'butterfly-forward-thin-2.gltf' });

    // skinned mesh のはずなので cast
    const skinningMesh: SkinnedMesh = gltfActor.transform.children[0].transform.children[0] as SkinnedMesh;

    skinningMesh.name = 'butterfly';

    // ルートにanimatorをattachしてるので一旦ここでassign
    // TODO: set animation clips いらない気がする. animatorの設定さえあれば
    skinningMesh.animator = gltfActor.animator;
    skinningMesh.setAnimationClips(gltfActor.animator.animationClips);
    // tmp
    // skinningMesh.subscribeOnStart(() => {
    //     // CPU skinning
    //     // gltfActor.animator.play('Fly', true);
    //     // gltfActor.animator.animationClips[0].speed = 0.2;
    // });

    const instanceInfo: {
        position: number[][];
        scale: number[][];
        rotation: number[][];
        velocity: number[][];
        color: number[][];
    } = {
        position: [],
        scale: [],
        rotation: [],
        velocity: [],
        color: [],
    };
    maton.range(instanceNum).forEach(() => {
        instanceInfo.position.push([0, 0, 0]);

        const baseScale = 0.25;
        const randomScaleRange = 0.25;
        const s = Math.random() * randomScaleRange + baseScale;
        instanceInfo.scale.push([s, s, s]);

        instanceInfo.rotation.push([0, 0, 0]);

        instanceInfo.velocity.push([0, 0, 0]);

        const c = Color.fromRGB(
            Math.floor(Math.random() * 180 + 20),
            Math.floor(Math.random() * 20 + 20),
            Math.floor(Math.random() * 180 + 20)
        );
        instanceInfo.color.push([...c.elements]);
    });
    const animationOffsetInfo = maton
        .range(instanceNum)
        .map(() => {
            return Math.random() * 30;
        })
        .flat();

    skinningMesh.castShadow = true;
    skinningMesh.geometry.instanceCount = instanceNum;

    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstancePosition,
            data: new Float32Array(instanceInfo.position.flat()),
            size: 3,
            divisor: 1,
        })
    );
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceScale,
            data: new Float32Array(instanceInfo.scale.flat()),
            size: 3,
            divisor: 1,
        })
    );
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceRotation,
            data: new Float32Array(instanceInfo.rotation.flat()),
            size: 3,
            divisor: 1,
        })
    );
    // aInstanceAnimationOffsetは予約語
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceAnimationOffset,
            data: new Float32Array(animationOffsetInfo),
            size: 1,
            divisor: 1,
        })
    );
    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceVertexColor,
            data: new Float32Array(instanceInfo.color.flat()),
            size: 4,
            divisor: 1,
        })
    );

    skinningMesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceVelocity,
            data: new Float32Array(instanceInfo.velocity.flat()),
            size: 3,
            divisor: 1,
        })
    );

    skinningMesh.material = new GBufferMaterial({
        metallic: 0,
        roughness: 1,
        receiveShadow: true,
        isSkinning: true,
        gpuSkinning: true,
        isInstancing: true,
        useInstanceLookDirection: true,
        useVertexColor: true,
        faceSide: FaceSide.Double,
    });

    const transformFeedbackDoubleBuffer = createInstanceUpdater(MAX_INSTANCE_NUM);

    let attractRate = 0;
    skinningMesh.onUpdate = ({ deltaTime }) => {
        transformFeedbackDoubleBuffer.uniforms.setValue(
            'uNormalizedInputPosition',
            inputController.normalizedInputPosition
        );
        transformFeedbackDoubleBuffer.uniforms.setValue(
            'uAttractTargetPosition',
            Vector3.addVectors(attractSphereMesh.transform.position, new Vector3(0, 1, 0))
        );

        attractRate += (inputController.isDown ? 1 : -1) * deltaTime * 2;
        attractRate = saturate(attractRate);
        transformFeedbackDoubleBuffer.uniforms.setValue('uAttractRate', attractRate);
        gpu.updateTransformFeedback({
            shader: transformFeedbackDoubleBuffer.shader,
            uniforms: transformFeedbackDoubleBuffer.uniforms,
            vertexArrayObject: transformFeedbackDoubleBuffer.write.vertexArrayObject,
            transformFeedback: transformFeedbackDoubleBuffer.write.transformFeedback,
            drawCount: transformFeedbackDoubleBuffer.drawCount,
        });
        transformFeedbackDoubleBuffer.swap();

        skinnedMesh.geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstancePosition,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aPosition')
        );
        skinnedMesh.geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstanceVelocity,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aVelocity')
        );

        skinnedMesh.geometry.instanceCount = debuggerStates.instanceNum;
    };

    return skinningMesh;
};

const playSound = () => {
    if (glslSound) {
        glslSound.stop();
    }
    glslSound = new GLSLSound(gpu, soundVertexShader, 180);
    glslSound.play(0);
};

const main = async () => {
    const particleImg = await loadImg(smokeImgUrl);
    const particleMap = new Texture({
        gpu,
        img: particleImg,
    });

    cubeMap = await loadCubeMap(
        gpu,
        CubeMapPositiveXImgUrl,
        CubeMapNegativeXImgUrl,
        CubeMapPositiveYImgUrl,
        CubeMapNegativeYImgUrl,
        CubeMapPositiveZImgUrl,
        CubeMapNegativeZImgUrl
    );

    const skyboxMesh = new Skybox({
        gpu,
        cubeMap,
        diffuseIntensity: 0.2,
        specularIntensity: 0.2,
        renderMesh: false,
    });
    
    // debug plane
    
    const debugPlaneActor = new Mesh({
        geometry: new PlaneGeometry({gpu}),
        material: new UnlitMaterial({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            diffuseMap: renderer.sharedTextures.get(SharedTexturesTypes.RANDOM_NOISE)?.texture
        })
    });
    debugPlaneActor.transform.position = new Vector3(0, 4, 0);
    debugPlaneActor.transform.scale = new Vector3(2, 2, 2);
    captureScene.add(debugPlaneActor);

    //
    // street floor
    //

    streetFloorActor = await createStreetFloorActor();
    captureScene.add(streetFloorActor);
    streetFloorActor.transform.children.forEach((child) => {
        if (child.type === ActorTypes.Mesh) {
            (child as Mesh).castShadow = true;
        }
    });
    (streetFloorActor?.transform.children[0] as Mesh).materials[0].uniforms.setValue('uMetallic', 0.5);
    (streetFloorActor?.transform.children[0] as Mesh).materials[0].uniforms.setValue('uRoughness', 1);

    //
    // street light
    //

    streetLightActorLeft = await createStreetLightActor();
    streetLightActorLeft.subscribeOnStart(() => {
        streetLightActorLeft.transform.position = new Vector3(6, 0, 0);
        streetLightActorLeft.transform.scale = Vector3.fill(1.8);
    });
    captureScene.add(streetLightActorLeft);

    streetLightActorRight = await createStreetLightActor();
    streetLightActorRight.subscribeOnStart(() => {
        streetLightActorRight.transform.rotation = new Rotator(0, 180, 0);
        streetLightActorRight.transform.position = new Vector3(-6, 0, 0);
        streetLightActorRight.transform.scale = Vector3.fill(1.8);
    });
    captureScene.add(streetLightActorRight);

    //
    // box
    //
    
    boxMeshActor01 = new Mesh({
        geometry: new BoxGeometry({gpu}),
        material: new GBufferMaterial({
            diffuseColor: new Color(1, 0, 0, 1),
            metallic: 0,
            roughness: 1,
        }),
    });
    boxMeshActor01.transform.position = new Vector3(0, .5, -2);
    
    boxMeshActor02 = new Mesh({
        geometry: new BoxGeometry({gpu}),
        material: new GBufferMaterial({
            diffuseColor: new Color(0, 1, 0, 1),
            metallic: 1,
            roughness: 0,
        }),
    });
    boxMeshActor02.transform.position = new Vector3(-2, .5, 0);

    boxMeshActor03 = new Mesh({
        geometry: new BoxGeometry({gpu}),
        material: new GBufferMaterial({
            diffuseColor: new Color(0, 0, 1, 1),
            metallic: 0,
            roughness: 1,
        }),
    });
    boxMeshActor03.transform.position = new Vector3(2, .5, 0);

    
    //
    // attract mesh
    //

    attractSphereMesh = await createGLTFSphereMesh(
        new UnlitMaterial({
            emissiveColor: new Color(3, 3, 3, 1),
        })
    );
    attractSphereMesh.subscribeOnStart(({ actor }) => {
        actor.transform.setScaling(Vector3.fill(0.5));
    });
    attractSphereMesh.onFixedUpdate = () => {
        const ray = captureSceneCamera.viewpointToRay(
            new Vector2(inputController.normalizedInputPosition.x, 1 - inputController.normalizedInputPosition.y)
        );
        const plane = new Plane(Vector3.zero, Vector3.up);
        const intersectOnPlane = intersectRayWithPlane(ray, plane);
        if (intersectOnPlane) {
            const x = clamp(intersectOnPlane.x, -5, 5);
            const z = clamp(intersectOnPlane.z, -5, 5);
            const p = new Vector3(x, 1, z);
            attractSphereMesh.transform.setTranslation(p);
        }
    };

    //
    // instancing mesh
    //

    skinnedMesh = await createGLTFSkinnedMesh(MAX_INSTANCE_NUM);

    //
    // particle mesh
    //

    const particleNum = 48;
    const particleGeometry = new Geometry({
        gpu,
        attributes: [
            new Attribute({
                name: AttributeNames.Position.toString(),
                // dummy data
                data: new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            const x = Math.random() * 6 - 4;
                            const y = Math.random() * 0.5;
                            const z = Math.random() * 5.4 - 1.4;
                            return [x, y, z, x, y, z, x, y, z, x, y, z];
                        })
                        .flat()
                ),
                size: 3,
            }),
            new Attribute({
                name: AttributeNames.Uv.toString(),
                data: new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => [0, 1, 0, 0, 1, 1, 1, 0])
                        .flat()
                ),
                size: 2,
            }),
            new Attribute({
                name: AttributeNames.Color.toString(),
                data: new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            const v = Math.random() * 150 + 50;
                            const a = Math.random() * 75 + 25;
                            const c = Color.fromRGB(v, v, v, a);
                            return [...c.elements, ...c.elements, ...c.elements, ...c.elements];
                        })
                        .flat()
                ),
                size: 4,
            }),
            new Attribute({
                name: 'aBillboardSize',
                data: new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            const s = Math.random() * 6.25 + 1.75;
                            return [s, s, s, s];
                        })
                        .flat()
                ),
                size: 1,
            }),
            new Attribute({
                name: 'aBillboardRateOffset',
                data: new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            const r = Math.random();
                            return [r, r, r, r];
                        })
                        .flat()
                ),
                size: 1,
            }),
        ],
        indices: maton
            .range(particleNum)
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

#pragma DEFINES

#pragma ATTRIBUTES

out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;

out vec4 vVertexColor;
out vec4 vViewPosition;
out vec4 vClipPosition;

out float vParticleId;

#pragma ENGINE_UNIFORMS
#pragma TRANSFORM_VERTEX_UNIFORMS

uniform vec2[4] uBillboardPositionConverters;

void main() {
    int particleId = int(mod(float(gl_VertexID), 4.));
    float fParticleId = float(particleId);
    vParticleId = fParticleId;

    float t = 3.;
    float rateOffset = mod(fParticleId, 4.) * .1;
    float r = mod((((uTime + rateOffset) / t) + aBillboardRateOffset), 1.);

    vec4 localPosition = vec4(aPosition, 1.);

    localPosition.x += mix(0., 4., r) * mix(.4, .8, aBillboardRateOffset);
    localPosition.z += mix(0., 2., r) * mix(-.4, -.8, aBillboardRateOffset);

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

#pragma DEFINES

precision highp float;

in float vParticleId;
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

#pragma ENGINE_UNIFORMS
#pragma DEPTH_FUNCTIONS

void main() {
    vec4 texColor = texture(uParticleMap, vUv);
    vec3 baseColor = vVertexColor.xyz;
    float alpha = texColor.x * vVertexColor.a;
    
    vec4 fadeColor = texture(
        uParticleMap,
        vUv + vec2(mod(uTime * .06 + float(vParticleId) * .1, 1.), 0.)
    );
    alpha *= fadeColor.x * 2.;
    
    // calc soft fade
    
    float rawDepth = texelFetch(uDepthTexture, ivec2(gl_FragCoord.xy), 0).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    // for debug
    // outColor = vec4(vec3(sceneDepth), 1.);

    float currentDepth = viewZToLinearDepth(vViewPosition.z, uNearClip, uFarClip);
    // for debug
    // outColor = vec4(vec3(currentDepth), 1.);
    
    float diffDepth = abs(sceneDepth) - abs(currentDepth);
    float softFade = smoothstep(0., .02, diffDepth);
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
        uniforms: [
            {
                name: 'uParticleMap',
                type: UniformTypes.Texture,
                value: particleMap,
            },
            {
                name: 'uBillboardPositionConverters',
                type: UniformTypes.Vector2Array,
                value: [new Vector2(-1, 1), new Vector2(-1, -1), new Vector2(1, 1), new Vector2(1, -1)],
            },
            {
                name: UniformNames.DepthTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: UniformNames.CameraNear,
                type: UniformTypes.Float,
                value: captureSceneCamera.near,
            },
            {
                name: UniformNames.CameraFar,
                type: UniformTypes.Float,
                value: captureSceneCamera.far,
            },
        ],
        blendType: BlendTypes.Transparent,
        depthWrite: false,
        uniformBlockNames: [UniformBlockNames.Common],
    });
    const particleMesh = new Mesh({
        geometry: particleGeometry,
        material: particleMaterial,
    });

    captureScene.add(boxMeshActor01);
    captureScene.add(boxMeshActor02);
    captureScene.add(boxMeshActor03);
    captureScene.add(attractSphereMesh);
    captureScene.add(skinnedMesh);
    captureScene.add(skyboxMesh);
    captureScene.add(particleMesh);

    // TODO: engine側に移譲したい
    const onWindowResize = () => {
        width = wrapperElement.offsetWidth;
        height = wrapperElement.offsetHeight;
        inputController.setSize(width, height);
        engine.setSize(width, height);
    };

    engine.onBeforeStart = () => {
        onWindowResize();
        window.addEventListener('resize', onWindowResize);

        renderer.fogPass.fogColor = Color.black;
        renderer.fogPass.fogDensity = 0.023;
        renderer.fogPass.fogDensityAttenuation = 0.065;
        renderer.fogPass.distanceFogStart = 18;
        renderer.fogPass.distanceFogPower = 0.29;

        renderer.depthOfFieldPass.focusDistance = 17.78;
        renderer.depthOfFieldPass.focusRange = 9.8;
        renderer.depthOfFieldPass.bokehRadius = 5.55;

        renderer.bloomPass.bloomAmount = 0.26;
        renderer.bloomPass.threshold = 1.534;
        renderer.bloomPass.tone = 0.46;

        orbitCameraController.start();
    };

    engine.onBeforeUpdate = () => {
        if (!debuggerGUI) initDebugger();
        inputController.update();
    };

    engine.onRender = (time) => {
        renderer.render(captureScene, captureSceneCamera, { time });
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
        maxValue: MAX_INSTANCE_NUM,
        initialValue: INITIAL_INSTANCE_NUM,
        stepValue: 1,
        onChange: (value) => {
            debuggerStates.instanceNum = value;
        },
    });

    //
    // sound
    //

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addButtonDebugger({
        buttonLabel: 'play sound',
        onClick: () => {
            playSound();
        },
    });

    //
    // orbit controls
    //

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: 'orbit controls enabled',
        initialValue: orbitCameraController.enabled,
        onChange: (value) => (orbitCameraController.enabled = value),
    });

    //
    // show buffers
    //

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: 'show buffers',
        initialValue: bufferVisualizerPass.enabled,
        onChange: (value) => {
            bufferVisualizerPass.enabled = value;
            if (value) {
                bufferVisualizerPass.showDom();
            } else {
                bufferVisualizerPass.hideDom();
            }
        },
    });

    //
    // directional light
    //

    debuggerGUI.addBorderSpacer();

    const directionalLightDebuggerGroup = debuggerGUI.addGroup('directional light', false);

    directionalLightDebuggerGroup.addSliderDebugger({
        label: 'intensity',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: directionalLight.intensity,
        onChange: (value) => {
            directionalLight.intensity = value;
        },
    });

    directionalLightDebuggerGroup.addSliderDebugger({
        label: 'pos x',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: directionalLight.transform.position.x,
        onChange: (value) => {
            directionalLight.transform.position.x = value;
        },
    });

    directionalLightDebuggerGroup.addSliderDebugger({
        label: 'pos y',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: directionalLight.transform.position.y,
        onChange: (value) => {
            directionalLight.transform.position.y = value;
        },
    });

    directionalLightDebuggerGroup.addSliderDebugger({
        label: 'pos z',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: directionalLight.transform.position.z,
        onChange: (value) => {
            directionalLight.transform.position.z = value;
        },
    });

    //
    // spot light
    //

    createSpotLightDebugger(spotLight1, 'spot light 1');
    createSpotLightDebugger(spotLight2, 'spot light 2');
    
    //
    // point light
    // 
    
    createPointLightDebugger(pointLight1, 'point light 1');
    
    //
    // sss
    //

    debuggerGUI.addBorderSpacer();

    const sssDebuggerGroup = debuggerGUI.addGroup('sss', false);
    
    sssDebuggerGroup.addSliderDebugger({
        label: 'sss bias',
        minValue: 0,
        maxValue: 0.01,
        stepValue: 0.0001,
        initialValue: renderer.screenSpaceShadowPass.bias,
        onChange: (value) => {
            renderer.screenSpaceShadowPass.bias = value;
        },
    });
    
    sssDebuggerGroup.addSliderDebugger({
        label: 'sss jitter size x',
        minValue: 0,
        maxValue: 0.5,
        stepValue: 0.001,
        initialValue: renderer.screenSpaceShadowPass.jitterSize.x,
        onChange: (value) => {
            renderer.screenSpaceShadowPass.jitterSize.x = value;
        },
    });
    
    sssDebuggerGroup.addSliderDebugger({
        label: 'sss jitter size y',
        minValue: 0,
        maxValue: 0.5,
        stepValue: 0.001,
        initialValue: renderer.screenSpaceShadowPass.jitterSize.y,
        onChange: (value) => {
            renderer.screenSpaceShadowPass.jitterSize.y = value;
        },
    });
    
    sssDebuggerGroup.addSliderDebugger({
        label: 'sss jitter size z',
        minValue: 0,
        maxValue: 0.5,
        stepValue: 0.001,
        initialValue: renderer.screenSpaceShadowPass.jitterSize.z,
        onChange: (value) => {
            renderer.screenSpaceShadowPass.jitterSize.z = value;
        },
    });
    
    sssDebuggerGroup.addSliderDebugger({
        label: 'sss sharpness',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: renderer.screenSpaceShadowPass.sharpness,
        onChange: (value) => {
            renderer.screenSpaceShadowPass.sharpness = value;
        },
    });
    
    
    sssDebuggerGroup.addSliderDebugger({
        label: 'sss strength',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: renderer.screenSpaceShadowPass.strength,
        onChange: (value) => {
            renderer.screenSpaceShadowPass.strength = value;
        },
    });

    //
    // ssao
    //

    debuggerGUI.addBorderSpacer();

    const ssaoDebuggerGroup = debuggerGUI.addGroup('ssao', false);

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao occlusion sample length',
        minValue: 0.01,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionSampleLength,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionSampleLength = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao occlusion bias',
        minValue: 0.0001,
        maxValue: 0.01,
        stepValue: 0.0001,
        initialValue: renderer.ambientOcclusionPass.occlusionBias,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionBias = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao min distance',
        minValue: 0,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionMinDistance,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionMinDistance = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao max distance',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionMaxDistance,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionMaxDistance = value;
        },
    });

    ssaoDebuggerGroup.addColorDebugger({
        label: 'ssao color',
        initialValue: renderer.ambientOcclusionPass.occlusionColor.getHexCoord(),
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionColor = Color.fromHex(value);
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao occlusion power',
        minValue: 0.5,
        maxValue: 4,
        stepValue: 0.01,
        initialValue: renderer.ambientOcclusionPass.occlusionPower,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionPower = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao occlusion strength',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionStrength,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionStrength = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.blendRate,
        onChange: (value) => {
            renderer.ambientOcclusionPass.blendRate = value;
        },
    });

    //
    // light shaft
    //

    debuggerGUI.addBorderSpacer();

    const lightShaftDebuggerGroup = debuggerGUI.addGroup('light shaft', false);

    lightShaftDebuggerGroup.addSliderDebugger({
        label: 'blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.lightShaftPass.blendRate,
        onChange: (value) => {
            renderer.lightShaftPass.blendRate = value;
        },
    });

    lightShaftDebuggerGroup.addSliderDebugger({
        label: 'pass scale',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.lightShaftPass.passScaleBase,
        onChange: (value) => {
            renderer.lightShaftPass.passScaleBase = value;
        },
    });

    lightShaftDebuggerGroup.addSliderDebugger({
        label: 'ray step strength',
        minValue: 0.001,
        maxValue: 0.05,
        stepValue: 0.001,
        initialValue: renderer.lightShaftPass.rayStepStrength,
        onChange: (value) => {
            renderer.lightShaftPass.rayStepStrength = value;
        },
    });

    //
    // light volume pass
    //

    debuggerGUI.addBorderSpacer();

    const volumetricLightDebuggerGroup = debuggerGUI.addGroup('volumetric light', false);

    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'ray step',
        initialValue: renderer.volumetricLightPass.rayStep,
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.rayStep = value;
        },
    });
    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'density multiplier',
        initialValue: renderer.volumetricLightPass.densityMultiplier,
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.densityMultiplier = value;
        },
    });
    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'jitter size x',
        initialValue: renderer.volumetricLightPass.rayJitterSizeX,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.rayJitterSizeX = value;
        },
    });
    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'jitter size y',
        initialValue: renderer.volumetricLightPass.rayJitterSizeY,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.rayJitterSizeY = value;
        },
    });
    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'blend rate',
        initialValue: renderer.volumetricLightPass.blendRate,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.blendRate = value;
        },
    });

    //
    // fog
    //

    debuggerGUI.addBorderSpacer();

    const fogDebuggerGroup = debuggerGUI.addGroup('fog', false);

    fogDebuggerGroup.addColorDebugger({
        label: 'fog color',
        initialValue: renderer.fogPass.fogColor.getHexCoord(),
        onChange: (value) => {
            renderer.fogPass.fogColor = Color.fromHex(value);
        },
    });

    fogDebuggerGroup.addSliderDebugger({
        label: 'density',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.fogDensity,
        onChange: (value) => {
            renderer.fogPass.fogDensity = value;
        },
    });

    fogDebuggerGroup.addSliderDebugger({
        label: 'attenuation',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.fogDensityAttenuation,
        onChange: (value) => {
            renderer.fogPass.fogDensityAttenuation = value;
        },
    });

    fogDebuggerGroup.addSliderDebugger({
        label: 'distance fog start',
        minValue: 0,
        maxValue: captureSceneCamera.far,
        stepValue: 0.01,
        initialValue: renderer.fogPass.distanceFogStart,
        onChange: (value) => {
            renderer.fogPass.distanceFogStart = value;
        },
    });

    fogDebuggerGroup.addSliderDebugger({
        label: 'distance fog power',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.fogPass.distanceFogPower,
        onChange: (value) => {
            renderer.fogPass.distanceFogPower = value;
        },
    });

    //
    // depth of field
    //

    debuggerGUI.addBorderSpacer();

    const dofDebuggerGroup = debuggerGUI.addGroup('depth of field', false);

    dofDebuggerGroup.addSliderDebugger({
        label: 'DoF focus distance',
        minValue: 0.1,
        maxValue: 100,
        stepValue: 0.001,
        initialValue: renderer.depthOfFieldPass.focusDistance,
        onChange: (value) => {
            renderer.depthOfFieldPass.focusDistance = value;
        },
    });

    dofDebuggerGroup.addSliderDebugger({
        label: 'DoF focus range',
        minValue: 0.1,
        maxValue: 30,
        stepValue: 0.001,
        initialValue: renderer.depthOfFieldPass.focusRange,
        onChange: (value) => {
            renderer.depthOfFieldPass.focusRange = value;
        },
    });

    dofDebuggerGroup.addSliderDebugger({
        label: 'DoF bokeh radius',
        minValue: 0.01,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.depthOfFieldPass.bokehRadius,
        onChange: (value) => {
            renderer.depthOfFieldPass.bokehRadius = value;
        },
    });

    //
    // bloom
    //

    debuggerGUI.addBorderSpacer();

    const bloomDebuggerGroup = debuggerGUI.addGroup('bloom', false);

    bloomDebuggerGroup.addSliderDebugger({
        label: 'bloom amount',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: renderer.bloomPass.bloomAmount,
        onChange: (value) => {
            renderer.bloomPass.bloomAmount = value;
        },
    });

    bloomDebuggerGroup.addSliderDebugger({
        label: 'bloom threshold',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.001,
        initialValue: renderer.bloomPass.threshold,
        onChange: (value) => {
            renderer.bloomPass.threshold = value;
        },
    });

    bloomDebuggerGroup.addSliderDebugger({
        label: 'bloom tone',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.bloomPass.tone,
        onChange: (value) => {
            renderer.bloomPass.tone = value;
        },
    });

    //
    // streak debuggers
    //

    debuggerGUI.addBorderSpacer();

    const streakDebuggerGroup = debuggerGUI.addGroup('streak', false);

    streakDebuggerGroup.addSliderDebugger({
        label: 'threshold',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: renderer.streakPass.threshold,
        onChange: (value) => {
            renderer.streakPass.threshold = value;
        },
    });
    streakDebuggerGroup.addSliderDebugger({
        label: 'vertical scale',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.streakPass.verticalScale,
        onChange: (value) => {
            renderer.streakPass.verticalScale = value;
        },
    });
    streakDebuggerGroup.addSliderDebugger({
        label: 'horizontal scale',
        minValue: 0,
        maxValue: 2,
        stepValue: 0.001,
        initialValue: renderer.streakPass.horizontalScale,
        onChange: (value) => {
            renderer.streakPass.horizontalScale = value;
        },
    });

    streakDebuggerGroup.addSliderDebugger({
        label: 'stretch',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.streakPass.stretch,
        onChange: (value) => {
            renderer.streakPass.stretch = value;
        },
    });
    streakDebuggerGroup.addColorDebugger({
        label: 'color',
        initialValue: renderer.streakPass.color.getHexCoord(),
        onChange: (value) => {
            renderer.streakPass.color = Color.fromHex(value);
        },
    });
    streakDebuggerGroup.addSliderDebugger({
        label: 'intensity',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.streakPass.intensity,
        onChange: (value) => {
            renderer.streakPass.intensity = value;
        },
    });

    //
    // ssr debuggers
    //

    debuggerGUI.addBorderSpacer();

    const ssrDebuggerGroup = debuggerGUI.addGroup('ssr', false);

    ssrDebuggerGroup.addSliderDebugger({
        label: 'depth bias',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.rayDepthBias,
        onChange: (value) => {
            renderer.ssrPass.rayDepthBias = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'ray nearest distance',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.rayNearestDistance,
        onChange: (value) => {
            renderer.ssrPass.rayNearestDistance = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'ray max distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.rayMaxDistance,
        onChange: (value) => {
            renderer.ssrPass.rayMaxDistance = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'ray thickness',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionRayThickness,
        onChange: (value) => {
            renderer.ssrPass.reflectionRayThickness = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'jitter size x',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionRayJitterSizeX,
        onChange: (value) => {
            renderer.ssrPass.reflectionRayJitterSizeX = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'jitter size y',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionRayJitterSizeY,
        onChange: (value) => {
            renderer.ssrPass.reflectionRayJitterSizeY = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'roughness power',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.01,
        initialValue: renderer.ssrPass.reflectionRoughnessPower,
        onChange: (value) => {
            renderer.ssrPass.reflectionRoughnessPower = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'fade min distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionFadeMinDistance,
        onChange: (value) => {
            renderer.ssrPass.reflectionFadeMinDistance = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'fade max distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionFadeMaxDistance,
        onChange: (value) => {
            renderer.ssrPass.reflectionFadeMaxDistance = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'edge fade factor min x',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMinX,
        onChange: (value) => {
            renderer.ssrPass.reflectionScreenEdgeFadeFactorMinX = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'edge fade factor max x',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxX,
        onChange: (value) => {
            renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxX = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'edge fade factor min y',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMinY,
        onChange: (value) => {
            renderer.ssrPass.reflectionScreenEdgeFadeFactorMinY = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'edge fade factor max y',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxY,
        onChange: (value) => {
            renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxY = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'additional rate',
        minValue: 0.01,
        maxValue: 1,
        stepValue: 0.01,
        initialValue: renderer.ssrPass.reflectionAdditionalRate,
        onChange: (value) => {
            renderer.ssrPass.reflectionAdditionalRate = value;
        },
    });

    //
    // chromatic aberration
    //

    debuggerGUI.addBorderSpacer();

    const chromaticAberrationDebuggerGroup = debuggerGUI.addGroup('chromatic aberration', false);
    chromaticAberrationDebuggerGroup.addSliderDebugger({
        label: 'scale',
        minValue: 0,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.chromaticAberrationPass.chromaticAberrationScale,
        onChange: (value) => (renderer.chromaticAberrationPass.chromaticAberrationScale = value),
    });

    //
    // vignette
    //

    debuggerGUI.addBorderSpacer();

    const vignetteDebuggerGroup = debuggerGUI.addGroup('vignette', false);
    vignetteDebuggerGroup.addSliderDebugger({
        label: 'radius',
        minValue: 0,
        maxValue: 3,
        stepValue: 0.001,
        initialValue: renderer.vignettePass.vignetteRadius,
        onChange: (value) => (renderer.vignettePass.vignetteRadius = value),
    });
    vignetteDebuggerGroup.addSliderDebugger({
        label: 'power',
        minValue: 0.01,
        maxValue: 8,
        stepValue: 0.001,
        initialValue: renderer.vignettePass.vignettePower,
        onChange: (value) => (renderer.vignettePass.vignettePower = value),
    });
    vignetteDebuggerGroup.addSliderDebugger({
        label: 'blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.vignettePass.blendRate,
        onChange: (value) => (renderer.vignettePass.blendRate = value),
    });

    //
    // fxaa
    //

    debuggerGUI.addBorderSpacer();

    const fxaaDebuggerGroup = debuggerGUI.addGroup('fxaa', false);

    fxaaDebuggerGroup.addToggleDebugger({
        label: 'fxaa pass enabled',
        initialValue: renderer.fxaaPass.enabled,
        onChange: (value) => (renderer.fxaaPass.enabled = value),
    });

    //
    // add debugger ui
    //

    wrapperElement.appendChild(debuggerGUI.domElement);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
