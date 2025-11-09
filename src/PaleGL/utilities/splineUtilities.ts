import { Vector3, createVector3, addVector3AndVector3, scaleVector3ByScalar, normalizeVector3, crossVectorsV3, getVector3Magnitude, cloneVector3, subVectorsV3 } from '@/PaleGL/math/vector3.ts';

type SplinePoint = {
    position: Vector3;
    tangent: Vector3;
    normal: Vector3;
    binormal: Vector3;
};

export const evaluateCatmullRomSpline = (
    t: number,
    p0: Vector3,
    p1: Vector3,
    p2: Vector3,
    p3: Vector3
): Vector3 => {
    const t2 = t * t;
    const t3 = t2 * t;
    const v0 = scaleVector3ByScalar(cloneVector3(p1), 2);
    const v1 = scaleVector3ByScalar(
        addVector3AndVector3(scaleVector3ByScalar(cloneVector3(p0), -1), cloneVector3(p2)),
        t
    );
    const v2 = scaleVector3ByScalar(
        addVector3AndVector3(
            addVector3AndVector3(
                scaleVector3ByScalar(cloneVector3(p0), 2),
                scaleVector3ByScalar(cloneVector3(p1), -5)
            ),
            addVector3AndVector3(
                scaleVector3ByScalar(cloneVector3(p2), 4),
                scaleVector3ByScalar(cloneVector3(p3), -1)
            )
        ),
        t2
    );
    const v3 = scaleVector3ByScalar(
        addVector3AndVector3(
            addVector3AndVector3(
                scaleVector3ByScalar(cloneVector3(p0), -1),
                scaleVector3ByScalar(cloneVector3(p1), 3)
            ),
            addVector3AndVector3(
                scaleVector3ByScalar(cloneVector3(p2), -3),
                cloneVector3(p3)
            )
        ),
        t3
    );

    return scaleVector3ByScalar(
        addVector3AndVector3(addVector3AndVector3(v0, v1), addVector3AndVector3(v2, v3)),
        0.5
    );
};

export const getCatmullRomSplineTangent = (
    t: number,
    p0: Vector3,
    p1: Vector3,
    p2: Vector3,
    p3: Vector3
): Vector3 => {
    const t2 = t * t;
    const v0 = addVector3AndVector3(
        scaleVector3ByScalar(cloneVector3(p0), -1),
        cloneVector3(p2)
    );
    const v1 = scaleVector3ByScalar(
        addVector3AndVector3(
            addVector3AndVector3(
                scaleVector3ByScalar(cloneVector3(p0), 2),
                scaleVector3ByScalar(cloneVector3(p1), -5)
            ),
            addVector3AndVector3(
                scaleVector3ByScalar(cloneVector3(p2), 4),
                scaleVector3ByScalar(cloneVector3(p3), -1)
            )
        ),
        2 * t
    );
    const v2 = scaleVector3ByScalar(
        addVector3AndVector3(
            addVector3AndVector3(
                scaleVector3ByScalar(cloneVector3(p0), -1),
                scaleVector3ByScalar(cloneVector3(p1), 3)
            ),
            addVector3AndVector3(
                scaleVector3ByScalar(cloneVector3(p2), -3),
                cloneVector3(p3)
            )
        ),
        3 * t2
    );

    return normalizeVector3(
        scaleVector3ByScalar(addVector3AndVector3(addVector3AndVector3(v0, v1), v2), 0.5)
    );
};

export const getFrenetFrame = (tangent: Vector3, upHint: Vector3 = createVector3(0, 1, 0)): { normal: Vector3; binormal: Vector3 } => {
    let binormal = crossVectorsV3(upHint, tangent);

    if (getVector3Magnitude(binormal) < 0.01) {
        binormal = crossVectorsV3(createVector3(1, 0, 0), tangent);
        if (getVector3Magnitude(binormal) < 0.01) {
            binormal = crossVectorsV3(createVector3(0, 0, 1), tangent);
        }
    }

    binormal = normalizeVector3(binormal);
    const normal = normalizeVector3(crossVectorsV3(tangent, binormal));
    return { normal, binormal };
};

export const sampleSplinePoints = (
    controlPoints: Vector3[],
    segmentSamples: number = 10
): SplinePoint[] => {
    const points: SplinePoint[] = [];

    if (controlPoints.length < 2) return points;

    const segments = controlPoints.length - 1;

    for (let i = 0; i < segments; i++) {
        const p1 = controlPoints[i];
        const p2 = controlPoints[i + 1];

        const p0 = i > 0
            ? controlPoints[i - 1]
            : subVectorsV3(scaleVector3ByScalar(cloneVector3(p1), 2), p2);

        const p3 = i + 2 < controlPoints.length
            ? controlPoints[i + 2]
            : subVectorsV3(scaleVector3ByScalar(cloneVector3(p2), 2), p1);

        if (i === 0) {
            console.log('[Spline Debug] Control points for segment 0:', {
                p0: [p0[0], p0[1], p0[2]],
                p1: [p1[0], p1[1], p1[2]],
                p2: [p2[0], p2[1], p2[2]],
                p3: [p3[0], p3[1], p3[2]],
            });
        }

        const samples = i === segments - 1 ? segmentSamples + 1 : segmentSamples;

        for (let j = 0; j < samples; j++) {
            const t = j / segmentSamples;
            const position = evaluateCatmullRomSpline(t, p0, p1, p2, p3);
            const tangent = getCatmullRomSplineTangent(t, p0, p1, p2, p3);
            const { normal, binormal } = getFrenetFrame(tangent);

            if (i === 0 && j < 3) {
                console.log(`[Spline Debug] Sample ${j} (t=${t}):`, {
                    position: [position[0], position[1], position[2]],
                    tangent: [tangent[0], tangent[1], tangent[2]],
                });
            }

            points.push({ position, tangent, normal, binormal });
        }
    }

    return points;
};
