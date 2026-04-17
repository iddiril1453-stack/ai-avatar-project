import * as THREE from './libs/three.module.js'; 
import { GLTFLoader } from './libs/GLTFLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';



let blinkTimer = 0;
let isBlinking = false;

let isThinking = false;
let isTalking = false;
let currentEmotion = "neutral";

let head;
let characterModel;

let target = new THREE.Vector3();
let smoothTarget = new THREE.Vector3();

let focusTimer = 0;
let focusOffset = new THREE.Vector3();

let mouse = { x: 0, y: 0 };
let clock = new THREE.Clock();

let emotionBlend = 0;

let mixer;
let actions = {};
let currentAction;

let idleAction;
let waveAction;
let talkTime = 0;


speechSynthesis.onvoiceschanged = () => {
  console.log("SES YÜKLENDİ");
};

function updateFocus(delta) {
  focusTimer -= delta;

  if (focusTimer <= 0) {
    focusTimer = 2 + Math.random() * 3;

    focusOffset.set(
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.1,
      0
    );
  }
}
// MOUSE
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// 🎯 CHARACTER ANIMATION
function animateCharacter() {
  if (!characterModel || !head) return;

  const t = clock.getElapsedTime();

  // 🎯 RESET
  target.set(0, 1.2, 2);

  // 🎯 BASE STATE
  if (isThinking) {
    target.set(0.3, 2.2, 2);
  } else if (isTalking) {
    target.set(0, 1.2, 2);
  } else {
    target.set(mouse.x * 1.5, 1.2, 2);
  }

  // 🎯 IDLE DRIFT
  if (!isTalking && !isThinking) {
    target.x += Math.sin(t * 0.3) * 0.05;
    target.y += Math.cos(t * 0.4) * 0.03;
  }

  // 🎭 EMOTION (SMOOTH)
  if (currentEmotion === "happy") {
    target.y += 0.2 * emotionBlend;
    target.x += Math.sin(t * 2) * 0.1 * emotionBlend;
  }

  if (currentEmotion === "sad") {
    target.y -= 0.3 * emotionBlend;
  }

  if (currentEmotion === "angry") {
    target.x += 0 * emotionBlend;
  }

  // 🔥 TALK SYSTEM (PRO)
  if (isTalking) {
    const speed = 8 + Math.random() * 4;
    const intensity = 0.01 + Math.random() * 0.02;

    target.y += Math.sin(t * speed) * intensity;
    target.x += Math.sin(t * 3) * 0.01;
  }

  // 🔥 FAKE JAW (pozisyon)
  if (isTalking) {
    const jawSpeed = 10 + Math.random() * 5;
    const jaw = Math.sin(t * jawSpeed) * 0.02;

    target.y += jaw;
    target.z -= jaw * 0.5;
  }

  // 🔥 SWAY
  const sway = Math.sin(t * 0.5) * 0.05;
  target.x += sway;

  // 🔥 FOCUS
  target.add(focusOffset);

  // =========================
  // 💣 FAKE LIP SYNC (ASIL OLAY)
  // =========================
  if (isTalking && head) {
    talkTime += 0.25;

    // 🟢 ağız efekti (esneme)
    // 💣 GERÇEKÇİ FAKE LIP (SCALE YOK)
if (isTalking && head) {
  talkTime += 0.25;

  // çene aşağı yukarı
  head.rotation.x = Math.sin(talkTime * 10) * 0.08;

  // mikro sağ sol (doğallık)
  head.rotation.y += Math.sin(talkTime * 6) * 0.02;

} else if (head) {
  // smooth reset
  head.rotation.x *= 0.8;
}

    // 🟢 çene efekti
    head.rotation.x = Math.sin(talkTime * 6) * 0.06;
  } else if (head) {
    // smooth reset
    head.scale.y += (1 - head.scale.y) * 0.1;
    head.rotation.x *= 0.9;
  }


  // 🔥 SMOOTH
  const delay = 0.05;
  smoothTarget.lerp(target, delay);

  // 🔥 MICRO ERROR
  smoothTarget.x += (Math.random() - 0.5) * 0.002;
  smoothTarget.y += (Math.random() - 0.5) * 0.002;

  // 🔥 OVERSHOOT LOOK
  const overshoot = 1.05;
  head.lookAt(
    smoothTarget.x * overshoot,
    smoothTarget.y * overshoot,
    smoothTarget.z * overshoot
  );

  // 🔥 MICRO HEAD MOVE
  head.rotation.x += Math.sin(t * 0.8) * 0.005;
  head.rotation.z += Math.sin(t * 0.6) * 0.005;

  // 🔥 IDLE HEAD
  const idleY = Math.cos(t * 0.5) * 0.01;
  head.rotation.y = Math.PI + idleY;

if (isTalking) {

  // 🧍 body konuşmaya katılıyor (RESETLİ)
  characterModel.rotation.z = Math.sin(t * 1) * 0.001;
  characterModel.rotation.x = Math.sin(t * 3) * 0.01;
  characterModel.position.x = Math.sin(t * 3) * 0.01;

  head.rotation.y += Math.sin(t * 10) * 0.01;
  head.rotation.y += Math.sin(t * 15) * 0.02;
  head.rotation.y += (Math.random() - 0.5) * 0.01;

}

  // 🌬️ BREATH
  
  const breath = Math.sin(t * 1.5) * 0.01 + Math.sin(t * 0.7) * 0.005;
characterModel.position.y = 0.6 + breath; 
}

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// CAMERA
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 2.5);
camera.lookAt(0, 1.2, 0);

