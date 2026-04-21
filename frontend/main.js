import * as THREE from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { AnimationBrain } from './animation/animationBrain.js';
import { BlinkSystem } from './animation/blinkSystem.js';

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

/* SCENE */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 3.2);
camera.lookAt(0, 1.4, 0);

/* RENDERER */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* LIGHT */
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));

/* CONTROLS */
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.2, 0);
controls.update();

/* MODEL */
const loader = new GLTFLoader();

loader.load('./model.glb', (gltf) => {

  const wrapper = new THREE.Group();
  const model = gltf.scene;

  model.traverse((child) => {
    const name = child.name?.toLowerCase() || "";

    if (name.includes("head")) {
      head = child;
    }

    if (name.includes("arm")) {
      child.rotation.z = -0.3;
    }
  });

  model.scale.set(2.1, 2.1, 2.1);
  model.rotation.y = -Math.PI / 2;

  wrapper.add(model);
  wrapper.position.set(0, 0.4, 0);

  scene.add(wrapper);

  characterModel = wrapper;

  brain = new AnimationBrain(characterModel);
  blinkSystem = new BlinkSystem(characterModel);

  target.set(0, 1.6, 2);
  smoothTarget.copy(target);

  animate();
});

/* CHARACTER LOGIC */
function animateCharacter(delta) {
  if (!characterModel || !head || !brain) return;

  brain.update(delta, mouse, isTalking);

  const t = clock.getElapsedTime();

  target.set(mouse.x * 1.5, 1.6 + mouse.y * 0.5, 2);

  if (isTalking) {
    target.y += Math.sin(t * 10) * 0.02;
  }

  smoothTarget.lerp(target, 0.05);

  head.lookAt(smoothTarget);
}

/* MAIN LOOP */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  animateCharacter(delta);

  if (blinkSystem) {
    blinkSystem.update(delta);
  }

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

    // 🔥 DEBUG: STATUS
    console.log("STATUS:", res.status);

    // 🔥 DEBUG: RAW RESPONSE
    const raw = await res.text();
    console.log("RAW RESPONSE:", raw);

    // JSON parse (safe)
    const data = JSON.parse(raw);

    console.log("BACKEND:", data);

    isThinking = false;

    if (data.reply) {
      speak(data.reply);
    }

  } catch (err) {
    console.error("SEND ERROR:", err);
  }

  input.value = "";
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