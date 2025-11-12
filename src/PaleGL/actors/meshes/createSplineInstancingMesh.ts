import { Actor } from '@/PaleGL/actors/actor.ts';
import { UpdateActorFunc } from '@/PaleGL/actors/actorBehaviours.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { createInstancingParticle, InstancingParticleArgs } from '@/PaleGL/actors/particles/instancingParticle.ts';
import { MESH_TYPE_SPLINE_INSTANCING } from '@/PaleGL/constants.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { updateGeometryAttribute } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { copyVector3, v3x, v3y, v3z, Vector3 } from '@/PaleGL/math/vector3.ts';
import { sampleSplinePoints } from '@/PaleGL/utilities/splineUtilities.ts';

export type SplineInstancingMesh = Mesh & {
    splineInstancingData: {
        controlPoints: Vector3[];
        instanceSpacing: number;
        segmentSamples: number;
    };
    needsUpdateInstances: boolean;
};

type CreateSplineInstancingMeshArgs = Omit<InstancingParticleArgs, 'instanceCount' | 'makeDataPerInstanceFunction'> & {
    name?: string;
    gpu: Gpu;
    geometry: Geometry; // InstancingParticleだとgeometry必須なので
    controlPoints: Vector3[];
    instanceSpacing?: number;
    segmentSamples?: number;
};

// スプライン上の等間隔な位置とその方向を計算する
// 累積距離で「超えたら配置」だと不均等になるので、線形補間で正確な位置を算出
const calculateSplineInstances = (
    controlPoints: Vector3[],
    segmentSamples: number,
    instanceSpacing: number
): { positions: number[][]; rotations: number[][]; count: number } => {
    const splinePoints = sampleSplinePoints(controlPoints, segmentSamples);

    // スプライン全体の長さを計算
    const segmentDistances: number[] = [0]; // 各サンプル点までの累積距離
    let totalLength = 0;

    for (let i = 1; i < splinePoints.length; i++) {
        const prev = splinePoints[i - 1].position;
        const curr = splinePoints[i].position;
        const dx = v3x(curr) - v3x(prev);
        const dy = v3y(curr) - v3y(prev);
        const dz = v3z(curr) - v3z(prev);
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        totalLength += dist;
        segmentDistances.push(totalLength);
    }

    // 配置するインスタンス数を決定（0からtotalLengthまでinstanceSpacing間隔で配置）
    const instanceCount = Math.max(1, Math.floor(totalLength / instanceSpacing) + 1);

    const positions: number[][] = [];
    const rotations: number[][] = [];

    // 各インスタンスの理想的な配置距離（0.0, 0.3, 0.6, ...）に対して
    // スプライン上の対応する位置を線形補間で求める
    for (let i = 0; i < instanceCount; i++) {
        const targetDistance = i * instanceSpacing;

        // targetDistanceに最も近いセグメントを探す
        let segmentIndex = 0;
        for (let j = 0; j < segmentDistances.length - 1; j++) {
            if (segmentDistances[j] <= targetDistance && targetDistance <= segmentDistances[j + 1]) {
                segmentIndex = j;
                break;
            }
        }

        // セグメント内での補間率を計算
        const segmentStart = segmentDistances[segmentIndex];
        const segmentEnd = segmentDistances[segmentIndex + 1];
        const segmentLength = segmentEnd - segmentStart;
        const t = segmentLength > 0 ? (targetDistance - segmentStart) / segmentLength : 0;

        // 位置を線形補間
        const p0 = splinePoints[segmentIndex].position;
        const p1 = splinePoints[segmentIndex + 1].position;
        const px = v3x(p0) + (v3x(p1) - v3x(p0)) * t;
        const py = v3y(p0) + (v3y(p1) - v3y(p0)) * t;
        const pz = v3z(p0) + (v3z(p1) - v3z(p0)) * t;
        positions.push([px, py, pz]);

        // 接線方向も補間（正規化されてるはずなので単純に補間でOK）
        const tangent0 = splinePoints[segmentIndex].tangent;
        const tangent1 = splinePoints[segmentIndex + 1].tangent;
        const tx = v3x(tangent0) + (v3x(tangent1) - v3x(tangent0)) * t;
        const ty = v3y(tangent0) + (v3y(tangent1) - v3y(tangent0)) * t;
        const tz = v3z(tangent0) + (v3z(tangent1) - v3z(tangent0)) * t;

        // 接線方向からオイラー角を計算
        // ちゃんとやるなら回転行列からオイラー角に変換すべきだけど、
        // とりあえず簡易的にatanで近似
        const rotX = Math.atan2(ty, tz);
        const rotY = Math.atan2(tx, tz);
        const rotZ = 0; // とりあえず回転なし
        rotations.push([rotX, rotY, rotZ]);
    }

    return { positions, rotations, count: instanceCount };
};

