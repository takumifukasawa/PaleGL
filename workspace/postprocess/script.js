import {GPU} from "./PaleGL/Core/GPU.js";
import {Shader} from "./PaleGL/Core/Shader.js";
import {VertexArrayObject} from "./PaleGL/Core/VertexArrayObject.js";
import {AttributeTypes, PrimitiveTypes, UniformTypes} from "./PaleGL/Core/constants.js";
import {Vector3} from "./PaleGL/Math/Vector3.js";
import {Vector4} from "./PaleGL/Math/Vector4.js";
import {IndexBufferObject} from "./PaleGL/Core/IndexBufferObject.js";
import {Scene} from "./PaleGL/Core/Scene.js";
import {ForwardRenderer} from "./PaleGL/Core/ForwardRenderer.js";
import {Mesh} from "./PaleGL/Core/Mesh.js";
// import {Geometry} from "./PaleGL/Core/Geometry.js";
import {Material} from "./PaleGL/Core/Material.js";
import {Matrix4} from "./PaleGL/Math/Matrix4.js";
import {Transform} from "./PaleGL/Core/Transform.js";
import {Actor} from "./PaleGL/Core/Actor.js";
import {PerspectiveCamera} from "./PaleGL/Core/PerspectiveCamera.js";
import {Texture} from "./PaleGL/core/Texture.js";
import {loadImg} from "./PaleGL/utils/loadImg.js";
import {RenderTarget} from "./PaleGL/core/RenderTarget.js";
import {OrthographicCamera} from "./PaleGL/core/OrthographicCamera.js";
import {BoxGeometry} from "./PaleGL/core/geometries/BoxGeometry.js";
import {PlaneGeometry} from "./PaleGL/core/geometries/PlaneGeometry.js";
import {PostProcess} from "./PaleGL/core/postprocess/PostProcess.js";
import {CopyPass} from "./PaleGL/core/postprocess/CopyPass.js";
import {FragmentPass} from "./PaleGL/core/postprocess/FragmentPass.js";

let width, height;

const wrapperElement = document.getElementById("wrapper");

const canvasElement = document.getElementById("js-canvas");

const boxVertexShader = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aUv;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 vUv;
out float vTextureIndex;

void main() {
    vUv = aUv;
    vTextureIndex = floor(float(gl_VertexID) / 4.);
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1);
}
`;

const boxFragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;
in float vTextureIndex;

out vec4 outColor;

uniform sampler2D uDirZPlusMap;
uniform sampler2D uDirXPlusMap;
uniform sampler2D uDirZMinusMap;
uniform sampler2D uDirXMinusMap;
uniform sampler2D uDirYPlusMap;
uniform sampler2D uDirYMinusMap;

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

    outColor = textureColor;
}
`;

const gl = canvasElement.getContext('webgl2');

const gpu = new GPU({gl});

const captureScene = new Scene();
const viewportScene = new Scene();

const renderer = new ForwardRenderer({
        gpu,
        canvas: canvasElement,
        pixelRatio: Math.min(window.devicePixelRatio, 1.5)
    }
);

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

const boxMaterial = new Material({
    gpu,
    vertexShader: boxVertexShader,
    fragmentShader: boxFragmentShader,
    primitiveType: PrimitiveTypes.Triangles,
});

const boxMesh = new Mesh(new BoxGeometry({ gpu }), boxMaterial);

captureScene.add(boxMesh);

const captureSceneCamera = new PerspectiveCamera(60, 1, 0.1, 10);
captureScene.add(captureSceneCamera);

captureSceneCamera.transform.setTranslation(new Vector3(0, 0, 5));
captureSceneCamera.setClearColor(new Vector4(1, 1, 0, 1));

const postProcess = new PostProcess({ gpu, renderer });
postProcess.addPass(new FragmentPass({ gpu, fragmentShader: `#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uSceneTexture;
void main() {
    vec4 textureColor = texture(uSceneTexture, vUv);
    outColor = textureColor;
    outColor.r *= 0.5;
}
`}));
postProcess.addPass(new FragmentPass({ gpu, fragmentShader: `#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uSceneTexture;
void main() {
    vec4 textureColor = texture(uSceneTexture, vUv);
    outColor = textureColor;
    outColor.g *= 0.5;
}
`}));

captureSceneCamera.setPostProcess(postProcess);

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
    
    renderer.render(captureScene, captureSceneCamera);
    
    // loop

    requestAnimationFrame(tick);
}

const main = async () => {
    await Promise.all(Object.keys(images).map(async (key) => {
        boxMaterial.uniforms[key] = {
            type: UniformTypes.Texture,
            value: null
        };
        const data = images[key];
        const img = await loadImg(data.src);
        return { key, img }
    })).then(data => {
        data.forEach(({ key , img }) => {
            boxMaterial.uniforms[key].value = new Texture({gpu, img});
        });
    });
    
    onWindowResize();

    window.addEventListener('resize', onWindowResize);
    requestAnimationFrame(tick);
}

main();