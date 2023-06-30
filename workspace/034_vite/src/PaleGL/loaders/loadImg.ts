export async function loadImg(src): Promise<Image> {
    // TODO: reject pattern
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve(img);
        };
        img.onerror = () => {
            reject(img);
        }
        img.src = src;
    });
}
