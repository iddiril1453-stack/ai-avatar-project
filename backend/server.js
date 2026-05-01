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
   UPLOAD FOLDER (SAFE INIT)
========================= */
const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* =========================
   OPENAI
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* =========================
   MULTER CONFIG
========================= */
const upload = multer({ dest: uploadDir });

/* =========================
   FRONTEND PATH
========================= */
const distPath = path.join(__dirname, "frontend", "dist");

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(distPath));

/* =========================
   CHAT API
========================= */
app.post("/chat", async (req, res) => {
  try {
    const { userId, message } = req.body;
const result = await handleChat(userId, message);

    res.json(result);

  } catch (err) {
    console.error("CHAT ERROR:", err);

    res.status(500).json({
      reply: "error",
      intent: "cold"
    });
  }
});

/* =========================
   WHISPER (VOICE TO TEXT)
========================= */
app.post("/whisper", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "no file received" });
    }

   const filePath = req.file.path;

// uzantı zorla
const newPath = filePath + ".webm";
fs.renameSync(filePath, newPath);

const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream(newPath),
  model: "gpt-4o-mini-transcribe"
});

fs.unlink(newPath, () => {});

const mime = req.file.mimetype;
console.log("MIME:", mime);


    res.json({ text: transcription.text });

  } catch (err) {
    console.error("WHISPER ERROR:", err);

    res.status(500).json({
      error: "whisper failed",
      detail: err.message
    });
  }
});

/* =========================
   TTS (TEXT TO SPEECH)
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
    console.error("TTS ERROR:", err);

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
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});