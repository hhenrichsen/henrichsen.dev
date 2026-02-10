export type { MotionCanvasBlock } from "./types";

export {
  MotionCanvasRegistry,
  createMotionCanvasRegistry,
  defaultRegistry,
} from "./registry";

export {
  remarkMotionCanvas,
  parseMeta,
  isMotionCanvasBlock,
  createPlayerNode,
  generateHash,
  getBlockLanguage,
} from "./remark-motion-canvas";
export type { MotionCanvasOptions, ParsedMeta } from "./remark-motion-canvas";

export {
  viteMotionCanvasPlugin,
  registerMotionCanvasBlocks,
  getRegisteredBlocks,
  clearRegistry,
  generateRegistryModule,
  generateSceneModule,
  generateColorsModule,
  generateColorConfigModule,
  validateCompiledOutput,
  compileScene,
  SITE_COLORS,
} from "./vite-motion-canvas";
export type { ColorConfig, ViteMotionCanvasOptions } from "./vite-motion-canvas";
