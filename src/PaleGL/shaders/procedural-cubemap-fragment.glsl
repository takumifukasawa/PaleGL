#pragma DEFINES

in vec2 vUv;

out vec4 outColor;

uniform int uFaceIndex;

// ubCommonのみ定義（他のuniform blockは不要）
layout (std140) uniform ubCommon {
    float uTime;
    float uDeltaTime;
    vec4 uViewport;
};

// UV座標とface indexから3D方向ベクトルを計算
vec3 getCubemapDirection(vec2 uv, int faceIndex) {
    // UV を [-1, 1] 範囲に変換
    vec2 coord = uv * 2.0 - 1.0;

    vec3 dir;

    // face index に応じて方向を計算
    if (faceIndex == 0) {
        // Positive X
        dir = vec3(1.0, -coord.y, -coord.x);
    } else if (faceIndex == 1) {
        // Negative X
        dir = vec3(-1.0, -coord.y, coord.x);
    } else if (faceIndex == 2) {
        // Positive Y
        dir = vec3(coord.x, 1.0, coord.y);
    } else if (faceIndex == 3) {
        // Negative Y
        dir = vec3(coord.x, -1.0, -coord.y);
    } else if (faceIndex == 4) {
        // Positive Z
        dir = vec3(coord.x, -coord.y, 1.0);
    } else {
        // Negative Z (faceIndex == 5)
        dir = vec3(-coord.x, -coord.y, -1.0);
    }

    return normalize(dir);
}

void main() {
    vec3 dir = getCubemapDirection(vUv, uFaceIndex);

    // プロシージャル生成: 方向ベクトルを色に変換（シンプルなグラデーション）
    vec3 color = normalize(dir) * 0.5 + 0.5;

    // 時間による色相回転
    float hueShift = uTime * 0.1; // 回転速度
    float c = cos(hueShift);
    float s = sin(hueShift);
    // 簡易的な色相回転（RGB空間での回転）
    mat3 hueRotation = mat3(
        c + (1.0 - c) / 3.0, (1.0 - c) / 3.0 - s * 0.577, (1.0 - c) / 3.0 + s * 0.577,
        (1.0 - c) / 3.0 + s * 0.577, c + (1.0 - c) / 3.0, (1.0 - c) / 3.0 - s * 0.577,
        (1.0 - c) / 3.0 - s * 0.577, (1.0 - c) / 3.0 + s * 0.577, c + (1.0 - c) / 3.0
    );
    color = hueRotation * color;
    
    outColor = vec4(color, 1.0);
}
