import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";

import { handleChat } from "./services/chatService.js";

const app = express();
const __dirname = path.resolve();

// 🔥 CSP FIX (TEMP SAFE)
app.use((req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  next();
});

// middleware
app.use(cors());
app.use(bodyParser.json());

// 🔥 SERVE FRONTEND BUILD
app.use(express.static(path.join(process.cwd(), "frontend/dist")));

// 🧠 CHAT API
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const result = await handleChat(userMessage);

    return res.json(result);

  } catch (err) {
    console.error("CHAT ERROR:", err);

    return res.status(500).json({
      reply: "Server hatası oluştu",
      intent: "cold"
    });
  }
});

// 🧪 TEST
app.get("/api", (req, res) => {
  res.send("AI Avatar Backend Çalışıyor 🚀");
});

// 🌐 FRONTEND ROUTE (IMPORTANT)
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "frontend/dist", "index.html"));
});

// 🚀 START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});