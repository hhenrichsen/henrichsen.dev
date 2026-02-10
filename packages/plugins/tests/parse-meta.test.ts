import { describe, it, expect } from "vitest";
import { parseMeta } from "../src/remark-motion-canvas";

describe("parseMeta", () => {
  it("returns empty object for null", () => {
    expect(parseMeta(null)).toEqual({});
  });

  it("returns empty object for undefined", () => {
    expect(parseMeta(undefined)).toEqual({});
  });

  it("returns empty object for empty string", () => {
    expect(parseMeta("")).toEqual({});
  });

  it("parses title with double quotes", () => {
    expect(parseMeta('title="My Title"')).toEqual({ title: "My Title" });
  });

  it("parses title with single quotes", () => {
    expect(parseMeta("title='My Title'")).toEqual({ title: "My Title" });
  });

  it("parses caption", () => {
    expect(parseMeta('caption="A caption"')).toEqual({ caption: "A caption" });
  });

  it("parses width", () => {
    expect(parseMeta("width=800")).toEqual({ width: 800 });
  });

  it("parses height", () => {
    expect(parseMeta("height=600")).toEqual({ height: 600 });
  });

  it("parses autoplay flag", () => {
    expect(parseMeta("autoplay")).toEqual({ autoplay: true });
  });

  it("does not set autoplay when absent", () => {
    expect(parseMeta('title="Test"')).toEqual({ title: "Test" });
  });

  it("parses combined meta", () => {
    const meta =
      'title="Demo" caption="Example" width=1280 height=720 autoplay';
    expect(parseMeta(meta)).toEqual({
      title: "Demo",
      caption: "Example",
      width: 1280,
      height: 720,
      autoplay: true,
    });
  });
});
