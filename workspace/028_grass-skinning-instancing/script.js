import {
    PrimitiveTypes,
    GPU,
    CubeMapAxis,
    UniformTypes,
    RenderTargetTypes,
    TextureWrapTypes,
    TextureFilterTypes,
    Vector3,
    Vector4,
    Matrix4,
    Scene,
    ForwardRenderer,
    Mesh,
    Material,
    PerspectiveCamera,
    Texture,
    loadImg,
    PostProcess,
    FragmentPass,
    FXAAPass,
    PlaneGeometry,
    DirectionalLight,
    loadObj,
    loadGLTF,
    Geometry,
    Color,
    loadCubeMap,
    Skybox,
    AxesHelper,
    RenderTarget,
    Engine,
    PhongMaterial,
    Vector2,
    generateVertexShader, RenderQueues, FaceSide, BlendTypes, GaussianBlurPass, AttributeUsageType,
} from "./pale-gl.js";
import {DebuggerGUI} from "./DebuggerGUI.js";

const instanceNum = Math.pow(Number.parseInt(location.search.split("=")[1], 10) || 5, 2);
console.log(`instance num: ${instanceNum}`);

let debuggerGUI;
let width, height;
let floorPlaneMesh;
let floorDiffuseMap;
let floorNormalMap;
let gltfActor;
let skinningMeshes;
let skinningMeshAnimator;
const targetCameraPosition = new Vector3(0, 5, 10);

const wrapperElement = document.getElementById("wrapper");

const canvasElement = document.getElementById("js-canvas");

const gl = canvasElement.getContext('webgl2', { antialias: false });

const gpu = new GPU({gl});

const captureScene = new Scene();

const renderer = new ForwardRenderer({
        gpu,
        canvas: canvasElement,
        pixelRatio: Math.min(window.devicePixelRatio, 1.5)
    }
);

const engine = new Engine({ gpu, renderer });

engine.setScene(captureScene);

const captureSceneCamera = new PerspectiveCamera(90, 1, 0.1, 100);
captureScene.add(captureSceneCamera);
captureScene.mainCamera = captureSceneCamera;

captureSceneCamera.onStart = ({ actor }) => {
    actor.transform.setTranslation(new Vector3(0, 0, 5));
    actor.setClearColor(new Vector4(0, 0, 0, 1));
}
captureSceneCamera.onFixedUpdate = ({ actor }) => {
    // 1: move position with mouse
    const cameraPosition = Vector3.addVectors(
        actor.transform.position,
        new Vector3(
            (targetCameraPosition.x - actor.transform.position.x) * 0.1,
            (targetCameraPosition.y - actor.transform.position.y) * 0.1,
            (targetCameraPosition.z - actor.transform.position.z) * 0.1
        )
    );
    actor.transform.position = cameraPosition;
    
    // 2: fixed position
    // actor.transform.position = new Vector3(0, 5, 10);
}

const directionalLight = new DirectionalLight();
directionalLight.intensity = 1;
directionalLight.color = Color.fromRGB(255, 255, 255);
directionalLight.onStart = ({ actor }) => {
    actor.transform.setTranslation(new Vector3(4, 12, 4));
    actor.transform.lookAt(new Vector3(0, 0, 0));
    actor.shadowCamera.visibleFrustum = true;
    actor.castShadow = true;
    actor.shadowCamera.near = 1;
    actor.shadowCamera.far = 30;
    actor.shadowCamera.setSize(null, null, -8, 8, -8, 8);
    actor.shadowMap = new RenderTarget({ gpu, width: 1024, height: 1024, type: RenderTargetTypes.Depth });
}
captureScene.add(directionalLight);

const directionalLightShadowCameraAxesHelper = new AxesHelper({ gpu });
directionalLight.shadowCamera.addChild(directionalLightShadowCameraAxesHelper);

const postProcess = new PostProcess({ gpu, renderer });

const fxaaPass = new FXAAPass({ gpu });
fxaaPass.enabled = false;
postProcess.addPass(fxaaPass);

