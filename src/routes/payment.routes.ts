import { Router } from "express";

import { auth, student } from "../middlewares/auth";

import {
  createCheckOutSession,
} from "../controllers/payment/payment.controller";

const router = Router();

router.post(
  "/create-checkout-session/:courseId",
  auth,
  student,
  createCheckOutSession
);


export default router;
