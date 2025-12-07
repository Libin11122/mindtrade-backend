import express from "express";
import axios from "axios";

const app = express();

// --------------------
// Basic routes
// --------------------
app.get("/", (req, res) => {
  res.send("MindTrade backend is LIVE 🚀");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// --------------------
// Upstox OAuth callback
// --------------------
app.get("/upstox/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("❌ No code received");

  try {
    const body = new URLSearchParams({
      code,
      client_id: process.env.UPSTOX_API_KEY,
      client_secret: process.env.UPSTOX_API_SECRET,
      redirect_uri: process.env.UPSTOX_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const { data } = await axios.post(
      "https://api.upstox.com/v2/login/authorization/token",
      body,
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "Api-Version": "2.0",
        },
      }
    );

    console.log("🔥 NEW ACCESS TOKEN:", data.access_token);
    res.send("Token received ✔ Copy latest token from logs & update env.");
  } catch (err) {
    console.error("Error getting token:", err.response?.data || err);
    res.send("❌ Failed to generate token. Check logs.");
  }
});

// --------------------
// Test token: user profile
// --------------------
app.get("/api/upstox/profile", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.upstox.com/v2/user/profile",
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`,
          Accept: "application/json",
          "Api-Version": "2.0",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("P
