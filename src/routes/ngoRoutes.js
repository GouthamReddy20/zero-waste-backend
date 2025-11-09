import express from "express";
import { authenticateToken, authorizeRole } from "../middlewares/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  getDonations,
  acceptDonation,
  rejectDonation,
  markDonationDelivered, // NEW
  getNotifications,
  readNotification,
} from "../controllers/ngoController.js";

const router = express.Router();

// 🔒 Protect all NGO routes
router.use(authenticateToken, authorizeRole("ngo"));

// -------------------- PROFILE -----------------
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// -------------------- DONATIONS -----------------
router.get("/donations", getDonations);
router.put("/donations/:id/accept", acceptDonation);
router.put("/donations/:id/reject", rejectDonation);
router.put("/donations/:id/deliver", markDonationDelivered); // NEW

// -------------------- NOTIFICATIONS -----------------
router.get("/notifications", getNotifications);
router.put("/notifications/:id/read", readNotification);

export default router;
