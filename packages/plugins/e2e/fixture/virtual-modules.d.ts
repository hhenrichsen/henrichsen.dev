declare module "virtual:motion-canvas-registry" {
  export function getAnimation(
    hash: string,
  ): Promise<{
    scene: unknown;
    title: string;
    caption: string;
    autoplay: boolean;
    width: number;
    height: number;
  } | null>;
  export function hasAnimation(hash: string): boolean;
  export function getAllHashes(): string[];
}

declare module "virtual:motion-canvas-color-config" {
  export const defaultColors: Record<string, string>;
  export const colorConfig: Array<{
    name: string;
    cssVar: string;
    fallback: string;
  }>;
}
