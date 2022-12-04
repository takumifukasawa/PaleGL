import {PostProcessPass} from "./PostProcessPass.js";
import {UniformTypes} from "../constants.js";

// ref:
// https://catlikecoding.com/unity/tutorials/advanced-rendering/fxaa/
// http://blog.simonrodriguez.fr/articles/2016/07/implementing_fxaa.html
// https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
// http://iryoku.com/aacourse/downloads/09-FXAA-3.11-in-15-Slides.pdf

export class FXAAPass extends PostProcessPass {
    get gpu() {
        return this._gpu;
    }
    constructor({ gpu }) {
        // # high quality
        const edgeStepsArray = [1., 1.5, 2., 2., 2., 2., 2., 2., 2., 4.];
        const edgeStepCount = 10;
        const edgeGuess = 8.;
        // # low quality
        // const edgeStepsArray = [1, 1.5, 2, 4];
        // const edgeStepCount = 4;
        // const edgeGuess = 12.;

        const fragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSceneTexture;
uniform float uTargetWidth;
uniform float uTargetHeight;

uniform float uContrastThreshold;
uniform float uRelativeThreshold;
uniform float uSubpixelBlending;
       
struct EdgeData {
    bool isHorizontal;
    float pixelStep;
    float oppositeLuma;
    float gradient;
};

struct LuminanceData {
    float center;
    float top;
    float right;
    float bottom;
    float left;
    
    float topLeft;
    float topRight;
    float bottomLeft;
    float bottomRight;
    
    float highest;
    float lowest;
    float contrast;
};

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

float rgbToLuma(vec3 rgb) {
    return dot(rgb, vec3(.299, .587, .114));
}

vec4 sampleTexture(sampler2D tex, vec2 coord) {
    return texture(tex, coord);
}

vec4 sampleTextureOffset(sampler2D tex, vec2 coord, float offsetX, float offsetY) {
    return sampleTexture(tex, coord + vec2(offsetX, offsetY));
}

LuminanceData sampleLuminanceNeighborhood(vec2 uv, vec2 texelSize) {
    // vec2 texelSize = vec2(1. / uTargetWidth, 1. / uTargetHeight);
    
    LuminanceData l;

    // 隣接ピクセルの色を取得
    vec3 rgbTop = sampleTextureOffset(uSceneTexture, uv, 0., texelSize.y).xyz;
    vec3 rgbRight = sampleTextureOffset(uSceneTexture, uv, texelSize.x, 0.).xyz;
    vec3 rgbBottom = sampleTextureOffset(uSceneTexture, uv, 0., -texelSize.y).xyz;
    vec3 rgbLeft = sampleTextureOffset(uSceneTexture, uv, -texelSize.x, 0.).xyz;
    vec3 rgbCenter = sampleTextureOffset(uSceneTexture, uv, 0., 0.).xyz;

    // 角のピクセルの色を取得
    vec3 rgbTopRight = sampleTextureOffset(uSceneTexture, uv, texelSize.x, texelSize.y).xyz;
    vec3 rgbTopLeft = sampleTextureOffset(uSceneTexture, uv, -texelSize.x, texelSize.y).xyz;
    vec3 rgbBottomRight = sampleTextureOffset(uSceneTexture, uv, texelSize.x, -texelSize.y).xyz;
    vec3 rgbBottomLeft = sampleTextureOffset(uSceneTexture, uv, -texelSize.x, -texelSize.y).xyz;

    // 隣接ピクセルの輝度を取得
    float lumaTop = rgbToLuma(rgbTop);
    float lumaLeft = rgbToLuma(rgbLeft);
    float lumaCenter = rgbToLuma(rgbCenter);
    float lumaRight = rgbToLuma(rgbRight);
    float lumaBottom = rgbToLuma(rgbBottom);

    // 角のピクセルの輝度を取得
    float lumaTopLeft = rgbToLuma(rgbTopLeft);
    float lumaTopRight = rgbToLuma(rgbTopRight);
    float lumaBottomLeft = rgbToLuma(rgbBottomLeft);
    float lumaBottomRight = rgbToLuma(rgbBottomRight);

    // 上下左右のピクセルからコントラストを計算
    float lumaHighest = max(lumaCenter, max(max(lumaTop, lumaLeft), max(lumaBottom, lumaRight)));
    float lumaLowest = min(lumaCenter, min(min(lumaTop, lumaLeft), min(lumaBottom, lumaRight)));
    float lumaContrast = lumaHighest - lumaLowest;
 
    l.top = lumaTop;
    l.left = lumaLeft;
    l.center = lumaCenter;
    l.right = lumaRight;
    l.bottom = lumaBottom;
    
    l.topLeft = lumaTopLeft;
    l.topRight = lumaTopRight;
    l.bottomLeft = lumaBottomLeft;
    l.bottomRight = lumaBottomRight;
    
    l.highest = lumaHighest;
    l.lowest = lumaLowest;
    l.contrast = lumaContrast;
    
    return l;
}

bool shouldSkipPixel(LuminanceData l) {
    return l.contrast < max(uContrastThreshold, l.highest * uRelativeThreshold);
}

float determinePixelBlendFactor(LuminanceData l) {
    // エッジ判定用のカーネル
    // 1 - 2 - 1
    // 2 - p - 2
    // 1 - 2 - 1
    float determineEdgeFilter = 2. * (l.top + l.right + l.bottom + l.left);
    determineEdgeFilter += l.topLeft + l.topRight + l.bottomLeft + l.bottomRight;
    determineEdgeFilter *= 1. / 12.; // to low-pass filter
    determineEdgeFilter = abs(determineEdgeFilter - l.center); // to high-pass filter
    determineEdgeFilter = clamp(determineEdgeFilter / l.contrast, 0., 1.);  // to normalized filter
    float pixelBlendFactor = smoothstep(0., 1., determineEdgeFilter); // linear to smoothstep
    pixelBlendFactor = pixelBlendFactor * pixelBlendFactor * uSubpixelBlending; // smoothstep to squared smoothstep
    return pixelBlendFactor;
}

EdgeData determineEdge(LuminanceData l, vec2 texelSize) {
    EdgeData e;
    
    // エッジの方向検出
    float horizontal =
        abs(l.top + l.bottom - 2. * l.center) * 2. +
        abs(l.topRight + l.bottomRight - 2. * l.right) + 
        abs(l.topLeft + l.bottomLeft - 2. * l.left);
    float vertical = 
        abs(l.right + l.left - 2. * l.center) * 2. +
        abs(l.topRight + l.topLeft - 2. * l.top) +
        abs(l.bottomRight + l.bottomLeft - 2. * l.bottom);
    e.isHorizontal = horizontal >= vertical;
    
    float positiveLuma = e.isHorizontal ? l.top : l.right;
    float negativeLuma = e.isHorizontal ? l.bottom : l.left;
    float positiveGradient = abs(positiveLuma - l.center);
    float negativeGradient = abs(negativeLuma - l.center);
  
    e.pixelStep = e.isHorizontal ? texelSize.y : texelSize.x;

    if(positiveGradient < negativeGradient) {
        e.pixelStep = -e.pixelStep;
        e.oppositeLuma = negativeLuma;
        e.gradient = negativeGradient;
    } else {
        e.oppositeLuma = positiveLuma;
        e.gradient = positiveGradient;
    }
    
    return e;
}

float determineEdgeBlendFactor(LuminanceData l, EdgeData e, vec2 uv, vec2 texelSize) {
    vec2 uvEdge = uv; // copy
    vec2 edgeStep = vec2(0.);

    if(e.isHorizontal) {
        uvEdge.y += e.pixelStep * .5; // offset half pixel
        edgeStep = vec2(texelSize.x, 0.);
    } else {
        uvEdge.x += e.pixelStep * .5; // offset half pixel
        edgeStep = vec2(0., texelSize.y);
    }

    float edgeLuma = (l.center + e.oppositeLuma) * .5;
    float gradientThreshold = e.gradient * .25;

    vec2 puv = uvEdge + edgeStep * vec2(${edgeStepsArray[0]});
    float pLumaDelta = rgbToLuma(sampleTexture(uSceneTexture, puv).xyz) - edgeLuma;
    bool pAtEnd = abs(pLumaDelta) >= gradientThreshold;

    // for(int i = 0; i < ${edgeStepCount} && !pAtEnd; i++) {
${(new Array(edgeStepCount - 1).fill(0).map((_, i) => {
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
   
    vec2 nuv = uvEdge - edgeStep * vec2(${edgeStepsArray[0]});
    float nLumaDelta = rgbToLuma(sampleTexture(uSceneTexture, nuv).xyz) - edgeLuma;
    bool nAtEnd = abs(nLumaDelta) >= gradientThreshold;

    // for(int i = 0; i < ${edgeStepCount} && !nAtEnd; i++) {
${(new Array(edgeStepCount - 1).fill(0).map((_, i) => {
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
   
    float pDistance, nDistance;
    if(e.isHorizontal) {
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
   
   // return edgeLuma; 
    // return edgeLuma > 0. ? 1. : 0.;
    
    float edgeBlendFactor;
    
    if(deltaSign == (l.center - edgeLuma >= 0.)) {
        edgeBlendFactor = 0.;
    } else {
        edgeBlendFactor = .5 - shortestDistance / (pDistance + nDistance);
    }
    
    return edgeBlendFactor;
}

void main() {
    vec2 uv = vUv;
    
    vec2 texelSize = vec2(1. / uTargetWidth, 1. / uTargetHeight);
    
    LuminanceData l = sampleLuminanceNeighborhood(uv, texelSize);   

    if(shouldSkipPixel(l)) {
        // outColor = vec4(vec3(0.), 1.);
        outColor = sampleTexture(uSceneTexture, uv);
        return;
    }
    
    EdgeData e = determineEdge(l, texelSize);
    float pixelBlend = determinePixelBlendFactor(l); 
    float edgeBlend = determineEdgeBlendFactor(l, e, uv, texelSize);
    
    float finalBlend = max(pixelBlend, edgeBlend);
    
    if(e.isHorizontal) {
        uv.y += e.pixelStep * finalBlend;
    } else {
        uv.x += e.pixelStep * finalBlend;
    }

    // outColor = vec4(e.pixelStep > .01 ? vec3(1., 0., 0.) : vec3(0., 1., 0.), 1.);
    // outColor = vec4(vec3(pixelBlend), 1.);
    // outColor = vec4(vec3(edgeBlend), 1.);
    // outColor = vec4(vec3(e.gradient), 1.);
    // outColor = vec4(vec3(e.oppositeLuma), 1.);
    // outColor = vec4(vec3(finalBlend), 1.);
    // outColor = vec4(vec3(e.pixelStep), 1.);
    outColor = sampleTexture(uSceneTexture, uv);
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
                },
                uContrastThreshold: {
                    type: UniformTypes.Float,
                    value: 0.0312,
                },
                uRelativeThreshold: {
                    type: UniformTypes.Float,
                    value: 0.063,
                },
                uSubpixelBlending: {
                    type: UniformTypes.Float,
                    value: 0.75
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