float fSdf2alpha(float sdf) {
    float threshold = .5;
    float smoothRange = .01;
    float alpha = smoothstep(
        threshold - smoothRange,
        threshold + smoothRange,
        sdf
    );
    return alpha;
}

float fMedian(vec3 msdf) {
    return max(
        min(msdf.r, msdf.g),
        min(
            max(msdf.r, msdf.g),
            msdf.b
        )
    );
}
