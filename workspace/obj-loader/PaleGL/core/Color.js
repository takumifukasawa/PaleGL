export class Color {
    elements;
    
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
    
    constructor(r, g, b, a) {
        this.set(r, g, b, a);
    }
    
    set(r, g, b, a) {
        this.elements = new Float32Array([r, g, b, a]);
    }
    
    static white() {
        return new Color(1, 1, 1, 1);
    }
    
    static black() {
        return new Color(0, 0, 0, 1);
    }
    
    static fromRGB(r, g, b, a) {
        return new Color(r / 255, g / 255, b / 255, 1);
    }
   
    // hex ... #rrggbb or rrggbb
    static fromHex(hex) {
        const coord = hex.slice(0, 1) === "#" ? hex.slice(1) : hex;
        const r = coord.slice(0, 2);
        const g = coord.slice(2, 4);
        const b = coord.slice(4, 6);
        return new Color(
            Number.parseInt(r, 16) / 255,
            Number.parseInt(g, 16) / 255,
            Number.parseInt(b, 16) / 255,
            1
        );
    }
}