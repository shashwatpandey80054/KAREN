let userName = localStorage.getItem("userName");
let voiceEnabled = true; // ✅ Main fix
let isListening = false; // prevent double starts
let streaming = false;
let videoEl = null;
let canvasEl = null;
let overlayCtx = null;
let streamTrackInterval = null;

// Load greeting and sync voice button state
window.addEventListener("DOMContentLoaded", function () {
  const voiceBtn = document.getElementById("voiceBtn");
  if (voiceBtn && voiceEnabled) voiceBtn.classList.add("active");

  if (!userName) {
    botRespond("Hello! What should I call you?");
  } else {
    botRespond(`Welcome back, ${userName}!`);
  }
});

// Ensure audio gets unlocked when the camera open button is clicked
window.addEventListener("DOMContentLoaded", () => {
  const openBtn =
    document.getElementById("openCamBtn") ||
    document.querySelector('button[onclick="openCameraAndDetect()"]');
  const alarmSound = document.getElementById("alarmSound");
  if (openBtn && alarmSound) {
    openBtn.addEventListener("click", () => {
      alarmSound.play()
        .then(() => {
          alarmSound.pause();
          alarmSound.currentTime = 0;
          console.log("✅ Audio unlocked");
        })
        .catch((err) => console.log(err));
    });
  }
});

// Handle send message
function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (message === "") return;

  addUserMessage(message);
  input.value = "";
  handleMessage(message);
}

// Show user message
function addUserMessage(text) {
  const chatBox = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = "message user";
  div.innerHTML = text;
  chatBox.appendChild(div);
}

// Show bot message + voice
function botRespond(text) {
  const chatBox = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = "message bot";
  div.innerHTML = text;
  chatBox.appendChild(div);

  chatBox.scrollTop = chatBox.scrollHeight;
  botSpeakIfEnabled(text);
}

// Message Logic ✅
async function handleMessage(message) {
  const lowerMsg = message.toLowerCase();

  // Set Name
  if (!userName) {
    userName = message;
    localStorage.setItem("userName", userName);
    botRespond(`Nice to meet you, ${userName}!`);
    return;
  }

  // Math checks (added)
  const mathResp = checkMath(message);
  if (mathResp) {
    botRespond(mathResp);
    return;
  }

  // NEWS command (added)
  if (lowerMsg.startsWith("news")) {
    const query = message.slice(4).trim(); // remove "news"
    if (!query) {
      botRespond("Kis topic ya location ka news chahiye?");
      return;
    }
    fetchNews(query);
    return;
  }

  // Simple conversational replies (Hindi / English)
  if (lowerMsg === "hello" || lowerMsg === "hi" || lowerMsg === "hey") {
    botRespond("Hello! Karen yaha hai 😎✨ How can I help you?");
    return;
  } else if (lowerMsg.includes("kaise ho")) {
    botRespond("Main mast hoon! Aap kaise ho? 😊");
    return;
  } else if (lowerMsg.includes("good morning")) {
    botRespond("Good Morning! 💚 Have a great day ahead!");
    return;
  } else if (lowerMsg.includes("thank you")) {
    botRespond("You're welcome! 😄 Always here to help!");
    return;
  } else if (lowerMsg.includes("love you")) {
    botRespond("Aww! 🥹 I care for you too 💚");
    return;
  } else if (lowerMsg.includes("karen")) {
    botRespond("Yes buddy? Karen listening! 👂✨");
    return;
  } else if (lowerMsg.includes("bye")) {
    botRespond("Bye Buddy! 💚 Take care!");
    return;
  }

  // Info / Introduction
  if (
    lowerMsg.includes("karen") ||
    lowerMsg.includes("who are you") ||
    lowerMsg.includes("introduce")
  ) {
    const infoHtml = `I am <b>KAREN</b><br>
      </b>`;
    const infoSpeak = "I am KAREN version seven point three. Storage twelve GB. RAM twelve GB. ROM twelve GB.";
    botRespond(infoHtml);
    speak(infoSpeak);
    return;
  }

  // FULL FORM (case-insensitive)
  if (lowerMsg.includes("full form")) {
    const fullHtml = `KAREN FULL FORM IS <b>Knowledgeable Artificial Real-time Enhanced Navigator</b>`;
    const fullSpeak = "K A R E N stands for Knowledgeable Artificial Real-time Enhanced Navigator.";
    botRespond(fullHtml);
    speak(fullSpeak);
    return;
  }

  // Short keyword that asks for version/storage/etc.
  if (
    lowerMsg.includes("version") ||
    lowerMsg.includes("storage") ||
    lowerMsg.includes("ram") ||
    lowerMsg.includes("rom")
  ) {
    const infoSpeak = "I am Karen version seven point three. Storage twelve GB. RAM twelve GB. ROM twelve GB.";
    botRespond("I am KAREN — Version 7.3. Storage: 12GB. RAM: 12GB. ROM: 12GB.");
    speak(infoSpeak);
    return;
  }

  // Wikipedia Search ✅
  if (lowerMsg.startsWith("search on wikipedia") || lowerMsg.startsWith("siw ")) {
    let topic = "";
    if (lowerMsg.startsWith("search on wikipedia")) {
      topic = message.substring("search on wikipedia".length).trim();
    } else {
      topic = message.substring("siw ".length).trim();
    }

    if (!topic) {
      botRespond(`Please write correctly:<br><b>search on wikipedia India</b>`);
      return;
    }
    botRespond("Searching Wikipedia… ⏳");
    return searchWiki(topic);
  }

  // Search hint
  if (lowerMsg.includes("wikipedia")) {
    botRespond(`Use:<br><b>search on wikipedia Taj Mahal</b>`);
    return;
  }

  // Default
  botRespond(generateReply(message));
}

