export class AnimationBrain {
  constructor(model) {
    this.model = model;

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

  update(delta, mouse = { x: 0, y: 0 }, isTalking = false, isThinking = false, isListening = false) {
    this.time += delta;

    this.handleIdleMotion();
    this.handleMouseLook(mouse);

    if (isTalking || this.state === "talking") {
      this.handleTalking();
    }
  }

  handleIdleMotion() {
    if (!this.model) return;

    const breathe = Math.sin(this.time * 2) * 0.002;
    if (!this.baseY) {
  this.baseY = this.model.position.y;
}

this.model.position.y = this.baseY + Math.sin(this.time * 2) * 0.01;
  }

  handleMouseLook(mouse) {
    if (!this.model || !this.model.head) return;

    this.targetRotation.y = mouse.x * 0.5;
    this.targetRotation.x = mouse.y * 0.3;

    this.model.head.rotation.y +=
      (this.targetRotation.y - this.model.head.rotation.y) * 0.05;

    this.model.head.rotation.x +=
      (this.targetRotation.x - this.model.head.rotation.x) * 0.05;
  }

  handleTalking() {
    if (!this.model) return;

    const jawMovement = Math.sin(this.time * 20) * 0.05;

    if (this.model.jaw) {
      this.model.jaw.rotation.x = jawMovement;
    }

    if (this.model.head) {
      this.model.head.rotation.y += Math.sin(this.time * 5) * 0.002;
    }
  }
}