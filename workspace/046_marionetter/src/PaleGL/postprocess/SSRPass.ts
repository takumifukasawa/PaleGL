import { RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import ssrFragmentShader from '@/PaleGL/shaders/ssr-fragment.glsl';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';

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

export class SSRPass extends PostProcessPassBase {
    rayDepthBias = 0.0099;
    rayNearestDistance = 0.13;
    rayMaxDistance = 3.25;
    reflectionRayThickness = 0.3;

    reflectionRayJitterSizeX = 0.05;
    reflectionRayJitterSizeY = 0.05;

    reflectionFadeMinDistance = 0;
    reflectionFadeMaxDistance = 4.2;

    reflectionScreenEdgeFadeFactorMinX = 0.42;
    reflectionScreenEdgeFadeFactorMaxX = 0.955;
    reflectionScreenEdgeFadeFactorMinY = 0.444;
    reflectionScreenEdgeFadeFactorMaxY = 1;

    reflectionAdditionalRate = 0.355;

    blendRate: number = 1;

    /**
     *
     * @param gpu
     */
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = ssrFragmentShader;

        const baseUniforms: UniformsData = [
            {
                name: UniformNames.GBufferBTexture,
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
                name: 'uBlendRate',
                type: UniformTypes.Float,
                value: 1,
            },
        ];

        super({
            gpu,
            fragmentShader,
            uniforms: baseUniforms,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        });
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
        this.material.uniforms.setValue('uRayDepthBias', this.rayDepthBias);
        this.material.uniforms.setValue('uRayNearestDistance', this.rayNearestDistance);
        this.material.uniforms.setValue('uRayMaxDistance', this.rayMaxDistance);
        this.material.uniforms.setValue('uReflectionRayThickness', this.reflectionRayThickness);

        this.material.uniforms.setValue('uReflectionRayJitterSizeX', this.reflectionRayJitterSizeX);
        this.material.uniforms.setValue('uReflectionRayJitterSizeY', this.reflectionRayJitterSizeY);

        this.material.uniforms.setValue('uReflectionFadeMinDistance', this.reflectionFadeMinDistance);
        this.material.uniforms.setValue('uReflectionFadeMaxDistance', this.reflectionFadeMaxDistance);

        this.material.uniforms.setValue('uReflectionScreenEdgeFadeFactorMinX', this.reflectionScreenEdgeFadeFactorMinX);
        this.material.uniforms.setValue('uReflectionScreenEdgeFadeFactorMaxX', this.reflectionScreenEdgeFadeFactorMaxX);
        this.material.uniforms.setValue('uReflectionScreenEdgeFadeFactorMinY', this.reflectionScreenEdgeFadeFactorMinY);
        this.material.uniforms.setValue('uReflectionScreenEdgeFadeFactorMaxY', this.reflectionScreenEdgeFadeFactorMaxY);

        this.material.uniforms.setValue('uReflectionAdditionalRate', this.reflectionAdditionalRate);
        this.material.uniforms.setValue('uBlendRate', this.blendRate);

        super.render(options);
    }
}
