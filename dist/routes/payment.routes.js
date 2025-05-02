"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const payment_controller_1 = require("../controllers/payment/payment.controller");
const router = (0, express_1.Router)();
router.post("/create-checkout-session/:courseId", auth_1.auth, auth_1.student, payment_controller_1.createCheckOutSession);
exports.default = router;
