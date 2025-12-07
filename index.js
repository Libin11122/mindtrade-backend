import express from "express";
import axios from "axios";

const app = express();

// =========================
// Basic routes
// =========================

app.get("/", (req, res) => {
  res.send("MindTrade backend is LIVE 🚀");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// =========================
// Upstox OAuth Callback
// =========================

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

// Simple test route for Lovable
app.get("/api/ping", (req, res) => {
  res.json({
    ok: true,
    message: "Backend is ready to connect Lovable & Upstox",
  });
});

// =========================
// NIFTY Option Chain → OI + PCR + Bias
// =========================

app.get("/api/nifty/option-data", async (req, res) => {
  try {
    const instrument = "NSE_INDEX|Nifty 50";

    console.log(
      "Using token starts with:",
      process.env.UPSTOX_ACCESS_TOKEN?.slice(0, 15)
    );

    const response = await axios.get(
      "https://api.upstox.com/v2/option/chain",
      {
        params: {
          instrument_key: instrument,
          // expiry_date: "2025-12-11", // optional: set a valid expiry if needed
        },
        headers: {
          Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`,
          Accept: "application/json",
        },
      }
    );

    const chain = response.data?.data || [];

    let callOI = 0,
      putOI = 0;
    chain.forEach((strike) => {
      callOI += strike.call_options?.market_data?.oi || 0;
      putOI += strike.put_options?.market_data?.oi || 0;
    });

    const pcr = (putOI / callOI).toFixed(2);
    const bias =
      pcr > 1.05 ? "Bullish" : pcr < 0.85 ? "Bearish" : "Neutral";

    res.json({
      PCR: pcr,
      trendBias: bias,
      totalCallOI: callOI,
      totalPutOI: putOI,
      chain,
    });
  } catch (err) {
    console.error("NIFTY OI error:", err.response?.data || err.message);
    res.status(500).send("Unable to fetch NIFTY OI right now");
  }
});

// =========================
// Start server
// =========================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("MindTrade backend running on port", PORT);
});
