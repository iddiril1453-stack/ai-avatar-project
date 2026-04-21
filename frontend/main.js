import * as THREE from './libs/three.module.js'; 
import { GLTFLoader } from './libs/GLTFLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { AnimationBrain } from './animation/animationBrain.js';
/* =========================
   STATE
========================= */

let head;
let characterModel;

let isThinking = false;
let isTalking = false;
let currentEmotion = "neutral";

let mouse = { x: 0, y: 0 };

let target = new THREE.Vector3();
let smoothTarget = new THREE.Vector3();

let clock = new THREE.Clock();
let brain;
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

/* =========================
   RENDERER
========================= */

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1);
document.body.appendChild(renderer.domElement);

/* =========================
   LIGHT
========================= */

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));

/* =========================
   CONTROLS
========================= */

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.2, 0);
controls.update();

/* =========================
   MODEL
========================= */

const loader = new GLTFLoader();

loader.load('./model.glb', (gltf) => {
  console.log("MODEL LOADED ✅");

  const wrapper = new THREE.Group();
  const model = gltf.scene;

  // HEAD + ARM DETECT
  model.traverse((child) => {
    console.log("NODE:", child.name);

    const name = child.name?.toLowerCase() || "";

    // head detect
    if (name.includes("head")) {
      head = child;
      console.log("HEAD FOUND ✅", child.name);
    }

    // arm relax (T-pose kırma)
    if (name.includes("arm")) {
      child.rotation.z = -0.3;
    }
  });

  // MODEL TRANSFORM
model.scale.set(2.1, 2.1, 2.1);

model.position.set(0, 0, 0);

model.rotation.y = -Math.PI / 2;

wrapper.add(model);

wrapper.position.set(0, 0.4, 0);

scene.add(wrapper);

  // DEBUG AXES


  characterModel = wrapper;

brain = new AnimationBrain(characterModel);

  // LOOK TARGET
  target.set(0, 1.6, 2);
  smoothTarget.copy(target);

  console.log("MODEL READY 🚀");
});

/* =========================
   CHARACTER LOOK SYSTEM
========================= */

function animateCharacter() {
  if (!characterModel || !head || !brain) return;

  const delta = clock.getDelta();

  brain.update(delta, mouse, isTalking);

  const t = clock.getElapsedTime();

  target.set(mouse.x * 1.5, 1.6 + mouse.y * 0.5, 2);

  if (isTalking) {
    target.y += Math.sin(t * 10) * 0.02;
  }

  smoothTarget.lerp(target, 0.05);

  head.lookAt(smoothTarget);
}

/* =========================
   MAIN LOOP
========================= */

function animate() {
  requestAnimationFrame(animate);

  animateCharacter();

  renderer.render(scene, camera);
}

animate();


/* =========================
   CHAT API
========================= */

async function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value;

  if (!text) return;

  isThinking = true;

  try {
    const res = await fetch("https://ai-avatar-project-d2r9.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    console.log("BACKEND:", data);

    isThinking = false;
    speak(data.reply);

  } catch (err) {
    console.error(err);
  }

  input.value = "";
}

/* =========================
   SPEECH
========================= */

async function speak(text) {
  try {
    const res = await fetch("https://ai-avatar-project-d2r9.onrender.com/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);

    isTalking = true;

    audio.play();

    audio.onended = () => {
      isTalking = false;
    };

  } catch (err) {
    console.error("TTS error:", err);
  }
}

/* =========================
   UI EVENTS
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