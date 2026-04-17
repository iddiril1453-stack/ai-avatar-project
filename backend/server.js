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

// ✅ FRONTEND DIST (EN KRİTİK)
const distPath = path.join(__dirname, "frontend", "dist");

app.use(express.static(distPath));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// CHAT API
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

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});