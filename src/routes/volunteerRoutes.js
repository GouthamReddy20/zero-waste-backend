import express from "express";
import { authenticateToken, authorizeRole } from "../middlewares/authMiddleware.js";
import * as volunteerController from "../controllers/volunteerController.js";

const router = express.Router();

// 🔒 Protect all volunteer routes
router.use(authenticateToken, authorizeRole("volunteer"));

// -------------------- PROFILE -----------------
router.get("/profile", volunteerController.getProfile);
router.put("/profile", volunteerController.updateProfile);
router.get("/me", volunteerController.getProfile);

// -------------------- DONATIONS -----------------
router.get("/donations", volunteerController.getDonations);
router.put("/donations/:id/accept", volunteerController.acceptDonation);
router.put("/donations/:id/reject", volunteerController.rejectDonation);
router.put("/donations/:id/complete", volunteerController.markCompleted);

// -------------------- NOTIFICATIONS -----------------
router.get("/notifications", volunteerController.getNotifications);
router.put("/notifications/:id/read", volunteerController.markNotificationRead);

export default router;
