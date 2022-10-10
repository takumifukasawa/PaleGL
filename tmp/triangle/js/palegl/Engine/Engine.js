export class Engine {
  #tickerId;

  // onUpdate = () => {};
  // onRender = () => {};

  constructor() {}
  // setSize() {}

  // update(time, deltaTime) {
  //   this.onUpdate(time, deltaTime);
  // }
  // render(time, deltaTime) {
  //   this.onRender(time, deltaTime);
  // }

  #tick(time) {
    this.update(time, deltaTime);
    this.render(time, deltaTime);
    this.#tickerId = requestAnimationFrame(this.#tick);
  }
  startTick() {
    this.#tickerId = requestAnimationFrame(this.#tick);
  }
  stopTick() {
    cancelAnimationFrame(this.#tickerId);
    this.#tickerId = null;
  }
}
