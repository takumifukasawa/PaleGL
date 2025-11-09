import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createGeometry, Geometry } from '@/PaleGL/geometries/geometry.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { ATTRIBUTE_NAME_POSITION, ATTRIBUTE_NAME_UV, ATTRIBUTE_NAME_NORMAL, ATTRIBUTE_USAGE_TYPE_STATIC_DRAW, ATTRIBUTE_USAGE_TYPE_DYNAMIC_DRAW } from '@/PaleGL/constants.ts';
import { Vector3, addVector3AndVector3, scaleVector3ByScalar, normalizeVector3, cloneVector3, v3x, v3y, v3z } from '@/PaleGL/math/vector3.ts';
import { sampleSplinePoints } from '@/PaleGL/utilities/splineUtilities.ts';
import { updateGeometryAttribute } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { generateSplineCap } from '@/PaleGL/geometries/geometryHelpers.ts';

type CrossSection = { x: number; y: number }[];

type SplineMeshRawData = {
    positions: number[];
    normals: number[];
    uvs: number[];
    indices: number[];
    drawCount: number;
};

type SplineMeshGeometryArgs = {
    gpu: Gpu;
    controlPoints: Vector3[];
    crossSection: CrossSection;
    segmentSamples?: number;
    dynamic?: boolean;
    caps?: boolean;
};

const generateSplineMeshRawData = (
    controlPoints: Vector3[],
    crossSection: CrossSection,
    segmentSamples: number = 10,
    caps: boolean = true
): SplineMeshRawData => {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const splinePoints = sampleSplinePoints(controlPoints, segmentSamples);
    const crossSectionCount = crossSection.length;

    let vertexIndex = 0;

    if (caps && splinePoints.length > 0) {
        const firstPoint = splinePoints[0];
        const ringPositions: number[] = [];

        for (let j = 0; j < crossSectionCount; j++) {
            const cs = crossSection[j];
            const offsetNormal = scaleVector3ByScalar(cloneVector3(firstPoint.normal), cs.x);
            const offsetBinormal = scaleVector3ByScalar(cloneVector3(firstPoint.binormal), cs.y);
            const vertexPos = addVector3AndVector3(
                addVector3AndVector3(cloneVector3(firstPoint.position), offsetNormal),
                offsetBinormal
            );
            ringPositions.push(v3x(vertexPos), v3y(vertexPos), v3z(vertexPos));
        }

        generateSplineCap(
            positions,
            normals,
            uvs,
            indices,
            v3x(firstPoint.position),
            v3y(firstPoint.position),
            v3z(firstPoint.position),
            -v3x(firstPoint.tangent),
            -v3y(firstPoint.tangent),
            -v3z(firstPoint.tangent),
            ringPositions,
            vertexIndex,
            true
        );

        vertexIndex += 1 + crossSectionCount;
    }

    for (let i = 0; i < splinePoints.length; i++) {
        const { position, tangent, normal, binormal } = splinePoints[i];
        const v = i / (splinePoints.length - 1);

        for (let j = 0; j < crossSectionCount; j++) {
            const cs = crossSection[j];
            const u = j / (crossSectionCount - 1);

            const offsetNormal = scaleVector3ByScalar(cloneVector3(normal), cs.x);
            const offsetBinormal = scaleVector3ByScalar(cloneVector3(binormal), cs.y);
            const vertexPos = addVector3AndVector3(
                addVector3AndVector3(cloneVector3(position), offsetNormal),
                offsetBinormal
            );

            positions.push(v3x(vertexPos), v3y(vertexPos), v3z(vertexPos));

            const csNormal = normalizeVector3(
                addVector3AndVector3(
                    scaleVector3ByScalar(cloneVector3(normal), cs.x),
                    scaleVector3ByScalar(cloneVector3(binormal), cs.y)
                )
            );
            normals.push(v3x(csNormal), v3y(csNormal), v3z(csNormal));

            uvs.push(u, v);
        }
    }

    const tubeStartIndex = vertexIndex;
    vertexIndex += splinePoints.length * crossSectionCount;

    for (let i = 0; i < splinePoints.length - 1; i++) {
        for (let j = 0; j < crossSectionCount - 1; j++) {
            const a = tubeStartIndex + i * crossSectionCount + j;
            const b = a + crossSectionCount;
            const c = a + 1;
            const d = b + 1;

            indices.push(a, b, c);
            indices.push(c, b, d);
        }
    }

    if (caps && splinePoints.length > 0) {
        const lastPoint = splinePoints[splinePoints.length - 1];
        const ringPositions: number[] = [];

        for (let j = 0; j < crossSectionCount; j++) {
            const cs = crossSection[j];
            const offsetNormal = scaleVector3ByScalar(cloneVector3(lastPoint.normal), cs.x);
            const offsetBinormal = scaleVector3ByScalar(cloneVector3(lastPoint.binormal), cs.y);
            const vertexPos = addVector3AndVector3(
                addVector3AndVector3(cloneVector3(lastPoint.position), offsetNormal),
                offsetBinormal
            );
            ringPositions.push(v3x(vertexPos), v3y(vertexPos), v3z(vertexPos));
        }

        generateSplineCap(
            positions,
            normals,
            uvs,
            indices,
            v3x(lastPoint.position),
            v3y(lastPoint.position),
            v3z(lastPoint.position),
            v3x(lastPoint.tangent),
            v3y(lastPoint.tangent),
            v3z(lastPoint.tangent),
            ringPositions,
            vertexIndex,
            false
        );
    }

    return {
        positions,
        normals,
        uvs,
        indices,
        drawCount: indices.length,
    };
};

export const createSplineMeshGeometry = (args: SplineMeshGeometryArgs): Geometry => {
    const { gpu, controlPoints, crossSection, segmentSamples = 10, dynamic = false, caps = true } = args;

    const rawData = generateSplineMeshRawData(controlPoints, crossSection, segmentSamples, caps);

    const usageType = dynamic ? ATTRIBUTE_USAGE_TYPE_DYNAMIC_DRAW : ATTRIBUTE_USAGE_TYPE_STATIC_DRAW;

    const attributes = [
        createAttribute(ATTRIBUTE_NAME_POSITION, new Float32Array(rawData.positions), 3, 0, 0, usageType),
        createAttribute(ATTRIBUTE_NAME_UV, new Float32Array(rawData.uvs), 2, 0, 0, usageType),
        createAttribute(ATTRIBUTE_NAME_NORMAL, new Float32Array(rawData.normals), 3, 0, 0, usageType),
    ];

    const geometry = createGeometry({
        gpu,
        attributes,
        indices: rawData.indices,
        drawCount: rawData.drawCount,
    });

    return geometry;
};

export const updateSplineMeshGeometry = (
    geometry: Geometry,
    controlPoints: Vector3[],
    crossSection: CrossSection,
    segmentSamples: number = 10,
    caps: boolean = true
) => {
    const rawData = generateSplineMeshRawData(controlPoints, crossSection, segmentSamples, caps);

    updateGeometryAttribute(geometry, ATTRIBUTE_NAME_POSITION, new Float32Array(rawData.positions));
    updateGeometryAttribute(geometry, ATTRIBUTE_NAME_NORMAL, new Float32Array(rawData.normals));
    updateGeometryAttribute(geometry, ATTRIBUTE_NAME_UV, new Float32Array(rawData.uvs));
};
