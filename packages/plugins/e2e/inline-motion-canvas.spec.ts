import { test, expect } from "@playwright/test";

test.describe("vite-motion-canvas plugin", () => {
  test("container has data-motion-canvas attribute", async ({ page }) => {
    await page.goto("/");
    const container = page.locator("[data-motion-canvas]");
    await expect(container).toHaveAttribute(
      "data-motion-canvas",
      "fixture-abc123",
    );
  });

  test("registry resolves and loads animation data", async ({ page }) => {
    await page.goto("/");
    const container = page.locator("[data-motion-canvas]");
    await expect(container).toHaveAttribute("data-registry-loaded", "true", {
      timeout: 10000,
    });

    const resultJson = await container.getAttribute("data-result");
    expect(resultJson).toBeTruthy();
    const result = JSON.parse(resultJson!);

    expect(result.hashes).toContain("fixture-abc123");
    expect(result.hasFixture).toBe(true);
    expect(result.animation).not.toBeNull();
    expect(result.animation.title).toBe("Test Animation");
    expect(result.animation.caption).toBe("Example Presentation");
    expect(result.animation.autoplay).toBe(false);
    expect(result.animation.width).toBe(1920);
    expect(result.animation.height).toBe(1080);
    expect(result.animation.sceneLoaded).toBe(true);
  });

  test("color config module provides all colors", async ({ page }) => {
    await page.goto("/");
    const container = page.locator("[data-motion-canvas]");
    await expect(container).toHaveAttribute("data-registry-loaded", "true", {
      timeout: 10000,
    });

    const resultJson = await container.getAttribute("data-result");
    const result = JSON.parse(resultJson!);

    expect(result.colorCount).toBe(11);
    expect(result.colorConfigCount).toBe(11);
  });

  test("caption figcaption is present in fixture HTML", async ({ page }) => {
    await page.goto("/");
    const caption = page.locator(".mc-caption");
    await expect(caption).toHaveText("Example Presentation");
  });

  test("container has correct aspect ratio style", async ({ page }) => {
    await page.goto("/");
    const container = page.locator("[data-motion-canvas]");
    const style = await container.getAttribute("style");
    expect(style).toContain("--mc-ar: 1920 / 1080");
  });

  test("container has data-title and data-caption", async ({ page }) => {
    await page.goto("/");
    const container = page.locator("[data-motion-canvas]");
    await expect(container).toHaveAttribute("data-title", "Test Animation");
    await expect(container).toHaveAttribute(
      "data-caption",
      "Example Presentation",
    );
  });
});
