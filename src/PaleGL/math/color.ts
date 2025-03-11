// export class Color {
//     e: Float32Array = new Float32Array(4); // each 0~1
//
//     get r() {
//         return this.e[0];
//     }
//
//     get g() {
//         return this.e[1];
//     }
//
//     get b() {
//         return this.e[2];
//     }
//
//     get a() {
//         return this.e[3];
//     }
//
//     get r255() {
//         return this.e[0] * 255;
//     }
//
//     get g255() {
//         return this.e[1] * 255;
//     }
//
//     get b255() {
//         return this.e[2] * 255;
//     }
//
//     get a255() {
//         return this.e[3] * 255;
//     }
//
//     get rgbArray() {
//         return [this.r, this.g, this.b];
//     }
//
//     set r(value) {
//         this.e[0] = value;
//     }
//
//     set g(value) {
//         this.e[1] = value;
//     }
//
//     set b(value) {
//         this.e[2] = value;
//     }
//
//     set a(value) {
//         this.e[3] = value;
//     }
//
//     constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 1) {
//         this.set(r, g, b, a);
//     }
//
//     set(r: number, g: number, b: number, a: number) {
//         this.e = new Float32Array([r, g, b, a]);
//     }
//
//     multiplyScalar(s: number, withAlpha: boolean = false) {
//         this.e[0] *= s;
//         this.e[1] *= s;
//         this.e[2] *= s;
//         if (withAlpha) {
//             this.e[3] *= s;
//         }
//         return this;
//     }
//
//     getRGB() {
//         return {
//             r: this.r255,
//             g: this.g255,
//             b: this.b255,
//         };
//     }
//
//     getHexCoord(withHash = true) {
//         const rgb = this.getRGB();
//         const r = rgb.r.toString(16).padStart(2, '0');
//         const g = rgb.g.toString(16).padStart(2, '0');
//         const b = rgb.b.toString(16).padStart(2, '0');
//         const str = withHash ? `#${r}${g}${b}` : `${r}${g}${b}`;
//         // for debug
//         // console.log(rgb, str, this.r, this.g, this.b)
//         return str;
//     }
//
//     copy(color : Color) {
//         this.r = color.r;
//         this.g = color.g;
//         this.b = color.b;
//         this.a = color.a;
//         return this;
//     }
//
//     static get white() {
//         return new Color(1, 1, 1, 1);
//     }
//
//     static get black() {
//         return new Color(0, 0, 0, 1);
//     }
//
//     static get green() {
//         return new Color(0, 0, 1, 1);
//     }
//
//     static fromRGB(r: number, g: number, b: number, a: number = 255) {
//         return new Color(r / 255, g / 255, b / 255, a / 255);
//     }
//
//     static fromArray(data: number[]) {
//         return new Color(data[0], data[1], data[2], data[3] ? data[3] : 1);
//     }
//
//     // hex ... #rrggbb or rrggbb
//     static fromHex(hex: string) {
//         const coord = hex.slice(0, 1) === '#' ? hex.slice(1) : hex;
//         const r = coord.slice(0, 2);
//         const g = coord.slice(2, 4);
//         const b = coord.slice(4, 6);
//         return new Color(Number.parseInt(r, 16) / 255, Number.parseInt(g, 16) / 255, Number.parseInt(b, 16) / 255, 1);
//     }
// }

export type Color = { e: Float32Array };

export function createColor(r: number = 0, g: number = 0, b: number = 0, a: number = 1): Color {
    return { e: new Float32Array([r, g, b, a]) };
}

export function getColorR(color: Color) {
    return color.e[0];
}

export function getColorG(color: Color) {
    return color.e[1];
}

export function getColorB(color: Color) {
    return color.e[2];
}

export function getColorA(color: Color) {
    return color.e[3];
}

export function getColorR255(color: Color) {
    return color.e[0] * 255;
}

export function getColorG255(color: Color) {
    return color.e[1] * 255;
}

export function getColorB255(color: Color) {
    return color.e[2] * 255;
}

export function getColorA255(color: Color) {
    return color.e[3] * 255;
}

export function getColorRGBArray(color: Color) {
    return [color.e[0], color.e[1], color.e[2]];
}

export function setColorR(color: Color, value: number) {
    color.e[0] = value;
}

export function setColorG(color: Color, value: number) {
    color.e[1] = value;
}

export function setColorB(color: Color, value: number) {
    color.e[2] = value;
}

export function setColorA(color: Color, value: number) {
    color.e[3] = value;
}

export function multiplyColorScalar(color: Color, s: number, withAlpha: boolean = false) {
    color.e[0] *= s;
    color.e[1] *= s;
    color.e[2] *= s;
    if (withAlpha) {
        color.e[3] *= s;
    }
    return color;
}

export function getColorRGB(color: Color) {
    return {
        r: getColorR255(color),
        g: getColorG255(color),
        b: getColorB255(color),
    };
}

export function getColorHexCoord(color: Color, withHash = true) {
    const rgb = getColorRGB(color);
    const r = rgb.r.toString(16).padStart(2, '0');
    const g = rgb.g.toString(16).padStart(2, '0');
    const b = rgb.b.toString(16).padStart(2, '0');
    const str = withHash ? `#${r}${g}${b}` : `${r}${g}${b}`;
    // for debug
    // console.log(rgb, str, this.r, this.g, this.b)
    return str;
}

export function copyColor(color: Color) {
    return new Float32Array([color.e[0], color.e[1], color.e[2], color.e[3]]);
}

export function createColorWhite() {
    return createColor(1, 1, 1, 1);
}

export function createColorBlack() {
    return createColor(0, 0, 0, 1);
}

export function createColorGreen() {
    return createColor(0, 0, 1, 1);
}

export function createColorFromRGB(r: number, g: number, b: number, a: number = 255) {
    return createColor(r / 255, g / 255, b / 255, a / 255);
}

export function createColorFromArray(data: number[]) {
    return createColor(data[0], data[1], data[2], data[3] ? data[3] : 1);
}

// hex ... #rrggbb or rrggbb
export function createColorFromHex(hex: string) {
    const coord = hex.slice(0, 1) === '#' ? hex.slice(1) : hex;
    const r = coord.slice(0, 2);
    const g = coord.slice(2, 4);
    const b = coord.slice(4, 6);
    return createColor(Number.parseInt(r, 16) / 255, Number.parseInt(g, 16) / 255, Number.parseInt(b, 16) / 255, 1);
}
