// import { UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import fogFragmentShader from '@/PaleGL/shaders/fog-fragment.glsl';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import {RenderTargetTypes, UniformBlockNames, UniformNames, UniformTypes} from '@/PaleGL/constants.ts';

export class FogPass extends PostProcessPassBase {
    private static lightShaftTextureUniformName = 'uLightShaftTexture';
    private static volumetricLightTextureUniformName = 'uVolumetricLightTexture';

    fogStrength: number = 0;
    fogDensity = 0.01;
    fogDensityAttenuation = 0.01;
    fogEndHeight = 1;

    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = fogFragmentShader;

        const fogStrength = 0.01;
        const fogDensity = 0.023;
        const fogDensityAttenuation = 0.45;
        const fogEndHeight = 1;

        super({
            gpu,
            fragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: [
                {
                    // TODO: defaultはblacktextureを渡す。lightshaftがない場合もあるので. もしくはboolを渡す
                    name: UniformNames.DepthTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: FogPass.lightShaftTextureUniformName,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: FogPass.volumetricLightTextureUniformName,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uFogStrength',
                    type: UniformTypes.Float,
                    value: fogStrength,
                },
                {
                    name: 'uFogDensity',
                    type: UniformTypes.Float,
                    value: fogDensity,
                },
                {
                    name: 'uFogDensityAttenuation',
                    type: UniformTypes.Float,
                    value: fogDensityAttenuation,
                },
                {
                    name: 'uFogEndHeight',
                    type: UniformTypes.Float,
                    value: fogEndHeight,
                },
                // ...PostProcessPassBase.commonUniforms,
            ],
            uniformBlockNames: [
                UniformBlockNames.Camera
            ]
        });

        this.fogStrength = fogStrength;
        this.fogDensity = fogDensity;
        this.fogDensityAttenuation = fogDensityAttenuation;
        this.fogEndHeight = fogEndHeight;
    }

    // TODO: mapの割り当て、renderなりupdateなりで一緒にやった方がいい気がする. 
    
    setLightShaftMap(rt: RenderTarget) {
        this.material.uniforms.setValue(FogPass.lightShaftTextureUniformName, rt.read.texture);
    }
    
    setVolumetricLightMap(rt: RenderTarget) {
        this.material.uniforms.setValue(FogPass.volumetricLightTextureUniformName, rt.read.texture);
    }

    render(options: PostProcessPassRenderArgs) {
        this.material.uniforms.setValue('uFogStrength', this.fogStrength);
        this.material.uniforms.setValue('uFogDensity', this.fogDensity);
        this.material.uniforms.setValue('uFogDensityAttenuation', this.fogDensityAttenuation);
        this.material.uniforms.setValue('uFogEndHeight', this.fogEndHeight);
        super.render(options);
    }
}
