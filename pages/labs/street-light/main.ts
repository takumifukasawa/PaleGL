import { PerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera';
import { SkinnedMesh } from '@/PaleGL/actors/meshes/skinnedMesh';
import { createEngine } from '@/PaleGL/core/engine';
import { createRenderer, renderRenderer } from '@/PaleGL/core/renderer';
import { bindGPUUniformBlockAndGetBlockIndex, createGPU, updateGPUTransformFeedback } from '@/PaleGL/core/gpu';
import { createRenderTarget } from '@/PaleGL/core/renderTarget';
import { addActorToScene, createScene } from '@/PaleGL/core/scene';
import { createRotator } from '@/PaleGL/math/rotator';
import { createTexture } from '@/PaleGL/core/texture';
import {
    createOrbitCameraController,
    fixedUpdateOrbitCameraController,
    setOrbitCameraControllerDelta,
    startOrbitCameraController,
} from '@/PaleGL/core/orbitCameraController';
import { createGeometry } from '@/PaleGL/geometries/geometry';
import { loadCubeMap } from '@/PaleGL/loaders/loadCubeMap';
import { loadGLTF } from '@/PaleGL/loaders/loadGLTF';
import { loadImg } from '@/PaleGL/loaders/loadImg';
import { createMaterial, Material } from '@/PaleGL/materials/material';
import {
    createColor,
    createColorBlack,
    createColorFromHex,
    createColorFromRGB,
    createColorWhite,
    getColorHexCoord,
} from '@/PaleGL/math/color';
import { createVector2, createVector2Zero, v2o, v2x, v2y } from '@/PaleGL/math/vector2';
import {
    addVector3Array,
    createFillVector3,
    createVector3,
    createVector3Up,
    createVector3Zero,
    setV3x,
    setV3y,
    setV3z,
    v3x,
    v3y,
    v3z,
} from '@/PaleGL/math/vector3';
import { createVector4 } from '@/PaleGL/math/vector4';
import {
    createBufferVisualizerPass,
    hideBufferVisualizerPassDom,
    showBufferVisualizerPassDom,
} from '@/PaleGL/postprocess/bufferVisualizerPass';
import { createTouchInputController } from '@/PaleGL/inputs/touchInputController';
import { createMouseInputController } from '@/PaleGL/inputs/mouseInputController';
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
    RAD_TO_DEG, FragmentShaderModifierPragmas,
} from '@/PaleGL/constants';
import { createAttribute } from '@/PaleGL/core/attribute';
import { createGBufferMaterial } from '@/PaleGL/materials/gBufferMaterial';
import { addPostProcessPass, createPostProcess, setPostProcessEnabled } from '@/PaleGL/postprocess/postProcess.ts';
import {
    createTransformFeedbackDoubleBuffer,
    getReadTransformFeedbackDoubleBuffer,
    getWriteTransformFeedbackDoubleBuffer,
    swapTransformFeedbackDoubleBuffer,
} from '@/PaleGL/core/transformFeedbackDoubleBuffer';
import { maton } from '@/PaleGL/utilities/maton';
import { clamp, saturate } from '@/PaleGL/utilities/mathUtilities.ts';
import { createUnlitMaterial } from '@/PaleGL/materials/unlitMaterial.ts';
import { Actor, subscribeActorOnStart } from '@/PaleGL/actors/actor.ts';

