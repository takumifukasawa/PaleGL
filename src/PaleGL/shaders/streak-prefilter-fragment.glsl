// ref: 
// https://github.com/keijiro/KinoStreak/blob/master/Assets/Kino/Streak/Shader/Streak.cginc
// threshold以上の輝度を抽出
// 抽出する際、縦を広めにサンプリング

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSrcTexture;
uniform vec2 uTexelSize;
uniform float uThreshold;
uniform float uVerticalScale;

void main() {
    // float vScale = 1.5;
    float vScale = uVerticalScale;
    float dy = uTexelSize.y * vScale / 2.;
    vec2 uv = vUv;
    vec4 srcColor = texture(uSrcTexture, uv);
    vec3 c0 = texture(uSrcTexture, vec2(uv.x, uv.y - dy)).rgb;
    vec3 c1 = texture(uSrcTexture, vec2(uv.x, uv.y + dy)).rgb;
    vec3 c = (c0 + c1) / 2.;
    
    // 最大輝度
    float br = max(c.r, max(c.g, c.b)); 
    
    // threshold以下: 黒くなる
    // threshold以上: (br - uThreshold) / br が残る。つまり輝度量が落ちたものが記録される。
    c *= max(0., br - uThreshold) / max(br, 1e-5);
    
    outColor = vec4(c, 1.);
}
