import { describe, it, expect, beforeEach } from "vitest";
import {
  generateRegistryModule,
  registerMotionCanvasBlocks,
  clearRegistry,
} from "../src/vite-motion-canvas";
import { makeBlock } from "./helpers";

describe("generateRegistryModule", () => {
  beforeEach(() => {
    clearRegistry();
  });

  it("generates empty registry when no blocks registered", () => {
    const code = generateRegistryModule();
    expect(code).toContain("new Map()");
    expect(code).toContain("return null");
    expect(code).toContain("return false");
    expect(code).toContain("return []");
  });

  it("generates registry with a single block", () => {
    registerMotionCanvasBlocks([makeBlock({ hash: "hash1", title: "Demo" })]);
    const code = generateRegistryModule();
    expect(code).toContain('"hash1"');
    expect(code).toContain("virtual:motion-canvas-scene/hash1");
    expect(code).toContain('"Demo"');
  });

  it("generates registry with multiple blocks", () => {
    registerMotionCanvasBlocks([
      makeBlock({ hash: "h1", title: "First" }),
      makeBlock({ hash: "h2", title: "Second" }),
    ]);
    const code = generateRegistryModule();
    expect(code).toContain('"h1"');
    expect(code).toContain('"h2"');
    expect(code).toContain('"First"');
    expect(code).toContain('"Second"');
  });

  it("includes autoplay, width, height in entries", () => {
    registerMotionCanvasBlocks([
      makeBlock({
        hash: "h1",
        autoplay: true,
        width: 800,
        height: 600,
      }),
    ]);
    const code = generateRegistryModule();
    expect(code).toContain("autoplay: true");
    expect(code).toContain("width: 800");
    expect(code).toContain("height: 600");
  });

  it("defaults autoplay to false and dimensions to 0", () => {
    registerMotionCanvasBlocks([makeBlock({ hash: "h1" })]);
    const code = generateRegistryModule();
    expect(code).toContain("autoplay: false");
    expect(code).toContain("width: 0");
    expect(code).toContain("height: 0");
  });
});
