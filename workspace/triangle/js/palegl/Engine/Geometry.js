import { VertexArrayObject } from "../GL/VertexArrayObject.js";
import { Attribute } from "./Attribute.js";

export class Geometry {
  attributes;
  vertexCount;
  #vao;

  get vertexArrayObject() {
    return this.#vao;
  }

  constructor({ gpu, attributes }) {
    const gl = gpu.gl;
    this.attributes = attributes.map((attribute, i) => {
      const location =
        attribute.location === undefined ? i : attribute.location;
      return {
        ...attribute,
        location,
      };
    });
    this.#vao = new VertexArrayObject({
      gl,
      attributes: this.attributes,
    });

    const position = this.attributes.find(
      ({ type }) => type == Attribute.Types.Position
    );
    this.vertexCount = position ? position.data.length / 3 : 0;
  }
}
