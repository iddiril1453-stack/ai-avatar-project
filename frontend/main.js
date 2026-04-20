import * as THREE from './libs/three.module.js'; 
import { GLTFLoader } from './libs/GLTFLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';

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

camera.position.set(0, 1.6, 2.5);

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

  // tüm node isimlerini görmek için (arm / head bulmak için)
  model.traverse((child) => {
    console.log("NODE:", child.name);

    if (
      child.name &&
      child.name.toLowerCase().includes("head")
    ) {
      head = child;
      console.log("HEAD FOUND ✅", child.name);
    }
  });

  /*
    ESKİ:
    model.scale.set(1.5, 1.5, 1.5);
    model.position.set(0, 0, 0);
    model.rotation.y = -1.6;

    wrapper.position.set(0, 0.6, 0);
  */

  // YENİ DAHA DOĞRU AYAR
  // model çok küçük olduğu için büyütüyoruz
  model.scale.set(2.8, 2.8, 2.8);

  // model local pozisyonu
  model.position.set(0, 0, 0);

  // hafif sağa/sola bakış açısı
  model.rotation.y = -1.6;

  wrapper.add(model);

  // modeli ekran merkezine daha iyi almak için
  wrapper.position.set(0, -0.2, 0);

  scene.add(wrapper);

  characterModel = wrapper;

  // kamera hedefi (yüz bölgesine)
  target.set(0, 1.6, 2);

  smoothTarget.copy(target);

  console.log("MODEL READY 🚀");
});

/* =========================
   MOUSE
========================= */

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});
/* =========================
   CHARACTER LOOK
========================= */

function animateCharacter() {
  if (!characterModel || !head) return;

  const t = clock.getElapsedTime();

  target.set(mouse.x * 1.5, 1.2, 2);

  if (isTalking) {
    target.y += Math.sin(t * 10) * 0.02;
  }

  smoothTarget.lerp(target, 0.05);

  head.lookAt(smoothTarget);

  head.rotation.y = Math.PI + Math.sin(t * 0.5) * 0.01;
}

/* =========================
   LOOP
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