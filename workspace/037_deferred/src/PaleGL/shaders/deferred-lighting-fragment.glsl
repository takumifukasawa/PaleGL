#version 300 es

precision mediump float;

#pragma DEFINES

#include ./partial/receive-shadow-fragment-uniforms.glsl

uniform vec3 uViewPosition;

#include ./partial/alpha-test-fragment-uniforms.glsl

#include ./partial/directional-light-struct.glsl
#include ./partial/directional-light-uniforms.glsl

struct Surface {
    vec3 worldNormal;
    vec3 worldPosition;
    vec4 diffuseColor;
    float specularAmount;
};

#include ./partial/camera-struct.glsl

in vec2 vUv;

// TODO
// uniform sampler2D uAOTexture; 
uniform sampler2D uBaseColorTexture;
uniform sampler2D uDepthTexture;
uniform sampler2D uNormalTexture;

layout (location = 0) out vec4 outBaseColor;

vec4 calcDirectionalLight(Surface surface, DirectionalLight directionalLight, Camera camera) {
    vec3 N = normalize(surface.worldNormal);
    vec3 L = normalize(directionalLight.direction);
    
    // lambert
    float diffuseRate = clamp(dot(N, L), 0., 1.);
    // half lambert
    // float diffuseRate = clamp(dot(N, L), 0., 1.) * .5 + .5;
    // original lambert
    // float diffuseRate = clamp(dot(N, L), 0., 1.) * .9 + .1;
    
    vec3 diffuseColor = surface.diffuseColor.xyz * diffuseRate * uDirectionalLight.intensity * directionalLight.color.xyz;

    vec3 P = surface.worldPosition;
    vec3 E = camera.worldPosition;
    vec3 PtoL = L; // for directional light
    vec3 PtoE = normalize(E - P);
    vec3 H = normalize(PtoL + PtoE);
    // TODO: surfaceに持たせる
    float specularPower = 32.;
    float specularRate = clamp(dot(H, N), 0., 1.);
    specularRate = pow(specularRate, specularPower) * surface.specularAmount;
    vec3 specularColor = specularRate * directionalLight.intensity * directionalLight.color.xyz;

    vec4 resultColor = vec4(
        diffuseColor + specularColor,
        surface.diffuseColor.a
    );
    
    return resultColor;
}


void main() {
    vec2 uv = vUv;

    vec4 baseColor = texture(uBaseColorTexture, uv);
   
    vec3 worldNormal = texture(uNormalTexture, uv).xyz * .5 + .5;
   
#ifdef USE_NORMAL_MAP
    worldNormal = calcNormal(vNormal, vTangent, vBinormal, uNormalMap, uv);
#else
    worldNormal = normalize(vNormal);
#endif  

    Surface surface;
    surface.worldPosition = vWorldPosition;
    surface.worldNormal = worldNormal;
    
#ifdef USE_VERTEX_COLOR
    surface.diffuseColor = vVertexColor * uDiffuseColor * diffuseMapColor;
#else
    surface.diffuseColor = uDiffuseColor * diffuseMapColor;
#endif

    surface.specularAmount = uSpecularAmount;

    Camera camera;
    camera.worldPosition = uViewPosition;
    
    vec4 resultColor = vec4(0, 0, 0, 1);
    
    // directional light
    resultColor = calcDirectionalLight(surface, uDirectionalLight, camera);
        
    // ambient light
#ifdef USE_ENV_MAP
    vec3 envDir = reflect(
        normalize(surface.worldPosition - camera.worldPosition),
        normalize(surface.worldNormal)
    );
    resultColor.xyz += calcEnvMap(uEnvMap, envDir, 0.) * uAmbientAmount;
#endif

#ifdef USE_RECEIVE_SHADOW
    // TODO: apply shadow の中に入れても良さそう
    if(dot(surface.worldNormal, uDirectionalLight.direction) > 0.) {
        resultColor = applyShadow(resultColor, uShadowMap, vShadowMapProjectionUv, uShadowBias, vec4(0., 0., 0., 1.), 0.5);
    }
#endif

    // correct
    outColor = resultColor;
}
