#version 300 es

#pragma DEFINES

#pragma ATTRIBUTES

// layout (location = 0) in vec3 ${AttributeNames.Position};
// layout (location = 1) in vec2 ${AttributeNames.Uv};

out vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 1);
}