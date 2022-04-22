import { VertexArrayObject } from "../GL/VertexArrayObject.js";
import { Attribute } from "./Attribute.js";

export class Geometry {
  attributes;
  vertexCount;
  #vao;
  indices;

  get vertexArrayObject() {
    return this.#vao;
  }

  constructor({ gpu, attributes, indices }) {
    const gl = gpu.gl;

    // attributeを元に成形してvaoを作成
    this.attributes = attributes.map((attribute, i) => {
      // 基本的にはlocationは指定しなくても大丈夫にする
      // locationを指定する場合は、他のattributeのlocationも指定するべき
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
      indices,
    });

    // cache vertex count
    const position = this.attributes.find(
      ({ type }) => type == Attribute.Types.Position
    );
    this.vertexCount = position ? position.data.length / 3 : 0;

    this.indices = indices;
  }
}
