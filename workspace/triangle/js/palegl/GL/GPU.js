export class GPU {
  #gl;

  get gl() {
    return this.#gl;
  }

  constructor({ gl }) {
    this.#gl = gl;
  }
}
