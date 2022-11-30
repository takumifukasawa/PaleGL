import {PostProcessPass} from "./PostProcessPass.js";
import {UniformTypes} from "../constants.js";

export class FXAAPass extends PostProcessPass {
    constructor({ gpu }) {
        const fragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSceneTexture;
uniform float uTargetWidth;
uniform float uTargetHeight;
        
float rgbToLuma(vec3 rgb) {
    // return dot(rgb, vec3(.2126729, .7151522, .0721750));
    return dot(rgb, vec3(.299, .587, .114));
}

void main() {
    vec2 texelSize = vec2(1. / uTargetWidth, 1. / uTargetHeight);
    
    // ------------------------------------------------------------------
    // local contrast check
    // ------------------------------------------------------------------
    
    vec3 rgbTop = texture(uSceneTexture, vUv + vec2(0., texelSize.y)).xyz;
    vec3 rgbLeft = texture(uSceneTexture, vUv + vec2(-texelSize.x, 0.)).xyz;
    vec3 rgbCenter = texture(uSceneTexture, vUv + vec2(0., 0.)).xyz;
    vec3 rgbRight = texture(uSceneTexture, vUv + vec2(texelSize.x, 0.)).xyz;
    vec3 rgbBottom = texture(uSceneTexture, vUv + vec2(0., -texelSize.y)).xyz;
    
    float lumaTop = rgbToLuma(rgbTop);
    float lumaLeft = rgbToLuma(rgbLeft);
    float lumaCenter = rgbToLuma(rgbCenter);
    float lumaRight = rgbToLuma(rgbRight);
    float lumaBottom = rgbToLuma(rgbBottom);
    
    float lumaLowest = min(lumaCenter, min(min(lumaTop, lumaLeft), min(lumaBottom, lumaRight)));
    float lumaHighest = max(lumaCenter, max(max(lumaTop, lumaLeft), max(lumaBottom, lumaRight)));
    float lumaContrast = lumaHighest - lumaLowest;
    
    float FXAA_EDGE_THRESHOLD_MIN = .0312;
    float FXAA_EDGE_THRESHOLD_MAX = .125;
    
    outColor = vec4(vec3(lumaContrast), 1.);
    return;
        
    if(lumaContrast < max(FXAA_EDGE_THRESHOLD_MIN, lumaHighest * FXAA_EDGE_THRESHOLD_MAX)) {
        outColor = vec4(rgbCenter, 1.);
        return;
    }
    
    // ------------------------------------------------------------------
    // sub pixel aliasing test
    // ------------------------------------------------------------------
   
    // float lumaL = (lumaTop + lumaLeft + lumaEast + lumaBottom) * .25;
    // float rangeL = abs(lumaL - lumaCenter);
    // float blendL = max(0., (rangeL / range) - FXAA_SUBPIX_TRIM) * FXAA_SUBPIX_TRIM_SCALE;
    // blendL = min(FXAA_SUBPIX_CAP, blendL);
    // 
    // float rgbL = rgbTop + rgbLeft + rgbCenter + rgbEast + rgbBottom;
    
    vec3 rgbTopLeft = texture(uSceneTexture, vUv + vec2(-texelSize.x, texelSize.y)).xyz;
    vec3 rgbTopRight = texture(uSceneTexture, vUv + vec2(texelSize.x, texelSize.y)).xyz;
    vec3 rgbBottomLeft = texture(uSceneTexture, vUv + vec2(-texelSize.x, -texelSize.y)).xyz;
    vec3 rgbBottomRight = texture(uSceneTexture, vUv + vec2(texelSize.x, texelSize.y)).xyz;

    // rgbL += (rgbTopLeft + rgbTopRight + rgbBottomLeft + rgbBottomRight);
    // rgbL *= (1. / 9.);
    
    // ------------------------------------------------------------------
    // result
    // ------------------------------------------------------------------
 
    // vec4 textureColor = texture(uSceneTexture, vUv);
    // outColor = vec4(vec3(lumaM), 1.);
}
`;

        super({
            gpu,
            fragmentShader,
            uniforms: {
                uTargetWidth: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uTargetHeight: {
                    type: UniformTypes.Float,
                    value: 1,
                }
            }
        });
    }
    
    setSize(width, height) {
        super.setSize(width, height);
        this.mesh.material.uniforms.uTargetWidth.value = width;
        this.mesh.material.uniforms.uTargetHeight.value = height;
    }
    
}