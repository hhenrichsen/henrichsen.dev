import type { Plugin, ResolvedConfig } from "vite";
import { transformWithEsbuild } from "vite";
import type { MotionCanvasBlock } from "./types";
import { defaultRegistry } from "./registry";
import type { MotionCanvasRegistry } from "./registry";

const VIRTUAL_REGISTRY_ID = "virtual:motion-canvas-registry";
const RESOLVED_REGISTRY_ID = "\0" + VIRTUAL_REGISTRY_ID;
const VIRTUAL_COLORS_ID = "virtual:motion-canvas-colors";
const RESOLVED_COLORS_ID = "\0" + VIRTUAL_COLORS_ID;
const VIRTUAL_COLOR_CONFIG_ID = "virtual:motion-canvas-color-config";
const RESOLVED_COLOR_CONFIG_ID = "\0" + VIRTUAL_COLOR_CONFIG_ID;

export function registerMotionCanvasBlocks(blocks: MotionCanvasBlock[]): void {
  defaultRegistry.registerBlocks(blocks);
}

export function getRegisteredBlocks(): MotionCanvasBlock[] {
  return defaultRegistry.getBlocks();
}

export function clearRegistry(): void {
  defaultRegistry.clear();
}

export interface ColorConfig {
  name: string;
  cssVar: string;
  fallback: string;
}

export const SITE_COLORS: ColorConfig[] = [
  { name: "--text", cssVar: "--text", fallback: "#cdd6f4" },
  { name: "--subtext", cssVar: "--subtext", fallback: "#a6adc8" },
  { name: "--surface", cssVar: "--surface", fallback: "#313244" },
  { name: "--crust", cssVar: "--crust", fallback: "#11111b" },
  { name: "--mantle", cssVar: "--mantle", fallback: "#181825" },
  { name: "--red", cssVar: "--red", fallback: "#f38ba8" },
  { name: "--peach", cssVar: "--peach", fallback: "#fab387" },
  { name: "--yellow", cssVar: "--yellow", fallback: "#f9e2af" },
  { name: "--green", cssVar: "--green", fallback: "#a6e3a1" },
  { name: "--blue", cssVar: "--blue", fallback: "#89b4fa" },
  { name: "--sky", cssVar: "--sky", fallback: "#89dceb" },
];

export function generateRegistryModule(
  blocks?: MotionCanvasBlock[],
): string {
  const resolvedBlocks = blocks ?? getRegisteredBlocks();

  if (resolvedBlocks.length === 0) {
    return `
export const animations = new Map();
export async function getAnimation(hash) { return null; }
export function hasAnimation(hash) { return false; }
export function getAllHashes() { return []; }
`;
  }

  const entries = resolvedBlocks
    .map(
      (block) => `  ["${block.hash}", {
    load: () => import("virtual:motion-canvas-scene/${block.hash}"),
    title: ${JSON.stringify(block.title || "")},
    caption: ${JSON.stringify(block.caption || "")},
    autoplay: ${block.autoplay ?? false},
    width: ${block.width ?? 0},
    height: ${block.height ?? 0},
  }]`,
    )
    .join(",\n");

  return `
const animations = new Map([
${entries}
]);

export async function getAnimation(hash) {
  const entry = animations.get(hash);
  if (!entry) return null;

  const module = await entry.load();
  return {
    scene: module.default,
    title: entry.title,
    caption: entry.caption,
    autoplay: entry.autoplay,
    width: entry.width,
    height: entry.height,
  };
}

export function hasAnimation(hash) {
  return animations.has(hash);
}

export function getAllHashes() {
  return Array.from(animations.keys());
}
`;
}

export function generateColorsModule(colors: ColorConfig[]): string {
  const defaultColorsObj = colors
    .map((c) => `  "${c.name}": "${c.fallback}"`)
    .join(",\n");

  const cssVarMapping = colors
    .map(
      (c) =>
        `  { name: "${c.name}", cssVar: "${c.cssVar}", fallback: "${c.fallback}" }`,
    )
    .join(",\n");

  return `
import { Color, createSignal, useScene } from "@motion-canvas/core";

export const defaultColors = {
${defaultColorsObj}
};

export const colorConfig = [
${cssVarMapping}
];

export function getStaticColors() {
  return { ...defaultColors };
}

export function getColors() {
  try {
    const scene = useScene();
    const variables = scene.variables;
    if (variables) {
      const colors = {};
      colorConfig.forEach(({ name, fallback }) => {
        try {
          const value = variables.get(name, fallback);
          colors[name] = createSignal(() => new Color(value()));
        } catch {
          colors[name] = createSignal(() => new Color(fallback));
        }
      });
      return colors;
    }
  } catch {}

  return Object.fromEntries(
    Object.entries(defaultColors).map(([key, value]) => [
      key,
      createSignal(() => new Color(value)),
    ])
  );
}
`;
}

