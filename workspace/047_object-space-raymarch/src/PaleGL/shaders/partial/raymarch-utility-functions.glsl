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

mat3 getCameraRayCoordinate(vec3 origin, vec3 lookAt, vec3 up) {
    vec3 forward = normalize(lookAt - origin);
    vec3 right = cross(forward, up);
    vec3 up = cross(right, forward);
    return mat3(right, up, forward);
}

// aspect ... w / h
vec3 getPerspectiveCameraRayDir(vec2 uv, vec3 forward, float fov, float aspect) {
    vec2 st = uv * 2. - 1.;
    float fovRad = fov * 3.141592 / 180.;
    float hh = tan(fovRad * .5);
    float hw = hh * aspect;
    vec3 dummyUp = vec3(0., 1., 0.);
    vec3 nf = forward;
    vec3 right = normalize(cross(nf, dummyUp));
    vec3 up = normalize(cross(right, nf));
    vec3 dir = normalize(right * hw * st.x + up * hh * st.y + forward);
    return dir;
}
