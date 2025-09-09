import { Actor, subscribeActorOnStart, subscribeActorOnUpdate } from '@/PaleGL/actors/actor.ts';
import { setCameraClearColor, setCameraPostProcess } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { setOrthoSize } from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import { createPerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera.ts';
import { createDirectionalLight } from '@/PaleGL/actors/lights/directionalLight.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { createObjectSpaceRaymarchMesh } from '@/PaleGL/actors/meshes/objectSpaceRaymarchMesh.ts';
import { createSkybox } from '@/PaleGL/actors/meshes/skybox.ts';
import {
    ActorTypes,
    BlendTypes,
    DepthFuncTypes,
    FaceSide, FragmentShaderModifierPragmas,
    RenderQueueType,
    RenderTargetTypes,
    TextureDepthPrecisionType,
    UniformNames,
    // FragmentShaderModifierPragmas,
    UniformTypes,
} from '@/PaleGL/constants';
import { CubeMap } from '@/PaleGL/core/cubeMap.ts';
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
import { createGPU } from '@/PaleGL/core/gpu';
import {
    createOrbitCameraController,
    fixedUpdateOrbitCameraController,
    setOrbitCameraControllerDelta,
    startOrbitCameraController,
} from '@/PaleGL/core/orbitCameraController';
import { createRenderer, renderRenderer } from '@/PaleGL/core/renderer';
import { createRenderTarget } from '@/PaleGL/core/renderTarget';
import { addActorToScene, createScene } from '@/PaleGL/core/scene';
import { setLookAtPosition, setScaling, setTranslation } from '@/PaleGL/core/transform.ts';
import { setUniformValue } from '@/PaleGL/core/uniforms.ts';
import {
    setInputControllerSize,
    startInputController,
    updateInputController,
} from '@/PaleGL/inputs/inputControllerBehaviours.ts';
import { createMouseInputController } from '@/PaleGL/inputs/mouseInputController';
import { createTouchInputController } from '@/PaleGL/inputs/touchInputController';
import { loadCubeMap } from '@/PaleGL/loaders/loadCubeMap';
import { loadGLTF } from '@/PaleGL/loaders/loadGLTF';
import { createColor, createColorBlack, createColorWhite } from '@/PaleGL/math/color';
import { v2o } from '@/PaleGL/math/vector2';
import { createFillVector3, createVector3 } from '@/PaleGL/math/vector3';
import { createVector4 } from '@/PaleGL/math/vector4';
import { createBufferVisualizerPass } from '@/PaleGL/postprocess/bufferVisualizerPass';
import { addPostProcessPass, createPostProcess, setPostProcessEnabled } from '@/PaleGL/postprocess/postProcess.ts';
import { DebuggerGUI } from '@/PaleGL/utilities/debuggerGUI.ts';
import { initDebugger } from 'pages/labs/morph-glass/initDebugger.ts';
// import { createObjectSpaceRaymarchGBufferMaterial } from '@/PaleGL/materials/objectSpaceRaymarchGBufferMaterial.ts';
// import { createObjectSpaceRaymarchUnlitMaterial } from '@/PaleGL/materials/objectSpaceRaymarchUnlitMaterial.ts';
// import {createObjectSpaceRaymarchGBufferMaterial} from "@/PaleGL/materials/objectSpaceRaymarchGBufferMaterial.ts";
import { replaceAllMeshMaterials, setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { createGBufferMaterial } from '@/PaleGL/materials/gBufferMaterial.ts';
import { createObjectSpaceRaymarchGlassMaterial } from '@/PaleGL/materials/objectSpaceRaymarchGlassMaterial.ts';
// import {subscribeShader} from "./watchShader.ts";
// // import {ShaderManager} from "./watchShader.ts";
//
import objectSpaceRaymarchFragContent from './shaders/object-space-raymarch-glass-scene.glsl?raw';
import { getMany, subscribe } from './watchShader.ts';

// import {watchShaders} from "./watchShader.ts";
// watchShaders(() => {});
// if (import.meta.hot) {
//      // prettier-ignore
//     import.meta.hot.accept([
//         './shaders/object-space-raymarch-glass-scene.glsl?raw',
//     ], (mod) => {
//         console.log('hogehoge - onHMR', mod);
//     });
// }

// subscribeShader(["./shaders/object-space-raymarch-glass-scene.glsl?raw"], (newContent) => {
//     console.log("hogehoge - hmr - newContent", newContent);
//     });

// // function watchShaders() {
// //     if (!import.meta.hot) return;
// //
// //     import.meta.hot.on('vite:beforeUpdate', async (payload: any) => {
// //         console.log("hogehoge - vite:beforeUpdate", payload);
// //         // const changedAbs = new Set(
// //         //     (payload?.updates ?? [])
// //         //         .map((u: any) => stripQuery(u.acceptedPath ?? u.path))
// //         //         .filter(Boolean)
// //         // );
// //         // console.log("hogehoge - onHMR", changedAbs);
// //    });
// // }
// //
// // watchShaders();
//
// const shaderManager = new ShaderManager();
// shaderManager.addMany({
//     createStreetFloorActor: {
//         vert: "./shaders/object-space-raymarch-glass-scene.glsl",
//         frag: "./shaders/test.glsl"
//     }
// })
// shaderManager.init();
//
// console.log("hogehoge - shaderManager", shaderManager);

// watchShaders("./shaders/object-space-raymarch-glass-scene.glsl?raw", () => {});

// import { initializeShaderWatcher, loadShader, getWatchedFiles } from './watchShader';
//
//
// async function watchShaders() {
// // 初期化（自動で実行されるが明示的にも可能）
//     await initializeShaderWatcher();
// // 特定のシェーダーファイルを読み込み
// const shaderContent = await loadShader('./shaders/object-space-raymarch-glass-scene.glsl');
//
// // 監視対象ファイル一覧を取得
// const watchedFiles = getWatchedFiles();
//
// console.log('Watched shader files:', watchedFiles);
// }
//
// watchShaders();
//

// export async function reapply() {
//     // 変更後の内容を改めて import（モジュールIDは同じ）
//     const mod = await import('./shaders/object-space-raymarch-glass-scene.glsl?raw');
//     currentFrag = mod.default;
//     // ここで ShaderMaterial 等へ差し替え、needsUpdate = true
// }

// async function watchShader() {
//     // await reapply();
//     // if (import.meta.hot) {
//     //     // import.meta.hot.accept(watchShaderPaths, mods => {
//     //     import.meta.hot.accept(['./shaders/object-space-raymarch-glass-scene.glsl?raw'], mods => {
//     //         console.log("hogehoge - raw", mods)
//     //     });
//     // }
//
//     // 依存登録（devだけでOK）
//     const shaders = import.meta.glob('./shaders/**/*.glsl', {
//         query: '?raw', import: 'default', eager: true
//     });
//     console.log(shaders)
// // ↑ これで *.glsl がこのモジュールの依存になる
//     if (import.meta.hot) {
//         import.meta.hot.accept((mod) => {
//             // // 必要なファイルだけ再 import して差し替え
//             // const content = await import('./shaders/object-space-raymarch-glass-scene.glsl?raw');
//             console.log("hogehoge - raw - hmr", mod);
//             // 反映...
//         });
//     }
// }
//
// watchShader();

// const files = import.meta.glob('./shaders/*.glsl', { as: 'raw' });
// export async function loadShaderFile(path: string) {
//     const load = files[path];
//     if (!load)
//     {
//         throw new Error(`not found: ${path}`);
//     }
//     const res = await load();
//     console.log("fugafuga", res);
// }

// export function watchShaders(paths: string[], onUpdate: () => void) {
//     if (import.meta.hot) {
//         console.log("hogehoge - watchShaders", paths);
//         import.meta.hot.accept(paths, (mod) => {
//             console.log("hogehoge - onHMR", mod);
//             if (onUpdate) {
//                 onUpdate();
//             }
//         })
//     }
// }
//
// watchShaders(watchShaderPaths, (mod) => {
//     // console.log(mod)
// });

// const shaderModules = import.meta.glob('./shaders/**/*.glsl', { as: 'raw' });
//
// async function load(path: string) {
//     const mod = await shaderModules[path]();
//     console.log("hogehoge - load", path);
//     // return mod.default as string;
//     return mod;
// }
//
// async function watchShader () {
//     const files = Object.keys(shaderModules);
//     await Promise.all(files.map(async (file) => load(file)));
//
//     // HMR: glob で得たキーを監視して差し替え
//     if (import.meta.hot) {
//         import.meta.hot.accept(Object.keys(shaderModules),
//              (mod) => {
//             // 変更されたファイルだけ拾ってもOK。簡単のため全部読み直し
//             // await reloadShaders();
//             console.log("hogehoge - onHMR", mod);
//         });
//     }
// }
//
// watchShader();

// -------------------
// constants
// -------------------

const ASSET_DIR = '/labs/morph-glass/assets/';
const MODEL_ASSET_DIR = `${ASSET_DIR}models/`;

//--------------------

// assets
const cubeMapPositiveXImgUrl = './assets/images/skybox/px.png';
const cubeMapNegativeXImgUrl = './assets/images/skybox/nx.png';
const cubeMapPositiveYImgUrl = './assets/images/skybox/py.png';
const cubeMapNegativeYImgUrl = './assets/images/skybox/ny.png';
const cubeMapPositiveZImgUrl = './assets/images/skybox/pz.png';
const cubeMapNegativeZImgUrl = './assets/images/skybox/nz.png';
// const cubeMapPositiveXImgUrl = './assets/images/dummy-skybox/dir-x-plus.png';
// const cubeMapNegativeXImgUrl = './assets/images/dummy-skybox/dir-x-minus.png';
// const cubeMapPositiveYImgUrl = './assets/images/dummy-skybox/dir-y-plus.png';
// const cubeMapNegativeYImgUrl = './assets/images/dummy-skybox/dir-y-minus.png';
// const cubeMapPositiveZImgUrl = './assets/images/dummy-skybox/dir-z-plus.png';
// const cubeMapNegativeZImgUrl = './assets/images/dummy-skybox/dir-z-minus.png';

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
let bgActor: Actor;
let cubeMap: CubeMap;
let objectSpaceRaymarchMesh: Mesh;

const debuggerStates: {
    morphRate: number;
    morphingEnabled: boolean;
} = {
    morphRate: 0,
    morphingEnabled: true,
};

const isSP = !!window.navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i);
const inputController = isSP ? createTouchInputController() : createMouseInputController();
startInputController(inputController);

const wrapperElement = document.createElement('div');
document.body.appendChild(wrapperElement);
wrapperElement.setAttribute('id', 'wrapper');

const canvasElement = document.createElement('canvas');
wrapperElement.appendChild(canvasElement);

const gl = canvasElement.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });

