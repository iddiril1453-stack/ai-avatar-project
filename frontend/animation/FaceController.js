export class FaceController {
  constructor(model) {
    this.model = model;

    this.head = null;
    this.isTalking = false;

    this.time = 0;

    this.findHead();
  }

  findHead() {
    this.model.traverse((child) => {
      const name = child.name?.toLowerCase() || "";

      if (name.includes("head") || name.includes("neck")) {
        this.head = child;
      }
    });

    console.log("FACE CONTROLLER READY:", {
      head: !!this.head
    });
  }

  setTalking(state) {
    this.isTalking = state;
  }

  setIdle() {
    this.isTalking = false;
  }

update(delta) {
  if (!this.head) return;

  this.time += delta;
  const t = this.time;

  // 🧊 idle motion
  let idleY = Math.sin(t * 1.2) * 0.005;
  let idleX = Math.sin(t * 0.8) * 0.003;

  // 🗣️ talking boost (DAHA GÜÇLÜ)
  let talkFactor = this.isTalking ? 1 : 0;

  let talkY = Math.sin(t * 12) * 0.15 * talkFactor;
  let talkX = Math.sin(t * 10) * 0.08 * talkFactor;

  // 🔥 APPLY
  this.head.rotation.y = idleY + talkY;
  this.head.rotation.x = idleX + talkX;
}
}