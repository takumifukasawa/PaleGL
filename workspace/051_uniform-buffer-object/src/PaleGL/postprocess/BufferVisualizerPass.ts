import { UniformNames, UniformTypes } from '@/PaleGL/constants';
import bufferVisualizerPassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-pass-fragment.glsl';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { GPU } from '@/PaleGL/core/GPU';

// const rawVertexShader = `#version 300 es
// layout(location=0) in vec3 aPosition;layout(location=1) in vec2 aUv;layout(location=2) in vec3 aNormal;out vec2 vUv;void main(){vUv=aUv;gl_Position=vec4(aPosition,1);}
// `;
// 
// const rawFragmentShader = `#version 300 es
// precision highp float;in vec2 vUv;out vec4 outColor;uniform sampler2D uDepthTexture,uGBufferATexture,uGBufferBTexture,uGBufferCTexture,uGBufferDTexture,uDirectionalLightShadowMap,uAmbientOcclusionTexture,uDeferredShadingTexture,uLightShaftTexture,uFogTexture;uniform float uNearClip,uFarClip,uShowGBuffer;uniform mat4 uInverseViewProjectionMatrix;float v(float e,float v,float u){float s=v*e;return-s/(u*(e-1.)-s);}vec3 e(vec2 e,float v,mat4 t){vec4 s=t*vec4(e*2.-1.,v*2.-1.,1);return s.xyz/s.w;}
// #define SHADING_MODEL_NUM 3.
// struct GBufferA{vec3 baseColor;};struct GBufferB{vec3 normal;float shadingModelId;};struct GBufferC{float metallic;float roughness;};struct GBufferD{vec3 emissiveColor;};GBufferA e(sampler2D e,vec2 u){GBufferA G;G.baseColor=texture(e,u).xyz;return G;}GBufferB v(sampler2D e,vec2 u){vec4 v=texture(e,u);GBufferB G;G.normal=v.xyz*2.-1.;G.shadingModelId=v.w*SHADING_MODEL_NUM;return G;}GBufferC t(sampler2D e,vec2 u){vec4 v=texture(e,u);GBufferC G;G.metallic=v.x;G.roughness=v.y;return G;}GBufferD G(sampler2D e,vec2 u){GBufferD G;G.emissiveColor=texture(e,u).xyz;return G;}float v(vec2 u){return step(0.,u.x)*(1.-step(1.,u.x))*step(0.,u.y)*(1.-step(1.,u.y));}void main(){vec2 s=vec2(4),u=vUv*s+vec2(0,-3),f=vUv*s+vec2(-1,-3),r=vUv*s+vec2(-2,-3),x=vUv*s+vec2(-3),y=vUv*s+vec2(0,-2),p=vUv*s+vec2(-1,-2),c=vUv*s+vec2(-2),d=vUv*s+vec2(-3,-2),l=vUv*s+vec2(0,-1),m=vUv*s+vec2(-1),A=vUv*s+vec2(-2,-1);GBufferA S=e(uGBufferATexture,u);GBufferB b=v(uGBufferBTexture,f);GBufferC h=t(uGBufferCTexture,r);GBufferD n=G(uGBufferDTexture,x);float z=texture(uDepthTexture,y).x*v(y),B=v(z,uNearClip,uFarClip)*v(y);vec3 o=e(p,texture(uDepthTexture,p).x,uInverseViewProjectionMatrix);vec4 C=texture(uDirectionalLightShadowMap,c)*v(c),D=texture(uAmbientOcclusionTexture,d)*v(d);outColor=vec4(S.baseColor,1)*v(u)+vec4(b.normal,1)*v(f)+vec4(h.metallic,h.roughness,0,1)*v(r)+vec4(n.emissiveColor,1)*v(x)+B+C+vec4(o,1)*v(p)+D+vec4(texture(uDeferredShadingTexture,l).xyz,1)*v(l)+vec4(texture(uLightShaftTexture,m).xyz,1)*v(m)+vec4(texture(uFogTexture,A).xyz,1)*v(A);}
// `;

export class BufferVisualizerPass extends PostProcessPassBase {
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = bufferVisualizerPassFragmentShader;

        super({
            gpu,
            name: "BufferVisualizerPass",
            fragmentShader,
            // rawVertexShader,
            // rawFragmentShader,
            uniforms: [
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
                    name: UniformNames.GBufferDTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UniformNames.DepthTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uDirectionalLightShadowMap',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uSpotLightShadowMap',
                    type: UniformTypes.TextureArray,
                    value: []
                },
                {
                    name: 'uAmbientOcclusionTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uDeferredShadingTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uLightShaftTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: "uVolumetricLightTexture",
                    type: UniformTypes.Texture,
                    value: null
                },
                {
                    name: "uDepthOfFieldTexture",
                    type: UniformTypes.Texture,
                    value: null
                },
                {
                    name: 'uFogTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uNearClip',
                    type: UniformTypes.Float,
                    value: 0.1,
                },
                {
                    name: 'uFarClip',
                    type: UniformTypes.Float,
                    value: 1,
                },
                {
                    name: 'uInverseViewProjectionMatrix',
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
            ],
        });
    }
}
