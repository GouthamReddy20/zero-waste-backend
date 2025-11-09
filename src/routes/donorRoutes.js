import express from 'express';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware.js';
import * as donorController from '../controllers/donorController.js';
const router = express.Router();

// -------------------- Multer setup for file upload --------------------
// We import the `upload` instance from donorController.js
// It handles single file upload with field name "image"
import { upload } from '../controllers/donorController.js';

// -------------------- Protected routes --------------------

// Profile routes
router.get('/profile', authenticateToken, authorizeRole('donor'), donorController.getDonorProfile);
router.put('/profile', authenticateToken, authorizeRole('donor'), donorController.updateDonorProfile);

// Donations
router.post(
  '/donations/add',
  authenticateToken,
  authorizeRole('donor'),
  upload.single('image'),
  donorController.createDonation
);

router.get('/donations', authenticateToken, authorizeRole('donor'), donorController.getDonations);
router.put('/donations/:id/status', authenticateToken, authorizeRole('donor'), donorController.updateDonationStatus);
router.delete('/donations/:id', authenticateToken, authorizeRole('donor'), donorController.deleteDonation);

// Notifications (optional)
router.get('/notifications', authenticateToken, authorizeRole('donor'), donorController.getNotifications);
router.put('/notifications/:id/read', authenticateToken, authorizeRole('donor'), donorController.markNotificationRead);

export default router;
