//
// human distance functions ---------------------------------------------------
//

struct sHuman {
    vec3 smPelvisP;
    vec3 smHeadP;
    float smDist;
};
 
uniform vec3 uAdjustScale;

uniform sampler2D uAnimationTexture;
uniform int uClipStartRow;        // クリップのテクスチャ開始行
uniform int uClipFrameCount;      // クリップの実際のフレーム数（可変）
uniform float uAnimationTime;     // クリップ内の経過時間（秒）
uniform float uAnimationFPS;      // FPS（デフォルト30）

vec3 fGetJointInfo(int jointIndex) {
    // クリップ内のフレームインデックスを計算（フレーム数は可変）
    int frameIndex = int(mod(uAnimationTime * uAnimationFPS, float(uClipFrameCount)));

    // テクスチャのY座標 = クリップ開始行 + ジョイントインデックス
    int rowIndex = uClipStartRow + jointIndex;

#ifdef USE_INSTANCING
    // インスタンシング時は各インスタンスで時間をずらす
    frameIndex = int(mod((uAnimationTime + vInstanceId * 0.1) * uAnimationFPS, float(uClipFrameCount)));
#endif

    return texelFetch(uAnimationTexture, ivec2(frameIndex, rowIndex), 0).xyz;
}

// TODO: 共通化できる
// raymarch-scene-functions.partial.glsl
vec3 fToLocal(vec3 p, mat4 WtoO, vec3 scale) {
    // scale = vec3(1.);
    return (WtoO * vec4(p, 1.)).xyz * scale;
}

// TODO: 共通化できる
// raymarch-scene-functions.partial.glsl
bool fIsDfInnerBox(vec3 p, vec3 scale) {
    // scale = vec3(1.);
    // 0 だとマッハバンドっぽい境目が出るのでちょっと余裕を持たせる
    const float eps = .0001;
    return
        abs(p.x) < scale.x * .5 + eps &&
        abs(p.y) < scale.y * .5 + eps &&
        abs(p.z) < scale.z * .5 + eps;
}

// TODO: 共通化できる
// 既存の深度値と比較して、奥にある場合は破棄する
// object-space-raymarch-fragment-functions.partial.glsl
void fCheckDiscardByCompareRayDepthAndSceneDepth(
    vec3 currentRayPosition,
    sampler2D depthTexture,
    float nearClip,
    float farClip,
    mat4 viewMatrix
) {
    // 既存の深度値と比較して、奥にある場合は破棄する
    float rawDepth = texelFetch(depthTexture, ivec2(gl_FragCoord.xy), 0).x;
    float sceneDepth = fPerspectiveDepthToLinearDepth(rawDepth, nearClip, farClip);
    vec4 currentRayViewPosition = (viewMatrix * vec4(currentRayPosition, 1.));
    float currentDepth = fViewZToLinearDepth(currentRayViewPosition.z, nearClip, farClip);
    if(currentDepth >= sceneDepth) {
        discard;
    }
}

// TODO: 共通化できる
// object-space-raymarch-fragment-functions.partial.glsl
vec3 fGetOSRaymarchViewRayDirection(vec3 origin, vec3 viewPosition, float isPerspective) {
    return isPerspective > .5
        ? normalize(origin - viewPosition)
        : normalize(-viewPosition);
}


 

// human df ------------------------------------------


vec3 fOpHumanRot3(vec3 p, float axis, vec3 rot) {
    vec3 _p = p;
    _p.xy = fOpRo(_p.xy, PI * axis * rot.z);
    _p.yz = fOpRo(_p.yz, PI * rot.x);
    _p.xz = fOpRo(_p.xz, PI * axis * rot.y);
    return _p;
}

float fDfFinger(vec3 p, float axis, vec3 offset, vec3 baseRot, float s) {
    p = fOpTr(p, offset);
   
    // rot: (左右, ?, 曲げ) 
    
    vec3 _p = fOpHumanRot3(p, axis, baseRot + vec3(.0, .0, -.1));
    _p = fOpTr(_p, vec3(0., .003, .01));
    float d1 = fDfRco(_p, .03 * s, .012 * s, .012 * s);
    
    _p = fOpTr(_p, vec3(0., .04, 0.));
    _p = fOpHumanRot3(_p, axis, vec3(0, 0, -.1));
    float d2 = fDfRco(_p, .025 * s, .008 * s, .008 * s);
   
    _p = fOpTr(_p, vec3(0., .03, 0.));
    _p = fOpHumanRot3(_p, axis, vec3(0, 0, -.1));
    float d3 = fDfRco(_p, .025 * s, .006 * s, .006 * s);
   
    float d = 1e6; 
    
    d = fOpSm(d, d1, .018);
    d = fOpSm(d, d2, .018);
    d = fOpSm(d, d3, .018);
    
    return d;
}

