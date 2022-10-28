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

const wrapperElement = document.getElementById("wrapper");

const canvasElement = document.getElementById("js-canvas");

const cubeVertexShader = `#version 300 es

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

const box1FragmentShader = `#version 300 es

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

const fullQuadVertexShader = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aUv;

out vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 1);
}
`;

const fullQuadFragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSceneTexture;

void main() {
    vec4 textureColor = texture(uSceneTexture, vUv);
    vec4 color = textureColor * vec4(1, 0.3, 0.3, 1);
    outColor = color;
}
`;

const gl = canvasElement.getContext('webgl2');

const gpu = new GPU({gl});

const captureScene = new Scene();
const viewportScene = new Scene();

const renderer = new ForwardRenderer({
        gpu,
        canvas: canvasElement,
        // pixelRatio: 2 // force
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

const cubeMaterial = new Material({
    gpu,
    vertexShader: cubeVertexShader,
    fragmentShader: box1FragmentShader,
    primitiveType: PrimitiveTypes.Triangles,
});

// const fullQuadMaterial = new Material({
//     gpu,
//     vertexShader: fullQuadVertexShader,
//     fragmentShader: fullQuadFragmentShader,
//     primitiveType: PrimitiveTypes.Triangles,
//     uniforms: {
//         uSceneTexture: {
//             type: UniformTypes.Texture,
//             value: null
//         }
//     }
// });

Promise.all(Object.keys(images).map(async (key) => {
    cubeMaterial.uniforms[key] = {
        type: UniformTypes.Texture,
        value: null
    };
    const data = images[key];
    const img = await loadImg(data.src);
    return { key, img }
})).then(data => {
    data.forEach(({ key , img }) => {
        cubeMaterial.uniforms[key].value = new Texture({gpu, img});
    });
});

const boxMesh = new Mesh(new BoxGeometry({ gpu }), cubeMaterial);
// const fullQuadMesh = new Mesh(planeGeometry, fullQuadMaterial);
// const fullQuadMesh = new Mesh(new PlaneGeometry({ gpu }), fullQuadMaterial);

let width, height;

captureScene.add(boxMesh);
// viewportScene.add(fullQuadMesh);

// const captureSceneCamera = new OrthographicCamera(-2, 2, -2, 2, 0.1, 10);
const captureSceneCamera = new PerspectiveCamera(60, 1, 0.1, 10);
captureScene.add(captureSceneCamera);

// const viewportCamera = new OrthographicCamera(-1, 1, -1, 1, 0, 2);
// viewportScene.add(viewportCamera);

captureSceneCamera.transform.setTranslation(new Vector3(0, 0, 5));
// viewportCamera.transform.setTranslation(new Vector3(0, 0, 1));

const renderTarget = new RenderTarget({ gpu, width: 1, height: 1 });

// captureSceneCamera.setRenderTarget(renderTarget);
captureSceneCamera.setClearColor(new Vector4(1, 1, 0, 1));

const postProcess = new PostProcess({ gpu, renderer });
postProcess.addPass(new CopyPass({ gpu }));

const onWindowResize = () => {
    width = wrapperElement.offsetWidth;
    height = wrapperElement.offsetHeight;
    const aspect = width / height;
    
    renderTarget.setSize(width, height);

    captureSceneCamera.setSize(aspect);
    // viewportCamera.setSize(aspect);
 
    renderer.setSize(width, height);
    postProcess.setSize(width, height);
};

window.addEventListener('resize', onWindowResize);

onWindowResize();

const tick = (time) => {

    // render capture scene
    
    boxMesh.transform.setRotationX(time / 1000 * 10);
    boxMesh.transform.setRotationY(time / 1000 * 14);
    
    // renderer.render(captureScene, captureSceneCamera);
    // fullQuadMaterial.uniforms.uSceneTexture.value = renderTarget.texture;
    // renderer.render(viewportScene, viewportCamera);
    
    postProcess.render(captureScene, captureSceneCamera);
    
    // loop

    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