// Math helper (added)
function checkMath(message) {
  const msg = message.toLowerCase();

  // ✅ Table Command
  if (msg.includes("table of") || msg.includes("table")) {
    const numberMatch = msg.match(/\d+/);
    const number = numberMatch ? parseInt(numberMatch[0], 10) : NaN;
    if (!isNaN(number)) {
      let table = `<b>Table of ${number}:</b><br>`;
      for (let i = 1; i <= 10; i++) {
        table += `${number} × ${i} = ${number * i}<br>`;
      }
      return table;
    }
  }

  // ✅ Square Root
  if (msg.includes("under root") || msg.includes("underroot") || msg.includes("√")) {
    const numberMatch = msg.match(/\d+/);
    const number = numberMatch ? parseInt(numberMatch[0], 10) : NaN;
    if (!isNaN(number)) {
      return `√${number} = ${Math.sqrt(number).toFixed(2)}`;
    }
  }

  // ✅ Addition (20 + 10 or add 20 and 10)
  if (msg.includes("add") || msg.includes("+")) {
    const nums = msg.match(/\d+/g);
    if (nums && nums.length >= 2) {
      const result = Number(nums[0]) + Number(nums[1]);
      return `${nums[0]} + ${nums[1]} = ${result}`;
    }
  }

  // ✅ Subtraction (20 - 5 or subtract 20 and 5)
  if (msg.includes("subtract") || (msg.includes("-") && !msg.includes("–"))) {
    const nums = msg.match(/\d+/g);
    if (nums && nums.length >= 2) {
      const result = Number(nums[0]) - Number(nums[1]);
      return `${nums[0]} - ${nums[1]} = ${result}`;
    }
  }

  // ✅ Multiplication (multiply 3 and 7 or 3 × 7)
  if (msg.includes("multiply") || msg.includes(" x ") || msg.includes("*")) {
    const nums = msg.match(/\d+/g);
    if (nums && nums.length >= 2) {
      const result = Number(nums[0]) * Number(nums[1]);
      return `${nums[0]} × ${nums[1]} = ${result}`;
    }
  }

  // ✅ Division (20 ÷ 4 or divide 20 by 4)
  if (msg.includes("divide") || msg.includes("÷") || msg.includes("/")) {
    const nums = msg.match(/\d+/g);
    if (nums && nums.length >= 2 && Number(nums[1]) !== 0) {
      const result = Number(nums[0]) / Number(nums[1]);
      return `${nums[0]} ÷ ${nums[1]} = ${result}`;
    }
  }

  return null;
}

// Basic AI Replies
function generateReply(message) {
  const msg = message.toLowerCase();
  if (msg.includes("hi") || msg.includes("hello")) return `Hello ${userName}!`;
  if (msg.includes("who am i")) return `You are ${userName}!`;
  return `I'm learning from you, ${userName}! 😊`;
}

// ✅ Text To Speech (Hindi + English)
function speak(text) {
  const clean = text.replace(/<\/?[^>]+(>|$)/g, "");
  const speech = new SpeechSynthesisUtterance(clean);
  speech.lang = "hi-IN"; // Hindi first
  speech.pitch = 1;
  speech.rate = 1.05;

  speechSynthesis.cancel();
  setTimeout(() => speechSynthesis.speak(speech), 100);
}

function botSpeakIfEnabled(text) {
  if (voiceEnabled) speak(text);
}

// ✅ Toggle voice (button click)
function toggleVoice() {
  const btn = document.getElementById("voiceBtn");
  voiceEnabled = !voiceEnabled;
  if (btn) btn.classList.toggle("active", voiceEnabled);
  if (!voiceEnabled) speechSynthesis.cancel();
}

