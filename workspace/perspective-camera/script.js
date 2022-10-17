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

const canvas = document.getElementById("js-canvas");

const vertexShader = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec3 aColor;

uniform mat4 uWorldMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vColor;

void main() {
    vColor = aColor;
    // gl_Position = uProjectionMatrix * uWorldMatrix * vec4(aPosition, 1);
    // gl_Position = uProjectionMatrix * vec4(aPosition, 1);
    gl_Position = uWorldMatrix * vec4(aPosition, 1);
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

const renderer = new ForwardRenderer({gpu});

const perspectiveMatrix = Matrix4.getPerspectiveMatrix(60, 1, 0.1, 1);

const geometry = new Geometry({
    gpu,
    attributes: {
        position: {
            // -----------------------------
            // 0 ---- 1
            // |      |
            // |      |
            // 3 ---- 2
            // -----------------------------
            data: [
                -0.2, 0.2, -0.1,
                0.2, 0.2, -0.1,
                0.2, -0.2, -0.1,
                -0.2, -0.2, -0.1
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
    indices: [0, 2, 1, 0, 3, 2],
    drawCount: 6
});


const material = new Material({
    gpu,
    vertexShader,
    fragmentShader,
    primitiveType: PrimitiveTypes.Triangles,
    uniforms: {
        uWorldMatrix: {
            type: UniformTypes.Matrix4,
            value: Matrix4.identity()
        },
        uProjectionMatrix: {
            type: UniformTypes.Matrix4,
            value: perspectiveMatrix
        }
    }
});

const mesh = new Mesh(geometry, material);

scene.add(mesh);

renderer.setSize(512, 512);

const tick = (time) => {
    renderer.clear(0, 0, 0, 1);
    
    const scaleMatrix = Matrix4.scaleMatrix(new Vector3(2, 1, 1))
    const rotationMatrix = Matrix4.rotateZMatrix((time / 1000 * 0) * (Math.PI / 180))
    // const translateMatrix = Matrix4.translateMatrix(new Vector3(Math.sin(time / 1000) * 0, 0, 0))
    const translateMatrix = Matrix4.translateMatrix(new Vector3(0.2, 0, 0))
    // const worldMatrix = Matrix4.multiplyMatrices(scaleMatrix, rotationMatrix, translateMatrix);
    const worldMatrix = Matrix4.multiplyMatrices(translateMatrix, rotationMatrix, scaleMatrix);
    // worldMatrix.log();
    material.uniforms.uWorldMatrix.value = worldMatrix;
    
    renderer.render(scene);

    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
