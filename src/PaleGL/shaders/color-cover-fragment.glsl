in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform float uBlendRate;

void main() {
    vec2 uv = vUv;
    vec4 srcCol = texture(uSrcTexture, uv);

    vec4 col = vec4(0., 0., 0., 1.);
    outColor = mix(srcCol, col, uBlendRate);
}
