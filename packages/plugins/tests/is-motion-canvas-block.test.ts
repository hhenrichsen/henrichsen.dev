import { describe, it, expect } from "vitest";
import type { Code } from "mdast";
import { isMotionCanvasBlock } from "../src/remark-motion-canvas";

function makeCode(overrides: Partial<Code>): Code {
  return {
    type: "code",
    value: "",
    ...overrides,
  };
}

describe("isMotionCanvasBlock", () => {
  it("detects lang=motion-canvas", () => {
    expect(isMotionCanvasBlock(makeCode({ lang: "motion-canvas" }))).toBe(true);
  });

  it("detects motion-canvas in meta", () => {
    expect(
      isMotionCanvasBlock(makeCode({ lang: "tsx", meta: "motion-canvas" })),
    ).toBe(true);
  });

  it("detects motion-canvas with other meta", () => {
    expect(
      isMotionCanvasBlock(
        makeCode({ lang: "tsx", meta: 'motion-canvas title="Foo"' }),
      ),
    ).toBe(true);
  });

  it("rejects plain tsx block", () => {
    expect(isMotionCanvasBlock(makeCode({ lang: "tsx" }))).toBe(false);
  });

  it("rejects block with no lang", () => {
    expect(isMotionCanvasBlock(makeCode({}))).toBe(false);
  });

  it("rejects block with unrelated meta", () => {
    expect(
      isMotionCanvasBlock(makeCode({ lang: "ts", meta: 'title="Foo"' })),
    ).toBe(false);
  });
});
