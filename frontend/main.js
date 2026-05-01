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
let avatarState = "idle";

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
   FIND HEAD BONE
========================= */
model.traverse((obj) => {
  if (obj.isBone) {
    if (obj.name.toLowerCase().includes("head")) {
      head = obj;
      console.log("HEAD FOUND ✅", obj.name);
    }
  }
});

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
action.setLoop(THREE.LoopRepeat);
action.enabled = true;
action.play();

mixer._idleAction = action; // 🔥 EKLE

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

  if (mixer) mixer.update(delta);

  if (face) face.update(delta);
  if (blinkSystem) blinkSystem.update(delta, avatarState === "talking");
  if (brain) brain.update(delta, mouse, isTalking, isThinking, avatarState === "listening");

  /* =========================
     HEAD MOTION (SADE VE STABİL)
  ========================= */
 /* =========================
   HEAD MOTION (SADE VE STABİL)
========================= */
if (head) {

  if (avatarState === "listening") {
    head.rotation.y = Math.sin(performance.now() * 0.01) * 0.15;
  }

  else if (avatarState === "talking") {

    const t = performance.now() * 0.003;

    head.rotation.y = Math.sin(t) * 0.4;
    head.rotation.x = Math.sin(t * 1.2) * 0.2;

  } else {

    head.rotation.y *= 0.9;
    head.rotation.x *= 0.9;
  }
}
  /* =========================
     BREATH (SADECE IDLE)
  ========================= */
  if (characterModel && avatarState === "idle") {

    breathTime += delta * 2;
    characterModel.position.y = Math.sin(breathTime) * 0.015;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
/* ========================= STATE */
function setState(state) {

  avatarState = state;

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

function sendMessageFromVoice(text) {

  console.log("VOICE TEXT:", text);

  setState("thinking");

  fetch("https://ai-avatar-project-d2r9.onrender.com/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  })
  .then(r => r.json())
  .then(data => {
    if (data.reply) speak(data.reply);
  });
}

/* ========================= SPEAK (SAFE PLACEHOLDER) */
async function speak(text) {

  console.log("SPEAK:", text);

  setState("talking");

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "tr-TR";
  utterance.rate = 1;
  utterance.pitch = 1;

  utterance.onstart = () => {
    setState("talking");
  };

  utterance.onend = () => {
    setState("idle");
  };

  speechSynthesis.speak(utterance);
}
async function startMic() {

  if (isRecording) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      audioChunks.push(e.data);
    };

    mediaRecorder.start();
    isRecording = true;

    console.log("MIC STARTED 🎤");

    setState("listening"); // 🔥 animasyon

  } catch (err) {
    console.error("MIC ERROR ❌", err);
  }
}

function stopMic() {

  if (!mediaRecorder || !isRecording) return;

  mediaRecorder.onstop = async () => {

   const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

   formData.append("file", audioBlob, "recording.webm");

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");

    try {
      const res = await fetch("https://ai-avatar-project-d2r9.onrender.com/whisper", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      console.log("WHISPER:", data);
console.log("WHISPER:", data);

if (data.text) {
  sendMessageFromVoice(data.text);
} else {
  setState("idle");
}
      

    } catch (err) {
      console.error("WHISPER ERROR ❌", err);
      setState("idle");
    }

    audioChunks = [];
  };

  mediaRecorder.stop();
  isRecording = false;

  console.log("MIC STOPPED 🛑");
}

/* =========================
   UI INIT (CRITICAL)
========================= */
window.addEventListener("DOMContentLoaded", () => {

  console.log("UI READY ✅");

  const sendBtn = document.getElementById("sendBtn");
  const input = document.getElementById("userInput");

  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
  } else {
    console.warn("sendBtn NOT FOUND ❌");
  }

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  } else {
    console.warn("input NOT FOUND ❌");
  }

  /* =========================
     MIC BUTTON
  ========================= */
  const micBtn = document.createElement("button");
  micBtn.innerText = "🎤 Hold to Talk";

  micBtn.style.position = "absolute";
  micBtn.style.bottom = "20px";
  micBtn.style.right = "20px";
  micBtn.style.padding = "12px 16px";
  micBtn.style.borderRadius = "10px";
  micBtn.style.border = "none";
  micBtn.style.background = "#ff4444";
  micBtn.style.color = "#fff";
  micBtn.style.zIndex = 9999;
  micBtn.style.cursor = "pointer";

  document.body.appendChild(micBtn);

  console.log("MIC BUTTON ADDED ✅");

  const start = (e) => {
    e.preventDefault();
    startMic();
  };

  const stop = (e) => {
    e.preventDefault();
    stopMic();
  };

  micBtn.addEventListener("mousedown", start);
  micBtn.addEventListener("mouseup", stop);
  micBtn.addEventListener("mouseleave", stop);

  micBtn.addEventListener("touchstart", start);
  micBtn.addEventListener("touchend", stop);

});