import {GPU} from "./PaleGL/core/GPU.js";
import {BlendTypes, CubeMapAxis, FaceSide, PrimitiveTypes, UniformTypes} from "./PaleGL/constants.js";
import {Vector3} from "./PaleGL/math/Vector3.js";
import {Vector4} from "./PaleGL/math/Vector4.js";
import {Matrix4} from "./PaleGL/math/Matrix4.js";
import {Scene} from "./PaleGL/core/Scene.js";
import {ForwardRenderer} from "./PaleGL/core/ForwardRenderer.js";
import {Mesh} from "./PaleGL/core/Mesh.js";
import {Material} from "./PaleGL/materials/Material.js";
import {PerspectiveCamera} from "./PaleGL/core/PerspectiveCamera.js";
import {Texture} from "./PaleGL/core/Texture.js";
import {loadImg} from "./PaleGL/loaders/loadImg.js";
import {BoxGeometry} from "./PaleGL/geometries/BoxGeometry.js";
import {PostProcess} from "./PaleGL/postprocess/PostProcess.js";
import {FragmentPass} from "./PaleGL/postprocess/FragmentPass.js";
import {PlaneGeometry} from "./PaleGL/geometries/PlaneGeometry.js";
import {DebuggerGUI} from "./DebuggerGUI.js";
import {DirectionalLight} from "./PaleGL/lights/DirectionalLight.js";
import {loadObj} from "./PaleGL/loaders/loadObj.js";
import {Geometry} from "./PaleGL/geometries/Geometry.js";
import {Color} from "./PaleGL/core/Color.js";
import {CubeMap} from "./PaleGL/core/CubeMap.js";
import {loadCubeMap} from "./PaleGL/loaders/loadCubeMap.js";
import {Skybox} from "./PaleGL/core/Skybox.js";
import {ArrowHelper} from "./PaleGL/core/ArrowHelper.js";
import {OrthographicCamera} from "./PaleGL/core/OrthographicCamera.js";
import {RenderTarget} from "./PaleGL/core/RenderTarget.js";

let width, height;
let objMesh;
let floorPlaneMesh;
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

const captureSceneCamera = new PerspectiveCamera(90, 1, 0.1, 100);
captureScene.add(captureSceneCamera);

captureSceneCamera.transform.setTranslation(new Vector3(0, 0, 5));
captureSceneCamera.setClearColor(new Vector4(0, 0, 0, 1));

const directionalLight = new DirectionalLight();
// TODO: needs
// captureScene.add(directionalLight);
directionalLight.transform.setTranslation(new Vector3(5, 5, 5));
// directionalLight.shadowCamera.visibleFrustum = true;
directionalLight.transform.lookAt(new Vector3(0, 0, 0));

