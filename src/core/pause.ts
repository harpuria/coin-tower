export class PauseState {
  private reasons = new Set<string>();
  constructor(private onChange: (paused: boolean) => void) {}
  get paused() {
    return this.reasons.size > 0;
  }
  /** 특정 이유만 확인한다. 수동 일시정지 토글은 전체 상태가 아니라 이 값을 기준으로 한다. */
  has(reason: string) {
    return this.reasons.has(reason);
  }
  set(reason: string, active: boolean) {
    const before = this.paused;
    if (active) this.reasons.add(reason);
    else this.reasons.delete(reason);
    if (before !== this.paused) this.onChange(this.paused);
  }
}
