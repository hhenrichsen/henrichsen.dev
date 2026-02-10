import { describe, it, expect } from "vitest";
import { createPlayerNode } from "../src/remark-motion-canvas";
import { makeBlock } from "./helpers";

describe("createPlayerNode", () => {
  it("creates a figure element", () => {
    const node = createPlayerNode(makeBlock());
    expect(node.type).toBe("mdxJsxFlowElement");
    expect(node.name).toBe("figure");
  });

  it("sets data-motion-canvas to the hash", () => {
    const node = createPlayerNode(makeBlock({ hash: "deadbeef" }));
    const attr = node.attributes.find((a) => a.name === "data-motion-canvas");
    expect(attr?.value).toBe("deadbeef");
  });

  it("uses default 1920/1080 aspect ratio", () => {
    const node = createPlayerNode(makeBlock());
    const style = node.attributes.find((a) => a.name === "style");
    expect(style?.value).toBe("--mc-ar: 1920 / 1080");
  });

  it("uses custom width/height for aspect ratio", () => {
    const node = createPlayerNode(makeBlock({ width: 800, height: 600 }));
    const style = node.attributes.find((a) => a.name === "style");
    expect(style?.value).toBe("--mc-ar: 800 / 600");
  });

  it("includes data-width and data-height when set", () => {
    const node = createPlayerNode(makeBlock({ width: 800, height: 600 }));
    expect(
      node.attributes.find((a) => a.name === "data-width")?.value,
    ).toBe("800");
    expect(
      node.attributes.find((a) => a.name === "data-height")?.value,
    ).toBe("600");
  });

  it("includes data-title when set", () => {
    const node = createPlayerNode(makeBlock({ title: "My Anim" }));
    expect(
      node.attributes.find((a) => a.name === "data-title")?.value,
    ).toBe("My Anim");
  });

  it("omits data-title when not set", () => {
    const node = createPlayerNode(makeBlock());
    expect(node.attributes.find((a) => a.name === "data-title")).toBeUndefined();
  });

  it("includes figcaption child when caption is set", () => {
    const node = createPlayerNode(makeBlock({ caption: "Example" }));
    expect(node.children).toHaveLength(1);
    const figcaption = node.children[0]!;
    expect(figcaption.type).toBe("mdxJsxFlowElement");
    if (figcaption.type === "mdxJsxFlowElement") {
      expect(figcaption.name).toBe("figcaption");
      expect(figcaption.children[0]).toEqual({
        type: "text",
        value: "Example",
      });
    }
  });

  it("omits figcaption when caption is not set", () => {
    const node = createPlayerNode(makeBlock());
    expect(node.children).toHaveLength(0);
  });

  it("includes data-autoplay when autoplay is true", () => {
    const node = createPlayerNode(makeBlock({ autoplay: true }));
    expect(
      node.attributes.find((a) => a.name === "data-autoplay")?.value,
    ).toBe("true");
  });

  it("omits data-autoplay when autoplay is false", () => {
    const node = createPlayerNode(makeBlock({ autoplay: false }));
    expect(
      node.attributes.find((a) => a.name === "data-autoplay"),
    ).toBeUndefined();
  });
});
