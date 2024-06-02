#version 300 es

precision mediump float;

#define MAX_EDGE_STEP_COUNT 9

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
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
    LuminanceData l;

    // get nearest side pixels
    vec3 rgbTop = sampleTextureOffset(uSrcTexture, uv, 0., texelSize.y).xyz;
    vec3 rgbRight = sampleTextureOffset(uSrcTexture, uv, texelSize.x, 0.).xyz;
    vec3 rgbBottom = sampleTextureOffset(uSrcTexture, uv, 0., -texelSize.y).xyz;
    vec3 rgbLeft = sampleTextureOffset(uSrcTexture, uv, -texelSize.x, 0.).xyz;
    vec3 rgbCenter = sampleTextureOffset(uSrcTexture, uv, 0., 0.).xyz;

    // get nearest corner pixels
    vec3 rgbTopRight = sampleTextureOffset(uSrcTexture, uv, texelSize.x, texelSize.y).xyz;
    vec3 rgbTopLeft = sampleTextureOffset(uSrcTexture, uv, -texelSize.x, texelSize.y).xyz;
    vec3 rgbBottomRight = sampleTextureOffset(uSrcTexture, uv, texelSize.x, -texelSize.y).xyz;
    vec3 rgbBottomLeft = sampleTextureOffset(uSrcTexture, uv, -texelSize.x, -texelSize.y).xyz;

    // get nearest side pixels luma
    float lumaTop = rgbToLuma(rgbTop);
    float lumaLeft = rgbToLuma(rgbLeft);
    float lumaCenter = rgbToLuma(rgbCenter);
    float lumaRight = rgbToLuma(rgbRight);
    float lumaBottom = rgbToLuma(rgbBottom);

    // get nearest corner pixels luma
    float lumaTopLeft = rgbToLuma(rgbTopLeft);
    float lumaTopRight = rgbToLuma(rgbTopRight);
    float lumaBottomLeft = rgbToLuma(rgbBottomLeft);
    float lumaBottomRight = rgbToLuma(rgbBottomRight);

    // get nearest side pixels contrast
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
    // sub-pixel blend 用のカーネル
    // | 1 | 2 | 1 | 
    // | 2 | 0 | 2 |
    // | 1 | 2 | 1 |
 
    float determineEdgeFilter = 2. * (l.top + l.right + l.bottom + l.left);
    determineEdgeFilter += l.topLeft + l.topRight + l.bottomLeft + l.bottomRight;
    
    // to low-pass filter
    determineEdgeFilter *= 1. / 12.; 
    
    // to high-pass filter
    determineEdgeFilter = abs(determineEdgeFilter - l.center); 
    
    // to normalized filter
    determineEdgeFilter = clamp(determineEdgeFilter / l.contrast, 0., 1.); 
    
    // linear to smoothstep
    float pixelBlendFactor = smoothstep(0., 1., determineEdgeFilter); 
    
    // smoothstep to squared smoothstep
    pixelBlendFactor = pixelBlendFactor * pixelBlendFactor;
    
    // multiply sub-pixel blend rate
    pixelBlendFactor *= uSubpixelBlending; 
    
    return pixelBlendFactor;
}

EdgeData determineEdge(LuminanceData l, vec2 texelSize) {
    EdgeData e;
    
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
        abs(l.top + l.bottom - 2. * l.center) * 2. +
        abs(l.topRight + l.bottomRight - 2. * l.right) + 
        abs(l.topLeft + l.bottomLeft - 2. * l.left);
        
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
        abs(l.right + l.left - 2. * l.center) * 2. +
        abs(l.topRight + l.topLeft - 2. * l.top) +
        abs(l.bottomRight + l.bottomLeft - 2. * l.bottom);
       
    // 縦の勾配と横の勾配を比較して水平線と垂直線のどちらになっているかを決める
    // 勾配が大きい方がより強い境界になっているみなす 
        
    e.isHorizontal = horizontal >= vertical;
    
    // 境界の方向が決まったら + - 方向を決める 
    // 水平線 ... 上が+,下が-
    // 垂直線 ... 右が+,左が-
    
    float positiveLuma = e.isHorizontal ? l.top : l.right;
    float negativeLuma = e.isHorizontal ? l.bottom : l.left;
    
    // +方向と-方向それぞれと自身のピクセルの輝度差を計算

    float positiveGradient = abs(positiveLuma - l.center);
    float negativeGradient = abs(negativeLuma - l.center);
    
    // 境界の方向に応じて、隣接ピクセルへのuv差分値を決める
  
    e.pixelStep = e.isHorizontal ? texelSize.y : texelSize.x;

    // 隣接ピクセルの輝度差が大きい方の情報を取得

    if(positiveGradient < negativeGradient) {
        // -方向の方が輝度差が大きい場合
        e.pixelStep = -e.pixelStep;
        e.oppositeLuma = negativeLuma;
        e.gradient = negativeGradient;
    } else {
        // +方向の方が輝度差が大きい場合
        e.oppositeLuma = positiveLuma;
        e.gradient = positiveGradient;
    }
    
    return e;
}

