import {PostProcessPass} from "./PostProcessPass.js";

export class FXAAPass extends PostProcessPass {
    constructor({ gpu }) {
        const fragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSceneTexture;
        
float getLuminance(vec3 rgb) {
    return dot(rgb, vec3(.2126729, .7151522, .0721750));
}

void main() {
    vec4 textureColor = texture(uSceneTexture, vUv);
    float luminance = getLuminance(textureColor.rgb);
    outColor = vec4(vec3(luminance), 1.);
}
`;

        super({ gpu, fragmentShader });
    }
}