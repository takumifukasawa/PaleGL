import { GPU } from '@/PaleGL/core/GPU';
import copyPassFragmentShader from '@/PaleGL/shaders/copy-pass-fragment.glsl';
import {PostProcessPassBase} from "@/PaleGL/postprocess/PostProcessPassBase.ts";

// export class CopyPass extends PostProcessPass {
export class CopyPass extends PostProcessPassBase {
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = copyPassFragmentShader;
        super({ gpu, fragmentShader });
    }
}
