export class Rotator {
    // x, y, z axes
    // 一旦そのままdegreeが入る想定
    elements; 
    
    get roll() {
        return this.elements[2];
    }
    
    get pitch() {
        return this.elements[0];
    }
    
    get yaw() {
        return this.elements[1];
    }
    
    getAxes() {
        return {
            x: this.elements[0],
            y: this.elements[1],
            z: this.elements[2],
        }
    }
    
    getAxesRadians() {
        return {
            x: this.elements[0] * Math.PI / 180 ,
            y: this.elements[1] * Math.PI / 180 ,
            z: this.elements[2] * Math.PI / 180 ,
        }
    }

    // degrees
    constructor(x, y, z) {
        this.set(x, y, z);
    }
    
    set(x, y, z) {
        this.elements = new Float32Array([x, y, z]);
        return this;
    }
    
    static zero() {
        return new Rotator(0, 0, 0);
    }
    
    static fromRadian(x, y, z) {
        const rotator = new Rotator().set(
            x * 180 / Math.PI,
            y * 180 / Math.PI,
            z * 180 / Math.PI,
        );
        return rotator;
    }
    
    setRotationX(degree) {
        this.elements[0] = degree;
    }
    
    setRotationY(degree) {
        this.elements[1] = degree;
    }
    
    setRotationZ(degree) {
        this.elements[2] = degree;
    }
}
