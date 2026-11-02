import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getRegistrationRequests,
  approveRegistrationRequest,
  rejectRegistrationRequest,
} from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.patch("/profile", protect, updateProfile);
router.post("/change-password", protect, changePassword);
router.put("/change-password", protect, changePassword);

// Registration request approval workflow (Admin Only)
router.get("/registration-requests", protect, adminOnly, getRegistrationRequests);
router.patch("/registration-requests/:id/approve", protect, adminOnly, approveRegistrationRequest);
router.patch("/registration-requests/:id/reject", protect, adminOnly, rejectRegistrationRequest);

export default router;
