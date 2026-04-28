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

/* =========================
   BEHAVIOR ENGINE
========================= */
const behavior = new AvatarBehaviorEngine();

/* =========================
   SCENE / CAMERA / RENDERER
========================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* =========================
   LIGHT
========================= */
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
scene.add(hemiLight);

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

  model.scale.setScalar(2);

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);

 model.rotation.set(0, 0, 0);

characterModel = model;
window.characterModel = characterModel;

console.log("MODEL DEBUG READY ✅", window.characterModel);

// 🔥 BURAYA EKLE
window.characterModel.traverse((c) => {
  if (c.isBone) {
    console.log("BONE:", c.name);
  }
});
brain = new AnimationBrain(characterModel);


face = new FaceController(characterModel);


if (gltf.animations && gltf.animations.length) {
  mixer = new THREE.AnimationMixer(model);

  gltf.animations.forEach((clip) => {
  const action = mixer.clipAction(clip);

  action.play();

  // 🔥 FACE OVERRIDE FIX
  action.setEffectiveWeight(0.3);
});

  console.log("IDLE ANIMATION PLAYING ✅");
}
  model.traverse((child) => {
    const name = child.name?.toLowerCase() || "";
    if (name.includes("head") || name.includes("face") || name.includes("neck")) {
      head = child;
    }
  });

  camera.position.set(0, 1.5, 5);
  camera.lookAt(0, 1.2, 0);

  controls.target.set(0, 1.2, 0);
  controls.update();

  blinkSystem = new BlinkSystem(characterModel);

  animate();
});

/* =========================
   STATE BRIDGE
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
  if (!characterModel) return;

  const t = clock.getElapsedTime();

  if (blinkSystem) {
    blinkSystem.update(delta, isTalking);
  }

  breathTime += delta * 2;

  // BODY idle
  if (!isTalking) {
    characterModel.position.y = Math.sin(breathTime) * 0.015;
    characterModel.rotation.y = Math.sin(breathTime * 0.5) * 0.03;
  }

  // TARGET
  target.set(
    mouse.x * 0.8,
    1.2 + mouse.y * 0.4,
    1.5
  );

  if (isTalking) {
    target.y += Math.sin(t * 10) * 0.02;
  }

  smoothTarget.lerp(target, 0.12);

 if (head) {

  if (!isTalking) {
    head.lookAt(smoothTarget);
  }

}
  
}

/* =========================
   MAIN LOOP
========================= */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);

  // 🔥 FACE UPDATE
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