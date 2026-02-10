import type { Root, Code } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { createHash } from "crypto";
import type { MotionCanvasBlock } from "./types";
import type { MotionCanvasRegistry } from "./registry";
import { registerMotionCanvasBlocks } from "./vite-motion-canvas";

interface MdxJsxAttribute {
  type: "mdxJsxAttribute";
  name: string;
  value: string | null;
}

interface MdxJsxTextNode {
  type: "text";
  value: string;
}

interface MdxJsxFlowElement {
  type: "mdxJsxFlowElement";
  name: string;
  attributes: MdxJsxAttribute[];
  children: Array<MdxJsxFlowElement | MdxJsxTextNode>;
}

export interface MotionCanvasOptions {
  defaultAutoplay?: boolean;
  verbose?: boolean;
  registry?: MotionCanvasRegistry;
}

export interface ParsedMeta {
  title?: string;
  caption?: string;
  autoplay?: boolean;
  width?: number;
  height?: number;
}

export function generateHash(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

export function parseMeta(meta: string | null | undefined): ParsedMeta {
  if (!meta) return {};

  const result: ParsedMeta = {};

  const titleMatch = meta.match(/title=["']([^"']+)["']/);
  if (titleMatch) {
    result.title = titleMatch[1];
  }

  const captionMatch = meta.match(/caption=["']([^"']+)["']/);
  if (captionMatch) {
    result.caption = captionMatch[1];
  }

  const widthMatch = meta.match(/\bwidth=(\d+)/);
  if (widthMatch) {
    result.width = parseInt(widthMatch[1]!, 10);
  }

  const heightMatch = meta.match(/\bheight=(\d+)/);
  if (heightMatch) {
    result.height = parseInt(heightMatch[1]!, 10);
  }

  if (/\bautoplay\b/.test(meta)) {
    result.autoplay = true;
  }

  return result;
}

export function createPlayerNode(
  block: MotionCanvasBlock,
): MdxJsxFlowElement {
  const w = block.width || 1920;
  const h = block.height || 1080;

  const attributes: MdxJsxAttribute[] = [
    {
      type: "mdxJsxAttribute",
      name: "class",
      value: "motion-canvas-container",
    },
    {
      type: "mdxJsxAttribute",
      name: "data-motion-canvas",
      value: block.hash,
    },
    {
      type: "mdxJsxAttribute",
      name: "style",
      value: `--mc-ar: ${w} / ${h}`,
    },
  ];

  if (block.title) {
    attributes.push({
      type: "mdxJsxAttribute",
      name: "data-title",
      value: block.title,
    });
  }

  if (block.caption) {
    attributes.push({
      type: "mdxJsxAttribute",
      name: "data-caption",
      value: block.caption,
    });
  }

  if (block.autoplay) {
    attributes.push({
      type: "mdxJsxAttribute",
      name: "data-autoplay",
      value: "true",
    });
  }

  if (block.width) {
    attributes.push({
      type: "mdxJsxAttribute",
      name: "data-width",
      value: String(block.width),
    });
  }

  if (block.height) {
    attributes.push({
      type: "mdxJsxAttribute",
      name: "data-height",
      value: String(block.height),
    });
  }

  const children: MdxJsxFlowElement["children"] = [];

  if (block.caption) {
    children.push({
      type: "mdxJsxFlowElement",
      name: "figcaption",
      attributes: [
        {
          type: "mdxJsxAttribute",
          name: "class",
          value: "mc-caption",
        },
      ],
      children: [{ type: "text", value: block.caption }],
    });
  }

  return {
    type: "mdxJsxFlowElement",
    name: "figure",
    attributes,
    children,
  };
}

export function isMotionCanvasBlock(node: Code): boolean {
  if (node.lang === "motion-canvas") {
    return true;
  }
  if (node.meta?.includes("motion-canvas")) {
    return true;
  }
  return false;
}

export function getBlockLanguage(node: Code): string {
  if (node.lang && node.lang !== "motion-canvas") {
    return node.lang;
  }
  return "tsx";
}

export const remarkMotionCanvas: Plugin<[MotionCanvasOptions?], Root> = (
  options = {},
) => {
  const defaultAutoplay = options.defaultAutoplay ?? false;
  const verbose = options.verbose ?? false;

  return (tree, file) => {
    const blocks: Array<{
      node: Code;
      index: number;
      parent: { children: unknown[] };
    }> = [];

    visit(tree, "code", (node: Code, index, parent) => {
      if (isMotionCanvasBlock(node) && index !== undefined && parent) {
        blocks.push({ node, index, parent });
      }
    });

    const extractedBlocks: MotionCanvasBlock[] = [];

    for (let i = blocks.length - 1; i >= 0; i--) {
      const { node, index, parent } = blocks[i]!;
      const code = node.value;
      const hash = generateHash(code);
      const metaOptions = parseMeta(node.meta);

      const block: MotionCanvasBlock = {
        hash,
        code,
        lang: getBlockLanguage(node),
        title: metaOptions.title,
        caption: metaOptions.caption,
        autoplay: metaOptions.autoplay ?? defaultAutoplay,
        width: metaOptions.width,
        height: metaOptions.height,
        sourceFile: file.path,
      };

      extractedBlocks.push(block);
      parent.children[index] = createPlayerNode(block);
    }

    if (extractedBlocks.length > 0) {
      if (options.registry) {
        options.registry.registerBlocks(extractedBlocks);
      } else {
        registerMotionCanvasBlocks(extractedBlocks);
      }
      if (verbose) {
        console.log(
          `[remark-motion-canvas] Found ${extractedBlocks.length} motion-canvas block(s) in ${file.path || "unknown"}`,
        );
      }
    }
  };
};
