// api/translator-gpt.js

import express from "express";
import OpenAI from "openai";

const router = express.Router();

// API-ключ только в переменных окружения!
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Body: { text, targetLang, sourceLang? }
 * Ответ: { translation, detectedSourceLang }
 */
router.post("/translator/gpt", async (req, res) => {
  try {
    const { text, targetLang, sourceLang = "auto" } = req.body || {};

    if (!text || !targetLang) {
      return res.status(400).json({ error: "text and targetLang are required" });
    }

    const system = `You are a translation engine. 
- Translate the user text into language with ISO code "${targetLang}".
- If sourceLang is "auto", detect the source language automatically.
- Return only the translated text, no explanations.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: text }
      ]
    });

    const translation = completion.choices[0]?.message?.content?.trim() || "";

    // Детект языка можно сделать либо отдельным запросом, либо эвристикой,
    // здесь для простоты оставляем заглушкой:
    const detectedSourceLang = sourceLang === "auto" ? "auto" : sourceLang;

    res.json({
      translation,
      detectedSourceLang
    });
  } catch (err) {
    console.error("GPT translation error:", err);
    res.status(500).json({ error: "GPT translation failed" });
  }
});

export default router;