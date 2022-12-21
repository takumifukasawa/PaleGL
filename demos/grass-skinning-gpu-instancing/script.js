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

const debuggerStates = {
    instanceNum: 0,
    castShadow: true
}

const searchParams = new URLSearchParams(location.search);
const instanceNum = searchParams.has("instance-num")
    ? Number.parseInt(searchParams.get("instance-num"), 10)
    : 500;
console.log(`instance num: ${instanceNum}`);

debuggerStates.instanceNum = instanceNum;

let debuggerGUI;
let width, height;
let floorPlaneMesh;
let floorDiffuseMap;
let floorNormalMap;
let skinnedMesh;

const isSP = !!window.navigator.userAgent.match(/(iPhone|iPad|Android)/i);

const targetCameraPosition = new Vector3(0, 5, 12);

const wrapperElement = document.getElementById("wrapper");

const canvasElement = document.getElementById("js-canvas");

const gl = canvasElement.getContext('webgl2', { antialias: false });

const gpu = new GPU({gl});

const instanceNumView = document.createElement("p");
instanceNumView.textContent = `instance num: ${instanceNum}`;
instanceNumView.style.cssText = `
position: absolute;
top: 0;
left: 0;
padding: 0.2em 0.5em;
font-size: 9px;
color: white;
font-weight: bold;
text-shadow: rgba(0, 0, 0, 0.7) 1px 1px;
`;
wrapperElement.appendChild(instanceNumView);

const captureScene = new Scene();

const renderer = new ForwardRenderer({
    gpu,
    canvas: canvasElement,
    pixelRatio: Math.min(window.devicePixelRatio, 1.5)
});

const engine = new Engine({ gpu, renderer });

engine.setScene(captureScene);

const captureSceneCamera = new PerspectiveCamera(60, 1, 0.1, 50);
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
    // actor.transform.position = new Vector3(-7 * 1.1, 4.5 * 1.4, 11 * 1.2);
}

const directionalLight = new DirectionalLight();
directionalLight.intensity = 1;
directionalLight.color = Color.fromRGB(255, 190, 180);
directionalLight.onStart = ({ actor }) => {
    actor.transform.setTranslation(new Vector3(-8, 8, -2));
    actor.transform.lookAt(new Vector3(0, 0, 0));
    actor.shadowCamera.visibleFrustum = false;
    actor.castShadow = true;
    actor.shadowCamera.near = 1;
    actor.shadowCamera.far = 30;
    actor.shadowCamera.setSize(null, null, -10, 10, -10, 10);
    actor.shadowMap = new RenderTarget({ gpu, width: 1024, height: 1024, type: RenderTargetTypes.Depth });
}
captureScene.add(directionalLight);

// const directionalLightShadowCameraAxesHelper = new AxesHelper({ gpu });
// directionalLight.shadowCamera.addChild(directionalLightShadowCameraAxesHelper);

const postProcess = new PostProcess({ gpu, renderer });

const fxaaPass = new FXAAPass({ gpu });
fxaaPass.enabled = true;
postProcess.addPass(fxaaPass);

postProcess.enabled = false;
captureSceneCamera.setPostProcess(postProcess);

const updateCamera = (clientX, clientY) => {
    const nx = (clientX / width) * 2 - 1;
    const ny = ((clientY / height) * 2 - 1) * -1;
    targetCameraPosition.x = nx * 20;
    targetCameraPosition.y = ny * 10 + 12;
}

const onMouseMove = (e) => {
    updateCamera(e.clientX, e.clientY);
};

const onTouch = (e) => {
    const touch = e.touches[0];
    updateCamera(touch.clientX, touch.clientY);
}

const onWindowResize = () => {
    width = wrapperElement.offsetWidth;
    height = wrapperElement.offsetHeight;
    engine.setSize(width, height);
};

