import * as THREE from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { AnimationBrain } from './animation/animationBrain.js';
import { BlinkSystem } from './animation/blinkSystem.js';
import { AvatarBehaviorEngine } from "./avatarBehaviorEngine.js";
import { FaceController } from "./animation/FaceController.js";

let face;
let head = null;
let characterModel;

let brain;
let blinkSystem;
let mixer;

let isTalking = false;
let isThinking = false;

let breathTime = 0;
let currentAudio = null;

const mouse = { x: 0, y: 0 };
const target = new THREE.Vector3();
const smoothTarget = new THREE.Vector3();
const clock = new THREE.Clock();

const behavior = new AvatarBehaviorEngine();

/* =========================
   SCENE
========================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);
scene.add(new THREE.AxesHelper(5));

/* =========================
   CAMERA
========================= */
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

/* =========================
   RENDERER
========================= */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* =========================
   CONTROLS (IMPORTANT FIX)
========================= */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

controls.enablePan = false;

// 🔥 CRITICAL FIX: YUVARLANMA (POLAR LIMIT)
controls.minPolarAngle = Math.PI * 0.35;
controls.maxPolarAngle = Math.PI * 0.65;

// 🔥 zoom clamp (model bozulmasını engeller)
controls.minDistance = 2;
controls.maxDistance = 8;

/* =========================
   LIGHT
========================= */
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));

/* =========================
   MOUSE
========================= */
window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

/* =========================
   LOAD MODEL
========================= */
const loader = new GLTFLoader();

loader.load("./model.glb?v=" + Date.now(), (gltf) => {

  const model = gltf.scene;

  const wrapper = new THREE.Group();
  scene.add(wrapper);
  wrapper.add(model);

  // =========================
  // SCALE FIX
  // =========================
  model.scale.setScalar(0.01);

  model.updateWorldMatrix(true, true);

  // =========================
  // CENTER FIX
  // =========================
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  model.position.sub(center);
  model.position.y += size.y * 0.5;

  model.rotation.set(0, 0, 0);

  characterModel = model;
  window.characterModel = characterModel;

  console.log("MODEL READY ✅", characterModel);

  brain = new AnimationBrain(characterModel);
  face = new FaceController(characterModel);

  if (gltf.animations?.length) {
    mixer = new THREE.AnimationMixer(model);

    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.play();
      action.setEffectiveWeight(0.3);
    });
  }

  model.traverse((child) => {
    const n = child.name?.toLowerCase() || "";
    if (n.includes("head") || n.includes("neck") || n.includes("face")) {
      head = child;
    }
  });

  /* =========================
     CAMERA AUTO FIT (FIXED)
  ========================= */

  const maxDim = Math.max(size.x, size.y, size.z);

  const centerWorld = new THREE.Vector3(0, size.y * 0.5, 0);

  const dist = maxDim * 2.2;

  camera.position.set(
    0,
    centerWorld.y + maxDim * 0.2,
    dist
  );

  camera.lookAt(centerWorld);

  controls.target.copy(centerWorld);
  controls.update();

  blinkSystem = new BlinkSystem(characterModel);

  animate();
});

/* =========================
   ANIMATION LOOP
========================= */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);
  if (brain) brain.update(delta, isTalking, isThinking);
  if (face) face.update(delta);

  controls.update();
  renderer.render(scene, camera);
}

/* =========================
   STATE
========================= */
function setState(state) {
  behavior.setState(state);

  isTalking = state === "talking";
  isThinking = state === "thinking";
}

/* =========================
   CHAT
========================= */
let isSending = false;

async function sendMessage() {
  if (isSending) return;

  const input = document.getElementById("userInput");
  const text = input.value;

  if (!text) return;

  input.value = "";
  isSending = true;

  setState("thinking");

  try {
    const res = await fetch("https://ai-avatar-project-d2r9.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    if (data.reply) {
      speak(data.reply); // 🔥 TEK ENTRY POINT
    }

  } catch (err) {
    console.error(err);
    setState("idle");
    face?.setIdle?.();
    isSending = false;
  }
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

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    if (currentAudio) {
      currentAudio.pause();
    }

    const audio = new Audio(url);
    currentAudio = audio;

    audio.onplay = () => {
      setState("talking");
      face?.setTalking?.(1);
    };

    audio.onended = () => {
      setState("idle");
      face?.setIdle?.();
      isSending = false;
    };

    audio.play();

  } catch (err) {
    console.error(err);
    setState("idle");
    face?.setIdle?.();
    isSending = false;
  }
}

/* =========================
   UI
========================= */
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("sendBtn")?.addEventListener("click", sendMessage);

  document.getElementById("userInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});