// actors
import { createPerspectiveCamera } from '@/PaleGL/actors/cameras/perspectiveCamera.ts';
import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import {
    getMeshMaterial,
    setMeshMaterial,
    setUniformValueToAllMeshMaterials,
} from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { setAnimationClips, SkinnedMesh } from '@/PaleGL/actors/meshes/skinnedMesh.ts';

// core
import {
    createEngine,
    Engine,
    getSharedTexture,
    runEngine,
    setEngineSize,
    setOnBeforeStartEngine,
    setOnBeforeUpdateEngine,
    setOnRenderEngine,
    setSceneToEngine,
    startEngine,
} from '@/PaleGL/core/engine.ts';
import { bindGPUUniformBlockAndGetBlockIndex, createGPU, Gpu, updateGPUTransformFeedback } from '@/PaleGL/core/gpu.ts';
import {
    createOrbitCameraController,
    fixedUpdateOrbitCameraController,
    setOrbitCameraControllerDelta,
    startOrbitCameraController,
} from '@/PaleGL/core/orbitCameraController.ts';
import { createRenderer, renderRenderer } from '@/PaleGL/core/renderer.ts';
import { createTexture, Texture } from '@/PaleGL/core/texture.ts';

// geometries
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';

// loaders
import { loadCubeMap } from '@/PaleGL/loaders/loadCubeMap';
import { loadGLTF } from '@/PaleGL/loaders/loadGLTF';
import { loadImg } from '@/PaleGL/loaders/loadImg';

// materials
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
// import { PhongMaterial } from '@/PaleGL/materials/PhongMaterial';

// math
import {
    createColor,
    createColorFromHex,
    createColorFromRGB,
    createColorWhite,
    getColorHexCoord,
} from '@/PaleGL/math/color.ts';
import { createVector2, createVector2Zero, v2o, v2x, v2y } from '@/PaleGL/math/vector2.ts';
import {
    createFillVector3,
    createVector3,
    createVector3Zero,
    setV3x,
    setV3y,
    setV3z,
    v3x,
    v3y,
    v3z,
} from '@/PaleGL/math/vector3.ts';
import { createVector4 } from '@/PaleGL/math/vector4.ts';

// postprocess
import {
    createBufferVisualizerPass,
    hideBufferVisualizerPassDom,
    showBufferVisualizerPassDom,
} from '@/PaleGL/postprocess/bufferVisualizerPass.ts';

// inputs
import { createMouseInputController } from '@/PaleGL/inputs/mouseInputController.ts';
import { createTouchInputController } from '@/PaleGL/inputs/touchInputController.ts';

// shaders
import litObjectSpaceRaymarchFragContent from './shaders/object-space-raymarch-test-scene.glsl';
// import gBufferObjectSpaceRaymarchDepthFrag from './shaders/gbuffer-object-space-raymarch-depth-fragment-test-scene.glsl';
import litScreenSpaceRaymarchFragContent from './shaders/screen-space-raymarch-test-scene.glsl';
// import gBufferScreenSpaceRaymarchDepthFrag from './shaders/gbuffer-screen-space-raymarch-depth-fragment-test-scene.glsl';
import billboardParticleFragmentShader from '@/PaleGL/shaders/billboard-particle-fragment.glsl';
import billboardParticleVertexShader from '@/PaleGL/shaders/billboard-particle-vertex.glsl';
import testGPUParticleUpdateFragmentShader from '@/PaleGL/shaders/gpu-particle-update.glsl';
import testGPUTrailParticleInitializeFragmentShader from '@/PaleGL/shaders/gpu-trail-particle-initialize.glsl';
import testGPUTrailParticleUpdateFragmentShader from '@/PaleGL/shaders/gpu-trail-particle-update.glsl';

// others
import {
    AttributeNames,
    AttributeUsageType,
    BlendTypes,
    FaceSide,
    RAD_TO_DEG,
    TextureFilterTypes,
    TextureWrapTypes,
    UIQueueTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
    VertexShaderModifierPragmas,
} from '@/PaleGL/constants';

import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { CubeMap } from '@/PaleGL/core/cubeMap.ts';
import { createGBufferMaterial } from '@/PaleGL/materials/gBufferMaterial.ts';
import { addPostProcessPass, createPostProcess, setPostProcessEnabled } from '@/PaleGL/postprocess/postProcess.ts';
import {
    addButtonDebugger,
    addColorDebugger,
    addDebuggerBorderSpacer,
    addDebugGroup,
    addSliderDebugger,
    addToggleDebugger,
    createDebuggerGUI,
    DebuggerGUI,
} from '@/PaleGL/utilities/debuggerGUI.ts';
// import { TransformFeedbackBuffer } from '@/PaleGL/core/transformFeedbackBuffer.ts';
import {
    createTransformFeedbackDoubleBuffer,
    getReadTransformFeedbackDoubleBuffer,
    getWriteTransformFeedbackDoubleBuffer,
    swapTransformFeedbackDoubleBuffer,
} from '@/PaleGL/core/transformFeedbackDoubleBuffer.ts';
import { createUnlitMaterial } from '@/PaleGL/materials/unlitMaterial.ts';
import { saturate } from '@/PaleGL/utilities/mathUtilities.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';

