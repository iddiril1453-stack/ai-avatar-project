export class FaceController {
  constructor(model) {
    this.model = model;

    this.mouthBone = null;
    this.headBone = null;

    this.blinkTimer = 0;
    this.isTalking = false;
    this.talkingIntensity = 0;

    this.findBones();
  }

  findBones() {
    this.model.traverse((child) => {

      const name = child.name.toLowerCase();

      if (name.includes("head")) {
        this.headBone = child;
      }

      if (name.includes("jaw") || name.includes("mouth")) {
        this.mouthBone = child;
      }
    });

    console.log("FACE BONES FOUND:", {
      head: !!this.headBone,
      mouth: !!this.mouthBone
    });
  }

  setTalking(intensity) {
    this.isTalking = true;
    this.talkingIntensity = intensity; // 0 - 1
  }

  setIdle() {
    this.isTalking = false;
    this.talkingIntensity = 0;
  }

  update(delta) {

    // 🗣️ TALKING ANIMATION
    if (this.isTalking && this.mouthBone) {

      const open = Math.sin(Date.now() * 0.02) * this.talkingIntensity;

      this.mouthBone.rotation.x = open * 0.5;
    }

    // 🙂 HEAD MICRO MOVEMENT
    if (this.headBone) {
      this.headBone.rotation.y =
        Math.sin(Date.now() * 0.001) * 0.05;
    }

    // 👀 BLINK SYSTEM (simulated)
    this.blinkTimer += delta;

    if (this.blinkTimer > 3) {
      this.blink();
      this.blinkTimer = 0;
    }
  }

  blink() {
    if (!this.headBone) return;

    const original = this.headBone.scale.y;

    this.headBone.scale.y = 0.1;

    setTimeout(() => {
      this.headBone.scale.y = original;
    }, 120);
  }
}