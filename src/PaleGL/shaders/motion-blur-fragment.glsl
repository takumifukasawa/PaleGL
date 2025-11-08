precision mediump float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform mat4 uInverseViewProjectionMatrix;
uniform mat4 uPrevViewProjectionMatrix;
uniform float uIntensity;

#include <depth>

void main() {
    vec4 color = texture(uSrcTexture, vUv);
    float rawDepth = texture(uDepthTexture, vUv).r;

    // Sky check
    if (rawDepth > 0.9999) {
        outColor = color;
        return;
    }

    // Reconstruct world position
    vec3 worldPos = fReconstructWorldPositionFromDepth(vUv, rawDepth, uInverseViewProjectionMatrix);

    // Calculate previous frame screen position
    vec4 prevClipPos = uPrevViewProjectionMatrix * vec4(worldPos, 1.0);
    vec2 prevScreenPos = (prevClipPos.xy / prevClipPos.w) * 0.5 + 0.5;

    // Calculate velocity
    vec2 velocity = (vUv - prevScreenPos) * uIntensity;

    // Motion blur sampling
    const int SAMPLES = 8;
    vec4 result = color;
    #pragma UNROLL_START
        vec2 offset = velocity * (float(UNROLL_N) / float(SAMPLES - 1) - 0.5);
        result += texture(uSrcTexture, vUv + offset);
    #pragma UNROLL_END
    result /= float(SAMPLES);

    outColor = result;
}
