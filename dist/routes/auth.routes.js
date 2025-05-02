"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth/auth.controller");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.post("/register-user", auth_controller_1.registerUser);
router.post("/login-user", auth_controller_1.loginUser);
router.get("/verify-email", auth_controller_1.confirmEmail);
router.patch("/change-password", auth_1.auth, auth_controller_1.updateUserPassword);
router.post("/forgot-password", auth_controller_1.sendPasswordResetEmail);
router.patch("/reset-password", auth_controller_1.resetPassword);
router.patch("/toggle-status", auth_1.auth, auth_controller_1.toggleUserActiveStatus);
exports.default = router;
