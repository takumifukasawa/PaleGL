export class Attribute {
  static Types = {
    Position: "Position",
  };
  constructor({ type, data, stride, location }) {
    this.type = type;
    this.data = data;
    this.stride = stride;
    this.location = location;
  }
}
