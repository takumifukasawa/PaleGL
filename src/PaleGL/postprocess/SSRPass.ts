import {
    PostProcessPassType,
    RenderTargetTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import ssrFragmentShader from '@/PaleGL/shaders/ssr-fragment.glsl';
import {
    PostProcessPassBase,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { Override } from '@/PaleGL/palegl';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';

/*
float eps = .001;

float uRayDepthBias = .0099;
float uRayNearestDistance = .13;
float uRayMaxDistance = 3.25;
float uReflectionRayThickness = .3;

float uReflectionRayJitterSizeX = .05;
float uReflectionRayJitterSizeY = .05;

float uReflectionFadeMinDistance = 0.;
float uReflectionFadeMaxDistance = 4.2;

float uReflectionScreenEdgeFadeFactorMinX = .42;
float uReflectionScreenEdgeFadeFactorMaxX = .955;
float uReflectionScreenEdgeFadeFactorMinY = .444;
float uReflectionScreenEdgeFadeFactorMaxY = 1.;

float uReflectionAdditionalRate = .355;

int maxIterationNum = 32;
int binarySearchNum = 8;
*/

export type SSRPassParametersBase = {
    rayDepthBias: number;
    rayNearestDistance: number;
    rayMaxDistance: number;
    reflectionRayThickness: number;
    reflectionRayJitterSizeX: number;
    reflectionRayJitterSizeY: number;
    reflectionFadeMinDistance: number;
    reflectionFadeMaxDistance: number;
    reflectionScreenEdgeFadeFactorMinX: number;
    reflectionScreenEdgeFadeFactorMaxX: number;
    reflectionScreenEdgeFadeFactorMinY: number;
    reflectionScreenEdgeFadeFactorMaxY: number;
    reflectionRoughnessPower: number;
    reflectionAdditionalRate: number;
    blendRate: number;
};

export type SSRPassParameters = PostProcessPassParametersBase & SSRPassParametersBase;

export type SSRPassArgs = Partial<SSRPassParameters>;

export function generateSSRPassParameters(params: SSRPassArgs = {}): SSRPassParameters {
    return {
        enabled: params.enabled ?? true,
        rayDepthBias: params.rayDepthBias ?? 0.0099,
        rayNearestDistance: params.rayNearestDistance ?? 0.13,
        rayMaxDistance: params.rayMaxDistance ?? 3.25,
        reflectionRayThickness: params.reflectionRayThickness ?? 0.3,
        reflectionRayJitterSizeX: params.reflectionRayJitterSizeX ?? 0.05,
        reflectionRayJitterSizeY: params.reflectionRayJitterSizeY ?? 0.05,
        reflectionFadeMinDistance: params.reflectionFadeMinDistance ?? 0,
        reflectionFadeMaxDistance: params.reflectionFadeMaxDistance ?? 4.2,
        reflectionScreenEdgeFadeFactorMinX: params.reflectionScreenEdgeFadeFactorMinX ?? 0.42,
        reflectionScreenEdgeFadeFactorMaxX: params.reflectionScreenEdgeFadeFactorMaxX ?? 0.955,
        reflectionScreenEdgeFadeFactorMinY: params.reflectionScreenEdgeFadeFactorMinY ?? 0.444,
        reflectionScreenEdgeFadeFactorMaxY: params.reflectionScreenEdgeFadeFactorMaxY ?? 1,
        reflectionRoughnessPower: params.reflectionRoughnessPower ?? 0.5,
        reflectionAdditionalRate: params.reflectionAdditionalRate ?? 0.355,
        blendRate: params.blendRate ?? 1,
    };
}

// type Override<Type, NewType> = Omit<Type, keyof NewType> & NewType;

export class SSRPass extends PostProcessPassBase {
    parameters: Override<PostProcessPassParametersBase, SSRPassParameters>;

    /**
     *
     * @param args
     */
    constructor(args: { gpu: Gpu; parameters?: SSRPassParameters }) {
        const { gpu } = args;
        const parameters = generateSSRPassParameters(args.parameters ?? {});

        const fragmentShader = ssrFragmentShader;

        const baseUniforms: UniformsData = [
            {
                name: UniformNames.GBufferATexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: UniformNames.GBufferBTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: UniformNames.GBufferCTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: UniformNames.DepthTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: 'uRayDepthBias',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uRayNearestDistance',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uRayMaxDistance',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uReflectionAdditionalRate',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uReflectionRayThickness',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uReflectionRayJitterSizeX',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uReflectionRayJitterSizeY',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uReflectionFadeMinDistance',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uReflectionFadeMaxDistance',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uReflectionScreenEdgeFadeFactorMinX',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uReflectionScreenEdgeFadeFactorMaxX',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uReflectionScreenEdgeFadeFactorMinY',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uReflectionScreenEdgeFadeFactorMaxY',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uReflectionRoughnessPower',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uBlendRate',
                type: UniformTypes.Float,
                value: 1,
            },
        ];

        super({
            gpu,
            type: PostProcessPassType.SSR,
            fragmentShader,
            uniforms: baseUniforms,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniformBlockNames: [UniformBlockNames.Common],
            parameters,
        });

        this.parameters = parameters;
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        super.setSize(width, height);
        setMaterialUniformValue(this.material, UniformNames.TargetWidth, width);
        setMaterialUniformValue(this.material, UniformNames.TargetHeight, height);
    }

    render(options: PostProcessPassRenderArgs) {
        setMaterialUniformValue(this.material, 'uRayDepthBias', this.parameters.rayDepthBias);
        setMaterialUniformValue(this.material, 'uRayNearestDistance', this.parameters.rayNearestDistance);
        setMaterialUniformValue(this.material, 'uRayMaxDistance', this.parameters.rayMaxDistance);
        setMaterialUniformValue(this.material, 'uReflectionRayThickness', this.parameters.reflectionRayThickness);

        setMaterialUniformValue(this.material, 'uReflectionRayJitterSizeX', this.parameters.reflectionRayJitterSizeX);
        setMaterialUniformValue(this.material, 'uReflectionRayJitterSizeY', this.parameters.reflectionRayJitterSizeY);

        setMaterialUniformValue(this.material, 'uReflectionFadeMinDistance', this.parameters.reflectionFadeMinDistance);
        setMaterialUniformValue(this.material, 'uReflectionFadeMaxDistance', this.parameters.reflectionFadeMaxDistance);

        setMaterialUniformValue(
            this.material,
            'uReflectionScreenEdgeFadeFactorMinX',
            this.parameters.reflectionScreenEdgeFadeFactorMinX
        );
        setMaterialUniformValue(
            this.material,
            'uReflectionScreenEdgeFadeFactorMaxX',
            this.parameters.reflectionScreenEdgeFadeFactorMaxX
        );
        setMaterialUniformValue(
            this.material,
            'uReflectionScreenEdgeFadeFactorMinY',
            this.parameters.reflectionScreenEdgeFadeFactorMinY
        );
        setMaterialUniformValue(
            this.material,
            'uReflectionScreenEdgeFadeFactorMaxY',
            this.parameters.reflectionScreenEdgeFadeFactorMaxY
        );

        setMaterialUniformValue(this.material, 'uReflectionAdditionalRate', this.parameters.reflectionAdditionalRate);
        setMaterialUniformValue(this.material, 'uReflectionRoughnessPower', this.parameters.reflectionRoughnessPower);
        setMaterialUniformValue(this.material, 'uBlendRate', this.parameters.blendRate);

        super.render(options);
    }
}
