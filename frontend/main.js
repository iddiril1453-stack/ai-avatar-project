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
let mixer;

let breathTime = 0;
let currentAudio = null;

/* =========================
   BEHAVIOR ENGINE
========================= */
const behavior = new AvatarBehaviorEngine();

/* =========================
   MOUSE TRACKING
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

/* =========================
   CAMERA
========================= */
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 1.7, 4.5);

/* =========================
   RENDERER
========================= */
const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* =========================
   LIGHT
========================= */
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
scene.add(hemiLight);

/* =========================
   CONTROLS (FIXED)
========================= */
const controls = new OrbitControls(camera, renderer.domElement);

/* 🔥 FIX 1: pivot artık modelWrapper ile aynı */
controls.target.set(0, 0.4, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.update(

/* =========================
   MODEL LOAD
========================= */
const loader = new GLTFLoader();

loader.load("./model.glb?v=" + Date.now(), (gltf) => {

const model = gltf.scene;

/* 🔥 FIX 1: MODEL UPRIGHT */
model.rotation.set(Math.PI / 2, 0, 0);

/* 🔥 FIX 2: SCALE */
model.scale.set(2.1, 2.1, 2.1);

/* 🔥 FIX 3: ARMATURE RESET */
model.traverse((child) => {
  if (child.isBone) {
    child.rotation.set(0, 0, 0);
  }
});

/* 🔥 FORCE UPRIGHT */
model.updateMatrixWorld(true);

  /* =========================
     SCALE
  ========================= */
  

  /* =========================
     ORIENTATION FIX (SAFE)
  ========================= */
  model.rotation.set(0, -Math.PI / 2, 0);

  /* =========================
     CLEAN PIVOT WRAPPER
  ========================= */
  const modelWrapper = new THREE.Group();
  modelWrapper.position.set(0, 0.4, 0);
  modelWrapper.rotation.set(0, 0, 0);

  modelWrapper.add(model);
  scene.add(modelWrapper);

  characterModel = model;

  /* =========================
     NODE DETECTION
  ========================= */
  model.traverse((child) => {
    const name = child.name?.toLowerCase() || "";

    if (
      name.includes("head") ||
      name.includes("face") ||
      name.includes("neck")
    ) {
      head = child;
    }

    if (name.includes("arm")) {
      child.rotation.z = -0.3;
    }
  });

  /* =========================
     AI SYSTEMS
  ========================= */
  brain = new AnimationBrain(characterModel);
  blinkSystem = new BlinkSystem(characterModel);

  /* =========================
     ANIMATION
  ========================= */
  if (gltf.animations?.length) {
    mixer = new THREE.AnimationMixer(model);
    mixer.clipAction(gltf.animations[0]).play();
  }

  /* =========================
     INIT TARGET (SAFE)
  ========================= */
  target.set(0, 1.6, 0);
  smoothTarget.copy(target);

  animate();
});

/* =========================
   STATE BRIDGE
========================= */
behavior.bind({
  onStateChange: (state, intensity) => {
    if (brain) {
      brain.setState(state, intensity);
    }



    isTalking = state === "talking";
    isThinking = state === "thinking";
  }
});

/* =========================
   CHARACTER UPDATE
========================= */
function animateCharacter(delta) {
  if (!characterModel) return;

  const t = clock.getElapsedTime();

  if (blinkSystem) {
    blinkSystem.update(delta, isTalking);
  }

  breathTime += delta * 2;

  if (!isTalking) {
    characterModel.position.y = Math.sin(breathTime) * 0.003;
  }

  /* =========================
     🔥 FIX 5: Z DEPTH BUG FIX
  ========================= */
  target.set(
    mouse.x * 1.5,
    1.6 + mouse.y * 0.5,
    0   // ❌ eski 2 -> BU CIRCLE BUG YAPIYORDU
  );

  if (isTalking) {
    target.y += Math.sin(t * 10) * 0.02;
  }

  smoothTarget.lerp(target, 0.05);

  /* head lookAt kapalı (şimdilik stabilizasyon için) */
}

/* =========================
   MAIN LOOP
========================= */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);

  animateCharacter(delta);

  /* 🔥 FIX 6 */
  controls.update();

  renderer.render(scene, camera);
}
function setState(state) {
  if (behavior) {
    behavior.setState(state);
  }

  isTalking = state === "talking";
  isThinking = state === "thinking";
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
    const res = await fetch(
      "https://ai-avatar-project-d2r9.onrender.com/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      }
    );

    const data = await res.json();

    setState("idle");

    if (data.reply) speak(data.reply);

  } catch (err) {
    console.error("SEND ERROR:", err);
    setState("idle");
  }

  input.value = "";
}

/* =========================
   SPEAK
========================= */
async function speak(text) {
  try {
    const res = await fetch(
      "https://ai-avatar-project-d2r9.onrender.com/tts",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      }
    );

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    // 🔥 FIX: önceki sesi durdur
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = "";
      currentAudio = null;
    }

    const audio = new Audio(url);
    currentAudio = audio;

    audio.onplay = () => setState("talking");
    audio.onended = () => {
      setState("idle");
      currentAudio = null;
    };

    await audio.play();

  } catch (err) {
    console.error("TTS ERROR:", err);
  }
}

/* =========================
   UI EVENTS
========================= */
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("sendBtn");
  const input = document.getElementById("userInput");

  btn?.addEventListener("click", sendMessage);

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});