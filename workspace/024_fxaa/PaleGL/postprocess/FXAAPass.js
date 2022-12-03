import {PostProcessPass} from "./PostProcessPass.js";
import {UniformTypes} from "../constants.js";

// ref:
// http://blog.simonrodriguez.fr/articles/2016/07/implementing_fxaa.html
// https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
// https://catlikecoding.com/unity/tutorials/advanced-rendering/fxaa/
// http://iryoku.com/aacourse/downloads/09-FXAA-3.11-in-15-Slides.pdf

export class FXAAPass extends PostProcessPass {
    get gpu() {
        return this._gpu;
    }
    constructor({ gpu }) {
        const edgeStepsArray = [1., 1.5, 2., 2., 2., 2., 2., 2., 2., 4.];
        const edgeStepCount = 10;
        const edgeGuess = 8.;

        const fragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSceneTexture;
uniform float uTargetWidth;
uniform float uTargetHeight;
        
float rgbToLuma(vec3 rgb) {
    // return dot(rgb, vec3(.2126729, .7151522, .0721750));
    return dot(rgb, vec3(.299, .587, .114));
}

// vec4 sampleTexture(sampler2D tex, ivec2 coord) {
//     return texelFetch(tex, coord, 0);
// }

// 1: use texel fetch function
// 
// vec4 sampleTexture(sampler2D tex, ivec2 coord) {
//     return texelFetch(tex, coord, 0);
// }
// 
// vec4 sampleTextureOffset(sampler2D tex, ivec2 coord, int offsetX, int offsetY) {
//     return sampleTexture(tex, coord + ivec2(offsetX, offsetY));
// }

// 2: use texture function

vec4 sampleTexture(sampler2D tex, vec2 coord) {
    return texture(tex, coord);
    // return texture(tex, coord, 0);
    // return tex2Dlod(tex, coord, 0);
    // return vec4(1.);
}

vec4 sampleTextureOffset(sampler2D tex, vec2 coord, float offsetX, float offsetY) {
    return sampleTexture(tex, coord + vec2(offsetX, offsetY));
    // return vec4(1.);
}


void main() {
    float fxaaContrastThreshold = .0312;
    float fxaaRelativeThreshold = .063;
    float fxaaSubpixelBlending = 1.;
    
    vec2 texelSize = vec2(1. / uTargetWidth, 1. / uTargetHeight);
    // ivec2 texelSize = ivec2(1, 1);
    // vec2 f_texelSize = vec2(1., 1.);
   
    // (0, renderer height) ---------- (renderer width, renderer height)
    //          |                                     |
    //          |                                     |
    //        (0, 0) ----------------------- (renderer width, 0)
    // ivec2 uv = ivec2(gl_FragCoord.xy);
    // vec2 fuv = gl_FragCoord.xy;
    vec2 uv = vUv;
    
    // ------------------------------------------------------------------
    // local contrast check
    // ------------------------------------------------------------------
   
    // 隣接ピクセルの色を取得
    vec3 rgbTop = sampleTextureOffset(uSceneTexture, uv, 0., texelSize.y).xyz;
    vec3 rgbLeft = sampleTextureOffset(uSceneTexture, uv, -texelSize.x, 0.).xyz;
    vec3 rgbCenter = sampleTextureOffset(uSceneTexture, uv, 0., 0.).xyz;
    vec3 rgbRight = sampleTextureOffset(uSceneTexture, uv, texelSize.x, 0.).xyz;
    vec3 rgbBottom = sampleTextureOffset(uSceneTexture, uv, 0., -texelSize.y).xyz;

    // 隣接ピクセルの輝度を取得
    float lumaTop = rgbToLuma(rgbTop);
    float lumaLeft = rgbToLuma(rgbLeft);
    float lumaCenter = rgbToLuma(rgbCenter);
    float lumaRight = rgbToLuma(rgbRight);
    float lumaBottom = rgbToLuma(rgbBottom);

    // 上下左右のピクセルからコントラストを計算
    float lumaHighest = max(lumaCenter, max(max(lumaTop, lumaLeft), max(lumaBottom, lumaRight)));
    float lumaLowest = min(lumaCenter, min(min(lumaTop, lumaLeft), min(lumaBottom, lumaRight)));
    float lumaContrast = lumaHighest - lumaLowest;
    
    // should skip pixel 
    if(lumaContrast < max(fxaaContrastThreshold, lumaHighest * fxaaRelativeThreshold)) {
        outColor = vec4(rgbCenter, 1.);
        // outColor = vec4(0., 0., 0., 1.);
        return;
    }
    
    // 角のピクセルの色を取得
    vec3 rgbTopLeft = sampleTextureOffset(uSceneTexture, uv, -texelSize.x, texelSize.y).xyz;
    vec3 rgbTopRight = sampleTextureOffset(uSceneTexture, uv, texelSize.x, texelSize.y).xyz;
    vec3 rgbBottomLeft = sampleTextureOffset(uSceneTexture, uv, -texelSize.x, -texelSize.y).xyz;
    vec3 rgbBottomRight = sampleTextureOffset(uSceneTexture, uv, texelSize.x, -texelSize.y).xyz;

    // 角のピクセルの輝度を取得
    float lumaTopLeft = rgbToLuma(rgbTopLeft);
    float lumaTopRight = rgbToLuma(rgbTopRight);
    float lumaBottomLeft = rgbToLuma(rgbBottomLeft);
    float lumaBottomRight = rgbToLuma(rgbBottomRight);
    
    // エッジ判定用のカーネル
    // 1 - 2 - 1
    // 2 - p - 2
    // 1 - 2 - 1
    float determineEdgeFilter = 2. * (lumaTop + lumaRight + lumaBottom + lumaLeft);
    determineEdgeFilter += lumaTopLeft + lumaTopRight + lumaBottomLeft + lumaBottomRight;
    determineEdgeFilter *= 1. / 12.; // to low-pass filter
    determineEdgeFilter = abs(determineEdgeFilter - lumaCenter); // to high-pass filter
    determineEdgeFilter = clamp(determineEdgeFilter / lumaContrast, 0., 1.);  // to normalized filter
    float blendFactor = smoothstep(0., 1., determineEdgeFilter); // linear to smoothstep
    blendFactor = blendFactor * blendFactor * fxaaSubpixelBlending; // smoothstep to squared smoothstep
 
    // エッジの方向検出
    float horizontal =
        abs(lumaTop + lumaBottom - 2. * lumaCenter) * 2. +
        abs(lumaTopRight + lumaBottomRight - 2. * lumaRight) + 
        abs(lumaTopLeft + lumaBottomLeft - 2. * lumaLeft);
    float vertical = 
        abs(lumaRight + lumaRight - 2. * lumaCenter) * 2. +
        abs(lumaTopRight + lumaTopLeft - 2. * lumaTop) +
        abs(lumaBottomRight + lumaBottomLeft - 2. * lumaBottom);
    bool isHorizontal = horizontal >= vertical;
    
    float positiveLuma = isHorizontal ? lumaTop : lumaRight;
    float negativeLuma = isHorizontal ? lumaBottom : lumaLeft;
    float positiveGradient = abs(positiveLuma - lumaCenter);
    float negativeGradient = abs(negativeLuma - lumaCenter);
  
    // 
    // edge luminance 
    // 
   
    float pixelStep = isHorizontal ? texelSize.x : texelSize.y;
    float oppositeLuma;
    float gradient;

    if(positiveGradient < negativeGradient) {
        pixelStep = -pixelStep;
        oppositeLuma = negativeLuma;
        gradient = negativeGradient;
    } else {
        oppositeLuma = positiveLuma;
        gradient = positiveGradient;
    }
   
    vec2 uvEdge = uv; // copy
    vec2 edgeStep = vec2(0.);

    if(isHorizontal) {
        uvEdge.y += float(pixelStep) * .5; // offset half pixel
        edgeStep = vec2(float(texelSize.x), 0.);
        // uv.y += pixelStep * blendFactor;
    } else {
        uvEdge.x += float(pixelStep) * .5; // offset half pixel
        edgeStep = vec2(0., float(texelSize.y));
        // uv.x += pixelStep * blendFactor;
    }

    float edgeLuma = (lumaCenter + oppositeLuma) * .5;
    float gradientThreshold = gradient * .25;

    vec2 puv = uvEdge + edgeStep * vec2(${edgeStepsArray[0]});
    float pLumaDelta = rgbToLuma(sampleTexture(uSceneTexture, puv).xyz) - edgeLuma;
    bool pAtEnd = abs(pLumaDelta) >= gradientThreshold;

    // for(int i = 0; i < ${edgeStepCount} && !pAtEnd; i++) {
${(new Array(edgeStepCount - 1).fill(0).map(i => {
    return `
if(!pAtEnd) {
    puv += edgeStep * vec2(${edgeStepsArray[i + 1]});
    pLumaDelta = rgbToLuma(sampleTexture(uSceneTexture, puv).xyz) - edgeLuma;
    pAtEnd = abs(pLumaDelta) >= gradientThreshold;   
}
`;
})).join("\n")}
    // }
    if(!pAtEnd) {
        puv += edgeStep * vec2(${edgeGuess});
    }
   
    // check pat end 
    // outColor = vec4(pAtEnd ? vec3(1., 0., 0.) : vec3(0., 1., 0.), 1.);

    vec2 nuv = uvEdge - edgeStep * vec2(${edgeStepsArray[0]});
    float nLumaDelta = rgbToLuma(sampleTexture(uSceneTexture, nuv).xyz) - edgeLuma;
    bool nAtEnd = abs(nLumaDelta) >= gradientThreshold;

    // for(int i = 0; i < ${edgeStepCount} && !nAtEnd; i++) {
${(new Array(edgeStepCount - 1).fill(0).map(i => {
    return `   
if(!nAtEnd) {
    nuv -= edgeStep * vec2(${edgeStepsArray[i + 1]});
    nLumaDelta = rgbToLuma(sampleTexture(uSceneTexture, nuv).xyz) - edgeLuma;
    nAtEnd = abs(nLumaDelta) >= gradientThreshold;
}
`;
        })).join("\n")}
    // }
    if(!nAtEnd) {
        nuv -= edgeStep * vec2(${edgeGuess});
    }
   
    // check nat end 
    // outColor = vec4(nAtEnd ? vec3(1., 0., 0.) : vec3(0., 1., 0.), 1.);
    
    float pDistance, nDistance;
    if(isHorizontal) {
        pDistance = puv.x - uv.x;
        nDistance = uv.x - nuv.x;
    } else {
        pDistance = puv.y - uv.y;
        nDistance = uv.y - nuv.y;
    }
    
    float shortestDistance;
    bool deltaSign;
    if(pDistance <= nDistance) {
        shortestDistance = pDistance;
        deltaSign = pLumaDelta >= 0.;
    } else {
        shortestDistance = nDistance;
        deltaSign = nLumaDelta >= 0.;
    }
    
    if(deltaSign == (lumaCenter - edgeLuma >= 0.)) {
        shortestDistance = 0.;
        // return;
    } else {
        // pDistance = pDistance * 10.;
        shortestDistance = shortestDistance * 10.;
    }
    
    float edgeBlend = .5 - shortestDistance / (pDistance + nDistance);
    
    float finalBlend = max(blendFactor, edgeBlend);
    
    if(isHorizontal) {
        uv.y += pixelStep * finalBlend;
    } else {
        uv.x += pixelStep * finalBlend;
    }

    // outColor = vec4(vec3(edgeBlend), 1.);
    // outColor = vec4(vec3(finalBlend), 1.);
    // outColor = vec4(vec3(pixelStep > .0011 ? 1. : 0.), 1.);
    outColor = sampleTexture(uSceneTexture, uv);
    // outColor = vec4(vec3(finalBlend > 1. ? 1. : 0.), 1.);
}
`;

        super({
            gpu,
            fragmentShader,
            uniforms: {
                uTargetWidth: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uTargetHeight: {
                    type: UniformTypes.Float,
                    value: 1,
                }
            }
        });
        this._gpu = gpu;
    }
    
    setSize(width, height) {
        super.setSize(width, height);
        this.mesh.material.uniforms.uTargetWidth.value = width;
        this.mesh.material.uniforms.uTargetHeight.value = height;
    }
    
}