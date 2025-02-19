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

// type CubeMapDirectionImagePaths = {
//     [key in CubeMapAxis]: string;
// };

// export type CubeMapDirectionImages = {
//     [key in CubeMapAxis]: HTMLImageElement | HTMLCanvasElement;
// };

export function createCubeMap(
    gpu: GPU,
    posXImage: HTMLImageElement | HTMLCanvasElement,
    negXImage: HTMLImageElement | HTMLCanvasElement,
    posYImage: HTMLImageElement | HTMLCanvasElement,
    negYImage: HTMLImageElement | HTMLCanvasElement,
    posZImage: HTMLImageElement | HTMLCanvasElement,
    negZImage: HTMLImageElement | HTMLCanvasElement
) {
    return new CubeMap(
        gpu,
        posXImage.width,
        posXImage.height,
        posXImage,
        negXImage,
        posYImage,
        negYImage,
        posZImage,
        negZImage
    );
}

export async function loadCubeMap(
    gpu: GPU,
    posXImage: string,
    negXImage: string,
    posYImage: string,
    negYImage: string,
    posZImage: string,
    negZImage: string
) {
    const paths = [
        {
            axis: CubeMapAxis.PositiveX,
            path: posXImage,
        },
        {
            axis: CubeMapAxis.NegativeX,
            path: negXImage,
        },
        {
            axis: CubeMapAxis.PositiveY,
            path: posYImage,
        },
        {
            axis: CubeMapAxis.NegativeY,
            path: negYImage,
        },
        {
            axis: CubeMapAxis.PositiveZ,
            path: posZImage,
        },
        {
            axis: CubeMapAxis.NegativeZ,
            path: negZImage,
        },
    ];

    return await Promise.all(
        paths.map(async ({ axis, path }) => {
            const img = await loadImg(path);
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
        // const data: CubeMapDirectionImages = {};
        // result.forEach(({ axis, img }) => {
        //     data[axis] = img;
        // });
        return createCubeMap(gpu, ...result.map(({ img }) => img));
        // return new CubeMap({
        //     gpu,
        //     images: data,
        //     // axisごとに同じサイズ想定のはず
        //     width: data[CubeMapAxis.PositiveX].width,
        //     height: data[CubeMapAxis.PositiveX].height,
        // });
    });
}
