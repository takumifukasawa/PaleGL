#version 300 es

precision mediump float;

#pragma DEFINES

uniform vec4 uColor;
uniform sampler2D uDiffuseMap; 
uniform vec2 uDiffuseMapUvScale;

#ifdef USE_ALPHA_TEST
uniform float uAlphaTestThreshold;
#endif

in vec2 vUv;

#ifdef USE_VERTEX_COLOR
in vec4 vVertexColor;
#endif

out vec4 outColor;

#ifdef USE_ALPHA_TEST
void checkAlphaTest(float value, float threshold) {
    if(value < threshold) {
        discard;
    }
}
#endif

void main() {
    vec2 uv = vUv * uDiffuseMapUvScale;
   
    vec4 diffuseMapColor = texture(uDiffuseMap, uv);
    
    vec4 diffuseColor = vec4(0.);

#ifdef USE_VERTEX_COLOR
    diffuseColor = vVertexColor * uColor * diffuseMapColor;
#else
    diffuseColor = uColor * diffuseMapColor;
#endif   

    float alpha = diffuseColor.a; // TODO: base color を渡して alpha をかける

#ifdef USE_ALPHA_TEST
    checkAlphaTest(alpha, uAlphaTestThreshold);
#endif    

    outColor = vec4(1., 1., 1., 1.);
}
