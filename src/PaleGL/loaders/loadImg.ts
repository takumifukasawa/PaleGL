export async function loadImg(src: string): Promise<HTMLImageElement> {
    // TODO: reject pattern
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve(img);
        };
        img.onerror = () => {
            reject(img);
        };
        img.src = src;
    });
}


export async function loadImgArraybuffer(src: string) {
    return fetch(src).then((res) => res.arrayBuffer());
}
