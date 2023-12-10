import { loadImg } from '@/PaleGL/loaders/loadImg';
import { CubeMap } from '@/PaleGL/core/CubeMap';
import { CubeMapAxis } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';

// example
// images: {
//     [CubeMapAxis.PositiveX]: "xxx.png",
//     [CubeMapAxis.NegativeX]: "xxx.png",
//     [CubeMapAxis.PositiveY]: "xxx.png",
//     [CubeMapAxis.NegativeY]: "xxx.png",
//     [CubeMapAxis.PositiveZ]: "xxx.png",
//     [CubeMapAxis.NegativeZ]: "xxx.png",
// };

type CubeMapDirectionImagePaths = {
    [key in CubeMapAxis]: string;
};

export type CubeMapDirectionImages = {
    [key in CubeMapAxis]: HTMLImageElement | HTMLCanvasElement;
};

export function createCubeMap({ gpu, images }: { gpu: GPU; images: CubeMapDirectionImages }) {
    return new CubeMap({
        gpu,
        images,
        // axisごとに同じサイズ想定のはず
        width: images[CubeMapAxis.PositiveX].width,
        height: images[CubeMapAxis.PositiveX].height,
    });
}

export async function loadCubeMap({ gpu, images }: { gpu: GPU; images: CubeMapDirectionImagePaths }) {
    return await Promise.all(
        Object.keys(images).map(async (key) => {
            const axis = key as CubeMapAxis;
            const img = await loadImg(images[axis]);
            return { axis, img };
        })
    ).then<CubeMap>((result) => {
        // default
        // const data: {};
        // result.forEach(({ key, img }) => {
        //     const axis = key as CubeMapAxis;
        //     data[axis] = img
        // });
        // return new CubeMap({ gpu, images: data });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const data: CubeMapDirectionImages = {};
        result.forEach(({ axis, img }) => {
            data[axis] = img;
        });
        return createCubeMap({ gpu, images: data });
        // return new CubeMap({
        //     gpu,
        //     images: data,
        //     // axisごとに同じサイズ想定のはず
        //     width: data[CubeMapAxis.PositiveX].width,
        //     height: data[CubeMapAxis.PositiveX].height,
        // });
    });
}
