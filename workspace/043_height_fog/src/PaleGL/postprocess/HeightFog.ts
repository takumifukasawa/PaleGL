// import { UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import heightFogFragmentShader from '@/PaleGL/shaders/height-fog-fragment.glsl';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { RenderTargetTypes, UniformTypes } from '@/PaleGL/constants.ts';

export class HeightFogPass extends PostProcessPassBase {
    
    private static lightShaftTextureUniformName = "uLightShaftTexture";
    
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = heightFogFragmentShader;

        super({
            gpu,
            fragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: {
                // TODO: defaultはblacktextureを渡す。lightshaftがない場合もあるので. もしくはboolを渡す
                [HeightFogPass.lightShaftTextureUniformName]: {
                    type: UniformTypes.Texture,
                    value: null, 
                },
                // ...PostProcessPassBase.commonUniforms,
            },
        });
    }

    setLightShaftMap(rt: RenderTarget) {
        this.material.updateUniform(HeightFogPass.lightShaftTextureUniformName, rt.read.texture);
    }
}