import { subscribeActorOnStart, subscribeActorOnUpdate } from '@/PaleGL/actors/actor.ts';
import { setCameraClearColor, setCameraPostProcess } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { createDirectionalLight, createDirectionalLightShadow } from '@/PaleGL/actors/lights/directionalLight.ts';
import { createSpotLight, createSpotLightShadow, SpotLight } from '@/PaleGL/actors/lights/spotLight.ts';
import { createObjectSpaceRaymarchMesh } from '@/PaleGL/actors/meshes/objectSpaceRaymarchMesh.ts';
import { createScreenSpaceRaymarchMesh } from '@/PaleGL/actors/meshes/screenSpaceRaymarchMesh.ts';
import { createSkybox } from '@/PaleGL/actors/meshes/skybox.ts';
import { createTextMesh, FontAtlasData, TextAlignType } from '@/PaleGL/actors/meshes/textMesh.ts';
import { getAnimatorAnimationClips } from '@/PaleGL/core/animator.ts';
import { SharedTexturesType, SharedTexturesTypes } from '@/PaleGL/core/createSharedTextures.ts';
import { createGLSLSound, GLSLSound, playGLSLSound, stopGLSLSound } from '@/PaleGL/core/glslSound.ts';
import { addActorToScene, createScene, createSceneUICamera, setMainCamera } from '@/PaleGL/core/scene.ts';
import { setLookAtPosition, setRotationX, setScaling, setTranslation } from '@/PaleGL/core/transform.ts';
import { addUniformBlock, setUniformValue } from '@/PaleGL/core/uniforms.ts';
import {
    findVertexArrayObjectVertexBufferObjectBuffer,
    replaceVertexArrayObjectBuffer,
} from '@/PaleGL/core/vertexArrayObject.ts';
import { getGeometryAttributeDescriptors } from '@/PaleGL/geometries/geometryBehaviours.ts';
import {
    setInputControllerSize,
    startInputController,
    updateInputController,
} from '@/PaleGL/inputs/inputControllerBehaviours.ts';
import { loadJson } from '@/PaleGL/loaders/loadJson.ts';
import {
    getRotatorDegreeX,
    getRotatorDegreeY,
    getRotatorDegreeZ,
    setRotatorRotationDegreeX,
    setRotatorRotationDegreeY,
    setRotatorRotationDegreeZ,
} from '@/PaleGL/math/rotator.ts';
import soundVertexShader from './shaders/sound-vertex.glsl';
// import {fontCircuit} from "@/PaleGL/shapeFont/fontCircuit/fontCircuit.ts";
import { createBillboardParticle } from '@/PaleGL/actors/meshes/billboardParticle.ts';
import { createUIShapeTextMesh } from '@/PaleGL/actors/meshes/uiShapeTextMesh.ts';
import { createUnlitShapeTextMesh } from '@/PaleGL/actors/meshes/unlitShapeTextMesh.ts';
import { createGPUParticle } from '@/PaleGL/actors/particles/gpuParticle.ts';
import {
    createGPUTrailParticle,
    createTrailCylinderGeometry,
    createTrailPlaneGeometry,
} from '@/PaleGL/actors/particles/gpuTrailParticle.ts';
import { createInstancingParticle } from '@/PaleGL/actors/particles/instancingParticle.ts';
import { createEffectTextureSystem, renderEffectTexture } from '@/PaleGL/core/effectTexture.ts';
import { convertNormalMapFromHeightMap, createNormalMapConverter } from '@/PaleGL/core/normalMap.ts';
import { createSphereGeometry } from '@/PaleGL/geometries/createSphereGeometry.ts';
import fbmNoiseFragment from '@/PaleGL/shaders/fbm-noise.glsl';
import { shapeFontCircuitService } from '@/PaleGL/shapeFont/shapeFontCircuit/shapeFontCircuitService.ts';
import { createShapeFontRenderer } from '@/PaleGL/shapeFont/shapeFontRenderer.ts';
import { setUITranslation } from '@/PaleGL/ui/uiBehaviours.ts';
import { isMinifyShader } from '@/PaleGL/utilities/envUtilities.ts';
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
const leaveBaseImgUrl = './assets/images/brown_mud_leaves_01_diff_1k.jpg';
const leaveNormalImgUrl = './assets/images/brown_mud_leaves_01_nor_gl_1k.jpg';
const CubeMapPositiveXImgUrl = './assets/images/px.jpg';
const CubeMapNegativeXImgUrl = './assets/images/nx.jpg';
const CubeMapPositiveYImgUrl = './assets/images/py.jpg';
const CubeMapNegativeYImgUrl = './assets/images/ny.jpg';
const CubeMapPositiveZImgUrl = './assets/images/pz.jpg';
const CubeMapNegativeZImgUrl = './assets/images/nz.jpg';
// const gltfSphereModelUrl = './assets/models/sphere-32x32.gltf';
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

const createTestGPUParticle = (gpu: Gpu) => {
    // vat gpu particle
    const vatWidth = 32;
    const vatHeight = 32;
    const vatGPUParticle = createGPUParticle({
        gpu,
        mesh: createMesh({
            // geometry: createBoxGeometry({gpu, size: 1}),
            geometry: createSphereGeometry({ gpu, radius: 0.75 }),
            material: createUnlitMaterial({
                baseColor: createColor(1.5, 1.5, 1.5, 1),
            }),
        }),
        instanceCount: vatWidth * vatHeight,
        vatWidth,
        vatHeight,
        makeDataPerInstanceFunction: () => {
            return {
                scale: [0.1, 0.1, 0.1],
            };
        },
        // makeStateDataPerInstanceFunction: () => {
        //     return {
        //         // position: [i * 2, 3, i * -2, 1]
        //         position: [Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5, 1],
        //     };
        // },
        initializeFragmentShader: testGPUTrailParticleInitializeFragmentShader,
        updateFragmentShader: testGPUParticleUpdateFragmentShader,
    });
    addActorToScene(captureScene, vatGPUParticle);

    // for debug
    const testMesh = createMesh({
        geometry: createPlaneGeometry({ gpu }),
        material: createUnlitMaterial(),
    });
    setScaling(testMesh.transform, createFillVector3(1.5));
    setTranslation(testMesh.transform, createVector3(-8, 1.5, 0));
    // addActorToScene(captureScene, testMesh);
    subscribeActorOnStart(testMesh, () => {
        setUniformValue(
            getMeshMaterial(testMesh).uniforms,
            UniformNames.BaseMap,
            (vatGPUParticle.mrtGraphicsDoubleBuffer.doubleBuffer as MRTDoubleBuffer).multipleRenderTargets[0]
                .textures[1]
        );
    });
};

