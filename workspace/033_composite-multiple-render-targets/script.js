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
    GBufferRenderTargets,
    Engine,
    PhongMaterial,
    Vector2,
    BloomPass,
    Geometry,
    Material,
    generateVertexShader,
    UniformTypes,
    BlendTypes,
    AttributeNames,
    clamp,
    OrbitCameraController, TouchInputController, MouseInputController, FragmentPass
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
const inputController = isSP ? new TouchInputController() : new MouseInputController();
inputController.start();

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
const compositeScene = new Scene();

const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
// const pixelRatio = Math.min(window.devicePixelRatio, 1);
// const pixelRatio = ;

const renderer = new ForwardRenderer({
    gpu,
    canvas: canvasElement,
    pixelRatio
});

const engine = new Engine({ gpu, renderer });

engine.setScenes([
    captureScene,
    compositeScene
]);

// const captureSceneCamera = new PerspectiveCamera(60, 1, 0.1, 70);
const captureSceneCamera = new PerspectiveCamera(70, 1, 1, 40);
captureScene.add(captureSceneCamera);

const orbitCameraController = new OrbitCameraController(captureSceneCamera);

const captureSceneDepthRenderTarget = new RenderTarget({
    gpu,
    width: 1, height: 1,
    type: RenderTargetTypes.Depth,
    writeDepthTexture: true,
    name: "capture scene depth render target"
});
const captureSceneColorRenderTarget = new RenderTarget({
    gpu,
    width: 1, height: 1,
    type: RenderTargetTypes.RGBA,
    useDepthBuffer: true,
    name: "capture scene color render target"
});
const gBufferRenderTarget = new GBufferRenderTargets({
    gpu,
    width: 1, height: 1,
    name: "g-buffer render target"
});
const afterGBufferRenderTarget = new RenderTarget({
    gpu,
    type: RenderTargetTypes.Empty,
    width: 1, height: 1,
    name: "after g-buffer render target"
});

const copyDepthSourceRenderTarget = new RenderTarget({
    gpu,
    type: RenderTargetTypes.Empty,
    width: 1, height: 1,
    name: "copy depth source render target"
});

const copyDepthDestRenderTarget = new RenderTarget({
    gpu,
    type: RenderTargetTypes.Depth,
    width: 1, height: 1,
    name: "copy depth dest render target"
});

captureSceneCamera.onStart = ({ actor }) => {
    actor.setClearColor(new Vector4(0, 0, 0, 1));
}
captureSceneCamera.onFixedUpdate = ({ actor }) => {
    // 1: fixed position
    // actor.transform.position = new Vector3(-7 * 1.1, 4.5 * 1.4, 11 * 1.2);
    
    // 2: orbit controls
    if(inputController.isDown) {
        orbitCameraController.setDelta(inputController.deltaNormalizedInputPosition);
    }
    orbitCameraController.fixedUpdate();
}

const directionalLight = new DirectionalLight();
directionalLight.intensity = 1;
directionalLight.color = Color.fromRGB(255, 210, 200);
directionalLight.onStart = ({ actor }) => {
    actor.transform.setTranslation(new Vector3(-8, 8, -2));
    actor.transform.lookAt(new Vector3(0, 0, 0));
    actor.castShadow = true;
    // actor.castShadow = false;
    actor.shadowCamera.near = 1;
    actor.shadowCamera.far = 30;
    actor.shadowCamera.setSize(null, null, -10, 10, -10, 10);
    actor.shadowMap = new RenderTarget({ gpu, width: 1024, height: 1024, type: RenderTargetTypes.Depth });
}
captureScene.add(directionalLight);

const postProcess = new PostProcess({ gpu, renderer });

const bloomPass = new BloomPass({ gpu, threshold: 0.9, bloomAmount: 0.8 });
bloomPass.enabled = true;
postProcess.addPass(bloomPass);

const fxaaPass = new FXAAPass({ gpu });
fxaaPass.enabled = true;
postProcess.addPass(fxaaPass);