const createGLTFSkinnedMesh = async () => {
    // const gltfActor = await loadGLTF({ gpu, path: "./models/glass-wind-with-tangents.gltf" });
    const gltfActor = await loadGLTF({ gpu, path: "./models/glass-wind-poly.gltf" });
    
    // const diffuseImg = await loadImg("./images/thatch_roof_angled_diff_256.jpg");
    // const diffuseMap = new Texture({
    //     gpu,
    //     img: diffuseImg,
    //     wrapS: TextureWrapTypes.Repeat,
    //     wrapT: TextureWrapTypes.Repeat,
    //     minFilter: TextureFilterTypes.Linear,
    //     magFilter: TextureFilterTypes.Linear,
    // });
    // 
    // const normalImg = await loadImg("./images/thatch_roof_angled_nor_gl_256.jpg");
    // const normalMap = new Texture({
    //     gpu,
    //     img: normalImg,
    //     wrapS: TextureWrapTypes.Repeat,
    //     wrapT: TextureWrapTypes.Repeat,
    //     minFilter: TextureFilterTypes.Linear,
    //     magFilter: TextureFilterTypes.Linear,
    // });

    const skinningMesh = gltfActor.transform.children[0].transform.children[0];
   
    // ルートにanimatorをattachしてるので一旦ここでassign
    skinningMesh.setAnimationClips(gltfActor.animator.animationClips);

    const instanceInfo = {
        position: [],
        scale: [],
        color: []
    };
    new Array(instanceNum).fill(0).forEach((_, i) => {
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
    const animationOffsetInfo = instanceInfo.position.map(([x, _, z]) => {
        const animationOffsetAdjust = (Math.random() * 0.6 - 0.3) + 2;
        return (-x + z) * animationOffsetAdjust;
    });
   
    // skinningMesh.debugBoneView = true;
    skinningMesh.castShadow = debuggerStates.castShadow;
    skinningMesh.geometry.instanceCount = instanceNum;

    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    skinningMesh.geometry.setAttribute({
        name: "aInstancePosition",
        data: instanceInfo.position.flat(),
        size: 3,
        usageType: AttributeUsageType.StaticDraw,
        divisor: 1
    });
    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    skinningMesh.geometry.setAttribute({
        name: "aInstanceScale",
        data: instanceInfo.scale.flat(),
        size: 3,
        usageType: AttributeUsageType.StaticDraw,
        divisor: 1
    });       
    // aInstanceAnimationOffsetは予約語
    skinningMesh.geometry.setAttribute({
        name: "aInstanceAnimationOffset",
        data: animationOffsetInfo,
        size: 1,
        usageType: AttributeUsageType.StaticDraw,
        divisor: 1
    });
    skinningMesh.geometry.setAttribute({
        name: "aInstanceVertexColor",
        data: instanceInfo.color.flat(),
        size: 4,
        usageType: AttributeUsageType.StaticDraw,
        divisor: 1
    });
    skinningMesh.material = new PhongMaterial({
        gpu,
        diffuseColor: new Color(1, 1, 1, 1),
        // diffuseMap,
        // normalMap,
        receiveShadow: true,
        isSkinning: true,
        gpuSkinning: true,
        vertexShaderModifier: {
            worldPositionPostProcess: `
    mat4 instanceTransform = mat4(
        aInstanceScale.x,       0,                      0,                      0,
        0,                      aInstanceScale.y,       0,                      0,
        0,                      0,                      aInstanceScale.z,       0,
        aInstancePosition.x,    aInstancePosition.y,    aInstancePosition.z,    1
    );
    // 本当はworldMatrixをかける前の方がよい
    worldPosition = instanceTransform * worldPosition;
`,
                outClipPositionPreProcess: `
    vVertexColor = aInstanceVertexColor;
`
        },
        // uniforms: {
        //     uDiffuseMapUvScale: {
        //         type: UniformTypes.Vector2,
        //         value: new Vector2(0.1, 0.5),
        //     },
        //     uNormalMapUvScale: {
        //         type: UniformTypes.Vector2,
        //         value: new Vector2(0.1, 0.5),
        //     },
        // }
    });
    
    return skinningMesh;
}

const main = async () => {
    const floorDiffuseImg = await loadImg("./images/brown_mud_leaves_01_diff_1k.jpg");
    floorDiffuseMap = new Texture({
        gpu,
        img: floorDiffuseImg,
        // mipmap: true,
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
        minFilter: TextureFilterTypes.Linear,
        magFilter: TextureFilterTypes.Linear,
    });

    const floorNormalImg = await loadImg("./images/brown_mud_leaves_01_nor_gl_1k.jpg");
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
        [CubeMapAxis.PositiveX]: "./images/px.jpg",
        [CubeMapAxis.NegativeX]: "./images/nx.jpg",
        [CubeMapAxis.PositiveY]: "./images/py.jpg",
        [CubeMapAxis.NegativeY]: "./images/ny.jpg",
        [CubeMapAxis.PositiveZ]: "./images/pz.jpg",
        [CubeMapAxis.NegativeZ]: "./images/nz.jpg",
    };

    const cubeMap = await loadCubeMap({ gpu, images });
    const skyboxMesh = new Skybox({
        gpu, cubeMap,
        rotationOffset: 0.8
    });
    
    skinnedMesh = await createGLTFSkinnedMesh();
    captureScene.add(skinnedMesh);

    const floorGeometry = new PlaneGeometry({gpu, calculateTangent: true, calculateBinormal: true});
    floorPlaneMesh = new Mesh({
        geometry: floorGeometry,
        material: new PhongMaterial({
            gpu,
            diffuseMap: floorDiffuseMap,
            normalMap: floorNormalMap,
            receiveShadow: true
        }),
        castShadow: false
    });
    floorPlaneMesh.onStart = ({ actor }) => {
        actor.transform.setScaling(Vector3.fill(10));
        actor.transform.setRotationX(-90);
        actor.material.uniforms.uDiffuseMapUvScale.value = new Vector2(3, 3);
        actor.material.uniforms.uNormalMapUvScale.value = new Vector2(3, 3);
    }
   
    captureScene.add(floorPlaneMesh);
    captureScene.add(skyboxMesh);
    
    captureSceneCamera.transform.position = targetCameraPosition.clone();
    captureSceneCamera.transform.lookAt(new Vector3(0, -3, 0));
   
    if(isSP) {
        window.addEventListener("touchstart", onTouch);
        window.addEventListener("touchmove", onTouch);
    } else {
        window.addEventListener("mousemove", onMouseMove);
    }

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

    debuggerGUI.addSliderDebugger({
        label: "instance num",
        minValue: 1,
        maxValue: 40000,
        initialValue: debuggerStates.instanceNum,
        onChange: (value) => {
            debuggerStates.instanceNum = value;
        }
    });
    
    debuggerGUI.addButtonDebugger({
        buttonLabel: "reload",
        onClick: () => {
            const url = `${location.origin}${location.pathname}?instance-num=${debuggerStates.instanceNum}`;
            location.replace(url);
        }
    })
    
    debuggerGUI.addBorderSpacer();
    
    debuggerGUI.addToggleDebugger({
        label: "cast shadow",
        initialValue: debuggerStates.castShadow,
        onChange: (value) => {
            skinnedMesh.castShadow = value;
        }
    });
   
    // debuggerGUI.addBorderSpacer();

    // debuggerGUI.addToggleDebugger({
    //     label: "fxaa pass enabled",
    //     initialValue: fxaaPass.enabled,
    //     onChange: (value) => fxaaPass.enabled = value,
    // });

    // debuggerGUI.addSliderDebugger({
    //     label: "fxaa contrast threshold",
    //     initialValue: fxaaPass.mesh.material.uniforms.uContrastThreshold.value,
    //     minValue: 0.0312,
    //     maxValue: 0.0833,
    //     stepValue: 0.001,
    //     onChange: (value) => {
    //         fxaaPass.mesh.material.uniforms.uContrastThreshold.value = value;
    //     }
    // });

    // debuggerGUI.addSliderDebugger({
    //     label: "fxaa relative threshold",
    //     initialValue: fxaaPass.mesh.material.uniforms.uRelativeThreshold.value,
    //     minValue: 0.063,
    //     maxValue: 0.333,
    //     stepValue: 0.001,
    //     onChange: (value) => {
    //         fxaaPass.mesh.material.uniforms.uRelativeThreshold.value = value;
    //     }
    // });
    // 
    // debuggerGUI.addSliderDebugger({
    //     label: "fxaa subpixel blending",
    //     initialValue: fxaaPass.mesh.material.uniforms.uSubpixelBlending.value,
    //     minValue: 0,
    //     maxValue: 1,
    //     stepValue: 0.01,
    //     onChange: (value) => {
    //         fxaaPass.mesh.material.uniforms.uSubpixelBlending.value = value;
    //     }
    // });
    // 
    // debuggerGUI.addBorderSpacer();

    // debuggerGUI.addToggleDebugger({
    //     label: "Enabled Post Process",
    //     initialValue: captureSceneCamera.postProcess.enabled,
    //     onChange: (value) => {
    //         captureSceneCamera.postProcess.enabled = value;
    //     }
    // });

    wrapperElement.appendChild(debuggerGUI.domElement);
}

main();
