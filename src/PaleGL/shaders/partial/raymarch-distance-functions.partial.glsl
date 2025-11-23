//
// defines
// 

#define OP_ID(p,r) round(p/r)
#define OP_RE(p,r) p-r*round(p/r)
#define OP_LI_RE(p,r,l) p-r*clamp(round(p/r),-l,l)
#define SW(a,b,l) l>.5?b:a

#define EPS .0001 // general eps
#define OI 99 // object space iteration
#define SI 80 // screen space iteration

//
// operators
// TRSをしたいときは基本的に opTrasnalte -> opRotate -> opPreScale -> distanceFunction -> opPostScale の順でやる 
//

// ref: https://www.shadertoy.com/view/ldlcRf
// License: CC BY-NC-SA 3.0 (Shadertoy default license)
vec2 fMinMat(vec2 d1, vec2 d2) {
    return (d1.x < d2.x) ? d1 : d2;
}

mat2 fRot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, s, -s, c);
}

vec3 fOpRepeat(vec3 p, float s) {
    return p - s * round(p / s);
}

vec3 fOpLiRe(vec3 p, float s, vec3 l)
{
    return p - s * clamp(round(p / s), -l, l);
}

vec2 fOpRo(vec2 p, float a) {
    return p * fRot(-a);
}

// p: 座標
// xz: 前後回転: -で前
// xy: 上下回転: -で上
// yz: ひねり: +で[+z->-y]側へひねり
vec3 fOpRot3(vec3 p, float x, float y, float z) {
    p.xy = fOpRo(p.xy, -z); // z
    p.yz = fOpRo(p.yz, -x); // x
    p.xz = fOpRo(p.xz, -y); // y
    return p;
}


vec3 fOpTr(vec3 p, vec3 t) {
    return p - t;
}

void fOpTrOut(out vec3 p, vec3 t) {
    p = p - t;
}

// NOTE: sが1以下だとおかしくなることに注意
vec3 fOpSc(vec3 p, vec3 s) {
    return p * (1. / s);
}

vec3 fOpPrSc(vec3 p, vec3 s) {
    return p / s;
}

float fOpPoSc(float d, vec3 s) {
    return d * min(s.x, min(s.y, s.z));
}

vec2 fOpFoldRotate(in vec2 p, float s) {
    float a = PI / s - atan(p.x, p.y);
    float n = PI * 2. / s;
    a = floor(a / n) * n;
    p = fOpRo(p, -a);
    return p;
}

// union
float fOpUni(float d1, float d2) {
    return min(d1, d2);
}

// sub: d2 - d1
float fOpSub(float d1, float d2) {
    return max(-d1, d2);
}

// intersection
float fOpIntersection(float d1, float d2) {
    return max(d1, d2);
}

// smooth union
float fOpSm( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0., 1. );
    return mix( d2, d1, h ) - k*h*(1.-h);
}

// smooth subtracgion
float fOpSmSub(float d1, float d2, float k) {
    return -fOpSm(d1, d2, k);
}

vec3 fOpLimRep(vec3 p, float s, vec3 l) {
    return p - s*clamp(round(p/s),-l,l);
}

//
// distance functions
// 使わないものは適宜コメントアウト
//

// radius ... 半径
float fDfSp(vec3 p, float radius) {
    return length(p) - radius;
}

// round box
float fDfRb(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r;
}

// box
// b...辺の半分の長さ
float fDfBox(vec3 p, vec3 b)
{
    vec3 q = abs(p) - b;
    return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.);
}

// box
// b...辺の長さ
float fDfBoxt(vec3 p, vec3 b)
{
    return fDfBox(p, b * .5);
}

float fDfRBox(vec3 p, vec3 b, float r)
{
    vec3 q = abs(p) - b + r;
    return length(max(q,0.)) + min(max(q.x,max(q.y,q.z)),0.) - r;
}

float fDfRBoxt(vec3 p, vec3 b, float r)
{
    return fDfRBox(p, b * .5, r);
}

