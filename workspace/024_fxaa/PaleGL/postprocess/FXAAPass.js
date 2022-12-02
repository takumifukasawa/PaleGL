﻿import {PostProcessPass} from "./PostProcessPass.js";
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

vec4 sampleTexture(sampler2D tex, ivec2 coord) {
    return texelFetch(tex, coord, 0);
}

vec4 sampleTextureOffset(sampler2D tex, ivec2 coord, int offsetX, int offsetY) {
    return sampleTexture(tex, coord + ivec2(offsetX, offsetY));
}

void main() {
    float fxaaContrastThreshold = .0312;
    float fxaaRelativeThreshold = .063;
    float fxaaSubpixelBlending = 1.;
    
    // vec2 texelSize = vec2(1. / uTargetWidth, 1. / uTargetHeight);
    ivec2 texelSize = ivec2(1, 1);
    vec2 f_texelSize = vec2(1., 1.);
   
    // (0, renderer height) ---------- (renderer width, renderer height)
    //          |                                     |
    //          |                                     |
    //        (0, 0) ----------------------- (renderer width, 0)
    ivec2 uv = ivec2(gl_FragCoord.xy);
    vec2 fuv = gl_FragCoord.xy;
    
    // ------------------------------------------------------------------
    // local contrast check
    // ------------------------------------------------------------------
   
    // 隣接ピクセルの色を取得
    vec3 rgbTop = sampleTextureOffset(uSceneTexture, uv, 0, texelSize.y).xyz;
    vec3 rgbLeft = sampleTextureOffset(uSceneTexture, uv, -texelSize.x, 0).xyz;
    vec3 rgbCenter = sampleTextureOffset(uSceneTexture, uv, 0, 0).xyz;
    vec3 rgbRight = sampleTextureOffset(uSceneTexture, uv, texelSize.x, 0).xyz;
    vec3 rgbBottom = sampleTextureOffset(uSceneTexture, uv, 0, -texelSize.y).xyz;

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
    vec3 rgbBottomLeft = sampleTextureOffset(uSceneTexture, uv, -1, -1).xyz;
    vec3 rgbBottomRight = sampleTextureOffset(uSceneTexture, uv, 1, -1).xyz;

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
   
    // texelFetchを使うので隣接ピクセルへのオフセットの絶対値は1
    // int pixelStep = positiveGradient >= negativeGradient ? 1 : -1;
    // int pixelStep = isHorizontal ? 1 : -1;
    // TODO: fix texel size for uv float coord
    int pixelStep = 1;
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
   
    vec2 uvEdge = fuv;
    vec2 edgeStep = vec2(0.);

    if(isHorizontal) {
        uvEdge.y += float(pixelStep) * .5; // offset half pixel
        edgeStep = vec2(float(texelSize.x), 0.);
        // uv.y += pixelStep * int(blendFactor);
    } else {
        uvEdge.x += float(pixelStep) * .5; // offset half pixel
        edgeStep = vec2(0., float(texelSize.y));
        // uv.x += pixelStep * int(blendFactor);
    }

    float edgeLuma = (lumaCenter + oppositeLuma) * .5;
    float gradientThreshold = gradient * .25;

    vec2 puv = uvEdge + edgeStep;
    float pLumaDelta = rgbToLuma(sampleTexture(uSceneTexture, ivec2(puv)).xyz) - edgeLuma;
    bool pAtEnd = abs(pLumaDelta) >= gradientThreshold;
    for(int i = 0; i < 9 && !pAtEnd; i++) {
        puv += edgeStep;
        pLumaDelta = rgbToLuma(sampleTexture(uSceneTexture, ivec2(puv)).xyz) - edgeLuma;
        pAtEnd = abs(pLumaDelta) >= gradientThreshold;
    }
   
    // check pat end 
    // outColor = vec4(pAtEnd ? vec3(1., 0., 0.) : vec3(0., 1., 0.), 1.);

    vec2 nuv = uvEdge - edgeStep;
    float nLumaDelta = rgbToLuma(sampleTexture(uSceneTexture, ivec2(nuv)).xyz) - edgeLuma;
    bool nAtEnd = abs(nLumaDelta) >= gradientThreshold;
    for(int i = 0; i < 9 && !nAtEnd; i++) {
        nuv += edgeStep;
        nLumaDelta = rgbToLuma(sampleTexture(uSceneTexture, ivec2(nuv)).xyz) - edgeLuma;
        nAtEnd = abs(nLumaDelta) >= gradientThreshold;
    }
   
    // check nat end 
    // outColor = vec4(nAtEnd ? vec3(1., 0., 0.) : vec3(0., 1., 0.), 1.);
    
    float pDistance, nDistance;
    if(isHorizontal) {
        pDistance = puv.x - fuv.x;
        nDistance = fuv.x - nuv.x;
    } else {
        pDistance = puv.y - fuv.y;
        nDistance = fuv.y - nuv.y;
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
        uv.y += pixelStep * int(finalBlend);
    } else {
        uv.x += pixelStep * int(finalBlend);
    }

    // outColor = vec4(vec3(shortestDistance), 1.);
    // outColor = vec4(vec3(shortestDistance), 1.);
    // outColor = vec4(vec3(finalBlend), 1.);
    
    outColor = sampleTexture(uSceneTexture, uv);
    // outColor = vec4(vec3(finalBlend), 1.);

//     return;
//     
//     outColor = vec4(pixelStep < 0 ? vec3(1., 0., 0.) : vec3(1., 1., 1.), 1.);
//     // outColor = vec4(isHorizontal ? vec3(1., 0., 0.) : vec3(1., 1., 1.), 1.);
//     outColor = sampleTexture(uSceneTexture, uv);
//     
//     return;
//    
//     if(isHorizontal) {
//         uvEdge.y += float(pixelStep) * 0.5;
//         edgeStep = vec2(f_texelSize.x, 0.);
//     } else {
//         uvEdge.x += float(pixelStep) * 0.5;
//         edgeStep = vec2(0., f_texelSize.y);
//     }
//     
//     // float edgeLuma = lumaCenter + 
//     
//     // outColor = vec4(vec3(lumaContrast), 1.);
//     // outColor = vec4(vec3(determineEdgeFilter), 1.);
//     // outColor = vec4(vec3(blendFactor), 1.);
//     // outColor = vec4(vec3(horizontal), 1.);
//     // outColor = vec4(vec3(vertical), 1.);
//     // outColor = vec4(isHorizontal ? vec3(1., 0., 0.) : vec3(0., 1., 0.), 1.);
//     
//     // check edge: red ... positive, green ... negative
//     outColor = vec4(float(pixelStep) < 0. ? vec3(1., 0., 0.) : vec3(0., 1., 0.), 1.);
//     
//     // outColor = vec4(float(pixelStep * int(blendFactor)) < 0. ? vec3(1., 0., 0.) : vec3(0., 1., 0.), 1.);
//     
//     outColor = sampleTexture(uSceneTexture, uv);
    
    
//     
//     // ------------------------------------------------------------------
//     // gradient, edge direction
//     // ------------------------------------------------------------------
//    
//     // float lumaL = (lumaTop + lumaLeft + lumaEast + lumaBottom) * .25;
//     // float rangeL = abs(lumaL - lumaCenter);
//     // float blendL = max(0., (rangeL / range) - FXAA_SUBPIX_TRIM) * FXAA_SUBPIX_TRIM_SCALE;
//     // blendL = min(FXAA_SUBPIX_CAP, blendL);
//     // 
//     // float rgbL = rgbTop + rgbLeft + rgbCenter + rgbEast + rgbBottom;
//     // vec3 rgbTopLeft = texture(uSceneTexture, vUv + vec2(-texelSize.x, texelSize.y)).xyz;
//     // vec3 rgbTopRight = texture(uSceneTexture, vUv + vec2(texelSize.x, texelSize.y)).xyz;
//     // vec3 rgbBottomLeft = texture(uSceneTexture, vUv + vec2(-texelSize.x, -texelSize.y)).xyz;
//     // vec3 rgbBottomRight = texture(uSceneTexture, vUv + vec2(texelSize.x, texelSize.y)).xyz;
//     // rgbL += (rgbTopLeft + rgbTopRight + rgbBottomLeft + rgbBottomRight);
//     // rgbL *= (1. / 9.);
//     
//     vec3 rgbTopLeft = texture(uSceneTexture, vUv + vec2(-texelSize.x, texelSize.y)).xyz;
//     vec3 rgbTopRight = texture(uSceneTexture, vUv + vec2(texelSize.x, texelSize.y)).xyz;
//     vec3 rgbBottomLeft = texture(uSceneTexture, vUv + vec2(-texelSize.x, -texelSize.y)).xyz;
//     vec3 rgbBottomRight = texture(uSceneTexture, vUv + vec2(texelSize.x, texelSize.y)).xyz;
//     
//     float lumaTopLeft = rgbToLuma(rgbTopLeft);
//     float lumaTopRight = rgbToLuma(rgbTopRight);
//     float lumaBottomLeft = rgbToLuma(rgbBottomLeft);
//     float lumaBottomRight = rgbToLuma(rgbBottomRight);
//     
//     float lumaBottomTop = lumaBottom + lumaTop;
//     float lumaLeftRight = lumaLeft + lumaRight;
//  
//     float lumaLeftCorners = lumaBottomLeft + lumaTopLeft;
//     float lumaBottomCorners = lumaBottomLeft + lumaBottomRight;
//     float lumaRightCorners = lumaBottomRight + lumaTopRight;
//     float lumaTopCorners = lumaTopRight + lumaTopLeft;
//     
//     float edgeHorizontal = abs(-2. * lumaLeft + lumaLeftCorners) + abs(-2. * lumaCenter + lumaBottomTop) * 2.;
//     float edgeVertical = abs(-2. * lumaTop + lumaTopCorners) + abs(-2. * lumaCenter + lumaLeftRight) * 2.;
//     
//     float isHorizontal = (edgeHorizontal >= edgeVertical) ? 1. : 0.;
//     
//     outColor = vec4(vec3(isHorizontal), 1.);
//     // outColor = vec4(vec3(edgeVertical), 1.);
//     
//     // ------------------------------------------------------------------
//     // result
//     // ------------------------------------------------------------------
//  
//     // vec4 textureColor = texture(uSceneTexture, vUv);
//     // outColor = vec4(vec3(lumaM), 1.);
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