const directionalForwardArrow = new ArrowHelper({ gpu });
// directionalLight.addChild(directionalForwardArrow);
directionalLight.shadowCamera.addChild(directionalForwardArrow);
directionalLight.castShadow = true;

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
        out vec4 outColor;
        void main() {
            outColor = vec4(vUv, 1., 1.);
            outColor = texture(uShadowMap, vUv);
        }
        `,
        uniforms: {
            uShadowMap: {
                type: UniformTypes.Texture,
                value: null
            }
        }
    })
);
shadowMapPlane.transform.setTranslation(new Vector3(0, 8, 0));
shadowMapPlane.transform.setScaling(Vector3.fill(2));
captureScene.add(shadowMapPlane);

const testOrtho = new OrthographicCamera(-5, 5, -5, 5, 1, 20);
testOrtho.visibleFrustum = true;
testOrtho.transform.setTranslation(new Vector3(5, 5, 0));
testOrtho.transform.lookAt(new Vector3(0, 0, 0));
testOrtho.setRenderTarget(new RenderTarget({ width: 512, height: 512, gpu, useDepthBuffer: true, useDoubleBuffer: true }));
// testOrtho.setRenderTarget(new RenderTarget({ width: 512, height: 512, gpu, useDepthBuffer: false }));
captureScene.add(testOrtho);

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
    targetCameraPosition.y = -ny * 20;
};

const onWindowResize = () => {
    width = wrapperElement.offsetWidth;
    height = wrapperElement.offsetHeight;

    captureSceneCamera.setSize(width, height);
    testOrtho.setSize(width, height);

    renderer.setSize(width, height);
    postProcess.setSize(width, height);
};

captureSceneCamera.transform.position = targetCameraPosition.clone();
captureSceneCamera.transform.lookAt(new Vector3(0, 5, 0));

let i = 0;

const tick = (time) => {
    const cameraPosition = Vector3.addVectors(
        captureSceneCamera.transform.position,
        new Vector3(
            (targetCameraPosition.x - captureSceneCamera.transform.position.x) * 0.1,
            (targetCameraPosition.y - captureSceneCamera.transform.position.y) * 0.1,
            (targetCameraPosition.z - captureSceneCamera.transform.position.z) * 0.1
        )
    );
    captureSceneCamera.transform.position = cameraPosition;

    // if(floorPlaneMesh) {
    //     floorPlaneMesh.transform.lookAt(cameraPosition);
    // }

    if(directionalLight.shadowMap) {
        // shadowMapPlane.material.uniforms.uShadowMap.value = directionalLight.shadowMap.texture;
    }
    
    renderer.render(captureScene, testOrtho);

    shadowMapPlane.material.uniforms.uShadowMap.value = testOrtho.renderTarget.texture;
    testOrtho.renderTarget.flip();
    
    renderer.render(captureScene, captureSceneCamera);
   
    i++;
    if(i >= 2) {
        // return;
    }
    
    // captureSceneCamera.transform.worldForward.log()
    
    // captureSceneCamera.transform.worldForward.log();
    // captureSceneCamera.cameraForward.log()

    // loop

    requestAnimationFrame(tick);
}

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
        // [CubeMapAxis.PositiveX]: "./images/dir-x-plus.png",
        // [CubeMapAxis.NegativeX]: "./images/dir-x-minus.png",
        // [CubeMapAxis.PositiveY]: "./images/dir-y-plus.png",
        // [CubeMapAxis.NegativeY]: "./images/dir-y-minus.png",
        // [CubeMapAxis.PositiveZ]: "./images/dir-z-plus.png",
        // [CubeMapAxis.NegativeZ]: "./images/dir-z-minus.png",
    };
  
    const cubeMap = await loadCubeMap({ gpu, images });
    
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
            
            out vec2 vUv;

            void main() {
                vUv = aUv;
                gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
            }
            `,
            fragmentShader: `#version 300 es
            
            precision mediump float;
            
            uniform sampler2D uBillboardTexture;
            
            in vec2 vUv;
            
            out vec4 outColor;
            
            void main() {
                outColor = texture(uBillboardTexture, vUv);
                // outColor = vec4(vUv, 1., 1.);
            }
            `,
            uniforms: {
                uBillboardTexture: {
                    type: UniformTypes.Texture,
                    value: floorTexture
                }
            },
        })
    );

    captureScene.add(floorPlaneMesh);
    captureScene.add(skyboxMesh);
    captureScene.add(objMesh);
    
    objMesh.material.uniforms.uCubeTexture.value = cubeMap;
    objMesh.transform.setTranslation(new Vector3(0, 2, 0));
    objMesh.transform.setScaling(new Vector3(2, 2, 2));
    
    floorPlaneMesh.transform.setScaling(Vector3.fill(20));
    floorPlaneMesh.transform.setRotationX(-90);
    floorPlaneMesh.transform.setTranslation(new Vector3(0, 0, 0));
    
    captureSceneCamera.postProcess.enabled = false;

    const debuggerGUI = new DebuggerGUI();

    debuggerGUI.addToggleDebugger({
        label: "Enabled Post Process",
        initialValue: captureSceneCamera.postProcess.enabled,
        onChange: (value) => {
            captureSceneCamera.postProcess.enabled = value;
        }
    });

    wrapperElement.appendChild(debuggerGUI.domElement);

    window.addEventListener("mousemove", onMouseMove);
    
    onWindowResize();
    window.addEventListener('resize', onWindowResize);
    
    requestAnimationFrame(tick);
}

main();