import { createPlane, intersectRayWithPlane } from '@/PaleGL/math/plane.ts';
import { createQuaternionFromEulerDegrees } from '@/PaleGL/math/quaternion.ts';
import {
    setInputControllerSize,
    startInputController,
    updateInputController,
} from '@/PaleGL/inputs/inputControllerBehaviours.ts';
import { createPerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera.ts';
import { setCameraClearColor, setCameraPostProcess, viewpointToRay } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { createDirectionalLight } from '@/PaleGL/actors/lights/directionalLight.ts';
// import { setOrthoSize } from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import { setLookAtPosition, setScaling, setTranslation } from '@/PaleGL/core/transform.ts';
import { createSpotLight, SpotLight } from '@/PaleGL/actors/lights/spotLight.ts';
import { addUniformBlock, setUniformValue } from '@/PaleGL/core/uniforms.ts';
import { setAnimationClips } from '@/PaleGL/actors/meshes/skinnedMesh.ts';
import { getAnimatorAnimationClips } from '@/PaleGL/core/animator.ts';
import { setGeometryAttribute } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { setMeshMaterial } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import {
    findVertexArrayObjectVertexBufferObjectBuffer,
    replaceVertexArrayObjectBuffer,
} from '@/PaleGL/core/vertexArrayObject.ts';
import { createSkybox } from '@/PaleGL/actors/meshes/skybox.ts';
import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import {
    addColorDebugger,
    addDebuggerBorderSpacer,
    addDebugGroup,
    addSliderDebugger,
    addToggleDebugger,
    createDebuggerGUI,
    DebuggerGUI,
} from '@/PaleGL/utilities/debuggerGUI.ts';
import { CubeMap } from '@/PaleGL/core/cubeMap.ts';
// import { OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import { setPerspectiveSize } from '@/PaleGL/actors/cameras/perspectiveCameraBehaviour.ts';

// -------------------
// constants
// -------------------

const MAX_INSTANCE_NUM = 2048;
const INITIAL_INSTANCE_NUM = 64;

const ASSET_DIR = '/labs/street-light/assets/';
const MODEL_ASSET_DIR = `${ASSET_DIR}/models/`;

//--------------------

// assets
const smokeImgUrl = './assets/images/particle-smoke.png';
const cubeMapPositiveXImgUrl = './assets/images/laufenurg_church/px.jpg';
const cubeMapNegativeXImgUrl = './assets/images/laufenurg_church/nx.jpg';
const cubeMapPositiveYImgUrl = './assets/images/laufenurg_church/py.jpg';
const cubeMapNegativeYImgUrl = './assets/images/laufenurg_church/ny.jpg';
const cubeMapPositiveZImgUrl = './assets/images/laufenurg_church/pz.jpg';
const cubeMapNegativeZImgUrl = './assets/images/laufenurg_church/nz.jpg';

//--------------------

const createSpotLightDebugger = (spotLight: SpotLight, label: string) => {
    addDebuggerBorderSpacer(debuggerGUI);

    const spotLightDebuggerGroup = addDebugGroup(debuggerGUI, label, false);

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
        initialValue: v3x(spotLight.transform.position),
        onChange: (value) => {
            setV3x(spotLight.transform.position, value);
        },
    });

    addSliderDebugger(spotLightDebuggerGroup, {
        label: 'pos y',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: v3y(spotLight.transform.position),
        onChange: (value) => {
            setV3y(spotLight.transform.position, value);
        },
    });

    addSliderDebugger(spotLightDebuggerGroup, {
        label: 'pos z',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: v3z(spotLight.transform.position),
        onChange: (value) => {
            setV3z(spotLight.transform.position, value);
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
let cubeMap: CubeMap;

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

const pixelRatio = Math.min(window.devicePixelRatio, 1);

const renderer = createRenderer({
    gpu,
    canvas: canvasElement,
    pixelRatio,
});

const engine = createEngine({ gpu, renderer, showStats: true });

engine.setScene(captureScene);

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
orbitCameraController.lookAtTarget = createVector3(0, 3, 0);

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
    intensity: 0.1,
    color: createColorWhite(),
});

// // shadows
// // TODO: directional light は constructor で shadow camera を生成してるのでこのガードいらない
// if (directionalLight.shadowCamera) {
//     directionalLight.shadowCamera.visibleFrustum = false;
//     directionalLight.castShadow = true;
//     directionalLight.shadowCamera.near = 1;
//     directionalLight.shadowCamera.far = 15;
//     setOrthoSize(directionalLight.shadowCamera as OrthographicCamera, null, null, -7, 7, -7, 7);
//     directionalLight.shadowMap = createRenderTarget({
//         gpu,
//         width: 1024,
//         height: 1024,
//         type: RenderTargetTypes.Depth,
//         depthPrecision: TextureDepthPrecisionType.High,
//     });
// }

subscribeActorOnStart(directionalLight, () => {
    setTranslation(directionalLight.transform, createVector3(-8, 8, -2));
    setLookAtPosition(directionalLight.transform, createVector3(0, 0, 0));
});
addActorToScene(captureScene, directionalLight);

const spotLight1 = createSpotLight({
    intensity: 1.4,
    color: createColorWhite(),
    distance: 15,
    attenuation: 1.06,
    coneAngle: 0.6 * RAD_TO_DEG,
    penumbraAngle: 0.1 * RAD_TO_DEG,
});

if (spotLight1.shadowCamera) {
    spotLight1.shadowCamera.visibleFrustum = false;
    spotLight1.castShadow = true;
    spotLight1.shadowCamera.near = 0.1;
    spotLight1.shadowCamera.far = spotLight1.distance;
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
    setTranslation(spotLight1.transform, createVector3(3.4, 8.1, 0));
    setLookAtPosition(spotLight1.transform, createVector3(1, 0, 0));
});
addActorToScene(captureScene, spotLight1);

