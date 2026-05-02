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
  if (!this.head) return;

  const t = this.time;

  // 🎯 base movement (yumuşak konuşma)
  const baseY = Math.sin(t * 4) * 0.15;
  const baseX = Math.sin(t * 2.5) * 0.08;

  // 🎯 mikro jitter (insan hissi)
  const jitterY = (Math.random() - 0.5) * 0.05;
  const jitterX = (Math.random() - 0.5) * 0.03;

  // 🎯 pause effect (konuşma ritmi)
  const pause = Math.sin(t * 1.5) > 0.8 ? 0.3 : 1;

  this.head.rotation.y =
    (baseY + jitterY) * pause;

  this.head.rotation.x =
    (baseX + jitterX) * pause;
}
handleListening() {
  if (!this.head) return;

  this.head.rotation.y =
    Math.sin(this.time * 3) * 0.2;
}
}