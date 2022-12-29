import {
    GPU,
    CubeMapAxis,
    RenderTargetTypes,
    TextureWrapTypes,
    TextureFilterTypes,
    Vector3,
    Vector4,
    Scene,
    ForwardRenderer,
    Mesh,
    PerspectiveCamera,
    Texture,
    loadImg,
    PostProcess,
    FXAAPass,
    PlaneGeometry,
    DirectionalLight,
    loadGLTF,
    Color,
    loadCubeMap,
    Skybox,
    RenderTarget,
    Engine,
    PhongMaterial,
    Vector2,
    AxesHelper,
    GaussianBlurPass,
    CopyPass,
    BloomPass,
    Geometry,
    Material,
    generateVertexShader,
    UniformTypes,
    BlendTypes,
    AttributeNames
} from "./pale-gl.js";
import {DebuggerGUI} from "./DebuggerGUI.js";

const debuggerStates = {
    instanceNum: 0,
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

const isSP = !!window.navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i);

const targetCameraPosition = new Vector3(0, 5, 12);

const wrapperElement = document.getElementById("wrapper");

const canvasElement = document.getElementById("js-canvas");

const gl = canvasElement.getContext('webgl2', { antialias: false });

const gpu = new GPU({gl});

const instanceNumView = document.createElement("p");
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
wrapperElement.appendChild(instanceNumView);

const captureScene = new Scene();

const renderer = new ForwardRenderer({
    gpu,
    canvas: canvasElement,
    pixelRatio: Math.min(window.devicePixelRatio, 1.5)
});

const engine = new Engine({ gpu, renderer });

engine.setScene(captureScene);

const captureSceneCamera = new PerspectiveCamera(60, 1, 0.1, 60);
captureScene.add(captureSceneCamera);
captureScene.mainCamera = captureSceneCamera;

