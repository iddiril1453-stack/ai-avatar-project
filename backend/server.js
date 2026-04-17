import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";

import { handleChat } from "./services/chatService.js";

const app = express();
const __dirname = path.resolve();

// middleware
app.use(cors());
app.use(bodyParser.json());

// 🔥 FRONTEND SERVE (BUILD)
app.use(express.static(path.join(__dirname, "frontend/dist")));

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

// 🧪 TEST ROUTE
app.get("/api", (req, res) => {
  res.send("AI Avatar Backend Çalışıyor 🚀");
});

// 🌐 FRONTEND ROUTE (SPA FIX)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist", "index.html"));
});

// 🚀 START SERVER
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});