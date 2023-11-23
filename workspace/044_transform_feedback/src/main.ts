import { GPU } from '@/PaleGL/core/GPU';

// geometries

// loaders

// materials

// math

// postprocess
// import {FragmentPass} from '@/PaleGL/postprocess/FragmentPass';
// import {PostProcess} from '@/PaleGL/postprocess/PostProcess';
// import { BloomPass } from '@/PaleGL/postprocess/BloomPass';
// import { SSAOPass } from '@/PaleGL/postprocess/SSAOPass';
// import { SSRPass } from '@/PaleGL/postprocess/SSRPass';
// import { LightShaftPass } from "@/PaleGL/postprocess/LightShaftPass";

// inputs
import { TouchInputController } from '@/PaleGL/inputs/TouchInputController';
import { MouseInputController } from '@/PaleGL/inputs/MouseInputController';

// others
import { AttributeUsageType } from '@/PaleGL/constants';

import { Attribute } from '@/PaleGL/core/Attribute';
import { TransformFeedbackBuffer } from '@/PaleGL/geometries/TransformFeedbackBuffer.ts';
// import { Shader } from '@/PaleGL/core/Shader.ts';
// import * as buffer from 'buffer';
// import {Light} from "@/PaleGL/actors/Light.ts";
// import {Actor} from "@/PaleGL/actors/Actor.ts";

// import testVert from '@/PaleGL/shaders/test-shader-vert.glsl';
// import testFrag from '@/PaleGL/shaders/test-shader-frag.glsl';
// import phongVert from '@/PaleGL/shaders/phong-vertex.glsl';

// console.log('----- vert -----');
// console.log(testVert);
// console.log('----- frag -----');
// console.log(testFrag);
// console.log('----- phong vert -----');
// console.log(phongVert);
// console.log('----------------');

const stylesText = `
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

body {
  overflow: hidden;
}

* {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
} 

#wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  background-color: black;
}
`;
const styleElement = document.createElement('style');
styleElement.innerText = stylesText;
document.head.appendChild(styleElement);

const debuggerStates: {
    instanceNum: number;
    orbitControlsEnabled: boolean;
} = {
    instanceNum: 0,
    orbitControlsEnabled: true,
};

const searchParams = new URLSearchParams(location.search);
const instanceNumStr = searchParams.get('instance-num');
const instanceNum = instanceNumStr ? Number.parseInt(instanceNumStr, 10) : 500;
console.log(`instance num: ${instanceNum}`);

debuggerStates.instanceNum = instanceNum;

const isSP = !!window.navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i);
const inputController = isSP ? new TouchInputController() : new MouseInputController();
inputController.start();

// const wrapperElement = document.getElementById("wrapper")!;
const wrapperElement = document.createElement('div');
document.body.appendChild(wrapperElement);
wrapperElement.setAttribute('id', 'wrapper');

// const canvasElement = document.getElementById("js-canvas")! as HTMLCanvasElement;
const canvasElement = document.createElement('canvas')!;
wrapperElement.appendChild(canvasElement);

const gl = canvasElement.getContext('webgl2', { antialias: false });

if (!gl) {
    throw 'invalid gl';
}

const gpu = new GPU({ gl });

const instanceNumView = document.createElement('p');
instanceNumView.textContent = `instance num: ${instanceNum}`;
instanceNumView.style.cssText = `
position: absolute;
top: 0;
left: 0;
right: 0;
margin: auto;
padding: 0.2em 0.5em;
font-size: 9px;
color: white;
font-weight: bold;
text-shadow: rgba(0, 0, 0, 0.7) 1px 1px;
text-align: center;
`;
wrapperElement?.appendChild(instanceNumView);

const transformFeedbackBuffer = new TransformFeedbackBuffer({
    gpu,
    attributes: [
        new Attribute({
            name: 'aPosition',
            data: new Float32Array([1, 2, 3, 4, 5, 6]),
            size: 3,
            usageType: AttributeUsageType.DynamicDraw,
        }),
        new Attribute({
            name: "aVelocity",
            data: new Float32Array([7, 8, 9, 10, 11, 12]),
            size: 3,
            usageType: AttributeUsageType.DynamicDraw
        })
    ],
    varyings: [
        {
            name: 'vPosition',
            data: new Float32Array([0, 0, 0, 0, 0, 0]),
            // size: 3,
        },
        {
            name: 'vVelocity',
            data: new Float32Array([0, 0, 0, 0, 0, 0]),
            // size: 3,
        },
    ],
    vertexShader: `#version 300 es

        precision highp float;

        layout(location = 0) in vec3 aPosition;
        layout(location = 1) in vec3 aVelocity;

        out vec3 vPosition;
        out vec3 vVelocity;

        void main() {
            vPosition = aPosition * 2.;
            vVelocity = aVelocity * 3.;
        }
        `,
    fragmentShader: `#version 300 es

        precision highp float;

        void main() {
        }
        `,
    drawCount: 2,
    // shader: new Shader({
    //     gpu,
    //     vertexShader: `#version 300 es

    //     precision highp float;

    //     layout(location = 0) in vec3 aPosition;
    //     layout(location = 1) in vec3 aVelocity;

    //     out vec3 vPosition;
    //     out vec3 vVelocity;

    //     void main() {
    //         vPosition = aPosition;
    //         vVelocity = aVelocity;
    //     }
    //     `,
    //     fragmentShader: `#version 300 es

    //     precision highp float;

    //     void main() {
    //     }
    //     `,
    //     transformFeedbackVaryings: ['vPosition', 'vVelocity'],
    // }),
});
// gpu.setShader(transformFeedbackBuffer.shader);
// gpu.setVertexArrayObject(transformFeedbackBuffer.vertexArrayObject);
// gpu.updateTransformFeedback(
//     transformFeedbackBuffer
//     // transformFeedbackBuffer.shader,
//     // transformFeedbackBuffer.vertexArrayObject,
//     // transformFeedbackBuffer.transformFeedback
//     //  transformFeedbackBuffer.drawCount
// );
gpu.updateTransformFeedback(transformFeedbackBuffer);
transformFeedbackBuffer.outputs.forEach(({ buffer }) => {
    const results = new Float32Array(6);
    gpu.gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, results);
    console.log(results);
});
