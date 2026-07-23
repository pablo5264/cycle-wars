import { isValidCell } from "h3-js";

export class H3Index {
  private constructor(public readonly value: string) {}

  static from(value: string): H3Index {
    if (!isValidCell(value)) {
      throw new Error(`Invalid H3 index: ${value}`);
    }

    return new H3Index(value);
  }

  equals(other: H3Index): boolean {
    return this.value === other.value;
  }
}