// ✅ Speech Recognition 🎤
let recognition;
try {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = "hi-IN"; // Hindi + English Auto
  recognition.continuous = false;
} catch {
  console.log("Speech Recognition Not Supported");
}

// Start listening button
function startListening() {
  if (!recognition) {
    botRespond("Voice Recognition not supported ❌");
    return;
  }

  if (isListening) return; // already listening
  isListening = true;

  const btn = document.getElementById("voiceRecordBtn");
  if (btn) btn.classList.add("listening");

  // set handlers before starting to avoid missing events
  recognition.onresult = function (e) {
    const transcript = e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript;
    if (transcript) {
      document.getElementById("userInput").value = transcript;
      sendMessage();
    }
  };

  recognition.onend = () => {
    isListening = false;
    if (btn) btn.classList.remove("listening");
  };

  recognition.onerror = (event) => {
    console.error("SpeechRecognition error:", event);
    isListening = false;
    if (btn) btn.classList.remove("listening");
    botRespond("Voice recognition error ❌");
  };

  try {
    recognition.start();
  } catch (err) {
    // start() can throw if called in invalid state
    console.error(err);
    isListening = false;
    if (btn) btn.classList.remove("listening");
  }
}

/* Removed legacy camera/server-capture functions per request.
   Replaced with small stubs so existing callers won't throw errors.
   If you want the original implementations back, restore from your git/history. */

function createCameraElements() {
  console.warn("createCameraElements is disabled. Camera server-client capture removed.");
  // keep references if elements already exist
  videoEl = document.getElementById("cameraFeed") || document.getElementById("cam");
  canvasEl = document.getElementById("overlay");
  overlayCtx = canvasEl ? canvasEl.getContext("2d") : null;
}

async function openCameraAndDetect() {
  console.warn("openCameraAndDetect is disabled (legacy server capture removed).");
  // If you have client-side face-api monitoring available, prefer that.
  if (typeof startFaceApiAlarm === "function") {
    try {
      await startFaceApiAlarm();
    } catch (e) {
      console.error("startFaceApiAlarm error:", e);
    }
  }
}

async function stopCameraDetection() {
  console.warn("stopCameraDetection is disabled (legacy server capture removed).");
  // best-effort cleanup to avoid orphaned streams/intervals
  streaming = false;
  if (streamTrackInterval) {
    clearInterval(streamTrackInterval);
    streamTrackInterval = null;
  }
  try {
    if (videoEl && videoEl.srcObject) {
      const tracks = videoEl.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      videoEl.srcObject = null;
    }
  } catch (e) { /* ignore */ }

  if (overlayCtx && canvasEl) {
    overlayCtx.clearRect(0, 0, canvasEl.width || 0, canvasEl.height || 0);
  }
}

async function captureAndSendFrame() {
  // intentionally disabled (previously sent frames to server)
  return;
}

function drawFaces(/* faces, imgW, imgH */) {
  // intentionally disabled (overlay drawing removed)
  return;
}

// Wikipedia search function
async function searchWiki(query) {
  try {
    // 1) search (use origin=* to avoid CORS)
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(
      query
    )}&srlimit=1&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) { botRespond("Error searching Wikipedia ❌"); return; }
    const searchJson = await searchRes.json();
    const hits = searchJson?.query?.search;
    if (!hits || hits.length === 0) { botRespond("No results found 🤔"); return; }

    const title = hits[0].title;

    // 2) fetch summary by title
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summaryRes = await fetch(summaryUrl);
    if (!summaryRes.ok) { botRespond("Error fetching summary ❌"); return; }
    const data = await summaryRes.json();

    const extract = data.extract || data.description || "";
    if (!extract) { botRespond("No summary available 🤔"); return; }

    const cleanSpeak = `${data.title}. ${extract}`;
    botRespond(`<b>📚 Wikipedia:</b><br><b>${data.title}</b><br>${extract}`);
    speak(cleanSpeak);
  } catch (err) {
    console.error("Wikipedia error:", err);
    botRespond("Error fetching information ❌");
  }
}

// Face-api.js — local presence alarm (non-conflicting names)
let faceApiCameraStream = null;
let faceDetectionInterval = null;
let faceMissingTime = 0;
let faceApiAlertSent = false; // TRACK whether we've informed server

