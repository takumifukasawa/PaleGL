import {GPU} from "./PaleGL/core/GPU.js";
import {
    BlendTypes,
    CubeMapAxis,
    FaceSide,
    PrimitiveTypes,
    UniformTypes,
    RenderTargetTypes,
    AttributeUsageType
} from "./PaleGL/constants.js";
import {Vector3} from "./PaleGL/math/Vector3.js";
import {Vector4} from "./PaleGL/math/Vector4.js";
import {Matrix4} from "./PaleGL/math/Matrix4.js";
import {Scene} from "./PaleGL/core/Scene.js";
import {ForwardRenderer} from "./PaleGL/core/ForwardRenderer.js";
import {Mesh} from "./PaleGL/actors/Mesh.js";
import {Material} from "./PaleGL/materials/Material.js";
import {PerspectiveCamera} from "./PaleGL/actors/PerspectiveCamera.js";
import {Texture} from "./PaleGL/core/Texture.js";
import {loadImg} from "./PaleGL/loaders/loadImg.js";
import {BoxGeometry} from "./PaleGL/geometries/BoxGeometry.js";
import {PostProcess} from "./PaleGL/postprocess/PostProcess.js";
import {FragmentPass} from "./PaleGL/postprocess/FragmentPass.js";
import {PlaneGeometry} from "./PaleGL/geometries/PlaneGeometry.js";
import {DebuggerGUI} from "./DebuggerGUI.js";
import {DirectionalLight} from "./PaleGL/actors/DirectionalLight.js";
import {loadObj} from "./PaleGL/loaders/loadObj.js";
import {loadGLTF} from "./PaleGL/loaders/loadGLTF.js";
import {Geometry} from "./PaleGL/geometries/Geometry.js";
import {Color} from "./PaleGL/math/Color.js";
import {CubeMap} from "./PaleGL/core/CubeMap.js";
import {loadCubeMap} from "./PaleGL/loaders/loadCubeMap.js";
import {Skybox} from "./PaleGL/actors/Skybox.js";
import {AxesHelper} from "./PaleGL/actors/AxesHelper.js";
import {OrthographicCamera} from "./PaleGL/actors/OrthographicCamera.js";
import {RenderTarget} from "./PaleGL/core/RenderTarget.js";
import {DoubleBuffer} from "./PaleGL/core/DoubleBuffer.js";
import {Engine} from "./PaleGL/core/Engine.js";
import {Actor} from "./PaleGL/actors/Actor.js";
import {SkinnedMesh} from "./PaleGL/actors/SkinnedMesh.js";
import {Bone} from "./PaleGL/core/Bone.js";
import {Rotator} from "./PaleGL/math/Rotator.js";
import {Quaternion} from "./PaleGL/math/Quaternion.js";

let debuggerGUI;
let width, height;
let objMesh;
let floorPlaneMesh;
let cubeMap;
let gltfActor;
let skinningMeshAnimator;
const targetCameraPosition = new Vector3(0, 5, 10);

const wrapperElement = document.getElementById("wrapper");

const canvasElement = document.getElementById("js-canvas");

const objModelVertexShader = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aUv;
layout (location = 2) in vec3 aNormal;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

out vec2 vUv;
out vec3 vNormal;
out vec3 vWorldPosition;