const showBuffersPass = new FragmentPass({
    gpu,
    fragmentShader: `#version 300 es
 
precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uBaseColorTexture;
uniform sampler2D uNormalTexture;
uniform sampler2D uDepthTexture;
uniform float uNearClip;
uniform float uFarClip;
uniform float uShowGBuffer;

// ref:
// https://github.com/mrdoob/three.js/blob/master/src/renderers/shaders/ShaderChunk/packing.glsl.js
// https://github.com/mebiusbox/docs/blob/master/%EF%BC%93%E6%AC%A1%E5%85%83%E5%BA%A7%E6%A8%99%E5%A4%89%E6%8F%9B%E3%81%AE%E3%83%A1%E3%83%A2%E6%9B%B8%E3%81%8D.pdf
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
  return (viewZ + near) / (near - far);
}
float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
  return (near * far) / ((far - near) * invClipZ - far);
}

float isArea(vec2 uv) {
    return step(0., uv.x) * (1. - step(1., uv.x)) * step(0., uv.y) * (1. - step(1., uv.y));
}

void main() {
    vec2 baseColorUV = vUv * 2. + vec2(0., -1.);
    vec2 normalUV = vUv * 2. + vec2(-1., -1.);
    vec2 depthUV = vUv * 2.;
    // vec2 depthUV = vUv;
    
    vec4 baseColor = texture(uBaseColorTexture, baseColorUV) * isArea(baseColorUV);
    vec4 normalColor = texture(uNormalTexture, normalUV) * isArea(normalUV);
    
    float rawDepth = texture(uDepthTexture, depthUV).x * isArea(depthUV);
    float z = perspectiveDepthToViewZ(rawDepth, uNearClip, uFarClip);
    float sceneDepth = viewZToOrthographicDepth(z, uNearClip, uFarClip);

    outColor = baseColor + normalColor + sceneDepth;
    // outColor = vec4(vec3(sceneDepth), 1.);
}
`,
    uniforms: {
        uBaseColorTexture: {
            type: UniformTypes.Texture,
            value: null
        },
        uNormalTexture: {
            type: UniformTypes.Texture,
            value: null
        },
        uDepthTexture: {
            type: UniformTypes.Texture,
            value: null
        },
        uNearClip: {
            type: UniformTypes.Float,
            value: captureSceneCamera.near,
        },
        uFarClip: {
            type: UniformTypes.Float,
            value: captureSceneCamera.far,
        },
    }
});
showBuffersPass.enabled = false;
postProcess.addPass(showBuffersPass);

postProcess.enabled = true;
// TODO: set post process いらないかも
captureSceneCamera.setPostProcess(postProcess);


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
        isInstancing: true,
        useVertexColor: true,
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
    });
    
    return skinningMesh;
}

