// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import path from "path";
// import { fileURLToPath } from "url";
// import fs from "fs";

// // Routes
// import authRoutes from "./routes/authRoutes.js";
// import foodRoutes from "./routes/foodRoutes.js";
// import contactRoutes from "./routes/contactRoutes.js";
// import donorRoutes from "./routes/donorRoutes.js";
// import ngoRoutes from "./routes/ngoRoutes.js";
// import volunteerRoutes from "./routes/volunteerRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";



// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 8080;

// // Ensure uploads folder exists
// const uploadsDir = path.join(process.cwd(), "uploads");
// if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ----------------- Core Middleware -----------------
// app.use(cors());
// app.use(express.json());
// app.use("/uploads", express.static(uploadsDir)); // serve uploaded files

// // ----------------- API Routes -----------------
// app.use("/api/auth", authRoutes);
// app.use("/api/food", foodRoutes);
// app.use("/api/contact", contactRoutes);
// app.use("/api/donor", donorRoutes);
// app.use("/api/ngo", ngoRoutes);
// app.use("/api/volunteer", volunteerRoutes);
// app.use("/api/admin", adminRoutes);
// // ----------------- Static Frontend -----------------
// app.use(express.static(path.join(__dirname, "../frontend")));

// // Frontend routes fallback
// app.get("/donordashboard.html", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/donordashboard.html"));
// });
// app.get("/ngo-dashboard.html", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/ngo-dashboard.html"));
// });
// app.get("/admin-dashboard.html", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/admin-dashboard.html"));
// });
// app.get("/volunteer-dashboard.html", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/volunteer-dashboard.html"));
// });

// // ----------------- Global Error Handler -----------------
// app.use((err, req, res, next) => {
//   console.error("Global Error:", err.stack);
//   res.status(500).json({ message: "Something broke!", error: err.message });
// });

// // ----------------- Start Server -----------------
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });



import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Routes
import authRoutes from "./routes/authRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import donorRoutes from "./routes/donorRoutes.js";
import ngoRoutes from "./routes/ngoRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve directory paths safely
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------- Ensure uploads folder exists -----------------
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ----------------- Core Middleware -----------------
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir)); // serve uploaded files

// ----------------- API Routes -----------------
app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/donor", donorRoutes);
app.use("/api/ngo", ngoRoutes);
app.use("/api/volunteer", volunteerRoutes);
app.use("/api/admin", adminRoutes);

// ----------------- Serve Frontend (Render + local) -----------------
app.use(express.static(path.join(__dirname, "../../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/index.html"));
});

// Optional dashboard routes
app.get("/donordashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/donordashboard.html"));
});
app.get("/ngo-dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/ngo-dashboard.html"));
});
app.get("/admin-dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/admin-dashboard.html"));
});
app.get("/volunteer-dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/volunteer-dashboard.html"));
});

// ----------------- Health Check (Render requirement) -----------------
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Zero Waste backend running ✅" });
});

// ----------------- Global Error Handler -----------------
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({ message: "Something broke!", error: err.message });
});

// ----------------- Start Server -----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
