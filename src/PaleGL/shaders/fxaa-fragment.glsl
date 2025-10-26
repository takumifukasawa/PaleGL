#define MAX_EDGE_STEP_COUNT 9

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform float uTargetWidth;
uniform float uTargetHeight;

uniform float uContrastThreshold;
uniform float uRelativeThreshold;
uniform float uSubpixelBlending;
       
struct sEdgeData {
    bool smIsHorizontal;
    float smPixelStep;
    float smOppositeLuma;
    float smGradient;
};

struct sLuminanceData {
    float smCenter;
    float smTop;
    float smRight;
    float smBottom;
    float smLeft;
    
    float smTopLeft;
    float smTopRight;
    float smBottomLeft;
    float smBottomRight;
    
    float smHighest;
    float smLowest;
    float smContrast;
};

// vec4 fSampleTexture(sampler2D tex, ivec2 coord) {
//     return texelFetch(tex, coord, 0);
// }

// 1: use texel fetch function
// 
// vec4 fSampleTexture(sampler2D tex, ivec2 coord) {
//     return texelFetch(tex, coord, 0);
// }
// 
// vec4 fSampleTextureOffset(sampler2D tex, ivec2 coord, int offsetX, int offsetY) {
//     return fSampleTexture(tex, coord + ivec2(offsetX, offsetY));
// }

// 2: use texture function

float fRgbToLuma(vec3 rgb) {
    return dot(rgb, vec3(.299, .587, .114));
}

vec4 fSampleTexture(sampler2D tex, vec2 coord) {
    return texture(tex, coord);
}

vec4 fSampleTextureOffset(sampler2D tex, vec2 coord, float offsetX, float offsetY) {
    return fSampleTexture(tex, coord + vec2(offsetX, offsetY));
}

sLuminanceData fsampleLuminanceNeighborhood(vec2 uv, vec2 texelSize) {
    sLuminanceData l;

    // get nearest side pixels
    vec3 rgbTop = fSampleTextureOffset(uSrcTexture, uv, 0., texelSize.y).xyz;
    vec3 rgbRight = fSampleTextureOffset(uSrcTexture, uv, texelSize.x, 0.).xyz;
    vec3 rgbBottom = fSampleTextureOffset(uSrcTexture, uv, 0., -texelSize.y).xyz;
    vec3 rgbLeft = fSampleTextureOffset(uSrcTexture, uv, -texelSize.x, 0.).xyz;
    vec3 rgbCenter = fSampleTextureOffset(uSrcTexture, uv, 0., 0.).xyz;

    // get nearest corner pixels
    vec3 rgbTopRight = fSampleTextureOffset(uSrcTexture, uv, texelSize.x, texelSize.y).xyz;
    vec3 rgbTopLeft = fSampleTextureOffset(uSrcTexture, uv, -texelSize.x, texelSize.y).xyz;
    vec3 rgbBottomRight = fSampleTextureOffset(uSrcTexture, uv, texelSize.x, -texelSize.y).xyz;
    vec3 rgbBottomLeft = fSampleTextureOffset(uSrcTexture, uv, -texelSize.x, -texelSize.y).xyz;

    // get nearest side pixels luma
    float lumaTop = fRgbToLuma(rgbTop);
    float lumaLeft = fRgbToLuma(rgbLeft);
    float lumaCenter = fRgbToLuma(rgbCenter);
    float lumaRight = fRgbToLuma(rgbRight);
    float lumaBottom = fRgbToLuma(rgbBottom);

    // get nearest corner pixels luma
    float lumaTopLeft = fRgbToLuma(rgbTopLeft);
    float lumaTopRight = fRgbToLuma(rgbTopRight);
    float lumaBottomLeft = fRgbToLuma(rgbBottomLeft);
    float lumaBottomRight = fRgbToLuma(rgbBottomRight);

    // get nearest side pixels contrast
    float lumaHighest = max(lumaCenter, max(max(lumaTop, lumaLeft), max(lumaBottom, lumaRight)));
    float lumaLowest = min(lumaCenter, min(min(lumaTop, lumaLeft), min(lumaBottom, lumaRight)));
    float lumaContrast = lumaHighest - lumaLowest;
 
    l.smTop = lumaTop;
    l.smLeft = lumaLeft;
    l.smCenter = lumaCenter;
    l.smRight = lumaRight;
    l.smBottom = lumaBottom;
    
    l.smTopLeft = lumaTopLeft;
    l.smTopRight = lumaTopRight;
    l.smBottomLeft = lumaBottomLeft;
    l.smBottomRight = lumaBottomRight;
    
    l.smHighest = lumaHighest;
    l.smLowest = lumaLowest;
    l.smContrast = lumaContrast;
    
    return l;
}