float fDfArm(
    float cd, // current distance
    vec3 pSpine2,
    float axis,
    vec3 shoulderRot, // ひねり, 前後, 上下
    vec3 elbowRot, // 曲げ
    vec3 wristRot
) {
    float d = 1e6;

    // - shoulder
    vec3 pShoulder = fOpTr(pSpine2, vec3(-.15 * axis, .13, 0.));
    // tmp
    // pShoulder.xy = fOpRo(pShoulder.xy, PI * axis * shoulderRot.z); // 上下
    // pShoulder.yz = fOpRo(pShoulder.yz, PI * axis * shoulderRot.x); // ひねり
    // pShoulder.xz = fOpRo(pShoulder.xz, PI * axis * shoulderRot.y); // 前後
    // new
    // pShoulder.xy = fOpRo(pShoulder.xy, PI * axis * shoulderRot.z); // 上下
    // pShoulder.yz = fOpRo(pShoulder.yz, PI * axis * shoulderRot.x); // ひねり
    // pShoulder.xz = fOpRo(pShoulder.xz, PI * axis * shoulderRot.y); // 前後
    // 
    pShoulder.xy = fOpRo(pShoulder.xy, PI * axis * shoulderRot.z); // 上下
    pShoulder.yz = fOpRo(pShoulder.yz, PI * axis * shoulderRot.x);
    pShoulder.xz = fOpRo(pShoulder.xz, PI * axis * shoulderRot.y); // 前後
    float dShoulder = fDfSp(pShoulder, .025);
    
    // -- upper arm
    vec3 pUpperArm = fOpTr(pShoulder, vec3(-.08 * axis, 0., 0.));
    pUpperArm.xy = fOpRo(pUpperArm.xy, PI * -.5 * axis);
    vec3 _pUpperArm = pUpperArm;
    // float dUpperArm = fDfCaa(pUpperArm, vec3(0.), .33, .0575);
    vec3 upperArmS = vec3(
        // 1.,
        max(.2, 1. - pUpperArm.y * .1),
        1.,
        1.1
    );
    float dUpperArm = fOpPoSc(
        fDfRco(fOpPrSc(_pUpperArm, upperArmS), .33, .0705, .0435),
        upperArmS
    );
    
    // --- elbow
    vec3 pElbow = fOpTr(pUpperArm, vec3(0., .35, 0.));
    // NOTE: 曲げ以外もあった方がいい？
    // tmp
    // pElbow.yz = fOpRo(pElbow.yz, PI * elbowRot.y); // ひじの曲げ
    // // new
    // pElbow.xy = fOpRo(pElbow.xy, PI * axis * elbowRot.z);
    // pElbow.yz = fOpRo(pElbow.yz, PI * elbowRot.y); // ひじの曲げ
    
    pElbow.yz = fOpRo(pElbow.yz, PI * elbowRot.y); // ひじの曲げ
    pElbow.xz = fOpRo(pElbow.xz, PI * axis * -elbowRot.x);
    pElbow.xy = fOpRo(pElbow.xy, PI * axis * -elbowRot.z);
     
     
    
    vec3 _pElbow = pElbow;
    _pElbow = fOpTr(_pElbow, vec3(0., 0., -.001));
    vec3 elbowScale = vec3(.5, 1., .8);
    float dElbow = fOpPoSc(
        fDfSp(fOpPrSc(_pElbow, elbowScale), .032),
        elbowScale
    );
    
    // ---- forearm
    vec3 pForearm = fOpTr(pElbow, vec3(0., .01, 0.));
    // pForearm.xy = fOpRo(pForearm.xy, PI * .25);
    vec3 forearmScale = vec3(
        max(.2, .95 - pForearm.y * 1.),
        1.,
        1.
    );
    float dForearm =
        fOpPoSc(
            fDfRco(fOpPrSc(pForearm, forearmScale), .28, .0455, .035),
            forearmScale
        );
    
    // ----- wrist
    vec3 pWrist = fOpTr(pForearm, vec3(0., .25, 0.));
    // pWrist.xz = fOpRo(pWrist.xz, PI * -.8 * 0.); // test
    pWrist.xy = fOpRo(pWrist.xy, PI * axis * wristRot.z);
    pWrist.yz = fOpRo(pWrist.yz, PI * axis * wristRot.x);
    pWrist.xz = fOpRo(pWrist.xz, PI * axis * wristRot.y);
    float dWrist = fDfSp(pWrist, .02);
    
    // ------ hand
    vec3 pHand = fOpTr(pWrist, vec3(.0, .052, .0));
    float dHand = fDfRBoxt(pHand, vec3(.025, .04, .065), .01);
    
    // ------- thumb
    // tmp
    // vec3 pThumb = fOpTr(pHand, vec3(0., .002, .04));
    // float dThumb = fDfCaa(pThumb, vec3(0.), .04, .012);
    
    // vec3 _pThumb = pHand;
    // _pThumb.xy = fOpRo(_pThumb.xy, PI * axis * 0.);
    // _pThumb.yz = fOpRo(_pThumb.yz, PI * -.02);
    // _pThumb.xz = fOpRo(_pThumb.xz, PI * axis * 0.);
    // _pThumb = fOpTr(_pThumb, vec3(0., .003, .03));
    // float dThumb = fDfCaa(_pThumb, vec3(0.), .04, .01);
    
    float dThumb = fDfFinger(pHand, axis, vec3(0., -.018, .01), vec3(-.1, 0., 0.), 1.2);

    // -------- finger bundle
    vec3 pFingerBundle = fOpTr(pHand, vec3(0., 0.06, -.01));
    float dFingerBundle = fDfRcot(pFingerBundle, .03, .032, .025);
    
    // -------- fingers
    // thumb
    // index finger
    // middle finger
    // ring finger
    // little finger
    
    // vec3 _pIndexFinger = pHand;
    // _pIndexFinger.xy = fOpRo(_pIndexFinger.xy, PI * axis * 0.);
    // _pIndexFinger.yz = fOpRo(_pIndexFinger.yz, PI * -.01);
    // _pIndexFinger.xz = fOpRo(_pIndexFinger.xz, PI * axis * 0.);
    // _pIndexFinger = fOpTr(_pIndexFinger, vec3(0., .0015, .01));
    // float dIndexFinger = fDfCaa(_pIndexFinger, vec3(0.), .07, .01);
    
    float dIndexFinger = fDfFinger(pHand, axis, vec3(0., .015, .01), vec3(0., 0., 0.), 1.);
    float dMiddleFinger = fDfFinger(pHand, axis, vec3(0., .025, -.01), vec3(0., 0., 0.), 1.);
    float dRingFinger = fDfFinger(pHand, axis, vec3(0., .02, -.025), vec3(0., 0., 0.), 1.);
    float dLittleFinger = fDfFinger(pHand, axis, vec3(0., .01, -.035), vec3(0., 0., .1), 1.);

    // vec3 _pMiddleFinger = pHand;
    // _pMiddleFinger.xy = fOpRo(_pMiddleFinger.xy, PI * axis * 0.);
    // _pMiddleFinger.yz = fOpRo(_pMiddleFinger.yz, PI * -.01);
    // _pMiddleFinger.xz = fOpRo(_pMiddleFinger.xz, PI * axis * 0.);
    // _pMiddleFinger = fOpTr(_pMiddleFinger, vec3(0., .003, -.01));
    // float dMiddleFinger = fDfCaa(_pMiddleFinger, vec3(0.), .07, .01);
 
    
    d = fOpSm(cd, dShoulder, .02);
    d = fOpSm(d, dUpperArm, .05);
    d = fOpSm(d, dElbow, .04);
    d = fOpSm(d, dForearm, .01);
    d = fOpSm(d, dWrist, .02);
    d = fOpSm(d, dHand, .02);
    d = fOpSm(d, dThumb, .01);
    d = fOpSm(d, dIndexFinger, .01);
    d = fOpSm(d, dMiddleFinger, .01);
    d = fOpSm(d, dRingFinger, .01);
    d = fOpSm(d, dLittleFinger, .01);
    // d = fOpSm(d, dFingerBundle, .02);
 
    return d;
}

