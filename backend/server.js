import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";

import { handleChat } from "./services/chatService.js";

const app = express();
const root = process.cwd();

// 🔥 CSP SAFE FIX (opsiyonel)
app.use((req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  next();
});

app.use((req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  next();
});

app.use(cors());
app.use(bodyParser.json());

// 🔥 FRONTEND SERVE
app.use(express.static(path.join(root, "frontend", "dist")));

// 🧠 CHAT API
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const result = await handleChat(userMessage);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "Server hatası oluştu",
      intent: "cold"
    });
  }
});

// 🧪 TEST
app.get("/api", (req, res) => {
  res.send("AI Avatar Backend Çalışıyor 🚀");
});

// 🌐 FRONTEND FALLBACK (ÇOK ÖNEMLİ)
app.get("*", (req, res) => {
  res.sendFile(path.join(root, "frontend", "dist", "index.html"));
});

// 🚀 PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});