export class BlinkSystem {
  constructor(model) {
    this.model = model;
    this.timer = 0;
    this.nextBlink = this.randomBlinkTime();
  }

  randomBlinkTime() {
    return 2 + Math.random() * 4; // 2–6 saniye arası
  }

  update(delta) {
    this.timer += delta;

    if (this.timer > this.nextBlink) {
      this.blink();
      this.timer = 0;
      this.nextBlink = this.randomBlinkTime();
    }
  }

  blink() {
    if (!this.model?.leftEye || !this.model?.rightEye) return;

    // göz kapama
    this.model.leftEye.scale.y = 0.1;
    this.model.rightEye.scale.y = 0.1;

    // açma
    setTimeout(() => {
      if (!this.model) return;

      this.model.leftEye.scale.y = 1;
      this.model.rightEye.scale.y = 1;
    }, 120);
  }
}