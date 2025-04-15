import {
    MarionetterAnimationClipKeyframe,
    MarionetterCurveKeyframe,
    MarionetterCurveKeyframeProperty,
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
        k0[MarionetterCurveKeyframeProperty.outTangent] *
        (k1[MarionetterCurveKeyframeProperty.time] - k0[MarionetterCurveKeyframeProperty.time]);
    const r1 =
        k1[MarionetterCurveKeyframeProperty.inTangent] *
        (k1[MarionetterCurveKeyframeProperty.time] - k0[MarionetterCurveKeyframeProperty.time]);

    return (
        h00 * k0[MarionetterCurveKeyframeProperty.value] +
        h10 * r0 +
        h01 * k1[MarionetterCurveKeyframeProperty.value] +
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
        (t - k0[MarionetterCurveKeyframeProperty.time]) /
        (k1[MarionetterCurveKeyframeProperty.time] - k0[MarionetterCurveKeyframeProperty.time]);
    return curveUtilityEvaluateRaw(rt, k0, k1);
}

export function buildKeyframe(keyframe: MarionetterAnimationClipKeyframe): MarionetterCurveKeyframe {
    return {
        [MarionetterCurveKeyframeProperty.time]: keyframe[0],
        [MarionetterCurveKeyframeProperty.value]: keyframe[1],
        [MarionetterCurveKeyframeProperty.inTangent]: keyframe[2],
        [MarionetterCurveKeyframeProperty.outTangent]: keyframe[3],
        // TGODO: うまいことまとめたい
        ["time"]: keyframe[0],
        ["value"]: keyframe[1],
        ["inTangent"]: keyframe[2],
        ["outTangent"]: keyframe[3],
        // shorten
        ["t"]: keyframe[0],
        ["v"]: keyframe[1],
        ["i"]: keyframe[2],
        ["o"]: keyframe[3],
    };
}

/**
 *
 * @param t
 * @param keys
 */
export function curveUtilityEvaluateCurve(t: number, keys: MarionetterAnimationClipKeyframe[]): number {
    // TODO: infinite前提の場合はt自体をclampしてもよいかもしれない

    const firstK = buildKeyframe(keys[0]);
    const lastK = buildKeyframe(keys[keys.length - 1]);
    
    // const keys = curve.keys;

    if (keys.length === 0) {
        console.error('[curveUtilityEvaluateCurve] curve.keys.Length == 0');
        return 0;
    }

    if (keys.length === 1) {
        return firstK[MarionetterCurveKeyframeProperty.value];
    }

    if (t < firstK.t) {
        return firstK[MarionetterCurveKeyframeProperty.value];
    }

    if (t >= lastK.t) {
        return lastK[MarionetterCurveKeyframeProperty.value];
    }

    // TODO: keyframeが多いとループ数が増えるのでtimeをbinarysearchかけるとよい
    for (let i = 0; i < keys.length - 1; i++) {
        const k0 = buildKeyframe(keys[i]);
        const k1 = buildKeyframe(keys[i + 1]);
        const k0t = k0[MarionetterCurveKeyframeProperty.time];
        const k1t = k1[MarionetterCurveKeyframeProperty.time];
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
