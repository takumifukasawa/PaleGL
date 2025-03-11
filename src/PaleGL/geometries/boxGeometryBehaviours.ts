import { createVector3, lerpVector3, Vector3 } from '@/PaleGL/math/Vector3.ts';
import { easeInOutQuad } from '@/PaleGL/utilities/easingUtilities.ts';
import { BoxGeometry, boxGeometryEdgePairs, boxGeometrySurfacePairs } from '@/PaleGL/geometries/boxGeometry.ts';

export const getBoxGeometryRandomLocalPositionOnEdge = (
    geometry: BoxGeometry,
    rand1: number,
    rand2: number
): Vector3 => {
    const edgePairs = boxGeometryEdgePairs;
    const edgePair = edgePairs[Math.floor((rand1 * edgePairs.length) % edgePairs.length)];
    const p0 = geometry.cornerPositions[edgePair[0]];
    const p1 = geometry.cornerPositions[edgePair[1]];
    const t = 1 - easeInOutQuad(rand2 % 1);
    return lerpVector3(createVector3(p0[0], p0[1], p0[2]), createVector3(p1[0], p1[1], p1[2]), t);
};

export const getBoxGeometryRandomLocalPositionOnSurface = (
    geometry: BoxGeometry,
    index: number,
    rand2: number,
    rand3: number
): Vector3 => {
    const surfacePairs = boxGeometrySurfacePairs;
    const surfacePair = surfacePairs[Math.floor(index % surfacePairs.length)];
    const p0 = geometry.cornerPositions[surfacePair[0]];
    const p1 = geometry.cornerPositions[surfacePair[1]];
    const p2 = geometry.cornerPositions[surfacePair[2]];
    const p3 = geometry.cornerPositions[surfacePair[3]];
    const v1 = lerpVector3(createVector3(p0[0], p0[1], p0[2]), createVector3(p1[0], p1[1], p1[2]), rand2);
    const v2 = lerpVector3(createVector3(p2[0], p2[1], p2[2]), createVector3(p3[0], p3[1], p3[2]), rand2);
    return lerpVector3(v1, v2, rand3);
};
