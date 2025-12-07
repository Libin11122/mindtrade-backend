import express from "express";
import axios from "axios";

const app = express();

// Simple home route so we know server works
app.get("/", (req, res) => {
  res.send("MindTrade backend is LIVE 🚀");
});

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * This route will be your Upstox redirect URL.
 * Later you'll put this full URL into the Upstox developer portal.
 * For now it just prints the ?code=... so we can see it's working.
 */
app.get("/upstox/callback", async (req, res) => {
  const code = req.query.code;
  console.log("Received Upstox code:", code);

  if (!code) {
    return res.send("❌ No code received from Upstox");
  }

  // In the NEXT step we will exchange this code for an access token.
  // For now we just show a success message.
  res.send("Upstox login callback received ✔ You can close this window.");
});

// Placeholder API that Lovable can call later
app.get("/api/ping", (req, res) => {
  res.json({
    ok: true,
    message: "Backend is ready to connect Lovable & Upstox"
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("MindTrade backend running on port", PORT);
});
