export interface SegmentInfo {
  slideName: string | null;
}

export class McSlideControls extends HTMLElement {
  private prevBtn!: HTMLButtonElement;
  private nextBtn!: HTMLButtonElement;
  private progressBar!: HTMLDivElement;
  private progressWrapper!: HTMLDivElement;
  private segmentElements: HTMLDivElement[] = [];
  private activeIndex = 0;
  private waitingIndex = -1;
  private labelRow: HTMLDivElement | null = null;
  private onNavigateCallback:
    | ((targetIndex: number, currentIndex: number) => void)
    | null = null;

  connectedCallback(): void {
    this.className = "mc-controls";

    const prev = document.createElement("button");
    prev.className = "mc-ctrl-btn";
    prev.setAttribute("aria-label", "Previous slide");
    prev.disabled = true;
    prev.textContent = "\u00AB";

    const progressBar = document.createElement("div");
    progressBar.className = "mc-progress-bar";

    const progressWrapper = document.createElement("div");
    progressWrapper.className = "mc-progress-wrapper";
    progressWrapper.appendChild(progressBar);

    const next = document.createElement("button");
    next.className = "mc-ctrl-btn";
    next.setAttribute("aria-label", "Next slide");
    next.textContent = "\u00BB";

    this.appendChild(prev);
    this.appendChild(progressWrapper);
    this.appendChild(next);

    this.prevBtn = prev;
    this.nextBtn = next;
    this.progressBar = progressBar;
    this.progressWrapper = progressWrapper;

    this.prevBtn.addEventListener("click", () => {
      if (this.activeIndex > 0) {
        this.onNavigateCallback?.(this.activeIndex - 1, this.activeIndex);
      }
    });

    this.nextBtn.addEventListener("click", () => {
      if (this.activeIndex < this.segmentElements.length - 1) {
        this.onNavigateCallback?.(this.activeIndex + 1, this.activeIndex);
      }
    });
  }

  configure(
    segments: SegmentInfo[],
    onNavigate: (targetIndex: number, currentIndex: number) => void,
  ): void {
    this.onNavigateCallback = onNavigate;
    this.segmentElements = [];
    this.progressBar.innerHTML = "";

    for (let i = 0; i < segments.length; i++) {
      const segDiv = document.createElement("div");
      segDiv.className = "mc-segment";
      const name = segments[i].slideName;
      if (name) {
        segDiv.title = name;
      }
      segDiv.addEventListener("click", () => onNavigate(i, this.activeIndex));
      this.progressBar.appendChild(segDiv);
      this.segmentElements.push(segDiv);
    }

    if (this.labelRow) {
      this.labelRow.remove();
      this.labelRow = null;
    }

    const hasLabels = segments.some((s) => s.slideName !== null);
    if (hasLabels) {
      this.labelRow = document.createElement("div");
      this.labelRow.className = "mc-label-row";

      for (const [index, seg] of segments.entries()) {
        const label = document.createElement("span");
        label.className = "mc-segment-label";
        label.textContent = seg.slideName ?? "";
        if (index === 0) {
          label.textContent = "Start";
        } else if (seg.slideName) {
          label.title = seg.slideName;
        }
        this.labelRow.appendChild(label);
      }

      this.progressWrapper.appendChild(this.labelRow);
    }

    this.setActive(0);
  }

  setActive(index: number): void {
    if (
      index === this.activeIndex &&
      this.segmentElements[index]?.classList.contains("mc-segment-active")
    ) {
      return;
    }

    this.activeIndex = index;

    for (let i = 0; i < this.segmentElements.length; i++) {
      this.segmentElements[i].classList.toggle(
        "mc-segment-active",
        i === index,
      );
    }

    this.prevBtn.disabled = index <= 0;
    this.nextBtn.disabled = index >= this.segmentElements.length - 1;
  }

  setWaiting(index: number): void {
    if (index === this.waitingIndex) return;

    if (
      this.waitingIndex >= 0 &&
      this.waitingIndex < this.segmentElements.length
    ) {
      this.segmentElements[this.waitingIndex].classList.remove(
        "mc-segment-waiting",
      );
    }

    this.waitingIndex = index;

    if (index >= 0 && index < this.segmentElements.length) {
      this.segmentElements[index].classList.add("mc-segment-waiting");
    }
  }
}

customElements.define("mc-slide-controls", McSlideControls);
