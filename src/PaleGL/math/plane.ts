import {
    addVector3Array,
    cloneVector3,
    dotVector3,
    scaleVector3ByScalar,
    subVector3AndVector3,
    Vector3,
} from '@/PaleGL/math/vector3.ts';
import { Ray } from '@/PaleGL/math/ray.ts';

export type Plane = ReturnType<typeof createPlane>;

export function createPlane(point: Vector3, normal: Vector3) {
    return {
        point,
        normal,
    };
}

export function intersectRayWithPlane(ray: Ray, plane: Plane): Vector3 | null {
    const rayOrigin = ray.origin;
    const rayDir = ray.dir;

    // 平面の法線とレイの方向ベクトルとの内積を計算
    const dotProduct = dotVector3(ray.dir, plane.normal);

    // 内積が0に近い場合、レイは平面と平行であり交差しない
    if (Math.abs(dotProduct) < 0.0001) {
        return null; // 交差しない
    }

    // rayの原点から平面上の点へのベクトルを計算
    const vectorFromRayOriginToPlanePoint = subVector3AndVector3(cloneVector3(plane.point), rayOrigin);

    // 平面までの距離
    const distanceToPlane = dotVector3(vectorFromRayOriginToPlanePoint, plane.normal) / dotProduct;

    // 距離が負の場合、レイは平面の背後から始まる
    if (distanceToPlane < 0) {
        return null; // 視点の後ろなので交差しない
    }

    const dirToPlaneIntersection = scaleVector3ByScalar(cloneVector3(rayDir), distanceToPlane);
    return addVector3Array(rayOrigin, dirToPlaneIntersection);
}