if (!gl) {
    throw new Error('invalid gl');
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

const captureSceneCamera = createPerspectiveCamera(35, 1, 0.1, 200);
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
orbitCameraController.lookAtTarget = createVector3(0, 4.5, 0);

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
    directionalLight.shadowCamera.visibleFrustum = false;
    directionalLight.castShadow = false;
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
    setTranslation(directionalLight.transform, createVector3(-16, 16, -4));
    setLookAtPosition(directionalLight.transform, createVector3(0, 0, 0));
});
addActorToScene(captureScene, directionalLight);

const cameraPostProcess = createPostProcess();

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

const createBgObjActor = async () => {
    const gltfActor = await loadGLTF({ gpu, dir: MODEL_ASSET_DIR, path: 'bg-static.gltf' });
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
        rotationOffset: 0,
        // renderMesh: false,
    });

    addActorToScene(captureScene, skyboxMesh);

    //
    // street floor
    //

    streetFloorActor = await createStreetFloorActor();
    addActorToScene(captureScene, streetFloorActor);
    streetFloorActor.children.forEach((child) => {
        child.enabled = false;
        if (child.type === ActorTypes.Mesh) {
            (child as Mesh).castShadow = true;
        }
    });
    setScaling(streetFloorActor.transform, createFillVector3(1));
    const streetFloorMaterial = (streetFloorActor?.children[0] as Mesh).materials[0];
    setUniformValue(streetFloorMaterial.uniforms, UniformNames.Metallic, 0.5);
    setUniformValue(streetFloorMaterial.uniforms, UniformNames.Roughness, 1);

    //
    // bg actor
    //

    bgActor = await createBgObjActor();
    const bgActorMesh = bgActor.children[0] as Mesh;
    // mesh.castShadow = true;
    bgActorMesh.materials = [
        createGBufferMaterial({
            emissiveColor: createColor(2, 2, 2, 1),
        }),
    ];

    addActorToScene(captureScene, bgActor);
    // setTranslation(bgActor.transform, createVector3(0, .88, 0));
    setTranslation(bgActor.transform, createVector3(0, -6, -20));
    setScaling(bgActor.transform, createFillVector3(8));

    //
    // glass
    //

    const createGlassActor = (objectSpaceRaymarchFragContent: string) => {
        // TODO:
        objectSpaceRaymarchMesh = createObjectSpaceRaymarchMesh({
            name: 'object-space-raymarch-mesh',
            gpu,
            materials: [
                // createObjectSpaceRaymarchGBufferMaterial({
                //     fragmentShaderContent:objectSpaceRaymarchFragContent,
                //     depthFragmentShaderContent: objectSpaceRaymarchFragContent,
                //     metallic: 0,
                //     roughness: 0,
                //     receiveShadow: false,
                //     // faceSide: FaceSide.Back
                //     // renderQueueType: RenderQueueType.AlphaTest,
                //     // alphaTest: 0.5,
                // }),
                createObjectSpaceRaymarchGlassMaterial({
                    // createObjectSpaceRaymarchGBufferMaterial({
                    fragmentShaderContent: objectSpaceRaymarchFragContent,
                    depthFragmentShaderContent: objectSpaceRaymarchFragContent,
                    receiveShadow: false,
                    renderQueueType: RenderQueueType.Transparent,
                    blendType: BlendTypes.Transparent,
                    // renderQueueType: RenderQueueType.AlphaTest,
                    // alphaTest: 0.5,
                    depthTest: true,
                    depthWrite: true,
                    depthFuncType: DepthFuncTypes.Lequal,
                    faceSide: FaceSide.Front,
                    uniforms: [
                        {
                            name: UniformNames.SceneTexture,
                            type: UniformTypes.Texture,
                            value: null,
                        },
                        {
                            name: 'uMorphRate',
                            type: UniformTypes.Float,
                            value: 0,
                        },
                    ],
                    //                 fragmentShaderModifiers: [
                    //                     {
                    //                         pragma: FragmentShaderModifierPragmas.AFTER_OUT,
                    //                         value: `
                    // vec3 eyeToSurface = normalize(vWorldPosition - uViewPosition);
                    // vec2 screenUv = gl_FragCoord.xy / uViewport.xy;
                    // vec4 sceneColor = texture(uSceneTexture, screenUv);
                    // outColor = vec4(sceneColor.xyz * 2., 1.);
                    // `,
                    //                     },
                    //                 ],
                }),
            ],
            castShadow: true,
        });
        subscribeActorOnUpdate(objectSpaceRaymarchMesh, (args) => {
            const { time } = args;
            // console.log(time);
            const morphRate = debuggerStates.morphingEnabled ? time : debuggerStates.morphRate;
            setUniformValueToAllMeshMaterials(objectSpaceRaymarchMesh, 'uMorphRate', morphRate);
        });
        setScaling(objectSpaceRaymarchMesh.transform, createVector3(10, 10, 10));
        setTranslation(objectSpaceRaymarchMesh.transform, createVector3(0, 5, 0));
        // setUseWorldSpaceToObjectSpaceRaymarchMesh(objectSpaceRaymarchMesh, true);

        addActorToScene(captureScene, objectSpaceRaymarchMesh);
    };
    
    const replaceGlassMaterial = (content: string) => {
        replaceAllMeshMaterials(objectSpaceRaymarchMesh, gpu,
            {fragmentShaderModifiers: [
            {
                pragma: FragmentShaderModifierPragmas.RAYMARCH_SCENE,
                value: content,
            }
            ]}
            );
    }

    //
    // events
    //

    // hot reload

    const shaders = ['./shaders/object-space-raymarch-glass-scene.glsl'];
    createGlassActor(getMany(shaders)[shaders[0]])
    subscribe(shaders, (changed) => {
        // console.log('hogehoge - receive', changed, map[shaders[0]]);
        console.log('HMR - update glass shader', changed);
        // replaceGlassMaterial(map[shaders[0]]);
        replaceGlassMaterial(getMany(shaders)[shaders[0]]);
    });

    // main

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

        // renderer.depthOfFieldPass.enabled = false;
        renderer.depthOfFieldPass.focusDistance = 18.5;
        renderer.depthOfFieldPass.focusRange = 17;

        renderer.fogPass.fogColor = createColorBlack();
        renderer.fogPass.fogDensity = 0.001;
        renderer.fogPass.fogDensityAttenuation = 0.001;
        renderer.fogPass.distanceFogStart = 1000;
        renderer.fogPass.distanceFogEnd = 1000;
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

        renderer.vignettePass.vignetteRadiusTo = 5;

        startOrbitCameraController(orbitCameraController);
    });

    setOnBeforeUpdateEngine(engine, () => {
        if (!debuggerGUI) {
            debuggerGUI = initDebugger(wrapperElement, {
                debuggerStates,
                renderer,
                orbitCameraController,
                bufferVisualizerPass,
                directionalLight,
                // objectSpaceRaymarchMesh,
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