const main = async () => {
    const particleImg = await loadImg("./images/particle-smoke.png");
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
        // actor.material.uniforms.uDiffuseMapUvScale.value = new Vector2(3, 3);
        // actor.material.uniforms.uNormalMapUvScale.value = new Vector2(3, 3);
        actor.material.updateUniform("uDiffuseMapUvScale", new Vector2(3, 3));
        actor.material.updateUniform("uNormalMapUvScale", new Vector2(3, 3));
    }

    const particleNum = 50;
    const particleGeometry = new Geometry({
        gpu,
        attributes: [
            {
                name: AttributeNames.Position,
                // dummy data
                data: new Float32Array(new Array(particleNum).fill(0).map(() => {
                    const x = Math.random() * 18 - 10;
                    const y = Math.random() * 0.5;
                    // const y = 3.;
                    const z = Math.random() * 18 - 8;
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
                name: AttributeNames.Color,
                data: new Float32Array(new Array(particleNum).fill(0).map(() => {
                    const c = Color.fromRGB(
                        Math.random() * 50 + 200,
                        Math.random() * 50 + 190,
                        Math.random() * 50 + 180,
                        Math.random() * 150 + 50,
                    );
                    return [
                        ...c.elements,
                        ...c.elements,
                        ...c.elements,
                        ...c.elements
                    ];
                }).flat()),
                size: 4
            }, {
                name: "aBillboardSize",
                data: new Float32Array(new Array(particleNum).fill(0).map(() => {
                    const s = Math.random() * 3.5 + 0.5;
                    return [s, s, s, s];
                }).flat()),
                size: 1
            }, {
                name: "aBillboardRateOffset",
                data: new Float32Array(new Array(particleNum).fill(0).map(() => {
                    const r = Math.random();
                    return [r, r, r, r];
                }).flat()),
                size: 1,
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
        drawCount: particleNum * 6,
    });
    const particleMaterial = new Material({
        gpu,
        vertexShader: generateVertexShader({
            useVertexColor: true,
            attributeDescriptors: particleGeometry.getAttributeDescriptors(),
            vertexShaderModifier: {
                beginMain: `int particleId = int(mod(float(gl_VertexID), 4.));
float t = 3.;
float r = mod((uTime / t) + aBillboardRateOffset, 1.);
`,
                localPositionPostProcess: `
localPosition.x += mix(0., 4., r) * mix(.4, .8, aBillboardRateOffset);
// localPosition.y += mix(0., 2., r) * mix(.6, 1., aBillboardRateOffset);
localPosition.z += mix(0., 4., r) * mix(-.4, -.8, aBillboardRateOffset);
`,
                // viewPositionPostProcess: `viewPosition.xy += uBillboardPositionConverters[aBillboardVertexIndex] * aBillboardSize;`
                viewPositionPostProcess: `viewPosition.xy += uBillboardPositionConverters[particleId] * aBillboardSize;`,
                lastMain: `
vVertexColor.a *= (smoothstep(0., .2, r) * (1. - smoothstep(.2, 1., r)));
vViewPosition = viewPosition;
`,
            },
            insertUniforms: `
uniform vec2[4] uBillboardPositionConverters;
`,
            insertVaryings: `
out vec4 vViewPosition;
`,
        }),
        fragmentShader: `#version 300 es
            
precision mediump float;

in vec2 vUv;
in vec4 vVertexColor;
in vec4 vViewPosition;

out vec4 outColor;
// layout (location = 0) out vec4 outBaseColor;
// layout (location = 1) out vec4 outNormalColor;

uniform sampler2D uParticleMap;
uniform sampler2D uDepthTexture;
uniform float uNearClip;
uniform float uFarClip;

// ref:
// https://github.com/mrdoob/three.js/blob/master/src/renderers/shaders/ShaderChunk/packing.glsl.js
// https://github.com/mebiusbox/docs/blob/master/%EF%BC%93%E6%AC%A1%E5%85%83%E5%BA%A7%E6%A8%99%E5%A4%89%E6%8F%9B%E3%81%AE%E3%83%A1%E3%83%A2%E6%9B%B8%E3%81%8D.pdf
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
  return (viewZ + near) / (near - far);
}
float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
  return (near * far) / ((far - near) * invClipZ - far);
}

void main() {
    // int particleId = int(mod(float(gl_VertexID), 4.));

    vec4 texColor = texture(uParticleMap, vUv);
    vec3 baseColor = vVertexColor.xyz;
    float alpha = texColor.x * vVertexColor.a;
    
    // calc soft fade
    
    float rawDepth = texelFetch(uDepthTexture, ivec2(gl_FragCoord.xy), 0).x;
    float z = perspectiveDepthToViewZ(rawDepth, uNearClip, uFarClip);
    float sceneDepth = viewZToOrthographicDepth(z, uNearClip, uFarClip);
    // for debug
    // outColor = vec4(vec3(sceneDepth), 1.);
    
    float currentDepth = viewZToOrthographicDepth(vViewPosition.z, uNearClip, uFarClip);
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
            },
            uDepthTexture: {
                type: UniformTypes.Texture,
                // value: captureSceneDepthRenderTarget.read.depthTexture,
                // value: gBufferRenderTarget.read.depthTexture,
                value: null,
            },
            uNearClip: {
                type: UniformTypes.Float,
                value: captureSceneCamera.near
            },
            uFarClip: {
                type: UniformTypes.Float,
                value: captureSceneCamera.far
            }
        },
        // blendType: BlendTypes.Additive
        blendType: BlendTypes.Transparent,
    });
    const particleMesh = new Mesh({
        geometry: particleGeometry,
        material: particleMaterial,
    });
    particleMesh.onFixedUpdate = ({ fixedTime }) => {
        // particleMaterial.uniforms.uTime.value = fixedTime;
        particleMaterial.updateUniform("uTime", fixedTime);
    };

    captureScene.add(skinnedMesh);
    captureScene.add(floorPlaneMesh);
    captureScene.add(skyboxMesh);
    captureScene.add(particleMesh);

    // TODO: engine側に移譲したい
    const onWindowResize = () => {
        width = wrapperElement.offsetWidth;
        height = wrapperElement.offsetHeight;
        inputController.setSize(width, height);
        engine.setSize(width, height);

        gBufferRenderTarget.setSize(width * pixelRatio, height * pixelRatio);
        afterGBufferRenderTarget.setSize(width * pixelRatio, height * pixelRatio);
        copyDepthSourceRenderTarget.setSize(width * pixelRatio, height * pixelRatio);
        copyDepthDestRenderTarget.setSize(width * pixelRatio, height * pixelRatio);
        // console.log(afterGBufferRenderTarget)
    };

    engine.onBeforeStart = () => {
        onWindowResize();
        window.addEventListener('resize', onWindowResize);

        orbitCameraController.distance = isSP ? 20 : 15;
        orbitCameraController.attenuation = 0.01;
        orbitCameraController.dampingFactor = 0.2;
        orbitCameraController.azimuthSpeed = 200;
        orbitCameraController.altitudeSpeed = 200;
        orbitCameraController.lookAtTarget = new Vector3(0, -1, 0);
        orbitCameraController.start(20, -30);
    }
    
    engine.onBeforeUpdate = () => {
        if(!debuggerGUI) initDebugger();
    };
    
    engine.onBeforeFixedUpdate = () => {
        inputController.fixedUpdate();
    }

    engine.onRender = (time, deltaTime) => {
        captureSceneCamera.setRenderTarget(gBufferRenderTarget)
        skyboxMesh.enabled = true;
        floorPlaneMesh.enabled = true;
        skinnedMesh.enabled = true;
        particleMesh.enabled = false;
        renderer.render(captureScene, captureSceneCamera, {});

        afterGBufferRenderTarget.setTexture(gBufferRenderTarget.baseColorTexture);
        afterGBufferRenderTarget.setDepthTexture(gBufferRenderTarget.depthTexture);

        // TODO: copy depth texture
        copyDepthSourceRenderTarget.setDepthTexture(gBufferRenderTarget.depthTexture);
        RenderTarget.blitDepth({
            gpu,
            sourceRenderTarget: copyDepthSourceRenderTarget,
            destRenderTarget: copyDepthDestRenderTarget,
            width: width * pixelRatio, height: height * pixelRatio
        });
        particleMesh.material.updateUniform("uDepthTexture", copyDepthDestRenderTarget.depthTexture);

        captureSceneCamera.setRenderTarget(afterGBufferRenderTarget)
        skyboxMesh.enabled = false;
        floorPlaneMesh.enabled = false;
        skinnedMesh.enabled = false;
        particleMesh.enabled = true;
        renderer.render(captureScene, captureSceneCamera, { useShadowPass: false, clearScene: false });

        showBuffersPass.material.updateUniform("uBaseColorTexture", gBufferRenderTarget.baseColorTexture);
        showBuffersPass.material.updateUniform("uNormalTexture", gBufferRenderTarget.normalTexture);
        showBuffersPass.material.updateUniform("uDepthTexture", gBufferRenderTarget.depthTexture);
        postProcess.render({
            gpu,
            renderer,
            sceneRenderTarget: afterGBufferRenderTarget
        });
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
    });
    
    debuggerGUI.addBorderSpacer();
    
    debuggerGUI.addToggleDebugger({
        label: "show buffers",
        initialValue: showBuffersPass.enabled,
        onChange: (value) => showBuffersPass.enabled = value,
    });

    debuggerGUI.addBorderSpacer();

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

    wrapperElement.appendChild(debuggerGUI.domElement);
}

main();
