export class LLMProvider {
  constructor({ name }) {
    this.name = name;
  }

  /**
   * @param {Object} args
   * @param {string} args.model
   * @param {Array<{role:"system"|"user"|"assistant", content:string}>} args.messages
   * @param {number} [args.temperature]
   * @param {Object} [args.meta]
   */
  async chat(args) {
    throw new Error("chat() not implemented");
  }
}