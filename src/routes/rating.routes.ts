import { Router } from "express";

import {
  addRatingAndReview,
  getAllRatingByCourse,
  getAverageRating,
} from "../controllers/rating/rating.controller";

import { auth, student } from "../middlewares/auth";

const router = Router();

router.post("/add-rating/:courseId", auth, student, addRatingAndReview);
router.get("/average-rating/:courseId", getAverageRating);
router.get("/get-rating-by-course/:courseId", getAllRatingByCourse);

export default router;