captureSceneCamera.setPostProcess(postProcess);

const onMouseMove = (e) => {
    const nx = (e.clientX / width) * 2 - 1;
    const ny = ((e.clientY / height) * 2 - 1) * -1;
    targetCameraPosition.x = nx * 20;
    targetCameraPosition.y = ny * 10 + 12;
};

const onWindowResize = () => {
    width = wrapperElement.offsetWidth;
    height = wrapperElement.offsetHeight;
    engine.setSize(width, height);
};

const createGLTFSkinnedMesh = async () => {
    gltfActor = await loadGLTF({ gpu, path: "./models/glass-wind.gltf" });
   
    gltfActor.onStart = ({ actor }) => {
        if(actor.animator.animationClips) {
            actor.animator.animationClips.forEach(animationClip => {
                animationClip.loop = true;
            });
        }
    };

    const scale = 0.2;
    const baseOffset = 0.5;
    const randomOffset = 0.25;

    gltfActor.transform.setScaling(Vector3.fill(scale));
    
    skinningMeshAnimator = gltfActor.animator;
 
    skinningMeshes = gltfActor.transform.children[0].transform.children;
   
    // skinningMeshは一個だけどloopで処理しちゃう
    skinningMeshes.forEach(skinningMesh => {
        // ルートにanimatorをattachしてるので一旦ここでassign
        skinningMesh.setAnimationClips(skinningMeshAnimator.animationClips);

        const sideNum = Math.sqrt(instanceNum);
        const getInstanceIndexInfo = (i) => {
            // const x = i % sideNum - (sideNum - 1) * 0.5;
            // const z = Math.floor(i / sideNum) - (sideNum - 1) * 0.5;
            const x = i % sideNum;
            const z = Math.floor(i / sideNum);
            return { x, z }
        }
        
        skinningMesh.castShadow = true;
        skinningMesh.geometry.instanceCount = instanceNum;
        // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
        skinningMesh.geometry.setAttribute("aInstancePositionOffset", {
            data: new Array(instanceNum).fill(0).map((_, i) => {
                const { x, z } = getInstanceIndexInfo(i);
                return [
                    baseOffset * x - (baseOffset * sideNum * 0.5) + Math.random() * randomOffset - randomOffset * 0.5,
                    0,
                    baseOffset * z - (baseOffset * sideNum * 0.5) + Math.random() * randomOffset - randomOffset * 0.5
                ];
            }).flat(),
            size: 3,
            usageType: AttributeUsageType.StaticDraw,
            divisor: 1
        });
        // aInstanceAnimationOffsetは予約語
        skinningMesh.geometry.setAttribute("aInstanceAnimationOffset", {
            data: new Array(instanceNum).fill(0).map((_, i) => {
                const { x, z } = getInstanceIndexInfo(i);
                return x * z * 0.1;
            }),
            size: 1,
            usageType: AttributeUsageType.StaticDraw,
            divisor: 1
        });
        skinningMesh.material = new PhongMaterial({
            gpu,
            diffuseColor: new Color(0, 1, 0, 1),
            receiveShadow: true,
            isSkinning: true,
            gpuSkinning: true,
            vertexShaderModifier: {
                worldPositionPostProcess: `
    mat4 instancePositionOffset = mat4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        aInstancePositionOffset.x, aInstancePositionOffset.y, aInstancePositionOffset.z, 1
    );
    worldPosition = instancePositionOffset * worldPosition;
`,
            }
        });
    });
}

