import { randomRange } from '@/PaleGL/utilities/mathUtilities.ts';

export type Color = { e: Float32Array };

export const createColor = (r: number = 0, g: number = 0, b: number = 0, a: number = 1): Color => {
    return { e: new Float32Array([r, g, b, a]) };
}

export const getColorR = (color: Color) => {
    return color.e[0];
}

export const getColorG = (color: Color) => {
    return color.e[1];
}

export const getColorB = (color: Color) => {
    return color.e[2];
}

export const getColorA = (color: Color) => {
    return color.e[3];
}

export const getColorR255 = (color: Color) => {
    return color.e[0] * 255;
}

export const getColorG255 = (color: Color) => {
    return color.e[1] * 255;
}

export const getColorB255 = (color: Color) => {
    return color.e[2] * 255;
}

export const getColorA255 = (color: Color) => {
    return color.e[3] * 255;
}

export const getColorRGBArray = (color: Color) => {
    return [color.e[0], color.e[1], color.e[2]];
}

export const setColorR = (color: Color, value: number) => {
    color.e[0] = value;
}

export const setColorG = (color: Color, value: number) => {
    color.e[1] = value;
}

export const setColorB = (color: Color, value: number) => {
    color.e[2] = value;
}

export const setColorA = (color: Color, value: number) => {
    color.e[3] = value;
}

export const setColorChannels = (color: Color, r: number, g: number, b: number, a: number) => {
    color.e[0] = r;
    color.e[1] = g;
    color.e[2] = b;
    color.e[3] = a;
}

export const setColorChannel = (color: Color, key: string, value: number) => {
    switch (key) {
        case 'r':
            color.e[0] = value;
            break;
        case 'g':
            color.e[1] = value;
            break;
        case 'b':
            color.e[2] = value;
            break;
        case 'a':
            color.e[3] = value;
            break;
    }
}

export const multiplyColorScalar = (color: Color, s: number, withAlpha: boolean = false) => {
    color.e[0] *= s;
    color.e[1] *= s;
    color.e[2] *= s;
    if (withAlpha) {
        color.e[3] *= s;
    }
    return color;
}

export const getColorRGB = (color: Color) => {
    return {
        r: getColorR255(color),
        g: getColorG255(color),
        b: getColorB255(color),
    };
}

export const getColorHexCoord = (color: Color, withHash = true) => {
    const rgb = getColorRGB(color);
    const r = rgb.r.toString(16).padStart(2, '0');
    const g = rgb.g.toString(16).padStart(2, '0');
    const b = rgb.b.toString(16).padStart(2, '0');
    const str = withHash ? `#${r}${g}${b}` : `${r}${g}${b}`;
    // for debug
    // console.log(rgb, str, this.r, this.g, this.b)
    return str;
}

export const cloneColor = (color: Color) => {
    return new Float32Array([color.e[0], color.e[1], color.e[2], color.e[3]]);
}

export const copyColor = (dest: Color, src: Color) => {
    dest.e[0] = src.e[0];
    dest.e[1] = src.e[1];
    dest.e[2] = src.e[2];
    dest.e[3] = src.e[3];
}
    

export const createColorWhite = () => {
    return createColor(1, 1, 1, 1);
}

export const createColorBlack = () => {
    return createColor(0, 0, 0, 1);
}

export const createColorGreen = () => {
    return createColor(0, 0, 1, 1);
}

export const createColorFromRGB = (r: number, g: number, b: number, a: number = 255) => {
    return createColor(r / 255, g / 255, b / 255, a / 255);
}

export const createColorFromArray = (data: number[]) => {
    return createColor(data[0], data[1], data[2], data[3] ? data[3] : 1);
}

// hex ... #rrggbb or rrggbb
export const createColorFromHex = (hex: string) => {
    const coord = hex.slice(0, 1) === '#' ? hex.slice(1) : hex;
    const r = coord.slice(0, 2);
    const g = coord.slice(2, 4);
    const b = coord.slice(4, 6);
    return createColor(Number.parseInt(r, 16) / 255, Number.parseInt(g, 16) / 255, Number.parseInt(b, 16) / 255, 1);
}

// hex ... #rrggbbi or rrggbbii (ii = intensity 0~10)
export const createEmissiveColorFromHex = (hex: string) => {
    const coord = hex.slice(0, 1) === '#' ? hex.slice(1) : hex;
    const r = coord.slice(0, 2);
    const g = coord.slice(2, 4);
    const b = coord.slice(4, 6);
    const i = coord.slice(6, 8);
    const ni = Number.parseInt(i) / (255 / 10);
    return createColor(
        (Number.parseInt(r, 16) / 255) * ni,
        (Number.parseInt(g, 16) / 255) * ni,
        (Number.parseInt(b, 16) / 255) * ni,
        1
    );
}

export const getColorRange = (minColor: Color, maxColor: Color) => {
    const r = randomRange(getColorR(minColor), getColorR(maxColor));
    const g = randomRange(getColorG(minColor), getColorG(maxColor));
    const b = randomRange(getColorB(minColor), getColorB(maxColor));
    const a = randomRange(getColorA(minColor), getColorA(maxColor));
    return createColor(r, g, b, a);
}
