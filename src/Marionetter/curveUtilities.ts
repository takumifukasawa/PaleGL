import {
    MARIONETTER_CLIP_POST_EXTRAPORATION_MODE,
    MARIONETTER_CURVE_KEYFRAME_PROPERTY_IN_TANGENT,
    MARIONETTER_CURVE_KEYFRAME_PROPERTY_OUT_TANGENT,
    MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME,
    MARIONETTER_CURVE_KEYFRAME_PROPERTY_VALUE,
    MarionetterAnimationClipKeyframe,
    MarionetterCurveKeyframe,
} from '@/Marionetter/types';

/**
 *
 * @param t
 * @param k0
 * @param k1
 */
function curveUtilityEvaluateRaw(t: number, k0: MarionetterCurveKeyframe, k1: MarionetterCurveKeyframe) {
    // tmp
    // // p(t) = (2t^3 - 3t^2 + 1)p0 + (t^3 - 2t^2 + t)m0 + (-2t^3 + 3t^2)p1 + (t^3 - t^2)m1;
    // const dt = k1.t - k0.t;
    // const m0 = k0.o * dt;
    // const m1 = k1.i * dt;
    // const t2 = t * t;
    // const t3 = t2 * t;
    // const a = 2 * t3 - 3 * t2 + 1;
    // const b = t3 - 2 * t2 + t;
    // const c = t3 - t2;
    // const d = -2 * t3 + 3 * t2;
    // return a * k0.v + b * m0 + c * m1 + d * k1.v;

    const t2 = t * t;
    const t3 = t2 * t;

    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    const r0 =
        k0[MARIONETTER_CURVE_KEYFRAME_PROPERTY_OUT_TANGENT] *
        (k1[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME] - k0[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME]);
    const r1 =
        k1[MARIONETTER_CURVE_KEYFRAME_PROPERTY_IN_TANGENT] *
        (k1[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME] - k0[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME]);

    return (
        h00 * k0[MARIONETTER_CURVE_KEYFRAME_PROPERTY_VALUE] +
        h10 * r0 +
        h01 * k1[MARIONETTER_CURVE_KEYFRAME_PROPERTY_VALUE] +
        h11 * r1
    );
}

/**
 *
 * @param t
 * @param k0
 * @param k1
 */
function curveUtilityEvaluate(t: number, k0: MarionetterCurveKeyframe, k1: MarionetterCurveKeyframe) {
    // const rt = Mathf.InverseLerp(k0.time, k1.time, t);
    const rt =
        (t - k0[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME]) /
        (k1[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME] - k0[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME]);
    return curveUtilityEvaluateRaw(rt, k0, k1);
}

export function buildKeyframe(keyframe: MarionetterAnimationClipKeyframe): MarionetterCurveKeyframe {
    const [v0 = 0, v1 = 0, v2 = 0, v3 = 0] = keyframe;
    return {
        // // // TODO: うまいことproperty名をまとめられるはず
        // ['time']: keyframe[0],
        // ['value']: keyframe[1],
        // ['inTangent']: keyframe[2],
        // ['outTangent']: keyframe[3],
        // // shorten
        // ['t']: keyframe[0],
        // ['v']: keyframe[1],
        // ['i']: keyframe[2],
        // ['o']: keyframe[3],
        // // TODO: うまいことproperty名をまとめられるはず
        ['time']: v0,
        ['value']: v1,
        ['inTangent']: v2,
        ['outTangent']: v3,
        // shorten
        ['t']: v0,
        ['v']: v1,
        ['i']: v2,
        ['o']: v3,
    } as MarionetterCurveKeyframe;
}

export function curveUtilityEvaluateCurve(
    t: number, // local t
    duration: number,
    keys: MarionetterAnimationClipKeyframe[],
    postExtrapolation: MARIONETTER_CLIP_POST_EXTRAPORATION_MODE
): number {
    // TODO: infinite前提の場合はt自体をclampしてもよいかもしれない

    const firstK = buildKeyframe(keys[0]);
    const lastK = buildKeyframe(keys[keys.length - 1]);

    // for debug
    // console.log(`[curveUtilityEvaluateCurve] debug - keys.length: ${keys.length}, firstK.v: ${firstK["v"]}, lastK.v: ${lastK["v"]}, t: ${t}`, keys, firstK, lastK, MARIONETTER_CURVE_KEYFRAME_PROPERTY_VALUE);

    // そもそもkeyがなかったら何かがおかしい. 何もしない
    if (keys.length === 0) {
        console.error('[curveUtilityEvaluateCurve] curve.keys.Length == 0');
        return 0;
    }

    // keyが1個のときは最初のkeyをそのまま返す
    if (keys.length === 1) {
        return firstK[MARIONETTER_CURVE_KEYFRAME_PROPERTY_VALUE];
    }

    // tが最初のkeyよりも小さい場合は最初のkeyを使う
    if (t < firstK[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME]) {
        return firstK[MARIONETTER_CURVE_KEYFRAME_PROPERTY_VALUE];
    }

    if (t >= lastK[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME]) {
        return lastK[MARIONETTER_CURVE_KEYFRAME_PROPERTY_VALUE];
    }

    // // clip が最後のkeyを越していたとき
    // if (t >= lastK[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME]) {
    //     if (postExtrapolation === MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_HOLD) {
    //         // 最後の状態で止める（hold clip）
    //         t = lastK[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME] - 0.001; // 絶妙にoffset
    //     } else if (postExtrapolation === MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_LOOP) {
    //         // クリップ内でループ
    //         t = t % lastK[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME];
    //     } else {
    //         // デフォルト
    //         // 最後の状態で止める
    //         return lastK[MARIONETTER_CURVE_KEYFRAME_PROPERTY_VALUE];
    //     }
    // }

    // TODO: keyframeが多いとループ数が増えるのでtimeをbinarysearchかけるとよい
    for (let i = 0; i < keys.length - 1; i++) {
        const k0 = buildKeyframe(keys[i]);
        const k1 = buildKeyframe(keys[i + 1]);
        const k0t = k0[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME];
        const k1t = k1[MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME];
        if (k0t <= t && t < k1t) {
            // for debug
            //Debug.Log($"time: {t}, k0.time: {k0.time}");
            //Debug.Log($"{i} -> {i + 1}");
            return curveUtilityEvaluate(t, k0, k1);
        }
    }

    console.error(`[curveUtilityEvaluateCurve] invalid curve or time. t: ${t}`);
    return 0;
}
