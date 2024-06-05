#version 300 es
precision highp float;uniform float uBlockOffset,uSampleRate;out vec2 vSound;
#define CLAMP1(x)max(1.,min(1.,c))
#define BPM 110.
#define PI 3.1415
#define TAU 6.2831
#define T1 1.
#define T2 2.
#define T4 4.
#define T8 8.
#define T16 16.
#define T32 32.
#define N2(a,b)(a|(b<<8))
#define N3(a,b,c)(a|(b<<8)|(c<<16))
#define N4(a,b,c,d)(a|(b<<8)|(c<<16)|(d<<24))
#define O(a)0,a
#define S(a)1,a
#define E2(a)40,a
#define F2(a)41,a
#define Fsh2(a)42,a
#define G2(a)43,a
#define A2(a)45,a
#define B2(a)47,a
#define C3(a)48,a
#define D3(a)50,a
#define E3(a)52,a
#define F3(a)53,a
#define Fsh3(a)54,a
#define G3(a)55,a
#define A3(a)57,a
#define B3(a)59,a
#define C4(a)60,a
#define D4(a)62,a
#define E4(a)64,a
#define F4(a)65,a
#define Fsh4(a)66,a
#define G4(a)67,a
#define A4(a)69,a
#define B4(a)71,a
#define C5(a)72,a
#define D5(a)74,a
#define E5(a)76,a
#define F5(a)77,a
#define G5(a)79,a
#define A5(a)81,a
#define B5(a)83,a
#define C6(a)84,a
#define D6(a)86,a
#define E6(a)88,a
#define CM2(a)N3(36,40,43),a
#define DM2(a)N3(38,42,45),a
#define Em2(a)N3(40,43,47),a
#define Fshdim2(a)N3(42,45,48),a
#define GM2(a)N3(43,47,50),a
#define Am2(a)N3(45,48,52),a
#define Bm2(a)N3(47,50,54),a
#define CM3(a)N3(48,52,55),a
#define DM3(a)N3(50,54,57),a
#define Em3(a)N3(52,55,59),a
#define Fshdim3(a)N3(53,56,59),a
#define GM3(a)N3(55,59,62),a
#define Am3(a)N3(57,60,64),a
#define Bm3(a)N3(59,62,66),a
#define CM4(a)N3(60,64,67),a
#define DM4(a)N3(62,66,69),a
#define Em4(a)N3(64,67,71),a
#define Fshdim4(a)N3(65,68,71),a
#define GM4(a)N3(67,71,74),a
#define Am4(a)N3(69,72,76),a
#define Bm4(a)N3(71,74,78),a
#define CM5(a)N3(72,76,79),a
#define DM5(a)N3(74,78,81),a
#define Em5(a)N3(76,79,83),a
#define Fshdim5(a)N3(77,80,83),a
#define GM5(a)N3(79,83,86),a
#define Am5(a)N3(81,84,88),a
#define Bm5(a)N3(83,86,90),a
#define CM6(a)N3(84,88,91),a
#define DM6(a)N3(86,90,93),a
#define Em6(a)N3(88,91,95),a
#define BEAT_TO_TIME(beat)beat/BPM*60.
vec2 snareFill(float B,float a){float i=a*uSampleRate;return vec2(.2*exp(-a*30.)*(2.3*(fract(sin(i*.055753)*122.3762)*4.-3.)+.5*sin(30.*i)));}
#define NSPC 256
#define msin(x,m)sin(TAU*(x)+(m))
#define SEQUENCER(rawBeat,time,beatTempo,totalBeatCount,notes,noteCount,toneFunc)float tempoScale=beatTempo/4.;float fLocalBeatIndex=mod(rawBeat*tempoScale,float(totalBeatCount));int accRawBeatPrevLength=0;int accRawBeatLength=0;int targetNoteIndex=-1;for(int i=0;i<noteCount;i++){if(i==0){int rawNoteLength=notes[i*2+1];if(0.<fLocalBeatIndex&&fLocalBeatIndex<float(rawNoteLength)){targetNoteIndex=0;accRawBeatLength+=rawNoteLength;break;}accRawBeatLength+=rawNoteLength;}else{int rawNoteLength=notes[(i-1)*2+1];int nextRawNoteNumber=notes[i*2];int nextRawNoteLength=notes[i*2+1];if( float(accRawBeatLength)<fLocalBeatIndex&&fLocalBeatIndex<(float(accRawBeatLength)+float(nextRawNoteLength))){targetNoteIndex=i;accRawBeatPrevLength=accRawBeatLength;accRawBeatLength+=nextRawNoteLength;break;}accRawBeatPrevLength=accRawBeatLength;accRawBeatLength+=nextRawNoteLength;}}int currentNoteNumber=notes[targetNoteIndex*2];int currentNoteLength=notes[targetNoteIndex*2+1];int[4]noteNumbers=int[4]( (int(currentNoteNumber)&255),((int(currentNoteNumber)>>8)&255),((int(currentNoteNumber)>>16)&255),((int(currentNoteNumber)>>24)&255));if(targetNoteIndex==-1){return vec2(0.);}float fLocalBeatIndexInNote=fLocalBeatIndex-float(accRawBeatPrevLength);float localTime=BEAT_TO_TIME(mod(fLocalBeatIndexInNote,float(currentNoteLength))/tempoScale);float fallbackAmp=1.-smoothstep(.90,.99,fLocalBeatIndexInNote/float(currentNoteLength));fallbackAmp=1.;vec2 res=vec2(0.);float acc=0.;for(int i=0;i<4;i++){float fNoteNumber=float(noteNumbers[i]);float isNoteOn=(fNoteNumber>0.?1.:0.);res+=vec2(toneFunc(fNoteNumber,localTime))*isNoteOn*fallbackAmp;acc+=isNoteOn;}float gainAcc=1.5;res/=max(1.,acc-gainAcc);
