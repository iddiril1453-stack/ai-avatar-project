import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import { handleChat } from "./services/chatService.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());

// CHAT API
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const result = await handleChat(userMessage);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      reply: "Server hatası oluştu",
      intent: "cold"
    });
  }
});

// TEST
app.get("/", (req, res) => {
  res.send("AI Avatar Backend Çalışıyor 🚀");
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});