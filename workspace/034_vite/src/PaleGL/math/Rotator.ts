import {Quaternion} from "./Quaternion";

export class Rotator {
    // x, y, z axes
    // 一旦そのままdegreeが入る想定
    elements: Float32Array = new Float32Array(3); 
   
    // degree
    get x() {
        return this.elements[0];
    }
   
    // degree
    get y() {
        return this.elements[1];
    }
   
    // degree
    get z() {
        return this.elements[2];
    }

    // degree
    get roll() {
        return this.elements[2];
    }

    // degree
    get pitch() {
        return this.elements[0];
    }

    // degree
    get yaw() {
        return this.elements[1];
    }
   
    // degree
    getAxes() {
        return {
            x: this.elements[0],
            y: this.elements[1],
            z: this.elements[2],
        }
    }
    
    getAxesRadians() {
        return {
            x: this.elements[0] * Math.PI / 180,
            y: this.elements[1] * Math.PI / 180,
            z: this.elements[2] * Math.PI / 180,
        }
    }

    // degrees
    constructor(x: number, y: number, z: number) {
        this.set(x, y, z);
    }
    
    set(x: number, y: number, z: number) {
        this.elements = new Float32Array([x, y, z]);
        return this;
    }
    
    static get zero() {
        return new Rotator(0, 0, 0);
    }
    
    static fromRadian(x: number, y: number, z: number) {
        const rotator = Rotator.zero.set(
            x * 180 / Math.PI,
            y * 180 / Math.PI,
            z * 180 / Math.PI,
        );
        return rotator;
    }
    
    static fromQuaternion(q: Quaternion) {
        const euler = q.toEulerDegree();
        return new Rotator(euler.x, euler.y, euler.z);
    }
    
    setRotationX(degree: number) {
        this.elements[0] = degree;
    }
    
    setRotationY(degree: number) {
        this.elements[1] = degree;
    }
    
    setRotationZ(degree: number) {
        this.elements[2] = degree;
    }
}
