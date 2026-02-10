import { getAnimation, hasAnimation, getAllHashes } from "virtual:motion-canvas-registry";
import { defaultColors, colorConfig } from "virtual:motion-canvas-color-config";

interface RegistryResult {
  hashes: string[];
  hasFixture: boolean;
  animation: {
    title: string;
    caption: string;
    autoplay: boolean;
    width: number;
    height: number;
    sceneLoaded: boolean;
  } | null;
  colorCount: number;
  colorConfigCount: number;
}

async function init(): Promise<void> {
  const hashes = getAllHashes();
  const hasFixture = hasAnimation("fixture-abc123");
  const animationData = await getAnimation("fixture-abc123");

  const result: RegistryResult = {
    hashes,
    hasFixture,
    animation: animationData
      ? {
          title: animationData.title,
          caption: animationData.caption,
          autoplay: animationData.autoplay,
          width: animationData.width,
          height: animationData.height,
          sceneLoaded: animationData.scene !== null && animationData.scene !== undefined,
        }
      : null,
    colorCount: Object.keys(defaultColors).length,
    colorConfigCount: colorConfig.length,
  };

  const container = document.querySelector("[data-motion-canvas]");
  if (container) {
    container.setAttribute("data-registry-loaded", "true");
    container.setAttribute("data-result", JSON.stringify(result));
  }
}

init();
