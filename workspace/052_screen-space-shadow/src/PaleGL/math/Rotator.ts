import { Quaternion } from '@/PaleGL/math/Quaternion';
import {Matrix4} from "@/PaleGL/math/Matrix4.ts";
import {Vector3} from "@/PaleGL/math/Vector3.ts";

export class Rotator {
    // x, y, z axes
    // そのままdegreeが入る
    elements: Float32Array = new Float32Array(3);
    rawMatrix: Matrix4 | null = null;

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
    set x(v: number) {
        this.elements[0] = v;
    }

    // degree
    set y(v: number) {
        this.elements[1] = v;
    }

    // degree
    set z(v: number) {
        this.elements[2] = v;
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
        };
    }

    getAxesRadians() {
        return {
            x: (this.elements[0] * Math.PI) / 180,
            y: (this.elements[1] * Math.PI) / 180,
            z: (this.elements[2] * Math.PI) / 180,
        };
    }

    // degrees
    constructor(x: number, y: number, z: number) {
        this.set(x, y, z);
    }

    set(x: number, y: number, z: number) {
        this.elements = new Float32Array([x, y, z]);
        return this;
    }
    
    setV(v: Vector3) {
        this.elements = new Float32Array([v.x, v.y, v.z]);
        return this;
    }
    
    copy(r: Rotator) {
        this.set(r.x, r.y, r.z);
        return this;
    }
    
    setRadian(x: number, y: number, z: number) {
        const r = Rotator.fromRadian(x, y, z);
        return this.copy(r);
    }
    
    static get zero() {
        return new Rotator(0, 0, 0);
    }

    static fromRadian(x: number, y: number, z: number) {
        const rotator = Rotator.zero.set((x * 180) / Math.PI, (y * 180) / Math.PI, (z * 180) / Math.PI);
        return rotator;
    }
    
    static fromQuaternion(q: Quaternion) {
        const euler = q.toEulerDegree();
        return new Rotator(euler.x, euler.y, euler.z);
    }
   
    // TODO: quaternion-bug: gltfのquaternionからdegreeを複合するところのバグの回避のため使ってる関数なので本当はよくない
    static fromMatrix4(m: Matrix4) {
        const r = new Rotator(0, 0, 0);
        r.rawMatrix = m;
        return r;
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
