import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";

import { handleChat } from "./services/chatService.js";

import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});



const app = express();
const __dirname = path.resolve();

app.post("/tts", async (req, res) => {
  try {
    const text = req.body.text;

    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy", // tek sabit ses (desktop/mobile aynı)
      input: text
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    const filePath = "speech.mp3";
    fs.writeFileSync(filePath, buffer);

    res.json({ url: "/speech.mp3" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "TTS failed" });
  }
});

app.use(express.static(__dirname));
app.use(cors());

app.use(bodyParser.json());

const distPath = path.join(__dirname, "frontend", "dist");

// =========================
// 1. STATIC (VITE BUILD)
// =========================
app.use(express.static(distPath));

// =========================
// 2. MODEL GLB (IMPORTANT FIX)
// =========================
app.use(
  "/model.glb",
  express.static(path.join(__dirname, "frontend/public/model.glb"))
);

// =========================
// 3. CHAT API
// =========================
app.post("/chat", async (req, res) => {
  try {
    const result = await handleChat(req.body.message);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "error", intent: "cold" });
  }
});

// =========================
// 4. ROOT
// =========================
app.get("/", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// =========================
// 5. SAFE SPA FALLBACK (IMPORTANT)
// =========================
app.get("*", (req, res) => {
  if (req.path.includes(".")) {
    return res.status(404).end();
  }
  res.sendFile(path.join(distPath, "index.html"));
});

// =========================
// START
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});