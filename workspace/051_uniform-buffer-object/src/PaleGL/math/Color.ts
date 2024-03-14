export class Color {
    elements: Float32Array = new Float32Array(4); // each 0~1

    get r() {
        return this.elements[0];
    }

    get g() {
        return this.elements[1];
    }

    get b() {
        return this.elements[2];
    }

    get a() {
        return this.elements[3];
    }

    get r255() {
        return this.elements[0] * 255;
    }

    get g255() {
        return this.elements[1] * 255;
    }

    get b255() {
        return this.elements[2] * 255;
    }

    get a255() {
        return this.elements[3] * 255;
    }

    get rgbArray() {
        return [this.r, this.g, this.b];
    }

    set r(value) {
        this.elements[0] = value;
    }

    set g(value) {
        this.elements[1] = value;
    }

    set b(value) {
        this.elements[2] = value;
    }

    set a(value) {
        this.elements[3] = value;
    }

    constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 1) {
        this.set(r, g, b, a);
    }

    set(r: number, g: number, b: number, a: number) {
        this.elements = new Float32Array([r, g, b, a]);
    }

    getRGB() {
        return {
            r: this.r255,
            g: this.g255,
            b: this.b255,
        };
    }

    getHexCoord(withHash = true) {
        const rgb = this.getRGB();
        const r = rgb.r.toString(16).padStart(2, '0');
        const g = rgb.g.toString(16).padStart(2, '0');
        const b = rgb.b.toString(16).padStart(2, '0');
        const str = withHash ? `#${r}${g}${b}` : `${r}${g}${b}`;
        // for debug
        // console.log(rgb, str, this.r, this.g, this.b)
        return str;
    }

    static get white() {
        return new Color(1, 1, 1, 1);
    }

    static get black() {
        return new Color(0, 0, 0, 1);
    }

    static get green() {
        return new Color(0, 0, 1, 1);
    }

    static fromRGB(r: number, g: number, b: number, a: number = 255) {
        return new Color(r / 255, g / 255, b / 255, a / 255);
    }

    static fromArray(data: number[]) {
        return new Color(data[0], data[1], data[2], data[3] ? data[3] : 1);
    }

    // hex ... #rrggbb or rrggbb
    static fromHex(hex: string) {
        const coord = hex.slice(0, 1) === '#' ? hex.slice(1) : hex;
        const r = coord.slice(0, 2);
        const g = coord.slice(2, 4);
        const b = coord.slice(4, 6);
        return new Color(Number.parseInt(r, 16) / 255, Number.parseInt(g, 16) / 255, Number.parseInt(b, 16) / 255, 1);
    }
}
