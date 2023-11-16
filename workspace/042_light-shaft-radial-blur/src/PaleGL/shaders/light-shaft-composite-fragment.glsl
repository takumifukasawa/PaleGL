#version 300 es
            
precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uLightShaftTexture;
uniform float uBlendRate;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);
    vec4 destColor = sceneColor;
    vec4 lightShaftColor = texture(uLightShaftTexture, vUv);
    float occlusion = mix(0., 1., lightShaftColor.x * lightShaftColor.x);
    
    destColor = sceneColor * (1. - occlusion);
    // destColor *= 1. - (occlusion * uBlendRate);
    // outColor = destColor;
    
    outColor = mix(sceneColor, destColor, uBlendRate);
    
    // for debug
    // outColor = vec4(vec3(occlusion), 1.);
    // outColor = tmpColor;
    // outColor = mix(tmpColor, vec4(1., 0., 0., 1.), step(.02, occlusion));
}           