float fDfArmLight(
    float cd, // current distance
    vec3 pSpine2,
    float axis,
    vec3 shoulderRot, // ひねり, 前後, 上下
    vec3 elbowRot, // 曲げ
    vec3 wristRot
) {
    float d = 1e6;

    // - shoulder
    vec3 pShoulder = fOpTr(pSpine2, vec3(-.15 * axis, .13, 0.));
    // tmp
    // pShoulder.xy = fOpRo(pShoulder.xy, PI * axis * shoulderRot.z); // 上下
    // pShoulder.yz = fOpRo(pShoulder.yz, PI * axis * shoulderRot.x); // ひねり
    // pShoulder.xz = fOpRo(pShoulder.xz, PI * axis * shoulderRot.y); // 前後
    // new
    pShoulder.xy = fOpRo(pShoulder.xy, PI * axis * shoulderRot.z); // 上下
    pShoulder.yz = fOpRo(pShoulder.yz, PI * -shoulderRot.x); // ひねり
    pShoulder.xz = fOpRo(pShoulder.xz, PI * axis * shoulderRot.y); // 前後
    float dShoulder = fDfSp(pShoulder, .025);
    
    // -- upper arm
    vec3 pUpperArm = fOpTr(pShoulder, vec3(-.08 * axis, 0., 0.));
    pUpperArm.xy = fOpRo(pUpperArm.xy, PI * -.5 * axis);
    vec3 _pUpperArm = pUpperArm;
    // float dUpperArm = fDfCaa(pUpperArm, vec3(0.), .33, .0575);
    vec3 upperArmS = vec3(
        // 1.,
        max(.2, 1. - pUpperArm.y * .1),
        1.,
        1.1
    );
    float dUpperArm = fOpPoSc(
        fDfRco(fOpPrSc(_pUpperArm, upperArmS), .33, .0705, .0435),
        upperArmS
    );
    
    // --- elbow
    vec3 pElbow = fOpTr(pUpperArm, vec3(0., .35, 0.));
    // NOTE: 曲げ以外もあった方がいい？
    // tmp
    // pElbow.yz = fOpRo(pElbow.yz, PI * elbowRot.y); // ひじの曲げ
    // // new
    // pElbow.xy = fOpRo(pElbow.xy, PI * axis * elbowRot.z);
    // pElbow.yz = fOpRo(pElbow.yz, PI * elbowRot.y); // ひじの曲げ
    
    pElbow.yz = fOpRo(pElbow.yz, PI * elbowRot.y); // ひじの曲げ
    pElbow.xz = fOpRo(pElbow.xz, PI * axis * -elbowRot.x);
    
    vec3 _pElbow = pElbow;
    _pElbow = fOpTr(_pElbow, vec3(0., 0., -.001));
    vec3 elbowScale = vec3(.5, 1., .8);
    float dElbow = fOpPoSc(
        fDfSp(fOpPrSc(_pElbow, elbowScale), .032),
        elbowScale
    );
    
    // ---- forearm
    vec3 pForearm = fOpTr(pElbow, vec3(0., .01, 0.));
    // pForearm.xy = fOpRo(pForearm.xy, PI * .25);
    vec3 forearmScale = vec3(
        max(.2, .95 - pForearm.y * 1.),
        1.,
        1.
    );
    float dForearm =
        fOpPoSc(
            fDfRco(fOpPrSc(pForearm, forearmScale), .28, .0455, .035),
            forearmScale
        );
    
    // ----- wrist
    vec3 pWrist = fOpTr(pForearm, vec3(0., .25, 0.));
    pWrist.xy = fOpRo(pWrist.xy, PI * axis * wristRot.z);
    pWrist.yz = fOpRo(pWrist.yz, PI * axis * wristRot.x);
    pWrist.xz = fOpRo(pWrist.xz, PI * axis * wristRot.y);
    float dWrist = fDfSp(pWrist, .02);
    
    // ------ hand
    vec3 pHand = fOpTr(pWrist, vec3(.0, .052, .0));
    float dHand = fDfRBoxt(pHand, vec3(.025, .04, .065), .01);
    
    // ------- thumb
    // tmp
    // vec3 pThumb = fOpTr(pHand, vec3(0., .002, .04));
    // float dThumb = fDfCaa(pThumb, vec3(0.), .04, .012);
    
    // vec3 _pThumb = pHand;
    // _pThumb.xy = fOpRo(_pThumb.xy, PI * axis * 0.);
    // _pThumb.yz = fOpRo(_pThumb.yz, PI * -.02);
    // _pThumb.xz = fOpRo(_pThumb.xz, PI * axis * 0.);
    // _pThumb = fOpTr(_pThumb, vec3(0., .003, .03));
    // float dThumb = fDfCaa(_pThumb, vec3(0.), .04, .01);
    
    float dThumb = fDfFinger(pHand, axis, vec3(0., -.018, .01), vec3(-.1, 0., 0.), 1.2);

    // -------- finger bundle
    vec3 pFingerBundle = fOpTr(pHand, vec3(0., 0.06, -.01));
    float dFingerBundle = fDfRcot(pFingerBundle, .03, .032, .025);
    
    // // -------- fingers
    // // thumb
    // // index finger
    // // middle finger
    // // ring finger
    // // little finger
    // 
    // // vec3 _pIndexFinger = pHand;
    // // _pIndexFinger.xy = fOpRo(_pIndexFinger.xy, PI * axis * 0.);
    // // _pIndexFinger.yz = fOpRo(_pIndexFinger.yz, PI * -.01);
    // // _pIndexFinger.xz = fOpRo(_pIndexFinger.xz, PI * axis * 0.);
    // // _pIndexFinger = fOpTr(_pIndexFinger, vec3(0., .0015, .01));
    // // float dIndexFinger = fDfCaa(_pIndexFinger, vec3(0.), .07, .01);
    // 
    // float dIndexFinger = fDfFinger(pHand, axis, vec3(0., .015, .01), vec3(0., 0., 0.), 1.);
    // float dMiddleFinger = fDfFinger(pHand, axis, vec3(0., .025, -.01), vec3(0., 0., 0.), 1.);
    // float dRingFinger = fDfFinger(pHand, axis, vec3(0., .02, -.025), vec3(0., 0., 0.), 1.);
    // float dLittleFinger = fDfFinger(pHand, axis, vec3(0., .01, -.035), vec3(0., 0., .1), 1.);

    // // vec3 _pMiddleFinger = pHand;
    // // _pMiddleFinger.xy = fOpRo(_pMiddleFinger.xy, PI * axis * 0.);
    // // _pMiddleFinger.yz = fOpRo(_pMiddleFinger.yz, PI * -.01);
    // // _pMiddleFinger.xz = fOpRo(_pMiddleFinger.xz, PI * axis * 0.);
    // // _pMiddleFinger = fOpTr(_pMiddleFinger, vec3(0., .003, -.01));
    // // float dMiddleFinger = fDfCaa(_pMiddleFinger, vec3(0.), .07, .01);
 
    
    d = fOpSm(cd, dShoulder, .02);
    d = fOpSm(d, dUpperArm, .05);
    d = fOpSm(d, dElbow, .04);
    d = fOpSm(d, dForearm, .01);
    d = fOpSm(d, dWrist, .02);
    d = fOpSm(d, dHand, .02);
    d = fOpSm(d, dThumb, .01);
    // d = fOpSm(d, dIndexFinger, .01);
    // d = fOpSm(d, dMiddleFinger, .01);
    // d = fOpSm(d, dRingFinger, .01);
    // d = fOpSm(d, dLittleFinger, .01);
    d = fOpSm(d, dFingerBundle, .02);
 
    return d;
}