const createTestGPUPlaneTrailParticle = (gpu: Gpu) => {
    // vat gpu particle
    const vatWidth = 32;
    const vatHeight = 256;
    const vatGPUParticle = createGPUTrailParticle({
        gpu,
        mesh: createMesh({
            name: 'GPUTrailPlaneParticle',
            geometry: createTrailPlaneGeometry(gpu, 0.5, vatHeight),
            material: createGBufferMaterial({
                metallic: 0,
                roughness: 1,
                baseColor: createColor(1, 0, 0, 1),
                faceSide: FaceSide.Double,
            }),
        }),
        instanceCount: vatWidth,
        vatWidth,
        vatHeight,
        initializeFragmentShader: testGPUTrailParticleInitializeFragmentShader,
        updateFragmentShader: testGPUTrailParticleUpdateFragmentShader,
    });
    addActorToScene(captureScene, vatGPUParticle);

    // for debug
    const checkVelocityMesh = createMesh({
        geometry: createPlaneGeometry({ gpu }),
        material: createUnlitMaterial(),
    });
    setScaling(checkVelocityMesh.transform, createFillVector3(1.5));
    setTranslation(checkVelocityMesh.transform, createVector3(-8, 1.5, 6));
    // addActorToScene(captureScene, checkVelocityMesh);
    subscribeActorOnStart(checkVelocityMesh, () => {
        setUniformValue(
            getMeshMaterial(checkVelocityMesh).uniforms,
            UniformNames.BaseMap,
            vatGPUParticle.mrtDoubleBuffer.multipleRenderTargets[0].textures[0]
        );
    });

    const checkPositionMesh = createMesh({
        geometry: createPlaneGeometry({ gpu }),
        material: createUnlitMaterial(),
    });
    setScaling(checkPositionMesh.transform, createFillVector3(1.5));
    setTranslation(checkPositionMesh.transform, createVector3(-8, 1.5, 3));
    // addActorToScene(captureScene, checkPositionMesh);
    subscribeActorOnStart(checkPositionMesh, () => {
        setUniformValue(
            getMeshMaterial(checkPositionMesh).uniforms,
            UniformNames.BaseMap,
            vatGPUParticle.mrtDoubleBuffer.multipleRenderTargets[0].textures[1]
        );
    });

    const checkUpMesh = createMesh({
        geometry: createPlaneGeometry({ gpu }),
        material: createUnlitMaterial(),
    });
    setScaling(checkUpMesh.transform, createFillVector3(1.5));
    setTranslation(checkUpMesh.transform, createVector3(-8, 1.5, 0));
    // addActorToScene(captureScene, checkUpMesh);
    subscribeActorOnStart(checkUpMesh, () => {
        setUniformValue(
            getMeshMaterial(checkUpMesh).uniforms,
            UniformNames.BaseMap,
            vatGPUParticle.mrtDoubleBuffer.multipleRenderTargets[0].textures[2]
        );
    });
};

const createTestGPUCylinderTrailParticle = (gpu: Gpu) => {
    // vat gpu particle
    const vatWidth = 32;
    const vatHeight = 128;
    const vatGPUParticle = createGPUTrailParticle({
        gpu,
        mesh: createMesh({
            name: 'GPUTrailPlaneParticle',
            geometry: createTrailCylinderGeometry(gpu, 0.1, 8, vatHeight),
            material: createGBufferMaterial({
                metallic: 0,
                roughness: 1,
                baseColor: createColor(0, 0, 1, 1),
                faceSide: FaceSide.Double,
            }),
        }),
        instanceCount: vatWidth,
        vatWidth,
        vatHeight,
        initializeFragmentShader: testGPUTrailParticleInitializeFragmentShader,
        updateFragmentShader: testGPUTrailParticleUpdateFragmentShader,
    });
    addActorToScene(captureScene, vatGPUParticle);

    // for debug
    const checkVelocityMesh = createMesh({
        geometry: createPlaneGeometry({ gpu }),
        material: createUnlitMaterial(),
    });
    setScaling(checkVelocityMesh.transform, createFillVector3(1.5));
    setTranslation(checkVelocityMesh.transform, createVector3(-8, 1.5, 6));
    // addActorToScene(captureScene, checkVelocityMesh);
    subscribeActorOnStart(checkVelocityMesh, () => {
        setUniformValue(
            getMeshMaterial(checkVelocityMesh).uniforms,
            UniformNames.BaseMap,
            vatGPUParticle.mrtDoubleBuffer.multipleRenderTargets[0].textures[0]
        );
    });

    const checkPositionMesh = createMesh({
        geometry: createPlaneGeometry({ gpu }),
        material: createUnlitMaterial(),
    });
    setScaling(checkPositionMesh.transform, createFillVector3(1.5));
    setTranslation(checkPositionMesh.transform, createVector3(-8, 1.5, 3));
    // addActorToScene(captureScene, checkPositionMesh);
    subscribeActorOnStart(checkPositionMesh, () => {
        setUniformValue(
            getMeshMaterial(checkPositionMesh).uniforms,
            UniformNames.BaseMap,
            vatGPUParticle.mrtDoubleBuffer.multipleRenderTargets[0].textures[1]
        );
    });

    const checkUpMesh = createMesh({
        geometry: createPlaneGeometry({ gpu }),
        material: createUnlitMaterial(),
    });
    setScaling(checkUpMesh.transform, createFillVector3(1.5));
    setTranslation(checkUpMesh.transform, createVector3(-8, 1.5, 0));
    // addActorToScene(captureScene, checkUpMesh);
    subscribeActorOnStart(checkUpMesh, () => {
        setUniformValue(
            getMeshMaterial(checkUpMesh).uniforms,
            UniformNames.BaseMap,
            vatGPUParticle.mrtDoubleBuffer.multipleRenderTargets[0].textures[2]
        );
    });
};

