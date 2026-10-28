import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ==========================================
// 1. DATABASE MODEL
// ==========================================
const workflowRunSchema = new mongoose.Schema({
  taskType: { type: String, enum: ["code", "article", "marketing"], default: "code" },
  userPrompt: { type: String, required: true },
  draftV1: { type: String, required: true },
  criticReview: { type: String, required: true },
  finalOutputV2: { type: String, required: true },
}, { timestamps: true });
const WorkflowRun = mongoose.model("WorkflowRun", workflowRunSchema);

// ==========================================
// 2. AI HELPER
// ==========================================
async function callGemini(prompt) {
  const models = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];
  for (const m of models) {
    try {
      return await ai.models.generateContent({ model: m, contents: prompt });
    } catch (e) { console.warn(`Model ${m} failed: ${e.message}`); }
  }
  throw new Error("All models failed.");
}

// ==========================================
// 3. THE MULTI-AGENT PIPELINE
// ==========================================
app.post("/api/run-workflow", async (req, res) => {
  try {
    const { taskType, userPrompt } = req.body;
    if (!userPrompt) return res.status(400).json({ error: "Prompt is required." });

    // AGENT 1: The Generator
    const prompt1 = `You are Agent 1 (Lead ${taskType.toUpperCase()} Drafter). Create a strong initial version (v1) for the following request:\n${userPrompt}`;
    const draftV1 = (await callGemini(prompt1)).text;

    // AGENT 2: The Ruthless Critic
    const prompt2 = `You are Agent 2 (Principal Reviewer & Critic). Examine the following v1 draft created for the request ("${userPrompt}"). List 3 to 5 specific weaknesses, edge cases, bugs, or clarity improvements needed.\n\nV1 DRAFT:\n${draftV1}`;
    const criticReview = (await callGemini(prompt2)).text;

    // AGENT 3: The Master Refiner
    const prompt3 = `You are Agent 3 (Principal Editor & Refiner). Rewrite and upgrade the v1 draft so that it resolves every point raised by the Critic Review. Return the complete, polished v2 deliverable.\n\nORIGINAL REQUEST:\n${userPrompt}\n\nV1 DRAFT:\n${draftV1}\n\nCRITIC REVIEW TO ADDRESS:\n${criticReview}`;
    const finalOutputV2 = (await callGemini(prompt3)).text;

    // Save to MongoDB
    const savedRun = await WorkflowRun.create({
      taskType: taskType || "code",
      userPrompt,
      draftV1,
      criticReview,
      finalOutputV2,
    });

    res.json(savedRun);
  } catch (err) { 
    console.error("Workflow Error:", err);
    res.status(500).json({ error: err.message }); 
  }
});

// ==========================================
// 4. START SERVER
// ==========================================
const port = process.env.PORT || 5002;
app.listen(port, () => console.log(`🚀 FlowForge Backend running on http://localhost:${port}`));
mongoose.connect(process.env.MONGODB_URI).then(() => console.log("✅ MongoDB connected")).catch(err => console.error("❌ DB error:", err.message));