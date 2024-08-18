// import { UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import fogFragmentShader from '@/PaleGL/shaders/fog-fragment.glsl';
import {
    PostProcessPassBase,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs
} from '@/PaleGL/postprocess/PostProcessPassBase';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import {
    PostProcessPassType,
    RenderTargetTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes
} from '@/PaleGL/constants.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import {Override} from "@/PaleGL/palegl";

const UNIFORM_FOG_COLOR = 'uFogColor';
const UNIFORM_FOG_STRENGTH = 'uFogStrength';
const UNIFORM_FOG_DENSITY = 'uFogDensity';
const UNIFORM_FOG_DENSITY_ATTENUATION = 'uFogDensityAttenuation';
const UNIFORM_FOG_END_HEIGHT = 'uFogEndHeight';
const UNIFORM_DISTANCE_FOG_START = 'uDistanceFogStart';
const UNIFORM_DISTANCE_FOG_POWER = 'uDistanceFogPower';

export type FogPassParametersBase = {
    fogColor: Color;
    fogStrength: number;
    fogDensity: number;
    fogDensityAttenuation: number;
    fogEndHeight: number;
    distanceFogStart: number;
    distanceFogPower: number;
    blendRate: number;
};

export type FogPassParameters = PostProcessPassParametersBase & FogPassParametersBase;

export type FogPassParametersArgs = Partial<FogPassParameters>;

export function generateFogPassParameters(params: FogPassParametersArgs = {}): FogPassParameters {
    return {
        type: PostProcessPassType.Fog,
        enabled: params.enabled ?? true,
        fogColor: params.fogColor ?? Color.white,
        fogStrength: params.fogStrength ?? 0.01,
        fogDensity: params.fogDensity ?? 0.023,
        fogDensityAttenuation: params.fogDensityAttenuation ?? 0.45,
        fogEndHeight: params.fogEndHeight ?? 1,
        distanceFogStart: params.distanceFogStart ?? 20,
        distanceFogPower: params.distanceFogPower ?? 0.1,
        blendRate: params.blendRate ?? 1,
    };
}

export class FogPass extends PostProcessPassBase {
    private static lightShaftTextureUniformName = 'uLightShaftTexture';
    private static volumetricLightTextureUniformName = 'uVolumetricLightTexture';

    // fogColor: Color = Color.white;
    // fogStrength: number;
    // fogDensity: number;
    // fogDensityAttenuation: number;
    // fogEndHeight: number;
    // distanceFogStart: number;
    // distanceFogPower: number;
    // blendRate: number = 1;
    parameters: Override<PostProcessPassParametersBase, FogPassParameters>;

    constructor(args: { gpu: GPU, parameters?: FogPassParametersArgs }) {
        const { gpu } = args;
        const fragmentShader = fogFragmentShader;

        // const fogStrength = 0.01;
        // const fogDensity = 0.023;
        // const fogDensityAttenuation = 0.45;
        // const fogEndHeight = 1;
        // const distanceFogStart = 20;
        // const distanceFogPower = 0.1;
        const parameters = generateFogPassParameters();

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
                    value: parameters.fogStrength,
                },
                {
                    name: UNIFORM_FOG_DENSITY,
                    type: UniformTypes.Float,
                    value: parameters.fogDensity,
                },
                {
                    name: UNIFORM_FOG_DENSITY_ATTENUATION,
                    type: UniformTypes.Float,
                    value: parameters.fogDensityAttenuation,
                },
                {
                    name: UNIFORM_FOG_END_HEIGHT,
                    type: UniformTypes.Float,
                    value: parameters.fogEndHeight,
                },
                {
                    name: UNIFORM_DISTANCE_FOG_START,
                    type: UniformTypes.Float,
                    value: parameters.distanceFogStart,
                },
                {
                    name: UNIFORM_DISTANCE_FOG_POWER,
                    type: UniformTypes.Float,
                    value: parameters.distanceFogPower,
                },
                {
                    name: "uBlendRate",
                    type: UniformTypes.Float,
                    value: 1,
                }
                // ...PostProcessPassBase.commonUniforms,
            ],
            uniformBlockNames: [UniformBlockNames.Camera],
            parameters: {...parameters, type: PostProcessPassType.Fog }
        });
        
        this.parameters = parameters;

        // this.fogColor = Color.white;
        // this.fogStrength = fogStrength;
        // this.fogDensity = fogDensity;
        // this.fogDensityAttenuation = fogDensityAttenuation;
        // this.fogEndHeight = fogEndHeight;
        // this.distanceFogStart = distanceFogStart;
        // this.distanceFogPower = distanceFogPower;
    }

    // TODO: mapの割り当て、renderなりupdateなりで一緒にやった方がいい気がする.

    setLightShaftMap(rt: RenderTarget) {
        this.material.uniforms.setValue(FogPass.lightShaftTextureUniformName, rt.read.texture);
    }

    setVolumetricLightMap(rt: RenderTarget) {
        this.material.uniforms.setValue(FogPass.volumetricLightTextureUniformName, rt.read.texture);
    }

    render(options: PostProcessPassRenderArgs) {
        this.material.uniforms.setValue(UNIFORM_FOG_COLOR, this.parameters.fogColor);
        this.material.uniforms.setValue(UNIFORM_FOG_STRENGTH, this.parameters.fogStrength);
        this.material.uniforms.setValue(UNIFORM_FOG_DENSITY, this.parameters.fogDensity);
        this.material.uniforms.setValue(UNIFORM_FOG_DENSITY_ATTENUATION, this.parameters.fogDensityAttenuation);
        this.material.uniforms.setValue(UNIFORM_FOG_END_HEIGHT, this.parameters.fogEndHeight);
        this.material.uniforms.setValue(UNIFORM_DISTANCE_FOG_START, this.parameters.distanceFogStart);
        this.material.uniforms.setValue(UNIFORM_DISTANCE_FOG_POWER, this.parameters.distanceFogPower);
        this.material.uniforms.setValue("uBlendRate", this.parameters.blendRate);
        super.render(options);
    }
}
