import express from "express";
import {
  adminLogin,
  getProfile,
  updateAdminProfile,
  getVolunteers,
  updateVolunteer,
  getNGOs,
  updateNGO,
  getAllDonations,
  updateDonationStatus,
  getAllContacts,
  getAllNotifications,
  getDashboardStats,
  markNotificationRead 
} from "../controllers/adminController.js";

import { authenticateToken, authorizeRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ---------- PUBLIC LOGIN ----------
router.post("/login", adminLogin);

// ---------- PROTECTED ROUTES ----------
router.use(authenticateToken, authorizeRole("admin"));

// PROFILE
router.get("/profile", getProfile);
router.put("/profile", updateAdminProfile);

// VOLUNTEERS & NGOS
router.get("/volunteers", getVolunteers);
router.put("/volunteers/:id", updateVolunteer);

router.get("/ngos", getNGOs);
router.put("/ngos/:id", updateNGO);

// DONATIONS
router.get("/donations", getAllDonations);
router.put("/donations/:id/status", updateDonationStatus);

// CONTACTS & NOTIFICATIONS
router.get("/contacts", getAllContacts);
router.get("/notifications", getAllNotifications);
router.put("/notifications/:id/read", markNotificationRead);

// DASHBOARD STATS
router.get("/stats", getDashboardStats);

export default router;
