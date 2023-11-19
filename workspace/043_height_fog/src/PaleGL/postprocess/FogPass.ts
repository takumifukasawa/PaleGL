// import { UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import fogFragmentShader from '@/PaleGL/shaders/fog-fragment.glsl';
import {PostProcessPassBase, PostProcessPassRenderArgs} from '@/PaleGL/postprocess/PostProcessPassBase';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';

export class FogPass extends PostProcessPassBase {
    private static lightShaftTextureUniformName = 'uLightShaftTexture';

    fogStrength: number = 0;
    fogDensity = 0.01;
    fogDensityAttenuation = 0.01;
    fogEndHeight = 1.;

    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = fogFragmentShader;
        
        const fogStrength = 0.01;
        const fogDensity = 0.01;
        const fogDensityAttenuation = 0.01;
        const fogEndHeight = 1.;

        super({
            gpu,
            fragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: {
                // TODO: defaultはblacktextureを渡す。lightshaftがない場合もあるので. もしくはboolを渡す
                [UniformNames.DepthTexture]: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                [FogPass.lightShaftTextureUniformName]: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uFogStrength: {
                    type: UniformTypes.Float,
                    value: fogStrength,
                },
                uFogDensity: {
                    type: UniformTypes.Float,
                    value: fogDensity
                },
                uFogDensityAttenuation: {
                    type: UniformTypes.Float,
                    value: fogDensityAttenuation
                },
                uFogEndHeight: {
                    type: UniformTypes.Float,
                    value: fogEndHeight
                }
                // ...PostProcessPassBase.commonUniforms,
            },
        });
        
        this.fogStrength = fogStrength;
        this.fogDensity = fogDensity;
        this.fogDensityAttenuation = fogDensityAttenuation;
        this.fogEndHeight = fogEndHeight;
    }

    setLightShaftMap(rt: RenderTarget) {
        this.material.updateUniform(FogPass.lightShaftTextureUniformName, rt.read.texture);
    }
    
    render(options: PostProcessPassRenderArgs) {
        this.material.updateUniform('uFogStrength', this.fogStrength);
        this.material.updateUniform('uFogDensity', this.fogDensity);
        this.material.updateUniform('uFogDensityAttenuation', this.fogDensityAttenuation);
        this.material.updateUniform('uFogEndHeight', this.fogEndHeight);
        super.render(options);
    }   
}
