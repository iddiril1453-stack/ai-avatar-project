import * as THREE from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { AnimationBrain } from './animation/animationBrain.js';
import { BlinkSystem } from './animation/blinkSystem.js';
import { AvatarBehaviorEngine } from "./avatarBehaviorEngine.js";

/* =========================
   CORE STATE
========================= */
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
let mixer;

let breathTime = 0;

console.log("TEST CHANGE");
/* =========================
   BEHAVIOR ENGINE
========================= */
const behavior = new AvatarBehaviorEngine();

/* =========================
   MOUSE TRACKING
========================= */
window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

/* =========================
   SCENE
========================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

/* CAMERA */
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 1.5, 3.2);
camera.lookAt(0, 1.4, 0);

/* RENDERER */
const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* LIGHT */
const hemiLight = new THREE.HemisphereLight(
  0xffffff,
  0x444444,
  2
);

scene.add(hemiLight);

/* CONTROLS */
const controls = new OrbitControls(
  camera,
  renderer.domElement
);

controls.target.set(0, 1.2, 0);
controls.update();

/* =========================
   MODEL LOAD
========================= */
const loader = new GLTFLoader();

loader.load("./model.glb?v=99", (gltf) => {
  const wrapper = new THREE.Group();
  const model = gltf.scene;

  let head = null;

  /* =========================
     NODE DETECTION
  ========================= */
  model.traverse((child) => {
    const name = child.name?.toLowerCase() || "";

    console.log("NODE:", child.name);

    // HEAD DETECTION
    if (
      name.includes("head") ||
      name.includes("face") ||
      name.includes("neck")
    ) {
      head = child;
      console.log("HEAD FOUND:", child.name);
    }

    // ARM FIX
    if (name.includes("arm")) {
      child.rotation.z = -0.3;
    }
  });

  /* =========================
     MODEL TRANSFORM (FIXED)
  ========================= */

  model.scale.set(2.1, 2.1, 2.1);

  // 🔥 CRITICAL FIX: model orientation
  // (kafa arkaya bakma sorunu burada çözülür)
  model.rotation.set(0, Math.PI, 0);

  /* =========================
     WRAPPER SETUP
  ========================= */

  wrapper.add(model);
  wrapper.position.set(0, 0.4, 0);

  // ❌ wrapper rotation KULLANMIYORUZ (çakışma sebebi)
  wrapper.rotation.set(0, 0, 0);

  scene.add(wrapper);

  /* =========================
     GLOBAL REFERENCE
  ========================= */

  characterModel = model;

  console.log("CHARACTER MODEL:", characterModel);
  console.log("HEAD:", head);

  /* =========================
     AI SYSTEMS
  ========================= */

  brain = new AnimationBrain(characterModel);
  blinkSystem = new BlinkSystem(characterModel);

  /* =========================
     ANIMATION MIXER
  ========================= */

  if (gltf.animations && gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);

    const idleAction = mixer.clipAction(gltf.animations[0]);
    idleAction.play();

    console.log("IDLE ANIMATION STARTED ✅");
  } else {
    console.log("NO EMBEDDED ANIMATION FOUND ❌");
  }

  /* =========================
     CAMERA TARGET
  ========================= */

  target.set(0, 1.6, 2);
  smoothTarget.copy(target);

  animate();
});

/* =========================
   STATE BRIDGE
========================= */
behavior.bind({
  onStateChange: (state, intensity) => {
    if (brain) {
      brain.setState(state, intensity);
    }

    isTalking = state === "talking";
    isThinking = state === "thinking";
  }
});

/* =========================
   SAFE STATE SETTER
========================= */
function setState(state) {
  if (behavior) {
    behavior.setState(state);
  }

  isTalking = state === "talking";
  isThinking = state === "thinking";
}

/* =========================
   CHARACTER UPDATE
========================= */
function animateCharacter(delta) {
  if (!characterModel || !brain) return;

  const t = clock.getElapsedTime();

  /* DEBUG TEST:
     model kesin hareket etmeli
  */
  characterModel.rotation.y += 0.002;

  /* BRAIN UPDATE */
  brain.update(
    delta,
    mouse,
    behavior.state === "talking"
  );

  /* BLINK */
  if (blinkSystem) {
    blinkSystem.update(delta, isTalking);
  }

  /* BREATHING */
  breathTime += delta * 2;

  if (!isTalking) {
    const breath =
      Math.sin(breathTime) * 0.003;

    characterModel.position.y = breath;

    /* IDLE MICRO MOTION */
    characterModel.rotation.x =
      Math.sin(t * 0.5) * 0.002;
  }

  /* LOOK TARGET */
  target.set(
    mouse.x * 1.5,
    1.6 + mouse.y * 0.5,
    2
  );

  if (isTalking) {
    target.y +=
      Math.sin(t * 10) * 0.02;
  }

  smoothTarget.lerp(target, 0.05);

  /* HEAD LOOK */
  if (head) {
    head.lookAt(smoothTarget);
  }
}

/* =========================
   MAIN LOOP
========================= */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  /* 🔥 CRITICAL FIX
     animation clip frame update
  */
  if (mixer) {
    mixer.update(delta);
  }

  animateCharacter(delta);

  renderer.render(scene, camera);
}

/* =========================
   CHAT API
========================= */
async function sendMessage() {
  const input =
    document.getElementById("userInput");

  const text = input.value;

  if (!text) return;

  setState("thinking");

  try {
    const res = await fetch(
      "https://ai-avatar-project-d2r9.onrender.com/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text
        })
      }
    );

    const raw = await res.text();
    const data = JSON.parse(raw);

    console.log("BACKEND:", data);

    setState("idle");

    if (data.reply) {
      speak(data.reply);
    }

  } catch (err) {
    console.error(
      "SEND ERROR:",
      err
    );

    setState("idle");
  }

  input.value = "";
}

/* =========================
   SPEAK
========================= */
async function speak(text) {
  try {
    const res = await fetch(
      "https://ai-avatar-project-d2r9.onrender.com/tts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text
        })
      }
    );

    if (!res.ok) {
      console.error(
        "TTS ERROR STATUS:",
        res.status
      );
      return;
    }

    const blob = await res.blob();
    const url =
      URL.createObjectURL(blob);

    const audio = new Audio(url);

    audio.onplay = () => {
      setState("talking");
    };

    audio.onended = () => {
      setState("idle");
    };

    audio.play();

  } catch (err) {
    console.error(
      "TTS ERROR:",
      err
    );
  }
}

/* =========================
   UI EVENTS
========================= */
window.addEventListener(
  "DOMContentLoaded",
  () => {
    const btn =
      document.getElementById("sendBtn");

    const input =
      document.getElementById("userInput");

    if (btn && input) {
      btn.addEventListener(
        "click",
        sendMessage
      );

      input.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Enter") {
            sendMessage();
          }
        }
      );
    }
  }
);