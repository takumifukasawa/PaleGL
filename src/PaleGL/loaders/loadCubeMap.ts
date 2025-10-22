import { loadImg } from '@/PaleGL/loaders/loadImg';
import { createCubeMap, CubeMap } from '@/PaleGL/core/cubeMap.ts';
import {
    CUBE_MAP_AXIS_POSITIVE_X,
    CUBE_MAP_AXIS_NEGATIVE_X,
    CUBE_MAP_AXIS_POSITIVE_Y,
    CUBE_MAP_AXIS_NEGATIVE_Y,
    CUBE_MAP_AXIS_POSITIVE_Z,
    CUBE_MAP_AXIS_NEGATIVE_Z
} from '@/PaleGL/constants';
import { Gpu } from '@/PaleGL/core/gpu.ts';

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

export async function loadCubeMap(
    gpu: Gpu,
    posXImage: string,
    negXImage: string,
    posYImage: string,
    negYImage: string,
    posZImage: string,
    negZImage: string
) {
    const paths = [
        {
            axis: CUBE_MAP_AXIS_POSITIVE_X,
            path: posXImage,
        },
        {
            axis: CUBE_MAP_AXIS_NEGATIVE_X,
            path: negXImage,
        },
        {
            axis: CUBE_MAP_AXIS_POSITIVE_Y,
            path: posYImage,
        },
        {
            axis: CUBE_MAP_AXIS_NEGATIVE_Y,
            path: negYImage,
        },
        {
            axis: CUBE_MAP_AXIS_POSITIVE_Z,
            path: posZImage,
        },
        {
            axis: CUBE_MAP_AXIS_NEGATIVE_Z,
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
