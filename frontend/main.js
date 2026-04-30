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
scene.add(testCube);

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
/*controls.enableRotate = true;
controls.enablePan = false;
controls.enableZoom = true;*/
controls.enableDamping = true;
controls.dampingFactor = 0.08;

/* ========================= LIGHT */
scene.add(new THREE.AmbientLight(0xffffff, 1.5));

const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

/* ========================= MOUSE */
window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

/* ========================= LOAD MODEL */
const loader = new GLTFLoader();

loader.load(
  "./model.glb?v=" + Date.now(),

  (gltf) => {

    console.log("MODEL LOADED ✅");

    const model = gltf.scene;
    characterModel = model;

    scene.add(model);

    scene.add(model);
model.position.set(0, 0, 0);
model.scale.setScalar(1);
console.log("CHILD COUNT:", model.children.length);
console.log("MODEL:", model);


model.traverse((c) => {
  console.log("NODE:", c.type, c.name);
});

    model.scale.setScalar(0.15);

    /* SAFE CENTERING */
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    model.position.sub(center);

    /* DEBUG */
    const helper = new THREE.BoxHelper(model, 0xff0000);
    scene.add(helper);

    /* MATERIAL FIX */
    model.traverse((child) => {
      if (child.isMesh) {

        child.frustumCulled = false;
        child.castShadow = true;
        child.receiveShadow = true;
        child.visible = true;

        if (child.material) {
          child.material.needsUpdate = true;
          child.material.transparent = false;
          child.material.opacity = 1;
        }
      }
    });

    /* CAMERA FIT */
    const maxDim = Math.max(size.x, size.y, size.z);
    const orbitCenter = new THREE.Vector3(0, 0, 0);

const fitDistance = maxDim * 1.2;

camera.position.set(0, 1.4, fitDistance);
controls.target.set(0, 1.2, 0);


   controls.minDistance = 1;
controls.maxDistance = fitDistance * 3;
controls.update();

    blinkSystem = new BlinkSystem(characterModel);

    console.log("MODEL READY ✅");
  },

  (xhr) => {
    console.log("LOADING:", (xhr.loaded / xhr.total * 100).toFixed(2) + "%");
  },

  (error) => {
    console.error("❌ MODEL LOAD ERROR:", error);
  }
);

/* ========================= ANIMATE */
function animate() {

  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);
  if (face) face.update(delta);
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

});