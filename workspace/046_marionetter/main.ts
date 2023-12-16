// actors
import { DirectionalLight } from '@/PaleGL/actors/DirectionalLight';
import { Mesh } from '@/PaleGL/actors/Mesh';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera';

// core
import { Engine } from '@/PaleGL/core/Engine';
import { Renderer } from '@/PaleGL/core/Renderer';
import { GPU } from '@/PaleGL/core/GPU';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { Scene } from '@/PaleGL/core/Scene';
// import { Texture } from '@/PaleGL/core/Texture';
import { OrbitCameraController } from '@/PaleGL/core/OrbitCameraController';

// loaders

// materials

// math
import { Color } from '@/PaleGL/math/Color';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Vector4 } from '@/PaleGL/math/Vector4';

// postprocess
import { FXAAPass } from '@/PaleGL/postprocess/FXAAPass';
import { BufferVisualizerPass } from '@/PaleGL/postprocess/BufferVisualizerPass';

// inputs
import { TouchInputController } from '@/PaleGL/inputs/TouchInputController';
import { MouseInputController } from '@/PaleGL/inputs/MouseInputController';

// others
import {
    RenderTargetTypes,
    // TextureFilterTypes, TextureWrapTypes,
} from '@/PaleGL/constants';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import sceneJsonUrl from './assets/data/scene.json';

import { DebuggerGUI } from '@/DebuggerGUI';
import { Camera } from '@/PaleGL/actors/Camera';
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess.ts';
import soundVertexShader from '@/PaleGL/shaders/sound-vertex.glsl';
import { GLSLSound } from '@/PaleGL/core/GLSLSound.ts';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry.ts';
import { GBufferMaterial } from '@/PaleGL/materials/GBufferMaterial.ts';
import { wait } from '@/utilities/wait.ts';
import { BoxGeometry } from '@/PaleGL/geometries/BoxGeometry.ts';
import {
    buildMarionetterTimeline,
    MarionetterPlayableDirectorComponentInfo,
    MarionetterScene, MarionetterTimeline,
} from '@/Marionetter/createTrackBinder.ts';
// import {loadImg} from "@/PaleGL/loaders/loadImg.ts";
// import {Texture} from "@/PaleGL/core/Texture.ts";

// import { hoge } from '@/externals/test.js';
// console.log(hoge());

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
let floorPlaneMesh: Mesh;
let glslSound: GLSLSound;
// let marionetter: Marionetter;

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

const captureScene = new Scene();

const pixelRatio = Math.min(window.devicePixelRatio, 1.5);

const renderer = new Renderer({
    gpu,
    canvas: canvasElement,
    pixelRatio,
});

const engine = new Engine({ gpu, renderer });

// engine.setScenes([captureScene, compositeScene]);
engine.setScene(captureScene);

// const captureSceneCamera = new PerspectiveCamera(60, 1, 0.1, 70);
const captureSceneCamera = new PerspectiveCamera(70, 1, 0.1, 50);
captureScene.add(captureSceneCamera);
// captureScene.mainCamera = captureSceneCamera;
captureSceneCamera.mainCamera = true;

const orbitCameraController = new OrbitCameraController(captureSceneCamera);

