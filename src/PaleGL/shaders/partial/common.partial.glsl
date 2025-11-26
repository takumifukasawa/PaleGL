
#define saturate(a) clamp(a,0.,1.)

#define smooth(x) smoothstep(0.,1.,x)
#define smoothRange(x,a,b,c,d) smoothstep(a,b,x) * (1.-smoothstep(c,d,x))

#define PI 3.14159265359
#define PI2 6.28318530718
#define RECIPROCAL_PI 0.31830988618
#define RECIPROCAL_PI2 0.15915494
#define LOG2 1.442695
#define EPSILON 1e-6

// CUSTOM_BEGIN additional
#define RHY 1.033;
uniform vec4 uCustomProperties0;
// CUSTOM_END

mat2 fRot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, s, -s, c);
}

// curve ------------------------

// float fAlmostUnitIdentity(float x) {
//     return x*x*(2.0-x);
// }
// 
// float fGain(float x, float k) {
//     float a = 0.5*pow(2.0*((x<0.5)?x:1.0-x), k);
//     return (x<0.5)?a:1.0-a;
// }
// 
// float fExpImpulse(float x, float k) {
//     float h = k*x;
//     return h*exp(1.0-h);
// }

// 0-1
// t:periodic
float fTriCurve(float x, float t) {
	return abs(2.*fract(x*t-.5)-1.)*.5+.5;
}


float fParabola(float x, float k) {
    return pow( 4.0*x*(1.0-x), k );
}

float fPcurve(float x, float a, float b) {
    float k = pow(a+b,a+b)/(pow(a,a)*pow(b,b));
    return k*pow(x,a)*pow(1.0-x,b);
}

// float fExpStep(float x, float n) {
//     return exp2(-exp2(n)*pow(x,n));
// }
