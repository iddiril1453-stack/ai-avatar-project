import * as THREE from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { AnimationBrain } from './animation/animationBrain.js';
import { BlinkSystem } from './animation/blinkSystem.js';
import { AvatarBehaviorEngine } from "./avatarBehaviorEngine.js";
import { FaceController } from "./animation/FaceController.js";

/* ========================= */
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

let modelSize = new THREE.Vector3();
let modelCenter = new THREE.Vector3();

/* ========================= */
const mouse = { x: 0, y: 0 };
const target = new THREE.Vector3();
const smoothTarget = new THREE.Vector3();
const clock = new THREE.Clock();

/* ========================= */
const behavior = new AvatarBehaviorEngine();

/* ========================= SCENE */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* ========================= CONTROLS */
const controls = new OrbitControls(camera, renderer.domElement);

controls.enableRotate = false;   // 🚫 kamera dönmeyecek
controls.enablePan = false;
controls.enableZoom = true;
controls.screenSpacePanning = false;

/* ========================= LIGHT */
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));

/* ========================= MOUSE */
window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

/* ========================= LOAD MODEL */
const loader = new GLTFLoader();

loader.load("./model.glb?v=" + Date.now(), (gltf) => {

  const model = gltf.scene;
  characterModel = model;

  scene.add(model);

  // SCALE
  model.scale.setScalar(0.01);
  model.updateWorldMatrix(true, true);

  // BBOX
 

modelCenter = box.getCenter(new THREE.Vector3());
modelSize = box.getSize(new THREE.Vector3());

model.position.sub(modelCenter);

  const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);
  const fitDistance = maxDim * 3;

  // CENTER FIX

  

  const orbitCenter = new THREE.Vector3(0, modelSize.y * 0.5, 0);

  // CAMERA
  const orbitCenter = new THREE.Vector3(0, modelSize.y * 0.5, 0);

camera.position.set(0, orbitCenter.y + 0.4, fitDistance);

controls.target.copy(orbitCenter);
controls.update();

  controls.minDistance = fitDistance * 0.6;
  controls.maxDistance = fitDistance * 1.8;

  controls.minPolarAngle = 0.8;
  controls.maxPolarAngle = Math.PI - 0.8;

  controls.update();

  blinkSystem = new BlinkSystem(characterModel);

  animate();
});

/* ========================= UPDATE */
function animateCharacter(delta) {

  if (!characterModel) return;

  const t = clock.getElapsedTime();

  if (blinkSystem) blinkSystem.update(delta, isTalking);

  breathTime += delta * 2;

  // idle bob (sadece Y POSITION)
  if (!isTalking) {
    characterModel.position.y = Math.sin(breathTime) * 0.015;
  }

  // ✅ TEK ROTATION SYSTEM
  const targetY = mouse.x * 1.2;

  characterModel.rotation.y = THREE.MathUtils.lerp(
    characterModel.rotation.y,
    targetY,
    0.08
  );

  // HEAD LOOK
  target.set(mouse.x * 0.6, 1.2 + mouse.y * 0.3, 1.5);
  smoothTarget.lerp(target, 0.1);

  if (head && !isTalking) {
    const temp = smoothTarget.clone();
    head.parent.worldToLocal(temp);
    head.lookAt(temp);
  }
}
/* ========================= LOOP */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);
  if (face) face.update(delta);
  if (brain) brain.update(delta, isTalking, isThinking);

  animateCharacter(delta);

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