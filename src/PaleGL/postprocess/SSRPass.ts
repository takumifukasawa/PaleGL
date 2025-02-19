import {
    PostProcessPassType,
    RenderTargetTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes
} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import ssrFragmentShader from '@/PaleGL/shaders/ssr-fragment.glsl';
import {
    PostProcessPassBase, PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import { Override } from '@/PaleGL/palegl';

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
    constructor(args: { gpu: GPU; parameters?: SSRPassParameters }) {
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
        // this.material.uniforms.uTargetWidth.value = width;
        // this.material.uniforms.uTargetHeight.value = height;
        this.material.uniforms.setValue(UniformNames.TargetWidth, width);
        this.material.uniforms.setValue(UniformNames.TargetHeight, height);
    }

    render(options: PostProcessPassRenderArgs) {
        this.material.uniforms.setValue('uRayDepthBias', this.parameters.rayDepthBias);
        this.material.uniforms.setValue('uRayNearestDistance', this.parameters.rayNearestDistance);
        this.material.uniforms.setValue('uRayMaxDistance', this.parameters.rayMaxDistance);
        this.material.uniforms.setValue('uReflectionRayThickness', this.parameters.reflectionRayThickness);

        this.material.uniforms.setValue('uReflectionRayJitterSizeX', this.parameters.reflectionRayJitterSizeX);
        this.material.uniforms.setValue('uReflectionRayJitterSizeY', this.parameters.reflectionRayJitterSizeY);

        this.material.uniforms.setValue('uReflectionFadeMinDistance', this.parameters.reflectionFadeMinDistance);
        this.material.uniforms.setValue('uReflectionFadeMaxDistance', this.parameters.reflectionFadeMaxDistance);

        this.material.uniforms.setValue(
            'uReflectionScreenEdgeFadeFactorMinX',
            this.parameters.reflectionScreenEdgeFadeFactorMinX
        );
        this.material.uniforms.setValue(
            'uReflectionScreenEdgeFadeFactorMaxX',
            this.parameters.reflectionScreenEdgeFadeFactorMaxX
        );
        this.material.uniforms.setValue(
            'uReflectionScreenEdgeFadeFactorMinY',
            this.parameters.reflectionScreenEdgeFadeFactorMinY
        );
        this.material.uniforms.setValue(
            'uReflectionScreenEdgeFadeFactorMaxY',
            this.parameters.reflectionScreenEdgeFadeFactorMaxY
        );

        this.material.uniforms.setValue('uReflectionAdditionalRate', this.parameters.reflectionAdditionalRate);
        this.material.uniforms.setValue('uReflectionRoughnessPower', this.parameters.reflectionRoughnessPower);
        this.material.uniforms.setValue('uBlendRate', this.parameters.blendRate);

        super.render(options);
    }
}