const spotLight2 = createSpotLight({
    intensity: 1.4,
    color: createColorWhite(),
    distance: 15,
    attenuation: 1.06,
    coneAngle: 0.6 * RAD_TO_DEG,
    penumbraAngle: 0.1 * RAD_TO_DEG,
});

if (spotLight2.shadowCamera) {
    spotLight2.shadowCamera.visibleFrustum = false;
    spotLight2.castShadow = true;
    spotLight2.shadowCamera.near = 0.1;
    spotLight2.shadowCamera.far = spotLight2.distance;
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
    setTranslation(spotLight2.transform, createVector3(-3.4, 8.1, 0));
    setLookAtPosition(spotLight2.transform, createVector3(-1, 0, 0));
});

addActorToScene(captureScene, spotLight2);

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

const createStreetLightActor = async () => {
    const gltfActor = await loadGLTF({ gpu, dir: MODEL_ASSET_DIR, path: 'street-light-full.gltf' });
    return gltfActor;
};

const createGLTFSphereMesh = async (material: Material) => {
    // const gltfActor = await loadGLTF({ gpu, path: gltfSphereModelUrl });
    const gltfActor = await loadGLTF({ gpu, dir: MODEL_ASSET_DIR, path: 'sphere-32x32.gltf' });
    const mesh: Mesh = gltfActor.children[0] as Mesh;
    mesh.castShadow = true;
    setMeshMaterial(mesh, material);
    return mesh;
};

