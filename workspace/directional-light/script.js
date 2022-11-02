import {GPU} from "./PaleGL/core/GPU.js";
import {BlendTypes, PrimitiveTypes, UniformTypes} from "./PaleGL/constants.js";
import {Vector3} from "./PaleGL/math/Vector3.js";
import {Vector4} from "./PaleGL/math/Vector4.js";
import {Scene} from "./PaleGL/core/Scene.js";
import {ForwardRenderer} from "./PaleGL/core/ForwardRenderer.js";
import {Mesh} from "./PaleGL/core/Mesh.js";
import {Material} from "./PaleGL/materials/Material.js";
import {PerspectiveCamera} from "./PaleGL/core/PerspectiveCamera.js";
import {Texture} from "./PaleGL/core/Texture.js";
import {loadImg} from "./PaleGL/utils/loadImg.js";
import {BoxGeometry} from "./PaleGL/geometries/BoxGeometry.js";
import {PostProcess} from "./PaleGL/postprocess/PostProcess.js";
import {FragmentPass} from "./PaleGL/postprocess/FragmentPass.js";
import {PlaneGeometry} from "./PaleGL/geometries/PlaneGeometry.js";
import {DebuggerGUI} from "./DebuggerGUI.js";
import {DirectionalLight} from "./PaleGL/lights/DirectionalLight.js";

let width, height;


const wrapperElement = document.getElementById("wrapper");

const canvasElement = document.getElementById("js-canvas");

const boxVertexShader = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aUv;
layout (location = 2) in vec3 aNormal;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

out vec2 vUv;
out float vTextureIndex;
out vec3 vNormal;

void main() {
    vUv = aUv;
    vNormal = (uNormalMatrix * vec4(aNormal, 1)).xyz;
    vTextureIndex = floor(float(gl_VertexID) / 4.);
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1);
}
`;

const boxFragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;
in vec3 vNormal;
in float vTextureIndex;

out vec4 outColor;

uniform sampler2D uDirZPlusMap;
uniform sampler2D uDirXPlusMap;
uniform sampler2D uDirZMinusMap;
uniform sampler2D uDirXMinusMap;
uniform sampler2D uDirYPlusMap;
uniform sampler2D uDirYMinusMap;

struct DirectionalLight {
    vec3 direction;
    float intensity;
};
uniform DirectionalLight uDirectionalLight;

void main() {
    vec4 textureColor = vec4(0, 0, 0, 1);

    if(vTextureIndex < 0.5) {
        textureColor = texture(uDirZPlusMap, vUv);
    } else if(vTextureIndex < 1.5) {
        textureColor = texture(uDirXPlusMap, vUv);
    } else if(vTextureIndex < 2.5) {
        textureColor = texture(uDirZMinusMap, vUv);
    } else if(vTextureIndex < 3.5) {
        textureColor = texture(uDirXMinusMap, vUv);
    } else if(vTextureIndex < 4.5) {
        textureColor = texture(uDirYPlusMap, vUv);
    } else {
        textureColor = texture(uDirYMinusMap, vUv);
    }
   
    vec3 normal = normalize(vNormal);
    vec3 lightDirection = normalize(uDirectionalLight.direction);
    float diffuseRate = dot(normal, lightDirection);
    
    vec3 diffuseColor = textureColor.xyz * diffuseRate;

    outColor = vec4(diffuseColor, 1);
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

const boxMaterial = new Material({
    gpu,
    vertexShader: boxVertexShader,
    fragmentShader: boxFragmentShader,
    primitiveType: PrimitiveTypes.Triangles,
    uniforms: {
        uDirectionalLight: {}
    }
});

const planeVertexShader = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aUv;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 vUv;
out float vTextureIndex;

void main() {
    vUv = aUv;
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1);
}
`;

const planeFragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

void main() {
    outColor = vec4(vUv, 1, 0.5);
}
`;

const planeMaterial = new Material({
    gpu,
    vertexShader: planeVertexShader,
    fragmentShader: planeFragmentShader,
    blendType: BlendTypes.Transparent
});

const boxMesh = new Mesh(new BoxGeometry({gpu}), boxMaterial);
const planeMesh = new Mesh(new PlaneGeometry({gpu}), planeMaterial);

captureScene.add(planeMesh);
captureScene.add(boxMesh);

const directionalLight = new DirectionalLight();
captureScene.add(directionalLight);

const captureSceneCamera = new PerspectiveCamera(60, 1, 0.1, 10);
captureScene.add(captureSceneCamera);

captureSceneCamera.transform.setTranslation(new Vector3(0, 0, 5));
captureSceneCamera.setClearColor(new Vector4(0, 0, 0, 1));

const postProcess = new PostProcess({gpu, renderer});
postProcess.addPass(new FragmentPass({
    gpu, fragmentShader: `#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uSceneTexture;
void main() {
    vec4 textureColor = texture(uSceneTexture, vUv);
    outColor = textureColor;
    outColor.r *= 0.2;
}
`
}));
postProcess.addPass(new FragmentPass({
    gpu, fragmentShader: `#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uSceneTexture;
void main() {
    vec4 textureColor = texture(uSceneTexture, vUv);
    outColor = textureColor;
    outColor.g *= 0.5;
}
`
}));

// captureSceneCamera.setPostProcess(postProcess);

const onWindowResize = () => {
    width = wrapperElement.offsetWidth;
    height = wrapperElement.offsetHeight;

    captureSceneCamera.setSize(width, height);

    renderer.setSize(width, height);
    postProcess.setSize(width, height);
};


const tick = (time) => {
    boxMesh.transform.setRotationX(time / 1000 * 10);
    boxMesh.transform.setRotationY(time / 1000 * 14);
    boxMesh.transform.setScaling(new Vector3(1.5, 1.5, 1.5));

    planeMesh.transform.setTranslation(new Vector3(0, 0, Math.sin(time / 1000)));

    renderer.render(captureScene, captureSceneCamera);

    // loop

    requestAnimationFrame(tick);
}

const main = async () => {
    const images = {
        uDirZMinusMap: {
            src: "./images/dir-z-minus.png",
        },
        uDirXPlusMap: {
            src: "./images/dir-x-plus.png",
        },
        uDirZPlusMap: {
            src: "./images/dir-z-plus.png",
        },
        uDirXMinusMap: {
            src: "./images/dir-x-minus.png",
        },
        uDirYMinusMap: {
            src: "./images/dir-y-minus.png",
        },
        uDirYPlusMap: {
            src: "./images/dir-y-plus.png",
        },
    };
   
    await Promise.all(Object.keys(images).map(async (key) => {
        boxMaterial.uniforms[key] = {
            type: UniformTypes.Texture,
            value: null
        };
        const data = images[key];
        const img = await loadImg(data.src);
        return {key, img}
    })).then(data => {
        data.forEach(({key, img}) => {
            boxMaterial.uniforms[key].value = new Texture({gpu, img});
        });
    });

    const debuggerGUI = new DebuggerGUI();
    debuggerGUI.add(DebuggerGUI.DebuggerTypes.PullDown, {
        label: "Plane Blending",
        options: [
            {
                label: "Opaque",
                value: BlendTypes.Opaque,
            },
            {
                label: "Transparent",
                value: BlendTypes.Transparent,
                isDefault: true
            },
            {
                label: "Additive",
                value: BlendTypes.Additive
            },
        ],
        onChange: (blendType) => {
            planeMaterial.blendType = blendType;
        }
    });
    wrapperElement.appendChild(debuggerGUI.domElement);

    onWindowResize();

    window.addEventListener('resize', onWindowResize);
    requestAnimationFrame(tick);
}

main();