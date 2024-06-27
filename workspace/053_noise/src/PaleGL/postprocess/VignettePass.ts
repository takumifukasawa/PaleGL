import {UniformNames, UniformTypes} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import vignetteFragment from '@/PaleGL/shaders/vignette-fragment.glsl';
import {PostProcessPassBase, PostProcessPassRenderArgs} from '@/PaleGL/postprocess/PostProcessPassBase';

// ref:

const UNIFORM_NAME_VIGNETTE_RADIUS = 'uVignetteRadius';
const UNIFORM_VALUE_VIGNETTE_RADIUS = 2.5;
const UNIFORM_NAME_VIGNETTE_POWER = 'uVignettePower';
const UNIFORM_VALUE_VIGNETTE_POWER = 1.4;
const UNIFORM_NAME_BLEND_RATE = 'uBlendRate';
const UNIFORM_VALUE_BLEND_RATE = 1;

export class VignettePass extends PostProcessPassBase {
    vignetteRadius: number;
    vignettePower: number;
    blendRate: number;

    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = vignetteFragment;
        

        super({
            gpu,
            fragmentShader,
            uniforms: [{
                name: UNIFORM_NAME_VIGNETTE_RADIUS,
                type: UniformTypes.Float,
                value: UNIFORM_VALUE_VIGNETTE_RADIUS
            }, {
                name: UNIFORM_NAME_VIGNETTE_POWER,
                type: UniformTypes.Float,
                value: UNIFORM_VALUE_VIGNETTE_POWER
            }, {
                name: UNIFORM_NAME_BLEND_RATE,
                type: UniformTypes.Float,
                value: UNIFORM_VALUE_BLEND_RATE
            }, {
                name: UniformNames.Aspect,
                type: UniformTypes.Float,
                value: 1
            }],
        });
    
        this.vignetteRadius = UNIFORM_VALUE_VIGNETTE_RADIUS;
        this.vignettePower = UNIFORM_VALUE_VIGNETTE_POWER;
        this.blendRate = UNIFORM_VALUE_BLEND_RATE;
    }

    setSize(width: number, height: number) {
        super.setSize(width, height);
        this.material.uniforms.setValue(UniformNames.Aspect, width / height);
    }
    
    render(options: PostProcessPassRenderArgs) {
        this.material.uniforms.setValue(
            UNIFORM_NAME_VIGNETTE_RADIUS,
            this.vignetteRadius
        );
        this.material.uniforms.setValue(
            UNIFORM_NAME_VIGNETTE_POWER,
            this.vignettePower
        );
        this.material.uniforms.setValue(
            UNIFORM_NAME_BLEND_RATE,
            this.blendRate
        );

        super.render(options);
    }
}