bool fShouldSkipPixel(sLuminanceData l) {
    return l.smContrast < max(uContrastThreshold, l.smHighest * uRelativeThreshold);
}

float fDeterminePixelBlendFactor(sLuminanceData l) {
    // sub-pixel blend 用のカーネル
    // | 1 | 2 | 1 | 
    // | 2 | 0 | 2 |
    // | 1 | 2 | 1 |
 
    float determineEdgeFilter = 2. * (l.smTop + l.smRight + l.smBottom + l.smLeft);
    determineEdgeFilter += l.smTopLeft + l.smTopRight + l.smBottomLeft + l.smBottomRight;
    
    // to low-pass filter
    determineEdgeFilter *= 1. / 12.; 
    
    // to high-pass filter
    determineEdgeFilter = abs(determineEdgeFilter - l.smCenter); 
    
    // to normalized filter
    determineEdgeFilter = clamp(determineEdgeFilter / l.smContrast, 0., 1.); 
    
    // linear to smoothstep
    float pixelBlendFactor = smoothstep(0., 1., determineEdgeFilter); 
    
    // smoothstep to squared smoothstep
    pixelBlendFactor = pixelBlendFactor * pixelBlendFactor;
    
    // multiply sub-pixel blend rate
    pixelBlendFactor *= uSubpixelBlending; 
    
    return pixelBlendFactor;
}

sEdgeData fdetermineEdge(sLuminanceData l, vec2 texelSize) {
    sEdgeData e;
    
    // # エッジの方向検出
   
    // ----------------------------------------------------------------------- 
    // ## 縦の勾配を計算
    // A, B, C を足す
    // Aはピクセルの上下なので重みを2倍に
    //
    // A:
    // | 0 |  2 | 0 |
    // | 0 | -4 | 0 |
    // | 0 |  2 | 0 |
    //
    // B:
    // | 1  | 0 | 0 |
    // | -2 | 0 | 0 |
    // | 1  | 0 | 0 |
    //
    // C:
    // | 0 | 0 | 1  |
    // | 0 | 0 | -2 |
    // | 0 | 0 | 1  |
    // ----------------------------------------------------------------------- 
    
    float horizontal =
        abs(l.smTop + l.smBottom - 2. * l.smCenter) * 2. +
        abs(l.smTopRight + l.smBottomRight - 2. * l.smRight) + 
        abs(l.smTopLeft + l.smBottomLeft - 2. * l.smLeft);
        
    // ----------------------------------------------------------------------- 
    // ## 横の勾配を計算
    // A, B, C を足す
    // Aはピクセルの左右なので重みを2倍に
    //
    // A:
    // | 0 |  0 | 0 |
    // | 2 | -4 | 2 |
    // | 0 |  0 | 0 |
    //
    // B:
    // | 1 | -2 | 1 |
    // | 0 | 0  | 0 |
    // | 0 | 0  | 0 |
    //
    // C:
    // | 0 | 0  | 0 |
    // | 0 | 0  | 0 |
    // | 1 | -2 | 1 |
    // ----------------------------------------------------------------------- 
        
    float vertical = 
        abs(l.smRight + l.smLeft - 2. * l.smCenter) * 2. +
        abs(l.smTopRight + l.smTopLeft - 2. * l.smTop) +
        abs(l.smBottomRight + l.smBottomLeft - 2. * l.smBottom);
       
    // 縦の勾配と横の勾配を比較して水平線と垂直線のどちらになっているかを決める
    // 勾配が大きい方がより強い境界になっているみなす 
        
    e.smIsHorizontal = horizontal >= vertical;
    
    // 境界の方向が決まったら + - 方向を決める 
    // 水平線 ... 上が+,下が-
    // 垂直線 ... 右が+,左が-
    
    float positiveLuma = e.smIsHorizontal ? l.smTop : l.smRight;
    float negativeLuma = e.smIsHorizontal ? l.smBottom : l.smLeft;
    
    // +方向と-方向それぞれと自身のピクセルの輝度差を計算

    float positiveGradient = abs(positiveLuma - l.smCenter);
    float negativeGradient = abs(negativeLuma - l.smCenter);
    
    // 境界の方向に応じて、隣接ピクセルへのuv差分値を決める
  
    e.smPixelStep = e.smIsHorizontal ? texelSize.y : texelSize.x;

    // 隣接ピクセルの輝度差が大きい方の情報を取得

    if(positiveGradient < negativeGradient) {
        // -方向の方が輝度差が大きい場合
        e.smPixelStep = -e.smPixelStep;
        e.smOppositeLuma = negativeLuma;
        e.smGradient = negativeGradient;
    } else {
        // +方向の方が輝度差が大きい場合
        e.smOppositeLuma = positiveLuma;
        e.smGradient = positiveGradient;
    }
    
    return e;
}

