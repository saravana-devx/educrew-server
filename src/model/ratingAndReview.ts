import { Schema, model } from "mongoose";
import { IRatingAndReview } from "../interfaces/interface";

const ratingAndReviewSchema = new Schema<IRatingAndReview>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  review: {
    type: String,
    required: true,
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
    // why i have used index here ?
    index: true,
  },
});

const RatingAndReview = model("RatingAndReview", ratingAndReviewSchema);

export default RatingAndReview;