float fdfLeg(
    float cd, // current distance
    vec3 pPelvis,
    float axis,
    vec3 legRot,
    vec3 kneeRot
) {
    float d = 1e6;
    
    // - hip
    vec3 pHip = fOpTr(pPelvis, vec3(-.1 * axis, -.1, 0.));
    // tmp
    // pHip.xy = fOpRo(pHip.xy, PI * -legRot.z); // 左右の開き
    // pHip.yz = fOpRo(pHip.yz, PI * legRot.x);
    // pHip.xz = fOpRo(pHip.xz, PI * axis * -legRot.y); 
    // new
    pHip.xy = fOpRo(pHip.xy, PI * -legRot.z); // 左右の開き
    pHip.yz = fOpRo(pHip.yz, PI * legRot.x); // 前後
    pHip.xz = fOpRo(pHip.xz, PI * legRot.y);
    // pHip.xz = fOpRo(pHip.xz, PI * axis * -legRot.y); 
    // pHip.xz = fOpRo(pHip.xz, PI * uTime * .5); 
    
    vec3 _pHip = pHip;
    _pHip = fOpTr(_pHip, vec3(.01 * axis, .03, -.025));
    float dHip = fDfSp(_pHip, .09);
    
    // - thigh
    vec3 pThigh = fOpTr(pHip, vec3(0., -.05, 0.));
    vec3 thighExpandScale = vec3(1.2, 3.4, 1.2);
    float dThigh = 
        fOpSm(
            fDfRcot(pThigh, .4, .06, .095),
            fOpPoSc(
                fDfSp(
                    fOpPrSc(
                        fOpTr(pThigh, vec3(0., -.14, -.03)),
                        thighExpandScale
                    ),
                    .05
                ),
                thighExpandScale
            ),
            .02
        );
    
    // -- knee
    vec3 pKnee = fOpTr(pThigh, vec3(0., -.4, 0.));
    // tmp
    // pKnee.yz = fOpRo(pKnee.yz, PI * kneeRot.x);
    // new
    // pKnee.xy = fOpRo(pKnee.xy, PI * -kneeRot.z);
    // pKnee.yz = fOpRo(pKnee.yz, PI * kneeRot.x);
    // pKnee.xz = fOpRo(pKnee.xz, PI * kneeRot.y);
    // new2
    pKnee.xy = fOpRo(pKnee.xy, PI * kneeRot.z);
    pKnee.yz = fOpRo(pKnee.yz, PI * kneeRot.x);
    pKnee.xz = fOpRo(pKnee.xz, PI * kneeRot.y);
    // pKnee.xz = fOpRo(pKnee.xz, PI * kneeRot.y + PI * .25); // zazenの時は+PI*.25したい 
    
    
    vec3 _pKnee = pKnee;
    _pKnee = fOpTr(_pKnee, vec3(0., -.05, .01));
    float dKnee = fDfSp(_pKnee, .03);
    
    // --- shin
    vec3 pShin = fOpTr(pKnee, vec3(0., -.05, 0.));
    vec3 _pShin = pShin;
    vec3 pShinScale = vec3(
        1.,
        1.,
        1.
    );
    vec3 shinExpandScale = vec3(1.2, 2.4, 1.);
    float dShin =
        fOpSm(
            fOpPoSc(
                fDfRcot(fOpPrSc(_pShin, pShinScale), .42, .035, .055),
                pShinScale
            ),
            fOpPoSc(
                fDfSp(
                    fOpPrSc(
                        fOpTr(_pShin, vec3(0., -.14, -.015)),
                        shinExpandScale
                    ),
                    .05
                ),
                shinExpandScale
            ),
            .02
        );
    
    // ---- ankle
    vec3 pAnkle = fOpTr(pShin, vec3(0., -.46, 0.));
    float dAnkle = fDfSp(pAnkle, .025);
    
    // ----- foot
    vec3 pFoot = fOpTr(pAnkle, vec3(0., .005, .065));
    vec3 footScale = vec3(
        max(.55 + pFoot.z * -.8, .01),
        max(.8 + pFoot.z * -2., .01),
        1.
    );
    float dFoot = fOpPoSc(
        fDfRBoxt(
            fOpPrSc(pFoot, footScale),
            vec3(
                .17,
                min(.07, .11 - pFoot.x * .15),
                 .22
            ),
        .05),
    footScale);

    d = min(d, cd);
    d = fOpSm(d, dHip, .05);
    d = fOpSm(d, dThigh, .05);
    d = fOpSm(d, dKnee, .05);
    d = fOpSm(d, dShin, .02);
    d = fOpSm(d, dAnkle, .02);
    d = fOpSm(d, dFoot, .02);
    
    return d;
}