const main = async () => {
    const floorDiffuseImg = await loadImg("./images/blue_floor_tiles_01_diff_1k.png");
    floorDiffuseMap = new Texture({
        gpu,
        img: floorDiffuseImg,
        // mipmap: true,
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
        minFilter: TextureFilterTypes.Linear,
        magFilter: TextureFilterTypes.Linear,
    });

    const floorNormalImg = await loadImg("./images/blue_floor_tiles_01_nor_gl_1k.png");
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
        [CubeMapAxis.PositiveX]: "./images/px.png",
        [CubeMapAxis.NegativeX]: "./images/nx.png",
        [CubeMapAxis.PositiveY]: "./images/py.png",
        [CubeMapAxis.NegativeY]: "./images/ny.png",
        [CubeMapAxis.PositiveZ]: "./images/pz.png",
        [CubeMapAxis.NegativeZ]: "./images/nz.png",
    };

    const cubeMap = await loadCubeMap({ gpu, images });
    const skyboxMesh = new Skybox({
        gpu, cubeMap
    });

    await createGLTFSkinnedMesh()
    captureScene.add(gltfActor);

    const floorGeometry = new PlaneGeometry({gpu, calculateTangent: true, calculateBinormal: true});
    floorPlaneMesh = new Mesh({
        geometry: floorGeometry,
        material: new PhongMaterial({
            gpu,
            diffuseMap: floorDiffuseMap,
            normalMap: floorNormalMap,
            receiveShadow: true
        })
    });
    floorPlaneMesh.onStart = ({ actor }) => {
        actor.transform.setScaling(Vector3.fill(10));
        actor.transform.setRotationX(-90);
        actor.transform.setTranslation(new Vector3(0, 0, 0));
        actor.material.uniforms.uDiffuseMapUvScale.value = new Vector2(3, 3);
        actor.material.uniforms.uNormalMapUvScale.value = new Vector2(3, 3);
    }
   
    captureScene.add(floorPlaneMesh);
    captureScene.add(skyboxMesh);
    
    captureSceneCamera.transform.position = targetCameraPosition.clone();
    captureSceneCamera.transform.lookAt(new Vector3(0, 5, 0));
    
    window.addEventListener("mousemove", onMouseMove);

    onWindowResize();
    window.addEventListener('resize', onWindowResize);
  
    engine.onBeforeUpdate = () => {
        if(!debuggerGUI) initDebugger();
    };
    
    const tick = (time) => {
        engine.run(time);
        requestAnimationFrame(tick);
    }
    
    engine.start();
    requestAnimationFrame(tick);
}

function initDebugger() {

    debuggerGUI = new DebuggerGUI();

    debuggerGUI.addPullDownDebugger({
        label: "animations",
        initialValue: skinningMeshAnimator.animationClips[0].name, // index: 0 のアニメーションがなぜか消せないのでとりあえず
        options: skinningMeshAnimator.animationClips.map(animationClip => ({ value: animationClip.name })),
        initialExec: true,
        onChange: (value) => {
            skinningMeshAnimator.play(value);
        }
    });

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: "fxaa pass enabled",
        initialValue: fxaaPass.enabled,
        onChange: (value) => fxaaPass.enabled = value,
    })

    debuggerGUI.addSliderDebugger({
        label: "fxaa contrast threshold",
        initialValue: fxaaPass.mesh.material.uniforms.uContrastThreshold.value,
        minValue: 0.0312,
        maxValue: 0.0833,
        stepValue: 0.001,
        onChange: (value) => {
            fxaaPass.mesh.material.uniforms.uContrastThreshold.value = value;
        }
    });

    debuggerGUI.addSliderDebugger({
        label: "fxaa relative threshold",
        initialValue: fxaaPass.mesh.material.uniforms.uRelativeThreshold.value,
        minValue: 0.063,
        maxValue: 0.333,
        stepValue: 0.001,
        onChange: (value) => {
            fxaaPass.mesh.material.uniforms.uRelativeThreshold.value = value;
        }
    });
    
    debuggerGUI.addSliderDebugger({
        label: "fxaa subpixel blending",
        initialValue: fxaaPass.mesh.material.uniforms.uSubpixelBlending.value,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.01,
        onChange: (value) => {
            fxaaPass.mesh.material.uniforms.uSubpixelBlending.value = value;
        }
    });
    
    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: "Enabled Post Process",
        initialValue: captureSceneCamera.postProcess.enabled,
        onChange: (value) => {
            captureSceneCamera.postProcess.enabled = value;
        }
    });

    wrapperElement.appendChild(debuggerGUI.domElement);
}

main();
