// import { UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import fogFragmentShader from '@/PaleGL/shaders/fog-fragment.glsl';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { RenderTargetTypes, UniformTypes } from '@/PaleGL/constants.ts';

export class FogPass extends PostProcessPassBase {
    
    private static lightShaftTextureUniformName = "uLightShaftTexture";
    
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = fogFragmentShader;

        super({
            gpu,
            fragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: {
                // TODO: defaultはblacktextureを渡す。lightshaftがない場合もあるので. もしくはboolを渡す
                [FogPass.lightShaftTextureUniformName]: {
                    type: UniformTypes.Texture,
                    value: null, 
                },
                // ...PostProcessPassBase.commonUniforms,
            },
        });
    }

    setLightShaftMap(rt: RenderTarget) {
        this.material.updateUniform(FogPass.lightShaftTextureUniformName, rt.read.texture);
    }
}
