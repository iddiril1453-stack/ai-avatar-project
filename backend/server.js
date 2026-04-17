import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs";
import OpenAI from "openai";

import { handleChat } from "./services/chatService.js";

const app = express();
const __dirname = path.resolve();

/* =========================
   OPENAI TTS SETUP
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(bodyParser.json());

/* =========================
   FRONTEND DIST
========================= */
const distPath = path.join(__dirname, "frontend", "dist");
app.use(express.static(distPath));

/* =========================
   MODEL GLB FIX
========================= */
app.get("/model.glb", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "public", "model.glb"));
});

/* =========================
   CHAT API
========================= */
app.post("/chat", async (req, res) => {
  try {
    const result = await handleChat(req.body.message);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "error",
      intent: "cold"
    });
  }
});

/* =========================
   TTS API (FIXED + STABLE)
========================= */
app.post("/tts", async (req, res) => {
  try {
    const text = req.body.text;

    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy", // tek sabit ses (desktop/mobile aynı)
      input: text
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    const filePath = path.join(__dirname, "speech.mp3");

    fs.writeFileSync(filePath, buffer);

    res.json({ url: "/speech.mp3" });

  } catch (err) {
    console.error("TTS ERROR:", err);
    res.status(500).json({ error: "TTS failed" });
  }
});

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

/* =========================
   SAFE SPA FALLBACK
========================= */
app.get("*", (req, res) => {
  if (req.path.includes(".")) {
    return res.status(404).end();
  }
  res.sendFile(path.join(distPath, "index.html"));
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});