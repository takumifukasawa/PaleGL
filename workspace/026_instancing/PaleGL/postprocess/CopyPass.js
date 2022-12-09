import {PostProcessPass} from "./PostProcessPass.js";


export class CopyPass extends PostProcessPass {
    constructor({ gpu }) {
        const fragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSceneTexture;

void main() {
    vec4 textureColor = texture(uSceneTexture, vUv);
    outColor = textureColor;
}
`;

        super({ gpu, fragmentShader });
    }
}