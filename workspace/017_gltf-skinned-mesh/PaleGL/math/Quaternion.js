
export class Quaternion {
    elements;
    
    get x () {
        return this.elements[0];
    }
    
    get y() {
        return this.elements[1];
    }

    get z() {
        return this.elements[2];
    }

    get w() {
        return this.elements[3];
    }

    constructor(x, y, z, w) {
        this.set(x, y, z, w);
    }
    
    set(x, y, z, w) {
        this.elements = new Float32Array([x, y, z, w]);
        return this;
    }
    
    toEulerRadian() {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;
        const t = 2 * (w * y - z * x);

        return {
            // X-axis rotation
            x: (Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y))),
            // Y-axis rotation
            y: (t >= 1 ? Math.PI / 2 : (t <= -1 ? -Math.PI / 2 : Math.asin(t))),
            // Z-axis rotation
            z: (Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)))
        };
    }
    
    // ref: https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles#Quaternion_to_Euler_angles_conversion
    // ref: https://github.com/infusion/Quaternion.js/blob/master/quaternion.js
    // degree
    toEulerDegree() {
        const rad = this.toEulerRadian();
        return {
            x: rad.x * 180 / Math.PI,
            y: rad.y * 180 / Math.PI,
            z: rad.z * 180 / Math.PI,
        };
    }
}