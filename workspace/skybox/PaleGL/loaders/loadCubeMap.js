import {loadImg} from "./../loaders/loadImg.js";
import {CubeMap} from "./../core/CubeMap.js";

// example
// images: {
//     [CubeMapAxis.PositiveX]: "./images/dir-x-plus.png",
//     [CubeMapAxis.NegativeX]: "./images/dir-x-minus.png",
//     [CubeMapAxis.PositiveY]: "./images/dir-y-plus.png",
//     [CubeMapAxis.NegativeY]: "./images/dir-y-minus.png",
//     [CubeMapAxis.PositiveZ]: "./images/dir-z-plus.png",
//     [CubeMapAxis.NegativeZ]: "./images/dir-z-minus.png",
// };
 
export async function loadCubeMap({ gpu, images }) {
    return await Promise.all(Object.keys(images).map(async(key) => {
            const img = await loadImg(images[key]);
            return { key, img };
        }))
        .then(result => {
            const data = {};
            result.forEach(({ key, img }) => data[key] = img);
            return new CubeMap({ gpu, images: data });
        });
}