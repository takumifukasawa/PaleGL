#version 300 es

// precision highp float;

layout(location = 0) in float aPosition;

// precision highp float;

uniform float uBlockOffset;
uniform float uSampleRate;

out vec2 vSound;

#define BPM 120.0
#define PI 3.1415
#define TAU 6.2831

float timeToBeat(float time) {
    return time / 60. * BPM;
}

float sine(float freq, float time) {
    return sin(freq * TAU * time);
}

float sine(float phase) {
    return sin(TAU * phase);
}

float rhy(float time, float fade) {
    return pow(fract(-time), 6. - fade * 3.);
}

vec2 delay(float time, float dt) {
    return exp(-2. * dt) * sin(6.4831 * 440. * time) * vec2(rhy(time - dt * .3, dt), rhy(time - dt * .5, dt));
}

// FM音源。ボーーーーンという音
float fm(float time) {
    return sin(1000. * time + sin(300. * time));
}

float saw(float phase) {
    return 2. * fract(phase) - 1.;
}

float square(float phase) {
    return fract(phase) < .5 ? -1. : 1.;
}

float triangle(float phase) {
    return 1. - 4. * abs(fract(phase) - .5);
}

// float sine(float phase) {
//     return sin(TAU * phase);
// }

// ステレオ出力のためvec2
vec2 mainSound(float time) {
    float beat = timeToBeat(time);
    float freq = mod(beat, 4.) >= 1. ? 440. : 880.;
    float amp = exp(-6. * fract(beat));
    return vec2(sine(freq, time) * amp);

    // 音叉の基準音 
    // return vec2(sin(TAU * 440. * time));

    // 単純な減衰 
    // return vec2(sin(TAU * 440. * time) * exp(-3. * time));

    // 合計が1を超えるときがあり、きれいな波形にはならない. 音は-1~1の範囲に収まりクリップされるため
    // return vec2(sin(TAU * 440. * time) + sin(6.2831 * 440. * 1.5 * time));

    // 左右でちょっとwaveが変わるように
    // return vec2(sin(TAU * 440. * time) * .4 + sin(6.2831 * 440. * 1.5 * time) * .2);

    // 持ち上がってから鳴る: ポーン, ポーン, ポーン...
    // return vec2(sin(TAU * 440. * time) * fract(-2. * time));

    // 高速振動するsinに大きい値をかける -> fractする -> ホワイトノイズっぽいランダムな感じになる
    // return vec2((fract(sin(time * 1e3) * 1e6) - .5));

    // ↑ に一定時間ごとに減衰してくエンベロープをつけるとハイハットっぽい感じ？
    // return vec2((fract(sin(time * 1e3) * 1e6) - .5) * fract(-time * 4.));

    // ハイハットとペダルを組み合わせる感じ？
    // return vec2((fract(sin(time * 1e3) * 1e6) - .5) * pow(fract(time * -4.), mod(time * 4., 2.) * 8.));

    // return vec2(fm(time));

    // 10100100 
    // return vec2(sin(6.4831 * 440. * time) * fract(mod(-time * 8., 8.) / 3.));

    // delay 
    // vec2 s;
    // s += delay(time, 0.);
    // s += delay(time, .5);
    // s += delay(time, 1.);
    // s += delay(time, 1.9);
    // return s * .5;

    // return vec2(saw(440. * time + (.2 * sine(5., time))));

    // float freq = 440.; 
    // float fm = .1 * sine(freq * 7., time);
    // return vec2(sine(freq * time + fm));
}

void main() {
    float time = uBlockOffset + float(gl_VertexID) / uSampleRate;
    vSound = mainSound(time);
}
