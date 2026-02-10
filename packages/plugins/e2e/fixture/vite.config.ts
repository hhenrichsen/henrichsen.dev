import { defineConfig } from "vite";
import { viteMotionCanvasPlugin, registerMotionCanvasBlocks } from "../../src/vite-motion-canvas";

registerMotionCanvasBlocks([
  {
    hash: "fixture-abc123",
    code: `export default { name: "test-scene" };\n`,
    lang: "tsx",
    title: "Test Animation",
    caption: "Example Presentation",
    autoplay: false,
    width: 1920,
    height: 1080,
    sourceFile: "fixture.mdx",
  },
]);

export default defineConfig({
  plugins: [viteMotionCanvasPlugin()],
  root: __dirname,
});
