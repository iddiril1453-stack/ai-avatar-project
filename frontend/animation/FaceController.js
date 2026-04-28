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

  // 🧍 IDLE (dinleme duruşu)
  const idleY = Math.sin(t * 1.2) * 0.003;
  const idleX = Math.sin(t * 0.8) * 0.002;

  // 🗣️ TALKING (konuşma duruşu)
  if (this.isTalking) {

    // daha belirgin kafa hareketi
    this.head.rotation.y = Math.sin(t * 8) * 0.12;
    this.head.rotation.x = Math.sin(t * 10) * 0.06;

  } else {

    // idle mode (sakin)
    this.head.rotation.y = idleY;
    this.head.rotation.x = idleX;
  }
}
}