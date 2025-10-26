
// 呼び出し側で記述必須
// #include <rand>

vec3 fCurlNoise(vec3 position) {
    float eps = .0001;
    float eps2 = 2. * eps;
    float invEps2 = 1. / eps2;
    vec3 dx = vec3(eps, 0., 0.);
    vec3 dy = vec3(0., eps, 0.);
    vec3 dz = vec3(0., 0., eps);
    // 勾配検出のためにepsだけずらした地点のnoiseを参照
    vec3 px0 = fSnoise3(position - dx);
    vec3 px1 = fSnoise3(position + dx);
    vec3 py0 = fSnoise3(position - dy);
    vec3 py1 = fSnoise3(position + dy);
    vec3 pz0 = fSnoise3(position - dz);
    vec3 pz1 = fSnoise3(position + dz);
    // 回転
    float x = (py1.z - py0.z) - (pz1.y - pz0.y);
    float y = (pz1.x - pz0.x) - (px1.z - px0.z);
    float z = (px1.y - px0.y) - (py1.x - py0.x);
    return vec3(x, y, z) * invEps2;
}
