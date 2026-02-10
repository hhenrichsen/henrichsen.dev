import { describe, it, expect } from "vitest";
import {
  generateColorsModule,
  generateColorConfigModule,
  SITE_COLORS,
} from "../src/vite-motion-canvas";

describe("generateColorsModule", () => {
  it("includes all site colors as defaults", () => {
    const code = generateColorsModule(SITE_COLORS);
    for (const color of SITE_COLORS) {
      expect(code).toContain(`"${color.name}": "${color.fallback}"`);
    }
  });

  it("imports from @motion-canvas/core", () => {
    const code = generateColorsModule(SITE_COLORS);
    expect(code).toContain("@motion-canvas/core");
    expect(code).toContain("Color");
    expect(code).toContain("createSignal");
    expect(code).toContain("useScene");
  });

  it("exports getColors and getStaticColors", () => {
    const code = generateColorsModule(SITE_COLORS);
    expect(code).toContain("export function getColors()");
    expect(code).toContain("export function getStaticColors()");
  });

  it("includes color config array", () => {
    const code = generateColorsModule(SITE_COLORS);
    expect(code).toContain("export const colorConfig");
    for (const color of SITE_COLORS) {
      expect(code).toContain(`cssVar: "${color.cssVar}"`);
    }
  });
});

describe("generateColorConfigModule", () => {
  it("exports defaultColors and colorConfig", () => {
    const code = generateColorConfigModule(SITE_COLORS);
    expect(code).toContain("export const defaultColors");
    expect(code).toContain("export const colorConfig");
  });

  it("includes all colors", () => {
    const code = generateColorConfigModule(SITE_COLORS);
    for (const color of SITE_COLORS) {
      expect(code).toContain(`"${color.name}": "${color.fallback}"`);
    }
  });

  it("does not import from @motion-canvas/core", () => {
    const code = generateColorConfigModule(SITE_COLORS);
    expect(code).not.toContain("@motion-canvas/core");
  });
});
