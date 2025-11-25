import { Actor } from '@/PaleGL/actors/actor.ts';
import { UpdateActorFunc } from '@/PaleGL/actors/actorBehaviours.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { createInstancingParticle, InstancingParticleArgs } from '@/PaleGL/actors/particles/instancingParticle.ts';
import {
    ATTRIBUTE_NAME_INSTANCE_POSITION,
    ATTRIBUTE_NAME_INSTANCE_ROTATION,
    MESH_TYPE_SPLINE_INSTANCING,
} from '@/PaleGL/constants.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { updateGeometryAttribute } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { createLookAtMatrix } from '@/PaleGL/math/matrix4.ts';
import { rotationMatrixToQuaternion, toEulerRadianFromQuaternion } from '@/PaleGL/math/quaternion.ts';
import {
    cloneVector3,
    copyVector3,
    createVector3,
    createVector3Up,
    crossVectorsV3,
    dotVector3,
    normalizeVector3,
    v3x,
    v3y,
    v3z,
    Vector3,
} from '@/PaleGL/math/vector3.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { sampleSplinePoints } from '@/PaleGL/utilities/splineUtilities.ts';

export type SplineInstancingMesh = Mesh & {
    splineInstancingData: {
        controlPoints: Vector3[];
        instanceSpacing: number;
        segmentSamples: number;
        maxInstanceCount?: number;
        drawCount?: number;
    };
    needsUpdateInstances: boolean;
};



export type SplineInstancingMeshArgsOptions = {
    instanceSpacing?: number;
    segmentSamples?: number;
    maxInstanceCount?: number;
    drawCount?: number;
}

export type SplineInstancingMeshArgs = Omit<
    InstancingParticleArgs,
    'instanceCount' | 'makeDataPerInstanceFunction'
> & {
    name?: string;
    gpu: Gpu;
    geometry: Geometry; // InstancingParticleだとgeometry必須なので
    controlPoints: Vector3[];
    // instanceSpacing?: number;
    // segmentSamples?: number;
    // maxInstanceCount?: number;
    // drawCount?: number;
} & SplineInstancingMeshArgsOptions;

export const createSplineInitialControlPoints = (n: number) => {
    const controlPointsRef: Vector3[] = [];
    const controlsPoints = maton
        .range(n)
        .map((_, i) => {
            // 最初meshをつくるために適当に飛ばす
            const v = createVector3(i * 10, 0, 0);
            controlPointsRef[i] = cloneVector3(v);
            return v;
        })
        .flat();

    return [controlsPoints, controlPointsRef];
};

