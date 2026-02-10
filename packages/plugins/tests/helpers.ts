import type { MotionCanvasBlock } from "../src/types";

export function makeBlock(
  overrides: Partial<MotionCanvasBlock> = {},
): MotionCanvasBlock {
  return {
    hash: "abc123",
    code: "export default makeScene2D(function* (view) {});",
    ...overrides,
  };
}