sHuman fDfHuman(
    vec3 p,
    // ---   
    vec3 pelvisPosition,
    vec3 pelvisRotation,
    vec3 spine1Rotation,
    vec3 spine2Rotation,
    vec3 leftShoulderRotation,
    vec3 leftElbowRotation,
    vec3 rightShoulderRotation,
    vec3 rightElbowRotation,
    vec3 leftHipRotation,
    vec3 leftKneeRotation,
    vec3 rightHipRotation,
    vec3 rightKneeRotation,
    vec3 neckRotation,
    vec3 leftWristRotation,
    vec3 rightWristRotation
    // ---    
) {
    sHuman humanObj;

    vec3 q = fOpTr(p, vec3(0., -1.5, 0.)); // boundsの高さの半分、地面の高さまで手動オフセット
    float d = 1e6;
    
    // - pelvis
    // vec3 pPelvis = fOpTr(q, vec3(0., 1.05, 0.));
    vec3 pPelvis = fOpTr(q, pelvisPosition);
    vec3 pr = vec3(0., 0., 0.);
    pPelvis.xz = fOpRo(pPelvis.xz, PI * -pelvisRotation.y);
    pPelvis.xy = fOpRo(pPelvis.xy, PI * -pelvisRotation.z);
    pPelvis.yz = fOpRo(pPelvis.yz, PI * pelvisRotation.x);
    // pShoulder.xz = fOpRo(pShoulder.xz, PI * axis * shoulderRot.y); // ひねり
    // pShoulder.xy = fOpRo(pShoulder.xy, PI * axis * shoulderRot.z); // 上下
    // pShoulder.yz = fOpRo(pShoulder.yz, -PI * shoulderRot.x); // 前後
  
    humanObj.smPelvisP = pPelvis;
    
    vec3 _pPelvis = pPelvis;
    // _pPelvis.xz *= 2.;
    float dPelvis = fDfRBoxt(_pPelvis, vec3(.34, .32, .18), .1);
    
    // -- spine01
    vec3 pSpine1 = fOpTr(pPelvis, vec3(0., .15, 0.));
    pSpine1.xy = fOpRo(pSpine1.xy, PI * -spine1Rotation.z);
    pSpine1.yz = fOpRo(pSpine1.yz, PI * -spine1Rotation.x);
    pSpine1.xz = fOpRo(pSpine1.xz, PI * -spine1Rotation.y);
    vec3 _pSpine1 = pSpine1;
    // _pSpine1.xz *= (1. + _pSpine1.y * .8);
    vec3 pSpine1Scale = vec3(.95, 1., .98);
    float dSpine1 = fOpPoSc(
        fDfRBoxt(
            fOpPrSc(_pSpine1, pSpine1Scale), vec3(.34, .39, .2), .1
        ),
        pSpine1Scale
    ); 

    // -- spine02
   
    // pSpine1.yz = fOpRo(pSpine1.yz, sin(uTime) * PI * .5);
    vec3 pSpine2 = fOpTr(pSpine1, vec3(0., .25, 0.));
    pSpine2.xy = fOpRo(pSpine2.xy, PI * -spine2Rotation.z);
    pSpine2.yz = fOpRo(pSpine2.yz, PI * -spine2Rotation.x);
    pSpine2.xz = fOpRo(pSpine2.xz, PI * -spine2Rotation.y);
    vec3 _pSpine2 = pSpine2;
    _pSpine2 = fOpTr(_pSpine2, vec3(0., .03, 0.));
    vec3 pSpine2Scale = vec3(
        1. + max(_pSpine2.y + .1, 0.) * 1.1,
        1.,
        // 1. + max(_pSpine2.y + .2 - 0., 0.) * .7
        1. + (smoothstep(-.2, 0., _pSpine2.y) * (1. - smoothstep(.02, .25, _pSpine2.y))) * .3
    );
    float dSpine2 = fOpPoSc(
        fDfRBoxt(fOpPrSc(_pSpine2, pSpine2Scale), vec3(.36, .38, .19), .1),
        pSpine2Scale
    );
    
    // --- neck
    
    vec3 pNeck = fOpTr(pSpine2, vec3(0., .2, .005));
    pNeck.yz = fOpRo(pNeck.yz, PI * (-.03 + neckRotation.x));
    float dNeck = fDfCaa(pNeck, vec3(0.), .04, .06);

    // --- head

    vec3 pHead = fOpTr(pNeck, vec3(0., .12, 0.));
    pHead.yz = fOpRo(pHead.yz, PI * -.05);

    vec3 _pHead1 = fOpTr(pHead, vec3(0., .035, .008));
    vec3 pHead1Scale = vec3(.95, .95, 1.1);
    _pHead1.yz = fOpRo(_pHead1.yz, PI * -.1);
    float dHead1 = fOpPoSc(
        fDfSp(fOpPrSc(_pHead1, pHead1Scale), .1),
        pHead1Scale
    );
    
    vec3 pHead2Scale = vec3(1.1, 1., 1.);
    vec3 _pHead2 = fOpTr(pHead, vec3(0., .025, .025));
    _pHead2.yz = fOpRo(_pHead2.yz, PI * .22);
    float dHead2 = fOpPoSc(
        // fDfRco(fOpPrSc(_pHead2, pHead2Scale), .09, .03, .04),
        fDfVes(fOpPrSc(_pHead2, pHead2Scale), vec3(0., -.13, 0.), vec3(.0, .1, 0.), .08),
        pHead2Scale
    );

    float dHead = fOpSm(
        dHead1,
        dHead2,
        .02
    );
    
    d = fOpSm(dPelvis, dSpine1, .05);
    d = fOpSm(d, dSpine2, .05);
    d = fOpSm(
        d,
        fOpSm(dNeck, dHead, .05),
        // dNeck,
        .02
    );
  
    humanObj.smHeadP = _pHead2;
    
    // left arm 
    d = fDfArm(
        d,
        pSpine2,
        -1.,
        leftShoulderRotation * vec3(1., 1., 1.),
        leftElbowRotation * vec3(-1., -1., -1.),
        leftWristRotation
    );
    // right arm
    d = fDfArm(
        d,
        pSpine2,
        1.,
        rightShoulderRotation * vec3(-1., -1., -1.),
        rightElbowRotation * vec3(1., 1., 1.),
        rightWristRotation
    );
    // left leg
    d = fdfLeg(
        d,
        pPelvis,
        -1.,
        leftHipRotation,
        leftKneeRotation
    );
    // right leg
    d = fdfLeg(
        d,
        pPelvis,
        1.,
        rightHipRotation,
        rightKneeRotation
    );

    // d = min(d, dLeftArm);
    // d = min(d, dRightArm);
    // d = min(d, dLeftLeg);
    // d = min(d, dRightLeg);
   
    // dummy head 
    // d = min(d, length(fOpTr(q, vec3(.2, 1.8, 0.))) - .1);

    // for debug
    // d = fDfBox(q, vec3(2.));
    // p.yz = fOpRo(p.yz, PI * .2);
    // d = fDfRcot(p, .05, .08, .8);
   
    humanObj.smDist = d;
    
    // return d;
    return humanObj;
}