const createTestNormalMap = (gpu: Gpu, texture: Texture) => {
    const TEXTURE_SIZE = 1024;

    const effectTextureSystem = createEffectTextureSystem(gpu, renderer, {
        // width: TEXTURE_SIZE,
        // height: TEXTURE_SIZE,
        // effectFragmentShader: simplexNoiseFragment,
        // effectUniforms: [
        //     // {
        //     //     name: UniformNames.Time,
        //     //     type: UniformTypes.Float,
        //     //     value: 0,
        //     // },
        //     {
        //         name: "uGridSize",
        //         type: UniformTypes.Vector2,
        //         value: createVector2(4, 4),
        //     },
        // ],

        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        effectFragmentShader: fbmNoiseFragment,
        effectUniforms: [
            // {
            //     name: UniformNames.Time,
            //     type: UniformTypes.Float,
            //     value: 0,
            // },
            {
                name: 'uGridSize',
                type: UniformTypes.Vector2,
                value: createVector2(4.4, 4.4),
            },
            {
                name: 'uOctaves',
                type: UniformTypes.Float,
                value: 8,
            },
            {
                name: 'uAmplitude',
                type: UniformTypes.Float,
                value: 0.307,
            },
            {
                name: 'uFrequency',
                type: UniformTypes.Float,
                value: 1.357,
            },
            {
                name: 'uFactor',
                type: UniformTypes.Float,
                value: 0.597,
            },
        ],
    });
    const converter = createNormalMapConverter(gpu, renderer, { srcTexture: effectTextureSystem.texture });

    setMaterialUniformValue(effectTextureSystem.effectMaterial, 'uSpeed', 0.1);

    const checkMesh = createMesh({
        geometry: createPlaneGeometry({
            gpu,
            divColNum: 100,
            divRowNum: 100,
            calculateTangent: true,
            calculateBinormal: true,
        }),
        material: createGBufferMaterial({
            baseColor: createColor(0, 1, 0, 1),
            metallic: 0,
            roughness: 1,
            useHeightMap: true,
            useNormalMap: true,
            // faceSide: FaceSide.Double
        }),
    });
    setScaling(checkMesh.transform, createFillVector3(2));
    setTranslation(checkMesh.transform, createVector3(-8, 0.5, 4));
    setRotationX(checkMesh.transform, -90);
    addActorToScene(captureScene, checkMesh);

    const tiling = createVector4(0.1, 0.1, 0, 0);
    subscribeActorOnUpdate(checkMesh, () => {
        renderEffectTexture(renderer, effectTextureSystem);
        convertNormalMapFromHeightMap(renderer, converter);
        setUniformValueToAllMeshMaterials(checkMesh, UniformNames.HeightMap, effectTextureSystem.texture);
        setUniformValueToAllMeshMaterials(checkMesh, UniformNames.HeightMapTiling, tiling);
        setUniformValueToAllMeshMaterials(checkMesh, UniformNames.HeightScale, 0.8);
        setUniformValueToAllMeshMaterials(checkMesh, UniformNames.NormalMap, converter.renderTarget.texture);
        setUniformValueToAllMeshMaterials(checkMesh, UniformNames.NormalMapTiling, tiling);
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
let floorBaseMap: Texture;
let floorNormalMap: Texture;
let attractSphereMesh: Mesh;
let testLightingMesh: Mesh;
let skinnedMesh: SkinnedMesh;
let cubeMap: CubeMap;
let glslSound: GLSLSound | null;
let objectSpaceRaymarchMesh: Mesh;
let screenSpaceRaymarchMesh: Mesh;

const isSP = !!window.navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i);
const inputController = isSP ? createTouchInputController() : createMouseInputController();
startInputController(inputController);

const wrapperElement = document.createElement('div');
document.body.appendChild(wrapperElement);
wrapperElement.setAttribute('id', 'wrapper');

const canvasElement = document.createElement('canvas');
wrapperElement.appendChild(canvasElement);

const gl = canvasElement.getContext('webgl2', { antialias: false })!;

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

const pixelRatio = Math.min(window.devicePixelRatio, 2);

const renderer = createRenderer({
    gpu,
    canvas: canvasElement,
    pixelRatio,
});

const engine = createEngine({ gpu, renderer });
// const engine = createEngine({ gpu, renderer, updateFps: 2 });
setSceneToEngine(engine, captureScene);

const captureSceneCamera = createPerspectiveCamera(70, 1, 0.1, 50);
addActorToScene(captureScene, captureSceneCamera);
setMainCamera(captureScene, captureSceneCamera);
createSceneUICamera(captureScene);

const orbitCameraController = createOrbitCameraController(captureSceneCamera);

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
    // intensity: 1.2,
    intensity: 0.7,
    // color: Color.fromRGB(255, 210, 200),
    color: createColorWhite(),
});
setTranslation(directionalLight.transform, createVector3(-3, 5, 3));
// directionalLight.enabled = false; // NOTE: 一旦ガード

// // shadows
// // TODO: directional light は constructor で shadow cameras を生成してるのでこのガードいらない
// if (directionalLight.shadowCamera) {
//     directionalLight.shadowCamera.visibleFrustum = true;
//     directionalLight.castShadow = true;
//     directionalLight.shadowCamera.near = 1;
//     directionalLight.shadowCamera.far = 15;
//     // (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -12, 12, -12, 12);
//     // (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -5, 5, -5, 5);
//     setOrthoSize(directionalLight.shadowCamera as OrthographicCamera, null, null, -7, 7, -7, 7);
//     directionalLight.shadowMap = createRenderTarget({
//         gpu,
//         width: 1024,
//         height: 1024,
//         type: RenderTargetTypes.Depth,
//         depthPrecision: TextureDepthPrecisionType.High,
//     });
// }
createDirectionalLightShadow(gpu, directionalLight, 1024, 1, 15, 7, true);

