import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

const PORT = 3000;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  // Mock data for crime analysis by region (latitude/longitude boundaries)
  const crimeData = [
    { name: "Downtown", bounds: { minLat: 40.7, maxLat: 40.75, minLng: -74.02, maxLng: -73.98 }, safety: 85 },
    { name: "Industrial Zone", bounds: { minLat: 40.75, maxLat: 40.8, minLng: -74.05, maxLng: -74.0 }, safety: 45 },
    { name: "Suburbia", bounds: { minLat: 40.65, maxLat: 40.7, minLng: -74.0, maxLng: -73.9 }, safety: 95 },
  ];

  // Helper to calculate safety based on coordinates
  function getSafetyScore(lat: number, lng: number) {
    const region = crimeData.find(r => 
      lat >= r.bounds.minLat && lat <= r.bounds.maxLat && 
      lng >= r.bounds.minLng && lng <= r.bounds.maxLng
    );
    return region ? region.safety : 70; // 70 is default if unknown
  }

  // API Routes
  app.get("/api/safety-analysis", (req, res) => {
    const { lat, lng } = req.query;
    const l = parseFloat(lat as string);
    const g = parseFloat(lng as string);

    if (isNaN(l) || isNaN(g)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    const crimeScore = getSafetyScore(l, g);
    const trafficScore = Math.floor(Math.random() * 40) + 60; // 60-100
    const weatherScore = 90; // Default good weather
    const lightingScore = new Date().getHours() > 18 || new Date().getHours() < 6 ? 40 : 100;
    const crowdScore = 75;

    const overallScore = Math.floor(
      (0.30 * crimeScore) +
      (0.25 * trafficScore) +
      (0.20 * weatherScore) +
      (0.15 * lightingScore) +
      (0.10 * crowdScore)
    );

    res.json({
      crimeScore,
      trafficScore,
      weatherScore,
      lightingScore,
      crowdScore,
      overallScore
    });
  });

  app.post("/api/emergency", (req, res) => {
    const { location, userId } = req.body;
    console.log(`🚨 EMERGENCY ALERT from ${userId} at ${location.lat}, ${location.lng}`);
    // In a real app, this would trigger SOS calls or push notifications
    res.json({ success: true, message: "Emergency services notified." });
  });

  // Socket.io for Real-time Engine
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Mock live updates every 5 seconds
    const interval = setInterval(() => {
      socket.emit("live-update", {
        timestamp: new Date().toISOString(),
        trafficDensity: Math.floor(Math.random() * 100),
        weather: "Clear",
        safetyAlert: Math.random() > 0.9 ? "Increase in crowd density detected nearby." : null
      });
    }, 5000);

    socket.on("disconnect", () => {
      clearInterval(interval);
      console.log("Client disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve("dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 SafePath AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
