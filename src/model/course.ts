import { Schema, model } from "mongoose";
import { ICourses } from "../interfaces/interface";

const courseSchema = new Schema<ICourses>({
  courseName: {
    type: String,
    required: true,
  },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  description: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  whatYouWillLearn: {
    type: [String],
    required: true,
  },
  content: [
    {
      type: Schema.Types.ObjectId,
      ref: "Section",
    },
  ],
  category: {
    type: String,
    required: true,
  },
  studentEnrolled: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  ratingAndReview: [
    {
      type: Schema.Types.ObjectId,
      ref: "RatingAndReview",
    },
  ],
  status: {
    type: String,
    enum: ["Draft", "Published"],
    default: "Draft",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

const Course = model<ICourses>("Course", courseSchema);

export default Course;
