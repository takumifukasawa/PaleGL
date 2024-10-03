#version 300 es

precision highp float;

uniform float uBlockOffset;

uniform float uSampleRate;

out vec2 vSound;

#define BPM 120.

#define PI 3.1415

#define TAU 6.2831

#define T1 1.

#define T2 2.

#define T4 4.

#define T8 8.

#define T16 16.

#define T32 32.

#define N2(a, b) (a | (b << 8))

#define N3(a, b, c) (a | (b << 8) | (c << 16))

#define N4(a, b, c, d) (a | (b << 8) | (c << 16) | (d << 24))

#define O(a) 0, a

#define S(a) 1, a


#define E2(a) 40, a

#define F2(a) 41, a

#define Fsh2(a) 42, a

#define G2(a) 43, a

#define A2(a) 45, a

#define B2(a) 47, a

#define C3(a) 48, a

#define D3(a) 50, a

#define E3(a) 52, a

#define F3(a) 53, a

#define Fsh3(a) 54, a

#define G3(a) 55, a

#define A3(a) 57, a

#define B3(a) 59, a

#define C4(a) 60, a

#define D4(a) 62, a

#define E4(a) 64, a

#define F4(a) 65, a

#define Fsh4(a) 66, a

#define G4(a) 67, a

#define A4(a) 69, a

#define B4(a) 71, a

#define C5(a) 72, a

#define D5(a) 74, a

#define E5(a) 76, a

#define F5(a) 77, a

#define G5(a) 79, a

#define A5(a) 81, a

#define B5(a) 83, a

#define C6(a) 84, a

#define D6(a) 86, a

#define E6(a) 88, a

#define CM2(a) N3(36, 40, 43), a

#define DM2(a) N3(38, 42, 45), a

#define Em2(a) N3(40, 43, 47), a

#define Fshdim2(a) N3(42, 45, 48), a

#define GM2(a) N3(43, 47, 50), a

#define Am2(a) N3(45, 48, 52), a

#define Bm2(a) N3(47, 50, 54), a

#define CM3(a) N3(48, 52, 55), a

#define DM3(a) N3(50, 54, 57), a

#define Em3(a) N3(52, 55, 59), a

#define Fshdim3(a) N3(53, 56, 59), a

#define GM3(a) N3(55, 59, 62), a

#define Am3(a) N3(57, 60, 64), a

#define Bm3(a) N3(59, 62, 66), a

#define CM4(a) N3(60, 64, 67), a

#define DM4(a) N3(62, 66, 69), a

#define Em4(a) N3(64, 67, 71), a

#define Fshdim4(a) N3(65, 68, 71), a

#define GM4(a) N3(67, 71, 74), a

#define Am4(a) N3(69, 72, 76), a

#define Bm4(a) N3(71, 74, 78), a

#define CM5(a) N3(72, 76, 79), a

#define DM5(a) N3(74, 78, 81), a

#define Em5(a) N3(76, 79, 83), a

#define Fshdim5(a) N3(77, 80, 83), a

#define GM5(a) N3(79, 83, 86), a

#define Am5(a) N3(81, 84, 88), a

#define Bm5(a) N3(83, 86, 90), a

#define CM6(a) N3(84, 88, 91), a

#define DM6(a) N3(86, 90, 93), a

#define Em6(a) N3(88, 91, 95), a


float chord(float n) {

    if(n < 1.) {

        return 0.;

    }

    return (

    n < 2. ? 55. :

    n < 3. ? 58. :

    n < 4. ? 62. :

    65.

    );

}

vec4 noise(float p) {

    vec4 p4 = fract(vec4(p) * vec4(.1050, .1030, .0973, .1099));

    p4 += dot(p4, p4.wzxy + 55.33);

    return fract((p4.xxyz + p4.yzzw) * p4.zywx);

}

float noise2(float phi) { return fract(sin(phi * 0.055753) * 122.3762) * 4.0 - 3.0; }

float quan(float s, float c) {

    return floor(s / c) * c;

}

float nse(float x) {

    return fract(sin(x * 110.082) * 19871.8972);

}

float dist(float s, float d) {

    return clamp(s * d, -1., 1.);

}

float timeToBeat(float time) {

    return time / 60. * BPM;

}

float beatToTime(float beat) {

    return beat / BPM * 60.;

}

