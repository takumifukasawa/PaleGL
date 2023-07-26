import { GPU } from '@/PaleGL/core/GPU';
import copyPassFragmentShader from '@/PaleGL/shaders/copy-pass-fragment.glsl';
import {PostProcessPassBase} from "@/PaleGL/postprocess/PostProcessPassBase.ts";

// export class CopyPass extends PostProcessPass {
export class CopyPass extends PostProcessPassBase {
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = copyPassFragmentShader;
//         const fragmentShader = `#version 300 es
// 
// precision mediump float;
// 
// in vec2 vUv;
// 
// out vec4 outColor;
// 
// uniform sampler2D uSrcTexture;
// 
// void main() {
//     vec4 textureColor = texture(uSrcTexture, vUv);
//     outColor = textureColor;
// }
// `;

        super({ gpu, fragmentShader });
    }
}
