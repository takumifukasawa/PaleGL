import {
    createEngine,
    runEngine,
    setEngineSize,
    setOnBeforeStartEngine,
    setOnBeforeUpdateEngine,
    setOnRenderEngine,
    setSceneToEngine,
    startEngine,
} from '@/PaleGL/core/engine';
import { createRenderer, renderRenderer } from '@/PaleGL/core/renderer';
import { createGPU } from '@/PaleGL/core/gpu';
import { createRenderTarget } from '@/PaleGL/core/renderTarget';
import { addActorToScene, createScene } from '@/PaleGL/core/scene';
import {
    createOrbitCameraController,
    fixedUpdateOrbitCameraController,
    setOrbitCameraControllerDelta,
    startOrbitCameraController,
} from '@/PaleGL/core/orbitCameraController';
import { loadCubeMap } from '@/PaleGL/loaders/loadCubeMap';
import { loadGLTF } from '@/PaleGL/loaders/loadGLTF';
import { createColorBlack, createColorWhite } from '@/PaleGL/math/color';
import { v2o } from '@/PaleGL/math/vector2';
import { createFillVector3, createVector3 } from '@/PaleGL/math/vector3';
import { createVector4 } from '@/PaleGL/math/vector4';
import {
    createBufferVisualizerPass,
} from '@/PaleGL/postprocess/bufferVisualizerPass';
import { createTouchInputController } from '@/PaleGL/inputs/touchInputController';
import { createMouseInputController } from '@/PaleGL/inputs/mouseInputController';
import {
    RenderTargetTypes,
    UniformNames,
    TextureDepthPrecisionType,
    ActorTypes,
    // RenderQueueType,
} from '@/PaleGL/constants';
import { addPostProcessPass, createPostProcess, setPostProcessEnabled } from '@/PaleGL/postprocess/postProcess.ts';
import { Actor, subscribeActorOnStart } from '@/PaleGL/actors/actor.ts';
import {
    setInputControllerSize,
    startInputController,
    updateInputController,
} from '@/PaleGL/inputs/inputControllerBehaviours.ts';
import { createPerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera.ts';
import { setCameraClearColor, setCameraPostProcess } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { createDirectionalLight } from '@/PaleGL/actors/lights/directionalLight.ts';
import { setLookAtPosition, setScaling, setTranslation } from '@/PaleGL/core/transform.ts';
import { setUniformValue } from '@/PaleGL/core/uniforms.ts';
import { createSkybox } from '@/PaleGL/actors/meshes/skybox.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import {
    DebuggerGUI,
} from '@/PaleGL/utilities/debuggerGUI.ts';
import { CubeMap } from '@/PaleGL/core/cubeMap.ts';
import { createObjectSpaceRaymarchMesh } from '@/PaleGL/actors/meshes/objectSpaceRaymarchMesh.ts';
import litObjectSpaceRaymarchFragContent from '../sandbox/shaders/object-space-raymarch-test-scene.glsl';
import { setOrthoSize } from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import { OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { initDebugger } from 'pages/labs/morph-glass/initDebugger.ts';

// -------------------
// constants
// -------------------

const ASSET_DIR = '/labs/street-light/assets/';
const MODEL_ASSET_DIR = `${ASSET_DIR}/models/`;

//--------------------

// assets
const cubeMapPositiveXImgUrl = './assets/images/laufenurg_church/px.jpg';
const cubeMapNegativeXImgUrl = './assets/images/laufenurg_church/nx.jpg';
const cubeMapPositiveYImgUrl = './assets/images/laufenurg_church/py.jpg';
const cubeMapNegativeYImgUrl = './assets/images/laufenurg_church/ny.jpg';
const cubeMapPositiveZImgUrl = './assets/images/laufenurg_church/pz.jpg';
const cubeMapNegativeZImgUrl = './assets/images/laufenurg_church/nz.jpg';

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

let debuggerGUI: DebuggerGUI;
let width: number, height: number;
let streetFloorActor: Actor;
let cubeMap: CubeMap;
let objectSpaceRaymarchMesh: Mesh;

const isSP = !!window.navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i);
const inputController = isSP ? createTouchInputController() : createMouseInputController();
startInputController(inputController);

const wrapperElement = document.createElement('div');
document.body.appendChild(wrapperElement);
wrapperElement.setAttribute('id', 'wrapper');

const canvasElement = document.createElement('canvas')!;
wrapperElement.appendChild(canvasElement);

const gl = canvasElement.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });

if (!gl) {
    throw 'invalid gl';
}

const gpu = createGPU(gl);

const captureScene = createScene();

const pixelRatio = Math.min(window.devicePixelRatio, 1.5);

const renderer = createRenderer({
    gpu,
    canvas: canvasElement,
    pixelRatio,
});

const engine = createEngine({ gpu, renderer, showStats: true, showPipeline: true });

setSceneToEngine(engine, captureScene);

const captureSceneCamera = createPerspectiveCamera(50, 1, 0.1, 50);
addActorToScene(captureScene, captureSceneCamera);

const orbitCameraController = createOrbitCameraController(captureSceneCamera);
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
orbitCameraController.lookAtTarget = createVector3(0, 2, 0);

subscribeActorOnStart(captureSceneCamera, () => {
    setCameraClearColor(captureSceneCamera, createVector4(0, 0, 0, 1));
});
captureSceneCamera.onFixedUpdate = () => {
    // 1: fixed position
    // actor.transform.position = new Vector3(-7 * 1.1, 4.5 * 1.4, 11 * 1.2);

    // 2: orbit controls
    // if (inputController.isDown && debuggerStates.orbitControlsEnabled) {
    if (inputController.isDown && orbitCameraController.enabled) {
        setOrbitCameraControllerDelta(orbitCameraController, v2o(inputController.deltaNormalizedInputPosition));
    }
    fixedUpdateOrbitCameraController(orbitCameraController);
};