export function generateColorConfigModule(colors: ColorConfig[]): string {
  const defaultColorsObj = colors
    .map((c) => `  "${c.name}": "${c.fallback}"`)
    .join(",\n");

  const cssVarMapping = colors
    .map(
      (c) =>
        `  { name: "${c.name}", cssVar: "${c.cssVar}", fallback: "${c.fallback}" }`,
    )
    .join(",\n");

  return `
export const defaultColors = {
${defaultColorsObj}
};

export const colorConfig = [
${cssVarMapping}
];
`;
}

export function generateSceneModule(block: MotionCanvasBlock): string {
  const code = block.code.replace(
    /from\s+["'](?:@\/motion-canvas\/colors|(?:\.\.?\/)*colors)["']/g,
    'from "virtual:motion-canvas-colors"',
  );

  return `${code}\n`;
}

export function validateCompiledOutput(
  code: string,
  block: MotionCanvasBlock,
): void {
  const selfRefPattern = /const\s+(\w+)\s*=\s*yield\s+\1\s*\(/g;
  const match = selfRefPattern.exec(code);
  if (match) {
    throw new Error(
      `[vite-motion-canvas] Self-referential variable "${match[1]}" in scene ${block.hash} ` +
        `(${block.sourceFile ?? "unknown"}). A local variable shadows an imported function — rename it.`,
    );
  }
}

export async function compileScene(
  block: MotionCanvasBlock,
  configRoot: string,
  registry: MotionCanvasRegistry = defaultRegistry,
): Promise<{ code: string; map: string }> {
  const cached = registry.getCachedScene(block.hash);
  if (cached) return cached;

  const sceneCode = generateSceneModule(block);
  const fakePath = `${configRoot}/src/motion-canvas/scene-${block.hash}.tsx`;
  const result = await transformWithEsbuild(sceneCode, fakePath, {
    loader: "tsx",
    jsx: "automatic",
    jsxImportSource: "@motion-canvas/2d/lib",
    tsconfigRaw: {
      compilerOptions: {
        jsx: "react-jsx",
        jsxImportSource: "@motion-canvas/2d/lib",
      },
    },
  });

  validateCompiledOutput(result.code, block);

  const compiled = { code: result.code, map: result.map };
  registry.cacheScene(block.hash, compiled);
  return compiled;
}

export interface ViteMotionCanvasOptions {
  verbose?: boolean;
  registry?: MotionCanvasRegistry;
}

export function viteMotionCanvasPlugin(
  options: ViteMotionCanvasOptions = {},
): Plugin {
  let config: ResolvedConfig;
  const verbose = options.verbose ?? false;
  const registry = options.registry ?? defaultRegistry;

  return {
    name: "vite-motion-canvas",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    configureServer(server) {
      registry.setDevServer(server);
    },

    resolveId(id) {
      if (id === VIRTUAL_REGISTRY_ID) {
        return RESOLVED_REGISTRY_ID;
      }

      if (id === VIRTUAL_COLORS_ID) {
        return RESOLVED_COLORS_ID;
      }

      if (id === VIRTUAL_COLOR_CONFIG_ID) {
        return RESOLVED_COLOR_CONFIG_ID;
      }

      if (id.startsWith("virtual:motion-canvas-scene/")) {
        const hash = id.replace("virtual:motion-canvas-scene/", "");
        return `\0virtual:motion-canvas-scene/${hash}.tsx`;
      }

      return null;
    },

    async load(id) {
      if (id === RESOLVED_REGISTRY_ID) {
        return generateRegistryModule(registry.getBlocks());
      }

      if (id === RESOLVED_COLORS_ID) {
        return generateColorsModule(SITE_COLORS);
      }

      if (id === RESOLVED_COLOR_CONFIG_ID) {
        return generateColorConfigModule(SITE_COLORS);
      }

      if (
        id.startsWith("\0virtual:motion-canvas-scene/") &&
        id.endsWith(".tsx")
      ) {
        const hash = id
          .replace("\0virtual:motion-canvas-scene/", "")
          .replace(".tsx", "");
        const block = registry.getBlock(hash);

        if (block) {
          return await compileScene(block, config.root, registry);
        }

        console.warn(`[vite-motion-canvas] Scene not found: ${hash}`);
        return `export default null;\n`;
      }

      return null;
    },

    async buildStart() {
      const blocks = registry.getBlocks();
      if (blocks.length > 0) {
        if (verbose) {
          console.log(
            `[vite-motion-canvas] ${blocks.length} animation(s) registered`,
          );
        }
        for (const block of blocks) {
          await compileScene(block, config.root, registry);
        }
      }
    },

    handleHotUpdate({ file, server }) {
      if (file.endsWith(".mdx")) {
        registry.clearCompiledScenes();

        const registryModule =
          server.moduleGraph.getModuleById(RESOLVED_REGISTRY_ID);
        if (registryModule) {
          server.moduleGraph.invalidateModule(registryModule);
        }
      }
    },
  };
}
