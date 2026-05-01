import * as THREE from './libs/three.module.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { AnimationBrain } from './animation/animationBrain.js';
import { BlinkSystem } from './animation/blinkSystem.js';
import { AvatarBehaviorEngine } from "./avatarBehaviorEngine.js";
import { FaceController } from "./animation/FaceController.js";
import { GLTFLoader } from './libs/GLTFLoader.js';

/* ========================= STATE */
let face, head = null, characterModel;
let brain, blinkSystem, mixer;
let avatarState = "idle";

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

let breathTime = 0;
const clock = new THREE.Clock();
const behavior = new AvatarBehaviorEngine();

/* ========================= SCENE */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);
scene.fog = new THREE.Fog(0x222222, 10, 50);

/* ========================= CAMERA */
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 3);

/* ========================= RENDERER */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* ========================= CONTROLS */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* ========================= LIGHT */
scene.add(new THREE.AmbientLight(0xffffff, 2));

/* ========================= LOAD MODEL */
const loader = new GLTFLoader();

loader.load("./model.glb", (gltf) => {

  const model = gltf.scene;
  characterModel = model;
  scene.add(model);

  model.traverse(o => {
    if (o.isBone && o.name.toLowerCase().includes("head")) {
      head = o;
    }
  });

  mixer = new THREE.AnimationMixer(model);

  if (gltf.animations.length) {
    const idle = gltf.animations[0];
    mixer.clipAction(idle).play();
  }

  face = new FaceController(model);
  blinkSystem = new BlinkSystem(model);
  brain = new AnimationBrain(model);

  model.scale.set(0.13, 0.13, 0.13);

});

/* ========================= ANIMATE */
function animate() {

  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  mixer?.update(delta);
  face?.update(delta);
  blinkSystem?.update(delta, avatarState === "talking");
  brain?.update(delta, avatarState === "talking", avatarState === "thinking");

  if (head) {
    if (avatarState === "talking") {
      const t = performance.now() * 0.003;
      head.rotation.y = Math.sin(t) * 0.4;
    }
  }

  if (characterModel && avatarState === "idle") {
    breathTime += delta * 2;
    characterModel.position.y = Math.sin(breathTime) * 0.015;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

/* ========================= STATE */
function setState(s) {
  avatarState = s;
  behavior.setState(s);
}

/* ========================= CHAT */
async function sendMessage(text) {

  setState("thinking");

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  });

  const data = await res.json();

  if (data.reply) speak(data.reply);
}

/* ========================= SPEAK */
function speak(text) {

  setState("talking");

  const u = new SpeechSynthesisUtterance(text);

  u.onend = () => setState("idle");

  speechSynthesis.speak(u);
}

/* ========================= MIC */
async function startMic() {

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

  mediaRecorder.start();
  isRecording = true;

  setState("listening");
}

function stopMic() {

  mediaRecorder.onstop = async () => {

    const blob = new Blob(audioChunks, { type: "audio/webm" });

    const form = new FormData();
    form.append("file", blob, "audio.webm");

    const res = await fetch("/whisper", {
      method: "POST",
      body: form
    });

    const data = await res.json();

    if (data.text) {
      sendMessage(data.text);
    } else {
      setState("idle");
    }
  };

  mediaRecorder.stop();
  isRecording = false;
}

/* ========================= UI */
window.addEventListener("DOMContentLoaded", () => {

  const btn = document.createElement("button");
  btn.innerText = "🎤";

  btn.onmousedown = startMic;
  btn.onmouseup = stopMic;

  document.body.appendChild(btn);

});