const directionalLight = createDirectionalLight({
    intensity: 1,
    color: createColorWhite(),
});

// shadows
// TODO: directional light は constructor で shadow camera を生成してるのでこのガードいらない
if (directionalLight.shadowCamera) {
    directionalLight.shadowCamera.visibleFrustum = true;
    directionalLight.castShadow = true;
    directionalLight.shadowCamera.near = 1;
    directionalLight.shadowCamera.far = 15;
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
    setTranslation(directionalLight.transform, createVector3(-8, 8, -2));
    setLookAtPosition(directionalLight.transform, createVector3(0, 0, 0));
});
addActorToScene(captureScene, directionalLight);

const cameraPostProcess = createPostProcess();

renderer.depthOfFieldPass.focusDistance = 18.5;
renderer.depthOfFieldPass.focusRange = 17;

const bufferVisualizerPass = createBufferVisualizerPass({ gpu });
bufferVisualizerPass.enabled = false;
addPostProcessPass(cameraPostProcess, bufferVisualizerPass);

setPostProcessEnabled(cameraPostProcess, true);
// TODO: set post process いらないかも
setCameraPostProcess(captureSceneCamera, cameraPostProcess);

const createStreetFloorActor = async () => {
    // const gltfActor = await loadGLTF({gpu, path: gltfStreetFloorModelUrl});
    const gltfActor = await loadGLTF({ gpu, dir: MODEL_ASSET_DIR, path: 'street-floor-separete.gltf' });
    return gltfActor;
};

const main = async () => {
    cubeMap = await loadCubeMap(
        gpu,
        cubeMapPositiveXImgUrl,
        cubeMapNegativeXImgUrl,
        cubeMapPositiveYImgUrl,
        cubeMapNegativeYImgUrl,
        cubeMapPositiveZImgUrl,
        cubeMapNegativeZImgUrl
    );

    const skyboxMesh = createSkybox({
        gpu,
        cubeMap,
        baseIntensity: 20,
        specularIntensity: 0.2,
        renderMesh: false,
    });

    //
    // street floor
    //

    streetFloorActor = await createStreetFloorActor();
    addActorToScene(captureScene, streetFloorActor);
    streetFloorActor.children.forEach((child) => {
        if (child.type === ActorTypes.Mesh) {
            (child as Mesh).castShadow = true;
        }
    });
    setScaling(streetFloorActor.transform, createFillVector3(1));
    const streetFloorMaterial = (streetFloorActor?.children[0] as Mesh).materials[0];
    setUniformValue(streetFloorMaterial.uniforms, UniformNames.Metallic, 0.5);
    setUniformValue(streetFloorMaterial.uniforms, UniformNames.Roughness, 1);

    //
    // glass
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
            // renderQueueType: RenderQueueType.AlphaTest,
            // alphaTest: 0.5,
        },
        castShadow: true,
    });
    setScaling(objectSpaceRaymarchMesh.transform, createVector3(10, 10, 10));
    setTranslation(objectSpaceRaymarchMesh.transform, createVector3(0, 3, 0));
    // setUseWorldSpaceToObjectSpaceRaymarchMesh(objectSpaceRaymarchMesh, true);

    addActorToScene(captureScene, skyboxMesh);
    addActorToScene(captureScene, objectSpaceRaymarchMesh);

    // TODO: engine側に移譲したい
    const onWindowResize = () => {
        width = wrapperElement.offsetWidth;
        height = wrapperElement.offsetHeight;
        setInputControllerSize(inputController, width, height);
        setEngineSize(engine, width, height);
    };

    setOnBeforeStartEngine(engine, () => {
        onWindowResize();
        window.addEventListener('resize', onWindowResize);

        renderer.ambientOcclusionPass.enabled = false;

        renderer.lightShaftPass.enabled = false;

        renderer.screenSpaceShadowPass.enabled = false;

        renderer.ssrPass.enabled = false;

        renderer.fogPass.fogColor = createColorBlack();
        renderer.fogPass.fogDensity = 0.023;
        renderer.fogPass.fogDensityAttenuation = 0.065;
        renderer.fogPass.distanceFogStart = 18;
        renderer.fogPass.distanceFogPower = 0.29;
        renderer.fogPass.sssFogRate = 0;

        renderer.depthOfFieldPass.focusDistance = 17.78;
        renderer.depthOfFieldPass.focusRange = 9.8;
        renderer.depthOfFieldPass.bokehRadius = 5.55;

        renderer.bloomPass.bloomAmount = 0.26;
        renderer.bloomPass.threshold = 1.534;
        renderer.bloomPass.tone = 0.46;

        renderer.streakPass.threshold = 0.9;
        renderer.streakPass.verticalScale = 1.12;
        renderer.streakPass.horizontalScale = 1.9;
        renderer.streakPass.intensity = 0.03;

        renderer.glitchPass.enabled = false;

        startOrbitCameraController(orbitCameraController);
    });

    setOnBeforeUpdateEngine(engine, () => {
        if (!debuggerGUI) {
            debuggerGUI = initDebugger(wrapperElement, {
                renderer,
                orbitCameraController,
                bufferVisualizerPass,
                directionalLight,
                objectSpaceRaymarchMesh,
            });
        }
        updateInputController(inputController);
    });

    setOnRenderEngine(engine, (time) => {
        renderRenderer(renderer, captureScene, captureSceneCamera, engine.sharedTextures, { time });
    });

    const tick = (time: number) => {
        runEngine(engine, time);
        requestAnimationFrame(tick);
    };

    startEngine(engine);
    requestAnimationFrame(tick);
};



// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
