import express from "express";

import {
  confirmEmail,
  loginUser,
  registerUser,
  resetPassword,
  sendPasswordResetEmail,
  toggleUserActiveStatus,
  updateUserPassword,
} from "../controllers/auth/auth.controller";

import { auth } from "../middlewares/auth";

const router = express.Router();

router.post("/register-user", registerUser);
router.post("/login-user", loginUser);
router.get("/verify-email", confirmEmail);
router.patch("/change-password", auth, updateUserPassword);
router.post("/forgot-password", sendPasswordResetEmail);
router.patch("/reset-password", resetPassword);
router.patch("/toggle-status", auth, toggleUserActiveStatus);

export default router;
