#version 300 es

precision highp float;

#pragma DEFINES

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uBaseColorTexture;
uniform sampler2D uDepthTexture;
uniform sampler2D uNormalTexture;
uniform float uNearClip;
uniform float uFarClip;
uniform mat4 uTransposeInverseViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uInverseProjectionMatrix;
uniform float uBlendRate;

#pragma DEPTH_FUNCTIONS

float sampleRawDepthByViewPosition(vec3 viewPosition, vec3 offset) {
    vec4 offsetPosition = vec4(viewPosition + offset, 1.);
    vec4 projectedPosition = uProjectionMatrix * offsetPosition;
    vec3 projectedPositionNDC = projectedPosition.xyz / projectedPosition.w;
    vec2 projectedPositionUV = projectedPositionNDC.xy * .5 + .5;
    return texture(uDepthTexture, projectedPositionUV).x;
}

void main() {

    float occludedAcc = 0.;
    int samplingCount = 6;

    float eps = .0001;

    vec2 uv = vUv;
    
    vec4 baseColor = texture(uSrcTexture, uv);

    vec4 color = vec4(vec3(0.), 1.);
    
    color = baseColor;
   
    outColor = color;
}