float determineEdgeBlendFactor(LuminanceData l, EdgeData e, vec2 uv, vec2 texelSize) {

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
    if(e.isHorizontal) {
        uvEdge.y += e.pixelStep * .5; // offset half pixel
        edgeStep = vec2(texelSize.x, 0.);
    } else {
        uvEdge.x += e.pixelStep * .5; // offset half pixel
        edgeStep = vec2(0., texelSize.y);
    }

    float edgeLuma = (l.center + e.oppositeLuma) * .5;
    float gradientThreshold = e.gradient * .25;
    
    // +方向に一定回数edgeStepずらしながら輝度差,uv値を計算
    // 閾値（gradientThreshold）以下になったら端点とみなして打ち切り

    // vec2 puv = uvEdge + edgeStep * vec2(${edgeStepsArray[0]});
    vec2 puv = uvEdge + edgeStep * vec2(edgeStepsArray[0]);
    float pLumaDelta = rgbToLuma(sampleTexture(uSrcTexture, puv).xyz) - edgeLuma;
    bool pAtEnd = abs(pLumaDelta) >= gradientThreshold;

    // tmp
    // for(int i = 1; i < edgeStepCount && !pAtEnd; i++) {
    //     if(!pAtEnd) {
    //         puv += edgeStep * vec2(edgeStepsArray[i]);
    //         pLumaDelta = rgbToLuma(sampleTexture(uSrcTexture, puv).xyz) - edgeLuma;
    //         pAtEnd = abs(pLumaDelta) >= gradientThreshold;
    //     }
    // }
    // new
    #pragma UNROLL_START
    for(int i = 0; i < MAX_EDGE_STEP_COUNT; i++) {
        if(!pAtEnd) {
            int index = UNROLL_i + 1;
            puv += edgeStep * vec2(edgeStepsArray[index]);
            pLumaDelta = rgbToLuma(sampleTexture(uSrcTexture, puv).xyz) - edgeLuma;
            pAtEnd = abs(pLumaDelta) >= gradientThreshold;
        }
    }
    #pragma UNROLL_END

    if(!pAtEnd) {
        puv += edgeStep * vec2(edgeGuess);
    }
    
    
    // -方向に一定回数edgeStepずらしながら輝度差,uv値を計算
    // 閾値（gradientThreshold）以下になったら端点とみなして打ち切り
   
    vec2 nuv = uvEdge - edgeStep * vec2(edgeStepsArray[0]);
    float nLumaDelta = rgbToLuma(sampleTexture(uSrcTexture, nuv).xyz) - edgeLuma;
    bool nAtEnd = abs(nLumaDelta) >= gradientThreshold;

    // tmp
    // for(int i = 1; i < edgeStepCount && !nAtEnd; i++) {
    //     if(!nAtEnd) {
    //         nuv -= edgeStep * vec2(edgeStepsArray[i]);
    //         nLumaDelta = rgbToLuma(sampleTexture(uSrcTexture, nuv).xyz) - edgeLuma;
    //         nAtEnd = abs(nLumaDelta) >= gradientThreshold;
    //     }
    // }
    // new
    #pragma UNROLL_START
    for(int i = 0; i < MAX_EDGE_STEP_COUNT; i++) {
        if(!nAtEnd) {
            int index = UNROLL_i + 1;
            nuv -= edgeStep * vec2(edgeStepsArray[index]);
            nLumaDelta = rgbToLuma(sampleTexture(uSrcTexture, nuv).xyz) - edgeLuma;
            nAtEnd = abs(nLumaDelta) >= gradientThreshold;
        }
    }
    #pragma UNROLL_END

    if(!nAtEnd) {
        nuv -= edgeStep * vec2(edgeGuess);
    }
    
    // 探索を打ち切った地点のuv値と自身のピクセルを元に+方向と-方向の距離を計算
    // 距離なのでabsしてもよいはず
   
    float pDistance, nDistance;
    if(e.isHorizontal) {
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
    
    if(deltaSign == (l.center - edgeLuma >= 0.)) {
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
    
    LuminanceData l = sampleLuminanceNeighborhood(uv, texelSize);   

    if(shouldSkipPixel(l)) {
        outColor = sampleTexture(uSrcTexture, uv);
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

    outColor = sampleTexture(uSrcTexture, uv);
    // outColor = sampleTexture(${UniformNames.SrcTexture}, vUv);
}
