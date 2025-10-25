vec3 fToLocal(vec3 p, mat4 WtoO, vec3 scale) {
    // scale = vec3(1.);
    return (WtoO * vec4(p, 1.)).xyz * scale;
}

vec2 fObjectSpaceDfScene(vec3 worldPos, mat4 WtoO, vec3 scale, float useWorld) {
    // scale = vec3(1.);
    vec3 p = mix(
        fToLocal(worldPos, WtoO, scale),
        worldPos,
        useWorld
    );
    return fdfScene(p);
}

vec2 fBlendSpaceDfScene(vec3 worldPos, mat4 WtoO, vec3 scale, float blendRate) {
    vec3 localPos = fToLocal(worldPos, WtoO, scale);
    vec3 p = mix(localPos, worldPos, blendRate);
    return fdfScene(p);
}

vec3 fGetNormalObjectSpaceDfScene(vec3 p, mat4 WtoO, vec3 scale, float useWorld) {
    // // tmp
    // const float eps = .0001;
    // vec3 n = vec3(
    //     fObjectSpaceDfScene(p + vec3(eps, 0, 0), WtoO, scale, useWorld).x - fObjectSpaceDfScene(p + vec3(-eps, 0, 0), WtoO, scale, useWorld).x,
    //     fObjectSpaceDfScene(p + vec3(0, eps, 0), WtoO, scale, useWorld).x - fObjectSpaceDfScene(p + vec3(0, -eps, 0), WtoO, scale, useWorld).x,
    //     fObjectSpaceDfScene(p + vec3(0, 0, eps), WtoO, scale, useWorld).x - fObjectSpaceDfScene(p + vec3(0, 0, -eps), WtoO, scale, useWorld).x
    // );
    // return normalize(n);

    // 軽量版
    // ref: https://x.com/Shiranui_Isuzu_/status/1074492632179474432?s=20
    const float d = .0001;
    vec3 n = vec3(0., 0., 0.);
    for (int i = 0; i < 4; i++)
    {
        vec3 e = .5773 * (2. * vec3(
            (((i + 3) >> 1) & 1),
            ((i >> 1) & 1),
            (i & 1)) - 1.
        );
        n += e * fObjectSpaceDfScene(p + e * d, WtoO, scale, useWorld).x;
    }
    return normalize(n);
}

vec3 fGetNormalDfScene(vec3 p) {
    // // tmp
    // const float eps = .0001;
    // vec3 n = vec3(
    //     fdfScene(p + vec3(eps, 0, 0)).x - fdfScene(p + vec3(-eps, 0, 0)).x,
    //     fdfScene(p + vec3(0, eps, 0)).x - fdfScene(p + vec3(0, -eps, 0)).x,
    //     fdfScene(p + vec3(0, 0, eps)).x - fdfScene(p + vec3(0, 0, -eps)).x
    // );
    // return normalize(n); 

    // 軽量版
    // ref: https://x.com/Shiranui_Isuzu_/status/1074492632179474432?s=20
    const float d = .0001;
    vec3 n = vec3(0., 0., 0.);
    for (int i = 0; i < 4; i++)
    {
        vec3 e = .5773 * (2. * vec3(
        (((i + 3) >> 1) & 1),
        ((i >> 1) & 1),
        (i & 1)) - 1.
        );
        n += e * fdfScene(p + e * d).x;
    }
    return normalize(n);   
}

bool fIsDfInnerBox(vec3 p, vec3 scale) {
    // scale = vec3(1.);
    // 0 だとマッハバンドっぽい境目が出るのでちょっと余裕を持たせる
    const float eps = .0001;
    return
        abs(p.x) < scale.x * .5 + eps &&
        abs(p.y) < scale.y * .5 + eps &&
        abs(p.z) < scale.z * .5 + eps;
}

mat3 fGetCameraRayCoordinate(vec3 origin, vec3 lookAt, vec3 up) {
    vec3 f = normalize(lookAt - origin);
    vec3 r = cross(f, up);
    vec3 u = cross(r, f);
    return mat3(r, u, f);
}

// aspect ... w / h
vec3 fGetPerspectiveCameraRayDir(vec2 uv, vec3 forward, float fov, float aspect) {
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
