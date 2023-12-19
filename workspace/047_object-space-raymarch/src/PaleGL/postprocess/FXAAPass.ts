import { UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import fxaaFragmentShader from '@/PaleGL/shaders/fxaa-fragment.glsl';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase';

// ref:
// https://catlikecoding.com/unity/tutorials/advanced-rendering/fxaa/
// http://blog.simonrodriguez.fr/articles/2016/07/implementing_fxaa.html
// https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
// http://iryoku.com/aacourse/downloads/09-FXAA-3.11-in-15-Slides.pdf

export class FXAAPass extends PostProcessPassBase {
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = fxaaFragmentShader;

        super({
            gpu,
            fragmentShader,
            uniforms: [
                // uTargetWidth: {
                //     type: UniformTypes.Float,
                //     value: 1,
                // },
                // uTargetHeight: {
                //     type: UniformTypes.Float,
                //     value: 1,
                // },
                // 1/32 = 0.03125 ... visible limit
                // 1/16 = 0.0625 ... high quality
                // 1/12 = 0.0833 ... upper limit
                {
                name: "uContrastThreshold",
                    type: UniformTypes.Float,
                    value: 0.0625,
                },
                // 1/3 = 0.333 ... too little
                // 1/4 = 0.25 ... low quality
                // 1/8 = 0.125 ... high quality
                // 1/16 = 0.0625 ... overkill
                {
                name: "uRelativeThreshold",
                    type: UniformTypes.Float,
                    value: 0.125,
                },{
                name:"uSubpixelBlending",
                    type: UniformTypes.Float,
                    value: 0.75,
                },
                // ...PostProcessPassBase.commonUniforms,
            ],
        });
        // this.gpu = gpu;
    }

    setSize(width: number, height: number) {
        super.setSize(width, height);
        this.material.uniforms.setValue('uTargetWidth', width);
        this.material.uniforms.setValue('uTargetHeight', height);
    }
}
