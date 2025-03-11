// actors
import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { getMeshMaterial, setMeshMaterial } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { createPerspectiveCamera, PerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera.ts';
import { setPerspectiveSize } from '@/PaleGL/actors/cameras/perspectiveCameraBehaviour.ts';
import { setAnimationClips, SkinnedMesh } from '@/PaleGL/actors/meshes/skinnedMesh.ts';

// core
import { createEngine } from '@/PaleGL/core/engine.ts';
import { createRenderer, renderRenderer } from '@/PaleGL/core/renderer.ts';
import { bindGPUUniformBlockAndGetBlockIndex, createGPU, updateGPUTransformFeedback } from '@/PaleGL/core/gpu.ts';
import { createRenderTarget } from '@/PaleGL/core/renderTarget.ts';
// import {GBufferRenderTargets} from '@/PaleGL/core/GBufferRenderTargets';
import { createTexture, Texture } from '@/PaleGL/core/texture.ts';
import {
    createOrbitCameraController,
    fixedUpdateOrbitCameraController,
    setOrbitCameraControllerDelta,
    startOrbitCameraController,
} from '@/PaleGL/core/orbitCameraController.ts';

// geometries
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';

// loaders
import { loadCubeMap } from '@/PaleGL/loaders/loadCubeMap';
import { loadGLTF } from '@/PaleGL/loaders/loadGLTF';
import { loadImg } from '@/PaleGL/loaders/loadImg';

// materials
import { createMaterial, Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
// import { PhongMaterial } from '@/PaleGL/materials/PhongMaterial';

// math
import {
    createColor,
    createColorFromHex,
    createColorFromRGB,
    createColorWhite,
    getColorHexCoord,
} from '@/PaleGL/math/color.ts';
import {createVector2, createVector2Zero, v2o, v2x, v2y} from '@/PaleGL/math/vector2.ts';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Vector4 } from '@/PaleGL/math/Vector4';

// postprocess
import {
    createBufferVisualizerPass,
    hideBufferVisualizerPassDom,
    showBufferVisualizerPassDom,
} from '@/PaleGL/postprocess/bufferVisualizerPass.ts';

// inputs
import { createTouchInputController } from '@/PaleGL/inputs/touchInputController.ts';
import { createMouseInputController } from '@/PaleGL/inputs/mouseInputController.ts';

// shaders
import litObjectSpaceRaymarchFragContent from './shaders/object-space-raymarch-test-scene.glsl';
// import gBufferObjectSpaceRaymarchDepthFrag from './shaders/gbuffer-object-space-raymarch-depth-fragment-test-scene.glsl';
import litScreenSpaceRaymarchFragContent from './shaders/screen-space-raymarch-test-scene.glsl';
// import gBufferScreenSpaceRaymarchDepthFrag from './shaders/gbuffer-screen-space-raymarch-depth-fragment-test-scene.glsl';

// others
import {
    UniformTypes,
    TextureWrapTypes,
    TextureFilterTypes,
    BlendTypes,
    RenderTargetTypes,
    AttributeNames,
    AttributeUsageType,
    UniformNames,
    FaceSide,
    TextureDepthPrecisionType,
    UniformBlockNames,
    RAD_TO_DEG,
} from '@/PaleGL/constants';

import {
    addDebuggerBorderSpacer,
    addButtonDebugger,
    addSliderDebugger,
    addToggleDebugger,
    createDebuggerGUI,
    DebuggerGUI,
    addDebugGroup,
    addColorDebugger,
} from '@/PaleGL/utilities/debuggerGUI.ts';
import { OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { CubeMap } from '@/PaleGL/core/cubeMap.ts';
import { createGBufferMaterial } from '@/PaleGL/materials/gBufferMaterial.ts';
import { PostProcess } from '@/PaleGL/postprocess/postProcess.ts';
// import { TransformFeedbackBuffer } from '@/PaleGL/core/transformFeedbackBuffer.ts';
import { TransformFeedbackDoubleBuffer } from '@/PaleGL/core/transformFeedbackDoubleBuffer.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { saturate } from '@/PaleGL/utilities/mathUtilities.ts';
import { createUnlitMaterial } from '@/PaleGL/materials/unlitMaterial.ts';

import soundVertexShader from './shaders/sound-vertex.glsl';
import { createGLSLSound, GlslSound } from '@/PaleGL/core/glslSound.ts';
import { createTextMesh, FontAtlasData, TextAlignType } from '@/PaleGL/actors/meshes/textMesh.ts';
import { createSpotLight, SpotLight } from '@/PaleGL/actors/lights/spotLight.ts';
import { loadJson } from '@/PaleGL/loaders/loadJson.ts';
import { addActorToScene, createScene } from '@/PaleGL/core/scene.ts';
import { subscribeActorOnStart } from '@/PaleGL/actors/actor.ts';
import { createDirectionalLight } from '@/PaleGL/actors/lights/directionalLight.ts';
import { createSkybox } from '@/PaleGL/actors/meshes/skybox.ts';
import { createObjectSpaceRaymarchMesh } from '@/PaleGL/actors/meshes/objectSpaceRaymarchMesh.ts';
import { createScreenSpaceRaymarchMesh } from '@/PaleGL/actors/meshes/screenSpaceRaymarchMesh.ts';
import { setOrthoSize } from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import { setLookAtPosition, setRotationX, setScaling, setTranslation } from '@/PaleGL/core/transform.ts';
import { setCameraClearColor, setCameraPostProcess } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { getGeometryAttributeDescriptors, setGeometryAttribute } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { addUniformBlock, setUniformValue } from '@/PaleGL/core/uniforms.ts';
import {
    findVertexArrayObjectVertexBufferObjectBuffer,
    replaceVertexArrayObjectBuffer,
} from '@/PaleGL/core/vertexArrayObject.ts';
import { DepthOfFieldPassParameters } from '@/PaleGL/postprocess/depthOfFieldPass.ts';
import { LightShaftPassParameters } from '@/PaleGL/postprocess/lightShaftPass.ts';
import { VolumetricLightPassParameters } from '@/PaleGL/postprocess/volumetricLightPass.ts';
import { FogPassParameters } from '@/PaleGL/postprocess/fogPass.ts';
import { BloomPassParameters } from '@/PaleGL/postprocess/bloomPass.ts';
import { SSRPassParameters } from '@/PaleGL/postprocess/ssrPass.ts';
// import { BoxGeometry } from '@/PaleGL/geometries/BoxGeometry.ts';
// import { ObjectSpaceRaymarchMaterial } from '@/PaleGL/materials/objectSpaceRaymarchMaterial.ts';

// console.log('----- vert -----');
// console.log(testVert);
// console.log('----- frag -----');
// console.log(testFrag);
// console.log('----- phong vert -----');
// console.log(phongVert);
// console.log('----------------');

const smokeImgUrl = './assets/images/particle-smoke.png';
const leaveDiffuseImgUrl = './assets/images/brown_mud_leaves_01_diff_1k.jpg';
const leaveNormalImgUrl = './assets/images/brown_mud_leaves_01_nor_gl_1k.jpg';
const CubeMapPositiveXImgUrl = './assets/images/px.jpg';
const CubeMapNegativeXImgUrl = './assets/images/nx.jpg';
const CubeMapPositiveYImgUrl = './assets/images/py.jpg';
const CubeMapNegativeYImgUrl = './assets/images/ny.jpg';
const CubeMapPositiveZImgUrl = './assets/images/pz.jpg';
const CubeMapNegativeZImgUrl = './assets/images/nz.jpg';
const gltfSphereModelUrl = './assets/models/sphere-32x32.gltf';
const fontAtlasImgUrl = './assets/fonts/NotoSans-Bold/atlas.png';
const fontAtlasJsonUrl = './assets/fonts/NotoSans-Bold/NotoSans-Bold.json';
const gltfButterflyModelUrl = './assets/models/butterfly-forward-thin.gltf';

const createSpotLightDebugger = (debuggerGUI: DebuggerGUI, spotLight: SpotLight, label: string) => {
    addDebuggerBorderSpacer(debuggerGUI);

    const spotLightDebuggerGroup = addDebugGroup(debuggerGUI, label, false);

    addToggleDebugger(spotLightDebuggerGroup, {
        label: 'light enabled',
        initialValue: spotLight.enabled,
        onChange: (value) => (spotLight.enabled = value),
    });

    addColorDebugger(spotLightDebuggerGroup, {
        label: 'color',
        initialValue: getColorHexCoord(spotLight.color),
        onChange: (value) => {
            spotLight.color = createColorFromHex(value);
        },
    });

    addSliderDebugger(spotLightDebuggerGroup, {
        label: 'intensity',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: spotLight.intensity,
        onChange: (value) => {
            spotLight.intensity = value;
        },
    });

    addSliderDebugger(spotLightDebuggerGroup, {
        label: 'distance',
        minValue: 0,
        maxValue: 100,
        stepValue: 0.01,
        initialValue: spotLight.distance,
        onChange: (value) => {
            spotLight.distance = value;
        },
    });

    addSliderDebugger(spotLightDebuggerGroup, {
        label: 'attenuation',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: spotLight.attenuation,
        onChange: (value) => {
            spotLight.attenuation = value;
        },
    });

    addSliderDebugger(spotLightDebuggerGroup, {
        label: 'coneAngle',
        minValue: 0,
        maxValue: 180,
        stepValue: 0.001,
        initialValue: spotLight.coneAngle,
        onChange: (value) => {
            spotLight.coneAngle = value;
        },
    });

    addSliderDebugger(spotLightDebuggerGroup, {
        label: 'penumbraAngle',
        minValue: 0,
        maxValue: 180,
        stepValue: 0.001,
        initialValue: spotLight.penumbraAngle,
        onChange: (value) => {
            spotLight.penumbraAngle = value;
        },
    });

    addSliderDebugger(spotLightDebuggerGroup, {
        label: 'pos x',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: spotLight.transform.position.x,
        onChange: (value) => {
            spotLight.transform.position.x = value;
        },
    });

    addSliderDebugger(spotLightDebuggerGroup, {
        label: 'pos y',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: spotLight.transform.position.y,
        onChange: (value) => {
            spotLight.transform.position.y = value;
        },
    });

    addSliderDebugger(spotLightDebuggerGroup, {
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
    // orbitControlsEnabled: boolean;
} = {
    instanceNum: 0,
    // orbitControlsEnabled: true,
};

const searchParams = new URLSearchParams(location.search);
const instanceNumStr = searchParams.get('instance-num');
const initialInstanceNum = instanceNumStr ? Number.parseInt(instanceNumStr, 10) : 50;
console.log(`instance num: ${initialInstanceNum}`);

debuggerStates.instanceNum = initialInstanceNum;

let debuggerGUI: DebuggerGUI;
let width: number, height: number;
let floorPlaneMesh: Mesh;
let floorDiffuseMap: Texture;
let floorNormalMap: Texture;
let attractSphereMesh: Mesh;
let testLightingMesh: Mesh;
let skinnedMesh: SkinnedMesh;
let cubeMap: CubeMap;
let glslSound: GlslSound;
let objectSpaceRaymarchMesh: Mesh;
let screenSpaceRaymarchMesh: Mesh;

const isSP = !!window.navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i);
const inputController = isSP ? createTouchInputController() : createMouseInputController();
inputController.start();

// const wrapperElement = document.getElementById("wrapper")!;
const wrapperElement = document.createElement('div');
document.body.appendChild(wrapperElement);
wrapperElement.setAttribute('id', 'wrapper');

// const canvasElement = document.getElementById("js-canvas")! as HTMLCanvasElement;
const canvasElement = document.createElement('canvas');
wrapperElement.appendChild(canvasElement);

const gl = canvasElement.getContext('webgl2', { antialias: false });

if (!gl) {
    throw 'invalid gl';
}

const gpu = createGPU(gl);

const instanceNumView = document.createElement('p');
instanceNumView.textContent = `instance num: ${initialInstanceNum}`;
instanceNumView.style.cssText = `
position: absolute;
top: 0;
left: 0;
right: 0;
margin: auto;
padding: 0.2em 0.5em;
font-size: 9px;
color: white;
font-weight: bold;
text-shadow: rgba(0, 0, 0, 0.7) 1px 1px;
text-align: center;
`;
wrapperElement?.appendChild(instanceNumView);

const captureScene = createScene();
// const compositeScene = new Scene();

const pixelRatio = Math.min(window.devicePixelRatio, 1);
// const pixelRatio = Math.min(window.devicePixelRatio, 0.1);

const renderer = createRenderer({
    gpu,
    canvas: canvasElement,
    pixelRatio,
});

const engine = createEngine({ gpu, renderer });
// for debug
// const engine = createEngine({ gpu, renderer, fixedUpdateFps: 1, updateFps: 1 });

// engine.setScenes([captureScene, compositeScene]);
engine.setScene(captureScene);

// const captureSceneCamera = new PerspectiveCamera(60, 1, 0.1, 70);
const captureSceneCamera = createPerspectiveCamera(70, 1, 0.1, 50);
addActorToScene(captureScene, captureSceneCamera);
// captureScene.mainCamera = captureSceneCamera;
// captureSceneCamera.mainCamera = true;

const orbitCameraController = createOrbitCameraController(captureSceneCamera);

subscribeActorOnStart(captureSceneCamera, () => {
    setCameraClearColor(captureSceneCamera, new Vector4(0, 0, 0, 1));
});
captureSceneCamera.onFixedUpdate = () => {
    // 1: fixed position
    // actor.transform.position = new Vector3(-7 * 1.1, 4.5 * 1.4, 11 * 1.2);

    // 2: orbit controls
    // if (inputController.isDown && debuggerStates.orbitControlsEnabled) {
    if (inputController.getIsDown() && orbitCameraController.enabled) {
        setOrbitCameraControllerDelta(orbitCameraController, v2o(inputController.getDeltaNormalizedInputPosition()));
    }
    fixedUpdateOrbitCameraController(orbitCameraController);
};

const directionalLight = createDirectionalLight({
    // intensity: 1.2,
    intensity: 0,
    // color: Color.fromRGB(255, 210, 200),
    color: createColorWhite(),
});
// directionalLight.enabled = false; // NOTE: 一旦ガード

// shadows
// TODO: directional light は constructor で shadow cameras を生成してるのでこのガードいらない
if (directionalLight.shadowCamera) {
    directionalLight.shadowCamera.visibleFrustum = true;
    directionalLight.castShadow = true;
    directionalLight.shadowCamera.near = 1;
    directionalLight.shadowCamera.far = 15;
    // (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -12, 12, -12, 12);
    // (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -5, 5, -5, 5);
    setOrthoSize(directionalLight.shadowCamera as OrthographicCamera, null, null, -7, 7, -7, 7);
    directionalLight.shadowMap = createRenderTarget({
        gpu,
        width: 1024,
        height: 1024,
        type: RenderTargetTypes.Depth,
        depthPrecision: TextureDepthPrecisionType.High,
    });
}

subscribeActorOnStart(directionalLight, () => {
    setTranslation(directionalLight.transform, new Vector3(-8, 8, -2));
    setLookAtPosition(directionalLight.transform, new Vector3(0, 0, 0));
    // const lightActor = actor as DirectionalLight;
    // lightActor.castShadow = true;
    // // lightActor.castShadow = false;
    // if (lightActor.shadowCamera) {
    //     lightActor.shadowCamera.near = 1;
    //     lightActor.shadowCamera.far = 30;
    //     (lightActor.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -10, 10, -10, 10);
    //     lightActor.shadowMap = new RenderTarget({gpu, width: 1024, height: 1024, type: RenderTargetTypes.Depth});
    // }
});
addActorToScene(captureScene, directionalLight);

const spotLight1 = createSpotLight({
    intensity: 1,
    color: createColorWhite(),
    distance: 20,
    attenuation: 0.1,
    coneAngle: 0.1 * RAD_TO_DEG,
    penumbraAngle: 0.05 * RAD_TO_DEG,
});
// spotLight.enabled = false;

if (spotLight1.shadowCamera) {
    spotLight1.shadowCamera.visibleFrustum = true;
    spotLight1.castShadow = true;
    spotLight1.shadowCamera.near = 1;
    spotLight1.shadowCamera.far = spotLight1.distance;
    // spotLight.shadowCamera.far = 10;
    setPerspectiveSize(spotLight1.shadowCamera as PerspectiveCamera, 1); // TODO: いらないかも
    spotLight1.shadowMap = createRenderTarget({
        gpu,
        width: 1024,
        height: 1024,
        type: RenderTargetTypes.Depth,
        depthPrecision: TextureDepthPrecisionType.High,
    });
}

subscribeActorOnStart(spotLight1, () => {
    setTranslation(spotLight1.transform, new Vector3(5, 9, -2));
    setLookAtPosition(spotLight1.transform, new Vector3(0, 0, 0));
});

addActorToScene(captureScene, spotLight1);

const spotLight2 = createSpotLight({
    intensity: 1,
    color: createColorWhite(),
    distance: 20,
    attenuation: 0.1,
    coneAngle: 0.1 * RAD_TO_DEG,
    penumbraAngle: 0.05 * RAD_TO_DEG,
});
// spotLight.enabled = false;

if (spotLight2.shadowCamera) {
    spotLight2.shadowCamera.visibleFrustum = true;
    spotLight2.castShadow = true;
    spotLight2.shadowCamera.near = 1;
    spotLight2.shadowCamera.far = spotLight2.distance;
    // spotLight.shadowCamera.far = 10;
    setPerspectiveSize(spotLight2.shadowCamera as PerspectiveCamera, 1); // TODO: いらないかも
    spotLight2.shadowMap = createRenderTarget({
        gpu,
        width: 1024,
        height: 1024,
        type: RenderTargetTypes.Depth,
        depthPrecision: TextureDepthPrecisionType.High,
    });
}
subscribeActorOnStart(spotLight2, () => {
    setTranslation(spotLight2.transform, new Vector3(-5, 9, -2));
    setLookAtPosition(spotLight2.transform, new Vector3(0, 0, 0));
});

addActorToScene(captureScene, spotLight2);

const cameraPostProcess = new PostProcess();

(renderer.depthOfFieldPass.parameters as DepthOfFieldPassParameters).focusDistance = 18.5;
(renderer.depthOfFieldPass.parameters as DepthOfFieldPassParameters).focusRange = 17;

const bufferVisualizerPass = createBufferVisualizerPass({ gpu });
bufferVisualizerPass.parameters.enabled = false;
cameraPostProcess.addPass(bufferVisualizerPass);

cameraPostProcess.enabled = true;
// TODO: set post process いらないかも
setCameraPostProcess(captureSceneCamera, cameraPostProcess);

/*
const debugTransformFeedback = () => {
    const transformFeedbackBuffer = new TransformFeedbackBuffer({
        gpu,
        attributes: [
            new Attribute({
                name: 'aArg1',
                data: new Float32Array([1, 2, 3, 4, 5, 6]),
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: 'aArg2',
                data: new Float32Array([7, 8, 9, 10, 11, 12]),
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
        ],
        varyings: [
            {
                name: 'vArg1',
                data: new Float32Array([0, 0, 0, 0, 0, 0]),
                // size: 3,
            },
            {
                name: 'vArg2',
                data: new Float32Array([0, 0, 0, 0, 0, 0]),
                // size: 3,
            },
        ],
        vertexShader: `#version 300 es

        precision highp float;

        layout(location = 0) in vec3 aArg1;
        layout(location = 1) in vec3 aArg2;

        out vec3 vArg1;
        out vec3 vArg2;

        void main() {
            vArg1 = aArg1 * 2.;
            vArg2 = aArg2 * 3.;
        }
        `,
        fragmentShader: `#version 300 es

        precision highp float;

        void main() {
        }
        `,
        drawCount: 2,
    });
    gpu.updateTransformFeedback({
        shader: transformFeedbackBuffer.shader,
        uniforms: transformFeedbackBuffer.uniforms,
        vertexArrayObject: transformFeedbackBuffer.vertexArrayObject,
        transformFeedback: transformFeedbackBuffer.transformFeedback,
        drawCount: transformFeedbackBuffer.drawCount,
    });
    transformFeedbackBuffer.outputs.forEach(({ buffer }) => {
        const results = new Float32Array(6);
        gpu.gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.getBufferSubData(gl.ARRAY_BUFFER, 0, results);
        gpu.gl.bindBuffer(gl.ARRAY_BUFFER, null);
        console.log(results);
    });
};

const createTransformFeedbackDrivenMesh = () => {
    //
    // debugs
    //
    debugTransformFeedback();

    //
    // begin create mesh
    //

    const planeNum = 512;

    const initialPosition = new Float32Array(
        maton
            .range(planeNum)
            .map(() => {
                return [
                    // i,
                    // 0,
                    // 0,
                    Math.random() * 4 - 2,
                    Math.random() * 4 + 2,
                    Math.random() * 4 - 2,
                ];
            })
            .flat()
    );
    // const initialTransform = new Float32Array(
    //     maton
    //         .range(planeNum)
    //         .map(() => {
    //             // prettier-ignore
    //             return [
    //                 1, 0, 0, 0,
    //                 0, 1, 0, 0,
    //                 0, 0, 1, 0,
    //                 0, 0, 0, 1
    //                 // (Math.random() * 1 - .5) * .5,
    //                 // (Math.random() * 1 + .5) * .5,
    //                 // (Math.random() * 1 - .5) * .5,
    //             ];
    //         })
    //         .flat()
    // );
    const initialVelocity = new Float32Array(
        maton
            .range(planeNum)
            .map(() => {
                return [
                    0, 0, 0,
                    // (Math.random() * 1 - .5) * .5,
                    // (Math.random() * 1 + .5) * .5,
                    // (Math.random() * 1 - .5) * .5,
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
            // new Attribute({
            //     name: 'aTransform',
            //     data: initialTransform,
            //     size: 16,
            //     usageType: AttributeUsageType.DynamicDraw,
            // }),
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
            // {
            //     name: 'vTransform',
            //     data: new Float32Array(initialTransform),
            // },
        ],
        vertexShader: `#version 300 es

        precision highp float;

        // TODO: ここ動的に構築してもいい
        layout(location = 0) in vec3 aPosition;
        layout(location = 1) in vec3 aVelocity;
        // layout(location = 2) in mat4 aTransform;

        out vec3 vPosition;
        // out mat4 vTransform;
        out vec3 vVelocity;

        uniform float uTime;
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
            // vPosition = aPosition;
            // vTransform = aTransform;
            vec3 target = uAttractTargetPosition;
            vec2 seed = vec2(float(gl_VertexID), float(gl_VertexID));
            target += vec3(
                cos(noise(seed) * 2. + uTime * 6. + float(gl_VertexID) * 16.) * 2.,
                sin(noise(seed) * 4. + uTime * 3. + float(gl_VertexID) * 8.) * 2.,
                sin(noise(seed) * 6. + uTime * 4. + float(gl_VertexID) * 4.) * 2.
            );
            vec3 v = target - vPosition;
            vec3 dir = normalize(v);
            vVelocity = mix(
                aVelocity,
                dir * (.2 + uAttractRate * .2),
                .02 + sin(float(gl_VertexID)) * .01
                // .04 + uAttractRate * .0
            );
        }
        `,
        fragmentShader: `#version 300 es

        precision highp float;

        void main() {
        }
        `,
        uniforms: {
            [UniformNames.Time]: {
                type: UniformTypes.Float,
                value: 0,
            },
            uNormalizedInputPosition: {
                type: UniformTypes.Vector2,
                value: Vector2.zero,
            },
            uAttractTargetPosition: {
                type: UniformTypes.Vector3,
                value: Vector3.zero,
            },
            uAttractRate: {
                type: UniformTypes.Float,
                value: 0,
            },
        },
        drawCount: planeNum,
    });

    const boxGeometryData = createBoxGeometryData();

    const instancePosition = maton
        .range(planeNum, true)
        .map(() => {
            // return [i, 0, 0]
            return [0, 0, 0];
        })
        .flat();
    const instanceScale = maton
        .range(planeNum, true)
        .map(() => {
            return [
                // 1, 1, 1
                // 0.7, 0.7, 0.7,
                Math.random() * 0.4 + 0.2,
                Math.random() * 0.4 + 0.2,
                Math.random() * 0.4 + 0.2,
            ];
        })
        .flat();
    const instanceRotation = maton
        .range(planeNum, true)
        .map(() => {
            // return [i, 0, 0]
            return [0, 0, 0];
        })
        .flat();
    const instanceVelocity = maton
        .range(planeNum, true)
        .map(() => {
            // return [i, 0, 0]
            return [0, 0, 0];
        })
        .flat();
    // const accPositions = maton.range(3 * planeNum).map(() => {
    //     return 0;
    // });
    // const velocities = maton.range(3 * planeNum).map(() => {
    //     return 0;
    // });
    const instanceColor = maton
        .range(planeNum)
        .map(() => {
            const c = Color.fromRGB(
                Math.floor(Math.random() * 240 + 15),
                Math.floor(Math.random() * 10 + 245),
                Math.floor(Math.random() * 245 + 10)
            );
            return [...c.elements];
        })
        .flat();

    const geometry = new Geometry({
        gpu,
        attributes: [
            ...boxGeometryData.attributes,
            // new Attribute({
            //     name: AttributeNames.Position,
            //     data: planeGeometryRawData.positions,
            //     size: 3,
            // }),
            // new Attribute({
            //     name: AttributeNames.Normal,
            //     data: planeGeometryRawData.no,
            //     size: 3,
            // }),
            // new Attribute({
            //     name: AttributeNames.Uv,
            //     data: new Float32Array(uvs),
            //     size: 2,
            // }),
            // new Attribute({
            //     name: 'aAccPosition',
            //     data: new Float32Array(accPositions),
            //     size: 3,
            //     divisor: 1,
            // }),
            // new Attribute({
            //     name: 'aVelocity',
            //     data: new Float32Array(velocities),
            //     size: 3,
            //     divisor: 1,
            // }),
            new Attribute({
                name: AttributeNames.InstancePosition,
                data: new Float32Array(instancePosition),
                size: 3,
                divisor: 1,
            }),
            new Attribute({
                name: AttributeNames.InstanceScale,
                data: new Float32Array(instanceScale),
                size: 3,
                divisor: 1,
            }),
            new Attribute({
                name: AttributeNames.InstanceRotation,
                data: new Float32Array(instanceRotation),
                size: 3,
                divisor: 1,
            }),
            new Attribute({
                name: AttributeNames.InstanceVertexColor,
                data: new Float32Array(instanceColor),
                size: 4,
                divisor: 1,
            }),
            new Attribute({
                name: AttributeNames.InstanceVelocity,
                data: new Float32Array(instanceVelocity),
                size: 3,
                divisor: 1,
            }),
        ],
        indices: boxGeometryData.indices,
        drawCount: boxGeometryData.drawCount,
        instanceCount: planeNum,
    });
    const material = new GBufferMaterial({
        isInstancing: true,
        useVertexColor: true,
        vertexShaderModifier: {
            [VertexShaderModifierPragmas.INSTANCE_TRANSFORM_PRE_PROCESS]: `
                instanceRotation = getLookAtMat(aInstancePosition + aInstanceVelocity * 1000., aInstancePosition);
            `,
            // [VertexShaderModifierPragmas.APPEND_ATTRIBUTES]: 'layout(location = 3) in vec3 aVelocity;',
            // [VertexShaderModifierPragmas.APPEND_UNIFORMS]: `uniform float uTest;`,
            // [VertexShaderModifierPragmas.LOCAL_POSITION_POST_PROCESS]: `localPosition.xyz += aAccPosition;`,
            // [VertexShaderModifierPragmas.LOCAL_POSITION_POST_PROCESS]: `localPosition.xyz += aVelocity;`,
        },
    });
    const mesh = new Mesh({
        geometry,
        material,
        castShadow: true,
    });
    // mesh.transform.setScaling(new Vector3(1, 1, 1));
    let attractRate = 0;
    mesh.onUpdate = ({ time, deltaTime }) => {
        // mesh.material.uniforms.uTime.value = time;

        transformFeedbackDoubleBuffer.uniforms.uTime.value = time;
        transformFeedbackDoubleBuffer.uniforms.uNormalizedInputPosition.value = inputController.normalizedInputPosition;
        // transformFeedbackDoubleBuffer.uniforms.uAttractTargetPosition.value = new Vector3(0, 0, 0);
        transformFeedbackDoubleBuffer.uniforms.uAttractTargetPosition.value = attractSphereMesh.transform.position;

        attractRate += 2 * (inputController.isDown ? 1 : -1) * deltaTime;
        attractRate = saturate(attractRate);
        transformFeedbackDoubleBuffer.uniforms.uAttractRate.value = attractRate;
        gpu.updateTransformFeedback({
            shader: transformFeedbackDoubleBuffer.shader,
            uniforms: transformFeedbackDoubleBuffer.uniforms,
            vertexArrayObject: transformFeedbackDoubleBuffer.write.vertexArrayObject,
            transformFeedback: transformFeedbackDoubleBuffer.write.transformFeedback,
            drawCount: transformFeedbackDoubleBuffer.drawCount,
        });
        transformFeedbackDoubleBuffer.swap();
        // };
        // mesh.onUpdate = () => {
        geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstancePosition,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aPosition')
        );
        geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstanceVelocity,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aVelocity')
        );
        // geometry.vertexArrayObject.replaceBuffer(
        //     'aAccPosition',
        //     transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aPosition')
        // );
        // geometry.vertexArrayObject.replaceBuffer(
        //     'aVelocity',
        //     transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aVelocity')
        // );
    };
   
    mesh.enabled = false;
    
    // mesh.transform.setTranslation(new Vector3(0, 2, 0));
    return mesh;
};
*/

const createGLTFSphereMesh = async (material: Material) => {
    const gltfActor = await loadGLTF({ gpu, path: gltfSphereModelUrl });
    const mesh: Mesh = gltfActor.children[0] as Mesh;
    mesh.castShadow = true;
    setMeshMaterial(mesh, material);

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
            createAttribute({
                name: 'aPosition',
                data: initialPosition,
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            createAttribute({
                name: 'aVelocity',
                data: initialVelocity,
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            createAttribute({
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
                value: createVector2Zero(),
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
        const blockIndex = bindGPUUniformBlockAndGetBlockIndex(
            gpu,
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
        addUniformBlock(
            transformFeedbackDoubleBuffer.uniforms,
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
    const gltfActor = await loadGLTF({ gpu, path: gltfButterflyModelUrl });

    // skinned mesh のはずなので cast
    const skinningMesh: SkinnedMesh = gltfActor.children[0].children[0] as SkinnedMesh;

    skinningMesh.name = 'butterfly';
    // ルートにanimatorをattachしてるので一旦ここでassign
    // animatorは存在しているmeshのはず
    // TODO: set animation clips いらない気がする. animatorの設定さえあれば
    skinningMesh.animator = gltfActor.animator!;
    setAnimationClips(skinningMesh, gltfActor.animator.getAnimationClips());

    // subscribeActorOnStart(skinningMesh, () => {
    //     // CPU skinning
    //     // gltfActor.animator.play('Fly', true);
    //     // gltfActor.animator.animationClips[0].speed = 0.2;
    // });
    // // skinningMesh.onUpdate = ({ deltaTime }) => {
    // //     // skinningMesh.animator.update(deltaTime);
    // //     // gltfActor.animator.update(deltaTime);
    // // };

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
        // const posRangeX = 20;
        // const posRangeZ = 20;
        // const px = (Math.random() * 2 - 1) * posRangeX;
        // const py = 0.5 + Math.random() * 2.;
        // const pz = (Math.random() * 2 - 1) * posRangeZ;
        // const p = [px, py, pz];
        // instanceInfo.position.push(p);
        instanceInfo.position.push([0, 0, 0]);

        // const baseScale = 0.04;
        // const randomScaleRange = 0.08;
        const baseScale = 0.2;
        const randomScaleRange = 0.6;
        const s = Math.random() * randomScaleRange + baseScale;
        // instanceInfo.scale.push([s, s * 2, s]);
        instanceInfo.scale.push([s, s, s]);

        instanceInfo.rotation.push([0, 0, 0]);

        instanceInfo.velocity.push([0, 0, 0]);

        const c = createColorFromRGB(
            Math.floor(Math.random() * 200 + 30),
            Math.floor(Math.random() * 80 + 20),
            Math.floor(Math.random() * 200 + 30)
        );
        instanceInfo.color.push([...c.e]);
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
    setGeometryAttribute(
        skinningMesh.geometry,
        createAttribute({
            name: AttributeNames.InstancePosition,
            data: new Float32Array(instanceInfo.position.flat()),
            size: 3,
            divisor: 1,
        })
    );
    setGeometryAttribute(
        skinningMesh.geometry,
        createAttribute({
            name: AttributeNames.InstanceScale,
            data: new Float32Array(instanceInfo.scale.flat()),
            size: 3,
            divisor: 1,
        })
    );
    setGeometryAttribute(
        skinningMesh.geometry,
        createAttribute({
            name: AttributeNames.InstanceRotation,
            data: new Float32Array(instanceInfo.rotation.flat()),
            size: 3,
            divisor: 1,
        })
    );
    // aInstanceAnimationOffsetは予約語
    setGeometryAttribute(
        skinningMesh.geometry,
        createAttribute({
            name: AttributeNames.InstanceAnimationOffset,
            data: new Float32Array(animationOffsetInfo),
            size: 1,
            divisor: 1,
        })
    );
    setGeometryAttribute(
        skinningMesh.geometry,
        createAttribute({
            name: AttributeNames.InstanceVertexColor,
            data: new Float32Array(instanceInfo.color.flat()),
            size: 4,
            divisor: 1,
        })
    );
    setGeometryAttribute(
        skinningMesh.geometry,
        createAttribute({
            name: AttributeNames.InstanceEmissiveColor,
            data: new Float32Array(maton.range(instanceNum).fill(0).flat()),
            size: 4,
            divisor: 1,
        })
    );
    setGeometryAttribute(
        skinningMesh.geometry,
        createAttribute({
            name: AttributeNames.InstanceVelocity,
            data: new Float32Array(instanceInfo.velocity.flat()),
            size: 3,
            divisor: 1,
        })
    );

    // skinningMesh.material = new PhongMaterial({
    //     // gpu,
    //     specularAmount: 0.5,
    //     receiveShadow: true,
    //     isSkinning: true,
    //     gpuSkinning: true,
    //     isInstancing: true,
    //     useVertexColor: true,
    //     envMap: cubeMap,
    //     ambientAmount: 0.2,
    // });
    setMeshMaterial(
        skinningMesh,
        createGBufferMaterial({
            // gpu,
            // specularAmount: 0.5,
            // diffuseColor: Color.white(),
            metallic: 0,
            roughness: 1,
            receiveShadow: true,
            isSkinning: true,
            gpuSkinning: true,
            isInstancing: true,
            useInstanceLookDirection: true,
            useVertexColor: true,
            faceSide: FaceSide.Double,
        })
    );

    const transformFeedbackDoubleBuffer = createInstanceUpdater(instanceNum);

    let attractRate = 0;
    skinningMesh.onUpdate = ({ deltaTime }) => {
        // mesh.material.uniforms.uTime.value = time;

        // transformFeedbackDoubleBuffer.uniforms.setValue(UniformNames.Time, time);
        setUniformValue(
            transformFeedbackDoubleBuffer.uniforms,
            'uNormalizedInputPosition',
            inputController.getNormalizedInputPosition()
        );
        setUniformValue(
            transformFeedbackDoubleBuffer.uniforms,
            'uAttractTargetPosition',
            attractSphereMesh.transform.position
        );

        attractRate += (inputController.getIsDown() ? 1 : -1) * deltaTime * 2;
        attractRate = saturate(attractRate);
        setUniformValue(transformFeedbackDoubleBuffer.uniforms, 'uAttractRate', attractRate);
        updateGPUTransformFeedback(gpu, {
            shader: transformFeedbackDoubleBuffer.shader,
            uniforms: transformFeedbackDoubleBuffer.uniforms,
            vertexArrayObject: transformFeedbackDoubleBuffer.write.vertexArrayObject,
            transformFeedback: transformFeedbackDoubleBuffer.write.transformFeedback,
            drawCount: transformFeedbackDoubleBuffer.drawCount,
        });
        transformFeedbackDoubleBuffer.swap();
        // };
        // mesh.onUpdate = () => {
        replaceVertexArrayObjectBuffer(
            skinnedMesh.geometry.vertexArrayObject,
            AttributeNames.InstancePosition,
            findVertexArrayObjectVertexBufferObjectBuffer(
                transformFeedbackDoubleBuffer.read.vertexArrayObject,
                'aPosition'
            )!
        );
        replaceVertexArrayObjectBuffer(
            skinnedMesh.geometry.vertexArrayObject,
            AttributeNames.InstanceVelocity,
            findVertexArrayObjectVertexBufferObjectBuffer(
                transformFeedbackDoubleBuffer.read.vertexArrayObject,
                'aVelocity'
            )!
        );
    };

    // skinningMesh.debugBoneView = true;
    // skinningMesh.enabled = false;

    return skinningMesh;
};

const playSound = () => {
    if (glslSound) {
        glslSound.stop();
    }
    glslSound = createGLSLSound(gpu, soundVertexShader, 180);
    glslSound.play(0);
};

const main = async () => {
    const particleImg = await loadImg(smokeImgUrl);
    const particleMap = createTexture({
        gpu,
        img: particleImg,
    });

    const floorDiffuseImg = await loadImg(leaveDiffuseImgUrl);
    floorDiffuseMap = createTexture({
        gpu,
        img: floorDiffuseImg,
        // mipmap: true,
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
        minFilter: TextureFilterTypes.Linear,
        magFilter: TextureFilterTypes.Linear,
    });

    const floorNormalImg = await loadImg(leaveNormalImgUrl);
    floorNormalMap = createTexture({
        gpu,
        img: floorNormalImg,
        // mipmap: true,
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
        minFilter: TextureFilterTypes.Linear,
        magFilter: TextureFilterTypes.Linear,
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

    const skyboxMesh = createSkybox({
        gpu,
        cubeMap,
        diffuseIntensity: 0.2,
        specularIntensity: 0.2,
        // rotationOffset: 0.8,
    });
    // skyboxMesh.enabled = false;

    //
    // attract mesh
    //

    attractSphereMesh = await createGLTFSphereMesh(
        createUnlitMaterial({
            emissiveColor: createColor(2, 2, 2, 1),
            // receiveShadow: true,
        })
    );
    subscribeActorOnStart(attractSphereMesh, () => {
        setScaling(attractSphereMesh.transform, new Vector3(0.5, 0.5, 0.5));
        // actor.transform.setTranslation(new Vector3(0, 3, 0));
    });
    attractSphereMesh.onFixedUpdate = () => {
        const w = 10;
        const d = 10;
        const ix = v2x(inputController.getNormalizedInputPosition()) * 2 - 1;
        const iy = v2y(inputController.getNormalizedInputPosition()) * 2 - 1;
        const x = ix * w;
        const z = iy * d;
        const y = 0.5;
        setTranslation(attractSphereMesh.transform, new Vector3(x, y, z));
        // console.log(inputController.normalizedInputPosition.x);
    };

    //
    // lighting mesh
    //

    testLightingMesh = await createGLTFSphereMesh(
        createGBufferMaterial({
            // diffuseColor: new Color(1, .05, .05, 1),
            // metallic: 0,
            // roughness: .3
            diffuseColor: createColorWhite(),
            metallic: 1,
            roughness: 1,
        })
    );
    setTranslation(testLightingMesh.transform, new Vector3(2.5, 1, 0));

    //
    // local raymarch mesh
    //

    // TODO:
    objectSpaceRaymarchMesh = createObjectSpaceRaymarchMesh({
        name: 'object-space-raymarch-mesh',
        gpu,
        fragmentShaderContent: litObjectSpaceRaymarchFragContent,
        // depthFragmentShaderContent: gBufferObjectSpaceRaymarchDepthFrag,
        depthFragmentShaderContent: litObjectSpaceRaymarchFragContent,
        materialArgs: {
            metallic: 0,
            roughness: 0,
            receiveShadow: false,
        },
        castShadow: true,
    });
    setScaling(objectSpaceRaymarchMesh.transform, new Vector3(10, 10, 10));
    setTranslation(objectSpaceRaymarchMesh.transform, new Vector3(0, 1.5, 0));
    // setUseWorldSpaceToObjectSpaceRaymarchMesh(objectSpaceRaymarchMesh, true);

    //
    // screen space raymarch mesh
    //

    // TODO:
    screenSpaceRaymarchMesh = createScreenSpaceRaymarchMesh({
        gpu,
        fragmentShaderContent: litScreenSpaceRaymarchFragContent,
        // depthFragmentShaderContent: gBufferScreenSpaceRaymarchDepthFrag,
        depthFragmentShaderContent: litScreenSpaceRaymarchFragContent,
        materialArgs: {},
    });
    setScaling(screenSpaceRaymarchMesh.transform, new Vector3(2, 2, 2));
    setTranslation(screenSpaceRaymarchMesh.transform, new Vector3(0, 4, 0));

    //
    // text mesh
    //

    const fontAtlasImg = await loadImg(fontAtlasImgUrl);
    const fontAtlasJson = await loadJson<FontAtlasData>(fontAtlasJsonUrl);

    const fontAtlasTexture = createTexture({
        gpu,
        img: fontAtlasImg,
        flipY: false,
        minFilter: TextureFilterTypes.Linear,
        magFilter: TextureFilterTypes.Linear,
    });
    const textMesh1 = createTextMesh({
        gpu,
        text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        fontTexture: fontAtlasTexture,
        fontAtlas: fontAtlasJson,
        castShadow: true,
        align: TextAlignType.Center,
        // characterSpacing: -0.2
    });
    addActorToScene(captureScene, textMesh1);
    setTranslation(textMesh1.transform, new Vector3(0, 1, 6));
    setRotationX(textMesh1.transform, -90);
    setScaling(textMesh1.transform, new Vector3(0.4, 0.4, 0.4));

    const textMesh2 = createTextMesh({
        gpu,
        text: 'abcdefghijklmnopqrstuvwxyz',
        fontTexture: fontAtlasTexture,
        fontAtlas: fontAtlasJson,
        castShadow: true,
        align: TextAlignType.Center,
        characterSpacing: -0.16,
    });
    addActorToScene(captureScene, textMesh2);
    setTranslation(textMesh2.transform, new Vector3(0, 2, 8));
    setRotationX(textMesh2.transform, -90);
    setScaling(textMesh2.transform, new Vector3(0.4, 0.4, 0.4));

    const textMesh3 = createTextMesh({
        gpu,
        text: '0123456789',
        fontTexture: fontAtlasTexture,
        fontAtlas: fontAtlasJson,
        castShadow: true,
        align: TextAlignType.Left,
        characterSpacing: 0.2,
    });
    addActorToScene(captureScene, textMesh3);
    setTranslation(textMesh3.transform, new Vector3(0, 0.01, 9));
    setRotationX(textMesh3.transform, -90);
    setScaling(textMesh3.transform, new Vector3(0.4, 0.4, 0.4));

    //
    // instancing mesh
    //

    skinnedMesh = await createGLTFSkinnedMesh(initialInstanceNum);
    console.log(
        'hogehoge - butterfly',
        skinnedMesh,
        getGeometryAttributeDescriptors(skinnedMesh.geometry),
        skinnedMesh.geometry.indices,
        skinnedMesh.geometry.instanceCount,
        skinnedMesh.geometry.drawCount
    );
    // skinnedMesh.enabled = false;

    //
    // floor mesh
    //

    const floorGeometry = createPlaneGeometry({
        gpu,
        calculateTangent: true,
        calculateBinormal: true,
    });
    floorPlaneMesh = createMesh({
        geometry: floorGeometry,
        // material: new PhongMaterial({
        //     // gpu,
        //     // diffuseMap: floorDiffuseMap,
        //     // normalMap: floorNormalMap,
        //     envMap: cubeMap,
        //     diffuseColor: new Color(0, 0, 0, 1),
        //     receiveShadow: true,
        //     specularAmount: 0.4,
        //     ambientAmount: 0.2,
        // }),
        material: createGBufferMaterial({
            // gpu,
            diffuseMap: floorDiffuseMap,
            normalMap: floorNormalMap,
            // envMap: cubeMap,
            // diffuseColor: new Color(0.05, 0.05, 0.05, 1),
            // diffuseColor: new Color(0, 0, 0, 1),
            diffuseColor: createColorWhite(),
            receiveShadow: true,
            // specularAmount: 0.4,
            metallic: 0,
            roughness: 0.5,
            // ambientAmount: 0.2,
        }),
        // castShadow: false,
        castShadow: true,
    });
    subscribeActorOnStart(floorPlaneMesh, () => {
        setScaling(floorPlaneMesh.transform, new Vector3(10, 10, 10));
        setRotationX(floorPlaneMesh.transform, -90);
        setMaterialUniformValue(getMeshMaterial(floorPlaneMesh), 'uDiffuseMapUvScale', createVector2(3, 3));
        setMaterialUniformValue(getMeshMaterial(floorPlaneMesh), 'uNormalMapUvScale', createVector2(3, 3));
    });

    //
    // particle mesh
    //

    const particleNum = 50;
    const particleGeometry = createGeometry({
        gpu,
        attributes: [
            createAttribute({
                name: AttributeNames.Position.toString(),
                // dummy data
                data: new Float32Array(
                    maton
                        .range(particleNum)
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
            createAttribute({
                name: AttributeNames.Uv.toString(),
                data: new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => [0, 1, 0, 0, 1, 1, 1, 0])
                        .flat()
                ),
                size: 2,
            }),
            createAttribute({
                name: AttributeNames.Color.toString(),
                data: new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            const c = createColorFromRGB(
                                Math.random() * 50 + 200,
                                Math.random() * 50 + 190,
                                Math.random() * 50 + 180,
                                Math.random() * 150 + 50
                            );
                            return [...c.e, ...c.e, ...c.e, ...c.e];
                        })
                        .flat()
                ),
                size: 4,
            }),
            createAttribute({
                name: 'aBillboardSize',
                data: new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            const s = Math.random() * 3.5 + 0.5;
                            return [s, s, s, s];
                        })
                        .flat()
                ),
                size: 1,
            }),
            createAttribute({
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
    const particleMaterial = createMaterial({
        // gpu,
        vertexShader: `
#pragma DEFINES

#pragma ATTRIBUTES

#include <lighting>
#include <ub>

out vec2 vUv;
out vec3 vWorldPosition;
out vec3 vNormal;

out vec4 vVertexColor;
out vec4 vViewPosition;
out vec4 vClipPosition;

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
        fragmentShader: `
#pragma DEFINES

precision highp float;

#include <lighting>
#include <ub>
#include <depth>

in vec2 vUv;
in vec4 vVertexColor;
in vec4 vViewPosition;
in vec4 vClipPosition;

out vec4 outColor;

uniform sampler2D uParticleMap;

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
        uniforms: [
            {
                name: 'uParticleMap',
                type: UniformTypes.Texture,
                value: particleMap,
            },
            {
                name: 'uBillboardPositionConverters',
                type: UniformTypes.Vector2Array,
                value: [createVector2(-1, 1), createVector2(-1, -1), createVector2(1, 1), createVector2(1, -1)],
            },
            // {
            //     name: UniformNames.Time,
            //     type: UniformTypes.Float,
            //     value: 0,
            // },
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
        uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Camera],
        // blendType: BlendTypes.Additive
        blendType: BlendTypes.Transparent,
        depthWrite: false,
    });
    const particleMesh = createMesh({
        geometry: particleGeometry,
        material: particleMaterial,
    });
    // particleMesh.onFixedUpdate = ({ fixedTime }) => {
    //     particleMaterial.uniforms.setValue('uTime', fixedTime);
    // };

    addActorToScene(captureScene, attractSphereMesh);
    addActorToScene(captureScene, testLightingMesh);
    addActorToScene(captureScene, skinnedMesh);
    addActorToScene(captureScene, floorPlaneMesh);
    addActorToScene(captureScene, skyboxMesh);
    addActorToScene(captureScene, particleMesh);
    addActorToScene(captureScene, objectSpaceRaymarchMesh);
    addActorToScene(captureScene, screenSpaceRaymarchMesh);

    // TODO: engine側に移譲したい
    const onWindowResize = () => {
        width = wrapperElement.offsetWidth;
        height = wrapperElement.offsetHeight;
        inputController.setSize(width, height);
        engine.setSize(width, height);
    };

    engine.setOnBeforeStart(() => {
        onWindowResize();
        window.addEventListener('resize', onWindowResize);

        orbitCameraController.distance = isSP ? 20 : 20;
        orbitCameraController.attenuation = 0.01;
        orbitCameraController.dampingFactor = 0.2;
        orbitCameraController.azimuthSpeed = 100;
        orbitCameraController.altitudeSpeed = 100;
        orbitCameraController.deltaAzimuthPower = 2;
        orbitCameraController.deltaAltitudePower = 2;
        orbitCameraController.maxAltitude = 70;
        orbitCameraController.minAltitude = -70;
        orbitCameraController.lookAtTarget = new Vector3(0, -2, 0);
        startOrbitCameraController(orbitCameraController, 0, -40);
        // orbitCameraController.enabled = false;
        orbitCameraController.enabled = true;
    });

    // engine.onAfterStart = () => {
    //     window.setTimeout(() => {
    //         onWindowResize()
    //     },1000)
    // }

    engine.setOnBeforeUpdate(() => {
        if (!debuggerGUI) initDebugger();
        inputController.update();
    });

    engine.setOnBeforeFixedUpdate(() => {
        // inputController.fixedUpdate();
    });

    engine.setOnRender((time) => {
        renderRenderer(renderer, captureScene, captureSceneCamera, engine.getSharedTextures(), { time });
    });

    const tick = (time: number) => {
        engine.run(time);
        requestAnimationFrame(tick);
    };

    engine.start();
    requestAnimationFrame(tick);
};

function initDebugger() {
    debuggerGUI = createDebuggerGUI();

    addSliderDebugger(debuggerGUI, {
        label: 'instance num',
        minValue: 1,
        maxValue: 40000,
        initialValue: debuggerStates.instanceNum,
        stepValue: 1,
        onChange: (value) => {
            debuggerStates.instanceNum = value;
        },
    });

    addButtonDebugger(debuggerGUI, {
        buttonLabel: 'reload',
        onClick: () => {
            const url = `${location.origin}${location.pathname}?instance-num=${debuggerStates.instanceNum}`;
            location.replace(url);
        },
    });

    //
    // play sound
    //

    addDebuggerBorderSpacer(debuggerGUI);

    addButtonDebugger(debuggerGUI, {
        buttonLabel: 'play sound',
        onClick: () => {
            playSound();
        },
    });

    //
    // orbit controls
    //

    addDebuggerBorderSpacer(debuggerGUI);

    addToggleDebugger(debuggerGUI, {
        label: 'orbit controls enabled',
        // initialValue: debuggerStates.orbitControlsEnabled,
        // onChange: (value) => (debuggerStates.orbitControlsEnabled = value),
        initialValue: orbitCameraController.enabled,
        onChange: (value) => (orbitCameraController.enabled = value),
    });

    //
    // show buffers
    //

    addDebuggerBorderSpacer(debuggerGUI);

    addToggleDebugger(debuggerGUI, {
        label: 'show buffers',
        initialValue: bufferVisualizerPass.parameters.enabled,
        onChange: (value) => {
            if (value) {
                bufferVisualizerPass.parameters.enabled = true;
                showBufferVisualizerPassDom(bufferVisualizerPass);
            } else {
                bufferVisualizerPass.parameters.enabled = false;
                hideBufferVisualizerPassDom(bufferVisualizerPass);
            }
        },
    });

    //
    // object space raymarch
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const objectSpaceRaymarchMeshDebuggerGroup = addDebugGroup(debuggerGUI, 'object space raymarch', false);

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'pos x',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: objectSpaceRaymarchMesh.transform.position.x,
        onChange: (value) => {
            objectSpaceRaymarchMesh.transform.position.x = value;
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'pos y',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: objectSpaceRaymarchMesh.transform.position.y,
        onChange: (value) => {
            objectSpaceRaymarchMesh.transform.position.y = value;
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'pos z',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: objectSpaceRaymarchMesh.transform.position.z,
        onChange: (value) => {
            objectSpaceRaymarchMesh.transform.position.z = value;
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'scale x',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.001,
        initialValue: objectSpaceRaymarchMesh.transform.scale.x,
        onChange: (value) => {
            objectSpaceRaymarchMesh.transform.scale.x = value;
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'scale y',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.001,
        initialValue: objectSpaceRaymarchMesh.transform.scale.y,
        onChange: (value) => {
            objectSpaceRaymarchMesh.transform.scale.y = value;
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'scale z',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.001,
        initialValue: objectSpaceRaymarchMesh.transform.scale.z,
        onChange: (value) => {
            objectSpaceRaymarchMesh.transform.scale.z = value;
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'rotation x',
        minValue: 0,
        maxValue: 360,
        stepValue: 0.01,
        initialValue: objectSpaceRaymarchMesh.transform.rotation.x,
        onChange: (value) => {
            objectSpaceRaymarchMesh.transform.rotation.x = value;
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'rotation y',
        minValue: 0,
        maxValue: 360,
        stepValue: 0.01,
        initialValue: objectSpaceRaymarchMesh.transform.rotation.y,
        onChange: (value) => {
            objectSpaceRaymarchMesh.transform.rotation.y = value;
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'rotation z',
        minValue: 0,
        maxValue: 360,
        stepValue: 0.01,
        initialValue: objectSpaceRaymarchMesh.transform.rotation.z,
        onChange: (value) => {
            objectSpaceRaymarchMesh.transform.rotation.z = value;
        },
    });

    //
    // directional light
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const directionalLightDebuggerGroup = addDebugGroup(debuggerGUI, 'directional light', false);

    addToggleDebugger(directionalLightDebuggerGroup, {
        label: 'light enabled',
        initialValue: directionalLight.enabled,
        onChange: (value) => (directionalLight.enabled = value),
    });

    addSliderDebugger(directionalLightDebuggerGroup, {
        label: 'intensity',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: directionalLight.intensity,
        onChange: (value) => {
            directionalLight.intensity = value;
        },
    });

    addSliderDebugger(directionalLightDebuggerGroup, {
        label: 'pos x',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: directionalLight.transform.position.x,
        onChange: (value) => {
            directionalLight.transform.position.x = value;
        },
    });

    addSliderDebugger(directionalLightDebuggerGroup, {
        label: 'pos y',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: directionalLight.transform.position.y,
        onChange: (value) => {
            directionalLight.transform.position.y = value;
        },
    });

    addSliderDebugger(directionalLightDebuggerGroup, {
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

    createSpotLightDebugger(debuggerGUI, spotLight1, 'spot light 1');
    createSpotLightDebugger(debuggerGUI, spotLight2, 'spot light 2');

    //
    // ssao
    // TODO: ssao pass の参照を renderer に変える
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const ssaoDebuggerGroup = addDebugGroup(debuggerGUI, 'ssao', false);

    addToggleDebugger(ssaoDebuggerGroup, {
        label: 'ssao pass enabled',
        initialValue: renderer.ambientOcclusionPass.parameters.enabled,
        onChange: (value) => (renderer.ambientOcclusionPass.parameters.enabled = value),
    });

    addSliderDebugger(ssaoDebuggerGroup, {
        label: 'ssao occlusion sample length',
        minValue: 0.01,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionSampleLength,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionSampleLength = value;
        },
    });

    addSliderDebugger(ssaoDebuggerGroup, {
        label: 'ssao occlusion bias',
        minValue: 0.0001,
        maxValue: 0.01,
        stepValue: 0.0001,
        initialValue: renderer.ambientOcclusionPass.occlusionBias,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionBias = value;
        },
    });

    addSliderDebugger(ssaoDebuggerGroup, {
        label: 'ssao min distance',
        minValue: 0,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionMinDistance,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionMinDistance = value;
        },
    });

    addSliderDebugger(ssaoDebuggerGroup, {
        label: 'ssao max distance',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionMaxDistance,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionMaxDistance = value;
        },
    });

    addColorDebugger(ssaoDebuggerGroup, {
        label: 'ssao color',
        initialValue: getColorHexCoord(renderer.ambientOcclusionPass.occlusionColor),
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionColor = createColorFromHex(value);
        },
    });

    addSliderDebugger(ssaoDebuggerGroup, {
        label: 'ssao occlusion power',
        minValue: 0.5,
        maxValue: 4,
        stepValue: 0.01,
        initialValue: renderer.ambientOcclusionPass.occlusionPower,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionPower = value;
        },
    });

    addSliderDebugger(ssaoDebuggerGroup, {
        label: 'ssao occlusion strength',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionStrength,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionStrength = value;
        },
    });

    addSliderDebugger(ssaoDebuggerGroup, {
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

    addDebuggerBorderSpacer(debuggerGUI);

    const lightShaftDebuggerGroup = addDebugGroup(debuggerGUI, 'light shaft', false);

    addToggleDebugger(lightShaftDebuggerGroup, {
        label: 'light shaft pass enabled',
        initialValue: renderer.lightShaftPass.parameters.enabled,
        onChange: (value) => (renderer.lightShaftPass.parameters.enabled = value),
    });

    addSliderDebugger(lightShaftDebuggerGroup, {
        label: 'blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: (renderer.lightShaftPass.parameters as LightShaftPassParameters).blendRate,
        onChange: (value) => {
            (renderer.lightShaftPass.parameters as LightShaftPassParameters).blendRate = value;
        },
    });

    addSliderDebugger(lightShaftDebuggerGroup, {
        label: 'pass scale',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: (renderer.lightShaftPass.parameters as LightShaftPassParameters).passScaleBase,
        onChange: (value) => {
            (renderer.lightShaftPass.parameters as LightShaftPassParameters).passScaleBase = value;
        },
    });

    addSliderDebugger(lightShaftDebuggerGroup, {
        label: 'ray step strength',
        minValue: 0.001,
        maxValue: 0.05,
        stepValue: 0.001,
        initialValue: (renderer.lightShaftPass.parameters as LightShaftPassParameters).rayStepStrength,
        onChange: (value) => {
            (renderer.lightShaftPass.parameters as LightShaftPassParameters).rayStepStrength = value;
        },
    });

    //
    // light volume pass
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const volumetricLightDebuggerGroup = addDebugGroup(debuggerGUI, 'volumetric light', false);

    addSliderDebugger(volumetricLightDebuggerGroup, {
        label: 'ray step',
        initialValue: (renderer.volumetricLightPass.parameters as VolumetricLightPassParameters).rayStep,
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            (renderer.volumetricLightPass.parameters as VolumetricLightPassParameters).rayStep = value;
        },
    });
    addSliderDebugger(volumetricLightDebuggerGroup, {
        label: 'density multiplier',
        initialValue: (renderer.volumetricLightPass.parameters as VolumetricLightPassParameters).densityMultiplier,
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        onChange: (value) => {
            (renderer.volumetricLightPass.parameters as VolumetricLightPassParameters).densityMultiplier = value;
        },
    });
    addSliderDebugger(volumetricLightDebuggerGroup, {
        label: 'jitter size x',
        initialValue: (renderer.volumetricLightPass.parameters as VolumetricLightPassParameters).rayJitterSize.x,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            (renderer.volumetricLightPass.parameters as VolumetricLightPassParameters).rayJitterSize.x = value;
        },
    });
    addSliderDebugger(volumetricLightDebuggerGroup, {
        label: 'jitter size y',
        initialValue: (renderer.volumetricLightPass.parameters as VolumetricLightPassParameters).rayJitterSize.y,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            (renderer.volumetricLightPass.parameters as VolumetricLightPassParameters).rayJitterSize.y = value;
        },
    });

    //
    // fog
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const fogDebuggerGroup = addDebugGroup(debuggerGUI, 'fog', false);

    // fogDebuggerGroup.addToggleDebugger({
    //     label: 'fog pass enabled',
    //     initialValue: renderer.lightShaftPass.enabled,
    //     onChange: (value) => (renderer.lightShaftPass.enabled = value),
    // });

    // return;

    addColorDebugger(fogDebuggerGroup, {
        label: 'fog color',
        initialValue: getColorHexCoord((renderer.fogPass.parameters as FogPassParameters).fogColor),
        onChange: (value) => {
            (renderer.fogPass.parameters as FogPassParameters).fogColor = createColorFromHex(value);
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'strength',
        minValue: 0,
        maxValue: 0.2,
        stepValue: 0.0001,
        initialValue: (renderer.fogPass.parameters as FogPassParameters).fogStrength,
        onChange: (value) => {
            (renderer.fogPass.parameters as FogPassParameters).fogStrength = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'density',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: (renderer.fogPass.parameters as FogPassParameters).fogDensity,
        onChange: (value) => {
            (renderer.fogPass.parameters as FogPassParameters).fogDensity = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'attenuation',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: (renderer.fogPass.parameters as FogPassParameters).fogDensityAttenuation,
        onChange: (value) => {
            (renderer.fogPass.parameters as FogPassParameters).fogDensityAttenuation = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'fog end height',
        minValue: -5,
        maxValue: 5,
        stepValue: 0.0001,
        initialValue: (renderer.fogPass.parameters as FogPassParameters).fogEndHeight,
        onChange: (value) => {
            (renderer.fogPass.parameters as FogPassParameters).fogEndHeight = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'distance fog start',
        minValue: 0,
        maxValue: 300,
        stepValue: 0.0001,
        initialValue: (renderer.fogPass.parameters as FogPassParameters).distanceFogPower,
        onChange: (value) => {
            (renderer.fogPass.parameters as FogPassParameters).distanceFogStart = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'distance fog end',
        minValue: 0,
        maxValue: 300,
        stepValue: 0.0001,
        initialValue: (renderer.fogPass.parameters as FogPassParameters).distanceFogEnd,
        onChange: (value) => {
            (renderer.fogPass.parameters as FogPassParameters).distanceFogEnd = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'distance fog power',
        minValue: 0,
        maxValue: 0.2,
        stepValue: 0.0001,
        initialValue: (renderer.fogPass.parameters as FogPassParameters).distanceFogPower,
        onChange: (value) => {
            (renderer.fogPass.parameters as FogPassParameters).distanceFogPower = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'sss fog rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: (renderer.fogPass.parameters as FogPassParameters).sssFogRate,
        onChange: (value) => {
            (renderer.fogPass.parameters as FogPassParameters).sssFogRate = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: (renderer.fogPass.parameters as FogPassParameters).blendRate,
        onChange: (value) => {
            (renderer.fogPass.parameters as FogPassParameters).blendRate = value;
        },
    });

    //
    // depth of field
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const dofDebuggerGroup = addDebugGroup(debuggerGUI, 'depth of field', false);

    addToggleDebugger(dofDebuggerGroup, {
        label: 'DoF pass enabled',
        initialValue: renderer.depthOfFieldPass.enabled,
        onChange: (value) => (renderer.depthOfFieldPass.enabled = value),
    });

    addSliderDebugger(dofDebuggerGroup, {
        label: 'DoF focus distance',
        minValue: 0.1,
        maxValue: 100,
        stepValue: 0.001,
        initialValue: (renderer.depthOfFieldPass.parameters as DepthOfFieldPassParameters).focusDistance,
        onChange: (value) => {
            (renderer.depthOfFieldPass.parameters as DepthOfFieldPassParameters).focusDistance = value;
        },
    });

    addSliderDebugger(dofDebuggerGroup, {
        label: 'DoF focus range',
        minValue: 0.1,
        maxValue: 20,
        stepValue: 0.001,
        initialValue: (renderer.depthOfFieldPass.parameters as DepthOfFieldPassParameters).focusRange,
        onChange: (value) => {
            (renderer.depthOfFieldPass.parameters as DepthOfFieldPassParameters).focusRange = value;
        },
    });

    addSliderDebugger(dofDebuggerGroup, {
        label: 'DoF bokeh radius',
        minValue: 0.01,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: (renderer.depthOfFieldPass.parameters as DepthOfFieldPassParameters).bokehRadius,
        onChange: (value) => {
            (renderer.depthOfFieldPass.parameters as DepthOfFieldPassParameters).bokehRadius = value;
        },
    });

    //
    // bloom
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const bloomDebuggerGroup = addDebugGroup(debuggerGUI, 'bloom', false);

    addToggleDebugger(bloomDebuggerGroup, {
        label: 'Bloom pass enabled',
        initialValue: renderer.bloomPass.parameters.enabled,
        onChange: (value) => (renderer.bloomPass.parameters.enabled = value),
    });

    addSliderDebugger(bloomDebuggerGroup, {
        label: 'bloom amount',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: (renderer.bloomPass.parameters as BloomPassParameters).bloomAmount,
        onChange: (value) => {
            (renderer.bloomPass.parameters as BloomPassParameters).bloomAmount = value;
        },
    });

    addSliderDebugger(bloomDebuggerGroup, {
        label: 'bloom threshold',
        minValue: 0,
        maxValue: 2,
        stepValue: 0.001,
        initialValue: (renderer.bloomPass.parameters as BloomPassParameters).threshold,
        onChange: (value) => {
            (renderer.bloomPass.parameters as BloomPassParameters).threshold = value;
        },
    });

    addSliderDebugger(bloomDebuggerGroup, {
        label: 'bloom tone',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: (renderer.bloomPass.parameters as BloomPassParameters).tone,
        onChange: (value) => {
            (renderer.bloomPass.parameters as BloomPassParameters).tone = value;
        },
    });

    //
    // ssr debuggers
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const ssrDebuggerGroup = addDebugGroup(debuggerGUI, 'ssr', false);

    addToggleDebugger(debuggerGUI, {
        label: 'ssr pass enabled',
        initialValue: renderer.ssrPass.parameters.enabled,
        onChange: (value) => (renderer.ssrPass.parameters.enabled = value),
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'depth bias',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: (renderer.ssrPass.parameters as SSRPassParameters).rayDepthBias,
        onChange: (value) => {
            (renderer.ssrPass.parameters as SSRPassParameters).rayDepthBias = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'ray nearest distance',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: (renderer.ssrPass.parameters as SSRPassParameters).rayNearestDistance,
        onChange: (value) => {
            (renderer.ssrPass.parameters as SSRPassParameters).rayNearestDistance = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'ray max distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: (renderer.ssrPass.parameters as SSRPassParameters).rayMaxDistance,
        onChange: (value) => {
            (renderer.ssrPass.parameters as SSRPassParameters).rayMaxDistance = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'ray thickness',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: (renderer.ssrPass.parameters as SSRPassParameters).reflectionRayThickness,
        onChange: (value) => {
            (renderer.ssrPass.parameters as SSRPassParameters).reflectionRayThickness = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'jitter size x',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: (renderer.ssrPass.parameters as SSRPassParameters).reflectionRayJitterSizeX,
        onChange: (value) => {
            (renderer.ssrPass.parameters as SSRPassParameters).reflectionRayJitterSizeX = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'jitter size y',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: (renderer.ssrPass.parameters as SSRPassParameters).reflectionRayJitterSizeY,
        onChange: (value) => {
            (renderer.ssrPass.parameters as SSRPassParameters).reflectionRayJitterSizeY = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'fade min distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: (renderer.ssrPass.parameters as SSRPassParameters).reflectionFadeMinDistance,
        onChange: (value) => {
            (renderer.ssrPass.parameters as SSRPassParameters).reflectionFadeMinDistance = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'fade max distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: (renderer.ssrPass.parameters as SSRPassParameters).reflectionFadeMaxDistance,
        onChange: (value) => {
            (renderer.ssrPass.parameters as SSRPassParameters).reflectionFadeMaxDistance = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'edge fade factor min x',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: (renderer.ssrPass.parameters as SSRPassParameters).reflectionScreenEdgeFadeFactorMinX,
        onChange: (value) => {
            (renderer.ssrPass.parameters as SSRPassParameters).reflectionScreenEdgeFadeFactorMinX = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'edge fade factor max x',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: (renderer.ssrPass.parameters as SSRPassParameters).reflectionScreenEdgeFadeFactorMaxX,
        onChange: (value) => {
            (renderer.ssrPass.parameters as SSRPassParameters).reflectionScreenEdgeFadeFactorMaxX = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'edge fade factor min y',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: (renderer.ssrPass.parameters as SSRPassParameters).reflectionScreenEdgeFadeFactorMinY,
        onChange: (value) => {
            (renderer.ssrPass.parameters as SSRPassParameters).reflectionScreenEdgeFadeFactorMinY = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'edge fade factor max y',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: (renderer.ssrPass.parameters as SSRPassParameters).reflectionScreenEdgeFadeFactorMaxY,
        onChange: (value) => {
            (renderer.ssrPass.parameters as SSRPassParameters).reflectionScreenEdgeFadeFactorMaxY = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'additional rate',
        minValue: 0.01,
        maxValue: 1,
        stepValue: 0.01,
        initialValue: (renderer.ssrPass.parameters as SSRPassParameters).reflectionAdditionalRate,
        onChange: (value) => {
            (renderer.ssrPass.parameters as SSRPassParameters).reflectionAdditionalRate = value;
        },
    });

    // debuggerGUI.addSliderDebugger({
    //     label: 'ssr blend rate',
    //     minValue: 0,
    //     maxValue: 1,
    //     stepValue: 0.001,
    //     initialValue: renderer.ssrPass.blendRate,
    //     onChange: (value) => {
    //         renderer.ssrPass.blendRate = value;
    //     },
    // });

    //
    // add debugger ui
    //

    wrapperElement.appendChild(debuggerGUI.rootElement);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
