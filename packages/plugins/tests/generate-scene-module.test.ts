import { describe, it, expect } from "vitest";
import { generateSceneModule } from "../src/vite-motion-canvas";
import { makeBlock } from "./helpers";

describe("generateSceneModule", () => {
  it("rewrites ../colors import", () => {
    const result = generateSceneModule(
      makeBlock({ code: 'import { getColors } from "../colors";' }),
    );
    expect(result).toContain('from "virtual:motion-canvas-colors"');
    expect(result).not.toContain("../colors");
  });

  it("rewrites ../../colors import", () => {
    const result = generateSceneModule(
      makeBlock({ code: 'import { getColors } from "../../colors";' }),
    );
    expect(result).toContain('from "virtual:motion-canvas-colors"');
    expect(result).not.toContain("../../colors");
  });

  it("rewrites ./colors import", () => {
    const result = generateSceneModule(
      makeBlock({ code: "import { getColors } from './colors';" }),
    );
    expect(result).toContain('from "virtual:motion-canvas-colors"');
    expect(result).not.toContain("./colors");
  });

  it("rewrites @/motion-canvas/colors import", () => {
    const result = generateSceneModule(
      makeBlock({ code: 'import { getColors } from "@/motion-canvas/colors";' }),
    );
    expect(result).toContain('from "virtual:motion-canvas-colors"');
    expect(result).not.toContain("@/motion-canvas/colors");
  });

  it("preserves non-color imports", () => {
    const result = generateSceneModule(
      makeBlock({
        code: 'import { makeScene2D } from "@motion-canvas/2d";\nimport { getColors } from "../colors";',
      }),
    );
    expect(result).toContain('from "@motion-canvas/2d"');
    expect(result).toContain('from "virtual:motion-canvas-colors"');
  });

  it("preserves code that has no color imports", () => {
    const code = 'import { Rect } from "@motion-canvas/2d";\nexport default 1;';
    const result = generateSceneModule(makeBlock({ code }));
    expect(result).toContain(code);
  });
});
