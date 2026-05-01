import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";

import { handleChat } from "./services/chatService.js";

const app = express();
const __dirname = path.resolve();

/* =========================
   OPENAI
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
const upload = multer({ dest: "uploads/" });
/* =========================
   PATHS
========================= */
const distPath = path.join(__dirname, "frontend", "dist");

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(bodyParser.json());

/* =========================
   FRONTEND
========================= */
app.use(express.static(distPath));

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
app.post("/whisper", upload.single("file"), async (req, res) => {
  try {

    const filePath = req.file.path;

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "gpt-4o-mini-transcribe"
    });

    // 🔥 EKLE (ÇOK ÖNEMLİ)
    fs.unlinkSync(filePath);

    res.json({ text: transcription.text });

  } catch (err) {
    console.error("WHISPER ERROR:", err);
    res.status(500).json({ error: "whisper failed" });
  }
});
/* =========================
   TTS (FIX - NO FILE, DIRECT STREAM)
========================= */
app.post("/tts", async (req, res) => {
  try {
    const text = req.body.text;

    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);

  } catch (err) {
    console.error("TTS FULL ERROR:", err);
    console.error("TTS MESSAGE:", err.message);

    res.status(500).json({
      error: "TTS failed"
    });
  }
});

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

/* =========================
   SPA FALLBACK
========================= */
app.get("*", (req, res) => {
  if (req.path.includes(".")) {
    return res.status(404).end();
  }
  res.sendFile(path.join(distPath, "index.html"));
});

/* =========================
   START
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});