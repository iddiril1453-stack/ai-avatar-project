import * as THREE from './libs/three.module.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { AnimationBrain } from './animation/animationBrain.js';
import { BlinkSystem } from './animation/blinkSystem.js';
import { AvatarBehaviorEngine } from "./avatarBehaviorEngine.js";
import { FaceController } from "./animation/FaceController.js";
import { GLTFLoader } from './libs/GLTFLoader.js';

/* ========================= */
let face;
let head = null;
let characterModel;

let brain;
let blinkSystem;
let mixer;

let isTalking = false;
let isThinking = false;

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

let breathTime = 0;
let currentAudio = null;

const mouse = { x: 0, y: 0 };
const target = new THREE.Vector3();
const smoothTarget = new THREE.Vector3();
const clock = new THREE.Clock();

const behavior = new AvatarBehaviorEngine();

/* ========================= SCENE */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);
scene.fog = new THREE.Fog(0x222222, 10, 50);

/* DEBUG CUBE */
const testCube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);

/* ========================= CAMERA */
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

/* ========================= RENDERER */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x222222, 1);
document.body.appendChild(renderer.domElement);

/* ========================= CONTROLS */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableRotate = true;
controls.enablePan = false;
controls.enableZoom = true;
controls.enableDamping = true;
controls.dampingFactor = 0.08;

/* ========================= LIGHT */
scene.add(new THREE.AmbientLight(0xffffff, 2));

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(5, 10, 5);
scene.add(light);

/* ========================= MOUSE */
window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

/* ========================= LOAD MODEL */
const loader = new GLTFLoader();



loader.load(
  "./model.glb",


  (gltf) => {

    console.log("MODEL LOADED ✅");

    const model = gltf.scene;

    console.log("ANIMATIONS:", gltf.animations);

    // 🔥 BUNU EKLE (ÇOK ÖNEMLİ)
    characterModel = model;

    scene.add(model);

    /* =========================
   ANIMATION MIXER (IDLE FIX)
========================= */
mixer = new THREE.AnimationMixer(model);

if (gltf.animations && gltf.animations.length > 0) {

  const idleClip =
    gltf.animations.find(a =>
      a.name.toLowerCase().includes("idle")
    ) || gltf.animations[0];

  const action = mixer.clipAction(idleClip);

  action.reset();
  action.play();
  action.setLoop(THREE.LoopRepeat);
  action.enabled = true;

  console.log("IDLE SELECTED:", idleClip.name);

} else {
  console.warn("NO ANIMATIONS FOUND ❌");
}

console.log("ANIM COUNT:", gltf.animations.length);
console.log("ANIM NAMES:", gltf.animations.map(a => a.name));

/* =========================
   FACE + BLINK INIT
========================= */
face = new FaceController(model);
blinkSystem = new BlinkSystem(model);

console.log("FACE + BLINK READY ✅");

/* =========================
   BRAIN SYSTEM INIT
========================= */
brain = new AnimationBrain(model);

console.log("BRAIN READY ✅");

    // 🔥 SCALE (DEV OLMASIN)
    model.scale.set(0.13, 0.13, 0.13);

    // 🔥 ORTAYA AL
    model.position.set(0, 0, 0);

    // 🔥 KAMERA
    camera.position.set(0, 1.5, 3);

    // 🔥 ORBİT TARGET
    controls.target.set(0, 1, 0);
    controls.update();

    console.log("MODEL READY ✅");
  },

  undefined,

  (error) => {
    console.error("MODEL LOAD ERROR ❌", error);
  }
);

/* ========================= ANIMATE */
function animate() {

  requestAnimationFrame(animate);

  const delta = clock.getDelta();

if (mixer) {
  mixer.update(delta);
}

  if (face) face.update(delta);
if (blinkSystem) blinkSystem.update(delta, isTalking);
if (brain) brain.update(delta, isTalking, isThinking);

  if (characterModel && blinkSystem) {
    blinkSystem.update(delta, isTalking);
    breathTime += delta * 2;

    if (!isTalking) {
      characterModel.position.y = Math.sin(breathTime) * 0.015;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

/* ========================= STATE */
function setState(state) {
  behavior.setState(state);
  isTalking = state === "talking";
  isThinking = state === "thinking";
}

/* ========================= SEND MESSAGE (FIXED GLOBAL) */
async function sendMessage() {

  const input = document.getElementById("userInput");
  const text = input?.value;

  if (!text) return;

  input.value = "";

  setState("thinking");

  try {
    const res = await fetch("https://ai-avatar-project-d2r9.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    if (data.reply) {
      speak(data.reply);
    }

  } catch (err) {
    console.error(err);
    setState("idle");
  }
}

/* ========================= SPEAK (SAFE PLACEHOLDER) */
async function speak(text) {
  console.log("SPEAK:", text);
  setState("talking");
}

/* ========================= UI */
window.addEventListener("DOMContentLoaded", () => {

  document.getElementById("sendBtn")?.addEventListener("click", sendMessage);

  document.getElementById("userInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "r") startMic();
    if (e.key === "s") stopMic();
  });

});
async function startMic() {

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  mediaRecorder = new MediaRecorder(stream);

  audioChunks = [];

  mediaRecorder.ondataavailable = (e) => {
    audioChunks.push(e.data);
  };

  mediaRecorder.onstop = async () => {

    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

    console.log("AUDIO CAPTURED 🎤", audioBlob);

    // 👉 şimdilik sadece log (sonraki adım backend)
  };

  mediaRecorder.start();
  isRecording = true;

  console.log("MIC STARTED 🎤");
}
function stopMic() {

  if (!mediaRecorder) return;

  mediaRecorder.stop();
  isRecording = false;

  console.log("MIC STOPPED 🛑");
}