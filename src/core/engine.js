export const engine = {
  buffer: "0",
  stored: null,
  op: null,
  expression: "",
  value() { return Number(this.buffer); },
  digit(d) { this.buffer = this.buffer === "0" ? d : this.buffer + d; },
  dot() { if (!this.buffer.includes(".")) this.buffer += "."; },
  clear() { this.buffer = "0"; this.stored = null; this.op = null; this.expression = ""; },
  back() { this.buffer = this.buffer.length > 1 ? this.buffer.slice(0, -1) : "0"; },
  percent() { this.buffer = String(this.value() / 100); },
  setOp(o) {
    if (this.stored === null) this.stored = this.value();
    else this.stored = this.calc(this.stored, this.op, this.value());
    this.op = o;
    this.expression = `${this.stored} ${o}`;
    this.buffer = "0";
  },
  equals() {
    if (!this.op) return null;
    const res = this.calc(this.stored, this.op, this.value());
    const expr = `${this.stored} ${this.op} ${this.value()}`;
    this.buffer = String(res);
    this.stored = null;
    this.op = null;
    this.expression = "";
    return { res, expr };
  },
  calc(a, o, b) {
    if (o === "+") return a + b;
    if (o === "-") return a - b;
    if (o === "×") return a * b;
    if (o === "÷") return b === 0 ? 0 : a / b;
    return 0;
  }
};
