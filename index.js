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
  if (!code) return res.send("❌ No code received from Upstox");

  try {
    const response = await axios.post(
      "https://api.upstox.com/v2/login/authorization/token",
      new URLSearchParams({
        code,
        client_id: process.env.UPSTOX_API_KEY,
        client_secret: process.env.UPSTOX_API_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.UPSTOX_REDIRECT_URI
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = response.data.access_token;
    console.log("UPSTOX_ACCESS_TOKEN:", accessToken);

    res.send("Upstox connected ✔ You can close this window.");
  } catch (err) {
    console.error("Upstox token error:", err.response?.data || err.message);
    res.status(500).send("Error getting token from Upstox");
  }
});

// Placeholder API that Lovable can call later
app.get("/api/ping", (req, res) => {
  res.json({
    ok: true,
    message: "Backend is ready to connect Lovable & Upstox"
  });
});

// =====================================
// 🔥 NIFTY Option Chain → OI + PCR + Bias
// =====================================
app.get("/api/nifty/option-data", async (req, res) => {
  try {
    const instrument = "NSE_INDEX|Nifty 50";

    const response = await axios.get(
      "https://api.upstox.com/v2/option/chain",
      {
        params: { instrument_key: instrument },
        headers: {
          Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`,
          Accept: "application/json"
        }
      }
    );

    const chain = response.data?.data || [];

    let callOI = 0, putOI = 0;
    chain.forEach(strike => {
      callOI += strike.call_options?.market_data?.oi || 0;
      putOI  += strike.put_options?.market_data?.oi  || 0;
    });

    const pcr = (putOI / callOI).toFixed(2);
    const bias =
      pcr > 1.05 ? "Bullish" :
      pcr < 0.85 ? "Bearish" :
      "Neutral";

    res.json({
      PCR: pcr,
      trendBias: bias,
      totalCallOI: callOI,
      totalPutOI: putOI,
      chain
    });
  } catch (err) {
    console.error("NIFTY OI error:", err.response?.data || err.message);
    res.status(500).send("Unable to fetch NIFTY OI right now");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("MindTrade backend running on port", PORT);
});