// RENDER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.setPixelRatio(1);


document.body.appendChild(renderer.domElement);



// CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.2, 0);
controls.update();

// LIGHT
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));

// MODEL
const loader = new GLTFLoader();
loader.load(
  "model.glb",
  (gltf) => {
    console.log("MODEL LOADED ✅");

    const wrapper = new THREE.Group();
    const model = gltf.scene;

mixer = new THREE.AnimationMixer(model);


console.log("ANIMATIONS:", gltf.animations);

    model.traverse((child) => {
      if (child.name.toLowerCase().includes("head")) {
        head = child;
        console.log("HEAD BULUNDU ✅", head.name);
      }
    });

    model.rotation.y = -1.6;
    model.scale.set(1.5, 1.5, 1.5);
    model.position.set(0, 0, 0);

    wrapper.add(model);
    wrapper.position.set(0, 0.6, 0);

    scene.add(wrapper);

    characterModel = wrapper;

    target.set(0, 1.2, 2);
    smoothTarget.copy(target);
  },
  undefined,
  (error) => {
    console.error("MODEL ERROR ❌", error);
  }
);

// ANIMATE
function animate() {
  requestAnimationFrame(animate);

emotionBlend += (1 - emotionBlend) * 0.03;

const delta = clock.getDelta();


updateFocus(delta);

  animateCharacter();

  renderer.render(scene, camera);
}
function speak(text) {
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "tr-TR";

  const voices = speechSynthesis.getVoices();
  const turkishVoice = voices.find(v => v.lang.includes("tr"));

  if (turkishVoice) {
    utterance.voice = turkishVoice;
  }

  utterance.onstart = () => {
    console.log("🔊 konuşma başladı");
    isTalking = true;
    isThinking = false;

    // 💥 MIC DURDUR (EN KRİTİK)
    if (recognition) {
      try { recognition.stop(); } catch(e){}
    }
  };

  utterance.onend = () => {
    console.log("🔇 konuşma bitti");
    isTalking = false;
  };

  // 💥 gecikme fix
  setTimeout(() => {
    speechSynthesis.speak(utterance);
  }, 300);
}

// FAKE BLINK TIMER

// CHATconsole.log("SEND MESSAGE ÇALIŞTI");

async function sendMessage() {
  console.log("🚀 SEND MESSAGE GİRDİ"); // BURAYA

  const input = document.getElementById("userInput");
  const text = input.value;

  if (!text) return;

  isThinking = true;

  try {
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

console.log("BACKEND DATA:", data); // 👈 BURAYA

console.log("RAW DATA:", data);

    currentEmotion = data.emotion || "neutral";

    // 🔥 YENİ SİSTEM
    isThinking = false;
    speak(data.reply);

  } catch (err) {
    console.error("HATA:", err);
  }

  input.value = "";
}
// 🎤 VOICE RECOGNITION
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;



if (SpeechRecognition) {
  recognition = new SpeechRecognition();

  recognition.lang = "tr-TR";
 recognition.continuous = false;
recognition.interimResults = false;
recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    console.log("🎤 Dinleniyor...");
    isThinking = true;
  };

 recognition.onresult = (event) => {
  const text = event.results[0][0].transcript;
  console.log("🗣️ Sen:", text);

  if (!text || text.trim().length < 2) {
    console.log("⚠️ boş veri");
    return;
  }

  recognition.stop(); // 💥 ŞART

  document.getElementById("userInput").value = text;

  setTimeout(() => {
    sendMessage();
  }, 200);
};

  recognition.onerror = (e) => {
    console.error("🎤 Hata:", e);
    isThinking = false;
  };

  recognition.onend = () => {
    console.log("🎤 Bitti");
  };

} else {
  console.warn("🚫 Mikrofon desteklenmiyor (Firefox)");
}
animate();
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("sendBtn");
  const input = document.getElementById("userInput");

  const micBtn = document.getElementById("micBtn");

if (micBtn && recognition) {
  micBtn.addEventListener("click", () => {
  try {
    recognition.abort(); // 💥 reset
    recognition.start();
  } catch (e) {
    console.log("mic reset");
  }
});
}

  if (btn && input) {
    btn.addEventListener("click", sendMessage);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    speechSynthesis.resume();
  }
});