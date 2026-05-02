export class AnimationBrain {
  constructor(model, head) {
  this.model = model;
  this.head = head;

    this.state = "idle";
    this.time = 0;

    this.targetRotation = { x: 0, y: 0 };
  }

  setState(state) {
    this.state = state;
  }

  is(state) {
    return this.state === state;
  }

  update(delta, mouse = { x: 0, y: 0 }) {
    this.time += delta;

    this.handleIdleMotion();
    this.handleMouseLook(mouse);

    if (this.state === "talking") this.handleTalking();
    if (this.state === "listening") this.handleListening();
  }

  handleIdleMotion() {
    if (!this.model) return;

    if (!this.baseY) {
      this.baseY = this.model.position.y;
    }

    this.model.position.y =
      this.baseY + Math.sin(this.time * 2) * 0.01;
  }

handleMouseLook(mouse) {
  if (!this.head) return;

  this.targetRotation.y = mouse.x * 0.5;
  this.targetRotation.x = mouse.y * 0.3;

  this.head.rotation.y +=
    (this.targetRotation.y - this.head.rotation.y) * 0.05;

  this.head.rotation.x +=
    (this.targetRotation.x - this.head.rotation.x) * 0.05;
}

handleTalking() {
  if (!this.head || !this.model) return;

  const t = this.time;

  // 🔥 KAFA HAREKETİ (ARTTIRILDI)
  this.head.rotation.y = Math.sin(t * 3) * 0.4;
  this.head.rotation.x = Math.sin(t * 2) * 0.25;

  // 🔥 GÖVDE HAFİF DÖNÜŞ
  this.model.rotation.y = Math.sin(t * 2) * 0.08;

  // 🔥 ÖNE EĞİLME (EN KRİTİK)
  this.model.position.z = Math.sin(t * 3) * 0.05;

  // 🔥 RİTİM (KONUŞMA HİSSİ)
  this.model.position.y =
    this.baseY + Math.sin(t * 6) * 0.02;
}
}