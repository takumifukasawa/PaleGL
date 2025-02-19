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
uniform vec2 uTexelSize;

float weight(vec3 c) {
    return 1. / (1. + max(max(c.r, c.g), c.b));
    // return 1. / max((1. + max(max(c.r, c.g), c.b)), .01);
}

float maxV3(vec3 c) {
    return max(max(c.r, c.g), c.b);
}

void main() {
    vec4 sceneColor = texture(uSrcTexture, vUv);
    vec4 cocColor = texture(uCocTexture, vUv);
    // outColor = vec4(sceneColor.xyz, 1.);
    // return;
 
    vec4 kernel = uTexelSize.xyxy * vec2(-.5, .5).xxyy;
   
    vec3 s0 = texture(uSrcTexture, vUv + kernel.xy).rgb;
    vec3 s1 = texture(uSrcTexture, vUv + kernel.zy).rgb;
    vec3 s2 = texture(uSrcTexture, vUv + kernel.xw).rgb;
    vec3 s3 = texture(uSrcTexture, vUv + kernel.zw).rgb;
    
    float w0 = weight(s0);
    float w1 = weight(s1);
    float w2 = weight(s2);
    float w3 = weight(s3);
    
    float coc0 = texture(uCocTexture, vUv + kernel.xy).r;
    float coc1 = texture(uCocTexture, vUv + kernel.zy).r;
    float coc2 = texture(uCocTexture, vUv + kernel.xw).r;
    float coc3 = texture(uCocTexture, vUv + kernel.zw).r;
    // float coc0 = rawCoc0.r;
    // float coc1 = rawCoc1.r;
    // float coc2 = rawCoc2.r;
    // float coc3 = rawCoc3.r;
    
    float coc = 0.;
    // coc = (coc0 + coc1 + coc2 + coc3) * .25;
    float cocMin = min(min(min(coc0, coc1), coc2), coc3);
    float cocMax = max(max(max(coc0, coc1), coc2), coc3);
    coc = cocMax >= -cocMin ? cocMax : cocMin;
    
    vec4 weights = vec4(w0, w1, w2, w3);

    // for luma
    // w0 *= 1. / (maxV3(rawCoc0) + 1.);
    // w1 *= 1. / (maxV3(rawCoc1) + 1.);
    // w2 *= 1. / (maxV3(rawCoc2) + 1.);
    // w3 *= 1. / (maxV3(rawCoc3) + 1.);
    // TODO: flickerを軽減したいがこのあたりがうまくいってないような気がする
    w0 *= 1. / (maxV3(s0) + 1.);
    w1 *= 1. / (maxV3(s1) + 1.);
    w2 *= 1. / (maxV3(s2) + 1.);
    w3 *= 1. / (maxV3(s3) + 1.);

    // tmp
    // w0 *= 1. / (cocMax + 1.);
    // w1 *= 1. / (cocMax + 1.);
    // w2 *= 1. / (cocMax + 1.);
    // w3 *= 1. / (cocMax + 1.);

    // 加重平均
    // TODO: 輝度値を考慮する必要があるはず？ 
    vec3 color =
        s0 * weights.x +
        s1 * weights.y +
        s2 * weights.z +
        s3 * weights.w;
    // default
    // color /= max(w0 + w1 + w2 + s3, 0.00001);
    // dot
    color /= dot(weights, vec4(1.));
    
    coc = dot(coc, .25);
    color *= smoothstep(0., uTexelSize.y * 2., abs(coc));
    
    outColor = vec4(color.rgb, coc);
   
    // for debug
    // if(coc < 0.) {
    //     outColor = vec4(1., 0., 0., 1.);
    //     return;
    // }
    // outColor = sceneColor;
    // outColor = cocColor;
    // outColor = vec4(vec3(coc), 1.);
    // outColor = vec4(vec3(coc), 1.);
    // if(cocColor.r <= 0.) {
    //     outColor = vec4(1., 0., 0., 1.) * abs(cocColor.r);
    // }
}           
