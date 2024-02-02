import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';

export class Quaternion {
    elements: Float32Array = new Float32Array(4);

    get x() {
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

    constructor(x: number, y: number, z: number, w: number) {
        this.set(x, y, z, w);
    }

    set(x: number, y: number, z: number, w: number) {
        this.elements = new Float32Array([x, y, z, w]);
        return this;
    }

    // ref:
    // - https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles#Quaternion_to_Euler_angles_conversion
    // - https://github.com/infusion/Quaternion.js/blob/master/quaternion.js
    toEulerRadian() {
        // tmp
        // const x = this.x;
        // const y = this.y;
        // const z = this.z;
        // const w = this.w;
        // const t = 2 * (w * y - z * x);
        // return {
        //     // X-axis rotation
        //     x: Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)),
        //     // Y-axis rotation
        //     y: t >= 1 ? Math.PI / 2 : t <= -1 ? -Math.PI / 2 : Math.asin(t),
        //     // Z-axis rotation
        //     z: Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)),
        // };

        // tmp2
        // const sinr_cosp = 2 * (this.w * this.x + this.y * this.z);
        // const cosr_cosp = 1 - 2 * (this.x * this.x + this.y * this.y);
        // const roll = Math.atan2(sinr_cosp, cosr_cosp);
        //
        // const sinp = Math.sqrt(2 * (this.w * this.y - this.x * this.z));
        // const cosp =  Math.sqrt(1 - 2 * (this.w * this.y + this.x * this.z));
        // const pitch = Math.atan2(sinp, cosp) - Math.PI / 2;
        //
        // const siny_cosp = 2 * (this.w * this.z + this.x * this.y);
        // const cosy_cosp = 1 - 2 * (this.y * this.y + this.z * this.z);
        // const yaw = Math.atan2(siny_cosp, cosy_cosp);
        //
        // return {
        //     x: roll,
        //     y: pitch,
        //     z: yaw,
        // };

        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;
        const wx = w * x;
        const wy = w * y;
        const wz = w * z;
        const xx = x * x;
        const xy = x * y;
        const xz = x * z;
        const yy = y * y;
        const yz = y * z;
        const zz = z * z;

        const asin = (t: number) => {
            // prettier-ignore
            return t >= 1 ? Math.PI / 2 : (t <= -1 ? -Math.PI / 2 : Math.asin(t));
        };

        return {
            x: -Math.atan2(2 * (xy - wz), 1 - 2 * (xx + zz)),
            y: asin(2 * (yz + wx)), // default
            z: -Math.atan2(2 * (xz - wy), 1 - 2 * (xx + yy)),
        };
    }

    // degree
    toEulerDegree() {
        const rad = this.toEulerRadian();
        return {
            x: (rad.x * 180) / Math.PI,
            y: (rad.y * 180) / Math.PI,
            z: (rad.z * 180) / Math.PI,
        };
    }

    toMatrix4() {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;

        const wx = w * x;
        const wy = w * y;
        const wz = w * z;
        const xx = x * x;
        const xy = x * y;
        const xz = x * z;
        const yy = y * y;
        const yz = y * z;
        const zz = z * z;

        // prettier-ignore
        return new Matrix4(
            1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0,
            2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0,
            2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0,
            0, 0, 0, 1
        );
    }

    static identity() {
        return new Quaternion(0, 0, 0, 1);
    }
}
