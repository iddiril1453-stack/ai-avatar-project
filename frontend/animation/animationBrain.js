export class AnimationBrain {
  constructor(model) {
    this.model = model;

    // STATE SYSTEM
    this.state = "idle";

    // INTERNAL TIMERS
    this.time = 0;

    // TARGETS
    this.targetRotation = { x: 0, y: 0 };
  }

  /* =========================
     STATE CONTROL
  ========================= */

  setState(state) {
    this.state = state;
  }

  is(state) {
    return this.state === state;
  }

  /* =========================
     UPDATE LOOP
  ========================= */

  update(delta, mouse, isTalking) {
    this.time += delta;

    this.handleIdleMotion();
    this.handleMouseLook(mouse);

    if (isTalking || this.state === "talking") {
      this.handleTalking();
    }
  }

  /* =========================
     IDLE ANIMATION
  ========================= */

  handleIdleMotion() {
    if (!this.model) return;

    const breathe = Math.sin(this.time * 2) * 0.002;

    this.model.position.y += breathe;
  }

  /* =========================
     MOUSE LOOK (HEAD CONTROL)
  ========================= */

  handleMouseLook(mouse) {
    if (!this.model || !this.model.head) return;

    this.targetRotation.y = mouse.x * 0.5;
    this.targetRotation.x = mouse.y * 0.3;

    this.model.head.rotation.y +=
      (this.targetRotation.y - this.model.head.rotation.y) * 0.05;

    this.model.head.rotation.x +=
      (this.targetRotation.x - this.model.head.rotation.x) * 0.05;
  }

  /* =========================
     TALK ANIMATION (FAKE)
  ========================= */

  handleTalking() {
    if (!this.model) return;

    const jawMovement = Math.sin(this.time * 20) * 0.05;

    if (this.model.jaw) {
      this.model.jaw.rotation.x = jawMovement;
    }

    // micro head motion
    if (this.model.head) {
      this.model.head.rotation.y += Math.sin(this.time * 5) * 0.002;
    }
  }
}