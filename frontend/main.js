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
const clock = new THREE.Clock();

const behavior = new AvatarBehaviorEngine();

/* ========================= SCENE */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);
scene.fog = new THREE.Fog(0x222222, 10, 50);

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
document.body.appendChild(renderer.domElement);

/* ========================= CONTROLS */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

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

console.log("MODEL LOAD START 🚀");

loader.load(
  "./model.glb",
  (gltf) => {

    console.log("MODEL LOADED ✅");

    const model = gltf.scene;

    characterModel = model;
    scene.add(model);

    /* HEAD FIND */
    model.traverse((obj) => {
      if (obj.isBone && obj.name.toLowerCase().includes("head")) {
        head = obj;
        console.log("HEAD FOUND ✅", obj.name);
      }
    });

    /* MIXER */
    mixer = new THREE.AnimationMixer(model);

    if (gltf.animations?.length) {

      const idleClip =
        gltf.animations.find(a =>
          a.name.toLowerCase().includes("idle")
        ) || gltf.animations[0];

      const action = mixer.clipAction(idleClip);
      action.play();
    }

    /* SYSTEMS */
    face = new FaceController(model);
    blinkSystem = new BlinkSystem(model);

    try {
      brain = new AnimationBrain(model, head || null);

      
    } catch (err) {
      console.error("BRAIN ERROR ❌", err);
      brain = null;
    }

    /* SCALE */
    model.scale.set(0.13, 0.13, 0.13);

    camera.position.set(0, 1.5, 3);
    controls.target.set(0, 1, 0);
    controls.update();

    console.log("MODEL READY ✅");
  }
);

/* ========================= ANIMATE */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);
  if (face) face.update(delta);
  if (blinkSystem) blinkSystem.update(delta, avatarState === "talking");

if (brain) {
  if (brain.state !== avatarState) {
    brain.setState(avatarState);
  }

  brain.update(delta, mouse);
}



  /* BREATH */
  if (characterModel && avatarState === "idle") {
    breathTime += delta * 2;
    if (!characterModel.baseY) {
  characterModel.baseY = characterModel.position.y;
}

characterModel.position.y =
  characterModel.baseY + Math.sin(breathTime) * 0.015;
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
  if (brain) brain.setState(state);
}

/* ========================= CORE CHAT */
async function sendMessageCore(text) {

  setState("thinking");

  try {
    const res = await fetch("https://ai-avatar-project-d2r9.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: localStorage.getItem("uid"),
        message: text
      })
    });

    const data = await res.json();

 if (data.state) {
  setState(data.state);
}

if (data.reply) {
  speak(data.reply);
}
  


  } catch (err) {
    console.error(err);
    setState("idle");
  }
}

/* KEYBOARD */
async function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input?.value;
  if (!text) return;

  input.value = "";
  sendMessageCore(text);
}

/* VOICE */
function sendMessageFromVoice(text) {
  sendMessageCore(text);
}

/* ========================= SPEAK */
async function speak(text) {

  try {

    setState("talking");

    // 🔥 eski browser seslerini kapat
speechSynthesis.cancel();

    const res = await fetch(
      "https://ai-avatar-project-d2r9.onrender.com/tts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      }
    );

    const blob = await res.blob();

    const audioUrl = URL.createObjectURL(blob);
// 🔥 önceki audio varsa durdur
if (currentAudio) {
  currentAudio.pause();
  currentAudio = null;
}

const audio = new Audio(audioUrl);

currentAudio = audio;

audio.play();

  } catch (err) {

    console.error("TTS ERROR ❌", err);

    setState("idle");
  }
}

/* ========================= MIC */
async function startMic() {

  if (isRecording) return;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

  mediaRecorder.start();
  isRecording = true;

  setState("listening");
}

function stopMic() {

  if (!mediaRecorder || !isRecording) return;

  mediaRecorder.onstop = async () => {

    const blob = new Blob(audioChunks, { type: "audio/webm" });

    const formData = new FormData();
    formData.append("file", blob, "audio.webm");

    try {
      const res = await fetch("https://ai-avatar-project-d2r9.onrender.com/whisper", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (data.text) sendMessageFromVoice(data.text);

    } catch (err) {
      console.error(err);
      setState("idle");
    }

    audioChunks = [];
  };

  mediaRecorder.stop();
  isRecording = false;
}

/* ========================= UI */
window.addEventListener("DOMContentLoaded", () => {

  if (!localStorage.getItem("uid")) {
    localStorage.setItem("uid", "user_" + Math.random().toString(36).substr(2, 9));
  }

  const sendBtn = document.getElementById("sendBtn");
  const input = document.getElementById("userInput");

  sendBtn?.addEventListener("click", sendMessage);
  input?.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();

// 🎯 AUTO GREETING
setTimeout(() => {

  speak(
    "Merhaba. Todicar'a hoş geldiniz. Size araç seçimi konusunda yardımcı olabilirim."
  );

}, 1500);

  });

  const micBtn = document.createElement("button");
  micBtn.innerText = "🎤 Hold";

  Object.assign(micBtn.style, {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    padding: "12px",
    background: "#ff4444",
    color: "#fff",
    borderRadius: "10px",
    border: "none",
    zIndex: 9999
  });

  document.body.appendChild(micBtn);

  micBtn.addEventListener("mousedown", startMic);
  micBtn.addEventListener("mouseup", stopMic);
  micBtn.addEventListener("touchstart", startMic);
  micBtn.addEventListener("touchend", stopMic);
  
});