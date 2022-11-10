import {GPU} from "./PaleGL/core/GPU.js";
import {BlendTypes, CubeMapAxis, FaceSide, PrimitiveTypes, UniformTypes, RenderTargetTypes} from "./PaleGL/constants.js";
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
import {Geometry} from "./PaleGL/geometries/Geometry.js";
import {Color} from "./PaleGL/math/Color.js";
import {CubeMap} from "./PaleGL/core/CubeMap.js";
import {loadCubeMap} from "./PaleGL/loaders/loadCubeMap.js";
import {Skybox} from "./PaleGL/actors/Skybox.js";
import {ArrowHelper} from "./PaleGL/actors/ArrowHelper.js";
import {OrthographicCamera} from "./PaleGL/actors/OrthographicCamera.js";
import {RenderTarget} from "./PaleGL/core/RenderTarget.js";
import {DoubleBuffer} from "./PaleGL/core/DoubleBuffer.js";
import {Engine} from "./PaleGL/core/Engine.js";

let width, height;
let objMesh;
let floorPlaneMesh;
let cubeMap;
const targetCameraPosition = new Vector3(0, 5, 10);

const states = {
    shadowBias: 0.01,
    shadowMapWidth: 1024,
    shadowMapHeight: 1024,
}

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
    actor.transform.setTranslation(new Vector3(5, 5, 5));
    actor.transform.lookAt(new Vector3(0, 0, 0));
    actor.shadowCamera.visibleFrustum = true;
    actor.castShadow = true;
    actor.shadowCamera.near = 1;
    actor.shadowCamera.far = 20;
    actor.shadowCamera.setSize(null, null, -10, 10, -10, 10);
    actor.shadowMap = new RenderTarget({ gpu, width: 1, height: 1, type: RenderTargetTypes.Depth });
}

const directionalForwardArrow = new ArrowHelper({ gpu });
directionalLight.addChild(directionalForwardArrow);
directionalLight.shadowCamera.addChild(directionalForwardArrow);

const shadowMapPlane = new Mesh(
    new PlaneGeometry({ gpu }),
    new Material({
        gpu,
        vertexShader: `#version 300 es
        layout (location = 0) in vec3 aPosition;
        layout (location = 1) in vec2 aUv;
        uniform mat4 uWorldMatrix;
        uniform mat4 uViewMatrix;
        uniform mat4 uProjectionMatrix;
        out vec2 vUv;
        void main() {
            vUv = aUv;
            gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
        }
        `,
        fragmentShader: `#version 300 es
        precision mediump float;
        in vec2 vUv;
        uniform sampler2D uShadowMap;
        uniform mat4 uShadowMapProjectionMatrix;
        out vec4 outColor;
        void main() {
            vec4 textureColor = texture(uShadowMap, vUv);
            float depth = textureColor.r;
            // outColor = uShadowMapProjectionMatrix * vec4(vUv, 1., 1.);
            // outColor = vec4(textureColor.rgb, 1.);
            outColor = vec4(vec3(depth), 1.);
        }
        `,
        uniforms: {
            uShadowMap: {
                type: UniformTypes.Texture,
                value: null
            },
            uShadowMapProjectionMatrix: {
                type: UniformTypes.Matrix4,
                value: null
            }
        }
    })
);
captureScene.add(shadowMapPlane);

shadowMapPlane.onStart = ({ actor }) => {
    actor.transform.setTranslation(new Vector3(0, 6, 0));
    actor.transform.setScaling(Vector3.fill(2));
}

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
    const ny = (e.clientY / height) * 2 - 1;
    targetCameraPosition.x = nx * 20;
    targetCameraPosition.y = ny * 10 + 12;
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

captureSceneCamera.transform.position = targetCameraPosition.clone();
captureSceneCamera.transform.lookAt(new Vector3(0, 5, 0));

const main = async () => {
    const objData = await loadObj("./models/sphere-32-32.obj");

    objMesh = new Mesh(
        // new BoxGeometry({ gpu }),
        new Geometry({
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
            drawCount: objData.indices.length
        }),
        new Material({
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
        })
    );
    
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
    
    floorPlaneMesh = new Mesh(
        new PlaneGeometry({ gpu }),
        new Material({
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
                uShadowMap: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uShadowBias: {
                    type: UniformTypes.Float,
                    value: states.shadowBias
                },
                uShadowMapProjectionMatrix: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity()
                }
            },
        })
    );

    captureScene.add(floorPlaneMesh);
    captureScene.add(skyboxMesh);
    captureScene.add(objMesh);

    objMesh.onStart = () => {
        objMesh.material.uniforms.uCubeTexture.value = cubeMap;
        objMesh.transform.setTranslation(new Vector3(0, 2, 0));
        objMesh.transform.setScaling(new Vector3(2, 2, 2));
    }
    
    floorPlaneMesh.onStart = () => {
        floorPlaneMesh.transform.setScaling(Vector3.fill(20));
        floorPlaneMesh.transform.setRotationX(-90);
        floorPlaneMesh.transform.setTranslation(new Vector3(0, 0, 0));
    }
    
    captureSceneCamera.postProcess.enabled = false;
    
    window.addEventListener("mousemove", onMouseMove);
    
    onWindowResize();
    window.addEventListener('resize', onWindowResize);
    
    engine.onUpdate = () => {
        // TODO: receive shadow な material には自動でセットしたい
        if(directionalLight.shadowMap) {
            shadowMapPlane.material.uniforms.uShadowMap.value = directionalLight.shadowMap.read.texture;
            floorPlaneMesh.material.uniforms.uShadowMap.value = directionalLight.shadowMap.read.texture;
        }
    }
    
    engine.start();
    
    initDebugger();
}

