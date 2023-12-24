vec3 toLocal(vec3 p, mat4 WtoO, vec3 scale) {
    // return (WtoO * vec4(p, 1.)).xyz * abs(scale);
    return (WtoO * vec4(p, 1.)).xyz * scale;
}

float objectSpaceDfScene(vec3 worldPos, mat4 WtoO, vec3 scale) {
    return dfScene(toLocal(worldPos, WtoO, scale));
}

vec3 getNormalObjectSpaceDfScene(vec3 p, mat4 WtoO, vec3 scale) {
    const float eps = .0001;
    vec3 n = vec3(
        objectSpaceDfScene(p + vec3(eps, 0, 0), WtoO, scale) - objectSpaceDfScene(p + vec3(-eps, 0, 0), WtoO, scale),
        objectSpaceDfScene(p + vec3(0, eps, 0), WtoO, scale) - objectSpaceDfScene(p + vec3(0, -eps, 0), WtoO, scale),
        objectSpaceDfScene(p + vec3(0, 0, eps), WtoO, scale) - objectSpaceDfScene(p + vec3(0, 0, -eps), WtoO, scale)
    );
    return normalize(n);
}

vec3 getNormalDfScene(vec3 p) {
const float eps = .0001;
    vec3 n = vec3(
        dfScene(p + vec3(eps, 0, 0)) - dfScene(p + vec3(-eps, 0, 0)),
        dfScene(p + vec3(0, eps, 0)) - dfScene(p + vec3(0, -eps, 0)),
        dfScene(p + vec3(0, 0, eps)) - dfScene(p + vec3(0, 0, -eps))
    );
    return normalize(n);
    
}

bool isDfInnerBox(vec3 p, vec3 scale) {
    // 0 だとマッハバンドっぽい境目が出るのでちょっと余裕を持たせる
    const float eps = .0001;
    return
        abs(p.x) < scale.x * .5 + eps &&
        abs(p.y) < scale.y * .5 + eps &&
        abs(p.z) < scale.z * .5 + eps;
}