subscribeActorOnStart(directionalLight, () => {
    setTranslation(directionalLight.transform, createVector3(-8, 8, -2));
    setLookAtPosition(directionalLight.transform, createVector3(0, 0, 0));
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
    intensity: 5,
    color: createColorWhite(),
    distance: 20,
    attenuation: 0.1,
    coneAngle: 0.5 * RAD_TO_DEG,
    penumbraAngle: 0.05 * RAD_TO_DEG,
});
// spotLight.enabled = false;

createSpotLightShadow(gpu, spotLight1, 1024, 0.1, true);

// if (spotLight1.shadowCamera) {
//     spotLight1.shadowCamera.visibleFrustum = true;
//     spotLight1.castShadow = true;
//     spotLight1.shadowCamera.near = 1;
//     spotLight1.shadowCamera.far = spotLight1.distance;
//     // spotLight.shadowCamera.far = 10;
//     setPerspectiveSize(spotLight1.shadowCamera as PerspectiveCamera, 1); // TODO: いらないかも
//     spotLight1.shadowMap = createRenderTarget({
//         gpu,
//         width: 1024,
//         height: 1024,
//         type: RenderTargetTypes.Depth,
//         depthPrecision: TextureDepthPrecisionType.High,
//     });
// }

subscribeActorOnStart(spotLight1, () => {
    setTranslation(spotLight1.transform, createVector3(5, 9, -2));
    setLookAtPosition(spotLight1.transform, createVector3(0, 0, 0));
});

addActorToScene(captureScene, spotLight1);

const spotLight2 = createSpotLight({
    intensity: 5,
    color: createColorWhite(),
    distance: 20,
    attenuation: 0.1,
    coneAngle: 0.5 * RAD_TO_DEG,
    penumbraAngle: 0.05 * RAD_TO_DEG,
});
// spotLight.enabled = false;

// if (spotLight2.shadowCamera) {
//     spotLight2.shadowCamera.visibleFrustum = true;
//     spotLight2.castShadow = true;
//     spotLight2.shadowCamera.near = 1;
//     spotLight2.shadowCamera.far = spotLight2.distance;
//     // spotLight.shadowCamera.far = 10;
//     setPerspectiveSize(spotLight2.shadowCamera as PerspectiveCamera, 1); // TODO: いらないかも
//     spotLight2.shadowMap = createRenderTarget({
//         gpu,
//         width: 1024,
//         height: 1024,
//         type: RenderTargetTypes.Depth,
//         depthPrecision: TextureDepthPrecisionType.High,
//     });
// }

createSpotLightShadow(gpu, spotLight2, 1024, 0.1, true);

