in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform vec4 uColor;
uniform float uBlendRate;

void main() {
    vec2 uv = vUv;
    vec4 srcColor = texture(uSrcTexture, uv);
    outColor = mix(srcColor, uColor, uBlendRate);
}
