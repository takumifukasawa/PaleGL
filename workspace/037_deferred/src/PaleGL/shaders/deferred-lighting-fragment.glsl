#version 300 es

precision mediump float;

#pragma DEFINES

uniform vec3 uViewPosition;

#include ./partial/directional-light-struct.glsl
#include ./partial/directional-light-uniforms.glsl

struct Surface {
    vec3 worldNormal;
    vec3 worldPosition;
    vec4 diffuseColor;
    float specularAmount;
};

#include ./partial/camera-struct.glsl

#pragma DEPTH_FUNCTIONS

in vec2 vUv;

// TODO
// uniform sampler2D uAOTexture; 
uniform sampler2D uBaseColorTexture;
uniform sampler2D uDepthTexture;
uniform sampler2D uNormalTexture;

uniform float uNearClip;
uniform float uFarClip;

uniform mat4 uInverseViewProjectionMatrix;

layout (location = 0) out vec4 outColor;

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


uniform float uTime;
void main() {
    vec2 uv = vUv;

    vec4 baseColor = texture(uBaseColorTexture, uv);
   
    vec3 worldNormal = texture(uNormalTexture, uv).xyz * .5 + .5;
   
    float rawDepth = texture(uDepthTexture, uv).r; 
    float depth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);

    vec3 worldPosition = reconstructWorldPositionFromDepth(uv, rawDepth, uInverseViewProjectionMatrix);

    outColor = vec4(worldPosition, 1.);
    // outColor = vec4(vec3(depth), 1.);
    // outColor = vec4(mod(uTime, 1.), 1., 1., 1.);
    outColor = vec4(uViewPosition, 1.);

    Surface surface;
    surface.worldPosition = worldPosition;
    surface.worldNormal = worldNormal;
    surface.diffuseColor = baseColor;
    
    outColor = baseColor;
    return;

    // TODO: bufferから引っ張ってくる
    surface.specularAmount = .5;

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