// スプライン上の等間隔な位置とその方向を計算する
// 累積距離で「超えたら配置」だと不均等になるので、線形補間で正確な位置を算出
const calculateSplineInstances = (
    controlPoints: Vector3[],
    segmentSamples: number,
    instanceSpacing: number,
    maxInstanceCount?: number
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
    let instanceCount = Math.max(1, Math.floor(totalLength / instanceSpacing) + 1);

    // maxInstanceCount が指定されている場合、それを超えないように制限
    if (maxInstanceCount !== undefined) {
        instanceCount = Math.min(instanceCount, maxInstanceCount);
    }

    const positions: number[][] = [];
    const rotations: number[][] = [];

    // 前フレームのrightを保持
    let prevRight: Vector3 | null = null;

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

        // 接線方向から回転ベクトルを作成
        const tangentInterpolated = createVector3(tx, ty, tz);
        const forward = normalizeVector3(cloneVector3(tangentInterpolated));

        // Rotation Minimizing Frame アルゴリズムでrightを計算
        let right: Vector3;

        if (prevRight === null) {
            // 最初のインスタンス: 初期rightを設定
            const worldUp = createVector3Up();
            const dotUp = Math.abs(v3y(forward));

            if (dotUp > 0.99) {
                right = normalizeVector3(crossVectorsV3(forward, createVector3(0, 0, 1)));
            } else {
                right = normalizeVector3(crossVectorsV3(forward, worldUp));
            }
        } else {
            // 2個目以降: prevRightをforwardに垂直な平面上に射影
            // Gram-Schmidt直交化により、滑らかな変化を実現
            const dot = dotVector3(prevRight, forward);
            const perpX = v3x(prevRight) - dot * v3x(forward);
            const perpY = v3y(prevRight) - dot * v3y(forward);
            const perpZ = v3z(prevRight) - dot * v3z(forward);

            const length = Math.sqrt(perpX * perpX + perpY * perpY + perpZ * perpZ);

            if (length > 0.001) {
                right = createVector3(perpX / length, perpY / length, perpZ / length);
            } else {
                // 例外: forwardが急激に変化した場合
                const worldUp = createVector3Up();
                right = normalizeVector3(crossVectorsV3(forward, worldUp));
            }
        }

        // createLookAtMatrix を使って回転行列を生成
        // eye: 現在の位置
        // center: forward方向を向く点
        // up: 上方向（ワールドのY軸）
        const eye = createVector3(px, py, pz);
        const center = createVector3(px + v3x(forward), py + v3y(forward), pz + v3z(forward));
        const up = createVector3Up();

        // lookAt行列を生成（inverseForward=false: カメラではなくオブジェクトの向き）
        const lookAtMat = createLookAtMatrix(eye, center, up, false);

        // lookAt行列からクォータニオンに変換し、euler radians を取得
        const quat = rotationMatrixToQuaternion(lookAtMat);
        const euler = toEulerRadianFromQuaternion(quat);

        rotations.push([euler.x, euler.y, euler.z]);

        // 次のループ用に保存
        prevRight = right;
    }

    return { positions, rotations, count: instanceCount };
};

export const createSplineInstancingMesh = (args: SplineInstancingMeshArgs): SplineInstancingMesh => {
    const { controlPoints, instanceSpacing = 1.0, segmentSamples = 20, maxInstanceCount, drawCount } = args;

    const { positions, rotations, count } = calculateSplineInstances(
        controlPoints,
        segmentSamples,
        instanceSpacing,
        maxInstanceCount
    );

    const actualDrawCount = drawCount ?? count;

    const instancingParticle = createInstancingParticle({
        ...args,
        instanceCount: actualDrawCount,
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
        maxInstanceCount,
        drawCount,
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
    const { controlPoints, segmentSamples, instanceSpacing, maxInstanceCount, drawCount } = mesh.splineInstancingData;

    const { positions, rotations, count } = calculateSplineInstances(
        controlPoints,
        segmentSamples,
        instanceSpacing,
        maxInstanceCount
    );

    // インスタンス数が変わる可能性もあるので、念のため全部作り直す
    // TODO: 最適化するならインスタンス数が同じ場合は属性だけ更新する
    mesh.geometry.instanceCount = drawCount ?? count;

    // インスタンス属性を更新
    // updateGeometryAttributeを使うことでVAOのバッファも自動で更新される
    updateGeometryAttribute(mesh.geometry, ATTRIBUTE_NAME_INSTANCE_POSITION, new Float32Array(positions.flat()));
    updateGeometryAttribute(mesh.geometry, ATTRIBUTE_NAME_INSTANCE_ROTATION, new Float32Array(rotations.flat()));
};

export const setSplineInstancingMeshDrawCount = (mesh: SplineInstancingMesh, drawCount: number): void => {
    mesh.splineInstancingData.drawCount = drawCount;
    mesh.geometry.instanceCount = drawCount;
};

export const updateSplineInstancingMeshBehaviour: UpdateActorFunc = (actor: Actor) => {
    const mesh = actor as SplineInstancingMesh;
    if (mesh.needsUpdateInstances) {
        updateSplineInstancingMeshInstances(mesh);
        mesh.needsUpdateInstances = false;
    }
};
