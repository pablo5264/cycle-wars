import type { ComponentType } from "react";

const { registerRootComponent } = require("expo") as typeof import("expo");

installTextDecoderCompat();

const { App } = require("./src/App") as { App: ComponentType };

registerRootComponent(App);

function installTextDecoderCompat() {
  const BaseTextDecoder = globalThis.TextDecoder;

  class CompatTextDecoder {
    decoder: any;
    encoding: string;

    constructor(label = "utf-8", options?: any) {
      this.encoding = String(label).trim().toLowerCase();

      if (!isUtf16Le(this.encoding) && BaseTextDecoder) {
        this.decoder = new BaseTextDecoder(label, options);
      }
    }

    decode(input?: ArrayBuffer | ArrayBufferView | null): string {
      if (isUtf16Le(this.encoding)) {
        return decodeUtf16Le(toUint8Array(input));
      }

      return this.decoder ? this.decoder.decode(input ?? undefined) : "";
    }
  }

  Object.defineProperty(globalThis, "TextDecoder", {
    configurable: true,
    writable: true,
    value: CompatTextDecoder
  });
}

function isUtf16Le(encoding: string) {
  return encoding === "utf-16le" || encoding === "utf16le" || encoding === "ucs-2" || encoding === "ucs2";
}

function toUint8Array(input?: ArrayBuffer | ArrayBufferView | null): Uint8Array {
  if (!input) {
    return new Uint8Array(0);
  }

  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }

  return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
}

function decodeUtf16Le(bytes: Uint8Array): string {
  let output = "";
  const length = bytes.length - (bytes.length % 2);

  for (let index = 0; index < length; index += 2) {
    output += String.fromCharCode((bytes[index] ?? 0) | ((bytes[index + 1] ?? 0) << 8));
  }

  return output;
}