#define BEAT_TO_TIME(beat) beat / BPM * 60.

float noteToFreq(float n) {

    return 440. * pow(2., (n - 69.) / 12.);

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

float saw(float note, float phase) {

    return 2. * fract(phase) - 1.;

}

float square(float phase) {

    return fract(phase) < .5 ? -1. : 1.;

}

float triangle(float phase) {

    return 1. - 4. * abs(fract(phase) - .5);

}


float lowPassFilter(float inp, float cut_lp, float res_lp) {

    float n1 = 0.0;

    float n2 = 0.0;

    float n3 = 0.0;

    float n4 = 0.0;

    float fb_lp = 0.0;

    float fb_hp = 0.0;

    float hp = 0.0;

    float p4=1.0e-24;

    fb_lp 	= res_lp+res_lp/(1.0-cut_lp + 1e-20);

    n1 		= n1+cut_lp*(inp-n1+fb_lp*(n1-n2))+p4;

    n2		= n2+cut_lp*(n1-n2);

    return n2;

}

float base( float note, float time )

{

    float freq = noteToFreq(note);

    float ph = 1.0;

    ph *= sin(6.283185*freq*time*2.0);

    ph *= 0.5+0.5*max(0.0,5.0-0.01*freq);

    ph *= exp(-time*freq*0.2);

    float y = 0.0;

    y += 0.70*sin(1.00*TAU*freq*time+ph)*exp2(-0.7*0.007*freq*time);

    y += 0.20*sin(2.01*TAU*freq*time+ph)*exp2(-0.7*0.011*freq*time);

    y += 0.20*sin(3.01*TAU*freq*time+ph)*exp2(-0.7*0.015*freq*time);

    y += 0.16*sin(4.01*TAU*freq*time+ph)*exp2(-0.7*0.018*freq*time);

    y += 0.13*sin(5.01*TAU*freq*time+ph)*exp2(-0.7*0.021*freq*time);

    y += 0.10*sin(6.01*TAU*freq*time+ph)*exp2(-0.7*0.027*freq*time);

    y += 0.09*sin(8.01*TAU*freq*time+ph)*exp2(-0.7*0.030*freq*time);

    y += 0.07*sin(9.01*TAU*freq*time+ph)*exp2(-0.7*0.033*freq*time);

    y += 0.35*y*y*y;

    y += 0.10*y*y*y;

    y *= 1.0 + 1.5*exp(-8.0*time);

    y *= clamp( time/0.004, 0.0, 1.0 );

    y *= 2.5-1.5*clamp( log2(freq)/10.0,0.0,1.0);

    y *= .1;

    return y;

}


vec2 kick(float note, float time) {

    
    
    

    float amp = exp(-3.2 * time);

    float phase = 35. * time - 16. * exp(-60. * time);

    return vec2(amp * sine(phase));

}

vec2 kickAttack(float note, float t) {

    float i = t * uSampleRate;

    float env = exp(-t * 28.);

    float v = .5 * env * (.7 * noise2(i) + .38 * sin(45. * i));

    return vec2(v);

}

vec2 hihat1(float note, float time) {

    float amp = exp(-50. * time);

    return amp * noise(time * 100.).xy;

}

vec2 hihat2(float note, float time) {

    float amp = exp(-70. * time);

    return amp * noise(time * 300.).xy;

}

vec2 snare(float note, float t) {

    float i = t * uSampleRate;

    float env = exp(-t * 17.);

    float v = .3 * env * (2.3 * noise2(i) + .5 * sin(30. * i));

    return vec2(v);

}

vec2 snareFill(float note, float t) {

    float i = t * uSampleRate;

    float env = exp(-t * 30.);

    float v = .2 * env * (2.3 * noise2(i) + .5 * sin(30. * i));

    return vec2(v);

}

vec2 crash1(float note, float time) {

    float aa = 15.;

    time = sqrt(time * aa) / aa;

    float amp = exp(max(time - .15, 0.) * -5.);

    float v = nse(quan(mod(time, .6), .0001));

    v = dist(v, .1) * amp;

    return vec2(dist(v * amp, 2.));

}


#define NSPC 256

vec2 dist(vec2 s, float d) { return clamp(s * d, -1.0, 1.0); }

float _filter(float h, float cut) {

    cut -= 20.0;

    float df = max(h - cut, 0.0), df2 = abs(h - cut);

    return exp(-0.005 * df * df) * 0.5 + exp(df2 * df2 * -0.1) * 2.2;

}

vec2 attackbass(float note, float t) {

    vec2 v = vec2(0.0);

    float dr = 0.15;

    float amp = smoothstep(0.1, 0.0, abs(t - dr - 0.1) - dr) * exp(t * 0.2);

    float f = noteToFreq(note);

    float sqr = 0.1;

    float base = f;

    float flt = exp(t * -1.5) * 30.0;

    for (int i = 0; i < NSPC; i++) {

        float h = float(i + 1);

        float inten = 2.0 / h;

        inten = mix(inten, inten * mod(h, 2.0), sqr);

        inten *= exp(-2.0 * max(2.0 - h, 0.0));  

        inten *= _filter(h, flt);

        v.x += inten * sin((TAU + 0.01) * (t * base * h));

        v.y += inten * sin(TAU * (t * base * h));

    }

    float o = v.x * amp;  

    

    return vec2(dist(v * amp, 2.0));

}

vec2 leadsub(float note, float t) {

    vec2 v = vec2(0.0);

    float dr = 0.1;

    float amp = smoothstep(0.2, 0.0, abs(t - dr - 0.1) - dr) * exp(t * 0.2);

    float f = noteToFreq(note);

    float sqr = 0.03;

    float base = f;

    float flt = exp(t * -3.5) * 20.0;

    for (int i = 0; i < NSPC; i++) {

        float h = float(i + 1);

        float inten = 2.0 / h;

        inten = mix(inten, inten * mod(h, 2.0), sqr);

        inten *= exp(-2.0 * max(2.0 - h, 0.0));

        inten *= _filter(h, flt);

        v.x += inten * sin((TAU + 0.01) * (t * base * h));

        v.y += inten * sin(TAU * (t * base * h));

    }

    float o = v.x * amp;

    return vec2(dist(v * amp, 2.0));

}

vec2 leadsub2(float note, float t) {

    vec2 v = vec2(0.0);

    float dr = 0.1;

    float amp = smoothstep(0.2, 0.0, abs(t - dr - 0.1) - dr) * exp(t * 0.2);

    float f = noteToFreq(note);

    float sqr = 0.05;

    float base = f;

    float flt = exp(t * -2.5) * 20.0;

    for (int i = 0; i < NSPC; i++) {

        float h = float(i + 1);

        float inten = 4.0 / h;

        inten = mix(inten, inten * mod(h, 2.0), sqr);

        inten *= exp(-3.0 * max(1.9 - h, 0.0));

        inten *= _filter(h, flt);

        v.x += inten * sin((TAU + 0.01) * (t * base * h));

        v.y += inten * sin(TAU * (t * base * h));

    }

    float o = v.x * amp;

    return vec2(dist(v * amp, 2.0));

}

vec2 synth(float note, float t) {

    vec2 v = vec2(0.0);

    float dr = 0.15;

    float amp = smoothstep(0.1, 0.0, abs(t - dr - 0.1) - dr) * exp(t * 0.2);

    float f = noteToFreq(note);

    float sqr = 0.1;

    float base = f;

    float flt = exp(t * -1.5) * 30.0;

    for (int i = 0; i < NSPC; i++) {

        float h = float(i + 1);

        float inten = 2.0 / h;

        inten = mix(inten, inten * mod(h, 2.0), sqr);

        inten *= exp(-2.0 * max(2.0 - h, 0.0));

        inten *= _filter(h, flt);

        v.x += inten * sin((TAU + 0.01) * (t * base * h));

        v.y += inten * sin(TAU * (t * base * h));

    }

    float o = v.x * amp;

    return vec2(dist(v * amp, 2.0));

}

vec2 bass(float note, float time) {

    float freq = noteToFreq(note);

    return vec2(square(freq * time) + sine(freq * time)) / 1.5;

}

vec2 pad(float note, float time) {

    float freq = noteToFreq(note);

    float vib = .2 * sine(3. * time);

    return vec2(

    saw(1., freq * .99 * time + vib),

    saw(1., freq * 1.01 * time + vib)

    );

}

vec2 arp(float note, float time) {

    float freq = noteToFreq(note);

    float fmamp = .1 * exp(-50. * time);

    float fm = fmamp * sine(time * freq * 7.);

    
    float amp = exp(-20. * time);

    return amp * vec2(

    sine(freq * .99 * time + fm),

    sine(freq * 1.01 * time + fm)

    );

}


#define msin(x,m) sin(TAU*(x)+(m))

float cps(float notenumber)

{

    
    return 440.*exp2((notenumber-69.)/12.);

}

vec2 epiano(float note, float t)

{

    float nuance = 1.;

    float freq = cps(note);

    
    
    
    vec2 f0 = vec2(freq*0.998, freq*1.002);

    
    
    
    vec2 glass = msin((f0+3.)*t, msin(14.*f0*t,0.) * exp(-30.*t) * nuance) * exp(-4.*t)  * nuance;

    glass = sin(glass); 

    
    
    vec2 body = msin(f0*t, msin(f0*t,0.) * exp(-0.5*t) * nuance * pow(440./f0.x, 0.5)) * exp(-t) * nuance;

    
    float panDir = clamp(log2(freq/400.)/2., -1., 1.); 
    vec2 pan = normalize(vec2(0.5-0.5*panDir, 0.5+0.5*panDir));

    return (glass*pan + body) * 0.05 * smoothstep(0.,0.001,t);

}

#define SEQUENCER(rawBeat,time,beatTempo,totalBeatCount,notes,noteCount,toneFunc)float tempoScale=beatTempo/4.;float fLocalBeatIndex=mod(rawBeat*tempoScale,float(totalBeatCount));int accRawBeatPrevLength=0;int accRawBeatLength=0;int targetNoteIndex=-1;for(int i=0;i<noteCount;i++){if(i==0){int rawNoteLength=notes[i*2+1];if(0.<fLocalBeatIndex&&fLocalBeatIndex<float(rawNoteLength)){targetNoteIndex=0;accRawBeatLength+=rawNoteLength;break;}accRawBeatLength+=rawNoteLength;}else{int rawNoteLength=notes[(i-1)*2+1];int nextRawNoteNumber=notes[i*2];int nextRawNoteLength=notes[i*2+1];if( float(accRawBeatLength)<fLocalBeatIndex&&fLocalBeatIndex<(float(accRawBeatLength)+float(nextRawNoteLength))){targetNoteIndex=i;accRawBeatPrevLength=accRawBeatLength;accRawBeatLength+=nextRawNoteLength;break;}accRawBeatPrevLength=accRawBeatLength;accRawBeatLength+=nextRawNoteLength;}}int currentNoteNumber=notes[targetNoteIndex*2];int currentNoteLength=notes[targetNoteIndex*2+1];int[4]noteNumbers=int[4]( (int(currentNoteNumber)&255),((int(currentNoteNumber)>>8)&255),((int(currentNoteNumber)>>16)&255),((int(currentNoteNumber)>>24)&255));if(targetNoteIndex==-1){return vec2(0.);}float fLocalBeatIndexInNote=fLocalBeatIndex-float(accRawBeatPrevLength);float localTime=BEAT_TO_TIME(mod(fLocalBeatIndexInNote,float(currentNoteLength))/tempoScale);float fallbackAmp=1.-smoothstep(.90,.99,fLocalBeatIndexInNote/float(currentNoteLength));fallbackAmp=1.;vec2 res=vec2(0.);float acc=0.;for(int i=0;i<4;i++){float fNoteNumber=float(noteNumbers[i]);float isNoteOn=(fNoteNumber>0.?1.:0.);res+=vec2(toneFunc(fNoteNumber,localTime))*isNoteOn*fallbackAmp;acc+=isNoteOn;}float gainAcc=1.5;res/=max(1.,acc-gainAcc);


vec2 epianoSeqBase(float rawBeat, float time) {

    
    
    
    
    
    

    int[10] notes = int[10](

    
    
    G3(3), E3(3), A3(3), G3(5), O(2)

    );

    
    SEQUENCER(rawBeat, time, T8, 16., notes, 5, epiano);

return res * 3.;

}

vec2 epianoHarmonySeqBase(float rawBeat, float time) {

    int[16] notes = int[16](

    Am3(4), Am3(4),

    Em3(4), Em3(4),

    CM4(4), CM4(4),

    Bm3(4), Bm3(4)

    );

    

    int[16] notes = int[16](

    G3(4), O(2), G3(4), O(2), G3(4),

    F3(4), O(2), F3(4), O(2), F3(4),

    

    );

    
    SEQUENCER(rawBeat, time, T8, 32., notes, 8, epiano);

return res * 3.;

}

vec2 epianoMelodyMainSeq(float rawBeat, float time) {

    int[40] notes = int[40](

    G4(3), E3(3), A3(3), G3(5), O(2),

    G3(3), E3(3), A3(3), G3(5), O(2),

    G3(3), E3(3), B3(3), A3(3), B3(2), D4(1),

    C4(3), B3(3), G3(5), O(5)

    );

    SEQUENCER(rawBeat, time, T8, 64., notes, 20, epiano);

return res * 1.;

}

vec2 arpSeqBase(float rawBeat, float time) {

    int[8] notes = int[8](

    
    E4(2), G4(2), A4(2), G4(2)

    );

    SEQUENCER(rawBeat, time, T8, 8., notes, 4, arp);

float volume = .5;

return res * volume;

}


vec2 kickSeqBase(float rawBeat, float time) {

    int[32] notes = int[32](

    S(1), O(1), S(1), O(1),

    S(1), S(1), S(1), O(1),

    S(1), O(1), S(1), O(1),

    S(1), S(1), S(1), O(1)

    );

    SEQUENCER(rawBeat, time, T8, 16., notes, 16, kick);

return res * .5;

}

vec2 bassSeqBase(float rawBeat, float time) {

    int[38] notes = int[38](

    
    
    E4(3), E4(1), O(1), G4(2), O(1),

    E4(3), E4(1), O(1), B4(2), O(1),

    E4(3), E4(1), O(1), G4(2), O(1),

    E4(3), B4(2), G4(2), O(1)

    );

    
    SEQUENCER(rawBeat, time, T8, 32., notes, 19, bass);

return vec2(res) * .1;

}

vec2 snareSeqBase(float rawBeat, float time) {

    int[16] notes = int[16](

    S(1), S(1), S(1), S(1),

    S(1), S(1), S(1), S(1)

    );

    SEQUENCER(rawBeat, time, T4, 8., notes, 8, snare);

float volume = .2;

return vec2(res) * volume;

}

vec2 snareFillSeqBase(float rawBeat, float time) {

    int[16] notes = int[16](

    S(1), S(1), S(1), S(1),

    S(1), S(1), S(1), S(1)

    );

    SEQUENCER(rawBeat, time, T4, 8., notes, 8, snareFill);

float volume = .5;

return vec2(res) * volume;

}

float phase(float beat, float inBeat, float outBeat) {

    return step(inBeat, beat) * (1. - step(outBeat, beat));

}

vec2 epianoMelodyLoopBaseSeq(float rawBeat, float time) {

    int[20] notes = int[20](

    G4(3), E4(3), A4(3), G4(5), O(2),

    G4(3), E4(3), A4(3), G4(5), O(2)

    );

    SEQUENCER(rawBeat, time, T8, 16., notes, 10, epiano);

return res * 3.;

}

vec2 epianoHarmonyBaseSeq(float rawBeat, float time) {

    int[16] notes = int[16](

    
    

    
    
    
    
    
    

    
    
    

    
    
    

    
    
    
    
    
    
    Am3(4), Am3(4),

    Em3(4), Em3(4),

    CM4(4), CM4(4),

    Bm3(4), Bm3(4)

    );

    
    SEQUENCER(rawBeat, time, T8, 32., notes, 8, epiano);

return res * 3.;

}

vec2 baseIntroSeq(float rawBeat, float time) {

    
    
    
    
    
    
    
    
    
    

    
    

    
    

    
    


int[26] notes = int[26](

Am3(2), A3(1), G3(1), G3(1), B3(1), O(2),

G3(1), G3(1), A3(1), G3(1), G3(1), B3(1), O(2)

);

SEQUENCER(rawBeat, time, T8, 16., notes, 13, arp);

return res * .8;

}

vec2 snareFillIntroSeq(float rawBeat, float time) {

    int[16] notes = int[16](

    S(1), S(1), S(1), S(1),

    S(1), S(1), S(1), S(1)

    );

    SEQUENCER(rawBeat, time, T4, 8., notes, 8, snareFill);

return res * .3;

}

vec2 snareFillHookSeq(float rawBeat, float time) {

    int[32] notes = int[32](

    S(1), O(1), S(1), O(1), S(1), O(1), S(1), O(1),

    S(1), O(1), S(1), O(1), S(1), O(1), S(1), O(1)

    );

    SEQUENCER(rawBeat, time, T16, 16., notes, 16, snareFill);

return res * .1;

}

vec2 arpBaseLoopSeqBase(float rawBeat, float time) {

    int[56] notes = int[56](

    
    
    

    
    
    
    
    
    G3(1), G3(1), A3(1), G3(1), G3(1), B3(1), O(2),

    G3(1), G3(1), A3(1), G3(1), G3(1), B3(1), O(2),

    E3(1), E3(1), Fsh3(1), E3(1), E3(1), G3(1), O(2),

    E3(1), E3(1), Fsh3(1), E3(1), E3(1), G3(1), O(2)

    
    
    
    
    
    );

    
    

    
    SEQUENCER(rawBeat, time, T8, 32., notes, 28, arp);

return res * .3;

}

vec2 hihat1BaseLoopSeq(float rawBeat, float time) {

    int[16] notes = int[16](

    S(1), O(1), S(1), O(1), S(1), O(1), S(1), O(1)

    );

    SEQUENCER(rawBeat, time, T8, 8., notes, 8, hihat1);

return res;

}

vec2 bassBaseLoopSeq(float rawBeat, float time) {

    int[8] notes = int[8](

    
    Am3(4),

    Em3(4),

    CM4(4),

    Bm3(4)

    
    
    
    
    
    );

    SEQUENCER(rawBeat, time, T2, 16., notes, 4, bass);

return res * .05;

}

float beatToMeasure(float beat) {

    return beat * .25;

}

vec2 mainSound(float time) {

    float beat = timeToBeat(time);

    
    

    vec2 sound = vec2(0.);

    float measure = beatToMeasure(beat);

    

    return epianoSeqBase(beat, time);

    return epianoMelodyMainSeq(beat, time);

    return baseIntroSeq(beat, time);

    return epianoHarmonyBaseSeq(beat, time);

    if(0. <= measure && measure < 8.) { 
        sound +=

        0.

        
        + baseIntroSeq(beat, time)

        
        ;

    } else if(8. <= measure && measure < 16.) {

        sound +=

        0.

        + bassBaseLoopSeq(beat, time)

        + baseIntroSeq(beat, time)

        + epianoMelodyLoopBaseSeq(beat, time)

        + snareFillIntroSeq(beat, time)

        + arpBaseLoopSeqBase(beat, time)

        + hihat1BaseLoopSeq(beat, time)

        ;

    } else if(16. <= measure && measure < 24.) {

        sound +=

        0.

        + bassBaseLoopSeq(beat, time)

        + epianoMelodyLoopBaseSeq(beat, time)

        + baseIntroSeq(beat, time)

        + epianoHarmonySeqBase(beat, time)

        + arpBaseLoopSeqBase(beat, time)

        + snareFillHookSeq(beat, time)

        ;

    } else if(32. <= measure && measure < 40.) {

    } else if(48. <= measure && measure < 56.) {

    } else if(56. <= measure && measure < 64.) {

    } else if(64. <= measure && measure < 72.) {

    } else if(72. <= measure && measure < 80.) {

    } else {

        sound = vec2(0.);

    }

    return sound;

    return epianoHarmonySeqBase(beat, time);

    sound +=

    bassSeqBase(beat, time)

    + epianoSeqBase(beat, time)

    + epianoHarmonySeqBase(beat, time)

    + arpSeqBase(beat, time)

    + kickSeqBase(beat, time)

    
    + snareFillSeqBase(beat, time);

    
    
    
    
    
    
    

    return sound;

}

void main() {

    float time = uBlockOffset + float(gl_VertexID) / uSampleRate;

    

    
    vec2 c = vec2(1.);

    c =

        1.

        
        * snareFill(time, time)

        * base(time, time)

        * snareFill(time, time)

        * arp(time, time)

        * hihat1(time, time)

        * bass(time, time)

        * epiano(time, time)

    * vec2(1.);

    c.x = 1.;

    c.y = 1.;

    vSound = mainSound(time) * c;

    

    
}