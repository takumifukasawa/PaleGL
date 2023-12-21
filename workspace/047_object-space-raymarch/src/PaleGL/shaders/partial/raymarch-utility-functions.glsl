
// // TODO: commonに移してもいいかも
// vec3 toLocal(mat4 WtoO, vec3 p) {
//     return (WtoO * vec4(p, 1.)).xyz;
// }

//
// normal
//

vec3 getNormalObjectSpaceDfScene(vec3 p) {
    const float eps = 0.0001;
    vec3 n = vec3(
        dfScene(p + vec3(eps, 0, 0)) - dfScene(p + vec3(-eps, 0, 0)),
        dfScene(p + vec3(0, eps, 0)) - dfScene(p + vec3(0, -eps, 0)),
        dfScene(p + vec3(0, 0, eps)) - dfScene(p + vec3(0, 0, -eps))
    );
    return normalize(n);
}
