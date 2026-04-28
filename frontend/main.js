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
scene.add(new THREE.AxesHelper(5));


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

controls.enablePan = false;
controls.maxPolarAngle = Math.PI * 0.55;
controls.minPolarAngle = Math.PI * 0.35;


const dist = Math.max(size.x, size.y, size.z) * 2.5;

// 🔥 SINGLE ORBIT CENTER FIX
const orbitCenter = new THREE.Vector3(0, size.y * 0.5, 0);

camera.position.set(0, orbitCenter.y + dist * 0.2, dist);

controls.target.copy(orbitCenter);
controls.update();

camera.lookAt(orbitCenter);


const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
scene.add(hemiLight);
controls.enablePan = false;
controls.enableZoom = true;

controls.minPolarAngle = 0.4;
controls.maxPolarAngle = 2.6;

controls.minDistance = 2;
controls.maxDistance = 8;

controls.screenSpacePanning = false;
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

  // =========================
  // ROOT FIX (DOĞRU VERSION)
  // =========================
  const wrapper = new THREE.Group();
  const anchor = new THREE.Object3D();

  scene.add(anchor);
  anchor.add(wrapper);
  wrapper.add(model);

  // =========================
  // SCALE
  // =========================
  model.scale.setScalar(0.01);

  model.updateWorldMatrix(true, true);

  // =========================
  // BBOX
  // =========================
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  model.position.sub(center);
  model.position.y = -size.y * 0.5;

  model.rotation.set(0, 0, 0);

  characterModel = model;

  // =========================
  // SYSTEM INIT
  // =========================
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

  // =========================
  // CAMERA FIX (TEK MERKEZ)
  // =========================

  const maxDim = Math.max(size.x, size.y, size.z);
  const centerWorld = new THREE.Vector3(0, size.y * 0.5, 0);

  const dist = maxDim * 2.5;

  camera.position.set(
    0,
    centerWorld.y + maxDim * 0.25,
    dist
  );

  controls.target.copy(centerWorld);

  camera.lookAt(centerWorld);

  controls.update();

  // =========================
  // ORBIT LOCK (STABLE)
  // =========================
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.screenSpacePanning = false;

  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = Math.PI - 0.3;

  controls.minDistance = maxDim * 1.2;
  controls.maxDistance = maxDim * 3.5;

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

  if (!isTalking) {
    characterModel.position.y = -0.3 + Math.sin(breathTime) * 0.015;
    characterModel.rotation.y = Math.sin(breathTime * 0.5) * 0.03;
  }

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
      const temp = smoothTarget.clone();
      head.parent.worldToLocal(temp);
      head.lookAt(temp.clone().lerp(head.position, 0.5));
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