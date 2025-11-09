import express from "express";
import { authenticateToken, authorizeRole } from "../middlewares/authMiddleware.js";
import * as foodController from "../controllers/foodController.js";

const router = express.Router();

router.post("/", authenticateToken, authorizeRole('donor'), foodController.addFood);
router.get("/", foodController.getAllFood);  // now this works

export default router;
