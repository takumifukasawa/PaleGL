//
// defines
// 

#define PI 3.14
#define PI2 6.28

// #define OP_ID(p, r) floor((p + r * .5) / r)
// // #define OP_RE(p, r) mod(p + r * .5, r) - r * .5
// #define OP_RE(a, b) mod(a, b) - b * .5

#define OP_ID(p, r) round(p / r)
#define OP_RE(p, r) p - r * round(p / r)
#define OP_LI_RE(p, r, l) p - r * clamp(round(p / r), -l, l)

#define EPS .0001 // general eps
#define OI 80 // object space iteration
#define SI 80 // screen space iteration

//
// operators
// TRSをしたいときは基本的に opTrasnalte -> opRoaet -> opPreScale -> distanceFunction -> opPostScale の順でやる 
//

// ref: https://www.shadertoy.com/view/ldlcRf
vec2 minMat(vec2 d1, vec2 d2) {
    return (d1.x < d2.x) ? d1 : d2;
}

mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, s, -s, c);
}

vec3 opRepeat(vec3 p, float s) {
    return p - s * round(p / s);
}

vec3 opLiRe(vec3 p, float s, vec3 l)
{
    return p - s * clamp(round(p / s), -l, l);
}

vec2 opRo(vec2 p, float a) {
    return p * rot(-a);
}

vec3 opTr(vec3 p, vec3 t) {
    return p - t;
}

// NOTE: sが1以下だとおかしくなることに注意
vec3 opScale(vec3 p, vec3 s) {
    return p * (1. / s);
}

vec3 opPreScale(vec3 p, vec3 s) {
    return p / s;
}

float opPostScale(float d, vec3 s) {
    return d * min(s.x, min(s.y, s.z));
}

vec2 opFoldRotate(in vec2 p, float s) {
    float a = PI / s - atan(p.x, p.y);
    float n = PI * 2. / s;
    a = floor(a / n) * n;
    p = opRo(p, -a);
    return p;
}

float opSm( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

//
// distance functions
//

// radius ... 半径
float dfSphere(vec3 p, float radius) {
    return length(p) - radius;
}

// round box
float dfRb(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r;
}

float dfBo(vec3 p, vec3 b)
{
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// float dfTo(vec3 p, vec2 t)
// {
//     vec2 q = vec2(length(p.xz)-t.x,p.y);
//     return length(q)-t.y;
// }

// float dfOc( vec3 p, float s)
// {
//     p = abs(p);
//     return (p.x+p.y+p.z-s)*0.577;
// }

// float dfCo(vec3 p, vec2 c)
// {
//     vec2 q = vec2(length(p.xz), -p.y);
//     float d = length(q - c * max(dot(q, c), 0.));
//     return d * ((q.x * c.y - q.y * c.x < 0.) ? -1. : 1.);
// }

// ra: 太さ
// rb: R
// h: 高さ
float dfRoundedCylinder(vec3 p, float ra, float rb, float h)
{
    vec2 d = vec2(length(p.xz)-2.0*ra+rb, abs(p.y) - h);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rb;
}

float dfCone(vec3 p, vec2 c, float h)
{
    // c is the sin/cos of the angle, h is height
    // Alternatively pass q instead of (c,h),
    // which is the point at the base in 2D
    vec2 q = h*vec2(c.x/c.y, -1.0);

    vec2 w = vec2(length(p.xz), p.y);
    vec2 a = w - q*clamp(dot(w, q)/dot(q, q), 0.0, 1.0);
    vec2 b = w - q*vec2(clamp(w.x/q.x, 0.0, 1.0), 1.0);
    float k = sign(q.y);
    float d = min(dot(a, a), dot(b, b));
    float s = max(k*(w.x*q.y-w.y*q.x), k*(w.y-q.y));
    return sqrt(d)*sign(s);
}