void main() {
    vUv = aUv;
    vNormal = (uNormalMatrix * vec4(aNormal, 1)).xyz;
    vec4 worldPosition = uWorldMatrix * vec4(aPosition, 1);
    vWorldPosition = worldPosition.xyz;
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

const objModelFragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

out vec4 outColor;

uniform vec3 uViewPosition;
uniform samplerCube uCubeTexture;

mat2 rotate(float r) {
    float c = cos(r);
    float s = sin(r);
    return mat2(c, s, -s, c);
}

void main() {
    vec3 N = normalize(vNormal);
    vec3 P = vWorldPosition;
    vec3 E = uViewPosition;
    vec3 PtoE = normalize(E - P);
 
    // ----------------------------------------------------------
    // begin: for cube map sample pattern
    // ----------------------------------------------------------
  
    // pattern_1: raw
    // vec3 reflectDir = reflect(-PtoE, N);
    // vec3 cubeColor = texture(uCubeTexture, reflectDir).xyz;
   
    // pattern_2: reverse x
    // reflectDir *= vec3(-1., 1., 1.);
    // vec3 cubeColor = texture(uCubeTexture, reflectDir).xyz;

    // pattern_3: reverse x and z
    // vec3 reflectDir = reflect(-PtoE, N);
    // reflectDir *= vec3(-1., 1., -1.);
    // vec3 cubeColor = texture(uCubeTexture, reflectDir).xyz;

    // pattern_4: reverse x and rotate
    vec3 reflectDir = reflect(-PtoE, N);
    reflectDir.x *= -1.;
    reflectDir.xz *= rotate(3.14);
    vec3 cubeColor = texture(uCubeTexture, reflectDir).xyz;

    // ----------------------------------------------------------
    // end: for cube map sample pattern
    // ----------------------------------------------------------
   
    outColor = vec4(cubeColor, 1);
}
`;

const gl = canvasElement.getContext('webgl2');

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
    const cameraPosition = Vector3.addVectors(
        actor.transform.position,
        new Vector3(
            (targetCameraPosition.x - actor.transform.position.x) * 0.1,
            (targetCameraPosition.y - actor.transform.position.y) * 0.1,
            (targetCameraPosition.z - actor.transform.position.z) * 0.1
        )
    );
    actor.transform.position = cameraPosition;
}

const directionalLight = new DirectionalLight();
captureScene.add(directionalLight);
directionalLight.onStart = ({ actor }) => {
    actor.transform.setTranslation(new Vector3(4, 12, 4));
    actor.transform.lookAt(new Vector3(0, 0, 0));
    actor.shadowCamera.visibleFrustum = true;
    actor.castShadow = true;
    actor.shadowCamera.near = 1;
    actor.shadowCamera.far = 40;
    actor.shadowCamera.setSize(null, null, -12, 12, -12, 12);
    actor.shadowMap = new RenderTarget({ gpu, width: 1024, height: 1024, type: RenderTargetTypes.Depth });
}

const directionalLightShadowCameraAxesHelper = new AxesHelper({ gpu });
directionalLight.shadowCamera.addChild(directionalLightShadowCameraAxesHelper);

// const testOrtho = new OrthographicCamera(-5, 5, -5, 5, 1, 20);
// testOrtho.visibleFrustum = true;
// testOrtho.transform.setTranslation(new Vector3(-5, 5, 0));
// testOrtho.transform.lookAt(new Vector3(0, 0, 0));
// testOrtho.setRenderTarget(new DoubleBuffer({ width: 512, height: 512, gpu, useDepthBuffer: true }));
// testOrtho.setRenderTarget(new RenderTarget({ width: 512, height: 512, gpu, useDepthBuffer: false }));
// captureScene.add(testOrtho);

const postProcess = new PostProcess({gpu, renderer});
postProcess.addPass(new FragmentPass({
    gpu, fragmentShader: `#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uSceneTexture;
void main() {
    vec4 textureColor = texture(uSceneTexture, vUv);
    float r = texture(uSceneTexture, vUv + vec2(0.01, 0)).r;
    float g = texture(uSceneTexture, vUv + vec2(-0.005, 0)).g;
    float b = texture(uSceneTexture, vUv + vec2(0, 0.005)).b;
    outColor = vec4(r, g, b, 1);
}
`
}));

captureSceneCamera.setPostProcess(postProcess);

const onMouseMove = (e) => {
    const nx = (e.clientX / width) * 2 - 1;
    const ny = ((e.clientY / height) * 2 - 1) * -1;
    targetCameraPosition.x = nx * 20;
    // targetCameraPosition.y = ny * 10 + 12;
    targetCameraPosition.y = ny * 20;
};

const onWindowResize = () => {
    width = wrapperElement.offsetWidth;
    height = wrapperElement.offsetHeight;

    // captureSceneCamera.setSize(width, height);
    // // testOrtho.setSize(width, height);

    // renderer.setSize(width, height);
    // postProcess.setSize(width, height);
    
    engine.setSize(width, height);
};

const createGLTFSkinnedMesh = async () => {
    // const gltfActor = await loadGLTF({ gpu, path: "./models/skin-bone.gltf" });
    // const gltfActor = await loadGLTF({ gpu, path: "./models/skin-bone-single-animation.gltf" });
    gltfActor = await loadGLTF({ gpu, path: "./models/skin-bone-multi-animation.gltf" });
    // gltfActor = await loadGLTF({ gpu, path: "./models/mixamo-idle.gltf" });
    gltfActor.onStart = ({ actor }) => {
        if(actor.animator.animationClips) {
            actor.animator.animationClips.forEach(animationClip => {
                animationClip.loop = true;
            });
        }
    };
    
    skinningMeshAnimator = gltfActor.animator;
 
    const skinningMeshes = gltfActor.transform.children[0].transform.children;
    
    skinningMeshes.forEach(skinningMesh => {

        skinningMesh.castShadow = true;
        
        skinningMesh.material = new Material({
            gpu,
            vertexShader: `#version 300 es
                
                layout(location = 0) in vec3 aPosition;
                layout(location = 1) in vec3 aNormal;
                layout(location = 2) in vec2 aUv;
                layout(location = 3) in vec4 aBoneIndices;
                layout(location = 4) in vec4 aBoneWeights;

                uniform mat4 uWorldMatrix;
                uniform mat4 uViewMatrix;
                uniform mat4 uProjectionMatrix;
                uniform mat4 uNormalMatrix;
                uniform mat4[5] uJointMatrices;
                
                out vec2 vUv;
                out vec3 vNormal;
                
                void main() {
                    vUv = aUv;

                    mat4 skinMatrix =
                         uJointMatrices[int(aBoneIndices[0])] * aBoneWeights.x +
                         uJointMatrices[int(aBoneIndices[1])] * aBoneWeights.y +
                         uJointMatrices[int(aBoneIndices[2])] * aBoneWeights.z +
                         uJointMatrices[int(aBoneIndices[3])] * aBoneWeights.w;
                    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * skinMatrix * vec4(aPosition, 1.);
                    
                    vNormal = normalize(mat3(uWorldMatrix * skinMatrix) * aNormal);
                    // vNormal = (mat4(uWorldMatrix * skinMatrix) * vec4(aNormal, 1.)).xyz;
                    // vNormal = (uWorldMatrix * skinMatrix * vec4(aNormal, 1.)).xyz;
                    
                    // pre calc skinning in cpu
                    // gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
                }
            `,
            fragmentShader: `#version 300 es
                
                precision mediump float;
                
                in vec2 vUv;
                in vec3 vNormal;
                
                out vec4 outColor;

                void main() {
                    outColor = vec4(vNormal, 1.);
                    // outColor = vec4(vec3(vNormal.x), 1.);
                }
                `,
            uniforms: {
                // uBoneOffsetMatrices: {
                //     type: UniformTypes.Matrix4Array,
                //     value: null
                // },
                uJointMatrices: {
                    type: UniformTypes.Matrix4Array,
                    value: null
                },
            }
        });
        skinningMesh.depthMaterial = new Material({
            gpu,
            vertexShader: `#version 300 es
                
                layout(location = 0) in vec3 aPosition;
                layout(location = 1) in vec3 aNormal;
                layout(location = 2) in vec2 aUv;
                layout(location = 3) in vec4 aBoneIndices;
                layout(location = 4) in vec4 aBoneWeights;

                uniform mat4 uWorldMatrix;
                uniform mat4 uViewMatrix;
                uniform mat4 uProjectionMatrix;
                uniform mat4[5] uJointMatrices;
                
                out vec2 vUv;
                
                void main() {
                    vUv = aUv;

                    mat4 skinMatrix =
                         uJointMatrices[int(aBoneIndices[0])] * aBoneWeights.x +
                         uJointMatrices[int(aBoneIndices[1])] * aBoneWeights.y +
                         uJointMatrices[int(aBoneIndices[2])] * aBoneWeights.z +
                         uJointMatrices[int(aBoneIndices[3])] * aBoneWeights.w;
                    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * skinMatrix * vec4(aPosition, 1.);
                    
                    // pre calc skinning in cpu
                    // gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
                }
            `,       
            fragmentShader: `#version 300 es
                
                precision mediump float;
                
                out vec4 outColor;

                void main() {
                    outColor = vec4(1., 1., 1., 1.);
                }
                `,
            uniforms: {
                uJointMatrices: {
                    type: UniformTypes.Matrix4Array,
                    value: null
                },
            }
        });
    });
    
    return gltfActor;
}

const main = async () => {
    captureScene.add(await createGLTFSkinnedMesh());
   
    const objData = await loadObj("./models/sphere-32-32.obj");
    objMesh = new Mesh({
        geometry: new Geometry({
            gpu,
            attributes: {
                position: {
                    data: objData.positions,
                    size: 3
                },
                uv: {
                    data: objData.uvs,
                    size: 2,
                },
                normal: {
                    data: objData.normals,
                    size: 3
                },
            },
            indices: objData.indices,
            drawCount: objData.indices.length,
            castShadow: true,
        }),
        material: new Material({
            gpu,
            vertexShader: objModelVertexShader,
            fragmentShader: objModelFragmentShader,
            primitiveType: PrimitiveTypes.Triangles,
            uniforms: {
                uCubeTexture: {
                    type: UniformTypes.CubeMap,
                    value: null
                },
            }
        }),
        castShadow: true
    });
    objMesh.onStart = ({ actor }) => {
        actor.material.uniforms.uCubeTexture.value = cubeMap;
        actor.transform.setTranslation(new Vector3(0, 2, -5));
        actor.transform.setScaling(new Vector3(2, 2, 2));
    }
    
    const images = {
        [CubeMapAxis.PositiveX]: "./images/px.png",
        [CubeMapAxis.NegativeX]: "./images/nx.png",
        [CubeMapAxis.PositiveY]: "./images/py.png",
        [CubeMapAxis.NegativeY]: "./images/ny.png",
        [CubeMapAxis.PositiveZ]: "./images/pz.png",
        [CubeMapAxis.NegativeZ]: "./images/nz.png",
    };
  
    cubeMap = await loadCubeMap({ gpu, images });
    
    const skyboxMesh = new Skybox({
        gpu, cubeMap
    });
    
    const floorImg = await loadImg("./images/uv-checker.png");
    const floorTexture = new Texture({ gpu, img: floorImg });
    
    floorPlaneMesh = new Mesh({
        geometry: new PlaneGeometry({gpu}),
        material: new Material({
            gpu,
            vertexShader: `#version 300 es
            
            layout(location = 0) in vec3 aPosition;
            layout(location = 1) in vec2 aUv;

            uniform mat4 uWorldMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uShadowMapProjectionMatrix;
            
            out vec2 vUv;
            out vec4 vShadowMapProjectionUv;

            void main() {
                vUv = aUv;
                vec4 worldPosition = uWorldMatrix * vec4(aPosition, 1.);
                vShadowMapProjectionUv = uShadowMapProjectionMatrix * worldPosition;
                gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
            }
            `,
            fragmentShader: `#version 300 es
            
            precision mediump float;
            
            uniform sampler2D uBillboardTexture;
            uniform sampler2D uShadowMap;
            uniform float uShadowBias;
           
            in vec4 vShadowMapProjectionUv; 
            in vec2 vUv;
            
            out vec4 outColor;
            
            void main() {
                outColor = texture(uBillboardTexture, vUv);
                vec3 projectionUv = vShadowMapProjectionUv.xyz / vShadowMapProjectionUv.w;
                vec4 projectionShadowColor = texture(uShadowMap, projectionUv.xy);
                float sceneDepth = projectionShadowColor.r;
                float depthFromLight = projectionUv.z;
           
                float shadowOccluded = clamp(step(0., depthFromLight - sceneDepth - uShadowBias), 0., 1.);
                float shadowAreaRect =
                    step(0., projectionUv.x) * (1. - step(1., projectionUv.x)) *
                    step(0., projectionUv.y) * (1. - step(1., projectionUv.y)) *
                    step(0., projectionUv.z) * (1. - step(1., projectionUv.z));

                float shadowRate = shadowOccluded * shadowAreaRect;
                
                vec4 baseColor = vec4(.1, .1, .1, 1.);
                vec4 shadowColor = vec4(0., 0., 0., 1.);
                vec4 resultColor = mix(baseColor, shadowColor, shadowRate);
                outColor = resultColor;
            }
            `,
            uniforms: {
                uBillboardTexture: {
                    type: UniformTypes.Texture,
                    value: floorTexture
                },
            },
            receiveShadow: true
        })
    });
    floorPlaneMesh.onStart = ({ actor }) => {
        actor.transform.setScaling(Vector3.fill(20));
        actor.transform.setRotationX(-90);
        actor.transform.setTranslation(new Vector3(0, 0, 0));
    }

    captureScene.add(floorPlaneMesh);
    captureScene.add(skyboxMesh);
    captureScene.add(objMesh);

    captureSceneCamera.transform.position = targetCameraPosition.clone();
    captureSceneCamera.transform.lookAt(new Vector3(0, 5, 0));
    captureSceneCamera.postProcess.enabled = false;
    
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
        initialValue: skinningMeshAnimator.animationClips[0].name,
        options: skinningMeshAnimator.animationClips.map(animationClip => ({ value: animationClip.name })),
        initialExec: true,
        onChange: (value) => {
            skinningMeshAnimator.play(value);
        }
    });
    
    debuggerGUI.addSliderDebugger({
        label: "gltf actor position x",
        minValue: -10,
        maxValue: 10,
        stepValue: 0.01,
        initialValue: gltfActor.transform.position.x,
        onChange: (value) => {
            const p = gltfActor.transform.position;
            gltfActor.transform.setTranslation(new Vector3(value, p.y, p.z))
        }
    });
    debuggerGUI.addSliderDebugger({
        label: "gltf actor position y",
        minValue: -10,
        maxValue: 10,
        stepValue: 0.01,
        initialValue: gltfActor.transform.position.y,
        onChange: (value) => {
            const p = gltfActor.transform.position;
            gltfActor.transform.setTranslation(new Vector3(p.x, value, p.z))
        }
    });
    debuggerGUI.addSliderDebugger({
        label: "gltf actor position z",
        minValue: -10,
        maxValue: 10,
        stepValue: 0.01,
        initialValue: gltfActor.transform.position.z,
        onChange: (value) => {
            const p = gltfActor.transform.position;
            gltfActor.transform.setTranslation(new Vector3(p.x, p.y, value))
        }
    });

    debuggerGUI.addSliderDebugger({
        label: "gltf actor rotation x",
        minValue: -180,
        maxValue: 180,
        stepValue: 0.01,
        initialValue: gltfActor.transform.rotation.x,
        onChange: (value) => {
            gltfActor.transform.setRotationX(value);
        }
    });

    debuggerGUI.addSliderDebugger({
        label: "gltf actor rotation y",
        minValue: -180,
        maxValue: 180,
        stepValue: 0.01,
        initialValue: gltfActor.transform.rotation.y,
        onChange: (value) => {
            gltfActor.transform.setRotationY(value);
        }
    });
    
    debuggerGUI.addSliderDebugger({
        label: "gltf actor rotation z",
        minValue: -180,
        maxValue: 180,
        stepValue: 0.01,
        initialValue: gltfActor.transform.rotation.z,
        onChange: (value) => {
            gltfActor.transform.setRotationZ(value);
        }
    });
    
    debuggerGUI.addSliderDebugger({
        label: "gltf actor scale x",
        minValue: -5,
        maxValue: 5,
        stepValue: 0.01,
        initialValue: gltfActor.transform.scale.x,
        onChange: (value) => {
            const scale = gltfActor.transform.scale;
            gltfActor.transform.setScaling(new Vector3(value, scale.y, scale.z));
        }
    });

    debuggerGUI.addSliderDebugger({
        label: "gltf actor scale y",
        minValue: -5,
        maxValue: 5,
        stepValue: 0.01,
        initialValue: gltfActor.transform.scale.y,
        onChange: (value) => {
            const scale = gltfActor.transform.scale;
            gltfActor.transform.setScaling(new Vector3(scale.x, value, scale.z));
        }
    });
    
    console.log(gltfActor.transform)

    debuggerGUI.addSliderDebugger({
        label: "gltf actor scale z",
        minValue: -5,
        maxValue: 5,
        stepValue: 0.01,
        initialValue: gltfActor.transform.scale.z,
        onChange: (value) => {
            const scale = gltfActor.transform.scale;
            gltfActor.transform.setScaling(new Vector3(scale.x, scale.y, value));
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

Vector3.getTangent(new Vector3(0, 0, 1)).log();
Vector3.getTangent(new Vector3(0, 0, -1)).log();
// Vector3.getBinormal(new Vector3(0, 0, 1)).log();
// Vector3.getBinormal(new Vector3(0, 0, -1)).log();
