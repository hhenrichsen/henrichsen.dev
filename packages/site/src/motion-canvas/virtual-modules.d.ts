declare module "virtual:motion-canvas-registry" {
  import type { SceneDescription } from "@motion-canvas/core";
  export function getAnimation(hash: string): Promise<{
    scene: SceneDescription;
    title: string;
    caption: string;
    autoplay: boolean;
    width: number;
    height: number;
  } | null>;
  export function hasAnimation(hash: string): boolean;
  export function getAllHashes(): string[];
}

declare module "virtual:motion-canvas-colors" {
  import type { Color } from "@motion-canvas/core";
  export const defaultColors: Record<string, string>;
  export const colorConfig: Array<{
    name: string;
    cssVar: string;
    fallback: string;
  }>;
  export function getStaticColors(): Record<string, string>;
  export function getColors(): Record<string, () => Color>;
}

declare module "virtual:motion-canvas-color-config" {
  export const defaultColors: Record<string, string>;
  export const colorConfig: Array<{
    name: string;
    cssVar: string;
    fallback: string;
  }>;
}

declare module "virtual:motion-canvas-scene/*" {
  import type { SceneDescription } from "@motion-canvas/core";
  const scene: SceneDescription;
  export default scene;
}
