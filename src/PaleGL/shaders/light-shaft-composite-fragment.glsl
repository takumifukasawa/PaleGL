in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uLightShaftTexture;
uniform float uBlendRate;
uniform float uLightShaftMaskFactor;
uniform float uLightIntensity;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);
    vec4 destColor = sceneColor;
    vec4 lightShaftColor = texture(uLightShaftTexture, vUv);
    float occlusion = mix(0., 1., lightShaftColor.x * lightShaftColor.x);

    occlusion *= uBlendRate;
    occlusion *= uLightShaftMaskFactor; // カメラ方向マスク
    occlusion *= uLightIntensity;       // 光源強度

    outColor = vec4(vec3(occlusion), 1.);
}           