float fDetermineEdgeBlendFactor(sLuminanceData l, sEdgeData e, vec2 uv, vec2 texelSize) {

    // # high quality
    // const edgeStepsArray = [1, 1.5, 2, 2, 2, 2, 2, 2, 2, 4];
    // const edgeStepCount = 10;
    // const edgeGuess = 8;
    // # low quality
    // const edgeStepsArray = [1, 1.5, 2, 4];
    // const edgeStepCount = 4;
    // const edgeGuess = 12.;


    float[10] edgeStepsArray = float[](1., 1.5, 2., 2., 2., 2., 2., 2., 2., 4.);
    // const int edgeStepCount = 10;
    float edgeGuess = 8.;

    vec2 uvEdge = uv; // copy
    vec2 edgeStep = vec2(0.);

    // uvを半ピクセル分オフセット
    // 境界に沿った位置で計算していくため
    if(e.smIsHorizontal) {
        uvEdge.y += e.smPixelStep * .5; // offset half pixel
        edgeStep = vec2(texelSize.x, 0.);
    } else {
        uvEdge.x += e.smPixelStep * .5; // offset half pixel
        edgeStep = vec2(0., texelSize.y);
    }

    float edgeLuma = (l.smCenter + e.smOppositeLuma) * .5;
    float gradientThreshold = e.smGradient * .25;
    
    // +方向に一定回数edgeStepずらしながら輝度差,uv値を計算
    // 閾値（gradientThreshold）以下になったら端点とみなして打ち切り

    // vec2 puv = uvEdge + edgeStep * vec2(${edgeStepsArray[0]});
    vec2 puv = uvEdge + edgeStep * vec2(edgeStepsArray[0]);
    float pLumaDelta = fRgbToLuma(fSampleTexture(uSrcTexture, puv).xyz) - edgeLuma;
    bool pAtEnd = abs(pLumaDelta) >= gradientThreshold;

    // tmp
    // for(int i = 1; i < edgeStepCount && !pAtEnd; i++) {
    //     if(!pAtEnd) {
    //         puv += edgeStep * vec2(edgeStepsArray[i]);
    //         pLumaDelta = fRgbToLuma(fSampleTexture(uSrcTexture, puv).xyz) - edgeLuma;
    //         pAtEnd = abs(pLumaDelta) >= gradientThreshold;
    //     }
    // }
    // new
    // for(int i = 0; i < MAX_EDGE_STEP_COUNT; i++) {
    #pragma UNROLL_START MAX_EDGE_STEP_COUNT
        if(!pAtEnd) {
            int index = UNROLL_N + 1;
            puv += edgeStep * vec2(edgeStepsArray[index]);
            pLumaDelta = fRgbToLuma(fSampleTexture(uSrcTexture, puv).xyz) - edgeLuma;
            pAtEnd = abs(pLumaDelta) >= gradientThreshold;
        }
    #pragma UNROLL_END
    // }

    if(!pAtEnd) {
        puv += edgeStep * vec2(edgeGuess);
    }
    
    
    // -方向に一定回数edgeStepずらしながら輝度差,uv値を計算
    // 閾値（gradientThreshold）以下になったら端点とみなして打ち切り
   
    vec2 nuv = uvEdge - edgeStep * vec2(edgeStepsArray[0]);
    float nLumaDelta = fRgbToLuma(fSampleTexture(uSrcTexture, nuv).xyz) - edgeLuma;
    bool nAtEnd = abs(nLumaDelta) >= gradientThreshold;

    // tmp
    // for(int i = 1; i < edgeStepCount && !nAtEnd; i++) {
    //     if(!nAtEnd) {
    //         nuv -= edgeStep * vec2(edgeStepsArray[i]);
    //         nLumaDelta = fRgbToLuma(fSampleTexture(uSrcTexture, nuv).xyz) - edgeLuma;
    //         nAtEnd = abs(nLumaDelta) >= gradientThreshold;
    //     }
    // }
    // new
    // for(int i = 0; i < MAX_EDGE_STEP_COUNT; i++) {
    #pragma UNROLL_START MAX_EDGE_STEP_COUNT
        if(!nAtEnd) {
            int index = UNROLL_N + 1;
            nuv -= edgeStep * vec2(edgeStepsArray[index]);
            nLumaDelta = fRgbToLuma(fSampleTexture(uSrcTexture, nuv).xyz) - edgeLuma;
            nAtEnd = abs(nLumaDelta) >= gradientThreshold;
        }
    #pragma UNROLL_END
    // }

    if(!nAtEnd) {
        nuv -= edgeStep * vec2(edgeGuess);
    }
    
    // 探索を打ち切った地点のuv値と自身のピクセルを元に+方向と-方向の距離を計算
    // 距離なのでabsしてもよいはず
   
    float pDistance, nDistance;
    if(e.smIsHorizontal) {
        pDistance = puv.x - uv.x;
        nDistance = uv.x - nuv.x;
    } else {
        pDistance = puv.y - uv.y;
        nDistance = uv.y - nuv.y;
    }
    
    // 探索を打ち切った地点までの距離の小さい方を元に輝度差の符号を確認
    
    float shortestDistance;
    bool deltaSign;
    if(pDistance <= nDistance) {
        shortestDistance = pDistance;
        deltaSign = pLumaDelta >= 0.;
    } else {
        shortestDistance = nDistance;
        deltaSign = nLumaDelta >= 0.;
    }
   
    float edgeBlendFactor;
    
    if(deltaSign == (l.smCenter - edgeLuma >= 0.)) {
        // エッジから遠ざかっている場合ブレンド係数を0にしてスキップすることで、エッジの片側にあるピクセルだけをブレンド
        edgeBlendFactor = 0.;
    } else {
        // エッジまでの距離に応じてblend率を変える（近いほど高く、遠いほど低く）
        edgeBlendFactor = .5 - shortestDistance / (pDistance + nDistance);
    }
    
    return edgeBlendFactor;
}

void main() {
    vec2 uv = vUv;
    
    vec2 texelSize = vec2(1. / uTargetWidth, 1. / uTargetHeight);
    
    sLuminanceData l = fsampleLuminanceNeighborhood(uv, texelSize);   

    if(fShouldSkipPixel(l)) {
        outColor = fSampleTexture(uSrcTexture, uv);
        return;
    }
    
    sEdgeData e = fdetermineEdge(l, texelSize);
    float pixelBlend = fDeterminePixelBlendFactor(l); 
    float edgeBlend = fDetermineEdgeBlendFactor(l, e, uv, texelSize);
    
    float finalBlend = max(pixelBlend, edgeBlend);

    if(e.smIsHorizontal) {
        uv.y += e.smPixelStep * finalBlend;
    } else {
        uv.x += e.smPixelStep * finalBlend;
    }

    outColor = fSampleTexture(uSrcTexture, uv);
    // outColor = fSampleTexture(${UniformNames.SrcTexture}, vUv);
}
