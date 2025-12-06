const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { GoogleGenerativeAI } = require("@google/generative-ai");

initializeApp();
const db = getFirestore();

exports.chatWithAI = onCall(async (request) => {
  const { message, history } = request.data;

  if (!message || typeof message !== "string") {
    throw new HttpsError("invalid-argument", "Message is required");
  }

  try {
    // Fetch AI settings from Firestore
    const settingsDoc = await db.collection("admin").doc("ai_settings").get();

    if (!settingsDoc.exists) {
      throw new HttpsError("not-found", "AI settings not configured");
    }

    const settings = settingsDoc.data();
    const apiKey = settings.config?.geminiKey;
    const systemPrompt = settings.config?.systemPrompt || "You are WEBFRONT_AI, a helpful assistant for a digital agency. Answer questions about web development services, pricing, and timelines.";

    if (!apiKey) {
      throw new HttpsError("failed-precondition", "API key not configured");
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build conversation history for context
    const chatHistory = (history || []).map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    // Start chat with system prompt
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "System instructions: " + systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I will follow these instructions." }] },
        ...chatHistory
      ],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return { text: responseText };
  } catch (error) {
    console.error("Chat error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to generate response");
  }
});
