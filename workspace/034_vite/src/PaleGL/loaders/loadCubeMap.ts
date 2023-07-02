import {loadImg} from "./../loaders/loadImg";
import {CubeMap} from "./../core/CubeMap";

// example
// images: {
//     [CubeMapAxis.PositiveX]: "xxx.png",
//     [CubeMapAxis.NegativeX]: "xxx.png",
//     [CubeMapAxis.PositiveY]: "xxx.png",
//     [CubeMapAxis.NegativeY]: "xxx.png",
//     [CubeMapAxis.PositiveZ]: "xxx.png",
//     [CubeMapAxis.NegativeZ]: "xxx.png",
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
