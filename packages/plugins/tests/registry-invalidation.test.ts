import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  registerMotionCanvasBlocks,
  clearRegistry,
  generateRegistryModule,
  viteMotionCanvasPlugin,
} from "../src/vite-motion-canvas";
import { makeBlock } from "./helpers";
import type { Plugin, ViteDevServer, ModuleNode } from "vite";

interface PluginWithServer extends Plugin {
  configureServer: (server: ViteDevServer) => void;
}

function createMockServer(): {
  server: ViteDevServer;
  invalidateModule: ReturnType<typeof vi.fn>;
  getModuleById: ReturnType<typeof vi.fn>;
} {
  const invalidateModule = vi.fn();
  const getModuleById = vi.fn();
  const server = {
    moduleGraph: { getModuleById, invalidateModule },
  } as unknown as ViteDevServer;
  return { server, invalidateModule, getModuleById };
}

describe("registry invalidation", () => {
  beforeEach(() => {
    clearRegistry();
  });

  it("includes blocks from multiple registrations", () => {
    registerMotionCanvasBlocks([
      makeBlock({ hash: "hash_first", title: "First" }),
    ]);
    registerMotionCanvasBlocks([
      makeBlock({ hash: "hash_second", title: "Second" }),
    ]);

    const code = generateRegistryModule();
    expect(code).toContain('"hash_first"');
    expect(code).toContain('"hash_second"');
    expect(code).toContain('"First"');
    expect(code).toContain('"Second"');
  });

  it("invalidates registry module when dev server is present", () => {
    const plugin = viteMotionCanvasPlugin() as PluginWithServer;
    const { server, invalidateModule, getModuleById } = createMockServer();
    const fakeModule = { id: "fake" } as ModuleNode;
    getModuleById.mockReturnValue(fakeModule);

    plugin.configureServer(server);

    registerMotionCanvasBlocks([
      makeBlock({ hash: "hash_inv", title: "Invalidation Test" }),
    ]);

    expect(getModuleById).toHaveBeenCalled();
    expect(invalidateModule).toHaveBeenCalledWith(fakeModule);
  });

  it("does not error when no dev server is configured", () => {
    expect(() => {
      registerMotionCanvasBlocks([
        makeBlock({ hash: "hash_safe", title: "No Server" }),
      ]);
    }).not.toThrow();
  });

  it("does not error when registry module is not yet in module graph", () => {
    const plugin = viteMotionCanvasPlugin() as PluginWithServer;
    const { server, invalidateModule, getModuleById } = createMockServer();
    getModuleById.mockReturnValue(null);

    plugin.configureServer(server);

    expect(() => {
      registerMotionCanvasBlocks([
        makeBlock({ hash: "hash_no_mod", title: "No Module" }),
      ]);
    }).not.toThrow();
    expect(invalidateModule).not.toHaveBeenCalled();
  });
});