export const createSplineInstancingMesh = (args: CreateSplineInstancingMeshArgs): SplineInstancingMesh => {
    const { controlPoints, instanceSpacing = 1.0, segmentSamples = 20 } = args;

    // スプライン上の等間隔な位置を計算
    const { positions, rotations, count } = calculateSplineInstances(controlPoints, segmentSamples, instanceSpacing);

    // InstancingParticleを使ってインスタンス属性を設定
    // こうすることで、マテリアル設定やインスタンス属性の管理を既存の仕組みに任せられる
    const instancingParticle = createInstancingParticle({
        ...args,
        instanceCount: count,
        makeDataPerInstanceFunction: (i) => ({
            position: positions[i],
            rotation: rotations[i],
            scale: [1, 1, 1],
        }),
    });

    const mesh = instancingParticle as SplineInstancingMesh;
    mesh.meshType = MESH_TYPE_SPLINE_INSTANCING;

    // スプライン制御点を保持しておいて、後で動的に変更できるようにする
    mesh.splineInstancingData = {
        controlPoints,
        instanceSpacing,
        segmentSamples,
    };
    mesh.needsUpdateInstances = false;

    return mesh;
};

export const setSplineInstancingMeshControlPoint = (
    mesh: SplineInstancingMesh,
    index: number,
    point: Vector3
): void => {
    copyVector3(mesh.splineInstancingData.controlPoints[index], point);
    mesh.needsUpdateInstances = true;
};

export const setSplineInstancingMeshControlPoints = (
    mesh: SplineInstancingMesh,
    updates: { index: number; point: Vector3 }[]
): void => {
    updates.forEach(({ index, point }) => {
        copyVector3(mesh.splineInstancingData.controlPoints[index], point);
    });
    mesh.needsUpdateInstances = true;
};

// 制御点が変わったときにインスタンス位置を再計算
const updateSplineInstancingMeshInstances = (mesh: SplineInstancingMesh): void => {
    const { controlPoints, segmentSamples, instanceSpacing } = mesh.splineInstancingData;

    const { positions, rotations, count } = calculateSplineInstances(controlPoints, segmentSamples, instanceSpacing);

    // インスタンス数が変わる可能性もあるので、念のため全部作り直す
    // TODO: 最適化するならインスタンス数が同じ場合は属性だけ更新する
    mesh.geometry.instanceCount = count;

    // インスタンス属性を更新
    // updateGeometryAttributeを使うことでVAOのバッファも自動で更新される
    updateGeometryAttribute(mesh.geometry, 'aInstancePosition', new Float32Array(positions.flat()));
    updateGeometryAttribute(mesh.geometry, 'aInstanceRotation', new Float32Array(rotations.flat()));
};

export const updateSplineInstancingMeshBehaviour: UpdateActorFunc = (actor: Actor) => {
    const mesh = actor as SplineInstancingMesh;
    if (mesh.needsUpdateInstances) {
        updateSplineInstancingMeshInstances(mesh);
        mesh.needsUpdateInstances = false;
    }
};
