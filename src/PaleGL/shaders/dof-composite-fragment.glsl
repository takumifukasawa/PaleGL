#version 300 es

//
// ref:
// https://catlikecoding.com/unity/tutorials/advanced-rendering/depth-of-field/
// https://github.com/keijiro/KinoBokeh/tree/master
//
            
precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform sampler2D uCocTexture;
uniform sampler2D uDofTexture;

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);
   
    float coc = texture(uCocTexture, vUv).r;
    vec4 dof = texture(uDofTexture, vUv);
    
    // float dofStrength = smoothstep(.1, 1., abs(coc)); 
    float dofStrength = smoothstep(.1, 1., coc); 
    
    // interpolate
    float rate = dofStrength + dof.a - dofStrength * dof.a;
    
    // rate = pow(rate, 8.);
    vec3 color = mix(
        sceneColor.rgb,
        dof.rgb,
        rate
    );
    
    outColor = vec4(color, 1.);
   
    // for debug
    // outColor = sceneColor;
    // outColor = dof;
    // outColor = vec4(sceneColor.xyz, 1.);
    // outColor = vec4(vec3(dofStrength + dof.a - dofStrength * dof.a), 1.);
    // outColor = vec4(vec3(dofStrength), 1.);
    // outColor = vec4(vec3(dof.a), 1.);
    // outColor = vec4(vec3(rate), 1.);
}           
