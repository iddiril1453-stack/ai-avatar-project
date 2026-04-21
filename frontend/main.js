import * as THREE from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { AnimationBrain } from './animation/animationBrain.js';
import { BlinkSystem } from './animation/blinkSystem.js';
import { AvatarBehaviorEngine } from "./avatarBehaviorEngine.js";

/* =========================
   CORE STATE
========================= */
let head;
let characterModel;

let isThinking = false;
let isTalking = false;

let mouse = { x: 0, y: 0 };

let target = new THREE.Vector3();
let smoothTarget = new THREE.Vector3();

let clock = new THREE.Clock();

let brain;
let blinkSystem;

let breathTime = 0;

/* =========================
   BEHAVIOR ENGINE
========================= */
const behavior = new AvatarBehaviorEngine();

/* =========================
   MOUSE FIX (ADDED)
========================= */
window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

/* =========================
   SCENE
========================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 1.5, 3.2);
camera.lookAt(0, 1.4, 0);

/* RENDERER */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* LIGHT */
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));

/* CONTROLS */
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.2, 0);
controls.update();

/* =========================
   MODEL LOAD
========================= */
const loader = new GLTFLoader();

loader.load('./model.glb', (gltf) => {

  const wrapper = new THREE.Group();
  const model = gltf.scene;

  model.traverse((child) => {
    const name = child.name?.toLowerCase() || "";

    if (name.includes("head")) {
      head = child;
    }

    if (name.includes("arm")) {
      child.rotation.z = -0.3;
    }
  });

  model.scale.set(2.1, 2.1, 2.1);
  model.rotation.y = -Math.PI / 2;

  wrapper.add(model);
  wrapper.position.set(0, 0.4, 0);

  scene.add(wrapper);

  // 🔥 SAFE FIX (WRAPPER USED)
  characterModel = wrapper;

  brain = new AnimationBrain(characterModel);
  blinkSystem = new BlinkSystem(characterModel);

  target.set(0, 1.6, 2);
  smoothTarget.copy(target);

  animate();
});

/* =========================
   BEHAVIOR → BRAIN BRIDGE
========================= */
behavior.bind({
  onStateChange: (state, intensity) => {
    if (brain) brain.setState(state, intensity);

    isTalking = state === "talking";
    isThinking = state === "thinking";
  }
});

/* =========================
   CHARACTER UPDATE
========================= */
function animateCharacter(delta) {
  if (!characterModel || !head || !brain) return;

  const t = clock.getElapsedTime();

  // 🧠 brain update (SAFE)
  brain.update(delta, mouse, isTalking);

  // 👁 blink (ONLY ONCE)
  if (blinkSystem) {
    blinkSystem.update(delta, isTalking);
  }

  // 🫁 breathing
  breathTime += delta * 2;

  if (!isTalking) {
    const breath = Math.sin(breathTime) * 0.003;
    characterModel.position.y = 0.4 + breath;

    // 🎭 idle motion
    characterModel.rotation.y += Math.sin(t * 0.3) * 0.0005;
    characterModel.rotation.x = Math.sin(t * 0.5) * 0.002;
  }

  // 🎯 look target
  target.set(mouse.x * 1.5, 1.6 + mouse.y * 0.5, 2);

  if (isTalking) {
    target.y += Math.sin(t * 10) * 0.02;
  }

  smoothTarget.lerp(target, 0.05);

  // 👁 head look
  if (head) {
    head.lookAt(smoothTarget);
    head.rotation.x += Math.sin(t * 0.5) * 0.002;
  }
}

/* =========================
   MAIN LOOP
========================= */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  animateCharacter(delta);

  renderer.render(scene, camera);
}

/* =========================
   CHAT API
========================= */
async function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value;

  if (!text) return;

  setState("thinking");

  try {
    const res = await fetch("https://ai-avatar-project-d2r9.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const raw = await res.text();
    const data = JSON.parse(raw);

    console.log("BACKEND:", data);

    setState("idle");

    if (data.reply) {
      speak(data.reply);
    }

  } catch (err) {
    console.error("SEND ERROR:", err);
    setState("idle");
  }

  input.value = "";
}

/* =========================
   STATE SYSTEM
========================= */
function setState(state) {
  if (behavior) behavior.setState(state);

  isTalking = state === "talking";
  isThinking = state === "thinking";
}

/* =========================
   SPEAK
========================= */
async function speak(text) {
  try {
    const res = await fetch("https://ai-avatar-project-d2r9.onrender.com/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);

    audio.onplay = () => setState("talking");
    audio.onended = () => setState("idle");

    audio.play();

  } catch (err) {
    console.error("TTS ERROR:", err);
  }
}

/* =========================
   UI
========================= */
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("sendBtn");
  const input = document.getElementById("userInput");

  if (btn && input) {
    btn.addEventListener("click", sendMessage);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }
});