const createInstanceUpdater = (instanceNum: number) => {
    //
    // begin create mesh
    //

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

    const transformFeedbackDoubleBuffer = createTransformFeedbackDoubleBuffer({
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
                value: createVector2Zero(),
            },
            {
                name: 'uAttractTargetPosition',
                type: UniformTypes.Vector3,
                value: createVector3Zero(),
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
    const gltfActor = await loadGLTF({ gpu, dir: MODEL_ASSET_DIR, path: 'butterfly-forward-thin-2.gltf' });

    // skinned mesh のはずなので cast
    const skinningMesh: SkinnedMesh = gltfActor.children[0].children[0] as SkinnedMesh;

    skinningMesh.name = 'butterfly';

    // ルートにanimatorをattachしてるので一旦ここでassign
    // TODO: set animation clips いらない気がする. animatorの設定さえあれば
    skinningMesh.animator = gltfActor.animator;
    setAnimationClips(skinningMesh, getAnimatorAnimationClips(gltfActor.animator));
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

        const c = createColorFromRGB(
            Math.floor(Math.random() * 180 + 20),
            Math.floor(Math.random() * 20 + 20),
            Math.floor(Math.random() * 180 + 20)
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

    setMeshMaterial(
        skinningMesh,
        createGBufferMaterial({
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

    const transformFeedbackDoubleBuffer = createInstanceUpdater(MAX_INSTANCE_NUM);

    let attractRate = 0;
    skinningMesh.onUpdate = ({ deltaTime }) => {
        setUniformValue(
            transformFeedbackDoubleBuffer.uniforms,
            'uNormalizedInputPosition',
            inputController.normalizedInputPosition
        );
        setUniformValue(
            transformFeedbackDoubleBuffer.uniforms,
            'uAttractTargetPosition',
            addVector3Array(attractSphereMesh.transform.position, createVector3Zero())
        );

        attractRate += (inputController.isDown ? 1 : -1) * deltaTime * 2;
        attractRate = saturate(attractRate);
        setUniformValue(transformFeedbackDoubleBuffer.uniforms, 'uAttractRate', attractRate);
        updateGPUTransformFeedback(gpu, {
            shader: transformFeedbackDoubleBuffer.shader,
            uniforms: transformFeedbackDoubleBuffer.uniforms,
            vertexArrayObject: getWriteTransformFeedbackDoubleBuffer(transformFeedbackDoubleBuffer).vertexArrayObject,
            transformFeedback: getWriteTransformFeedbackDoubleBuffer(transformFeedbackDoubleBuffer).transformFeedback,
            drawCount: transformFeedbackDoubleBuffer.drawCount,
        });
        swapTransformFeedbackDoubleBuffer(transformFeedbackDoubleBuffer);

        replaceVertexArrayObjectBuffer(
            skinnedMesh.geometry.vertexArrayObject,
            AttributeNames.InstancePosition,
            findVertexArrayObjectVertexBufferObjectBuffer(
                getReadTransformFeedbackDoubleBuffer(transformFeedbackDoubleBuffer).vertexArrayObject,
                'aPosition'
            )!
        );
        replaceVertexArrayObjectBuffer(
            skinnedMesh.geometry.vertexArrayObject,
            AttributeNames.InstanceVelocity,
            findVertexArrayObjectVertexBufferObjectBuffer(
                getReadTransformFeedbackDoubleBuffer(transformFeedbackDoubleBuffer).vertexArrayObject,
                'aVelocity'
            )!
        );

        skinnedMesh.geometry.instanceCount = debuggerStates.instanceNum;
    };

    return skinningMesh;
};

const main = async () => {
    const particleImg = await loadImg(smokeImgUrl);
    const particleMap = createTexture({
        gpu,
        img: particleImg,
    });

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
        diffuseIntensity: 0.2,
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
    streetFloorMaterial.fragmentShaderModifiers = [
        {
            pragma: FragmentShaderModifierPragmas.BEFORE_OUT,
            value: `
float d = 1. - smoothstep(4., 7., length(uv));
diffuseColor *= d;
emissiveColor *= d;
`,
        }
    ];
    console.log(streetFloorMaterial)
    setUniformValue(streetFloorMaterial.uniforms, UniformNames.Metallic, 0.5);
    setUniformValue(streetFloorMaterial.uniforms, UniformNames.Roughness, 1);

    //
    // street light
    //

    streetLightActorLeft = await createStreetLightActor();
    subscribeActorOnStart(streetLightActorLeft, () => {
        streetLightActorLeft.transform.position = createVector3(6, 0, 0);
        streetLightActorLeft.transform.scale = createFillVector3(1.8);
    });
    addActorToScene(captureScene, streetLightActorLeft);

    streetLightActorRight = await createStreetLightActor();
    subscribeActorOnStart(streetLightActorRight, () => {
        streetLightActorRight.transform.rotation = createRotator(createQuaternionFromEulerDegrees(0, 180, 0));
        streetLightActorRight.transform.position = createVector3(-6, 0, 0);
        streetLightActorRight.transform.scale = createFillVector3(1.8);
    });
    addActorToScene(captureScene, streetLightActorRight);

    //
    // attract mesh
    //

    attractSphereMesh = await createGLTFSphereMesh(
        createUnlitMaterial({
            emissiveColor: createColor(1.5, 1.5, 1.5, 1),
        })
    );
    subscribeActorOnStart(attractSphereMesh, () => {
        setScaling(attractSphereMesh.transform, createFillVector3(0.5));
    });
    attractSphereMesh.onFixedUpdate = () => {
        const ray = viewpointToRay(
            captureSceneCamera,
            createVector2(
                v2x(inputController.normalizedInputPosition),
                1 - v2y(inputController.normalizedInputPosition)
            )
        );
        const plane = createPlane(createVector3Zero(), createVector3Up());
        const intersectOnPlane = intersectRayWithPlane(ray, plane);
        if (intersectOnPlane) {
            const x = clamp(v3x(intersectOnPlane), -5, 5);
            const z = clamp(v3z(intersectOnPlane), -5, 5);
            const p = createVector3(x, 1, z);
            setTranslation(attractSphereMesh.transform, p);
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
                            const x = Math.random() * 6 - 4;
                            const y = Math.random() * 0.5;
                            const z = Math.random() * 5.4 - 1.4;
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
                            const v = Math.random() * 150 + 50;
                            const a = Math.random() * 75 + 25;
                            const c = createColorFromRGB(v, v, v, a);
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
                            const s = Math.random() * 6.25 + 1.75;
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
        vertexShader: `#version 300 es

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

out float vParticleId;

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

#include <lighting>
#include <ub>
#include <depth>

in float vParticleId;
in vec2 vUv;
in vec4 vVertexColor;
in vec4 vViewPosition;
in vec4 vClipPosition;

out vec4 outColor;

uniform sampler2D uParticleMap;

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
                value: [createVector2(-1, 1), createVector2(-1, -1), createVector2(1, 1), createVector2(1, -1)],
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
    const particleMesh = createMesh({
        geometry: particleGeometry,
        material: particleMaterial,
    });

    addActorToScene(captureScene, attractSphereMesh);
    addActorToScene(captureScene, skinnedMesh);
    addActorToScene(captureScene, skyboxMesh);
    addActorToScene(captureScene, particleMesh);

    // TODO: engine側に移譲したい
    const onWindowResize = () => {
        width = wrapperElement.offsetWidth;
        height = wrapperElement.offsetHeight;
        setInputControllerSize(inputController, width, height);
        engine.setSize(width, height);
    };

    engine.setOnBeforeStart(() => {
        onWindowResize();
        window.addEventListener('resize', onWindowResize);

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
        
        renderer.glitchPass.enabled = false;

        startOrbitCameraController(orbitCameraController);
    });

    engine.setOnBeforeUpdate(() => {
        if (!debuggerGUI) initDebugger();
        updateInputController(inputController);
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
        maxValue: MAX_INSTANCE_NUM,
        initialValue: INITIAL_INSTANCE_NUM,
        stepValue: 1,
        onChange: (value) => {
            debuggerStates.instanceNum = value;
        },
    });

    //
    // orbit controls
    //

    addDebuggerBorderSpacer(debuggerGUI);

    addToggleDebugger(debuggerGUI, {
        label: 'orbit controls enabled',
        initialValue: orbitCameraController.enabled,
        onChange: (value) => (orbitCameraController.enabled = value),
    });

    //
    // show buffers
    //

    addDebuggerBorderSpacer(debuggerGUI);

    addToggleDebugger(debuggerGUI, {
        label: 'show buffers',
        initialValue: bufferVisualizerPass.enabled,
        onChange: (value) => {
            bufferVisualizerPass.enabled = value;
            if (value) {
                showBufferVisualizerPassDom(bufferVisualizerPass);
            } else {
                hideBufferVisualizerPassDom(bufferVisualizerPass);
            }
        },
    });

    //
    // directional light
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const directionalLightDebuggerGroup = addDebugGroup(debuggerGUI, 'directional light', false);

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
        initialValue: v3x(directionalLight.transform.position),
        onChange: (value) => {
            setV3x(directionalLight.transform.position, value);
        },
    });

    addSliderDebugger(directionalLightDebuggerGroup, {
        label: 'pos y',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: v3y(directionalLight.transform.position),
        onChange: (value) => {
            setV3y(directionalLight.transform.position, value);
        },
    });

    addSliderDebugger(directionalLightDebuggerGroup, {
        label: 'pos z',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: v3z(directionalLight.transform.position),
        onChange: (value) => {
            setV3z(directionalLight.transform.position, value);
        },
    });

    //
    // spot light
    //

    createSpotLightDebugger(spotLight1, 'spot light 1');
    createSpotLightDebugger(spotLight2, 'spot light 2');

    //
    // ssao
    // TODO: ssao pass の参照を renderer に変える
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const ssaoDebuggerGroup = addDebugGroup(debuggerGUI, 'ssao', false);

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

    addSliderDebugger(lightShaftDebuggerGroup, {
        label: 'blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.lightShaftPass.blendRate,
        onChange: (value) => {
            renderer.lightShaftPass.blendRate = value;
        },
    });

    addSliderDebugger(lightShaftDebuggerGroup, {
        label: 'pass scale',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.lightShaftPass.passScaleBase,
        onChange: (value) => {
            renderer.lightShaftPass.passScaleBase = value;
        },
    });

    addSliderDebugger(lightShaftDebuggerGroup, {
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

    addDebuggerBorderSpacer(debuggerGUI);

    const volumetricLightDebuggerGroup = addDebugGroup(debuggerGUI, 'volumetric light', false);

    addSliderDebugger(volumetricLightDebuggerGroup, {
        label: 'ray step',
        initialValue: renderer.volumetricLightPass.rayStep,
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.rayStep = value;
        },
    });
    addSliderDebugger(volumetricLightDebuggerGroup, {
        label: 'density multiplier',
        initialValue: renderer.volumetricLightPass.densityMultiplier,
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.densityMultiplier = value;
        },
    });
    addSliderDebugger(volumetricLightDebuggerGroup, {
        label: 'jitter size x',
        initialValue: v3x(renderer.volumetricLightPass.rayJitterSize),
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            setV3x(renderer.volumetricLightPass.rayJitterSize, value);
        },
    });
    addSliderDebugger(volumetricLightDebuggerGroup, {
        label: 'jitter size y',
        initialValue: v3y(renderer.volumetricLightPass.rayJitterSize),
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            setV3y(renderer.volumetricLightPass.rayJitterSize, value);
        },
    });
    addSliderDebugger(volumetricLightDebuggerGroup, {
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
        initialValue: getColorHexCoord(renderer.fogPass.fogColor),
        onChange: (value) => {
            renderer.fogPass.fogColor = createColorFromHex(value);
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'strength',
        minValue: 0,
        maxValue: 0.2,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.fogStrength,
        onChange: (value) => {
            renderer.fogPass.fogStrength = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'density',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.fogDensity,
        onChange: (value) => {
            renderer.fogPass.fogDensity = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'attenuation',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.fogDensityAttenuation,
        onChange: (value) => {
            renderer.fogPass.fogDensityAttenuation = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'fog end height',
        minValue: -5,
        maxValue: 5,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.fogEndHeight,
        onChange: (value) => {
            renderer.fogPass.fogEndHeight = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'distance fog start',
        minValue: 0,
        maxValue: 300,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.distanceFogPower,
        onChange: (value) => {
            renderer.fogPass.distanceFogStart = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'distance fog end',
        minValue: 0,
        maxValue: 300,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.distanceFogEnd,
        onChange: (value) => {
            renderer.fogPass.distanceFogEnd = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'distance fog power',
        minValue: 0,
        maxValue: 0.2,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.distanceFogPower,
        onChange: (value) => {
            renderer.fogPass.distanceFogPower = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'sss fog rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.fogPass.sssFogRate,
        onChange: (value) => {
            renderer.fogPass.sssFogRate = value;
        },
    });

    addSliderDebugger(fogDebuggerGroup, {
        label: 'blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.blendRate,
        onChange: (value) => {
            renderer.fogPass.blendRate = value;
        },
    });

    //
    // depth of field
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const dofDebuggerGroup = addDebugGroup(debuggerGUI, 'depth of field', false);

    addSliderDebugger(dofDebuggerGroup, {
        label: 'DoF focus distance',
        minValue: 0.1,
        maxValue: 100,
        stepValue: 0.001,
        initialValue: renderer.depthOfFieldPass.focusDistance,
        onChange: (value) => {
            renderer.depthOfFieldPass.focusDistance = value;
        },
    });

    addSliderDebugger(dofDebuggerGroup, {
        label: 'DoF focus range',
        minValue: 0.1,
        maxValue: 30,
        stepValue: 0.001,
        initialValue: renderer.depthOfFieldPass.focusRange,
        onChange: (value) => {
            renderer.depthOfFieldPass.focusRange = value;
        },
    });

    addSliderDebugger(dofDebuggerGroup, {
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

    addDebuggerBorderSpacer(debuggerGUI);

    const bloomDebuggerGroup = addDebugGroup(debuggerGUI, 'bloom', false);

    addSliderDebugger(bloomDebuggerGroup, {
        label: 'bloom amount',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: renderer.bloomPass.bloomAmount,
        onChange: (value) => {
            renderer.bloomPass.bloomAmount = value;
        },
    });

    addSliderDebugger(bloomDebuggerGroup, {
        label: 'bloom threshold',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.001,
        initialValue: renderer.bloomPass.threshold,
        onChange: (value) => {
            renderer.bloomPass.threshold = value;
        },
    });

    addSliderDebugger(bloomDebuggerGroup, {
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

    addDebuggerBorderSpacer(debuggerGUI);

    const streakDebuggerGroup = addDebugGroup(debuggerGUI, 'streak', false);

    addSliderDebugger(streakDebuggerGroup, {
        label: 'threshold',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: renderer.streakPass.threshold,
        onChange: (value) => {
            renderer.streakPass.threshold = value;
        },
    });
    addSliderDebugger(streakDebuggerGroup, {
        label: 'vertical scale',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.streakPass.verticalScale,
        onChange: (value) => {
            renderer.streakPass.verticalScale = value;
        },
    });
    addSliderDebugger(streakDebuggerGroup, {
        label: 'horizontal scale',
        minValue: 0,
        maxValue: 2,
        stepValue: 0.001,
        initialValue: renderer.streakPass.horizontalScale,
        onChange: (value) => {
            renderer.streakPass.horizontalScale = value;
        },
    });

    addSliderDebugger(streakDebuggerGroup, {
        label: 'stretch',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.streakPass.stretch,
        onChange: (value) => {
            renderer.streakPass.stretch = value;
        },
    });
    addColorDebugger(streakDebuggerGroup, {
        label: 'color',
        initialValue: getColorHexCoord(renderer.streakPass.color),
        onChange: (value) => {
            renderer.streakPass.color = createColorFromHex(value);
        },
    });
    addSliderDebugger(streakDebuggerGroup, {
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

    addDebuggerBorderSpacer(debuggerGUI);

    const ssrDebuggerGroup = addDebugGroup(debuggerGUI, 'ssr', false);

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'depth bias',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.rayDepthBias,
        onChange: (value) => {
            renderer.ssrPass.rayDepthBias = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'ray nearest distance',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.rayNearestDistance,
        onChange: (value) => {
            renderer.ssrPass.rayNearestDistance = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'ray max distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.rayMaxDistance,
        onChange: (value) => {
            renderer.ssrPass.rayMaxDistance = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'ray thickness',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionRayThickness,
        onChange: (value) => {
            renderer.ssrPass.reflectionRayThickness = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'jitter size x',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionRayJitterSizeX,
        onChange: (value) => {
            renderer.ssrPass.reflectionRayJitterSizeX = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'jitter size y',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionRayJitterSizeY,
        onChange: (value) => {
            renderer.ssrPass.reflectionRayJitterSizeY = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'roughness power',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.01,
        initialValue: renderer.ssrPass.reflectionRoughnessPower,
        onChange: (value) => {
            renderer.ssrPass.reflectionRoughnessPower = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'fade min distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionFadeMinDistance,
        onChange: (value) => {
            renderer.ssrPass.reflectionFadeMinDistance = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'fade max distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionFadeMaxDistance,
        onChange: (value) => {
            renderer.ssrPass.reflectionFadeMaxDistance = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'edge fade factor min x',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMinX,
        onChange: (value) => {
            renderer.ssrPass.reflectionScreenEdgeFadeFactorMinX = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'edge fade factor max x',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxX,
        onChange: (value) => {
            renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxX = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'edge fade factor min y',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMinY,
        onChange: (value) => {
            renderer.ssrPass.reflectionScreenEdgeFadeFactorMinY = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
        label: 'edge fade factor max y',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxY,
        onChange: (value) => {
            renderer.ssrPass.reflectionScreenEdgeFadeFactorMaxY = value;
        },
    });

    addSliderDebugger(ssrDebuggerGroup, {
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

    addDebuggerBorderSpacer(debuggerGUI);

    const chromaticAberrationDebuggerGroup = addDebugGroup(debuggerGUI, 'chromatic aberration', false);

    addSliderDebugger(chromaticAberrationDebuggerGroup, {
        label: 'scale',
        minValue: 0,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.chromaticAberrationPass.scale,
        onChange: (value) => (renderer.chromaticAberrationPass.scale = value),
    });

    //
    // vignette
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const vignetteDebuggerGroup = addDebugGroup(debuggerGUI, 'vignette', false);
    addSliderDebugger(vignetteDebuggerGroup, {
        label: 'radius from',
        minValue: 0,
        maxValue: 3,
        stepValue: 0.001,
        initialValue: renderer.vignettePass.vignetteRadiusFrom,
        onChange: (value) => (renderer.vignettePass.vignetteRadiusFrom = value),
    });
    addSliderDebugger(vignetteDebuggerGroup, {
        label: 'radius to',
        minValue: 0,
        maxValue: 3,
        stepValue: 0.001,
        initialValue: renderer.vignettePass.vignetteRadiusTo,
        onChange: (value) => (renderer.vignettePass.vignetteRadiusTo = value),
    });
    addSliderDebugger(vignetteDebuggerGroup, {
        label: 'power',
        minValue: 0.01,
        maxValue: 8,
        stepValue: 0.001,
        initialValue: renderer.vignettePass.vignettePower,
        onChange: (value) => (renderer.vignettePass.vignettePower = value),
    });
    addSliderDebugger(vignetteDebuggerGroup, {
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

    addDebuggerBorderSpacer(debuggerGUI);

    const fxaaDebuggerGroup = addDebugGroup(debuggerGUI, 'fxaa', false);

    addToggleDebugger(fxaaDebuggerGroup, {
        label: 'fxaa pass enabled',
        initialValue: renderer.fxaaPass.enabled,
        onChange: (value) => (renderer.fxaaPass.enabled = value),
    });

    //
    // add debugger ui
    //

    wrapperElement.appendChild(debuggerGUI.rootElement);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
