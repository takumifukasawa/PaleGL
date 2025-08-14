
export async function loadImg(src) {
    // TODO: reject pattern
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            resolve(img);
        };
        img.src = src;
    });
}