captureSceneCamera.onStart = ({ actor }) => {
    (actor as Camera).setClearColor(new Vector4(0, 0, 0, 1));
};
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
    name: "DirectionalLight",
    intensity: 1.2,
    // color: Color.fromRGB(255, 210, 200),
    color: Color.white,
});
// shadows
// TODO: directional light は constructor で shadow camera を生成してるのでこのガードいらない
if (directionalLight.shadowCamera) {
    // directionalLight.shadowCamera.visibleFrustum = true;
    directionalLight.castShadow = true;
    directionalLight.shadowCamera.near = 1;
    directionalLight.shadowCamera.far = 30;
    (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -12, 12, -12, 12);
    // (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -5, 5, -5, 5);
    // (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -7, 7, -7, 7);
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

const cameraPostProcess = new PostProcess();

const fxaaPass = new FXAAPass({ gpu });
cameraPostProcess.addPass(fxaaPass);

const bufferVisualizerPass = new BufferVisualizerPass({ gpu });
bufferVisualizerPass.enabled = false;
cameraPostProcess.addPass(bufferVisualizerPass);
bufferVisualizerPass.beforeRender = () => {
    bufferVisualizerPass.material.uniforms.setValue(
        'uDirectionalLightShadowMap',
        directionalLight.shadowMap!.read.depthTexture
    );
    bufferVisualizerPass.material.uniforms.setValue(
        'uAmbientOcclusionTexture',
        renderer.ambientOcclusionPass.renderTarget.read.texture
    );
    bufferVisualizerPass.material.uniforms.setValue(
        'uDeferredShadingTexture',
        renderer.deferredShadingPass.renderTarget.read.texture
    );
    bufferVisualizerPass.material.uniforms.setValue(
        'uLightShaftTexture',
        renderer.lightShaftPass.renderTarget.read.texture
    );
    bufferVisualizerPass.material.uniforms.setValue('uFogTexture', renderer.fogPass.renderTarget.read.texture);
};

cameraPostProcess.enabled = true;
// TODO: set post process いらないかも
captureSceneCamera.setPostProcess(cameraPostProcess);

/**
 *
 */
const createSound = () => {
    const vertexShader = soundVertexShader;

    glslSound = new GLSLSound({
        gpu,
        vertexShader,
        duration: 180,
    });
};

// const createMarionetter = () => {
//     marionetter = new Marionetter(8080);
//     console.log("marionetter", marionetter);
// };

let centralCube: Mesh | null = null;

const appendTrackCube = () => {
    const geometry = new BoxGeometry({ gpu });
    const material = new GBufferMaterial({});
    const mesh = new Mesh({
        name: "CubeConnector",
        geometry,
        material,
        castShadow: true,
    });
    captureScene.add(mesh);
    centralCube = mesh;
};

function createFloorPlaneMesh() {
    const floorGeometry = new PlaneGeometry({
        gpu,
        calculateTangent: true,
        calculateBinormal: true,
    });

    // const floorDiffuseImg = await loadImg(leaveDiffuseImgUrl);
    // const floorDiffuseMap = new Texture({
    //     gpu,
    //     img: floorDiffuseImg,
    //     // mipmap: true,
    //     wrapS: TextureWrapTypes.Repeat,
    //     wrapT: TextureWrapTypes.Repeat,
    //     minFilter: TextureFilterTypes.Linear,
    //     magFilter: TextureFilterTypes.Linear,
    // });

    // const floorNormalImg = await loadImg(leaveNormalImgUrl);
    // const floorNormalMap = new Texture({
    //     gpu,
    //     img: floorNormalImg,
    //     // mipmap: true,
    //     wrapS: TextureWrapTypes.Repeat,
    //     wrapT: TextureWrapTypes.Repeat,
    //     minFilter: TextureFilterTypes.Linear,
    //     magFilter: TextureFilterTypes.Linear,
    // });

    floorPlaneMesh = new Mesh({
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
        material: new GBufferMaterial({
            // diffuseMap: floorDiffuseMap,
            // normalMap: floorNormalMap,
            diffuseColor: new Color(0.4, 0.4, 0.5, 1),
            receiveShadow: true,
            metallic: 0.5,
            roughness: 0.5,
        }),
        castShadow: false,
    });
    floorPlaneMesh.onStart = ({ actor }) => {
        actor.transform.setScaling(Vector3.fill(10));
        actor.transform.setRotationX(-90);
    };

    return floorPlaneMesh;
}

let marionetterTimeline: MarionetterTimeline | null;

const fetchAndParseScene = () => {
    const sceneJson = sceneJsonUrl as unknown as MarionetterScene;
    console.log('scene json', sceneJson);
    const playableDirectorComponentInfo = sceneJson.objects[0].components[0] as MarionetterPlayableDirectorComponentInfo;
    marionetterTimeline = buildMarionetterTimeline(captureScene, playableDirectorComponentInfo);
};

const main = async () => {

    createSound();
    // createMarionetter();
    appendTrackCube();

    await wait(0);

    floorPlaneMesh = createFloorPlaneMesh();

    captureScene.add(floorPlaneMesh);

    fetchAndParseScene();

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

        orbitCameraController.distance = isSP ? 20 : 20;
        orbitCameraController.attenuation = 0.01;
        orbitCameraController.dampingFactor = 0.2;
        orbitCameraController.azimuthSpeed = 100;
        orbitCameraController.altitudeSpeed = 100;
        orbitCameraController.deltaAzimuthPower = 2;
        orbitCameraController.deltaAltitudePower = 2;
        orbitCameraController.lookAtTarget = new Vector3(0, -2, 0);
        orbitCameraController.start(0, -40);
        // orbitCameraController.enabled = false;
    };

    // engine.onAfterStart = () => {
    //     window.setTimeout(() => {
    //         onWindowResize()
    //     },1000)
    // }

    engine.onBeforeUpdate = () => {
        if (!debuggerGUI) initDebugger();
        inputController.update();
    };

    // engine.onBeforeFixedUpdate = () => {
    //     // inputController.fixedUpdate();
    // };

    engine.onRender = (time) => {
        if (marionetterTimeline !== null && centralCube !== null) {
            marionetterTimeline.execute(time);
            // const tracks = playableDirector.tracks;
            // const t = time % playableDirector.duration;
            // const centralCubeTrackBinder = createMarionetterTrackBinder(tracks[0].animationClips, t);
            // if(centralCubeTrackBinder?.type === "AnimationTrack") {
            //     centralCubeTrackBinder.assignProperty(centralCube);
            // }
            // const lightTrackBinder = createMarionetterTrackBinder(tracks[1].animationClips, t);
            // if(lightTrackBinder?.type === "LightControlTrack") {
            //     lightTrackBinder.assignProperty(directionalLight);
            // }
        }

        renderer.render(captureScene, captureSceneCamera, { time });
    };

    const tick = (time: number) => {
        engine.run(time);
        // renderer.render(captureScene, captureSceneCamera, { time });
        requestAnimationFrame(tick);
    };

    engine.start();
    requestAnimationFrame(tick);
};

