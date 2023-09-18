#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uLightShaftTexture;
uniform vec2 uLightShaftTexelSize;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);
    float lightShaft = texture(uLightShaftTexture, vUv).r;

    vec2 texelSize = uLightShaftTexelSize;
    float lw0 = texture(uLightShaftTexture, vUv + vec2(texelSize.x * .5f, texelSize.y * .5f)).r;
    float lw1 = texture(uLightShaftTexture, vUv + vec2(texelSize.x * .5f, texelSize.y * -.5f)).r;
    float lw2 = texture(uLightShaftTexture, vUv + vec2(texelSize.x * -.5f, texelSize.y * .5f)).r;
    float lw3 = texture(uLightShaftTexture, vUv + vec2(texelSize.x * -.5f, texelSize.y * -.5f)).r;
    float lw = (lw0 + lw1 + lw2 + lw3) * .25;

    vec3 shaftColor = vec3(1., 0., 0.);

    vec3 color = mix(sceneColor.rgb, shaftColor, lw);

    outColor = vec4(color, 1.);

    // for debug
    // outColor = vec4(vec3(alpha), 1.);
    // outColor = texture(uShadowMap, vUv);
    // outColor = sceneColor;
    // outColor = vec4(rayDirInView, 1.);
    // outColor = vec4(uAttenuationBase);
    // outColor = sceneColor;
    // outColor = vec4(vec3(eyeDepth), 1.);
    // outColor = vec4(vec3(d), 1.);
}
