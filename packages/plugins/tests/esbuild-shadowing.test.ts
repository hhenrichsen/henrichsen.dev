import { describe, it, expect } from "vitest";
import { validateCompiledOutput } from "../src/vite-motion-canvas";
import { makeBlock } from "./helpers";

describe("validateCompiledOutput", () => {
  it("throws on self-referential const (loop shadowing)", () => {
    const code = `
      const loop2 = yield loop2(5, function* () {
        yield rect.opacity(1, 0.3);
      });
    `;
    expect(() => validateCompiledOutput(code, makeBlock())).toThrow(
      /Self-referential variable "loop2"/,
    );
  });

  it("passes when variable name differs from function", () => {
    const code = `
      const task = yield loop(5, function* () {
        yield rect.opacity(1, 0.3);
      });
    `;
    expect(() => validateCompiledOutput(code, makeBlock())).not.toThrow();
  });

  it("passes on normal code with no yield", () => {
    const code = `
      import { jsx } from "@motion-canvas/2d/lib/jsx-runtime";
      const rect = jsx("rect", {});
    `;
    expect(() => validateCompiledOutput(code, makeBlock())).not.toThrow();
  });

  it("includes hash and sourceFile in error message", () => {
    const code = `const foo = yield foo(1);`;
    const block = makeBlock({ hash: "abc123", sourceFile: "demo.mdx" });
    expect(() => validateCompiledOutput(code, block)).toThrow("abc123");
    expect(() => validateCompiledOutput(code, block)).toThrow("demo.mdx");
  });

  it("reports unknown sourceFile when not provided", () => {
    const code = `const bar = yield bar(1);`;
    const block = makeBlock({ sourceFile: undefined });
    expect(() => validateCompiledOutput(code, block)).toThrow("unknown");
  });
});