function initDebugger() {
    debuggerGUI = new DebuggerGUI();

    //
    // play sound
    //

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addButtonDebugger({
        buttonLabel: 'play sound',
        onClick: () => {
            if (glslSound) {
                glslSound.play();
            }
        },
    });

    //
    // orbit controls
    //

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: 'orbit controls enabled',
        // initialValue: debuggerStates.orbitControlsEnabled,
        // onChange: (value) => (debuggerStates.orbitControlsEnabled = value),
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
        onChange: (value) => (bufferVisualizerPass.enabled = value),
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
    // ssao
    // TODO: ssao pass の参照を renderer に変える
    //

    debuggerGUI.addBorderSpacer();

    const ssaoDebuggerGroup = debuggerGUI.addGroup('ssao', false);

    ssaoDebuggerGroup.addToggleDebugger({
        label: 'ssao pass enabled',
        initialValue: renderer.ambientOcclusionPass.enabled,
        onChange: (value) => (renderer.ambientOcclusionPass.enabled = value),
    });

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

    const lightShaftDebuggerGroup = debuggerGUI.addGroup('light shaft');

    lightShaftDebuggerGroup.addToggleDebugger({
        label: 'light shaft pass enabled',
        initialValue: renderer.lightShaftPass.enabled,
        onChange: (value) => (renderer.lightShaftPass.enabled = value),
    });

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
    // light shaft
    //

    debuggerGUI.addBorderSpacer();

    const fogDebuggerGroup = debuggerGUI.addGroup('fog');

    // fogDebuggerGroup.addToggleDebugger({
    //     label: 'fog pass enabled',
    //     initialValue: renderer.lightShaftPass.enabled,
    //     onChange: (value) => (renderer.lightShaftPass.enabled = value),
    // });

    // fogDebuggerGroup.addSliderDebugger({
    //     label: 'strength',
    //     minValue: 0,
    //     maxValue: 0.2,
    //     stepValue: 0.0001,
    //     initialValue: renderer.fogPass.fogStrength,
    //     onChange: (value) => {
    //         renderer.fogPass.fogStrength = value;
    //     },
    // });

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

    // fogDebuggerGroup.addSliderDebugger({
    //     label: 'fog end height',
    //     minValue: -5,
    //     maxValue: 5,
    //     stepValue: 0.0001,
    //     initialValue: renderer.fogPass.fogEndHeight,
    //     onChange: (value) => {
    //         renderer.fogPass.fogEndHeight = value;
    //     },
    // });

    //
    // depth of field
    //

    debuggerGUI.addBorderSpacer();

    const dofDebuggerGroup = debuggerGUI.addGroup('depth of field', false);

    dofDebuggerGroup.addToggleDebugger({
        label: 'DoF pass enabled',
        initialValue: renderer.depthOfFieldPass.enabled,
        onChange: (value) => (renderer.depthOfFieldPass.enabled = value),
    });

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
        maxValue: 20,
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

    bloomDebuggerGroup.addToggleDebugger({
        label: 'Bloom pass enabled',
        initialValue: renderer.bloomPass.enabled,
        onChange: (value) => (renderer.bloomPass.enabled = value),
    });

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
        maxValue: 2,
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
    // ssr debuggers
    //

    debuggerGUI.addBorderSpacer();

    const ssrDebuggerGroup = debuggerGUI.addGroup('ssr', false);

    ssrDebuggerGroup.addToggleDebugger({
        label: 'ssr pass enabled',
        initialValue: renderer.ssrPass.enabled,
        onChange: (value) => (renderer.ssrPass.enabled = value),
    });

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
    // fxaa
    //

    debuggerGUI.addBorderSpacer();

    const fxaaDebuggerGroup = debuggerGUI.addGroup('fxaa', false);

    fxaaDebuggerGroup.addToggleDebugger({
        label: 'fxaa pass enabled',
        initialValue: fxaaPass.enabled,
        onChange: (value) => (fxaaPass.enabled = value),
    });

    //
    // add debugger ui
    //

    wrapperElement.appendChild(debuggerGUI.domElement);
}

// console.log(import.meta.env);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