// Ensure models are loaded (uses CDN models)
async function loadFaceApiModels() {
  if (typeof faceapi === "undefined") {
    console.warn("face-api.js not found. Add <script src='https://cdn.jsdelivr.net/npm/face-api.js'></script> to your page.");
    return false;
  }

  const candidates = [
    "https://cdn.jsdelivr.net/npm/face-api.js/models",
    "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights",
    "/models" // if you host weights locally under /static/models
  ];

  for (const base of candidates) {
    try {
      console.log("Trying to load face-api models from:", base);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(base),
        // add other nets if you use them:
        // faceapi.nets.faceLandmark68Net.loadFromUri(base),
        // faceapi.nets.faceRecognitionNet.loadFromUri(base)
      ]);
      console.log("face-api models loaded from:", base);
      return true;
    } catch (err) {
      console.warn("Failed to load models from", base, err);
      // try next candidate
    }
  }

  console.error("All attempts to load face-api models failed. Put weights in /static/models or check CDN paths.");
  return false;
}

// Start camera + face check; notifies server via /set_alert when missing for 30s
async function startFaceApiAlarm() {
  if (typeof faceapi === "undefined") {
    botRespond("face-api.js not loaded on the page. Cannot start local face alarm.");
    return;
  }

  await loadFaceApiModels();

  let video = document.getElementById("cameraFeed");
  if (!video) {
    video = document.createElement("video");
    video.id = "cameraFeed";
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.style.width = "320px";
    video.style.height = "240px";
    video.style.position = "fixed";
    video.style.right = "24px";
    video.style.bottom = "24px";
    video.style.borderRadius = "8px";
    video.style.boxShadow = "0 8px 30px rgba(0,0,0,0.6)";
    document.body.appendChild(video);
  }
  video.style.display = "block";

  try {
    faceApiCameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = faceApiCameraStream;
  } catch (err) {
    console.error("Camera error", err);
    botRespond("Cannot access camera: " + (err.message || err));
    return;
  }

  const alarmSound = document.getElementById("alarmSound") || (function createAlarm() {
    const a = document.createElement("audio");
    a.id = "alarmSound";
    a.src = "alarm.mp3";
    a.preload = "auto";
    document.body.appendChild(a);
    return a;
  })();

  alarmSound.loop = true;
  faceMissingTime = 0;
  faceApiAlertSent = false;

  // run detection once per second
  faceDetectionInterval = setInterval(async () => {
    try {
      const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
      if (detection) {
        // face present -> reset counters, clear server alert if previously sent
        faceMissingTime = 0;
        if (faceApiAlertSent) {
          faceApiAlertSent = false;
          fetch("/set_alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alert: false })
          }).catch(() => {});
          console.log("✅ Face detected again — server alert cleared");
        }
        if (!alarmSound.paused) {
          alarmSound.pause();
          alarmSound.currentTime = 0;
        }
      } else {
        // no face detected this tick
        faceMissingTime++;
        // threshold = ~30 seconds (30 ticks)
        if (faceMissingTime >= 30 && !faceApiAlertSent) {
          faceApiAlertSent = true;
          // notify server
          fetch("/set_alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alert: true })
          }).catch(() => {});
          // play local alarm (if allowed/unlocked)
          alarmSound.play().catch(() => { /* autoplay blocked — server still notified */ });
          console.log("🚨 No face detected for 30s — server alerted");
        }
      }
    } catch (e) {
      console.error("face-api detection error", e);
    }
  }, 1000);
}

function stopFaceApiAlarm() {
  const video = document.getElementById("cameraFeed");
  if (video) video.style.display = "none";

  if (faceDetectionInterval) {
    clearInterval(faceDetectionInterval);
    faceDetectionInterval = null;
  }

  if (faceApiCameraStream) {
    faceApiCameraStream.getTracks().forEach(t => t.stop());
    faceApiCameraStream = null;
  }

  const alarmSound = document.getElementById("alarmSound");
  if (alarmSound) {
    alarmSound.pause();
    alarmSound.currentTime = 0;
  }

  // clear server alert if set
  if (faceApiAlertSent) {
    faceApiAlertSent = false;
    fetch("/set_alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alert: false })
    }).catch(() => {});
  }

  faceMissingTime = 0;
}

// Add fetchNews helper near other network helpers (e.g. after searchWiki)
async function fetchNews(query) {
  botRespond("Dekh rahi hoon... 📰");

  try {
    const res = await fetch("http://localhost:5000/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query })
    });

    if (!res.ok) {
      botRespond("Kuch issue aa gaya news laate waqt!");
      return;
    }

    const data = await res.json();
    if (data.error) {
      botRespond("Kuch issue aa gaya news laate waqt!");
    } else {
      botRespond(data.summary || "No latest updates found!");
    }
  } catch (err) {
    console.error("news fetch error", err);
    botRespond("Server se response nahi aa raha!");
  }
}