// box frame
float fDfBoxFrame(vec3 p, vec3 b, float e) {
    p = abs(p)-b;
    vec3 q = abs(p+e)-e;
    return min(min(
        length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
        length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
        length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
}


// capsule
// a ... capsuleの下の球の中心
// b ... capsuleの上の球の中心
// r ... 大きさ
float fDfCa(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
    return length(pa - ba * h) - r;
}

// capsule - 直立 & 中心基準
// c ... capsuleの中心
// h ... 高さ
// r ... 球の大きさ
// 合計の高さは h + r * 2
float fDfCac(vec3 p, vec3 c, float h, float r)
{
    float hh = h * .5;
    vec3 a = c - vec3(0., hh, 0.);
    vec3 b = c + vec3(0., hh, 0.);
    return fDfCa(p, a, b, r);
}

// capsule - 下の球がy=0に接地
// c ... capsuleの中心
// h ... 高さ
// r ... 球の大きさ
// 合計の高さは h + r * 2
float fDfCaa(vec3 p, vec3 c, float h, float r)
{
    vec3 a = c;
    vec3 b = c + vec3(0., h, 0.);
    return fDfCa(p, a, b, r);
}

// float dfCav(vec3 p, float h, float r)
// {
//     p.y -= clamp(p.y, 0., h);
//     return length(p) - r;
// }

// t.xy ... [全体の太さ, 径の太さ]
float fDfTorus(vec3 p, vec2 t)
{
    vec2 q = vec2(length(p.xz)-t.x,p.y);
    return length(q)-t.y;
}

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

// float fDfCappedCylinder(vec3 p, float r, float h) {
//     vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(r,h);
//     return min(max(d.x,d.y),0.0) + length(max(d,0.0));
// }

// ra: 太さ
// rb: R
// h: 高さ
float fDfRoundedCylinder(vec3 p, float h, float ra, float rb)
{
    vec2 d = vec2(length(p.xz)-2.*ra+rb, abs(p.y) - h);
    return min(max(d.x, d.y), 0.) + length(max(d, 0.)) - rb;
}

float fDfCone(vec3 p, float h, vec2 c)
{
    // c is the sin/cos of the angle, h is height
    // Alternatively pass q instead of (c,h),
    // which is the point at the fbase in 2D
    vec2 q = h*vec2(c.x/c.y, -1.);

    vec2 w = vec2(length(p.xz), p.y);
    vec2 a = w - q*clamp(dot(w, q)/dot(q, q), 0., 1.);
    vec2 b = w - q*vec2(clamp(w.x/q.x, 0., 1.), 1.);
    float k = sign(q.y);
    float d = min(dot(a, a), dot(b, b));
    float s = max(k*(w.x*q.y-w.y*q.x), k*(w.y-q.y));
    return sqrt(d)*sign(s);
}

// p ... position
// r1 ... bottom radius
// r2 ... top radius
// h ... height
// r2の中心が基準の位置
float fDfRco(vec3 p, float h, float r1, float r2)
{
    float b = (r1-r2)/h;
    float a = sqrt(1.-b*b);
    
    vec2 q = vec2( length(p.xz), p.y );
    float k = dot(q,vec2(-b,a));
    if( k<0. ) return length(q) - r1;
    if( k>a*h ) return length(q-vec2(0.,h)) - r2;
    return dot(q, vec2(a,b) ) - r1;
}

float fDfRcot(vec3 p, float h, float r1, float r2) {
    p.y += h;
    return fDfRco(p, h, r1, r2);
}

// resolved vesica
float fDfVes(vec3 p, vec3 a, vec3 b, float w)
{
    vec3  c = (a+b)*0.5;
    float l = length(b-a);
    vec3  v = (b-a)/l;
    float y = dot(p-c,v);
    vec2  q = vec2(length(p-c-y*v),abs(y));
    
    float r = 0.5*l;
    float d = 0.5*(r*r-w*w)/w;
    vec3  h = (r*q.x<d*(q.y-r)) ? vec3(0.,r,0.) : vec3(-d,0.,d+w);
 
    return length(q-h.xy) - h.z;
}

// p, height, width, tube radius
float fDfLink(vec3 p, float le, float r1, float r2) {
  vec3 q = vec3(p.x, max(abs(p.y)-le,0.0), p.z);
  return length(vec2(length(q.xy)-r1,q.z)) - r2;
}

// curve ------------------------

float fExpImpulse(float x, float k) {
    float h = k*x;
    return h*exp(1.0-h);
}

float fParabola(float x, float k) {
    return pow( 4.0*x*(1.0-x), k );
}

float fPcurve(float x, float a, float b) {
    float k = pow(a+b,a+b)/(pow(a,a)*pow(b,b));
    return k*pow(x,a)*pow(1.0-x,b);
}

// mapping ------------------------

// ref:
// https://www.shadertoy.com/view/ws3Bzf
vec4 fBiplanar( sampler2D sam, in vec3 p, in vec3 n, in float k )
{
    // grab coord derivatives for texturing
    vec3 dpdx = dFdx(p);
    vec3 dpdy = dFdy(p);
    n = abs(n);

    // determine major axis (in x; yz are following axis)
    ivec3 ma = (n.x>n.y && n.x>n.z) ? ivec3(0,1,2) :
               (n.y>n.z)            ? ivec3(1,2,0) :
                                      ivec3(2,0,1) ;
    // determine minor axis (in x; yz are following axis)
    ivec3 mi = (n.x<n.y && n.x<n.z) ? ivec3(0,1,2) :
               (n.y<n.z)            ? ivec3(1,2,0) :
                                      ivec3(2,0,1) ;
    // determine median axis (in x;  yz are following axis)
    ivec3 me = ivec3(3) - mi - ma;
    
    // project+fetch
    vec4 x = textureGrad( sam, vec2(   p[ma.y],   p[ma.z]), 
                               vec2(dpdx[ma.y],dpdx[ma.z]), 
                               vec2(dpdy[ma.y],dpdy[ma.z]) );
    vec4 y = textureGrad( sam, vec2(   p[me.y],   p[me.z]), 
                               vec2(dpdx[me.y],dpdx[me.z]),
                               vec2(dpdy[me.y],dpdy[me.z]) );
    
    // blend factors
    vec2 w = vec2(n[ma.x],n[me.x]);
    // make local support
    w = clamp( (w-0.5773)/(1.0-0.5773), 0.0, 1.0 );
    // shape transition
    w = pow( w, vec2(k/8.0) );
    // blend and return
    return (x*w.x + y*w.y) / (w.x + w.y);
}

// ref:
// https://qiita.com/edo_m18/items/c8995fe91778895c875e
// https://www.shadertoy.com/view/wtjGWy
vec3 fTex3D(sampler2D tex, vec3 p, vec3 n) {
    vec3 blending = abs(n);
    blending = normalize(max(blending, EPS));
    
    float b = (blending.x + blending.y + blending.z);
    blending /= b;
    
    vec4 xaxis = texture(tex, p.yz); // yz plane
    vec4 yaxis = texture(tex, p.xz); // xz plane
    vec4 zaxis = texture(tex, p.xy); // xy plane

    return (xaxis * blending.x + yaxis * blending.y + zaxis * blending.z).rgb;
}