float fDfHumanGiant(
    vec3 p,
    // ---   
    vec3 pelvisPosition,
    vec3 pelvisRotation,
    vec3 spine1Rotation,
    vec3 spine2Rotation,
    vec3 leftShoulderRotation,
    vec3 leftElbowRotation,
    vec3 rightShoulderRotation,
    vec3 rightElbowRotation,
    vec3 leftHipRotation,
    vec3 leftKneeRotation,
    vec3 rightHipRotation,
    vec3 rightKneeRotation,
    vec3 neckRotation,
    vec3 leftWristRotation,
    vec3 rightWristRotation
    // ---    
) {
    vec3 q = fOpTr(p, vec3(0., -1.5, 0.)); // boundsの高さの半分、地面の高さまで手動オフセット
    float d = 1e6;
    
    // - pelvis
    // vec3 pPelvis = fOpTr(q, vec3(0., 1.05, 0.));
    vec3 pPelvis = fOpTr(q, pelvisPosition);
    vec3 pr = vec3(0., 0., 0.);
    pPelvis.xz = fOpRo(pPelvis.xz, PI * -pelvisRotation.y);
    pPelvis.xy = fOpRo(pPelvis.xy, PI * -pelvisRotation.z);
    pPelvis.yz = fOpRo(pPelvis.yz, PI * pelvisRotation.x);
    // pShoulder.xz = fOpRo(pShoulder.xz, PI * axis * shoulderRot.y); // ひねり
    // pShoulder.xy = fOpRo(pShoulder.xy, PI * axis * shoulderRot.z); // 上下
    // pShoulder.yz = fOpRo(pShoulder.yz, -PI * shoulderRot.x); // 前後
    
    vec3 _pPelvis = pPelvis;
    // _pPelvis.xz *= 2.;
    float dPelvis = fDfRBoxt(_pPelvis, vec3(.34, .32, .18), .1);
    
    // -- spine01
    vec3 pSpine1 = fOpTr(pPelvis, vec3(0., .15, 0.));
    pSpine1.xy = fOpRo(pSpine1.xy, PI * -spine1Rotation.z);
    pSpine1.yz = fOpRo(pSpine1.yz, PI * -spine1Rotation.x);
    pSpine1.xz = fOpRo(pSpine1.xz, PI * -spine1Rotation.y);
    vec3 _pSpine1 = pSpine1;
    // _pSpine1.xz *= (1. + _pSpine1.y * .8);
    vec3 pSpine1Scale = vec3(.95, 1., .98);
    float dSpine1 = fOpPoSc(
        fDfRBoxt(
            fOpPrSc(_pSpine1, pSpine1Scale), vec3(.34, .39, .2), .1
        ),
        pSpine1Scale
    ); 

    // -- spine02
   
    // pSpine1.yz = fOpRo(pSpine1.yz, sin(uTime) * PI * .5);
    vec3 pSpine2 = fOpTr(pSpine1, vec3(0., .25, 0.));
    pSpine2.xy = fOpRo(pSpine2.xy, PI * -spine2Rotation.z);
    pSpine2.yz = fOpRo(pSpine2.yz, PI * -spine2Rotation.x);
    pSpine2.xz = fOpRo(pSpine2.xz, PI * -spine2Rotation.y);
    vec3 _pSpine2 = pSpine2;
    _pSpine2 = fOpTr(_pSpine2, vec3(0., .03, 0.));
    vec3 pSpine2Scale = vec3(
        1. + max(_pSpine2.y + .1, 0.) * 1.1,
        1.,
        // 1. + max(_pSpine2.y + .2 - 0., 0.) * .7
        1. + (smoothstep(-.2, 0., _pSpine2.y) * (1. - smoothstep(.02, .25, _pSpine2.y))) * .3
    );
    float dSpine2 = fOpPoSc(
        fDfRBoxt(fOpPrSc(_pSpine2, pSpine2Scale), vec3(.36, .38, .19), .1),
        pSpine2Scale
    );
    
    // --- neck
    
    vec3 pNeck = fOpTr(pSpine2, vec3(0., .2, .005));
    pNeck.yz = fOpRo(pNeck.yz, PI * (-.03 + neckRotation.x));
    float dNeck = fDfCaa(pNeck, vec3(0.), .04, .06);

    // --- head

    vec3 pHead = fOpTr(pNeck, vec3(0., .12, 0.));
    pHead.yz = fOpRo(pHead.yz, PI * -.05);

    vec3 _pHead1 = fOpTr(pHead, vec3(0., .035, .008));
    vec3 pHead1Scale = vec3(.95, .95, 1.1);
    _pHead1.yz = fOpRo(_pHead1.yz, PI * -.1);
    float dHead1 = fOpPoSc(
        fDfSp(fOpPrSc(_pHead1, pHead1Scale), .1),
        pHead1Scale
    );
    
    vec3 pHead2Scale = vec3(1.1, 1., 1.);
    vec3 _pHead2 = fOpTr(pHead, vec3(0., .025, .025));
    _pHead2.yz = fOpRo(_pHead2.yz, PI * .22);
    float dHead2 = fOpPoSc(
        // fDfRco(fOpPrSc(_pHead2, pHead2Scale), .09, .03, .04),
        fDfVes(fOpPrSc(_pHead2, pHead2Scale), vec3(0., -.13, 0.), vec3(.0, .1, 0.), .08),
        pHead2Scale
    );

    float dHead = fOpSm(
        dHead1,
        dHead2,
        .02
    );
    
    d = fOpSm(dPelvis, dSpine1, .05);
    d = fOpSm(d, dSpine2, .05);
    d = fOpSm(
        d,
        fOpSm(dNeck, dHead, .05),
        // dNeck,
        .02
    );
    
    // left arm 
    d = fDfArm(
        d,
        pSpine2,
        -1.,
        leftShoulderRotation * vec3(1., 1., 1.),
        leftElbowRotation * vec3(-1., -1., -1.),
        leftWristRotation
    );
    // right arm
    d = fDfArm(
        d,
        pSpine2,
        1.,
        rightShoulderRotation * vec3(-1., -1., -1.),
        rightElbowRotation * vec3(1., 1., 1.),
        rightWristRotation
    );

    return d;
}
