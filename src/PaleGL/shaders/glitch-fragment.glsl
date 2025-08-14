in vec2 vUv;

out vec4 outColor;

#include <common>
#include <lighting>
#include <ub>
#include <rand>

uniform sampler2D uSrcTexture;
uniform float uTargetWidth;
uniform float uTargetHeight;
uniform float uBlendRate;

uniform float uVignetteRadius;
uniform float uVignettePower;

// ref: https://www.sawcegames.com/en/post/nier-automata-glitch

float blockNoise(vec2 st, vec2 scale, vec2 offset) {
    st *= scale;
    vec2 ipos = floor(st);
    // vec2 fpos = fract(st);
    float r = rand(ipos + offset);
    return r;
}

void main() {
    vec2 uv = vUv;

    outColor = vec4(0.);
    vec4 color = texture(uSrcTexture, uv);

    float random1 = rand(vec2(uTime, 0.));
    float random2 = rand(vec2(uTime, .1));
    float glitchMix = sin(uTime * 80.) * .5 + .5;
    float dmg = 1.8;
    float corruption = .02;
    float glitchAmount = .1;
    float desaturate = .02;

    vec4 srcCol = texture(uSrcTexture, uv);

    // block glitch

    float glitchStep = mix(4., 32., random1);
    float glitchUV = round(uv.x * glitchStep) / glitchStep;
    vec4 glitchCol = texture(uSrcTexture, vec2(glitchUV, uv.y));
    vec4 glitchFinal = mix(srcCol, glitchCol, glitchMix);

    // distortion glitch

    float chrNoise = blockNoise(uv, vec2(8.), vec2(random1, 0.));
    float chrNoise2 = blockNoise(uv, vec2(11.), vec2(random1, 1.));

    float chrOffset = step(.5 * (chrNoise + chrNoise2), .5);
    chrOffset = (2. * chrOffset + 1.) * .005 * dmg;

    vec4 chrColR = texture(uSrcTexture, vec2(uv.x + chrOffset, uv.y));
    vec4 chrColB = texture(uSrcTexture, vec2(uv.x - chrOffset, uv.y));

    vec4 chrCol2R = texture(uSrcTexture, vec2(uv.x + step(.5 * (chrNoise + chrNoise2), .2) * .005, uv.y));
    vec4 chrCol2B = texture(uSrcTexture, vec2(uv.x - step(.5 * (chrNoise + chrNoise2), .1) * .005, uv.y));

    vec4 finalScrCol = vec4(0.);
    finalScrCol.r = mix(chrCol2R.r, chrColR.r, dmg) - step(chrNoise2, .2);
    finalScrCol.g = srcCol.g + step(chrNoise, .2);
    finalScrCol.b = mix(chrCol2R.b, chrColR.b, dmg) - step(chrNoise2, .2);

    finalScrCol = vec4(chrColR.r, srcCol.g + step(chrNoise, .2) * corruption, chrColB.b, 1.);

    float aberration = pow(((length(uv * 2. - 1.)) - uTime * .1), .2);
    vec4 lensBlur = texture(uSrcTexture, uv - (uv * 2. - 1.) * aberration * .0125 * 2.);
    vec4 lensBlur2 = texture(uSrcTexture, uv - (uv * 2. - 1.) * aberration * .0125 * 2.);
    vec4 lensBlur3 = texture(uSrcTexture, uv - (uv * 2. - 1.) * aberration * .025);
    float lensAbrR = dot((lensBlur3 - srcCol).rgb, vec3(.3, .59, .11));

    vec4 compositeCol = mix(finalScrCol, glitchFinal, glitchAmount);
    vec4 destCol = compositeCol;

    vec4 desaturatedCol = vec4(dot((srcCol + lensBlur + lensBlur2).rgb / 3., vec3(.3, .59, .11)));
    desaturatedCol += vec4(lensAbrR * 2., 0., 0., 0.);
    destCol = mix(compositeCol, vec4(desaturatedCol.xyz, 1.), desaturate);

    // rect mask
    vec2 centerUv = vUv * 2. - 1.;
    centerUv.x *= uAspect;
    vec2 rectSize = vec2(.5, .5);
    vec2 rectArea = step(-rectSize, centerUv) * (1. - step(rectSize, centerUv));
    float rectmask = rectArea.x * rectArea.y;

    outColor = mix(srcCol, destCol, uBlendRate * 1.);
}
