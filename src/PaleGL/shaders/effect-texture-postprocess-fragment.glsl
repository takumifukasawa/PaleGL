uniform sampler2D uSrcTexture;
uniform float uTilingEnabled;
uniform float uEdgeMaskMix;
uniform float uRemapMin;
uniform float uRemapMax;

in vec2 vUv;

out vec4 outColor;

const float EPS = .001;

// mat2 rot2(float rad) {
//     return mat2(cos(rad), -sin(rad), sin(rad), cos(rad));
// }

float circularMask(in vec2 uv, in float scale) {
    // vec2 p = abs(fract(uv) - vec2(0.5)) * 2.;
    // return max(1. - dot(p, p), EPS);
    
    vec2 p = abs(uv - vec2(0.5)) * scale;
    // 1: default
    return clamp(0., 1., max(1. - dot(p, p), EPS));
    // 2: smooth
    // return smoothstep(0., 1., max(1. - dot(p, p), EPS));
}

float edgeMask(in vec2 uv, float band, float rate) {
    vec2 p = abs(fract(uv) - vec2(0.5)) * 2.;
    float e = max(1. - max(p.x, p.y), EPS);
    return e;

    // test smooth only edge
    // float s = smoothstep(1. - band, 1., e) * (1. - smoothstep(1., 1. + band, e));
    // float s = smoothstep(1. - band, 1., e) * (1. - smoothstep(1., 1. + band, e));
    // s *= rate;
    // return 1. - e;
    // return s;
}

void main() {
    vec2 uv = vUv;
    vec4 textureColor = texture(uSrcTexture, vUv);

    float centerCircularScale = 2.;
    float edgeCircularScale = 2.;
    float topBottomCircularScale = 4.;
    float leftRightCircularScale = 4.;
  
    float maskNum = 9.;
    float baseMaskRate = 1. / maskNum;
    // float centerCircularMaskRate = baseMaskRate;
    // float edgeCircularMaskRate = baseMaskRate;
    // float topBottomCircularMaskRate = baseMaskRate;
    // float leftRightCircularMaskRate = baseMaskRate;
    float centerCircularMaskRate = 1.;
    float edgeCircularMaskRate = 1.;
    float topBottomCircularMaskRate = .25;
    float leftRightCircularMaskRate = .25;
    
    float centerMask = circularMask(uv, centerCircularScale) * centerCircularMaskRate;
    float leftTopEdgeCircularMask = circularMask(uv + vec2(.5, -.5), edgeCircularScale) * edgeCircularMaskRate;
    float leftBottomEdgeCircularMask = circularMask(uv + vec2(.5, .5), edgeCircularScale) * edgeCircularMaskRate;
    float rightTopEdgeCircularMask = circularMask(uv + vec2(-.5, -.5), edgeCircularScale) * edgeCircularMaskRate;
    float rightBottomEdgeCircularMask = circularMask(uv + vec2(-.5, .5), edgeCircularScale) * edgeCircularMaskRate;
    float topCircularMask = circularMask(uv + vec2(0., -.5), topBottomCircularScale) * topBottomCircularMaskRate;
    float bottomCircularMask = circularMask(uv + vec2(0., .5), topBottomCircularScale) * topBottomCircularMaskRate;
    float leftCircularMask = circularMask(uv + vec2(.5, 0.), leftRightCircularScale) * leftRightCircularMaskRate;
    float rightCircularMask = circularMask(uv + vec2(-.5, 0.), leftRightCircularScale) * leftRightCircularMaskRate;

    float edgeMask = edgeMask(uv, .1, .1);

    float accCenterMask = centerMask;

    float accEdgeMask =
        mix(
            edgeMask,
            leftTopEdgeCircularMask
            + leftBottomEdgeCircularMask
            + rightTopEdgeCircularMask
            + rightBottomEdgeCircularMask,
            uEdgeMaskMix
        );
    
    float accTopBottomMask =
        mix(
            edgeMask,
            topCircularMask + bottomCircularMask,
            uEdgeMaskMix
        );
    
    float accLeftRightMask =
        mix(
            edgeMask,
            leftCircularMask + rightCircularMask,
            uEdgeMaskMix
        );

    float accTotalMask =
        accCenterMask
        + accEdgeMask
        // + accTopBottomMask
        // + accLeftRightMask;
    ;

    vec4 centerColor = texture(uSrcTexture, uv);
    vec4 edgeColor = texture(uSrcTexture, uv + vec2(.5));
    vec4 topBottomColor = texture(uSrcTexture, uv + vec2(0., .5));
    vec4 leftRightColor = texture(uSrcTexture, uv + vec2(.5, 0.));

    vec4 result =
        centerColor * accCenterMask / accTotalMask
        + edgeColor * accEdgeMask / accTotalMask
        + topBottomColor * accTopBottomMask / accTotalMask
        + leftRightColor * accLeftRightMask / accTotalMask;
        // centerColor * accCenterMask
        // + edgeColor * accEdgeMask
        // + topBottomColor * accTopBottomMask
        // + leftRightColor * accLeftRightMask;

    // outColor = vec4(0., 0., 0., 1.);
    outColor = vec4(result.xyz, 1.);
    
    float r = accCenterMask * centerColor.r / accTotalMask + accEdgeMask * edgeColor.r / accTotalMask;
    float g = accCenterMask * centerColor.g / accTotalMask + accEdgeMask * edgeColor.g / accTotalMask;
    float b = accCenterMask * centerColor.b / accTotalMask + accEdgeMask * edgeColor.b / accTotalMask;
    
    outColor = mix(
        centerColor,
        vec4(r, g, b, 1.),
        step(.5, uTilingEnabled)
    );
    
    vec3 c = clamp((outColor.xyz - vec3(uRemapMin)) / (uRemapMax - uRemapMin), 0., 1.);

    outColor.xyz = c;
  
    // for debug
    // outColor =
    //     centerColor * accCenterMask
    //     + edgeColor * accEdgeMask
    //     + leftRightColor * accLeftRightMask
    //     + topBottomColor * accTopBottomMask
    // ;
}
