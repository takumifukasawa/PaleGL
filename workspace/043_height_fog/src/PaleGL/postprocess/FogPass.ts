// import { UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import fogFragmentShader from '@/PaleGL/shaders/fog-fragment.glsl';
import {PostProcessPassBase, PostProcessPassRenderArgs} from '@/PaleGL/postprocess/PostProcessPassBase';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';

export class FogPass extends PostProcessPassBase {
    private static lightShaftTextureUniformName = 'uLightShaftTexture';

    uFogStrength: number = 0;

    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = fogFragmentShader;
        
        const fogStrength = 0.01;

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
                // ...PostProcessPassBase.commonUniforms,
            },
        });
        
        this.uFogStrength = fogStrength;
    }

    setLightShaftMap(rt: RenderTarget) {
        this.material.updateUniform(FogPass.lightShaftTextureUniformName, rt.read.texture);
    }
    
    render(options: PostProcessPassRenderArgs) {
        this.material.updateUniform('uFogStrength', this.uFogStrength);

        super.render(options);
    }   
}