function initDebugger() {

    const debuggerGUI = new DebuggerGUI();
    
    debuggerGUI.addSliderDebugger({
        label: "obj position x",
        minValue: -10,
        maxValue: 10,
        stepValue: 0.01,
        initialValue: objMesh.transform.position.x,
        onChange: (value) => {
            const p = objMesh.transform.position;
            objMesh.transform.setTranslation(new Vector3(value, p.y, p.z))
        }
    });
    debuggerGUI.addSliderDebugger({
        label: "obj position z",
        minValue: -10,
        maxValue: 10,
        stepValue: 0.01,
        initialValue: objMesh.transform.position.z,
        onChange: (value) => {
            const p = objMesh.transform.position;
            objMesh.transform.setTranslation(new Vector3(p.x, p.y, value))
        }
    });

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addSliderDebugger({
        label: "light position x",
        minValue: -15,
        maxValue: 15,
        stepValue: 0.01,
        initialValue: directionalLight.transform.position.x,
        onChange: (value) => {
            const p = directionalLight.transform.position;
            directionalLight.transform.setTranslation(new Vector3(value, p.y, p.z))
        }
    });
    
    debuggerGUI.addSliderDebugger({
        label: "light position y",
        minValue: 1,
        maxValue: 15,
        stepValue: 0.01,
        initialValue: directionalLight.transform.position.y,
        onChange: (value) => {
            const p = directionalLight.transform.position;
            directionalLight.transform.setTranslation(new Vector3(p.x, value, p.z))
        }
    });

    debuggerGUI.addSliderDebugger({
        label: "light position z",
        minValue: -15,
        maxValue: 15,
        stepValue: 0.01,
        initialValue: directionalLight.transform.position.z,
        onChange: (value) => {
            const p = directionalLight.transform.position;
            directionalLight.transform.setTranslation(new Vector3(p.x, p.y, value))
        }
    });

    debuggerGUI.addSliderDebugger({
        label: "shadow camera width",
        minValue: 1,
        maxValue: 40,
        stepValue: 0.01,
        initialValue: Math.abs(directionalLight.shadowCamera.left),
        onChange: (value) => {
            directionalLight.shadowCamera.left = -value / 2;
            directionalLight.shadowCamera.right = value / 2;
            directionalLight.shadowCamera.updateProjectionMatrix();
        }
    });
    
    debuggerGUI.addSliderDebugger({
        label: "shadow camera height",
        minValue: 1,
        maxValue: 40,
        stepValue: 0.01,
        initialValue: Math.abs(directionalLight.shadowCamera.top),
        onChange: (value) => {
            directionalLight.shadowCamera.bottom = -value / 2;
            directionalLight.shadowCamera.top = value / 2;
            directionalLight.shadowCamera.updateProjectionMatrix();
        }
    });

    debuggerGUI.addSliderDebugger({
        label: "shadow camera near clip",
        minValue: 0.01,
        maxValue: 40,
        stepValue: 0.01,
        initialValue: directionalLight.shadowCamera.near,
        onChange: (value) => {
            directionalLight.shadowCamera.near = value;
            directionalLight.shadowCamera.updateProjectionMatrix();
        }
    });
    
    debuggerGUI.addSliderDebugger({
        label: "shadow camera near far",
        minValue: 0.01,
        maxValue: 40,
        stepValue: 0.01,
        initialValue: directionalLight.shadowCamera.far,
        onChange: (value) => {
            directionalLight.shadowCamera.far = value;
            directionalLight.shadowCamera.updateProjectionMatrix();
        }
    });

    debuggerGUI.addSliderDebugger({
        label: "shadow bias",
        minValue: 0,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: states.shadowBias,
        onChange: (value) => {
            floorPlaneMesh.material.uniforms.uShadowBias.value = value;
        }
    });
 
    // NOTE: manually once update for debugger
    directionalLight.update({ gpu });
    debuggerGUI.addPullDownDebugger({
        label: "shadow map width",
        options: [
            { value: "16" },
            { value: "32" },
            { value: "64" },
            { value: "128" },
            { value: "256" },
            { value: "512" },
            { value: "1024" },
            { value: "2048" },
        ],
        initialValue: states.shadowMapWidth,
        onChange: (value) => {
            states.shadowMapWidth = value;
            if(!directionalLight.shadowMap) {
                return;
            }
            directionalLight.shadowMap.setSize(states.shadowMapWidth, states.shadowMapHeight);
        }
    });
    debuggerGUI.addPullDownDebugger({
        label: "shadow map height",
        options: [
            { value: "16" },
            { value: "32" },
            { value: "64" },
            { value: "128" },
            { value: "256" },
            { value: "512" },
            { value: "1024" },
            { value: "2048" },
        ],
        initialValue: states.shadowMapHeight,
        onChange: (value) => {
            states.shadowMapHeight = value;
            if(!directionalLight.shadowMap) {
                return;
            }
            directionalLight.shadowMap.setSize(states.shadowMapWidth, states.shadowMapHeight);
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
