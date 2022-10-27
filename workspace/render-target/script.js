import {GPU} from "./PaleGL/Core/GPU.js";
import {Shader} from "./PaleGL/Core/Shader.js";
import {VertexArrayObject} from "./PaleGL/Core/VertexArrayObject.js";
import {AttributeTypes, PrimitiveTypes, UniformTypes} from "./PaleGL/Core/constants.js";
import {Vector3} from "./PaleGL/Math/Vector3.js";
import {IndexBufferObject} from "./PaleGL/Core/IndexBufferObject.js";
import {Scene} from "./PaleGL/Core/Scene.js";
import {ForwardRenderer} from "./PaleGL/Core/ForwardRenderer.js";
import {Mesh} from "./PaleGL/Core/Mesh.js";
import {Geometry} from "./PaleGL/Core/Geometry.js";
import {Material} from "./PaleGL/Core/Material.js";
import {Matrix4} from "./PaleGL/Math/Matrix4.js";
import {Transform} from "./PaleGL/Core/Transform.js";
import {Actor} from "./PaleGL/Core/Actor.js";
import {PerspectiveCamera} from "./PaleGL/Core/PerspectiveCamera.js";
import {Texture} from "./PaleGL/core/Texture.js";
import {loadImg} from "./PaleGL/utils/loadImg.js";
import {RenderTarget} from "./PaleGL/core/RenderTarget.js";
import {OrthographicCamera} from "./PaleGL/core/OrthographicCamera.js";

const wrapperElement = document.getElementById("wrapper");

const canvasElement = document.getElementById("js-canvas");

const box1VertexShader = `#version 300 es

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

const box2VertexShader = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aUv;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1);
}
`;

const box2FragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSceneTexture;

void main() {
    vec4 color = texture(uSceneTexture, vUv);
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
        pixelRatio: Math.min(window.devicePixelRatio, 1.5)
    }
);

const boxPosition_0 = [-0.5, 0.5, 0.5];
const boxPosition_1 = [-0.5, -0.5, 0.5];
const boxPosition_2 = [0.5, 0.5, 0.5];
const boxPosition_3 = [0.5, -0.5, 0.5];
const boxPosition_4 = [0.5, 0.5, -0.5];
const boxPosition_5 = [0.5, -0.5, -0.5];
const boxPosition_6 = [-0.5, 0.5, -0.5];
const boxPosition_7 = [-0.5, -0.5, -0.5];

const createBoxGeometry = () => {
    return new Geometry({
        gpu,
        attributes: {
            // -----------------------------
            //    
            //   6 ---- 4
            //  /|     /|
            // 0 ---- 2 |
            // | 7 -- | 5
            // |/     |/
            // 1 ---- 3
            // -----------------------------
            position: {
                data: [
                    // front
                    ...boxPosition_0, ...boxPosition_1, ...boxPosition_2, ...boxPosition_3,
                    // right
                    ...boxPosition_2, ...boxPosition_3, ...boxPosition_4, ...boxPosition_5,
                    // back
                    ...boxPosition_4, ...boxPosition_5, ...boxPosition_6, ...boxPosition_7,
                    // left
                    ...boxPosition_6, ...boxPosition_7, ...boxPosition_0, ...boxPosition_1,
                    // top
                    ...boxPosition_6, ...boxPosition_0, ...boxPosition_4, ...boxPosition_2,
                    // bottom
                    ...boxPosition_1, ...boxPosition_7, ...boxPosition_3, ...boxPosition_5,
                ],
                size: 3,
            },
            uv: {
                data: (new Array(6)).fill(0).map(() => ([
                    0, 0,
                    0, 1,
                    1, 0,
                    1, 1
                ])).flat(),
                size: 2
            },
        },
        indices: Array.from(Array(6).keys()).map(i => ([
            i * 4 + 0, i * 4 + 1, i * 4 + 2,
            i * 4 + 2, i * 4 + 1, i * 4 + 3,
        ])).flat(),
        drawCount: 6 * 6 // indices count
    });
};

const planeGeometry = new Geometry({
    gpu,
    // -----------------------------
    // 0 ---- 2
    // |    / |
    // |   /  |
    // |  /   |
    // | /    |
    // 1 ---- 3
    // -----------------------------
    attributes: {
        position: {
            data: [
                -1, 1, 0,
                -1, -1, 0,
                1, 1, 0,
                1, -1, 0,
            ],
            size: 3
        },
        uv: {
            data: [
                0, 0,
                0, 1,
                1, 0,
                1, 1,
            ],
            size: 2
        },
        color: {
            data: [
                1, 0, 0,
                0, 1, 0,
                0, 0, 1,
                1, 1, 0
            ],
            size: 3
        }
    },
    indices: [0, 1, 2, 2, 1, 3],
    drawCount: 6
});

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
    vertexShader: box1VertexShader,
    fragmentShader: box1FragmentShader,
    primitiveType: PrimitiveTypes.Triangles,
});

const boxMaterial2 = new Material({
    gpu,
    vertexShader: box2VertexShader,
    fragmentShader: box2FragmentShader,
    primitiveType: PrimitiveTypes.Triangles,
    uniforms: {
        uSceneTexture: {
            type: UniformTypes.Texture,
            value: null
        }
    }
});

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

const boxMesh1 = new Mesh(createBoxGeometry(), cubeMaterial);
// const boxMesh2 = new Mesh(planeGeometry, boxMaterial2);
const boxMesh2 = new Mesh(createBoxGeometry(), boxMaterial2);

let width, height;

captureScene.add(boxMesh1);
viewportScene.add(boxMesh2);

const captureSceneCamera = new OrthographicCamera(-2, 2, -2, 2, 0.1, 10);
const viewportCamera = new PerspectiveCamera(60, 1, 0.1, 10);
captureScene.add(captureSceneCamera);
viewportScene.add(viewportCamera);

captureSceneCamera.transform.setTranslation(new Vector3(0, 0, 5));
viewportCamera.transform.setTranslation(new Vector3(0, 0, 5));

const renderTarget = new RenderTarget({ gpu, width: 1, height: 1 });
renderTarget.setSize(512, 512);

const onWindowResize = () => {
    width = wrapperElement.offsetWidth;
    height = wrapperElement.offsetHeight;
    const aspect = width / height;

    // TODO: ないとなぜか切れ端が残ったりする
    // renderTarget.setSize(512, 512);
    
    viewportCamera.setSize(aspect);
    renderer.setSize(width, height);
};

window.addEventListener('resize', onWindowResize);

onWindowResize();

const tick = (time) => {

    // render capture scene
    
    boxMesh1.transform.setRotationX(time / 1000 * 10);
    boxMesh1.transform.setRotationY(time / 1000 * 14);
    
    boxMesh2.transform.setRotationY(time / 1000 * 12);
    boxMesh2.transform.setRotationZ(time / 1000 * 10);
 
    renderer.setRenderTarget(renderTarget);
    renderer.clear(1, 1, 0, 1);
    renderer.render(captureScene, captureSceneCamera);
    
    // // render viewport scene
    renderer.setRenderTarget(null);
    renderer.clear(0.1, 0.1, 0.1, 1);
    boxMaterial2.uniforms.uSceneTexture.value = renderTarget.texture;
    renderer.render(viewportScene, viewportCamera);
    
    // loop

    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
