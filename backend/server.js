import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import { handleChat } from "./services/chatService.js";

console.log("SERVER STARTING...");

console.log("ENV KEY:", process.env.OPENAI_API_KEY);

const app = express();

app.use(cors());
app.use(bodyParser.json());

// 🧠 CHAT ENDPOINT (TEK KAPI)
app.post("/chat", async (req, res) => {
  try {

    const userMessage = req.body.message;

    const result = await handleChat(userMessage);

    return res.json(result);

  } catch (err) {
    console.error("SERVER ERROR:", err);

    return res.status(500).json({
      reply: "Server hatası oluştu",
      intent: "cold"
    });
  }
});

// 🧪 TEST ROUTE
app.get("/", (req, res) => {
  res.send("AI Avatar Backend Çalışıyor 🚀");
});

// 🚀 START SERVER
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});