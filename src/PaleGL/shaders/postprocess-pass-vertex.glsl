#pragma DEFINES

#pragma ATTRIBUTES

out vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 1);
}
