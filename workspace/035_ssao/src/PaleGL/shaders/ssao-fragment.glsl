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
uniform float[6] uSamplingRotations;
uniform float[6] uSamplingDistances;
uniform float uOcclusionSampleLength;
uniform float uOcclusionBias;
uniform float uOcclusionMinDistance;
uniform float uOcclusionMaxDistance;
uniform vec4 uOcclusionColor;
uniform float uOcclusionStrength;
uniform float uBlendRate;

#pragma DEPTH_FUNCTIONS

mat2 getRotationMatrix(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    // [
    //    c, s,
    //   -s, c
    // ]
    return mat2(
        c, -s,
        s, c
    );
}

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

    float rawDepth = texture(uDepthTexture, uv).x;
    float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
    
    vec3 worldNormal = normalize(texture(uNormalTexture, uv).xyz * 2. - 1.);
    vec3 viewNormal = normalize((uTransposeInverseViewMatrix * vec4(worldNormal, 1.)).xyz);
    
    vec3 viewPosition = reconstructViewPositionFromDepth(
        uv,
        texture(uDepthTexture, uv).x,
        uInverseProjectionMatrix
    );

    if (sceneDepth > 1. - eps) {
        outColor = baseColor;
        return;
    }

    for (int i = 0; i < samplingCount; i++) {
        mat2 rot = getRotationMatrix(uSamplingRotations[i]);

        float offsetLen = uSamplingDistances[i] * uOcclusionSampleLength;
        vec3 offsetA = vec3(rot * vec2(1., 0.), 0.) * offsetLen;
        vec3 offsetB = -offsetA;
    
        float rawDepthA = sampleRawDepthByViewPosition(viewPosition, offsetA);
        float rawDepthB = sampleRawDepthByViewPosition(viewPosition, offsetB);

        float depthA = perspectiveDepthToLinearDepth(rawDepthA, uNearClip, uFarClip);
        float depthB = perspectiveDepthToLinearDepth(rawDepthB, uNearClip, uFarClip);

        vec3 viewPositionA = reconstructViewPositionFromDepth(
            uv,
            rawDepthA,
            uInverseProjectionMatrix
        );
        vec3 viewPositionB = reconstructViewPositionFromDepth(
            uv,
            rawDepthB,
            uInverseProjectionMatrix
        );

        float distA = distance(viewPositionA, viewPosition);
        float distB = distance(viewPositionB, viewPosition);

        // TODO: depthによるbandが発生している

        if (abs(sceneDepth - depthA) < uOcclusionBias) {
            continue;
        }
        if (abs(sceneDepth - depthB) < uOcclusionBias) {
            continue;
        }
        if (distA < uOcclusionMinDistance || uOcclusionMaxDistance < distA) {
            continue;
        }
        if (distB < uOcclusionMinDistance || uOcclusionMaxDistance < distB) {
            continue;
        }

        vec3 surfaceToCameraDir = -normalize(viewPosition);
        
        vec3 angleDirA = normalize(viewPositionA - viewPosition);
        vec3 angleDirB = normalize(viewPositionB - viewPosition);
        
        float cameraDirDotA = dot(angleDirA, surfaceToCameraDir);
        float cameraDirDotB = dot(angleDirB, surfaceToCameraDir);
        
        float normalDotA = dot(viewNormal, angleDirA);
        float normalDotB = dot(viewNormal, angleDirB);
        
        float clampedDotA = cameraDirDotA - min(normalDotA, 0.);
        float clampedDotB = cameraDirDotB - min(normalDotB, 0.);
        
        // pattern1: マイナスも考慮する場合
        // float ao = (dotA + dotB) * .5;
        // pattern2: マイナスを考慮しない場合
        // float ao = max(0., (cameraDirDotA + cameraDirDotB)) * .5;
        // pattern3: 法線方向でclamp
        float ao = max(0., clampedDotA + clampedDotB);
        // float ao = (clampedDotA + clampedDotB);

        occludedAcc += ao;
    }
    
    float aoRate = occludedAcc / float(samplingCount);
  
    aoRate = clamp(aoRate, 0., 1.);

    vec4 color = mix(
        baseColor,
        uOcclusionColor,
        clamp(aoRate * uBlendRate * uOcclusionStrength, 0., 1.)
    );

    // for debug
    // color = vec4(vec3(aoRate), 1.);

    color.a = 1.;
    
    outColor = color;
}
