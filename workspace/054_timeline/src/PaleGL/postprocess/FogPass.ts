// import { UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import fogFragmentShader from '@/PaleGL/shaders/fog-fragment.glsl';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { RenderTargetTypes, UniformBlockNames, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';
import { Color } from '@/PaleGL/math/Color.ts';

const UNIFORM_FOG_COLOR = 'uFogColor';
const UNIFORM_FOG_STRENGTH = 'uFogStrength';
const UNIFORM_FOG_DENSITY = 'uFogDensity';
const UNIFORM_FOG_DENSITY_ATTENUATION = 'uFogDensityAttenuation';
const UNIFORM_FOG_END_HEIGHT = 'uFogEndHeight';
const UNIFORM_DISTANCE_FOG_START = 'uDistanceFogStart';
const UNIFORM_DISTANCE_FOG_POWER = 'uDistanceFogPower';

export class FogPass extends PostProcessPassBase {
    private static lightShaftTextureUniformName = 'uLightShaftTexture';
    private static volumetricLightTextureUniformName = 'uVolumetricLightTexture';

    fogColor: Color = Color.white;
    fogStrength: number;
    fogDensity: number;
    fogDensityAttenuation: number;
    fogEndHeight: number;
    distanceFogStart: number;
    distanceFogPower: number;
    blendRate: number = 1;

    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = fogFragmentShader;

        const fogStrength = 0.01;
        const fogDensity = 0.023;
        const fogDensityAttenuation = 0.45;
        const fogEndHeight = 1;
        const distanceFogStart = 20;
        const distanceFogPower = 0.1;

        super({
            gpu,
            fragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: [
                {
                    name: UNIFORM_FOG_COLOR,
                    type: UniformTypes.Color,
                    value: Color.white,
                },
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
                    name: UNIFORM_FOG_STRENGTH,
                    type: UniformTypes.Float,
                    value: fogStrength,
                },
                {
                    name: UNIFORM_FOG_DENSITY,
                    type: UniformTypes.Float,
                    value: fogDensity,
                },
                {
                    name: UNIFORM_FOG_DENSITY_ATTENUATION,
                    type: UniformTypes.Float,
                    value: fogDensityAttenuation,
                },
                {
                    name: UNIFORM_FOG_END_HEIGHT,
                    type: UniformTypes.Float,
                    value: fogEndHeight,
                },
                {
                    name: UNIFORM_DISTANCE_FOG_START,
                    type: UniformTypes.Float,
                    value: distanceFogStart,
                },
                {
                    name: UNIFORM_DISTANCE_FOG_POWER,
                    type: UniformTypes.Float,
                    value: distanceFogPower,
                },
                {
                    name: "uBlendRate",
                    type: UniformTypes.Float,
                    value: 1,
                }
                // ...PostProcessPassBase.commonUniforms,
            ],
            uniformBlockNames: [UniformBlockNames.Camera],
        });

        this.fogColor = Color.white;
        this.fogStrength = fogStrength;
        this.fogDensity = fogDensity;
        this.fogDensityAttenuation = fogDensityAttenuation;
        this.fogEndHeight = fogEndHeight;
        this.distanceFogStart = distanceFogStart;
        this.distanceFogPower = distanceFogPower;
    }

    // TODO: mapの割り当て、renderなりupdateなりで一緒にやった方がいい気がする.

    setLightShaftMap(rt: RenderTarget) {
        this.material.uniforms.setValue(FogPass.lightShaftTextureUniformName, rt.read.texture);
    }

    setVolumetricLightMap(rt: RenderTarget) {
        this.material.uniforms.setValue(FogPass.volumetricLightTextureUniformName, rt.read.texture);
    }

    render(options: PostProcessPassRenderArgs) {
        this.material.uniforms.setValue(UNIFORM_FOG_COLOR, this.fogColor);
        this.material.uniforms.setValue(UNIFORM_FOG_STRENGTH, this.fogStrength);
        this.material.uniforms.setValue(UNIFORM_FOG_DENSITY, this.fogDensity);
        this.material.uniforms.setValue(UNIFORM_FOG_DENSITY_ATTENUATION, this.fogDensityAttenuation);
        this.material.uniforms.setValue(UNIFORM_FOG_END_HEIGHT, this.fogEndHeight);
        this.material.uniforms.setValue(UNIFORM_DISTANCE_FOG_START, this.distanceFogStart);
        this.material.uniforms.setValue(UNIFORM_DISTANCE_FOG_POWER, this.distanceFogPower);
        this.material.uniforms.setValue("uBlendRate", this.blendRate);
        super.render(options);
    }
}
