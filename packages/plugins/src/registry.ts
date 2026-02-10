import type { ViteDevServer } from "vite";
import type { MotionCanvasBlock } from "./types";

const VIRTUAL_REGISTRY_ID = "virtual:motion-canvas-registry";
const RESOLVED_REGISTRY_ID = "\0" + VIRTUAL_REGISTRY_ID;

export class MotionCanvasRegistry {
  private blockRegistry = new Map<string, MotionCanvasBlock>();
  private compiledSceneCache = new Map<string, { code: string; map: string }>();
  private devServer: ViteDevServer | null = null;

  registerBlocks(blocks: MotionCanvasBlock[]): void {
    for (const block of blocks) {
      this.blockRegistry.set(block.hash, block);
    }
    if (this.devServer) {
      const mod =
        this.devServer.moduleGraph.getModuleById(RESOLVED_REGISTRY_ID);
      if (mod) {
        this.devServer.moduleGraph.invalidateModule(mod);
      }
    }
  }

  getBlocks(): MotionCanvasBlock[] {
    return Array.from(this.blockRegistry.values());
  }

  getBlock(hash: string): MotionCanvasBlock | undefined {
    return this.blockRegistry.get(hash);
  }

  getCachedScene(hash: string): { code: string; map: string } | undefined {
    return this.compiledSceneCache.get(hash);
  }

  cacheScene(hash: string, compiled: { code: string; map: string }): void {
    this.compiledSceneCache.set(hash, compiled);
  }

  clearCompiledScenes(): void {
    this.compiledSceneCache.clear();
  }

  setDevServer(server: ViteDevServer): void {
    this.devServer = server;
  }

  clear(): void {
    this.blockRegistry.clear();
    this.compiledSceneCache.clear();
    this.devServer = null;
  }
}

export function createMotionCanvasRegistry(): MotionCanvasRegistry {
  return new MotionCanvasRegistry();
}

export const defaultRegistry = new MotionCanvasRegistry();