subscribeActorOnStart(spotLight2, () => {
    setTranslation(spotLight2.transform, createVector3(-5, 9, -2));
    setLookAtPosition(spotLight2.transform, createVector3(0, 0, 0));
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

const createTestLightingSphereMesh = (material: Material) => {
    // tmp
    // const gltfActor = await loadGLTF({ gpu, path: gltfSphereModelUrl });
    // const mesh: Mesh = gltfActor.children[0] as Mesh;
    // mesh.castShadow = true;
    // setMeshMaterial(mesh, material);

    const mesh = createMesh({
        geometry: createSphereGeometry({ gpu, radius: 1, widthSegments: 32, heightSegments: 32 }),
        material,
    });
    mesh.castShadow = true;
    setMeshMaterial(mesh, material);

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
    const gltfActor = await loadGLTF({ gpu, path: gltfButterflyModelUrl });

    // skinned mesh のはずなので cast
    const skinningMesh: SkinnedMesh = gltfActor.children[0].children[0] as SkinnedMesh;

    skinningMesh.name = 'butterfly';
    // ルートにanimatorをattachしてるので一旦ここでassign
    // animatorは存在しているmeshのはず
    // TODO: set animation clips いらない気がする. animatorの設定さえあれば
    skinningMesh.animator = gltfActor.animator!;
    setAnimationClips(skinningMesh, getAnimatorAnimationClips(gltfActor.animator));

    setMeshMaterial(
        skinningMesh,
        createGBufferMaterial({
            // gpu,
            // specularAmount: 0.5,
            // baseColor: Color.white(),
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

    const particle = createInstancingParticle({
        mesh: skinningMesh,
        instanceCount: instanceNum,
        makeDataPerInstanceFunction: () => {
            const baseScale = 0.2;
            const randomScaleRange = 0.6;
            const s = Math.random() * randomScaleRange + baseScale;

            const c = createColorFromRGB(
                Math.floor(Math.random() * 200 + 30),
                Math.floor(Math.random() * 80 + 20),
                Math.floor(Math.random() * 200 + 30)
            );

            const ec = createColorFromRGB(0, 0, 0);

            return {
                position: [0, 0, 0],
                scale: [s, s, s],
                rotation: [0, 0, 0],
                velocity: [0, 0, 0],
                color: [...c.e],
                emissiveColor: [...ec.e],
                animationOffset: Math.random() * 30,
            };
        },
    });

    const transformFeedbackDoubleBuffer = createInstanceUpdater(instanceNum);

    let attractRate = 0;
    subscribeActorOnUpdate(particle, ({ deltaTime }) => {
        // mesh.material.uniforms.uTime.value = time;

        // transformFeedbackDoubleBuffer.uniforms.setValue(UniformNames.Time, time);
        setUniformValue(
            transformFeedbackDoubleBuffer.uniforms,
            'uNormalizedInputPosition',
            inputController.normalizedInputPosition
        );
        setUniformValue(
            transformFeedbackDoubleBuffer.uniforms,
            'uAttractTargetPosition',
            attractSphereMesh.transform.position
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
        // };
        // mesh.onUpdate = () => {
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
    });

    // skinningMesh.debugBoneView = true;
    // skinningMesh.enabled = false;

    return skinningMesh;
};

const playSound = () => {
    if (glslSound) {
        stopGLSLSound(glslSound);
    }
    glslSound = createGLSLSound(gpu, soundVertexShader, 180);
    playGLSLSound(glslSound, 0);
};

const main = async () => {
    const particleImg = await loadImg(smokeImgUrl);
    const particleMap = createTexture({
        gpu,
        img: particleImg,
    });

    const floorBaseImg = await loadImg(leaveBaseImgUrl);
    floorBaseMap = createTexture({
        gpu,
        img: floorBaseImg,
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
        baseIntensity: 0.2,
        specularIntensity: 0.2,
        // rotationOffset: 0.8,
    });
    // skyboxMesh.enabled = false;

    //
    // attract mesh
    //

    attractSphereMesh = createMesh({
        geometry: createSphereGeometry({ gpu, radius: 2, widthSegments: 32, heightSegments: 32 }),
        material: createUnlitMaterial({
            baseColor: createColor(2, 2, 2, 1),
        }),
    });

    // attractSphereMesh = await createGLTFSphereMesh(
    //     createUnlitMaterial({
    //         baseColor: createColor(2, 2, 2, 1),
    //         // receiveShadow: true,
    //     })
    // );
    subscribeActorOnStart(attractSphereMesh, () => {
        setScaling(attractSphereMesh.transform, createVector3(0.5, 0.5, 0.5));
        // actor.transform.setTranslation(new Vector3(0, 3, 0));
    });
    attractSphereMesh.onFixedUpdate = () => {
        const w = 10;
        const d = 10;
        const ix = v2x(inputController.normalizedInputPosition) * 2 - 1;
        const iy = v2y(inputController.normalizedInputPosition) * 2 - 1;
        const x = ix * w;
        const z = iy * d;
        const y = 1;
        setTranslation(attractSphereMesh.transform, createVector3(x, y, z));
        // console.log(inputController.normalizedInputPosition.x);
    };

    //
    // lighting mesh
    //

    testLightingMesh = createTestLightingSphereMesh(
        createGBufferMaterial({
            baseColor: createColorWhite(),
            metallic: 0,
            roughness: 1,
        })
        // createUnlitMaterial({
        //     baseColor: createColorWhite(),
        // })
    );
    setTranslation(testLightingMesh.transform, createVector3(4, 1, 0));

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
    setScaling(objectSpaceRaymarchMesh.transform, createVector3(10, 10, 10));
    setTranslation(objectSpaceRaymarchMesh.transform, createVector3(0, 1.5, 0));
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
    setScaling(screenSpaceRaymarchMesh.transform, createVector3(2, 2, 2));
    setTranslation(screenSpaceRaymarchMesh.transform, createVector3(0, 4, 0));

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
    setTranslation(textMesh1.transform, createVector3(0, 1, 6));
    setRotationX(textMesh1.transform, -90);
    setScaling(textMesh1.transform, createVector3(0.4, 0.4, 0.4));

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
    setTranslation(textMesh2.transform, createVector3(0, 2, 8));
    setRotationX(textMesh2.transform, -90);
    setScaling(textMesh2.transform, createVector3(0.4, 0.4, 0.4));

    const textMesh3 = createTextMesh({
        gpu,
        text: '0123456789',
        fontTexture: fontAtlasTexture,
        fontAtlas: fontAtlasJson,
        castShadow: true,
        align: TextAlignType.LeftTop,
        characterSpacing: 0.2,
    });
    addActorToScene(captureScene, textMesh3);
    setTranslation(textMesh3.transform, createVector3(0, 0.01, 9));
    setRotationX(textMesh3.transform, -90);
    setScaling(textMesh3.transform, createVector3(0.4, 0.4, 0.4));

    //
    // shape text mesh
    //

    // unlit mesh

    const shapeFontCircuitTextureWidth = 4096;
    const shapeFontCircuitTextureHeight = 1024;

    const shapeFontCircuitRenderer = createShapeFontRenderer(
        shapeFontCircuitService,
        null,
        shapeFontCircuitTextureWidth,
        shapeFontCircuitTextureHeight
    );

    const [, shapeFontCircuitRenderFunc] = shapeFontCircuitService;
    shapeFontCircuitRenderFunc(shapeFontCircuitRenderer);

    // // for debug
    // const img = document.createElement('img');
    // const base64Src = shapeFontCircuitRenderer.canvas.toDataURL();
    // img.src = base64Src;
    // document.body.appendChild(img);

    const shapeFontCircuitTexture = createTexture({
        gpu,
        img: shapeFontCircuitRenderer.canvas,
        width: shapeFontCircuitRenderer.canvasWidth,
        height: shapeFontCircuitRenderer.canvasHeight,
        // logEnabled: true
    });

    const shapeText = createUnlitShapeTextMesh({
        gpu,
        name: 'shape-text-mesh',
        text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        // shapeFont: fontCircuit,
        shapeFontTexture: shapeFontCircuitTexture,
        shapeFontRenderer: shapeFontCircuitRenderer,
        shapeFontService: shapeFontCircuitService,
        planeWidth: 1,
        // ratio: 1,
    });
    addActorToScene(captureScene, shapeText);
    setTranslation(shapeText.transform, createVector3(0, 1, 10));

    // ui mesh

    const uiShapeTextAfterTone = createUIShapeTextMesh({
        gpu,
        name: 'ui-shape-text-mesh',
        text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        // shapeFont: fontCircuit,
        shapeFontTexture: shapeFontCircuitTexture,
        shapeFontRenderer: shapeFontCircuitRenderer,
        shapeFontService: shapeFontCircuitService,
        fontSize: 36,
        align: TextAlignType.Center,
        blendType: BlendTypes.Additive,
        uiQueueType: UIQueueTypes.AfterTone,
        // ratio: 1,
    });
    addActorToScene(captureScene, uiShapeTextAfterTone);
    setUITranslation(uiShapeTextAfterTone, captureScene.uiCamera, createVector3(0, -400, 0));

    const uiShapeTextOverlay = createUIShapeTextMesh({
        gpu,
        name: 'ui-shape-text-mesh',
        text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        // shapeFont: fontCircuit,
        shapeFontTexture: shapeFontCircuitTexture,
        shapeFontRenderer: shapeFontCircuitRenderer,
        shapeFontService: shapeFontCircuitService,
        fontSize: 36,
        align: TextAlignType.Center,
        blendType: BlendTypes.Additive,
        uiQueueType: UIQueueTypes.Overlay,
        // ratio: 1,
    });
    addActorToScene(captureScene, uiShapeTextOverlay);
    setUITranslation(uiShapeTextOverlay, captureScene.uiCamera, createVector3(0, -350, 0));

    //
    // instancing mesh
    //

    skinnedMesh = await createGLTFSkinnedMesh(initialInstanceNum);
    console.log(
        'gltf butterfly',
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
        divColNum: 10,
        divRowNum: 10,
    });
    floorPlaneMesh = createMesh({
        geometry: floorGeometry,
        // material: new PhongMaterial({
        //     // gpu,
        //     // baseMap: floorBaseMap,
        //     // normalMap: floorNormalMap,
        //     envMap: cubeMap,
        //     baseColor: new Color(0, 0, 0, 1),
        //     receiveShadow: true,
        //     specularAmount: 0.4,
        //     ambientAmount: 0.2,
        // }),
        material: createGBufferMaterial({
            // gpu,
            baseMap: floorBaseMap,
            normalMap: floorNormalMap,
            // envMap: cubeMap,
            // baseColor: new Color(0.05, 0.05, 0.05, 1),
            // baseColor: new Color(0, 0, 0, 1),
            baseColor: createColorWhite(),
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
        setScaling(floorPlaneMesh.transform, createVector3(10, 10, 10));
        setRotationX(floorPlaneMesh.transform, -90);
        setMaterialUniformValue(getMeshMaterial(floorPlaneMesh), 'uBaseMapUvScale', createVector2(3, 3));
        setMaterialUniformValue(getMeshMaterial(floorPlaneMesh), 'uNormalMapUvScale', createVector2(3, 3));
    });

    //
    // particle mesh
    //

    const particleNum = 50;

    const particleMesh = createBillboardParticle({
        gpu,
        particleNum,
        vertexShader: billboardParticleVertexShader,
        fragmentShader: billboardParticleFragmentShader,
        minPosition: createVector3(-10, 0, -8),
        maxPosition: createVector3(8, 0.5, 10),
        minSize: 0.5,
        maxSize: 4,
        minColor: createColorFromRGB(200, 190, 180, 50),
        maxColor: createColorFromRGB(250, 240, 230, 200),
        particleMap,
        vertexShaderModifiers: [
            ...(isMinifyShader()
                ? []
                : [
                      {
                          pragma: VertexShaderModifierPragmas.BEGIN_MAIN,
                          value: `
cycleSpeed = .33;
                `,
                      },
                      {
                          pragma: VertexShaderModifierPragmas.LOCAL_POSITION_POST_PROCESS,
                          value: `
localPosition.x += mix(0., 4., r) * mix(.4, .8, cycleOffset);
localPosition.z += mix(0., 4., r) * mix(-.4, -.8, cycleOffset);
                `,
                      },
                      {
                          pragma: VertexShaderModifierPragmas.VERTEX_COLOR_POST_PROCESS,
                          value: `
vertexColor.a *= (smoothstep(0., .2, r) * (1. - smoothstep(.2, 1., r)));
                `,
                      },
                  ]),
        ],
    });

    // gpu particle ---------------------------

    // createTestGPUParticle(gpu);

    // gpu plane trail particle

    // createTestGPUPlaneTrailParticle(gpu);

    // gpu cylindar trail particle

    createTestGPUCylinderTrailParticle(gpu);

    // noise -----------------------------------

    const randomNoiseTextureMesh = createSharedTextureMesh(engine, SharedTexturesTypes.RANDOM_NOISE);
    setScaling(randomNoiseTextureMesh.transform, createFillVector3(1.5));
    setTranslation(randomNoiseTextureMesh.transform, createVector3(8, 1.5, 0));
    addActorToScene(captureScene, randomNoiseTextureMesh);

    const fbmNoiseTextureMesh = createSharedTextureMesh(engine, SharedTexturesTypes.FBM_NOISE);
    setScaling(fbmNoiseTextureMesh.transform, createFillVector3(1.5));
    setTranslation(fbmNoiseTextureMesh.transform, createVector3(8, 1.5, 2));
    addActorToScene(captureScene, fbmNoiseTextureMesh);

    const perlinNoiseTextureMesh = createSharedTextureMesh(engine, SharedTexturesTypes.PERLIN_NOISE);
    setScaling(perlinNoiseTextureMesh.transform, createFillVector3(1.5));
    setTranslation(perlinNoiseTextureMesh.transform, createVector3(8, 1.5, 4));
    addActorToScene(captureScene, perlinNoiseTextureMesh);

    const improvedNoiseTextureMesh = createSharedTextureMesh(engine, SharedTexturesTypes.IMPROVE_NOISE);
    setScaling(improvedNoiseTextureMesh.transform, createFillVector3(1.5));
    setTranslation(improvedNoiseTextureMesh.transform, createVector3(8, 1.5, 6));
    addActorToScene(captureScene, improvedNoiseTextureMesh);

    const simplexNoiseTextureMesh = createSharedTextureMesh(engine, SharedTexturesTypes.SIMPLEX_NOISE);
    setScaling(simplexNoiseTextureMesh.transform, createFillVector3(1.5));
    setTranslation(simplexNoiseTextureMesh.transform, createVector3(8, 1.5, 8));
    addActorToScene(captureScene, simplexNoiseTextureMesh);

    // normal map ------------------------------

    createTestNormalMap(gpu, getSharedTexture(engine, SharedTexturesTypes.PERLIN_NOISE).texture);

    // ---------------------------------------------

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
        setInputControllerSize(inputController, width, height);
        setEngineSize(engine, width, height);
    };

    setOnBeforeStartEngine(engine, () => {
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
        orbitCameraController.lookAtTarget = createVector3(0, -2, 0);
        startOrbitCameraController(orbitCameraController, 0, -40);
        // orbitCameraController.enabled = false;
        orbitCameraController.enabled = true;

        renderer.fogPass.distanceFogStart = 23;
        renderer.fogPass.distanceFogEnd = 150;

        initDebugger();
    });

    // engine.onAfterStart = () => {
    //     window.setTimeout(() => {
    //         onWindowResize()
    //     },1000)
    // }

    setOnBeforeUpdateEngine(engine, () => {
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

function createSharedTextureMesh(engine: Engine, key: SharedTexturesType) {
    const textureMesh = createMesh({
        geometry: createPlaneGeometry({ gpu }),
        material: createUnlitMaterial(),
    });
    subscribeActorOnUpdate(textureMesh, () => {
        getSharedTexture(engine, key).needsUpdate = true;
        setUniformValue(
            getMeshMaterial(textureMesh).uniforms,
            UniformNames.BaseMap,
            getSharedTexture(engine, key).texture
        );
    });
    return textureMesh;
}

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
        initialValue: bufferVisualizerPass.enabled,
        onChange: (value) => {
            if (value) {
                bufferVisualizerPass.enabled = true;
                showBufferVisualizerPassDom(bufferVisualizerPass);
            } else {
                bufferVisualizerPass.enabled = false;
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
        initialValue: v3x(objectSpaceRaymarchMesh.transform.position),
        onChange: (value) => {
            setV3x(objectSpaceRaymarchMesh.transform.position, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'pos y',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: v3y(objectSpaceRaymarchMesh.transform.position),
        onChange: (value) => {
            setV3y(objectSpaceRaymarchMesh.transform.position, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'pos z',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: v3z(objectSpaceRaymarchMesh.transform.position),
        onChange: (value) => {
            setV3z(objectSpaceRaymarchMesh.transform.position, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'scale x',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.001,
        initialValue: v3x(objectSpaceRaymarchMesh.transform.scale),
        onChange: (value) => {
            setV3x(objectSpaceRaymarchMesh.transform.scale, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'scale y',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.001,
        initialValue: v3y(objectSpaceRaymarchMesh.transform.scale),
        onChange: (value) => {
            setV3y(objectSpaceRaymarchMesh.transform.scale, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'scale z',
        minValue: 0,
        maxValue: 5,
        stepValue: 0.001,
        initialValue: v3z(objectSpaceRaymarchMesh.transform.scale),
        onChange: (value) => {
            setV3z(objectSpaceRaymarchMesh.transform.scale, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'rotation x',
        minValue: 0,
        maxValue: 360,
        stepValue: 0.01,
        initialValue: getRotatorDegreeX(objectSpaceRaymarchMesh.transform.rotation),
        onChange: (value) => {
            setRotatorRotationDegreeX(objectSpaceRaymarchMesh.transform.rotation, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'rotation y',
        minValue: 0,
        maxValue: 360,
        stepValue: 0.01,
        initialValue: getRotatorDegreeY(objectSpaceRaymarchMesh.transform.rotation),
        onChange: (value) => {
            setRotatorRotationDegreeY(objectSpaceRaymarchMesh.transform.rotation, value);
        },
    });

    addSliderDebugger(objectSpaceRaymarchMeshDebuggerGroup, {
        label: 'rotation z',
        minValue: 0,
        maxValue: 360,
        stepValue: 0.01,
        initialValue: getRotatorDegreeZ(objectSpaceRaymarchMesh.transform.rotation),
        onChange: (value) => {
            setRotatorRotationDegreeZ(objectSpaceRaymarchMesh.transform.rotation, value);
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
        initialValue: renderer.ambientOcclusionPass.enabled,
        onChange: (value) => (renderer.ambientOcclusionPass.enabled = value),
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
        initialValue: renderer.lightShaftPass.enabled,
        onChange: (value) => (renderer.lightShaftPass.enabled = value),
    });

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
        initialValue: renderer.fogPass.distanceFogStart,
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
        initialValue: renderer.depthOfFieldPass.focusDistance,
        onChange: (value) => {
            renderer.depthOfFieldPass.focusDistance = value;
        },
    });

    addSliderDebugger(dofDebuggerGroup, {
        label: 'DoF focus range',
        minValue: 0.1,
        maxValue: 20,
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

    addToggleDebugger(bloomDebuggerGroup, {
        label: 'Bloom pass enabled',
        initialValue: renderer.bloomPass.enabled,
        onChange: (value) => (renderer.bloomPass.enabled = value),
    });

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
        maxValue: 2,
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
    // ssr debuggers
    //

    addDebuggerBorderSpacer(debuggerGUI);

    const ssrDebuggerGroup = addDebugGroup(debuggerGUI, 'ssr', false);

    addToggleDebugger(ssrDebuggerGroup, {
        label: 'ssr pass enabled',
        initialValue: renderer.ssrPass.enabled,
        onChange: (value) => (renderer.ssrPass.enabled = value),
    });

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
