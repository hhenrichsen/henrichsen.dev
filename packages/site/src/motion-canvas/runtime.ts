import "./slide-controls";
import { MotionCanvasPresenter } from "./presenter";
import { colorConfig } from "virtual:motion-canvas-color-config";
import type { McSlideControls } from "./slide-controls";


interface AnimationInstance {
  container: HTMLElement;
  presenter: MotionCanvasPresenter;
  controls?: McSlideControls;
  unsubscribeRender?: () => void;
}

const instances: AnimationInstance[] = [];
const MC_FRAME_ID = "motion-canvas-2d-frame";
let preservedFrame: HTMLDivElement | null = null;

function getCurrentColors(): Record<string, string> {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  const colors: Record<string, string> = {};
  colorConfig.forEach(({ name, cssVar, fallback }) => {
    const value = computedStyle.getPropertyValue(cssVar).trim();
    colors[name] = value || fallback;
  });
  return colors;
}

function segmentIndexForSlide(
  slideId: string | null,
  waiting: boolean,
  segments: { slideId: string | null }[],
): number {
  if (!slideId) return 0;
  const idx = segments.findIndex((s) => s.slideId === slideId);
  if (idx < 0) return 0;
  return waiting ? Math.max(0, idx - 1) : idx;
}

function preserveMotionCanvasFrame(): void {
  preservedFrame = document.getElementById(MC_FRAME_ID) as HTMLDivElement | null;
}

function restoreMotionCanvasFrame(): void {
  if (preservedFrame && !preservedFrame.isConnected) {
    document.body.prepend(preservedFrame);
  }
  preservedFrame = null;
}

async function initializeContainer(container: HTMLElement): Promise<boolean> {
  const hash = container.dataset.motionCanvas;
  if (!hash) return false;

  const { getAnimation } = await import("virtual:motion-canvas-registry");
  const animationData = await getAnimation(hash);
  if (!animationData?.scene) return false;

  const width = animationData.width || 1920;
  const height = animationData.height || 1080;

  const existingCaption = container.querySelector<HTMLElement>(".mc-caption");
  if (existingCaption) {
    existingCaption.remove();
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.aspectRatio = `${width} / ${height}`;
  container.innerHTML = "";
  container.appendChild(canvas);

  const presenter = new MotionCanvasPresenter();

  try {
    await presenter.initializeWithScene(
      animationData.scene,
      canvas,
      { fps: 60, width, height },
      hash,
    );
  } catch (error) {
    console.error("[motion-canvas] Failed to initialize:", hash, error);
    return false;
  }

  presenter.updateColors(getCurrentColors());

  const instance: AnimationInstance = { container, presenter };

  if (presenter.slidesAvailable) {
    const controls = document.createElement(
      "mc-slide-controls",
    ) as McSlideControls;
    container.appendChild(controls);

    const segments = presenter.getSegments();
    let pendingAdvance = false;

    const unsubscribeFrame = presenter.onRender(() => {
      if (pendingAdvance && presenter.isWaiting()) {
        pendingAdvance = false;
        presenter.resumeSlide();
      }

      const currentSlideId = presenter.getCurrentSlideId();
      const waiting = presenter.isWaiting();
      const activeIdx = segmentIndexForSlide(currentSlideId, waiting, segments);

      controls.setActive(activeIdx);
      controls.setWaiting(pendingAdvance ? activeIdx + 1 : -1);
    });

    controls.configure(
      segments.map((s) => ({ slideName: s.slideName })),
      (targetIndex: number, currentIndex: number) => {
        const seg = segments[targetIndex];
        if (!seg) return;

        if (targetIndex === currentIndex + 1) {
          if (presenter.isWaiting()) {
            presenter.resumeSlide();
          } else if (pendingAdvance) {
            pendingAdvance = false;
            const targetSeg = segments[targetIndex];
            if (targetSeg?.slideId) {
              presenter.seekToSlide(targetSeg.slideId).then(() => {
                presenter.resumeSlide();
                controls.setActive(targetIndex);
              });
            }
          } else {
            pendingAdvance = true;
          }
          return;
        }

        if (!seg.slideId) {
          presenter.seekToBeginning().then(() => {
            controls.setActive(targetIndex);
          });
        } else {
          presenter.seekToSlide(seg.slideId).then(() => {
            presenter.resumeSlide();
            controls.setActive(targetIndex);
          });
        }
      },
    );

    instance.controls = controls;
    instance.unsubscribeRender = unsubscribeFrame;
  }

  if (existingCaption) {
    container.appendChild(existingCaption);
  }

  await presenter.start();
  instances.push(instance);
  return true;
}

async function initAll(): Promise<void> {
  const containers = document.querySelectorAll<HTMLElement>(
    "[data-motion-canvas]",
  );
  for (const container of containers) {
    if (container.dataset.motionCanvasInitialized) continue;
    const success = await initializeContainer(container);
    if (success) {
      container.dataset.motionCanvasInitialized = "true";
    }
  }
}

function disposeAll(): void {
  for (const instance of instances) {
    instance.unsubscribeRender?.();
    instance.presenter.dispose();
    instance.controls?.remove();
    const canvas = instance.container.querySelector("canvas");
    canvas?.remove();
    delete instance.container.dataset.motionCanvasInitialized;
  }
  instances.length = 0;
}

const themeObserver = new MutationObserver(() => {
  const colors = getCurrentColors();
  for (const instance of instances) {
    instance.presenter.updateColors(colors);
  }
});

themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["class"],
});

document.addEventListener("astro:before-swap", () => {
  preserveMotionCanvasFrame();
  disposeAll();
});

document.addEventListener("astro:page-load", () => {
  restoreMotionCanvasFrame();
  initAll();
});

initAll();
