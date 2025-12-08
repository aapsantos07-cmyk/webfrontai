const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const nodemailer = require("nodemailer");

initializeApp();
const db = getFirestore();
const auth = getAuth();

exports.chatWithAI = onCall(async (request) => {
  const { message, history, customSystemPrompt } = request.data;

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
    const apiKey = settings.geminiKey;

    // Use custom prompt if provided, otherwise use default from Firestore
    const systemPrompt = customSystemPrompt || settings.systemPrompt || "You are WEBFRONT_AI, a helpful assistant for a digital agency. Answer questions about web development services, pricing, and timelines.";

    if (!apiKey) {
      throw new HttpsError("failed-precondition", "API key not configured");
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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

exports.sendClientInvitation = onCall(async (request) => {
  const { email, name, tempPassword } = request.data;

  // Verify caller is admin
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated");
  }

  const callerDoc = await db.collection("clients").doc(request.auth.uid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new HttpsError("permission-denied", "Only admins can send invitations");
  }

  if (!email || !name || !tempPassword) {
    throw new HttpsError("invalid-argument", "Email, name, and temporary password required");
  }

  try {
    // Get email settings from Firestore
    const settingsDoc = await db.collection("admin").doc("email_settings").get();

    let transporter;
    if (settingsDoc.exists && settingsDoc.data().gmailUser && settingsDoc.data().gmailAppPassword) {
      const settings = settingsDoc.data();
      // Use Gmail SMTP
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: settings.gmailUser,
          pass: settings.gmailAppPassword
        }
      });
    } else {
      // Fallback to console log (for testing)
      console.log("Email settings not configured. Would send:", { email, name, tempPassword });
      return {
        success: true,
        message: "Email settings not configured. Check function logs for credentials.",
        testMode: true
      };
    }

    const mailOptions = {
      from: settingsDoc.data().gmailUser || 'noreply@webfrontai.com',
      to: email,
      subject: 'Welcome to WebFront AI - Account Created',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 20px; text-align: center; }
            .content { background: #f4f4f4; padding: 30px; }
            .credentials { background: #fff; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; }
            .button { display: inline-block; background: #3b82f6; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to WebFront AI</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Your account has been created! You can now access your project dashboard.</p>

              <div class="credentials">
                <h3>Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 3px;">${tempPassword}</code></p>
              </div>

              <p><strong>Important:</strong> For security, you'll be required to reset your password on first login.</p>

              <a href="https://webfrontai.com" class="button">Login to Your Dashboard</a>

              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>© 2025 WebFront AI. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    return { success: true, message: "Invitation email sent successfully" };
  } catch (error) {
    console.error("Email error:", error);
    throw new HttpsError("internal", "Failed to send invitation email: " + error.message);
  }
});
