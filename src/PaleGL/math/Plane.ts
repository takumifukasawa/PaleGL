import {Vector3} from '@/PaleGL/math/Vector3.ts';
import {Ray} from "@/PaleGL/math/Ray.ts";

/**
 * 
 */
export class Plane {
    point: Vector3;
    normal: Vector3;

    constructor(point: Vector3, normal: Vector3) {
        this.point = point;
        this.normal = normal;
    }
}

/**
 *
 * @param ray
 * @param plane
 */
export function intersectRayWithPlane(ray: Ray, plane: Plane): Vector3 | null {
    const rayOrigin = ray.origin;
    const rayDir = ray.dir;
    
    // 平面の法線とレイの方向ベクトルとの内積を計算
    const dotProduct = Vector3.dot(ray.dir, plane.normal);

    // 内積が0に近い場合、レイは平面と平行であり交差しない
    if(Math.abs(dotProduct) < 0.0001) {
        return null; // 交差しない
    }
    
    // rayの原点から平面上の点へのベクトルを計算
    const vectorFromRayOriginToPlanePoint = plane.point.clone().subVector(rayOrigin);

    // 平面までの距離
    const distanceToPlane = Vector3.dot(vectorFromRayOriginToPlanePoint, plane.normal) / dotProduct;

    // 距離が負の場合、レイは平面の背後から始まる
    if(distanceToPlane < 0) {
        return null; // 視点の後ろなので交差しない
    }

    const dirToPlaneIntersection = rayDir.clone().scale(distanceToPlane);
    return Vector3.addVectors(rayOrigin, dirToPlaneIntersection);
}
