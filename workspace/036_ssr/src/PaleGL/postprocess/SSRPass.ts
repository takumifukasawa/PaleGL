import {PostProcessUniformNames, UniformTypes} from '@/PaleGL/constants';
import {GPU} from '@/PaleGL/core/GPU';
import ssrFragmentShader from '@/PaleGL/shaders/ssr-fragment.glsl';
import {Matrix4} from '@/PaleGL/math/Matrix4';
import {PostProcessRenderArgs} from '@/PaleGL/postprocess/IPostProcessPass';
import {PostProcessPassBase} from "@/PaleGL/postprocess/PostProcessPassBase.ts";

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

    reflectionFadeMinDistance = 0.;
    reflectionFadeMaxDistance = 4.2;

    reflectionScreenEdgeFadeFactorMinX = 0.42;
    reflectionScreenEdgeFadeFactorMaxX = 0.955;
    reflectionScreenEdgeFadeFactorMinY = 0.444;
    reflectionScreenEdgeFadeFactorMaxY = 1.;

    reflectionAdditionalRate = 0.355;

    blendRate: number = 1;

    /**
     *
     * @param gpu
     */
    constructor({gpu}: { gpu: GPU }) {
        const fragmentShader = ssrFragmentShader;

        super({
            gpu,
            fragmentShader,
            uniforms: {
                [PostProcessUniformNames.TargetWidth]: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                [PostProcessUniformNames.TargetHeight]: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uBaseColorTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uNormalTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uDepthTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uTransposeInverseViewMatrix: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
                uProjectionMatrix: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
                uInverseProjectionMatrix: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
                uInverseViewProjectionMatrix: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
                [PostProcessUniformNames.CameraNear]: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                [PostProcessUniformNames.CameraFar]: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uRayDepthBias: {
                    type: UniformTypes.Float,
                    value: 0,
                },
                uRayNearestDistance: {
                    type: UniformTypes.Float,
                    value: 0,
                },
                uRayMaxDistance: {
                    type: UniformTypes.Float,
                    value: 0,
                },
                uReflectionAdditionalRate: {
                    type: UniformTypes.Float,
                    value: 0,
                },
                uReflectionRayThickness: {

                    type: UniformTypes.Float,
                    value: 0,
                },
                uReflectionRayJitterSizeX: {
                    type: UniformTypes.Float,
                    value: 0,
                },
                uReflectionRayJitterSizeY: {
                    type: UniformTypes.Float,
                    value: 0,
                },
                uReflectionFadeMinDistance: {
                    type: UniformTypes.Float,
                    value: 0,
                },
                uReflectionFadeMaxDistance: {
                    type: UniformTypes.Float,
                    value: 0,
                },
                uReflectionScreenEdgeFadeFactorMinX: {
                    type: UniformTypes.Float,
                    value: 0,
                },
                uReflectionScreenEdgeFadeFactorMaxX: {
                    type: UniformTypes.Float,
                    value: 0,
                },
                uReflectionScreenEdgeFadeFactorMinY: {
                    type: UniformTypes.Float,
                    value: 0,
                },
                uReflectionScreenEdgeFadeFactorMaxY: {
                    type: UniformTypes.Float,
                    value: 0,
                },
                uBlendRate: {
                    type: UniformTypes.Float,
                    value: 1,
                },
            },
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
        this.material.updateUniform(PostProcessUniformNames.TargetWidth, width);
        this.material.updateUniform(PostProcessUniformNames.TargetHeight, height);
    }

    render(options: PostProcessRenderArgs) {

        this.material.updateUniform('uRayDepthBias', this.rayDepthBias);
        this.material.updateUniform('uRayNearestDistance', this.rayNearestDistance);
        this.material.updateUniform('uRayMaxDistance', this.rayMaxDistance);
        this.material.updateUniform('uReflectionRayThickness', this.reflectionRayThickness);

        this.material.updateUniform('uReflectionRayJitterSizeX', this.reflectionRayJitterSizeX);
        this.material.updateUniform('uReflectionRayJitterSizeY', this.reflectionRayJitterSizeY);

        this.material.updateUniform('uReflectionFadeMinDistance', this.reflectionFadeMinDistance);
        this.material.updateUniform('uReflectionFadeMaxDistance', this.reflectionFadeMaxDistance);

        this.material.updateUniform('uReflectionScreenEdgeFadeFactorMinX', this.reflectionScreenEdgeFadeFactorMinX);
        this.material.updateUniform('uReflectionScreenEdgeFadeFactorMaxX', this.reflectionScreenEdgeFadeFactorMaxX);
        this.material.updateUniform('uReflectionScreenEdgeFadeFactorMinY', this.reflectionScreenEdgeFadeFactorMinY);
        this.material.updateUniform('uReflectionScreenEdgeFadeFactorMaxY', this.reflectionScreenEdgeFadeFactorMaxY);
       
        this.material.updateUniform('uReflectionAdditionalRate', this.reflectionAdditionalRate);
        this.material.updateUniform('uBlendRate', this.blendRate);

        super.render(options);
    }
}
