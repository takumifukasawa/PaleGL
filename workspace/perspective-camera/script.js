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

const canvas = document.getElementById("js-canvas");

const vertexShader = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec3 aColor;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vColor;

void main() {
    vColor = aColor;
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1);
    //gl_Position = uProjectionMatrix * uWorldMatrix * vec4(aPosition, 1);
    // gl_Position = uViewMatrix * uWorldMatrix * vec4(aPosition, 1);
    // gl_Position = uProjectionMatrix * vec4(aPosition, 1);
    // gl_Position = uWorldMatrix * vec4(aPosition, 1);
    // gl_Position = vec4(aPosition, 1);
}
`;

const fragmentShader = `#version 300 es

precision mediump float;

in vec3 vColor;

out vec4 outColor;

void main() {
    outColor = vec4(vColor, 1);
}
`;

const gl = canvas.getContext('webgl2');

const gpu = new GPU({gl});

const scene = new Scene();

const renderer = new ForwardRenderer({gpu, canvas});

const boxPosition_0 = [-0.5, 0.5, 0.5];
const boxPosition_1 = [-0.5, -0.5, 0.5];
const boxPosition_2 = [0.5, 0.5, 0.5];
const boxPosition_3 = [0.5, -0.5, 0.5];
const boxPosition_4 = [0.5, 0.5, -0.5];
const boxPosition_5 = [0.5, -0.5, -0.5];
const boxPosition_6 = [-0.5, 0.5, -0.5];
const boxPosition_7 = [-0.5, -0.5, -0.5];
 
const boxGeometry = new Geometry({
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
        color: {
            data: [
                // front: red
                ...(new Array(4)).fill(0).map(() => ([1, 0, 0])).flat(),
                // right: blue
                ...(new Array(4)).fill(0).map(() => ([0, 1, 0])).flat(),
                // back: green
                ...(new Array(4)).fill(0).map(() => ([0, 0, 1])).flat(),
                // left: yellow
                ...(new Array(4)).fill(0).map(() => ([1, 1, 0])).flat(),
                // top: purple
                ...(new Array(4)).fill(0).map(() => ([1, 0, 1])).flat(),
                // bottom: aqua
                ...(new Array(4)).fill(0).map(() => ([0, 1, 1])).flat(),
            ],
            size: 3
        },
    },
    indices: Array.from(Array(6).keys()).map(i => ([
        i * 4 + 0, i * 4 + 1, i * 4 + 2,
        i * 4 + 2, i * 4 + 1, i * 4 + 3,
    ])).flat(),
    drawCount: 6 * 6 // indices count
});

const geometry = new Geometry({
    gpu,
    attributes: {
        position: {
            // -----------------------------
            // 0 ---- 2
            // |    / |
            // |   /  |
            // |  /   |
            // | /    |
            // 1 ---- 3
            // -----------------------------
            data: [
                -1, 1, 0,
                -1, -1, 0,
                1, 1, 0,
                1, -1, 0,
            ],
            size: 3
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


const material = new Material({
    gpu,
    vertexShader,
    fragmentShader,
    primitiveType: PrimitiveTypes.Triangles,
});

// const mesh = new Mesh(geometry, material);
const mesh = new Mesh(boxGeometry, material);

let width, height;

const rootActor = new Actor();
rootActor.addChild(mesh);

scene.add(rootActor);

const perspectiveCamera = new PerspectiveCamera(60, 1, 0.1, 10);
scene.add(perspectiveCamera);

perspectiveCamera.transform.setTranslate(new Vector3(0, 0, 5));

const onWindowResize = () => {
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;

    perspectiveCamera.setSize(width, height);
    renderer.setSize(width, height);
};

window.addEventListener('resize', onWindowResize);

onWindowResize();

const tick = (time) => {

    // rootActor.transform.setRotateZ(time / 1000 * 20);

    // mesh.transform.setScale(new Vector3(1, 0.5, 0.5));
    mesh.transform.setRotateX(time / 1000 * 30);
    // mesh.transform.setRotateY(-time / 1000 * 30);
    // mesh.transform.setRotateZ(time / 1000 * -30);
    // mesh.transform.setTranslate(new Vector3(2, 0, 0));

    renderer.clear(0, 0, 0, 1);
    renderer.render(scene, perspectiveCamera);

    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
