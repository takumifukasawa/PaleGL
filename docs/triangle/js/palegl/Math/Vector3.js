export class Vector3 {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  normalize() {
    const s = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    if (s < 0.0001) {
      return Vector3.zero;
    }
    this.x /= s;
    this.y /= s;
    this.z /= s;
    return this;
  }
  getArray() {
    return [this.x, this.y, this.z];
  }
  static zero() {
    return new Vector3(0, 0, 0);
  }
  static one() {
    return new Vector3(1, 1, 1);
  }
  static subVectors(a, b) {
    const x = a.x - b.x;
    const y = a.y - b.y;
    const z = a.z - b.z;
    return new Vector3(x, y, z);
  }
  static dotVectors(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }
  static crossVectors(a, b) {
    const x = a.y * b.z - a.z * b.y;
    const y = a.z * b.x - a.x * b.z;
    const z = a.x * b.y - a.y * b.x;
    return new Vector3(x, y, z);
  }
  cross(v) {
    const cv = Vector3.crossVectors(this, v);
    this.x = cv.x;
    this.y = cv.y;
    this.z = cv.z;
    return this;
  }
  equals(v) {
    return this.x === v.x && this.y === v.y && this.z === v.z;
  }
  static getTangent(n) {
    if (n.equals(new Vector3(0, -1, 0))) {
      return Vector3.crossVectors(n, new Vector3(0, 0, 1));
    }
    if (n.equals(new Vector3(0, 1, 0))) {
      return Vector3.crossVectors(n, new Vector3(0, 0, 1));
    }
    return Vector3.crossVectors(n, new Vector3(0, -1, 0));
  }
}
