#version 300 es
            
precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uLightShaftTexture;
uniform float uBlendRate;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);
    vec4 tmpColor = sceneColor;
    vec4 lightShaftColor = texture(uLightShaftTexture, vUv);
    float occlusion = mix(0., 1., lightShaftColor.x * lightShaftColor.x);
    // outColor = mix(sceneColor, vec4(vec3(0.), 1.), 1. - occlusion);
    
    sceneColor *= 1. - (occlusion * uBlendRate);

    outColor = sceneColor;
    
    // for debug
    outColor = vec4(vec3(occlusion), 1.);
    // outColor = tmpColor;
    // outColor = mix(tmpColor, vec4(1., 0., 0., 1.), step(.02, occlusion));
}           