captureSceneCamera.onStart = ({ actor }) => {
    actor.transform.setTranslation(targetCameraPosition);
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
directionalLight.color = Color.fromRGB(255, 210, 200);
// directionalLight.color = Color.fromRGB(255, 255, 255);
directionalLight.onStart = ({ actor }) => {
    actor.transform.setTranslation(new Vector3(-8, 8, -2));
    actor.transform.lookAt(new Vector3(0, 0, 0));
    // actor.shadowCamera.visibleFrustum = true;
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

// const gaussianBlurPass = new GaussianBlurPass({ gpu });
// gaussianBlurPass.enabled = true;
// postProcess.addPass(gaussianBlurPass);

const bloomPass = new BloomPass({ gpu, threshold: 0.9, bloomAmount: 0.8 });
bloomPass.enabled = true;
postProcess.addPass(bloomPass);

const fxaaPass = new FXAAPass({ gpu });
fxaaPass.enabled = false;
postProcess.addPass(fxaaPass);

postProcess.enabled = true;
captureSceneCamera.setPostProcess(postProcess);

const updateCamera = (clientX, clientY) => {
    const nx = (clientX / width) * 2 - 1;
    const ny = ((clientY / height) * 2 - 1) * -1;
    targetCameraPosition.x = nx * 20;
    // targetCameraPosition.y = ny * 10 + 12;
    targetCameraPosition.y = ny * 10
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
    const gltfActor = await loadGLTF({ gpu, path: "./models/glass-wind-poly.gltf" });
    
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
   
    skinningMesh.castShadow = true;
    skinningMesh.geometry.instanceCount = instanceNum;

    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    skinningMesh.geometry.setAttribute({
        name: AttributeNames.InstancePosition,
        data: new Float32Array(instanceInfo.position.flat()),
        size: 3,
        // usageType: AttributeUsageType.StaticDraw,
        divisor: 1
    });
    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    skinningMesh.geometry.setAttribute({
        name: AttributeNames.InstanceScale,
        data: new Float32Array(instanceInfo.scale.flat()),
        size: 3,
        // usageType: AttributeUsageType.StaticDraw,
        divisor: 1
    });       
    // aInstanceAnimationOffsetは予約語
    skinningMesh.geometry.setAttribute({
        name: AttributeNames.InstanceAnimationOffset,
        data: new Float32Array(animationOffsetInfo),
        size: 1,
        // usageType: AttributeUsageType.StaticDraw,
        divisor: 1
    });
    skinningMesh.geometry.setAttribute({
        name: AttributeNames.InstanceVertexColor,
        data: new Float32Array(instanceInfo.color.flat()),
        size: 4,
        // usageType: AttributeUsageType.StaticDraw,
        divisor: 1
    });
    skinningMesh.material = new PhongMaterial({
        gpu,
        specularAmount: 0.5,
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
    const particleImg = await loadImg("./images/particle-default.png");
    const particleMap = new Texture({
        gpu,
        img: particleImg,
    });
    
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
            receiveShadow: true,
            specularAmount: 0.4
        }),
        castShadow: false
    });
    floorPlaneMesh.onStart = ({ actor }) => {
        actor.transform.setScaling(Vector3.fill(10));
        actor.transform.setRotationX(-90);
        actor.material.uniforms.uDiffuseMapUvScale.value = new Vector2(3, 3);
        actor.material.uniforms.uNormalMapUvScale.value = new Vector2(3, 3);
    }

    const particleNum = 100;
    const particleGeometry = new Geometry({
        gpu,
        attributes: [
            {
                name: AttributeNames.Position,
                // dummy data
                data: new Float32Array(new Array(particleNum).fill(0).map(() => {
                    const x = Math.random() * 18 - 9;
                    const y = Math.random() * 6;
                    const z = Math.random() * 18 - 9;
                    return [
                        x, y, z,
                        x, y, z,
                        x, y, z,
                        x, y, z,
                    ];
                }).flat()),
                size: 3
            }, {
                name: AttributeNames.Uv,
                data: new Float32Array(new Array(particleNum).fill(0).map(() => [
                    0, 1,
                    0, 0,
                    1, 1,
                    1, 0,
                ]).flat()),
                size: 2
            }, {
                name: "aBillboardVertexIndex",
                data: new Uint16Array(new Array(particleNum).fill(0).map(() => [
                // data: new Float32Array([
                    0,
                    1,
                    2,
                    3,
                ]).flat()),
                size: 1
            }, {
                name: "aBillboardSize",
                data: new Float32Array(new Array(particleNum).fill(0).map(() => {
                    const s = Math.random() * .8 + .2;
                    return [s, s, s, s];
                }).flat()),
                size: 1
            }
        ],
        indices: new Array(particleNum).fill(0).map((_, i) => {
            const offset = i * 4;
            const index = [
                0 + offset, 1 + offset, 2 + offset,
                2 + offset, 1 + offset, 3 + offset
            ];
            return index;
        }).flat(),
        drawCount: particleNum * 6
    });
    const particleMaterial = new Material({
        gpu,
        vertexShader: generateVertexShader({
            attributeDescriptors: particleGeometry.getAttributeDescriptors(),
            vertexShaderModifier: {
                localPositionPostProcess: `
localPosition.y += sin(uTime * 4.);
`,
                viewPositionPostProcess: `viewPosition.xy += uBillboardPositionConverters[aBillboardVertexIndex] * aBillboardSize;`
            },
            insertUniforms: `
uniform vec2[4] uBillboardPositionConverters;
`,
        }),
        fragmentShader: `#version 300 es
            
precision mediump float;

in vec2 vUv;
out vec4 outColor;
uniform sampler2D uParticleMap;

void main() {
    vec4 baseColor = texture(uParticleMap, vUv);
    float alpha = baseColor.x;
    outColor = vec4(baseColor.xyz, alpha);
    // outColor = vec4(1, 0, 0, 1);
}
        `,
        uniforms: {
            uParticleMap: {
                type: UniformTypes.Texture,
                value: particleMap,
            },
            uBillboardPositionConverters: {
                type: UniformTypes.Vector2Array,
                value: [
                    new Vector2(-1, 1),
                    new Vector2(-1, -1),
                    new Vector2(1, 1),
                    new Vector2(1, -1),
                ],
            },
            uTime: {
                type: UniformTypes.Float,
                value: 0,
            }
        },
        blendType: BlendTypes.Additive
    });
    const particleMesh = new Mesh({
        geometry: particleGeometry,
        material: particleMaterial,
    });
    particleMesh.onFixedUpdate = ({ fixedTime }) => {
        particleMaterial.uniforms.uTime.value = fixedTime;
    };
   
    captureScene.add(floorPlaneMesh);
    captureScene.add(skyboxMesh);
    captureScene.add(particleMesh);
    
    captureSceneCamera.transform.position = targetCameraPosition.clone();
    captureSceneCamera.transform.lookAt(new Vector3(0, 0, 0));
   
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

    // debuggerGUI.addToggleDebugger({
    //     label: "gaussian blur pass enabled",
    //     initialValue: gaussianBlurPass.enabled,
    //     onChange: (value) => gaussianBlurPass.enabled = value,
    // })

    debuggerGUI.addToggleDebugger({
        label: "bloom pass enabled",
        initialValue: bloomPass.enabled,
        onChange: (value) => bloomPass.enabled = value,
    })

    debuggerGUI.addSliderDebugger({
        label: "bloom amount",
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: bloomPass.bloomAmount,
        onChange: (value) => {
            bloomPass.bloomAmount = value;
        }
    })
    
    debuggerGUI.addSliderDebugger({
        label: "bloom threshold",
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: bloomPass.threshold,
        onChange: (value) => {
            bloomPass.threshold = value;
        }
    })
    
    debuggerGUI.addSliderDebugger({
        label: "bloom tone",
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: bloomPass.tone,
        onChange: (value) => {
            bloomPass.tone = value;
        }
    })

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: "fxaa pass enabled",
        initialValue: fxaaPass.enabled,
        onChange: (value) => fxaaPass.enabled = value,
    })

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: "postprocess enabled",
        initialValue: postProcess.enabled,
        onChange: (value) => postProcess.enabled = value,
    })

    wrapperElement.appendChild(debuggerGUI.domElement);
}

main();
