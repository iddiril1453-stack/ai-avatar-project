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

if (this.state === "listening")
  this.handleListening();

if (this.state === "thinking")
  this.handleThinking();
  }
handleListening() {
  if (!this.head) return;

  const t = this.time;

  // 🎯 hafif kafa eğme
  this.head.rotation.x = 0.15;

  // 🎯 çok hafif sağ sol hareket
  this.head.rotation.y =
    Math.sin(t * 1.5) * 0.08;

  // 🎯 küçük odak hissi
  this.head.rotation.z =
    Math.sin(t * 2) * 0.03;
}
handleThinking() {
  if (!this.head) return;

  const t = this.time;

  // 🎯 yukarı bakış
  this.head.rotation.x = -0.2;

  // 🎯 hafif sağa düşünme bakışı
  this.head.rotation.y = 0.25;

  // 🎯 küçük düşünme hareketi
  this.head.rotation.z =
    Math.sin(t * 1.5) * 0.04;
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

  // 🎯 SADECE KAFA (ANA KONUŞMA)
  this.head.rotation.y = Math.sin(t * 3) * 0.25;
  this.head.rotation.x = Math.sin(t * 2) * 0.15;

  // 🎯 ÇOK HAFİF GÖVDE (SADECE YAŞAM HİSSİ)
  if (this.model) {
    this.model.position.y =
      this.baseY + Math.sin(t * 2) * 0.005;
  }
}
}