in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform vec3 uColor;
uniform float uBlendRate;

void main() {
    vec2 uv = vUv;
    vec3 srcColor = texture(uSrcTexture, uv).rgb;
    outColor = vec4(mix(srcColor, uColor, uBlendRate), 1.);
}
