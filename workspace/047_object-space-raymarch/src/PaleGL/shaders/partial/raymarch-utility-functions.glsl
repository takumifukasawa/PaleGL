vec3 toLocal(vec3 p, mat4 WtoO, vec3 scale) {
    return (WtoO * vec4(p, 1.)).xyz * abs(scale);
}

float objectSpaceDfScene(vec3 worldPos, mat4 WtoO, vec3 scale) {
    return dfScene(toLocal(worldPos, WtoO, scale));
}

vec3 getNormalObjectSpaceDfScene(vec3 p, mat4 WtoO, vec3 scale) {
    const float eps = 0.0001;
    vec3 n = vec3(
        objectSpaceDfScene(p + vec3(eps, 0, 0), WtoO, scale) - objectSpaceDfScene(p + vec3(-eps, 0, 0), WtoO, scale),
        objectSpaceDfScene(p + vec3(0, eps, 0), WtoO, scale) - objectSpaceDfScene(p + vec3(0, -eps, 0), WtoO, scale),
        objectSpaceDfScene(p + vec3(0, 0, eps), WtoO, scale) - objectSpaceDfScene(p + vec3(0, 0, -eps), WtoO, scale)
    );
    return normalize(n);
}

bool isDfInnerBox(vec3 p, vec3 scale) {
    return
        // abs(p.x) < scale.x * .5 &&
        // abs(p.y) < scale.y * .5 &&
        // abs(p.z) < scale.z * .5;
        // TODO: 等値も含める必要があるっぽい？
        abs(p.x) <= scale.x * .5 &&
        abs(p.y) <= scale.y * .5 &&
        abs(p.z) <= scale.z * .5;
}
