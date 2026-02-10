import {
  PlaybackManager,
  PlaybackState,
  PlaybackStatus,
  SharedWebGLContext,
  Stage,
  Logger,
  ValueDispatcher,
  Vector2,
  LogLevel,
  createSceneMetadata,
} from "@motion-canvas/core";
import type {
  SceneDescription,
  FullSceneDescription,
  LogPayload,
} from "@motion-canvas/core";
import { ReadOnlyTimeEvents } from "@motion-canvas/core/lib/scenes/timeEvents";

export interface Segment {
  start: number;
  end: number;
  slideId: string | null;
  slideName: string | null;
}

export interface PresenterSettings {
  fps?: number;
  width?: number;
  height?: number;
  background?: string | null;
}

const DEFAULT_SETTINGS: Required<PresenterSettings> = {
  fps: 30,
  width: 1920,
  height: 1080,
  background: null,
};

const FPS_HEADROOM = 5;

export class MotionCanvasPresenter {
  private playback: PlaybackManager | null = null;
  private status: PlaybackStatus | null = null;
  private stage: Stage | null = null;
  private sharedWebGLContext: SharedWebGLContext | null = null;
  private logger: Logger | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private settings: Required<PresenterSettings>;

  private isInitialized = false;
  private renderLoopId: number | null = null;
  private isRendering = false;
  private hasSlides = false;
  private isPresentationMode = false;
  private lastRenderTime = 0;
  private isSeeking = false;
  private renderCallbacks: Array<() => void> = [];
  private abortController: AbortController | null = null;

  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
  }

  async initializeWithScene(
    sceneDescription: SceneDescription,
    canvas: HTMLCanvasElement,
    settings: PresenterSettings = {},
    sceneId?: string,
  ): Promise<void> {
    if (this.isInitialized) return;

    this.canvas = canvas;
    this.settings = { ...DEFAULT_SETTINGS, ...settings };

    this.logger = new Logger();
    this.logger.onLogged.subscribe((payload: LogPayload) => {
      if (payload.level === LogLevel.Error) {
        console.error(
          "[MotionCanvasPresenter] Runtime error:",
          payload.message,
        );
      }
    });

    this.playback = new PlaybackManager();
    this.status = new PlaybackStatus(this.playback);
    this.sharedWebGLContext = new SharedWebGLContext(this.logger);

    const size = new Vector2(this.settings.width, this.settings.height);
    const name =
      sceneId || `scene-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const meta = sceneDescription.meta?.clone() ?? createSceneMetadata();

    const fullDescription: FullSceneDescription = {
      ...sceneDescription,
      name,
      meta,
      size,
      resolutionScale: 1,
      playback: this.status,
      logger: this.logger,
      onReplaced: new ValueDispatcher<FullSceneDescription>(
        {} as FullSceneDescription,
      ),
      timeEventsClass: ReadOnlyTimeEvents,
      sharedWebGLContext: this.sharedWebGLContext,
      experimentalFeatures: true,
    };

    fullDescription.onReplaced.current = fullDescription;

    const scene = new sceneDescription.klass(fullDescription);
    this.playback.setup([scene]);

    this.stage = new Stage();
    this.stage.configure({ size });

    this.playback.fps = this.settings.fps;

    await this.recalculate();

    this.hasSlides = this.playback.slides.length > 0;
    this.isInitialized = true;
  }

  private async recalculate(): Promise<void> {
    if (!this.playback) return;

    this.playback.state = PlaybackState.Playing;
    await this.playback.recalculate();
    this.playback.state = PlaybackState.Presenting;
    await this.playback.reset();
  }

  private startRenderLoop(): void {
    if (this.renderLoopId !== null) return;

    this.abortController = new AbortController();
    const targetFrameTime = 1000 / (this.settings.fps + FPS_HEADROOM);

    const loop = async (time: number): Promise<void> => {
      if (this.abortController?.signal.aborted) return;

      if (!this.isRendering && time - this.lastRenderTime >= targetFrameTime) {
        this.lastRenderTime = time;
        this.isRendering = true;
        await this.renderFrame();
      }
      this.renderLoopId = requestAnimationFrame(loop);
    };

    this.renderLoopId = requestAnimationFrame(loop);
  }

  private async renderFrame(): Promise<void> {
    if (!this.playback || !this.stage || !this.canvas) return;

    try {
      if (this.isPresentationMode && !this.isSeeking) {
        this.playback.state = PlaybackState.Presenting;
        await this.playback.progress();
      } else if (!this.isPresentationMode && !this.isSeeking) {
        if (this.playback.finished) {
          await this.playback.reset();
          this.playback.finished = false;
        }
        this.playback.state = PlaybackState.Playing;
        await this.playback.progress();
      }

      for (const cb of this.renderCallbacks) {
        cb();
      }

      await this.stage.render(
        this.playback.currentScene,
        this.playback.previousScene,
      );

      if (this.stage.finalBuffer) {
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
          this.canvas.width = this.stage.finalBuffer.width;
          this.canvas.height = this.stage.finalBuffer.height;
          ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          ctx.drawImage(this.stage.finalBuffer, 0, 0);
        }
      }
    } catch (error: unknown) {
      console.error("[MotionCanvasPresenter] Render error:", error);
    } finally {
      this.isRendering = false;
    }
  }

  private stopRenderLoop(): void {
    this.abortController?.abort();
    this.abortController = null;
    if (this.renderLoopId !== null) {
      cancelAnimationFrame(this.renderLoopId);
      this.renderLoopId = null;
    }
  }

  async start(): Promise<void> {
    if (!this.playback) return;

    if (this.hasSlides) {
      this.isPresentationMode = true;
      this.playback.state = PlaybackState.Presenting;
      await this.playback.reset();
      this.startRenderLoop();
    } else {
      this.isPresentationMode = false;
      this.playback.state = PlaybackState.Playing;
      await this.playback.reset();
      this.startRenderLoop();
    }
  }

  stop(): void {
    this.isPresentationMode = false;
    this.stopRenderLoop();
  }

  resumeSlide(): void {
    if (!this.playback) return;

    const scene = this.playback.currentScene;
    if (scene?.slides) {
      scene.slides.resume();
    }
  }

  async seekToBeginning(): Promise<void> {
    if (!this.playback) return;

    this.isSeeking = true;
    try {
      this.playback.state = PlaybackState.Paused;
      await this.playback.reset();
    } finally {
      if (this.isPresentationMode) {
        this.playback.state = PlaybackState.Presenting;
      }
      this.isSeeking = false;
    }
  }

  async seekToSlide(slideId: string): Promise<void> {
    if (!this.playback) return;

    this.isSeeking = true;
    try {
      this.playback.state = PlaybackState.Playing;
      await this.playback.goTo(slideId);
    } finally {
      if (this.isPresentationMode) {
        this.playback.state = PlaybackState.Presenting;
      }
      this.isSeeking = false;
    }
  }

  getSlides(): string[] {
    if (!this.playback) return [];
    return this.playback.slides.map((s) => s.id);
  }

  getCurrentSlideId(): string | null {
    if (!this.playback) return null;
    return this.playback.currentScene?.slides?.getCurrent()?.id ?? null;
  }

  isWaiting(): boolean {
    if (!this.playback) return false;
    return this.playback.currentScene?.slides?.isWaiting() ?? false;
  }

  getCurrentSlideIndex(): number {
    if (!this.playback) return 0;
    const { frame, slides } = this.playback;
    for (let i = slides.length - 1; i >= 0; i--) {
      const slideFrame = slides[i].time * this.settings.fps;
      if (frame >= slideFrame) {
        return i;
      }
    }
    return 0;
  }

  getSlideTimings(): { id: string; startFrame: number; duration: number }[] {
    if (!this.playback) return [];
    const slides = this.playback.slides;
    const fps = this.settings.fps;
    const totalDurationFrames = this.playback.duration;

    return slides.map((slide, i) => {
      const startFrame = Math.round(slide.time * fps);
      const nextStartFrame =
        i < slides.length - 1
          ? Math.round(slides[i + 1].time * fps)
          : totalDurationFrames;
      const durationSeconds = (nextStartFrame - startFrame) / fps;
      return {
        id: slide.id,
        startFrame,
        duration: durationSeconds,
      };
    });
  }

  onRender(callback: () => void): () => void {
    this.renderCallbacks.push(callback);
    return () => {
      const idx = this.renderCallbacks.indexOf(callback);
      if (idx >= 0) this.renderCallbacks.splice(idx, 1);
    };
  }

  getSegments(): Segment[] {
    if (!this.playback) return [];
    const slides = this.playback.slides;
    const fps = this.settings.fps;
    const totalDuration = this.playback.duration;
    const segments: Segment[] = [];
    for (let i = 0; i <= slides.length; i++) {
      const start = i === 0 ? 0 : Math.round(slides[i - 1].time * fps);
      const end =
        i === slides.length ? totalDuration : Math.round(slides[i].time * fps);
      const slideId = i === 0 ? null : slides[i - 1].id;
      const slideName = i === 0 ? null : slides[i - 1].name;
      segments.push({ start, end, slideId, slideName });
    }
    return segments.filter((s) => s.end > s.start);
  }

  get currentFrame(): number {
    return this.playback?.frame ?? 0;
  }

  get totalFrames(): number {
    return this.playback?.duration ?? 0;
  }

  get fps(): number {
    return this.settings.fps;
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  get slidesAvailable(): boolean {
    return this.hasSlides;
  }

  updateColors(colors: Record<string, string>): void {
    if (!this.playback) return;

    for (const scene of this.playback.onScenesRecalculated.current) {
      scene.variables.updateSignals(colors);
    }
  }

  dispose(): void {
    this.stopRenderLoop();
    this.sharedWebGLContext?.dispose();
    this.playback = null;
    this.status = null;
    this.stage = null;
    this.sharedWebGLContext = null;
    this.logger = null;
    this.canvas = null;
    this.isInitialized = false;
    this.renderCallbacks = [];
  }
}
