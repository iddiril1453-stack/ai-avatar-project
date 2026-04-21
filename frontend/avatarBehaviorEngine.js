// avatarBehaviorEngine.js

export class AvatarBehaviorEngine {
  constructor() {
    this.state = "idle";

    this.intensity = 0; // 0–1 konuşma enerjisi
    this.lastStateChange = Date.now();

    this.callbacks = {
      onStateChange: null,
    };

    // internal loops
    this.startIdleLoop();
  }

  // 🎯 MAIN STATE SETTER
  setState(newState, meta = {}) {
    if (this.state === newState) return;

    this.state = newState;
    this.lastStateChange = Date.now();

    // emotion/intensity mapping
    this.intensity = meta.intensity || this.getDefaultIntensity(newState);

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.state, this.intensity);
    }

    console.log("🧠 Avatar State:", this.state);
  }

  // 🎭 AI intent → state mapping
  interpretAI(text = "") {
    const t = text.toLowerCase();

    if (t.includes("bekle") || t.includes("wait")) {
      this.setState("thinking");
      return;
    }

    if (t.includes("merhaba") || t.includes("hello")) {
      this.setState("idle", { intensity: 0.3 });
      return;
    }

    if (t.includes("fiyat") || t.includes("satın") || t.includes("price")) {
      this.setState("talking", { intensity: 0.9 });
      return;
    }

    // default
    this.setState("talking", { intensity: 0.6 });
  }

  // 🧠 DEFAULT INTENSITY RULES
  getDefaultIntensity(state) {
    switch (state) {
      case "talking":
        return 0.7;
      case "thinking":
        return 0.3;
      case "idle":
      default:
        return 0.1;
    }
  }

  // 🫁 IDLE LOOP (BREATH + MICRO STATE STABILITY)
  startIdleLoop() {
    setInterval(() => {
      if (this.state === "idle") {
        // subtle breathing modulation
        this.intensity = 0.1 + Math.sin(Date.now() * 0.001) * 0.05;
      }
    }, 50);
  }

  // 🎤 SPEECH SYNC HOOKS
  onSpeechStart() {
    this.setState("talking", { intensity: 1.0 });
  }

  onSpeechEnd() {
    this.setState("idle", { intensity: 0.2 });
  }

  // 👁 external binding
  bind(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}