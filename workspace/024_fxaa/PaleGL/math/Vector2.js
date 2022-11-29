export class Vector2 {
    elements;
    
    get x() {
        return this.elements[0];
    }

    get y() {
        return this.elements[1];
    }

    set x(value) {
        this.elements[0] = value;
    }

    set y(value) {
        this.elements[1] = value;
    }

    constructor(x, y) {
        this.set(x, y);
    }
    
    set(x, y) {
        this.elements = new Float32Array([x, y]);
        return this;
    }
    
    static identity() {
        return new Vector2(0, 0);
    }

    static one() {
        return new Vector2(1, 1);
    }

    log() {
        console.log(`--------------------
${this.x}, ${this.y}
--------------------`);       
    }
}